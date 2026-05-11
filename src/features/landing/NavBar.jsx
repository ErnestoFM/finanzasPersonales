import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

const navLinks = [
  { href: '#problema',      label: 'Problema' },
  { href: '#features',      label: 'Features' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#precios',       label: 'Precios' },
  { href: '#nosotros',      label: 'Nosotros' },
]

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-flow-500 to-brand-600 shadow-md shadow-flow-500/30 group-hover:shadow-flow-500/50 transition-shadow">
            <span className="text-sm font-black text-white">C</span>
          </div>
          <span className="text-lg font-black text-white">Caudal</span>
        </Link>

        {/* Links — desktop */}
        <ul className="hidden items-center gap-6 lg:flex">
          {navLinks.map(({ href, label }) => (
            <li key={label}>
              <a
                href={href}
                className="text-sm font-medium text-slate-400 transition-colors hover:text-flow-300"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA — desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/app"
            className="rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm font-semibold text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700"
          >
            Entrar
          </Link>
          <Link
            to="/app"
            className="rounded-xl bg-gradient-to-r from-flow-500 to-brand-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-flow-500/20 transition-all hover:shadow-flow-500/40 hover:-translate-y-0.5"
          >
            Empieza gratis
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 transition hover:text-flow-300 lg:hidden"
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-slate-800 bg-slate-950/95 px-6 pb-6 backdrop-blur-xl lg:hidden">
          <ul className="flex flex-col gap-1 pt-4">
            {navLinks.map(({ href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-flow-300"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              to="/app"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl border border-slate-700 py-3 text-center text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              Entrar
            </Link>
            <Link
              to="/app"
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl bg-gradient-to-r from-flow-500 to-brand-600 py-3 text-center text-sm font-bold text-white"
            >
              Empieza gratis
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
