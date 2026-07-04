import asyncio
import json
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import get_db, AsyncSessionLocal
from models import Company, PricingTier, Competitor, AnalysisSession, Report, User
from schemas import AnalysisStartResponse, ReportResponse, AnalysisHistoryItem
from routers.auth import get_current_user
from engine.module1_revenue import run_module1
from engine.module2_features import run_module2
from engine.module3_benchmark import run_module3
from engine.module4_recommendations import run_module4
from pdf_generator import generate_pdf, WEASYPRINT_AVAILABLE

router = APIRouter()

# ─── In-memory progress queues (keyed by session_id str) ─────────────────────
progress_queues: dict[str, asyncio.Queue] = {}


# ─── Data loading helper ──────────────────────────────────────────────────────

async def _load_company_data(company_id: uuid.UUID, db: AsyncSession) -> dict:
    """Load company with all nested data into a plain dict for the engine."""
    result = await db.execute(
        select(Company)
        .where(Company.id == company_id)
        .options(
            selectinload(Company.tiers).selectinload(PricingTier.features),
            selectinload(Company.competitors),
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise ValueError(f"Company {company_id} not found")

    tiers = []
    for tier in company.tiers:
        tiers.append({
            "id": str(tier.id),
            "name": tier.name,
            "price": tier.price,
            "billing_cycle": tier.billing_cycle,
            "user_count": tier.user_count,
            "churn_rate": tier.churn_rate,
            "features": [
                {"feature_name": f.feature_name, "description": f.description}
                for f in tier.features
            ],
        })

    competitors = []
    for comp in company.competitors:
        competitors.append({
            "id": str(comp.id),
            "name": comp.name or comp.url,
            "url": comp.url,
            "raw_scraped_text": comp.raw_scraped_text or "",
            "clean_scraped_text": comp.clean_scraped_text or "",
            "scrape_status": comp.scrape_status,
        })

    # Give empty failed/pending competitors one concurrent retry at analysis time.
    from scraper import scrape_competitors_concurrent

    retry_candidates = [
        {"id": competitor["id"], "url": competitor["url"]}
        for competitor in competitors
        if competitor.get("scrape_status")
        in {
            "failed",
            "manual_required",
            "pending",
            "too_short_or_no_pricing",
            "no_pricing_content_after_render",
            "playwright_not_installed",
        }
        and not competitor.get("raw_scraped_text")
    ]
    if retry_candidates:
        print(
            f"[Scraper] Re-attempting {len(retry_candidates)} "
            "competitor(s) before analysis."
        )
        retry_results = await scrape_competitors_concurrent(retry_candidates)
        retry_map = {str(result["id"]): result for result in retry_results}
        model_map = {str(model.id): model for model in company.competitors}
        changed = False
        for competitor in competitors:
            retry = retry_map.get(competitor["id"])
            if not retry or not retry["status"].startswith("success"):
                continue
            competitor["raw_scraped_text"] = retry["text"]
            competitor["clean_scraped_text"] = retry.get("clean_text", "")
            competitor["scrape_status"] = retry["status"]
            db_competitor = model_map.get(competitor["id"])
            if db_competitor:
                db_competitor.raw_scraped_text = competitor["raw_scraped_text"]
                db_competitor.clean_scraped_text = competitor[
                    "clean_scraped_text"
                ]
                db_competitor.scrape_status = competitor["scrape_status"]
                changed = True
        if changed:
            await db.commit()

    return {
        "id": str(company.id),
        "name": company.name,
        "industry": company.industry,
        "description": company.description,
        "tiers": tiers,
        "competitors": competitors,
    }


# ─── Full analysis background coroutine ───────────────────────────────────────

async def run_full_analysis(
    session_id: str,
    company_id: uuid.UUID,
    groq_client,
):
    queue = progress_queues.get(session_id)

    async def push(progress: int, status_str: str, **kwargs):
        update = {"progress": progress, "status": status_str, **kwargs}
        if queue:
            await queue.put(update)
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AnalysisSession).where(AnalysisSession.id == uuid.UUID(session_id))
            )
            sess = result.scalar_one_or_none()
            if sess:
                sess.progress = progress
                sess.status = status_str
                await db.commit()

    await push(0, "running")

    try:
        async with AsyncSessionLocal() as db:
            company_data = await _load_company_data(company_id, db)
    except Exception as e:
        await push(100, "failed")
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(AnalysisSession).where(AnalysisSession.id == uuid.UUID(session_id))
            )
            sess = result.scalar_one_or_none()
            if sess:
                sess.error_message = str(e)
                sess.completed_at = datetime.utcnow()
                await db.commit()
        return

    any_module_failed = False

    # ── M1 + M2 in parallel ──────────────────────────────────────────────────
    # Initialize with error stubs so they're always bound even if gather fails
    m1_result: dict = {"error": "not run", "module": "M1"}
    m2_result: dict = {"error": "not run", "module": "M2"}
    try:
        m1_result, m2_result = await asyncio.gather(
            asyncio.to_thread(run_module1, company_data),
            run_module2(company_data, groq_client),
        )
    except Exception as e:
        m1_result = {"error": str(e), "module": "M1/M2"}
        m2_result = {"error": str(e), "module": "M1/M2"}
        any_module_failed = True

    if isinstance(m1_result, dict) and "error" in m1_result:
        any_module_failed = True
    if isinstance(m2_result, dict) and "error" in m2_result:
        any_module_failed = True

    await push(50, "m1_m2_complete")

    # ── M3 ───────────────────────────────────────────────────────────────────
    try:
        m3_result = await run_module3(
            company_data, m1_result, m2_result,
            company_data.get("competitors", []), groq_client
        )
    except Exception as e:
        m3_result = {"error": str(e), "module": "M3"}
        any_module_failed = True

    if isinstance(m3_result, dict) and "error" in m3_result:
        any_module_failed = True

    await push(75, "m3_complete")

    # ── M4 ───────────────────────────────────────────────────────────────────
    try:
        m4_result = await run_module4(
            company_data, m1_result, m2_result, m3_result, groq_client
        )
    except Exception as e:
        m4_result = {"error": str(e), "module": "M4"}
        any_module_failed = True

    if isinstance(m4_result, dict) and "error" in m4_result:
        any_module_failed = True

    await push(90, "m4_complete")

    # ── Assemble full report ──────────────────────────────────────────────────
    full_report = {
        "company": {
            "id": company_data["id"],
            "name": company_data["name"],
            "industry": company_data["industry"],
        },
        "generated_at": datetime.utcnow().isoformat(),
        "module1_revenue": m1_result,
        "module2_features": m2_result,
        "module3_benchmark": m3_result,
        "module4_recommendations": m4_result,
    }

    # ── Generate PDF (WeasyPrint is sync — run in thread pool) ───────────────
    pdf_path = None
    try:
        pdf_path = await asyncio.to_thread(generate_pdf, full_report, session_id)
    except Exception as pdf_err:
        print(f"PDF ERROR: {pdf_err}")
        pdf_path = None

    # ── Save report to DB ─────────────────────────────────────────────────────
    final_status = "partial" if any_module_failed else "completed"
    report_id = uuid.uuid4()

    async with AsyncSessionLocal() as db:
        report = Report(
            id=report_id,
            session_id=uuid.UUID(session_id),
            json_report=full_report,
            pdf_path=pdf_path,
            created_at=datetime.utcnow(),
        )
        db.add(report)

        result = await db.execute(
            select(AnalysisSession).where(AnalysisSession.id == uuid.UUID(session_id))
        )
        sess = result.scalar_one_or_none()
        if sess:
            sess.status = final_status
            sess.progress = 100
            sess.completed_at = datetime.utcnow()

        await db.commit()

    await push(100, final_status, report_id=str(report_id))

    # Email is intentionally non-fatal: analysis remains complete if delivery fails.
    try:
        from email_service import send_analysis_complete_email

        async with AsyncSessionLocal() as db:
            session_result = await db.execute(
                select(AnalysisSession)
                .where(AnalysisSession.id == uuid.UUID(session_id))
                .options(selectinload(AnalysisSession.company))
            )
            session_for_email = session_result.scalar_one_or_none()
            if session_for_email:
                user_result = await db.execute(
                    select(User).where(
                        User.id == session_for_email.company.user_id
                    )
                )
                user_for_email = user_result.scalar_one_or_none()
                if user_for_email:
                    module1 = full_report.get("module1_revenue", {})
                    await send_analysis_complete_email(
                        to_email=user_for_email.email,
                        company_name=company_data["name"],
                        company_id=company_data["id"],
                        session_id=session_id,
                        pdf_path=pdf_path,
                        current_mrr=module1.get("current_mrr", 0),
                        recommended_increase=module1.get(
                            "recommended_increase", "N/A"
                        ),
                    )
    except Exception as email_error:
        print(f"[Email] Non-fatal notification error: {email_error}")

    # Clean up queue
    if session_id in progress_queues:
        del progress_queues[session_id]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/start/{company_id}",
    response_model=AnalysisStartResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def start_analysis(
    company_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Ownership check
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Company not found")

    session_id = uuid.uuid4()
    session = AnalysisSession(
        id=session_id,
        company_id=company_id,
        status="running",
        progress=0,
        started_at=datetime.utcnow(),
    )
    db.add(session)
    await db.commit()

    queue: asyncio.Queue = asyncio.Queue()
    progress_queues[str(session_id)] = queue

    groq_client = getattr(request.app.state, "groq_client", None)
    asyncio.create_task(
        run_full_analysis(str(session_id), company_id, groq_client)
    )

    return AnalysisStartResponse(session_id=session_id)


@router.get("/progress/{session_id}")
async def stream_progress(session_id: uuid.UUID, request: Request, current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db), ):
    sid = str(session_id)

    async def event_generator():
        queue = progress_queues.get(sid)
        if not queue:
            # Session may already be complete — check DB
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(AnalysisSession).where(AnalysisSession.id == session_id)
                )
                sess = result.scalar_one_or_none()
                if sess:
                    yield {
                        "data": json.dumps(
                            {"progress": sess.progress, "status": sess.status}
                        )
                    }
                else:
                    yield {"data": json.dumps({"progress": 100, "status": "completed"})}
            return

        while True:
            if await request.is_disconnected():
                break
            try:
                update = await asyncio.wait_for(queue.get(), timeout=30.0)
            except asyncio.TimeoutError:
                yield {"data": json.dumps({"progress": 0, "status": "waiting"})}
                continue

            yield {"data": json.dumps(update)}

            if update.get("progress") == 100 or update.get("status") in ("failed", "partial"):
                break

    return EventSourceResponse(event_generator())


