/**
 * Utilidades de cifrado local para Caudal.
 * Usa Web Crypto API (AES-GCM 256-bit) con clave derivada del PIN via PBKDF2.
 *
 * Principios de diseño:
 *  - La clave NUNCA se persiste en disco — solo vive en memoria RAM (cryptoSession)
 *  - El salt SÍ se guarda en IndexedDB (es público por diseño de PBKDF2)
 *  - Sin PIN → funciones no se llaman; los datos se guardan sin cifrar
 *  - AES-GCM provee confidencialidad + integridad (AEAD): datos corruptos lanzan error
 */

// Número de iteraciones para PBKDF2. Suficiente para derivación segura en mobile.
const PBKDF2_ITERATIONS = 100_000

// Longitud del IV (nonce) en bytes. AES-GCM recomienda 12 bytes (96 bits).
const IV_BYTES = 12

// Longitud del salt en bytes.
const SALT_BYTES = 16

/**
 * Genera un salt criptográficamente aleatorio para PBKDF2.
 * El salt se debe guardar en db.settings['cryptoSalt'] para poder re-derivar la clave.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_BYTES))
}

/**
 * Deriva una CryptoKey AES-GCM de 256 bits a partir del PIN del usuario.
 * Usa PBKDF2 con SHA-256 para hacer el ataque de fuerza bruta computacionalmente costoso.
 *
 * @param pin   - PIN de 4 dígitos como string
 * @param salt  - Salt aleatorio (Uint8Array de 16 bytes)
 * @returns     - CryptoKey lista para usar en encrypt/decrypt
 */
export async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()

  // 1. Importar el PIN como material de clave raw
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    'PBKDF2',
    false,      // no exportable
    ['deriveKey'],
  )

  // 2. Derivar la clave AES-GCM usando PBKDF2
  return crypto.subtle.deriveKey(
    {
      name:       'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash:       'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,      // no exportable — nunca sale de Web Crypto
    ['encrypt', 'decrypt'],
  )
}

/**
 * Cifra un string con AES-GCM 256-bit.
 * El IV es aleatorio en cada llamada → mismo plaintext produce ciphertexts distintos.
 * El output es un string base64 con formato: "<IV_base64>.<ciphertext_base64>"
 *
 * @param plaintext - Texto a cifrar (tipicamente JSON.stringify de un registro)
 * @param key       - CryptoKey derivada con deriveKeyFromPin
 * @returns         - String base64 cifrado
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const enc = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )

  // Serializar IV + ciphertext como base64 separados por "."
  const ivB64 = Buffer.from(iv).toString('base64')
  const ctB64 = Buffer.from(ciphertextBuffer).toString('base64')
  return `${ivB64}.${ctB64}`
}

/**
 * Descifra un string cifrado con encrypt().
 * Si la clave es incorrecta o los datos están corruptos, lanza un error (AES-GCM AEAD).
 *
 * @param ciphertext - String en formato "<IV_base64>.<ciphertext_base64>"
 * @param key        - CryptoKey derivada con deriveKeyFromPin
 * @returns          - Plaintext original
 * @throws           - Si la clave es incorrecta o los datos están corruptos
 */
export async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  const parts = ciphertext.split('.')
  if (parts.length !== 2) {
    throw new Error('Formato de datos cifrados inválido.')
  }

  const [ivB64, ctB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ct,
  )

  return new TextDecoder().decode(plaintextBuffer)
}
