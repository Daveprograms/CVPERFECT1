from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional
import stripe
from ..database import get_db
from sqlalchemy.orm import Session
from ..models import User
from .auth import get_current_user
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/stripe", tags=["stripe"])

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Models
class CreateCheckoutSession(BaseModel):
    price_id: str

# Helper functions
def get_subscription_plan(price_id: str) -> dict:
    plans = {
        "price_monthly": {
            "name": "Monthly Pro",
            "interval": "month",
            "downloads": 50
        },
        "price_yearly": {
            "name": "Yearly Pro",
            "interval": "year",
            "downloads": 600
        }
    }
    return plans.get(price_id, {})

# Routes
@router.post("/create-checkout-session")
async def create_checkout_session(
    data: CreateCheckoutSession,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            payment_method_types=["card"],
            line_items=[{
                "price": data.price_id,
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{os.getenv('FRONTEND_URL')}/billing?success=true",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/billing?canceled=true",
            metadata={
                "user_id": str(current_user.id)
            }
        )
        
        return {"session_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        price_id = session["line_items"]["data"][0]["price"]["id"]
        
        # Get subscription plan details
        plan = get_subscription_plan(price_id)
        
        # Update user subscription
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.subscription = {
                "status": "active",
                "plan": "pro",
                "expiresAt": None,  # Will be updated on subscription end
                "stripe_subscription_id": session["subscription"],
                "plan_details": plan
            }
            db.commit()
    
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        user = db.query(User).filter(
            User.subscription["stripe_subscription_id"].astext == subscription["id"]
        ).first()
        
        if user:
            user.subscription = {
                "status": "inactive",
                "plan": "free",
                "expiresAt": None
            }
            db.commit()
    
    return {"status": "success"}

@router.get("/subscription")
async def get_subscription(
    current_user: User = Depends(get_current_user)
):
    if not current_user.subscription.get("stripe_subscription_id"):
        return {"status": "inactive"}
    
    try:
        subscription = stripe.Subscription.retrieve(
            current_user.subscription["stripe_subscription_id"]
        )
        
        return {
            "status": subscription.status,
            "current_period_end": subscription.current_period_end,
            "cancel_at_period_end": subscription.cancel_at_period_end
        }
    except Exception as e:
        return {"status": "inactive"} 