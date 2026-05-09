import { db, resetDatabase } from '../../src/db/index.js'
import { getSetting, removeSetting, setSetting } from '../../src/db/settings.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await db.delete()
})

test('administra settings en IndexedDB', async () => {
  expect(await getSetting('tema', 'claro')).toBe('claro')
  await setSetting('tema', 'oscuro')
  expect(await getSetting('tema', 'claro')).toBe('oscuro')
  await removeSetting('tema')
  expect(await getSetting('tema', 'claro')).toBe('claro')
})
