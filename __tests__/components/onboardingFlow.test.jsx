import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { db, resetDatabase } from '../../src/db/index.js'
import { ensureDefaultCategories, listCategories } from '../../src/features/categories/categoriesService.js'
import OnboardingFlow from '../../src/features/onboarding/OnboardingFlow.jsx'

beforeEach(async () => {
  await resetDatabase()
  await ensureDefaultCategories()
})

afterAll(async () => {
  await db.delete()
})

test('permite saltar onboarding', async () => {
  const user = userEvent.setup()
  const onSkip = jest.fn()
  render(
    <OnboardingFlow
      categories={await listCategories()}
      onComplete={jest.fn()}
      onSkip={onSkip}
      onRefresh={jest.fn()}
    />,
  )

  await user.click(screen.getByRole('button', { name: 'Saltar' }))
  expect(onSkip).toHaveBeenCalled()
})

test('completa el flujo de onboarding', async () => {
  const user = userEvent.setup()
  const onComplete = jest.fn()
  const categories = await listCategories()

  render(
    <OnboardingFlow
      categories={categories}
      onComplete={onComplete}
      onSkip={jest.fn()}
      onRefresh={jest.fn()}
    />,
  )

  await user.click(screen.getByRole('button', { name: 'Continuar' }))

  await user.click(screen.getByLabelText('Asalariado'))
  await user.type(screen.getByPlaceholderText('Ingreso mensual asalariado'), '15000')
  await user.click(screen.getByLabelText('RESICO'))
  await user.type(screen.getByPlaceholderText('Ingreso mensual RESICO'), '8000')
  await user.click(screen.getByRole('button', { name: 'Continuar' }))

  await user.type(await screen.findByLabelText('Monto ingreso'), '2000')
  await user.type(screen.getByLabelText('Fecha ingreso'), '2024-06-01')
  await user.type(screen.getByLabelText('Descripción ingreso'), 'Pago inicial')
  await user.selectOptions(screen.getByLabelText('Categoría ingreso'), [
    categories.find((category) => category.kind === 'income').id.toString(),
  ])
  await user.selectOptions(screen.getByLabelText('Tipo ingreso'), ['recurring'])
  await user.selectOptions(screen.getByLabelText('Régimen ingreso'), ['RESICO'])
  await user.click(screen.getByRole('button', { name: 'Continuar' }))

  await user.type(await screen.findByLabelText('Nombre categoría'), 'Extra')
  await user.selectOptions(screen.getByLabelText('Tipo categoría'), ['expense'])
  fireEvent.change(screen.getByLabelText('Color categoría'), { target: { value: '#111827' } })
  await user.clear(screen.getByLabelText('Ícono categoría'))
  await user.type(screen.getByLabelText('Ícono categoría'), '💡')
  await user.click(screen.getByRole('button', { name: 'Finalizar' }))

  await waitFor(() => expect(onComplete).toHaveBeenCalled())
})

test('muestra error cuando falta información', async () => {
  const user = userEvent.setup()
  render(
    <OnboardingFlow
      categories={await listCategories()}
      onComplete={jest.fn()}
      onSkip={jest.fn()}
      onRefresh={jest.fn()}
    />,
  )

  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(screen.getByRole('button', { name: 'Continuar' }))
  await user.click(await screen.findByRole('button', { name: 'Continuar' }))

  expect(await screen.findByText('No se pudo completar')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Cerrar' }))
})
