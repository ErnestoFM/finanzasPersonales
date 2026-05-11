const pains = [
  {
    icon: '📊',
    problem: 'Sabes cuánto gastas,\nno por qué te falta',
    insight:
      'Los registros de gastos te dicen el pasado. Caudal te explica el presente y te proyecta el futuro.',
  },
  {
    icon: '🧾',
    problem: 'Pagas impuestos sin\nsaber si estás pagando de más',
    insight:
      'Si tienes régimen mixto (Asalariado + RESICO), ninguna app de finanzas calcula tu ISR correctamente. Caudal sí.',
  },
  {
    icon: '📱',
    problem: 'Tu app de finanzas\nmuere sin internet',
    insight:
      'Caudal vive en tu dispositivo. Funciona igual en el metro, en el avión o en una zona sin señal.',
  },
]

export default function ProblemSection() {
  return (
    <section
      id="problema"
      className="relative bg-slate-950 py-24 px-6"
    >
      {/* Divisor superior */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flow-500/30 to-transparent" />

      <div className="mx-auto max-w-5xl">
        {/* Eyebrow */}
        <p className="text-center text-xs font-bold uppercase tracking-widest text-flow-400">
          El problema real
        </p>

        <h2 className="mt-4 text-center text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">
          No es un registro de gastos.
          <br />
          <span className="text-slate-400 font-normal">Es una clave de decisión financiera.</span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-center text-base text-slate-400 leading-relaxed">
          Las apps de finanzas personales te muestran gráficas bonitas. Caudal te dice{' '}
          <span className="text-white font-semibold">qué acción tomar</span> con esa información:
          cambiar de régimen, adelantar un pago, reorganizar tus fuentes de ingreso.
        </p>

        {/* Pain cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {pains.map(({ icon, problem, insight }) => (
            <div
              key={problem}
              className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition-all duration-300 hover:border-flow-500/40 hover:bg-slate-900"
            >
              {/* Glow hover */}
              <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-flow-500/5" />

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl group-hover:bg-flow-900/60 transition-colors duration-300">
                {icon}
              </div>

              <h3 className="text-sm font-bold text-slate-200 leading-snug whitespace-pre-line">
                {problem}
              </h3>

              <div className="mt-3 h-px w-8 bg-flow-500/40 transition-all duration-300 group-hover:w-16 group-hover:bg-flow-400" />

              <p className="mt-3 text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-300">
                {insight}
              </p>
            </div>
          ))}
        </div>

        {/* Quote destacado */}
        <blockquote className="mt-16 rounded-2xl border border-flow-500/20 bg-gradient-to-br from-flow-900/30 to-slate-900 p-8 text-center">
          <p className="text-lg font-semibold text-white sm:text-xl leading-relaxed">
            "La diferencia entre registrar y{' '}
            <span className="text-flow-300">decidir</span> es el análisis
            que ninguna otra app hace por ti."
          </p>
          <footer className="mt-4 text-xs text-slate-500 uppercase tracking-wider">
            — La promesa de Caudal
          </footer>
        </blockquote>
      </div>
    </section>
  )
}
