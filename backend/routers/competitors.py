"""
routers/competitors.py
─────────────────────────────────────────────────────────────────────────────
PURPOSE: REST API endpoints for managing competitor entries and scraping.

Endpoints:
  POST   /companies/{id}/competitors                        → add competitor URL + trigger scrape
  GET    /companies/{id}/competitors                        → list all competitors for a company
  PATCH  /companies/{id}/competitors/{comp_id}/manual      → manually paste competitor pricing text
  DELETE /companies/{id}/competitors/{comp_id}             → delete a competitor entry

WHY PATCH for manual text? PATCH means "partial update" — we're only changing
the scraped text fields, not replacing the entire competitor object (that would be PUT).

CONNECTED TO:
  - main.py      → router mounted at prefix="/companies"
  - models.py    → Competitor model (competitors table)
  - schemas.py   → CompetitorCreate, CompetitorResponse, ManualCompetitorText
  - auth.py      → get_current_user dependency
  - scraper.py   → scrape_competitor() and _clean_pricing_content() used here
  - analysis.py  → reads clean_scraped_text from DB for module3 benchmarking
─────────────────────────────────────────────────────────────────────────────
"""

import uuid

from datetime import datetime

from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.future import select

from database import get_db

from models import Company, Competitor, User

from schemas import CompetitorCreate, CompetitorResponse, ManualCompetitorText

from routers.auth import get_current_user

from scraper import _clean_pricing_content, scrape_competitor

router = APIRouter()

MAX_COMPETITORS = 5



async def _assert_company_owner(company_id, user, db):
    """Verify the given user owns the given company. Raises 404 if not found."""
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == user.id)
    )
    company = result.scalar_one_or_none()  # None if not found or not owned by user
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company  # the Company model object (used by callers if needed)


async def _run_scrape_and_save(competitor_id: uuid.UUID, url: str):
    """Background task: scrape a competitor URL and save the result to the DB.
    
    Called via FastAPI's BackgroundTasks after the 201 response is already sent.
    Uses its own DB session (AsyncSessionLocal) since the request session is closed.
    """
    from database import AsyncSessionLocal

    result = await scrape_competitor(url)

    async with AsyncSessionLocal() as db:
        q = await db.execute(select(Competitor).where(Competitor.id == competitor_id))
        comp = q.scalar_one_or_none()  # None if deleted while scraping was in progress

        if comp:
            comp.raw_scraped_text = result["text"]                    # full raw text (up to 12,000 chars)
            comp.clean_scraped_text = result.get("clean_text", "")   # noise-filtered text (up to 8,000 chars)
            comp.scrape_status = result["status"]                     # e.g., "success_layer1", "manual_required"
            await db.commit()  # save all 3 column updates to PostgreSQL



@router.post("/{company_id}/competitors", response_model=CompetitorResponse, status_code=status.HTTP_201_CREATED)
async def add_competitor(
    company_id: uuid.UUID,                               # company UUID from URL path
    body: CompetitorCreate,                              # contains validated URL (AnyHttpUrl)
    background_tasks: BackgroundTasks,                   # FastAPI background task runner
    current_user: User = Depends(get_current_user),      # authenticated user
    db: AsyncSession = Depends(get_db),                  # database session
):
    await _assert_company_owner(company_id, current_user, db)

    count_result = await db.execute(
        select(Competitor).where(Competitor.company_id == company_id)
    )
    if len(count_result.scalars().all()) >= MAX_COMPETITORS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_COMPETITORS} competitors allowed per company"
        )

    url_str = str(body.url)

    competitor = Competitor(
        id=uuid.uuid4(),                   # new UUID
        company_id=company_id,             # link to parent company
        url=url_str,                       # the competitor's pricing page URL
        scrape_status="pending",           # initial status before scraping runs
        created_at=datetime.utcnow(),      # creation timestamp
    )
    db.add(competitor)         # stage for INSERT
    await db.commit()          # execute INSERT (competitor now exists in DB)
    await db.refresh(competitor)  # reload to get the generated id

    background_tasks.add_task(_run_scrape_and_save, competitor.id, url_str)

    return competitor


@router.get("/{company_id}/competitors", response_model=List[CompetitorResponse])
async def list_competitors(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_company_owner(company_id, current_user, db)  # ownership check

    result = await db.execute(
        select(Competitor).where(Competitor.company_id == company_id)
    )
    return result.scalars().all()  # list of Competitor model objects → serialized as CompetitorResponse


@router.patch("/{company_id}/competitors/{competitor_id}/manual", response_model=CompetitorResponse)
async def set_manual_text(
    company_id: uuid.UUID,
    competitor_id: uuid.UUID,
    body: ManualCompetitorText,   # contains the pasted text (min_length=1)
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_company_owner(company_id, current_user, db)  # ownership check

    result = await db.execute(
        select(Competitor).where(
            Competitor.id == competitor_id,
            Competitor.company_id == company_id  # prevents cross-company access
        )
    )
    competitor = result.scalar_one_or_none()

    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")

    competitor.raw_scraped_text = body.text  # full pasted text (no length limit enforced here)

    competitor.clean_scraped_text = _clean_pricing_content(body.text)

    competitor.scrape_status = "manual"  # distinct from "success_layer1" or "success_layer2"

    await db.commit()          # save all 3 fields
    await db.refresh(competitor)  # reload from DB
    return competitor  # serialized as CompetitorResponse


@router.delete("/{company_id}/competitors/{competitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_competitor(
    company_id: uuid.UUID,
    competitor_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_company_owner(company_id, current_user, db)  # ownership check

    result = await db.execute(
        select(Competitor).where(
            Competitor.id == competitor_id,
            Competitor.company_id == company_id  # security: company ownership
        )
    )
    comp = result.scalar_one_or_none()

    if not comp:
        raise HTTPException(status_code=404, detail="Competitor not found")

    await db.delete(comp)  # delete the competitor row
    await db.commit()      # execute DELETE
