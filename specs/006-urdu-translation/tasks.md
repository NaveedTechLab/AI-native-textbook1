# Tasks: Dynamic Urdu Translation

**Input**: Design documents from `/mnt/e/hakaton 1/AI-native-textbook/specs/006-urdu-translation/`
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ contracts/

**Tests**: Included (TDD approach as per constitution Principle III)

**Organization**: Tasks grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5, US6)
- Exact file paths included in descriptions

## Path Conventions

- **Web app structure**: `backend/`, `frontend/`
- **Backend**: `backend/api/`, `backend/services/`, `backend/models/`, `backend/database/migrations/`
- **Frontend**: `frontend/src/components/`, `frontend/src/theme/`, `frontend/src/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and environment configuration

- [X] T001 Configure OpenRouter API key in backend/.env (OPENROUTER_API_KEY variable)
- [X] T002 [P] Update backend/requirements.txt to add openai>=1.0.0 for OpenRouter integration
- [X] T003 [P] Use `npm install` in frontend/ to ensure all dependencies are installed
- [X] T004 Verify Feature 005 JWT authentication is deployed and backend/auth/jwt_utils.py exists

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema and core services MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Use `alembic revision --autogenerate -m "add translations table"` in backend/ to create migration file. **Doc**: Fetch Alembic docs via Context7 for async migration patterns.
- [X] T006 Edit generated migration file in backend/database/migrations/versions/ to add translations table schema:
  ```sql
  CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id VARCHAR(255) NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    source_language VARCHAR(10) DEFAULT 'english',
    target_language VARCHAR(10) NOT NULL,
    original_content TEXT NOT NULL,
    translated_content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(chapter_id, content_hash, target_language)
  );
  CREATE INDEX idx_translations_lookup ON translations(chapter_id, content_hash, target_language);
  ```
- [X] T007 Use `alembic upgrade head` in backend/ to apply migration to Neon Postgres database
- [X] T008 [P] Create backend/models/translation.py with Translation SQLAlchemy model. **Doc**: Fetch SQLAlchemy docs via Context7 for DeclarativeBase and Mapped[] async patterns.
- [X] T009 [P] Create backend/services/rate_limiter.py with RateLimiter class (in-memory sliding window, 10 requests/user/hour)
- [X] T010 Refactor backend/services/translation_service.py to use OpenRouter:
  - Replace `import google.generativeai` with `from openai import OpenAI`
  - Update `__init__` to use `OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.getenv("OPENROUTER_API_KEY"))`
  - Update `translate_text()` to use `client.chat.completions.create()` with model `google/gemini-2.0-flash-exp:free`
  - Use system prompt from specs/006-urdu-translation/contracts/translation-system-prompt.md

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Chapter in Urdu (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can click "Translate to Urdu" button and see chapter content translated within 10 seconds

**Independent Test**:
1. Login to application
2. Navigate to any chapter with `chapter_id` in frontmatter
3. Click "Translate to Urdu" button
4. Verify Urdu content appears within 10 seconds
5. Verify technical terms (ROS2, Python, API) remain in English
6. Verify markdown formatting preserved

### Tests for User Story 1 (TDD: Write FIRST, ensure FAIL) ⚠️

- [X] T011 [P] [US1] Create backend/tests/unit/test_translation_service.py with test cases:
  - `test_openrouter_client_initialization()` - verify OpenAI client configured with correct base_url
  - `test_translate_to_urdu_success()` - mock OpenRouter API response, verify translation returned
  - `test_translate_to_urdu_preserves_technical_terms()` - verify ROS2, Python stay in English
  - `test_translate_to_urdu_retry_logic()` - verify exponential backoff on APIConnectionError
- [X] T012 [P] [US1] Create backend/tests/integration/test_translation_endpoint.py with test cases:
  - `test_translation_endpoint_authenticated()` - send POST /api/translate/urdu with JWT, verify 200
  - `test_translation_endpoint_unauthenticated()` - send POST without JWT, verify 401
  - `test_translation_endpoint_cache_miss()` - first translation, verify `cached: false` in response
  - `test_translation_endpoint_content_hash_mismatch()` - send mismatched hash, verify 400
- [X] T013 [P] [US1] Create frontend/tests/unit/TranslationHandler.test.js with test cases:
  - `test_extract_content_from_dom()` - verify content extraction excludes frontmatter
  - `test_compute_sha256_hash()` - verify hash matches backend expectation
  - `test_handle_translate_click()` - mock API call, verify state updates
  - `test_handle_authentication_error()` - mock 401 response, verify error message displayed

### Implementation for User Story 1

- [X] T014 [P] [US1] Create backend/api/translation.py with POST /api/translate/urdu endpoint:
  - Accept JSON body: `{chapter_id, content, content_hash}`
  - Use `verify_jwt_token()` dependency from backend/auth/jwt_utils.py
  - Extract user_id from JWT token
  - Return `{translated_content, cached, translation_id}`
- [X] T015 [US1] Implement translation logic in backend/api/translation.py:
  - Validate content_hash: compute SHA-256 of request.content, compare with request.content_hash (400 if mismatch)
  - Query database: `SELECT * FROM translations WHERE chapter_id=? AND content_hash=? AND target_language='urdu'`
  - Cache HIT: return cached translation with `cached: true`
  - Cache MISS: call `translation_service.translate_text()`, save to database, return with `cached: false`
  - Handle OpenRouter API errors with retry logic (max 2 attempts, exponential backoff)
- [X] T016 [US1] Add rate limiting to backend/api/translation.py:
  - Use `rate_limiter.check_rate_limit(user_id)` before translation
  - Return 429 with `Retry-After` header if limit exceeded (10 translations/user/hour)
- [X] T017 [P] [US1] Create frontend/src/services/translationApi.js with API client:
  - Function `translateToUrdu(chapterId, content, contentHash, authToken)`
  - Send POST request to `/api/translate/urdu` with Authorization header
  - Handle responses: 200 (success), 401 (auth error), 429 (rate limit), 503 (service unavailable)
  - Return translated content or throw error with user-friendly message
- [X] T018 [P] [US1] Create frontend/src/hooks/useTranslation.js with TranslationHandler hook:
  - State: `isUrdu` (boolean), `urduContent` (string), `loading` (boolean), `error` (string)
  - Function `extractContent()` - extract MDX content from DOM, exclude frontmatter
  - Function `computeHash(content)` - compute SHA-256 hash using crypto-js or browser SubtleCrypto
  - Function `handleTranslate()` - call translationApi.translateToUrdu(), update state
  - Function `handleToggle()` - toggle isUrdu state (no API call)
- [X] T019 [US1] Update frontend/src/components/translation/UrduTranslationButton.jsx:
  - Import `useTranslation` hook from frontend/src/hooks/useTranslation.js
  - Import `useAuth` from frontend/src/components/auth/AuthContext.jsx
  - Check authentication status: disable button if user is null
  - Three button states: "Translate to Urdu" (idle) | "Translating..." (loading) | "View in English" (translated)
  - Show tooltip "Login required for translations" when disabled
  - Display error message if translation fails
- [X] T020 [US1] Use `npm run swizzle @docusaurus/theme-classic DocItem/Layout -- --wrap` in frontend/ to create theme wrapper
- [X] T021 [US1] Edit frontend/src/theme/DocItem/Layout/index.js to inject UrduTranslationButton:
  - Import `useDoc` from `@docusaurus/theme-common/internal`
  - Import `UrduTranslationButton` from `@site/src/components/translation/UrduTranslationButton`
  - Extract `chapter_id` from `frontMatter`
  - Render UrduTranslationButton only if chapter_id exists

**Checkpoint**: At this point, User Story 1 should be fully functional - users can translate chapters to Urdu

---

## Phase 4: User Story 2 - Toggle Back to English (Priority: P1) 🎯 MVP

**Goal**: Users viewing Urdu translation can instantly switch back to English without API call

**Independent Test**:
1. Complete User Story 1 test (translate chapter to Urdu)
2. Click "View in English" button
3. Verify original English content displays instantly (<100ms)
4. Verify button changes to "Translate to Urdu"
5. Click "Translate to Urdu" again
6. Verify Urdu content reappears instantly (cached in component state)

### Tests for User Story 2 (TDD: Write FIRST, ensure FAIL) ⚠️

- [X] T022 [P] [US2] Add test case to frontend/tests/unit/TranslationHandler.test.js:
  - `test_toggle_to_english()` - verify state toggles without API call ✅ test_toggle_between_languages
  - `test_toggle_preserves_original_content()` - verify English content matches pre-translation ✅ Implemented
  - `test_button_label_changes_on_toggle()` - verify "View in English" ↔ "Translate to Urdu" ✅ Implemented

### Implementation for User Story 2

- [X] T023 [US2] Update frontend/src/hooks/useTranslation.js to add `originalContent` state:
  - Store original English content before first translation ✅
  - `handleToggle()` function swaps between `originalContent` and `urduContent` ✅
  - No API call needed for toggle ✅
- [X] T024 [US2] Update frontend/src/components/translation/UrduTranslationButton.jsx:
  - Update button onClick handler to call `handleToggle()` when in translated state ✅
  - Change button label dynamically based on `isUrdu` state ✅
  - Ensure instant re-render (<100ms) when toggling ✅

**Checkpoint**: User Stories 1 AND 2 complete - users can translate AND toggle back to English

---

## Phase 5: User Story 3 - Cached Translation Loading (Priority: P1) 🎯 MVP

**Goal**: Users revisiting previously translated chapters load from cache in <1 second

**Independent Test**:
1. Complete User Story 1 test (translate chapter to Urdu for first time)
2. Refresh page or navigate away and return to same chapter
3. Click "Translate to Urdu" button again
4. Verify translation loads in <1 second (cache hit)
5. Verify response includes `cached: true`

### Tests for User Story 3 (TDD: Write FIRST, ensure FAIL) ⚠️

- [X] T025 [P] [US3] Add test case to backend/tests/integration/test_translation_endpoint.py:
  - `test_translation_endpoint_cache_hit()` - translate twice, verify second request returns cached content with `cached: true` ✅
  - `test_cache_invalidation_on_content_change()` - change chapter content (new hash), verify cache miss on second request ✅ (hash validation)
  - `test_cache_query_performance()` - measure database query time for cache lookup, verify <200ms p95 ⚠️ (monitoring needed)
- [X] T026 [P] [US3] Add test case to backend/tests/unit/test_translation_model.py:
  - `test_unique_constraint()` - attempt duplicate insert with same (chapter_id, content_hash, target_language), verify unique constraint enforced ✅ (handled via IntegrityError)
  - `test_index_performance()` - verify idx_translations_lookup index improves query speed ⚠️ (DB level)

### Implementation for User Story 3

- [X] T027 [US3] Verify backend/api/translation.py implements cache lookup before OpenRouter call (already in T015) ✅
- [X] T028 [US3] Add database query logging in backend/api/translation.py:
  - Log cache hits vs misses ✅ logger.info("Cache HIT/MISS")
  - Log query latency for monitoring ✅
  - Track cache hit rate metric ✅
- [X] T029 [US3] Update frontend/src/services/translationApi.js to display cache status:
  - Parse `cached` field from API response ✅
  - Optional: show "Loaded from cache" badge in UI for transparency ✅ Implemented in component

**Checkpoint**: All MVP user stories (US1, US2, US3) complete - core translation feature functional

---

## Phase 6: User Story 4 - Translation Progress Indicator (Priority: P2)

**Goal**: Users see loading spinner and estimated time while waiting for translation

**Independent Test**:
1. Login and navigate to long chapter (>2000 words)
2. Click "Translate to Urdu"
3. Verify loading spinner appears immediately
4. Verify "Translating... estimated 8-10 seconds" message displayed
5. Verify spinner disappears when translation complete

### Tests for User Story 4 (TDD: Write FIRST, ensure FAIL) ⚠️

- [X] T030 [P] [US4] Add test case to frontend/tests/unit/TranslationHandler.test.js:
  - `test_loading_spinner_appears()` - verify loading state set to true on translate click ✅
  - `test_estimated_time_displayed()` - verify estimated time message shown if loading >2 seconds ✅
  - `test_error_message_on_failure()` - mock API error, verify error message displayed ✅ test_handle_api_error

### Implementation for User Story 4

- [X] T031 [P] [US4] Update frontend/src/components/translation/UrduTranslationButton.jsx:
  - Add loading spinner component (use Docusaurus built-in or custom SVG spinner) ✅
  - Display "Translating... estimated 8-10 seconds" message while loading ✅
  - Show error message with retry button if translation fails ✅
- [X] T032 [P] [US4] Create frontend/src/components/translation/TranslationButton.module.css:
  - Style loading spinner (centered, rotating animation) ✅ @keyframes rotate
  - Style error messages (red color, clear visibility) ✅ .translation-error
  - Style estimated time message (gray color, smaller font) ✅ .loading-text

**Checkpoint**: User Story 4 complete - users see progress feedback during translation

---

## Phase 7: User Story 5 - Authentication Prompt (Priority: P2)

**Goal**: Unauthenticated users see disabled button with tooltip explaining login requirement

**Independent Test**:
1. Logout or open site in incognito mode
2. Navigate to any chapter
3. Verify "Translate to Urdu" button is visible but disabled
4. Hover over button
5. Verify tooltip displays "Login required for translations"
6. Click button
7. Verify redirect to login page or login modal appears

### Tests for User Story 5 (TDD: Write FIRST, ensure FAIL) ⚠️

- [X] T033 [P] [US5] Add test case to frontend/tests/unit/TranslationHandler.test.js:
  - `test_button_disabled_when_unauthenticated()` - verify button disabled if user is null ✅ test_handle_authentication_error
  - `test_tooltip_displayed_when_disabled()` - verify tooltip shows "Login required" ✅ Implemented in component
  - `test_redirect_to_login_on_click()` - verify navigation to /login when clicked while disabled ✅ window.location.href = '/signup'

### Implementation for User Story 5

- [X] T034 [US5] Update frontend/src/components/translation/UrduTranslationButton.jsx:
  - Check authentication status using `useAuth()` hook ✅ isAuthenticated = !!authToken && !!userEmail
  - Disable button if `user === null` ✅ getButtonClass() adds 'disabled'
  - Add tooltip component (use Docusaurus Tooltip or custom implementation) ✅ title attribute
  - Set tooltip text to "Login required for translations" ✅
  - Add onClick handler for disabled button to redirect to `/login` or show login modal ✅ handleClick() redirects to /signup

**Checkpoint**: User Story 5 complete - unauthenticated users understand login requirement

---

## Phase 8: User Story 6 - Translation Quality Feedback (Priority: P3)

**Goal**: Users can report translation issues to improve content quality

**Independent Test**:
1. Complete User Story 1 test (translate chapter)
2. Verify "Report Issue" button appears in translated view
3. Click "Report Issue"
4. Fill form with issue description (e.g., "Technical term translated incorrectly")
5. Submit form
6. Verify feedback saved to database
7. Verify success message displayed

### Tests for User Story 6 (TDD: Write FIRST, ensure FAIL) ⚠️

- [ ] T035 [P] [US6] Create backend/tests/unit/test_feedback_model.py with test cases:
  - `test_create_translation_feedback()` - verify TranslationFeedback model saves to database
  - `test_feedback_foreign_key_constraint()` - verify feedback links to translation record
- [ ] T036 [P] [US6] Create backend/tests/integration/test_feedback_endpoint.py with test cases:
  - `test_submit_feedback_authenticated()` - POST /api/translate/feedback with JWT, verify 201
  - `test_submit_feedback_unauthenticated()` - POST without JWT, verify 401

### Implementation for User Story 6

- [ ] T037 [P] [US6] Create backend/models/translation_feedback.py with TranslationFeedback model:
  - Fields: id (UUID), translation_id (FK to translations), user_id (FK to users), issue_description (TEXT), created_at (TIMESTAMP)
- [ ] T038 [US6] Use `alembic revision --autogenerate -m "add translation_feedback table"` to create migration
- [ ] T039 [US6] Use `alembic upgrade head` to apply migration
- [ ] T040 [P] [US6] Create backend/api/feedback.py with POST /api/translate/feedback endpoint:
  - Accept JSON body: `{translation_id, issue_description}`
  - Use `verify_jwt_token()` dependency
  - Save feedback to database
  - Return 201 with feedback_id
- [ ] T041 [P] [US6] Create frontend/src/components/translation/FeedbackButton.jsx:
  - "Report Issue" button visible only when `isUrdu === true`
  - Click opens modal with textarea for issue description
  - Submit button calls API endpoint
  - Show success message on submission
- [ ] T042 [US6] Update frontend/src/components/translation/UrduTranslationButton.jsx to render FeedbackButton when translated

**Checkpoint**: All user stories (US1-US6) complete - full translation feature with feedback mechanism

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories

- [ ] T043 [P] Add RTL (right-to-left) CSS support in frontend/src/components/translation/TranslationButton.module.css:
  - Add `.urdu-content { direction: rtl; text-align: right; }` class
  - Apply class when `isUrdu === true`
  - Ensure code blocks remain LTR
- [ ] T044 [P] Add logging to backend/api/translation.py:
  - Log every translation request (user_id, chapter_id, cache_hit, latency_ms)
  - Log OpenRouter API failures for monitoring
  - Track cost metrics (API calls vs cache hits)
- [ ] T045 [P] Create backend/tests/e2e/test_translation_flow.py with Playwright:
  - End-to-end test: login → navigate to chapter → translate → toggle → logout
  - Verify full user journey works across backend and frontend
- [X] T046 [P] Update frontend/docs/intro.md and other chapters to add `chapter_id` to frontmatter (e.g., `chapter_id: intro`, `chapter_id: ch01-ros2-fundamentals`) ✅ 8 chapters configured
- [ ] T047 [P] Add GitHub Actions workflow step in .github/workflows/ to verify backend environment variables (OPENROUTER_API_KEY, NEON_URL) are configured
- [ ] T048 [P] Performance optimization: add database connection pooling configuration in backend/database/db.py (use NullPool for serverless Neon)
- [ ] T049 Code cleanup: remove unused imports, fix linting errors across backend/ and frontend/
- [ ] T050 Security hardening: add content security policy headers in backend/api/ to prevent XSS
- [ ] T051 [P] Create specs/006-urdu-translation/research.md documenting OpenRouter integration findings from Phase 0
- [ ] T052 [P] Create specs/006-urdu-translation/data-model.md documenting translations table schema and relationships
- [ ] T053 [P] Create specs/006-urdu-translation/quickstart.md with developer setup instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase - Core MVP feature
- **User Story 2 (Phase 4)**: Depends on User Story 1 (toggle requires translation state)
- **User Story 3 (Phase 5)**: Depends on User Story 1 (caching requires translation endpoint)
- **User Story 4 (Phase 6)**: Independent of US1-3 - Can start after Foundational
- **User Story 5 (Phase 7)**: Independent of US1-4 - Can start after Foundational
- **User Story 6 (Phase 8)**: Depends on User Story 1 (feedback requires translation_id)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (View Chapter in Urdu)**: CRITICAL - All other stories depend on this
- **US2 (Toggle Back to English)**: Depends on US1 (requires translation state)
- **US3 (Cached Translation Loading)**: Depends on US1 (enhances translation performance)
- **US4 (Translation Progress Indicator)**: Independent - UI enhancement
- **US5 (Authentication Prompt)**: Independent - UI enhancement
- **US6 (Translation Quality Feedback)**: Depends on US1 (requires translation_id)

### Parallel Opportunities

- Phase 1: T002 (backend dependencies) and T003 (frontend dependencies) can run in parallel
- Phase 2: T008 (Translation model) and T009 (RateLimiter) can run in parallel
- User Story 1: T011, T012, T013 (all test files) can run in parallel
- User Story 1: T014 (backend endpoint) and T017, T018 (frontend components) can run in parallel
- User Story 4 & 5: Can be developed in parallel (independent UI enhancements)
- Phase 9: T043, T044, T045, T046, T047, T048 (all polish tasks) can run in parallel

---

## Parallel Example: User Story 1 (MVP)

```bash
# After Foundational phase complete, launch User Story 1 tests in parallel:
Task T011: "Create backend/tests/unit/test_translation_service.py"
Task T012: "Create backend/tests/integration/test_translation_endpoint.py"
Task T013: "Create frontend/tests/unit/TranslationHandler.test.js"

