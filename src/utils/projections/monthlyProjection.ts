/**
 * Proyección mensual a N meses con carga fiscal.
 * Calcula el balance proyectado mes a mes basándose en ingresos y egresos recurrentes,
 * aplicando ISR según el régimen de cada ingreso.
 *
 * Referencia legal:
 *  - art. 96 LISR — ISR asalariados (vía calculateSalariedTax)
 *  - art. 113-E LISR — ISR RESICO (vía calculateResicoTax)
 */

import { calculateSalariedTax, calculateResicoTax } from '../fiscal/taxCalculator.js'

// ── Tipos ────────────────────────────────────────────────────────────────────

export type IncomeRegime = 'salaried' | 'resico'

export interface RecurringIncome {
  amount: number
  regime: IncomeRegime
}

export interface RecurringExpense {
  amount: number
  category: string
}

export interface ProjectionInput {
  /** Balance actual en cuenta */
  currentBalance: number
  /** Ingresos recurrentes mensuales con su régimen fiscal */
  recurringIncomes: RecurringIncome[]
  /** Egresos recurrentes mensuales */
  recurringExpenses: RecurringExpense[]
  /** Número de meses a proyectar */
  months: number
}

export interface TaxBreakdown {
  salariedTax: number
  resicoTax: number
}

export interface MonthSnapshot {
  /** Número de mes (1-indexed) */
  month: number
  /** Balance al inicio del mes */
  startBalance: number
  /** Total de ingresos brutos del mes */
  totalIncome: number
  /** Total de egresos del mes */
  totalExpenses: number
  /** Carga fiscal total del mes */
  totalTax: number
  /** Desglose fiscal por régimen */
  taxBreakdown: TaxBreakdown
  /** Balance al cierre del mes (start + income - expenses - tax) */
  endBalance: number
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Genera una proyección mes a mes del balance financiero.
 * Cada mes aplica la carga fiscal correspondiente a cada régimen de ingreso.
 *
 * @param input - Parámetros de proyección
 * @returns Array de snapshots mensuales
 */
export function projectMonthly(input: ProjectionInput): MonthSnapshot[] {
  const { currentBalance, recurringIncomes, recurringExpenses, months } = input

  const totalIncome = recurringIncomes.reduce((sum, inc) => sum + inc.amount, 0)
  const totalExpenses = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0)

  // Calcular ISR por régimen — cada régimen es independiente (criterio de independencia)
  const salariedIncomeTotal = recurringIncomes
    .filter((inc) => inc.regime === 'salaried')
    .reduce((sum, inc) => sum + inc.amount, 0)

  const resicoIncomeTotal = recurringIncomes
    .filter((inc) => inc.regime === 'resico')
    .reduce((sum, inc) => sum + inc.amount, 0)

  const salariedTax = calculateSalariedTax(salariedIncomeTotal)
  const resicoTax = calculateResicoTax(resicoIncomeTotal)
  const totalTax = salariedTax + resicoTax

  const snapshots: MonthSnapshot[] = []
  let balance = currentBalance

  for (let m = 1; m <= months; m++) {
    const startBalance = balance
    const endBalance = startBalance + totalIncome - totalExpenses - totalTax

    snapshots.push({
      month: m,
      startBalance,
      totalIncome,
      totalExpenses,
      totalTax,
      taxBreakdown: { salariedTax, resicoTax },
      endBalance,
    })

    balance = endBalance
  }

  return snapshots
}
