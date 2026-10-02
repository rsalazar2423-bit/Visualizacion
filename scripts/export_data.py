"""Script para exportar y sincronizar datos limpios desde los Excel a JSON estático para el Frontend.

Uso:
    python scripts/export_data.py
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

# Ajustar PYTHONPATH
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.src.data.data_loader import load_data


def export() -> None:
    print("⏳ Leyendo y limpiando datasets desde backend/src/data/...")
    df_equipos, df_avisos, df_merged = load_data(force_reload=True)

    out_dir = ROOT_DIR / "frontend" / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Equipos compactos para cálculo de cobertura
    eq_df = df_equipos[["Equipo", "CTE", "Departamento", "Municipio"]].copy()
    eq_df["Equipo"] = eq_df["Equipo"].fillna(0).astype(int)

    # 2. Avisos cruzados compactos
    cols = [
        "Aviso",
        "Equipo",
        "Tipo de aviso",
        "Fecha de aviso",
        "Prioridad",
        "Días abierto",
        "Cumple prioridad días",
        "Cumplimiento_Estado",
        "CTE",
        "Departamento",
        "Municipio",
    ]
    av_df = df_merged[cols].copy()
    av_df["Aviso"] = av_df["Aviso"].astype(str)
    av_df["Equipo"] = av_df["Equipo"].fillna(0).astype(int)
    av_df["Fecha de aviso"] = av_df["Fecha de aviso"].astype(str).str[:10]
    av_df["Días abierto"] = av_df["Días abierto"].fillna(0).round(1)
    av_df["Cumple prioridad días"] = av_df["Cumple prioridad días"].fillna(0).round(1)

    payload = {
        "equipos": eq_df.to_dict(orient="records"),
        "avisos": av_df.to_dict(orient="records"),
    }

    out_path = out_dir / "ecogrid_data.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    size_kb = round(out_path.stat().st_size / 1024, 1)
    print(f"✅ Exportación completada con éxito: {out_path} ({size_kb} KB)")


if __name__ == "__main__":
    export()
