import { db, resetDatabase } from '../../src/db/index.js'
import { getFiscalProfile, saveFiscalProfile } from '../../src/features/fiscalProfile/profileService.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await db.delete()
})

test('guarda y recupera perfil fiscal', async () => {
  const initial = await getFiscalProfile()
  expect(initial.salaried.active).toBe(false)
  await saveFiscalProfile({
    salaried: { active: true, monthlyIncome: 12000 },
    resico: { active: false, monthlyIncome: 0 },
  })
  const updated = await getFiscalProfile()
  expect(updated.salaried.active).toBe(true)
})
