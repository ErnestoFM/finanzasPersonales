# Offline vs. Online — Cómo funciona Caudal según la conectividad

Caudal es **offline-first por diseño**. Esto significa que la app funciona al 100% sin conexión a internet, y la nube es una capa opcional de sincronización, no un requisito.

---

## Principio fundamental

> **Los datos siempre viven primero en tu dispositivo.**
> Supabase (la nube) es una capa adicional que *replica* lo que ya tienes localmente, no la fuente de verdad.

---

## Qué pasa en cada modo

### Modo offline (sin conexión)

| Acción | ¿Funciona? | Cómo |
|---|---|---|
| Abrir la app | ✅ | Service Worker sirve el bundle desde caché |
| Ver Dashboard | ✅ | Lee desde IndexedDB local |
| Agregar ingreso/egreso | ✅ | Escribe en IndexedDB local |
| Editar/eliminar transacciones | ✅ | Opera en IndexedDB local |
| Ver perfil fiscal | ✅ | Lee `db.settings['fiscalProfile']` |
| Calcular ISR (Plan Pro) | ✅ | Cálculo local con tablas JSON incluidas en el bundle |
| Protección PIN | ✅ | Hash y verificación con Web Crypto API (local) |
| Sincronizar con la nube | ❌ | Requiere conexión activa |
| Login / registro | ❌ | Requiere conexión a Supabase |

### Modo online (con conexión)

Todas las operaciones offline siguen funcionando igual. Adicionalmente:

| Acción | Comportamiento |
|---|---|
| Sincronización | Los cambios locales se sincronizan con Supabase (Plan Pro) |
| Login | Autenticación vía Supabase Auth |
| Backup en la nube | Los datos de IndexedDB se replican en Supabase |

---

## Arquitectura de almacenamiento

```
┌─────────────────────────────────────────────────┐
│                  DISPOSITIVO                    │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │           IndexedDB (Dexie)              │   │
│  │                                          │   │
│  │  incomes    → ingresos registrados       │   │
│  │  expenses   → egresos registrados        │   │
│  │  categories → categorías del usuario     │   │
│  │  settings   → perfil fiscal, PIN,        │   │
│  │               plan de suscripción,       │   │
│  │               estado de onboarding       │   │
│  └──────────────────────────────────────────┘   │
│                       │                         │
│                       │ (solo con conexión)      │
│                       ▼                         │
│  ┌──────────────────────────────────────────┐   │
│  │        Service Worker (Workbox)          │   │
│  │  Caché de: JS, CSS, HTML, JSON, SVG      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                        │
            (solo Plan Pro + conexión)
                        ▼
┌─────────────────────────────────────────────────┐
│                   NUBE                          │
│                                                 │
│           Supabase (Auth + DB)                  │
│    Sincronización de incomes, expenses,         │
│    categories. NUNCA almacena PIN ni            │
│    datos de tarjeta.                            │
└─────────────────────────────────────────────────┘
```

---

## Instalación como PWA (Progressive Web App)

Caudal se puede instalar en el dispositivo como si fuera una app nativa gracias al Service Worker configurado con Workbox. Esto es independiente de la conectividad.

### En Android (Chrome / Edge)
1. Abre Caudal en el navegador.
2. El navegador muestra un banner "Agregar a pantalla de inicio" o aparece en el menú de opciones.
3. Al instalarse, el ícono aparece en el launcher. La app abre en modo `standalone` (sin barra de navegador).

### En iOS (Safari)
1. Abre Caudal en Safari.
2. Pulsa el botón de compartir → "Agregar a pantalla de inicio".
3. La app se instala y abre como app nativa.

> En iOS, el soporte de Service Worker es más limitado que en Android/Chrome. El caché funciona, pero las notificaciones push no están disponibles.

### En escritorio (Chrome / Edge)
1. En la barra de dirección aparece un ícono de instalación (⊕).
2. Al instalar, abre en ventana propia sin interfaz de navegador.

---

## Sesiones: ¿qué cambia con o sin cuenta?

### Sin cuenta (uso local puro)

- **Todo funciona offline.** No hay restricción de funcionalidad por no tener cuenta.
- Los datos **solo existen en ese dispositivo**. Si se borra la caché del navegador o se formatea el dispositivo, los datos se pierden.
- El plan de suscripción se lee desde `db.settings['subscriptionPlan']`. En modo de prueba, se puede activar el Plan Pro manualmente desde la UI (botón "Probar Pro (Simulado)").
- No hay sincronización entre dispositivos.

### Con cuenta (Supabase Auth)

> **Nota:** La integración con Supabase Auth es una feature en desarrollo. Las interacciones descritas aquí representan el comportamiento previsto una vez implementada la sincronización.

- El usuario se registra/autentifica con email + contraseña (o proveedor OAuth).
- Al iniciar sesión, los datos locales de IndexedDB se sincronizan bidireccialmente con Supabase.
- El estado de suscripción (`Plan.Free` / `Plan.Pro`) se verifica desde Supabase en cada sesión.
- Si el usuario cambia de dispositivo, los datos se cargan desde la nube al IndexedDB del nuevo dispositivo.
- Al cerrar sesión, los datos locales se mantienen en el dispositivo pero dejan de sincronizarse.

---

## Datos que NUNCA van a la nube

Por diseño de seguridad, los siguientes datos **nunca se almacenan en Supabase ni en ningún servidor**:

| Dato | Dónde vive | Por qué |
|---|---|---|
| **PIN local** | Solo en `db.settings['pinHash']` del dispositivo | Privacidad y seguridad del usuario |
| **Datos de tarjeta de crédito/débito** | Nunca se almacenan | Solo se tokeniza con Stripe/PayPal |
| **Hash del PIN** | Solo en IndexedDB local | El PIN es un secreto de dispositivo |

Solo se almacena en Supabase: `customer_id` (referencia a Stripe) y el estado de la suscripción.

---

## Comportamiento del Service Worker

El Service Worker (gestionado por Workbox) implementa la siguiente estrategia de caché:

| Tipo de recurso | Estrategia | Descripción |
|---|---|---|
| JS, CSS, HTML, SVG, JSON | `Precache` | Se cachean en la instalación. La app carga sin red. |
| Imágenes externas | `CacheFirst` | Se sirve desde caché; se actualiza en segundo plano. Máx. 50 entradas, 30 días. |
| Peticiones a Supabase | Sin caché | Las peticiones de red a la nube no se interceptan. |

El Service Worker se actualiza automáticamente (`registerType: 'autoUpdate'`) cuando se despliega una nueva versión, sin intervención del usuario.

---

## Preguntas frecuentes

**¿Pierdo mis datos si borro la app del celular?**
Si estás en modo local puro (sin cuenta): sí, los datos de IndexedDB se borran con la caché del navegador. Si tienes sincronización activa (Plan Pro con cuenta), los datos siguen en la nube.

**¿Puedo usar la app en dos dispositivos?**
Con una cuenta Pro y sincronización activa: sí. Sin cuenta: los datos son independientes en cada dispositivo.

**¿Qué pasa si pierdo conexión mientras registro una transacción?**
La transacción se guarda en IndexedDB local inmediatamente. La sincronización con la nube se retoma cuando regresa la conexión.

**¿La app funciona sin instalar?**
Sí. Funciona directamente en el navegador en cualquier dispositivo. La instalación como PWA es opcional y mejora la experiencia (acceso desde pantalla de inicio, modo standalone).
