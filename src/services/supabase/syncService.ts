/**
 * Motor de sincronización con Supabase.
 *
 * Arquitectura:
 *  - Push (local → nube): procesa la cola de operaciones offline
 *  - Pull (nube → local): trae cambios remotos desde el último sync
 *  - fullSync: ejecuta push + pull secuencialmente
 *
 * Resolución de conflictos: LAST-WRITE-WINS
 *  - Las operaciones update usan upsert (insert or update)
 *  - El registro con el timestamp más reciente gana
 *
 * REGLA: Supabase es sincronización, NUNCA dependencia.
 * Si falla, la app sigue funcionando con datos locales.
 */

import { supabase } from './client.ts'
import {
  getPendingOperations,
  markOperationSynced,
  markOperationFailed,
  getQueueStats,
} from './syncQueue.ts'
import { db } from '../../db/index.js'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface PushResult {
  pushed: number
  failed: number
}

export interface PullResult {
  pulled: number
  error: string | null
}

export interface FullSyncResult {
  push: PushResult
  pull: PullResult
  success: boolean
}

export type SyncState = 'idle' | 'syncing' | 'pending' | 'error'

export interface SyncStatus {
  state: SyncState
  pendingCount: number
  failedCount: number
}

// ── Tablas a sincronizar ─────────────────────────────────────────────────────

const SYNC_TABLES = ['incomes', 'expenses', 'categories'] as const

// ── Push: local → nube ───────────────────────────────────────────────────────

/**
 * Procesa todas las operaciones pendientes de la cola y las envía a Supabase.
 * Cada operación exitosa se marca como synced; las fallidas incrementan retryCount.
 *
 * @param userId - ID del usuario autenticado
 */
export async function pushChanges(userId: string): Promise<PushResult> {
  const pending = await getPendingOperations()
  let pushed = 0
  let failed = 0

  for (const op of pending) {
    const success = await pushSingleOperation(op, userId)
    if (success) {
      await markOperationSynced(op.id!)
      pushed++
    } else {
      await markOperationFailed(op.id!)
      failed++
    }
  }

  return { pushed, failed }
}

/**
 * Ejecuta una operación individual contra Supabase.
 * - create → insert
 * - update → upsert (last-write-wins)
 * - delete → delete where id = recordId
 */
async function pushSingleOperation(
  op: { table: string; operation: string; recordId: number; payload: Record<string, unknown> },
  userId: string,
): Promise<boolean> {
  const { table, operation, recordId, payload } = op

  // Agregar user_id y timestamp para RLS y conflict resolution
  const record = {
    ...payload,
    user_id: userId,
    updated_at: new Date().toISOString(),
  }

  try {
    if (operation === 'create') {
      const { error } = await supabase.from(table).insert([record])
      return !error
    }

    if (operation === 'update') {
      // Last-write-wins: upsert con el timestamp más reciente
      const { error } = await supabase.from(table).upsert([{ id: recordId, ...record }])
      return !error
    }

    if (operation === 'delete') {
      const { error } = await supabase.from(table).delete().eq('id', recordId)
      return !error
    }

    return false
  } catch {
    return false
  }
}

// ── Pull: nube → local ───────────────────────────────────────────────────────

/**
 * Trae cambios remotos desde Supabase desde el último timestamp de sync.
 * Los registros remotos se guardan en IndexedDB (upsert local).
 *
 * @param userId - ID del usuario autenticado
 * @param since  - Timestamp ISO desde el que traer cambios (default: epoch)
 */
export async function pullChanges(
  userId: string,
  since: string = '1970-01-01T00:00:00Z',
): Promise<PullResult> {
  let totalPulled = 0

  for (const table of SYNC_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .gte('updated_at', since)
      .order('updated_at', { ascending: true })

    if (error) {
      return { pulled: totalPulled, error: error.message }
    }

    if (data && data.length > 0) {
      // Upsert local: si el registro existe, actualiza; si no, inserta
      for (const record of data) {
        const localTable = db[table as keyof typeof db]
        // Intentar actualizar primero, si no existe, insertar
        const existing = await (localTable as ReturnType<typeof db.incomes.where>).get(record.id)
        if (existing) {
          await (localTable as ReturnType<typeof db.incomes.where>).update(record.id, record)
        } else {
          await (localTable as ReturnType<typeof db.incomes.where>).add(record)
        }
      }
      totalPulled += data.length
    }
  }

  return { pulled: totalPulled, error: null }
}

// ── Full Sync ────────────────────────────────────────────────────────────────

/**
 * Sincronización completa: primero push (local→nube), luego pull (nube→local).
 * Push va primero para que los cambios locales no se sobreescriban.
 */
export async function fullSync(userId: string): Promise<FullSyncResult> {
  const push = await pushChanges(userId)
  const pull = await pullChanges(userId)

  return {
    push,
    pull,
    success: push.failed === 0 && pull.error === null,
  }
}

// ── Estado de sincronización ─────────────────────────────────────────────────

/**
 * Retorna el estado actual de la sincronización.
 * Útil para el indicador visual en la UI.
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const stats = await getQueueStats()

  let state: SyncState = 'idle'
  if (stats.failed > 0) {
    state = 'error'
  } else if (stats.pending > 0) {
    state = 'pending'
  }

  return {
    state,
    pendingCount: stats.pending,
    failedCount: stats.failed,
  }
}
