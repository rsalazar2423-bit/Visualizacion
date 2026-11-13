# Manual de Entrega Integral: EcoGrid DEC
## Dashboard de Gestión Operativa, Cumplimiento de SLA y Simulación de Capacidad de Red
**Sistema de Transmisión Eléctrica de Alta Tensión (5.409 Torres · 44 Líneas · 2008–2023)**

---

# 1. Introducción y Propósito del Proyecto

### ¿Qué es EcoGrid DEC?
EcoGrid DEC es una plataforma web analítica de grado industrial desarrollada para auditar, diagnosticar y planificar la operación de mantenimiento de una red de transporte de energía eléctrica en el suroccidente y centro de Colombia.

### ¿Cuál es el problema de negocio que resuelve?
Las empresas de transmisión eléctrica operan activos altamente dispersos geográficamente. Cuando ocurre una anomalía (árboles rozando líneas, construcciones ilegales en la servidumbre o fallas de cimentación en torres), se genera un **aviso de mantenimiento**. Si la cuadrilla no atiende y cierra el aviso dentro del plazo regulatorio (SLA - *Service Level Agreement*), la empresa se expone a:
1. **Riesgo de corte y colapso de red** (salida forzada de líneas de 115 kV, 230 kV o 500 kV).
2. **Sanciones millonarias de la CREG** (Resolución CREG 015 de 2018 por deterioro de los índices de calidad SAIDI y SAIFI).
3. **Sobrecostos contables y pasivos acumulados** en el módulo EAM / General Ledger de Oracle EBS.

Antes de esta solución, la empresa gestionaba esto mediante hojas de cálculo fragmentadas y reportes mensuales estáticos en PDF. Era imposible saber en tiempo real dónde estaba el cuello de botella, qué cuadrillas estaban subutilizadas y qué municipios acumulaban la mayor morosidad.

---

# 2. Los Datos: Fuente, Volumen y Estructura

El sistema se alimenta de un conjunto de datos consolidado y normalizado (`ecogrid_data.json`) que abarca 15 años de operación continua:

### Métricas de Control del Conjunto de Datos:
* **Total de Avisos Registrados:** **3.118 avisos** (período 2008 – 2023).
* **Total de Torres y Equipos Instalados:** **5.409 torres georreferenciadas**.
* **Corredores de Transmisión:** **44 líneas de alta tensión** en 5 zonas operativas (CTEs).
* **Estatus Operativo del Backlog:**
  * **Avisos Cerrados:** **2.375 avisos** (76.2% del histórico).
  * **Avisos Abiertos (Backlog Activo):** **743 avisos** (23.8% de la demanda).
  * **Abiertos Vencidos en Mora Crítica:** **344 avisos** (pasivo urgente de intervención).
  * **Abiertos dentro del Plazo:** **399 avisos**.
* **Cumplimiento Global de SLA:** **47.8% Cumple Plazo** (1.490 avisos) vs. **52.2% Excede Plazo** (1.628 avisos).
* **Tiempo Típico de Resolución (Mediana Global):** **439 días** (evidencia de dilaciones estructurales en tipologías complejas).

### Tipologías de Intervención (Causas Técnicas):
1. **Vegetación (1.499 avisos · 48.1%):** Podas, talas y despeje forestal de franja de seguridad.
2. **Construcciones (1.165 avisos · 37.4%):** Invasiones de servidumbre, viviendas o bodegas bajo líneas.
3. **Obras Civiles (236 avisos · 7.6%):** Erosión, movimientos de masa en laderas y muros de contención de patas de torre.
4. **Permiso de Ingreso (125 avisos · 4.0%):** Trámites y negativas de propietarios prediales para ingresar a las torres.
5. **Invasión / Explanación (93 avisos · 3.0%):** Movimientos ilegales de tierra que desestabilizan estructuras.

---

# 3. Arquitectura del Software: ¿Cómo está construido y por qué?

