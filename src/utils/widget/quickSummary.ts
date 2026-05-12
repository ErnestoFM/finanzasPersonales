/**
 * Lógica pura del widget de resumen rápido (mobile).
 *
 * El widget se muestra vía PWA shortcut desde la pantalla de inicio.
 * Muestra el balance del mes actual sin abrir la app completa.
 *
 * Funciones:
 *  - calculateWidgetSummary:  balance, % gasto, salud financiera
 *  - getTrend:                tendencia mes a mes
 *  - formatCompactAmount:     formato corto ($15K, $2.5M)
 *  - generateWidgetData:      datos completos para renderizar el widget
 *
 * Todas las funciones son puras — sin side effects, sin dependencia de DB.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type HealthStatus = 'good' | 'warning' | 'critical'
export type Trend = 'improving' | 'worsening' | 'stable'

export interface WidgetSummary {
  totalIncome: number
  totalExpenses: number
  balance: number
  spendingPercentage: number
  healthStatus: HealthStatus
}

export interface WidgetInput {
  totalIncome: number
  totalExpenses: number
  previousBalance: number
  monthLabel: string
}

export interface WidgetData {
  balance: number
  balanceFormatted: string
  incomeFormatted: string
  expensesFormatted: string
  spendingPercentage: number
  healthStatus: HealthStatus
  trend: Trend
  monthLabel: string
}

// ── Constantes ───────────────────────────────────────────────────────────────

/** Umbral de advertencia: 75% del ingreso gastado */
const WARNING_THRESHOLD = 75

/** Umbral crítico: 95% del ingreso gastado */
const CRITICAL_THRESHOLD = 95

// ── Balance y salud ──────────────────────────────────────────────────────────

/**
 * Calcula el resumen financiero del mes para el widget.
 *
 * Salud financiera:
 *  - good:     gasto < 75% del ingreso
 *  - warning:  gasto entre 75% y 94%
 *  - critical: gasto >= 95% del ingreso
 */
export function calculateWidgetSummary(
  totalIncome: number,
  totalExpenses: number,
): WidgetSummary {
  const balance = totalIncome - totalExpenses

  let spendingPercentage = 0
  if (totalIncome > 0) {
    spendingPercentage = Math.round((totalExpenses / totalIncome) * 100)
  }

  let healthStatus: HealthStatus = 'good'
  if (spendingPercentage >= CRITICAL_THRESHOLD) {
    healthStatus = 'critical'
  } else if (spendingPercentage >= WARNING_THRESHOLD) {
    healthStatus = 'warning'
  }

  return {
    totalIncome,
    totalExpenses,
    balance,
    spendingPercentage,
    healthStatus,
  }
}

// ── Tendencia ────────────────────────────────────────────────────────────────

/**
 * Determina la tendencia comparando el balance actual con el anterior.
 *
 * @param currentBalance  - Balance del mes actual
 * @param previousBalance - Balance del mes anterior
 */
export function getTrend(currentBalance: number, previousBalance: number): Trend {
  if (currentBalance > previousBalance) return 'improving'
  if (currentBalance < previousBalance) return 'worsening'
  return 'stable'
}

// ── Formato compacto ─────────────────────────────────────────────────────────

/**
 * Formatea un monto de forma compacta para pantallas pequeñas.
 * - < 1000: $850
 * - ≥ 1000: $15K, $15.5K
 * - ≥ 1,000,000: $2.5M
 *
 * Elimina .0 innecesario ($20K en lugar de $20.0K)
 */
export function formatCompactAmount(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs === 0) return '$0'

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
    return `${sign}$${formatted}M`
  }

  if (abs >= 1000) {
    const thousands = abs / 1000
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)
    return `${sign}$${formatted}K`
  }

  return `${sign}$${abs}`
}

// ── Datos completos del widget ───────────────────────────────────────────────

/**
 * Genera todos los datos necesarios para renderizar el widget.
 * Combina balance, tendencia y formato compacto en un solo objeto.
 */
export function generateWidgetData(input: WidgetInput): WidgetData {
  const summary = calculateWidgetSummary(input.totalIncome, input.totalExpenses)
  const trend = getTrend(summary.balance, input.previousBalance)

  return {
    balance: summary.balance,
    balanceFormatted: formatCompactAmount(summary.balance),
    incomeFormatted: formatCompactAmount(summary.totalIncome),
    expensesFormatted: formatCompactAmount(summary.totalExpenses),
    spendingPercentage: summary.spendingPercentage,
    healthStatus: summary.healthStatus,
    trend,
    monthLabel: input.monthLabel,
  }
}
