/**
 * Lógica de exportación de reportes financieros.
 *
 * Genera datos estructurados para exportar a:
 *  - Excel (.xlsx) — via SheetJS en la capa de UI
 *  - CSV (.csv) — generación completa aquí
 *  - PDF — datos formateados, renderizado en la capa de UI
 *
 * Esta es una feature de PAGO protegida por featureGuard.
 * La lógica se construye completa pero se bloquea vía canExport()
 * que verifica el plan del usuario antes de generar.
 *
 * Funciones puras — sin side effects, sin dependencia de DB.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface ExportableMovement {
  date: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
}

export interface ExportableCategorySummary {
  category: string
  budgeted: number
  spent: number
  remaining: number
}

export interface ExportableFiscalSummary {
  totalIncome: number
  totalExpenses: number
  isrRetenido: number
  isrAnualEstimado: number
  saldoFavor: number
  regime: string
}

export type ExportRow = Array<string | number>

export interface ExportData {
  movements: ExportRow[]
  categorySummary: ExportRow[]
  fiscalSummary: ExportRow[]
}

export interface ExportPermission {
  allowed: boolean
  reason: string | null
  upgradeMessage: string | null
}

// ── Formato de movimientos ───────────────────────────────────────────────────

/**
 * Formatea movimientos para exportación tabular (Excel/CSV).
 * Primera fila = encabezados. Tipo se traduce a español.
 */
export function formatMovementsForExport(movements: ExportableMovement[]): ExportRow[] {
  const header: ExportRow = ['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto']
  const rows: ExportRow[] = movements.map((m) => [
    m.date,
    m.type === 'income' ? 'Ingreso' : 'Egreso',
    m.category,
    m.description,
    m.amount,
  ])

  return [header, ...rows]
}

// ── Resumen por categoría ────────────────────────────────────────────────────

/**
 * Formatea el resumen por categoría para exportación.
 * Incluye presupuesto, gastado y restante.
 */
export function formatCategorySummaryForExport(
  categories: ExportableCategorySummary[],
): ExportRow[] {
  const header: ExportRow = ['Categoría', 'Presupuesto', 'Gastado', 'Restante']
  const rows: ExportRow[] = categories.map((c) => [
    c.category,
    c.budgeted,
    c.spent,
    c.remaining,
  ])

  return [header, ...rows]
}

// ── Resumen fiscal ───────────────────────────────────────────────────────────

/**
 * Formatea el resumen fiscal como filas clave-valor.
 * Formato vertical para mejor legibilidad en reportes.
 */
export function formatFiscalSummaryForExport(
  fiscal: ExportableFiscalSummary,
): ExportRow[] {
  return [
    ['Concepto', 'Monto'],
    ['Ingreso total', fiscal.totalIncome],
    ['Gastos totales', fiscal.totalExpenses],
    ['ISR retenido', fiscal.isrRetenido],
    ['ISR anual estimado', fiscal.isrAnualEstimado],
    ['Saldo a favor/cargo', fiscal.saldoFavor],
    ['Régimen fiscal', fiscal.regime],
  ]
}

// ── Generación CSV ───────────────────────────────────────────────────────────

/**
 * Genera un string CSV válido a partir de un array de filas.
 * Escapa correctamente:
 *  - Valores con coma → entre comillas
 *  - Comillas dobles → duplicadas ("")
 *
 * @param rows - Array de filas, cada fila es un array de celdas
 */
export function generateCSV(rows: ExportRow[]): string {
  if (rows.length === 0) return ''

  return rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell)
          // Si contiene coma, comilla doble o salto de línea → escapar
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(','),
    )
    .join('\n')
}

// ── Datos completos de exportación ───────────────────────────────────────────

/**
 * Genera el objeto completo con los 3 conjuntos de datos para exportar.
 * Este es el punto de entrada principal para la UI de exportación.
 */
export function generateExportData(
  movements: ExportableMovement[],
  categories: ExportableCategorySummary[],
  fiscal: ExportableFiscalSummary,
): ExportData {
  return {
    movements: formatMovementsForExport(movements),
    categorySummary: formatCategorySummaryForExport(categories),
    fiscalSummary: formatFiscalSummaryForExport(fiscal),
  }
}

// ── Integración con featureGuard ─────────────────────────────────────────────

/**
 * Verifica si el usuario puede exportar reportes.
 * Solo el plan Pro tiene acceso a exportación.
 *
 * Si está bloqueado, retorna un mensaje amigable de upgrade
 * en lugar de un error brusco.
 *
 * @param plan - Plan actual del usuario ('free' | 'pro' | 'cancelled')
 */
export function canExport(plan: string): ExportPermission {
  if (plan === 'pro') {
    return { allowed: true, reason: null, upgradeMessage: null }
  }

  return {
    allowed: false,
    reason: 'La exportación de reportes requiere el plan Pro.',
    upgradeMessage:
      '📊 Para exportar tus datos a Excel, CSV o PDF, activa el plan Pro. ' +
      'Incluye reportes ilimitados, motor fiscal completo y más.',
  }
}
