/**
 * Recordatorios fiscales para notificaciones PWA.
 *
 * Tipos de alerta:
 *  1. Declaración provisional ISR — vence el día 17 de cada mes (art. 96 / 113-E LISR)
 *     Se notifica los días 15, 16 y 17
 *  2. Umbral RESICO — alerta cuando el ingreso acumulado anual supera el 80%
 *     del límite de $3,500,000 (art. 113-G LISR)
 *
 * Todas las funciones son puras — reciben la fecha como parámetro para testabilidad.
 */

// ── Constantes ───────────────────────────────────────────────────────────────

/** Día límite de declaración provisional (art. 96 LISR) */
const FISCAL_DEADLINE_DAY = 17

/** Días de antelación para notificar (15, 16, 17) */
const REMINDER_DAYS = [15, 16, 17]

/** Límite anual RESICO (art. 113-E LISR) */
const RESICO_LIMIT = 3_500_000

/** Porcentaje de alerta (80% del límite) */
const RESICO_ALERT_THRESHOLD = 0.80

// ── Declaración provisional ──────────────────────────────────────────────────

/**
 * Determina si hoy corresponde enviar un recordatorio fiscal.
 * Se notifica los días 15, 16 y 17 de cada mes.
 *
 * @param date - Fecha actual (inyectable para tests)
 */
export function shouldSendFiscalReminder(date: Date): boolean {
  return REMINDER_DAYS.includes(date.getDate())
}

/**
 * Genera el mensaje de recordatorio fiscal según el día del mes.
 *
 * @param date - Fecha actual
 * @returns Mensaje localizado en español
 */
export function getFiscalReminderMessage(date: Date): string {
  const day = date.getDate()
  const daysLeft = FISCAL_DEADLINE_DAY - day

  if (daysLeft === 0) {
    return '⚠️ Tu declaración provisional de ISR vence hoy (día 17). ¡Preséntala antes de las 11:59 PM!'
  }
  if (daysLeft === 1) {
    return '📅 Tu declaración provisional de ISR vence mañana (día 17). Tienes 1 día para presentarla.'
  }
  return `📅 Tu declaración provisional de ISR vence en ${daysLeft} días (día 17). ¡No lo dejes al último!`
}

// ── Umbral RESICO ────────────────────────────────────────────────────────────

/**
 * Determina si se debe enviar una alerta de umbral RESICO.
 * Se alerta cuando el ingreso acumulado anual supera el 80% del límite ($2,800,000).
 *
 * Referencia: art. 113-G LISR — causas de salida del régimen
 *
 * @param accumulatedIncome - Ingreso anual acumulado en RESICO
 */
export function shouldSendResicoAlert(accumulatedIncome: number): boolean {
  return accumulatedIncome >= RESICO_LIMIT * RESICO_ALERT_THRESHOLD
}

/**
 * Genera el mensaje de alerta RESICO con el monto formateado.
 *
 * @param accumulatedIncome - Ingreso anual acumulado
 */
export function getResicoAlertMessage(accumulatedIncome: number): string {
  const formatted = accumulatedIncome.toLocaleString('es-MX')
  const percentage = ((accumulatedIncome / RESICO_LIMIT) * 100).toFixed(1)
  return `🚨 Tu ingreso RESICO acumulado es de $${formatted} (${percentage}% del límite). Si superas $3,500,000 deberás cambiar de régimen.`
}
