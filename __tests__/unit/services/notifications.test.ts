/**
 * Tests de notificaciones PWA — Fase 2, Feature 6.
 *
 * Cobertura de:
 *   - Gestión de permisos de notificación
 *   - Envío de notificaciones locales
 *   - Programación de alertas fiscales (día 17 de cada mes)
 *   - Recordatorios de registro de gastos
 *   - Notificación de umbral RESICO
 *
 * Notification API se mockea completamente — offline-first.
 */

// ── Mock de Notification API ─────────────────────────────────────────────────

const mockNotification = jest.fn()
const mockRequestPermission = jest.fn()

beforeAll(() => {
  // @ts-expect-error — mock global Notification
  global.Notification = mockNotification
  global.Notification.requestPermission = mockRequestPermission
  global.Notification.permission = 'default'
})

import {
  requestNotificationPermission,
  getPermissionStatus,
  sendNotification,
} from '../../../src/services/notifications/notificationService.ts'

import {
  shouldSendFiscalReminder,
  getFiscalReminderMessage,
  shouldSendResicoAlert,
  getResicoAlertMessage,
} from '../../../src/services/notifications/fiscalReminders.ts'

import {
  shouldSendRegistrationReminder,
  getRegistrationReminderMessage,
} from '../../../src/services/notifications/registrationReminders.ts'

beforeEach(() => {
  jest.clearAllMocks()
  global.Notification.permission = 'default'
})

// ═══════════════════════════════════════════════════════════════════════════════
// GESTIÓN DE PERMISOS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Gestión de permisos de notificación', () => {
  test('requestPermission retorna granted cuando el usuario acepta', async () => {
    mockRequestPermission.mockResolvedValue('granted')
    const result = await requestNotificationPermission()
    expect(result).toBe('granted')
  })

  test('requestPermission retorna denied cuando el usuario rechaza', async () => {
    mockRequestPermission.mockResolvedValue('denied')
    const result = await requestNotificationPermission()
    expect(result).toBe('denied')
  })

  test('requestPermission retorna unsupported si no hay Notification API', async () => {
    const originalNotification = global.Notification
    // @ts-expect-error — temporalmente eliminar Notification
    delete global.Notification
    const result = await requestNotificationPermission()
    expect(result).toBe('unsupported')
    global.Notification = originalNotification
  })

  test('getPermissionStatus retorna el status actual', () => {
    global.Notification.permission = 'granted'
    expect(getPermissionStatus()).toBe('granted')
  })

  test('getPermissionStatus retorna unsupported sin Notification API', () => {
    const originalNotification = global.Notification
    // @ts-expect-error — temporalmente eliminar Notification
    delete global.Notification
    expect(getPermissionStatus()).toBe('unsupported')
    global.Notification = originalNotification
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ENVÍO DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════════════════

describe('Envío de notificaciones', () => {
  test('sendNotification crea una Notification con título y opciones', () => {
    global.Notification.permission = 'granted'
    sendNotification('Test', { body: 'Cuerpo del mensaje', icon: '/icon.png' })
    expect(mockNotification).toHaveBeenCalledWith('Test', {
      body: 'Cuerpo del mensaje',
      icon: '/icon.png',
    })
  })

  test('sendNotification no hace nada si permisos no son granted', () => {
    global.Notification.permission = 'denied'
    sendNotification('Test', { body: 'No debería aparecer' })
    expect(mockNotification).not.toHaveBeenCalled()
  })

  test('sendNotification no hace nada sin Notification API', () => {
    const originalNotification = global.Notification
    // @ts-expect-error — temporalmente eliminar Notification
    delete global.Notification
    sendNotification('Test', { body: 'No debería fallar' })
    // No debe lanzar error
    global.Notification = originalNotification
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ALERTAS FISCALES (DÍA 17)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Alertas fiscales (día 17)', () => {
  test('shouldSendFiscalReminder retorna true el día 15 (2 días antes)', () => {
    const date = new Date(2025, 0, 15) // 15 de enero
    expect(shouldSendFiscalReminder(date)).toBe(true)
  })

  test('shouldSendFiscalReminder retorna true el día 16 (1 día antes)', () => {
    const date = new Date(2025, 0, 16)
    expect(shouldSendFiscalReminder(date)).toBe(true)
  })

  test('shouldSendFiscalReminder retorna true el día 17 (día límite)', () => {
    const date = new Date(2025, 0, 17)
    expect(shouldSendFiscalReminder(date)).toBe(true)
  })

  test('shouldSendFiscalReminder retorna false en otros días', () => {
    const date = new Date(2025, 0, 10)
    expect(shouldSendFiscalReminder(date)).toBe(false)
  })

  test('getFiscalReminderMessage retorna mensaje distinto según el día', () => {
    const day15 = getFiscalReminderMessage(new Date(2025, 0, 15))
    const day17 = getFiscalReminderMessage(new Date(2025, 0, 17))
    expect(day15).toContain('2 días')
    expect(day17).toContain('hoy')
  })

  test('shouldSendResicoAlert retorna true cuando el ingreso supera el 80%', () => {
    expect(shouldSendResicoAlert(2_900_000)).toBe(true) // > 80% de 3.5M
  })

  test('shouldSendResicoAlert retorna false bajo el umbral', () => {
    expect(shouldSendResicoAlert(1_000_000)).toBe(false)
  })

  test('getResicoAlertMessage incluye el monto formateado', () => {
    const msg = getResicoAlertMessage(3_000_000)
    expect(msg).toContain('3,000,000')
    expect(msg).toContain('RESICO')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// RECORDATORIOS DE REGISTRO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Recordatorios de registro de gastos', () => {
  test('shouldSendRegistrationReminder retorna true si no se ha registrado hoy', () => {
    const lastRegistration = new Date(2025, 0, 14) // Ayer
    const now = new Date(2025, 0, 15)
    expect(shouldSendRegistrationReminder(lastRegistration, now)).toBe(true)
  })

  test('shouldSendRegistrationReminder retorna false si ya se registró hoy', () => {
    const lastRegistration = new Date(2025, 0, 15, 10, 0) // Hoy a las 10am
    const now = new Date(2025, 0, 15, 20, 0) // Hoy a las 8pm
    expect(shouldSendRegistrationReminder(lastRegistration, now)).toBe(false)
  })

  test('shouldSendRegistrationReminder retorna true si nunca se ha registrado', () => {
    expect(shouldSendRegistrationReminder(null, new Date())).toBe(true)
  })

  test('getRegistrationReminderMessage retorna un mensaje motivacional', () => {
    const msg = getRegistrationReminderMessage()
    expect(msg.title).toBeTruthy()
    expect(msg.body).toBeTruthy()
    expect(msg.body.length).toBeGreaterThan(10)
  })
})
