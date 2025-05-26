from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse, UserLogin
import firebase_admin
from firebase_admin import auth, credentials
import os
from dotenv import load_dotenv
from firebase_admin.exceptions import FirebaseError
from typing import Dict
import requests

load_dotenv()

# Initialize Firebase Admin if not already initialized
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate(os.getenv('FIREBASE_CREDENTIALS_PATH'))
    firebase_admin.initialize_app(cred)

router = APIRouter()

async def get_current_user(token: str = Depends(lambda x: x.headers.get("Authorization")), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="No authentication token provided")
    
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Verify the Firebase token
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token['uid']
        
        # Get user from database
        user = db.query(User).filter(User.firebase_uid == firebase_uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user
    except Exception as e:
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
            subscription={
                "status": "inactive",
                "plan": "free",
                "expiresAt": None
            }
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