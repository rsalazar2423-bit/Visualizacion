"""Servicio de filtrado dimensional para EcoGrid Colombia.

Responsabilidad Única (SRP):
- Filtrado vectorizado dimensional de DataFrames (CTE, Departamento, Municipio, Tipo, Prioridad).
- Generación de opciones dinámicas y cascadas para selectores.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Union
import pandas as pd

from src.data.data_loader import load_data


def filter_dataset(
    df: pd.DataFrame,
    cte: Optional[str] = None,
    tipo: Optional[Union[str, List[str]]] = None,
    depto: Optional[str] = None,
    municipio: Optional[str] = None,
    prioridad: Optional[str] = None,
) -> pd.DataFrame:
    """Aplica filtros dimensionales vectorizados con máscaras booleanas."""
    mask = pd.Series(True, index=df.index)

    if cte and cte != "Todos":
        mask &= (df["CTE"] == cte)

    if tipo and tipo != "Todos":
        if isinstance(tipo, str):
            tipos = [t.strip() for t in tipo.split(",") if t.strip() and t.strip() != "Todos"]
        else:
            tipos = [t.strip() for t in tipo if t and t != "Todos"]
        if tipos:
            mask &= df["Tipo de aviso"].isin(tipos)

    if depto and depto != "Todos":
        mask &= (df["Departamento"] == depto)

    if municipio and municipio != "Todos":
        mask &= (df["Municipio"] == municipio)

    if prioridad and prioridad != "Todos":
        mask &= (df["Prioridad"] == prioridad)

    return df[mask]


def get_filter_options(cte: Optional[str] = None, depto: Optional[str] = None) -> Dict[str, Any]:
    """Genera opciones para dropdowns en cascada de forma plana y directa."""
    _, _, df = load_data()

    # Opciones de CTE
    ctes = ["Todos"] + sorted(df["CTE"].dropna().replace("Sin Asignar", pd.NA).dropna().unique().tolist())

    # Opciones de Departamento
    df_deptos = df[df["CTE"] == cte] if cte and cte != "Todos" else df
    deptos = ["Todos"] + sorted(df_deptos["Departamento"].dropna().replace("No Identificado", pd.NA).dropna().unique().tolist())

    # Opciones de Municipio
    df_mpios = df_deptos[df_deptos["Departamento"] == depto] if depto and depto != "Todos" else df_deptos
    valid_mpios = df_mpios[df_mpios["Municipio"] != "No Identificado"]
    mpio_counts = valid_mpios["Municipio"].value_counts()

    municipios = [{"label": f"Todas las Ciudades / Municipios ({len(valid_mpios):,} avisos)", "value": "Todos"}] + [
        {"label": f"{name} ({count:,} avisos)", "value": str(name)}
        for name, count in mpio_counts.items()
    ]

    tipos = ["Todos"] + sorted(df["Tipo de aviso"].dropna().unique().tolist())

    return {
        "ctes": ctes,
        "departamentos": deptos,
        "municipios": municipios,
        "tipos": tipos,
    }
