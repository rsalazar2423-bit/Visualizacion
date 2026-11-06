"""Constantes globales y sistema de diseño cromático de EcoGrid Colombia.

Fuente única de la verdad (DRY) para el diseño, compartida entre backend y frontend.
Implementa separación semántica estricta (SLA vs Categorías vs Escala Secuencial Territorial)
para eliminar fatiga visual y colisiones cognitivas en temas Claro y Oscuro.
"""

from __future__ import annotations
from typing import Dict, List

# 1. Paleta Corporativa y Semántica Estricta (SLA & Estado Operativo)
# Rige el semáforo operativo: Teal (en norma) / Naranja (advertencia) / Rojo (alerta crítica)
PALETTE: Dict[str, str] = {
    "forest": "#0F172A",       # Slate 900 (Superficie ejecutiva / texto primario)
    "teal": "#0D9488",         # SLA Cumple / Éxito (Teal institucional)
    "mint": "#14B8A6",         # SLA Cumple / Éxito (Modo oscuro)
    "electric": "#0D9488",     # Acento institucional EcoGrid (Teal 600)
    "orange": "#EA580C",       # SLA En Riesgo / Advertencia (Naranja Operativo)
    "danger": "#DC2626",       # SLA Excede Plazo / Vencido Crítico (Rojo Alerta)
}

# 2. Paleta Categórica Armónica (100% Rampa Institucional Teal-Azul-Pizarra)
TIPO_COLORS: Dict[str, str] = {
    "Vegetación": "#0D9488",              # Teal Institucional (55% del volumen operativo)
    "Construcciones": "#1D4ED8",          # Azul Cobalto (Infraestructura / Ingeniería)
    "Obras": "#0284C7",                   # Azul Cielo / Acero Técnico
    "Permiso Ingreso": "#475569",         # Pizarra Oscuro (Predial / Administrativo)
    "Invasión / Explanación": "#64748B",  # Pizarra Medio (Servidumbres / Terrenos)
    "Otros": "#94A3B8",                   # Pizarra Claro (Categoría recesiva)
}

# 3. Orden canónico y rampa secuencial por horizonte de Plazos SLA
PRIO_ORDER: List[str] = [
    "Semana",
    "Mes",
    "Trimestre",
    "Semestre",
    "Año",
    "Dos años",
    "Tres años",
    "Seis años",
    "No asignada",
]

PRIO_COLORS: Dict[str, str] = {
    "Semana": "#1E3A8A",       # Corto plazo - Urgencia máxima (Navy 900)
    "Mes": "#1D4ED8",          # Corto plazo (Blue 700)
    "Trimestre": "#2563EB",    # Corto-mediano plazo (Blue 600)
    "Semestre": "#0284C7",     # Mediano plazo (Sky 600)
    "Año": "#0D9488",          # Mediano plazo (Teal 600)
    "Dos años": "#0F766E",     # Largo plazo (Teal 700)
    "Tres años": "#475569",    # Largo plazo (Slate 600)
    "Seis años": "#64748B",    # Horizonte extendido (Slate 500)
    "No asignada": "#94A3B8",  # Sin plazo (Slate 400)
}

# 4. Escala Secuencial Ejecutiva para Territorios (6 Peldaños de Densidad Perceptual)
PALETTE_DEPTOS: List[str] = [
    "#115E59",  # Nivel 1 - Concentración Extrema (Teal 800)
    "#0F766E",  # Nivel 2 - Muy Alta (Teal 700)
    "#0284C7",  # Nivel 3 - Alta (Sky 600)
    "#2563EB",  # Nivel 4 - Media (Blue 600)
    "#475569",  # Nivel 5 - Moderada (Slate 600)
    "#94A3B8",  # Nivel 6 - Base / Mínima (Slate 400)
]

SYSTEM_FONT = "'Inter', system-ui, -apple-system, sans-serif"
