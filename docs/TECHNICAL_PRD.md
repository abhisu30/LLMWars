# Technical PRD: LLM Compare

---

## 1. Architecture Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + Vite + TypeScript | SPA communicating with Flask API |
| Styling | Tailwind CSS + shadcn/ui | Dark mode via Tailwind `class` strategy |
| Backend | Python Flask (Blueprints) | Application factory pattern |
| Database | PostgreSQL via Supabase | Free tier, cloud-hosted, JSONB for flexible data |
| LLM Integration | `llmcalls.py` (single file) | Provider registry pattern |
| AI Judge Prompts | `sysprompt.py` | Dict structure matching `sysPrompts_sample.py` |
| Hosting | Railway (single host) or Render + Vercel | Free tier targets |

---

## 2. Frontend

### 2.1 Why React + Vite + Tailwind + shadcn/ui

- **Flask pairing:** React SPA talks to Flask via REST. Clean separation — Flask is purely an API server.
- **Resizable panels:** `react-resizable-panels` provides adjustable side-by-side layout for 2-3 LLM output columns.
- **Dark mode:** Tailwind has first-class dark mode via `class` strategy. shadcn/ui (built on Radix UI + Tailwind) supports it out of the box.
- **Modern, zero bloat:** shadcn/ui copies components into your project — no runtime dependency, full customization.
- **Free hosting:** Vite builds to static files, deployable to Vercel/Netlify/GitHub Pages at zero cost.

### 2.2 Key Libraries

| Library | Purpose |
|---------|---------|
| `react` + `react-dom` 18.x | Core UI |
| `vite` | Build tool |
| `tailwindcss` + `shadcn/ui` | Styling and component library |
| `react-resizable-panels` | Adjustable panel widths for output comparison |
| `@tanstack/react-query` | Server state management (caching, loading, refetch) |
| `react-router-dom` | Client-side routing |
| `xlsx` | Client-side XLSX export (or delegated to backend) |
| `lucide-react` | Icons (used by shadcn/ui) |

### 2.3 Pages and Routing

| Route | Page | Description |
|-------|------|-------------|
| `/` | ComparePage | Main comparison view — prompt input, model selection, output panels, scoring |
| `/admin` | AdminPage | Provider configuration, judge model selection |
| `/history` | HistoryPage | Past runs, export |

### 2.4 Component Hierarchy (ComparePage)

```
ComparePage
├── ModeToggle (Single / Autorun)
├── ModelSelector (x2 or x3 dropdowns: provider + model)
├── PromptInput (single mode: one textarea)
│   OR PromptListInput (autorun: numbered textareas, max 10)
├── [Run Button]
├── CompareGrid (react-resizable-panels container)
│   ├── OutputPanel (per model)
│   │   ├── ModelHeader (provider icon, model name, latency badge)
│   │   └── OutputContent (scrollable text/markdown)
├── ScoringForm
│   ├── ScoreDropdown (per model: 1-3 or 1-2 scale)
│   ├── CommentTextarea (mandatory, per model)
│   └── [Submit Score Button]
├── JudgeToggle (on/off switch)
├── JudgeResult (expandable card: judge scores + comments)
├── ContinueButton (enabled only when scoring complete)
└── AutorunProgress (autorun mode: progress bar, current prompt)
```

### 2.5 State Management

| Concern | Approach |
|---------|----------|
| Theme (light/dark) | `ThemeContext` via React Context, persisted to `localStorage` |
| Server data (runs, providers, outputs) | TanStack Query (`@tanstack/react-query`) |
| Local UI state (selected models, form values, panel sizes) | `useState` within components |

No global store (Redux/Zustand) needed at MVP scale.

### 2.6 Key Custom Hooks

- **`useCompare()`** — wraps `POST /api/compare/run` mutation. Manages lifecycle: submit prompt → receive outputs → enable scoring.
- **`useAutorun()`** — submits `POST /api/compare/autorun`, polls `GET /api/compare/autorun/{id}/status` until complete.

---

