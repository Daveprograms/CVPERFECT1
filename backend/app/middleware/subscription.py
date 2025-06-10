from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User, SubscriptionType
from ..routers import get_current_user
from datetime import datetime
from typing import Optional

async def check_subscription_access():
    async def _check_subscription(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if current_user.subscription_type == SubscriptionType.FREE:
            raise HTTPException(
                status_code=403,
                detail="Free users cannot access this feature. Please upgrade your subscription."
            )
        elif current_user.subscription_type == SubscriptionType.ONE_TIME:
            if current_user.remaining_enhancements <= 0:
                raise HTTPException(
                    status_code=403,
                    detail="No remaining enhancements. Please purchase more or upgrade to Pro."
                )
        return current_user
    return _check_subscription

async def decrement_enhancements(current_user: User, db: Session):
    if current_user.subscription_type == SubscriptionType.ONE_TIME:
        current_user.remaining_enhancements -= 1
        db.commit()

def check_feature_access(
    feature: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has access to a specific feature based on their subscription."""
    feature_access = {
        "resume_upload": [SubscriptionType.PRO, SubscriptionType.ONE_TIME],
        "resume_analysis": [SubscriptionType.PRO, SubscriptionType.ONE_TIME],
        "resume_enhance": [SubscriptionType.PRO, SubscriptionType.ONE_TIME],
        "cover_letter": [SubscriptionType.PRO],
        "learning_path": [SubscriptionType.PRO],
        "linkedin_integration": [SubscriptionType.PRO],
        "job_matches": [SubscriptionType.PRO],
        "resume_sharing": [SubscriptionType.PRO],
        "analytics": [SubscriptionType.PRO]
    }

    if feature not in feature_access:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid feature: {feature}"
        )

    if current_user.subscription_type not in feature_access[feature]:
        raise HTTPException(
            status_code=403,
            detail=f"This feature requires a Pro subscription."
        )

    return current_user 