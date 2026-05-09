import { getSetting, setSetting } from '../../db/settings.js'

const ONBOARDING_KEY = 'onboardingCompleted'

export const getOnboardingCompleted = async () => await getSetting(ONBOARDING_KEY, false)

export const setOnboardingCompleted = async (value = true) => {
  await setSetting(ONBOARDING_KEY, value)
}
