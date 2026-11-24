"""build_nlp_graph.py — Generador de datos NLP con 5 Causales y Banderas Críticas.

Ejecuta nlp_lexicon sobre los 3.118 avisos (Abiertos y Cerrados), reporta cobertura
léxica directa sobre Descripción y exporta nlp_graph_data.json para el frontend.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT_DIR / "frontend" / "public" / "data" / "nlp_graph_data.json"

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))
VENV_SITE = ROOT_DIR / ".venv" / "lib" / "python3.14" / "site-packages"
if VENV_SITE.exists() and str(VENV_SITE) not in sys.path:
    sys.path.append(str(VENV_SITE))

from scripts.nlp_lexicon import ROUTES, classify_and_tag, translate_status  # noqa: E402


def _clean_str(val: object, fallback: str = "-") -> str:
    s = str(val or "").strip()
    return fallback if not s or s in ("nan", "None", "No Identificado") else s


def main() -> None:
    from backend.src.data.data_loader import load_data
    print("⏳ Ejecutando motor léxico NLP sobre las 3.118 descripciones...")
    _, _, df = load_data(force_reload=True)
    df = df.sort_values("Cumple prioridad días", ascending=True)

    tickets = []
    lex_hits = 0
    for _, r in df.iterrows():
        ruta, tags, matched_lex = classify_and_tag(r)
        if matched_lex:
            lex_hits += 1

        is_open = str(r.get("Estado aviso", "Abierto")) == "Abierto"
        rem_days = int(round(float(r.get("Cumple prioridad días", 0) or 0)))
        rem_per = float(r.get("Cumple prioridad periodos", 1.0) or 1.0)
        prio_days = int(round(float(r.get("Prioridad días", 365) or 365)))
        excede = rem_days < 0 or str(r.get("Cumplimiento_Estado", "")) == "Excede Plazo"

        if excede:
            urgencia = "vencido"
        elif is_open and (rem_days <= 90 or rem_per <= 0.25):
            urgencia = "proximo"
        else:
            urgencia = "en_plazo"

        tickets.append({
            "aviso": _clean_str(r.get("Aviso")),
            "tipo": _clean_str(r.get("Tipo de aviso"), "Sin Tipo"),
            "estado": "abierto" if is_open else "cerrado",
            "ruta": ruta,
            "urgencia": urgencia,
            "horizonte": "corto" if prio_days <= 365 else "largo",
            "prioridad": _clean_str(r.get("Prioridad")),
            "dias_abierto": int(round(float(r.get("Días abierto", 0) or 0))),
            "dias_restantes": rem_days,
            "cte": _clean_str(r.get("CTE"), "Sin Asignar"),
            "depto": _clean_str(r.get("Departamento"), "Sin Asignar"),
            "mpio": _clean_str(r.get("Municipio"), "Sin Municipio"),
            "vereda": _clean_str(r.get("Vereda"), ""),
            "linea": _clean_str(r.get("Linea"), "Sin Línea"),
            "torre": _clean_str(r.get("Torre") or r.get("Equipo")),
            "etapa": translate_status(r.get("Status usuario")),
            "desc": _clean_str(r.get("Descripción"), "Sin descripción"),
            "tags": tags,
        })

    cov_pct = round(lex_hits / len(tickets) * 100, 1) if tickets else 0.0
    out = {
        "metadata": {
            "title": "Triaje y Vencimiento por Causal NLP",
            "total": len(tickets),
            "lexical_coverage_pct": cov_pct,
        },
        "routes": ROUTES,
        "tickets": tickets,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"✅ Cobertura léxica directa en texto: {lex_hits}/{len(tickets)} ({cov_pct}%)")
    print(f"✅ JSON generado ({size_kb:.1f} KB): {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
