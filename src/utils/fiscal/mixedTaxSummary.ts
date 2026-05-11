/**
 * Consolidación fiscal para régimen mixto con desglose narrativo.
 * Referencia legal: Criterio de Independencia de bases gravables (Régimen Mixto)
 *
 * Extiende el calculateMixedTax de taxCalculator.js con:
 *  - Tasa efectiva global
 *  - Porcentaje de carga por régimen
 *  - Frase narrativa para la UI: "De tus $X totales, pagas $Y por asalariado y $Z por RESICO"
 */

import { calculateSalariedTax, calculateResicoTax } from './taxCalculator.js'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface MixedTaxSummary {
  /** Ingreso total (asalariado + RESICO) */
  totalIncome: number
  /** ISR mensual como asalariado (art. 96 LISR) */
  salariedTax: number
  /** ISR mensual RESICO (art. 113-E LISR) */
  resicoTax: number
  /** ISR total (suma de ambos regímenes) */
  totalTax: number
  /** Tasa efectiva global (totalTax / totalIncome), 0 si no hay ingresos */
  effectiveRate: number
  /** Proporción de la carga fiscal que corresponde al asalariado (0–1) */
  salariedPortion: number
  /** Proporción de la carga fiscal que corresponde a RESICO (0–1) */
  resicoPortion: number
  /** Frase narrativa para mostrar en la UI */
  narrative: string
}

// ── Utilidad de formato ──────────────────────────────────────────────────────

/** Formatea un número como moneda MXN: $1,234.56 */
function formatMXN(amount: number): string {
  return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Calcula la carga fiscal consolidada para régimen mixto con desglose completo.
 * Cada régimen se calcula de forma INDEPENDIENTE (criterio de independencia de bases gravables).
 *
 * @param salariedIncome - Ingreso bruto mensual como asalariado
 * @param resicoIncome   - Ingreso mensual cobrado en RESICO
 * @returns Desglose completo con narrativa
 */
export function calculateMixedTaxSummary(
  salariedIncome: number,
  resicoIncome: number,
): MixedTaxSummary {
  const salariedTax = calculateSalariedTax(salariedIncome)
  const resicoTax = calculateResicoTax(resicoIncome)
  const totalTax = salariedTax + resicoTax
  const totalIncome = salariedIncome + resicoIncome

  // Tasa efectiva: porcentaje del ingreso total que se va en impuestos
  const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0

  // Proporción de carga fiscal por régimen
  const salariedPortion = totalTax > 0 ? salariedTax / totalTax : 0
  const resicoPortion = totalTax > 0 ? resicoTax / totalTax : 0

  // Narrativa para la UI
  let narrative: string
  if (totalIncome === 0) {
    narrative = 'No hay ingresos registrados.'
  } else if (salariedIncome > 0 && resicoIncome > 0) {
    narrative = `De tus ${formatMXN(totalIncome)} totales, pagas ${formatMXN(salariedTax)} por asalariado y ${formatMXN(resicoTax)} por RESICO. Tasa efectiva: ${(effectiveRate * 100).toFixed(2)}%.`
  } else if (salariedIncome > 0) {
    narrative = `Con un ingreso de ${formatMXN(salariedIncome)} como asalariado, tu ISR mensual es ${formatMXN(salariedTax)}. Tasa efectiva: ${(effectiveRate * 100).toFixed(2)}%.`
  } else {
    narrative = `Con un ingreso de ${formatMXN(resicoIncome)} en RESICO, tu ISR mensual es ${formatMXN(resicoTax)}. Tasa efectiva: ${(effectiveRate * 100).toFixed(2)}%.`
  }

  return {
    totalIncome,
    salariedTax,
    resicoTax,
    totalTax,
    effectiveRate,
    salariedPortion,
    resicoPortion,
    narrative,
  }
}
