import { db, resetDatabase } from '../../src/db/index.js'
import { setSetting } from '../../src/db/settings.js'
import { Feature, Plan, isFeatureAvailable } from '../../src/utils/auth/featureGuard.ts'

beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await db.delete()
})

test('middleware bloquea sin plan pro', async () => {
  await setSetting('subscriptionPlan', Plan.Free)
  await expect(isFeatureAvailable(Feature.ExportReports)).resolves.toBe(false)
})

test('middleware permite con plan pro', async () => {
  await setSetting('subscriptionPlan', Plan.Pro)
  await expect(isFeatureAvailable(Feature.Projections)).resolves.toBe(true)
})
