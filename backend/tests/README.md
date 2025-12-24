# Backend Tests - Feature 006: Urdu Translation

## Test Structure

```
tests/
├── unit/
│   └── test_translation_service.py      # TranslationService unit tests
├── integration/
│   └── test_translation_endpoint.py     # API endpoint integration tests
└── README.md                             # This file
```

## Test Coverage

### Unit Tests (T011)
**File**: `tests/unit/test_translation_service.py`

- ✅ `test_openrouter_client_initialization` - Verify OpenAI client configured with OpenRouter
- ✅ `test_translate_to_urdu_success` - Mock API response, verify translation
- ✅ `test_translate_to_urdu_preserves_technical_terms` - Verify ROS2, Python stay in English
- ✅ `test_translate_to_urdu_uses_cache` - Verify caching mechanism
- ✅ `test_translate_to_urdu_retry_logic` - Verify exponential backoff on errors
- ✅ `test_translate_to_urdu_cache_expiry` - Verify TTL-based cache expiry
- ✅ `test_translate_to_english_success` - Verify reverse translation
- ✅ `test_system_prompt_exists` - Verify system prompt method

**Total**: 8 test cases

### Integration Tests (T012)
**File**: `tests/integration/test_translation_endpoint.py`

**Authentication Tests**:
- ✅ `test_translation_endpoint_authenticated` - POST with JWT, verify 200
- ✅ `test_translation_endpoint_unauthenticated` - POST without JWT, verify 401
- ✅ `test_translation_endpoint_invalid_token` - POST with invalid JWT, verify 401

**Caching Tests**:
- ✅ `test_translation_endpoint_cache_miss` - First translation, verify `cached: false`
- ✅ `test_translation_endpoint_cache_hit` - Second translation, verify `cached: true`

**Validation Tests**:
- ✅ `test_translation_endpoint_content_hash_mismatch` - Send mismatched hash, verify 400
- ✅ `test_translation_endpoint_missing_fields` - Send incomplete request, verify 422

**Rate Limiting Tests**:
- ✅ `test_translation_endpoint_rate_limit_exceeded` - Exceed limit, verify 429 with Retry-After

**Stats Tests**:
- ✅ `test_get_translation_stats` - GET /translate/stats, verify quota info

**Health Check**:
- ✅ `test_translation_health_endpoint` - GET /translation/health, verify status

**Total**: 10 test cases

## Running Tests

### Prerequisites

Install pytest and dependencies:
```bash
cd backend
pip install pytest pytest-mock pytest-asyncio httpx
```

### Run All Tests

```bash
# Run all tests with verbose output
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=api --cov=services --cov-report=html

# Run specific test file
pytest tests/unit/test_translation_service.py -v
pytest tests/integration/test_translation_endpoint.py -v
```

### Run Specific Test

```bash
# Run single test case
pytest tests/unit/test_translation_service.py::TestTranslationServiceInitialization::test_openrouter_client_initialization -v

# Run test class
pytest tests/unit/test_translation_service.py::TestTranslateToUrdu -v
```

### Run with Output

```bash
# Show print statements
pytest tests/ -v -s

# Show detailed error traces
pytest tests/ -v --tb=long
```

## Expected Results

### TDD Approach

Following TDD principles, tests are written FIRST to define expected behavior:

1. **Write tests** - Define what the code should do
2. **Run tests** - Verify they FAIL (red phase)
3. **Implement code** - Make tests PASS (green phase)
4. **Refactor** - Improve code while keeping tests green

### Current Status

All tests are written and should PASS with current implementation:
- ✅ Unit tests validate TranslationService behavior
- ✅ Integration tests validate API endpoints
- ✅ Mocking used for external dependencies (OpenRouter API, database)

## Test Configuration

### pytest.ini (Optional)

Create `backend/pytest.ini` for configuration:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

### Running by Marker

```bash
# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Skip slow tests
pytest -m "not slow"
```

## Continuous Integration

Add to GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-mock pytest-asyncio httpx
      - name: Run tests
        run: |
          cd backend
          pytest tests/ -v --tb=short
```

## Troubleshooting

### Import Errors

If you get import errors, add backend to PYTHONPATH:

```bash
export PYTHONPATH="${PYTHONPATH}:/path/to/backend"
pytest tests/ -v
```

Or run from backend directory:

```bash
cd backend
python -m pytest tests/ -v
```

### Mock Issues

If mocks aren't working, verify patch paths:

```python
# Correct: patch where it's used
@patch('api.translation.translation_service')

# Incorrect: patch where it's defined
@patch('services.translation_service.TranslationService')
```

### Database Tests

Integration tests use mocked database. To test with real database:

1. Set up test database
2. Remove `DB_ENABLED` patches
3. Use transactions and rollback after each test

## Next Steps

- [ ] Add E2E tests with Playwright
- [ ] Add performance tests (load testing)
- [ ] Add security tests (injection, XSS)
- [ ] Increase coverage to 90%+
- [ ] Add mutation testing
