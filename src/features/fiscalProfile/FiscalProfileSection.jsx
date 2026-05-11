import { useEffect, useState } from 'react'
import Card from '../../components/Card.jsx'
import ErrorState from '../../components/ErrorState.jsx'
import {
  getFiscalProfile,
  getProfileSummary,
  isResicoLimitWarning,
  saveFiscalProfile,
} from './profileService.js'
import { Feature, Plan, isFeatureAvailable } from '../../utils/auth/featureGuard.ts'
import { calculateMixedTax } from '../../utils/fiscal/taxCalculator.js'
import { getSetting, setSetting } from '../../db/settings.js'

const formatCurrency = (value) =>
  value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function FiscalProfileSection() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isPro, setIsPro] = useState(false)

  const loadData = async () => {
    const currentProfile = await getFiscalProfile()
    setProfile(currentProfile)
    const hasTaxEngine = await isFeatureAvailable(Feature.TaxEngine)
    setIsPro(hasTaxEngine)
  }

  useEffect(() => {
    loadData()
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
      await loadData() // Refresh calculation with updated income levels
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  const toggleProPlan = async () => {
    try {
      const nextPlan = isPro ? Plan.Free : Plan.Pro
      await setSetting('subscriptionPlan', nextPlan)
      await loadData()
    } catch (err) {
      setError(err)
    }
  }

  // Calculate taxes if the user profile is active
  const taxes = calculateMixedTax(
    profile.salaried.active ? profile.salaried.monthlyIncome : 0,
    profile.resico.active ? profile.resico.monthlyIncome : 0
  )

  const effectiveTaxRate = summary.totalIncome > 0 
    ? (taxes.totalTax / summary.totalIncome) * 100 
    : 0

  return (
    <Card title="Perfil fiscal">
      {error ? (
        <ErrorState
          title="No se pudo procesar"
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

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Configuración de regímenes
        </span>
        <button
          onClick={toggleProPlan}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all duration-300 ${
            isPro
              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          {isPro ? '✨ Cuenta Pro (Simulado)' : '🔓 Probar Pro (Simulado)'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-100 p-4 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center">
              💼 Asalariado
            </h3>
            <label className="text-xs text-slate-500 flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="mr-2 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={profile.salaried.active}
                onChange={(event) => updateProfile('salaried', { active: event.target.checked })}
              />
              Activo
            </label>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Sueldos y salarios (art. 96 LISR)</p>
          <input
            type="number"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Ingreso mensual bruto"
            value={profile.salaried.monthlyIncome || ''}
            onChange={(event) =>
              updateProfile('salaried', { monthlyIncome: Number(event.target.value) })
            }
            disabled={!profile.salaried.active}
          />
        </div>

        <div className="rounded-xl border border-slate-100 p-4 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center">
              🌱 RESICO
            </h3>
            <label className="text-xs text-slate-500 flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                className="mr-2 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={profile.resico.active}
                onChange={(event) => updateProfile('resico', { active: event.target.checked })}
              />
              Activo
            </label>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Régimen Simplificado (art. 113-E LISR)</p>
          <input
            type="number"
            className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="Ingreso mensual"
            value={profile.resico.monthlyIncome || ''}
            onChange={(event) =>
              updateProfile('resico', { monthlyIncome: Number(event.target.value) })
            }
            disabled={!profile.resico.active}
          />
          {limitWarning ? (
            <div className="mt-2 flex items-center gap-1.5 text-rose-600">
              <span className="animate-pulse h-2 w-2 rounded-full bg-rose-500"></span>
              <p className="text-[11px] font-semibold">
                Estás cerca del límite anual RESICO (3.5M MXN).
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm border border-slate-100">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-slate-800">Total combinado mensual:</span>
          <span className="font-bold text-slate-900 text-lg">{formatCurrency(summary.totalIncome)}</span>
        </div>
        <div className="text-xs text-slate-500 flex gap-3 flex-wrap">
          <span>💼 Asalariado: {formatCurrency(summary.salariedIncome)}</span>
          <span>•</span>
          <span>🌱 RESICO: {formatCurrency(summary.resicoIncome)}</span>
        </div>
      </div>

      {/* MOTOR FISCAL COMPLETO (Premium Feature Block) */}
      <div className="mt-4 border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
          📊 Motor Fiscal Caudal
        </h4>

        {isPro ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <div>
                <p className="text-slate-400 mb-0.5">Retención ISR Asalariado</p>
                <p className="font-semibold text-slate-800">{formatCurrency(taxes.salariedTax)}</p>
              </div>
              <div>
                <p className="text-slate-400 mb-0.5">ISR Mensual RESICO</p>
                <p className="font-semibold text-slate-800">{formatCurrency(taxes.resicoTax)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center bg-brand-50/50 border border-brand-100 p-3 rounded-lg text-sm">
              <div>
                <p className="font-semibold text-slate-800">Carga Fiscal Total Mensual (ISR)</p>
                <p className="text-[10px] text-slate-400">Impuestos estimados SAT 2025</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-700">{formatCurrency(taxes.totalTax)}</p>
                <p className="text-[10px] font-semibold text-brand-600">
                  Tasa Efectiva: {effectiveTaxRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/60 rounded-lg p-5 text-center shadow-inner">
            <div className="mb-2 text-xl">🔒</div>
            <h5 className="text-sm font-semibold text-slate-800 mb-1">
              Desbloquea el Cálculo de Impuestos Real
            </h5>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Caudal Pro aplica automáticamente las tablas mensuales del SAT 2025 de ISR y subsidio al empleo para estimar tus retenciones exactas.
            </p>
            <button
              onClick={toggleProPlan}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              ✨ Desbloquear Motor Fiscal (Pro)
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <button
          className="rounded-lg bg-brand-600 hover:bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200"
          onClick={save}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </Card>
  )
}
