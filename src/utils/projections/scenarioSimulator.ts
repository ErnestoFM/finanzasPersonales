/**
 * Simulador de decisiones financieras y comparador de escenarios.
 *
 * Permite al usuario:
 *  1. Agregar un ingreso o gasto futuro (único o recurrente)
 *  2. Ver el impacto en el balance mensual y la carga fiscal
 *  3. Comparar dos decisiones lado a lado
 *
 * Esta es la feature más importante de la Fase 2.
 */

import { calculateSalariedTax, calculateResicoTax } from '../fiscal/taxCalculator.js'
import { projectMonthly, type ProjectionInput, type MonthSnapshot, type IncomeRegime } from './monthlyProjection.ts'
import { detectDeficit, type DeficitResult } from './deficitDetector.ts'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Decision {
  /** Tipo de movimiento: ingreso o gasto */
  type: 'income' | 'expense'
  /** Monto mensual (o monto único si recurring=false) */
  amount: number
  /** Mes en el que inicia el movimiento (1-indexed) */
  startMonth: number
  /** ¿Se repite cada mes a partir de startMonth? */
  recurring: boolean
  /** Régimen fiscal del ingreso (solo aplica si type==='income') */
  regime?: IncomeRegime
}

export interface SimulationResult {
  /** Proyección base sin la decisión */
  baseline: MonthSnapshot[]
  /** Proyección con la decisión aplicada */
  withDecision: MonthSnapshot[]
  /** Impacto mensual en balance (positivo = mejora, negativo = empeora) */
  monthlyImpact: number
  /** Impacto fiscal mensual adicional ($) */
  fiscalImpact: number
  /** Información de déficit con la decisión */
  deficitInfo: DeficitResult
}

export interface ScenarioComparison {
  /** Resultado de la decisión A */
  scenarioA: SimulationResult
  /** Resultado de la decisión B */
  scenarioB: SimulationResult
  /** 'A' si escenario A tiene mejor balance final, 'B' si escenario B, 'tie' si empatan */
  winner: 'A' | 'B' | 'tie'
}

// ── Simulador ────────────────────────────────────────────────────────────────

/**
 * Simula el impacto de una decisión financiera comparándola contra la proyección base.
 *
 * @param baseParams  - Parámetros base (balance, ingresos, gastos recurrentes, meses)
 * @param decision    - La decisión a simular
 * @returns Proyección base vs con decisión + métricas de impacto
 */
export function simulateDecision(
  baseParams: ProjectionInput,
  decision: Decision,
): SimulationResult {
  // 1. Proyección base (sin la decisión)
  const baseline = projectMonthly(baseParams)

  // 2. Proyección con la decisión
  const withDecision = buildDecisionProjection(baseParams, decision)

  // 3. Calcular impacto fiscal adicional por la decisión
  const fiscalImpact = calculateFiscalImpact(baseParams, decision)

  // 4. Impacto mensual en balance (primer mes donde aplica la decisión)
  const impactMonth = decision.startMonth - 1 // 0-indexed
  const monthlyImpact = impactMonth < withDecision.length
    ? withDecision[impactMonth].endBalance - baseline[impactMonth].endBalance
    : 0

  // 5. Detectar si la decisión causa o resuelve un déficit
  const deficitInfo = detectDeficit(withDecision)

  return { baseline, withDecision, monthlyImpact, fiscalImpact, deficitInfo }
}

// ── Comparador ───────────────────────────────────────────────────────────────

/**
 * Compara dos decisiones lado a lado contra la misma base.
 *
 * @param baseParams - Parámetros de proyección base
 * @param decisionA  - Primera decisión
 * @param decisionB  - Segunda decisión
 * @returns Ambas simulaciones + quién gana por balance final
 */
export function compareScenarios(
  baseParams: ProjectionInput,
  decisionA: Decision,
  decisionB: Decision,
): ScenarioComparison {
  const scenarioA = simulateDecision(baseParams, decisionA)
  const scenarioB = simulateDecision(baseParams, decisionB)

  const lastA = scenarioA.withDecision[scenarioA.withDecision.length - 1]
  const lastB = scenarioB.withDecision[scenarioB.withDecision.length - 1]

  let winner: 'A' | 'B' | 'tie'
  if (lastA.endBalance > lastB.endBalance) {
    winner = 'A'
  } else if (lastB.endBalance > lastA.endBalance) {
    winner = 'B'
  } else {
    winner = 'tie'
  }

  return { scenarioA, scenarioB, winner }
}

// ── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Genera la proyección mes a mes con la decisión aplicada.
 * Maneja decisiones únicas (solo impactan un mes) y recurrentes (impactan desde startMonth en adelante).
 */
function buildDecisionProjection(
  baseParams: ProjectionInput,
  decision: Decision,
): MonthSnapshot[] {
  const { currentBalance, recurringIncomes, recurringExpenses, months } = baseParams
  const snapshots: MonthSnapshot[] = []
  let balance = currentBalance

  for (let m = 1; m <= months; m++) {
    // ¿Aplica la decisión en este mes?
    const decisionActive = decision.recurring
      ? m >= decision.startMonth
      : m === decision.startMonth

    // Ingresos del mes: recurrentes + decisión si aplica
    let monthIncomes = [...recurringIncomes]
    let monthExpenses = [...recurringExpenses]

    if (decisionActive) {
      if (decision.type === 'income') {
        monthIncomes = [...monthIncomes, { amount: decision.amount, regime: decision.regime ?? 'salaried' }]
      } else {
        monthExpenses = [...monthExpenses, { amount: decision.amount, category: 'simulado' }]
      }
    }

    const totalIncome = monthIncomes.reduce((sum, inc) => sum + inc.amount, 0)
    const totalExpenses = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0)

    // Calcular ISR por régimen
    const salariedTotal = monthIncomes
      .filter((inc) => inc.regime === 'salaried')
      .reduce((sum, inc) => sum + inc.amount, 0)
    const resicoTotal = monthIncomes
      .filter((inc) => inc.regime === 'resico')
      .reduce((sum, inc) => sum + inc.amount, 0)

    const salariedTax = calculateSalariedTax(salariedTotal)
    const resicoTax = calculateResicoTax(resicoTotal)
    const totalTax = salariedTax + resicoTax

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

/**
 * Calcula el impacto fiscal mensual adicional de la decisión.
 * Solo los ingresos generan impacto fiscal; los gastos no.
 */
function calculateFiscalImpact(
  baseParams: ProjectionInput,
  decision: Decision,
): number {
  if (decision.type === 'expense') return 0

  // Calcular ISR del ingreso adicional en su régimen
  const regime = decision.regime ?? 'salaried'

  // ISR base (sin la decisión)
  const baseSalaried = baseParams.recurringIncomes
    .filter((inc) => inc.regime === 'salaried')
    .reduce((sum, inc) => sum + inc.amount, 0)
  const baseResico = baseParams.recurringIncomes
    .filter((inc) => inc.regime === 'resico')
    .reduce((sum, inc) => sum + inc.amount, 0)

  const baseTax = calculateSalariedTax(baseSalaried) + calculateResicoTax(baseResico)

  // ISR con la decisión
  const newSalaried = regime === 'salaried' ? baseSalaried + decision.amount : baseSalaried
  const newResico = regime === 'resico' ? baseResico + decision.amount : baseResico
  const newTax = calculateSalariedTax(newSalaried) + calculateResicoTax(newResico)

  return newTax - baseTax
}
