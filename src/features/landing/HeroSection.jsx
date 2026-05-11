import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 text-center"
    >
      {/* Fondo animado — orbes de luz tipo "agua profunda" */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-slate-950"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-flow-600/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-brand-600/15 blur-[100px]"
      />
      {/* Líneas de flujo decorativas */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full stroke-flow-500/10"
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M0 400 Q 360 300 720 400 T 1440 400"
          fill="none"
          strokeWidth="2"
          className="animate-flow-x"
        />
        <path
          d="M0 450 Q 360 350 720 450 T 1440 450"
          fill="none"
          strokeWidth="1.5"
          className="animate-flow-x [animation-delay:1s]"
        />
        <path
          d="M0 500 Q 360 400 720 500 T 1440 500"
          fill="none"
          strokeWidth="1"
          className="animate-flow-x [animation-delay:2s]"
        />
      </svg>

      {/* Badge */}
      <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-flow-500/30 bg-flow-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-flow-300 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-flow-400 animate-pulse" />
        Offline-first · México · 2025
      </div>

      {/* Logotipo + nombre */}
      <h1 className="animate-fade-up [animation-delay:0.1s] text-6xl font-black tracking-tight text-white sm:text-7xl lg:text-8xl">
        <span className="bg-gradient-to-r from-flow-300 via-flow-400 to-brand-500 bg-clip-text text-transparent">
          Caudal
        </span>
      </h1>

      {/* Tagline */}
      <p className="animate-fade-up [animation-delay:0.2s] mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
        Tu clave de{' '}
        <span className="text-flow-300 font-semibold">decisión financiera personal</span>.
        Registra, categoriza, calcula impuestos y entiende adónde va tu dinero
        — sin internet, sin excusas.
      </p>

      {/* CTAs */}
      <div className="animate-fade-up [animation-delay:0.3s] mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <Link
          to="/app"
          className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-flow-500 to-brand-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-flow-500/30 transition-all duration-300 hover:shadow-flow-500/50 hover:-translate-y-0.5 active:translate-y-0"
        >
          Empieza gratis
          <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <a
          href="#como-funciona"
          className="text-sm font-semibold text-slate-400 underline-offset-4 hover:text-flow-300 hover:underline transition-colors"
        >
          Ver cómo funciona →
        </a>
      </div>

      {/* Stats rápidos */}
      <div className="animate-fade-up [animation-delay:0.45s] mt-16 grid grid-cols-3 gap-8 text-center">
        {[
          { value: '100%', label: 'Offline' },
          { value: 'SAT 2025', label: 'Tablas fiscales' },
          { value: 'Gratis', label: 'Para empezar' },
        ].map(({ value, label }) => (
          <div key={label}>
            <p className="text-2xl font-black text-white sm:text-3xl">{value}</p>
            <p className="mt-1 text-xs text-slate-500 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Flecha de scroll */}
      <a
        href="#problema"
        aria-label="Ir a la siguiente sección"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-600 hover:text-flow-400 transition-colors"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </a>
    </section>
  )
}
