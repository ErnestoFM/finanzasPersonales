/**
 * Tests del simulador de decisiones y proyecciones — Fase 2, Feature 3.
 *
 * Cobertura de:
 *   - Proyección mensual a N meses (ingresos/egresos recurrentes + carga fiscal)
 *   - Detección de déficit y tiempo de recuperación
 *   - Simulación de impacto de una decisión financiera futura
 *   - Comparación de dos escenarios lado a lado
 *
 * Requisito: 100% de cobertura en /utils/projections
 */

import {
  projectMonthly,
} from '../../../src/utils/projections/monthlyProjection.ts'

import {
  detectDeficit,
} from '../../../src/utils/projections/deficitDetector.ts'

import {
  simulateDecision,
  compareScenarios,
} from '../../../src/utils/projections/scenarioSimulator.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// PROYECCIÓN MENSUAL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Proyección mensual (projectMonthly)', () => {
  const baseParams = {
    currentBalance: 10000,
    recurringIncomes: [
      { amount: 30000, regime: 'salaried' as const },
    ],
    recurringExpenses: [
      { amount: 15000, category: 'vivienda' },
      { amount: 5000, category: 'alimentación' },
    ],
    months: 6,
  }

  test('genera el número correcto de meses', () => {
    const result = projectMonthly(baseParams)
    expect(result).toHaveLength(6)
  })

  test('el primer mes parte del balance actual', () => {
    const result = projectMonthly(baseParams)
    // Balance mes 1 = 10000 + (30000 - 20000 - ISR)
    expect(result[0].month).toBe(1)
    expect(result[0].startBalance).toBe(10000)
    expect(result[0].totalIncome).toBe(30000)
    expect(result[0].totalExpenses).toBe(20000)
  })

  test('el balance acumula correctamente mes a mes', () => {
    const result = projectMonthly(baseParams)
    // Cada mes: ingreso neto = 30000 - 20000 - ISR
    // El endBalance de un mes es el startBalance del siguiente
    for (let i = 1; i < result.length; i++) {
      expect(result[i].startBalance).toBeCloseTo(result[i - 1].endBalance, 2)
    }
  })

  test('incluye carga fiscal mensual para asalariado', () => {
    const result = projectMonthly(baseParams)
    // Con $30,000 de ingreso, hay ISR > 0
    expect(result[0].totalTax).toBeGreaterThan(0)
    // El balance final incluye el descuento fiscal
    expect(result[0].endBalance).toBe(
      result[0].startBalance + result[0].totalIncome - result[0].totalExpenses - result[0].totalTax,
    )
  })

  test('incluye carga fiscal para RESICO', () => {
    const result = projectMonthly({
      currentBalance: 5000,
      recurringIncomes: [
        { amount: 40000, regime: 'resico' as const },
      ],
      recurringExpenses: [
        { amount: 10000, category: 'oficina' },
      ],
      months: 3,
    })
    expect(result[0].totalTax).toBeGreaterThan(0)
  })

  test('soporta múltiples ingresos de distintos regímenes (régimen mixto)', () => {
    const result = projectMonthly({
      currentBalance: 0,
      recurringIncomes: [
        { amount: 25000, regime: 'salaried' as const },
        { amount: 15000, regime: 'resico' as const },
      ],
      recurringExpenses: [
        { amount: 10000, category: 'general' },
      ],
      months: 3,
    })
    expect(result[0].totalIncome).toBe(40000)
    expect(result[0].totalTax).toBeGreaterThan(0)
    // El tax debe ser la suma de ISR asalariado + ISR RESICO
    expect(result[0].taxBreakdown.salariedTax).toBeGreaterThan(0)
    expect(result[0].taxBreakdown.resicoTax).toBeGreaterThan(0)
  })

  test('sin ingresos: balance solo baja por gastos', () => {
    const result = projectMonthly({
      currentBalance: 50000,
      recurringIncomes: [],
      recurringExpenses: [
        { amount: 10000, category: 'renta' },
      ],
      months: 3,
    })
    expect(result[0].totalTax).toBe(0)
    expect(result[0].endBalance).toBe(40000)
    expect(result[1].endBalance).toBe(30000)
    expect(result[2].endBalance).toBe(20000)
  })

  test('sin gastos ni ingresos: balance se mantiene', () => {
    const result = projectMonthly({
      currentBalance: 5000,
      recurringIncomes: [],
      recurringExpenses: [],
      months: 2,
    })
    expect(result[0].endBalance).toBe(5000)
    expect(result[1].endBalance).toBe(5000)
  })

  test('proyección a 12 meses funciona correctamente', () => {
    const result = projectMonthly({ ...baseParams, months: 12 })
    expect(result).toHaveLength(12)
    expect(result[11].month).toBe(12)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// DETECCIÓN DE DÉFICIT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Detección de déficit (detectDeficit)', () => {
  test('detecta el mes exacto en que el balance cae bajo 0', () => {
    const result = detectDeficit([
      { month: 1, startBalance: 5000, endBalance: 3000, totalIncome: 0, totalExpenses: 2000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
      { month: 2, startBalance: 3000, endBalance: 1000, totalIncome: 0, totalExpenses: 2000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
      { month: 3, startBalance: 1000, endBalance: -1000, totalIncome: 0, totalExpenses: 2000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
    ])
    expect(result.deficitMonth).toBe(3)
  })

  test('sin déficit: retorna null', () => {
    const result = detectDeficit([
      { month: 1, startBalance: 10000, endBalance: 15000, totalIncome: 10000, totalExpenses: 5000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
      { month: 2, startBalance: 15000, endBalance: 20000, totalIncome: 10000, totalExpenses: 5000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
    ])
    expect(result.deficitMonth).toBeNull()
    expect(result.recoveryMonth).toBeNull()
    expect(result.recoveryTime).toBeNull()
  })

  test('detecta recuperación después del déficit', () => {
    const result = detectDeficit([
      { month: 1, startBalance: 1000, endBalance: -500, totalIncome: 0, totalExpenses: 1500, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
      { month: 2, startBalance: -500, endBalance: -200, totalIncome: 500, totalExpenses: 200, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
      { month: 3, startBalance: -200, endBalance: 300, totalIncome: 700, totalExpenses: 200, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
    ])
    expect(result.deficitMonth).toBe(1)
    expect(result.recoveryMonth).toBe(3)
    expect(result.recoveryTime).toBe(2) // 2 meses para recuperarse
  })

  test('déficit sin recuperación dentro de la proyección', () => {
    const result = detectDeficit([
      { month: 1, startBalance: 500, endBalance: -500, totalIncome: 0, totalExpenses: 1000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
      { month: 2, startBalance: -500, endBalance: -1500, totalIncome: 0, totalExpenses: 1000, totalTax: 0, taxBreakdown: { salariedTax: 0, resicoTax: 0 } },
    ])
    expect(result.deficitMonth).toBe(1)
    expect(result.recoveryMonth).toBeNull()
    expect(result.recoveryTime).toBeNull()
  })

  test('proyección vacía: sin déficit', () => {
    const result = detectDeficit([])
    expect(result.deficitMonth).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULADOR DE DECISIONES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Simulador de decisiones (simulateDecision)', () => {
  const baseProjectionParams = {
    currentBalance: 20000,
    recurringIncomes: [
      { amount: 30000, regime: 'salaried' as const },
    ],
    recurringExpenses: [
      { amount: 18000, category: 'gastos fijos' },
    ],
    months: 6,
  }

  test('ingreso adicional recurrente aumenta el balance desde el mes de inicio', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'income',
      amount: 10000,
      startMonth: 1,
      recurring: true,
      regime: 'resico',
    })
    expect(result.withDecision[0].totalIncome).toBe(40000) // 30k + 10k
    expect(result.withDecision[0].endBalance).toBeGreaterThan(result.baseline[0].endBalance)
    expect(result.monthlyImpact).toBeGreaterThan(0)
  })

  test('gasto adicional recurrente disminuye el balance', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'expense',
      amount: 5000,
      startMonth: 1,
      recurring: true,
    })
    expect(result.withDecision[0].totalExpenses).toBe(23000) // 18k + 5k
    expect(result.withDecision[0].endBalance).toBeLessThan(result.baseline[0].endBalance)
    expect(result.monthlyImpact).toBeLessThan(0)
  })

  test('ingreso único solo impacta el mes de inicio', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'income',
      amount: 50000,
      startMonth: 3,
      recurring: false,
      regime: 'salaried',
    })
    // Meses 1 y 2: sin impacto
    expect(result.withDecision[0].totalIncome).toBe(result.baseline[0].totalIncome)
    expect(result.withDecision[1].totalIncome).toBe(result.baseline[1].totalIncome)
    // Mes 3: con el ingreso extra
    expect(result.withDecision[2].totalIncome).toBe(result.baseline[2].totalIncome + 50000)
    // Mes 4 en adelante: sin ingreso extra pero el balance acumulado es mayor
    expect(result.withDecision[3].totalIncome).toBe(result.baseline[3].totalIncome)
    expect(result.withDecision[3].startBalance).toBeGreaterThan(result.baseline[3].startBalance)
  })

  test('gasto único solo afecta un mes', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'expense',
      amount: 8000,
      startMonth: 2,
      recurring: false,
    })
    // Mes 1: sin impacto
    expect(result.withDecision[0].totalExpenses).toBe(result.baseline[0].totalExpenses)
    // Mes 2: gasto extra
    expect(result.withDecision[1].totalExpenses).toBe(result.baseline[1].totalExpenses + 8000)
  })

  test('calcula impacto fiscal cuando el ingreso es de régimen diferente', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'income',
      amount: 20000,
      startMonth: 1,
      recurring: true,
      regime: 'resico',
    })
    // El impacto fiscal debe incluir ISR RESICO adicional
    expect(result.fiscalImpact).toBeGreaterThan(0)
    // El balance con decisión sube MENOS de $20k porque hay ISR RESICO
    const deltaBalance = result.withDecision[0].endBalance - result.baseline[0].endBalance
    expect(deltaBalance).toBeLessThan(20000)
    expect(deltaBalance).toBeGreaterThan(0)
  })

  test('gasto sin régimen no genera impacto fiscal adicional', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'expense',
      amount: 3000,
      startMonth: 1,
      recurring: true,
    })
    expect(result.fiscalImpact).toBe(0)
  })

  test('detecta si la decisión causa déficit', () => {
    const result = simulateDecision(
      {
        currentBalance: 5000,
        recurringIncomes: [{ amount: 10000, regime: 'salaried' as const }],
        recurringExpenses: [{ amount: 9000, category: 'fijos' }],
        months: 6,
      },
      {
        type: 'expense',
        amount: 5000,
        startMonth: 1,
        recurring: true,
      },
    )
    // Sin decisión: 10k - 9k - ISR ≈ neto positivo
    // Con decisión: 10k - 14k - ISR → negativo
    expect(result.deficitInfo.deficitMonth).not.toBeNull()
  })

  test('decisión con startMonth más allá de la proyección: impacto 0', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'income',
      amount: 50000,
      startMonth: 99,
      recurring: false,
      regime: 'salaried',
    })
    // La decisión nunca se aplica → impacto 0
    expect(result.monthlyImpact).toBe(0)
  })

  test('ingreso sin régimen explícito: se aplica como asalariado por defecto', () => {
    const result = simulateDecision(baseProjectionParams, {
      type: 'income',
      amount: 5000,
      startMonth: 1,
      recurring: true,
      // sin regime → default 'salaried'
    })
    // El ingreso se suma al asalariado existente ($30k + $5k)
    expect(result.withDecision[0].totalIncome).toBe(35000)
    // El impacto fiscal es la diferencia de ISR salaried con $35k vs $30k
    expect(result.fiscalImpact).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// COMPARADOR DE ESCENARIOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Comparador de escenarios (compareScenarios)', () => {
  const baseProjectionParams = {
    currentBalance: 15000,
    recurringIncomes: [
      { amount: 25000, regime: 'salaried' as const },
    ],
    recurringExpenses: [
      { amount: 12000, category: 'fijos' },
    ],
    months: 6,
  }

  test('compara dos decisiones y retorna ambas proyecciones + ganador', () => {
    const result = compareScenarios(
      baseProjectionParams,
      {
        type: 'income',
        amount: 10000,
        startMonth: 1,
        recurring: true,
        regime: 'resico',
      },
      {
        type: 'income',
        amount: 15000,
        startMonth: 1,
        recurring: true,
        regime: 'salaried',
      },
    )
    expect(result.scenarioA.withDecision).toHaveLength(6)
    expect(result.scenarioB.withDecision).toHaveLength(6)
    expect(result.winner).toBeDefined()
    // El escenario con $15k adicionales en asalariado debería tener mejor balance final
    // (aunque la tasa ISR es más alta, el monto neto es mayor)
    expect(result.scenarioB.withDecision[5].endBalance)
      .toBeGreaterThan(result.scenarioA.withDecision[5].endBalance)
  })

  test('compara ingreso vs gasto', () => {
    const result = compareScenarios(
      baseProjectionParams,
      {
        type: 'income',
        amount: 5000,
        startMonth: 1,
        recurring: true,
        regime: 'resico',
      },
      {
        type: 'expense',
        amount: 3000,
        startMonth: 1,
        recurring: true,
      },
    )
    // Escenario A (ingreso) siempre gana vs escenario B (gasto)
    expect(result.winner).toBe('A')
  })

  test('el balance final determina el ganador', () => {
    const result = compareScenarios(
      baseProjectionParams,
      {
        type: 'expense',
        amount: 1000,
        startMonth: 1,
        recurring: true,
      },
      {
        type: 'expense',
        amount: 5000,
        startMonth: 1,
        recurring: true,
      },
    )
    // Menos gasto → mejor balance → A gana
    expect(result.winner).toBe('A')
  })

  test('empate: mismo gasto en ambos escenarios → tie', () => {
    const result = compareScenarios(
      baseProjectionParams,
      {
        type: 'expense',
        amount: 2000,
        startMonth: 1,
        recurring: true,
      },
      {
        type: 'expense',
        amount: 2000,
        startMonth: 1,
        recurring: true,
      },
    )
    expect(result.winner).toBe('tie')
  })

  test('impacto fiscal con base que incluye RESICO + decisión asalariada', () => {
    const mixedBase = {
      currentBalance: 10000,
      recurringIncomes: [
        { amount: 20000, regime: 'salaried' as const },
        { amount: 15000, regime: 'resico' as const },
      ],
      recurringExpenses: [
        { amount: 10000, category: 'fijos' },
      ],
      months: 3,
    }
    const result = simulateDecision(mixedBase, {
      type: 'income',
      amount: 10000,
      startMonth: 1,
      recurring: true,
      regime: 'salaried',
    })
    // El impacto fiscal es solo ISR salaried adicional (RESICO no cambia)
    expect(result.fiscalImpact).toBeGreaterThan(0)
    expect(result.withDecision[0].totalIncome).toBe(45000)
  })
})
