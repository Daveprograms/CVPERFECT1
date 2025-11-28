"""
Redis caching utilities for CVPerfect backend
"""
import redis
import json
import os
from typing import Any, Optional, Callable
from functools import wraps
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis cache manager"""
    
    def __init__(self):
        self.enabled = os.getenv("REDIS_ENABLED", "false").lower() == "true"
        self.redis_client = None
        
        if self.enabled:
            try:
                self.redis_client = redis.Redis(
                    host=os.getenv("REDIS_HOST", "localhost"),
                    port=int(os.getenv("REDIS_PORT", 6379)),
                    db=int(os.getenv("REDIS_DB", 0)),
                    password=os.getenv("REDIS_PASSWORD"),
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("✅ Redis cache enabled and connected")
            except Exception as e:
                logger.warning(f"⚠️ Redis connection failed, caching disabled: {str(e)}")
                self.enabled = False
                self.redis_client = None
        else:
            logger.info("ℹ️ Redis caching disabled")
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.enabled or not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {str(e)}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set value in cache
        
        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized)
            ttl: Time to live in seconds (default 5 minutes)
        """
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            serialized = json.dumps(value)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis set error: {str(e)}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {str(e)}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.enabled or not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Redis delete pattern error: {str(e)}")
            return 0
    
    def clear_all(self) -> bool:
        """Clear all cache (use with caution)"""
        if not self.enabled or not self.redis_client:
            return False
        
        try:
            self.redis_client.flushdb()
            return True
        except Exception as e:
            logger.error(f"Redis clear error: {str(e)}")
            return False


# Global cache instance
cache = RedisCache()


def cached(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results
    
    Args:
        ttl: Time to live in seconds
        key_prefix: Prefix for cache key
    
    Usage:
        @cached(ttl=600, key_prefix="user")
        async def get_user(user_id: str):
            return db.query(User).filter(User.id == user_id).first()
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]
            
            # Add positional args to key
            for arg in args:
                if isinstance(arg, (str, int, float, bool)):
                    key_parts.append(str(arg))
            
            # Add keyword args to key
            for k, v in sorted(kwargs.items()):
                if isinstance(v, (str, int, float, bool)):
                    key_parts.append(f"{k}:{v}")
            
            cache_key = ":".join(key_parts)
            
            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit: {cache_key}")
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache the result
            cache.set(cache_key, result, ttl)
            logger.debug(f"Cache set: {cache_key}")
            
            return result
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching pattern
    
    Usage:
        invalidate_cache("user:*")  # Clear all user caches
    """
    return cache.delete_pattern(pattern)
