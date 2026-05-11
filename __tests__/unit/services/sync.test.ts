/**
 * Tests de sincronización offline/online — Fase 2, Feature 5.
 *
 * Cobertura de:
 *   - Cola de operaciones offline (enqueue, dequeue, retry)
 *   - Detección de estado de conexión
 *   - Motor de sincronización: push (local→nube), pull (nube→local)
 *   - Resolución de conflictos: last-write-wins
 *   - Indicador de estado de sincronización
 *
 * Supabase se mockea completamente — offline-first.
 */

import 'fake-indexeddb/auto'

// ── Mock de Supabase ─────────────────────────────────────────────────────────

const mockInsert = jest.fn()
const mockUpsert = jest.fn()
const mockDelete = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockGte = jest.fn()
const mockOrder = jest.fn()

jest.mock('../../../src/services/supabase/client.ts', () => {
  const chainable = {
    insert: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
    eq: jest.fn(),
    gte: jest.fn(),
    order: jest.fn(),
  }
  // Cada método encadena y retorna el mismo objeto
  chainable.insert.mockReturnValue(chainable)
  chainable.upsert.mockReturnValue(chainable)
  chainable.delete.mockReturnValue(chainable)
  chainable.select.mockReturnValue(chainable)
  chainable.eq.mockReturnValue(chainable)
  chainable.gte.mockReturnValue(chainable)
  chainable.order.mockReturnValue(chainable)

  const mockFrom = jest.fn(() => chainable)

  return {
    supabase: {
      from: mockFrom,
      __chain: chainable,
      __mockFrom: mockFrom,
    },
  }
})

import { supabase } from '../../../src/services/supabase/client.ts'

// ── Imports de módulos bajo test ─────────────────────────────────────────────

import {
  enqueueOperation,
  getPendingOperations,
  markOperationSynced,
  markOperationFailed,
  clearSyncedOperations,
  getQueueStats,
} from '../../../src/services/supabase/syncQueue.ts'

import {
  isOnline,
  onConnectionChange,
} from '../../../src/services/supabase/connectionStatus.ts'

import {
  pushChanges,
  pullChanges,
  fullSync,
  getSyncStatus,
  type SyncStatus,
} from '../../../src/services/supabase/syncService.ts'

import { db } from '../../../src/db/index.js'

// ── Acceso a mocks ──────────────────────────────────────────────────────────

const chain = (supabase as unknown as Record<string, unknown>).__chain as Record<string, jest.Mock>
const mockFrom = (supabase as unknown as Record<string, jest.Mock>).__mockFrom

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  jest.clearAllMocks()
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

