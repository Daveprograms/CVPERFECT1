"""
Authentication Tests
Tests for user authentication, registration, and JWT handling
"""

import pytest
from fastapi.testclient import TestClient
from app.core.security import verify_password, get_password_hash, create_access_token


class TestUserRegistration:
    """Test user registration functionality"""
    
    def test_register_new_user(self, client: TestClient):
        """Test registering a new user"""
        user_data = {
            "email": "newuser@example.com",
            "password": "securepassword123",
            "full_name": "New User"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["full_name"] == user_data["full_name"]
        assert "id" in data
        assert "hashed_password" not in data  # Should not return password
    
    def test_register_duplicate_email(self, client: TestClient, test_user):
        """Test registering with an email that already exists"""
        user_data = {
            "email": test_user.email,  # Use existing user's email
            "password": "anotherpassword123",
            "full_name": "Another User"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email(self, client: TestClient):
        """Test registering with invalid email format"""
        user_data = {
            "email": "invalid-email",
            "password": "securepassword123",
            "full_name": "Test User"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_register_weak_password(self, client: TestClient):
        """Test registering with weak password"""
        user_data = {
            "email": "test@example.com",
            "password": "123",  # Too short
            "full_name": "Test User"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error


class TestUserLogin:
    """Test user login functionality"""
    
    def test_login_valid_credentials(self, client: TestClient, test_user, test_user_data):
        """Test login with valid credentials"""
        login_data = {
            "username": test_user_data["email"],  # FastAPI OAuth2 uses 'username'
            "password": test_user_data["password"]
        }
        
        response = client.post("/api/auth/token", data=login_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_email(self, client: TestClient):
        """Test login with non-existent email"""
        login_data = {
            "username": "nonexistent@example.com",
            "password": "anypassword"
        }
        
        response = client.post("/api/auth/token", data=login_data)
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_invalid_password(self, client: TestClient, test_user_data):
        """Test login with wrong password"""
        login_data = {
            "username": test_user_data["email"],
            "password": "wrongpassword"
        }
        
        response = client.post("/api/auth/token", data=login_data)
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_inactive_user(self, client: TestClient, db_session, test_user, test_user_data):
        """Test login with inactive user account"""
        # Deactivate user
        test_user.is_active = False
        db_session.commit()
        
        login_data = {
            "username": test_user_data["email"],
            "password": test_user_data["password"]
        }
        
        response = client.post("/api/auth/token", data=login_data)
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()


class TestProtectedEndpoints:
    """Test access to protected endpoints"""
    
    def test_access_protected_endpoint_with_valid_token(self, authenticated_client: TestClient):
        """Test accessing protected endpoint with valid JWT token"""
        response = authenticated_client.get("/api/auth/me")
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "full_name" in data
    
    def test_access_protected_endpoint_without_token(self, client: TestClient):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401
        assert "not authenticated" in response.json()["detail"].lower()
    
    def test_access_protected_endpoint_with_invalid_token(self, client: TestClient):
        """Test accessing protected endpoint with invalid token"""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
        assert "token" in response.json()["detail"].lower()
    
    def test_access_protected_endpoint_with_expired_token(self, client: TestClient, test_user_data):
        """Test accessing protected endpoint with expired token"""
        # Create an expired token (negative expiry)
        expired_token = create_access_token(
            data={"sub": test_user_data["email"]}, 
            expires_delta={"minutes": -30}  # Expired 30 minutes ago
        )
        
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401


class TestPasswordUtilities:
    """Test password hashing and verification utilities"""
    
    def test_password_hashing(self):
        """Test password hashing functionality"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password  # Should be hashed
        assert len(hashed) > 20  # Should be reasonably long
        assert verify_password(password, hashed)  # Should verify correctly
    
    def test_password_verification_invalid(self):
        """Test password verification with wrong password"""
        password = "testpassword123"
        wrong_password = "wrongpassword123"
        hashed = get_password_hash(password)
        
        assert not verify_password(wrong_password, hashed)
    
    def test_different_passwords_different_hashes(self):
        """Test that different passwords produce different hashes"""
        password1 = "password123"
        password2 = "password456"
        
        hash1 = get_password_hash(password1)
        hash2 = get_password_hash(password2)
        
        assert hash1 != hash2


class TestTokenGeneration:
    """Test JWT token generation and validation"""
    
    def test_create_access_token(self):
        """Test access token creation"""
        user_email = "test@example.com"
        token = create_access_token(data={"sub": user_email})
        
        assert isinstance(token, str)
        assert len(token) > 10  # Should be reasonably long
    
    def test_token_contains_user_data(self, test_user_data):
        """Test that token contains user data"""
        from app.core.security import decode_token
        
        token = create_access_token(data={"sub": test_user_data["email"]})
        decoded = decode_token(token)
        
        assert decoded["sub"] == test_user_data["email"]
    
    def test_token_expiration(self):
        """Test token expiration"""
        from datetime import datetime, timedelta
        from app.core.security import decode_token
        
        # Create token with short expiry
        token = create_access_token(
            data={"sub": "test@example.com"},
            expires_delta=timedelta(seconds=1)
        )
        
        decoded = decode_token(token)
        
        # Check that expiry is set
        assert "exp" in decoded
        assert decoded["exp"] > datetime.utcnow().timestamp()


class TestUserProfileUpdate:
    """Test user profile update functionality"""
    
    def test_update_user_profile(self, authenticated_client: TestClient, test_user):
        """Test updating user profile"""
        update_data = {
            "full_name": "Updated Name",
            "bio": "Updated bio"
        }
        
        response = authenticated_client.put("/api/auth/me", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == update_data["full_name"]
    
    def test_update_user_email(self, authenticated_client: TestClient):
        """Test updating user email"""
        update_data = {
            "email": "newemail@example.com"
        }
        
        response = authenticated_client.put("/api/auth/me", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == update_data["email"]
    
    def test_update_user_profile_unauthenticated(self, client: TestClient):
        """Test updating profile without authentication"""
        update_data = {
            "full_name": "Updated Name"
        }
        
        response = client.put("/api/auth/me", json=update_data)
        
        assert response.status_code == 401


class TestPasswordReset:
    """Test password reset functionality"""
    
    def test_request_password_reset(self, client: TestClient, test_user):
        """Test requesting password reset"""
        reset_data = {
            "email": test_user.email
        }
        
        response = client.post("/api/auth/password-reset-request", json=reset_data)
        
        assert response.status_code == 200
        assert "reset instructions" in response.json()["message"].lower()
    
    def test_request_password_reset_nonexistent_email(self, client: TestClient):
        """Test requesting password reset for non-existent email"""
        reset_data = {
            "email": "nonexistent@example.com"
        }
        
        response = client.post("/api/auth/password-reset-request", json=reset_data)
        
        # Should still return 200 for security (don't reveal if email exists)
        assert response.status_code == 200
    
    @pytest.mark.skip(reason="Password reset implementation depends on email service")
    def test_reset_password_with_token(self, client: TestClient):
        """Test resetting password with valid token"""
        # This would require implementing email service and token generation
        pass 