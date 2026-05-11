/**
 * Servicio de migración de datos locales (IndexedDB) a Supabase.
 *
 * Flujo de migración:
 *  1. detectLocalData() — ¿hay datos del usuario en IndexedDB?
 *  2. exportLocalData() — extraer todos los registros
 *  3. uploadToSupabase(data, userId) — subir a las tablas de Supabase
 *  4. migrateLocalToCloud(userId) — flujo completo automatizado
 *
 * REGLA: Los datos locales NUNCA se borran durante la migración.
 * Solo se copian a la nube. El usuario puede seguir operando offline.
 */

import { db } from '../../db/index.js'
import { supabase } from './client.ts'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface LocalDataCounts {
  incomes: number
  expenses: number
  categories: number
}

export interface DetectionResult {
  hasData: boolean
  counts: LocalDataCounts
}

export interface LocalData {
  incomes: Record<string, unknown>[]
  expenses: Record<string, unknown>[]
  categories: Record<string, unknown>[]
}

export interface UploadResult {
  success: boolean
  error: string | null
}

export interface MigrationResult {
  success: boolean
  migrated: LocalDataCounts
  error: string | null
}

// ── Detección ────────────────────────────────────────────────────────────────

/**
 * Detecta si hay datos del usuario en IndexedDB.
 * Las categorías default (isDefault=1) no cuentan como datos del usuario.
 */
export async function detectLocalData(): Promise<DetectionResult> {
  const incomes = await db.incomes.count()
  const expenses = await db.expenses.count()
  // Solo categorías personalizadas (no las predefinidas)
  const categories = await db.categories.where('isDefault').equals(0).count()

  return {
    hasData: incomes > 0 || expenses > 0 || categories > 0,
    counts: { incomes, expenses, categories },
  }
}

// ── Exportación ──────────────────────────────────────────────────────────────

/**
 * Exporta todos los datos del usuario desde IndexedDB.
 * Retorna los registros sin transformar, listos para subir.
 */
export async function exportLocalData(): Promise<LocalData> {
  const incomes = await db.incomes.toArray()
  const expenses = await db.expenses.toArray()
  const categories = await db.categories.where('isDefault').equals(0).toArray()

  return { incomes, expenses, categories }
}

// ── Subida ────────────────────────────────────────────────────────────────────

/**
 * Sube los datos locales a las tablas de Supabase.
 * Agrega user_id a cada registro para el Row Level Security (RLS).
 *
 * @param data   - Datos exportados de IndexedDB
 * @param userId - ID del usuario autenticado en Supabase
 */
export async function uploadToSupabase(
  data: LocalData,
  userId: string,
): Promise<UploadResult> {
  // Si no hay datos, no hacer nada
  if (data.incomes.length === 0 && data.expenses.length === 0 && data.categories.length === 0) {
    return { success: true, error: null }
  }

  // Subir tabla por tabla, agregar user_id a cada registro
  const tables: Array<{ tableName: string; records: Record<string, unknown>[] }> = []

  if (data.incomes.length > 0) {
    tables.push({ tableName: 'incomes', records: data.incomes })
  }
  if (data.expenses.length > 0) {
    tables.push({ tableName: 'expenses', records: data.expenses })
  }
  if (data.categories.length > 0) {
    tables.push({ tableName: 'categories', records: data.categories })
  }

  for (const { tableName, records } of tables) {
    // Agregar user_id y eliminar el id local (Supabase genera su propio id)
    const withUserId = records.map((record) => {
      const { id: _localId, ...rest } = record as Record<string, unknown> & { id?: number }
      return { ...rest, user_id: userId }
    })

    const { error } = await supabase.from(tableName).insert(withUserId)
    if (error) {
      return { success: false, error: error.message }
    }
  }

  return { success: true, error: null }
}

// ── Migración completa ───────────────────────────────────────────────────────

/**
 * Flujo completo de migración: detecta → exporta → sube.
 * Los datos locales NO se eliminan — solo se copian a la nube.
 *
 * @param userId - ID del usuario autenticado
 */
export async function migrateLocalToCloud(userId: string): Promise<MigrationResult> {
  // 1. Detectar si hay datos que migrar
  const detection = await detectLocalData()

  if (!detection.hasData) {
    return {
      success: true,
      migrated: { incomes: 0, expenses: 0, categories: 0 },
      error: null,
    }
  }

  // 2. Exportar datos locales
  const localData = await exportLocalData()

  // 3. Subir a Supabase
  const uploadResult = await uploadToSupabase(localData, userId)

  if (!uploadResult.success) {
    return {
      success: false,
      migrated: { incomes: 0, expenses: 0, categories: 0 },
      error: uploadResult.error,
    }
  }

  // 4. Confirmar migración exitosa
  return {
    success: true,
    migrated: detection.counts,
    error: null,
  }
}
