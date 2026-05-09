import { getSetting, setSetting } from '../../db/settings.js'

const PROFILE_KEY = 'fiscalProfile'

export const RESICO_ANNUAL_LIMIT = 3500000
export const RESICO_WARNING_THRESHOLD = 0.9

export const getFiscalProfile = async () =>
  getSetting(PROFILE_KEY, {
    salaried: { active: false, monthlyIncome: 0 },
    resico: { active: false, monthlyIncome: 0 },
  })

export const saveFiscalProfile = async (profile) => {
  await setSetting(PROFILE_KEY, profile)
}

export const getProfileSummary = (profile) => {
  const salariedIncome = profile.salaried.active ? profile.salaried.monthlyIncome : 0
  const resicoIncome = profile.resico.active ? profile.resico.monthlyIncome : 0
  return {
    salariedIncome,
    resicoIncome,
    totalIncome: salariedIncome + resicoIncome,
  }
}

export const getResicoAnnualIncome = (profile) => {
  if (!profile.resico.active) return 0
  return profile.resico.monthlyIncome * 12
}

export const isResicoLimitWarning = (profile) => {
  const annualIncome = getResicoAnnualIncome(profile)
  return annualIncome >= RESICO_ANNUAL_LIMIT * RESICO_WARNING_THRESHOLD
}
