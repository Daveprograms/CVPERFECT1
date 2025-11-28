"""
Unit tests for rate limiting middleware
"""
import pytest
import time
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.middleware.rate_limit import RateLimitMiddleware


@pytest.fixture
def rate_limited_app():
    """Create a test app with rate limiting"""
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware, requests_per_minute=5)
    
    @app.get("/test")
    async def test_endpoint():
        return {"message": "success"}
    
    @app.get("/api/resume/upload")
    async def upload_endpoint():
        return {"message": "upload success"}
    
    @app.get("/health")
    async def health():
        return {"status": "healthy"}
    
    return app


class TestRateLimitMiddleware:
    """Test rate limiting middleware"""
    
    def test_rate_limit_allows_requests_under_limit(self, rate_limited_app):
        """Test that requests under the limit are allowed"""
        client = TestClient(rate_limited_app)
        
        # Make 3 requests (under limit of 5)
        for i in range(3):
            response = client.get("/test")
            assert response.status_code == 200
            assert "X-RateLimit-Limit" in response.headers
            assert "X-RateLimit-Remaining" in response.headers
    
    def test_rate_limit_blocks_requests_over_limit(self, rate_limited_app):
        """Test that requests over the limit are blocked"""
        client = TestClient(rate_limited_app)
        
        # Make 6 requests (over limit of 5)
        for i in range(5):
            response = client.get("/test")
            assert response.status_code == 200
        
        # 6th request should be rate limited
        response = client.get("/test")
        assert response.status_code == 429
        data = response.json()
        assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Retry-After" in response.headers
    
    def test_rate_limit_different_endpoints_have_different_limits(self, rate_limited_app):
        """Test that different endpoints have different rate limits"""
        client = TestClient(rate_limited_app)
        
        # Upload endpoint has limit of 10 (from endpoint_limits)
        # Make 11 requests
        for i in range(10):
            response = client.get("/api/resume/upload")
            assert response.status_code == 200
        
        # 11th request should be rate limited
        response = client.get("/api/resume/upload")
        assert response.status_code == 429
    
    def test_rate_limit_skips_health_check(self, rate_limited_app):
        """Test that health check endpoint is not rate limited"""
        client = TestClient(rate_limited_app)
        
        # Make many requests to health endpoint
        for i in range(20):
            response = client.get("/health")
            assert response.status_code == 200
    
    def test_rate_limit_headers_present(self, rate_limited_app):
        """Test that rate limit headers are present in response"""
        client = TestClient(rate_limited_app)
        
        response = client.get("/test")
        
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Reset" in response.headers
        
        # Check header values
        assert int(response.headers["X-RateLimit-Limit"]) == 5
        assert int(response.headers["X-RateLimit-Remaining"]) >= 0
    
    def test_rate_limit_decreases_remaining(self, rate_limited_app):
        """Test that remaining count decreases with each request"""
        client = TestClient(rate_limited_app)
        
        response1 = client.get("/test")
        remaining1 = int(response1.headers["X-RateLimit-Remaining"])
        
        response2 = client.get("/test")
        remaining2 = int(response2.headers["X-RateLimit-Remaining"])
        
        assert remaining2 == remaining1 - 1
