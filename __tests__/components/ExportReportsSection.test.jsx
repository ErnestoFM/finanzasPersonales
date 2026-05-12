import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ExportReportsSection from '../../src/features/subscription/ExportReportsSection.jsx'
import { isSubscriptionActive } from '../../src/utils/payment/stripeManager.ts'

// Mockeamos isSubscriptionActive y xlsx para verificar comportamiento en ambos planes
jest.mock('../../src/utils/payment/stripeManager.ts', () => ({
  isSubscriptionActive: jest.fn(),
  createCheckoutSessionUrl: jest.fn(() => 'https://checkout.stripe.com/pay'),
  redirectToCheckout: jest.fn()
}))

jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    aoa_to_sheet: jest.fn(() => ({})),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn()
}))

describe('Componente ExportReportsSection — Exportación de Reportes', () => {
  const mockIncomes = [{ date: '2026-05-10', category: 'Sueldo', description: 'Pago quincena', amount: 15000 }]
  const mockExpenses = [{ date: '2026-05-11', category: 'Renta', description: 'Renta depa', amount: 5000 }]
  const mockCategories = [{ name: 'Sueldo', budget: 0 }, { name: 'Renta', budget: 6000 }]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mockeamos download/url helpers globales
    global.URL.createObjectURL = jest.fn(() => 'blob:url_test')
    global.open = jest.fn(() => ({
      document: {
        write: jest.fn(),
        close: jest.fn()
      },
      print: jest.fn()
    }))
  })

  test('renderiza correctamente el panel de exportación', () => {
    render(<ExportReportsSection incomes={mockIncomes} expenses={mockExpenses} categories={mockCategories} />)

    expect(screen.getByText('Exportación de Reportes Financieros')).toBeInTheDocument()
    expect(screen.getByText(/Descarga un respaldo completo/)).toBeInTheDocument()
    expect(screen.getByText('Excel (.xlsx)')).toBeInTheDocument()
    expect(screen.getByText('CSV Plano')).toBeInTheDocument()
    expect(screen.getByText('Reporte PDF')).toBeInTheDocument()
  })

  test('abre el modal de upgrade si un usuario sin suscripción intenta exportar', async () => {
    isSubscriptionActive.mockResolvedValue(false)

    render(<ExportReportsSection incomes={mockIncomes} expenses={mockExpenses} categories={mockCategories} />)

    const excelBtn = screen.getByText('Excel (.xlsx)')
    fireEvent.click(excelBtn)

    await waitFor(() => {
      expect(screen.getByText('Desbloquea Caudal Pro')).toBeInTheDocument()
      expect(screen.getByText(/La exportación a Excel es una herramienta exclusiva/)).toBeInTheDocument()
    })
  })

  test('permite la exportación si el usuario tiene una suscripción activa', async () => {
    isSubscriptionActive.mockResolvedValue(true)

    render(<ExportReportsSection incomes={mockIncomes} expenses={mockExpenses} categories={mockCategories} />)

    const excelBtn = screen.getByText('Excel (.xlsx)')
    fireEvent.click(excelBtn)

    await waitFor(() => {
      // No debería mostrar el modal
      expect(screen.queryByText('Desbloquea Caudal Pro')).toBeNull()
    })
  })
})
