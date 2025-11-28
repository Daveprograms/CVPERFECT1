"""
Simple unit tests for custom exceptions (no app dependencies)
"""
import pytest

# Import exceptions directly without loading the app
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../..'))

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


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
