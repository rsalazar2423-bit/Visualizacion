"""Tests unitarios para el servicio de auditoría tabular."""

import pytest
import pandas as pd
from src.data.data_loader import load_data
from src.services.audit_service import build_tickets_table


def test_build_tickets_table_structure_and_purity():
    _, _, df_merged = load_data()
    table = build_tickets_table(df_merged, limit=25)
    
    assert len(table) == 25
    for ticket in table:
        assert "numero_aviso" in ticket
        assert "fecha_aviso" in ticket
        assert "tipo_aviso" in ticket
        assert "prioridad" in ticket
        assert "cumplimiento" in ticket
        assert "dias_abierto" in ticket
        # Pureza numérica: dias_abierto debe ser un entero
        assert isinstance(ticket["dias_abierto"], (int, float))
        assert "equipo" in ticket
        assert "municipio" in ticket
        assert "departamento" in ticket


def test_build_tickets_table_empty():
    empty_df = pd.DataFrame()
    table = build_tickets_table(empty_df)
    assert table == []
