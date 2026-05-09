import { db, resetDatabase } from '../../src/db/index.js'
import {
  addExpense,
  addIncome,
  deleteExpense,
  deleteIncome,
  listExpenses,
  listIncomes,
  updateExpense,
  updateIncome,
} from '../../src/features/transactions/transactionsService.js'
import { ensureDefaultCategories, listCategories } from '../../src/features/categories/categoriesService.js'

beforeEach(async () => {
  await resetDatabase()
  await ensureDefaultCategories()
})

afterAll(async () => {
  await db.delete()
})

test('ingresos: CRUD completo y persistencia', async () => {
  const [category] = (await listCategories()).filter((item) => item.kind === 'income')
  const incomeId = await addIncome({
    amount: 1200,
    date: '2024-06-01',
    description: 'Salario base',
    categoryId: category.id,
    type: 'one-time',
    regime: 'Asalariado',
  })

  let incomes = await listIncomes()
  expect(incomes).toHaveLength(1)
  expect(incomes[0].id).toBe(incomeId)

  await updateIncome(incomeId, {
    amount: 1500,
    date: '2024-06-02',
    description: 'Salario ajustado',
    categoryId: category.id,
    type: 'recurring',
    regime: 'Asalariado',
  })

  incomes = await listIncomes()
  expect(incomes[0].amount).toBe(1500)

  await deleteIncome(incomeId)
  incomes = await listIncomes()
  expect(incomes).toHaveLength(0)
})

test('egresos: CRUD completo y persistencia', async () => {
  const [category] = (await listCategories()).filter((item) => item.kind === 'expense')
  const expenseId = await addExpense({
    amount: 300,
    date: '2024-06-03',
    description: 'Comida',
    categoryId: category.id,
    type: 'one-time',
  })

  let expenses = await listExpenses()
  expect(expenses).toHaveLength(1)

  await updateExpense(expenseId, {
    amount: 350,
    date: '2024-06-03',
    description: 'Comida y snacks',
    categoryId: category.id,
    type: 'recurring',
  })

  expenses = await listExpenses()
  expect(expenses[0].amount).toBe(350)

  await deleteExpense(expenseId)
  expenses = await listExpenses()
  expect(expenses).toHaveLength(0)
})

test('validaciones de transacciones', async () => {
  await expect(
    addIncome({
      amount: 0,
      date: '',
      description: '',
      categoryId: '',
      type: '',
      regime: '',
    }),
  ).rejects.toThrow('El monto debe ser mayor a cero.')
})
