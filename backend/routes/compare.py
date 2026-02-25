from flask import Blueprint, jsonify, request

from models import (
    create_run,
    add_run_prompt,
    get_run,
    save_score,
    get_completed_prompts_count,
    get_run_prompts_count,
)
from services.run_service import execute_comparison, start_autorun
from services.judge_service import run_judge
from utils.validators import require_fields, validate_models_config, validate_prompts

compare_bp = Blueprint("compare", __name__)


@compare_bp.route("/run", methods=["POST"])
def single_run():
    data = request.get_json()
    require_fields(data, ["prompt", "models"])
    validate_models_config(data["models"])

    prompt = data["prompt"].strip()
    if not prompt:
        return jsonify({"error": "Prompt cannot be empty"}), 400

    judge_enabled = data.get("judge_enabled", False)
    run_id = create_run("single", data["models"], judge_enabled)
    run_prompt_id = add_run_prompt(run_id, prompt, sequence_num=1)

    results = execute_comparison(prompt, data["models"], run_prompt_id)

    return jsonify({
        "run_id": run_id,
        "run_prompt_id": run_prompt_id,
        "results": results,
    })


@compare_bp.route("/autorun", methods=["POST"])
def autorun():
    data = request.get_json()
    require_fields(data, ["prompts", "models"])
    validate_models_config(data["models"])
    validate_prompts(data["prompts"])

    judge_enabled = data.get("judge_enabled", False)
    run_id = create_run("autorun", data["models"], judge_enabled)

    start_autorun(run_id, data["prompts"], data["models"], judge_enabled)

    return jsonify({"run_id": run_id, "status": "running"})


@compare_bp.route("/autorun/<int:run_id>/status", methods=["GET"])
def autorun_status(run_id):
    run = get_run(run_id)
    if not run:
        return jsonify({"error": "Run not found"}), 404

    total = len(run.get("prompts", []))
    completed = get_completed_prompts_count(run_id)

    return jsonify({
        "run_id": run_id,
        "status": run["status"],
        "completed": completed,
        "total": total,
        "prompts": run.get("prompts", []),
    })


@compare_bp.route("/score", methods=["POST"])
def submit_score():
    data = request.get_json()
    require_fields(data, ["run_prompt_id", "scores"])

    scores = data["scores"]
    if not isinstance(scores, list):
        return jsonify({"error": "Scores must be a list"}), 400

    for s in scores:
        require_fields(s, ["model_label", "score", "comment"])
        save_score(
            run_prompt_id=data["run_prompt_id"],
            model_label=s["model_label"],
            score=s["score"],
            comment=s["comment"],
        )

    return jsonify({"status": "ok"})


@compare_bp.route("/judge", methods=["POST"])
def invoke_judge():
    data = request.get_json()
    require_fields(data, ["run_prompt_id"])

    run_prompt_id = data["run_prompt_id"]

    # Get outputs for this prompt
    from models import get_db
    import psycopg2.extras

    conn = get_db()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM run_outputs WHERE run_prompt_id = %s ORDER BY id", (run_prompt_id,))
        outputs = list(cur.fetchall())
        cur.execute("SELECT prompt_text FROM run_prompts WHERE id = %s", (run_prompt_id,))
        prompt_row = cur.fetchone()
    finally:
        conn.close()

    if not outputs or not prompt_row:
        return jsonify({"error": "No outputs found for this prompt"}), 404

    result = run_judge(
        run_prompt_id=run_prompt_id,
        outputs=outputs,
        user_prompt=prompt_row["prompt_text"],
        num_models=len(outputs),
    )

    return jsonify(result)
