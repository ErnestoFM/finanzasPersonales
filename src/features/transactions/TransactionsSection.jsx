import { useMemo, useState } from 'react'
import Card from '../../components/Card.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  addExpense,
  addIncome,
  deleteExpense,
  deleteIncome,
  updateExpense,
  updateIncome,
} from './transactionsService.js'
import TransactionForm from './TransactionForm.jsx'

const formatCurrency = (value) =>
  value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

const TransactionList = ({ items, onEdit, onDelete }) => (
  <div className="space-y-2">
    {items.map((item) => (
      <div
        key={item.id}
        className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="font-semibold text-slate-800">{item.description}</p>
          <p className="text-xs text-slate-500">
            {item.date} · {item.type === 'recurring' ? 'Recurrente' : 'Único'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
          <button className="text-xs text-slate-500" onClick={() => onEdit(item)}>
            Editar
          </button>
          <button className="text-xs text-rose-600" onClick={() => onDelete(item.id)}>
            Eliminar
          </button>
        </div>
      </div>
    ))}
  </div>
)

export default function TransactionsSection({
  incomes,
  expenses,
  categories,
  onReloadIncomes,
  onReloadExpenses,
}) {
  const [error, setError] = useState(null)
  const [editingIncome, setEditingIncome] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.kind === 'income'),
    [categories],
  )
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === 'expense'),
    [categories],
  )

  const handle = async (action, reload, onDone) => {
    try {
      setError(null)
      await action()
      await reload()
      if (onDone) onDone()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <ErrorState
          title="No se pudo guardar"
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
        <Card title="Ingresos">
          <TransactionForm
            kind="income"
            categories={incomeCategories}
            editing={editingIncome}
            onCancelEdit={() => setEditingIncome(null)}
          onSubmit={(data) =>
            handle(
              () =>
                editingIncome
                  ? updateIncome(editingIncome.id, data)
                  : addIncome(data),
              onReloadIncomes,
              () => setEditingIncome(null),
            )
          }
        />
        {incomes.length ? (
          <TransactionList
            items={incomes}
            onEdit={setEditingIncome}
            onDelete={(id) => handle(() => deleteIncome(id), onReloadIncomes)}
          />
        ) : (
          <EmptyState
            title="Sin ingresos registrados"
            description="Registra tu primer ingreso para comenzar a ver tu balance."
          />
        )}
      </Card>
        <Card title="Egresos">
          <TransactionForm
            kind="expense"
            categories={expenseCategories}
            editing={editingExpense}
            onCancelEdit={() => setEditingExpense(null)}
            onSubmit={(data) =>
            handle(
              () =>
                editingExpense
                  ? updateExpense(editingExpense.id, data)
                  : addExpense(data),
              onReloadExpenses,
              () => setEditingExpense(null),
            )
          }
        />
        {expenses.length ? (
          <TransactionList
            items={expenses}
            onEdit={setEditingExpense}
            onDelete={(id) => handle(() => deleteExpense(id), onReloadExpenses)}
          />
        ) : (
          <EmptyState
            title="Sin egresos registrados"
            description="Registra tus egresos para tener una foto real de tu mes."
          />
        )}
      </Card>
      </div>
    </div>
  )
}