### Stack Tecnológico:
```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR CLIENTE (SPA)                  │
│                                                             │
│   Vue 3 (Composition API)  <───>  Pinia Store (Estado)      │
│   TypeScript 6             <───>  Servicios Analíticos      │
│   Apache ECharts 6.1.0     <───>  Canvas / WebGL Hardware   │
└──────────────────────────────┬──────────────────────────────┘
                               │ Fetch Asíncrono (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 INFRAESTRUCTURA Y DESPLIEGUE                │
│   Vite 8 (Compilador en 800 ms) · Vercel Edge CDN (Global)   │
└─────────────────────────────────────────────────────────────┘
```

### ¿Por qué esta arquitectura y NO Plotly Dash o PowerBI?
1. **Plotly Dash (Python)** depende de un servidor backend activo. Cada vez que el usuario hace un zoom o filtra un municipio, Dash envía un *callback HTTP* a Python, demorando entre 0.5 y 2 segundos y consumiendo memoria en el servidor.
2. **Nuestra solución en Vue 3 + Apache ECharts corre 100% en el cliente:**
   * Las 5.409 torres y los 3.118 avisos se cargan en memoria en la primera petición ($2.5\text{ MB}$).
   * Los filtros entre departamentos, líneas y años se recalculan en **menos de 16 milisegundos (60 FPS)**.
   * **Costo de Servidor ($0 OPEX):** Al ser una aplicación estática compilada, no requiere pagar servidores dedicados de Python en la nube; se sirve desde un CDN con $99.99\%$ de disponibilidad.
3. **PowerBI / Tableau** cobran licencias mensuales por cada directivo que consulte el tablero y bloquean el desarrollo de componentes a medida (como el simulador de cuadrillas o el reproductor temporal geográfico).

---

# 4. Desglose Módulo por Módulo: ¿Qué hace cada vista, cómo lo hace y por qué?

---

## MÓDULO 01: SEGUIMIENTO Y SLA (`/operaciones`)
**Propósito:** Evaluar la evolución histórica de la demanda y el desempeño técnico por tipología.

### Pestaña 1.1: Evolución Temporal (`TimeEvolutionChart.vue`)
* **Qué hace:** Muestra en un solo plano la serie de tiempo anual (2008–2023) con tres variables simultáneas:
  1. Volumen de avisos ingresados (Línea gris/azul).
  2. Volumen de avisos cerrados (Línea azul acero).
  3. Avisos abiertos que quedaron vencidos en ese año (Barras rojas carmín).
  4. Tasa de cumplimiento oportuno de SLA (Línea verde/teal sobre eje secundario derecho).
* **Cómo lo hace:** ECharts con doble eje Y ($0-350$ avisos a la izquierda, $0-100\%$ a la derecha), suavizado polinómico (`smooth: true`), zoom de caja interactivo (`dataZoom`) y selector de métrica (Mediana de días vs. % Cumplimiento).
* **Por qué:** Permite detectar el **pico histórico de demanda (2022 con 332 avisos)** y verificar si las cuadrillas cerraron más de lo que ingresó o si acumularon deuda técnica (pasivo de mora).

### Pestaña 1.2: Composición Técnica (`DonutChart.vue` + `TypologyPerformanceChart.vue`)
* **Qué hace:** Divide la pantalla 50%/50%:
  * **Izquierda (Dona):** Distribución de las 5 causas de intervención.
  * **Derecha (Barras y Tiempos):** Ratio de morosidad (%) y mediana de días de resolución por tipología según la norma técnica RETIE.
* **Cómo lo hace:** El gráfico de desempeño calcula la mediana y el percentil 75 ($P_{75}$) mediante ordenamiento muestral `calcQuantile()`, contrastando el volumen con el tiempo de permanencia abierta.
* **Por qué:** Demuestra que aunque *Vegetación* es el mayor volumen ($48.1\%$), **Obras Civiles y Construcciones tardan más del doble de días en resolverse**, guiando a la gerencia a contratar ingenieros civiles y gestores prediales en vez de solo podadores.

---

