from flask import Blueprint, jsonify, request, Response

from models import list_runs, get_run, delete_run
from services.export_service import export_run_csv, export_run_xlsx

runs_bp = Blueprint("runs", __name__)


@runs_bp.route("/", methods=["GET"])
def get_runs():
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    runs = list_runs(limit=limit, offset=offset)
    return jsonify(runs)


@runs_bp.route("/<int:run_id>", methods=["GET"])
def get_run_detail(run_id):
    run = get_run(run_id)
    if not run:
        return jsonify({"error": "Run not found"}), 404
    return jsonify(run)


@runs_bp.route("/<int:run_id>/export", methods=["GET"])
def export_run(run_id):
    fmt = request.args.get("format", "csv")

    if fmt == "xlsx":
        data = export_run_xlsx(run_id)
        return Response(
            data,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=llm_compare_run_{run_id}.xlsx"},
        )
    else:
        data = export_run_csv(run_id)
        return Response(
            data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename=llm_compare_run_{run_id}.csv"},
        )


@runs_bp.route("/<int:run_id>", methods=["DELETE"])
def remove_run(run_id):
    deleted = delete_run(run_id)
    if not deleted:
        return jsonify({"error": "Run not found"}), 404
    return jsonify({"status": "ok"})
