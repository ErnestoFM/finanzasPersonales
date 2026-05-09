const textEncoder = new TextEncoder()

const bufferToHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

const randomSalt = () => {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return bufferToHex(array)
}

export const hashPin = async (pin, salt = randomSalt()) => {
  const data = textEncoder.encode(`${pin}:${salt}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return { hash: bufferToHex(digest), salt }
}

export const verifyPinHash = async (pin, { hash, salt }) => {
  const digest = await hashPin(pin, salt)
  return digest.hash === hash
}
