import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from database import get_db
from models import Company, PricingTier, Feature, User
from schemas import (
    CompanyCreate, CompanyResponse, CompanyDetailResponse,
    TierCreate, TierResponse,
    FeatureCreate, FeatureResponse,
)
from routers.auth import get_current_user

router = APIRouter()


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
    # Ownership check (lightweight — no joins needed)
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Company not found")

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

    # Reload with features (empty list on creation)
    result2 = await db.execute(
        select(PricingTier)
        .where(PricingTier.id == tier.id)
        .options(selectinload(PricingTier.features))
    )
    return result2.scalar_one()


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
    # Verify ownership via company
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Company not found")

    # Verify tier belongs to company
    result2 = await db.execute(
        select(PricingTier).where(PricingTier.id == tier_id, PricingTier.company_id == company_id)
    )
    if not result2.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Tier not found")

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
