/**
 * Servicio de notificaciones PWA.
 * Gestión de permisos y envío de notificaciones locales.
 *
 * Las notificaciones son 100% locales — no requieren servidor de push.
 * Funcionan offline usando la Notification API del navegador.
 *
 * Flujo:
 *  1. Verificar/solicitar permisos
 *  2. Enviar notificación con título + opciones
 *  3. Si el permiso es denied o la API no existe, no-op silencioso
 */

// ── Tipos ────────────────────────────────────────────────────────────────────

export type PermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

export interface NotificationOptions {
  body?: string
  icon?: string
  badge?: string
  tag?: string
}

// ── Permisos ─────────────────────────────────────────────────────────────────

/**
 * Solicita permiso para enviar notificaciones.
 * Retorna 'unsupported' si la Notification API no está disponible.
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }
  const result = await Notification.requestPermission()
  return result as PermissionStatus
}

/**
 * Retorna el estado actual del permiso de notificaciones.
 */
export function getPermissionStatus(): PermissionStatus {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission as PermissionStatus
}

// ── Envío ─────────────────────────────────────────────────────────────────────

/**
 * Envía una notificación local al usuario.
 * No hace nada si los permisos no están otorgados o la API no existe.
 *
 * @param title   - Título de la notificación
 * @param options - Cuerpo, ícono, badge, tag
 */
export function sendNotification(title: string, options: NotificationOptions): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return

  new Notification(title, options)
}