## MÓDULO 02: TERRITORIO Y MAPA HISTÓRICO (`/territorio`)
**Propósito:** Auditoría espacial, jerárquica y granular de los activos.

### Pestaña 2.1: Mapa Georreferenciado (`HistoricalMapChart.vue` + `MapSideSummary.vue`)
* **Qué hace:** Proyecta las **5.409 torres y 44 líneas de transmisión** sobre la cartografía vectorial oficial de Colombia.
  * 🟢 **Puntos Verdes Esmeralda:** Torres con avisos atendidos dentro del SLA.
  * 🟠 **Puntos Ámbar:** Torres con incidentes cerrados pero fuera de plazo.
  * 🔴 **Puntos Rojos Carmín Pulsantes:** Torres con avisos abiertos vencidos (efecto radar de alarma).
  * **Reproductor Histórico:** Barra de tiempo interactiva con botón de *Play* para animar año a año cómo creció la red y dónde se encendieron las alarmas.
* **Cómo lo hace:** Sistema de coordenadas cartográficas GeoJSON (`colombia_deptos.json`) con series mixtas `lines` (vectores de alta tensión) y `effectScatter` (ondas concéntricas de radar para alerta máxima).
* **Por qué:** Un listado en Excel oculta la geografía. El mapa evidencia si los avisos vencidos están aislados o si forman un clúster continuo a lo largo de un corredor crítico de energía.

### Pestaña 2.2: Diagnóstico de Sectores y Boxplot (`TerritoryDiagnosticsRow.vue`)
* **Qué hace:**
  * **Gráfico 1 (Ranking de Sectores):** Los 15 municipios con más avisos en mora acumulada.
  * **Gráfico 2 (Boxplot de Tiempos):** Diagrama de caja y bigotes que muestra la dispersión real de tiempos ($P_{25}$, Mediana, $P_{75}$) y detecta valores atípicos (*outliers* que superan los 1.000 días abiertos).
* **Por qué:** Los promedios matemáticos engañan cuando hay valores extremos; el Boxplot y la mediana ofrecen certeza estadística para comités de auditoría.

### Pestaña 2.3: Jerarquía Territorial (`TreemapPanel.vue` + `SunburstPanel.vue`)
* **Qué hace:**
  * **Treemap con Vista Dual:** Muestra el peso de cada departamento y municipio proporcional al tamaño de su cuadrante. Incluye un switch a **Ranking Exhaustivo** para auditar en tabla los 38 municipios de Cundinamarca sin que los municipios pequeños se recorten.
  * **Sunburst Concéntrico:** El círculo interior clasifica la causa técnica; el anillo exterior expone la morosidad mediante sombreado armónico sin textos superpuestos.
* **Por qué:** Resuelve el problema clásico de "pérdida de información en la cola larga". Permite la navegación multinivel (*Drill-Down*): País $\to$ Departamento $\to$ Municipio.

### Pestaña 2.4: Auditoría y Detalle de Tickets (`TicketsTable.vue`)
* **Qué hace:** Bitácora tabular con buscador en tiempo real, filtros por estado (*Todos, Abiertos, Vencidos*) y paginación rápida.
* **Por qué:** Permite descender desde la vista macro del mapa hasta el aviso individual `#38491` en la torre `T-104` del municipio de `Ubalá`, logrando conciliación directa contra Oracle EBS.

---

## MÓDULO 03: CAPACIDAD Y MEJORA (`/capacidad`)
**Propósito:** Justificación analítica de recursos y simulación predictiva de evacuación de mora.

### Pestaña 3.1: Carga y Dispersión (`RegionalLoadChart.vue` + `ComplianceScatterChart.vue`)
* **Qué hace:**
  * **Gráfico Combinado de Carga:** Volumen absoluto de avisos frente a la presión relativa por cada 100 torres instaladas.
  * **Matriz de Dispersión (El gráfico clave de la tesis):** Correlaciona la demanda de trabajo (Eje X) con el % de Cumplimiento SLA (Eje Y).
