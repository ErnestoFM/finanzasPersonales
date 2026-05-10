const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

export const filterByMonth = (items, referenceDate = new Date()) => {
  const start = startOfMonth(referenceDate)
  const end = endOfMonth(referenceDate)
  return items.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= start && itemDate <= end
  })
}

export const getMonthlyTotals = (incomes, expenses, referenceDate = new Date()) => {
  const monthIncomes = filterByMonth(incomes, referenceDate)
  const monthExpenses = filterByMonth(expenses, referenceDate)
  const incomeTotal = monthIncomes.reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = monthExpenses.reduce((sum, item) => sum + item.amount, 0)
  return {
    incomeTotal,
    expenseTotal,
    net: incomeTotal - expenseTotal,
  }
}

export const getHealthStatus = (net) => {
  if (net > 0) {
    return { label: 'Superávit', tone: 'emerald' }
  }
  if (net < 0) {
    return { label: 'Déficit', tone: 'rose' }
  }
  return { label: 'Equilibrado', tone: 'amber' }
}

export const getExpenseBreakdown = (expenses, categories) => {
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  return expenses.reduce((acc, expense) => {
    const category = categoryMap.get(expense.categoryId)
    const key = category ? category.name : 'Sin categoría'
    const color = category?.color || '#94a3b8'
    const current = acc.get(key) || { name: key, value: 0, color }
    current.value += expense.amount
    acc.set(key, current)
    return acc
  }, new Map())
}

export const getExpenseBreakdownChart = (expenses, categories) =>
  Array.from(getExpenseBreakdown(expenses, categories).values())

export const getMonthlyComparison = (incomes, expenses, months = 6, referenceDate = new Date()) => {
  const results = []
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - offset, 1)
    const totals = getMonthlyTotals(incomes, expenses, date)
    results.push({
      label: date.toLocaleDateString('es-MX', { month: 'short' }),
      ingresos: totals.incomeTotal,
      egresos: totals.expenseTotal,
    })
  }
  return results
}
