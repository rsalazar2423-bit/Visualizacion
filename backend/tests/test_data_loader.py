"""Tests unitarios para la capa de acceso y carga de datos."""

import pytest
import pandas as pd
from src.data.data_loader import load_data, _needs_reload, _CACHE


def test_load_data_returns_three_dataframes():
    df_equipos, df_avisos, df_merged = load_data()
    assert isinstance(df_equipos, pd.DataFrame)
    assert isinstance(df_avisos, pd.DataFrame)
    assert isinstance(df_merged, pd.DataFrame)
    assert len(df_equipos) > 0
    assert len(df_avisos) > 0
    assert len(df_merged) > 0


def test_load_data_required_columns_exist():
    df_equipos, df_avisos, df_merged = load_data()
    
    # Columnas esperadas en df_equipos
    for col in ["Equipo", "CTE", "Departamento", "Municipio"]:
        assert col in df_equipos.columns, f"Falta {col} en df_equipos"

    # Columnas esperadas en df_avisos
    for col in ["Equipo", "Tipo de aviso", "Prioridad", "Cumplimiento_Estado"]:
        assert col in df_avisos.columns, f"Falta {col} en df_avisos"

    # Columnas esperadas en df_merged
    for col in ["Equipo", "CTE", "Departamento", "Municipio", "Tipo de aviso", "Prioridad", "Cumplimiento_Estado"]:
        assert col in df_merged.columns, f"Falta {col} en df_merged"


def test_load_data_cache_reuses_memory():
    df_equipos1, _, _ = load_data()
    df_equipos2, _, _ = load_data()
    assert df_equipos1 is df_equipos2, "El caché en memoria debe retornar la misma instancia"
    assert not _needs_reload()


def test_clean_and_prepare_datasets_logic():
    from src.data.data_loader import clean_and_prepare_datasets

    raw_equipos = pd.DataFrame({
        "Equipo": ["101", "102", "invalido"],
        "CTE": [" CTE 1 ", None, "CTE 2"],
        "Departamento": [" Antioquia ", None, "Caldas"],
        "Municipio": [" Medellín ", None, "Manizales"],
    })

    raw_avisos = pd.DataFrame({
        "Equipo": [101, 102, 999],
        "Tipo de aviso": [" Vegetación ", None, "Obras"],
        "Prioridad": [" Alta ", None, "Baja"],
        "Cumple prioridad días": [5, -2, None],
    })

    df_equipos, df_avisos, df_merged = clean_and_prepare_datasets(raw_equipos, raw_avisos)

    assert pd.isna(df_equipos["Equipo"].iloc[2])
    assert df_equipos["CTE"].iloc[0] == "CTE 1"
    assert df_equipos["CTE"].iloc[1] == "Sin Asignar"
    assert df_avisos["Cumplimiento_Estado"].iloc[0] == "Cumple Plazo"
    assert df_avisos["Cumplimiento_Estado"].iloc[1] == "Excede Plazo"
    assert len(df_merged) == len(raw_avisos)

