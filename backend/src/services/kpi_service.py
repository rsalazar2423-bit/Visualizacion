"""Servicio de cálculo de indicadores de negocio (KPIs) para EcoGrid Colombia.

Responsabilidad Única (SRP):
- Cálculo de métricas agregadas operativas, territoriales y de portada.
- Retorna SOLO valores numéricos puros.  El formateo de presentación es
  responsabilidad exclusiva del frontend.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Union
import pandas as pd

# Type alias for numeric-only KPI dict
KpiDict = Dict[str, Union[int, float, None]]


def calc_operational_kpis(df: pd.DataFrame) -> KpiDict:
    """Cálculo vectorizado de KPIs de cumplimiento operativo.

    Retorna valores numéricos puros:
    - total (int): cantidad total de avisos
    - cumple_pct (float): porcentaje de cumplimiento [0-100]
    - excede (int): cantidad que excede plazo
    - dias_prom (float | None): promedio de días abierto
    """
    total = len(df)
    if total == 0:
        return {"total": 0, "cumple_pct": 0.0, "excede": 0, "dias_prom": None}

    cumple_count = int((df["Cumplimiento_Estado"] == "Cumple Plazo").sum())
    dias_prom_raw = df["Días abierto"].dropna().mean()
    dias_prom = round(float(dias_prom_raw), 1) if pd.notna(dias_prom_raw) else None

    return {
        "total": total,
        "cumple_pct": round(cumple_count / total * 100, 1),
        "excede": total - cumple_count,
        "dias_prom": dias_prom,
    }


def calc_portada_kpis(df_equipos: pd.DataFrame, df_avisos: pd.DataFrame) -> KpiDict:
    """Cálculo de métricas ejecutivas globales para la portada."""
    return {
        "total_equipos": len(df_equipos),
        "total_avisos": len(df_avisos),
        "pct_cumplimiento": round(
            float((df_avisos["Cumplimiento_Estado"] == "Cumple Plazo").mean() * 100), 1
        ),
        "pct_vegetacion": round(
            float((df_avisos["Tipo de aviso"].astype(str).str.lower() == "vegetación").mean() * 100), 1
        ),
        "total_deptos": int(df_equipos["Departamento"].nunique()),
        "total_municipios": int(df_equipos["Municipio"].nunique()),
    }


def calc_territorial_kpis(
    df_equipos: pd.DataFrame,
    df_avisos: pd.DataFrame,
    municipio: Optional[str] = None,
) -> KpiDict:
    """Cálculo de métricas de cobertura territorial y concentración.

    Retorna valores numéricos puros.  Las etiquetas de presentación
    ("CTEs", "Deptos", etc.) son responsabilidad del frontend.
    """
    if municipio and municipio != "Todos":
        cte_val = str(df_avisos["CTE"].iloc[0]) if len(df_avisos) > 0 else None
        depto_val = str(df_avisos["Departamento"].iloc[0]) if len(df_avisos) > 0 else None
        return {
            "ctes": cte_val,
            "deptos": depto_val,
            "mpios": len(df_avisos),
            "equipos": len(df_equipos),
        }

    return {
        "ctes": int(df_equipos["CTE"].nunique()),
        "deptos": int(df_equipos["Departamento"].nunique()),
        "mpios": int(df_equipos["Municipio"].nunique()),
        "equipos": len(df_equipos),
    }
