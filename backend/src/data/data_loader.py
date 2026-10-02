"""Capa de Acceso y Gestión de Datos con Caché Automática.

Responsabilidad Única:
- Leer y cachear los archivos Excel de equipos y avisos con base en mtime.
- Normalizar identificadores, categorizar cumplimiento de SLA y consolidar el dataset relacional.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Tuple
import pandas as pd

DATA_DIR = Path(__file__).resolve().parent

EQUIPOS_PATH = DATA_DIR / "equipos_proc.xlsx"
AVISOS_PATH = DATA_DIR / "histórico_filtrado_proc.xlsx"

# Caché en memoria para evitar relecturas innecesarias
_CACHE: Dict[str, Any] = {
    "equipos_mtime": None,
    "avisos_mtime": None,
    "df_equipos": None,
    "df_avisos": None,
    "df_merged": None,
}


def _needs_reload() -> bool:
    """Verifica si alguno de los archivos Excel ha sido modificado en disco."""
    try:
        equipos_mtime = os.path.getmtime(EQUIPOS_PATH)
        avisos_mtime = os.path.getmtime(AVISOS_PATH)
    except OSError:
        return True

    return (
        _CACHE["df_merged"] is None
        or _CACHE["equipos_mtime"] != equipos_mtime
        or _CACHE["avisos_mtime"] != avisos_mtime
    )


def clean_and_prepare_datasets(
    raw_equipos: pd.DataFrame,
    raw_avisos: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Normaliza, imputa nulos, calcula SLA y consolida el cruce relacional."""
    df_equipos = raw_equipos.copy()
    df_avisos = raw_avisos.copy()

    # 1. Homogeneizar identificador de equipo
    df_equipos["Equipo"] = pd.to_numeric(df_equipos["Equipo"], errors="coerce")
    df_avisos["Equipo"] = pd.to_numeric(df_avisos["Equipo"], errors="coerce")

    # 2. Rellenar nulos y normalizar espacios en equipos
    df_equipos["CTE"] = df_equipos["CTE"].fillna("Sin Asignar").astype(str).str.strip()
    df_equipos["Departamento"] = df_equipos["Departamento"].fillna("No Identificado").astype(str).str.strip()
    df_equipos["Municipio"] = df_equipos["Municipio"].fillna("No Identificado").astype(str).str.strip()

    # 3. Rellenar nulos y normalizar espacios en avisos
    df_avisos["Tipo de aviso"] = df_avisos["Tipo de aviso"].fillna("Otros").astype(str).str.strip()
    df_avisos["Prioridad"] = df_avisos["Prioridad"].fillna("Media").astype(str).str.strip()

    # 4. Categorización analítica de cumplimiento de plazo (SLA)
    if "Cumple prioridad días" in df_avisos.columns:
        df_avisos["Cumplimiento_Estado"] = df_avisos["Cumple prioridad días"].apply(
            lambda x: "Cumple Plazo" if pd.notna(x) and x >= 0 else "Excede Plazo"
        )
    else:
        df_avisos["Cumplimiento_Estado"] = "Excede Plazo"

    # 5. Unión izquierda de avisos con atributos de torre/equipo
    df_merged = df_avisos.merge(df_equipos, on="Equipo", how="left")
    df_merged["CTE"] = df_merged["CTE"].fillna("Sin Asignar")
    df_merged["Departamento"] = df_merged["Departamento"].fillna("No Identificado")
    df_merged["Municipio"] = df_merged["Municipio"].fillna("No Identificado")

    return df_equipos, df_avisos, df_merged


def load_data(force_reload: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Carga los DataFrames con verificación de cambios y caché en memoria."""
    if force_reload or _needs_reload():
        raw_equipos = pd.read_excel(EQUIPOS_PATH)
        raw_avisos = pd.read_excel(AVISOS_PATH)

        df_equipos, df_avisos, df_merged = clean_and_prepare_datasets(raw_equipos, raw_avisos)

        _CACHE["equipos_mtime"] = os.path.getmtime(EQUIPOS_PATH)
        _CACHE["avisos_mtime"] = os.path.getmtime(AVISOS_PATH)
        _CACHE["df_equipos"] = df_equipos
        _CACHE["df_avisos"] = df_avisos
        _CACHE["df_merged"] = df_merged

    return _CACHE["df_equipos"], _CACHE["df_avisos"], _CACHE["df_merged"]
