import { useEffect, useState } from 'react'

const defaultIncome = {
  amount: '',
  date: '',
  description: '',
  categoryId: '',
  type: 'one-time',
  regime: 'Asalariado',
}

const defaultExpense = {
  amount: '',
  date: '',
  description: '',
  categoryId: '',
  type: 'one-time',
}

export default function TransactionForm({
  kind,
  categories,
  onSubmit,
  onCancelEdit,
  editing,
}) {
  const isIncome = kind === 'income'
  const [form, setForm] = useState(isIncome ? defaultIncome : defaultExpense)

  useEffect(() => {
    if (editing) {
      setForm({
        amount: editing.amount,
        date: editing.date,
        description: editing.description,
        categoryId: editing.categoryId,
        type: editing.type,
        regime: editing.regime || 'Asalariado',
      })
    } else {
      setForm(isIncome ? defaultIncome : defaultExpense)
    }
  }, [editing, isIncome])

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const submit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      amount: Number(form.amount),
      categoryId: form.categoryId ? Number(form.categoryId) : '',
    })
  }

  return (
    <form className="grid gap-3" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Monto"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={handleChange('amount')}
          required
        />
        <input
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          type="date"
          value={form.date}
          onChange={handleChange('date')}
          required
        />
      </div>
      <input
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        placeholder="Descripción"
        value={form.description}
        onChange={handleChange('description')}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={form.categoryId}
          onChange={handleChange('categoryId')}
          required
        >
          <option value="">Categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={form.type}
          onChange={handleChange('type')}
          required
        >
          <option value="one-time">Único</option>
          <option value="recurring">Recurrente</option>
        </select>
      </div>
      {isIncome ? (
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={form.regime}
          onChange={handleChange('regime')}
          required
        >
          <option value="Asalariado">Asalariado</option>
          <option value="RESICO">RESICO</option>
          <option value="No fiscal">No fiscal</option>
        </select>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {editing ? 'Guardar cambios' : 'Agregar'}
        </button>
        {editing ? (
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            onClick={onCancelEdit}
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  )
}
