from datetime import datetime, timedelta
from typing import Optional
import os

import bcrypt
from jose import ExpiredSignatureError, JWTError, jwt
from fastapi import HTTPException

from dotenv import load_dotenv
from pathlib import Path

_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BACKEND_ROOT / ".env")
load_dotenv(_BACKEND_ROOT / "env")

SECRET_KEY = os.getenv("JWT_SECRET") or os.getenv("JWT_SECRET_KEY") or ""
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))


def create_access_token(user_id: str) -> str:
    if not SECRET_KEY or SECRET_KEY.startswith("change-me"):
        raise RuntimeError("JWT_SECRET is not configured")
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": user_id, "exp": expire, "iat": datetime.utcnow()}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> str:
    if not SECRET_KEY:
        raise HTTPException(status_code=500, detail="Server authentication is not configured")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return user_id
    except ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Token has expired") from exc
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False