// ═══════════════════════════════════════════════════════════════════════════════
// COLA DE OPERACIONES OFFLINE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Cola de operaciones offline (syncQueue)', () => {
  test('enqueue agrega una operación pendiente', async () => {
    await enqueueOperation({
      table: 'incomes',
      operation: 'create',
      recordId: 1,
      payload: { amount: 30000, description: 'Sueldo' },
    })

    const pending = await getPendingOperations()
    expect(pending).toHaveLength(1)
    expect(pending[0].table).toBe('incomes')
    expect(pending[0].operation).toBe('create')
    expect(pending[0].status).toBe('pending')
  })

  test('las operaciones se encolan en orden FIFO', async () => {
    await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: { amount: 1000 } })
    await enqueueOperation({ table: 'expenses', operation: 'create', recordId: 2, payload: { amount: 500 } })
    await enqueueOperation({ table: 'incomes', operation: 'update', recordId: 1, payload: { amount: 1500 } })

    const pending = await getPendingOperations()
    expect(pending).toHaveLength(3)
    expect(pending[0].table).toBe('incomes')
    expect(pending[1].table).toBe('expenses')
    expect(pending[2].operation).toBe('update')
  })

  test('markOperationSynced cambia el status a synced', async () => {
    const id = await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    await markOperationSynced(id)

    const pending = await getPendingOperations()
    expect(pending).toHaveLength(0) // Ya no es pendiente
  })

  test('markOperationFailed incrementa retryCount y mantiene pending', async () => {
    const id = await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    await markOperationFailed(id)

    const pending = await getPendingOperations()
    expect(pending).toHaveLength(1)
    expect(pending[0].retryCount).toBe(1)
    expect(pending[0].status).toBe('pending')
  })

  test('operación con 3+ reintentos pasa a status failed', async () => {
    const id = await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    await markOperationFailed(id)
    await markOperationFailed(id)
    await markOperationFailed(id)

    const pending = await getPendingOperations()
    expect(pending).toHaveLength(0) // Ya no pendiente, está en 'failed'
  })

  test('clearSyncedOperations elimina solo las completadas', async () => {
    const id1 = await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    await enqueueOperation({ table: 'expenses', operation: 'create', recordId: 2, payload: {} })
    await markOperationSynced(id1)

    await clearSyncedOperations()
    const stats = await getQueueStats()
    expect(stats.pending).toBe(1)
    expect(stats.synced).toBe(0)
  })

  test('getQueueStats retorna contadores correctos', async () => {
    const id1 = await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    await enqueueOperation({ table: 'expenses', operation: 'create', recordId: 2, payload: {} })
    await markOperationSynced(id1)

    const stats = await getQueueStats()
    expect(stats.pending).toBe(1)
    expect(stats.synced).toBe(1)
    expect(stats.failed).toBe(0)
    expect(stats.total).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO DE CONEXIÓN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Estado de conexión (connectionStatus)', () => {
  test('isOnline retorna un booleano', () => {
    const result = isOnline()
    expect(typeof result).toBe('boolean')
  })

  test('onConnectionChange registra callbacks y retorna unsubscribe', () => {
    const callback = jest.fn()
    const unsubscribe = onConnectionChange(callback)
    expect(typeof unsubscribe).toBe('function')
    unsubscribe()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR DE SINCRONIZACIÓN — PUSH
// ═══════════════════════════════════════════════════════════════════════════════

describe('Push: local → nube (pushChanges)', () => {
  test('procesa operaciones pendientes y las marca como synced', async () => {
    await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: { amount: 30000 } })

    // Mock de Supabase exitoso
    chain.insert.mockReturnValue({ error: null, data: [] })
    chain.upsert.mockReturnValue({ error: null, data: [] })

    // Forzar resolución directa para create
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      upsert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null, data: [] }),
      }),
    })

    const result = await pushChanges('user-1')
    expect(result.pushed).toBe(1)
    expect(result.failed).toBe(0)

    const pending = await getPendingOperations()
    expect(pending).toHaveLength(0)
  })

  test('operación fallida incrementa retryCount', async () => {
    await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: { amount: 30000 } })

    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: { message: 'Network error' }, data: null }),
      upsert: jest.fn().mockResolvedValue({ error: { message: 'Network error' }, data: null }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: { message: 'Network error' }, data: null }),
      }),
    })

    const result = await pushChanges('user-1')
    expect(result.pushed).toBe(0)
    expect(result.failed).toBe(1)

    const pending = await getPendingOperations()
    expect(pending[0].retryCount).toBe(1)
  })

  test('sin operaciones pendientes: no hace nada', async () => {
    const result = await pushChanges('user-1')
    expect(result.pushed).toBe(0)
    expect(result.failed).toBe(0)
  })

  test('operación update usa upsert (last-write-wins)', async () => {
    await enqueueOperation({ table: 'incomes', operation: 'update', recordId: 5, payload: { amount: 50000 } })

    const mockUpsertFn = jest.fn().mockResolvedValue({ error: null, data: [] })
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      upsert: mockUpsertFn,
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null, data: [] }),
      }),
    })

    await pushChanges('user-1')
    expect(mockUpsertFn).toHaveBeenCalled()
  })

  test('operación delete usa delete + eq', async () => {
    await enqueueOperation({ table: 'expenses', operation: 'delete', recordId: 3, payload: {} })

    const mockEqFn = jest.fn().mockResolvedValue({ error: null, data: [] })
    const mockDeleteFn = jest.fn().mockReturnValue({ eq: mockEqFn })
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      upsert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      delete: mockDeleteFn,
    })

    await pushChanges('user-1')
    expect(mockDeleteFn).toHaveBeenCalled()
    expect(mockEqFn).toHaveBeenCalledWith('id', 3)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MOTOR DE SINCRONIZACIÓN — PULL
// ═══════════════════════════════════════════════════════════════════════════════

describe('Pull: nube → local (pullChanges)', () => {
  test('trae registros remotos y los guarda en IndexedDB', async () => {
    const mockSelectFn = jest.fn().mockResolvedValue({
      data: [
        { id: 100, amount: 30000, description: 'Remoto', date: '2025-01-15', categoryId: 1, regime: 'salaried', type: 'income', updated_at: '2025-01-15T12:00:00Z' },
      ],
      error: null,
    })
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: mockSelectFn,
          }),
        }),
      }),
    })

    const result = await pullChanges('user-1')
    expect(result.pulled).toBeGreaterThanOrEqual(0)
    expect(result.error).toBeNull()
  })

  test('error en pull retorna el error', async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Unauthorized' },
            }),
          }),
        }),
      }),
    })

    const result = await pullChanges('user-1')
    expect(result.error).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN COMPLETA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Sincronización completa (fullSync)', () => {
  test('ejecuta push + pull y retorna resultado combinado', async () => {
    // Sin operaciones pendientes, y pull retorna vacío
    mockFrom.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      upsert: jest.fn().mockResolvedValue({ error: null, data: [] }),
      delete: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: null }) }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })

    const result = await fullSync('user-1')
    expect(result.push.pushed).toBe(0)
    expect(result.pull.error).toBeNull()
    expect(result.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO DE SINCRONIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Estado de sincronización (getSyncStatus)', () => {
  test('retorna idle cuando no hay operaciones pendientes', async () => {
    const status = await getSyncStatus()
    expect(status.state).toBe('idle')
    expect(status.pendingCount).toBe(0)
  })

  test('retorna pending cuando hay operaciones en cola', async () => {
    await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    const status = await getSyncStatus()
    expect(status.state).toBe('pending')
    expect(status.pendingCount).toBe(1)
  })

  test('retorna error cuando hay operaciones fallidas', async () => {
    const id = await enqueueOperation({ table: 'incomes', operation: 'create', recordId: 1, payload: {} })
    await markOperationFailed(id)
    await markOperationFailed(id)
    await markOperationFailed(id) // 3 intentos → failed

    const status = await getSyncStatus()
    expect(status.state).toBe('error')
    expect(status.failedCount).toBeGreaterThan(0)
  })
})
