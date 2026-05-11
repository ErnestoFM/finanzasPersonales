/**
 * Detector de déficit y cálculo de tiempo de recuperación.
 * Analiza una proyección mensual para determinar:
 *  - En qué mes el balance cae bajo 0 (déficit)
 *  - En qué mes se recupera (balance vuelve a ser >= 0)
 *  - Cuántos meses toma la recuperación
 */

import type { MonthSnapshot } from './monthlyProjection.ts'

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface DeficitResult {
  /** Mes en que el balance cae bajo 0, o null si nunca */
  deficitMonth: number | null
  /** Mes en que se recupera (balance >= 0), o null si no se recupera */
  recoveryMonth: number | null
  /** Número de meses desde el déficit hasta la recuperación, o null */
  recoveryTime: number | null
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Detecta el primer mes con déficit y cuándo se recupera.
 *
 * @param projection - Array de snapshots mensuales de projectMonthly
 * @returns Resultado con mes de déficit, recuperación y tiempo
 */
export function detectDeficit(projection: MonthSnapshot[]): DeficitResult {
  let deficitMonth: number | null = null
  let recoveryMonth: number | null = null

  for (const snap of projection) {
    // Detectar primer mes en déficit
    if (deficitMonth === null && snap.endBalance < 0) {
      deficitMonth = snap.month
    }

    // Detectar recuperación (después del déficit)
    if (deficitMonth !== null && recoveryMonth === null && snap.endBalance >= 0 && snap.month > deficitMonth) {
      recoveryMonth = snap.month
    }
  }

  const recoveryTime = deficitMonth !== null && recoveryMonth !== null
    ? recoveryMonth - deficitMonth
    : null

  return { deficitMonth, recoveryMonth, recoveryTime }
}
