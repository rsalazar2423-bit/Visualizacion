"""Servicio de transformación de datos para contratos de gráficos (ECharts) de EcoGrid Colombia.

Responsabilidad Única (SRP):
- Transformar DataFrames filtrados en estructuras JSON optimizadas para cada tipo de gráfico:
  * Donut (distribución por tipología).
  * Stacked Bar (matriz de cumplimiento SLA por prioridad).
  * Treemap (desglose jerárquico territorial).
  * Sunburst (árboles concéntricos: SLA y Plazos).
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
import pandas as pd

from src.constants import PALETTE_DEPTOS, PRIO_COLORS, PRIO_ORDER, TIPO_COLORS

# Etiquetas ejecutivas para plazos temporales
PRIO_CLARIFIED_LABELS: Dict[str, str] = {
    "Año": "Plazo 1 Año",
    "Dos años": "Plazo 2 Años",
    "Tres años": "Plazo 3 Años",
    "Seis años": "Plazo 6 Años",
    "Semestre": "Plazo Semestre",
    "Trimestre": "Plazo Trimestre",
    "Mes": "Plazo Mes",
    "Semana": "Plazo Semana",
    "No asignada": "Sin Plazo",
}


def build_donut_distribution(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Distribución Donut vectorizada por tipo de aviso."""
    counts = df["Tipo de aviso"].value_counts()
    total = len(df)
    return [
        {
            "name": str(name),
            "value": int(cnt),
            "pct": round(cnt / total * 100, 1) if total > 0 else 0,
            "color": TIPO_COLORS.get(str(name), "#64748B"),
        }
        for name, cnt in counts.items()
    ]


def build_stacked_sla_matrix(df: pd.DataFrame, selected_prio: Optional[str]) -> List[Dict[str, Any]]:
    """Genera desglose de barras apiladas 100% usando unstack vectorizado."""
    if len(df) == 0:
        return []

    counts = df.groupby(["Prioridad", "Cumplimiento_Estado"]).size().unstack(fill_value=0)
    result = []
    for prio in PRIO_ORDER:
        if prio not in counts.index:
            continue
        cumple = int(counts.loc[prio].get("Cumple Plazo", 0))
        excede = int(counts.loc[prio].get("Excede Plazo", 0))
        total = cumple + excede
        if total == 0:
            continue
        c_pct = round(cumple / total * 100, 1)
        result.append({
            "prioridad": prio,
            "total": total,
            "cumple_count": cumple,
            "cumple_pct": c_pct,
            "excede_count": excede,
            "excede_pct": round(100.0 - c_pct, 1),
            "selected": (prio == selected_prio),
        })
    return result


def build_sunburst_sla_tree(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Árbol Sunburst: Tipo de Aviso ➔ Cumplimiento SLA (Cumple vs Excede)."""
    if len(df) == 0:
        return []

    matrix = df.groupby(["Tipo de aviso", "Cumplimiento_Estado"]).size().unstack(fill_value=0)
    matrix_dict = matrix.to_dict(orient="index")
    tree = []
    for tipo_name, counts in matrix_dict.items():
        tipo_str = str(tipo_name)
        base_color = TIPO_COLORS.get(tipo_str, "#64748B")
        cumple = int(counts.get("Cumple Plazo", 0))
        excede = int(counts.get("Excede Plazo", 0))
        total_tipo = cumple + excede
        if total_tipo == 0:
            continue

        c_pct = round(cumple / total_tipo * 100, 1)
        e_pct = round(excede / total_tipo * 100, 1)

        children = []
        if cumple > 0:
            children.append({
                "name": f"Cumple ({c_pct}%)",
                "value": cumple,
                "itemStyle": {"color": "#10B981"},
            })
        if excede > 0:
            children.append({
                "name": f"Excede ({e_pct}%)",
                "value": excede,
                "itemStyle": {"color": "#F43F5E"},
            })

        tree.append({
            "name": tipo_str,
            "itemStyle": {"color": base_color},
            "children": children,
        })

    tree.sort(key=lambda x: sum(c["value"] for c in x["children"]), reverse=True)
    return tree


def build_sunburst_plazos_tree(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """Árbol Sunburst: Tipo de Aviso ➔ Plazo de Ejecución (clarificado)."""
    if len(df) == 0:
        return []

    matrix = df.groupby(["Tipo de aviso", "Prioridad"]).size().unstack(fill_value=0)
    matrix_dict = matrix.to_dict(orient="index")
    tree = []
    for tipo_name, prio_counts in matrix_dict.items():
        tipo_str = str(tipo_name)
        base_color = TIPO_COLORS.get(tipo_str, "#64748B")
        children = []
        for prio_name, count in prio_counts.items():
            cnt = int(count)
            if cnt > 0:
                prio_str = str(prio_name)
                clarified_name = PRIO_CLARIFIED_LABELS.get(prio_str, prio_str)
                prio_color = PRIO_COLORS.get(prio_str, "#94A3B8")
                children.append({
                    "name": clarified_name,
                    "value": cnt,
                    "itemStyle": {"color": prio_color},
                })
        if children:
            children.sort(key=lambda c: c["value"], reverse=True)
            tree.append({"name": tipo_str, "itemStyle": {"color": base_color}, "children": children})

    tree.sort(key=lambda x: sum(c["value"] for c in x["children"]), reverse=True)
    return tree


def build_treemap_nodes(df: pd.DataFrame, group_col: str, color_palette: Optional[List[str]] = None) -> List[Dict[str, Any]]:
    """Generador plano y reutilizable de nodos de Treemap."""
    palette = color_palette or PALETTE_DEPTOS
    counts = df.groupby(group_col).size().sort_values(ascending=False)
    total = counts.sum()
    nodes = []
    for i, (name, cnt) in enumerate(counts.items()):
        nodes.append({
            "name": str(name),
            "value": int(cnt),
            "pct": round(cnt / total * 100, 1) if total > 0 else 0,
            "itemStyle": {"color": palette[i % len(palette)]},
        })
    return nodes
