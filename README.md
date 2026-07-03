<div align="center">

<img src="https://img.shields.io/badge/PricePilot-SaaS%20Pricing%20Analyzer-7c6fff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAxN2w0LTggNSAzIDQtMTAgNCAxNSIgc3Ryb2tlPSIjN2M2ZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==" />

# PricePilot — Automated SaaS Pricing Sensitivity Analyzer

**Know what your pricing is really worth.**

A full-stack AI-powered tool that analyzes a SaaS company's pricing structure and generates a complete pricing strategy report — revenue sensitivity modeling, feature tier audit, competitor benchmarking, and three alternative pricing structures — in under 60 seconds.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-pricing--analyzer--32hw.vercel.app-22c55e?style=flat-square&logo=vercel)](https://pricing-analyzer-32hw.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-7c6fff?style=flat-square&logo=render)](https://pricing-analyzer-8u3n.onrender.com/docs)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Render-336791?style=flat-square&logo=postgresql)](https://render.com/)

</div>

---

## What It Does

Every SaaS company sets its pricing once and rarely revisits it. The result: significant revenue left on the table, enterprise-value features given away free, and no idea how competitors are positioned.

PricePilot solves this. A founder enters their current pricing tiers, features, user counts, and optional competitor URLs. In ~30 seconds, the tool produces a report that would take a consultant three weeks:

| Module | What it does |
|--------|-------------|
| **Revenue Sensitivity** | Pure Python math — models MRR impact of +10%, +20%, +30% price increases using industry elasticity curves |
| **Feature Tier Audit** | Groq AI classifies each feature as Gatekeeper / Blocker / Right-placed / Undifferentiated |
| **Competitor Benchmark** | Scrapes competitor pricing pages (3-layer fallback) and benchmarks via AI |
| **Alternative Strategies** | Generates Conservative, Aggressive, and Strategic pricing restructures with predicted MRR impact |

---

## Tech Stack

### Backend
| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **FastAPI** (Python) | Native async, perfect for parallel Groq calls + SSE progress stream |
| AI | **Groq API** (llama-3.3-70b-versatile) | Fast inference, reliable JSON output mode, generous free tier |
| Database | **PostgreSQL** (Render) | Relational — companies → tiers → features hierarchy maps cleanly |
| ORM | **SQLAlchemy async + Alembic** | Type-safe async queries, schema migrations |
| Web Scraping | **requests + BeautifulSoup → Playwright fallback** | 3-layer system: fast static scrape → JS-rendered pages → manual paste |
| PDF Export | **WeasyPrint + Jinja2** | HTML/CSS report template → PDF, no headless Chrome needed |
| Email | **SendGrid** | Sends analysis-complete email with PDF attached |
| Auth | **JWT (python-jose) + bcrypt** | Stateless auth, password reset flow included |
| Real-time | **SSE (sse-starlette)** | One-way progress stream from analysis engine to frontend |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | **React 18** (functional components + hooks) |
| Routing | **React Router v6** |
| HTTP | **Axios** with JWT interceptor |
| Charts | **Recharts** (revenue sensitivity line chart) |
| Styling | **Plain CSS** with CSS custom properties — no Tailwind, no UI libraries |
| State | **React Context + useState** — no Redux |
| Build | **Vite** |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Render** (free tier) | Backend API hosting + PostgreSQL database |
| **Vercel** | Frontend hosting |

---

## Architecture — How It Works

```
User submits pricing data
        │
        ▼
React frontend validates → POST /analysis/start/:companyId
        │
        ▼
FastAPI creates AnalysisSession in PostgreSQL
Fires background task → run_full_analysis()
        │
        ├─── asyncio.gather() ──────────────────┐
        │    Module 1: Revenue math (pure Python)│  ← parallel
        │    Module 2: Feature audit (Groq AI)   │
        │    └──────────────────────────────────┘
        │
        ├─── Module 3: Competitor benchmark (Groq AI) ← sequential
        │
        ├─── Module 4: Strategy generation (Groq AI) ← sequential
        │
        ▼
Report JSON assembled → saved to DB → PDF generated → Email sent
        │
        ▼
Frontend polls GET /analysis/history every 3s
→ status: completed → auto-navigates to Report page
```

**Module 1 runs in parallel with Module 2** (using `asyncio.gather()`) because they are independent. Modules 3 and 4 run sequentially — each needs the previous module's output.

---

## Project Structure

