"""build_nlp_graph.py — Extracción semántica y datos para Treemaps comparativos VS.

Genera un JSON con estructura de árbol jerárquica (Clúster → Departamento)
para renderizar Treemaps duales (Abiertos VS Cerrados) con métricas de mora.
"""

from __future__ import annotations

import json
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT_DIR / "frontend" / "public" / "data" / "nlp_graph_data.json"

import sys
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
VENV_SITE = ROOT_DIR / ".venv" / "lib" / "python3.14" / "site-packages"
if VENV_SITE.exists() and str(VENV_SITE) not in sys.path:
    sys.path.append(str(VENV_SITE))

CLUSTERS = [
    {
        "id": "c_invasion",
        "name": "Invasión & Servidumbre",
        "color": "#BE123C",
        "terms": ["vivienda", "retirar", "establo", "gallinero", "construcción",
                  "bodega", "invasión", "letrina", "casa"],
        "desc": "Construcciones ilegales y ocupaciones bajo la franja de servidumbre.",
    },
    {
        "id": "c_ambiental",
        "name": "Restricción Ambiental & CAR",
        "color": "#D97706",
        "terms": ["crpochivor", "car", "corporación", "tramite", "trámite",
                  "salvoconducto", "ambiental", "licencia"],
        "desc": "Trámites y permisos demorados ante Corporaciones Autónomas Regionales.",
    },
    {
        "id": "c_predial",
        "name": "Acceso Predial & Permisos",
        "color": "#0284C7",
        "terms": ["ingreso", "geam", "permiso", "propietario", "acceso",
                  "mspat", "negociar"],
        "desc": "Negativas de paso de propietarios para mantenimiento de torres.",
    },
    {
        "id": "c_forestal",
        "name": "Intervención Forestal",
        "color": "#0F766E",
        "terms": ["tala", "talar", "árboles", "arboles", "pino", "eucalipto",
                  "platano", "plátano", "vegetación", "poda"],
        "desc": "Podas mecánicas y talas forestales en faja de seguridad.",
    },
]


def _build_treemap(df: pd.DataFrame, mode: str) -> dict:
    """Construye árbol jerárquico: Clúster → Departamento, con métricas."""
    sub = df[df["Estado aviso"] == mode].copy()
    total = len(sub)
    clusters_out = []
    treemap_children = []

    for c in CLUSTERS:
        pat = "|".join(rf"\b{t}\b" for t in c["terms"])
        matched = sub[sub["Descripción"].str.lower().str.contains(pat, na=False, regex=True)]
        count = len(matched)
        dias_med = round(float(matched["Días abierto"].median()), 1) if count > 0 else 0

        # Top terms con sus frecuencias para etiquetas enriquecidas
        term_freq = {}
        for t in c["terms"]:
            tf = int(matched["Descripción"].str.lower().str.contains(rf"\b{t}\b", na=False).sum())
            if tf > 0:
                term_freq[t] = tf
        top_terms = sorted(term_freq.items(), key=lambda x: x[1], reverse=True)[:5]

        # Departamentos como hijos del treemap
        depto_children = []
        deptos_list = []
        if count > 0 and "Departamento" in matched.columns:
            for depto, grp in matched.groupby("Departamento"):
                if depto == "No Identificado":
                    continue
                d_count = len(grp)
                d_dias = round(float(grp["Días abierto"].median()), 1)
                deptos_list.append({"depto": str(depto), "count": d_count, "mora": d_dias})
                depto_children.append({
                    "name": str(depto),
                    "value": d_count,
                    "mora": d_dias,
                })

        deptos_list.sort(key=lambda x: x["count"], reverse=True)

        # Citas textuales
        quotes = []
        if count > 0:
            quotes = [q.strip() for q in matched["Descripción"].dropna().drop_duplicates().head(4).tolist()]

        clusters_out.append({
            "id": c["id"],
            "name": c["name"],
            "color": c["color"],
            "count": count,
            "pct": round((count / total) * 100, 1) if total > 0 else 0,
            "mediana_dias": dias_med,
            "desc": c["desc"],
            "top_terms": [{"term": t.capitalize(), "freq": f} for t, f in top_terms],
            "deptos": deptos_list[:6],
            "quotes": quotes,
        })

        treemap_children.append({
            "name": c["name"],
            "value": count,
            "mora": dias_med,
            "color": c["color"],
            "children": sorted(depto_children, key=lambda x: x["value"], reverse=True)[:8],
        })

    return {
        "total_avisos": total,
        "clusters": clusters_out,
        "treemap": {"name": mode.capitalize(), "children": treemap_children},
    }


def main() -> None:
    from backend.src.data.data_loader import load_data
    print("⏳ Cargando datos con merge equipos + avisos (Departamento incluido)...")
    _, _, df = load_data(force_reload=True)
    ab = _build_treemap(df, "Abierto")
    ce = _build_treemap(df, "Cerrado")

    comparativa = []
    for a in ab["clusters"]:
        c = next(x for x in ce["clusters"] if x["id"] == a["id"])
        tot = a["count"] + c["count"]
        tasa = round((c["count"] / tot) * 100, 1) if tot > 0 else 0
        brecha = round(a["mediana_dias"] - c["mediana_dias"], 1)
        comparativa.append({
            "id": a["id"], "name": a["name"], "color": a["color"],
            "abiertos_count": a["count"], "abiertos_pct": a["pct"],
            "abiertos_mora": a["mediana_dias"],
            "cerrados_count": c["count"], "cerrados_pct": c["pct"],
            "cerrados_atencion": c["mediana_dias"],
            "tasa_cierre": tasa, "brecha_mora_dias": brecha,
            "desc": a["desc"],
            "abiertos_terms": a["top_terms"], "cerrados_terms": c["top_terms"],
            "abiertos_deptos": a["deptos"], "cerrados_deptos": c["deptos"],
            "abiertos_quotes": a["quotes"], "cerrados_quotes": c["quotes"],
        })

    out = {
        "metadata": {"title": "Análisis Comparativo VS (NLP)", "total": len(df)},
        "abiertos": ab, "cerrados": ce, "comparativa_vs": comparativa,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"✅ JSON generado: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
