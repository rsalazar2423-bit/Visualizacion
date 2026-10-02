"""Constantes globales y paleta institucional de EcoGrid Colombia.

Fuente única de la verdad (DRY) para el diseño, compartida entre backend y frontend.
Garantiza alto contraste, diferenciación cromática nítida y legibilidad sin fatiga.
"""

from __future__ import annotations
from typing import Dict, List

# Paleta Oficial EcoGrid (Clean-Tech & Biodiversidad DEC)
PALETTE: Dict[str, str] = {
    "forest": "#05261F",
    "emerald": "#0D9763",
    "mint": "#10B981",
    "electric": "#84CC16",
    "amber": "#D97706",
    "terracotta": "#E11D48",
}

# Paleta categórica para Tipos de Aviso
TIPO_COLORS: Dict[str, str] = {
    "Vegetación": "#0D9763",
    "Construcciones": "#0284C7",
    "Obras": "#F59E0B",
    "Permiso Ingreso": "#8B5CF6",
    "Invasión / Explanación": "#F43F5E",
    "Otros": "#64748B",
}

# Orden canónico y paleta cromática para Plazos SLA de Resolución
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
    "Semana": "#10B981",       # Mint
    "Mes": "#0D9763",          # Emerald
    "Trimestre": "#0284C7",    # Azul eléctrico
    "Semestre": "#38BDF8",     # Cyan
    "Año": "#F59E0B",          # Ámbar
    "Dos años": "#D97706",     # Ocre
    "Tres años": "#EA580C",    # Naranja oscuro
    "Seis años": "#E11D48",    # Frambuesa
    "No asignada": "#64748B",  # Slate
}

# Paleta Departamental Equilibrada
PALETTE_DEPTOS: List[str] = [
    "#2D6A4F",  # Esmeralda corporativo
    "#3A86FF",  # Azul eléctrico
    "#0B6E59",  # Esmeralda profundo
    "#E9C46A",  # Ocre solar
    "#9D4EDD",  # Púrpura
    "#E76F51",  # Terracota
    "#4EA8DE",  # Cyan suave
    "#F4A261",  # Ámbar cálido
    "#74C69D",  # Salvia
    "#06D6A0",  # Turquesa
    "#118AB2",  # Azul petróleo
    "#FFB703",  # Amarillo oro
]

SYSTEM_FONT = "system-ui, Arial, sans-serif"
