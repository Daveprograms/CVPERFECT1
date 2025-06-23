from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..models.user import SubscriptionType
from ..schemas import UserCreate, UserResponse, UserLogin
from ..schemas.auth import DeveloperCodeCreate
import firebase_admin
from firebase_admin import auth, credentials
import os
from dotenv import load_dotenv
from firebase_admin.exceptions import FirebaseError
from typing import Dict, Optional
import requests

load_dotenv()

# Initialize Firebase Admin if not already initialized
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
    firebase_admin.initialize_app(cred)

router = APIRouter()

async def get_current_user_test(
    authorization: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
):
    """Test version of get_current_user that bypasses Firebase authentication"""
    print(f"🔐 Test Auth Debug - Authorization header: {authorization}")
    
    if not authorization:
        print("❌ No authorization header provided")
        raise HTTPException(status_code=401, detail="No authentication token provided")
    
    # For testing, accept any Bearer token and return a test user
    if not authorization.startswith('Bearer '):
        print("❌ Invalid authorization format")
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization[7:]  # Remove 'Bearer '
    print(f"🔐 Test token received: {token[:20]}..." if len(token) > 20 else token)
    
    # Get or create test user
    test_user = db.query(User).filter(User.email == "test@example.com").first()
    if not test_user:
        print("📝 Creating test user...")
        test_user = User(
            email="test@example.com",
            full_name="Test User",
            firebase_uid="test_firebase_uid",
            subscription_type=SubscriptionType.FREE,  # Start with FREE for testing
            is_active=True
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        print(f"✅ Test user created: {test_user.email} (ID: {test_user.id})")
    else:
        print(f"✅ Test user found: {test_user.email} (ID: {test_user.id})")
    
    return test_user

async def get_current_user(
    authorization: Optional[str] = Header(None), 
    db: Session = Depends(get_db)
):
    print(f"🔐 Auth Debug - Authorization header: {authorization}")
    
    if not authorization:
        print("❌ No authorization header provided")
        raise HTTPException(status_code=401, detail="No authentication token provided")
    
    try:
        # Remove 'Bearer ' prefix if present
        token = authorization
        if token.startswith('Bearer '):
            token = token[7:]
        
        print(f"🔐 Extracted token: {token[:20]}..." if len(token) > 20 else token)
        
        # Verify the Firebase token
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        
        print(f"🔐 Firebase UID: {firebase_uid}")
        
        # Get user from database
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            print(f"❌ User not found in database for Firebase UID: {firebase_uid}")
            raise HTTPException(status_code=404, detail="User not found")
        
        print(f"✅ User authenticated: {user.email} (ID: {user.id})")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

@router.post("/login", response_model=Dict)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    try:
        # Get Firebase API key from environment
        firebase_api_key = os.getenv('FIREBASE_API_KEY')
        if not firebase_api_key:
            raise HTTPException(status_code=500, detail="Firebase API key not configured")

        # Sign in with Firebase
        response = requests.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={firebase_api_key}",
            json={
                "email": user_data.email,
                "password": user_data.password,
                "returnSecureToken": True
            }
        )
        
        if response.status_code != 200:
            error_data = response.json()
            if "EMAIL_NOT_FOUND" in str(error_data):
                raise HTTPException(status_code=401, detail="Email not found")
            elif "INVALID_PASSWORD" in str(error_data):
                raise HTTPException(status_code=401, detail="Invalid password")
            else:
                raise HTTPException(status_code=401, detail="Authentication failed")

        # Get user data from Firebase response
        firebase_data = response.json()
        firebase_uid = firebase_data['localId']
        
        # Get user from database
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found in database")

        return {
            "user": {
                "id": str(user.id),
                "email": user.email,
                "fullName": user.full_name,
                "subscription": user.subscription
            },
            "token": firebase_data['idToken'],
            "message": "Login successful"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.post("/signup", response_model=Dict)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user already exists in database
        existing_user = db.query(User).filter(User.email == user.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        # Create user in Firebase
        try:
            firebase_user = auth.create_user(
                email=user.email,
                password=user.password,
                display_name=user.fullName
            )
            
            # Get custom token for the new user
            custom_token = auth.create_custom_token(firebase_user.uid)
            
        except FirebaseError as e:
            error_message = str(e)
            if "EMAIL_EXISTS" in error_message:
                raise HTTPException(status_code=400, detail="Email already registered")
            elif "WEAK_PASSWORD" in error_message:
                raise HTTPException(status_code=400, detail="Password is too weak")
            elif "INVALID_EMAIL" in error_message:
                raise HTTPException(status_code=400, detail="Invalid email format")
            else:
                raise HTTPException(status_code=400, detail=f"Firebase error: {error_message}")
        
        # Create user in database
        db_user = User(
            email=user.email,
            full_name=user.fullName,
            firebase_uid=firebase_user.uid,
            subscription_type=SubscriptionType.FREE
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Return user data and token
        return {
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "fullName": db_user.full_name,
                "subscription": db_user.subscription
            },
            "token": custom_token.decode('utf-8'),
            "message": "User created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@router.post("/create-test-user")
async def create_test_user(db: Session = Depends(get_db)):
    """Create a test user for development/testing purposes"""
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            return {
                "message": "Test user already exists",
                "user": {
                    "id": str(existing_user.id),
                    "email": existing_user.email,
                    "subscription_type": existing_user.subscription_type
                }
            }

        # Create test user with Firebase
        try:
            firebase_user = auth.create_user(
                email="test@example.com",
                password="testpassword123",
                display_name="Test User"
            )
        except FirebaseError as e:
            if "EMAIL_EXISTS" in str(e):
                # User exists in Firebase, get the user
                firebase_user = auth.get_user_by_email("test@example.com")
            else:
                raise HTTPException(status_code=400, detail=f"Firebase error: {str(e)}")

        # Create user in database with PRO subscription
        db_user = User(
            email="test@example.com",
            full_name="Test User",
            firebase_uid=firebase_user.uid,
            subscription_type=SubscriptionType.FREE,  # Start with FREE subscription for testing
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return {
            "message": "Test user created successfully",
            "user": {
                "id": str(db_user.id),
                "email": db_user.email,
                "subscription_type": db_user.subscription_type,
                "firebase_uid": db_user.firebase_uid
            },
            "credentials": {
                "email": "test@example.com",
                "password": "testpassword123"
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create test user: {str(e)}")

@router.get("/subscription-status", response_model=dict)
async def get_subscription_status(current_user: User = Depends(get_current_user)):
    """Get user's subscription status with upload limits and features"""
    features = current_user.get_subscription_features()
    
    return {
        "subscription_type": current_user.subscription_type.value,
        "subscription_status": "active",
        "can_upload": current_user.can_upload(),
        "uploads_used": current_user.uploads_count,
        "upload_limit": current_user.get_upload_limit(),
        "features": features,
        "subscription_end_date": current_user.subscription_end_date.isoformat() if current_user.subscription_end_date else None
    }

@router.post("/validate-developer-code")
async def validate_developer_code(
    request: DeveloperCodeCreate,
    db: Session = Depends(get_db)
):
    """Validate developer code and upgrade user to PROFESSIONAL plan"""
    try:
        from ..config import settings
        from datetime import datetime, timedelta
        
        code = request.code.strip().upper()
        
        if not code:
            raise HTTPException(status_code=400, detail="Developer code is required")
        
        # Check if the code matches the configured developer code
        if code != settings.DEVELOPER_CODE:
            raise HTTPException(status_code=400, detail="Invalid developer code")
        
        # Get or create test user for developer code validation
        test_user = db.query(User).filter(User.email == "test@example.com").first()
        if not test_user:
            test_user = User(
                email="test@example.com",
                full_name="Test User",
                firebase_uid="test_firebase_uid",
                subscription_type=SubscriptionType.FREE,
                is_active=True
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        
        # Upgrade user to FREE plan (only enum value that exists in current DB)
        test_user.subscription_type = SubscriptionType.FREE
        test_user.subscription_end_date = datetime.utcnow() + timedelta(days=365)  # 1 year access
        test_user.uploads_count = 0  # Reset upload count
        test_user.last_upload_reset = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "🎉 Developer code activated! Developer access granted (using FREE plan due to DB constraints)",
            "subscription_type": test_user.subscription_type.value,
            "upload_limit": test_user.get_upload_limit(),
            "uploads_used": test_user.uploads_count,
            "subscription_end_date": test_user.subscription_end_date.isoformat(),
            "valid_until": "1 year"
        }
    except Exception as e:
        print(f"Error in validate_developer_code: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")