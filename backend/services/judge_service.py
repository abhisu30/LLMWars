import json
import logging
import time

logger = logging.getLogger(__name__)

from llmcalls import call_llm
from models import get_setting, get_provider, save_judge_result
from sysprompt import prompts


def run_judge(run_prompt_id, outputs, user_prompt, num_models):
    judge_provider = get_setting("judge_provider") or "openai"
    judge_model = get_setting("judge_model") or "gpt-4o"
    judge_prompt_id = get_setting("judge_prompt_id") or "JG001V1"
    judge_additional_instruction = get_setting("judge_additional_instruction") or ""

    provider_config = get_provider(judge_provider)
    if not provider_config or not provider_config.get("api_key"):
        return {"error": "Judge provider not configured"}

    prompt_template = prompts.get(judge_prompt_id)
    if not prompt_template:
        return {"error": f"Judge prompt '{judge_prompt_id}' not found"}

    max_score = num_models
    labels = ["Model A", "Model B", "Model C"][:num_models]

    model_outputs_text = ""
    for i, output in enumerate(outputs):
        model_outputs_text += f"\n--- {labels[i]} ({output['provider']}/{output['model']}) ---\n"
        model_outputs_text += output.get("output_text") or output.get("text", "[No output]")
        model_outputs_text += "\n"

    evaluations_example = ", ".join(
        f'{{"model_label": "{label}", "score": <int 1-{max_score}>, "comment": "<brief 1-2 sentence assessment>"}}'
        for label in labels
    )
    output_format_example = (
        f'{{"evaluations": [{evaluations_example}], '
        f'"winner": "<Model label with highest score>", '
        f'"judge_reasoning": "<1-2 sentence summary of why the winner was chosen>"}}'
    )

    formatted_prompt = prompt_template["full_prompt"].format(
        user_prompt=user_prompt,
        num_models=num_models,
        max_score=max_score,
        model_outputs=model_outputs_text,
        output_format_example=output_format_example,
    )

    if judge_additional_instruction.strip():
        formatted_prompt += f"\n\n# Additional Instruction (HIGH PRIORITY)\n{judge_additional_instruction.strip()}"

    print("\n" + "="*60)
    print(f"[JUDGE] provider={judge_provider}  model={judge_model}  prompt_id={judge_prompt_id}")
    print("-"*60)
    print(formatted_prompt)
    print("="*60 + "\n")

    start = time.time()
    result = call_llm(
        provider=judge_provider,
        prompt="",
        user_input=formatted_prompt,
        model=judge_model,
        api_key=provider_config["api_key"],
        endpoint=provider_config.get("endpoint"),
    )
    latency_ms = int((time.time() - start) * 1000)

    if result.get("error"):
        return {"error": result["error"]}

    try:
        judge_output = json.loads(result["text"])
    except json.JSONDecodeError:
        text = result["text"]
        start_idx = text.find("{")
        end_idx = text.rfind("}") + 1
        if start_idx >= 0 and end_idx > start_idx:
            try:
                judge_output = json.loads(text[start_idx:end_idx])
            except json.JSONDecodeError:
                logger.error("Judge output parse failed for run_prompt_id=%s", run_prompt_id)
                judge_output = {"parse_error": True}
        else:
            logger.error("Judge output parse failed for run_prompt_id=%s", run_prompt_id)
            judge_output = {"parse_error": True}

    save_judge_result(
        run_prompt_id=run_prompt_id,
        judge_provider=judge_provider,
        judge_model=judge_model,
        judge_prompt_id=judge_prompt_id,
        result_json=judge_output,
        latency_ms=latency_ms,
    )

    return {"result": judge_output, "latency_ms": latency_ms}
