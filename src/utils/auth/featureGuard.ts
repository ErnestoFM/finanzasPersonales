import { getSetting } from '../../db/settings.js'

export const Feature = {
  ExportReports: 'export_reports',
  Projections: 'projections',
  CloudSync: 'cloud_sync',
}

export const Plan = {
  Free: 'free',
  Pro: 'pro',
  Cancelled: 'cancelled',
}

export const getCurrentPlan = async () => {
  return getSetting('subscriptionPlan', Plan.Free)
}

export const isFeatureAvailable = async (feature) => {
  const plan = await getCurrentPlan()
  if (plan !== Plan.Pro) {
    return false
  }
  return Object.values(Feature).includes(feature)
}
