# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-25

### Added

- Side-by-side comparison of 2–3 LLM outputs in resizable panels
- Support for OpenAI (GPT-4o, GPT-4.1 series), Google Gemini (2.0/2.5), Anthropic Claude (Sonnet/Haiku/Opus 4.x), and xAI Grok (3/3 Mini)
- Mandatory per-model scoring (1–2 scale for 2 models, 1–3 for 3 models) with comments
- Optional AI Judge: configurable judge model scores outputs automatically
- Autorun mode: run a list of up to 10 prompts sequentially with parallel model calls per prompt
- History page: browse all past runs with expandable detail view
- Export runs to CSV or XLSX
- Admin panel: configure provider API keys and judge settings without touching code
- Dark / light mode toggle
- PostgreSQL persistence via Supabase (schema auto-created on first run)
- Flask app factory + Blueprint architecture (compare, admin, runs)
- Single-file LLM provider registry pattern (`backend/llmcalls.py`)
