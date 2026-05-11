# Rutas y Secciones — Caudal

Caudal es una **Single Page Application (SPA)** sin router de URL. No usa React Router ni rutas en la barra de dirección. La "navegación" entre vistas se controla mediante **estado local en `App.jsx`** y condiciones de render.

Esta decisión es intencional: simplifica la arquitectura offline-first y evita complejidades de historial de navegación en una app instalada como PWA.

---

## Mapa de vistas

```
App.jsx
  │
  ├─── [Estado: loading]          → Pantalla "Cargando..."
  │
  ├─── [Estado: error]            → ErrorState global
  │
  ├─── [onboardingCompleted=false] → OnboardingFlow (4 pasos)
  │
  └─── [onboardingCompleted=true]  → Vista Principal
           │
           ├── Dashboard
           ├── TransactionsSection
           ├── CategoriesSection
           ├── FiscalProfileSection
           └── PinSection
```

---

## Vista: OnboardingFlow

**Archivo:** `src/features/onboarding/OnboardingFlow.jsx`
**Servicio:** `src/features/onboarding/onboardingService.js`

### Propósito
Configuración inicial guiada del perfil del usuario. Solo se muestra una vez (la primera vez que se abre la app, o después de un reset manual de la base de datos).

### Pasos

| Paso | `id` | Qué configura | Persiste en |
|---|---|---|---|
| 1 | `welcome` | Pantalla informativa, sin datos | — |
| 2 | `regimen` | Régimen fiscal (Asalariado, RESICO o mixto) con ingreso mensual | `db.settings['fiscalProfile']` |
| 3 | `income` | Primer ingreso: monto, fecha, descripción, categoría, tipo, régimen | `db.incomes` |
| 4 | `category` | Primera categoría personalizada: nombre, tipo, color, ícono | `db.categories` |

### Controles
- **Continuar:** guarda el paso actual y avanza al siguiente. En el último paso, recarga todo y marca `onboardingCompleted = true`.
- **Saltar:** marca `onboardingCompleted = true` inmediatamente sin guardar el paso actual.

### Condición de salida
`db.settings['onboardingCompleted'] === true`

---

## Vista Principal

### Header

**Renderizado en:** `App.jsx` (línea 75–80)

Muestra el nombre "Caudal" y el subtítulo. No es interactivo.

---

## Sección: Dashboard

**Archivo:** `src/features/dashboard/Dashboard.jsx`
**Utilidades:** `src/utils/finance/index.js`

### Propósito
Resumen financiero del estado actual del usuario. Solo se muestra cuando hay al menos un ingreso o egreso registrado. Si no hay datos, se muestra un `EmptyState`.

### Métricas que calcula

| Métrica | Función de utilidad |
|---|---|
| Total de ingresos del mes | `getMonthlyTotals(incomes, expenses).incomeTotal` |
| Total de egresos del mes | `getMonthlyTotals(incomes, expenses).expenseTotal` |
| Balance neto | `getMonthlyTotals(incomes, expenses).net` |
| Salud financiera (label + color) | `getHealthStatus(net)` |
| Distribución de egresos por categoría | `getExpenseBreakdownChart(expenses, categories)` |
| Comparativa últimos 6 meses | `getMonthlyComparison(incomes, expenses)` |

### Gráficas (Recharts)

| Gráfica | Tipo | Descripción |
|---|---|---|
| Distribución de egresos | `PieChart` (donut) | Desglose de gastos por categoría con colores asignados |
| Últimos 6 meses | `BarChart` | Ingresos (índigo) vs. egresos (naranja) por mes |

### Condición de render
Solo se muestra si `incomesState.data.length > 0 || expensesState.data.length > 0`.

---

## Sección: Transacciones

**Archivos:**
- `src/features/transactions/TransactionsSection.jsx`
- `src/features/transactions/TransactionForm.jsx`
- `src/features/transactions/transactionsService.js`

### Propósito
Registro, visualización, edición y eliminación de ingresos y egresos.

### Operaciones CRUD

