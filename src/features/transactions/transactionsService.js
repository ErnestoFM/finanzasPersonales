import { db } from '../../db/index.js'
import { requireField, requirePositiveNumber } from '../../utils/validation.js'

const validateBase = (data) => {
  requirePositiveNumber(data.amount, 'El monto debe ser mayor a cero.')
  requireField(data.date, 'La fecha es obligatoria.')
  requireField(data.description, 'La descripción es obligatoria.')
  requireField(data.categoryId, 'La categoría es obligatoria.')
  requireField(data.type, 'El tipo de registro es obligatorio.')
}

export const listIncomes = async () => db.incomes.toArray()
export const listExpenses = async () => db.expenses.toArray()

export const addIncome = async (data) => {
  validateBase(data)
  requireField(data.regime, 'El régimen fiscal es obligatorio.')
  return db.incomes.add(data)
}

export const updateIncome = async (id, data) => {
  validateBase(data)
  requireField(data.regime, 'El régimen fiscal es obligatorio.')
  await db.incomes.update(id, data)
}

export const deleteIncome = async (id) => {
  await db.incomes.delete(id)
}

export const addExpense = async (data) => {
  validateBase(data)
  return db.expenses.add(data)
}

export const updateExpense = async (id, data) => {
  validateBase(data)
  await db.expenses.update(id, data)
}

export const deleteExpense = async (id) => {
  await db.expenses.delete(id)
}
