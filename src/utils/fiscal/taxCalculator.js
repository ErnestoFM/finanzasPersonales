import salariedTable from '../taxTables/isr-asalariado.json'
import resicoTable from '../taxTables/isr-resico.json'
import subsidioTable from '../taxTables/subsidio-empleo.json'

/**
 * Calcula el impuesto de Asalariado basado en el ingreso bruto mensual.
 * Referencia legal: art. 96 LISR - Retención mensual de ISR para asalariados
 *
 * @param {number} income - Ingreso bruto mensual
 * @returns {number} ISR neto calculado
 */
export const calculateSalariedTax = (income) => {
  if (income <= 0) return 0

  // 1. Encontrar el rango correspondiente en la tabla de ISR para asalariados
  const bracket = salariedTable.find((row) => income >= row.lower && income <= row.upper)
  if (!bracket) return 0

  // 2. Calcular la porción excedente
  const excedent = income - bracket.lower

  // 3. Aplicar la tasa marginal al excedente
  const marginalTax = excedent * bracket.rate

  // 4. Sumar la cuota fija
  const totalIsrBeforeSubsidio = bracket.fixedFee + marginalTax

  // 5. Buscar y aplicar el subsidio al empleo correspondiente (Anexo 8 RMF 2025)
  const subsidioRow = subsidioTable.find((row) => income >= row.lower && income <= row.upper)
  const subsidio = subsidioRow ? subsidioRow.subsidio : 0

  // 6. El impuesto neto a retener es el impuesto bruto menos el subsidio aplicable (mínimo 0)
  return Math.max(0, totalIsrBeforeSubsidio - subsidio)
}

/**
 * Calcula el impuesto RESICO basado en el ingreso cobrado mensual.
 * Referencia legal: art. 113-E LISR - Tasa mensual de RESICO personas físicas
 *
 * @param {number} income - Ingreso mensual cobrado
 * @returns {number} ISR calculado para RESICO
 */
export const calculateResicoTax = (income) => {
  if (income <= 0) return 0

  // Encontrar la tasa aplicable en la tabla de RESICO (pago mensual definitivo)
  const bracket = resicoTable.find((row) => income >= row.lower && income <= row.upper)
  if (!bracket) return 0

  // RESICO aplica la tasa de forma directa sobre la totalidad de los ingresos (sin restar límite inferior)
  return income * bracket.rate
}

/**
 * Calcula la carga fiscal consolidada para un régimen mixto (Asalariado + RESICO).
 * Referencia legal: Criterio de Independencia de bases gravables (Régimen Mixto)
 *
 * @param {number} salariedIncome - Ingreso bruto mensual como asalariado
 * @param {number} resicoIncome - Ingreso mensual cobrado en RESICO
 * @returns {object} Detalle de impuestos calculados
 */
export const calculateMixedTax = (salariedIncome, resicoIncome) => {
  const salariedTax = calculateSalariedTax(salariedIncome)
  const resicoTax = calculateResicoTax(resicoIncome)
  return {
    salariedTax,
    resicoTax,
    totalTax: salariedTax + resicoTax,
  }
}
