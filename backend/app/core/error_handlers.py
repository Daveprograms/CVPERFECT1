"""
Global exception handlers for FastAPI
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from .exceptions import CVPerfectException
import logging
from typing import Union

logger = logging.getLogger(__name__)


def create_error_response(
    error_code: str,
    message: str,
    status_code: int,
    details: dict = None,
    path: str = None
) -> JSONResponse:
    """Create standardized error response"""
    content = {
        "error": {
            "code": error_code,
            "message": message,
            "status": status_code
        }
    }
    
    if details:
        content["error"]["details"] = details
    
    if path:
        content["error"]["path"] = path
    
    return JSONResponse(
        status_code=status_code,
        content=content
    )


async def cvperfect_exception_handler(
    request: Request, 
    exc: CVPerfectException
) -> JSONResponse:
    """Handle custom CVPerfect exceptions"""
    logger.error(
        f"CVPerfect error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path
        }
    )
    
    return create_error_response(
        error_code=exc.error_code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        path=request.url.path
    )


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException
) -> JSONResponse:
    """Handle standard HTTP exceptions"""
    logger.warning(
        f"HTTP error: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path
        }
    )
    
    return create_error_response(
        error_code="HTTP_ERROR",
        message=str(exc.detail),
        status_code=exc.status_code,
        path=request.url.path
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle request validation errors"""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        f"Validation error on {request.url.path}",
        extra={"errors": errors}
    )
    
    return create_error_response(
        error_code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"errors": errors},
        path=request.url.path
    )


async def general_exception_handler(
    request: Request,
    exc: Exception
) -> JSONResponse:
    """Handle unexpected exceptions"""
    logger.exception(
        f"Unexpected error on {request.url.path}: {str(exc)}",
        exc_info=exc
    )

    # Include a minimal preview to speed up debugging.
    # Do NOT include tracebacks (they may contain secrets); keep this short.
    details = {
        "exception_type": type(exc).__name__,
        "exception": str(exc)[:500],
    }

    return create_error_response(
        error_code="INTERNAL_ERROR",
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details=details,
        path=request.url.path,
    )
