const values = [
  {
    icon: '🇲🇽',
    title: 'Hecho para México',
    description:
      'No adaptamos una app extranjera al SAT. Caudal nació para el contexto fiscal y financiero mexicano desde la primera línea de código.',
  },
  {
    icon: '🔒',
    title: 'Privacidad real',
    description:
      'Sin anuncios. Sin venta de datos. Sin telemetría oculta. Tu información financiera es tuya y solo tuya. Siempre.',
  },
  {
    icon: '⚡',
    title: 'Velocidad sobre todo',
    description:
      'Una app de finanzas que tarda 5 segundos en cargar no la usas. Caudal abre instantáneamente porque vive en tu dispositivo.',
  },
]

export default function AboutSection() {
  return (
    <section
      id="nosotros"
      className="relative bg-slate-950 py-24 px-6"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flow-500/20 to-transparent" />

      {/* Orbe de fondo */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-flow-600/5 blur-[120px]" />

      <div className="mx-auto max-w-5xl">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Texto principal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-flow-400">
              Sobre Caudal
            </p>
            <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl leading-tight">
              Construido por alguien que
              <br />
              <span className="text-flow-300">también paga impuestos</span>
              <br />
              en México.
            </h2>
            <p className="mt-6 text-base text-slate-400 leading-relaxed">
              Caudal nació de una frustración concreta: ninguna app de finanzas personales
              entendía que los mexicanos podemos tener régimen mixto, que el subsidio al
              empleo cambia cada año, y que necesitamos decidir —no solo registrar.
            </p>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              No somos un banco. No somos una fintech con millones de inversión.
              Somos desarrolladores que querían una herramienta honesta, rápida y
              privada para entender sus propias finanzas.
            </p>
            <p className="mt-4 text-base text-slate-400 leading-relaxed">
              <span className="text-flow-300 font-semibold">Caudal</span> — como el flujo
              del agua — representa el movimiento constante del dinero: de dónde viene,
              adónde va, y cómo canalizarlo mejor.
            </p>
          </div>

          {/* Values */}
          <div className="flex flex-col gap-5">
            {values.map(({ icon, title, description }) => (
              <div
                key={title}
                className="flex gap-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 transition-all duration-300 hover:border-flow-500/30 hover:bg-slate-900"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-2xl">
                  {icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}

            {/* Versión / Estado */}
            <div className="mt-2 rounded-2xl border border-dashed border-flow-500/20 bg-flow-900/10 p-5">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-flow-400 animate-pulse" />
                <p className="text-xs font-semibold text-flow-300">
                  Fase 1 — Disponible ahora
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                CRUD, dashboard, motor fiscal, onboarding, PIN y featureGuard.
                La Fase 2 traerá la sincronización en nube y el simulador de decisiones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