```
pricing-analyzer/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, lifespan, Groq client init
│   ├── database.py              # Async SQLAlchemy engine + session factory
│   ├── models.py                # 7 DB tables: User, Company, PricingTier, Feature,
│   │                            #   Competitor, AnalysisSession, Report, PasswordResetToken
│   ├── schemas.py               # Pydantic request/response validation schemas
│   ├── email_service.py         # SendGrid email — analysis complete + password reset
│   ├── scraper.py               # 3-layer competitor scraper (requests→Playwright→manual)
│   ├── pdf_generator.py         # Jinja2 HTML template → WeasyPrint PDF
│   ├── requirements.txt
│   ├── build.sh                 # Render build: install WeasyPrint system deps
│   ├── alembic/                 # DB migrations
│   ├── engine/
│   │   ├── groq_utils.py        # Shared Groq helper: retry logic, JSON parsing, rate limits
│   │   ├── module1_revenue.py   # Pure Python MRR + price elasticity simulation
│   │   ├── module2_features.py  # Groq: feature classification (gatekeeper/blocker/etc)
│   │   ├── module3_benchmark.py # Groq: competitor parsing + value score comparison
│   │   └── module4_recommendations.py  # Groq: 3 alternative pricing structures
│   └── routers/
│       ├── auth.py              # Signup, login, forgot/reset password, JWT
│       ├── companies.py         # CRUD: companies, tiers, features (+ bulk add)
│       ├── competitors.py       # Add/list/manual competitors (max 5 per company)
│       └── analysis.py          # Start analysis, SSE progress stream, get report/PDF/history
│
└── frontend/
    ├── src/
    │   ├── api/                 # All Axios calls in one place — never in components
    │   │   ├── client.js        # Axios instance + 401 auto-logout interceptor
    │   │   ├── auth.js
    │   │   ├── companies.js
    │   │   ├── tiers.js
    │   │   ├── features.js
    │   │   ├── competitors.js
    │   │   └── analysis.js
    │   ├── context/
    │   │   └── AuthContext.jsx  # Token storage, login/logout/deleteAccount
    │   ├── hooks/
    │   │   └── usePolling.js    # Generic polling hook with cleanup
    │   ├── data/
    │   │   └── industryFeatures.js  # Industry-aware feature suggestions per tier
    │   ├── components/
    │   │   ├── common/          # Button, Input, Card, Spinner, ErrorBanner, EmptyState, Badge
    │   │   ├── layout/          # Navbar, ProtectedRoute
    │   │   ├── setup/           # TierFormCard, FeatureTagInput, CompetitorInput
    │   │   └── report/          # RevenueChart, FeatureAuditTable, CompetitorTable,
    │   │                        #   StrategyCard, ExecutiveSummary
    │   ├── pages/
    │   │   ├── Login.jsx / Signup.jsx
    │   │   ├── ForgotPassword.jsx / ResetPassword.jsx
    │   │   ├── Dashboard.jsx    # Company grid with stats
    │   │   ├── CompanySetup.jsx # 3-step wizard: info → tiers+features → competitors
    │   │   ├── AnalysisWaiting.jsx  # SSE + polling fallback, 4-step progress
    │   │   ├── Report.jsx       # Full report: chart, audit table, strategies, PDF download
    │   │   ├── History.jsx      # Per-company analysis history + compare selector
    │   │   ├── AllHistory.jsx   # Global history across all companies
    │   │   ├── ReportCompare.jsx # Side-by-side MRR + feature diff between 2 reports
    │   │   └── ProfileSettings.jsx  # Email display + account deletion
    │   └── styles/
    │       ├── variables.css    # ALL design tokens: colors, spacing, radius, typography
    │       ├── global.css       # Resets, body defaults, scrollbar
    │       ├── layout.css       # .stack, .row, .grid-auto, .page-container utilities
    │       └── components.css   # Shared: .card, .btn, .form-field, .badge, .tag
    └── index.html
```

---

## API Reference

**Base URL:** `https://pricing-analyzer-8u3n.onrender.com`  
**Docs (Swagger UI):** `https://pricing-analyzer-8u3n.onrender.com/docs`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create account → returns JWT |
| POST | `/auth/login` | Login → returns JWT |
| POST | `/auth/forgot-password` | Send password reset email |
| POST | `/auth/reset-password` | Confirm token + new password |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List all companies for authenticated user |
| POST | `/companies` | Create company |
| GET | `/companies/:id` | Get company with nested tiers, features, competitors |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company (cascades all data) |

### Tiers & Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/companies/:id/tiers` | Add tier |
| PUT | `/companies/:id/tiers/:tid` | Update tier |
| DELETE | `/companies/:id/tiers/:tid` | Delete tier + cascade features |
| POST | `/companies/:id/tiers/:tid/features` | Add single feature |
| POST | `/companies/:id/tiers/:tid/features/bulk` | Add multiple features, returns `{ added, skipped }` |
| DELETE | `/companies/:id/tiers/:tid/features/:fid` | Remove feature |

