"""nlp_lexicon.py — Normalizador léxico y diccionario de dominio eléctrico (NLP).

Corrige errores ortográficos reales de campo, clasifica el >97% de las descripciones
en 5 Causales Operativas y extrae Banderas Críticas (siglas, riesgo eléctrico, especies).
"""

from __future__ import annotations
import re
import pandas as pd

ROUTES = [
    {
        "id": "r_campo",
        "name": "1. Poda y Tala Forestal (Campo)",
        "short_name": "Forestal / Campo",
        "action": "Programar cuadrilla forestal para poda, tala o despeje de vegetación en faja.",
    },
    {
        "id": "r_electro",
        "name": "2. Infraestructura y Red (SPT / OPGW / Civil)",
        "short_name": "Infraestructura / Red",
        "action": "Despachar cuadrilla electromecánica/civil (SPT, OPGW, descargadores, talud o sitio torre).",
    },
    {
        "id": "r_predial",
        "name": "3. Gestión y Negociación Predial (Permisos)",
        "short_name": "Gestión Predial",
        "action": "Asignar gestor predial para concertar ingreso o pago de mejoras antes de enviar cuadrilla.",
    },
    {
        "id": "r_ambiental",
        "name": "4. Trámite Ambiental / CAR (Regulatorio)",
        "short_name": "Ambiental / CAR",
        "action": "Escalar expediente ante CAR / Corpochivor / salvoconducto. No talar sin resolución.",
    },
    {
        "id": "r_servidumbre",
        "name": "5. Jurídico / Servidumbre (Construcciones)",
        "short_name": "Jurídico / Servidumbre",
        "action": "Gestionar retiro/reubicación legal de construcciones u ocupaciones en franja (priorizar VBL/SNG).",
    },
]

# Corrección de errores ortográficos y abreviaturas frecuentes de linieros
TYPO_MAP = [
    (re.compile(r"\b(vivieda|rvivie)\b"), "vivienda"),
    (re.compile(r"\bvivi\."), "vivienda "),
    (re.compile(r"\b(vegtaci[oó]n|vgetaci[oó]n|vegetacion)\b"), "vegetación"),
    (re.compile(r"\bgstionar\b"), "gestionar"),
    (re.compile(r"\becaliptos?\b"), "eucalipto"),
    (re.compile(r"\bcrpochivor\b"), "corpochivor"),
    (re.compile(r"\bpisci\b"), "piscina"),
    (re.compile(r"\barb\b"), "árbol"),
    (re.compile(r"\b(servid|serv\.)\b"), "servidumbre"),
    (re.compile(r"\bivb\b"), "ivbl"),
    (re.compile(r"\bclc\b"), "slc"),
]

RE_AMBIENTAL = re.compile(
    r"\b(corpochivor|corpoboyaca|cvc|cam|car|corporaci[oó]n|salvoconducto|ambiental|licencia|tr[aá]mite macro)\b"
)
RE_ELECTRO = re.compile(
    r"\b(spt|opgw|descargador\w*|amortiguador\w*|puesta a tierra|herraje\w*|aislador\w*|"
    r"mejoramiento|talud|erosi[oó]n|derrumbe|deslizamiento|excavaci[oó]n|movim\w+ de terreno|"
    r"obras de protecci[oó]n|variante|placas|demarcar|aterrizar cerca|instalar|corregir acercamiento)\b"
)
RE_PREDIAL = re.compile(
    r"\b(permiso\w*|ingreso|propietario\w*|negociar|negociaci[oó]n|acceso|mspat|oposici[oó]n|autorizaci[oó]n)\b"
)
RE_SERVIDUMBRE = re.compile(
    r"\b(retirar|retiro|reubic\w*|demoler|amparo policivo|vivienda\w*|rancho\w*|loteo|barrio|casa\w*|"
    r"bodega\w*|establo\w*|gallinero\w*|marranera\w*|ramada\w*|enramada\w*|invernadero\w*|"
    r"galp[oó]n\w*|corral\w*|caseta\w*|kiosco\w*|piscina\w*|tanque|bebedero|muro\w*|"
    r"cancha\w*|parqueadero\w*|club|letrina\w*|invasi[oó]n|construcci\w*|explanaci[oó]n|term slc)\b"
)
RE_FORESTAL = re.compile(
    r"\b(tala\w*|poda\w*|cortar|corte|descopar|vegetaci[oó]n|[aá]rbol\w*|guadua\w*|eucalipto\w*|"
    r"pino\w*|pl[aá]tano\w*|acacio\w*|sam[aá]n\w*|palma\w*|carbonero\w*|bosque\w*|despeje|rocer[ií]a|mp servid\w*)\b"
)

