import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import UpgradeGate from '../../src/features/subscription/UpgradeGate.jsx'
import { redirectToCheckout } from '../../src/utils/payment/stripeManager.ts'

// Mockeamos el stripeManager para verificar las redirecciones de forma segura
jest.mock('../../src/utils/payment/stripeManager.ts', () => ({
  redirectToCheckout: jest.fn(),
}))

describe('Componente UpgradeGate — Pantalla de Bloqueo / Upgrade', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renderiza correctamente el modal de upgrade con textos por defecto', () => {
    const handleClose = jest.fn()
    render(<UpgradeGate onClose={handleClose} />)

    expect(screen.getByText('Desbloquea Caudal Pro')).toBeInTheDocument()
    expect(screen.getByText(/Esta función es una herramienta exclusiva/)).toBeInTheDocument()
    expect(screen.getByLabelText('Cerrar modal')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('correo@ejemplo.com')).toBeInTheDocument()
  })

  test('muestra el nombre personalizado de la feature bloqueada', () => {
    const handleClose = jest.fn()
    render(<UpgradeGate featureName="Exportación a Excel" onClose={handleClose} />)

    expect(screen.getByText(/Exportación a Excel es una herramienta exclusiva/)).toBeInTheDocument()
  })

  test('llama a onClose al hacer clic en el botón de cancelar', () => {
    const handleClose = jest.fn()
    render(<UpgradeGate onClose={handleClose} />)

    const cancelBtn = screen.getByText('Regresar al Plan Free')
    fireEvent.click(cancelBtn)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  test('llama a onClose al hacer clic en el botón de cerrar en la esquina', () => {
    const handleClose = jest.fn()
    render(<UpgradeGate onClose={handleClose} />)

    const closeBtn = screen.getByLabelText('Cerrar modal')
    fireEvent.click(closeBtn)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  test('redirige a Stripe Checkout al enviar un correo válido', () => {
    const handleClose = jest.fn()
    render(<UpgradeGate onClose={handleClose} />)

    const emailInput = screen.getByPlaceholderText('correo@ejemplo.com')
    const form = screen.getByLabelText('Introduce tu Correo Electrónico').closest('form')

    fireEvent.change(emailInput, { target: { value: 'usuario_test@caudal.mx' } })
    fireEvent.submit(form)

    expect(redirectToCheckout).toHaveBeenCalledTimes(1)
    expect(redirectToCheckout).toHaveBeenCalledWith('usuario_test@caudal.mx')
  })
})