## 3. Backend

### 3.1 Flask Application Structure

Uses the **application factory pattern** with Blueprints for modularity.

```python
# app.py
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    CORS(app)
    init_db(app)
    app.register_blueprint(compare_bp, url_prefix='/api/compare')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(runs_bp, url_prefix='/api/runs')
    register_error_handlers(app)
    return app
```

### 3.2 `llmcalls.py` — Provider Registry Pattern

All LLM provider calls live in this single file. Uses a **registry dict** mapping provider names to call functions.

**Structure:**

```python
# One function per provider, identical signatures
def call_openai(prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict:
    ...

def call_gemini(prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict:
    ...

def call_claude(prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict:
    ...

def call_grok(prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict:
    # Grok uses OpenAI-compatible format
    return call_openai(prompt, user_input, model, api_key, endpoint or "https://api.x.ai/v1/chat/completions", **kwargs)

# Registry
PROVIDERS = {
    "openai": call_openai,
    "gemini": call_gemini,
    "claude": call_claude,
    "grok": call_grok,
}

# Unified entry point — all routes call this
def call_llm(provider, prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict:
    """Returns: {"text": str, "usage": dict, "model": str, "provider": str, "error": str|None}"""
    ...
```

**Key design rules:**
- Every provider function returns `{"text": str, "usage": dict, "model": str}`
- Errors are caught and returned in the result dict (not raised) — partial failures don't kill the comparison
- Adding a new provider = add one function + one registry entry

### 3.3 `sysprompt.py` — AI Judge Prompts

Follows the exact structure from `sysPrompts_sample.py`. Keys use `JG` prefix (Judge) instead of `PA`.

```python
# sysprompt.py
prompts = {
    "JG001V1": {
        "summary": "General comparison judge - evaluates multiple LLM outputs",
        "best_model": "GPT-4o",
        "full_prompt": """
            # Role
            You are an impartial AI judge evaluating outputs from multiple language models.

            # Task
            You will receive:
            - The original user prompt
            - Outputs from {num_models} different AI models (labeled Model A, Model B, etc.)

            # Evaluation Criteria
            Score each output on a 1-{max_score} scale:
            ...

            # Output Format
            Return JSON:
            {
              "evaluations": [
                {
                  "model_label": "Model A",
                  "score": <int>,
                  "comment": "<brief assessment>"
                }
              ],
              "winner": "<Model label with highest score>",
              "judge_reasoning": "<1-2 sentence summary>"
            }

            # Input
            Original prompt: {user_prompt}
            {model_outputs}
        """
    },
    "JG002V1": {
        "summary": "Code-focused comparison judge",
        "best_model": "GPT-4o",
        "full_prompt": """..."""
    }
}
```

**Template placeholders:** `{user_prompt}`, `{num_models}`, `{max_score}`, `{model_outputs}` — formatted by `judge_service.py` before calling `call_llm()`.

### 3.4 Services Layer

| Service | File | Responsibility |
|---------|------|---------------|
| Judge | `services/judge_service.py` | Format judge prompt, call `llmcalls.call_llm()`, parse response |
| Export | `services/export_service.py` | Generate CSV/XLSX from run data |
| Run | `services/run_service.py` | Create runs, save outputs, orchestrate parallel LLM calls |

### 3.5 Utilities

| File | Purpose |
|------|---------|
| `utils/errors.py` | Custom exception classes (`LLMWarsError`, `ProviderError`, `ValidationError`), centralized error handlers |
| `utils/validators.py` | Input validation helpers for API requests |

---

## 4. API Endpoints

### 4.1 Compare (`/api/compare`)

