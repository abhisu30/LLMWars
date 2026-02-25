import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from llmcalls import call_llm
from models import (
    get_provider,
    add_run_output,
    add_run_prompt,
    update_run_status,
)


def execute_comparison(prompt_text, models_config, run_prompt_id):
    """Call 2-3 LLMs in parallel for a single prompt. Returns list of result dicts."""

    def call_single(cfg):
        provider_config = get_provider(cfg["provider"])
        if not provider_config or not provider_config.get("api_key"):
            return {
                "text": "",
                "usage": {},
                "model": cfg["model"],
                "provider": cfg["provider"],
                "error": f"Provider '{cfg['provider']}' not configured",
                "latency_ms": 0,
            }

        start = time.time()
        result = call_llm(
            provider=cfg["provider"],
            prompt="",
            user_input=prompt_text,
            model=cfg["model"],
            api_key=provider_config["api_key"],
            endpoint=provider_config.get("endpoint"),
        )
        result["latency_ms"] = int((time.time() - start) * 1000)
        return result

    results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_cfg = {executor.submit(call_single, cfg): cfg for cfg in models_config}
        for future in as_completed(future_to_cfg):
            result = future.result()
            output_id = add_run_output(
                run_prompt_id=run_prompt_id,
                provider=result["provider"],
                model=result["model"],
                output_text=result.get("text", ""),
                usage_data=result.get("usage"),
                latency_ms=result.get("latency_ms", 0),
                error=result.get("error"),
            )
            result["output_id"] = output_id
            results.append(result)

    return results


def start_autorun(run_id, prompts, models_config, judge_enabled=False):
    """Start autorun in a background thread. Processes prompts sequentially."""

    def _run():
        try:
            for i, prompt_text in enumerate(prompts):
                run_prompt_id = add_run_prompt(run_id, prompt_text, sequence_num=i + 1)
                execute_comparison(prompt_text, models_config, run_prompt_id)
            update_run_status(run_id, "completed")
        except Exception:
            update_run_status(run_id, "failed")

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
