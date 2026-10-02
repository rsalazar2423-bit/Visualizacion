"""Tests unitarios para el servicio de filtrado dimensional."""

import pytest
import pandas as pd
from src.data.data_loader import load_data
from src.services.filter_service import filter_dataset, get_filter_options


@pytest.fixture(scope="module")
def sample_dataset():
    _, _, df_merged = load_data()
    return df_merged


def test_filter_dataset_all_returns_same_length(sample_dataset):
    filtered = filter_dataset(sample_dataset)
    assert len(filtered) == len(sample_dataset)


def test_filter_dataset_by_cte(sample_dataset):
    valid_cte = sample_dataset["CTE"].dropna().unique()[0]
    filtered = filter_dataset(sample_dataset, cte=valid_cte)
    assert len(filtered) > 0
    assert (filtered["CTE"] == valid_cte).all()


def test_filter_dataset_by_single_tipo(sample_dataset):
    valid_tipo = sample_dataset["Tipo de aviso"].dropna().unique()[0]
    filtered = filter_dataset(sample_dataset, tipo=valid_tipo)
    assert len(filtered) > 0
    assert (filtered["Tipo de aviso"] == valid_tipo).all()


def test_filter_dataset_by_multi_tipo_comma_string(sample_dataset):
    tipos = list(sample_dataset["Tipo de aviso"].dropna().unique()[:2])
    tipo_param = ",".join(tipos)
    filtered = filter_dataset(sample_dataset, tipo=tipo_param)
    assert len(filtered) > 0
    assert filtered["Tipo de aviso"].isin(tipos).all()


def test_filter_dataset_by_multi_tipo_list(sample_dataset):
    tipos = list(sample_dataset["Tipo de aviso"].dropna().unique()[:2])
    filtered = filter_dataset(sample_dataset, tipo=tipos)
    assert len(filtered) > 0
    assert filtered["Tipo de aviso"].isin(tipos).all()


def test_filter_dataset_by_depto_and_municipio(sample_dataset):
    valid_row = sample_dataset[
        (sample_dataset["Departamento"] != "No Identificado") & 
        (sample_dataset["Municipio"] != "No Identificado")
    ].iloc[0]
    
    depto = valid_row["Departamento"]
    mpio = valid_row["Municipio"]
    
    filtered = filter_dataset(sample_dataset, depto=depto, municipio=mpio)
    assert len(filtered) > 0
    assert (filtered["Departamento"] == depto).all()
    assert (filtered["Municipio"] == mpio).all()


def test_get_filter_options_structure():
    opts = get_filter_options()
    assert "ctes" in opts
    assert "departamentos" in opts
    assert "municipios" in opts
    assert "tipos" in opts
    assert "Todos" in opts["ctes"]
    assert "Todos" in opts["departamentos"]
    assert len(opts["municipios"]) > 0
    assert opts["municipios"][0]["value"] == "Todos"
