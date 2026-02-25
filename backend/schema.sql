-- Provider configurations (admin panel)
CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    api_key TEXT,
    endpoint TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings (judge model, etc.)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Comparison runs
CREATE TABLE IF NOT EXISTS runs (
    id SERIAL PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'single',
    judge_enabled BOOLEAN DEFAULT FALSE,
    models_config JSONB NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual prompts within a run
CREATE TABLE IF NOT EXISTS run_prompts (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    sequence_num INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM outputs (2-3 per run_prompt)
CREATE TABLE IF NOT EXISTS run_outputs (
    id SERIAL PRIMARY KEY,
    run_prompt_id INTEGER NOT NULL REFERENCES run_prompts(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    output_text TEXT,
    usage_data JSONB,
    latency_ms INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User scores (one per run_prompt per model)
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    run_prompt_id INTEGER NOT NULL REFERENCES run_prompts(id) ON DELETE CASCADE,
    model_label TEXT NOT NULL,
    score INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Judge results (one per run_prompt)
CREATE TABLE IF NOT EXISTS judge_results (
    id SERIAL PRIMARY KEY,
    run_prompt_id INTEGER NOT NULL REFERENCES run_prompts(id) ON DELETE CASCADE,
    judge_provider TEXT NOT NULL,
    judge_model TEXT NOT NULL,
    judge_prompt_id TEXT,
    result_json JSONB NOT NULL,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default providers
INSERT INTO providers (name, display_name) VALUES
    ('openai', 'OpenAI'),
    ('gemini', 'Google Gemini'),
    ('claude', 'Anthropic Claude'),
    ('grok', 'xAI Grok')
ON CONFLICT (name) DO NOTHING;

-- Seed default settings
INSERT INTO settings (key, value) VALUES
    ('judge_provider', 'openai'),
    ('judge_model', 'gpt-4o'),
    ('judge_prompt_id', 'JG001V1')
ON CONFLICT (key) DO NOTHING;
