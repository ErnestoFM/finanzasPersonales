/**
 * Sistema de alertas para acumulado anual de ingresos RESICO.
 * Referencia legal: art. 113-E y 113-G LISR
 *
 * El contribuyente en RESICO debe salir del régimen si sus ingresos
 * anuales superan $3,500,000 MXN (art. 113-G LISR).
 *
 * Niveles de alerta:
 *  - Verde:    < 80% del límite (< $2,800,000)
 *  - Amarillo: 80–95% ($2,800,000 – $3,325,000)
 *  - Rojo:     95–100% ($3,325,000 – $3,500,000)
 *  - Crítico:  > 100% (> $3,500,000) — obligado a salir del régimen
 */

// ── Constantes ───────────────────────────────────────────────────────────────

/** Límite anual de ingresos para permanecer en RESICO (art. 113-E LISR) */
export const RESICO_ANNUAL_LIMIT = 3_500_000

/** Umbral de alerta amarilla: 80% del límite */
const YELLOW_THRESHOLD = 0.80

/** Umbral de alerta roja: 95% del límite */
const RED_THRESHOLD = 0.95

// ── Tipos ────────────────────────────────────────────────────────────────────

export const ResicoAlertLevel = {
  Green:    'green',
  Yellow:   'yellow',
  Red:      'red',
  Critical: 'critical',
} as const

export type ResicoAlertLevelValue = typeof ResicoAlertLevel[keyof typeof ResicoAlertLevel]

export interface ResicoAlert {
  /** Nivel de alerta: green, yellow, red, critical */
  level: ResicoAlertLevelValue
  /** Porcentaje del límite consumido (0–100+) */
  percentage: number
  /** Mensaje descriptivo para el usuario */
  message: string
}

// ── Función principal ────────────────────────────────────────────────────────

/**
 * Evalúa el nivel de alerta RESICO según el acumulado anual de ingresos.
 *
 * @param annualIncome - Total de ingresos RESICO acumulados en el ejercicio
 * @returns Alerta con nivel, porcentaje y mensaje
 */
export function getResicoAlert(annualIncome: number): ResicoAlert {
  const percentage = (annualIncome / RESICO_ANNUAL_LIMIT) * 100

  // > 100%: rebasó el límite — debe salir del régimen (art. 113-G LISR)
  if (annualIncome > RESICO_ANNUAL_LIMIT) {
    return {
      level: ResicoAlertLevel.Critical,
      percentage,
      message: `Rebasaste el límite RESICO de $3,500,000. Debes salir del régimen (art. 113-G LISR). Acumulado: $${annualIncome.toLocaleString('es-MX')}.`,
    }
  }

  // 95–100%: zona roja — muy cerca del límite
  if (percentage >= RED_THRESHOLD * 100) {
    return {
      level: ResicoAlertLevel.Red,
      percentage,
      message: `Estás al ${percentage.toFixed(1)}% del límite RESICO ($3,500,000). Considera frenar ingresos en este régimen para no exceder el límite.`,
    }
  }

  // 80–95%: zona amarilla — precaución
  if (percentage >= YELLOW_THRESHOLD * 100) {
    return {
      level: ResicoAlertLevel.Yellow,
      percentage,
      message: `Llevas ${percentage.toFixed(1)}% del límite RESICO ($3,500,000). Vigila tus ingresos restantes del ejercicio.`,
    }
  }

  // < 80%: zona verde — sin riesgo
  return {
    level: ResicoAlertLevel.Green,
    percentage,
    message: annualIncome > 0
      ? `Vas al ${percentage.toFixed(1)}% del límite RESICO. Sin riesgo.`
      : 'Sin ingresos RESICO registrados.',
  }
}