| Method | Endpoint | Body / Query | Description |
|--------|----------|-------------|-------------|
| POST | `/run` | `{prompt, models: [{provider, model}], judge_enabled: bool}` | Single prompt comparison. Calls 2-3 LLMs in parallel, returns outputs. |
| POST | `/autorun` | `{prompts: [str], models: [{provider, model}], judge_enabled: bool}` | Submit up to 10 prompts. Returns `{run_id}`. |
| GET | `/autorun/{run_id}/status` | — | Poll autorun progress: `{status, completed, total, results}` |
| POST | `/score` | `{run_prompt_id, scores: {model_label: int}, comment: str}` | Submit mandatory user scores |
| POST | `/judge` | `{run_prompt_id}` | Invoke AI judge for a specific prompt's outputs |

### 4.2 Admin (`/api/admin`)

| Method | Endpoint | Body / Query | Description |
|--------|----------|-------------|-------------|
| GET | `/providers` | — | List all providers (API keys masked) |
| PUT | `/providers/{name}` | `{api_key, endpoint, is_active}` | Update provider config |
| GET | `/settings` | — | Get app settings (judge model, judge prompt ID) |
| PUT | `/settings` | `{judge_provider, judge_model, judge_prompt_id}` | Update settings |
| GET | `/models/{provider}` | — | List available models for a provider |

### 4.3 Runs (`/api/runs`)

| Method | Endpoint | Body / Query | Description |
|--------|----------|-------------|-------------|
| GET | `/` | `?limit=50&offset=0` | List all runs with pagination |
| GET | `/{run_id}` | — | Full run detail with prompts, outputs, scores, judge results |
| GET | `/{run_id}/export` | `?format=csv` or `?format=xlsx` | Export run data as file download |
| DELETE | `/{run_id}` | — | Delete a run and all associated data |

---

## 5. Database Schema (PostgreSQL / Supabase)

```sql
-- Provider configurations (admin panel)
CREATE TABLE providers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,            -- "openai", "gemini", "claude", "grok"
    display_name TEXT NOT NULL,           -- "OpenAI", "Google Gemini", etc.
    api_key TEXT,
    endpoint TEXT,                        -- custom endpoint URL (nullable)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- App settings (judge model, etc.)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Comparison runs
CREATE TABLE runs (
    id SERIAL PRIMARY KEY,
    mode TEXT NOT NULL DEFAULT 'single',  -- "single" or "autorun"
    judge_enabled BOOLEAN DEFAULT FALSE,
    models_config JSONB NOT NULL,         -- [{provider, model}, ...]
    status TEXT DEFAULT 'pending',        -- "pending", "running", "completed", "failed"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual prompts within a run
CREATE TABLE run_prompts (
    id SERIAL PRIMARY KEY,
    run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    prompt_text TEXT NOT NULL,
    sequence_num INTEGER DEFAULT 1,       -- 1-10, ordering within autorun
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LLM outputs (2-3 per run_prompt)
CREATE TABLE run_outputs (
    id SERIAL PRIMARY KEY,
    run_prompt_id INTEGER NOT NULL REFERENCES run_prompts(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    output_text TEXT,
    usage_data JSONB,                     -- {"prompt_tokens": N, "completion_tokens": N, ...}
    latency_ms INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User scores (one per run_prompt per model)
CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    run_prompt_id INTEGER NOT NULL REFERENCES run_prompts(id) ON DELETE CASCADE,
    model_label TEXT NOT NULL,            -- "Model A", "Model B", etc.
    score INTEGER NOT NULL,              -- 1-3 (or 1-2 for 2 models)
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Judge results (one per run_prompt)
CREATE TABLE judge_results (
    id SERIAL PRIMARY KEY,
    run_prompt_id INTEGER NOT NULL REFERENCES run_prompts(id) ON DELETE CASCADE,
    judge_provider TEXT NOT NULL,
    judge_model TEXT NOT NULL,
    judge_prompt_id TEXT,                 -- e.g., "JG001V1"
    result_json JSONB NOT NULL,           -- Full judge output
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.1 Supabase Connection

```python
# config.py
import os

class Config:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_DB_URL = os.environ.get("DATABASE_URL")  # PostgreSQL connection string
    # Format: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

Connect via `psycopg2` for direct SQL queries (lightweight, no ORM overhead for MVP).

---

