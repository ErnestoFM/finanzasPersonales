/**
 * Tests de exportación de reportes — Fase 3, Feature 3.
 *
 * Cobertura de:
 *   - Generación de datos para Excel (SheetJS)
 *   - Generación de datos para CSV
 *   - Generación de datos para PDF
 *   - Integración con featureGuard (bloqueo en plan Free)
 *   - Respuesta de upgrade cuando está bloqueado
 *
 * Requisito: 100% de cobertura en /utils/exports
 */

import {
  formatMovementsForExport,
  formatCategorySummaryForExport,
  formatFiscalSummaryForExport,
  generateCSV,
  generateExportData,
  canExport,
  type ExportableMovement,
  type ExportableCategorySummary,
} from '../../../src/utils/exports/reportExporter.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATO DE MOVIMIENTOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Formato de movimientos para exportación', () => {
  const movements: ExportableMovement[] = [
    { date: '2025-01-15', type: 'income', category: 'Sueldo', description: 'Pago quincenal', amount: 15000 },
    { date: '2025-01-16', type: 'expense', category: 'Alimentación', description: 'Súper', amount: 2500 },
    { date: '2025-01-20', type: 'expense', category: 'Transporte', description: 'Uber', amount: 350 },
  ]

  test('formatMovementsForExport retorna array de filas con encabezados', () => {
    const rows = formatMovementsForExport(movements)
    expect(rows[0]).toEqual(['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto'])
    expect(rows).toHaveLength(4) // 1 header + 3 datos
  })

  test('tipo se traduce a Ingreso/Egreso en español', () => {
    const rows = formatMovementsForExport(movements)
    expect(rows[1][1]).toBe('Ingreso')
    expect(rows[2][1]).toBe('Egreso')
  })

  test('monto se mantiene como número', () => {
    const rows = formatMovementsForExport(movements)
    expect(typeof rows[1][4]).toBe('number')
  })

  test('array vacío retorna solo encabezados', () => {
    const rows = formatMovementsForExport([])
    expect(rows).toHaveLength(1) // Solo header
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN POR CATEGORÍA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Resumen por categoría para exportación', () => {
  const categories: ExportableCategorySummary[] = [
    { category: 'Alimentación', budgeted: 8000, spent: 6500, remaining: 1500 },
    { category: 'Transporte', budgeted: 3000, spent: 3200, remaining: -200 },
  ]

  test('formatCategorySummaryForExport incluye encabezados y datos', () => {
    const rows = formatCategorySummaryForExport(categories)
    expect(rows[0]).toEqual(['Categoría', 'Presupuesto', 'Gastado', 'Restante'])
    expect(rows).toHaveLength(3) // 1 header + 2 datos
  })

  test('remaining negativo se refleja correctamente', () => {
    const rows = formatCategorySummaryForExport(categories)
    expect(rows[2][3]).toBe(-200) // Transporte excedido
  })

  test('array vacío retorna solo encabezados', () => {
    const rows = formatCategorySummaryForExport([])
    expect(rows).toHaveLength(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN FISCAL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Resumen fiscal para exportación', () => {
  test('formatFiscalSummaryForExport genera filas key-value', () => {
    const fiscal = {
      totalIncome: 180000,
      totalExpenses: 95000,
      isrRetenido: 25000,
      isrAnualEstimado: 28000,
      saldoFavor: -3000,
      regime: 'Asalariado',
    }

    const rows = formatFiscalSummaryForExport(fiscal)
    expect(rows[0]).toEqual(['Concepto', 'Monto'])
    expect(rows.length).toBeGreaterThan(1)
    // Verificar que incluye los campos clave
    const concepts = rows.map((r) => r[0])
    expect(concepts).toContain('Ingreso total')
    expect(concepts).toContain('Gastos totales')
    expect(concepts).toContain('Régimen fiscal')
  })

  test('valores numéricos se mantienen como números', () => {
    const fiscal = {
      totalIncome: 100000,
      totalExpenses: 50000,
      isrRetenido: 15000,
      isrAnualEstimado: 18000,
      saldoFavor: -3000,
      regime: 'RESICO',
    }

    const rows = formatFiscalSummaryForExport(fiscal)
    const incomeRow = rows.find((r) => r[0] === 'Ingreso total')
    expect(typeof incomeRow![1]).toBe('number')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GENERACIÓN CSV
// ═══════════════════════════════════════════════════════════════════════════════

describe('Generación de CSV (generateCSV)', () => {
  test('genera string CSV válido con separador de coma', () => {
    const rows = [
      ['Fecha', 'Monto'],
      ['2025-01-15', 15000],
    ]

    const csv = generateCSV(rows)
    expect(csv).toContain('Fecha,Monto')
    expect(csv).toContain('2025-01-15,15000')
  })

  test('escapa valores con coma entre comillas', () => {
    const rows = [
      ['Descripción', 'Monto'],
      ['Pago, empresa X', 5000],
    ]

    const csv = generateCSV(rows)
    expect(csv).toContain('"Pago, empresa X"')
  })

  test('escapa comillas dobles duplicándolas', () => {
    const rows = [
      ['Nota'],
      ['Dijo "hola"'],
    ]

    const csv = generateCSV(rows)
    expect(csv).toContain('"Dijo ""hola"""')
  })

  test('retorna string vacío con array vacío', () => {
    const csv = generateCSV([])
    expect(csv).toBe('')
  })

  test('cada fila termina con newline', () => {
    const rows = [['A', 'B'], ['1', '2']]
    const csv = generateCSV(rows)
    const lines = csv.split('\n').filter((l) => l.length > 0)
    expect(lines).toHaveLength(2)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GENERACIÓN COMPLETA DE DATOS DE EXPORTACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Datos completos de exportación (generateExportData)', () => {
  test('genera objeto con las 3 hojas de datos', () => {
    const result = generateExportData(
      [{ date: '2025-01-15', type: 'income', category: 'Sueldo', description: 'Pago', amount: 30000 }],
      [{ category: 'Alimentación', budgeted: 8000, spent: 6000, remaining: 2000 }],
      { totalIncome: 30000, totalExpenses: 6000, isrRetenido: 5000, isrAnualEstimado: 6000, saldoFavor: -1000, regime: 'Asalariado' },
    )

    expect(result.movements).toBeDefined()
    expect(result.categorySummary).toBeDefined()
    expect(result.fiscalSummary).toBeDefined()
    expect(result.movements.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRACIÓN CON FEATUREGUARD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integración con featureGuard (canExport)', () => {
  test('plan Pro: canExport retorna allowed=true', () => {
    const result = canExport('pro')
    expect(result.allowed).toBe(true)
    expect(result.reason).toBeNull()
  })

  test('plan Free: canExport retorna allowed=false con razón', () => {
    const result = canExport('free')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBeTruthy()
    expect(result.reason).toContain('Pro')
  })

  test('plan Cancelled: canExport retorna allowed=false', () => {
    const result = canExport('cancelled')
    expect(result.allowed).toBe(false)
  })

  test('respuesta de upgrade incluye mensaje amigable (no error brusco)', () => {
    const result = canExport('free')
    expect(result.upgradeMessage).toBeTruthy()
    expect(result.upgradeMessage).toContain('exportar')
  })
})