| Operación | Servicio | Valida |
|---|---|---|
| Listar ingresos | `listIncomes()` | — |
| Listar egresos | `listExpenses()` | — |
| Agregar ingreso | `addIncome(data)` | monto > 0, fecha, descripción, categoría, tipo, **régimen** |
| Agregar egreso | `addExpense(data)` | monto > 0, fecha, descripción, categoría, tipo |
| Editar ingreso | `updateIncome(id, data)` | mismos que agregar |
| Editar egreso | `updateExpense(id, data)` | mismos que agregar |
| Eliminar ingreso | `deleteIncome(id)` | — |
| Eliminar egreso | `deleteExpense(id)` | — |

### Campos de un ingreso

| Campo | Tipo | Opciones / Formato |
|---|---|---|
| `amount` | number | > 0 |
| `date` | string | `YYYY-MM-DD` |
| `description` | string | requerido |
| `categoryId` | number | ID de `db.categories` |
| `type` | string | `one-time` (Único) / `recurring` (Recurrente) |
| `regime` | string | `Asalariado` / `RESICO` / `No fiscal` |

### Campos de un egreso

Igual que un ingreso, **sin el campo `regime`**.

### Validaciones
Las validaciones están en `src/utils/validation.js`:
- `requireField(value, message)` — lanza error si el campo es vacío o nulo.
- `requirePositiveNumber(value, message)` — lanza error si el número no es > 0.

---

## Sección: Categorías

**Archivos:**
- `src/features/categories/CategoriesSection.jsx`
- `src/features/categories/categoriesService.js`

### Propósito
Gestión de categorías que se usan para clasificar ingresos y egresos. Cada categoría tiene un `kind` que la asocia a un tipo de movimiento.

### Estructura de una categoría

| Campo | Tipo | Valores posibles |
|---|---|---|
| `id` | number (autoincrement) | — |
| `name` | string | requerido |
| `kind` | string | `income` / `expense` |
| `color` | string | HEX color |
| `icon` | string | emoji |
| `isDefault` | boolean | `true` si fue creada por `ensureDefaultCategories()` |

### Categorías por defecto
Al iniciar la app, `ensureDefaultCategories()` verifica si ya existen categorías y, si no, crea un conjunto predeterminado. Esto garantiza que el formulario de transacciones siempre tenga opciones disponibles.

### Operaciones

| Operación | Función |
|---|---|
| Listar | `listCategories()` |
| Crear | `createCategory(data)` |
| Actualizar | `updateCategory(id, data)` |
| Eliminar | `deleteCategory(id)` |
| Asegurar defaults | `ensureDefaultCategories()` |

---

## Sección: Perfil Fiscal

**Archivos:**
- `src/features/fiscalProfile/FiscalProfileSection.jsx`
- `src/features/fiscalProfile/profileService.js`
- `src/utils/fiscal/taxCalculator.js`
- `src/utils/taxTables/*.json`

### Propósito
Configurar el perfil de regímenes fiscales del usuario y (en Plan Pro) calcular la carga fiscal mensual estimada con las tablas del SAT 2025.

### Estructura del perfil

```json
{
  "salaried": {
    "active": true,
    "monthlyIncome": 25000
  },
  "resico": {
    "active": false,
    "monthlyIncome": 0
  }
}
```

Persiste en `db.settings['fiscalProfile']`.

### Resumen del perfil (`getProfileSummary`)

| Campo | Descripción |
|---|---|
| `salariedIncome` | Ingreso mensual asalariado (0 si inactivo) |
| `resicoIncome` | Ingreso mensual RESICO (0 si inactivo) |
| `totalIncome` | Suma de ambos |

### Alerta de límite RESICO

`isResicoLimitWarning(profile)` — devuelve `true` si el ingreso mensual RESICO proyectado anualmente supera **$3,500,000 MXN** (límite legal del régimen, art. 113-E LISR). La UI muestra un indicador pulsante en rojo.

### Motor Fiscal (Plan Pro — `Feature.TaxEngine`)

