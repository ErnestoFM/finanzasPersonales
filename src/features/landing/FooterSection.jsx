import { Link } from 'react-router-dom'

const navLinks = [
  { href: '#problema',      label: 'El problema' },
  { href: '#features',      label: 'Features' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#precios',       label: 'Precios' },
  { href: '#nosotros',      label: 'Nosotros' },
]

const socialLinks = [
  {
    name: 'Twitter / X',
    href: '#',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: '#',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
  },
]

export default function FooterSection() {
  return (
    <footer className="relative bg-slate-950 border-t border-slate-800/60 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-flow-500 to-brand-600 shadow-lg shadow-flow-500/20 group-hover:shadow-flow-500/40 transition-shadow">
                <span className="text-base font-black text-white">C</span>
              </div>
              <span className="text-xl font-black text-white">Caudal</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-slate-500 leading-relaxed">
              Tu clave de decisión financiera personal. Offline-first, fiscal-aware, hecho para México.
            </p>
            {/* Social */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map(({ name, href, icon }) => (
                <a
                  key={name}
                  href={href}
                  aria-label={name}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-500 transition-all duration-200 hover:border-flow-500/40 hover:bg-flow-900/30 hover:text-flow-300"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Producto
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-slate-500 transition-colors hover:text-flow-300"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contacto */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Legal
            </h3>
            <ul className="mt-4 space-y-2.5">
              {[
                { href: '#', label: 'Privacidad' },
                { href: '#', label: 'Términos de uso' },
                { href: '#', label: 'Política de cookies' },
              ].map(({ href, label }) => (
                <li key={label}>
                  <a href={href} className="text-sm text-slate-500 transition-colors hover:text-flow-300">
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-500">
              Contacto
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="mailto:hola@caudal.mx"
                  className="text-sm text-slate-500 transition-colors hover:text-flow-300"
                >
                  hola@caudal.mx
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800/60 pt-8 sm:flex-row">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Caudal. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-700">
            Hecho con ☕ en México · Offline-first · v0.1.0
          </p>
        </div>
      </div>
    </footer>
  )
}
