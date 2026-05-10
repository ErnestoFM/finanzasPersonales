import { useMemo, useState } from 'react'
import Card from '../../components/Card.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from './categoriesService.js'

const CategoryRow = ({ category, onDelete, onEdit }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-100 p-3 text-sm">
    <div className="flex items-center gap-2">
      <span>{category.icon}</span>
      <span className="font-medium">{category.name}</span>
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: category.color }}
        aria-hidden
      />
    </div>
    <div className="flex items-center gap-2">
      <button className="text-xs text-slate-500" onClick={() => onEdit(category)}>
        Editar
      </button>
      <button className="text-xs text-rose-600" onClick={() => onDelete(category.id)}>
        Eliminar
      </button>
    </div>
  </div>
)

const CategoryEditor = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    color: initial?.color || '#64748b',
    icon: initial?.icon || '✨',
  })

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  return (
    <div className="grid gap-2 rounded-lg border border-slate-100 p-3 text-sm">
      <input
        className="rounded-lg border border-slate-200 px-3 py-2"
        placeholder="Nombre"
        value={form.name}
        onChange={handleChange('name')}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Color"
          type="color"
          value={form.color}
          onChange={handleChange('color')}
        />
        <input
          className="rounded-lg border border-slate-200 px-3 py-2"
          placeholder="Ícono"
          value={form.icon}
          onChange={handleChange('icon')}
        />
      </div>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white"
          onClick={() => onSave(form)}
        >
          Guardar
        </button>
        <button
          className="rounded-lg border border-slate-200 px-3 py-1 text-xs"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function CategoriesSection({ categories, onReload }) {
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.kind === 'income'),
    [categories],
  )
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === 'expense'),
    [categories],
  )

  const handleAction = async (action) => {
    try {
      setError(null)
      await action()
      await onReload()
      setEditing(null)
    } catch (err) {
      setError(err)
    }
  }

  return (
    <Card title="Categorías">
      {error ? (
        <ErrorState
          title="No se pudo actualizar"
          description={error.message}
          action={
            <button
              className="rounded-lg border border-rose-200 px-3 py-1 text-xs text-rose-700"
              onClick={() => setError(null)}
            >
              Cerrar
            </button>
          }
        />
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Ingresos</h3>
          {editing?.kind === 'income' ? (
            <CategoryEditor
              initial={editing}
              onSave={(form) =>
                editing.id
                  ? handleAction(() => updateCategory(editing.id, { ...form, kind: 'income' }))
                  : handleAction(() => createCategory({ ...form, kind: 'income' }))
              }
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              onClick={() => setEditing({ kind: 'income' })}
            >
              Agregar categoría
            </button>
          )}
          {incomeCategories.length ? (
            incomeCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onDelete={(id) => handleAction(() => deleteCategory(id))}
                onEdit={(item) => setEditing({ ...item, kind: 'income' })}
              />
            ))
          ) : (
            <EmptyState
              title="Sin categorías de ingreso"
              description="Crea una categoría personalizada para tus ingresos."
            />
          )}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Egresos</h3>
          {editing?.kind === 'expense' ? (
            <CategoryEditor
              initial={editing}
              onSave={(form) =>
                editing.id
                  ? handleAction(() => updateCategory(editing.id, { ...form, kind: 'expense' }))
                  : handleAction(() => createCategory({ ...form, kind: 'expense' }))
              }
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
              onClick={() => setEditing({ kind: 'expense' })}
            >
              Agregar categoría
            </button>
          )}
          {expenseCategories.length ? (
            expenseCategories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onDelete={(id) => handleAction(() => deleteCategory(id))}
                onEdit={(item) => setEditing({ ...item, kind: 'expense' })}
              />
            ))
          ) : (
            <EmptyState
              title="Sin categorías de egreso"
              description="Crea una categoría personalizada para tus egresos."
            />
          )}
        </div>
      </div>
    </Card>
  )
}
