import csv
import io

from openpyxl import Workbook

from models import get_run


def _build_export_rows(run_id):
    """Build flat rows for export from a run."""
    run = get_run(run_id)
    if not run:
        return [], []

    # Determine model labels
    models_config = run.get("models_config", [])
    if isinstance(models_config, str):
        import json
        models_config = json.loads(models_config)

    labels = ["Model A", "Model B", "Model C"]

    # Build header
    header = ["Timestamp", "Mode", "Prompt #", "Prompt"]
    for i, cfg in enumerate(models_config):
        label = f"{cfg['provider']}/{cfg['model']}"
        header.append(f"{label} Output")
        header.append(f"{label} User Score")
        header.append(f"{label} User Notes")
        if run.get("judge_enabled"):
            header.append(f"{label} AI Judge Score")
            header.append(f"{label} AI Judge Notes")

    rows = []
    for prompt in run.get("prompts", []):
        row = [
            str(run.get("created_at", "")),
            run.get("mode", ""),
            prompt.get("sequence_num", 1),
            prompt.get("prompt_text", ""),
        ]

        outputs = prompt.get("outputs", [])
        scores = prompt.get("scores", [])
        judge_results = prompt.get("judge_results", [])

        # Parse judge result
        judge_evaluations = {}
        if judge_results:
            jr = judge_results[0].get("result_json", {})
            if isinstance(jr, str):
                import json
                try:
                    jr = json.loads(jr)
                except json.JSONDecodeError:
                    jr = {}
            for ev in jr.get("evaluations", []):
                judge_evaluations[ev.get("model_label", "")] = ev

        for i, cfg in enumerate(models_config):
            # Find matching output
            output = next(
                (o for o in outputs if o["provider"] == cfg["provider"] and o["model"] == cfg["model"]),
                None,
            )
            row.append(output.get("output_text", "") if output else "")

            # Find matching score
            label = labels[i]
            score_entry = next((s for s in scores if s["model_label"] == label), None)
            row.append(score_entry.get("score", "") if score_entry else "")
            row.append(score_entry.get("comment", "") if score_entry else "")

            if run.get("judge_enabled"):
                judge_ev = judge_evaluations.get(label, {})
                row.append(judge_ev.get("score", ""))
                row.append(judge_ev.get("comment", ""))

        rows.append(row)

    return header, rows


def export_run_csv(run_id):
    header, rows = _build_export_rows(run_id)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)
    return output.getvalue().encode("utf-8")


def export_run_xlsx(run_id):
    header, rows = _build_export_rows(run_id)
    wb = Workbook()
    ws = wb.active
    ws.title = "LLM Compare Results"
    ws.append(header)
    for row in rows:
        ws.append(row)
    output = io.BytesIO()
    wb.save(output)
    return output.getvalue()
