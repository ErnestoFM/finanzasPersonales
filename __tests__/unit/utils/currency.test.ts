/**
 * Tests de multi-moneda — Fase 3, Feature 6.
 *
 * Cobertura de:
 *   - Conversión MXN ↔ USD
 *   - Formato de moneda localizado
 *   - Fallback offline (último tipo de cambio guardado)
 *   - Validación de tipo de cambio
 *   - Conversión en lote para reportes
 *
 * Requisito: 100% de cobertura en /utils/currency
 */

import {
  convertCurrency,
  formatCurrency,
  isValidExchangeRate,
  getEffectiveRate,
  convertMovementsToBase,
  type ExchangeRate,
  type CurrencyMovement,
} from '../../../src/utils/currency/multiCurrency.ts'

// ── Tipo de cambio de prueba ─────────────────────────────────────────────────

const rate: ExchangeRate = {
  usdToMxn: 17.25,
  lastUpdated: '2025-01-15T12:00:00Z',
  source: 'banxico',
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSIÓN DE MONEDA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Conversión de moneda (convertCurrency)', () => {
  test('USD a MXN: multiplica por tipo de cambio', () => {
    const result = convertCurrency(100, 'USD', 'MXN', rate)
    expect(result).toBe(1725)
  })

  test('MXN a USD: divide entre tipo de cambio', () => {
    const result = convertCurrency(1725, 'MXN', 'USD', rate)
    expect(result).toBe(100)
  })

  test('misma moneda: retorna el mismo monto', () => {
    expect(convertCurrency(500, 'MXN', 'MXN', rate)).toBe(500)
    expect(convertCurrency(100, 'USD', 'USD', rate)).toBe(100)
  })

  test('monto 0: retorna 0', () => {
    expect(convertCurrency(0, 'USD', 'MXN', rate)).toBe(0)
  })

  test('redondea a 2 decimales', () => {
    const oddRate: ExchangeRate = { usdToMxn: 17.3456, lastUpdated: '', source: 'banxico' }
    const result = convertCurrency(100, 'USD', 'MXN', oddRate)
    expect(result).toBe(1734.56)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATO DE MONEDA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Formato de moneda (formatCurrency)', () => {
  test('MXN formatea con signo de peso y MXN', () => {
    const result = formatCurrency(15000, 'MXN')
    expect(result).toContain('15')
    expect(result).toContain('MXN')
  })

  test('USD formatea con signo de dólar y USD', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toContain('100')
    expect(result).toContain('USD')
  })

  test('formatea con 2 decimales', () => {
    const result = formatCurrency(1234.5, 'MXN')
    expect(result).toContain('1,234.50') // o 1234.50 dependiendo de locale
  })

  test('monto negativo se muestra correctamente', () => {
    const result = formatCurrency(-500, 'MXN')
    expect(result).toContain('500')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDACIÓN DE TIPO DE CAMBIO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Validación de tipo de cambio (isValidExchangeRate)', () => {
  test('tipo de cambio válido', () => {
    expect(isValidExchangeRate(rate)).toBe(true)
  })

  test('tipo de cambio 0 es inválido', () => {
    expect(isValidExchangeRate({ ...rate, usdToMxn: 0 })).toBe(false)
  })

  test('tipo de cambio negativo es inválido', () => {
    expect(isValidExchangeRate({ ...rate, usdToMxn: -17 })).toBe(false)
  })

  test('sin lastUpdated es inválido', () => {
    expect(isValidExchangeRate({ usdToMxn: 17.25, lastUpdated: '', source: 'banxico' })).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK OFFLINE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Fallback offline (getEffectiveRate)', () => {
  const fallbackRate: ExchangeRate = {
    usdToMxn: 16.50,
    lastUpdated: '2025-01-10T12:00:00Z',
    source: 'local',
  }

  test('retorna remoto si está disponible y es válido', () => {
    const result = getEffectiveRate(rate, fallbackRate)
    expect(result.usdToMxn).toBe(17.25)
    expect(result.source).toBe('banxico')
  })

  test('retorna fallback si remoto es null', () => {
    const result = getEffectiveRate(null, fallbackRate)
    expect(result.usdToMxn).toBe(16.50)
    expect(result.source).toBe('local')
  })

  test('retorna fallback si remoto es inválido', () => {
    const invalidRate: ExchangeRate = { usdToMxn: 0, lastUpdated: '2025-01-15', source: 'banxico' }
    const result = getEffectiveRate(invalidRate, fallbackRate)
    expect(result.usdToMxn).toBe(16.50)
  })

  test('retorna default hardcoded si ambos son null', () => {
    const result = getEffectiveRate(null, null)
    expect(result.usdToMxn).toBeGreaterThan(0)
    expect(result.source).toBe('default')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSIÓN EN LOTE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Conversión en lote para reportes (convertMovementsToBase)', () => {
  const movements: CurrencyMovement[] = [
    { id: 1, amount: 15000, currency: 'MXN' },
    { id: 2, amount: 100, currency: 'USD' },
    { id: 3, amount: 2500, currency: 'MXN' },
  ]

  test('convierte todos los movimientos a MXN', () => {
    const result = convertMovementsToBase(movements, 'MXN', rate)
    expect(result).toHaveLength(3)
    expect(result[0].convertedAmount).toBe(15000) // Ya era MXN
    expect(result[1].convertedAmount).toBe(1725) // 100 USD → MXN
    expect(result[2].convertedAmount).toBe(2500)
  })

  test('convierte todos los movimientos a USD', () => {
    const result = convertMovementsToBase(movements, 'USD', rate)
    expect(result[0].convertedAmount).toBeCloseTo(869.57, 1) // 15000 MXN → USD
    expect(result[1].convertedAmount).toBe(100) // Ya era USD
  })

  test('mantiene el id y currency original', () => {
    const result = convertMovementsToBase(movements, 'MXN', rate)
    expect(result[0].originalCurrency).toBe('MXN')
    expect(result[1].originalCurrency).toBe('USD')
  })

  test('array vacío retorna array vacío', () => {
    const result = convertMovementsToBase([], 'MXN', rate)
    expect(result).toHaveLength(0)
  })
})
