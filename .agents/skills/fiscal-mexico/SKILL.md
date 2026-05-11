---
name: fiscal-mexico
description: Especialista en lógica fiscal mexicana para el SAT. Usar cuando se trabaje en cálculos de ISR, RESICO, régimen mixto, tablas SAT, deducciones personales, o cualquier archivo dentro de /utils relacionado con impuestos en México.
---

# Skill: Lógica Fiscal Mexicana (SAT)

## Cuándo usar este skill
- Al trabajar en cualquier archivo dentro de `/utils` que involucre impuestos
- Al calcular ISR de asalariados o RESICO
- Al trabajar con régimen mixto (dos regímenes simultáneos)
- Al actualizar tablas SAT en archivos JSON
- Al escribir tests de lógica fiscal

## Regímenes fiscales soportados en Caudal

### 1. Asalariado (art. 96 LISR)
- El patrón retiene y entera el ISR mensualmente
- Se aplica tabla de ISR mensual del art. 96 LISR
- Se aplica subsidio al empleo según tabla oficial
- El usuario puede presentar declaración anual para recuperar saldo a favor
- Deducciones personales permitidas (art. 151 LISR):
  - Honorarios médicos, dentales y hospitalarios
  - Colegiaturas (límites por nivel educativo)
  - Intereses reales de créditos hipotecarios
  - Donativos a instituciones autorizadas
  - Primas de seguros de gastos médicos
  - Aportaciones voluntarias al AFORE

### 2. RESICO — Régimen Simplificado de Confianza (art. 113-E LISR)
- Aplica a personas físicas con actividad empresarial o profesional
- Límite de ingresos: 3,500,000 MXN anuales
- Pago mensual definitivo: tasa fija según tabla SAT RESICO
- El usuario paga directo al SAT a más tardar el día 17 de cada mes
- No presenta declaración anual por ingresos RESICO (es pago definitivo)
- Tabla de tasas RESICO (referencia, usar siempre el JSON externo):
  - Hasta $25,000/mes → 1.00%
  - Hasta $50,000/mes → 1.10%
  - Hasta $83,333/mes → 1.50%
  - Hasta $208,333/mes → 2.00%
  - Hasta $291,666/mes → 2.50%

### 3. Régimen Mixto (Asalariado + RESICO simultáneo)
- Un usuario puede tener ambos regímenes activos al mismo tiempo
- Ejemplo real: $30,000/mes como asalariado + $1,000/mes en RESICO
- **Regla crítica:** cada régimen se calcula de forma INDEPENDIENTE
  - ISR asalariado → tabla art. 96 LISR sobre los $30,000
  - ISR RESICO → tasa RESICO sobre los $1,000
  - Total fiscal = suma de ambos ISR
- No se mezclan las bases gravables entre regímenes
- El límite de 3.5 MDP de RESICO aplica solo a los ingresos RESICO, no al total

## Reglas de implementación

### Tablas SAT — NUNCA hardcodear
- Todas las tablas del SAT viven en `/src/utils/fiscal/tablas/`
- Archivos JSON versionados: `isr-mensual-2025.json`, `resico-2025.json`, `subsidio-empleo-2025.json`
- El año fiscal debe ser configurable, no fijo en el código
- Cuando el SAT actualice tasas, solo se edita el JSON, no el código

### Estructura de funciones fiscales
```typescript
// Todas las funciones deben ser puras (sin side effects)
// Reciben datos, r