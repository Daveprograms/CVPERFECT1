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

# Subscription plans mapping to new enum values
SUBSCRIPTION_PLANS = {
    "basic_monthly": {
        "name": "Basic Monthly",
        "price_id": os.getenv("STRIPE_BASIC_MONTHLY_PRICE_ID"),
        "type": SubscriptionType.BASIC,
        "duration": timedelta(days=30)
    },
    "professional_monthly": {
        "name": "Professional Monthly", 
        "price_id": os.getenv("STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID"),
        "type": SubscriptionType.PROFESSIONAL,
        "duration": timedelta(days=30)
    },
    "enterprise_monthly": {
        "name": "Enterprise Monthly",
        "price_id": os.getenv("STRIPE_ENTERPRISE_MONTHLY_PRICE_ID"), 
        "type": SubscriptionType.ENTERPRISE,
        "duration": timedelta(days=30)
    },
    "basic_yearly": {
        "name": "Basic Yearly",
        "price_id": os.getenv("STRIPE_BASIC_YEARLY_PRICE_ID"),
        "type": SubscriptionType.BASIC,
        "duration": timedelta(days=365)
    },
    "professional_yearly": {
        "name": "Professional Yearly",
        "price_id": os.getenv("STRIPE_PROFESSIONAL_YEARLY_PRICE_ID"),
        "type": SubscriptionType.PROFESSIONAL,
        "duration": timedelta(days=365)
    },
    "enterprise_yearly": {
        "name": "Enterprise Yearly",
        "price_id": os.getenv("STRIPE_ENTERPRISE_YEARLY_PRICE_ID"),
        "type": SubscriptionType.ENTERPRISE,
        "duration": timedelta(days=365)
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
        subscription = stripe.Subscription.create(
            customer=current_user.stripe_customer_id,
            items=[{"price": plan["price_id"]}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
            metadata={
                "user_id": str(current_user.id),
                "plan_type": plan["type"].value
            }
        )
        
        return {
            "client_secret": subscription.latest_invoice.payment_intent.client_secret,
            "subscription_id": subscription.id
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
        await handle_subscription_created(subscription, db)
        
    elif event.type == "customer.subscription.updated":
        subscription = event.data.object
        await handle_subscription_updated(subscription, db)
        
    elif event.type == "customer.subscription.deleted":
        subscription = event.data.object
        await handle_subscription_deleted(subscription, db)
        
    elif event.type == "invoice.payment_succeeded":
        invoice = event.data.object
        await handle_payment_succeeded(invoice, db)

    return {"status": "success"}

async def handle_subscription_created(subscription, db: Session):
    """Handle subscription creation"""
    customer_id = subscription.customer
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    
    if user:
        # Get plan type from metadata
        plan_type = subscription.metadata.get("plan_type")
        if plan_type in [t.value for t in SubscriptionType]:
            user.subscription_type = SubscriptionType(plan_type)
            user.subscription_end_date = datetime.utcnow() + timedelta(days=30)  # Default to monthly
            db.commit()

async def handle_subscription_updated(subscription, db: Session):
    """Handle subscription updates"""
    customer_id = subscription.customer
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    
    if user:
        if subscription.status == "active":
            # Update to new plan type if available
            plan_type = subscription.metadata.get("plan_type")
            if plan_type in [t.value for t in SubscriptionType]:
                user.subscription_type = SubscriptionType(plan_type)
        elif subscription.status == "canceled":
            user.subscription_type = SubscriptionType.FREE
            user.subscription_end_date = None
        
        db.commit()

async def handle_subscription_deleted(subscription, db: Session):
    """Handle subscription cancellation"""
    customer_id = subscription.customer
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    
    if user:
        user.subscription_type = SubscriptionType.FREE
        user.subscription_end_date = None
        db.commit()

async def handle_payment_succeeded(invoice, db: Session):
    """Handle successful payment"""
    customer_id = invoice.customer
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    
    if user and invoice.subscription:
        # Extend subscription end date
        user.subscription_end_date = datetime.utcnow() + timedelta(days=30)  # Extend by 30 days
        db.commit()

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
    return {
        "id": "current",
        "name": f"{current_user.subscription_type.value.title()} Plan",
        "type": current_user.subscription_type
    }

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Stripe checkout session for subscription upgrade"""
    plan_id = request.get("plan_id")
    plan = SUBSCRIPTION_PLANS.get(plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    try:
        # Create or get Stripe customer
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name,
                metadata={"user_id": str(current_user.id)}
            )
            current_user.stripe_customer_id = customer.id
            db.commit()

        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': plan["price_id"],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{os.getenv('FRONTEND_URL')}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/billing/cancel",
            metadata={
                "user_id": str(current_user.id),
                "plan_type": plan["type"].value
            }
        )

        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel the current subscription"""
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found")

    try:
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status='active'
        )

        if not subscriptions.data:
            raise HTTPException(status_code=400, detail="No active subscription found")

        # Cancel the subscription
        subscription = subscriptions.data[0]
        stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True
        )

        return {
            "message": "Subscription will be canceled at the end of the current billing period",
            "cancel_at": subscription.current_period_end
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}") 