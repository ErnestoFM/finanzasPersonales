import { getSetting } from '../../db/settings.js'
import { isSubscriptionActive } from '../payment/stripeManager.ts'

export const Feature = {
  ExportReports: 'export_reports',
  Projections: 'projections',
  CloudSync: 'cloud_sync',
  TaxEngine: 'tax_engine',
}

export const Plan = {
  Free: 'free',
  Pro: 'pro',
  Cancelled: 'cancelled',
}

export const getCurrentPlan = async () => {
  const plan = await getSetting('subscriptionPlan')
  return (plan as string) || Plan.Free
}

export const isFeatureAvailable = async (feature: string) => {
  const active = await isSubscriptionActive()
  if (!active) {
    return false
  }
  return Object.values(Feature).includes(feature)
}

