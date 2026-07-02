# SaaS Pricing Sensitivity Analyzer — Backend

A FastAPI backend that automatically analyzes SaaS pricing strategy using revenue simulation, AI-powered feature auditing, competitor benchmarking, and strategy recommendations.

---

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 14+
- (Optional) Playwright browsers for JS-rendered competitor scraping

### 2. Create & activate virtual environment

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt

# Install Playwright browsers (Layer 2 scraping)
playwright install chromium
```

### 4. Configure environment

```bash
cp .env.example .env
# Edit .env and fill in:
#   DATABASE_URL  — your PostgreSQL connection string
#   JWT_SECRET    — a long random secret (use: python -c "import secrets; print(secrets.token_hex(32))")
#   GEMINI_API_KEY — from https://aistudio.google.com/app/apikey
```

### 5. Create PostgreSQL database

```sql
CREATE DATABASE saas_pricing;
```

### 6. Run database migrations

```bash
# Option A — Alembic (recommended for production)
alembic revision --autogenerate -m "init"
alembic upgrade head

# Option B — Auto-create on startup (development only)
# Tables are created automatically when the app starts via Base.metadata.create_all
```

### 7. Start the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Visit: http://localhost:8000/docs (Swagger UI)

---

## Architecture

```
POST /auth/signup|login         → JWT token
POST /companies                 → create company
POST /companies/{id}/tiers      → add pricing tier
POST /companies/{id}/tiers/{id}/features → add feature to tier
POST /companies/{id}/competitors → scrape competitor pricing page (background)
PATCH /companies/{id}/competitors/{id}/manual → paste text manually

POST /analysis/start/{company_id}
  └─ fires background pipeline:
       M1 (revenue math) ┐
       M2 (Gemini)       ┘ parallel → M3 (Gemini) → M4 (Gemini) → PDF

GET /analysis/progress/{session_id}  → SSE stream (0→50→75→90→100%)
GET /analysis/report/{session_id}    → full JSON report
GET /analysis/report/{session_id}/pdf → download PDF
GET /analysis/history/{company_id}   → past sessions
```

## Analysis Pipeline

| Step | Module | Technology | What it does |
|------|--------|------------|--------------|
| M1   | Revenue | Pure Python | Simulates +10/20/30% price scenarios with elasticity |
| M2   | Features | Gemini Flash | Classifies features: gatekeeper/blocker/right_placed/undifferentiated |
| M3   | Benchmark | Gemini Flash | Parses competitor text, computes value scores |
| M4   | Strategy | Gemini Flash | Generates 3 alternative pricing strategies |
| PDF  | Report | WeasyPrint | Produces styled downloadable report |

## Competitor Scraping Layers

1. **Layer 1** — `requests` + `BeautifulSoup` (fast, no JS)
2. **Layer 2** — Playwright Chromium (JS-rendered pages)
3. **Layer 3** — `PATCH .../manual` (user pastes pricing text directly)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL async connection string | `postgresql+asyncpg://postgres:password@localhost:5432/saas_pricing` |
| `JWT_SECRET` | Secret key for JWT signing | `changeme-very-secret-key` |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_EXPIRE_HOURS` | Token expiry in hours | `24` |
| `GEMINI_API_KEY` | Google AI Studio API key | *(required for AI features)* |
| `FRONTEND_URL` | CORS allowed origin for production frontend | `https://your-vercel-url.vercel.app` |

## Notes

- If `GEMINI_API_KEY` is not set, AI modules (M2, M3, M4) will return error stubs and the session will be marked `partial`.
- WeasyPrint on Windows may require GTK runtime — see [WeasyPrint docs](https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#windows).
- All UUIDs are used as primary keys — no integer sequences.
- All protected routes require `Authorization: Bearer <token>` header.

## Email notifications and password resets

Set `SENDGRID_API_KEY`, `FROM_EMAIL`, and `FRONTEND_URL` in Render's
Environment tab. `FROM_EMAIL` must be a verified SendGrid sender.

Analysis and password-reset email failures are logged and never fail the
analysis or expose whether an account exists.
