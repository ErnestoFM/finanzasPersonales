import { db, resetDatabase } from '../../src/db/index.js'
import {
  createCategory,
  deleteCategory,
  ensureDefaultCategories,
  listCategories,
  updateCategory,
} from '../../src/features/categories/categoriesService.js'

beforeEach(async () => {
  await resetDatabase()
  await ensureDefaultCategories()
})

afterAll(async () => {
  await db.delete()
})

test('creación, edición y eliminación de categorías personalizadas', async () => {
  const id = await createCategory({
    name: 'Mascotas',
    kind: 'expense',
    color: '#111827',
    icon: '🐶',
  })

  let categories = await listCategories()
  expect(categories.some((item) => item.id === id)).toBe(true)

  await updateCategory(id, { name: 'Mascotas y cuidados', color: '#1f2937' })
  categories = await listCategories()
  expect(categories.find((item) => item.id === id).name).toBe('Mascotas y cuidados')

  await deleteCategory(id)
  categories = await listCategories()
  expect(categories.some((item) => item.id === id)).toBe(false)
})

test('validación de duplicados', async () => {
  await createCategory({ name: 'Viajes', kind: 'expense', color: '#111827', icon: '✈️' })
  await expect(
    createCategory({ name: 'Viajes', kind: 'expense', color: '#111827', icon: '✈️' }),
  ).rejects.toThrow('Ya existe una categoría con ese nombre.')
})

test('no duplica categorías por defecto', async () => {
  const initial = await listCategories()
  await ensureDefaultCategories()
  const after = await listCategories()
  expect(after).toHaveLength(initial.length)
})
