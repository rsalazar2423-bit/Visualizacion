# Guion Profesional de Entrega — Tablero EcoGrid DEC

> Documento de apoyo para presentar y sustentar la plataforma **EcoGrid Colombia · Monitoreo Sostenible DEC** (`src/` y `public/data/ecogrid_data.json`), enfocado en su **nivel profesional**, su **usabilidad** y **por qué cubre las expectativas** operativas y analíticas.

---

## 1. Versión A — Diálogo ejecutivo completo (2 a 3 minutos)

### Apertura y propósito (qué entregamos)
> *"Hoy entregamos **EcoGrid DEC**, una plataforma de inteligencia analítica diseñada para pasar del reporte descriptivo a la toma de decisiones táctico-operacionales sobre la red de transmisión eléctrica en Colombia. El tablero consolida el historial **2008–2023** de **3.118 avisos operativos** distribuidos en **5.409 torres georreferenciadas**, **10 departamentos**, **166 municipios** y **43 corredores de transmisión** entre las regionales **Centro** y **Suroccidente**."*

### Por qué es una entrega profesional (rigor visual y estadístico)
> *"Desde el diseño visual aplicamos una arquitectura cromática restringida y sobria —inspirada en principios de visualización ejecutiva como Edward Tufte y Stephen Few— con un elenco cerrado de **8 tonos**: una rampa neutra en azul acero y pizarra para el comportamiento histórico, y únicamente rojo carmín y ámbar cobre para señalizar mora activa y retraso. Con esto eliminamos la saturación visual y dirigimos la atención inmediata hacia donde existe riesgo real.*
>
> *En el plano estadístico, evitamos quedarnos únicamente en promedios que ocultan colas largas: medimos el tiempo típico de atención mediante la **mediana (383 días en cerrados)**, incorporamos distribuciones de densidad tipo **violín con rango intercuartílico (Q1–Q3) y límite normativo SLA** —mostrando los puntos individuales cuando la muestra es menor a 15 avisos para no suavizar datos escasos de forma engañosa— y complementamos el diagnóstico territorial con el **percentil 75 (P75)**."*

### Por qué destaca en usabilidad (diseño centrado en quien decide)
> *"El tablero está construido para ofrecer cero fricción cognitiva:*
> *1. Sigue una **narrativa progresiva en cuatro niveles**: **Portada** (pulso ejecutivo inmediato), **01 · Seguimiento y Cumplimiento** (tendencia y SLA), **02 · Territorio y Mapa Histórico** (localización y auditoría) y **03 · Capacidad y Mejora** (asignación de recursos).*
> *2. Cada pantalla de análisis aplica un diseño **viewport-fit** con un máximo de **dos gráficas por hoja** y una barra de control compacta de un solo renglón, evitando el desplazamiento vertical interminable.*
> *3. Los filtros trabajan en **cascada sincronizada** (`CTE → Departamento → Municipio`) e incluyen **filtrado cruzado al hacer clic**, **auto-encuadre geográfico** calculado sobre el corredor eléctrico real (y no sobre zonas vacías del polígono político), cambio entre **tema Claro y Oscuro**, botón **Ampliar** a pantalla completa (con salida mediante `Esc`) para sustentar en comité y acceso inmediato mediante **código QR** desde celular o tablet."*

### Por qué creemos que cubre las expectativas
> *"Consideramos que esta solución cubre las expectativas porque cierra el ciclo completo de la gestión operativa en una sola herramienta:*
> *1. **Responde qué está pasando:** muestra en segundos que el cumplimiento oportuno en cerrados es del **45,9%** (**47,8%** sobre el total de la red), que hay **344 avisos abiertos vencidos** que exigen acción inmediata y que **Vegetación (48,1%; 1.499 avisos)** y **Construcciones (1.165 avisos)** concentran la mayor carga.*
> *2. **Responde dónde actuar y por qué:** mediante la línea de tiempo **2008–2023** en el mapa georreferenciado, el ranking de municipios y sectores con mayor mora, el desglose jerárquico con vista alternativa en **Ranking Exhaustivo buscable** para no perder la cola larga, y una **Tabla de Auditoría** con trazabilidad al número de aviso individual.*
> *3. **Responde cómo resolverlo:** con el indicador de carga por cada **100 torres**, la matriz municipal de dispersión y un **Simulador Táctico de Cuadrillas** con supuestos explícitos, donde el equipo ajusta el número de cuadrillas, cierres por mes y porcentaje de foco en mora vencida para estimar los meses de evacuación y el cumplimiento proyectado a 6 meses.*
>
> *En síntesis, no entregamos un conjunto de gráficas aisladas: entregamos una herramienta clara, auditable y accionable para priorizar cuadrillas y recuperar los niveles de servicio."*

---

