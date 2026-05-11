/**
 * Tests del motor fiscal completo — Fase 2.
 * Cobertura de:
 *   - Deducciones personales (art. 151 LISR)
 *   - Proyección ISR anual y saldo a favor/cargo (art. 152 LISR)
 *   - Alertas RESICO acumulado anual (art. 113-E / 113-G LISR)
 *   - Consolidación mixta con desglose narrativo
 *
 * Requisito: 100% de cobertura en /utils/fiscal
 */

import {
  calculatePersonalDeductions,
  DeductionType,
} from '../../../src/utils/fiscal/deductions.ts'

import {
  calculateAnnualProjection,
  calculateAnnualTax,
} from '../../../src/utils/fiscal/annualProjection.ts'

import {
  getResicoAlert,
  ResicoAlertLevel,
  RESICO_ANNUAL_LIMIT,
} from '../../../src/utils/fiscal/resicoAlerts.ts'

import {
  calculateMixedTaxSummary,
} from '../../../src/utils/fiscal/mixedTaxSummary.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// DEDUCCIONES PERSONALES — art. 151 LISR
// ═══════════════════════════════════════════════════════════════════════════════

describe('Deducciones personales (art. 151 LISR)', () => {
  test('médico sin límite individual: aplica el monto completo si está bajo el límite global', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Medical, amount: 50000 }],
      500000, // ingreso anual
    )
    // Límite global = min(500000 * 0.15, 197944.80) = min(75000, 197944.80) = 75000
    expect(result.totalDeductible).toBe(50000)
    expect(result.globalLimit).toBeCloseTo(75000, 2)
    expect(result.limitApplied).toBe(false) // no se alcanzó el límite
  })

  test('límite global se aplica cuando las deducciones exceden 15% del ingreso', () => {
    const result = calculatePersonalDeductions(
      [
        { type: DeductionType.Medical, amount: 80000 },
        { type: DeductionType.Insurance, amount: 30000 },
      ],
      500000, // 15% = 75,000 — total deducciones (110k) excede
    )
    expect(result.totalDeductible).toBeCloseTo(75000, 2)
    expect(result.limitApplied).toBe(true)
  })

  test('límite global usa 5 × UMA anual cuando es menor al 15% del ingreso', () => {
    // Ingreso anual alto: $2,000,000
    // 15% = $300,000
    // 5 × UMA anual = 5 × $39,588.96 = $197,944.80 ← este es menor
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Medical, amount: 250000 }],
      2000000,
    )
    expect(result.globalLimit).toBeCloseTo(197944.80, 2)
    expect(result.totalDeductible).toBeCloseTo(197944.80, 2)
    expect(result.limitApplied).toBe(true)
  })

  test('colegiatura: aplica límite por nivel educativo (preescolar $14,200)', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Tuition, amount: 20000, level: 'preescolar' }],
      500000,
    )
    // Límite preescolar = $14,200 — se recorta de 20k a 14.2k
    expect(result.breakdown[0].applied).toBe(14200)
    expect(result.breakdown[0].capped).toBe(true)
  })

  test('colegiatura bachillerato: respeta límite de $24,500', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Tuition, amount: 30000, level: 'bachillerato' }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(24500)
  })

  test('colegiatura sin nivel especificado: no se aplica (retorna 0 para ese ítem)', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Tuition, amount: 10000 }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(0)
  })

  test('seguro médico: sin límite individual, sujeto al global', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Insurance, amount: 40000 }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(40000)
    expect(result.breakdown[0].capped).toBe(false)
  })

  test('AFORE: aplica 10% del ingreso acumulable como límite individual', () => {
    // Ingreso $500,000 → 10% = $50,000
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Afore, amount: 80000 }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(50000)
    expect(result.breakdown[0].capped).toBe(true)
  })

  test('donativos: aplica 7% del ingreso como límite individual', () => {
    // Ingreso $500,000 → 7% = $35,000
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Donation, amount: 50000 }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(35000)
    expect(result.breakdown[0].capped).toBe(true)
  })

  test('intereses hipotecarios: sin límite individual en esta versión', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Mortgage, amount: 60000 }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(60000)
  })

  test('múltiples deducciones combinadas con límite global', () => {
    const result = calculatePersonalDeductions(
      [
        { type: DeductionType.Medical, amount: 30000 },
        { type: DeductionType.Insurance, amount: 20000 },
        { type: DeductionType.Tuition, amount: 15000, level: 'primaria' },
        { type: DeductionType.Afore, amount: 10000 },
      ],
      500000, // límite global = $75,000
    )
    // Médico: 30k, Seguro: 20k, Colegiatura: min(15k, 12.9k) = 12.9k, AFORE: min(10k, 50k) = 10k
    // Total antes de límite global = 30000 + 20000 + 12900 + 10000 = 72,900
    expect(result.totalDeductible).toBeCloseTo(72900, 2)
    expect(result.limitApplied).toBe(false) // 72.9k < 75k
  })

  test('colegiatura con nivel educativo desconocido: retorna 0', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Tuition, amount: 10000, level: 'doctorado' }],
      500000,
    )
    expect(result.breakdown[0].applied).toBe(0)
    expect(result.breakdown[0].capped).toBe(true)
    expect(result.breakdown[0].capReason).toContain('desconocido')
  })

  test('colegiatura bajo el límite del nivel: no se recorta', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Tuition, amount: 10000, level: 'preescolar' }],
      500000,
    )
    // Límite preescolar = $14,200 → 10k < 14.2k → sin cap
    expect(result.breakdown[0].applied).toBe(10000)
    expect(result.breakdown[0].capped).toBe(false)
  })

  test('donativos bajo el límite del 7%: no se recortan', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Donation, amount: 10000 }],
      500000, // 7% = $35,000 → 10k < 35k
    )
    expect(result.breakdown[0].applied).toBe(10000)
    expect(result.breakdown[0].capped).toBe(false)
  })

  test('AFORE bajo el límite del 10%: no se recorta', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Afore, amount: 20000 }],
      500000, // 10% = $50,000 → 20k < 50k
    )
    expect(result.breakdown[0].applied).toBe(20000)
    expect(result.breakdown[0].capped).toBe(false)
  })

  test('sin deducciones: retorna 0', () => {
    const result = calculatePersonalDeductions([], 500000)
    expect(result.totalDeductible).toBe(0)
    expect(result.breakdown).toHaveLength(0)
  })

  test('ingreso cero: límite global es 0, deducciones se truncan a 0', () => {
    const result = calculatePersonalDeductions(
      [{ type: DeductionType.Medical, amount: 50000 }],
      0,
    )
    expect(result.globalLimit).toBe(0)
    expect(result.totalDeductible).toBe(0)
    expect(result.limitApplied).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PROYECCIÓN ISR ANUAL — art. 152 LISR
// ═══════════════════════════════════════════════════════════════════════════════

describe('Proyección ISR anual (art. 152 LISR)', () => {
  test('calcula ISR anual para ingreso dentro de tabla', () => {
    // Ingreso anual $120,000 (cae en rango 75,984.56 – 133,536.07)
    // Excedente: 120000 - 75984.56 = 44015.44
    // Marginal: 44015.44 * 0.1088 = 4788.88
    // Cuota fija: 4461.94
    // ISR anual: 4461.94 + 4788.88 = 9250.82 (aprox)
    const tax = calculateAnnualTax(120000)
    expect(tax).toBeCloseTo(9250.82, 0)
  })

  test('ISR anual para ingreso 0 o negativo retorna 0', () => {
    expect(calculateAnnualTax(0)).toBe(0)
    expect(calculateAnnualTax(-100)).toBe(0)
  })

  test('proyección con saldo a favor (retenciones > ISR anual)', () => {
    // $20,000/mes × 12 = $240,000 anual
    // Retención mensual = calculateSalariedTax(20000) ≈ $2,653
    // Retención anual ≈ $2,653 × 12 = $31,836
    // ISR anual con tabla art. 152 sobre $240,000 ≈ $31,247
    // Saldo a favor ≈ $31,836 - $31,247 = $589 (aprox)
    const result = calculateAnnualProjection({
      monthlyIncome: 20000,
      monthsElapsed: 12,
      monthlyRetention: 2653,
      annualDeductions: 0,
    })
    expect(result.annualIncome).toBe(240000)
    expect(result.annualTax).toBeGreaterThan(0)
    expect(result.totalRetained).toBeCloseTo(31836, 0)
    expect(result.balance).toBeGreaterThan(0) // a favor
    expect(result.status).toBe('favor')
  })

  test('proyección con saldo a cargo (retenciones < ISR anual)', () => {
    // Simulamos retenciones menores a las debidas
    const result = calculateAnnualProjection({
      monthlyIncome: 30000,
      monthsElapsed: 12,
      monthlyRetention: 1000, // retención artificialmente baja
      annualDeductions: 0,
    })
    expect(result.balance).toBeLessThan(0) // a cargo
    expect(result.status).toBe('cargo')
  })

  test('proyección con deducciones reduce el ISR anual', () => {
    const sinDeducciones = calculateAnnualProjection({
      monthlyIncome: 25000,
      monthsElapsed: 12,
      monthlyRetention: 3000,
      annualDeductions: 0,
    })
    const conDeducciones = calculateAnnualProjection({
      monthlyIncome: 25000,
      monthsElapsed: 12,
      monthlyRetention: 3000,
      annualDeductions: 40000,
    })
    expect(conDeducciones.annualTax).toBeLessThan(sinDeducciones.annualTax)
    expect(conDeducciones.balance).toBeGreaterThan(sinDeducciones.balance)
  })

  test('proyección extrapola meses faltantes correctamente', () => {
    // 6 meses transcurridos de un ingreso de $20,000 → extrapolar a 12
    const result = calculateAnnualProjection({
      monthlyIncome: 20000,
      monthsElapsed: 6,
      monthlyRetention: 2653,
      annualDeductions: 0,
    })
    expect(result.annualIncome).toBe(240000) // 20000 × 12
    expect(result.totalRetained).toBeCloseTo(31836, 0) // 2653 × 12
    expect(result.projectedMonths).toBe(12)
  })

  test('proyección con ingreso que cae fuera de la tabla anual retorna 0', () => {
    const result = calculateAnnualProjection({
      monthlyIncome: 0.0001 / 12,
      monthsElapsed: 12,
      monthlyRetention: 0,
      annualDeductions: 0,
    })
    expect(result.annualTax).toBe(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ALERTAS RESICO — art. 113-E / 113-G LISR
// ═══════════════════════════════════════════════════════════════════════════════

describe('Alertas RESICO acumulado anual', () => {
  test('zona verde: < 80% del límite (< $2,800,000)', () => {
    const alert = getResicoAlert(2000000)
    expect(alert.level).toBe(ResicoAlertLevel.Green)
    expect(alert.percentage).toBeCloseTo(57.14, 1)
  })

  test('zona amarilla: 80–95% del límite ($2,800,000 – $3,325,000)', () => {
    const alert = getResicoAlert(2800000)
    expect(alert.level).toBe(ResicoAlertLevel.Yellow)
    expect(alert.percentage).toBe(80)
  })

  test('zona amarilla extremo superior: justo bajo 95%', () => {
    const alert = getResicoAlert(3324999)
    expect(alert.level).toBe(ResicoAlertLevel.Yellow)
  })

  test('zona roja: 95–100% del límite ($3,325,000 – $3,500,000)', () => {
    const alert = getResicoAlert(3325000)
    expect(alert.level).toBe(ResicoAlertLevel.Red)
    expect(alert.percentage).toBe(95)
  })

  test('zona roja: exactamente en el límite ($3,500,000)', () => {
    const alert = getResicoAlert(3500000)
    expect(alert.level).toBe(ResicoAlertLevel.Red)
    expect(alert.percentage).toBe(100)
  })

  test('zona crítica: sobre el límite (> $3,500,000) — debe salir del régimen', () => {
    const alert = getResicoAlert(3500001)
    expect(alert.level).toBe(ResicoAlertLevel.Critical)
    expect(alert.percentage).toBeGreaterThan(100)
    expect(alert.message).toContain('salir')
  })

  test('ingreso 0: zona verde sin alerta', () => {
    const alert = getResicoAlert(0)
    expect(alert.level).toBe(ResicoAlertLevel.Green)
    expect(alert.percentage).toBe(0)
  })

  test('la constante RESICO_ANNUAL_LIMIT es 3,500,000', () => {
    expect(RESICO_ANNUAL_LIMIT).toBe(3500000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLIDACIÓN MIXTA — Criterio de independencia de bases gravables
// ═══════════════════════════════════════════════════════════════════════════════

describe('Consolidación fiscal mixta con desglose', () => {
  test('desglose narrativo: ingresos asalariado + RESICO', () => {
    const result = calculateMixedTaxSummary(30000, 20000)
    expect(result.totalIncome).toBe(50000)
    expect(result.salariedTax).toBeGreaterThan(0)
    expect(result.resicoTax).toBeGreaterThan(0)
    expect(result.totalTax).toBe(result.salariedTax + result.resicoTax)
    expect(result.effectiveRate).toBeGreaterThan(0)
    expect(result.effectiveRate).toBeLessThan(1) // porcentaje decimal
    expect(result.narrative).toContain('$50,000')
  })

  test('solo asalariado: RESICO es 0', () => {
    const result = calculateMixedTaxSummary(30000, 0)
    expect(result.resicoTax).toBe(0)
    expect(result.salariedPortion).toBe(1) // 100%
    expect(result.resicoPortion).toBe(0)
  })

  test('solo RESICO: asalariado es 0', () => {
    const result = calculateMixedTaxSummary(0, 20000)
    expect(result.salariedTax).toBe(0)
    expect(result.resicoPortion).toBe(1)
    expect(result.salariedPortion).toBe(0)
  })

  test('ambos ingresos en 0: todo es 0', () => {
    const result = calculateMixedTaxSummary(0, 0)
    expect(result.totalTax).toBe(0)
    expect(result.effectiveRate).toBe(0)
    expect(result.salariedPortion).toBe(0)
    expect(result.resicoPortion).toBe(0)
  })
})
