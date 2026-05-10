import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../../components/Card.jsx'
import {
  getExpenseBreakdownChart,
  getHealthStatus,
  getMonthlyComparison,
  getMonthlyTotals,
} from '../../utils/finance/index.js'

const formatCurrency = (value) =>
  value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })

export default function Dashboard({ incomes, expenses, categories }) {
  const totals = getMonthlyTotals(incomes, expenses)
  const health = getHealthStatus(totals.net)
  const healthStyles = {
    emerald: { container: 'bg-emerald-50', label: 'text-emerald-700' },
    rose: { container: 'bg-rose-50', label: 'text-rose-700' },
    amber: { container: 'bg-amber-50', label: 'text-amber-700' },
  }
  const healthStyle = healthStyles[health.tone]
  const breakdown = getExpenseBreakdownChart(expenses, categories)
  const comparison = getMonthlyComparison(incomes, expenses)

  return (
    <Card title="Resumen del mes">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">Ingresos</p>
          <p className="text-xl font-semibold text-slate-900">{formatCurrency(totals.incomeTotal)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase text-slate-500">Egresos</p>
          <p className="text-xl font-semibold text-slate-900">{formatCurrency(totals.expenseTotal)}</p>
        </div>
        <div className={`rounded-xl ${healthStyle.container} p-4`}>
          <p className="text-xs uppercase text-slate-500">Balance neto</p>
          <p className="text-xl font-semibold text-slate-900">{formatCurrency(totals.net)}</p>
          <p className={`text-sm font-semibold ${healthStyle.label}`}>{health.label}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-72 rounded-xl border border-slate-100 p-3">
          <p className="text-sm font-semibold text-slate-700">Distribución de egresos</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                {breakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="h-72 rounded-xl border border-slate-100 p-3">
          <p className="text-sm font-semibold text-slate-700">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="ingresos" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="egresos" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  )
}
