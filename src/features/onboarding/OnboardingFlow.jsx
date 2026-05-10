import { useState } from 'react'
import Card from '../../components/Card.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import { addIncome } from '../transactions/transactionsService.js'
import { createCategory } from '../categories/categoriesService.js'
import { saveFiscalProfile } from '../fiscalProfile/profileService.js'

const steps = [
  { id: 'welcome', title: 'Bienvenida' },
  { id: 'regimen', title: 'Régimen fiscal' },
  { id: 'income', title: 'Primer ingreso' },
  { id: 'category', title: 'Primera categoría' },
]

export default function OnboardingFlow({ categories, onComplete, onSkip, onRefresh }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState({
    salaried: { active: false, monthlyIncome: 0 },
    resico: { active: false, monthlyIncome: 0 },
  })
  const [income, setIncome] = useState({
    amount: '',
    date: '',
    description: '',
    categoryId: '',
    type: 'one-time',
    regime: 'Asalariado',
  })
  const [category, setCategory] = useState({
    name: '',
    color: '#6366f1',
    icon: '✨',
    kind: 'income',
  })

  const current = steps[stepIndex]

  const next = async () => {
    try {
      setError(null)
      if (current.id === 'regimen') {
        await saveFiscalProfile(profile)
      }
      if (current.id === 'income') {
        await addIncome({
          ...income,
          amount: Number(income.amount),
          categoryId: income.categoryId ? Number(income.categoryId) : '',
        })
      }
      if (current.id === 'category') {
        await createCategory(category)
      }
      if (stepIndex === steps.length - 1) {
        await onRefresh()
        onComplete()
      } else {
        setStepIndex((prev) => prev + 1)
      }
    } catch (err) {
      setError(err)
    }
  }

  const progress = ((stepIndex + 1) / steps.length) * 100

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Caudal</h1>
        <p className="text-sm text-slate-600">
          Configura lo esencial para comenzar a registrar tus finanzas.
        </p>
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-brand-600" style={{ width: `${progress}%` }} />
        </div>
      </header>
      {error ? (
        <ErrorState
          title="No se pudo completar"
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
      <Card title={current.title}>
        {current.id === 'welcome' ? (
          <div className="space-y-3 text-sm text-slate-600">
            <p>Registra ingresos, egresos y tu régimen fiscal para tomar decisiones claras.</p>
            <p>En 4 pasos estarás listo.</p>
          </div>
        ) : null}

        {current.id === 'regimen' ? (
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.salaried.active}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    salaried: { ...prev.salaried, active: event.target.checked },
                  }))
                }
              />
              Asalariado
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="number"
              placeholder="Ingreso mensual asalariado"
              value={profile.salaried.monthlyIncome}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  salaried: { ...prev.salaried, monthlyIncome: Number(event.target.value) },
                }))
              }
              disabled={!profile.salaried.active}
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={profile.resico.active}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    resico: { ...prev.resico, active: event.target.checked },
                  }))
                }
              />
              RESICO
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="number"
              placeholder="Ingreso mensual RESICO"
              value={profile.resico.monthlyIncome}
              onChange={(event) =>
                setProfile((prev) => ({
                  ...prev,
                  resico: { ...prev.resico, monthlyIncome: Number(event.target.value) },
                }))
              }
              disabled={!profile.resico.active}
            />
          </div>
        ) : null}

        {current.id === 'income' ? (
          <div className="space-y-3 text-sm">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Monto"
              type="number"
              aria-label="Monto ingreso"
              value={income.amount}
              onChange={(event) => setIncome((prev) => ({ ...prev, amount: event.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Fecha"
              type="date"
              aria-label="Fecha ingreso"
              value={income.date}
              onChange={(event) => setIncome((prev) => ({ ...prev, date: event.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Descripción"
              aria-label="Descripción ingreso"
              value={income.description}
              onChange={(event) =>
                setIncome((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              aria-label="Categoría ingreso"
              value={income.categoryId}
              onChange={(event) =>
                setIncome((prev) => ({ ...prev, categoryId: event.target.value }))
              }
            >
              <option value="">Categoría</option>
              {categories
                .filter((category) => category.kind === 'income')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              aria-label="Tipo ingreso"
              value={income.type}
              onChange={(event) => setIncome((prev) => ({ ...prev, type: event.target.value }))}
            >
              <option value="one-time">Único</option>
              <option value="recurring">Recurrente</option>
            </select>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              aria-label="Régimen ingreso"
              value={income.regime}
              onChange={(event) =>
                setIncome((prev) => ({ ...prev, regime: event.target.value }))
              }
            >
              <option value="Asalariado">Asalariado</option>
              <option value="RESICO">RESICO</option>
              <option value="No fiscal">No fiscal</option>
            </select>
          </div>
        ) : null}

        {current.id === 'category' ? (
          <div className="space-y-3 text-sm">
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Nombre"
              aria-label="Nombre categoría"
              value={category.name}
              onChange={(event) => setCategory((prev) => ({ ...prev, name: event.target.value }))}
            />
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              aria-label="Tipo categoría"
              value={category.kind}
              onChange={(event) => setCategory((prev) => ({ ...prev, kind: event.target.value }))}
            >
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
            </select>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              type="color"
              aria-label="Color categoría"
              value={category.color}
              onChange={(event) => setCategory((prev) => ({ ...prev, color: event.target.value }))}
            />
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Ícono"
              aria-label="Ícono categoría"
              value={category.icon}
              onChange={(event) => setCategory((prev) => ({ ...prev, icon: event.target.value }))}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={next}
          >
            {stepIndex === steps.length - 1 ? 'Finalizar' : 'Continuar'}
          </button>
          <button
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            onClick={onSkip}
          >
            Saltar
          </button>
        </div>
      </Card>
    </div>
  )
}
