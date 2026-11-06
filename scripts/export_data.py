"""Script para exportar y sincronizar datos limpios desde los Excel a JSON estático para el Frontend.

Incluye todos los campos requeridos por las 3 Vistas del documento rector:
- Fechas de aviso y cierre, Estado aviso (Abierto/Cerrado), Sector, Año de ingreso/cierre.
- Coordenadas geográficas (Latitud, Longitud) y Línea de transmisión para el Mapa Histórico.
- Generación de GeoJSON departamental (colombia_deptos.json) para ECharts Map.

Uso:
    python3 scripts/export_data.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path
import sys
from typing import List, Tuple
import pandas as pd

# Ajustar PYTHONPATH
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

VENV_SITE = ROOT_DIR / ".venv" / "lib" / "python3.14" / "site-packages"
if VENV_SITE.exists() and str(VENV_SITE) not in sys.path:
    sys.path.append(str(VENV_SITE))

from backend.src.data.data_loader import load_data


def _convex_hull(points: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    """Calcula el envolvente convexo (Monotone Chain) de una lista de coordenadas (lon, lat)."""
    pts = sorted(set(points))
    if len(pts) <= 2:
        return pts

    def cross(o: Tuple[float, float], a: Tuple[float, float], b: Tuple[float, float]) -> float:
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower: List[Tuple[float, float]] = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper: List[Tuple[float, float]] = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    return lower[:-1] + upper[:-1]


def _buffer_polygon(hull: List[Tuple[float, float]], buffer_deg: float = 0.14) -> List[List[float]]:
    """Expande y suaviza los vértices de un polígono alrededor de su centroide para visualización."""
    if not hull:
        return []
    cx = sum(p[0] for p in hull) / len(hull)
    cy = sum(p[1] for p in hull) / len(hull)

    expanded: List[Tuple[float, float]] = []
    for x, y in hull:
        dx = x - cx
        dy = y - cy
        dist = math.hypot(dx, dy)
        if dist < 1e-6:
            expanded.append((round(x + buffer_deg, 4), round(y + buffer_deg, 4)))
        else:
            nx = x + (dx / dist) * buffer_deg
            ny = y + (dy / dist) * buffer_deg
            expanded.append((round(nx, 4), round(ny, 4)))

    # Subdivisión Chaikin (1 iteración) para bordes orgánicos tipo cartografía
    smoothed: List[List[float]] = []
    n = len(expanded)
    if n >= 3:
        for i in range(n):
            p0 = expanded[i]
            p1 = expanded[(i + 1) % n]
            q = [round(0.75 * p0[0] + 0.25 * p1[0], 4), round(0.75 * p0[1] + 0.25 * p1[1], 4)]
            r = [round(0.25 * p0[0] + 0.75 * p1[0], 4), round(0.25 * p0[1] + 0.75 * p1[1], 4)]
            smoothed.append(q)
            smoothed.append(r)
        smoothed.append(smoothed[0])
        return smoothed

    ring = [[p[0], p[1]] for p in expanded]
    ring.append(ring[0])
    return ring


def build_colombia_geojson(df_equipos: pd.DataFrame) -> dict:
    """Construye un GeoJSON ligero de los departamentos operativos y silueta andina/suroccidente."""
    features = []
    valid_eq = df_equipos.dropna(subset=["Longitud", "Latitud"])

    for depto, group in valid_eq.groupby("Departamento"):
        if depto == "No Identificado":
            continue
        pts = list(zip(group["Longitud"].round(4), group["Latitud"].round(4)))
        hull = _convex_hull(pts)
        buf = 0.08 if depto == "Bogotá, D.C." else 0.16
        ring = _buffer_polygon(hull, buffer_deg=buf)
        if len(ring) >= 4:
            features.append({
                "type": "Feature",
                "properties": {
                    "name": str(depto),
                    "cte": str(group["CTE"].mode().iloc[0]) if len(group) > 0 else "Todos",
                    "torres": int(len(group)),
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [ring],
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def export() -> None:
    print("⏳ Leyendo y limpiando datasets desde backend/src/data/...")
    df_equipos, df_avisos, df_merged = load_data(force_reload=True)

    out_dir = ROOT_DIR / "frontend" / "public" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    # 1. Equipos con coordenadas y línea para análisis espacial y de capacidad
    eq_cols = ["Equipo", "Torre", "Linea", "Latitud", "Longitud", "CTE", "Departamento", "Municipio"]
    existing_eq_cols = [c for c in eq_cols if c in df_equipos.columns]
    eq_df = df_equipos[existing_eq_cols].copy()
    eq_df["Equipo"] = eq_df["Equipo"].fillna(0).astype(int)
    if "Latitud" in eq_df.columns:
        eq_df["Latitud"] = eq_df["Latitud"].round(5)
    if "Longitud" in eq_df.columns:
        eq_df["Longitud"] = eq_df["Longitud"].round(5)

    # 2. Avisos enriquecidos para las 3 Vistas y Mapa Histórico
    av_df = df_merged.copy()
    av_df["Aviso"] = av_df["Aviso"].astype(str)
    av_df["Equipo"] = av_df["Equipo"].fillna(0).astype(int)
    av_df["Fecha de aviso"] = av_df["Fecha de aviso"].astype(str).str[:10]
    if "Fecha de cierre" in av_df.columns:
        av_df["Fecha de cierre"] = av_df["Fecha de cierre"].fillna("").astype(str).str[:10]
        av_df["Fecha de cierre"] = av_df["Fecha de cierre"].replace({"NaT": "", "nan": "", "None": ""})
    else:
        av_df["Fecha de cierre"] = ""

    av_df["Días abierto"] = pd.to_numeric(av_df["Días abierto"], errors="coerce").fillna(0).round(1)
    av_df["Cumple prioridad días"] = pd.to_numeric(av_df["Cumple prioridad días"], errors="coerce").fillna(0).round(1)
    av_df["Prioridad días"] = pd.to_numeric(av_df.get("Prioridad días", 0), errors="coerce").fillna(0).astype(int)
    av_df["Año"] = pd.to_numeric(av_df.get("Año", 0), errors="coerce").fillna(0).astype(int)
    av_df["Año cierre"] = pd.to_numeric(av_df.get("Año cierre", 0), errors="coerce").fillna(0).astype(int)
    if "Latitud" in av_df.columns:
        av_df["Latitud"] = pd.to_numeric(av_df["Latitud"], errors="coerce").round(5)
    if "Longitud" in av_df.columns:
        av_df["Longitud"] = pd.to_numeric(av_df["Longitud"], errors="coerce").round(5)

    cols = [
        "Aviso",
        "Equipo",
        "Tipo de aviso",
        "Fecha de aviso",
        "Fecha de cierre",
        "Estado aviso",
        "Sector",
        "Prioridad",
        "Prioridad días",
        "Días abierto",
        "Cumple prioridad días",
        "Cumplimiento_Estado",
        "Año",
        "Año cierre",
        "CTE",
        "Departamento",
        "Municipio",
        "Linea",
        "Latitud",
        "Longitud",
    ]
    existing_av_cols = [c for c in cols if c in av_df.columns]
    av_export = av_df[existing_av_cols].astype(object).where(pd.notna(av_df[existing_av_cols]), None)
    eq_export = eq_df.astype(object).where(pd.notna(eq_df), None)

    payload = {
        "equipos": eq_export.to_dict(orient="records"),
        "avisos": av_export.to_dict(orient="records"),
    }

    out_path = out_dir / "ecogrid_data.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, allow_nan=False)

    size_kb = round(out_path.stat().st_size / 1024, 1)
    print(f"✅ Exportación completada con éxito: {out_path} ({size_kb} KB)")

    # 3. Exportar GeoJSON departamental
    geojson_data = build_colombia_geojson(df_equipos)
    geo_path = out_dir / "colombia_deptos.json"
    with open(geo_path, "w", encoding="utf-8") as f:
        json.dump(geojson_data, f, ensure_ascii=False)
    print(f"🗺️ GeoJSON generado con éxito: {geo_path} ({len(geojson_data['features'])} departamentos)")


if __name__ == "__main__":
    export()