## 6. Key Technical Decisions

### 6.1 Parallel LLM Calls

Use `concurrent.futures.ThreadPoolExecutor` to call 2-3 models simultaneously per comparison:

```python
from concurrent.futures import ThreadPoolExecutor, as_completed

def execute_comparison(prompt, models_config):
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = {executor.submit(call_single, cfg): cfg for cfg in models_config}
        results = [future.result() for future in as_completed(futures)]
    return results
```

Preferable over async/await because Flask is synchronous by default. ThreadPoolExecutor is trivial for I/O-bound HTTP calls.

### 6.2 Autorun Sequential Processing

- `POST /api/compare/autorun` creates a run, returns `{run_id}` immediately
- A background thread processes prompts one at a time (avoids rate limiting)
- For each prompt, the 2-3 model calls happen in parallel via ThreadPoolExecutor
- Frontend polls `/autorun/{run_id}/status` every 2-3 seconds
- Each completed prompt's results are written to DB immediately for partial progress

### 6.3 Error Isolation

Individual model failures return an error in the result dict rather than raising exceptions. If Claude fails but OpenAI and Gemini succeed, the user sees two results plus an error for Claude.

### 6.4 Export

- Backend generates CSV via Python `csv` stdlib and XLSX via `openpyxl`
- Export endpoint returns file download with `Content-Disposition` header
- Columns: timestamp, prompt, [Model Name] output/score/notes/judge for each model

### 6.5 API Key Security (MVP)

- Keys stored as plaintext in Supabase (acceptable for single-user tool, not multi-tenant)
- `/api/admin/providers` GET masks keys (shows last 4 chars only)
- Post-MVP: encrypt at rest with `cryptography.fernet`

### 6.6 CORS

If deploying frontend and backend separately:
```python
CORS(app, origins=["https://your-frontend.vercel.app"])
```

If deploying as single app (Railway), Flask serves the React build from `frontend/dist` — no CORS needed.

---

## 7. Project Structure

```
LLMWars/
├── backend/
│   ├── app.py                    # Flask app factory, CORS, blueprint registration
│   ├── config.py                 # App config, Supabase connection, environment vars
│   ├── llmcalls.py               # ALL LLM provider calls (single file)
│   ├── sysprompt.py              # AI Judge prompts (dict structure)
│   ├── models.py                 # Data access layer (psycopg2 queries)
│   ├── schema.sql                # PostgreSQL schema
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── compare.py            # /api/compare endpoints
│   │   ├── admin.py              # /api/admin endpoints
│   │   └── runs.py               # /api/runs endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── judge_service.py      # AI Judge orchestration
│   │   ├── export_service.py     # CSV/XLSX generation
│   │   └── run_service.py        # Run creation, scoring, parallel LLM calls
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── errors.py             # Custom exceptions, error handlers
│   │   └── validators.py         # Input validation
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── api/
│       │   ├── client.ts         # Fetch wrapper, base URL config
│       │   ├── compare.ts        # Compare API calls
│       │   ├── admin.ts          # Admin API calls
│       │   └── runs.ts           # Runs/history API calls
│       ├── components/
│       │   ├── ui/               # shadcn/ui components
│       │   ├── layout/
│       │   │   ├── Header.tsx
│       │   │   └── ThemeToggle.tsx
│       │   ├── compare/
│       │   │   ├── PromptInput.tsx
│       │   │   ├── ModelSelector.tsx
│       │   │   ├── OutputPanel.tsx
│       │   │   ├── CompareGrid.tsx
│       │   │   ├── ScoringForm.tsx
│       │   │   ├── JudgeToggle.tsx
│       │   │   └── JudgeResult.tsx
│       │   ├── autorun/
│       │   │   ├── PromptListInput.tsx
│       │   │   └── AutorunProgress.tsx
│       │   ├── history/
│       │   │   ├── RunsTable.tsx
│       │   │   └── RunDetail.tsx
│       │   └── admin/
│       │       ├── ProviderConfig.tsx
│       │       └── JudgeConfig.tsx
│       ├── pages/
│       │   ├── ComparePage.tsx
│       │   ├── HistoryPage.tsx
│       │   └── AdminPage.tsx
│       ├── context/
│       │   └── ThemeContext.tsx
│       ├── hooks/
│       │   ├── useCompare.ts
│       │   └── useAutorun.ts
│       └── lib/
│           ├── utils.ts          # shadcn/ui cn() utility
│           └── export.ts         # Client-side export helpers
├── sysPrompts_sample.py          # Reference file (existing)
├── CLAUDE.md
├── README.md
└── .gitignore
```

