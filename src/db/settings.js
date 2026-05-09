import { db } from './index.js'

export const getSetting = async (key, fallback = null) => {
  const record = await db.settings.get(key)
  return record ? record.value : fallback
}

export const setSetting = async (key, value) => {
  await db.settings.put({ key, value })
}

export const removeSetting = async (key) => {
  await db.settings.delete(key)
}
