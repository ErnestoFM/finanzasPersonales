import { ValidationError } from '../../../src/utils/errors.js'
import { requireField, requirePositiveNumber } from '../../../src/utils/validation.js'

test('requireField lanza error cuando falta', () => {
  expect(() => requireField('', 'Campo requerido')).toThrow(ValidationError)
})

test('requirePositiveNumber valida números positivos', () => {
  expect(() => requirePositiveNumber(-1, 'Monto inválido')).toThrow(ValidationError)
  expect(() => requirePositiveNumber(10, 'Monto inválido')).not.toThrow()
})
