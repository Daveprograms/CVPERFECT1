from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.user import SubscriptionType

class CreateCheckoutSessionRequest(BaseModel):
    price_id: str  # "pro_monthly" or "one_time"

class CreateCheckoutSessionResponse(BaseModel):
    session_id: str
    url: str

class SubscriptionCreate(BaseModel):
    plan_id: str

class SubscriptionResponse(BaseModel):
    id: str
    name: str
    type: SubscriptionType
    price_id: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    client_secret: str
    subscription_id: Optional[str] = None

class WebhookEvent(BaseModel):
    type: str
    data: dict

class PriceInfo(BaseModel):
    id: str
    name: str
    description: str
    amount: int
    currency: str
    interval: Optional[str] = None  # For subscriptions

class PlanInfo(BaseModel):
    id: str
    name: str
    description: str
    features: list[str]
    price: PriceInfo
    recommended: bool = False 