/**
 * Lógica pura de logs de auditoría.
 *
 * Registra cada operación CRUD con:
 *  - Qué cambió (oldData → newData)
 *  - Cuándo (timestamp ISO)
 *  - Desde qué dispositivo (deviceInfo)
 *
 * Permite:
 *  - Ver historial de cambios de cualquier registro
 *  - Recuperar datos eliminados accidentalmente
 *
 * Los logs se almacenan en IndexedDB y se sincronizan a Supabase
 * con la misma cola offline que los demás datos.
 *
 * Todas las funciones son puras — sin side effects, sin dependencia de DB.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type AuditOperation = 'create' | 'update' | 'delete'
export type AuditTable = 'incomes' | 'expenses' | 'categories'

export interface AuditEntry {
  operation: AuditOperation
  table: AuditTable
  recordId: number
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  deviceInfo: string
  timestamp: string
}

export interface AuditEntryInput {
  operation: AuditOperation
  table: AuditTable
  recordId: number
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  deviceInfo: string
}

export interface FormattedAuditEntry {
  summary: string
  device: string
  date: string
  recoverable: boolean
}

// ── Constantes ───────────────────────────────────────────────────────────────

const OPERATION_LABELS: Record<AuditOperation, string> = {
  create: 'Creó',
  update: 'Actualizó',
  delete: 'Eliminó',
}

const TABLE_LABELS: Record<AuditTable, string> = {
  incomes: 'ingreso',
  expenses: 'egreso',
  categories: 'categoría',
}

// ── Creación de entradas ─────────────────────────────────────────────────────

/**
 * Crea una entrada de auditoría con timestamp automático.
 *
 * Convenciones:
 *  - create: oldData = null, newData = datos del registro creado
 *  - update: oldData = antes, newData = después
 *  - delete: oldData = datos del registro eliminado, newData = null
 */
export function createAuditEntry(input: AuditEntryInput): AuditEntry {
  return {
    operation: input.operation,
    table: input.table,
    recordId: input.recordId,
    oldData: input.oldData ?? null,
    newData: input.newData ?? null,
    deviceInfo: input.deviceInfo,
    timestamp: new Date().toISOString(),
  }
}

// ── Historial de cambios ─────────────────────────────────────────────────────

/**
 * Filtra las entradas de auditoría por tabla y recordId.
 * Retorna en orden cronológico (más antiguo primero).
 *
 * @param entries  - Todas las entradas de auditoría
 * @param table    - Tabla del registro
 * @param recordId - ID del registro
 */
export function filterAuditHistory(
  entries: AuditEntry[],
  table: string,
  recordId: number,
): AuditEntry[] {
  return entries
    .filter((e) => e.table === table && e.recordId === recordId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// ── Recuperación de datos eliminados ─────────────────────────────────────────

/**
 * Determina si un registro puede recuperarse a partir de su entrada de auditoría.
 * Solo se puede recuperar si:
 *  1. La operación fue 'delete'
 *  2. oldData contiene los datos del registro
 */
export function canRecoverRecord(entry: AuditEntry): boolean {
  return entry.operation === 'delete' && entry.oldData !== null
}

/**
 * Construye el payload para recrear un registro eliminado.
 * Retorna los datos originales (oldData del delete), o null si no es recuperable.
 */
export function buildRecoveryPayload(entry: AuditEntry): Record<string, unknown> | null {
  if (!canRecoverRecord(entry)) return null
  return { ...entry.oldData }
}

// ── Formateo para UI ─────────────────────────────────────────────────────────

/**
 * Retorna la etiqueta en español para una operación CRUD.
 */
export function getOperationLabel(operation: string): string {
  return OPERATION_LABELS[operation as AuditOperation] || operation
}

/**
 * Formatea una entrada de auditoría para mostrar en la UI.
 * Genera un resumen legible en español.
 */
export function formatAuditEntry(entry: AuditEntry): FormattedAuditEntry {
  const operationLabel = getOperationLabel(entry.operation)
  const tableLabel = TABLE_LABELS[entry.table] || entry.table

  return {
    summary: `${operationLabel} un ${tableLabel} (#${entry.recordId})`,
    device: entry.deviceInfo,
    date: entry.timestamp,
    recoverable: canRecoverRecord(entry),
  }
}
