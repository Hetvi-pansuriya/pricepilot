import os
from pathlib import Path
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Explicitly point at the .env file in the same directory as this script
# This ensures it works whether uvicorn is launched from this dir or another
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

print(f"DIAGNOSTIC: Looking for .env file at: {env_path}")
print(f"DIAGNOSTIC: Does file exist? {env_path.exists()}")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, companies, analysis, competitors

from groq import Groq


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

    # Create PDF output directory
    pdf_dir = os.path.join(os.path.dirname(__file__), "generated_pdfs")
    os.makedirs(pdf_dir, exist_ok=True)

    # Initialise Groq client
    api_key = os.getenv("GROQ_API_KEY", "")
    print(f"DEBUG: GROQ_API_KEY loaded = {'YES (' + api_key[:8] + '...)' if api_key else 'NO — check .env file'}")
    if api_key:
        app.state.groq_client = Groq(api_key=api_key)
        print("SUCCESS: Groq client initialized.")
    else:
        app.state.groq_client = None
        print("WARNING: GROQ_API_KEY not set.")

    if os.getenv("SMTP_USER", "") and os.getenv("SMTP_PASS", ""):
        print("SUCCESS: Email notifications enabled (SMTP).")
    else:
        print("INFO: SMTP credentials not set; email notifications disabled.")

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

@app.get("/")
def root():
    return {
        "message": "SaaS Pricing Analyzer API is running!"
    }
