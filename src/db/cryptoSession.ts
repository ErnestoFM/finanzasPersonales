/**
 * Sesión de cifrado en memoria.
 * Almacena la CryptoKey activa derivada del PIN del usuario.
 *
 * Reglas de seguridad:
 *  - La clave NUNCA se escribe en IndexedDB, localStorage ni sessionStorage
 *  - Solo vive en memoria RAM durante la sesión activa
 *  - Al cerrar o recargar la app, la clave desaparece → el usuario debe re-ingresar el PIN
 *  - La clave es de tipo 'secret' y no exportable (Web Crypto API garantiza esto)
 */

// Módulo singleton: clave activa en closure privado
let activeKey: CryptoKey | null = null

/**
 * Guarda la clave activa en memoria.
 * Debe llamarse justo después de que el usuario verifica su PIN correctamente.
 *
 * @param key - CryptoKey derivada de deriveKeyFromPin
 */
export function setActiveKey(key: CryptoKey): void {
  activeKey = key
}

/**
 * Devuelve la clave activa en memoria, o null si no hay sesión de cifrado.
 * Los servicios de datos deben verificar esto antes de intentar cifrar/descifrar.
 */
export function getActiveKey(): CryptoKey | null {
  return activeKey
}

/**
 * Elimina la clave de memoria.
 * Debe llamarse al cerrar sesión, al fallar el PIN, o al desactivar el PIN.
 */
export function clearActiveKey(): void {
  activeKey = null
}