Al tener Plan Pro activo, la sección muestra:

| Dato | Cálculo | Referencia legal |
|---|---|---|
| Retención ISR Asalariado | `calculateSalariedTax(monthlyIncome)` | Art. 96 LISR |
| ISR Mensual RESICO | `calculateResicoTax(monthlyIncome)` | Art. 113-E LISR |
| Carga Fiscal Total Mensual | `salariedTax + resicoTax` | Régimen mixto |
| Tasa Efectiva (%) | `(totalTax / totalIncome) * 100` | — |

Si el usuario tiene Plan Free, se muestra un bloqueo visual con CTA para activar Pro.

### Toggle Pro (simulación)

Para fines de demostración, el botón "Probar Pro (Simulado)" llama `setSetting('subscriptionPlan', Plan.Pro)` directamente en IndexedDB, sin pasar por Stripe. Cuando se integre el flujo de pago real, este botón se reemplazará por el checkout.

---

## Sección: Protección PIN

**Archivos:**
- `src/features/pin/PinSection.jsx`
- `src/features/pin/pinService.js`
- `src/utils/pin.js`

### Propósito
Permitir al usuario proteger el acceso a la app con un PIN de 4 dígitos, validado completamente en el dispositivo.

### Estados de la sección

| Estado | `hasPin` | `locked` | Qué ve el usuario |
|---|---|---|---|
| Sin PIN configurado | `false` | `false` | Input + botón "Configurar PIN" |
| PIN configurado, desbloqueada | `true` | `false` | Botón "Bloquear" + botón "Eliminar PIN" |
| PIN configurado, bloqueada | `true` | `true` | Input + botón "Desbloquear" + aviso rojo |

### Flujo

1. **Configurar PIN:** `setPin(pin)` → genera un hash SHA-256 → guarda en `db.settings['pinHash']`.
2. **Bloquear:** estado local `locked = true`. No modifica IndexedDB.
3. **Desbloquear:** `verifyPin(pin)` → hashea el input → compara con el hash almacenado → si coincide, `locked = false`.
4. **Eliminar PIN:** `clearPin()` → borra `db.settings['pinHash']`.

> El bloqueo es **de sesión**, no persiste entre recargas. Si el usuario recarga la página, la app abre desbloqueada (aunque el PIN siga configurado). Para un bloqueo persistente entre sesiones se requeriría un Service Worker personalizado o almacenamiento de estado de sesión.

---

## Componentes reutilizables

| Componente | Archivo | Propósito |
|---|---|---|
| `Card` | `src/components/Card.jsx` | Contenedor con título y sombra. Todos los bloques de la UI usan Card. |
| `EmptyState` | `src/components/EmptyState.jsx` | Pantalla vacía con título y descripción. Usada cuando no hay datos. |
| `ErrorState` | `src/components/ErrorState.jsx` | Pantalla de error con título, descripción y acción opcional. |

---

## Hooks custom

| Hook | Archivo | Para qué |
|---|---|---|
| `useAsyncList` | `src/hooks/useAsyncList.js` | Maneja listas asíncronas: `{ data, loading, error, reload }` |
| `useAsyncValue` | `src/hooks/useAsyncValue.js` | Maneja un valor único asíncrono: `{ value, loading, error, setValue }` |
| `useFeature` | `src/hooks/useFeature.js` | Verifica si una feature de pago está disponible: `{ isAvailable, loading }` |

---

## Resumen de acceso a datos por sección

| Sección | Lee de | Escribe en |
|---|---|---|
| Dashboard | `incomes`, `expenses`, `categories` | — |
| Transacciones | `incomes`, `expenses`, `categories` | `incomes`, `expenses` |
| Categorías | `categories` | `categories` |
| Perfil Fiscal | `settings['fiscalProfile']`, `settings['subscriptionPlan']` | `settings['fiscalProfile']` |
| PIN | `settings['pinHash']` | `settings['pinHash']` |
| Onboarding | `settings['onboardingCompleted']`, `categories` | `incomes`, `categories`, `settings` |
