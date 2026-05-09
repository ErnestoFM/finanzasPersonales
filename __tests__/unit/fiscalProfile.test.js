import {
  getProfileSummary,
  getResicoAnnualIncome,
  isResicoLimitWarning,
  RESICO_ANNUAL_LIMIT,
} from '../../src/features/fiscalProfile/profileService.js'

test('resumen de régimen simple y combinado', () => {
  const profile = {
    salaried: { active: true, monthlyIncome: 15000 },
    resico: { active: true, monthlyIncome: 12000 },
  }
  const summary = getProfileSummary(profile)
  expect(summary.totalIncome).toBe(27000)
})

test('alerta de límite RESICO', () => {
  const profile = {
    salaried: { active: false, monthlyIncome: 0 },
    resico: { active: true, monthlyIncome: RESICO_ANNUAL_LIMIT / 12 },
  }
  expect(isResicoLimitWarning(profile)).toBe(true)
  expect(getResicoAnnualIncome(profile)).toBe(RESICO_ANNUAL_LIMIT)
})

test('resico inactivo no dispara alertas', () => {
  const profile = {
    salaried: { active: false, monthlyIncome: 0 },
    resico: { active: false, monthlyIncome: 0 },
  }
  expect(getResicoAnnualIncome(profile)).toBe(0)
  expect(isResicoLimitWarning(profile)).toBe(false)
})
