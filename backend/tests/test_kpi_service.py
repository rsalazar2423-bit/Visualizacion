"""Tests unitarios para el servicio de KPIs (Pureza Numérica y SRP)."""

import pytest
import pandas as pd
from src.data.data_loader import load_data
from src.services.kpi_service import (
    calc_operational_kpis,
    calc_portada_kpis,
    calc_territorial_kpis,
)


def test_calc_operational_kpis_numeric_purity():
    _, _, df_merged = load_data()
    kpis = calc_operational_kpis(df_merged)

    # Validar que los tipos retornados son numéricos puros (no strings formateados)
    assert isinstance(kpis["total"], int)
    assert isinstance(kpis["cumple_pct"], float)
    assert isinstance(kpis["excede"], int)
    assert isinstance(kpis["dias_prom"], (float, int))
    
    # Validar coherencia matemática
    assert kpis["total"] > 0
    assert 0.0 <= kpis["cumple_pct"] <= 100.0
    assert kpis["excede"] <= kpis["total"]
    assert kpis["dias_prom"] >= 0.0


def test_calc_operational_kpis_empty_dataframe():
    empty_df = pd.DataFrame(columns=["Cumplimiento_Estado", "Días abierto"])
    kpis = calc_operational_kpis(empty_df)

    assert kpis["total"] == 0
    assert kpis["cumple_pct"] == 0.0
    assert kpis["excede"] == 0
    assert kpis["dias_prom"] is None


def test_calc_portada_kpis_numeric():
    df_equipos, df_avisos, _ = load_data()
    portada = calc_portada_kpis(df_equipos, df_avisos)

    assert isinstance(portada["total_equipos"], int)
    assert isinstance(portada["total_avisos"], int)
    assert isinstance(portada["pct_cumplimiento"], float)
    assert isinstance(portada["pct_vegetacion"], float)
    assert isinstance(portada["total_deptos"], int)
    assert isinstance(portada["total_municipios"], int)
    assert 0.0 <= portada["pct_cumplimiento"] <= 100.0
    assert 0.0 <= portada["pct_vegetacion"] <= 100.0


def test_calc_territorial_kpis_macro():
    df_equipos, df_avisos, _ = load_data()
    terr = calc_territorial_kpis(df_equipos, df_avisos)

    assert isinstance(terr["ctes"], int)
    assert isinstance(terr["deptos"], int)
    assert isinstance(terr["mpios"], int)
    assert isinstance(terr["equipos"], int)
    assert terr["ctes"] > 0
    assert terr["deptos"] > 0
    assert terr["mpios"] > 0
    assert terr["equipos"] > 0