---

## 8. Hardcoded Model List (MVP)

```python
# In llmcalls.py or a separate models_config.py

AVAILABLE_MODELS = {
    "openai": [
        {"id": "gpt-4o", "name": "GPT-4o"},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini"},
        {"id": "gpt-4.1", "name": "GPT-4.1"},
        {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini"},
        {"id": "gpt-4.1-nano", "name": "GPT-4.1 Nano"},
    ],
    "gemini": [
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash"},
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro"},
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash"},
    ],
    "claude": [
        {"id": "claude-sonnet-4-6", "name": "Claude Sonnet 4.6"},
        {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5"},
        {"id": "claude-opus-4-6", "name": "Claude Opus 4.6"},
    ],
    "grok": [
        {"id": "grok-3", "name": "Grok 3"},
        {"id": "grok-3-mini", "name": "Grok 3 Mini"},
    ],
}
```

---

## 9. Hosting

### Recommended: Railway (single host)

- Flask serves the React build from `frontend/dist` as static files
- One deploy, one URL, no CORS issues
- Free tier: $5/month usage credits (sufficient for low-traffic tool)
- Connects to Supabase PostgreSQL via connection string in env vars

### Alternative: Render (backend) + Vercel (frontend)

- Render free tier: 750 hrs/month for Flask backend
- Vercel free tier: static SPA hosting (100 GB bandwidth)
- Requires CORS configuration

---

## 10. Implementation Build Order

| Step | Task | Dependencies |
|------|------|-------------|
| 1 | Backend foundation: `app.py`, `config.py`, `models.py`, `schema.sql` | None |
| 2 | Admin API: `routes/admin.py` — provider CRUD, settings | Step 1 |
| 3 | `llmcalls.py`: implement all four providers, test independently | Step 1 |
| 4 | Compare API: `routes/compare.py` — single prompt mode, parallel calls | Steps 2, 3 |
| 5 | Frontend scaffold: Vite + React + Tailwind + shadcn/ui, router, theme | None (parallel with 1-4) |
| 6 | Admin page: provider config forms connected to admin API | Steps 2, 5 |
| 7 | Compare page: model selectors, prompt input, resizable output panels | Steps 4, 5 |
| 8 | Scoring flow: ScoringForm component, score submission API, validation | Step 7 |
| 9 | `sysprompt.py` + judge: judge prompts, `judge_service.py`, toggle + results UI | Steps 3, 8 |
| 10 | Autorun mode: backend sequential processing, frontend polling + progress | Steps 8, 9 |
| 11 | History page: runs list, run detail view | Step 4 |
| 12 | Export: backend CSV/XLSX generation, frontend download buttons | Step 11 |
| 13 | Polish: error toasts, loading skeletons, responsive layout, dark mode | All |

---

## 11. Dependencies

### Backend (`requirements.txt`)

```
flask>=3.0
flask-cors>=4.0
psycopg2-binary>=2.9
requests>=2.31
openpyxl>=3.1
python-dotenv>=1.0
```

### Frontend (`package.json` key deps)

```json
{
  "react": "^18.3",
  "react-dom": "^18.3",
  "react-router-dom": "^7.0",
  "@tanstack/react-query": "^5.0",
  "react-resizable-panels": "^2.0",
  "tailwindcss": "^3.4",
  "lucide-react": "^0.400",
  "xlsx": "^0.18"
}
```
