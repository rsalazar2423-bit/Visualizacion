"""Servicio de auditoría tabular de tickets para EcoGrid Colombia.

Responsabilidad Única (SRP):
- Proyección y selección de registros vectorizados para la tabla de auditoría.
- Retorna valores numéricos puros (dias_abierto como int, diferencia_sla como int/float).
- El formateo de cadenas ("X d") corresponde exclusivamente al frontend.
"""

from __future__ import annotations

from typing import Any, Dict, List
import pandas as pd


def build_tickets_table(df: pd.DataFrame, limit: int = 100) -> List[Dict[str, Any]]:
    """Genera la tabla de auditoría vectorizada usando to_dict directo con tipos nativos."""
    sample = df.head(limit)
    if len(sample) == 0:
        return []

    dias = sample["Días abierto"].fillna(0).round(0).astype(int)

    if "Cumple prioridad días" in sample:
        diff = sample["Cumple prioridad días"].fillna(0).round(0).astype(int)
    else:
        diff = pd.Series(0, index=sample.index)

    num_col = (
        sample["Aviso"]
        if "Aviso" in sample
        else (sample["Número de aviso"] if "Número de aviso" in sample else pd.Series("N/D", index=sample.index))
    )
    fecha_col = (
        sample["Fecha de aviso"]
        if "Fecha de aviso" in sample
        else (sample["Fecha del aviso"] if "Fecha del aviso" in sample else pd.Series("N/D", index=sample.index))
    )

    table_df = pd.DataFrame({
        "numero_aviso": num_col.fillna("N/D").astype(str),
        "fecha_aviso": fecha_col.fillna("N/D").astype(str),
        "tipo_aviso": sample["Tipo de aviso"].fillna("Otros").astype(str),
        "prioridad": sample["Prioridad"].fillna("Media").astype(str),
        "cumplimiento": sample["Cumplimiento_Estado"].fillna("Excede Plazo").astype(str),
        "dias_abierto": dias,
        "diferencia_sla": diff,
        "equipo": sample["Equipo"].fillna("N/D").astype(str),
        "municipio": sample["Municipio"].fillna("No Identificado").astype(str),
        "departamento": sample["Departamento"].fillna("No Identificado").astype(str),
    })
    return table_df.to_dict(orient="records")
