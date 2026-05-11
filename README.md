# Caudal — Finanzas Personales para México

> App de finanzas personales **offline-first** orientada al mercado mexicano. No es solo un registro de gastos: es una **herramienta de decisión financiera** con motor fiscal, cálculo de ISR por régimen y visualizaciones en tiempo real.

---

## ¿Qué hace Caudal?

- **Registra ingresos y egresos** categorizados, con soporte para regímenes fiscales (Asalariado, RESICO, No fiscal).
- **Calcula tu carga fiscal mensual** aplicando las tablas del SAT 2025 (ISR, subsidio al empleo) para uno o más regímenes simultáneamente (**régimen mixto**).
- **Funciona 100% sin internet.** Todos los datos se guardan localmente en IndexedDB mediante Dexie.js. Supabase es una capa de sincronización opcional, no un requisito.
- **Es instalable como PWA** en Android, iOS y escritorio, con Service Worker y caché de activos gestionado por Workbox.
- **Protege tus datos con PIN local** de 4 dígitos, validado en el dispositivo.
- **Muestra tu salud financiera** con gráficas de distribución de egresos y comparativa mensual de hasta 6 meses.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 |
| Estilos | Tailwind CSS 3 |
| Base de datos local | Dexie.js (IndexedDB) |
| Gráficas | Recharts |
| PWA / Offline | vite-plugin-pwa + Workbox |
| Testing | Jest 30 + React Testing Library |
| Backend (sync, opcional) | Supabase |
| Pagos (previsto) | Stripe + PayPal |
| CI/CD | GitHub Actions → Vercel |

---

## Requisitos

- **Node.js 20+**
- **npm** (incluido con Node.js)

---

## Inicio rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Arrancar el servidor de desarrollo (http://localhost:5173)
npm run dev
```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `/dist` |
| `npm run preview` | Previsualización del build de producción |
| `npm run lint` | ESLint sobre todo el código fuente |
| `npm run test` | Ejecutar todos los tests (Jest) |
| `npm run test:coverage` | Tests con reporte de cobertura (mínimo 80%) |
| `npm run test:utils` | Solo los tests de `/utils` (lógica fiscal y financiera) |

> **Cobertura mínima:** 80% general · 100% en `/utils` (lógica fiscal crítica)

---

## Estructura de carpetas

```
/
├── src/
│   ├── App.jsx                  # Raíz de la aplicación y orquestación de estado
│   ├── main.jsx                 # Entry point de React
│   ├── index.css                # Estilos globales
│   │
│   ├── features/                # Módulos por funcionalidad
│   │   ├── dashboard/           # Resumen mensual y gráficas
│   │   ├── transactions/        # Ingresos y egresos (CRUD)
│   │   ├── categories/          # Categorías de ingresos/egresos
│   │   ├── fiscalProfile/       # Perfil fiscal y motor de ISR
│   │   ├── onboarding/          # Flujo de configuración inicial
│   │   └── pin/                 # Protección local con PIN
│   │
│   ├── components/              # Componentes reutilizables
│   │   ├── Card.jsx
│   │   ├── EmptyState.jsx
│   │   └── ErrorState.jsx
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useAsyncList.js      # Manejo de listas asíncronas con reload
│   │   ├── useAsyncValue.js     # Manejo de valores asíncronos individuales
│   │   └── useFeature.js        # Verificación de features de pago
│   │
│   ├── db/                      # Capa de base de datos local
│   │   ├── index.js             # Definición del schema de Dexie (IndexedDB)
│   │   └── settings.js          # CRUD de configuraciones clave-valor
│   │
│   └── utils/                   # Lógica pura (funciones testeables)
│       ├── auth/
│       │   └── featureGuard.ts  # Control de acceso a features Pro
│       ├── finance/
│       │   └── index.js         # Cálculos financieros (totales, salud, comparativa)
│       ├── fiscal/
│       │   └── taxCalculator.js # Motor fiscal: ISR Asalariado, RESICO, mixto
│       ├── taxTables/           # Tablas SAT 2025 en JSON
│       │   ├── isr-asalariado.json
│       │   ├── isr-resico.json
│       │   └── subsidio-empleo.json
│       ├── errors.js            # Constructores de errores tipados
│       ├── pin.js               # Hashing y verificación de PIN local
│       └── validation.js        # Validaciones de campos de formulario
│
├── __tests__/                   # Refleja la estructura de /src
│   ├── unit/                    # Lógica pura
│   │   ├── utils/               # fiscal.test.js, finance.test.js, validation.test.js
│   │   ├── transactions.test.js
│   │   ├── categories.test.js
│   │   ├── featureGuard.test.js
│   │   ├── fiscalProfile.test.js
│   │   ├── onboarding.test.js
│   │   ├── pin.test.js
│   │   └── settings.test.js
│   ├── components/              # Tests de UI con React Testing Library
│   └── __mocks__/               # Mocks de módulos (IndexedDB, etc.)
│
├── .github/workflows/
│   ├── main.yml                 # Tests + deploy a Vercel (solo si tests pasan)
│   ├── pull-request.yml         # Lint + tests + build en cada PR
│   └── sat-tables.yml           # Tests fiscales al modificar tablas del SAT
│
├── docs/                        # Documentación técnica extendida
│   ├── flujo-aplicacion.md      # Flujo completo de pantallas y estados
│   ├── offline-vs-online.md     # Diferencias offline / sesión en nube
│   └── rutas-y-secciones.md     # Qué hace cada sección de la app
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── jest.config.cjs
└── package.json
```

---

## CI/CD

El pipeline de GitHub Actions está dividido en dos workflows principales:

### `main.yml` — Push a `main`
1. **Job `test`:** lint + tests con cobertura. Si falla, el deploy no corre.
2. **Job `deploy`:** build de producción + deploy a Vercel (`--prod`). Solo corre si `test` fue exitoso (`needs: test`).

### `pull-request.yml` — Cualquier PR
Lint + tests con cobertura + build. Bloquea el merge si alguno falla.

### `sat-tables.yml` — Cambios en tablas fiscales
Corre únicamente los tests fiscales cuando se modifican los archivos JSON de tablas del SAT.

#### Secrets requeridos en GitHub (Settings → Secrets → Actions)

| Secret | Cómo obtenerlo |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Corre `vercel link` localmente → `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Mismo archivo `.vercel/project.json` |

