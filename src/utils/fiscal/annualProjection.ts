/**
 * Proyección de ISR anual y cálculo de saldo a favor/cargo.
 * Referencia legal: art. 152 LISR — Tarifa anual del ISR para personas físicas
 *
 * Flujo de cálculo:
 *  1. Extrapolar ingreso mensual a ingreso anual
 *  2. Restar deducciones personales → base gravable anual
 *  3. Aplicar tarifa anual (art. 152) → ISR anual causado
 *  4. Comparar contra retenciones acumuladas del empleador
 *  5. Resultado: saldo a favor (retenciones > ISR) o a cargo (retenciones < ISR)
 */

import annualTable from '../taxTables/isr-anual-2025.json'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface AnnualProjectionInput {
  /** Ingreso bruto mensual como asalariado */
  monthlyIncome: number
  /** Meses del ejercicio fiscal transcurridos (1–12) */
  monthsElapsed: number
  /** ISR retenido mensualmente por el empleador */
  monthlyRetention: number
  /** Total de deducciones personales anuales ya calculadas */
  annualDeductions: number
}

export interface AnnualProjectionResult {
  /** Ingreso anual proyectado (ingreso mensual × 12) */
  annualIncome: number
  /** Base gravable anual (ingreso anual - deducciones) */
  taxableIncome: number
  /** ISR anual causado según tarifa art. 152 */
  annualTax: number
  /** Total de retenciones proyectadas al año (retención mensual × 12) */
  totalRetained: number
  /** Saldo: positivo = a favor, negativo = a cargo */
  balance: number
  /** 'favor' | 'cargo' | 'equilibrado' */
  status: 'favor' | 'cargo' | 'equilibrado'
  /** Meses a los que se proyecta (siempre 12) */
  projectedMonths: number
}

// ── Función de ISR anual bruto ───────────────────────────────────────────────

/**
 * Calcula el ISR anual usando la tarifa del art. 152 LISR.
 * Similar a calculateSalariedTax pero con la tabla anual y sin subsidio al empleo.
 *
 * @param taxableIncome - Base gravable anual (ingreso - deducciones)
 * @returns ISR anual causado
 */
export function calculateAnnualTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0

  const bracket = annualTable.find(
    (row: { lower: number; upper: number }) => taxableIncome >= row.lower && taxableIncome <= row.upper,
  )
  if (!bracket) return 0

  // Mismo procedimiento que art. 96 pero sin subsidio
  const excedent = taxableIncome - bracket.lower
  const marginalTax = excedent * bracket.rate
  return bracket.fixedFee + marginalTax
}

// ── Proyección completa ──────────────────────────────────────────────────────

/**
 * Proyecta el ISR anual y calcula saldo a favor o cargo.
 * Referencia legal: art. 152 LISR — Cálculo anual del ISR
 *
 * @param input - Datos mensuales del contribuyente
 * @returns Proyección anual completa
 */
export function calculateAnnualProjection(input: AnnualProjectionInput): AnnualProjectionResult {
  const { monthlyIncome, monthlyRetention, annualDeductions } = input

  // Proyectar todo a 12 meses (ejercicio fiscal completo)
  const annualIncome = monthlyIncome * 12
  const totalRetained = monthlyRetention * 12

  // Base gravable = ingreso anual - deducciones personales (mínimo 0)
  const taxableIncome = Math.max(0, annualIncome - annualDeductions)

  // ISR anual según tarifa art. 152
  const annualTax = calculateAnnualTax(taxableIncome)

  // Saldo: si retuvieron más de lo que debo → a favor (positivo)
  const balance = totalRetained - annualTax

  let status: 'favor' | 'cargo' | 'equilibrado'
  if (balance > 0.005) {
    status = 'favor'
  } else if (balance < -0.005) {
    status = 'cargo'
  } else {
    status = 'equilibrado'
  }

  return {
    annualIncome,
    taxableIncome,
    annualTax,
    totalRetained,
    balance,
    status,
    projectedMonths: 12,
  }
}
