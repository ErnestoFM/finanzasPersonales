/**
 * Servicio de autenticación con Supabase.
 * Wrappers delgados sobre supabase.auth para tipado y consistencia.
 *
 * Soporta:
 *  - Email + contraseña (registro y login)
 *  - Google OAuth
 *  - Magic Link
 *  - Cierre de sesión
 *  - Escucha de cambios de estado de auth
 *
 * REGLA: Supabase es sincronización, nunca dependencia.
 * Si la red no está disponible, estas funciones retornan errores
 * pero la app sigue funcionando con datos locales.
 */

import { supabase } from './client.ts'

// ── Tipos ────────────────────────────────────────────────────────────────────

interface AuthResult {
  data: {
    user: Record<string, unknown> | null
    session: Record<string, unknown> | null
  }
  error: { message: string } | null
}

interface OAuthResult {
  data: Record<string, unknown>
  error: { message: string } | null
}

interface SessionResult {
  data: { session: Record<string, unknown> | null }
  error: { message: string } | null
}

interface SignOutResult {
  error: { message: string } | null
}

// ── Registro ─────────────────────────────────────────────────────────────────

/**
 * Registra un usuario nuevo con email y contraseña.
 * Supabase envía un email de confirmación por defecto.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  return supabase.auth.signUp({ email, password })
}

// ── Login ────────────────────────────────────────────────────────────────────

/**
 * Inicia sesión con email y contraseña.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  return supabase.auth.signInWithPassword({ email, password })
}

/**
 * Inicia el flujo de Google OAuth.
 * Redirige al usuario a Google para autorización.
 */
export async function signInWithGoogle(): Promise<OAuthResult> {
  return supabase.auth.signInWithOAuth({ provider: 'google' })
}

/**
 * Envía un magic link al email especificado.
 * El usuario hace clic en el link para autenticarse sin contraseña.
 */
export async function signInWithMagicLink(email: string): Promise<OAuthResult> {
  return supabase.auth.signInWithOtp({ email })
}

// ── Sesión ────────────────────────────────────────────────────────────────────

/**
 * Obtiene la sesión activa actual, o null si no hay sesión.
 */
export async function getSession(): Promise<SessionResult> {
  return supabase.auth.getSession()
}

/**
 * Cierra la sesión activa.
 */
export async function signOut(): Promise<SignOutResult> {
  return supabase.auth.signOut()
}

/**
 * Registra un listener para cambios de estado de autenticación.
 * Útil para actualizar la UI cuando el usuario inicia/cierra sesión.
 *
 * @param callback - Función invocada en cada cambio de auth
 * @returns Objeto con unsubscribe para limpiar el listener
 */
export function onAuthChange(
  callback: (event: string, session: Record<string, unknown> | null) => void,
) {
  return supabase.auth.onAuthStateChange(callback)
}
