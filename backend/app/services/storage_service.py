"""
Optional Supabase Storage uploads. If SUPABASE_URL / SUPABASE_SERVICE_KEY are unset,
callers should keep using local disk paths only.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


def supabase_enabled() -> bool:
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_SERVICE_KEY"))


def upload_local_file(object_key: str, file_path: str, content_type: Optional[str] = None) -> Optional[str]:
    """
    Upload a file from disk to Supabase Storage. Returns public/signed URL prefix or None on skip/failure.
    """
    if not supabase_enabled():
        return None

    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "resumes")
    path = f"{base}/storage/v1/object/{bucket}/{object_key.lstrip('/')}"

    ct = content_type or "application/octet-stream"
    try:
        data = Path(file_path).read_bytes()
        with httpx.Client(timeout=60.0) as client:
            r = client.post(
                path,
                content=data,
                headers={
                    "Authorization": f"Bearer {key}",
                    "apikey": key,
                    "Content-Type": ct,
                    "x-upsert": "true",
                },
            )
        if r.status_code >= 400:
            logger.warning("Supabase upload failed: %s %s", r.status_code, r.text[:200])
            return None
        return path
    except Exception as exc:
        logger.warning("Supabase upload error: %s", exc)
        return None
