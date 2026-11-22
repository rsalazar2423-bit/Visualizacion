"""build_nlp_graph.py — Extracción semántica NLP para Treemaps comparativos VS.

Genera JSON con 3 vistas SLA (todos, vencidos, a_tiempo) a nivel nacional
(Clúster → Departamento) y por cada Departamento (Clúster → Municipio).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT_DIR / "frontend" / "public" / "data" / "nlp_graph_data.json"

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


def _vencidos_pct(frame: pd.DataFrame) -> float:
    if len(frame) == 0 or "Cumplimiento_Estado" not in frame.columns:
        return 0.0
    return round(float((frame["Cumplimiento_Estado"] == "Excede Plazo").mean() * 100), 1)


def _build_mode(df: pd.DataFrame, mode: str, geo_col: str) -> dict:
    """Construye árbol jerárquico Clúster → geo_col (Departamento o Municipio)."""
    sub = df[df["Estado aviso"] == mode]
    total = len(sub)
    clusters_out, treemap_children = [], []
    desc_low = sub["Descripción"].str.lower() if total > 0 else pd.Series(dtype=str)

    for c in CLUSTERS:
        pat = "|".join(rf"\b{t}\b" for t in c["terms"])
        matched = sub[desc_low.str.contains(pat, na=False, regex=True)] if total > 0 else sub.iloc[0:0]
        count = len(matched)
        dias_med = round(float(matched["Días abierto"].median()), 1) if count > 0 else 0
        v_pct = _vencidos_pct(matched)

        m_low = matched["Descripción"].str.lower() if count > 0 else pd.Series(dtype=str)
        term_freq = (
            {t: int(m_low.str.contains(rf"\b{t}\b", na=False, regex=True).sum()) for t in c["terms"]}
            if count > 0 else {}
        )
        top_terms = sorted(((t, f) for t, f in term_freq.items() if f > 0), key=lambda x: x[1], reverse=True)[:5]

        geo_children, geo_list = [], []
        if count > 0 and geo_col in matched.columns:
            for gname, grp in matched.groupby(geo_col):
                g_str = str(gname).strip()
                if not g_str or g_str in ("No Identificado", "nan", "None"):
                    continue
                g_count = len(grp)
                g_dias = round(float(grp["Días abierto"].median()), 1)
                g_vpct = _vencidos_pct(grp)
                geo_list.append({"depto": g_str, "count": g_count, "mora": g_dias})
                geo_children.append({"name": g_str, "value": g_count, "mora": g_dias, "vencidos_pct": g_vpct})

        geo_list.sort(key=lambda x: x["count"], reverse=True)
        quotes = (
            [q.strip() for q in matched["Descripción"].dropna().drop_duplicates().head(3).tolist()]
            if count > 0 else []
        )

        clusters_out.append({
            "id": c["id"], "name": c["name"], "color": c["color"],
            "count": count, "pct": round((count / total) * 100, 1) if total > 0 else 0,
            "mediana_dias": dias_med, "vencidos_pct": v_pct, "desc": c["desc"],
            "top_terms": [{"term": t.capitalize(), "freq": f} for t, f in top_terms],
            "deptos": geo_list[:6], "quotes": quotes,
        })
        treemap_children.append({
            "name": c["name"], "value": count, "mora": dias_med,
            "vencidos_pct": v_pct, "color": c["color"],
            "children": sorted(geo_children, key=lambda x: x["value"], reverse=True)[:8],
        })

    return {
        "total_avisos": total,
        "clusters": clusters_out,
        "treemap": {"name": mode.capitalize(), "children": treemap_children},
    }


def _build_scope(df: pd.DataFrame, geo_col: str) -> dict:
    """Construye bloque completo (abiertos, cerrados, comparativa_vs)."""
    ab = _build_mode(df, "Abierto", geo_col)
    ce = _build_mode(df, "Cerrado", geo_col)
    comparativa = []
    for a in ab["clusters"]:
        c = next(x for x in ce["clusters"] if x["id"] == a["id"])
        tot = a["count"] + c["count"]
        comparativa.append({
            "id": a["id"], "name": a["name"], "color": a["color"],
            "abiertos_count": a["count"], "abiertos_pct": a["pct"], "abiertos_mora": a["mediana_dias"],
            "cerrados_count": c["count"], "cerrados_pct": c["pct"], "cerrados_atencion": c["mediana_dias"],
            "tasa_cierre": round((c["count"] / tot) * 100, 1) if tot > 0 else 0,
            "brecha_mora_dias": round(a["mediana_dias"] - c["mediana_dias"], 1),
            "desc": a["desc"],
            "abiertos_terms": a["top_terms"], "cerrados_terms": c["top_terms"],
            "abiertos_deptos": a["deptos"], "cerrados_deptos": c["deptos"],
            "abiertos_quotes": a["quotes"], "cerrados_quotes": c["quotes"],
        })
    return {"abiertos": ab, "cerrados": ce, "comparativa_vs": comparativa}


def _build_sla_scopes(df: pd.DataFrame, geo_col: str) -> dict:
    return {
        "todos": _build_scope(df, geo_col),
        "vencidos": _build_scope(df[df["Cumplimiento_Estado"] == "Excede Plazo"], geo_col),
        "a_tiempo": _build_scope(df[df["Cumplimiento_Estado"] == "Cumple Plazo"], geo_col),
    }


def main() -> None:
    from backend.src.data.data_loader import load_data
    print("⏳ Generando NLP por SLA (todos / vencidos / a_tiempo) y Departamento...")
    _, _, df = load_data(force_reload=True)

    deptos = sorted(
        d for d in df["Departamento"].dropna().unique().tolist()
        if str(d).strip() not in ("", "No Identificado")
    )
    out = {
        "metadata": {"title": "Análisis Comparativo VS (NLP)", "total": len(df)},
        "departamentos": deptos,
        "nacional": _build_sla_scopes(df, "Departamento"),
        "by_depto": {d: _build_sla_scopes(df[df["Departamento"] == d], "Municipio") for d in deptos},
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"✅ JSON generado ({len(deptos)} deptos × 3 SLA, {size_kb:.1f} KB): {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
