const steps = [
  {
    number: '01',
    title: 'Registra',
    description:
      'Agrega ingresos y egresos en segundos. Elige la categoría, el régimen fiscal y el tipo (único o recurrente). Sin formularios interminables.',
    detail: 'Funciona 100% offline desde el primer día.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Categoriza',
    description:
      'Caudal organiza tus movimientos por categorías con color e ícono. Mira de un vistazo en qué gastas más y de dónde viene tu dinero.',
    detail: 'Dashboard en tiempo real con gráficas de Recharts.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Calcula',
    description:
      'El motor fiscal de Caudal aplica automáticamente las tablas del SAT 2025. Ve tu ISR estimado, la tasa efectiva y el impacto de cada régimen.',
    detail: 'Art. 96 y 113-E LISR. Subsidio al empleo incluido.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    number: '04',
    title: 'Decide',
    description:
      'Con el simulador de decisiones (Pro), compara escenarios: ¿qué pasa si cambio de régimen? ¿Si adelanto una deducción? Entiende el impacto antes de actuar.',
    detail: 'Proyecciones a 6 y 12 meses.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function HowItWorksSection() {
  return (
    <section
      id="como-funciona"
      className="relative bg-slate-950 py-24 px-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flow-500/20 to-transparent" />

      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-flow-400">
          Flujo de uso
        </p>
        <h2 className="mt-4 text-center text-3xl font-black text-white sm:text-4xl">
          Tan simple como debe ser.{' '}
          <span className="text-slate-500">Tan poderoso como lo necesitas.</span>
        </h2>

        {/* Timeline vertical en mobile, horizontal en desktop */}
        <div className="mt-16 relative">
          {/* Línea conectora (desktop) */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-14 hidden h-px bg-gradient-to-r from-transparent via-flow-500/30 to-transparent lg:block"
          />

          <div className="grid gap-8 lg:grid-cols-4">
            {steps.map(({ number, title, description, detail, icon }, idx) => (
              <div
                key={number}
                className="group relative flex flex-col items-start"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* Número + ícono */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-flow-500/30 bg-slate-900 text-flow-400 shadow-lg shadow-flow-500/10 transition-all duration-300 group-hover:border-flow-400/60 group-hover:bg-flow-900/30 group-hover:text-flow-300">
                  {icon}
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-flow-500 text-[9px] font-black text-white">
                    {idx + 1}
                  </span>
                </div>

                {/* Texto */}
                <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-300">
                  {description}
                </p>
                <p className="mt-3 text-xs font-semibold text-flow-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
