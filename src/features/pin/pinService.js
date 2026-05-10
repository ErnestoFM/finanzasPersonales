import { getSetting, setSetting, removeSetting } from '../../db/settings.js'
import { hashPin, verifyPinHash } from '../../utils/pin.js'
import { requireField } from '../../utils/validation.js'

const PIN_KEY = 'pinHash'

export const hasPin = async () => Boolean(await getSetting(PIN_KEY, null))

export const setPin = async (pin) => {
  requireField(pin, 'El PIN es obligatorio.')
  if (!/^[0-9]{4}$/.test(pin)) {
    throw new Error('El PIN debe tener 4 dígitos.')
  }
  const digest = await hashPin(pin)
  await setSetting(PIN_KEY, digest)
}

export const verifyPin = async (pin) => {
  const stored = await getSetting(PIN_KEY, null)
  if (!stored) return false
  return verifyPinHash(pin, stored)
}

export const clearPin = async () => {
  await removeSetting(PIN_KEY)
}
