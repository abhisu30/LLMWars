# Business PRD: LLM Compare

## Product Overview

LLM Compare is a modular, open-source web application that enables users to compare outputs from 2-3 LLMs side by side, score them manually, optionally enable an AI judge, and export structured evaluation results.

**Primary goal:** Provide a structured LLM comparison tool that is publicly hosted and demonstrates full-stack cloud capability.

**Secondary goal:** Deliver an open-source benchmarking tool for AI builders.

---

## Objectives

1. Deliver a reliable MVP
2. Maintain modular architecture for expansion
3. Support structured, repeatable LLM benchmarking
4. Ensure exportable, auditable evaluation data
5. Persist all run data in storage

---

## User Roles

### Standard User
- Compare 2-3 models
- Provide mandatory scoring and feedback
- Optionally enable AI judge
- Export results

### Admin
- Configure API providers
- Configure AI judge model
- Control model availability

---

## Core Features (MVP)

### Top Navigation
- Persistent top navigation bar
- Right-aligned link to Admin Panel
- Main app view as default route

### Prompt Input

**Single Prompt Mode (Default)**
- Single prompt input
- Run executes once

**Autorun Mode**
- Up to 10 prompts
- Sequential execution
- After each prompt:
  - Outputs displayed
  - User must score and provide feedback
  - AI judge scores generated if enabled
  - Continue button activates
- Next prompt runs only after user clicks Continue

### LLM Selection
- User selects 2 or 3 models (third model optional)
- Model dropdown populated based on active providers configured in Admin Panel
- Model list defined in backend
- If provider credentials exist, all backend-defined models under that provider appear in dropdown

### AI Judge
- User can toggle AI judge ON/OFF
- Judge model selection removed from user interface (configured in Admin Panel)
- If enabled:
  - Judge scores each output (1-3 scale)
  - Judge provides comment
- User scoring and feedback mandatory regardless of judge status

### Scoring

**User Scoring (Mandatory)**

For each active model:
- Score dropdown: 1, 2, 3 (3 = highest). If 2 models: 1 or 2
- Comment field (mandatory)

Continue button activates only after:
- All user scores selected
- All user feedback entered
- Judge scoring completed (if enabled)

### Continue Button
- Appears after each run
- Enabled only when scoring requirements are satisfied
- Clicking Continue triggers next prompt (autorun mode)
- Process repeats until all prompts complete

### Output Layout

**Right panel** (default ~80% width):
- 2 or 3 vertical output columns
- Each column contains:
  - Model name
  - Output text
  - User score dropdown
  - User comment field
  - Judge score (if enabled)
  - Judge comment (if enabled)

**Left panel** adjustable width between 20%-40%

### Export

**Formats:** CSV, XLSX

**File structure:**
- First column: Date and exact timestamp of run
- For each selected model:
  - Prompt
  - [Model Name] Output
  - [Model Name] User Score
  - [Model Name] User Notes
  - [Model Name] AI Judge Score (if enabled)
  - [Model Name] AI Judge Notes (if enabled)

All runs must be stored persistently even if export is not triggered.

---

## Admin Panel

Accessible via top navigation.

### Provider Configuration
Modular provider configuration section.

**Initial providers:** OpenAI, Gemini, Claude, Grok

Per provider:
- API Endpoint field
- API Key field

If credentials configured, all backend-defined models for that provider become available in user dropdown. Provider section must support adding new providers in future.

### Judge Model Configuration
- Admin selects one model as AI judge
- Judge dropdown uses same model list as user selection
- Only one judge active at a time
- Users can only toggle judge ON/OFF

### Super Admin (Future Capability)
- Ability to add models per provider dynamically
- Current model list hardcoded in backend

---

## Future Features

### Memory Mode
- Toggle: Memory ON
- If enabled, each new prompt includes previous prompts and outputs
- Separate memory maintained per model
- Works for single and autorun modes

### Persistent History
- Save sessions, reopen comparisons, versioned experiments

### Advanced Evaluation
- Criteria-based scoring, weighting system, aggregated dashboard

### Model Performance Over Time
- Store historical runs per model
- Track performance trends for similar prompt types
- Import multiple CSV/XLSX files in standard format
- Dashboard to compare sessions, track ranking trends, visualize consistency

### User Login (Future Iteration)
- Account creation via Gmail or similar provider
- Users can add personal API keys and act as their own admin
- Multi-user support with isolated data

---

## UX Requirements

- Clean, modern interface
- Light and dark modes
- Responsive layout
- Adjustable left panel width
- Clear indicators for:
  - Incomplete scoring
  - Disabled Continue button
  - Missing model selection
  - Missing prompt input

---

## Non-Functional Requirements

1. Free hosting
2. Open source
3. Modular architecture
4. Easy extensibility for new providers, models, and export formats
5. Persistent storage for all run data

---

## Success Criteria

MVP is successful if:
- 2-3 model comparison works reliably
- Mandatory scoring workflow enforced
- Continue gating functions correctly
- AI judge functions when enabled
- Admin panel controls provider activation and judge selection
- Timestamped exports generate correctly
- All run data stored persistently
- Application deployed and publicly accessible