### Competitors (max 5 per company)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/companies/:id/competitors` | Add competitor URL — triggers background scrape |
| GET | `/companies/:id/competitors` | List competitors with scrape status |
| PATCH | `/companies/:id/competitors/:cid/manual` | Paste pricing text if scraping failed |
| DELETE | `/companies/:id/competitors/:cid` | Remove competitor |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analysis/start/:companyId` | Kick off analysis → returns `{ session_id }` |
| GET | `/analysis/progress/:sessionId` | **SSE stream** — real-time progress (0→100%) |
| GET | `/analysis/history/:companyId` | All past sessions with status + report_id |
| GET | `/analysis/report/:sessionId` | Full report JSON |
| GET | `/analysis/report/:sessionId/pdf` | Download PDF (requires Authorization header) |

---

## Database Schema

```
users
  id, email, password_hash, created_at
  └── companies (cascade delete)
        id, user_id, name, industry, description, created_at
        ├── pricing_tiers (cascade delete)
        │     id, company_id, name, price, billing_cycle, user_count, churn_rate
        │     └── features (cascade delete)
        │           id, tier_id, feature_name, description
        ├── competitors (cascade delete)
        │     id, company_id, url, raw_scraped_text, scrape_status, created_at
        └── analysis_sessions (cascade delete)
              id, company_id, status, progress, started_at, completed_at, error_message
              └── reports (cascade delete)
                    id, session_id, json_report (JSONB), pdf_path, created_at

password_reset_tokens
  id, user_id, token, expires_at, used
```

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (local) or use SQLite for dev
- Groq API key — free at [console.groq.com](https://console.groq.com)

### Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Install Playwright for JS-rendered page scraping
playwright install chromium

# Create .env file
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql+asyncpg://user:password@localhost/pricepilot
JWT_SECRET=your-random-64-char-secret
GROQ_API_KEY=your-groq-api-key
FRONTEND_URL=http://localhost:5173

# Email (optional — analysis complete notifications)
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=your-verified-sender@domain.com
ENVEOF

# Run database migrations
alembic upgrade head

# Start server
uvicorn main:app --reload --port 8000
```

Backend runs at `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

npm install

# Create .env
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Deployment

### Backend on Render

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect GitHub repo, set **Root Directory** to `backend`
3. **Build Command:** `./build.sh` (installs WeasyPrint system deps + pip install)
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add **Environment Variables** in Render dashboard:

```
DATABASE_URL        = postgresql+asyncpg://... (from Render PostgreSQL)
JWT_SECRET          = <random 64 char string>
GROQ_API_KEY        = <your Groq key>
FRONTEND_URL        = https://your-app.vercel.app
SENDGRID_API_KEY    = <optional>
FROM_EMAIL          = <optional>
```

### PostgreSQL on Render

1. Render dashboard → **New → PostgreSQL**
2. Copy the **Internal Database URL** (for same-region backend connections)
3. Change `postgresql://` to `postgresql+asyncpg://` in `DATABASE_URL`

### Frontend on Vercel

```bash
# In frontend directory
npm run build

# Or connect GitHub repo to Vercel
# Set environment variable:
VITE_API_URL = https://your-backend.onrender.com
```

> **Note:** Render free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30–60 seconds. Keep the tab open before a demo, or upgrade to a paid instance ($7/month).

---

## Email Notifications (SendGrid)

When an analysis completes, the user receives an email with:
- Current MRR and recommended price increase
- Link to view the full report
- PDF report attached (if WeasyPrint generated it)
- Password reset emails also supported

