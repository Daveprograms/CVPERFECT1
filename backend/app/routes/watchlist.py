"""
Watchlist Router
Dream companies tracking and job alert management
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.watchlist import DreamCompany
from ..core.dependencies import get_current_user
from ..models.user import User
from pydantic import BaseModel

router = APIRouter()


# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class DreamCompanyCreate(BaseModel):
    company_name: str
    company_url: Optional[str] = None
    company_logo: Optional[str] = None
    industry: Optional[str] = None
    reasons: Optional[str] = None
    target_roles: Optional[list] = []
    alert_enabled: Optional[bool] = True


class DreamCompanyUpdate(BaseModel):
    company_url: Optional[str] = None
    industry: Optional[str] = None
    reasons: Optional[str] = None
    target_roles: Optional[list] = None
    alert_enabled: Optional[bool] = None


class DreamCompanyResponse(BaseModel):
    id: str
    company_name: str
    company_url: Optional[str]
    company_logo: Optional[str]
    industry: Optional[str]
    reasons: Optional[str]
    target_roles: list
    alert_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DreamCompanyResponse])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all dream companies in the user's watchlist"""
    companies = db.query(DreamCompany).filter(
        DreamCompany.user_id == str(current_user.id)
    ).order_by(DreamCompany.created_at.desc()).all()
    return companies


@router.post("/companies", response_model=DreamCompanyResponse, status_code=201)
async def add_dream_company(
    company: DreamCompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new dream company to the watchlist"""
    # Check for duplicates
    existing = db.query(DreamCompany).filter(
        DreamCompany.user_id == str(current_user.id),
        DreamCompany.company_name == company.company_name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"'{company.company_name}' is already in your watchlist"
        )

    db_company = DreamCompany(
        user_id=str(current_user.id),
        **company.model_dump()
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


@router.put("/companies/{company_id}", response_model=DreamCompanyResponse)
async def update_dream_company(
    company_id: str,
    updates: DreamCompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a dream company entry"""
    company = db.query(DreamCompany).filter(
        DreamCompany.id == company_id,
        DreamCompany.user_id == str(current_user.id)
    ).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found in watchlist")

    update_data = updates.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(company, field, value)

    company.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(company)
    return company


@router.delete("/companies/{company_id}", status_code=204)
async def remove_dream_company(
    company_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a company from the watchlist"""
    company = db.query(DreamCompany).filter(
        DreamCompany.id == company_id,
        DreamCompany.user_id == str(current_user.id)
    ).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found in watchlist")

    db.delete(company)
    db.commit()
    return None


@router.put("/companies/{company_id}/alerts")
async def toggle_alert(
    company_id: str,
    enabled: bool,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle job alerts for a specific dream company"""
    company = db.query(DreamCompany).filter(
        DreamCompany.id == company_id,
        DreamCompany.user_id == str(current_user.id)
    ).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found in watchlist")

    company.alert_enabled = enabled
    db.commit()

    return {
        "company_id": company_id,
        "company_name": company.company_name,
        "alert_enabled": enabled
    }


@router.get("/stats")
async def get_watchlist_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get watchlist statistics"""
    total = db.query(DreamCompany).filter(
        DreamCompany.user_id == str(current_user.id)
    ).count()

    alerts_active = db.query(DreamCompany).filter(
        DreamCompany.user_id == str(current_user.id),
        DreamCompany.alert_enabled == True
    ).count()

    return {
        "total_companies": total,
        "alerts_active": alerts_active,
        "alerts_inactive": total - alerts_active
    }
