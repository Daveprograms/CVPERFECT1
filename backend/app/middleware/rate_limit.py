"""
Rate limiting middleware for CVPerfect backend
"""
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from typing import Dict, Tuple
import time
from collections import defaultdict
import asyncio


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware
    
    Limits:
    - 100 requests per minute per IP for general endpoints
    - 20 requests per minute for AI endpoints
    - 10 requests per minute for upload endpoints
    """
    
    def __init__(self, app, requests_per_minute: int = 100):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, list] = defaultdict(list)
        self.cleanup_interval = 60  # Clean up old entries every 60 seconds
        self.last_cleanup = time.time()
        
        # Different limits for different endpoint types
        self.endpoint_limits = {
            "/api/resume/upload": 10,
            "/api/resume/analyze": 20,
            "/api/resume/enhance": 20,
            "/api/resume/cover-letter": 20,
            "/api/resume/learning-path": 20,
            "/api/resume/practice-exam": 20,
        }
    
    def _cleanup_old_requests(self):
        """Remove requests older than 1 minute"""
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            cutoff_time = current_time - 60
            for ip in list(self.requests.keys()):
                self.requests[ip] = [
                    req_time for req_time in self.requests[ip]
                    if req_time > cutoff_time
                ]
                if not self.requests[ip]:
                    del self.requests[ip]
            self.last_cleanup = current_time
    
    def _get_rate_limit(self, path: str) -> int:
        """Get rate limit for specific endpoint"""
        for endpoint, limit in self.endpoint_limits.items():
            if path.startswith(endpoint):
                return limit
        return self.requests_per_minute
    
    def _is_rate_limited(self, ip: str, path: str) -> Tuple[bool, int]:
        """Check if IP is rate limited for this endpoint"""
        current_time = time.time()
        cutoff_time = current_time - 60  # 1 minute window
        
        # Get requests in the last minute
        recent_requests = [
            req_time for req_time in self.requests[ip]
            if req_time > cutoff_time
        ]
        
        limit = self._get_rate_limit(path)
        
        if len(recent_requests) >= limit:
            # Calculate retry after
            oldest_request = min(recent_requests)
            retry_after = int(60 - (current_time - oldest_request)) + 1
            return True, retry_after
        
        return False, 0
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/openapi.json", "/"]:
            return await call_next(request)
        
        # Clean up old requests periodically
        self._cleanup_old_requests()
        
        # Get client IP
        client_ip = request.client.host
        
        # Check rate limit
        is_limited, retry_after = self._is_rate_limited(client_ip, request.url.path)
        
        if is_limited:
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Too many requests. Please try again later.",
                        "status": 429,
                        "details": {
                            "retry_after": retry_after
                        }
                    }
                },
                headers={"Retry-After": str(retry_after)}
            )
        
        # Record this request
        self.requests[client_ip].append(time.time())
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        limit = self._get_rate_limit(request.url.path)
        remaining = limit - len(self.requests[client_ip])
        
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(time.time()) + 60)
        
        return response
