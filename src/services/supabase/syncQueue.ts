/**
 * Cola de operaciones offline para sincronización.
 * Las operaciones se almacenan en IndexedDB (tabla syncQueue) y se procesan
 * cuando la app detecta conexión a internet.
 *
 * Cada operación tiene:
 *  - table: tabla destino en Supabase
 *  - operation: create | update | delete
 *  - recordId: ID local del registro
 *  - payload: datos a sincronizar
 *  - status: pending | synced | failed
 *  - retryCount: reintentos (max 3 antes de marcar failed)
 *
 * REGLA: La cola persiste en IndexedDB → sobrevive cierre de app/pestaña.
 */

import { db } from '../../db/index.js'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface QueueOperationInput {
  table: 'incomes' | 'expenses' | 'categories'
  operation: 'create' | 'update' | 'delete'
  recordId: number
  payload: Record<string, unknown>
}

export interface QueueStats {
  pending: number
  synced: number
  failed: number
  total: number
}

// ── Constantes ───────────────────────────────────────────────────────────────

const MAX_RETRIES = 3

// ── Funciones ────────────────────────────────────────────────────────────────

/**
 * Agrega una operación a la cola de sincronización.
 * @returns ID de la operación encolada
 */
export async function enqueueOperation(input: QueueOperationInput): Promise<number> {
  return db.syncQueue.add({
    table: input.table,
    operation: input.operation,
    recordId: input.recordId,
    payload: input.payload,
    timestamp: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
  })
}

/**
 * Obtiene todas las operaciones pendientes de sincronización.
 * Ordenadas por timestamp (FIFO).
 */
export async function getPendingOperations() {
  return db.syncQueue
    .where('status')
    .equals('pending')
    .sortBy('timestamp')
}

/**
 * Marca una operación como sincronizada exitosamente.
 */
export async function markOperationSynced(id: number): Promise<void> {
  await db.syncQueue.update(id, { status: 'synced' })
}

/**
 * Marca una operación como fallida. Incrementa retryCount.
 * Si retryCount >= MAX_RETRIES, cambia status a 'failed' permanentemente.
 */
export async function markOperationFailed(id: number): Promise<void> {
  const entry = await db.syncQueue.get(id)
  if (!entry) return

  const newRetryCount = entry.retryCount + 1
  const newStatus = newRetryCount >= MAX_RETRIES ? 'failed' : 'pending'

  await db.syncQueue.update(id, {
    retryCount: newRetryCount,
    status: newStatus,
  })
}

/**
 * Elimina todas las operaciones con status 'synced' de la cola.
 * Llamar periódicamente para limpiar la cola.
 */
export async function clearSyncedOperations(): Promise<void> {
  await db.syncQueue.where('status').equals('synced').delete()
}

/**
 * Retorna estadísticas de la cola de sincronización.
 */
export async function getQueueStats(): Promise<QueueStats> {
  const all = await db.syncQueue.toArray()
  return {
    pending: all.filter((op) => op.status === 'pending').length,
    synced: all.filter((op) => op.status === 'synced').length,
    failed: all.filter((op) => op.status === 'failed').length,
    total: all.length,
  }
}
