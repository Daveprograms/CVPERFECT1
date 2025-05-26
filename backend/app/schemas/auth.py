from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime
from ..models.user import SubscriptionType

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: constr(min_length=8)

class UserResponse(UserBase):
    id: str
    subscription_type: SubscriptionType
    subscription_end_date: Optional[datetime]
    remaining_enhancements: int
    created_at: datetime
    updated_at: Optional[datetime]
    is_active: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class DeveloperCodeCreate(BaseModel):
    code: str
    expires_at: Optional[datetime] = None

class DeveloperCodeResponse(BaseModel):
    code: str
    created_at: datetime
    expires_at: Optional[datetime]
    is_active: bool
    used_by: Optional[str]
    used_at: Optional[datetime]

    class Config:
        from_attributes = True 