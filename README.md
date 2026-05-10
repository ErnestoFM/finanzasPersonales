# Caudal — Finanzas Personales

Aplicación offline-first para registrar ingresos, egresos y perfil fiscal con enfoque en toma de decisiones.

## Requisitos
- Node.js 20+
- npm

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test
npm run test:coverage
npm run build
```

## Estructura

- `src/features`: módulos por funcionalidad
- `src/components`: componentes reutilizables
- `src/hooks`: hooks personalizados
- `src/db`: Dexie / IndexedDB
- `src/utils`: lógica fiscal y financiera
- `__tests__`: pruebas unitarias, integración y UI
