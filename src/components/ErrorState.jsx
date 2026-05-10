export default function ErrorState({ title, description, action }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-left">
      <h3 className="text-sm font-semibold text-rose-700">{title}</h3>
      <p className="text-sm text-rose-600">{description}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
