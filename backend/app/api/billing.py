from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any
import stripe
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from ..database import get_db
from ..models.user import User, SubscriptionType
from ..models.analytics import Analytics, ActionType
from ..schemas.billing import (
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    SubscriptionResponse,
    WebhookEvent
)
from .auth import get_current_user

load_dotenv()

router = APIRouter()
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Stripe price IDs
PRICE_IDS = {
    "pro_monthly": os.getenv("STRIPE_PRO_MONTHLY_PRICE_ID"),
    "one_time": os.getenv("STRIPE_ONE_TIME_PRICE_ID")
}

@router.post("/create-checkout-session", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Create or get Stripe customer
        if not current_user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name,
                metadata={"user_id": current_user.id}
            )
            current_user.stripe_customer_id = customer.id
            db.commit()
        else:
            customer = stripe.Customer.retrieve(current_user.stripe_customer_id)

        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=["card"],
            line_items=[{
                "price": PRICE_IDS[request.price_id],
                "quantity": 1
            }],
            mode="subscription" if request.price_id == "pro_monthly" else "payment",
            success_url=f"{os.getenv('FRONTEND_URL')}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/billing/cancel",
            metadata={
                "user_id": current_user.id,
                "price_id": request.price_id
            }
        )

        return {"session_id": session.id, "url": session.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.getenv("STRIPE_WEBHOOK_SECRET")
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle the event
    if event.type == "checkout.session.completed":
        session = event.data.object
        user_id = session.metadata.get("user_id")
        price_id = session.metadata.get("price_id")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if price_id == "pro_monthly":
            # Update user to Pro subscription
            user.subscription_type = SubscriptionType.PRO
            user.subscription_end_date = datetime.utcnow() + timedelta(days=30)
        elif price_id == "one_time":
            # Add 4 enhancements to user
            user.subscription_type = SubscriptionType.ONE_TIME
            user.remaining_enhancements = 4

        # Track analytics
        analytics = Analytics(
            user_id=user.id,
            action_type=ActionType.SUBSCRIPTION_CHANGE,
            metadata={
                "price_id": price_id,
                "amount": session.amount_total / 100,  # Convert from cents
                "currency": session.currency
            }
        )
        db.add(analytics)
        db.commit()

    elif event.type == "customer.subscription.updated":
        subscription = event.data.object
        user = db.query(User).filter(
            User.stripe_customer_id == subscription.customer
        ).first()
        
        if user and subscription.status == "active":
            user.subscription_end_date = datetime.fromtimestamp(
                subscription.current_period_end
            )
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

    return {"status": "success"}

@router.get("/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.stripe_customer_id:
        return {
            "subscription_type": current_user.subscription_type,
            "subscription_end_date": current_user.subscription_end_date,
            "remaining_enhancements": current_user.remaining_enhancements
        }

    try:
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="active"
        )

        if subscriptions.data:
            subscription = subscriptions.data[0]
            return {
                "subscription_type": current_user.subscription_type,
                "subscription_end_date": datetime.fromtimestamp(
                    subscription.current_period_end
                ),
                "remaining_enhancements": current_user.remaining_enhancements,
                "stripe_subscription_id": subscription.id,
                "stripe_price_id": subscription.items.data[0].price.id
            }
        else:
            return {
                "subscription_type": current_user.subscription_type,
                "subscription_end_date": current_user.subscription_end_date,
                "remaining_enhancements": current_user.remaining_enhancements
            }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.stripe_customer_id:
        raise HTTPException(
            status_code=400,
            detail="No active subscription found"
        )

    try:
        # Get active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=current_user.stripe_customer_id,
            status="active"
        )

        if not subscriptions.data:
            raise HTTPException(
                status_code=400,
                detail="No active subscription found"
            )

        # Cancel the subscription at period end
        subscription = subscriptions.data[0]
        stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True
        )

        return {"message": "Subscription will be canceled at the end of the billing period"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e)) 