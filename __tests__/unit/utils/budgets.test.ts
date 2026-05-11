/**
 * Tests de presupuestos por categoría — Fase 3, Feature 2.
 *
 * Cobertura de:
 *   - Cálculo de porcentaje consumido
 *   - Niveles de alerta (safe, warning, exceeded)
 *   - Resumen mensual: presupuesto vs real por categoría
 *   - Validación de datos de presupuesto
 *
 * Requisito: 100% de cobertura en /utils/budgets
 */

import {
  calculateBudgetUsage,
  getBudgetAlertLevel,
  generateMonthlySummary,
  validateBudget,
  type CategoryBudget,
  type CategoryExpense,
} from '../../../src/utils/budgets/categoryBudgets.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULO DE USO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Cálculo de uso de presupuesto (calculateBudgetUsage)', () => {
  test('0% cuando no se ha gastado nada', () => {
    const result = calculateBudgetUsage(0, 10000)
    expect(result.percentage).toBe(0)
    expect(result.remaining).toBe(10000)
  })

  test('50% cuando se ha gastado la mitad', () => {
    const result = calculateBudgetUsage(5000, 10000)
    expect(result.percentage).toBe(50)
    expect(result.remaining).toBe(5000)
  })

  test('100% cuando se ha gastado todo', () => {
    const result = calculateBudgetUsage(10000, 10000)
    expect(result.percentage).toBe(100)
    expect(result.remaining).toBe(0)
  })

  test('más del 100% cuando se excede el presupuesto', () => {
    const result = calculateBudgetUsage(15000, 10000)
    expect(result.percentage).toBe(150)
    expect(result.remaining).toBe(-5000)
  })

  test('presupuesto 0: porcentaje 0 si no se gastó, 100 si se gastó', () => {
    expect(calculateBudgetUsage(0, 0).percentage).toBe(0)
    expect(calculateBudgetUsage(500, 0).percentage).toBe(100)
  })

  test('retorna los montos originales en la respuesta', () => {
    const result = calculateBudgetUsage(3000, 8000)
    expect(result.spent).toBe(3000)
    expect(result.budgeted).toBe(8000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// NIVELES DE ALERTA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Niveles de alerta (getBudgetAlertLevel)', () => {
  test('safe cuando el porcentaje es menor al 80%', () => {
    expect(getBudgetAlertLevel(0)).toBe('safe')
    expect(getBudgetAlertLevel(50)).toBe('safe')
    expect(getBudgetAlertLevel(79)).toBe('safe')
  })

  test('warning cuando el porcentaje está entre 80% y 99%', () => {
    expect(getBudgetAlertLevel(80)).toBe('warning')
    expect(getBudgetAlertLevel(90)).toBe('warning')
    expect(getBudgetAlertLevel(99)).toBe('warning')
  })

  test('exceeded cuando el porcentaje es 100% o más', () => {
    expect(getBudgetAlertLevel(100)).toBe('exceeded')
    expect(getBudgetAlertLevel(150)).toBe('exceeded')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RESUMEN MENSUAL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Resumen mensual (generateMonthlySummary)', () => {
  const budgets: CategoryBudget[] = [
    { categoryId: 1, categoryName: 'Alimentación', budgetedAmount: 8000 },
    { categoryId: 2, categoryName: 'Transporte', budgetedAmount: 3000 },
    { categoryId: 3, categoryName: 'Entretenimiento', budgetedAmount: 2000 },
  ]

  test('genera resumen con todas las categorías presupuestadas', () => {
    const expenses: CategoryExpense[] = [
      { categoryId: 1, totalSpent: 6000 },
      { categoryId: 2, totalSpent: 2500 },
    ]

    const summary = generateMonthlySummary(budgets, expenses)
    expect(summary).toHaveLength(3)
  })

  test('calcula porcentaje correcto por categoría', () => {
    const expenses: CategoryExpense[] = [
      { categoryId: 1, totalSpent: 6000 }, // 75%
      { categoryId: 2, totalSpent: 2500 }, // 83.3%
    ]

    const summary = generateMonthlySummary(budgets, expenses)
    expect(summary[0].percentage).toBe(75)
    expect(summary[1].percentage).toBeCloseTo(83.3, 1)
  })

  test('categoría sin gastos: 0% consumido', () => {
    const expenses: CategoryExpense[] = [] // Sin gastos en ninguna

    const summary = generateMonthlySummary(budgets, expenses)
    expect(summary[0].percentage).toBe(0)
    expect(summary[0].alertLevel).toBe('safe')
  })

  test('incluye el alertLevel correcto en cada categoría', () => {
    const expenses: CategoryExpense[] = [
      { categoryId: 1, totalSpent: 5000 }, // 62.5% → safe
      { categoryId: 2, totalSpent: 2700 }, // 90% → warning
      { categoryId: 3, totalSpent: 2500 }, // 125% → exceeded
    ]

    const summary = generateMonthlySummary(budgets, expenses)
    expect(summary[0].alertLevel).toBe('safe')
    expect(summary[1].alertLevel).toBe('warning')
    expect(summary[2].alertLevel).toBe('exceeded')
  })

  test('sin presupuestos: retorna array vacío', () => {
    const summary = generateMonthlySummary([], [])
    expect(summary).toHaveLength(0)
  })

  test('calcula totales agregados del resumen', () => {
    const expenses: CategoryExpense[] = [
      { categoryId: 1, totalSpent: 6000 },
      { categoryId: 2, totalSpent: 2500 },
      { categoryId: 3, totalSpent: 1000 },
    ]

    const summary = generateMonthlySummary(budgets, expenses)
    const totalBudgeted = summary.reduce((sum, s) => sum + s.budgeted, 0)
    const totalSpent = summary.reduce((sum, s) => sum + s.spent, 0)
    expect(totalBudgeted).toBe(13000)
    expect(totalSpent).toBe(9500)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Validación de presupuesto (validateBudget)', () => {
  test('presupuesto válido retorna sin errores', () => {
    const result = validateBudget({ categoryId: 1, categoryName: 'Renta', budgetedAmount: 15000 })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('monto 0 es inválido', () => {
    const result = validateBudget({ categoryId: 1, categoryName: 'Renta', budgetedAmount: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('El monto del presupuesto debe ser mayor a 0')
  })

  test('monto negativo es inválido', () => {
    const result = validateBudget({ categoryId: 1, categoryName: 'Renta', budgetedAmount: -500 })
    expect(result.valid).toBe(false)
  })

  test('nombre vacío es inválido', () => {
    const result = validateBudget({ categoryId: 1, categoryName: '', budgetedAmount: 5000 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('El nombre de la categoría es obligatorio')
  })

  test('múltiples errores se acumulan', () => {
    const result = validateBudget({ categoryId: 1, categoryName: '', budgetedAmount: -100 })
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})
