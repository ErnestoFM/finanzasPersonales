import React, { useState } from 'react'
import { redirectToCheckout } from '../../utils/payment/stripeManager.ts'

export default function UpgradeGate({ featureName = 'Esta función', onClose }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico para proceder.')
      return
    }
    setError('')
    redirectToCheckout(email)
  }

  return (
    <div id="upgrade-gate-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div id="upgrade-gate-container" className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-scale-up">
        {/* Encabezado con gradiente Premium */}
        <div className="bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 px-6 py-8 text-center text-white relative">
          <button
            onClick={onClose}
            id="upgrade-gate-close-btn"
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
            aria-label="Cerrar modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md shadow-inner">
            <svg className="h-7 w-7 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="mt-4 text-xl font-bold">Desbloquea Caudal Pro</h3>
          <p className="mt-2 text-xs text-indigo-100 max-w-xs mx-auto">
            {featureName} es una herramienta exclusiva para usuarios de nuestro plan premium.
          </p>
        </div>

        {/* Contenido / Formulario de Pago */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Beneficios Pro Desbloqueados:</h4>
              <ul className="mt-2 space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Exportación premium (Excel, CSV, PDF)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Motor fiscal completo (RESICO, Mixto, deducciones art. 151)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-indigo-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Simulador de escenarios y proyecciones
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="upgrade-email" className="block text-xs font-semibold text-slate-700">
                  Introduce tu Correo Electrónico
                </label>
                <input
                  id="upgrade-email"
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {error && <p id="upgrade-gate-error" className="text-xs text-rose-500">{error}</p>}
              </div>

              <button
                type="submit"
                id="upgrade-gate-stripe-btn"
                className="w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
              >
                Suscribirse por $79 MXN/mes
              </button>
            </form>

            <button
              onClick={onClose}
              id="upgrade-gate-cancel-btn"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-center text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Regresar al Plan Free
            </button>
          </div>

          <p className="mt-4 text-center text-[10px] text-slate-400">
            Pagos procesados de forma segura a través de la plataforma externa de Stripe.
          </p>
        </div>
      </div>
    </div>
  )
}
