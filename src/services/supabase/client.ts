/**
 * Cliente de Supabase.
 * Inicialización centralizada con variables de entorno.
 *
 * REGLA CRÍTICA: Supabase es sincronización, NUNCA dependencia para operar.
 * Si las variables no están definidas, el cliente se crea con valores vacíos
 * y los servicios deben manejar el estado offline gracefully.
 *
 * Credenciales en .env (nunca en código):
 *  VITE_SUPABASE_URL — URL del proyecto Supabase
 *  VITE_SUPABASE_ANON_KEY — Clave anónima (pública, segura para frontend)
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Obtener variable de entorno compatible con Vite (runtime) y Jest (tests).
 * Vite reemplaza import.meta.env.* en tiempo de compilación,
 * así que usamos una función que Babel puede transformar.
 */
function getEnv(key: string): string {
  // En producción (Vite), estas variables se inyectan en compile-time
  // process.env funciona en tests y en SSR
  return (typeof process !== 'undefined' && process.env?.[key]) || ''
}

const supabaseUrl = getEnv('VITE_SUPABASE_URL')
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
