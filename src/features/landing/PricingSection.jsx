import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'para siempre',
    description: 'Todo lo que necesitas para empezar a controlar tus finanzas hoy mismo.',
    cta: 'Empieza gratis',
    ctaTo: '/app',
    featured: false,
    features: [
      { included: true,  text: 'Registro ilimitado de ingresos y egresos' },
      { included: true,  text: 'Categorías predefinidas y personalizadas' },
      { included: true,  text: 'Dashboard mensual con gráficas' },
      { included: true,  text: 'Perfil fiscal (Asalariado / RESICO)' },
      { included: true,  text: 'Onboarding guiado en 4 pasos' },
      { included: true,  text: '100% offline — datos en tu dispositivo' },
      { included: true,  text: 'PIN de seguridad local' },
      { included: false, text: 'Motor fiscal completo (ISR exacto SAT 2025)' },
      { included: false, text: 'Simulador de decisiones financieras' },
      { included: false, text: 'Proyecciones a 6 y 12 meses' },
      { included: false, text: 'Sincronización en la nube' },
      { included: false, text: 'Exportación Excel / CSV / PDF' },
    ],
  },
  {
    name: 'Pro',
    price: '$149',
    period: 'al mes (MXN)',
    description: 'Para quienes quieren tomar decisiones financieras con datos reales y precisos.',
    cta: 'Próximamente',
    ctaTo: '#',
    featured: true,
    features: [
      { included: true, text: 'Todo lo del plan Free' },
      { included: true, text: 'Motor fiscal completo (ISR exacto SAT 2025)' },
      { included: true, text: 'Simulador de decisiones financieras' },
      { included: true, text: 'Proyecciones a 6 y 12 meses' },
      { included: true, text: 'Sincronización en la nube (Supabase)' },
      { included: true, text: 'Exportación Excel / CSV / PDF' },
      { included: true, text: 'Soporte prioritario' },
      { included: true, text: 'Actualizaciones de tablas SAT automáticas' },
    ],
  },
]

function CheckIcon({ included }) {
  if (included) {
    return (
      <svg className="h-4 w-4 shrink-0 text-flow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    )
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function PricingSection() {
  return (
    <section
      id="precios"
      className="relative bg-slate-900 py-24 px-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      {/* Orbe de fondo en el plan Pro */}
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 -z-10 h-96 w-96 -translate-y-1/2 rounded-full bg-brand-600/10 blur-[100px]" />

      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-flow-400">
          Precios
        </p>
        <h2 className="mt-4 text-center text-3xl font-black text-white sm:text-4xl">
          Empieza gratis.{' '}
          <span className="text-slate-500">Escala cuando lo necesites.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-center text-base text-slate-400">
          Sin trial de 7 días. Sin tarjeta requerida. El plan Free es para siempre.
        </p>

        <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${
                plan.featured
                  ? 'border border-brand-600/50 bg-gradient-to-br from-slate-950 to-slate-900 shadow-2xl shadow-brand-600/10 hover:shadow-brand-600/20'
                  : 'border border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-flow-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                    ✨ Recomendado
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${plan.featured ? 'text-brand-400' : 'text-slate-400'}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500 leading-relaxed">{plan.description}</p>

              <Link
                to={plan.ctaTo}
                className={`mt-8 block w-full rounded-xl py-3 text-center text-sm font-bold transition-all duration-200 ${
                  plan.featured
                    ? 'bg-gradient-to-r from-brand-600 to-flow-600 text-white shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5'
                    : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700'
                }`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-8 space-y-3">
                {plan.features.map(({ included, text }) => (
                  <li key={text} className="flex items-center gap-3">
                    <CheckIcon included={included} />
                    <span className={`text-sm ${included ? 'text-slate-300' : 'text-slate-600'}`}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-600">
          Los precios están en MXN e incluyen IVA. Pagos seguros via Stripe y PayPal.
          Cancela en cualquier momento.
        </p>
      </div>
    </section>
  )
}
