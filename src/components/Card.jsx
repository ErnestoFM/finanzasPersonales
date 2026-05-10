export default function Card({ title, children, actions }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}