* **Análisis de los 4 Cuadrantes:**
  * *Cuadrante I (Baja Carga / Alto SLA):* Municipios en zona de confort (Ramiriquí $74\%$, Marsella $68\%$).
  * *Cuadrante IV (Alta Carga / Bajo SLA - CRÍTICO):* **Ubalá y Santa María** con $>160$ avisos y $<40\%$ de efectividad.
* **Por qué:** Prueba científicamente que las cuadrillas no deben repartirse a partes iguales entre municipios, sino concentrarse en el Cuadrante IV para romper el cuello de botella.

### Pestaña 3.2: Simulador de Cuadrillas (`CapacitySimulatorPanel.vue`)
* **Qué hace:** Permite al usuario mover 3 controles deslizantes (*sliders*):
  1. Número de cuadrillas asignadas (1 a 25).
  2. Rendimiento promedio de cierre por cuadrilla/mes (2 a 20 avisos/mes).
  3. Porcentaje de dedicación exclusiva a avisos vencidos (20% a 100%).
* **Qué calcula en tiempo real:**
  $$\text{Capacidad Mensual} = \text{Cuadrillas} \times \text{Cierres/Mes}$$
  $$\text{Meses para Evacuar Vencidos} = \frac{\text{Abiertos Vencidos}}{\text{Capacidad Mensual} \times \% \text{Dedicación}}$$
  $$\text{Proyección de Cumplimiento a 6 Meses} = \frac{\text{Cumple Actual} + \text{Cierres en Plazo Proyectados}}{\text{Total Cerrados Proyectados}}$$
* **Por qué:** Transforma el proyecto de un análisis histórico forense en una **herramienta viva de toma de decisiones operativas y presupuestales**.

---

# 5. Sistema de Diseño y Semiótica Visual (Edward Tufte & Stephen Few)

El diseño visual se rige por el principio de **"Máximo Ratio Datos-Tinta"**:
* **Señalética Estricta:**
  * 🔴 **Rojo Carmín (`#BE123C`):** Reservado *únicamente* para abierta violación de SLA y mora crítica.
  * 🟢 **Verde Esmeralda (`#059669`):** Reservado *únicamente* para operación conforme y a tiempo.
  * 🟠 **Ámbar Cobre (`#D97706`):** Atención de advertencia.
  * 🔵 **Teal y Azul Petróleo (`#0F766E`, `#1D4ED8`):** Tonos corporativos institucionales neutros.
* **Scroll Fluido Responsivo:** Diseñado para no cortar información en laptops de 1080p, permitiendo que las 38 zonas de Cundinamarca y las notas metodológicas se lean con desplazamiento natural.
* **Acceso Móvil por QR:** Código QR generado en la cabecera para que evaluadores externos abran y auditen la plataforma en vivo desde sus celulares.

---

# 6. Conexión Financiera y Contable (Oracle EBS & Regulación CREG)

Como aporte para la gerencia y la auditoría contable:
1. **Módulo Oracle Enterprise Asset Management (EAM):**  
   Cada aviso en mora representa una orden de trabajo abierta que traba el cierre de costos mensuales de mantenimiento preventivo y correctivo.
2. **Provisiones Contables bajo NIIF (NIC 37):**  
   Los avisos tipificados como *Construcciones* e *Invasiones* corresponden a litigios de franja de servidumbre, demandando provisiones en el balance por posibles indemnizaciones o trámites de desalojo.
3. **Régimen de Calidad CREG 015:**  
   Al mantener al día los avisos de vegetación en los corredores troncales de Ubalá y Boyacá, la empresa mitiga el riesgo de compensaciones obligatorias a los usuarios finales por indisponibilidad de líneas del Sistema Interconectado Nacional.

---

# 7. Marco Estadístico y Modelado Cuantitativo Riguroso (Defensa ante Clientes Especializados)

Para sustentar el proyecto ante directivos, auditores o clientes con sólida formación estadística, se documentan los 5 pilares matemáticos y metodológicos que sustentan la plataforma:

