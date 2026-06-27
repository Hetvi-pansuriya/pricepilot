from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime
import uuid


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Company ──────────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    name: str = Field(min_length=1)
    industry: str = Field(min_length=1)
    description: Optional[str] = None


class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    industry: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Pricing Tier ─────────────────────────────────────────────────────────────

class TierCreate(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    billing_cycle: str = Field(default="monthly", pattern="^(monthly|annual)$")
    user_count: int = Field(ge=0, default=0)
    churn_rate: Optional[float] = Field(default=None, ge=0, le=1)


class FeatureResponse(BaseModel):
    id: uuid.UUID
    feature_name: str
    description: Optional[str]

    model_config = {"from_attributes": True}


class TierResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: str
    price: float
    billing_cycle: str
    user_count: int
    churn_rate: Optional[float]
    created_at: datetime
    features: List[FeatureResponse] = []

    model_config = {"from_attributes": True}


# ─── Feature ──────────────────────────────────────────────────────────────────

class FeatureCreate(BaseModel):
    feature_name: str = Field(min_length=1)
    description: Optional[str] = None


# ─── Competitor ───────────────────────────────────────────────────────────────

class CompetitorCreate(BaseModel):
    url: str = Field(min_length=1)


class ManualCompetitorText(BaseModel):
    text: str = Field(min_length=1)


class CompetitorResponse(BaseModel):
    id: uuid.UUID
    company_id: uuid.UUID
    name: Optional[str]
    url: str
    scrape_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Analysis ─────────────────────────────────────────────────────────────────

class AnalysisStartResponse(BaseModel):
    session_id: uuid.UUID


class ProgressUpdate(BaseModel):
    progress: int
    status: str
    report_id: Optional[uuid.UUID] = None


class ReportResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    json_report: Any
    pdf_path: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class AnalysisHistoryItem(BaseModel):
    session_id: uuid.UUID
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    report_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}


# ─── Company Detail (with nested relations) ───────────────────────────────────

class CompanyDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    industry: str
    description: Optional[str]
    created_at: datetime
    tiers: List[TierResponse] = []
    competitors: List[CompetitorResponse] = []

    model_config = {"from_attributes": True}
