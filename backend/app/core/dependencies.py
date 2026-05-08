"""
Shared FastAPI dependencies (auth, DB session wiring).
"""

from typing import Optional
from uuid import UUID

from fastapi import Cookie, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from .security import verify_token


def _extract_bearer(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if authorization.startswith("Bearer "):
        return authorization[7:].strip()
    return None


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    auth_token: Optional[str] = Cookie(None, alias="auth_token"),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the current user from either:
    - Authorization: Bearer <jwt> (used by Next.js BFF and API clients)
    - HTTP-only cookie auth_token (used by browser -> /backend proxy on same origin)
    """
    token = _extract_bearer(authorization) or auth_token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = verify_token(token)
    try:
        uid = UUID(user_id) if isinstance(user_id, str) else user_id
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid token subject") from exc

    user = db.query(User).filter(User.id == uid).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user
