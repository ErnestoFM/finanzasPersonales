/**
 * Tests de metas de ahorro — Fase 3, Feature 1.
 *
 * Cobertura de:
 *   - Cálculo de progreso (%)
 *   - Proyección de fecha de cumplimiento
 *   - Meses restantes para alcanzar la meta
 *   - Registro de aportes
 *   - Detección de meta alcanzada
 *   - Validación de datos de meta
 *
 * Requisito: 100% de cobertura en /utils/savings
 */

import {
  calculateProgress,
  projectCompletionDate,
  monthsRemaining,
  addContribution,
  isGoalReached,
  validateGoal,
  type SavingsGoal,
} from '../../../src/utils/savings/savingsGoals.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// CÁLCULO DE PROGRESO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Cálculo de progreso (calculateProgress)', () => {
  test('progreso 0% cuando no hay ahorro', () => {
    expect(calculateProgress(0, 100000)).toBe(0)
  })

  test('progreso 50% cuando se lleva la mitad', () => {
    expect(calculateProgress(50000, 100000)).toBe(50)
  })

  test('progreso 100% cuando se alcanza la meta', () => {
    expect(calculateProgress(100000, 100000)).toBe(100)
  })

  test('progreso no puede superar 100%', () => {
    expect(calculateProgress(150000, 100000)).toBe(100)
  })

  test('progreso con montos decimales', () => {
    expect(calculateProgress(33333, 100000)).toBeCloseTo(33.33, 1)
  })

  test('targetAmount 0 retorna 100% (meta vacía ya cumplida)', () => {
    expect(calculateProgress(0, 0)).toBe(100)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PROYECCIÓN DE FECHA DE CUMPLIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Proyección de fecha de cumplimiento (projectCompletionDate)', () => {
  test('proyecta la fecha basándose en aporte mensual constante', () => {
    const start = new Date(2025, 0, 1) // 1 enero 2025
    const result = projectCompletionDate(0, 120000, 10000, start)
    // 120k / 10k = 12 meses → enero 2026
    expect(result).not.toBeNull()
    expect(result!.getFullYear()).toBe(2026)
    expect(result!.getMonth()).toBe(0) // Enero
  })

  test('meta ya alcanzada retorna la fecha actual', () => {
    const start = new Date(2025, 5, 1)
    const result = projectCompletionDate(100000, 100000, 5000, start)
    expect(result).toEqual(start)
  })

  test('aporte mensual 0 y meta no alcanzada retorna null (imposible)', () => {
    const result = projectCompletionDate(5000, 100000, 0, new Date())
    expect(result).toBeNull()
  })

  test('aporte mensual negativo retorna null', () => {
    const result = projectCompletionDate(5000, 100000, -500, new Date())
    expect(result).toBeNull()
  })

  test('calcula correctamente con ahorro parcial existente', () => {
    const start = new Date(2025, 0, 1)
    // Falta 50k, aporte 10k/mes → 5 meses → junio 2025
    const result = projectCompletionDate(50000, 100000, 10000, start)
    expect(result!.getMonth()).toBe(5) // Junio (0-indexed)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MESES RESTANTES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Meses restantes (monthsRemaining)', () => {
  test('calcula meses restantes correctamente', () => {
    // Falta 60k, aporte 10k → 6 meses
    expect(monthsRemaining(40000, 100000, 10000)).toBe(6)
  })

  test('meta alcanzada retorna 0', () => {
    expect(monthsRemaining(100000, 100000, 5000)).toBe(0)
  })

  test('meta superada retorna 0', () => {
    expect(monthsRemaining(120000, 100000, 5000)).toBe(0)
  })

  test('aporte 0 y meta no alcanzada retorna null (infinito)', () => {
    expect(monthsRemaining(5000, 100000, 0)).toBeNull()
  })

  test('redondea hacia arriba los meses parciales', () => {
    // Falta 55k, aporte 10k → 5.5 → 6 meses
    expect(monthsRemaining(45000, 100000, 10000)).toBe(6)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// APORTES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Registro de aportes (addContribution)', () => {
  test('aporte suma al monto actual y recalcula progreso', () => {
    const result = addContribution(50000, 10000, 100000)
    expect(result.newAmount).toBe(60000)
    expect(result.progress).toBe(60)
    expect(result.reached).toBe(false)
  })

  test('aporte que alcanza la meta marca reached como true', () => {
    const result = addContribution(90000, 10000, 100000)
    expect(result.newAmount).toBe(100000)
    expect(result.progress).toBe(100)
    expect(result.reached).toBe(true)
  })

  test('aporte que supera la meta: progreso 100%', () => {
    const result = addContribution(95000, 10000, 100000)
    expect(result.newAmount).toBe(105000)
    expect(result.progress).toBe(100)
    expect(result.reached).toBe(true)
  })

  test('aporte de 0: no cambia nada', () => {
    const result = addContribution(50000, 0, 100000)
    expect(result.newAmount).toBe(50000)
    expect(result.progress).toBe(50)
    expect(result.reached).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// META ALCANZADA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Detección de meta alcanzada (isGoalReached)', () => {
  test('retorna true cuando currentAmount >= targetAmount', () => {
    expect(isGoalReached(100000, 100000)).toBe(true)
    expect(isGoalReached(110000, 100000)).toBe(true)
  })

  test('retorna false cuando currentAmount < targetAmount', () => {
    expect(isGoalReached(99999, 100000)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN DE DATOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Validación de meta (validateGoal)', () => {
  const validGoal: SavingsGoal = {
    name: 'Fondo de emergencia',
    targetAmount: 100000,
    currentAmount: 0,
    monthlyContribution: 5000,
    deadline: '2026-01-01',
    createdAt: '2025-01-01',
  }

  test('meta válida retorna sin errores', () => {
    const result = validateGoal(validGoal)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('nombre vacío es inválido', () => {
    const result = validateGoal({ ...validGoal, name: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('El nombre es obligatorio')
  })

  test('monto objetivo 0 es inválido', () => {
    const result = validateGoal({ ...validGoal, targetAmount: 0 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('El monto objetivo debe ser mayor a 0')
  })

  test('monto objetivo negativo es inválido', () => {
    const result = validateGoal({ ...validGoal, targetAmount: -5000 })
    expect(result.valid).toBe(false)
  })

  test('aporte mensual negativo es inválido', () => {
    const result = validateGoal({ ...validGoal, monthlyContribution: -100 })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('El aporte mensual no puede ser negativo')
  })

  test('aporte mensual 0 es válido (meta sin aportes automáticos)', () => {
    const result = validateGoal({ ...validGoal, monthlyContribution: 0 })
    expect(result.valid).toBe(true)
  })

  test('deadline vacío es inválido', () => {
    const result = validateGoal({ ...validGoal, deadline: '' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('La fecha límite es obligatoria')
  })

  test('múltiples errores se acumulan', () => {
    const result = validateGoal({ ...validGoal, name: '', targetAmount: -1, deadline: '' })
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
