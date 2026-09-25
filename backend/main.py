
import os

from pathlib import Path

from contextlib import asynccontextmanager

from dotenv import load_dotenv

from sqlalchemy import text

env_path = Path(__file__).resolve().parent / ".env"

load_dotenv(dotenv_path=env_path, override=True)

print(f"DIAGNOSTIC: Looking for .env file at: {env_path}")  # shows the path being searched
print(f"DIAGNOSTIC: Does file exist? {env_path.exists()}")   # shows True/False if file found

from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base

from routers import auth, companies, analysis, competitors

from groq import Groq



@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("SUCCESS: Database tables created/verified.")  # appears in the server console
    except Exception as e:
        print(f"WARNING: Could not connect to database on startup: {e}")

    try:
        async with engine.begin() as conn:
            await conn.execute(text(
                "ALTER TABLE competitors ADD COLUMN IF NOT EXISTS clean_scraped_text TEXT"
            ))
        print("SUCCESS: Migration check complete.")
    except Exception as e:
        print(f"WARNING: Migration check failed: {e}")  # non-fatal, continue startup
        
    pdf_dir = os.path.join(os.path.dirname(__file__), "generated_pdfs")
    os.makedirs(pdf_dir, exist_ok=True)  # creates the folder silently if missing

    api_key = os.getenv("GROQ_API_KEY", "")  # "" = default if the key is missing

    print(f"DEBUG: GROQ_API_KEY loaded = {'YES (' + api_key[:8] + '...)' if api_key else 'NO — check .env file'}")

    if api_key:
        app.state.groq_client = Groq(api_key=api_key)
        print("SUCCESS: Groq client initialized.")
    else:
        app.state.groq_client = None
        print("WARNING: GROQ_API_KEY not set.")  # AI analysis will return empty stubs

    if os.getenv("SENDGRID_API_KEY", "") and os.getenv("FROM_EMAIL", ""):
        print("SUCCESS: Email notifications enabled (SendGrid).")
    else:
        print("INFO: SendGrid credentials not set; email notifications disabled.")

    yield


app = FastAPI(
    title="SaaS Pricing Analyzer API",                               # shown in /docs
    description="Automated SaaS Pricing Sensitivity Analyzer — backend API",  # shown in /docs
    version="1.0.0",                                                  # API version string
    lifespan=lifespan,                                                # startup/shutdown logic
)


frontend_url = os.getenv("FRONTEND_URL", "https://pricepilot-six.vercel.app")

app.add_middleware(
    CORSMiddleware,                    # the middleware class to use
    allow_origins=[                    # list of domains allowed to call this API
        "http://localhost:5173",       # React dev server (Vite default port)
        "http://localhost:3000",       # React dev server (Create React App default port)
        frontend_url,                  # deployed Vercel production frontend URL
        "https://pricing-analyzer-32hw.vercel.app", # Alternative Vercel URL
        "https://pricepilot-six.vercel.app",        # Alternative Vercel URL
    ],
    allow_credentials=True,           # allow cookies and Authorization headers to be sent
    allow_methods=["*"],              # allow all HTTP methods (GET, POST, DELETE, etc.)
    allow_headers=["*"],              # allow all headers (including Authorization for JWT)
)


app.include_router(auth.router, prefix="/auth", tags=["auth"])

app.include_router(companies.router, prefix="/companies", tags=["companies"])

app.include_router(competitors.router, prefix="/companies", tags=["competitors"])

app.include_router(analysis.router, prefix="/analysis", tags=["analysis"])



@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "version": "1.0.0"}

@app.api_route("/", methods=["GET", "HEAD"], include_in_schema=False)
def root():
    return {
        "message": "SaaS Pricing Analyzer API is running!"  # confirms server is alive
    }
