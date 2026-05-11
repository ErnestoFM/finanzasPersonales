/**
 * Tests de cifrado local con Web Crypto API.
 * Clave derivada del PIN del usuario vía PBKDF2 (art. de privacidad por diseño).
 *
 * Requisito: 100% de cobertura en /utils/crypto
 */

import {
  deriveKeyFromPin,
  encrypt,
  decrypt,
  generateSalt,
} from '../../../src/utils/crypto/encryption.ts'
import {
  setActiveKey,
  getActiveKey,
  clearActiveKey,
} from '../../../src/db/cryptoSession.ts'

// ── generateSalt ──────────────────────────────────────────────────────────────

test('generateSalt: devuelve un Uint8Array de 16 bytes', () => {
  const salt = generateSalt()
  expect(salt).toBeInstanceOf(Uint8Array)
  expect(salt.byteLength).toBe(16)
})

test('generateSalt: dos llamadas producen salts distintos', () => {
  const a = generateSalt()
  const b = generateSalt()
  expect(Buffer.from(a).toString('hex')).not.toBe(Buffer.from(b).toString('hex'))
})

// ── deriveKeyFromPin ──────────────────────────────────────────────────────────

test('deriveKeyFromPin: devuelve una CryptoKey de tipo secret', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  expect(key.type).toBe('secret')
})

test('deriveKeyFromPin: el algoritmo es AES-GCM', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  expect(key.algorithm.name).toBe('AES-GCM')
})

test('deriveKeyFromPin: mismo PIN + mismo salt → claves que descifran igual (determinismo)', async () => {
  const salt = generateSalt()
  const key1 = await deriveKeyFromPin('5678', salt)
  const key2 = await deriveKeyFromPin('5678', salt)

  // Verificamos el determinismo cifrando con key1 y descifrando con key2
  const plaintext = 'datos de prueba'
  const ciphertext = await encrypt(plaintext, key1)
  const result = await decrypt(ciphertext, key2)
  expect(result).toBe(plaintext)
})

test('deriveKeyFromPin: PIN diferente con mismo salt → claves distintas (descifrado falla)', async () => {
  const salt = generateSalt()
  const key1 = await deriveKeyFromPin('1111', salt)
  const key2 = await deriveKeyFromPin('9999', salt)

  const ciphertext = await encrypt('secreto', key1)
  await expect(decrypt(ciphertext, key2)).rejects.toThrow()
})

test('deriveKeyFromPin: mismo PIN con salt diferente → claves distintas (descifrado falla)', async () => {
  const saltA = generateSalt()
  const saltB = generateSalt()
  const key1 = await deriveKeyFromPin('1234', saltA)
  const key2 = await deriveKeyFromPin('1234', saltB)

  const ciphertext = await encrypt('datos', key1)
  await expect(decrypt(ciphertext, key2)).rejects.toThrow()
})

// ── encrypt ───────────────────────────────────────────────────────────────────

test('encrypt: el output es diferente al input (no legible)', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  const plaintext = 'monto: 5000'
  const ciphertext = await encrypt(plaintext, key)
  expect(ciphertext).not.toBe(plaintext)
  expect(typeof ciphertext).toBe('string')
})

test('encrypt: dos cifrados del mismo texto producen resultados distintos (IV aleatorio)', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  const a = await encrypt('mismo texto', key)
  const b = await encrypt('mismo texto', key)
  // Los IV son aleatorios → ciphertexts distintos aunque el plaintext sea igual
  expect(a).not.toBe(b)
})

// ── decrypt ───────────────────────────────────────────────────────────────────

test('decrypt: roundtrip cifrado → descifrado devuelve el texto original', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  const original = JSON.stringify({ monto: 5000, descripcion: 'Renta' })
  const ciphertext = await encrypt(original, key)
  const result = await decrypt(ciphertext, key)
  expect(result).toBe(original)
})

test('decrypt: texto corrupto lanza error (integridad AES-GCM)', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  // Un payload corrupto que no sea un base64 válido del formato esperado
  await expect(decrypt('datos-corruptos-no-validos', key)).rejects.toThrow()
})

test('decrypt: ciphertext manipulado lanza error (integridad AEAD de AES-GCM)', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  const ciphertext = await encrypt('secreto', key)

  // Corrompemos la parte del ciphertext (después del ".")
  // AES-GCM verifica un tag de autenticación; bytes alterados causan fallo garantizado
  const [iv, ct] = ciphertext.split('.')
  const ctBytes = Buffer.from(ct, 'base64')
  ctBytes[0] ^= 0xff // flip all bits del primer byte
  const corrupted = `${iv}.${ctBytes.toString('base64')}`
  await expect(decrypt(corrupted, key)).rejects.toThrow()
})

// ── cryptoSession ─────────────────────────────────────────────────────────────

test('cryptoSession: sin clave activa → getActiveKey() retorna null', () => {
  clearActiveKey()
  expect(getActiveKey()).toBeNull()
})

test('cryptoSession: setActiveKey + getActiveKey → devuelve la misma clave', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  setActiveKey(key)
  expect(getActiveKey()).toBe(key)
})

test('cryptoSession: clearActiveKey → getActiveKey() vuelve a ser null', async () => {
  const salt = generateSalt()
  const key = await deriveKeyFromPin('1234', salt)
  setActiveKey(key)
  clearActiveKey()
  expect(getActiveKey()).toBeNull()
})
