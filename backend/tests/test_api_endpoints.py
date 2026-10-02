"""Tests de integración para los endpoints REST de Flask."""

import pytest
from api import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["status"] == "ok"


def test_portada_kpis(client):
    res = client.get("/api/v1/portada/kpis")
    assert res.status_code == 200
    json_data = res.get_json()
    assert "total_equipos" in json_data
    assert "total_avisos" in json_data
    assert isinstance(json_data["total_equipos"], int)
    assert isinstance(json_data["pct_cumplimiento"], (int, float))


def test_filtros_opciones(client):
    res = client.get("/api/v1/filtros/opciones")
    assert res.status_code == 200
    json_data = res.get_json()
    assert "ctes" in json_data
    assert "departamentos" in json_data
    assert "municipios" in json_data
    assert "tipos" in json_data


def test_operaciones_data_general(client):
    res = client.get("/api/v1/operaciones/data")
    assert res.status_code == 200
    json_data = res.get_json()
    assert "kpis" in json_data
    assert "donut" in json_data
    assert "stacked_bar" in json_data
    assert isinstance(json_data["kpis"]["total"], int)
    assert isinstance(json_data["kpis"]["cumple_pct"], (int, float))


def test_operaciones_data_multi_tipo(client):
    res = client.get("/api/v1/operaciones/data?tipo=Vegetación,Construcciones")
    assert res.status_code == 200
    json_data = res.get_json()
    assert "kpis" in json_data


def test_territorio_data_general(client):
    res = client.get("/api/v1/territorio/data")
    assert res.status_code == 200
    json_data = res.get_json()
    assert "kpis" in json_data
    assert "treemap" in json_data
    assert "sunburst" in json_data
    assert "tickets" in json_data
    assert isinstance(json_data["total_tickets_matching"], int)
