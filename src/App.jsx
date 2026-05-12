import { useEffect } from 'react'
import Card from './components/Card.jsx'
import ErrorState from './components/ErrorState.jsx'
import EmptyState from './components/EmptyState.jsx'
import { useAsyncList } from './hooks/useAsyncList.js'
import { useAsyncValue } from './hooks/useAsyncValue.js'
import Dashboard from './features/dashboard/Dashboard.jsx'
import TransactionsSection from './features/transactions/TransactionsSection.jsx'
import CategoriesSection from './features/categories/CategoriesSection.jsx'
import FiscalProfileSection from './features/fiscalProfile/FiscalProfileSection.jsx'
import OnboardingFlow from './features/onboarding/OnboardingFlow.jsx'
import PinSection from './features/pin/PinSection.jsx'
import { listIncomes, listExpenses } from './features/transactions/transactionsService.js'
import { listCategories, ensureDefaultCategories } from './features/categories/categoriesService.js'
import {
  getOnboardingCompleted,
  setOnboardingCompleted,
} from './features/onboarding/onboardingService.js'
import ExportReportsSection from './features/subscription/ExportReportsSection.jsx'
import PricingPage from './features/subscription/PricingPage.jsx'

export default function App() {

  const incomesState = useAsyncList(listIncomes)
  const expensesState = useAsyncList(listExpenses)
  const categoriesState = useAsyncList(listCategories)
  const reloadCategories = categoriesState.reload
  const onboardingState = useAsyncValue(getOnboardingCompleted, false)

  useEffect(() => {
    ensureDefaultCategories().then(() => reloadCategories())
  }, [reloadCategories])

  if (onboardingState.loading || categoriesState.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Cargando...
      </div>
    )
  }

  if (onboardingState.value === false) {
    return (
      <OnboardingFlow
        categories={categoriesState.data}
        onRefresh={async () => {
          await Promise.all([
            incomesState.reload(),
            expensesState.reload(),
            categoriesState.reload(),
          ])
        }}
        onComplete={async () => {
          await setOnboardingCompleted(true)
          onboardingState.setValue(true)
        }}
        onSkip={async () => {
          await setOnboardingCompleted(true)
          onboardingState.setValue(true)
        }}
      />
    )
  }

  if (incomesState.error || expensesState.error || categoriesState.error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl items-center p-6">
        <ErrorState
          title="No se pudieron cargar los datos"
          description="Revisa tu conexión o intenta nuevamente."
        />
      </div>
    )
  }

  return (
    <div className="bg-slate-50 text-slate-900 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Caudal</h1>
        <p className="text-sm text-slate-600">
          Tu resumen financiero offline con foco fiscal.
        </p>
      </header>

      {incomesState.data.length === 0 && expensesState.data.length === 0 ? (
        <Card title="Comienza tu registro">
          <EmptyState
            title="Aún no hay movimientos"
            description="Registra ingresos y egresos para activar tu dashboard."
          />
        </Card>
      ) : (
        <Dashboard
          incomes={incomesState.data}
          expenses={expensesState.data}
          categories={categoriesState.data}
        />
      )}

      <TransactionsSection
        incomes={incomesState.data}
        expenses={expensesState.data}
        categories={categoriesState.data}
        onReloadIncomes={incomesState.reload}
        onReloadExpenses={expensesState.reload}
      />

      <CategoriesSection categories={categoriesState.data} onReload={categoriesState.reload} />

      <FiscalProfileSection />

      <ExportReportsSection
        incomes={incomesState.data}
        expenses={expensesState.data}
        categories={categoriesState.data}
      />

      <PricingPage />

      <PinSection />
    </div>
  )
}
