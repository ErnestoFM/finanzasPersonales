/**
 * Lógica pura de multi-moneda: MXN y USD.
 *
 * Funciones:
 *  - convertCurrency:          conversión entre MXN y USD
 *  - formatCurrency:           formato localizado de moneda
 *  - isValidExchangeRate:      validación de tipo de cambio
 *  - getEffectiveRate:         prioridad: remoto → local → default (offline-first)
 *  - convertMovementsToBase:   conversión en lote para reportes
 *
 * Tipo de cambio:
 *  - Se obtiene de la API de Banxico cuando hay conexión
 *  - Si está offline, usa el último valor guardado en IndexedDB
 *  - Si nunca se ha conectado, usa un default hardcoded conservador
 *
 * Todas las funciones son puras — sin side effects, sin dependencia de DB ni red.
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type Currency = 'MXN' | 'USD'

export interface ExchangeRate {
  /** Tipo de cambio: cuántos MXN vale 1 USD */
  usdToMxn: number
  /** Última actualización (ISO timestamp) */
  lastUpdated: string
  /** Fuente: 'banxico' | 'local' | 'default' */
  source: string
}

export interface CurrencyMovement {
  id: number
  amount: number
  currency: Currency
}

export interface ConvertedMovement {
  id: number
  originalAmount: number
  originalCurrency: Currency
  convertedAmount: number
  targetCurrency: Currency
}

// ── Constantes ───────────────────────────────────────────────────────────────

/**
 * Tipo de cambio de emergencia.
 * Solo se usa si no hay dato remoto ni local.
 * Valor conservador para no generar cálculos descabellados.
 */
const DEFAULT_RATE: ExchangeRate = {
  usdToMxn: 17.00,
  lastUpdated: '2025-01-01T00:00:00Z',
  source: 'default',
}

// ── Conversión ───────────────────────────────────────────────────────────────

/**
 * Convierte un monto entre MXN y USD.
 * Redondea a 2 decimales.
 *
 * @param amount - Monto en la moneda origen
 * @param from   - Moneda de origen
 * @param to     - Moneda destino
 * @param rate   - Tipo de cambio actual
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rate: ExchangeRate,
): number {
  if (from === to) return amount
  if (amount === 0) return 0

  if (from === 'USD' && to === 'MXN') {
    return Math.round(amount * rate.usdToMxn * 100) / 100
  }

  // MXN → USD
  return Math.round((amount / rate.usdToMxn) * 100) / 100
}

// ── Formato ──────────────────────────────────────────────────────────────────

/**
 * Formatea un monto en la moneda especificada.
 * Usa formato fijo: $X,XXX.XX + código de moneda.
 *
 * @param amount   - Monto numérico
 * @param currency - 'MXN' o 'USD'
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const absAmount = Math.abs(amount)
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${formatted} ${currency}`
}

// ── Validación ───────────────────────────────────────────────────────────────

/**
 * Valida que un tipo de cambio sea usable.
 * Debe ser positivo y tener un timestamp de actualización.
 */
export function isValidExchangeRate(rate: ExchangeRate): boolean {
  return rate.usdToMxn > 0 && rate.lastUpdated.length > 0
}

// ── Fallback offline ─────────────────────────────────────────────────────────

/**
 * Determina el tipo de cambio efectivo con prioridad cascading:
 *  1. Remoto (API de Banxico) — si está disponible y es válido
 *  2. Local (último guardado en IndexedDB) — si disponible
 *  3. Default hardcoded — último recurso
 *
 * REGLA: La app NUNCA falla por falta de tipo de cambio.
 *
 * @param remote  - Tipo de cambio de la API (puede ser null si offline)
 * @param local   - Último tipo de cambio guardado localmente (puede ser null)
 */
export function getEffectiveRate(
  remote: ExchangeRate | null,
  local: ExchangeRate | null,
): ExchangeRate {
  if (remote && isValidExchangeRate(remote)) return remote
  if (local && isValidExchangeRate(local)) return local
  return { ...DEFAULT_RATE }
}

// ── Conversión en lote ───────────────────────────────────────────────────────

/**
 * Convierte un array de movimientos a una moneda base.
 * Preserva la información original para trazabilidad.
 * Usado en reportes para consolidar montos en una sola moneda.
 *
 * @param movements    - Movimientos con moneda original
 * @param baseCurrency - Moneda destino para consolidación
 * @param rate         - Tipo de cambio
 */
export function convertMovementsToBase(
  movements: CurrencyMovement[],
  baseCurrency: Currency,
  rate: ExchangeRate,
): ConvertedMovement[] {
  return movements.map((m) => ({
    id: m.id,
    originalAmount: m.amount,
    originalCurrency: m.currency,
    convertedAmount: convertCurrency(m.amount, m.currency, baseCurrency, rate),
    targetCurrency: baseCurrency,
  }))
}
