"""
Unit tests for custom exceptions and error handlers
"""
import pytest
from fastapi import Request
from fastapi.testclient import TestClient

from app.core.exceptions import (
    CVPerfectException,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ValidationError,
    SubscriptionError,
    RateLimitError,
    ExternalServiceError,
    FileProcessingError
)
from app.core.error_handlers import create_error_response


class TestCustomExceptions:
    """Test custom exception classes"""
    
    def test_base_exception(self):
        """Test base CVPerfectException"""
        exc = CVPerfectException(
            message="Test error",
            status_code=500,
            error_code="TEST_ERROR",
            details={"key": "value"}
        )
        
        assert exc.message == "Test error"
        assert exc.status_code == 500
        assert exc.error_code == "TEST_ERROR"
        assert exc.details == {"key": "value"}
    
    def test_authentication_error(self):
        """Test AuthenticationError"""
        exc = AuthenticationError("Invalid credentials")
        
        assert exc.message == "Invalid credentials"
        assert exc.status_code == 401
        assert exc.error_code == "AUTH_ERROR"
    
    def test_authorization_error(self):
        """Test AuthorizationError"""
        exc = AuthorizationError("Access denied")
        
        assert exc.message == "Access denied"
        assert exc.status_code == 403
        assert exc.error_code == "FORBIDDEN"
    
    def test_resource_not_found_error(self):
        """Test ResourceNotFoundError"""
        exc = ResourceNotFoundError("User")
        
        assert exc.message == "User not found"
        assert exc.status_code == 404
        assert exc.error_code == "NOT_FOUND"
    
    def test_validation_error(self):
        """Test ValidationError"""
        exc = ValidationError("Invalid email format")
        
        assert exc.message == "Invalid email format"
        assert exc.status_code == 422
        assert exc.error_code == "VALIDATION_ERROR"
    
    def test_subscription_error(self):
        """Test SubscriptionError"""
        exc = SubscriptionError("Subscription expired")
        
        assert exc.message == "Subscription expired"
        assert exc.status_code == 402
        assert exc.error_code == "SUBSCRIPTION_ERROR"
    
    def test_rate_limit_error(self):
        """Test RateLimitError"""
        exc = RateLimitError(retry_after=120)
        
        assert exc.message == "Rate limit exceeded"
        assert exc.status_code == 429
        assert exc.error_code == "RATE_LIMIT_EXCEEDED"
        assert exc.details["retry_after"] == 120
    
    def test_external_service_error(self):
        """Test ExternalServiceError"""
        exc = ExternalServiceError("Stripe", "Payment failed")
        
        assert "Stripe" in exc.message
        assert "Payment failed" in exc.message
        assert exc.status_code == 502
        assert exc.error_code == "EXTERNAL_SERVICE_ERROR"
    
    def test_file_processing_error(self):
        """Test FileProcessingError"""
        exc = FileProcessingError("Invalid file format")
        
        assert exc.message == "Invalid file format"
        assert exc.status_code == 400
        assert exc.error_code == "FILE_PROCESSING_ERROR"


class TestErrorHandlers:
    """Test error handler functions"""
    
    def test_create_error_response(self):
        """Test create_error_response function"""
        response = create_error_response(
            error_code="TEST_ERROR",
            message="Test message",
            status_code=400,
            details={"field": "value"},
            path="/api/test"
        )
        
        assert response.status_code == 400
        content = response.body.decode()
        assert "TEST_ERROR" in content
        assert "Test message" in content
        assert "field" in content
        assert "/api/test" in content
    
    def test_create_error_response_minimal(self):
        """Test create_error_response with minimal params"""
        response = create_error_response(
            error_code="ERROR",
            message="Error occurred",
            status_code=500
        )
        
        assert response.status_code == 500
        content = response.body.decode()
        assert "ERROR" in content
        assert "Error occurred" in content


@pytest.mark.integration
class TestErrorHandlersIntegration:
    """Integration tests for error handlers with FastAPI"""
    
    def test_custom_exception_handler(self, client):
        """Test that custom exceptions are handled properly"""
        from app.main import app
        from fastapi import APIRouter
        
        # Create test router
        test_router = APIRouter()
        
        @test_router.get("/test-auth-error")
        async def test_auth_error():
            raise AuthenticationError("Test auth error")
        
        @test_router.get("/test-not-found")
        async def test_not_found():
            raise ResourceNotFoundError("TestResource")
        
        # Add router temporarily
        app.include_router(test_router, prefix="/test")
        
        # Test auth error
        response = client.get("/test/test-auth-error")
        assert response.status_code == 401
        data = response.json()
        assert data["error"]["code"] == "AUTH_ERROR"
        assert "Test auth error" in data["error"]["message"]
        
        # Test not found error
        response = client.get("/test/test-not-found")
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "NOT_FOUND"
        assert "TestResource not found" in data["error"]["message"]
