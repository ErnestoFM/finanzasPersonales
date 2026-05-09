import { db, resetDatabase } from '../../src/db/index.js'
import { clearPin, hasPin, setPin, verifyPin } from '../../src/features/pin/pinService.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await db.delete()
})

test('configura y valida PIN', async () => {
  expect(await hasPin()).toBe(false)
  await setPin('1234')
  expect(await hasPin()).toBe(true)
  expect(await verifyPin('1234')).toBe(true)
  expect(await verifyPin('0000')).toBe(false)
  await clearPin()
  expect(await hasPin()).toBe(false)
})

test('rechaza PIN inválido', async () => {
  await expect(setPin('12')).rejects.toThrow('El PIN debe tener 4 dígitos.')
  expect(await verifyPin('1234')).toBe(false)
})
