"""
Unit tests for Redis caching utilities
"""
import pytest
from unittest.mock import Mock, patch
import json

from app.core.cache import RedisCache, cache, cached, invalidate_cache


class TestRedisCache:
    """Test RedisCache class"""
    
    @patch('app.core.cache.redis.Redis')
    def test_redis_cache_initialization_enabled(self, mock_redis):
        """Test Redis cache initialization when enabled"""
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            assert redis_cache.enabled is True
            mock_redis.assert_called_once()
    
    @patch('app.core.cache.redis.Redis')
    def test_redis_cache_initialization_disabled(self, mock_redis):
        """Test Redis cache initialization when disabled"""
        with patch.dict('os.environ', {'REDIS_ENABLED': 'false'}):
            redis_cache = RedisCache()
            assert redis_cache.enabled is False
            mock_redis.assert_not_called()
    
    @patch('app.core.cache.redis.Redis')
    def test_get_from_cache(self, mock_redis):
        """Test getting value from cache"""
        mock_client = Mock()
        mock_client.get.return_value = json.dumps({"key": "value"})
        mock_redis.return_value = mock_client
        
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            result = redis_cache.get("test_key")
            
            assert result == {"key": "value"}
            mock_client.get.assert_called_once_with("test_key")
    
    @patch('app.core.cache.redis.Redis')
    def test_get_from_cache_not_found(self, mock_redis):
        """Test getting non-existent value from cache"""
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_redis.return_value = mock_client
        
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            result = redis_cache.get("nonexistent_key")
            
            assert result is None
    
    @patch('app.core.cache.redis.Redis')
    def test_set_in_cache(self, mock_redis):
        """Test setting value in cache"""
        mock_client = Mock()
        mock_redis.return_value = mock_client
        
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            result = redis_cache.set("test_key", {"data": "value"}, ttl=300)
            
            assert result is True
            mock_client.setex.assert_called_once()
            call_args = mock_client.setex.call_args
            assert call_args[0][0] == "test_key"
            assert call_args[0][1] == 300
            assert json.loads(call_args[0][2]) == {"data": "value"}
    
    @patch('app.core.cache.redis.Redis')
    def test_delete_from_cache(self, mock_redis):
        """Test deleting value from cache"""
        mock_client = Mock()
        mock_redis.return_value = mock_client
        
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            result = redis_cache.delete("test_key")
            
            assert result is True
            mock_client.delete.assert_called_once_with("test_key")
    
    @patch('app.core.cache.redis.Redis')
    def test_delete_pattern_from_cache(self, mock_redis):
        """Test deleting keys matching pattern"""
        mock_client = Mock()
        mock_client.keys.return_value = ["user:1", "user:2", "user:3"]
        mock_client.delete.return_value = 3
        mock_redis.return_value = mock_client
        
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            result = redis_cache.delete_pattern("user:*")
            
            assert result == 3
            mock_client.keys.assert_called_once_with("user:*")
            mock_client.delete.assert_called_once_with("user:1", "user:2", "user:3")
    
    @patch('app.core.cache.redis.Redis')
    def test_clear_all_cache(self, mock_redis):
        """Test clearing all cache"""
        mock_client = Mock()
        mock_redis.return_value = mock_client
        
        with patch.dict('os.environ', {'REDIS_ENABLED': 'true'}):
            redis_cache = RedisCache()
            result = redis_cache.clear_all()
            
            assert result is True
            mock_client.flushdb.assert_called_once()
    
    def test_cache_operations_when_disabled(self):
        """Test that cache operations return safely when disabled"""
        with patch.dict('os.environ', {'REDIS_ENABLED': 'false'}):
            redis_cache = RedisCache()
            
            assert redis_cache.get("key") is None
            assert redis_cache.set("key", "value") is False
            assert redis_cache.delete("key") is False
            assert redis_cache.delete_pattern("pattern:*") == 0
            assert redis_cache.clear_all() is False


class TestCachedDecorator:
    """Test @cached decorator"""
    
    @patch('app.core.cache.cache')
    @pytest.mark.asyncio
    async def test_cached_decorator_cache_miss(self, mock_cache):
        """Test cached decorator on cache miss"""
        mock_cache.get.return_value = None
        
        @cached(ttl=300, key_prefix="test")
        async def test_function(arg1, arg2):
            return {"result": f"{arg1}_{arg2}"}
        
        result = await test_function("value1", "value2")
        
        assert result == {"result": "value1_value2"}
        mock_cache.get.assert_called_once()
        mock_cache.set.assert_called_once()
    
    @patch('app.core.cache.cache')
    @pytest.mark.asyncio
    async def test_cached_decorator_cache_hit(self, mock_cache):
        """Test cached decorator on cache hit"""
        mock_cache.get.return_value = {"cached": "result"}
        
        @cached(ttl=300, key_prefix="test")
        async def test_function(arg1):
            return {"fresh": "result"}
        
        result = await test_function("value1")
        
        assert result == {"cached": "result"}
        mock_cache.get.assert_called_once()
        mock_cache.set.assert_not_called()
