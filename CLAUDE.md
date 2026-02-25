# LLM Compare (LLMWars)

## What This Is
A web app for comparing 2-3 LLM outputs side by side with mandatory scoring, optional AI judging, and CSV/XLSX export.

## Architecture
- **Backend:** Python Flask (app factory + Blueprints) at `backend/`
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui at `frontend/`
- **Database:** PostgreSQL via Supabase (connection string in `DATABASE_URL` env var)

## Critical Files

### Backend
| File | Purpose |
|------|---------|
| `backend/llmcalls.py` | ALL LLM provider calls. Single file, provider registry pattern. Never split across files. |
| `backend/sysprompt.py` | AI Judge prompts. Must follow the dict structure in `sysPrompts_sample.py`. |
| `backend/app.py` | Flask app factory. Registers blueprints and error handlers. |
| `backend/models.py` | Data access layer. Raw `psycopg2` queries, no ORM. |
| `backend/routes/compare.py` | Core comparison logic — prompt submission, parallel LLM calls, scoring. |
| `backend/routes/admin.py` | Provider CRUD, settings management. |
| `backend/routes/runs.py` | History, run details, export. |
| `backend/services/judge_service.py` | Formats judge prompts from `sysprompt.py` and calls `llmcalls.call_llm()`. |
| `backend/services/export_service.py` | Generates CSV/XLSX files from run data. |

### Frontend
| File | Purpose |
|------|---------|
| `frontend/src/pages/ComparePage.tsx` | Main comparison UI — model selectors, outputs, scoring. |
| `frontend/src/pages/AdminPage.tsx` | Provider and judge configuration. |
| `frontend/src/components/compare/CompareGrid.tsx` | Resizable panel layout for side-by-side outputs. |

## Conventions

### `sysprompt.py` Dict Structure
Follow this exact pattern (matches `sysPrompts_sample.py`):
```python
prompts = {
    "JG001V1": {
        "summary": "Short description",
        "best_model": "GPT-4o",
        "full_prompt": """..."""
    }
}
```
- Keys: `JG` prefix for judge prompts, version suffix like `V1`, `V2`
- Template placeholders: `{user_prompt}`, `{num_models}`, `{max_score}`, `{model_outputs}`

### `llmcalls.py` Provider Pattern
- One function per provider with identical signature: `(prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict`
- Returns: `{"text": str, "usage": dict, "model": str}`
- Errors caught and returned in dict, never raised — partial failures must not kill the comparison
- `PROVIDERS` registry dict maps provider names to functions
- `call_llm()` is the single entry point for all routes and services
- Adding a new provider = one function + one registry entry

### Backend Rules
- Flask app factory pattern in `app.py`
- Three blueprints: `compare`, `admin`, `runs`
- Parallel LLM calls via `concurrent.futures.ThreadPoolExecutor` (max 3 workers)
- Autorun: sequential prompts, parallel model calls per prompt, background thread
- API keys masked in GET responses (show last 4 chars only)

### Frontend Rules
- State: React Context for theme, TanStack Query for server data, useState for UI
- Resizable panels via `react-resizable-panels`
- Dark mode via Tailwind `class` strategy
- shadcn/ui for all UI components

## Key Business Rules
- User scoring is **mandatory** for every run — score + comment per model
- Continue button only activates after all scores + comments are submitted (and judge if enabled)
- AI Judge is toggled by user, but judge model is configured by admin only
- All runs must persist to database even if not exported
- Score scale: 1-3 for 3 models, 1-2 for 2 models (higher = better)

## Environment Variables
```
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
FLASK_SECRET_KEY=...
```
Provider API keys are stored in the `providers` database table, configured via admin panel.
