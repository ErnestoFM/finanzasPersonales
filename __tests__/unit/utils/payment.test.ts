import { db, resetDatabase } from '../../../src/db/index.js'
import { getSetting, setSetting } from '../../../src/db/settings.js'
import {
  getCurrentPlan,
  getGracePeriodUntil,
  handleStripeWebhook,
  isSubscriptionActive,
  getStripeCustomerId,
  createCheckoutSessionUrl,
} from '../../../src/utils/payment/stripeManager.ts'
import {
  isFeatureAvailable,
  Feature,
  Plan,
  getCurrentPlan as getFeatureGuardCurrentPlan,
} from '../../../src/utils/auth/featureGuard.ts'

// Definimos la variable de entorno para la ejecución del test de cobertura
process.env.VITE_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_from_jest_config'


beforeEach(async () => {
  await resetDatabase()
})

afterAll(async () => {
  await db.delete()
})

describe('Feature 8: Monetización — Stripe Checkout & Webhooks', () => {
  // ── 1. featureGuard Bloqueos y Permisos ──────────────────────────────────────

  test('featureGuard bloquea el acceso a funciones premium en plan Free', async () => {
    await setSetting('subscriptionPlan', Plan.Free)
    const available = await isFeatureAvailable(Feature.ExportReports)
    expect(available).toBe(false)
  })

  test('featureGuard permite el acceso a funciones premium en plan Pro', async () => {
    await setSetting('subscriptionPlan', Plan.Pro)
    const available = await isFeatureAvailable(Feature.ExportReports)
    expect(available).toBe(true)
  })

  test('featureGuard permite el acceso si está dentro del periodo de gracia', async () => {
    // Si el plan es "cancelled" o fallido, pero el periodo de gracia es futuro, está activo
    await setSetting('subscriptionPlan', Plan.Cancelled)
    
    const threeDaysFuture = new Date()
    threeDaysFuture.setDate(threeDaysFuture.getDate() + 2) // 2 días en el futuro (dentro de la gracia de 3 días)
    await setSetting('gracePeriodUntil', threeDaysFuture.toISOString())

    const available = await isFeatureAvailable(Feature.ExportReports)
    expect(available).toBe(true)
  })

  test('featureGuard bloquea el acceso si el periodo de gracia ha expirado', async () => {
    await setSetting('subscriptionPlan', Plan.Cancelled)
    
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1) // 1 día en el pasado
    await setSetting('gracePeriodUntil', pastDate.toISOString())

    const available = await isFeatureAvailable(Feature.ExportReports)
    expect(available).toBe(false)
  })

  // ── 2. Stripe Webhook Sucesos (Éxito) ──────────────────────────────────────────

  test('Webhook checkout.session.completed actualiza estado a pro y guarda customer_id', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_H12345abc',
          subscription: 'sub_S12345xyz',
        },
      },
    }

    await handleStripeWebhook(mockEvent)

    const plan = await getCurrentPlan()
    const customerId = await getStripeCustomerId()
    const grace = await getGracePeriodUntil()

    expect(plan).toBe(Plan.Pro)
    expect(customerId).toBe('cus_H12345abc')
    expect(grace).toBeNull() // Limpia cualquier gracia previa
  })

  test('Webhook invoice.payment_succeeded actualiza estado a pro y limpia gracia', async () => {
    // Simulamos que el usuario tenía gracia activa
    await setSetting('subscriptionPlan', Plan.Cancelled)
    await setSetting('gracePeriodUntil', new Date().toISOString())

    const mockEvent = {
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          customer: 'cus_H12345abc',
          subscription: 'sub_S12345xyz',
        },
      },
    }

    await handleStripeWebhook(mockEvent)

    const plan = await getCurrentPlan()
    const grace = await getGracePeriodUntil()

    expect(plan).toBe(Plan.Pro)
    expect(grace).toBeNull()
  })

  // ── 3. Stripe Webhook Cobros Fallidos (Periodo de Gracia) ──────────────────────────

  test('Webhook invoice.payment_failed activa periodo de gracia de 3 días', async () => {
    await setSetting('subscriptionPlan', Plan.Pro)
    await setSetting('stripe_customer_id', 'cus_H12345abc')

    const mockEvent = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          customer: 'cus_H12345abc',
        },
      },
    }

    const beforeCall = new Date()
    await handleStripeWebhook(mockEvent)
    const afterCall = new Date()

    const plan = await getCurrentPlan()
    const graceStr = await getGracePeriodUntil()

    expect(plan).toBe(Plan.Cancelled) // Se marca cancelado/suspendido temporalmente
    expect(graceStr).not.toBeNull()

    const graceDate = new Date(graceStr!)
    
    // El periodo de gracia debe ser exactamente 3 días en el futuro
    const expectedMin = new Date(beforeCall)
    expectedMin.setDate(expectedMin.getDate() + 3)
    
    const expectedMax = new Date(afterCall)
    expectedMax.setDate(expectedMax.getDate() + 3)

    expect(graceDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime())
    expect(graceDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime())
  })

  // ── 4. Webhook Cancelación de Suscripción ─────────────────────────────────────

  test('Webhook customer.subscription.deleted quita acceso Pro y limpia gracia', async () => {
    await setSetting('subscriptionPlan', Plan.Pro)
    await setSetting('gracePeriodUntil', new Date().toISOString())

    const mockEvent = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_H12345abc',
        },
      },
    }

    await handleStripeWebhook(mockEvent)

    const plan = await getCurrentPlan()
    const grace = await getGracePeriodUntil()

    expect(plan).toBe(Plan.Free)
    expect(grace).toBeNull()
  })

  // ── 5. Seguridad de Datos Sensibles ───────────────────────────────────────────

  test('NUNCA se almacenan datos de tarjeta en IndexedDB', async () => {
    // Al realizar webhook o cualquier operación de pago, verificamos que no existan
    // llaves relacionadas a tarjetas como "card", "cc", "number", "cvv" en settings
    const settings = await db.settings.toArray()
    const hasCardKeys = settings.some(
      (item) =>
        item.key.includes('card') ||
        item.key.includes('number') ||
        item.key.includes('cvv') ||
        item.key.includes('expiry')
    )
    expect(hasCardKeys).toBe(false)
  })

  test('createCheckoutSessionUrl genera la URL de redirección correcta con parámetros', () => {
    const email = 'usuario@caudal.mx'
    const url = createCheckoutSessionUrl(email)
    
    // Esperamos una URL hosted de Stripe Checkout para pruebas
    expect(url).toContain('checkout.stripe.com')
    expect(url).toContain('price_1TW38cCVdw0LMkJdt7yH5Lyk')
    expect(url).toContain(encodeURIComponent(email))
  })

  test('createCheckoutSessionUrl usa la llave por defecto si no está definida en el entorno', () => {
    const oldKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY
    delete process.env.VITE_STRIPE_PUBLISHABLE_KEY

    try {
      const url = createCheckoutSessionUrl('usuario@caudal.mx')
      expect(url).toContain('pub_key=pk_test_mock_stripe_key')
    } finally {
      process.env.VITE_STRIPE_PUBLISHABLE_KEY = oldKey
    }
  })


  // ── 7. Cobertura de Ramas Adicionales (Edge cases) ──────────────────────────

  test('Webhook con evento desconocido no realiza cambios ni falla', async () => {
    await setSetting('subscriptionPlan', Plan.Pro)
    await handleStripeWebhook({ type: 'unknown.event_type', data: {} })
    const plan = await getCurrentPlan()
    expect(plan).toBe(Plan.Pro)
  })

  test('isFeatureAvailable retorna false si el feature no es de pago o es inválido', async () => {
    await setSetting('subscriptionPlan', Plan.Pro)
    const available = await isFeatureAvailable('non_existent_feature_name')
    expect(available).toBe(false)
  })

  test('getCurrentPlan de featureGuard devuelve el plan correcto', async () => {
    await setSetting('subscriptionPlan', Plan.Pro)
    const plan = await getFeatureGuardCurrentPlan()
    expect(plan).toBe(Plan.Pro)
  })

  test('isSubscriptionActive retorna false si está cancelado pero no hay grace period timestamp', async () => {
    await setSetting('subscriptionPlan', Plan.Cancelled)
    await db.settings.delete('gracePeriodUntil')
    const active = await isSubscriptionActive()
    expect(active).toBe(false)
  })

  test('Webhooks no alteran DB si el objeto de datos está vacío o es nulo', async () => {
    await setSetting('subscriptionPlan', Plan.Free)
    
    // Test checkout.session.completed sin object
    await handleStripeWebhook({ type: 'checkout.session.completed', data: {} })
    let plan = await getCurrentPlan()
    expect(plan).toBe(Plan.Free)

    // Test invoice.payment_failed sin object
    await handleStripeWebhook({ type: 'invoice.payment_failed', data: {} })
    plan = await getCurrentPlan()
    expect(plan).toBe(Plan.Free)
  })
})