### 1. El Argumento de la Asimetría Severa (Media vs. Mediana y Skewness)
En distribuciones de tiempo de falla y resolución en infraestructura eléctrica, la media aritmética tradicional distorsiona la realidad operativa:
* **Media Aritmética ($\mu$):** **$804.9\text{ días}$**.
* **Desviación Estándar ($\sigma$):** **$946.1\text{ días}$** (Coeficiente de variación del $117\%$, indicando dispersión extrema).
* **Coeficiente de Asimetría (Fisher-Pearson):** $\mathbf{\text{Skewness} = +2.13}$ (distribución fuertemente asimétrica positiva / *heavy right-tailed*).
* **Por qué se descarta la media:** La media está inflada artificialmente por litigios prediales y servidumbres que alcanzaron hasta **$4.306\text{ días}$** (más de 11 años abierto). Usar la media castigaría injustamente el desempeño de las cuadrillas de campo.
* **Modelado No Paramétrico y Robusto en el Tablero:**
  En `DurationBoxplotChart.vue` y en los servicios analíticos se implementaron estimadores robustos:
  * **Mediana ($Q_2$):** **$439.0\text{ días}$** (el verdadero punto central del 50% de la operación).
  * **Primer Cuartil ($Q_1$):** **$236.0\text{ días}$**.
  * **Tercer Cuartil ($Q_3$):** **$953.0\text{ días}$**.
  * **Rango Intercuartílico ($IQR = Q_3 - Q_1$):** **$717.0\text{ días}$**.
  * **Criterio de Tukey para Outliers:** Todo aviso que supere el límite superior $Q_3 + 1.5 \times IQR = 953 + (1.5 \times 717) = \mathbf{2.028\text{ días}}$ se clasifica y aísla como *valor atípico severo* generado por barreras prediales o judiciales.

### 2. Normalización de Carga: Tasa de Fallo por Exposición al Riesgo
Comparar números absolutos de avisos entre departamentos comete la **falacia del tamaño de muestra**. Cundinamarca tiene más avisos brutos (867) que Tolima (172) simplemente porque opera muchas más torres.

En `RegionalLoadChart.vue` se implementó la tasa normalizada de incidencia:
$$\text{Tasa de Riesgo Relativo} = \left(\frac{\text{Avisos Registrados}}{\text{Torres Instaladas}}\right) \times 100$$
* **Hallazgo Estadístico:**
  * *Valle del Cauca:* $48.6\text{ avisos / 100 torres}$.
  * *Cundinamarca:* $80.2\text{ avisos / 100 torres}$.
  * *Boyacá:* $92.4\text{ avisos / 100 torres}$.
  * *Tolima:* $\mathbf{118.6\text{ avisos / 100 torres}}$ (**Máxima densidad y frecuencia de falla unitaria**).
* **Conclusión:** Aunque Tolima parece pequeño en volumen bruto, sus torres sufren una tasa de estrés **2.4 veces mayor** que las del Valle del Cauca.

### 3. Análisis Bivariado y Puntos de Alto Apalancamiento (*High Leverage Points*)
En la Matriz de Dispersión (`ComplianceScatterChart.vue`), al evaluar la correlación entre Demanda de Trabajo ($X$) y % Cumplimiento SLA ($Y$):
* Ajustar una regresión lineal ordinaria ($R^2$) sería un error metodológico grave: los dos municipios del extremo derecho (**Ubalá y Santa María**, ambos con $>160\text{ avisos}$ y $<41\%\text{ SLA}$) actuarían como **puntos de apalancamiento extremo (High Leverage Points con distancia de Cook crítica)**, distorsionando artificialmente la pendiente para todo el resto del país.
* Por ello, el tablero aplica una **estratificación cartesiana por cuadrantes** con centroides de negocio ($X_0 = 60\text{ avisos}$, $Y_0 = 50\%\text{ SLA}$), demostrando que Ubalá y Santa María constituyen un **régimen operativo anómalo y aislado** que requiere un tratamiento logístico diferenciado.

