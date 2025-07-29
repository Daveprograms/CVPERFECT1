"""
Celery Application Configuration
Background task processing for CVPerfect
"""

import os
from celery import Celery
from ..core.config import settings

# Create Celery app
celery_app = Celery(
    "cvperfect",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.workers.resume_tasks",
        "app.workers.email_tasks",
        "app.workers.analytics_tasks"
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task routing
    task_routes={
        "app.workers.resume_tasks.*": {"queue": "resume_processing"},
        "app.workers.email_tasks.*": {"queue": "email"},
        "app.workers.analytics_tasks.*": {"queue": "analytics"},
    },
    
    # Task retry configuration
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Result backend settings
    result_expires=3600,  # 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        "cleanup-expired-results": {
            "task": "app.workers.analytics_tasks.cleanup_expired_results",
            "schedule": 3600.0,  # Run every hour
        },
        "generate-daily-analytics": {
            "task": "app.workers.analytics_tasks.generate_daily_analytics",
            "schedule": 86400.0,  # Run daily
        },
    },
)

# Auto-discover tasks
celery_app.autodiscover_tasks()

if __name__ == "__main__":
    celery_app.start() 