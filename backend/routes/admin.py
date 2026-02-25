from flask import Blueprint, jsonify, request

from llmcalls import AVAILABLE_MODELS
from models import get_providers, upsert_provider, get_settings, set_setting

admin_bp = Blueprint("admin", __name__)


def mask_key(key):
    if not key:
        return None
    if len(key) <= 8:
        return "****" + key[-4:]
    return key[:4] + "****" + key[-4:]


@admin_bp.route("/providers", methods=["GET"])
def list_providers():
    providers = get_providers()
    for p in providers:
        p["api_key"] = mask_key(p.get("api_key"))
    return jsonify(providers)


@admin_bp.route("/providers/<name>", methods=["PUT"])
def update_provider(name):
    data = request.get_json()
    upsert_provider(
        name,
        api_key=data.get("api_key"),
        endpoint=data.get("endpoint"),
        is_active=data.get("is_active"),
    )
    return jsonify({"status": "ok"})


@admin_bp.route("/settings", methods=["GET"])
def get_app_settings():
    settings = get_settings()
    return jsonify(settings)


@admin_bp.route("/settings", methods=["PUT"])
def update_settings():
    data = request.get_json()
    for key in ["judge_provider", "judge_model", "judge_prompt_id"]:
        if key in data:
            set_setting(key, data[key])
    return jsonify({"status": "ok"})


@admin_bp.route("/models/<provider>", methods=["GET"])
def list_models(provider):
    models = AVAILABLE_MODELS.get(provider, [])
    return jsonify(models)
