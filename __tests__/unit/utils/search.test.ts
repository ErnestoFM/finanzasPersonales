/**
 * Tests de búsqueda avanzada — Fase 3, Feature 5.
 *
 * Cobertura de:
 *   - Búsqueda por descripción (texto parcial, case-insensitive)
 *   - Filtro por categoría
 *   - Filtro por rango de montos
 *   - Filtro por rango de fechas
 *   - Filtros combinables (AND lógico)
 *   - Vista de calendario (movimientos por día)
 *
 * Requisito: 100% de cobertura en /utils/search
 */

import {
  searchMovements,
  filterByDescription,
  filterByCategory,
  filterByAmountRange,
  filterByDateRange,
  groupByDate,
  type SearchableMovement,
  type SearchFilters,
} from '../../../src/utils/search/advancedSearch.ts'

// ── Datos de prueba ──────────────────────────────────────────────────────────

const movements: SearchableMovement[] = [
  { id: 1, date: '2025-01-05', type: 'income', category: 'Sueldo', description: 'Pago quincenal enero', amount: 15000 },
  { id: 2, date: '2025-01-10', type: 'expense', category: 'Alimentación', description: 'Súper semanal', amount: 2500 },
  { id: 3, date: '2025-01-15', type: 'income', category: 'Sueldo', description: 'Pago quincenal enero', amount: 15000 },
  { id: 4, date: '2025-01-18', type: 'expense', category: 'Transporte', description: 'Uber al trabajo', amount: 350 },
  { id: 5, date: '2025-01-20', type: 'expense', category: 'Alimentación', description: 'Restaurante con amigos', amount: 1200 },
  { id: 6, date: '2025-02-05', type: 'income', category: 'Freelance', description: 'Proyecto web cliente X', amount: 25000 },
  { id: 7, date: '2025-02-10', type: 'expense', category: 'Entretenimiento', description: 'Netflix y Spotify', amount: 450 },
]

// ═══════════════════════════════════════════════════════════════════════════════
// BÚSQUEDA POR DESCRIPCIÓN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Búsqueda por descripción (filterByDescription)', () => {
  test('busca texto parcial (substring)', () => {
    const result = filterByDescription(movements, 'quincenal')
    expect(result).toHaveLength(2)
  })

  test('búsqueda case-insensitive', () => {
    const result = filterByDescription(movements, 'UBER')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(4)
  })

  test('búsqueda sin resultados retorna array vacío', () => {
    const result = filterByDescription(movements, 'inexistente')
    expect(result).toHaveLength(0)
  })

  test('búsqueda vacía retorna todos los movimientos', () => {
    const result = filterByDescription(movements, '')
    expect(result).toHaveLength(movements.length)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FILTRO POR CATEGORÍA
// ═══════════════════════════════════════════════════════════════════════════════

describe('Filtro por categoría (filterByCategory)', () => {
  test('filtra por una categoría exacta', () => {
    const result = filterByCategory(movements, 'Alimentación')
    expect(result).toHaveLength(2)
  })

  test('categoría inexistente retorna vacío', () => {
    const result = filterByCategory(movements, 'Viajes')
    expect(result).toHaveLength(0)
  })

  test('categoría vacía retorna todos', () => {
    const result = filterByCategory(movements, '')
    expect(result).toHaveLength(movements.length)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FILTRO POR RANGO DE MONTOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Filtro por rango de montos (filterByAmountRange)', () => {
  test('filtra por monto mínimo', () => {
    const result = filterByAmountRange(movements, 10000, undefined)
    expect(result).toHaveLength(3) // 15k, 15k, 25k
  })

  test('filtra por monto máximo', () => {
    const result = filterByAmountRange(movements, undefined, 500)
    expect(result).toHaveLength(2) // 350, 450
  })

  test('filtra por rango min-max', () => {
    const result = filterByAmountRange(movements, 1000, 5000)
    expect(result).toHaveLength(2) // 2500, 1200
  })

  test('sin límites retorna todos', () => {
    const result = filterByAmountRange(movements, undefined, undefined)
    expect(result).toHaveLength(movements.length)
  })

  test('rango exacto incluye los extremos', () => {
    const result = filterByAmountRange(movements, 350, 350)
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(350)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FILTRO POR RANGO DE FECHAS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Filtro por rango de fechas (filterByDateRange)', () => {
  test('filtra por fecha inicio', () => {
    const result = filterByDateRange(movements, '2025-02-01', undefined)
    expect(result).toHaveLength(2) // feb 5, feb 10
  })

  test('filtra por fecha fin', () => {
    const result = filterByDateRange(movements, undefined, '2025-01-10')
    expect(result).toHaveLength(2) // ene 5, ene 10
  })

  test('filtra por rango completo', () => {
    const result = filterByDateRange(movements, '2025-01-10', '2025-01-18')
    expect(result).toHaveLength(3) // ene 10, 15, 18
  })

  test('sin fechas retorna todos', () => {
    const result = filterByDateRange(movements, undefined, undefined)
    expect(result).toHaveLength(movements.length)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FILTROS COMBINABLES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Búsqueda combinada (searchMovements)', () => {
  test('combina descripción + categoría', () => {
    const filters: SearchFilters = {
      description: 'semanal',
      category: 'Alimentación',
    }
    const result = searchMovements(movements, filters)
    expect(result).toHaveLength(1) // Súper semanal
  })

  test('combina categoría + rango de fechas', () => {
    const filters: SearchFilters = {
      category: 'Sueldo',
      dateFrom: '2025-01-10',
      dateTo: '2025-01-31',
    }
    const result = searchMovements(movements, filters)
    expect(result).toHaveLength(1) // Pago quincenal del 15
  })

  test('combina todos los filtros', () => {
    const filters: SearchFilters = {
      description: 'pago',
      category: 'Sueldo',
      amountMin: 10000,
      amountMax: 20000,
      dateFrom: '2025-01-01',
      dateTo: '2025-01-31',
    }
    const result = searchMovements(movements, filters)
    expect(result).toHaveLength(2) // Los dos pagos quincenales
  })

  test('sin filtros retorna todos', () => {
    const result = searchMovements(movements, {})
    expect(result).toHaveLength(movements.length)
  })

  test('filtros que no coinciden retorna vacío', () => {
    const filters: SearchFilters = {
      description: 'quincenal',
      category: 'Entretenimiento', // No hay quincenal en entretenimiento
    }
    const result = searchMovements(movements, filters)
    expect(result).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA DE CALENDARIO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Vista de calendario (groupByDate)', () => {
  test('agrupa movimientos por fecha', () => {
    const grouped = groupByDate(movements)
    expect(Object.keys(grouped)).toHaveLength(7) // 7 fechas distintas
  })

  test('fecha con múltiples movimientos los agrupa correctamente', () => {
    const testData: SearchableMovement[] = [
      { id: 1, date: '2025-01-15', type: 'income', category: 'A', description: 'x', amount: 100 },
      { id: 2, date: '2025-01-15', type: 'expense', category: 'B', description: 'y', amount: 50 },
    ]
    const grouped = groupByDate(testData)
    expect(grouped['2025-01-15']).toHaveLength(2)
  })

  test('array vacío retorna objeto vacío', () => {
    const grouped = groupByDate([])
    expect(Object.keys(grouped)).toHaveLength(0)
  })

  test('cada grupo contiene los movimientos correspondientes', () => {
    const grouped = groupByDate(movements)
    expect(grouped['2025-01-05'][0].description).toContain('quincenal')
    expect(grouped['2025-02-05'][0].category).toBe('Freelance')
  })
})
