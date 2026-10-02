"""Controlador REST API para EcoGrid Colombia.

Responsabilidad Única:
- Enrutamiento HTTP declarativo para los tableros analíticos.
- Extracción de parámetros de consulta (query params).
- Manejo centralizado de excepciones (HTTP 400 y HTTP 500).
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from flask import Flask, jsonify, request
from flask_cors import CORS

# Path Resolution
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from src.services.analytics_service import (
    get_filter_options,
    get_operations_payload,
    get_portada_kpis,
    get_territory_payload,
)

logger = logging.getLogger("ecogrid.api")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# --- Helpers de Parámetros HTTP ---

def _clean_param(val: Optional[str], max_len: int = 100) -> Optional[str]:
    if val is None:
        return None
    val = val.strip()
    if not val or val == "Todos":
        return None
    if len(val) > max_len:
        raise ValueError(f"Parámetro excede longitud máxima permitida ({max_len} caracteres)")
    return val


def _parse_tipo(tipos_raw: List[str]) -> Optional[Union[str, List[str]]]:
    if not tipos_raw:
        return None
    if len(tipos_raw) == 1 and "," in tipos_raw[0]:
        items = [t.strip() for t in tipos_raw[0].split(",") if t.strip() and t.strip() != "Todos"]
        return items if items else None
    if len(tipos_raw) > 1:
        items = [t.strip() for t in tipos_raw if t.strip() and t.strip() != "Todos"]
        return items if items else None
    return _clean_param(tipos_raw[0])


# --- Manejadores Centralizados de Errores ---

@app.errorhandler(ValueError)
def handle_validation_error(err: ValueError):
    return jsonify({"error": "Parámetro inválido", "detail": str(err)}), 400


@app.errorhandler(Exception)
def handle_unexpected_error(err: Exception):
    logger.exception("Excepción no controlada en endpoint: %s", err)
    return jsonify({"error": "Error interno del servidor", "detail": str(err)}), 500


# --- Endpoints Declarativos ---

@app.route("/api/v1/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "service": "EcoGrid Analytics REST API", "version": "1.0.0"}), 200


@app.route("/api/v1/portada/kpis", methods=["GET"])
def portada_kpis():
    return jsonify(get_portada_kpis()), 200


@app.route("/api/v1/filtros/opciones", methods=["GET"])
def filtros_opciones():
    cte = _clean_param(request.args.get("cte"))
    depto = _clean_param(request.args.get("depto"))
    return jsonify(get_filter_options(cte=cte, depto=depto)), 200


@app.route("/api/v1/operaciones/data", methods=["GET"])
def operaciones_data():
    payload = get_operations_payload(
        cte=_clean_param(request.args.get("cte")),
        tipo=_parse_tipo(request.args.getlist("tipo")),
        depto=_clean_param(request.args.get("depto")),
        municipio=_clean_param(request.args.get("municipio")),
        prioridad=_clean_param(request.args.get("prioridad")),
    )
    return jsonify(payload), 200


@app.route("/api/v1/territorio/data", methods=["GET"])
def territorio_data():
    payload = get_territory_payload(
        cte=_clean_param(request.args.get("cte")),
        depto=_clean_param(request.args.get("depto")),
        municipio=_clean_param(request.args.get("municipio")),
    )
    return jsonify(payload), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