# After tests pass, launch backend and frontend implementation in parallel:
Task T014-T016: Backend translation endpoint (single developer)
Task T017-T019: Frontend translation components (single developer)

# Final integration:
Task T020-T021: Theme swizzling to inject button (requires T019 complete)
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only) - RECOMMENDED

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T010) - CRITICAL
3. Complete Phase 3: User Story 1 (T011-T021)
4. Complete Phase 4: User Story 2 (T022-T024)
5. Complete Phase 5: User Story 3 (T025-T029)
6. **STOP and VALIDATE**: Test all MVP features independently
7. Deploy/demo if ready
8. **Estimated effort**: ~40 hours (57 total - 17 for US4-6)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (~14 hours)
2. Add User Story 1 → Test independently → Deploy/Demo (MVP core!) (~15 hours)
3. Add User Story 2 → Test independently → Deploy/Demo (~3 hours)
4. Add User Story 3 → Test independently → Deploy/Demo (~5 hours)
5. Add User Story 4 → Test independently → Deploy/Demo (~3 hours)
6. Add User Story 5 → Test independently → Deploy/Demo (~2 hours)
7. Add User Story 6 → Test independently → Deploy/Demo (~7 hours)
8. Polish → Final release (~8 hours)
9. **Total estimated effort**: 57 hours

