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
