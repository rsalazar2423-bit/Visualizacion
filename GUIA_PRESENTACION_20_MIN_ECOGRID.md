# Guión de Presentación (20 Minutos) — Dashboard EcoGrid DEC

> **Objetivo de la presentación**: Mostrar cómo el análisis visual convierte **3.118 avisos históricos (2008–2023)** y **5.409 torres georreferenciadas** en decisiones operativas sobre cumplimiento SLA, focos territoriales y asignación de cuadrillas.

---

## Agenda y Control de Tiempo (20 min)

| Bloque | Vista | Tiempo | Enfoque clave |
| :--- | :--- | :---: | :--- |
| **1. Apertura y Panorama** | `Resumen` (Portada) | **3 min** | Problema, 4 KPIs y diagnóstico ejecutivo inicial |
| **2. Dinámica y Tiempos** | `01 · Operaciones` (4 gráficas) | **6 min** | Evolución temporal, violín SLA y causas técnicas |
| **3. Territorio y Auditoría** | `02 · Territorio` (Mapa + Diagnóstico + Jerarquía + Tabla) | **6 min** | Corredores críticos, filtros de estado y trazabilidad |
| **4. Capacidad y Acción** | `03 · Capacidad` (2 gráficas + Simulador) | **4 min** | Presión por regional, dispersión y simulación de cuadrillas |
| **5. Cierre** | `Paleta y Diseño` (mención breve) | **1 min** | Gobernanza visual, accesibilidad y modo claro/oscuro |

---

## 1. Portada — `Resumen` (3 min)

- **Qué mostrar**:
  1. **4 KPIs principales**: `Cumplimiento Oportuno (45.9% en cerrados / 47.8% total red)`, `Avisos Abiertos (743)`, `Abiertos Vencidos (344)` y `Tiempo Típico (383 días de mediana)`.
  2. **Pulso Ejecutivo Central**:
     - *Izquierda*: Barra de estado del portafolio (`Cerrados a Tiempo`, `Cerrados con Retraso`, `Abiertos En Plazo`, `Abiertos Vencidos`) y Top 5 de tipologías (`Vegetación` lidera con `48.1%`).
     - *Derecha*: Cumplimiento por Prioridad SLA de un vistazo.
- **Frase clave para el público**: *"Antes de entrar al detalle, el resumen confirma dos hechos: casi la mitad de los avisos está fuera de plazo, y el problema se concentra en Vegetación y en 344 avisos abiertos ya vencidos."*

---

## 2. Vista `01 · Seguimiento y SLA` (6 min)

### Hoja 1: Dinámica & Plazos SLA
1. **Evolución de Avisos y Cumplimiento (2008 – 2023)** *(~2 min)*
   - **Qué muestra**: Comparación anual entre `Avisos Ingresados`, `Avisos Cerrados`, `Abiertos Vencidos` (barras rojas) y la línea punteada de `% Cumplimiento` (o `Mediana Días` en el eje derecho).
   - **Interacción sugerida en vivo**: Cambiar el eje derecho entre `% Cumplimiento` y `Mediana Días`, y usar los 3 iconos de zoom arriba a la derecha para acercar el pico de demanda `2022`.
   - **Mensaje clave**: Permite ver en qué años la demanda superó la capacidad de cierre, dejando backlog vencido acumulado.

2. **Distribución de Tiempos por Prioridad SLA (Gráfico de Violín)** *(~2 min)*
   - **Qué muestra**: La forma real (densidad KDE) de cuántos días tarda la atención en cada prioridad SLA (`Semana` a `Seis años`), con su **caja intercuartílica (`Q1–Q3`)**, **mediana** y la **barra ámbar del límite SLA**. En muestras pequeñas (`N < 15`, como `Semana`) muestra los puntos reales para no suavizar artificialmente.
   - **Interacción sugerida en vivo**: Mostrar en escala `Log` cómo las medianas de `Mes` (`30 d`) y `Trimestre` (`90 d`) superan ampliamente su barra límite ámbar; luego cambiar agrupación a `Tipología` o estado `Abiertos` vs `Cerrados`.
   - **Mensaje clave**: *"La mediana por sí sola no basta: el violín muestra las colas largas y exactamente qué prioridades tienen su distribución completa por encima del límite SLA."*