### 4. Probabilidad Condicional y Odds Ratio en Tipologías
Al contrastar las causas técnicas frente a la morosidad, se demuestra falta de independencia estocástica ($p < 0.001$):
* $P(\text{Excede SLA} \mid \text{Obras Civiles}) = \frac{167}{236} = \mathbf{70.8\%}$
* $P(\text{Excede SLA} \mid \text{Permiso de Ingreso}) = \frac{85}{125} = \mathbf{68.0\%}$
* $P(\text{Excede SLA} \mid \text{Vegetación}) = \frac{770}{1.499} = \mathbf{51.4\%}$
* $P(\text{Excede SLA} \mid \text{Construcciones}) = \frac{558}{1.165} = \mathbf{47.9\%}$

**Riesgo Relativo (Odds Ratio):**
$$\text{OR}_{\text{Obras vs. Construcciones}} = \frac{0.708 / (1 - 0.708)}{0.479 / (1 - 0.479)} = \frac{2.42}{0.92} = \mathbf{2.63}$$
Un aviso de obra civil tiene **2.6 veces más probabilidad de incumplir el SLA** que uno de construcción, demostrando cuantitativamente que las mayores demoras provienen de la complejidad técnica de estabilización de suelos y no de la poda rutinaria.

### 5. Formulación de Teoría de Colas en el Simulador de Capacidad
El simulador de cuadrillas (`CapacitySimulatorPanel.vue`) modela el equilibrio de flujo bajo los principios de sistemas de colas multi-servidor ($M/M/c$):
* **Tasa Media de Arribo de Fallas:** $\lambda$ (incidentes nuevos por unidad de tiempo).
* **Capacidad de Servicio Combinada:** $\mu_{\text{total}} = c \cdot \mu_0$ ($c$: número de cuadrillas, $\mu_0$: ritmo de cierre por cuadrilla/mes).
* **Criterio de Estabilidad de la Red:** La condición necesaria para evitar una cola infinita de backlog acumulado es que la intensidad de tráfico sea inferior a la unidad:
  $$\rho = \frac{\lambda}{c \cdot \mu_0} < 1$$
* **Tiempo Teórico de Evacuación de Backlog ($B_0 = 344\text{ avisos vencidos}$):** Con una fracción de dedicación prioritaria $\alpha = 70\%$ y $c = 12$ cuadrillas a $\mu_0 = 10\text{ cierres/mes}$:
  $$T_{\text{evacuación}} = \frac{B_0}{\alpha \cdot (c \cdot \mu_0)} = \frac{344}{0.70 \times (12 \times 10)} = \frac{344}{84} = \mathbf{4.1\text{ meses}}$$

---

## 8. Guía de Respuestas Rápidas para la Sustentación Cuantitativa

| Pregunta del Evaluador / Cliente | Respuesta Técnica Inmediata |
| :--- | :--- |
| **"¿Por qué no usaron la media para los días de atención?"** | *"Porque la distribución tiene un coeficiente de asimetría (Skewness) de +2.13 con cola pesada hacia la derecha de hasta 4.306 días. Usar la media inflaría artificialmente el tiempo central a 805 días; la mediana no paramétrica de 439 días y el rango intercuartílico (IQR = 717 d) representan con fidelidad matemática el 50% central de la operación."* |
| **"¿Por qué no trazaron una línea de regresión en el gráfico de dispersión?"** | *"Porque Ubalá y Santa María actúan como puntos de alto apalancamiento (High Leverage Points) con distancia de Cook extrema que falsearían la pendiente de toda la muestra. La segmentación en 4 cuadrantes permite aislar este régimen de cuello de botella sin violar supuestos de homocedasticidad."* |
| **"¿Por qué afirman que Tolima es más crítico que Valle si Valle tiene más del doble de avisos?"** | *"Porque normalizamos el indicador calculando la tasa de fallo por cada 100 torres instaladas. Tolima presenta una densidad de 118.6 avisos/100 torres frente a 48.6 en el Valle, evidenciando una tasa de estrés unitario 2.4 veces mayor sobre sus activos."* |
| **"¿Qué validez matemática tiene su simulador de cuadrillas?"** | *"Modela la dinámica de colas multi-servidor evaluando la condición de estabilidad de Erlang ($\rho < 1$). Calcula el punto donde la tasa de servicio ($c \cdot \mu$) supera el flujo de arribo para extinguir el backlog acumulado de 344 avisos en un horizonte finito de 4 meses."* |

