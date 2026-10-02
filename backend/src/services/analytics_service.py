"""Orquestador de payloads analíticos para EcoGrid Colombia.

Responsabilidad Única (SRP + Facade):
- Coordinar los servicios especializados (filter, kpi, chart, audit) para ensamblar
  las respuestas de los endpoints HTTP sin contener lógica procedural anidada.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union

from src.constants import PALETTE_DEPTOS
from src.data.data_loader import load_data
from src.services.audit_service import build_tickets_table
from src.services.chart_service import (
    build_donut_distribution,
    build_stacked_sla_matrix,
    build_sunburst_plazos_tree,
    build_sunburst_sla_tree,
    build_treemap_nodes,
)
from src.services.filter_service import filter_dataset, get_filter_options
from src.services.kpi_service import (
    calc_operational_kpis,
    calc_portada_kpis,
    calc_territorial_kpis,
)


def get_portada_kpis() -> Dict[str, Any]:
    """Métricas ejecutivas de la portada institucional."""
    df_equipos, df_avisos, _ = load_data()
    return calc_portada_kpis(df_equipos, df_avisos)


def get_operations_payload(
    cte: Optional[str] = None,
    tipo: Optional[Union[str, List[str]]] = None,
    depto: Optional[str] = None,
    municipio: Optional[str] = None,
    prioridad: Optional[str] = None,
) -> Dict[str, Any]:
    """Tablero 1: Operaciones y SLA (Orquestación desacoplada)."""
    _, _, df_merged = load_data()

    # 1. Base regional antes de filtro de tipología (para mantener el catálogo completo disponible)
    regional_base = filter_dataset(df_merged, cte=cte, depto=depto, municipio=municipio)
    tipos_catalogo = build_donut_distribution(regional_base)

    # 2. Filtrado con tipología y prioridad
    filtered_base = filter_dataset(regional_base, tipo=tipo)
    donut_df = (
        filtered_base[filtered_base["Prioridad"] == prioridad]
        if prioridad and prioridad != "Todos"
        else filtered_base
    )

    return {
        "kpis": calc_operational_kpis(donut_df),
        "donut": build_donut_distribution(donut_df),
        "tipos_catalogo": tipos_catalogo,
        "stacked_bar": build_stacked_sla_matrix(filtered_base, prioridad),
    }


def get_territory_payload(
    cte: Optional[str] = None,
    depto: Optional[str] = None,
    municipio: Optional[str] = None,
) -> Dict[str, Any]:
    """Tablero 2: Cobertura y Jerarquía (Orquestación desacoplada)."""
    df_equipos, _, df_merged = load_data()
    f_avisos = filter_dataset(df_merged, cte=cte, depto=depto, municipio=municipio)
    f_equipos = filter_dataset(df_equipos, cte=cte, depto=depto, municipio=municipio)

    # 1. Determinación de nivel de Treemap
    if municipio and municipio != "Todos":
        treemap_nodes = [{
            "name": municipio,
            "value": len(f_avisos),
            "pct": 100.0,
            "itemStyle": {"color": PALETTE_DEPTOS[0]},
        }]
        root_title = municipio
    elif depto and depto != "Todos":
        treemap_nodes = build_treemap_nodes(f_avisos, group_col="Municipio", color_palette=PALETTE_DEPTOS)
        root_title = depto
    else:
        treemap_nodes = build_treemap_nodes(f_avisos, group_col="Departamento", color_palette=PALETTE_DEPTOS)
        root_title = f"CTE {cte}" if (cte and cte != "Todos") else "Toda Colombia"

    return {
        "kpis": calc_territorial_kpis(df_equipos, f_avisos, municipio),
        "treemap": {
            "name": root_title,
            "value": len(f_avisos),
            "children": treemap_nodes,
        },
        "sunburst": build_sunburst_sla_tree(f_avisos),
        "sunburst_sla": build_sunburst_sla_tree(f_avisos),
        "sunburst_plazos": build_sunburst_plazos_tree(f_avisos),
        "tickets": build_tickets_table(f_avisos),
        "total_tickets_matching": len(f_avisos),
    }
