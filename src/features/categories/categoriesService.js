import { db } from '../../db/index.js'
import { requireField } from '../../utils/validation.js'
import { ValidationError } from '../../utils/errors.js'

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salario', color: '#6366f1', icon: '💼' },
  { name: 'Freelance', color: '#10b981', icon: '🧑‍💻' },
  { name: 'Honorarios', color: '#f97316', icon: '🧾' },
  { name: 'Inversiones', color: '#0ea5e9', icon: '📈' },
  { name: 'Otros', color: '#64748b', icon: '✨' },
]

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentación', color: '#ef4444', icon: '🍲' },
  { name: 'Renta', color: '#f59e0b', icon: '🏠' },
  { name: 'Transporte', color: '#3b82f6', icon: '🚌' },
  { name: 'Salud', color: '#14b8a6', icon: '🩺' },
  { name: 'Entretenimiento', color: '#a855f7', icon: '🎮' },
  { name: 'Ropa', color: '#ec4899', icon: '👕' },
  { name: 'Servicios', color: '#22c55e', icon: '🧾' },
  { name: 'Educación', color: '#eab308', icon: '📚' },
  { name: 'Otros', color: '#64748b', icon: '✨' },
]

export const ensureDefaultCategories = async () => {
  const count = await db.categories.count()
  if (count > 0) return
  const defaults = [
    ...DEFAULT_INCOME_CATEGORIES.map((category) => ({
      ...category,
      kind: 'income',
      isDefault: true,
    })),
    ...DEFAULT_EXPENSE_CATEGORIES.map((category) => ({
      ...category,
      kind: 'expense',
      isDefault: true,
    })),
  ]
  await db.categories.bulkAdd(defaults)
}

const hasDuplicate = async ({ name, kind, excludeId }) => {
  const existing = await db.categories
    .where({ kind })
    .filter((category) =>
      category.name.toLowerCase() === name.toLowerCase() && category.id !== excludeId)
    .first()
  return Boolean(existing)
}

export const listCategories = async () => db.categories.toArray()

export const createCategory = async ({ name, kind, color, icon }) => {
  requireField(name, 'El nombre de la categoría es obligatorio.')
  requireField(kind, 'El tipo de categoría es obligatorio.')

  if (await hasDuplicate({ name, kind })) {
    throw new ValidationError('Ya existe una categoría con ese nombre.')
  }

  return db.categories.add({
    name,
    kind,
    color: color || '#64748b',
    icon: icon || '✨',
    isDefault: false,
  })
}

export const updateCategory = async (id, updates) => {
  const current = await db.categories.get(id)
  const nextKind = updates.kind || current?.kind
  if (updates.name) {
    if (await hasDuplicate({ name: updates.name, kind: nextKind, excludeId: id })) {
      throw new ValidationError('Ya existe una categoría con ese nombre.')
    }
  }
  await db.categories.update(id, updates)
}

export const deleteCategory = async (id) => {
  await db.categories.delete(id)
}