---

## Planes y features de pago

Controladas por `featureGuard.ts`. El plan se guarda en IndexedDB (`settings.subscriptionPlan`).

| Feature | Plan Free | Plan Pro |
|---|---|---|
| Registro de ingresos/egresos | ✅ | ✅ |
| Dashboard y gráficas | ✅ | ✅ |
| Perfil fiscal (configuración) | ✅ | ✅ |
| Motor fiscal completo (ISR exacto) | ❌ | ✅ |
| Proyecciones financieras | ❌ | ✅ |
| Sincronización en la nube | ❌ | ✅ |
| Exportación Excel / CSV / PDF | ❌ | ✅ |

---

## Documentación adicional

Consulta la carpeta [`/docs`](./docs/) para:

- [`flujo-aplicacion.md`](./docs/flujo-aplicacion.md) — Flujo completo de pantallas, estados y decisiones de la app.
- [`offline-vs-online.md`](./docs/offline-vs-online.md) — Cómo funciona la app en modo offline vs sesión con cuenta.
- [`rutas-y-secciones.md`](./docs/rutas-y-secciones.md) — Descripción detallada de cada sección y su propósito.

---

## Lógica fiscal

Toda la lógica fiscal vive en `src/utils/fiscal/` como funciones puras, sin efectos secundarios. Cada función incluye la referencia legal correspondiente (artículo de la LISR o RMF).

| Función | Referencia legal |
|---|---|
| `calculateSalariedTax` | Art. 96 LISR — Retención mensual asalariados |
| `calculateResicoTax` | Art. 113-E LISR — Pago mensual definitivo RESICO |
| `calculateMixedTax` | Criterio de independencia de bases gravables |

Las tablas de tasas y rangos están en archivos JSON externos (`src/utils/taxTables/`) para facilitar la actualización anual sin tocar el código.
