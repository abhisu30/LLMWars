# Contributing to LLM Compare

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- A Supabase account (free tier works) — [supabase.com](https://supabase.com)
- At least one LLM provider API key for testing

### Fork and Clone

```bash
git clone https://www.github.com/abhisu30/LLMWars.git
cd LLMWars
```

### Backend

```bash
cd backend
python -m venv venv

# Activate the virtual environment:
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env — add your DATABASE_URL and a random FLASK_SECRET_KEY
python app.py
```

The backend starts on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and proxies all `/api/*` requests to the Flask backend.

---

## Code Conventions

### Adding a New LLM Provider

All provider calls live in a single file: `backend/llmcalls.py`.

1. Write one function with this exact signature:

   ```python
   def call_myprovider(prompt, user_input, model, api_key, endpoint=None, **kwargs) -> dict:
       try:
           # ... call the API ...
           return {"text": response_text, "usage": usage_dict, "model": model}
       except Exception as e:
           return {"text": f"Error: {str(e)}", "usage": {}, "model": model}
   ```

   - Return `{"text": str, "usage": dict, "model": str}` — always.
   - Catch all exceptions and return them in the dict. **Never raise.** A provider failure must not kill the rest of the comparison.

2. Add an entry to the `PROVIDERS` registry in the same file:

   ```python
   PROVIDERS = {
       "myprovider": call_myprovider,
       # ...
   }
   ```

3. Add the provider to `backend/schema.sql` and seed it in `backend/models.py`.

### Backend Rules

- Flask app factory pattern — register blueprints in `backend/app.py`, never modify the factory directly.
- Three blueprints only: `compare`, `admin`, `runs`. All routes belong in one of these.
- Database access goes in `backend/models.py` — raw `psycopg2`, no ORM.
- API keys must be masked in GET responses (show last 4 characters only).
- Parallel LLM calls use `concurrent.futures.ThreadPoolExecutor` (max 3 workers).

### Frontend Rules

- Server state: TanStack Query (`useQuery` / `useMutation`).
- UI state: `useState` or context.
- All UI components: shadcn/ui primitives.
- All API calls go through the typed client functions in `frontend/src/api/`.
- Dark mode via Tailwind `class` strategy — use `ThemeContext`.

### AI Judge Prompts (`backend/sysprompt.py`)

Follow the exact dict structure from `sysPrompts_sample.py`:

```python
prompts = {
    "JG001V1": {
        "summary": "Short description",
        "best_model": "GPT-4o",
        "full_prompt": """..."""
    }
}
```

- Keys: `JG` prefix for judge prompts, version suffix like `V1`, `V2`.
- Template placeholders: `{user_prompt}`, `{num_models}`, `{max_score}`, `{model_outputs}`.

---

## Submitting a Pull Request

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes and test locally.
3. Ensure the backend starts cleanly (`python app.py`) and the frontend builds without errors (`npm run build`).
4. Push your branch and open a PR against `main`.
5. Fill out the PR template.

### What Makes a Good PR

- Small, focused changes are merged faster than large ones.
- Include a clear description of what changed and why.
- If you're adding a new provider, include the function, registry entry, and schema update in the same PR.

---

## Reporting Issues

Use GitHub Issues with the appropriate template:

- **Bug reports** — include steps to reproduce and relevant logs.
- **Feature requests** — describe the problem you're trying to solve.

For security vulnerabilities, see [SECURITY.md](SECURITY.md) — do **not** open a public issue.
