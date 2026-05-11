/**
 * Tests de autenticación con Supabase — Fase 2, Feature 4.
 *
 * Usa __mocks__ inline con jest.fn() dentro del factory para evitar
 * problemas de TDZ (temporal dead zone) con hoisting de jest.mock.
 */

// El factory se ejecuta antes de cualquier declaración del archivo.
// Declaramos las funciones mock directamente en el factory.
jest.mock('../../../src/services/supabase/client.ts', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}))

// Obtener referencia al mock después del factory
import { supabase } from '../../../src/services/supabase/client.ts'

import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithMagicLink,
  signOut,
  getSession,
  onAuthChange,
} from '../../../src/services/supabase/authService.ts'

// Cast para acceder a los métodos mock
const mockAuth = (supabase.auth as unknown) as Record<string, jest.Mock>;

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRO
// ═══════════════════════════════════════════════════════════════════════════════

describe('Registro con email + contraseña', () => {
  test('registro exitoso retorna usuario y sesión', async () => {
    const mockUser = { id: 'user-1', email: 'test@caudal.mx' }
    const mockSession = { access_token: 'token-123' }
    mockAuth.signUp.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null,
    })

    const result = await signUpWithEmail('test@caudal.mx', 'password123')
    expect(result.data.user).toEqual(mockUser)
    expect(result.data.session).toEqual(mockSession)
    expect(result.error).toBeNull()
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@caudal.mx',
      password: 'password123',
    })
  })

  test('registro con email inválido retorna error', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid email' },
    })

    const result = await signUpWithEmail('no-valido', 'password123')
    expect(result.error).toBeTruthy()
    expect(result.data.user).toBeNull()
  })

  test('registro con contraseña débil retorna error', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Password should be at least 6 characters' },
    })

    const result = await signUpWithEmail('test@caudal.mx', '123')
    expect(result.error).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════

describe('Login con email + contraseña', () => {
  test('login exitoso retorna sesión', async () => {
    const mockSession = { access_token: 'token-456' }
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: mockSession },
      error: null,
    })

    const result = await signInWithEmail('test@caudal.mx', 'password123')
    expect(result.data.session).toEqual(mockSession)
    expect(result.error).toBeNull()
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@caudal.mx',
      password: 'password123',
    })
  })

  test('login con credenciales incorrectas retorna error', async () => {
    mockAuth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const result = await signInWithEmail('test@caudal.mx', 'wrongpassword')
    expect(result.error).toBeTruthy()
    expect(result.error?.message).toContain('Invalid')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// GOOGLE OAUTH
// ═══════════════════════════════════════════════════════════════════════════════

describe('Google OAuth', () => {
  test('inicia el flujo de OAuth con Google', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/...' },
      error: null,
    })

    const result = await signInWithGoogle()
    expect(result.error).toBeNull()
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google' })
  })

  test('error en OAuth retorna el error de Supabase', async () => {
    mockAuth.signInWithOAuth.mockResolvedValue({
      data: { provider: null, url: null },
      error: { message: 'OAuth not configured' },
    })

    const result = await signInWithGoogle()
    expect(result.error).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MAGIC LINK
// ═══════════════════════════════════════════════════════════════════════════════

describe('Magic Link', () => {
  test('envía magic link al email especificado', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({ data: {}, error: null })

    const result = await signInWithMagicLink('user@caudal.mx')
    expect(result.error).toBeNull()
    expect(mockAuth.signInWithOtp).toHaveBeenCalledWith({ email: 'user@caudal.mx' })
  })

  test('error al enviar magic link retorna error', async () => {
    mockAuth.signInWithOtp.mockResolvedValue({
      data: {},
      error: { message: 'Rate limit exceeded' },
    })

    const result = await signInWithMagicLink('user@caudal.mx')
    expect(result.error).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SESIÓN Y CIERRE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Sesión y cierre', () => {
  test('getSession retorna sesión activa cuando existe', async () => {
    const mockSession = { access_token: 'token-xyz', user: { id: 'u1' } }
    mockAuth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

    const result = await getSession()
    expect(result.data.session).toEqual(mockSession)
  })

  test('getSession retorna null cuando no hay sesión', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    const result = await getSession()
    expect(result.data.session).toBeNull()
  })

  test('signOut cierra la sesión correctamente', async () => {
    mockAuth.signOut.mockResolvedValue({ error: null })

    const result = await signOut()
    expect(result.error).toBeNull()
    expect(mockAuth.signOut).toHaveBeenCalled()
  })

  test('signOut retorna error si falla', async () => {
    mockAuth.signOut.mockResolvedValue({ error: { message: 'Session not found' } })

    const result = await signOut()
    expect(result.error).toBeTruthy()
  })

  test('onAuthChange registra un listener de cambios de auth', () => {
    const callback = jest.fn()
    const mockUnsubscribe = jest.fn()
    mockAuth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } },
    })

    const { data } = onAuthChange(callback)
    expect(mockAuth.onAuthStateChange).toHaveBeenCalledWith(callback)
    expect(data.subscription.unsubscribe).toBe(mockUnsubscribe)
  })
})
