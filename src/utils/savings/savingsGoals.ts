/**
 * Lógica pura de metas de ahorro.
 *
 * Funciones:
 *  - calculateProgress:      % de avance hacia la meta
 *  - projectCompletionDate:  fecha estimada de cumplimiento
 *  - monthsRemaining:        meses restantes para alcanzar la meta
 *  - addContribution:        registrar un aporte y recalcular progreso
 *  - isGoalReached:          ¿se alcanzó la meta?
 *  - validateGoal:           validación de datos de entrada
 *
 * Todas las funciones son puras — sin side effects, sin dependencia de DB.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface SavingsGoal {
  /** Nombre descriptivo de la meta */
  name: string
  /** Monto objetivo en MXN */
  targetAmount: number
  /** Monto ahorrado actualmente */
  currentAmount: number
  /** Aporte mensual planeado */
  monthlyContribution: number
  /** Fecha límite (ISO string) */
  deadline: string
  /** Fecha de creación (ISO string) */
  createdAt: string
}

export interface ContributionResult {
  newAmount: number
  progress: number
  reached: boolean
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

// ── Progreso ─────────────────────────────────────────────────────────────────

/**
 * Calcula el porcentaje de progreso hacia la meta.
 * Retorna un valor entre 0 y 100.
 *
 * @param currentAmount - Monto ahorrado actualmente
 * @param targetAmount  - Monto objetivo
 */
export function calculateProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 100 // Meta vacía = ya cumplida
  const progress = (currentAmount / targetAmount) * 100
  return Math.min(progress, 100)
}

// ── Proyección ───────────────────────────────────────────────────────────────

/**
 * Proyecta la fecha en que se alcanzará la meta con aportes mensuales constantes.
 *
 * @param currentAmount       - Monto ahorrado actualmente
 * @param targetAmount        - Monto objetivo
 * @param monthlyContribution - Aporte mensual
 * @param startDate           - Fecha desde la que se proyecta
 * @returns Fecha estimada, o null si es imposible (aporte 0 o negativo)
 */
export function projectCompletionDate(
  currentAmount: number,
  targetAmount: number,
  monthlyContribution: number,
  startDate: Date,
): Date | null {
  // Meta ya alcanzada → la fecha es ahora
  if (currentAmount >= targetAmount) return new Date(startDate)

  // Imposible alcanzar sin aportes positivos
  if (monthlyContribution <= 0) return null

  const remaining = targetAmount - currentAmount
  const months = Math.ceil(remaining / monthlyContribution)

  const completionDate = new Date(startDate)
  completionDate.setMonth(completionDate.getMonth() + months)
  return completionDate
}

/**
 * Calcula cuántos meses faltan para alcanzar la meta.
 *
 * @returns Número de meses (redondeado arriba), 0 si ya alcanzada, null si imposible
 */
export function monthsRemaining(
  currentAmount: number,
  targetAmount: number,
  monthlyContribution: number,
): number | null {
  if (currentAmount >= targetAmount) return 0
  if (monthlyContribution <= 0) return null

  const remaining = targetAmount - currentAmount
  return Math.ceil(remaining / monthlyContribution)
}

// ── Aportes ──────────────────────────────────────────────────────────────────

/**
 * Registra un aporte a la meta y recalcula el progreso.
 *
 * @param currentAmount - Monto actual antes del aporte
 * @param contribution  - Monto del aporte
 * @param targetAmount  - Monto objetivo de la meta
 */
export function addContribution(
  currentAmount: number,
  contribution: number,
  targetAmount: number,
): ContributionResult {
  const newAmount = currentAmount + contribution
  return {
    newAmount,
    progress: calculateProgress(newAmount, targetAmount),
    reached: isGoalReached(newAmount, targetAmount),
  }
}

// ── Detección de meta alcanzada ──────────────────────────────────────────────

/**
 * Determina si la meta ha sido alcanzada.
 */
export function isGoalReached(currentAmount: number, targetAmount: number): boolean {
  return currentAmount >= targetAmount
}

// ── Validación ───────────────────────────────────────────────────────────────

/**
 * Valida los datos de una meta de ahorro.
 * Retorna un objeto con valid (boolean) y un array de errores descriptivos.
 */
export function validateGoal(goal: SavingsGoal): ValidationResult {
  const errors: string[] = []

  if (!goal.name || goal.name.trim() === '') {
    errors.push('El nombre es obligatorio')
  }

  if (goal.targetAmount <= 0) {
    errors.push('El monto objetivo debe ser mayor a 0')
  }

  if (goal.monthlyContribution < 0) {
    errors.push('El aporte mensual no puede ser negativo')
  }

  if (!goal.deadline || goal.deadline.trim() === '') {
    errors.push('La fecha límite es obligatoria')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
