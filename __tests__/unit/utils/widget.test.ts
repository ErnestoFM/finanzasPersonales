/**
 * Tests de widget de resumen rápido — Fase 3, Feature 7.
 *
 * Cobertura de:
 *   - Cálculo de balance mensual para el widget
 *   - Indicador de tendencia (mejora/empeora)
 *   - Formateo compacto para pantalla pequeña
 *   - Generación de datos de shortcut PWA
 *
 * Requisito: 100% de cobertura en /utils/widget
 */

import {
  calculateWidgetSummary,
  getTrend,
  formatCompactAmount,
  generateWidgetData,
  type WidgetInput,
} from '../../../src/utils/widget/quickSummary.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULO DE BALANCE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Cálculo de balance para widget (calculateWidgetSummary)', () => {
  test('calcula balance = ingresos - egresos', () => {
    const result = calculateWidgetSummary(30000, 18000)
    expect(result.balance).toBe(12000)
  })

  test('balance negativo cuando egresos superan ingresos', () => {
    const result = calculateWidgetSummary(10000, 25000)
    expect(result.balance).toBe(-15000)
  })

  test('incluye porcentaje de gasto sobre ingreso', () => {
    const result = calculateWidgetSummary(30000, 18000)
    expect(result.spendingPercentage).toBe(60)
  })

  test('porcentaje 0% cuando no hay ingresos ni egresos', () => {
    const result = calculateWidgetSummary(0, 0)
    expect(result.spendingPercentage).toBe(0)
  })

  test('porcentaje puede superar 100% (déficit)', () => {
    const result = calculateWidgetSummary(10000, 15000)
    expect(result.spendingPercentage).toBe(150)
  })

  test('incluye los montos originales', () => {
    const result = calculateWidgetSummary(30000, 18000)
    expect(result.totalIncome).toBe(30000)
    expect(result.totalExpenses).toBe(18000)
  })

  test('determina estado de salud financiera', () => {
    expect(calculateWidgetSummary(30000, 18000).healthStatus).toBe('good')     // <70%
    expect(calculateWidgetSummary(30000, 24000).healthStatus).toBe('warning')  // 80%
    expect(calculateWidgetSummary(30000, 30000).healthStatus).toBe('critical') // 100%
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// TENDENCIA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Indicador de tendencia (getTrend)', () => {
  test('mejora cuando balance actual > anterior', () => {
    expect(getTrend(12000, 8000)).toBe('improving')
  })

  test('empeora cuando balance actual < anterior', () => {
    expect(getTrend(5000, 10000)).toBe('worsening')
  })

  test('estable cuando son iguales', () => {
    expect(getTrend(10000, 10000)).toBe('stable')
  })

  test('mejora desde balance negativo a positivo', () => {
    expect(getTrend(5000, -2000)).toBe('improving')
  })

  test('empeora desde positivo a negativo', () => {
    expect(getTrend(-1000, 5000)).toBe('worsening')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATO COMPACTO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Formato compacto (formatCompactAmount)', () => {
  test('miles se abrevian con K', () => {
    expect(formatCompactAmount(15000)).toBe('$15K')
  })

  test('millones se abrevian con M', () => {
    expect(formatCompactAmount(2500000)).toBe('$2.5M')
  })

  test('millones exactos sin decimal', () => {
    expect(formatCompactAmount(3000000)).toBe('$3M')
  })

  test('montos menores a 1000 se muestran completos', () => {
    expect(formatCompactAmount(850)).toBe('$850')
  })

  test('negativos incluyen signo', () => {
    expect(formatCompactAmount(-5000)).toBe('-$5K')
  })

  test('cero se muestra como $0', () => {
    expect(formatCompactAmount(0)).toBe('$0')
  })

  test('redondea K a 1 decimal cuando es necesario', () => {
    expect(formatCompactAmount(15500)).toBe('$15.5K')
  })

  test('elimina .0 innecesario', () => {
    expect(formatCompactAmount(20000)).toBe('$20K')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// DATOS COMPLETOS DEL WIDGET
// ═══════════════════════════════════════════════════════════════════════════════

describe('Datos completos del widget (generateWidgetData)', () => {
  test('genera objeto con todos los campos necesarios', () => {
    const input: WidgetInput = {
      totalIncome: 30000,
      totalExpenses: 18000,
      previousBalance: 10000,
      monthLabel: 'Enero 2025',
    }

    const widget = generateWidgetData(input)
    expect(widget.balance).toBe(12000)
    expect(widget.balanceFormatted).toBe('$12K')
    expect(widget.trend).toBe('improving')
    expect(widget.healthStatus).toBe('good')
    expect(widget.monthLabel).toBe('Enero 2025')
    expect(widget.incomeFormatted).toBe('$30K')
    expect(widget.expensesFormatted).toBe('$18K')
  })

  test('widget con déficit muestra valores negativos correctos', () => {
    const input: WidgetInput = {
      totalIncome: 10000,
      totalExpenses: 25000,
      previousBalance: 5000,
      monthLabel: 'Febrero 2025',
    }

    const widget = generateWidgetData(input)
    expect(widget.balance).toBe(-15000)
    expect(widget.balanceFormatted).toBe('-$15K')
    expect(widget.trend).toBe('worsening')
    expect(widget.healthStatus).toBe('critical')
  })

  test('widget sin movimientos muestra todo en cero', () => {
    const input: WidgetInput = {
      totalIncome: 0,
      totalExpenses: 0,
      previousBalance: 0,
      monthLabel: 'Marzo 2025',
    }

    const widget = generateWidgetData(input)
    expect(widget.balance).toBe(0)
    expect(widget.spendingPercentage).toBe(0)
    expect(widget.trend).toBe('stable')
  })
})
