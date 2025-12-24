"""
Integration tests for Translation API Endpoint

Tests full API flow with authentication, caching, rate limiting
Following TDD approach - tests should demonstrate real behavior
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import hashlib
import json


# Mock app for testing (would normally import from main)
@pytest.fixture
def client():
    """Create test client"""
    from main import app
    return TestClient(app)


@pytest.fixture
def mock_jwt_token():
    """Create mock JWT token for testing"""
    return "mock_jwt_token_12345"


@pytest.fixture
def mock_user_id():
    """Mock user ID"""
    return "550e8400-e29b-41d4-a716-446655440000"


@pytest.fixture
def sample_content():
    """Sample chapter content for testing"""
    return "This is a sample chapter about ROS2 and Python programming."


@pytest.fixture
def content_hash(sample_content):
    """Compute content hash"""
    return hashlib.sha256(sample_content.encode('utf-8')).hexdigest()


class TestTranslationEndpointAuthentication:
    """Test authentication requirements"""

    def test_translation_endpoint_authenticated(self, client, mock_jwt_token, sample_content, content_hash, mock_user_id):
        """
        T012.1: Send POST /api/translate/urdu with JWT, verify 200

        Expected: Authenticated request succeeds
        """
        with patch('api.translation.get_current_user_id_from_token', return_value=mock_user_id), \
             patch('api.translation.translation_service.translate_to_urdu', return_value="یہ ROS2 اور Python پروگرامنگ کے بارے میں ایک نمونہ باب ہے۔"):

            response = client.post(
                "/api/translate/urdu",
                json={
                    "chapter_id": "ch01-test",
                    "content": sample_content,
                    "content_hash": content_hash
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )

            assert response.status_code == 200, f"Should return 200, got {response.status_code}: {response.text}"
            data = response.json()
            assert "translated_content" in data, "Should contain translated_content"
            assert "cached" in data, "Should contain cached flag"

    def test_translation_endpoint_unauthenticated(self, client, sample_content, content_hash):
        """
        T012.2: Send POST without JWT, verify 401

        Expected: Unauthenticated request fails with 401
        """
        response = client.post(
            "/api/translate/urdu",
            json={
                "chapter_id": "ch01-test",
                "content": sample_content,
                "content_hash": content_hash
            }
        )

        assert response.status_code == 401, "Should return 401 for unauthenticated request"
        data = response.json()
        assert "detail" in data, "Should contain error detail"
        assert "authorization" in data["detail"].lower(), "Error should mention authorization"

    def test_translation_endpoint_invalid_token(self, client, sample_content, content_hash):
        """
        T012.3: Send POST with invalid JWT, verify 401

        Expected: Invalid token fails with 401
        """
        with patch('api.translation.get_current_user_id_from_token', return_value=None):
            response = client.post(
                "/api/translate/urdu",
                json={
                    "chapter_id": "ch01-test",
                    "content": sample_content,
                    "content_hash": content_hash
                },
                headers={"Authorization": "Bearer invalid_token"}
            )

            assert response.status_code == 401, "Should return 401 for invalid token"


class TestTranslationEndpointCaching:
    """Test database caching behavior"""

    def test_translation_endpoint_cache_miss(self, client, mock_jwt_token, sample_content, content_hash, mock_user_id):
        """
        T012.4: First translation, verify `cached: false` in response

        Expected: First translation is not cached
        """
        with patch('api.translation.get_current_user_id_from_token', return_value=mock_user_id), \
             patch('api.translation.translation_service.translate_to_urdu', return_value="نیا ترجمہ"), \
             patch('api.translation.DB_ENABLED', False):  # Disable DB to force cache miss

            response = client.post(
                "/api/translate/urdu",
                json={
                    "chapter_id": "ch01-new",
                    "content": sample_content,
                    "content_hash": content_hash
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )

            assert response.status_code == 200, f"Should return 200, got {response.status_code}"
            data = response.json()
            assert data.get("cached") == False, "First translation should not be cached"

    def test_translation_endpoint_cache_hit(self, client, mock_jwt_token, sample_content, content_hash, mock_user_id):
        """
        T012.5: Translate twice, verify second request returns cached content

        Expected: Second translation loads from cache
        """
        # Mock database with cached translation
        mock_cached_translation = Mock()
        mock_cached_translation.id = "cache-id-123"
        mock_cached_translation.translated_content = "کیشڈ ترجمہ"
        mock_cached_translation.chapter_id = "ch01-cached"
        mock_cached_translation.content_hash = content_hash
        mock_cached_translation.target_language = "urdu"

        with patch('api.translation.get_current_user_id_from_token', return_value=mock_user_id), \
             patch('api.translation.DB_ENABLED', True), \
             patch('api.translation.get_db') as mock_db_dep:

            # Mock database query to return cached translation
            mock_db = Mock()
            mock_query = Mock()
            mock_query.filter.return_value.first.return_value = mock_cached_translation
            mock_db.query.return_value = mock_query
            mock_db_dep.return_value = mock_db

            response = client.post(
                "/api/translate/urdu",
                json={
                    "chapter_id": "ch01-cached",
                    "content": sample_content,
                    "content_hash": content_hash
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )

            assert response.status_code == 200, f"Should return 200, got {response.status_code}"
            data = response.json()
            assert data.get("cached") == True, "Should return cached=true"
            assert data.get("translated_content") == "کیشڈ ترجمہ", "Should return cached content"


class TestTranslationEndpointValidation:
    """Test request validation"""

    def test_translation_endpoint_content_hash_mismatch(self, client, mock_jwt_token, sample_content, mock_user_id):
        """
        T012.6: Send mismatched hash, verify 400

        Expected: Mismatched hash fails with 400
        """
        wrong_hash = "0" * 64  # Invalid hash

        with patch('api.translation.get_current_user_id_from_token', return_value=mock_user_id):
            response = client.post(
                "/api/translate/urdu",
                json={
                    "chapter_id": "ch01-test",
                    "content": sample_content,
                    "content_hash": wrong_hash
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )

            assert response.status_code == 400, "Should return 400 for hash mismatch"
            data = response.json()
            assert "hash" in data["detail"].lower(), "Error should mention hash mismatch"

    def test_translation_endpoint_missing_fields(self, client, mock_jwt_token):
        """
        T012.7: Send incomplete request, verify 422

        Expected: Missing required fields fails with 422
        """
        response = client.post(
            "/api/translate/urdu",
            json={
                "chapter_id": "ch01-test"
                # Missing content and content_hash
            },
            headers={"Authorization": f"Bearer {mock_jwt_token}"}
        )

        assert response.status_code == 422, "Should return 422 for missing fields"


class TestTranslationEndpointRateLimiting:
    """Test rate limiting behavior"""

    def test_translation_endpoint_rate_limit_exceeded(self, client, mock_jwt_token, sample_content, content_hash, mock_user_id):
        """
        T012.8: Exceed rate limit, verify 429 with Retry-After header

        Expected: Rate limit exceeded returns 429
        """
        with patch('api.translation.get_current_user_id_from_token', return_value=mock_user_id), \
             patch('api.translation.rate_limiter.check_rate_limit', return_value=False), \
             patch('api.translation.rate_limiter.get_retry_after', return_value=3600):

            response = client.post(
                "/api/translate/urdu",
                json={
                    "chapter_id": "ch01-test",
                    "content": sample_content,
                    "content_hash": content_hash
                },
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )

            assert response.status_code == 429, "Should return 429 for rate limit"
            assert "Retry-After" in response.headers, "Should include Retry-After header"
            assert response.headers["Retry-After"] == "3600", "Should specify retry time"


class TestTranslationStatsEndpoint:
    """Test translation statistics endpoint"""

    def test_get_translation_stats(self, client, mock_jwt_token, mock_user_id):
        """
        T012.9: GET /translate/stats with auth, verify response

        Expected: Returns user's translation quota info
        """
        with patch('api.translation.get_current_user_id_from_token', return_value=mock_user_id), \
             patch('api.translation.rate_limiter.get_remaining', return_value=7), \
             patch('api.translation.rate_limiter.get_retry_after', return_value=0):

            response = client.get(
                "/api/translate/stats",
                headers={"Authorization": f"Bearer {mock_jwt_token}"}
            )

            assert response.status_code == 200, "Should return 200"
            data = response.json()
            assert "translations_remaining" in data, "Should include remaining count"
            assert data["translations_remaining"] == 7, "Should show correct remaining"
            assert "translations_limit" in data, "Should include limit"
            assert "window_seconds" in data, "Should include window"


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_translation_health_endpoint(self, client):
        """
        T012.10: GET /translation/health, verify status

        Expected: Returns service health status
        """
        response = client.get("/api/translation/health")

        assert response.status_code == 200, "Health endpoint should return 200"
        data = response.json()
        assert "status" in data, "Should include status"
        assert data["status"] == "translation service is running", "Should confirm service running"


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