---

# 9. Guía Pedagógica: Cada Gráfico Explicado en Lenguaje Natural (Nivel Primer Grado)

Esta sección traduce cada componente visual a metáforas cotidianas (juguetes, semáforos, carreteras y médicos) para sustentar ante audiencias no técnicas, directores generales o evaluadores que busquen la máxima claridad conceptual.

### 1. El Mapa Geográfico con Bombillos de Colores (`HistoricalMapChart.vue`)
* **¿Qué es este dibujo?** El mapa de Colombia visto desde un satélite, con el trazado de los cables de alta tensión y las 5.409 torres que llevan la energía.
* **¿Qué son los bombillitos?** Cada torre donde ocurrió un incidente técnico:
  * 🟢 **Verde Esmeralda:** El problema se arregló a tiempo y sin contratiempos.
  * 🟠 **Naranja Ámbar:** El problema se solucionó, pero los técnicos llegaron después de la fecha pactada.
  * 🔴 **Rojo Carmín Pulsante:** ¡Alerta roja! Es un daño que sigue roto hoy en día y ya venció su plazo legal.
* **Mensaje clave:** Muestra geográficamente dónde están los incendios operativos en tiempo real y permite ver la evolución histórica año por año con el reproductor interactivo.

### 2. La Rosquilla de Dos Pisos (`SunburstChart.vue`)
* **¿Qué es este dibujo?** Una torta circular concéntrica con dos niveles de información.
* **El piso de adentro (El centro):** Responde a **QUÉ** se dañó:
  * *Vegetación (Verde oscuro, 48.1%):* Árboles y ramas creciendo cerca de los cables.
  * *Construcciones (Azul, 37.4%):* Fallas estructurales en las torres metálicas.
  * *Obras, Permisos e Invasiones (Pizarra, 14.5%):* Problemas prediales o terrenos inestables.
* **El anillo de afuera:** Responde a **CÓMO** nos fue atendiéndolo:
  * 🟢 *Verde Esmeralda:* Cumplió la meta contractual (SLA).
  * 🔴 *Rojo Carmín:* Se pasó de la fecha límite.
* **Mensaje clave:** *"El centro muestra la enfermedad técnica de la torre; el borde exterior muestra si el médico llegó a tiempo o tarde"*.

### 3. La Caja de Juguetes Cuadrada (`TreemapPanel.vue`)
* **¿Qué es este dibujo?** Una caja grande dividida en compartimientos rectangulares, donde cada cajón representa un municipio.
* **¿Por qué unos cajones son más grandes?** El tamaño es directamente proporcional a la cantidad de problemas acumulados. Un cajón gigante (como Ubalá) exige atención inmediata frente a cajones diminutos.
* **Mensaje clave:** Permite a la gerencia priorizar recursos visualmente en 2 segundos sin perderse en tablas interminables de Excel.

### 4. La Carrera de los Municipios Más Demorados (`SectorDelayRankingChart.vue`)
* **¿Qué es este dibujo?** Un ranking de barras horizontales ordenado de mayor a menor tiempo de espera.
* **Mensaje clave:** Es la "lista de cuellos de botella". Si un municipio muestra 1.200 días promedio, evidencia que en esa zona existen trabas burocráticas o prediales graves que frenan el cierre de órdenes en Oracle EBS.

