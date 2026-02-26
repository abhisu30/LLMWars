# LLM Compare

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![CI](https://github.com/abhisu30/LLMWars/actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

A modular web application for comparing outputs from 2-3 LLMs side by side, with mandatory scoring, optional AI judging, and CSV/XLSX export.

## Tech Stack

- **Backend:** Python Flask (REST API)
- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **LLM Providers:** OpenAI, Google Gemini, Anthropic Claude, xAI Grok

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Supabase account** (free tier) — [supabase.com](https://supabase.com)
- At least one LLM provider API key (OpenAI, Gemini, Claude, or Grok)

## Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd LLMWars
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > Database** and copy the **Connection string (URI)**
3. It will look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`

### 3. Backend setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env` and fill in your values:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
FLASK_SECRET_KEY=any-random-string-here
FLASK_DEBUG=1
```

### 4. Frontend setup

```bash
cd frontend
npm install
```

## Running Locally

You need **two terminal windows** — one for the backend and one for the frontend.

### Terminal 1 — Backend (Flask API on port 5000)

```bash
cd backend
# Activate venv if not already active
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
python app.py
```

The backend will:
- Connect to your Supabase database
- Create all tables automatically on first run
- Seed default provider entries and judge settings
- Start on `http://localhost:5000`

### Terminal 2 — Frontend (Vite dev server on port 5173)

```bash
cd frontend
npm run dev
```

The frontend dev server:
- Starts on `http://localhost:5173`
- Proxies all `/api/*` requests to `http://localhost:5000` (configured in `vite.config.ts`)

### Open the app

Go to **http://localhost:5173** in your browser.

## First-Time Configuration

1. Navigate to **Admin** (top-right nav link)
2. Enter your API key for at least one provider (OpenAI, Gemini, Claude, or Grok)
3. Click **Save** for each provider
4. (Optional) Configure the **AI Judge** model in the Judge Settings section
5. Go back to **Compare** and start comparing!

## Usage

### Single Prompt Mode
1. Select 2 or 3 models from the dropdowns
2. Enter your prompt
3. Optionally toggle **AI Judge** on
4. Click **Run**
5. View outputs side by side in resizable panels
6. Score each model (mandatory) and add comments
7. Submit scores

### Autorun Mode
1. Switch to **Autorun** tab
2. Add up to 10 prompts
3. Select models and click **Run All**
4. Prompts are processed sequentially
5. Score each prompt's outputs as they complete

### History & Export
1. Go to **History** to see all past runs
2. Click a run to expand details
3. Export as **CSV** or **XLSX**

## Project Structure

```
LLMWars/
├── backend/
│   ├── app.py              # Flask app factory
│   ├── config.py            # Configuration
│   ├── llmcalls.py          # All LLM provider calls (single file)
│   ├── sysprompt.py         # AI Judge prompts
│   ├── models.py            # Database access layer
│   ├── schema.sql           # PostgreSQL schema
│   ├── routes/
│   │   ├── compare.py       # /api/compare endpoints
│   │   ├── admin.py         # /api/admin endpoints
│   │   └── runs.py          # /api/runs endpoints
│   ├── services/
│   │   ├── judge_service.py # AI Judge logic
│   │   ├── run_service.py   # Comparison orchestration
│   │   └── export_service.py# CSV/XLSX export
│   └── utils/
│       ├── errors.py        # Error handling
│       └── validators.py    # Input validation
├── frontend/
│   └── src/
│       ├── api/             # API client functions
│       ├── components/      # React components
│       ├── pages/           # Page components
│       ├── hooks/           # Custom hooks
│       ├── context/         # Theme context
│       └── lib/             # Utilities
├── CLAUDE.md                # AI assistant instructions
└── docs/
    ├── BUSINESS_PRD.md      # Business requirements
    └── TECHNICAL_PRD.md     # Technical architecture
```

## Supported LLM Providers

| Provider | Models |
|----------|--------|
| OpenAI | GPT-4o, GPT-4o Mini, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano |
| Google Gemini | Gemini 2.0 Flash, Gemini 2.5 Pro, Gemini 2.5 Flash |
| Anthropic Claude | Claude Sonnet 4.6, Claude Haiku 4.5, Claude Opus 4.6 |
| xAI Grok | Grok 3, Grok 3 Mini |

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code conventions, and how to add a new LLM provider.

To report a **security vulnerability**, see [SECURITY.md](SECURITY.md) — do not open a public issue.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

MIT — see [LICENSE](LICENSE) for details.
