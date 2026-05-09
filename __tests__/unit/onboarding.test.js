import { db, resetDatabase } from '../../src/db/index.js'
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
} from '../../src/features/onboarding/onboardingService.js'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await db.delete()
})

test('guarda flag de onboarding', async () => {
  expect(await getOnboardingCompleted()).toBe(false)
  await setOnboardingCompleted(true)
  expect(await getOnboardingCompleted()).toBe(true)
})
