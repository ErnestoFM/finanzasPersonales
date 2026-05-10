import {
  filterByMonth,
  getExpenseBreakdownChart,
  getHealthStatus,
  getMonthlyComparison,
  getMonthlyTotals,
} from '../../../src/utils/finance/index.js'

const categories = [
  { id: 1, name: 'Renta', color: '#111827' },
  { id: 2, name: 'Salario', color: '#6366f1' },
]

test('calcula totales y salud financiera', () => {
  const incomes = [{ amount: 2000, date: '2024-06-01' }]
  const expenses = [{ amount: 500, date: '2024-06-02' }]
  const totals = getMonthlyTotals(incomes, expenses, new Date('2024-06-10'))
  expect(totals.incomeTotal).toBe(2000)
  expect(totals.expenseTotal).toBe(500)
  expect(getHealthStatus(totals.net).label).toBe('Superávit')
})

test('detecta déficit y filtra por mes', () => {
  const incomes = [{ amount: 100, date: '2024-05-01' }]
  const expenses = [{ amount: 200, date: '2024-05-02' }]
  const totals = getMonthlyTotals(incomes, expenses, new Date('2024-05-15'))
  expect(getHealthStatus(totals.net).label).toBe('Déficit')
  const juneTotals = getMonthlyTotals(incomes, expenses, new Date('2024-06-01'))
  expect(juneTotals.incomeTotal).toBe(0)
})

test('identifica balance equilibrado', () => {
  const totals = getMonthlyTotals(
    [{ amount: 500, date: '2024-07-01' }],
    [{ amount: 500, date: '2024-07-02' }],
    new Date('2024-07-10'),
  )
  expect(getHealthStatus(totals.net).label).toBe('Equilibrado')
})

test('agrega distribución por categoría', () => {
  const expenses = [
    { amount: 300, categoryId: 1 },
    { amount: 200, categoryId: 1 },
  ]
  const breakdown = getExpenseBreakdownChart(expenses, categories)
  expect(breakdown[0].value).toBe(500)
})

test('asigna gastos sin categoría', () => {
  const expenses = [{ amount: 120, categoryId: 99 }]
  const breakdown = getExpenseBreakdownChart(expenses, categories)
  expect(breakdown[0].name).toBe('Sin categoría')
})

test('compara ingresos y egresos en 6 meses', () => {
  const incomes = [{ amount: 1000, date: '2024-04-01' }]
  const expenses = [{ amount: 400, date: '2024-04-15' }]
  const comparison = getMonthlyComparison(incomes, expenses, 6, new Date('2024-04-20'))
  expect(comparison).toHaveLength(6)
})

test('usa fechas por defecto cuando no se envían', () => {
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const totals = getMonthlyTotals(
    [{ amount: 100, date: todayString }],
    [{ amount: 20, date: todayString }],
  )
  expect(totals.net).toBe(80)
  expect(getMonthlyComparison([], []).length).toBe(6)
  expect(filterByMonth([{ date: todayString }]).length).toBe(1)
})
