import React, { useState, useEffect } from 'react'
import { getCurrentPlan, createCheckoutSessionUrl } from '../../utils/payment/stripeManager.ts'
import { Plan } from '../../utils/auth/featureGuard.ts'

export default function PricingPage() {
  const [currentPlan, setCurrentPlanState] = useState(Plan.Free)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getCurrentPlan().then((plan) => setCurrentPlanState(plan))
  }, [])

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico para continuar.')
      return
    }
    setError('')
    const checkoutUrl = createCheckoutSessionUrl(email)
    window.location.href = checkoutUrl
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Elige el flujo de tus finanzas
        </h2>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          Desbloquea el poder del análisis fiscal mexicano y proyecciones avanzadas.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-6 md:max-w-3xl md:grid-cols-2">
        {/* Plan Free */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-6 transition-all hover:border-slate-300">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Plan Esencial</h3>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                Básico
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              $0 <span className="text-sm font-normal text-slate-500">MXN / mes</span>
            </p>
            <p className="mt-2 text-xs text-slate-500">Para siempre. Todo offline.</p>

            <ul className="mt-6 space-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Registro de ingresos y egresos
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Categorización de movimientos
              </li>
              <li className="flex items-center gap-2 text-slate-400 line-through">
                <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Deducciones fiscales y RESICO completo
              </li>
              <li className="flex items-center gap-2 text-slate-400 line-through">
                <svg className="h-4 w-4 shrink-0 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exportación Excel, CSV y reporte PDF
              </li>
            </ul>
          </div>

          <div className="mt-8">
            {currentPlan === Plan.Free ? (
              <div className="block w-full rounded-xl bg-slate-200 py-3 text-center text-sm font-semibold text-slate-700">
                Tu Plan Actual
              </div>
            ) : (
              <button
                disabled
                className="block w-full rounded-xl bg-slate-100 py-3 text-center text-sm font-semibold text-slate-400 cursor-not-allowed"
              >
                Plan Activo
              </button>
            )}
          </div>
        </div>

        {/* Plan Pro */}
        <div className="relative flex flex-col justify-between rounded-2xl border-2 border-indigo-600 bg-white p-6 shadow-md transition-all hover:shadow-lg">
          <div className="absolute -top-3.5 right-4 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
            Recomendado
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Plan Pro</h3>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                Premium
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              $79 <span className="text-sm font-normal text-slate-500">MXN / mes</span>
            </p>
            <p className="mt-2 text-xs text-indigo-600 font-medium">Motor fiscal & Reportes pro</p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Motor fiscal completo:</strong> RESICO, Mixto y art. 151</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span><strong>Exportación premium:</strong> Excel (.xlsx), CSV, PDF</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Simulador de decisiones ilimitado
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sincronización segura con Supabase
              </li>
            </ul>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            {currentPlan === Plan.Pro ? (
              <div className="block w-full rounded-xl bg-indigo-50 py-3 text-center text-sm font-semibold text-indigo-700">
                ✨ Plan Pro Activo
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="checkout-email" className="sr-only">Correo electrónico</label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  {error && <p className="text-xs text-rose-500">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
                >
                  Suscribirse por $79 MXN/mes
                </button>
              </form>
            )}
            <p className="mt-3 text-center text-[10px] text-slate-400">
              Pagos seguros procesados por Stripe. Nunca almacenamos datos de tu tarjeta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
