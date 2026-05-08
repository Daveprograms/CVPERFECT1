"""
Pytest configuration. Requires PostgreSQL (set TEST_DATABASE_URL) for DB fixtures.
"""

import os
import sys

os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault(
    "DATABASE_URL",
    os.environ.get(
        "TEST_DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@127.0.0.1:5432/cvperfect_test",
    ),
)
os.environ.setdefault("JWT_SECRET", "pytest_jwt_secret_must_be_at_least_32_chars")
os.environ.setdefault("GEMINI_API_KEY", "test-key")
os.environ.setdefault("REDIS_ENABLED", "false")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_xxx")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_xxx")

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.user import User
from app.models.resume import Resume

SQLALCHEMY_DATABASE_URL = os.environ["DATABASE_URL"]

try:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, poolclass=StaticPool)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as exc:  # pragma: no cover
    engine = None
    TestingSessionLocal = None
    _db_import_error = exc
else:
    _db_import_error = None


@pytest.fixture(scope="session")
def db_engine():
    if engine is None:
        pytest.skip(f"PostgreSQL not available for tests: {_db_import_error}")
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
    }


@pytest.fixture
def test_user(db_session, test_user_data):
    from app.models.user import SubscriptionType
    from app.core.security import get_password_hash

    user = User(
        email=test_user_data["email"],
        hashed_password=get_password_hash(test_user_data["password"]),
        full_name=test_user_data["full_name"],
        subscription_type=SubscriptionType.FREE,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_resume_data():
    return {
        "filename": "test_resume.pdf",
        "content": "Test Resume Content",
        "file_type": "application/pdf",
        "file_size": 1024,
    }


@pytest.fixture
def test_resume(db_session, test_user, test_resume_data):
    resume = Resume(
        user_id=test_user.id,
        filename=test_resume_data["filename"],
        content=test_resume_data["content"],
        file_type=test_resume_data["file_type"],
        file_size=test_resume_data["file_size"],
    )
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    return resume


@pytest.fixture
def auth_headers(test_user):
    from app.core.security import create_access_token

    return {"Authorization": f"Bearer {create_access_token(str(test_user.id))}"}


@pytest.fixture
def authenticated_client(client, auth_headers):
    client.headers.update(auth_headers)
    return client
