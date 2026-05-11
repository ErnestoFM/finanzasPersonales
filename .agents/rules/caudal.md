---
trigger: always_on
---

# Caudal — Reglas del proyecto para Antigravity

## Qué es este proyecto
Caudal es una app de finanzas personales para el mercado mexicano. No es un simple registro de gastos: es una **clave de decisión financiera personal**. El usuario puede simular escenarios, ver proyecciones fiscales y tomar decisiones financieras informadas.

## Stack tecnológico (no cambiar sin autorización)
- **Frontend:** React + Vite
- **Estilos:** Tailwind CSS
- **Offline/PWA:** Service Worker con Workbox + Dexie.js (IndexedDB)
- **Gráficas:** Recharts
- **Backend:** Supabase (auth + sincronización, no requerido para operar)
- **Testing:** Jest + React Testing Library
- **Pagos:** Stripe + PayPal (tokenización, nunca almacenar datos de tarjeta)

## Principios que nunca se rompen
- **Offline-first:** la app debe funcionar 100% sin internet. Supabase es sincronización, no dependencia
- **Mobile-first:** diseñar para 375px primero, luego escalar a desktop
- **TDD estricto:** escribir el test antes de implementar. Sin excepción
- **Cobertura mínima:** 80% general, 100% en `/utils` (especialmente lógica fiscal)
- **Datos de tarjeta:** jamás se almacenan en el servidor ni en Supabase. Solo `customer_id` y estado de suscripción

## Estructura de carpetas (respetar siempre)
```
/src
  /features       # Módulos por funcionalidad
  /components     # Componentes reutilizables
  /hooks          # Custom hooks
  /db             # Dexie.js / IndexedDB
  /utils          # Lógica fiscal y financiera pura (funciones puras, testeables)
    /auth         # featureGuard.ts y middleware de autorización
  /store          # Estado global
/__tests__
  /unit           # Lógica pura
  /integration    # Flujos combinados
  /components     # Tests de UI
```

## Lógica fiscal (área crítica)
- Toda la lógica fiscal vive en `/utils` como funciones puras
- Las tablas del SAT van en archivos JSON externos, nunca hardcodeadas
- Cada función fiscal debe tener un comentario con la referencia legal (ej: "art. 96 LISR")
- Soportar régimen mixto: un usuario puede tener Asalariado + RESICO simultáneamente
- El cálculo de cada régimen es independiente; se consolida al final

## Feature guard (monetización)
- El archivo `/utils/auth/featureGuard.ts` controla el acceso a features de pago
- Las features de pago se construyen completas pero bloqueadas por el guard
- Nunca construir una feature de pago incompleta esperando "activarla después"
- Features de pago actuales: exportación Excel/CSV/PDF, motor fiscal completo, proyecciones, simulador

## Testing
- La carpeta `/__tests__` refleja la misma estructura que `/src`
- Usar fixtures con datos fiscales reales del SAT
- Los tests fiscales deben cubrir múltiples niveles de ingreso y escenarios de régimen mixto
- Correr tests antes de cualquier commit

## CI/CD (GitHub Actions)
- Workflow PR: lint + tests + cobertura + build (bloquea merge si falla)
- Workflow main: tests + build + deploy automático
- Workflow SAT: corre solo tests fiscales al modificar archivos JSON de tablas SAT
- Rama `main` protegida: solo acepta PRs que pasen todos los checks

## Convenciones de código
- Variables cortas pero descriptivas en lógica de negocio
- Comentarios en español para lógica de negocio, inglés para lógica técnica
- Tipar todo con TypeScript
- No usar `any` en TypeScript