"""
Local-only diagnostic: verify GEMINI_API_KEY works with Gemini.

Prints a simple status message and exits non-zero on failure.
Does not print the API key.
"""

from __future__ import annotations

import sys


def main() -> int:
    from app.services.gemini_service import verify_gemini_api_key

    ok, reason = verify_gemini_api_key()
    if ok:
        print("GEMINI VERIFY: OK")
        return 0
    print(f"GEMINI VERIFY: FAILED - {reason}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())

