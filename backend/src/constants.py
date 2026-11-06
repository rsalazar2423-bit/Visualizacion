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
TIPO_COLORS: Dict[str, str] = {
    "Vegetación": "#0D9488",              # Teal profundo (Silvicultura / Naturaleza)
    "Construcciones": "#2563EB",          # Azul Cobalto (Infraestructura / Ingeniería)
    "Obras": "#7C3AED",                   # Violeta Índigo (Obra civil / Intervención)
    "Permiso Ingreso": "#0284C7",         # Cian Acero (Gestión predial / Acceso)
    "Invasión / Explanación": "#C2410C",  # Terracota Óxido (Suelo / Terreno)
    "Otros": "#64748B",                   # Pizarra Neutro (Categoría recesiva)
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
    "Semana": "#1D4ED8",       # Corto plazo - Urgencia máxima (Blue 700)
    "Mes": "#2563EB",          # Corto plazo (Blue 600)
    "Trimestre": "#0284C7",    # Mediano-corto plazo (Sky 600)
    "Semestre": "#0891B2",     # Mediano plazo (Cyan 600)
    "Año": "#0D9488",          # Mediano plazo (Teal 600)
    "Dos años": "#4F46E5",     # Largo plazo (Indigo 600)
    "Tres años": "#6366F1",    # Largo plazo (Indigo 500)
    "Seis años": "#64748B",    # Horizonte extendido (Slate 500)
    "No asignada": "#94A3B8",  # Sin plazo (Slate 400)
}

# 4. Escala Secuencial Ejecutiva para Territorios (Sin arcoíris; gradiente técnico de densidad)
PALETTE_DEPTOS: List[str] = [
    "#0F766E",  # Nivel 1 - Mayor concentración (Teal 700)
    "#0D9488",  # Nivel 2 (Teal 600)
    "#0891B2",  # Nivel 3 (Cyan 600)
    "#0284C7",  # Nivel 4 (Sky 600)
    "#2563EB",  # Nivel 5 (Blue 600)
    "#3B82F6",  # Nivel 6 (Blue 500)
    "#4F46E5",  # Nivel 7 (Indigo 600)
    "#6366F1",  # Nivel 8 (Indigo 500)
    "#475569",  # Nivel 9 (Slate 600)
    "#64748B",  # Nivel 10 (Slate 500)
    "#94A3B8",  # Nivel 11 (Slate 400)
    "#CBD5E1",  # Nivel 12 - Menor concentración (Slate 300)
]

SYSTEM_FONT = "'Inter', system-ui, -apple-system, sans-serif"
