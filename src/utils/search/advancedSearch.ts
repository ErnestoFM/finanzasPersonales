/**
 * Lógica pura de búsqueda avanzada de movimientos.
 *
 * Funciones:
 *  - filterByDescription:  búsqueda por texto (substring, case-insensitive)
 *  - filterByCategory:     filtro por categoría exacta
 *  - filterByAmountRange:  filtro por rango de montos (inclusivo)
 *  - filterByDateRange:    filtro por rango de fechas (inclusivo)
 *  - searchMovements:      combina todos los filtros (AND lógico)
 *  - groupByDate:          agrupa movimientos por día (vista calendario)
 *
 * Todas las funciones son puras — sin side effects, sin dependencia de DB.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface SearchableMovement {
  id: number
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
}

export interface SearchFilters {
  description?: string
  category?: string
  amountMin?: number
  amountMax?: number
  dateFrom?: string
  dateTo?: string
}

export type GroupedMovements = Record<string, SearchableMovement[]>

// ── Filtros individuales ─────────────────────────────────────────────────────

/**
 * Filtra movimientos por texto en la descripción.
 * Búsqueda parcial (substring) y case-insensitive.
 * Texto vacío = sin filtro (retorna todos).
 */
export function filterByDescription(
  movements: SearchableMovement[],
  query: string,
): SearchableMovement[] {
  if (!query || query.trim() === '') return movements
  const lower = query.toLowerCase()
  return movements.filter((m) => m.description.toLowerCase().includes(lower))
}

/**
 * Filtra movimientos por categoría exacta.
 * Categoría vacía = sin filtro (retorna todos).
 */
export function filterByCategory(
  movements: SearchableMovement[],
  category: string,
): SearchableMovement[] {
  if (!category || category.trim() === '') return movements
  return movements.filter((m) => m.category === category)
}

/**
 * Filtra movimientos por rango de montos (inclusivo en ambos extremos).
 * undefined = sin límite en ese extremo.
 */
export function filterByAmountRange(
  movements: SearchableMovement[],
  min: number | undefined,
  max: number | undefined,
): SearchableMovement[] {
  return movements.filter((m) => {
    if (min !== undefined && m.amount < min) return false
    if (max !== undefined && m.amount > max) return false
    return true
  })
}

/**
 * Filtra movimientos por rango de fechas (inclusivo, comparación lexicográfica ISO).
 * undefined = sin límite en ese extremo.
 */
export function filterByDateRange(
  movements: SearchableMovement[],
  from: string | undefined,
  to: string | undefined,
): SearchableMovement[] {
  return movements.filter((m) => {
    if (from && m.date < from) return false
    if (to && m.date > to) return false
    return true
  })
}

// ── Búsqueda combinada ───────────────────────────────────────────────────────

/**
 * Aplica todos los filtros de forma combinada (AND lógico).
 * Los filtros no definidos se ignoran.
 * Orden de aplicación: descripción → categoría → monto → fecha.
 */
export function searchMovements(
  movements: SearchableMovement[],
  filters: SearchFilters,
): SearchableMovement[] {
  let results = movements

  if (filters.description) {
    results = filterByDescription(results, filters.description)
  }

  if (filters.category) {
    results = filterByCategory(results, filters.category)
  }

  if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
    results = filterByAmountRange(results, filters.amountMin, filters.amountMax)
  }

  if (filters.dateFrom || filters.dateTo) {
    results = filterByDateRange(results, filters.dateFrom, filters.dateTo)
  }

  return results
}

// ── Vista de calendario ──────────────────────────────────────────────────────

/**
 * Agrupa movimientos por fecha para la vista de calendario.
 * Retorna un objeto donde la key es la fecha ISO y el value es el array de movimientos.
 */
export function groupByDate(movements: SearchableMovement[]): GroupedMovements {
  const grouped: GroupedMovements = {}

  for (const movement of movements) {
    if (!grouped[movement.date]) {
      grouped[movement.date] = []
    }
    grouped[movement.date].push(movement)
  }

  return grouped
}
