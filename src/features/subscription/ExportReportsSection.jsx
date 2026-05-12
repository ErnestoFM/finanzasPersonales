import React, { useState } from 'react'
import * as XLSX from 'xlsx'
import Card from '../../components/Card.jsx'
import { isSubscriptionActive } from '../../utils/payment/stripeManager.ts'
import { generateExportData, generateCSV } from '../../utils/exports/reportExporter.ts'
import UpgradeGate from './UpgradeGate.jsx'

export default function ExportReportsSection({ incomes, expenses, categories }) {
  const [showUpgradeGate, setShowUpgradeGate] = useState(false)
  const [exportType, setExportType] = useState('')

  // Prepara los datos del reporte para exportar
  const getPreparedData = () => {
    const movements = [
      ...incomes.map(i => ({ date: i.date, type: 'income', category: i.category, description: i.description, amount: i.amount })),
      ...expenses.map(e => ({ date: e.date, type: 'expense', category: e.category, description: e.description, amount: e.amount }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const categorySummary = categories.map(cat => {
      const spent = expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0)
      const budgeted = cat.budget || 0
      return {
        category: cat.name,
        budgeted,
        spent,
        remaining: Math.max(0, budgeted - spent)
      }
    })

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    const fiscalSummary = {
      totalIncome,
      totalExpenses,
      isrRetenido: totalIncome * 0.015, // Estimado simple
      isrAnualEstimado: Math.max(0, (totalIncome - totalExpenses) * 0.10), // Estimado simple
      saldoFavor: Math.max(0, (totalIncome * 0.015) - ((totalIncome - totalExpenses) * 0.05)),
      regime: 'Régimen Simplificado de Confianza (RESICO)'
    }

    return generateExportData(movements, categorySummary, fiscalSummary)
  }

  const handleExportClick = async (type) => {
    const active = await isSubscriptionActive()
    if (!active) {
      setExportType(type)
      setShowUpgradeGate(true)
      return
    }

    const data = getPreparedData()

    if (type === 'excel') {
      const wb = XLSX.utils.book_new()
      const ws_movs = XLSX.utils.aoa_to_sheet(data.movements)
      const ws_cats = XLSX.utils.aoa_to_sheet(data.categorySummary)
      const ws_fiscal = XLSX.utils.aoa_to_sheet(data.fiscalSummary)

      XLSX.utils.book_append_sheet(wb, ws_movs, 'Movimientos')
      XLSX.utils.book_append_sheet(wb, ws_cats, 'Categorías')
      XLSX.utils.book_append_sheet(wb, ws_fiscal, 'Cálculo Fiscal')

      XLSX.writeFile(wb, 'Caudal_Reporte_Financiero.xlsx')
    } else if (type === 'csv') {
      const csvContent = generateCSV(data.movements)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', 'Caudal_Movimientos.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (type === 'pdf') {
      // Generar una ventana de impresión limpia y profesional para Guardar como PDF
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Caudal — Reporte Mensual</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; padding: 40px; }
                h1 { font-size: 24px; color: #4f46e5; margin-bottom: 5px; }
                p { font-size: 14px; color: #64748b; margin-top: 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
                th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px; text-align: left; font-weight: 600; }
                td { border-bottom: 1px solid #f1f5f9; padding: 10px; }
                .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 30px; }
                .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background-color: #f8fafc; }
                .card h3 { margin-top: 0; font-size: 14px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                .text-right { text-align: right; }
              </style>
            </head>
            <body>
              <h1>Caudal — Reporte de Decisiones Financieras</h1>
              <p>Generado de forma segura en tu dispositivo el ${new Date().toLocaleDateString('es-MX')}</p>
              
              <div class="grid">
                <div class="card">
                  <h3>Resumen Financiero</h3>
                  <table>
                    ${data.fiscalSummary.slice(1, 4).map(row => `
                      <tr>
                        <td><strong>${row[0]}</strong></td>
                        <td class="text-right">$${Number(row[1]).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
                <div class="card">
                  <h3>Resumen de Impuestos SAT</h3>
                  <table>
                    ${data.fiscalSummary.slice(4).map(row => `
                      <tr>
                        <td><strong>${row[0]}</strong></td>
                        <td class="text-right">${typeof row[1] === 'number' ? '$' + Number(row[1]).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + ' MXN' : row[1]}</td>
                      </tr>
                    `).join('')}
                  </table>
                </div>
              </div>

              <h3>Presupuesto vs Real por Categoría</h3>
              <table>
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th class="text-right">Presupuesto</th>
                    <th class="text-right">Gastado</th>
                    <th class="text-right">Restante</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.categorySummary.slice(1).map(row => `
                    <tr>
                      <td>${row[0]}</td>
                      <td class="text-right">$${Number(row[1]).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td class="text-right">$${Number(row[2]).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td class="text-right">$${Number(row[3]).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <p style="margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8;">
                Caudal — Finanzas Personales para México. Todos los cálculos son estimaciones locales seguras.
              </p>
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  return (
    <Card title="Exportación de Reportes Financieros" id="export-reports-section">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Descarga un respaldo completo en formatos estándar o genera un estado de cuenta fiscal listo para imprimir en PDF.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => handleExportClick('excel')}
            id="export-excel-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Excel (.xlsx)
          </button>
          <button
            onClick={() => handleExportClick('csv')}
            id="export-csv-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            CSV Plano
          </button>
          <button
            onClick={() => handleExportClick('pdf')}
            id="export-pdf-btn"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Reporte PDF
          </button>
        </div>
      </div>

      {showUpgradeGate && (
        <UpgradeGate
          featureName={exportType === 'excel' ? 'La exportación a Excel' : exportType === 'csv' ? 'La exportación a CSV' : 'La generación de reportes PDF'}
          onClose={() => setShowUpgradeGate(false)}
        />
      )}
    </Card>
  )
}
