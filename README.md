# EcoGrid DEC · Dashboard de Gestión Operativa y Cumplimiento de la Atención

> **Proyecto de Grado**  
> **Integrantes:** Ronald Salazar · Oscar Córdoba · Francy Buitrago · Amalia Garavito  
> **Rol Objetivo:** Director o Coordinador de Operaciones de Transmisión Eléctrica  
> **Ámbito de Operación:** Infraestructura de Alta Tensión en el Suroccidente y Centro de Colombia (5.409 torres y 44 líneas de transmisión)  
> **Repositorio Oficial:** [https://github.com/rsalazar2423-bit/Visualizacion](https://github.com/rsalazar2423-bit/Visualizacion)

---

## 1. Contexto y Planteamiento del Problema

El contratista encargado del mantenimiento y operación de la red de transmisión eléctrica en el suroccidente y centro de Colombia tiene el mandato de garantizar la atención oportuna de incidentes sobre torres y líneas de alta tensión, respetando los acuerdos de nivel de servicio (**SLA**) fijados para cada prioridad (desde atención semanal inmediata hasta horizontes plurianuales).

La gestión operativa enfrenta cuellos de botella derivados de:
- **Tiempos de resolución asimétricos**: dispersión extrema con una **mediana típica de 383 días** frente a un **promedio de 575,1 días**, distorsionado por colas históricas de difícil acceso.
- **Backlog crítico acumulado**: `743` avisos abiertos a la fecha de corte, de los cuales **`344` se encuentran formalmente vencidos** (prioridad superada).
- **Concentración territorial y tipológica**: más del `68%` de los avisos corresponden a intervenciones de silvicultura y despeje de vegetación en servidumbres, concentrados en corredores de alta pluviosidad y complejidad geográfica.

---

## 2. Los 4 Indicadores Principales (KPIs)

Definidos según el documento rector del proyecto para una lectura inmediata del estado de la red:

| Indicador (KPI) | Definición Operativa | Valor en Red EcoGrid | Significado para la Dirección |
| :--- | :--- | :--- | :--- |
| **Cumplimiento Oportuno** | $\frac{\text{Avisos Cerrados en Plazo}}{\text{Total Avisos Cerrados}} \times 100$ | **45,9%** | Mide si se están respetando los compromisos contractuales de SLA. |
| **Avisos Abiertos** | $\sum \text{Avisos Pendientes de Cierre}$ | **743 avisos** | Cuantifica el volumen total de trabajo activo en gestión. |
| **Abiertos Vencidos** | $\sum \text{Avisos Abiertos con } \text{Días Abierto} > \text{Plazo SLA}$ | **344 avisos** | Señala el backlog crítico que requiere intervención y refuerzo inmediato. |
| **Tiempo Típico de Atención** | $\text{Mediana}(\text{Días Abierto en Cerrados})$ | **383 días** | Indicador robusto de la duración normal de una orden sin sesgo por valores atípicos. |

---

## 3. Arquitectura del Tablero: Las 3 Vistas Tácticas + Gobernanza Visual

La navegación implementa una secuencia lógica de toma de decisiones: **Entender el panorama global $\rightarrow$ Diagnosticar causas territoriales y técnicas $\rightarrow$ Explorar escenarios de mejora de capacidad**.

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                            PORTADA Y RESUMEN                                │
  │   Hero institucional · Lectura de los 4 KPIs clave · Accesos directos       │
  └──────────────────────┬──────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼──────────────────────────────┐
         ▼               ▼                              ▼
  ┌──────────────┐┌──────────────────────────────┐┌─────────────────────────────┐
  │   VISTA 01   ││           VISTA 02           ││          VISTA 03           │
  │ Seguimiento  ││   Diagnóstico Territorial    ││     Capacidad y Mejora      │
  │      y       ││          y Técnico           ││          Operativa          │
  │ Cumplimiento ││ (Mapa Histórico 2008–2023)   ││   (Simulador de Cuadrillas) │
  └──────────────┘└──────────────────────────────┘└─────────────────────────────┘
         │                       │                              │
         └───────────────────────┼──────────────────────────────┘
                                 ▼
                  ┌──────────────────────────────┐
                  │      GOBERNANZA DE COLOR     │
                  │        Ruta: /diseno         │
                  │   Manual de Color y Tokens   │
                  │   Regla 60-30-10 · WCAG AAA  │
                  └──────────────────────────────┘
```

### Vista 01 · Seguimiento y Cumplimiento (`/operaciones`)
* **Propósito:** Responder ¿cómo está funcionando la atención y cómo se comporta en el tiempo?
* **Componentes:**
  - 4 tarjetas KPI reactivas con semáforo SLA.
  - **Evolución Temporal de Avisos:** Curvas de avisos ingresados vs. cerrados por año (2008–2023) y porcentaje de cumplimiento anual.
  - **Barras 100% Apiladas por Prioridad:** Comparación directa del cumplimiento entre Semana, Mes, Trimestre, Semestre, Año y horizontes mayores.
  - **Dona de Composición Técnica:** Proporción de incidentes por tipología.
  - **Filtros Dinámicos:** Selector multiselección de tipologías y prioridades.

### Vista 02 · Diagnóstico Territorial y Técnico (`/territorio`)
* **Propósito:** Responder ¿dónde y en qué tipos de aviso se concentran las mayores dificultades?
* **Componentes:**
  - **Mapa Geográfico Interactivo 2008–2023:** Georreferenciación de 5.409 torres y 44 líneas de transmisión con línea de tiempo histórica (*Play / Pausa / Deslizador*), capas de avisos y semáforo visual.
  - **Ranking de Sectores con Mayores Retrasos:** Gráfico de barras horizontales identificando municipios con mayor volumen de abiertos vencidos.
  - **Duración por Tipología (Cuantiles):** Distribución estadística por tipo de aviso indicando P25, Mediana, P75 y Promedio.
  - **Desglose Jerárquico Treemap & Sunburst:** Navegación multinivel por Zona, Departamento y Municipio.
  - **Tabla de Auditoría de Avisos:** Búsqueda en vivo y filtro rápido para inspección de órdenes vencidas.

### Vista 03 · Capacidad y Mejora Operativa (`/capacidad`)
* **Propósito:** Responder ¿qué ajustes de personal y recursos permiten abatir el backlog operativo?
* **Componentes:**
  - **Carga Regional vs. Infraestructura:** Gráfico combinado de avisos abiertos vs. densidad relativa por cada 100 torres instaladas.
  - **Matriz de Dispersión Cuadrante:** Volumen de avisos vs. % Cumplimiento por municipio, donde el tamaño del nodo indica los abiertos vencidos.
  - **Simulador Interactivo de Cuadrillas:** Modelo paramétrico en cliente para calcular:
    - Capacidad mensual de cierre según cuadrillas activas y ritmo de atención.
    - Meses proyectados para evacuar el 100% de los abiertos vencidos.
    - Proyección de mejora en la tasa de cumplimiento oportuno a horizonte de 6 meses.

### Gobernanza de Color y Sistema de Diseño (`/diseno`)
* **Propósito:** Garantizar rigor cromático, eliminar colores "arcoíris" y proveer una guía de estilo accesible.
* **Componentes:** Conmutador en vivo Tema Claro / Oscuro, inspección de variables CSS de 4 capas, copiado interactivo de valores HEX y panel de auditoría de colores descartados.

---

## 4. Arquitectura de Software y Principio de Responsabilidad Única (SRP)

El proyecto adopta una arquitectura modular orientada a la mantenibilidad y desacoplamiento estricto:

* **Separación de Servicios Analíticos (`frontend/src/services/analytics/`):**
  - `datasetRepository.ts`: Exclusivamente I/O de red y almacenamiento en memoria caché.
  - `statsHelpers.ts`: Funciones matemáticas puras (cuantiles, mediana, filtrado transversal).
  - `operationsAnalytics.ts`: Lógica analítica exclusiva de la Vista 01 y Portada.
  - `territoryAnalytics.ts`: Lógica espacial de la Vista 02, topología de líneas y ranking de sectores.
  - `capacityAnalytics.ts`: Lógica de densidad y dispersión territorial de la Vista 03.
  - `clientDataService.ts`: Fachada liviana (*Facade Pattern*) que expone la API pública.
* **Gestión de Estado Centralizada con Pinia (`frontend/src/stores/`):**
  - `operationsStore.ts`: Filtros y reactividad de la Vista 01.
  - `territoryStore.ts`: Estado territorial, drill-down y selección de la Vista 02.
  - `capacityStore.ts`: Parámetros de simulación y proyecciones de la Vista 03.
  - `geoFilterStore.ts`: Coordinación de filtros geográficos globales.
  - `themeStore.ts`: Persistencia y conmutación de tema claro/oscuro.

---

## 5. Sistema de Diseño y Paleta de Colores Oficial

El sistema aplica la **regla 60-30-10** y asegura una distancia cromática **Delta-E > 25 (CIELAB)** para evitar que las tipologías técnicas colisionen con los colores de advertencia SLA:

| Capa | Rol en Pantalla | Tema Claro (Editorial Clean) | Tema Oscuro (Control Room) |
| :--- | :--- | :--- | :--- |
| **Superficie** (60%) | Fondos y Contenedores | `#F8FAFC` / `#FFFFFF` | `#0B0F19` / `#111827` |
| **Tipografía** | Lectura y Jerarquía (WCAG AAA) | `#0F172A` (15,8:1) | `#F8FAFC` (14,2:1) |
| **Identidad Marca** | EcoGrid DEC | `#0D9488` (Teal 600) | `#14B8A6` (Teal 500) |
| **SLA Cumple** | En Plazo / Éxito | `#059669` (Esmeralda) | `#10B981` (Esmeralda Suave) |
| **SLA Warning** | Tiempo Típico / En Riesgo | `#D97706` (Ámbar) | `#F59E0B` (Ámbar Dorado) |
| **SLA Danger** | Excede Plazo / Vencido | `#DC2626` (Carmesí) | `#EF4444` (Rojo Calibrado) |
| **Vegetación** | Tipología de Aviso (~70%) | `#3F6212` (Oliva Silvicultural) | `#A3E635` (Lima Suave) |
| **Construcciones** | Tipología de Aviso | `#1D4ED8` (Cobalto Ingeniería) | `#60A5FA` (Cobalto Suave) |
| **Obras** | Tipología de Aviso | `#475569` (Grafito Industrial) | `#94A3B8` (Acero Pizarra) |
| **Permiso Ingreso** | Tipología de Aviso | `#6D28D9` (Amatista Predial) | `#A78BFA` (Amatista Suave) |
| **Invasión / Explan.** | Tipología de Aviso | `#C2410C` (Terracota Suelo) | `#FB923C` (Terracota Suave) |

---

## 6. Guía de Ejecución y Pruebas

### Requisitos Previos
* **Node.js**: v18+ y npm
* **Python**: 3.10+ (opcional para ejecución del backend FastAPI)

### Ejecución del Frontend (Modo GitOps en Cliente)
```bash
cd frontend
npm install
npm run dev
```
La aplicación abrirá en `http://localhost:5173` consumiendo directamente el dataset optimizado `ecogrid_data.json` y el GeoJSON `colombia_deptos.json`.

### Ejecución de Pruebas Automatizadas
* **Pruebas Unitarias Frontend (Vitest - 13 tests en 4 suites):**
  ```bash
  cd frontend
  npm run test
  ```
* **Compilación de Producción (Vue-TSC + Vite):**
  ```bash
  cd frontend
  npm run build
  ```
* **Pruebas de Backend (Pytest):**
  ```bash
  pytest backend/tests/
  ```
