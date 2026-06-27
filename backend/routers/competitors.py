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
from scraper import scrape_competitor

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _assert_company_owner(
    company_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


async def _run_scrape_and_save(competitor_id: uuid.UUID, url: str):
    """Background task: scrape URL and persist result to DB."""
    from database import AsyncSessionLocal

    result = await scrape_competitor(url)
    async with AsyncSessionLocal() as db:
        q = await db.execute(select(Competitor).where(Competitor.id == competitor_id))
        comp = q.scalar_one_or_none()
        if comp:
            comp.raw_scraped_text = result["text"]
            comp.scrape_status = result["status"]
            await db.commit()


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post(
    "/{company_id}/competitors",
    response_model=CompetitorResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_competitor(
    company_id: uuid.UUID,
    body: CompetitorCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_company_owner(company_id, current_user, db)

    competitor = Competitor(
        id=uuid.uuid4(),
        company_id=company_id,
        url=body.url,
        scrape_status="pending",
        created_at=datetime.utcnow(),
    )
    db.add(competitor)
    await db.commit()
    await db.refresh(competitor)

    background_tasks.add_task(_run_scrape_and_save, competitor.id, body.url)
    return competitor


@router.get("/{company_id}/competitors", response_model=List[CompetitorResponse])
async def list_competitors(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_company_owner(company_id, current_user, db)

    result = await db.execute(
        select(Competitor).where(Competitor.company_id == company_id)
    )
    return result.scalars().all()


@router.patch(
    "/{company_id}/competitors/{competitor_id}/manual",
    response_model=CompetitorResponse,
)
async def set_manual_text(
    company_id: uuid.UUID,
    competitor_id: uuid.UUID,
    body: ManualCompetitorText,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _assert_company_owner(company_id, current_user, db)

    result = await db.execute(
        select(Competitor).where(
            Competitor.id == competitor_id,
            Competitor.company_id == company_id,
        )
    )
    competitor = result.scalar_one_or_none()
    if not competitor:
        raise HTTPException(status_code=404, detail="Competitor not found")

    competitor.raw_scraped_text = body.text
    competitor.scrape_status = "manual"
    await db.commit()
    await db.refresh(competitor)
    return competitor
