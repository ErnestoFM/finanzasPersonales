import {
  calculateSalariedTax,
  calculateResicoTax,
  calculateMixedTax,
} from '../../../src/utils/fiscal/taxCalculator.js'

// ── Asalariado (art. 96 LISR) ───────────────────────────────────────────────

test('calcula ISR Asalariados según art. 96 LISR para ingreso con subsidio cero', () => {
  // Ingreso de 10,000 MXN:
  // Límite inferior: 6,332.06
  // Excedente: 10,000 - 6,332.06 = 3,667.94
  // Tasa marginal: 10.88% (0.1088)
  // Impuesto marginal: 3,667.94 * 0.1088 = 399.071872
  // Cuota fija: 371.83
  // Subsidio al empleo: 0.00 (ingreso > 7,382.33)
  // Total ISR: 371.83 + 399.071872 = 770.90 (redondeado)
  const tax = calculateSalariedTax(10000)
  expect(tax).toBeCloseTo(770.90, 2)
})

test('calcula ISR Asalariados con subsidio al empleo aplicable', () => {
  // Ingreso de 5,000 MXN:
  // Límite inferior: 746.05
  // Excedente: 5,000 - 746.05 = 4,253.95
  // Tasa marginal: 6.40% (0.0640)
  // Impuesto marginal: 4,253.95 * 0.0640 = 272.2528
  // Cuota fija: 14.32
  // Impuesto antes de subsidio: 286.57
  // Subsidio aplicable para 5,000: 294.63
  // Net ISR (no puede ser negativo): Max(0, 286.57 - 294.63) = 0
  const tax = calculateSalariedTax(5000)
  expect(tax).toBe(0)
})

test('Asalariado: retorna 0 con ingreso cero o negativo (art. 96 LISR — guardia)', () => {
  expect(calculateSalariedTax(0)).toBe(0)
  expect(calculateSalariedTax(-500)).toBe(0)
})

test('Asalariado: retorna 0 cuando el ingreso queda fuera del rango inferior de la tabla (0 < income < 0.01)', () => {
  // La tabla inicia en lower: 0.01. Un ingreso de 0.005 no tiene bracket asignado.
  // Esto cubre el branch `if (!bracket) return 0` (línea 17) y el ternario subsidio (línea 30).
  expect(calculateSalariedTax(0.005)).toBe(0)
})

// ── RESICO (art. 113-E LISR) ────────────────────────────────────────────────

test('calcula ISR RESICO según art. 113-E LISR — rango de 1.10%', () => {
  // Ingreso de 30,000 MXN (rango 25,000.01 – 50,000):
  // Tasa: 1.10% (0.0110)
  // ISR: 30,000 * 0.0110 = 330
  const tax = calculateResicoTax(30000)
  expect(tax).toBeCloseTo(330, 2)
})

test('RESICO: calcula correctamente en el rango más bajo (≤ 25,000 MXN, tasa 1%)', () => {
  // Ingreso de 10,000 MXN → tasa 1.00% → ISR = 100
  const tax = calculateResicoTax(10000)
  expect(tax).toBeCloseTo(100, 2)
})

test('RESICO: retorna 0 con ingreso cero o negativo (art. 113-E LISR — guardia)', () => {
  expect(calculateResicoTax(0)).toBe(0)
  expect(calculateResicoTax(-1)).toBe(0)
})

test('RESICO: retorna 0 si el ingreso queda fuera del rango inferior de la tabla (0 < income < 0.01)', () => {
  // La tabla inicia en lower: 0.01. Un ingreso de 0.005 no tiene bracket asignado.
  // Esto cubre el branch `if (!bracket) return 0` (línea 48).
  expect(calculateResicoTax(0.005)).toBe(0)
})

// ── Régimen Mixto (criterio de independencia de bases gravables) ─────────────

test('calcula ISR Régimen Mixto de forma independiente', () => {
  // Ingreso Asalariado de 10,000 MXN (ISR: 770.90)
  // Ingreso RESICO de 30,000 MXN (ISR: 330.00)
  // Total consolidado: 1100.90
  const mixed = calculateMixedTax(10000, 30000)
  expect(mixed.salariedTax).toBeCloseTo(770.90, 2)
  expect(mixed.resicoTax).toBeCloseTo(330.00, 2)
  expect(mixed.totalTax).toBeCloseTo(1100.90, 2)
})

test('Régimen Mixto: totalTax = 0 cuando ambos ingresos son cero', () => {
  const result = calculateMixedTax(0, 0)
  expect(result.salariedTax).toBe(0)
  expect(result.resicoTax).toBe(0)
  expect(result.totalTax).toBe(0)
})
