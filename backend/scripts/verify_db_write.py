import os
import sys

BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

if not os.getenv("DATABASE_URL"):
    print("Set DATABASE_URL to your PostgreSQL connection string before running.")
    sys.exit(1)

from app.database import SessionLocal
from app.models.user import SubscriptionType, User
from app.core.security import get_password_hash


def main() -> None:
    print("DATABASE_URL:", os.getenv("DATABASE_URL", "")[:40] + "...")

    email = "localtest@example.com"
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                full_name="Local Test",
                hashed_password=get_password_hash("Localtest123!"),
                subscription_type=SubscriptionType.FREE,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("created: true")
        else:
            print("created: false")

        print("user_id:", str(user.id))
        print("user_email:", user.email)
        print("user_count:", db.query(User).count())
    finally:
        db.close()


if __name__ == "__main__":
    main()
