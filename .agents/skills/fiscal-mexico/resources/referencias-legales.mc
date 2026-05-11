# Referencias Legales — Lógica Fiscal de Caudal

Documento de referencia para el agente. Cada función fiscal en `/utils`
debe citar el artículo correspondiente de esta lista.

---

## Ley del Impuesto sobre la Renta (LISR)

### Art. 90 — Personas físicas obligadas al pago de ISR
Están obligadas al pago del ISR las personas físicas residentes en México
que obtengan ingresos en efectivo, en bienes, en crédito, en servicios,
o de cualquier otro tipo. Base para determinar quién debe declarar.

### Art. 94 — Ingresos por salarios y en general por prestación de un servicio personal subordinado
Define qué se considera ingreso por salario: sueldos, salarios,
asignaciones, gratificaciones, primas, dietas, participación de
utilidades, prestaciones y cualquier otra contraprestación por servicios
personales subordinados.

### Art. 96 — Retención de ISR por empleadores (asalariados)
**El más importante para Caudal.** Los empleadores que paguen salarios
están obligados a retener y enterar el ISR mensualmente. La retención
se calcula aplicando la tabla del art. 96 al ingreso mensual:
1. Se ubica el ingreso en la tabla por límite inferior/superior
2. Se resta el límite inferior al ingreso → base del excedente
3. Se aplica la tasa marginal al excedente
4. Se suma la cuota fija
5. Se resta el subsidio al empleo (Anexo 8 RMF)
6. El resultado es el ISR a retener

### Art. 113-E — RESICO personas físicas
Régimen Simplificado de Confianza para personas físicas con:
- Actividades empresariales
- Servicios profesionales (honorarios)
- Arrendamiento
- Límite: ingresos totales del ejercicio ≤ $3,500,000 MXN
El ISR se calcula aplicando la tasa correspondiente de la tabla RESICO
al ingreso mensual cobrado efectivamente. El pago es **definitivo**
(no se acumula a otros ingresos para declaración anual).

### Art. 113-F — Obligaciones en RESICO
- Expedir CFDI por todas las operaciones
- Presentar pago mensual a más tardar el día 17 del mes siguiente
- Llevar control de ingresos y gastos
- Conservar comprobantes fiscales

### Art. 113-G — Causas de salida de RESICO
El contribuyente sale de RESICO cuando:
- Sus ingresos del ejercicio superan $3,500,000 MXN
- Incumple con presentación de pagos mensuales por dos meses consecutivos
- No expide CFDI

### Art. 151 — Deducciones personales (declaración anual)
Personas físicas pueden deducir en su declaración anual:
- Honorarios médicos, dentales y hospitalarios (propios y dependientes)
- Gastos hospitalarios
- Primas de seguros de gastos médicos
- Intereses reales de créditos hipotecarios
- Donativos a donatarias autorizadas
- Aportaciones voluntarias al AFORE
- Colegiaturas (según niveles y límites del decreto)
**Límite global:** el menor entre 15% del ingreso total anual
o 5 veces el valor anual de la UMA.

### Art. 152 — Tarifa anual del ISR (declaración anual asalariados)
Para la declaración anual se aplica la tarifa anual acumulando
todos los ingresos del ejercicio. Si el ISR anual calculado es menor
al total retenido por el empleador, hay saldo a favor (devolución).

---

## Resolución Miscelánea Fiscal (RMF) 2025

### Anexo 8 — Tabla de subsidio al empleo
El subsidio al empleo es un crédito fiscal que se aplica contra el ISR
calculado para trabajadores de menores ingresos. Si el subsidio supera
el ISR causado, la diferencia se entrega en efectivo al trabajador
(el empleador lo recupera vía compensación).
- Aplica solo a asalariados
- No aplica en RESICO
- Se actualiza anualmente en el Anexo 8 de la RMF

### Regla 3.13.1 — Facilidades para RESICO
Establece las facilidades administrativas para contribuyentes en RESICO,
incluyendo la no obligación de presentar declaración anual cuando
todos sus ingresos son por este régimen.

---

## Régimen Mixto — Criterios de aplicación

No existe un artículo único que regule el "régimen mixto", sino que
es la aplicación simultánea de dos regímenes independientes:

### Criterio 1 — Independencia de bases gravables
Los ingresos de cada régimen se calculan de forma independiente.
Un asalariado con ingresos por honorarios no suma ambos ingresos
para aplicar una sola tabla; cada uno tiene su propio cálculo.

### Criterio 2 — Acumulación solo en declaración anual (asalariados)
En la declaración anual, el asalariado acumula sus ingresos totales
para calcular el ISR anual. Los ingresos RESICO NO se acumulan
(son pago definitivo). Solo se acumulan salarios, honorarios fuera
de RESICO, arrendamiento fuera de RESICO, etc.

### Criterio 3 — Límite RESICO en régimen mixto
El límite de $3,500,000 aplica únicamente a los ingresos declarados
en RESICO. Los ingresos como asalariado no cuentan para ese límite.

---

## Fechas fiscales clave (recordatorios en la app)

| Fecha | Obligación | Régimen |
|---|---|---|
| Día 17 de cada mes | Pago mensual ISR | RESICO |
| Enero 31 | Declaración informativa de sueldos | Empleadores |
| Febrero 28 | Constancia de retenciones a trabajadores | Asalariados |
| Abril 30 | Declaración anual personas físicas | Asalariado y mixto |
| Todo el año | Emisión de CFDI por cada ingreso | RESICO |

---

## Notas importantes para el agente

1. **Las tasas y tablas cambian anualmente.** Siempre usar los archivos
   JSON externos, nunca valores hardcodeados en el código.

2. **UMA vs SMGDF:** Desde 2017 las referencias fiscales usan la UMA
   (Unidad de Medida y Actualización), no el salario mínimo. No confundir.

3. **CFDI obligatorio en RESICO:** La app debe recordar al usuario
   que necesita emitir factura por cada ingreso en RESICO, no solo
   registrarlo internamente.

4. **Subsidio al empleo en nómina:** El subsidio lo calcula y aplica
   el empleador, no el trabajador. En Caudal solo se muestra como
   referencia informativa para el usuario asalariado.

5. **Pago definitivo RESICO:** Al mostrar proyecciones, el ISR RESICO
   no debe aparecer como "pendiente de declaración anual" porque ya
   quedó pagado con el pago mensual.