### Hoja 2: Composición Técnica
3. **Composición por Tipología Técnica (Dona)** *(~1 min)*
   - **Qué muestra**: Peso proporcional de las 5 causas (`Vegetación`, `Construcciones`, `Obras`, `Permiso Ingreso`, `Invasión/Explanación`).
   - **Interacción**: Pasar el cursor para ver el detalle y hacer clic en `Vegetación` para aislar toda la hoja a esa especialidad.

4. **Efectividad SLA y Duración por Tipología (Barras 100% + Mediana)** *(~1 min)*
   - **Qué muestra**: Qué porcentaje cumple vs. excede plazo por especialidad junto con su mediana real de días a la derecha.
   - **Mensaje clave**: `Construcciones` y `Obras` presentan las medianas de cierre más largas, mientras `Vegetación` concentra el mayor volumen operativo.

---

## 3. Vista `02 · Territorio y Mapa Histórico` (6 min)

1. **Mapa Geográfico de Torres, Líneas de Transmisión y Avisos (2008 – 2023)** *(~3 min)*
   - **Qué muestra**: Las `44` líneas de transmisión y `5.409` torres georreferenciadas junto con los avisos diferenciados por estado real: `Abiertos Vencidos` (rojo pulsante), `Abiertos En Plazo` (azul cian), `Cerrados con Retraso` (ámbar) y `Cerrados a Tiempo` (verde).
   - **Interacción sugerida en vivo**:
     - Filtrar un departamento (p. ej. `Tolima` o `Nariño`).
     - Usar las píldoras superiores o el panel derecho clicable para aislar `Abiertos Vencidos`, luego `Abiertos En Plazo` (activos no vencidos) y `Cerrados`.
     - Ocultar/mostrar `Corredores Eléctricos` desde el panel derecho y pulsar `Reproducir Historia` o `Centrar`.
   - **Mensaje clave**: Convierte un listado histórico en focos geográficos exactos sobre corredores de transmisión.

2. **Diagnóstico Territorial (2 Gráficas)** *(~1.5 min)*
   - **Sectores con Mayor Atraso**: Ranking de municipios/sectores donde se acumulan los `Abiertos Vencidos` para priorizar cuadrillas.
   - **Tiempos de Atención por Tipo de Aviso (Mediana vs. P75)**: Compara la duración típica frente al percentil 75 (casos lentos) por tipología.

3. **Jerarquía Técnica (`Treemap` / `Sunburst`) + Tabla de Auditoría** *(~1.5 min)*
   - **Jerarquía**: Desglose `Departamento → Municipio → Tipo de Aviso` (clic para profundizar o `Sunburst` radial).
   - **Tabla Auditable**: Evidencia registro a registro (aviso, equipo, prioridad, días y estado) para respaldar auditoría y exportación.

---

## 4. Vista `03 · Capacidad y Mejora Operativa` (4 min)

1. **Carga Regional: Backlog Activo y Densidad de Torres** *(~1.5 min)*
   - **Qué muestra**: Compara por regional/CTE los avisos abiertos (vencidos vs. en plazo) frente a la densidad operativa por cada `100` torres.
   - **Mensaje clave**: Distingue qué regionales tienen mucho volumen simplemente porque administran más red vs. cuáles sufren sobrecarga real por torre.

2. **Matriz de Dispersión: Carga de Trabajo vs. `% Cumplimiento`** *(~1.5 min)*
   - **Qué muestra**: Cada burbuja es un municipio (`Eje X` = volumen de avisos, `Eje Y` = `% cumplimiento SLA`, tamaño = mora acumulada).
   - **Mensaje clave**: Identifica inmediatamente el cuadrante crítico (alta carga y bajo cumplimiento), donde una intervención genera mayor impacto.

3. **Simulador de Asignación de Cuadrillas** *(~1 min)*
   - **Qué muestra**: Herramienta interactiva de cierre donde se simula el refuerzo de cuadrillas/capacidad para proyectar la reducción del backlog vencido.

---

## 5. Cierre — `Paleta y Diseño` (1 min)

- **Qué mostrar brevemente**: Consistencia semántica de color (por qué rojo/ámbar/esmeralda/cian mantienen un único significado en todo el tablero, soporte claro/oscuro y diseño `0` scroll adaptado a pantallas ejecutivas).
- **Frase de cierre**: *"El tablero integra diagnóstico estadístico, trazabilidad territorial y simulación operativa en una sola herramienta lista para toma de decisiones."*