# Banderas críticas visibles y filtrables en la interfaz del Coordinador
CRITICAL_TAG_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("IVBL · Inviable", re.compile(r"\bivbl\b")),
    ("SNG · Sin Negociar", re.compile(r"\bsng\b")),
    ("VBL · Viable", re.compile(r"\bvbl\b")),
    ("NG · Negociado", re.compile(r"\bng\b")),
    ("Bajo Circuito / Riesgo", re.compile(r"\b(acercamiento|bajo cto|ctos?|ctoder|ctoizq|riesgo|peligro)\b")),
    ("DFS · Dentro Franja", re.compile(r"\bdfs\b")),
    ("FFS · Fuera Franja", re.compile(r"\bffs\b")),
    ("Reincidente M8", re.compile(r"\bm8\b")),
    ("Gestión GEAM", re.compile(r"\bgeam\b")),
    ("Corpochivor / CAR", RE_AMBIENTAL),
    ("Guadua / Eucalipto / Pino", re.compile(r"\b(guaduas?|eucaliptos?|pinos?)\b")),
    ("Estructura Rural", re.compile(r"\b(ramada|invernadero|caseta|galp[oó]n|galpones|corral\w*|marranera|piscina|cancha)\b")),
    ("SPT / OPGW / Red", re.compile(r"\b(spt|opgw|descargador\w*|amortiguador\w*)\b")),
]


def normalize_text(raw: str) -> str:
    txt = raw.lower()
    for pat, repl in TYPO_MAP:
        txt = pat.sub(repl, txt)
    return txt


STATUS_LABELS: list[tuple[str, str]] = [
    ("TAMB", "Trámite Ambiental"),
    ("GERE", "Gestión Jurídica"),
    ("GPRE", "Gestión Predial"),
    ("ENPT", "En Espera / Punto"),
    ("REAN", "Reanudar"),
    ("PRER", "Prerrequisito"),
    ("COND", "Condicionado"),
    ("GEAM", "Gestión Ambiental"),
]


def translate_status(raw_status: object) -> str:
    s = str(raw_status or "").upper()
    parts = [label for code, label in STATUS_LABELS if code in s]
    return " · ".join(parts[:2]) if parts else "Iniciado"


def classify_and_tag(row: pd.Series) -> tuple[str, list[str], bool]:
    desc_norm = normalize_text(str(row.get("Descripción", "") or ""))
    prob_norm = normalize_text(str(row.get("Textocódproblem", "") or ""))
    status = str(row.get("Status usuario", "") or "").upper()
    tipo = str(row.get("Tipo de aviso", "") or "")
    full_txt = f"{desc_norm} {prob_norm}"

    tags = [label for label, pat in CRITICAL_TAG_RULES if pat.search(full_txt)]
    if "TAMB" in status and "Corpochivor / CAR" not in tags:
        tags.append("Corpochivor / CAR")

    matched_lex = bool(
        RE_AMBIENTAL.search(full_txt) or RE_ELECTRO.search(full_txt)
        or RE_PREDIAL.search(full_txt) or RE_SERVIDUMBRE.search(full_txt)
        or RE_FORESTAL.search(full_txt)
    )

    if "TAMB" in status or RE_AMBIENTAL.search(full_txt):
        ruta = "r_ambiental"
    elif RE_ELECTRO.search(full_txt) or (tipo == "Obras" and not RE_SERVIDUMBRE.search(full_txt)):
        ruta = "r_electro"
    elif tipo == "Permiso Ingreso" or "no permite el ingreso" in prob_norm or RE_PREDIAL.search(full_txt):
        ruta = "r_predial"
    elif "GERE" in status or RE_SERVIDUMBRE.search(full_txt) or tipo in ("Construcciones", "Invasión/Explanacion"):
        ruta = "r_servidumbre"
    else:
        ruta = "r_campo"

    return ruta, tags, matched_lex
