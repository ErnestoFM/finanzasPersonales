/**
 * Tests de migración de datos locales → Supabase — Fase 2, Feature 4.
 *
 * Usa factory inline para evitar TDZ, y obtiene referencia al mock
 * importando el módulo mockeado después.
 */

import 'fake-indexeddb/auto'

jest.mock('../../../src/services/supabase/client.ts', () => {
  const mockInsert = jest.fn()
  const mockFrom = jest.fn(() => ({ insert: mockInsert }))
  return {
    supabase: { from: mockFrom, __mockInsert: mockInsert, __mockFrom: mockFrom },
  }
})

import { supabase } from '../../../src/services/supabase/client.ts'

import {
  detectLocalData,
  exportLocalData,
  uploadToSupabase,
  migrateLocalToCloud,
} from '../../../src/services/supabase/migrationService.ts'

import { db } from '../../../src/db/index.js'

// Acceder a los mocks a través del módulo mockeado
const mockFrom = ((supabase as unknown) as Record<string, jest.Mock>).__mockFrom;
const mockInsert = ((supabase as unknown) as Record<string, jest.Mock>).__mockInsert

beforeEach(async () => {
  jest.clearAllMocks()
  await db.delete()
  await db.open()
})

afterAll(async () => {
  await db.delete()
})

// ═══════════════════════════════════════════════════════════════════════════════
// DETECCIÓN DE DATOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Detección de datos locales', () => {
  test('retorna false cuando no hay datos locales', async () => {
    const result = await detectLocalData()
    expect(result.hasData).toBe(false)
    expect(result.counts.incomes).toBe(0)
    expect(result.counts.expenses).toBe(0)
    expect(result.counts.categories).toBe(0)
  })

  test('retorna true cuando hay ingresos en IndexedDB', async () => {
    await db.incomes.add({
      amount: 30000, description: 'Sueldo', date: '2025-01-15',
      categoryId: 1, regime: 'salaried', type: 'income',
    })
    const result = await detectLocalData()
    expect(result.hasData).toBe(true)
    expect(result.counts.incomes).toBe(1)
  })

  test('retorna true cuando hay egresos en IndexedDB', async () => {
    await db.expenses.add({
      amount: 5000, description: 'Renta', date: '2025-01-15',
      categoryId: 2, type: 'expense',
    })
    const result = await detectLocalData()
    expect(result.hasData).toBe(true)
    expect(result.counts.expenses).toBe(1)
  })

  test('cuenta categorías personalizadas (no las default)', async () => {
    await db.categories.add({ name: 'Freelance', kind: 'income', isDefault: 0, color: '#00ff00', icon: '💼' })
    await db.categories.add({ name: 'Alimentación', kind: 'expense', isDefault: 1, color: '#ff0000', icon: '🍔' })
    const result = await detectLocalData()
    expect(result.hasData).toBe(true)
    expect(result.counts.categories).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTACIÓN DE DATOS LOCALES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Exportación de datos locales', () => {
  test('exporta todos los datos de las tablas principales', async () => {
    await db.incomes.add({ amount: 30000, description: 'Sueldo', date: '2025-01-15', categoryId: 1, regime: 'salaried', type: 'income' })
    await db.expenses.add({ amount: 5000, description: 'Renta', date: '2025-01-15', categoryId: 2, type: 'expense' })

    const data = await exportLocalData()
    expect(data.incomes).toHaveLength(1)
    expect(data.expenses).toHaveLength(1)
    expect(data.incomes[0].amount).toBe(30000)
    expect(data.expenses[0].amount).toBe(5000)
  })

  test('exporta vacío cuando no hay datos', async () => {
    const data = await exportLocalData()
    expect(data.incomes).toHaveLength(0)
    expect(data.expenses).toHaveLength(0)
    expect(data.categories).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SUBIDA A SUPABASE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Subida a Supabase (uploadToSupabase)', () => {
  test('sube ingresos y egresos a las tablas correspondientes', async () => {
    mockInsert.mockResolvedValue({ data: [], error: null })
    const localData = {
      incomes: [{ amount: 30000, description: 'Sueldo' }],
      expenses: [{ amount: 5000, description: 'Renta' }],
      categories: [],
    }
    const result = await uploadToSupabase(localData, 'user-1')
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
    expect(mockFrom).toHaveBeenCalledWith('incomes')
    expect(mockFrom).toHaveBeenCalledWith('expenses')
  })

  test('agrega user_id a cada registro antes de subir', async () => {
    mockInsert.mockResolvedValue({ data: [], error: null })
    const localData = { incomes: [{ amount: 30000 }], expenses: [], categories: [] }
    await uploadToSupabase(localData, 'user-123')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ user_id: 'user-123' }),
      ]),
    )
  })

  test('error en la subida retorna el error', async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: 'Row level security violation' } })
    const localData = { incomes: [{ amount: 30000 }], expenses: [], categories: [] }
    const result = await uploadToSupabase(localData, 'user-1')
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  })

  test('datos vacíos: retorna éxito sin hacer llamadas', async () => {
    const result = await uploadToSupabase({ incomes: [], expenses: [], categories: [] }, 'user-1')
    expect(result.success).toBe(true)
    expect(mockFrom).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MIGRACIÓN COMPLETA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Migración completa local → nube', () => {
  test('flujo completo: detecta, exporta y sube datos', async () => {
    await db.incomes.add({ amount: 50000, description: 'Proyecto', date: '2025-02-01', categoryId: 1, regime: 'resico', type: 'income' })
    mockInsert.mockResolvedValue({ data: [], error: null })
    const result = await migrateLocalToCloud('user-1')
    expect(result.success).toBe(true)
    expect(result.migrated.incomes).toBe(1)
    expect(result.migrated.expenses).toBe(0)
  })

  test('sin datos locales: retorna éxito con 0 migrados', async () => {
    const result = await migrateLocalToCloud('user-1')
    expect(result.success).toBe(true)
    expect(result.migrated.incomes).toBe(0)
    expect(result.migrated.expenses).toBe(0)
    expect(result.migrated.categories).toBe(0)
  })

  test('error durante subida: retorna error con detalle', async () => {
    await db.incomes.add({ amount: 10000, description: 'Test', date: '2025-03-01', categoryId: 1, regime: 'salaried', type: 'income' })
    mockInsert.mockResolvedValue({ data: null, error: { message: 'Network error' } })
    const result = await migrateLocalToCloud('user-1')
    expect(result.success).toBe(false)
    expect(result.error).toContain('Network error')
  })
})
