/**
 * Tests de logs de auditoría — Fase 3, Feature 4.
 *
 * Cobertura de:
 *   - Creación de entradas de auditoría (CRUD)
 *   - Historial de cambios por registro
 *   - Recuperación de datos eliminados
 *   - Formateo para visualización
 *   - Validación de entradas
 *
 * Requisito: 100% de cobertura en /utils/audit
 */

import {
  createAuditEntry,
  filterAuditHistory,
  canRecoverRecord,
  buildRecoveryPayload,
  formatAuditEntry,
  getOperationLabel,
  type AuditEntry,
} from '../../../src/utils/audit/auditLog.ts'

// ═══════════════════════════════════════════════════════════════════════════════
// CREACIÓN DE ENTRADAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Creación de entradas de auditoría (createAuditEntry)', () => {
  test('crea una entrada con todos los campos requeridos', () => {
    const entry = createAuditEntry({
      operation: 'create',
      table: 'incomes',
      recordId: 1,
      newData: { amount: 30000, description: 'Sueldo' },
      deviceInfo: 'Chrome 120 / Windows',
    })

    expect(entry.operation).toBe('create')
    expect(entry.table).toBe('incomes')
    expect(entry.recordId).toBe(1)
    expect(entry.newData).toEqual({ amount: 30000, description: 'Sueldo' })
    expect(entry.deviceInfo).toBe('Chrome 120 / Windows')
    expect(entry.timestamp).toBeTruthy()
  })

  test('operación create: oldData es null', () => {
    const entry = createAuditEntry({
      operation: 'create',
      table: 'incomes',
      recordId: 1,
      newData: { amount: 30000 },
      deviceInfo: 'Mobile Safari',
    })

    expect(entry.oldData).toBeNull()
  })

  test('operación update: incluye oldData y newData', () => {
    const entry = createAuditEntry({
      operation: 'update',
      table: 'expenses',
      recordId: 5,
      oldData: { amount: 1000 },
      newData: { amount: 1500 },
      deviceInfo: 'Firefox / Linux',
    })

    expect(entry.oldData).toEqual({ amount: 1000 })
    expect(entry.newData).toEqual({ amount: 1500 })
  })

  test('operación delete: newData es null, oldData tiene el registro', () => {
    const entry = createAuditEntry({
      operation: 'delete',
      table: 'expenses',
      recordId: 3,
      oldData: { amount: 500, description: 'Taxi' },
      deviceInfo: 'PWA / Android',
    })

    expect(entry.oldData).toEqual({ amount: 500, description: 'Taxi' })
    expect(entry.newData).toBeNull()
  })

  test('timestamp se genera automáticamente en formato ISO', () => {
    const before = new Date().toISOString()
    const entry = createAuditEntry({
      operation: 'create',
      table: 'incomes',
      recordId: 1,
      newData: {},
      deviceInfo: 'Test',
    })
    const after = new Date().toISOString()

    expect(entry.timestamp >= before).toBe(true)
    expect(entry.timestamp <= after).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// HISTORIAL DE CAMBIOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Historial de cambios (filterAuditHistory)', () => {
  const entries: AuditEntry[] = [
    { operation: 'create', table: 'incomes', recordId: 1, oldData: null, newData: { amount: 30000 }, deviceInfo: 'Chrome', timestamp: '2025-01-01T10:00:00Z' },
    { operation: 'update', table: 'incomes', recordId: 1, oldData: { amount: 30000 }, newData: { amount: 35000 }, deviceInfo: 'Chrome', timestamp: '2025-01-02T10:00:00Z' },
    { operation: 'create', table: 'expenses', recordId: 2, oldData: null, newData: { amount: 500 }, deviceInfo: 'Safari', timestamp: '2025-01-01T11:00:00Z' },
    { operation: 'delete', table: 'incomes', recordId: 1, oldData: { amount: 35000 }, newData: null, deviceInfo: 'Chrome', timestamp: '2025-01-03T10:00:00Z' },
  ]

  test('filtra por tabla y recordId', () => {
    const history = filterAuditHistory(entries, 'incomes', 1)
    expect(history).toHaveLength(3) // create, update, delete
  })

  test('retorna en orden cronológico', () => {
    const history = filterAuditHistory(entries, 'incomes', 1)
    expect(history[0].operation).toBe('create')
    expect(history[1].operation).toBe('update')
    expect(history[2].operation).toBe('delete')
  })

  test('retorna vacío si no hay historial del registro', () => {
    const history = filterAuditHistory(entries, 'categories', 99)
    expect(history).toHaveLength(0)
  })

  test('filtra correctamente registros de diferentes tablas', () => {
    const history = filterAuditHistory(entries, 'expenses', 2)
    expect(history).toHaveLength(1)
    expect(history[0].operation).toBe('create')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RECUPERACIÓN DE DATOS ELIMINADOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Recuperación de datos eliminados', () => {
  test('canRecoverRecord retorna true si la última operación es delete', () => {
    const entry: AuditEntry = {
      operation: 'delete',
      table: 'expenses',
      recordId: 3,
      oldData: { amount: 500, description: 'Taxi' },
      newData: null,
      deviceInfo: 'Chrome',
      timestamp: '2025-01-03T10:00:00Z',
    }
    expect(canRecoverRecord(entry)).toBe(true)
  })

  test('canRecoverRecord retorna false si la operación no es delete', () => {
    const entry: AuditEntry = {
      operation: 'update',
      table: 'expenses',
      recordId: 3,
      oldData: { amount: 500 },
      newData: { amount: 600 },
      deviceInfo: 'Chrome',
      timestamp: '2025-01-03T10:00:00Z',
    }
    expect(canRecoverRecord(entry)).toBe(false)
  })

  test('canRecoverRecord retorna false si delete no tiene oldData', () => {
    const entry: AuditEntry = {
      operation: 'delete',
      table: 'expenses',
      recordId: 3,
      oldData: null,
      newData: null,
      deviceInfo: 'Chrome',
      timestamp: '2025-01-03T10:00:00Z',
    }
    expect(canRecoverRecord(entry)).toBe(false)
  })

  test('buildRecoveryPayload retorna los datos del registro eliminado', () => {
    const entry: AuditEntry = {
      operation: 'delete',
      table: 'expenses',
      recordId: 3,
      oldData: { amount: 500, description: 'Taxi', categoryId: 2 },
      newData: null,
      deviceInfo: 'Chrome',
      timestamp: '2025-01-03T10:00:00Z',
    }

    const payload = buildRecoveryPayload(entry)
    expect(payload).toEqual({ amount: 500, description: 'Taxi', categoryId: 2 })
  })

  test('buildRecoveryPayload retorna null si no se puede recuperar', () => {
    const entry: AuditEntry = {
      operation: 'update',
      table: 'expenses',
      recordId: 3,
      oldData: { amount: 500 },
      newData: { amount: 600 },
      deviceInfo: 'Chrome',
      timestamp: '2025-01-03T10:00:00Z',
    }

    expect(buildRecoveryPayload(entry)).toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FORMATEO PARA VISUALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Formateo para visualización', () => {
  test('formatAuditEntry genera resumen legible de create', () => {
    const entry: AuditEntry = {
      operation: 'create',
      table: 'incomes',
      recordId: 1,
      oldData: null,
      newData: { amount: 30000, description: 'Sueldo' },
      deviceInfo: 'Chrome 120 / Windows',
      timestamp: '2025-01-15T10:30:00Z',
    }

    const formatted = formatAuditEntry(entry)
    expect(formatted.summary).toContain('Creó')
    expect(formatted.summary).toContain('ingreso')
    expect(formatted.device).toBe('Chrome 120 / Windows')
    expect(formatted.date).toBeTruthy()
  })

  test('formatAuditEntry genera resumen legible de update', () => {
    const entry: AuditEntry = {
      operation: 'update',
      table: 'expenses',
      recordId: 5,
      oldData: { amount: 1000 },
      newData: { amount: 1500 },
      deviceInfo: 'Safari / iOS',
      timestamp: '2025-01-15T10:30:00Z',
    }

    const formatted = formatAuditEntry(entry)
    expect(formatted.summary).toContain('Actualizó')
    expect(formatted.summary).toContain('egreso')
  })

  test('formatAuditEntry genera resumen legible de delete', () => {
    const entry: AuditEntry = {
      operation: 'delete',
      table: 'categories',
      recordId: 3,
      oldData: { name: 'Viajes' },
      newData: null,
      deviceInfo: 'PWA / Android',
      timestamp: '2025-01-15T10:30:00Z',
    }

    const formatted = formatAuditEntry(entry)
    expect(formatted.summary).toContain('Eliminó')
    expect(formatted.summary).toContain('categoría')
    expect(formatted.recoverable).toBe(true)
  })

  test('getOperationLabel traduce operación a español', () => {
    expect(getOperationLabel('create')).toBe('Creó')
    expect(getOperationLabel('update')).toBe('Actualizó')
    expect(getOperationLabel('delete')).toBe('Eliminó')
  })

  test('getOperationLabel retorna el string original si la operación es desconocida', () => {
    expect(getOperationLabel('unknown_op')).toBe('unknown_op')
  })

  test('formatAuditEntry usa el nombre de tabla como fallback si no hay etiqueta', () => {
    const entry = {
      operation: 'create' as const,
      table: 'savings_goals' as unknown as 'incomes',
      recordId: 1,
      oldData: null,
      newData: { name: 'Meta test' },
      deviceInfo: 'Chrome',
      timestamp: '2025-01-15T10:30:00Z',
    }

    const formatted = formatAuditEntry(entry)
    expect(formatted.summary).toContain('savings_goals')
  })
})
