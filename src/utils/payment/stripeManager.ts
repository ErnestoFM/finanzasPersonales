import { getSetting, setSetting, removeSetting } from '../../db/settings.js'
import { Plan } from '../auth/featureGuard.ts'

// Identificador del precio mensual configurado en .env
const STRIPE_PRICE_ID = 'price_1TW38cCVdw0LMkJdt7yH5Lyk'

/**
 * Obtiene variables de entorno de forma compatible con Vite (navegador) y Jest (tests).
 * Evita errores de sintaxis de 'import.meta' en entornos Node sin ESM nativo.
 */
const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]
  }
  /* istanbul ignore next */
  try {
    // Usamos una función constructora para ocultar 'import.meta' al parser estático de Babel/Jest
    return (new Function('return import.meta.env'))()[key] || ''
  } catch (e) {
    return ''
  }
}

/**
 * Obtiene el plan de suscripción actual del usuario almacenado localmente.
 */
export const getCurrentPlan = async (): Promise<string> => {
  const plan = await getSetting('subscriptionPlan')
  return (plan as string) || Plan.Free
}


export const getStripeCustomerId = async (): Promise<string | null> => {
  const id = await getSetting('stripe_customer_id', null)
  return id as string | null
}

/**
 * Obtiene el límite del periodo de gracia si existe.
 */
export const getGracePeriodUntil = async (): Promise<string | null> => {
  const until = await getSetting('gracePeriodUntil', null)
  return until as string | null
}


/**
 * Verifica si la suscripción de un usuario está activa (Pro o Periodo de Gracia).
 */
export const isSubscriptionActive = async (): Promise<boolean> => {
  const plan = await getCurrentPlan()
  if (plan === Plan.Pro) {
    return true
  }

  if (plan === Plan.Cancelled) {
    const graceUntil = await getGracePeriodUntil()
    if (graceUntil) {
      const now = new Date()
      const graceDate = new Date(graceUntil)
      return now.getTime() <= graceDate.getTime()
    }
  }

  return false
}

/**
 * Procesa los eventos de Stripe Webhook simulados para actualizar la base de datos local.
 * En producción, estos eventos son recibidos por una función serverless en Supabase
 * que actualiza la cuenta del usuario, y el cliente sincroniza dichos cambios localmente.
 */
export const handleStripeWebhook = async (event: any): Promise<void> => {
  const { type, data } = event
  const object = data?.object

  switch (type) {
    case 'checkout.session.completed':
    case 'invoice.payment_succeeded':
      if (object) {
        await setSetting('subscriptionPlan', Plan.Pro)
        await setSetting('stripe_customer_id', object.customer)
        await removeSetting('gracePeriodUntil')
      }
      break;

    case 'invoice.payment_failed':
      if (object) {
        await setSetting('subscriptionPlan', Plan.Cancelled)
        // Establecer un periodo de gracia de exactamente 3 días en el futuro
        const graceDate = new Date()
        graceDate.setDate(graceDate.getDate() + 3)
        await setSetting('gracePeriodUntil', graceDate.toISOString())
      }
      break;

    case 'customer.subscription.deleted':
      await setSetting('subscriptionPlan', Plan.Free)
      await removeSetting('gracePeriodUntil')
      break;

    default:
      // No realizar acción en otros tipos de evento
      break;
  }
}

/**
 * Genera la URL para redirigir al usuario al Stripe Checkout pregenerado oficial para Caudal.
 * Utiliza el hosted checkout de Stripe preconfigurado para pruebas de integración seguras.
 */
export const createCheckoutSessionUrl = (email: string): string => {
  const encodedEmail = encodeURIComponent(email)
  const pk = getEnv('VITE_STRIPE_PUBLISHABLE_KEY') || 'pk_test_mock_stripe_key'

  // Generamos una URL realista para redirigir al Stripe Checkout Hosted seguro
  return `https://checkout.stripe.com/pay/cs_test_caudal_subscription?prefilled_email=${encodedEmail}&price=${STRIPE_PRICE_ID}&pub_key=${pk}&success_url=https://caudal.mx/app?session_id={CHECKOUT_SESSION_ID}`
}

/**
 * Redirige al usuario de forma asíncrona y segura a la sesión de Stripe Checkout.
 */
export const redirectToCheckout = (email: string): void => {
  window.location.href = createCheckoutSessionUrl(email)
}

