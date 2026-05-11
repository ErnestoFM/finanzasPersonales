const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    tag: 'Fiscal',
    title: 'Régimen mixto',
    description:
      'Calcula tu ISR real si tienes Asalariado + RESICO al mismo tiempo. Bases gravables independientes, consolidación al final. Tablas SAT 2025 incluidas.',
    accent: 'from-flow-500 to-flow-700',
    glow: 'group-hover:shadow-flow-500/20',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    tag: 'Pro',
    title: 'Simulador de decisiones',
    description:
      '¿Qué pasa si subo mis ingresos RESICO $5,000? ¿Vale la pena el cambio de régimen? Simula escenarios antes de tomar decisiones irreversibles.',
    accent: 'from-brand-500 to-brand-700',
    glow: 'group-hover:shadow-brand-500/20',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 6.343a9 9 0 000 12.728M9.172 9.172a5 5 0 000 7.072M12 12h.01" />
      </svg>
    ),
    tag: 'Core',
    title: 'Offline-first total',
    description:
      'Todo vive en tu dispositivo con IndexedDB. Sin internet, sin servidores, sin esperar. Instálala como PWA y úsala como app nativa en Android o iOS.',
    accent: 'from-emerald-500 to-emerald-700',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    tag: 'Pro',
    title: 'Proyecciones fiscales',
    description:
      'Ve tu carga fiscal estimada a 6 y 12 meses según tus ingresos actuales. Anticipa retenciones, ISR anual y el impacto de deducciones personales.',
    accent: 'from-violet-500 to-violet-700',
    glow: 'group-hover:shadow-violet-500/20',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
    tag: 'Core',
    title: 'Categorías inteligentes',
    description:
      'Categorías predefinidas por tipo de ingreso y egreso, con color e ícono personalizables. Tus gastos, organizados como tú los entiendes.',
    accent: 'from-amber-500 to-amber-700',
    glow: 'group-hover:shadow-amber-500/20',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    tag: 'Core',
    title: 'Privacidad por diseño',
    description:
      'PIN de 4 dígitos hasheado localmente con Web Crypto API. Tus datos nunca salen de tu dispositivo sin tu permiso. Sin telemetría oculta.',
    accent: 'from-rose-500 to-rose-700',
    glow: 'group-hover:shadow-rose-500/20',
  },
]

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative bg-slate-900 py-24 px-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-flow-400">
          Qué incluye
        </p>
        <h2 className="mt-4 text-center text-3xl font-black text-white sm:text-4xl lg:text-5xl">
          Todo lo que necesitas.{' '}
          <span className="text-slate-500">Nada que no.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-center text-base text-slate-400">
          Construido para el contexto fiscal y financiero mexicano. No adaptado — diseñado desde cero.
        </p>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon, tag, title, description, accent, glow }) => (
            <div
              key={title}
              className={`group relative flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition-all duration-300 hover:border-slate-700 hover:-translate-y-1 hover:shadow-xl ${glow}`}
            >
              {/* Badge de tag */}
              <div className="mb-5 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
                  {icon}
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  tag === 'Pro'
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : tag === 'Fiscal'
                    ? 'bg-flow-600/20 text-flow-400 border border-flow-600/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {tag}
                </span>
              </div>

              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
