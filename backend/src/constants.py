"""Constantes globales y sistema de diseño cromático de EcoGrid Colombia.

Fuente única de la verdad (DRY) para el diseño, compartida entre backend y frontend.
Implementa separación semántica estricta (SLA vs Categorías vs Escala Secuencial Territorial)
para eliminar fatiga visual y colisiones cognitivas en temas Claro y Oscuro.
"""

from __future__ import annotations
from typing import Dict, List

# 1. Paleta Corporativa y Semántica Estricta (SLA & Estado Operativo)
PALETTE: Dict[str, str] = {
    "forest": "#0F172A",       # Slate 900 (Superficie ejecutiva / texto primario)
    "emerald": "#059669",      # SLA Cumple / Éxito (Tema Claro)
    "mint": "#10B981",         # SLA Cumple / Éxito (Tema Oscuro / Acento)
    "electric": "#0D9488",     # Acento institucional EcoGrid (Teal 600)
    "amber": "#D97706",        # SLA En Riesgo / Advertencia
    "terracotta": "#DC2626",   # SLA Excede Plazo / Vencido Crítico
}

# 2. Paleta Categórica Armónica para Tipos de Aviso (Sin colisión con verde/rojo de SLA)
# Distancia cromática Delta-E > 25 para evitar confusión visual con la marca o el SLA
TIPO_COLORS: Dict[str, str] = {
    "Vegetación": "#3F6212",              # Verde Oliva silvicultural (No compite con Esmeralda SLA)
    "Construcciones": "#1D4ED8",          # Azul Cobalto (Infraestructura / Ingeniería)
    "Obras": "#475569",                   # Grafito / Acero Industrial (Rompe la sopa de azules)
    "Permiso Ingreso": "#6D28D9",         # Amatista Técnico / Predial
    "Invasión / Explanación": "#C2410C",  # Terracota Arcilla / Suelo (No compite con Ámbar SLA)
    "Otros": "#94A3B8",                   # Pizarra Neutro (Categoría recesiva)
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
