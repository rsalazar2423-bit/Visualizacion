"""Tests unitarios para el servicio de gráficos (ECharts payloads)."""

import pytest
import pandas as pd
from src.data.data_loader import load_data
from src.services.chart_service import (
    build_donut_distribution,
    build_stacked_sla_matrix,
    build_sunburst_sla_tree,
    build_sunburst_plazos_tree,
    build_treemap_nodes,
)


@pytest.fixture(scope="module")
def sample_dataset():
    _, _, df_merged = load_data()
    return df_merged


def test_build_donut_distribution(sample_dataset):
    donut = build_donut_distribution(sample_dataset)
    assert len(donut) > 0
    total_val = sum(item["value"] for item in donut)
    assert total_val == len(sample_dataset)
    for item in donut:
        assert "name" in item
        assert "value" in item
        assert "pct" in item
        assert "color" in item
        assert item["color"].startswith("#")


def test_build_stacked_sla_matrix(sample_dataset):
    stacked = build_stacked_sla_matrix(sample_dataset, selected_prio="Año")
    assert len(stacked) > 0
    for bar in stacked:
        assert "prioridad" in bar
        assert "total" in bar
        assert "cumple_count" in bar
        assert "excede_count" in bar
        assert bar["total"] == bar["cumple_count"] + bar["excede_count"]
        assert round(bar["cumple_pct"] + bar["excede_pct"], 1) in (99.9, 100.0, 100.1)
        if bar["prioridad"] == "Año":
            assert bar["selected"] is True
        else:
            assert bar["selected"] is False


def test_build_sunburst_sla_tree(sample_dataset):
    tree = build_sunburst_sla_tree(sample_dataset)
    assert len(tree) > 0
    for node in tree:
        assert "name" in node
        assert "children" in node
        assert len(node["children"]) > 0


def test_build_treemap_nodes(sample_dataset):
    nodes = build_treemap_nodes(sample_dataset, group_col="Departamento")
    assert len(nodes) > 0
    for node in nodes:
        assert "name" in node
        assert "value" in node
        assert "pct" in node
        assert "itemStyle" in node
        assert "color" in node["itemStyle"]
