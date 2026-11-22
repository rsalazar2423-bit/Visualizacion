"""build_nlp_graph.py — Extracción semántica y construcción de grafo NLP por capas.

Procesa las descripciones textuales de avisos (histórico 2008–2023) y genera
la estructura de nodos y enlaces para ECharts Force Graph (Abiertos vs. Cerrados).
"""

from __future__ import annotations

import json
from pathlib import Path
import re
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
EXCEL_PATH = ROOT_DIR / "backend" / "src" / "data" / "histórico_filtrado_proc.xlsx"
OUTPUT_PATH = ROOT_DIR / "frontend" / "public" / "data" / "nlp_graph_data.json"

CLUSTERS = [
    {
        "id": "c_invasion",
        "name": "Invasión & Servidumbre",
        "color": "#BE123C",
        "terms": ["vivienda", "retirar", "establo", "gallinero", "construcción", "bodega", "invasión", "letrina", "casa"],
        "desc": "Construcciones ilegales y ocupaciones físicas bajo la franja de servidumbre de alta tensión.",
    },
    {
        "id": "c_ambiental",
        "name": "Restricción Ambiental & CAR",
        "color": "#D97706",
        "terms": ["crpochivor", "car", "corporación", "tramite", "trámite", "salvoconducto", "ambiental", "licencia"],
        "desc": "Trámites, salvoconductos y permisos demorados ante Corporaciones Autónomas Regionales.",
    },
    {
        "id": "c_predial",
        "name": "Acceso Predial & Permisos",
        "color": "#0284C7",
        "terms": ["ingreso", "geam", "permiso", "propietario", "acceso", "mspat", "negociar"],
        "desc": "Negativas de paso de propietarios prediales para ingresar a realizar mantenimiento a torres.",
    },
    {
        "id": "c_forestal",
        "name": "Intervención Forestal",
        "color": "#0F766E",
        "terms": ["tala", "talar", "árboles", "arboles", "pino", "eucalipto", "platano", "plátano", "vegetación", "poda"],
        "desc": "Riesgo de rozamiento con cables; podas mecánicas y talas forestales en faja de seguridad.",
    },
]


def _build_mode_data(df: pd.DataFrame, mode: str) -> dict:
    sub = df[df["Estado aviso"] == mode].copy()
    total_avisos = len(sub)
    categories = [{"name": c["name"]} for c in CLUSTERS]

    nodes = []
    links = []
    clusters_summary = []

    # 1. Crear nodos centrales de clúster (Hubs)
    for idx, c in enumerate(CLUSTERS):
        pat = "|".join(c["terms"])
        matched = sub[sub["Descripción"].str.lower().str.contains(pat, na=False)]
        count = len(matched)
        dias_med = round(float(matched["Días abierto"].median()), 1) if count > 0 else 0

        # Citas textuales reales anonimizadas
        quotes = []
        if count > 0:
            sample_series = matched["Descripción"].dropna().drop_duplicates()
            quotes = [q.strip() for q in sample_series.head(3).tolist()]

        # Top departamentos impactados
        deptos_list = []
        if "Departamento" in matched.columns and count > 0:
            top_d = matched["Departamento"].value_counts().head(3)
            deptos_list = [{"depto": d, "count": int(v)} for d, v in top_d.items()]

        clusters_summary.append({
            "id": c["id"],
            "name": c["name"],
            "color": c["color"],
            "count": count,
            "pct": round((count / total_avisos) * 100, 1) if total_avisos > 0 else 0,
            "mediana_dias": dias_med,
            "desc": c["desc"],
            "quotes": quotes,
            "deptos": deptos_list,
        })

        # Nodo central Hub
        node_size = max(38, min(65, int(25 + (count / total_avisos) * 60))) if total_avisos > 0 else 35
        nodes.append({
            "id": c["id"],
            "name": c["name"],
            "symbolSize": node_size,
            "category": idx,
            "value": count,
            "mediana_dias": dias_med,
            "is_hub": True,
            "itemStyle": {"color": c["color"]},
            "label": {"show": True, "fontWeight": 700, "fontSize": 11.5},
        })

        # 2. Satélites semánticos más frecuentes para este clúster
        term_counts = {}
        for term in c["terms"]:
            c_term = sub["Descripción"].str.lower().str.count(rf"\b{term}\b").sum()
            if c_term > 0:
                term_counts[term] = int(c_term)

        top_terms = sorted(term_counts.items(), key=lambda x: x[1], reverse=True)[:4]
        for term, t_count in top_terms:
            satellite_id = f"{c['id']}_{term}"
            sat_size = max(16, min(28, int(14 + (t_count / (count or 1)) * 16)))
            nodes.append({
                "id": satellite_id,
                "name": term.capitalize(),
                "symbolSize": sat_size,
                "category": idx,
                "value": t_count,
                "cluster_name": c["name"],
                "is_hub": False,
                "itemStyle": {"color": c["color"], "opacity": 0.85},
                "label": {"show": True, "fontSize": 10},
            })
            links.append({
                "source": c["id"],
                "target": satellite_id,
                "value": t_count,
                "lineStyle": {"width": max(1.2, min(4.5, t_count / 35)), "opacity": 0.6},
            })

    # Interconexión sutil entre clústeres si hay avisos que comparten problemas
    for i in range(len(CLUSTERS)):
        for j in range(i + 1, len(CLUSTERS)):
            pat_i = "|".join(CLUSTERS[i]["terms"])
            pat_j = "|".join(CLUSTERS[j]["terms"])
            overlap = len(sub[
                sub["Descripción"].str.lower().str.contains(pat_i, na=False) &
                sub["Descripción"].str.lower().str.contains(pat_j, na=False)
            ])
            if overlap >= 5:
                links.append({
                    "source": CLUSTERS[i]["id"],
                    "target": CLUSTERS[j]["id"],
                    "value": overlap,
                    "lineStyle": {"width": max(1, min(3.5, overlap / 20)), "type": "dashed", "opacity": 0.35},
                })

    return {
        "total_avisos": total_avisos,
        "clusters": clusters_summary,
        "nodes": nodes,
        "links": links,
        "categories": categories,
    }


def main() -> None:
    print(f"⏳ Leyendo datos de {EXCEL_PATH}...")
    df = pd.read_excel(EXCEL_PATH)
    out_data = {
        "metadata": {
            "title": "Red Semántica de Causas Operativas (NLP)",
            "fuente": "Descripciones de campo 2008–2023",
            "total_registros": len(df),
        },
        "abiertos": _build_mode_data(df, "Abierto"),
        "cerrados": _build_mode_data(df, "Cerrado"),
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Archivo generado exitosamente en {OUTPUT_PATH} ({len(out_data['abiertos']['nodes'])} nodos en abiertos)")


if __name__ == "__main__":
    main()
