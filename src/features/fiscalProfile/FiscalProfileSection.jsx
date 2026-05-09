import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  getFiscalProfile,
  getProfileSummary,
  isResicoLimitWarning,
  saveFiscalProfile,
} from './profileService.js'

const formatCurrency = (value) =>
  value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function FiscalProfileSection() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const current = await getFiscalProfile()
      setProfile(current)
    }
    load()
  }, [])

  if (!profile) return null

  const summary = getProfileSummary(profile)
  const limitWarning = isResicoLimitWarning(profile)

  const updateProfile = (path, value) => {
    setProfile((prev) => ({
      ...prev,
      [path]: {
        ...prev[path],
        ...value,
      },
    }))
  }

  const save = async () => {
    try {
      setSaving(true)
      setError(null)
      await saveFiscalProfile(profile)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Perfil fiscal">
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">Asalariado</h3>
            <label className="text-xs text-slate-500">
              <input
                type="checkbox"
                className="mr-2"
                checked={profile.salaried.active}
                onChange={(event) => updateProfile('salaried', { active: event.target.checked })}
              />
              Activo
            </label>
          </div>
          <input
            type="number"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ingreso mensual bruto"
            value={profile.salaried.monthlyIncome}
            onChange={(event) =>
              updateProfile('salaried', { monthlyIncome: Number(event.target.value) })
            }
            disabled={!profile.salaried.active}
          />
        </div>
        <div className="rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">RESICO</h3>
            <label className="text-xs text-slate-500">
              <input
                type="checkbox"
                className="mr-2"
                checked={profile.resico.active}
                onChange={(event) => updateProfile('resico', { active: event.target.checked })}
              />
              Activo
            </label>
          </div>
          <input
            type="number"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ingreso mensual"
            value={profile.resico.monthlyIncome}
            onChange={(event) =>
              updateProfile('resico', { monthlyIncome: Number(event.target.value) })
            }
            disabled={!profile.resico.active}
          />
          {limitWarning ? (
            <p className="mt-2 text-xs font-semibold text-rose-600">
              Estás cerca del límite anual RESICO.
            </p>
          ) : null}
        </div>
      </div>
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-800">
          Total combinado: {formatCurrency(summary.totalIncome)}
        </p>
        <p className="text-xs text-slate-500">
          Asalariado: {formatCurrency(summary.salariedIncome)} · RESICO:{' '}
          {formatCurrency(summary.resicoIncome)}
        </p>
      </div>
      <button
        className="w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Guardando...' : 'Guardar perfil'}
      </button>
    </Card>
  )
}
