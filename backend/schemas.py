from pydantic import BaseModel, EmailStr, Field, field_validator, AnyHttpUrl
from typing import Optional, List, Any
from datetime import datetime
import uuid


# ─── Auth ─────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)

# FIX 1: Separate login schema — no min_length so wrong passwords
# go to auth logic (401) not Pydantic (422)
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    created_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ResetPasswordBody(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


# ─── Company ──────────────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    industry: str = Field(min_length=1)
    description: Optional[str] = Field(default=None, max_length=500)

class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    industry: str
    description: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


# ─── Pricing Tier ─────────────────────────────────────────────────────────────

class TierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
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
    # FIX 2: min_length=1 already correct, also added strip whitespace
    feature_name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=300)

    @field_validator("feature_name")
    @classmethod
    def strip_feature_name(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("feature_name cannot be blank")
        return stripped


# ─── Competitor ───────────────────────────────────────────────────────────────

class CompetitorCreate(BaseModel):
    # FIX 3: AnyHttpUrl validates it's a real URL (must start with http/https)
    url: AnyHttpUrl

    @field_validator("url", mode="before")
    @classmethod
    def ensure_string(cls, v):
        return str(v) if not isinstance(v, str) else v

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
    progress: int
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
