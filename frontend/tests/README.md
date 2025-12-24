# Frontend Tests - Feature 006: Urdu Translation

## Test Structure

```
tests/
├── unit/
│   └── TranslationHandler.test.js     # Translation hook and API tests
└── README.md                           # This file
```

## Test Coverage

### Unit Tests (T013)
**File**: `tests/unit/TranslationHandler.test.js`

**Content Extraction Tests**:
- ✅ `test_extract_content_from_dom` - Verify content extraction excludes frontmatter
- ✅ `test_extract_content_handles_empty_dom` - Verify empty DOM handling

**Content Hashing Tests**:
- ✅ `test_compute_sha256_hash` - Verify hash matches backend (SHA-256)
- ✅ `test_hash_consistency` - Verify same content produces same hash

**Translation API Tests**:
- ✅ `test_handle_translate_click` - Mock API call, verify state updates
- ✅ `test_handle_authentication_error` - Mock 401, verify error message
- ✅ `test_handle_api_error` - Mock API error, verify error handling

**Toggle Tests**:
- ✅ `test_toggle_between_languages` - Verify toggle switches English ↔ Urdu
- ✅ `test_toggle_preserves_original_content` - Verify original content preserved

**Caching Tests**:
- ✅ `test_cached_translation_indicator` - Verify cached flag recognized

**Button State Tests**:
- ✅ `test_button_label_changes_on_toggle` - Verify button label changes

**Total**: 11 test cases

## Running Tests

### Prerequisites

Install Jest and React Testing Library:

```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/react-hooks @testing-library/jest-dom
```

### Configure Jest

Create `frontend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '^@site/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.test.jsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!src/**/index.js'
  ]
};
```

### Create Test Setup

Create `frontend/tests/setup.js`:

```javascript
import '@testing-library/jest-dom';

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: ''
};
```

### Update package.json

Add test scripts to `frontend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

### Run Tests

```bash
# Run all tests
npm test

# Run in watch mode (re-runs on file changes)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test TranslationHandler.test.js

# Run with verbose output
npm run test:verbose
```

### Run Specific Test

```bash
# Run single test case
npm test -- -t "test_extract_content_from_dom"

# Run test suite
npm test -- -t "Content Extraction"
```

## Expected Results

### TDD Approach

Tests define expected behavior for:
- `useTranslation` hook
- `translationApi` service functions
- Content extraction and hashing
- Error handling and state management

### Current Status

Tests are written with mocked dependencies:
- ✅ API calls mocked to avoid network requests
- ✅ DOM operations mocked for consistent testing
- ✅ Crypto operations mocked for deterministic results
- ✅ React hooks tested with `renderHook` utility

## Test Coverage Goals

Target coverage:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

View coverage report:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Debugging Tests

### Enable Debug Mode

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Show console.log statements
npm test -- --verbose
```

### Common Issues

**Issue**: `Cannot find module '@site/...'`
**Fix**: Check `moduleNameMapper` in jest.config.js

**Issue**: `ReferenceError: crypto is not defined`
**Fix**: Mock `global.crypto` in test setup

**Issue**: `Warning: An update to ... inside a test was not wrapped in act(...)`
**Fix**: Wrap state updates in `act()` or use `waitFor()`

## Mocking Strategies

### Mock API Calls

```javascript
import { translateToUrdu } from '../../src/services/translationApi';
jest.mock('../../src/services/translationApi');

translateToUrdu.mockResolvedValue({
  translatedContent: 'مواد',
  cached: false
});
```

### Mock Hooks

```javascript
jest.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: () => ({
    isUrdu: false,
    loading: false,
    handleTranslate: jest.fn()
  })
}));
```

### Mock DOM

```javascript
document.querySelector = jest.fn(() => ({
  innerText: 'Sample content',
  textContent: 'Sample content'
}));
```

## Integration with Docusaurus

Docusaurus uses its own test setup. For component tests:

```bash
# Create .babelrc for Jest
echo '{"presets": ["@babel/preset-react"]}' > .babelrc

# Install Babel
npm install --save-dev @babel/preset-react babel-jest
```

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      - name: Run tests
        run: |
          cd frontend
          npm test -- --ci --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./frontend/coverage/lcov.info
```

## Snapshot Testing

For component visual regression:

```javascript
import React from 'react';
import { render } from '@testing-library/react';
import UrduTranslationButton from '../../src/components/translation/UrduTranslationButton';

test('matches snapshot', () => {
  const { container } = render(
    <UrduTranslationButton chapterId="ch01-test" />
  );
  expect(container.firstChild).toMatchSnapshot();
});
```

Update snapshots:
```bash
npm test -- -u
```

## Next Steps

- [ ] Add component tests for UrduTranslationButton
- [ ] Add E2E tests with Playwright/Cypress
- [ ] Add visual regression tests
- [ ] Add accessibility tests (a11y)
- [ ] Add performance tests (Lighthouse)
- [ ] Increase coverage to 90%+
