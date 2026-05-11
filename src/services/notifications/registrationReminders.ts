/**
 * Recordatorios de registro de gastos.
 * Motiva al usuario a registrar sus movimientos diarios.
 *
 * Lógica:
 *  - Si no ha registrado ningún gasto/ingreso hoy → enviar recordatorio
 *  - Si nunca ha registrado → enviar recordatorio
 *  - Si ya registró hoy → no molestar
 *
 * Todas las funciones son puras — fechas inyectadas para testabilidad.
 */

// ── Mensajes motivacionales ──────────────────────────────────────────────────

const MESSAGES = [
  {
    title: '💰 ¿Ya registraste tus gastos?',
    body: 'Registrar tus movimientos diarios te ayuda a tomar mejores decisiones financieras. ¡Solo toma 1 minuto!',
  },
  {
    title: '📊 Tu salud financiera importa',
    body: 'Los que registran sus gastos diario ahorran hasta un 20% más. ¿Ya anotaste los de hoy?',
  },
  {
    title: '🎯 Mantén el hábito',
    body: 'Un gasto no registrado es un gasto invisible. Abre Caudal y anota tus movimientos del día.',
  },
]

// ── Funciones ────────────────────────────────────────────────────────────────

/**
 * Determina si se debe enviar un recordatorio de registro.
 *
 * @param lastRegistration - Fecha del último registro, o null si nunca
 * @param now              - Fecha actual (inyectable para tests)
 * @returns true si no ha registrado hoy
 */
export function shouldSendRegistrationReminder(
  lastRegistration: Date | null,
  now: Date,
): boolean {
  if (lastRegistration === null) return true

  // Comparar solo la fecha (sin hora)
  const lastDay = new Date(lastRegistration.getFullYear(), lastRegistration.getMonth(), lastRegistration.getDate())
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return lastDay.getTime() < today.getTime()
}

/**
 * Retorna un mensaje motivacional aleatorio para el recordatorio.
 * Usa un índice basado en el día del mes para variedad sin true randomness.
 */
export function getRegistrationReminderMessage(): { title: string; body: string } {
  const dayOfMonth = new Date().getDate()
  const index = dayOfMonth % MESSAGES.length
  return MESSAGES[index]
}
