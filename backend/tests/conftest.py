"""
PyTest Configuration and Fixtures
Shared test fixtures and configuration for backend tests
"""

import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Import app and database
from app.main import app
from app.database import Base, get_db
from app.core.config import settings
from app.models.user import User
from app.models.resume import Resume

# Test database URL - use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def db_engine():
    """Create database engine for tests"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create database session for each test"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """Create test client with database session override"""
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
    """Test user data for creating users"""
    return {
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User",
        "subscription_type": "free"
    }


@pytest.fixture
def test_user(db_session, test_user_data):
    """Create a test user in the database"""
    from app.core.security import get_password_hash
    
    user = User(
        email=test_user_data["email"],
        hashed_password=get_password_hash(test_user_data["password"]),
        full_name=test_user_data["full_name"],
        subscription_type=test_user_data["subscription_type"],
        is_active=True
    )
    
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    return user


@pytest.fixture
def test_resume_data():
    """Test resume data"""
    return {
        "filename": "test_resume.pdf",
        "content": "Test Resume Content\n\nExperience:\n- Software Developer at Tech Corp\n- Python, JavaScript, React\n\nEducation:\n- Computer Science Degree",
        "file_type": "application/pdf",
        "file_size": 1024
    }


@pytest.fixture
def test_resume(db_session, test_user, test_resume_data):
    """Create a test resume in the database"""
    resume = Resume(
        user_id=test_user.id,
        filename=test_resume_data["filename"],
        content=test_resume_data["content"],
        file_type=test_resume_data["file_type"],
        file_size=test_resume_data["file_size"]
    )
    
    db_session.add(resume)
    db_session.commit()
    db_session.refresh(resume)
    
    return resume


@pytest.fixture
def auth_headers(client, test_user_data):
    """Get authentication headers for test requests"""
    from app.core.security import create_access_token
    
    # Create token for test user
    access_token = create_access_token(data={"sub": test_user_data["email"]})
    
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def authenticated_client(client, test_user, auth_headers):
    """Test client with authenticated user"""
    client.headers.update(auth_headers)
    return client


@pytest.fixture(scope="session")
def mock_gemini_api():
    """Mock Gemini API responses"""
    class MockGeminiResponse:
        def __init__(self, text):
            self.text = text
    
    class MockGeminiModel:
        def generate_content(self, prompt):
            # Return mock analysis based on prompt type
            if "analyze" in prompt.lower():
                return MockGeminiResponse('''
                {
                    "overall_score": 85,
                    "ats_score": 78,
                    "strengths": ["Strong technical skills", "Good project experience"],
                    "feedback": [
                        {
                            "category": "technical",
                            "priority": "high",
                            "suggestion": "Add more specific technical details",
                            "example": "Quantify your achievements with metrics"
                        }
                    ],
                    "recommendations": ["Add quantifiable results", "Include relevant keywords"]
                }
                ''')
            elif "cover letter" in prompt.lower():
                return MockGeminiResponse("Dear Hiring Manager,\n\nI am writing to express my interest in the position...")
            elif "learning path" in prompt.lower():
                return MockGeminiResponse('''
                {
                    "learning_path": [
                        {
                            "skill": "Advanced Python",
                            "priority": "high",
                            "resources": ["Python documentation", "Advanced Python course"],
                            "estimated_time": "4 weeks"
                        }
                    ]
                }
                ''')
            else:
                return MockGeminiResponse('{"status": "success"}')
    
    return MockGeminiModel()


@pytest.fixture(autouse=True)
def mock_external_services(monkeypatch, mock_gemini_api):
    """Mock external services for all tests"""
    # Mock Gemini API
    monkeypatch.setattr("google.generativeai.GenerativeModel", lambda model_name: mock_gemini_api)
    
    # Mock file operations
    monkeypatch.setattr("os.remove", lambda path: None)
    monkeypatch.setattr("os.path.exists", lambda path: True)
    
    # Mock Redis (if used)
    class MockRedis:
        def __init__(self):
            self.data = {}
        
        def get(self, key):
            return self.data.get(key)
        
        def set(self, key, value, ex=None):
            self.data[key] = value
        
        def delete(self, key):
            self.data.pop(key, None)
    
    monkeypatch.setattr("redis.Redis", MockRedis)


@pytest.fixture
def sample_job_description():
    """Sample job description for testing"""
    return """
    Software Developer - Python/React
    
    We are looking for a skilled Software Developer to join our team.
    
    Requirements:
    - 3+ years of Python development experience
    - Experience with React and JavaScript
    - Knowledge of databases (PostgreSQL, MongoDB)
    - Experience with REST APIs
    - Git version control
    - Agile development experience
    
    Preferred:
    - AWS cloud experience
    - Docker containerization
    - CI/CD pipeline experience
    - TypeScript knowledge
    
    Responsibilities:
    - Develop and maintain web applications
    - Collaborate with cross-functional teams
    - Write clean, maintainable code
    - Participate in code reviews
    """


@pytest.fixture
def test_file_upload():
    """Mock file upload for testing"""
    from io import BytesIO
    
    file_content = b"Mock PDF content for testing resume upload functionality"
    
    return {
        "file": ("test_resume.pdf", BytesIO(file_content), "application/pdf"),
        "content": file_content
    }


# Environment setup for tests
@pytest.fixture(autouse=True)
def setup_test_environment(monkeypatch):
    """Set up test environment variables"""
    test_env_vars = {
        "ENVIRONMENT": "testing",
        "DATABASE_URL": SQLALCHEMY_DATABASE_URL,
        "SECRET_KEY": "test-secret-key",
        "GEMINI_API_KEY": "test-gemini-key",
        "REDIS_URL": "redis://localhost:6379/1",  # Use different DB for tests
        "ACCESS_TOKEN_EXPIRE_MINUTES": "30"
    }
    
    for key, value in test_env_vars.items():
        monkeypatch.setenv(key, value)


# Pytest configuration
def pytest_configure(config):
    """Configure pytest"""
    # Add custom markers
    config.addinivalue_line("markers", "slow: marks tests as slow")
    config.addinivalue_line("markers", "integration: marks tests as integration tests")
    config.addinivalue_line("markers", "unit: marks tests as unit tests")


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Mark integration tests
        if "integration" in item.nodeid:
            item.add_marker(pytest.mark.integration)
        # Mark unit tests
        elif "unit" in item.nodeid:
            item.add_marker(pytest.mark.unit)
        # Mark slow tests
        if "slow" in item.name or any(mark.name == "slow" for mark in item.iter_markers()):
            item.add_marker(pytest.mark.slow) 