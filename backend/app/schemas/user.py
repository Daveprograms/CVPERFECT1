from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any
from datetime import datetime
from ..models.user import SubscriptionType

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase):
    id: int
    subscription_type: SubscriptionType
    remaining_enhancements: int
    subscription_end_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    preferences: Dict[str, Any] = {}

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None 


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
    
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserSignupResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse                  