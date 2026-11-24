"""build_nlp_graph.py — Motor de clasificación NLP de Rutas de Tratamiento Operativo.

Clasifica el 100% de los avisos en 4 Rutas de Tratamiento accionables para el
Coordinador y exporta los avisos abiertos individuales + benchmarks históricos.
"""

from __future__ import annotations

import json
import re
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

ROUTES = [
    {
        "id": "r_campo",
        "name": "1. Cuadrilla de Campo (Forestal / Obra)",
        "short_name": "Cuadrilla de Campo",
        "action": "Programar despacho directo de cuadrilla operativa (poda, tala libre o mantenimiento en torre).",
    },
    {
        "id": "r_predial",
        "name": "2. Gestión Predial Previa (Permiso Ingreso)",
        "short_name": "Gestión Predial",
        "action": "Asignar gestor predial/social para concertar ingreso con propietario antes de movilizar cuadrilla.",
    },
    {
        "id": "r_ambiental",
        "name": "3. Trámite Ambiental / CAR (Regulatorio)",
        "short_name": "Trámite Ambiental / CAR",
        "action": "Escalar expediente ambiental (Corpochivor / CAR / salvoconducto). No enviar cuadrilla sin permiso.",
    },
    {
        "id": "r_servidumbre",
        "name": "4. Jurídico / Servidumbre (Construcciones)",
        "short_name": "Jurídico / Servidumbre",
        "action": "Gestionar vía jurídica/policiva por ocupación o retiro de construcción en franja de servidumbre.",
    },
]

RE_AMBIENTAL = re.compile(
    r"\b(crpochivor|corpochivor|corpoboyaca|cvc|cam|car|corporaci[oó]n|salvoconducto|ambiental|licencia)\b"
)
RE_PREDIAL = re.compile(
    r"\b(permiso|ingreso|propietario|negociar|acceso|mspat|oposici[oó]n)\b"
)
RE_SERVIDUMBRE = re.compile(
    r"\b(retirar|reubicar|demoler|vivienda|casa|bodega|establo|gallinero|marranera|invasi[oó]n|construcci[oó]n)\b"
)


def _classify_route(row: pd.Series) -> str:
    desc = str(row.get("Descripción", "") or "").lower()
    prob = str(row.get("Textocódproblem", "") or "").lower()
    status = str(row.get("Status usuario", "") or "").upper()
    tipo = str(row.get("Tipo de aviso", "") or "")
    txt = f"{desc} {prob}"

    if "TAMB" in status or RE_AMBIENTAL.search(txt):
        return "r_ambiental"
    if tipo == "Permiso Ingreso" or "no permite el ingreso" in prob or RE_PREDIAL.search(txt):
        return "r_predial"
    if "GERE" in status or tipo in ("Construcciones", "Invasión/Explanacion") or RE_SERVIDUMBRE.search(txt):
        return "r_servidumbre"
    return "r_campo"


def _clean_str(val: object, fallback: str = "Sin dato") -> str:
    s = str(val or "").strip()
    return fallback if not s or s in ("nan", "None", "No Identificado") else s


def main() -> None:
    from backend.src.data.data_loader import load_data
    print("⏳ Clasificando rutas operativas NLP para el Coordinador...")
    _, _, df = load_data(force_reload=True)
    df = df.copy()
    df["ruta"] = df.apply(_classify_route, axis=1)

    # Estadísticas históricas de cerrados por (ruta, cte, depto) para benchmark dinámico
    ce = df[df["Estado aviso"] == "Cerrado"]
    closed_stats = []
    for (ruta, cte, depto), grp in ce.groupby(["ruta", "CTE", "Departamento"], dropna=False):
        closed_stats.append({
            "ruta": str(ruta),
            "cte": _clean_str(cte, "Sin Asignar"),
            "depto": _clean_str(depto, "Sin Asignar"),
            "count": int(len(grp)),
            "mediana_dias": round(float(grp["Días abierto"].median()), 0),
        })

    # Avisos abiertos individuales enriquecidos para triaje en tiempo real
    ab = df[df["Estado aviso"] == "Abierto"].sort_values("Cumple prioridad días", ascending=True)
    open_tickets = []
    for _, r in ab.iterrows():
        rem_days = int(round(float(r.get("Cumple prioridad días", 0) or 0)))
        rem_per = float(r.get("Cumple prioridad periodos", 1.0) or 1.0)
        prio_days = int(round(float(r.get("Prioridad días", 365) or 365)))

        if rem_days < 0 or str(r.get("Cumplimiento_Estado", "")) == "Excede Plazo":
            urgencia = "vencido"
        elif rem_days <= 90 or rem_per <= 0.25:
            urgencia = "proximo"
        else:
            urgencia = "en_plazo"

        open_tickets.append({
            "aviso": _clean_str(r.get("Aviso"), "-"),
            "ruta": str(r["ruta"]),
            "urgencia": urgencia,
            "horizonte": "corto" if prio_days <= 365 else "largo",
            "prioridad": _clean_str(r.get("Prioridad"), "-"),
            "dias_abierto": int(round(float(r.get("Días abierto", 0) or 0))),
            "dias_restantes": rem_days,
            "cte": _clean_str(r.get("CTE"), "Sin Asignar"),
            "depto": _clean_str(r.get("Departamento"), "Sin Asignar"),
            "mpio": _clean_str(r.get("Municipio"), "Sin Municipio"),
            "linea": _clean_str(r.get("Linea"), "Sin Línea"),
            "torre": _clean_str(r.get("Torre") or r.get("Equipo"), "-"),
            "desc": _clean_str(r.get("Descripción"), "Sin descripción"),
        })

    out = {
        "metadata": {"title": "Triaje Operativo NLP del Coordinador", "total_abiertos": len(open_tickets)},
        "routes": ROUTES,
        "closed_stats": closed_stats,
        "open_tickets": open_tickets,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    size_kb = OUTPUT_PATH.stat().st_size / 1024
    print(f"✅ JSON generado ({len(open_tickets)} abiertos, {size_kb:.1f} KB): {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