@router.get("/report/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Report)
        .where(Report.session_id == session_id)
        .options(selectinload(Report.session))
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Ownership check via session → company
    sess_result = await db.execute(
        select(AnalysisSession)
        .where(AnalysisSession.id == session_id)
        .options(selectinload(AnalysisSession.company))
    )
    sess = sess_result.scalar_one_or_none()
    if not sess or sess.company.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return report


@router.get("/report/{session_id}/pdf")
async def download_pdf(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not WEASYPRINT_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail=(
                "PDF generation is not available. WeasyPrint requires the GTK runtime on Windows. "
                "Install from: https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer"
            ),
        )

    result = await db.execute(
        select(Report).where(Report.session_id == session_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not report.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not yet generated")

    # Ownership check
    sess_result = await db.execute(
        select(AnalysisSession)
        .where(AnalysisSession.id == session_id)
        .options(selectinload(AnalysisSession.company))
    )
    sess = sess_result.scalar_one_or_none()
    if not sess or sess.company.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse(
        report.pdf_path,
        media_type="application/pdf",
        filename=f"pricing-report-{session_id}.pdf",
    )


@router.get("/history/{company_id}", response_model=List[AnalysisHistoryItem])
async def analysis_history(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Ownership check
    comp_result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
    )
    if not comp_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Company not found")

    result = await db.execute(
        select(AnalysisSession)
        .where(AnalysisSession.company_id == company_id)
        .options(selectinload(AnalysisSession.report))
        .order_by(AnalysisSession.started_at.desc())
    )
    sessions = result.scalars().all()

    items = []
    for sess in sessions:
        items.append(
            AnalysisHistoryItem(
                session_id=sess.id,
                status=sess.status,
                progress=sess.progress,
                started_at=sess.started_at,
                completed_at=sess.completed_at,
                report_id=sess.report.id if sess.report else None,
            )
        )
    return items
