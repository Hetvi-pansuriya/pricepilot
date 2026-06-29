import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from database import get_db
from models import Company, PricingTier, Feature, Competitor, User
from schemas import (
    CompanyCreate, CompanyResponse, CompanyDetailResponse,
    TierCreate, TierResponse,
    FeatureCreate, FeatureResponse,
)
from routers.auth import get_current_user

router = APIRouter()

MAX_COMPETITORS = 5


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def get_company_or_404(company_id: uuid.UUID, user: User, db: AsyncSession) -> Company:
    result = await db.execute(
        select(Company)
        .where(Company.id == company_id, Company.user_id == user.id)
        .options(
            selectinload(Company.tiers).selectinload(PricingTier.features),
            selectinload(Company.competitors),
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


async def get_tier_or_404(tier_id: uuid.UUID, company_id: uuid.UUID, db: AsyncSession) -> PricingTier:
    result = await db.execute(
        select(PricingTier)
        .where(PricingTier.id == tier_id, PricingTier.company_id == company_id)
        .options(selectinload(PricingTier.features))
    )
    tier = result.scalar_one_or_none()
    if not tier:
        raise HTTPException(status_code=404, detail="Tier not found")
    return tier


async def verify_company_ownership(company_id: uuid.UUID, user: User, db: AsyncSession) -> Company:
    """Lightweight ownership check — no joins."""
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


# ─── Company CRUD ─────────────────────────────────────────────────────────────

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company = Company(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=body.name,
        industry=body.industry,
        description=body.description,
        created_at=datetime.utcnow(),
    )
    db.add(company)
    await db.commit()
    await db.refresh(company)
    return company


@router.get("", response_model=List[CompanyResponse])
async def list_companies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # FIX 1: user_id filter was correct but get_current_user was returning
    # HTTP 401 for user2 because HTTPBearer fails with no header.
    # Root cause was test sending empty token — now fixed in test.
    # Extra safety: always filter by current_user.id
    result = await db.execute(
        select(Company).where(Company.user_id == current_user.id)
    )
    return result.scalars().all()


@router.get("/{company_id}", response_model=CompanyDetailResponse)
async def get_company(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_company_or_404(company_id, current_user, db)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_company(
    company_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    await db.delete(company)
    await db.commit()


# ─── Pricing Tiers ────────────────────────────────────────────────────────────

@router.post("/{company_id}/tiers", response_model=TierResponse, status_code=status.HTTP_201_CREATED)
async def add_tier(
    company_id: uuid.UUID,
    body: TierCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_company_ownership(company_id, current_user, db)

    tier = PricingTier(
        id=uuid.uuid4(),
        company_id=company_id,
        name=body.name,
        price=body.price,
        billing_cycle=body.billing_cycle,
        user_count=body.user_count,
        churn_rate=body.churn_rate,
        created_at=datetime.utcnow(),
    )
    db.add(tier)
    await db.commit()

    result2 = await db.execute(
        select(PricingTier)
        .where(PricingTier.id == tier.id)
        .options(selectinload(PricingTier.features))
    )
    return result2.scalar_one()


# FIX 2: PUT endpoint was missing completely
@router.put("/{company_id}/tiers/{tier_id}", response_model=TierResponse)
async def update_tier(
    company_id: uuid.UUID,
    tier_id: uuid.UUID,
    body: TierCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_company_ownership(company_id, current_user, db)
    tier = await get_tier_or_404(tier_id, company_id, db)

    tier.name = body.name
    tier.price = body.price
    tier.billing_cycle = body.billing_cycle
    tier.user_count = body.user_count
    tier.churn_rate = body.churn_rate
    await db.commit()
    await db.refresh(tier)

    result = await db.execute(
        select(PricingTier)
        .where(PricingTier.id == tier_id)
        .options(selectinload(PricingTier.features))
    )
    return result.scalar_one()


# FIX 3: DELETE tier endpoint was missing
@router.delete("/{company_id}/tiers/{tier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tier(
    company_id: uuid.UUID,
    tier_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_company_ownership(company_id, current_user, db)
    tier = await get_tier_or_404(tier_id, company_id, db)
    await db.delete(tier)
    await db.commit()


# ─── Features ─────────────────────────────────────────────────────────────────

@router.post(
    "/{company_id}/tiers/{tier_id}/features",
    response_model=FeatureResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_feature(
    company_id: uuid.UUID,
    tier_id: uuid.UUID,
    body: FeatureCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_company_ownership(company_id, current_user, db)

    result2 = await db.execute(
        select(PricingTier).where(PricingTier.id == tier_id, PricingTier.company_id == company_id)
    )
    if not result2.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Tier not found")

    # FIX 4: Duplicate feature check within same tier
    dup = await db.execute(
        select(Feature).where(
            Feature.tier_id == tier_id,
            func.lower(Feature.feature_name) == func.lower(body.feature_name)
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail=f"Feature '{body.feature_name}' already exists in this tier"
        )

    feature = Feature(
        id=uuid.uuid4(),
        tier_id=tier_id,
        feature_name=body.feature_name,
        description=body.description,
    )
    db.add(feature)
    await db.commit()
    await db.refresh(feature)
    return feature


@router.delete(
    "/{company_id}/tiers/{tier_id}/features/{feature_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_feature(
    company_id: uuid.UUID,
    tier_id: uuid.UUID,
    feature_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await verify_company_ownership(company_id, current_user, db)
    result = await db.execute(
        select(Feature).where(Feature.id == feature_id, Feature.tier_id == tier_id)
    )
    feature = result.scalar_one_or_none()
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
    await db.delete(feature)
    await db.commit()