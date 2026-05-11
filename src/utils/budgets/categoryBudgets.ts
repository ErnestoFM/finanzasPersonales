/**
 * Lógica pura de presupuestos por categoría.
 *
 * Funciones:
 *  - calculateBudgetUsage:   % consumido y monto restante
 *  - getBudgetAlertLevel:    nivel de alerta (safe/warning/exceeded)
 *  - generateMonthlySummary: resumen presupuesto vs real por categoría
 *  - validateBudget:         validación de datos de presupuesto
 *
 * Umbrales de alerta:
 *  - < 80% → safe (verde)
 *  - 80%-99% → warning (amarillo)
 *  - ≥ 100% → exceeded (rojo)
 *
 * Todas las funciones son puras — sin side effects, sin dependencia de DB.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface CategoryBudget {
  categoryId: number
  categoryName: string
  budgetedAmount: number
}

export interface CategoryExpense {
  categoryId: number
  totalSpent: number
}

export interface BudgetUsage {
  spent: number
  budgeted: number
  percentage: number
  remaining: number
}

export type AlertLevel = 'safe' | 'warning' | 'exceeded'

export interface BudgetSummaryItem {
  categoryId: number
  categoryName: string
  spent: number
  budgeted: number
  percentage: number
  remaining: number
  alertLevel: AlertLevel
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ── Constantes ───────────────────────────────────────────────────────────────

/** Umbral de alerta amarilla: 80% del presupuesto */
const WARNING_THRESHOLD = 80

/** Umbral de alerta roja: 100% del presupuesto */
const EXCEEDED_THRESHOLD = 100

// ── Cálculo de uso ───────────────────────────────────────────────────────────

/**
 * Calcula el porcentaje consumido y el monto restante de un presupuesto.
 *
 * @param spent    - Monto gastado en la categoría
 * @param budgeted - Monto presupuestado para la categoría
 */
export function calculateBudgetUsage(spent: number, budgeted: number): BudgetUsage {
  let percentage: number

  if (budgeted <= 0) {
    // Sin presupuesto: si se gastó algo, considerar al 100%
    percentage = spent > 0 ? 100 : 0
  } else {
    percentage = (spent / budgeted) * 100
  }

  return {
    spent,
    budgeted,
    percentage,
    remaining: budgeted - spent,
  }
}

// ── Niveles de alerta ────────────────────────────────────────────────────────

/**
 * Determina el nivel de alerta basado en el porcentaje consumido.
 *
 * @param percentage - Porcentaje consumido del presupuesto
 * @returns 'safe' (<80%), 'warning' (80%-99%), 'exceeded' (≥100%)
 */
export function getBudgetAlertLevel(percentage: number): AlertLevel {
  if (percentage >= EXCEEDED_THRESHOLD) return 'exceeded'
  if (percentage >= WARNING_THRESHOLD) return 'warning'
  return 'safe'
}

// ── Resumen mensual ──────────────────────────────────────────────────────────

/**
 * Genera un resumen comparativo presupuesto vs real para cada categoría.
 * Las categorías sin gastos aparecen con 0% consumido.
 *
 * @param budgets  - Presupuestos definidos por categoría
 * @param expenses - Gastos reales agrupados por categoría
 */
export function generateMonthlySummary(
  budgets: CategoryBudget[],
  expenses: CategoryExpense[],
): BudgetSummaryItem[] {
  // Crear mapa de gastos por categoryId para O(1) lookup
  const expenseMap = new Map<number, number>()
  for (const exp of expenses) {
    expenseMap.set(exp.categoryId, exp.totalSpent)
  }

  return budgets.map((budget) => {
    const spent = expenseMap.get(budget.categoryId) || 0
    const usage = calculateBudgetUsage(spent, budget.budgetedAmount)
    const alertLevel = getBudgetAlertLevel(usage.percentage)

    return {
      categoryId: budget.categoryId,
      categoryName: budget.categoryName,
      spent: usage.spent,
      budgeted: usage.budgeted,
      percentage: usage.percentage,
      remaining: usage.remaining,
      alertLevel,
    }
  })
}

// ── Validación ───────────────────────────────────────────────────────────────

/**
 * Valida los datos de un presupuesto por categoría.
 * Retorna un objeto con valid (boolean) y un array de errores descriptivos.
 */
export function validateBudget(budget: CategoryBudget): ValidationResult {
  const errors: string[] = []

  if (!budget.categoryName || budget.categoryName.trim() === '') {
    errors.push('El nombre de la categoría es obligatorio')
  }

  if (budget.budgetedAmount <= 0) {
    errors.push('El monto del presupuesto debe ser mayor a 0')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
