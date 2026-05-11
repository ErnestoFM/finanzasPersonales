/**
 * Detección de estado de conexión online/offline.
 * Usa navigator.onLine como indicador primario y eventos online/offline
 * del browser para notificaciones reactivas.
 *
 * REGLA: Este módulo es informativo — la app funciona 100% offline.
 * Solo se usa para decidir cuándo intentar sincronizar.
 */

// ── Detección ────────────────────────────────────────────────────────────────

/**
 * Retorna true si el navegador reporta conexión a internet.
 * Nota: navigator.onLine solo indica si hay conexión de red,
 * no garantiza que Supabase sea alcanzable.
 */
export function isOnline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return navigator.onLine
  }
  // En entornos sin navigator (tests, SSR), asumir offline
  return false
}

// ── Listener reactivo ────────────────────────────────────────────────────────

type ConnectionCallback = (online: boolean) => void

/**
 * Registra un callback que se invoca cuando cambia el estado de conexión.
 * Retorna una función para desuscribirse.
 *
 * @param callback - Se invoca con true (online) o false (offline)
 * @returns Función de limpieza (unsubscribe)
 */
export function onConnectionChange(callback: ConnectionCallback): () => void {
  if (typeof window === 'undefined') {
    return () => {} // No-op en entornos sin window (tests, SSR)
  }

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
