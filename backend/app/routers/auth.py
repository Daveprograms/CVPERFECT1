from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..models.user import SubscriptionType
from ..schemas import UserCreate, UserResponse, UserLogin
from ..schemas.auth import DeveloperCodeCreate
import os
import bcrypt
from dotenv import load_dotenv
from typing import Dict, Optional
from jose import JWTError, jwt
from datetime import datetime, timedelta

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "changeme-insecure-default")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

router = APIRouter()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No authentication token provided")

    token = authorization[7:]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/login", response_model=Dict)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "fullName": user.full_name,
            "subscription_type": user.subscription_type.value,
        },
        "message": "Login successful",
    }


@router.post("/signup", response_model=Dict)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    db_user = User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hash_password(user.password),
        subscription_type=SubscriptionType.FREE,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {
        "user": {
            "id": str(db_user.id),
            "email": db_user.email,
            "fullName": db_user.full_name,
        },
        "message": "User created successfully",
    }


@router.get("/me", response_model=Dict)
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
async def validate_developer_code(
    request: DeveloperCodeCreate,
    db: Session = Depends(get_db),
):
    try:
        from ..config import settings

        code = request.code.strip().upper()
        if not code:
            raise HTTPException(status_code=400, detail="Developer code is required")
        if code != settings.DEVELOPER_CODE:
            raise HTTPException(status_code=400, detail="Invalid developer code")

        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                full_name="Test User",
                hashed_password=hash_password("testpassword123"),
                subscription_type=SubscriptionType.FREE,
                is_active=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)

        test_user.subscription_type = SubscriptionType.FREE
        test_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)
        test_user.uploads_count = 0
        test_user.last_upload_reset = datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "message": "Developer code activated!",
            "subscription_type": test_user.subscription_type.value,
            "upload_limit": test_user.get_upload_limit(),
            "uploads_used": test_user.uploads_count,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
