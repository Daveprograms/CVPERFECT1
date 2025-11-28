"""
Custom exceptions for CVPerfect backend
"""
from typing import Any, Dict, Optional


class CVPerfectException(Exception):
    """Base exception for all CVPerfect errors"""
    def __init__(
        self, 
        message: str, 
        status_code: int = 500,
        error_code: str = "INTERNAL_ERROR",
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(CVPerfectException):
    """Authentication failed"""
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="AUTH_ERROR",
            details=details
        )


class AuthorizationError(CVPerfectException):
    """User not authorized for this action"""
    def __init__(self, message: str = "Not authorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=403,
            error_code="FORBIDDEN",
            details=details
        )


class ResourceNotFoundError(CVPerfectException):
    """Resource not found"""
    def __init__(self, resource: str = "Resource", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{resource} not found",
            status_code=404,
            error_code="NOT_FOUND",
            details=details
        )


class ValidationError(CVPerfectException):
    """Validation failed"""
    def __init__(self, message: str = "Validation failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=422,
            error_code="VALIDATION_ERROR",
            details=details
        )


class SubscriptionError(CVPerfectException):
    """Subscription-related error"""
    def __init__(self, message: str = "Subscription error", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=402,
            error_code="SUBSCRIPTION_ERROR",
            details=details
        )


class RateLimitError(CVPerfectException):
    """Rate limit exceeded"""
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 60):
        super().__init__(
            message=message,
            status_code=429,
            error_code="RATE_LIMIT_EXCEEDED",
            details={"retry_after": retry_after}
        )


class ExternalServiceError(CVPerfectException):
    """External service (Stripe, Gemini, etc.) error"""
    def __init__(self, service: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{service} error: {message}",
            status_code=502,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details or {"service": service}
        )


class FileProcessingError(CVPerfectException):
    """File processing error"""
    def __init__(self, message: str = "File processing failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="FILE_PROCESSING_ERROR",
            details=details
        )
