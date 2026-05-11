/**
 * Declaración de tipos para la base de datos Dexie (IndexedDB).
 * Extiende la clase base de Dexie con las tablas específicas de Caudal.
 *
 * Esto resuelve el error TS2339: "Property 'X' does not exist on type 'Dexie'"
 * que aparece al usar db.incomes, db.expenses, etc. desde archivos TypeScript.
 */

import Dexie, { type Table } from 'dexie'

// ── Interfaces de cada registro ──────────────────────────────────────────────

export interface Income {
  id?: number
  amount: number
  description: string
  date: string
  categoryId: number
  regime: 'salaried' | 'resico'
  type: 'income'
}

export interface Expense {
  id?: number
  amount: number
  description: string
  date: string
  categoryId: number
  type: 'expense'
}

export interface Category {
  id?: number
  name: string
  kind: 'income' | 'expense'
  isDefault: number
  color: string
  icon: string
}

export interface Setting {
  key: string
  value: unknown
}

export interface SyncQueueEntry {
  id?: number
  table: 'incomes' | 'expenses' | 'categories'
  operation: 'create' | 'update' | 'delete'
  recordId: number
  payload: Record<string, unknown>
  timestamp: string
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
}

// ── Extensión tipada de Dexie ────────────────────────────────────────────────

export interface CaudalDatabase extends Dexie {
  incomes: Table<Income, number>
  expenses: Table<Expense, number>
  categories: Table<Category, number>
  settings: Table<Setting, string>
  syncQueue: Table<SyncQueueEntry, number>
}

export declare const db: CaudalDatabase
export declare const resetDatabase: () => Promise<void>
