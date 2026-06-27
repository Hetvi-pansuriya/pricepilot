import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, companies, analysis, competitors

import google.generativeai as genai


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables (dev convenience — use Alembic for production)
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("SUCCESS: Database tables created/verified.")
    except Exception as e:
        print(f"WARNING: Could not connect to database on startup: {e}")
        print("   Update DATABASE_URL in .env with correct credentials and restart.")

    # Create PDF output directory
    pdf_dir = os.path.join(os.path.dirname(__file__), "generated_pdfs")
    os.makedirs(pdf_dir, exist_ok=True)

    # Initialise Gemini client
    api_key = os.getenv("GEMINI_API_KEY", "")
    if api_key:
        genai.configure(api_key=api_key)
        app.state.gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        print("SUCCESS: Gemini model initialized.")
    else:
        app.state.gemini_model = None
        print("WARNING: GEMINI_API_KEY not set — AI modules will return stubs.")

    yield
    # Shutdown: nothing to clean up


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SaaS Pricing Analyzer API",
    description="Automated SaaS Pricing Sensitivity Analyzer — backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

frontend_url = os.getenv("FRONTEND_URL", "https://your-vercel-url.vercel.app")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        frontend_url,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(companies.router, prefix="/companies", tags=["companies"])
app.include_router(competitors.router, prefix="/companies", tags=["competitors"])
app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": "1.0.0"}
