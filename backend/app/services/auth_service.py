"""Authentication business logic (JWT + password)."""

from typing import Optional

from sqlalchemy.orm import Session

from ..models import User
from ..models.user import SubscriptionType
from ..core.security import get_password_hash, verify_password


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.lower().strip()).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password or ""):
        return None
    return user


def create_user_record(db: Session, email: str, password: str, full_name: str) -> User:
    user = User(
        email=email.lower().strip(),
        full_name=full_name.strip(),
        hashed_password=get_password_hash(password),
        subscription_type=SubscriptionType.FREE,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