## 2. Versión B — Guion guiado paso a paso (demo en vivo)

| Paso | Vista / Ruta | Qué mostrar en pantalla | Qué decir |
| :--- | :--- | :--- | :--- |
| **1** | **Portada** (`/`) | 4 KPIs rectores, barra de portafolio y barras de SLA por prioridad | *"En la portada obtenemos la lectura ejecutiva inmediata: 3.118 avisos sobre 5.409 torres, 45,9% de cumplimiento oportuno en cerrados, 344 abiertos vencidos y Vegetación como causa líder con 48,1%."* |
| **2** | **01 · Seguimiento y SLA** (`/operaciones`) | Hoja 1 (*Evolución + Violín*) y Hoja 2 (*Composición Técnica*); clic en una tipología | *"Aquí analizamos la dinámica 2008–2023 y los tiempos por prioridad SLA frente a su límite normativo. En la segunda hoja podemos hacer clic sobre 'Vegetación' o 'Construcciones' para filtrar de manera cruzada su desempeño."* |
| **3** | **02 · Territorio y Mapa** (`/territorio`) | Reproducir línea de tiempo, aislar `Abiertos Vencidos`, activar corredores y cambiar a *Diagnóstico*, *Jerarquía* y *Auditoría* | *"En el mapa podemos reproducir la historia año a año o aislar los 344 abiertos vencidos junto a los 43 corredores eléctricos. En 'Diagnóstico' ubicamos los municipios con mayor atraso y la brecha Mediana vs. P75; en 'Jerarquía' bajamos de departamento a municipio con opción de Ranking Exhaustivo; y en 'Auditoría' auditamos aviso por aviso."* |
| **4** | **03 · Capacidad y Mejora** (`/capacidad`) | Gráfica de carga por 100 torres + dispersión municipal y *Simulador de Cuadrillas* | *"Aquí cruzamos backlog frente a densidad por 100 torres para detectar municipios críticos en rojo. En el Simulador ajustamos cuadrillas, ritmo de cierre y dedicación a vencidos para estimar en vivo el tiempo de saneamiento."* |
| **5** | **Diseño + QR Móvil** (`/diseno` y barra superior) | Cambio Claro/Oscuro, paleta de 8 tonos y modal `QR Móvil` | *"La vista de Gobernanza asegura consistencia cromática en tema claro y oscuro, y con 'QR Móvil' cualquier persona en la sala puede abrir ahora mismo esta misma vista en su teléfono."* |

---

## 3. Preguntas difíciles (Q&A) y respuestas recomendadas

* **¿El simulador usa Machine Learning o proyecciones estadísticas complejas?**
  > *"No. Tal como indica explícitamente la interfaz ('Supuestos Explícitos'), es un simulador determinístico de capacidad operativa. Permite sensibilizar tres variables que sí controla la operación: número de cuadrillas, cierres promedio por cuadrilla/mes y porcentaje de dedicación a avisos vencidos, mostrando su efecto aritmético sobre el backlog actual."*

* **¿Por qué usan mediana (383 días) en lugar de solo promedio?**
  > *"Porque los tiempos de mantenimiento tienen colas largas asimétricas (avisos históricos o de servidumbre compleja que distorsionan la media). La mediana refleja con mayor fidelidad el tiempo típico de atención y se complementa con el percentil 75 (P75) y las distribuciones de violín."*

* **¿Qué pasa con categorías que tienen pocos datos en los diagramas de violín?**
  > *"Cuando un grupo tiene menos de 15 registros (`N < 15`), el gráfico desactiva el suavizado KDE y muestra los puntos individuales reales para no inducir interpretaciones artificiales."*

* **¿La tabla de Auditoría muestra los 3.118 avisos a la vez?**
  > *"La tabla informa el total exacto de avisos coincidentes con el filtro territorial activo y carga una muestra paginada de hasta 120 registros por consulta para mantener fluidez inmediata en el navegador. Cuando se filtra por departamento o municipio, se acota directamente al territorio de interés."*

---

## 4. Checklist breve antes de iniciar la entrega

- [ ] Confirmar que el tablero carga correctamente (en local con `npm run dev` o en producción `https://visualizacion-mu.vercel.app`).
- [ ] Si vas a proyectar el botón **QR Móvil**, verificar que la versión publicada en `https://visualizacion-mu.vercel.app` esté al día respecto a tu última compilación.
- [ ] Tener a la mano los filtros de ejemplo que mejor ilustran tu historia (por ejemplo, comparar `Centro` vs. `Suroccidente` o filtrar por `Cundinamarca` / `Valle Del Cauca`).
- [ ] Si presentas ante un comité o jurado con un *Documento Rector* o rúbrica formal, validar punto por punto si exigen algún entregable adicional fuera del tablero (como exportación CSV/PDF).

