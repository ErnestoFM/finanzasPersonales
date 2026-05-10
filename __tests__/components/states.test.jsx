import { render, screen } from '@testing-library/react'
import EmptyState from '../../src/components/EmptyState.jsx'
import ErrorState from '../../src/components/ErrorState.jsx'

test('renderiza estados vacíos', () => {
  render(<EmptyState title="Sin datos" description="Agrega un registro" />)
  expect(screen.getByText('Sin datos')).toBeInTheDocument()
  expect(screen.getByText('Agrega un registro')).toBeInTheDocument()
})

test('renderiza estados de error', () => {
  render(<ErrorState title="Error" description="Intenta más tarde" />)
  expect(screen.getByText('Error')).toBeInTheDocument()
  expect(screen.getByText('Intenta más tarde')).toBeInTheDocument()
})
