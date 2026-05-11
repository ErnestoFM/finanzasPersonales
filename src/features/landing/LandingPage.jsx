import { Link } from 'react-router-dom'
import NavBar from './NavBar.jsx'
import HeroSection from './HeroSection.jsx'
import ProblemSection from './ProblemSection.jsx'
import FeaturesSection from './FeaturesSection.jsx'
import HowItWorksSection from './HowItWorksSection.jsx'
import PricingSection from './PricingSection.jsx'
import AboutSection from './AboutSection.jsx'
import FooterSection from './FooterSection.jsx'

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 antialiased">
      {/* SEO meta se gestiona desde index.html; rutas públicas no requieren head dinámico aún */}

      {/* Barra de navegación fija */}
      <NavBar />

      {/* Contenido principal */}
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <AboutSection />
      </main>

      {/* CTA final antes del footer */}
      <section className="relative bg-slate-900 py-20 px-6 text-center">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flow-500/30 to-transparent" />
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-flow-600/10 blur-[80px]" />

        <p className="text-xs font-bold uppercase tracking-widest text-flow-400">
          ¿Listo para empezar?
        </p>
        <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">
          Toma el control de tu dinero hoy.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-slate-400">
          Sin registro, sin tarjeta. Empieza a usar Caudal en menos de 2 minutos.
        </p>
        <Link
          to="/app"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-flow-500 to-brand-600 px-10 py-4 text-sm font-bold text-white shadow-xl shadow-flow-500/25 transition-all duration-300 hover:shadow-flow-500/40 hover:-translate-y-0.5"
        >
          Empieza gratis — es offline
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

      <FooterSection />
    </div>
  )
}
