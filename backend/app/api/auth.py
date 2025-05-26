from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth
from typing import Optional
from datetime import datetime, timedelta
import jwt
import os

from ..database import get_db
from ..models.user import User, SubscriptionType
from ..schemas.auth import UserCreate, UserResponse, TokenResponse
from ..core.security import create_access_token, verify_token

router = APIRouter()
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        # Verify Firebase token
        token = credentials.credentials
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token['uid']

        # Get or create user in database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            # Create new user
            user = User(
                id=user_id,
                email=decoded_token.get('email'),
                full_name=decoded_token.get('name'),
                subscription_type=SubscriptionType.FREE
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        # Create user in Firebase
        user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.full_name
        )

        # Create user in database
        db_user = User(
            id=user.uid,
            email=user_data.email,
            full_name=user_data.full_name,
            subscription_type=SubscriptionType.FREE
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    db: Session = Depends(get_db)
):
    try:
        # Get Firebase token from request
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials"
            )

        token = auth_header.split(" ")[1]
        decoded_token = firebase_auth.verify_id_token(token)
        
        # Get or create user
        user = db.query(User).filter(User.id == decoded_token['uid']).first()
        if not user:
            user = User(
                id=decoded_token['uid'],
                email=decoded_token.get('email'),
                full_name=decoded_token.get('name'),
                subscription_type=SubscriptionType.FREE
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create access token
        access_token = create_access_token(user.id)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials"
        )

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.post("/developer-code")
async def use_developer_code(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from ..models.analytics import DeveloperCode
    
    # Check if code exists and is valid
    dev_code = db.query(DeveloperCode).filter(
        DeveloperCode.code == code,
        DeveloperCode.is_active == True,
        DeveloperCode.used_by == None,
        (DeveloperCode.expires_at == None) | (DeveloperCode.expires_at > datetime.utcnow())
    ).first()

    if not dev_code:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired developer code"
        )

    # Update user subscription
    current_user.subscription_type = SubscriptionType.PRO
    current_user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
    
    # Mark code as used
    dev_code.used_by = current_user.id
    dev_code.used_at = datetime.utcnow()
    dev_code.is_active = False

    db.commit()
    
    return {"message": "Developer code applied successfully"} 