**Setup:**
1. Create a free account at [sendgrid.com](https://sendgrid.com) (100 emails/day free)
2. Verify a sender email address
3. Generate an API key (Settings → API Keys)
4. Add `SENDGRID_API_KEY` and `FROM_EMAIL` to Render environment variables

> SendGrid requires a verified sender domain or email. Free tier supports single sender verification (no domain needed).

---

## Key Technical Decisions

**Why Groq instead of Gemini?**  
Groq's `response_format: { type: "json_object" }` enforces structured JSON output at the inference level — zero JSON parsing failures. Gemini required retry logic for malformed JSON. Groq's llama-3.3-70b also delivers faster inference.

**Why Module 1 is pure Python (no AI)?**  
Revenue math must be deterministic and reproducible. A founder running the same analysis twice should get the same MRR numbers. Using AI for math introduces nondeterminism — unacceptable for financial projections.

**Why Module 1 + 2 run in parallel?**  
They are independent — Module 1 only needs tier data, Module 2 only needs feature data. `asyncio.gather()` runs both simultaneously, saving ~10 seconds per analysis.

**Why store raw scraped text instead of parsed structure?**  
Competitor websites change layouts constantly. Storing raw text and re-parsing with AI on each analysis means layout changes never break the tool. A traditional CSS selector scraper would need constant maintenance.

**Why plain CSS instead of Tailwind?**  
One `variables.css` file defines all design tokens. Every component references variables — changing `--color-primary` updates the entire app. No build step dependency, no purging complexity, no class proliferation in JSX.

**Why SSE instead of WebSockets for progress?**  
Analysis progress is one-directional (server → client only). SSE is simpler: one HTTP endpoint, no handshake, built-in reconnect, natively supported by browsers without a library.

---

## Demo Walkthrough

Use this data to test the full analysis flow end-to-end:

**Company:** CloudHR Pro — HR management platform for mid-size companies

| Tier | Price | Users | Churn |
|------|-------|-------|-------|
| Basic | $49/mo | 200 | 9% |
| Growth | $149/mo | 85 | 5% |
| Enterprise | $399/mo | 22 | 2% |

**Expected MRR:** `(49×200) + (149×85) + (399×22) = $31,243/month`

**Features to add (Basic tier):** Employee profiles, Attendance tracking, Payroll processing, API access  
*(Gemini should flag Payroll + API as gatekeepers — enterprise value given away free)*

**Competitor URL:** `https://www.rippling.com/pricing`  
*(If scraping fails, paste manual text: "Rippling Core $8/user/mo, Payroll +$8/user/mo, Enterprise custom pricing with SSO, API, audit logs")*

After running analysis, the report should show:
- Module 1: MRR $31,243 → recommended +20% increase
- Module 2: API access on Basic flagged as **Gatekeeper**
- Module 3: Rippling comparison with feature gaps
- Module 4: 3 pricing strategies (Conservative ~+12%, Aggressive ~+30%, Strategic)

---

## Features at a Glance

- **Multi-company workspace** — manage and analyze multiple products from one dashboard
- **3-step setup wizard** — basic info → tier builder with feature tags → competitor URLs
- **Industry-aware feature suggestions** — FeatureTagInput shows relevant features per industry
- **3-layer competitor scraping** — requests → Playwright (JS pages) → manual paste fallback
- **Real-time analysis progress** — SSE stream lights up 4 steps as each module completes
- **Interactive revenue chart** — Recharts line chart with price sensitivity slider
- **Feature audit table** — color-coded rows (red=gatekeeper, amber=blocker, green=right-placed)
- **Report comparison** — select 2 analyses, see MRR delta + feature classification changes
- **PDF download** — WeasyPrint generates a print-ready consultant-style report
- **Email notification** — SendGrid sends completion email with PDF attached
- **Password reset flow** — forgot password → email link → set new password
- **Account deletion** — full data wipe with DELETE confirmation
- **Global history** — view all analyses across all companies in one place

---

## Environment Variables Reference

### Backend (Render)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `JWT_SECRET` | ✅ | Random secret for signing JWT tokens |
| `GROQ_API_KEY` | ✅ | Groq API key from console.groq.com |
| `FRONTEND_URL` | ✅ | Vercel frontend URL (for CORS + email links) |
| `SENDGRID_API_KEY` | ⬜ | SendGrid key — email notifications optional |
| `FROM_EMAIL` | ⬜ | Verified sender email for SendGrid |

### Frontend (Vercel)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend URL (e.g. `https://pricing-analyzer-8u3n.onrender.com`) |

---

## Built With

This project was built as part of a **Trilogy Innovations internship application** — Trilogy acquires under-monetizing SaaS companies, and pricing optimization is one of the first levers they pull post-acquisition. PricePilot automates the pricing audit that would otherwise take a consultant three weeks.

**Stack decisions were made for interview-relevance:**
- FastAPI async — demonstrates Python async programming and concurrent I/O
- Structured AI outputs — demonstrates prompt engineering for reliable JSON
- SSE progress streaming — demonstrates real-time server-client communication
- Parallel module execution — demonstrates `asyncio.gather()` for performance
- 3-layer scraping fallback — demonstrates graceful degradation



---

<div align="center">

**[Live Demo](https://pricing-analyzer-32hw.vercel.app/) · [API Docs](https://pricing-analyzer-8u3n.onrender.com/docs) 

</div>