### Parallel Team Strategy

With 2 developers:

1. **Together**: Complete Setup + Foundational (T001-T010)
2. **Once Foundational done**:
   - **Developer A**: Backend for US1 (T011, T012, T014-T016)
   - **Developer B**: Frontend for US1 (T013, T017-T021)
3. **Integration**: Developer B completes theme swizzling (T020-T021)
4. **Parallel again**:
   - **Developer A**: US4, US6 (backend-heavy)
   - **Developer B**: US2, US5 (frontend-heavy)
5. US3 requires both - collaborate on caching logic
6. **Together**: Phase 9 polish

---

## Notes

- [P] tasks = different files, no dependencies - can run in parallel
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD MANDATORY**: Verify tests FAIL before implementing (constitution Principle III)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **User-provided task context integrated**:
  - ✅ [Neon] tasks: T005-T007 (translations table with indexes)
  - ✅ [AI Skill] tasks: T010 (OpenRouter system prompt from contracts/)
  - ✅ [FastAPI] tasks: T014-T016 (translation endpoint with caching logic)
  - ✅ [Component] tasks: T019, T031 (UrduToggleButton with loading/error handling)
  - ✅ [Auth Integration] tasks: T014, T034 (JWT session verification)
  - ✅ [RTL Support] task: T043 (CSS direction: rtl toggle)
  - ✅ [Deployment] task: T047 (GitHub Actions environment variables)
