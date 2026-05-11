import {
  calculateSalariedTax,
  calculateResicoTax,
  calculateMixedTax,
} from '../../../src/utils/fiscal/taxCalculator.js'

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
  // Net ISR (no puede ser negativo para retenciones estándar): Max(0, 286.57 - 294.63) = 0
  const tax = calculateSalariedTax(5000)
  expect(tax).toBe(0)
})

test('calcula ISR RESICO según art. 113-E LISR', () => {
  // Ingreso de 30,000 MXN:
  // Tasa: 1.10% (0.0110)
  // ISR: 30,000 * 0.0110 = 330
  const tax = calculateResicoTax(30000)
  expect(tax).toBeCloseTo(330, 2)
})

test('calcula ISR Régimen Mixto de forma independiente', () => {
  // Ingreso Asalariado de 10,000 MXN (ISR: 770.90)
  // Ingreso RESICO de 30,000 MXN (ISR: 330.00)
  // Total consolidado: 1100.90
  const mixed = calculateMixedTax(10000, 30000)
  expect(mixed.salariedTax).toBeCloseTo(770.90, 2)
  expect(mixed.resicoTax).toBeCloseTo(330.00, 2)
  expect(mixed.totalTax).toBeCloseTo(1100.90, 2)
})
