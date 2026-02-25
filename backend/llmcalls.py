import sys
import requests
import google.generativeai as genai


def _check_response(resp, provider: str):
    """Raise with full API error body instead of just the HTTP status line."""
    if not resp.ok:
        try:
            body = resp.json()
        except Exception:
            body = resp.text
        msg = f"[{provider}] HTTP {resp.status_code}: {body}"
        print(msg, file=sys.stderr, flush=True)
        raise requests.HTTPError(msg, response=resp)


AVAILABLE_MODELS = {
    "openai": [
        # GPT-5 series
        {"id": "gpt-5.2", "name": "GPT-5.2"},
        {"id": "gpt-5.1", "name": "GPT-5.1"},
        {"id": "gpt-5", "name": "GPT-5"},
        {"id": "gpt-5-mini", "name": "GPT-5 Mini"},
        {"id": "gpt-5-nano", "name": "GPT-5 Nano"},
        # GPT-4.1 series
        {"id": "gpt-4.1", "name": "GPT-4.1"},
        {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini"},
        {"id": "gpt-4.1-nano", "name": "GPT-4.1 Nano"},
        # GPT-4o series
        {"id": "gpt-4o", "name": "GPT-4o"},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
        # o-series reasoning models (no temperature — uses reasoning_effort)
        {"id": "o4-mini", "name": "o4 Mini"},
        {"id": "o3-pro", "name": "o3 Pro"},
        {"id": "o3", "name": "o3"},
        {"id": "o3-mini", "name": "o3 Mini"},
    ],
    "gemini": [
        # Gemini 3 series (Preview — Feb 2026)
        {"id": "gemini-3.1-pro-preview", "name": "Gemini 3.1 Pro Preview"},
        {"id": "gemini-3-pro-preview", "name": "Gemini 3 Pro Preview"},
        {"id": "gemini-3-flash-preview", "name": "Gemini 3 Flash Preview"},
        # Gemini 2.5 series (GA / Stable)
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
        {"id": "gemini-2.5-flash-lite", "name": "Gemini 2.5 Flash Lite"},
        # Gemini 2.0 series (deprecated — retiring June 1 2026)
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
        {"id": "gemini-2.0-flash-lite", "name": "Gemini 2.0 Flash Lite"},
    ],
    "claude": [
        # Claude 4.6 generation
        {"id": "claude-opus-4-6", "name": "Claude Opus 4.6"},
        {"id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6"},
        # Claude 4.5 generation
        {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5"},
        {"id": "claude-opus-4-5", "name": "Claude Opus 4.5"},
        {"id": "claude-sonnet-4-5", "name": "Claude Sonnet 4.5"},
        # Claude 4.1 / 4.0 generation
        {"id": "claude-opus-4-1", "name": "Claude Opus 4.1"},
        {"id": "claude-opus-4-0", "name": "Claude Opus 4.0"},
        {"id": "claude-sonnet-4-0", "name": "Claude Sonnet 4.0"},
        # Claude 3.x legacy
        {"id": "claude-3-7-sonnet-20250219", "name": "Claude Sonnet 3.7"},
        {"id": "claude-3-5-sonnet-20241022", "name": "Claude Sonnet 3.5"},
        {"id": "claude-3-5-haiku-20241022", "name": "Claude Haiku 3.5"},
        {"id": "claude-3-opus-20240229", "name": "Claude Opus 3"},
    ],
    "grok": [
        {"id": "grok-3", "name": "Grok 3"},
        {"id": "grok-3-mini", "name": "Grok 3 Mini"},
    ],
}

# o-series models don't support temperature/top_p — use reasoning_effort instead
_O_SERIES_PREFIXES = ("o1", "o3", "o4")


def call_openai(prompt, user_input, model, api_key, endpoint=None, **kwargs):
    url = endpoint or "https://api.openai.com/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    is_o_series = model.startswith(_O_SERIES_PREFIXES)
    messages = []
    if prompt:
        messages.append({"role": "system", "content": prompt})
    messages.append({"role": "user", "content": user_input})
    payload = {"model": model, "messages": messages}
    if is_o_series:
        # o-series: no temperature; use reasoning_effort + max_completion_tokens
        payload["reasoning_effort"] = kwargs.get("reasoning_effort", "medium")
        payload["max_completion_tokens"] = kwargs.get("max_tokens", 8192)
    resp = requests.post(url, json=payload, headers=headers, timeout=120)
    _check_response(resp, "openai")
    data = resp.json()
    return {
        "text": data["choices"][0]["message"]["content"],
        "usage": data.get("usage", {}),
        "model": data.get("model", model),
    }


def call_gemini(prompt, user_input, model, api_key, endpoint=None, **kwargs):
    genai.configure(api_key=api_key)
    gen_model = genai.GenerativeModel(
        model_name=model,
        system_instruction=prompt if prompt else None,
    )
    full_input = user_input
    response = gen_model.generate_content(full_input)
    return {
        "text": response.text,
        "usage": {
            "prompt_tokens": getattr(response.usage_metadata, "prompt_token_count", 0),
            "completion_tokens": getattr(response.usage_metadata, "candidates_token_count", 0),
        },
        "model": model,
    }


def call_claude(prompt, user_input, model, api_key, endpoint=None, **kwargs):
    url = endpoint or "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": kwargs.get("max_tokens", 4096),
        "messages": [{"role": "user", "content": user_input}],
    }
    if prompt:
        payload["system"] = prompt
    resp = requests.post(url, json=payload, headers=headers, timeout=120)
    _check_response(resp, "claude")
    data = resp.json()
    return {
        "text": data["content"][0]["text"],
        "usage": data.get("usage", {}),
        "model": data.get("model", model),
    }


def call_grok(prompt, user_input, model, api_key, endpoint=None, **kwargs):
    return call_openai(
        prompt, user_input, model, api_key,
        endpoint=endpoint or "https://api.x.ai/v1/chat/completions",
        **kwargs,
    )


PROVIDERS = {
    "openai": call_openai,
    "gemini": call_gemini,
    "claude": call_claude,
    "grok": call_grok,
}


def call_llm(provider, prompt, user_input, model, api_key, endpoint=None, **kwargs):
    if provider not in PROVIDERS:
        return {
            "text": "",
            "usage": {},
            "model": model,
            "provider": provider,
            "error": f"Unknown provider: {provider}",
        }
    try:
        result = PROVIDERS[provider](prompt, user_input, model, api_key, endpoint, **kwargs)
        result["provider"] = provider
        result["error"] = None
        return result
    except Exception as e:
        return {
            "text": "",
            "usage": {},
            "model": model,
            "provider": provider,
            "error": str(e),
        }
