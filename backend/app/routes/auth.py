import logging
import secrets
from datetime import datetime, timedelta
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..models.user import SubscriptionType
from ..schemas.auth import DeveloperCodeCreate
from ..core.config import settings
from ..core.dependencies import get_current_user
from ..core.security import create_access_token, get_password_hash
from ..services.auth_service import authenticate_user, create_user_record, get_user_by_email
from ..services.email_delivery import send_password_reset_email_now

logger = logging.getLogger(__name__)

router = APIRouter()


class UserSignupBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(validation_alias=AliasChoices("full_name", "fullName"))


class UserLoginBody(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequestBody(BaseModel):
    email: EmailStr


class ConfirmPasswordResetBody(BaseModel):
    token: str = Field(min_length=10)
    password: str = Field(min_length=8)


def _user_public(user: User) -> Dict[str, Any]:
    return {
        "id": str(user.id),
        "email": user.email,
        "fullName": user.full_name,
        "subscription": user.subscription_type.value,
    }


@router.post("/signup", response_model=Dict[str, Any])
async def signup(body: UserSignupBody, db: Session = Depends(get_db)):
    if get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user_record(db, body.email, body.password, body.full_name)
    token = create_access_token(str(user.id))
    return {
        "user": _user_public(user),
        "token": token,
        "message": "User created successfully",
    }


@router.post("/reset-password", response_model=Dict[str, Any])
async def request_password_reset(body: PasswordResetRequestBody, db: Session = Depends(get_db)):
    """Always responds success so email enumeration is not possible."""
    user = get_user_by_email(db, body.email)
    if user:
        token = secrets.token_urlsafe(32)
        user.password_reset_token = token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        try:
            if not send_password_reset_email_now(user.email, token):
                logger.warning("Password reset email SMTP failed for %s", user.email)
        except Exception:
            logger.exception("Password reset email failed for %s", user.email)
    return {
        "success": True,
        "message": "If an account exists for this email, you will receive reset instructions shortly.",
    }


@router.post("/confirm-password-reset", response_model=Dict[str, Any])
async def confirm_password_reset(body: ConfirmPasswordResetBody, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(User.password_reset_token == body.token.strip())
        .first()
    )
    now = datetime.utcnow()
    if (
        user is None
        or user.password_reset_expires is None
        or user.password_reset_expires < now
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user.hashed_password = get_password_hash(body.password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"success": True, "message": "Your password has been updated"}


@router.post("/login", response_model=Dict[str, Any])
async def login(body: UserLoginBody, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return {
        "user": _user_public(user),
        "token": token,
        "message": "Login successful",
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "fullName": current_user.full_name,
        "subscription_type": current_user.subscription_type.value,
        "subscription_status": "active",
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "onboarding_completed": current_user.onboarding_completed,
    }


@router.get("/subscription-status", response_model=dict)
async def get_subscription_status(current_user: User = Depends(get_current_user)):
    features = current_user.get_subscription_features()
    return {
        "subscription_type": current_user.subscription_type.value,
        "subscription_status": "active",
        "can_upload": current_user.can_upload(),
        "uploads_used": current_user.uploads_count,
        "upload_limit": current_user.get_upload_limit(),
        "features": features,
        "subscription_end_date": current_user.subscription_end_date.isoformat()
        if current_user.subscription_end_date
        else None,
    }


@router.post("/validate-developer-code")
async def validate_developer_code(request: DeveloperCodeCreate, db: Session = Depends(get_db)):
    code = request.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Developer code is required")

    dev_code = getattr(settings, "DEVELOPER_CODE", None) or ""
    if not dev_code or code != dev_code.strip().upper():
        raise HTTPException(status_code=400, detail="Invalid developer code")

    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        test_user = create_user_record(
            db,
            "test@example.com",
            "Testpassword123!",
            "Test User",
        )

    test_user.subscription_type = SubscriptionType.FREE
    test_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
    test_user.uploads_count = 0
    test_user.last_upload_reset = datetime.utcnow()
    db.commit()

    return {
        "success": True,
        "message": "Developer code activated",
        "subscription_type": test_user.subscription_type.value,
        "upload_limit": test_user.get_upload_limit(),
        "uploads_used": test_user.uploads_count,
        "subscription_end_date": test_user.subscription_end_date.isoformat(),
        "valid_until": "1 year",
    }