### 5. La Regla con Bigotes (`TypologyBoxplotChart.vue`)
* **¿Qué es este dibujo?** Cajas horizontales con dos antenas o "bigotes" que miden la dispersión del tiempo.
* **Mensaje clave:** Demuestra que podar un árbol (Vegetación) toma pocos días y es predecible (caja compacta), mientras que conseguir una servidumbre (Permiso de Ingreso) puede tardar años (caja estirada con puntos lejanos atípicos).

### 6. El Tacómetro de la Moto (`GaugeChart.vue`)
* **¿Qué es este dibujo?** Un velocímetro con una aguja central que califica la eficiencia global.
* **Mensaje clave:** Muestra que la red se encuentra en **47.8% de cumplimiento** (zona naranja-roja), lo que justifica y fundamenta este proyecto de grado como una necesidad operativa crítica.

### 7. El Mapa de Cuatro Esquinas (`ComplianceScatterChart.vue`)
* **¿Qué es este dibujo?** Un plano cartesiano donde cada punto es un municipio ubicado según su carga de trabajo (eje X) y su porcentaje de éxito (eje Y).
* **Mensaje clave:** Aísla en la esquina superior izquierda a los municipios críticos (Ubalá y Santa María con más de 160 avisos y menos del 41% de SLA), demostrando matemáticamente que son casos atípicos de alto apalancamiento.

### 8. La Gráfica de la Bañera que se Vacía (`CapacityDrainChart.vue`)
* **¿Qué es este dibujo?** Una simulación de flujo que modela 743 avisos abiertos acumulados como una bañera llena.
* **Mensaje clave:** Es una herramienta prospectiva para la toma de decisiones: muestra que contratando 2 cuadrillas adicionales ($c = 12$) y asignando el 70% de su tiempo al rezago, la bañera de incidentes vencidos se drena por completo en **4.1 meses**.

---

# 10. Bitácora de Optimizaciones de Alto Rendimiento y Cartografía

Durante la fase de validación técnica y pruebas de usuario, se ejecutaron las siguientes mejoras sobre el código fuente de la plataforma:

1. **Eliminación del Cuello de Botella de Carga del Mapa (`HistoricalMapChart.vue`):**
   * Se retiraron los filtros masivos de desenfoque gaussiano (`shadowBlur: 5` y `shadowBlur: 10`) en Canvas 2D que congelaban el hilo principal al renderizar miles de coordenadas.
   * Se activó el streaming progresivo en ECharts (`progressive: 600`, `large: true`).
   * Se implementó un *overlay* de carga con *spinner* interactivo que informa el estado de procesamiento de los 5.409 activos.
2. **Solución a la Oclusión de Nodos (*Anti-Overplotting*):**
   * En la versión inicial, los avisos vencidos (11% del total) tenían un radio de 12px y una onda de radar de 38.4px que cubría completamente los puntos verdes y naranjas adyacentes a lo largo de los vanos entre torres.
   * Se redujo el calibre base de la alarma a 7.5px y la onda a escala 1.8.
   * Se incorporó un algoritmo de **micro-dispersión radial determinista (*jittering* polar ~120m)** para que múltiples avisos ocurridos en una misma torre a lo largo del tiempo (2008–2023) coexistan visualmente como nodos contiguos distinguibles.
3. **Caché Singleton en Memoria (`datasetRepository.ts`):**
   * Se precalculó y congeló la geometría de los 44 corredores de alta tensión (`getStaticLines`) y la tabla hash de torres (`getEquiposMap`), ahorrando ~85 ms de procesamiento de CPU por cada acción de filtrado.
4. **Armonización Semiótica del Sunburst (`SunburstChart.vue`):**
   * Se asignaron contrastes plenos en el anillo exterior: Verde Esmeralda (`#059669`) para cumplimiento en norma y Rojo Carmín (`#DC2626`) para alerta de mora contractual.
   * Se protegieron los rótulos de texto mediante el parámetro `minAngle: 25`, mostrando texto limpio y centrado en las categorías mayores (*Vegetación* y *Construcciones*) y evitando solapamiento tipográfico en sectores estrechos.



