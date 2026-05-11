/**
 * Cálculo de deducciones personales para declaración anual.
 * Referencia legal: art. 151 LISR — Deducciones personales
 *
 * Cada tipo de deducción tiene su límite individual:
 *  - Médico / Seguro / Hipoteca: sin límite individual, sujetos al global
 *  - Colegiaturas: límite por nivel educativo (Decreto DOF)
 *  - Donativos: 7% del ingreso acumulable
 *  - AFORE: 10% del ingreso acumulable
 *
 * Límite global (art. 151 último párrafo):
 *  min(15% del ingreso total anual, 5 × UMA anual)
 *  UMA anual 2025 = $39,588.96 → 5 × UMA = $197,944.80
 */

import colegiaturas from '../taxTables/colegiaturas-2025.json'
import uma from '../taxTables/uma-2025.json'

// ── Tipos ────────────────────────────────────────────────────────────────────

/** Tipos de deducción personal reconocidos por el SAT */
export const DeductionType = {
  Medical:   'medical',    // Honorarios médicos, dentales y hospitalarios
  Insurance: 'insurance',  // Primas de seguros de gastos médicos
  Tuition:   'tuition',    // Colegiaturas (requiere nivel educativo)
  Mortgage:  'mortgage',   // Intereses reales de créditos hipotecarios
  Donation:  'donation',   // Donativos a donatarias autorizadas
  Afore:     'afore',      // Aportaciones voluntarias al AFORE
} as const

export type DeductionTypeValue = typeof DeductionType[keyof typeof DeductionType]

export interface DeductionItem {
  type: DeductionTypeValue
  amount: number
  /** Nivel educativo, requerido solo cuando type === 'tuition' */
  level?: string
}

export interface DeductionBreakdownItem {
  type: DeductionTypeValue
  requested: number
  applied: number
  capped: boolean
  capReason?: string
}

export interface DeductionResult {
  totalDeductible: number
  globalLimit: number
  limitApplied: boolean
  breakdown: DeductionBreakdownItem[]
}

// ── Constantes derivadas de las tablas SAT ───────────────────────────────────

/** 5 veces el valor anual de la UMA (INEGI 2025) */
const FIVE_UMA_ANNUAL = uma.valorAnual * 5

/** Porcentaje del ingreso anual para el límite global */
const INCOME_LIMIT_RATE = 0.15

/** Porcentaje del ingreso acumulable como límite para donativos */
const DONATION_LIMIT_RATE = 0.07

/** Porcentaje del ingreso acumulable como límite para AFORE */
const AFORE_LIMIT_RATE = 0.10

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Calcula las deducciones personales aplicables con todos los límites.
 *
 * @param deductions  - Lista de deducciones del contribuyente
 * @param annualIncome - Ingreso total anual (para calcular el límite global)
 * @returns Resultado con desglose y límite aplicado
 */
export function calculatePersonalDeductions(
  deductions: DeductionItem[],
  annualIncome: number,
): DeductionResult {
  // Límite global: el menor entre 15% del ingreso o 5 × UMA anual
  const globalLimit = Math.min(annualIncome * INCOME_LIMIT_RATE, FIVE_UMA_ANNUAL)

  const breakdown: DeductionBreakdownItem[] = []

  for (const item of deductions) {
    const result = applyIndividualLimit(item, annualIncome)
    breakdown.push(result)
  }

  // Sumar las deducciones individuales ya limitadas
  const totalBeforeGlobal = breakdown.reduce((sum, b) => sum + b.applied, 0)

  // Aplicar el límite global
  const limitApplied = totalBeforeGlobal > globalLimit
  const totalDeductible = Math.min(totalBeforeGlobal, globalLimit)

  return { totalDeductible, globalLimit, limitApplied, breakdown }
}

// ── Límites individuales por tipo ────────────────────────────────────────────

function applyIndividualLimit(item: DeductionItem, annualIncome: number): DeductionBreakdownItem {
  const { type, amount } = item

  switch (type) {
    case DeductionType.Tuition: {
      // Colegiaturas: límite por nivel educativo (Decreto DOF)
      if (!item.level) {
        return { type, requested: amount, applied: 0, capped: true, capReason: 'Nivel educativo no especificado' }
      }
      const limit = colegiaturas.limitesPorNivel[item.level as keyof typeof colegiaturas.limitesPorNivel]
      if (!limit) {
        return { type, requested: amount, applied: 0, capped: true, capReason: `Nivel educativo desconocido: ${item.level}` }
      }
      const applied = Math.min(amount, limit)
      return { type, requested: amount, applied, capped: amount > limit, capReason: amount > limit ? `Límite ${item.level}: $${limit}` : undefined }
    }

    case DeductionType.Donation: {
      // Donativos: máximo 7% del ingreso acumulable (art. 151 fracción III)
      const limit = annualIncome * DONATION_LIMIT_RATE
      const applied = Math.min(amount, limit)
      return { type, requested: amount, applied, capped: amount > limit, capReason: amount > limit ? `Límite 7% ingreso: $${limit.toFixed(2)}` : undefined }
    }

    case DeductionType.Afore: {
      // AFORE: máximo 10% del ingreso acumulable (art. 151 fracción V)
      const limit = annualIncome * AFORE_LIMIT_RATE
      const applied = Math.min(amount, limit)
      return { type, requested: amount, applied, capped: amount > limit, capReason: amount > limit ? `Límite 10% ingreso: $${limit.toFixed(2)}` : undefined }
    }

    case DeductionType.Medical:
    case DeductionType.Insurance:
    case DeductionType.Mortgage:
    default:
      // Sin límite individual — sujetos solo al límite global
      return { type, requested: amount, applied: amount, capped: false }
  }
}
