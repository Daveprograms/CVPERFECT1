from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import stripe
from datetime import datetime, timedelta

from ..database import get_db
from ..models.user import User, SubscriptionType
from ..schemas.billing import (
    SubscriptionCreate,
    SubscriptionResponse,
    PaymentIntentResponse,
    WebhookEvent
)
from .auth import get_current_user
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter()

# Subscription plans
SUBSCRIPTION_PLANS = {
    "pro_monthly": {
        "name": "Pro Monthly",
        "price_id": os.getenv("STRIPE_PRO_MONTHLY_PRICE_ID"),
        "type": SubscriptionType.PRO,
        "duration": timedelta(days=30)
    },
    "pro_yearly": {
        "name": "Pro Yearly",
        "price_id": os.getenv("STRIPE_PRO_YEARLY_PRICE_ID"),
        "type": SubscriptionType.PRO,
        "duration": timedelta(days=365)
    },
    "one_time": {
        "name": "One-Time Enhancement",
        "price_id": os.getenv("STRIPE_ONE_TIME_PRICE_ID"),
        "type": SubscriptionType.ONE_TIME,
        "enhancements": 1
    }
}

@router.post("/create-subscription", response_model=PaymentIntentResponse)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get plan details
    plan = SUBSCRIPTION_PLANS.get(subscription_data.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    try:
        # Create or get Stripe customer
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        # Create subscription
        if plan["type"] == SubscriptionType.PRO:
            subscription = stripe.Subscription.create(
                customer=current_user.stripe_customer_id,
                items=[{"price": plan["price_id"]}],
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )
            return {
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "subscription_id": subscription.id
            }
        else:  # One-time payment
            payment_intent = stripe.PaymentIntent.create(
                amount=1000,  # Amount in cents
                currency="usd",
                customer=current_user.stripe_customer_id,
                metadata={
                    "plan_id": subscription_data.plan_id,
                    "user_id": str(current_user.id)
                }
            )
            return {
                "client_secret": payment_intent.client_secret,
                "subscription_id": None
            }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event.type == "customer.subscription.created":
        subscription = event.data.object
        user = db.query(User).filter(
            User.stripe_customer_id == subscription.customer
        ).first()
        if user:
            plan = next(
                (p for p in SUBSCRIPTION_PLANS.values() if p["price_id"] == subscription.items.data[0].price.id),
                None
            )
            if plan:
                user.subscription_type = plan["type"]
                user.subscription_end_date = datetime.utcnow() + plan["duration"]
                db.commit()

    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        user = db.query(User).filter(
            User.stripe_customer_id == subscription.customer
        ).first()
        if user:
            user.subscription_type = SubscriptionType.FREE
            user.subscription_end_date = None
            db.commit()

    elif event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        if payment_intent.metadata.get("plan_id") == "one_time":
            user = db.query(User).filter(
                User.id == payment_intent.metadata.get("user_id")
            ).first()
            if user:
                user.subscription_type = SubscriptionType.ONE_TIME
                user.remaining_enhancements = 1
                db.commit()

    return {"status": "success"}

@router.get("/plans", response_model=List[SubscriptionResponse])
async def get_subscription_plans():
    return [
        {
            "id": plan_id,
            "name": plan["name"],
            "type": plan["type"],
            "price_id": plan["price_id"]
        }
        for plan_id, plan in SUBSCRIPTION_PLANS.items()
    ]

@router.get("/current-subscription", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_user: User = Depends(get_current_user)
):
    if current_user.subscription_type == SubscriptionType.FREE:
        return {
            "id": "free",
            "name": "Free Plan",
            "type": SubscriptionType.FREE
        }
    
    # Get active subscription from Stripe
    if current_user.stripe_customer_id:
        try:
            subscriptions = stripe.Subscription.list(
                customer=current_user.stripe_customer_id,
                status="active"
            )
            if subscriptions.data:
                subscription = subscriptions.data[0]
                plan = next(
                    (p for p in SUBSCRIPTION_PLANS.values() if p["price_id"] == subscription.items.data[0].price.id),
                    None
                )
                if plan:
                    return {
                        "id": subscription.id,
                        "name": plan["name"],
                        "type": plan["type"],
                        "price_id": plan["price_id"]
                    }
        except stripe.error.StripeError:
            pass
    
    return {
        "id": "one_time",
        "name": "One-Time Enhancement",
        "type": SubscriptionType.ONE_TIME
    } 