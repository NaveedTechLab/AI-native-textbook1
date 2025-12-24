---
id: 0001
title: Generate Implementation Plan for Urdu Translation
stage: plan
date: 2025-12-24
surface: agent
model: claude-sonnet-4-5
feature: 006-urdu-translation
branch: 006-urdu-translation
user: development-team
command: /sp.plan
labels: ["planning", "architecture", "backend", "frontend", "translation", "tdd"]
links:
  spec: specs/006-urdu-translation/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-urdu-translation/plan.md
 - specs/006-urdu-translation/contracts/translate-urdu-request.json
 - specs/006-urdu-translation/contracts/translate-urdu-response.json
 - specs/006-urdu-translation/contracts/translation-system-prompt.md
tests:
 - Constitution compliance check (6/6 principles verified)
 - TDD methodology validation (enforced throughout)
---

## Prompt

/sp.plan Generate a structured implementation plan following Context 7 (Backend/Frontend Separation).

I. **BACKEND (FastAPI & AI Service):**
   - Define a `translations` table in **Neon Postgres** (`chapter_id`, `language`, `translated_text`, `checksum`).
   - Create a translation agent/skill in `backend/ai/translator.py` that utilizes **OpenRouter** with a specialized prompt for Technical Urdu.
   - Implement a secure FastAPI route `POST /api/v1/translate` that verifies the JWT authentication session.

II. **FRONTEND (Docusaurus & UI):**
   - Create `src/components/TranslationHandler.js` to manage the toggle state (English/Urdu).
   - Use Docusaurus theme swizzling to wrap the `DocItem` layout, ensuring the button appears consistently across all chapters.
   - Connect the component to the backend API using the user's Auth token.

III. **INTEGRATION:**
   - Ensure the `backend/` has access to the raw MDX content (either via a shared volume or a content-fetcher utility) to perform the translation.

## Response snapshot

Successfully generated comprehensive implementation plan with 4 phases and 9 TDD-driven implementation tasks.

### Plan Structure (87KB, 2,565 lines)

**Phase 0: Research & Discovery** (8 hours)
- 6 research areas: OpenRouter integration, content hash caching, Docusaurus swizzling, JWT integration, rate limiting, XSS prevention
- Deliverable: `research.md` (to be created during execution)

**Phase 1: Design & Architecture** (6 hours)
- Backend components: Translation model, OpenRouter service, rate limiter, API endpoint
- Frontend components: TranslationHandler hook, UrduTranslationButton, API client
- Database: Alembic migration for `translations` table
- Deliverables: `data-model.md`, `quickstart.md`, API contracts (JSON schemas)

**Phase 2: Implementation Sequence** (25 hours)
9 tasks with TDD methodology (RED → GREEN → REFACTOR):
1. Database migration + Translation model (2h)
2. OpenRouter service refactor (3h)
3. Rate limiting service (2h)
4. Translation API endpoint (4h)
5. TranslationHandler hook (3h)
6. Update UrduTranslationButton (3h)
7. API client service (2h)
8. Docusaurus theme swizzling (2h)
9. End-to-end testing (4h)

**Phase 3: Testing Strategy** (10 hours)
- Unit tests: >90% backend, >85% frontend coverage
- Integration tests: API, caching, JWT auth
- E2E tests: Full user flow (Playwright)
- Performance tests: 100 concurrent users
- Security tests: XSS, SQL injection, JWT tampering

**Phase 4: Deployment Plan** (8 hours)
- Staged rollout: 10% → 50% → 100%
- Feature flags for controlled enablement
- Monitoring & alerts (latency, cache hit rate, error rate)
- Rollback procedures

### Key Architectural Decisions

**1. OpenRouter Migration**
- Refactor `backend/services/translation_service.py` from Google Gemini to OpenRouter
- Use OpenAI SDK with `base_url="https://openrouter.ai/api/v1"`
- Model: `google/gemini-2.0-flash-exp:free` (free tier, high-quality)
- Maintains backward compatibility via adapter pattern

**2. Content Hash-Based Caching**
- SHA-256 hash of chapter content
- Cache key: `(chapter_id, content_hash, target_language)`
- Automatic invalidation on content updates
- Backend validates hash to prevent cache poisoning attacks

**3. Rate Limiting**
- In-memory sliding window (10 requests/user/hour)
- Future migration to Redis for multi-instance support
- Returns 429 with `Retry-After` header

**4. JWT Authentication Integration**
- Reuses Feature 005 infrastructure (`verify_jwt_token()`)
- HS256 signing, 7-day token expiry
- `sub` claim contains user_id

### API Contracts Generated

**Request Schema** (`translate-urdu-request.json`):
```json
{
  "chapter_id": "string (required)",
  "content": "string (required, max 50000 chars)",
  "content_hash": "string (required, SHA-256 hex)"
}
```

**Response Schema** (`translate-urdu-response.json`):
```json
{
  "translated_content": "string",
  "cached": "boolean",
  "translation_id": "uuid"
}
```

**System Prompt** (`translation-system-prompt.md`):
- Technical term handling rules (preserve/translate/transliterate)
- Formatting preservation (markdown, code blocks, LaTeX)
- Tone guidelines (formal educational Urdu)

### Database Schema

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

### Constitution Compliance

✅ **All 6 principles verified**:
1. AI-Native Educational Content (LLM-powered translation)
2. Modular & Extensible Architecture (isolated service, extensible for future languages)
3. Test-First Development (TDD enforced: RED → GREEN → REFACTOR)
4. Full Integration Testing (comprehensive test strategy)
5. Performance & Accessibility (sub-2s caching, WCAG 2.1 AA)
6. Data Privacy & Security (JWT validation, XSS prevention, SQL injection prevention)

### Performance Targets

- Translation latency: <10s (p95) for LLM call
- Cache hit latency: <1s (p95)
- Concurrent capacity: 100 users
- Cache hit rate: ≥80% after 1 week
- Error rate: <1%
- Cost per translation: <$0.001

### Risk Analysis & Mitigation

| Risk | Mitigation |
|------|-----------|
| OpenRouter API downtime | Retry logic + graceful error messages |
| Translation quality issues | Beta testing with native speakers |
| Cache storage growth | Monitoring + LRU eviction policy |
| XSS injection | Content sanitization + React escaping |
| JWT conflicts | Coordination with Feature 005 team |

## Outcome

- ✅ Impact: Comprehensive 57-hour implementation plan with TDD methodology, ready for task generation
- 🧪 Tests: Test strategy covers unit (>85% coverage), integration, E2E, performance (100 concurrent), security (XSS, injection, auth bypass)
- 📁 Files: Created plan.md (2,565 lines), 3 contract files (request/response schemas, system prompt)
- 🔁 Next prompts: /sp.tasks to generate actionable task list from plan.md, then begin Phase 0 (research)
- 🧠 Reflection: Plan successfully integrates user-provided structure (Backend/Frontend/Integration) with spec requirements, constitution principles, and TDD methodology. OpenRouter migration decision properly documented. Content hash validation addresses security vulnerability identified in spec review.

## Evaluation notes (flywheel)

- Failure modes observed: None - plan generated successfully with all sections completed
- Graders run and results (PASS/FAIL):
  - Constitution compliance: PASS (6/6 principles)
  - TDD methodology: PASS (RED-GREEN-REFACTOR enforced)
  - Dependency ordering: PASS (9 tasks properly sequenced)
  - Test coverage: PASS (unit, integration, E2E, performance, security)
  - Security validation: PASS (XSS, SQL injection, JWT tampering addressed)
  - Performance targets: PASS (latency, cache hit rate, concurrent capacity defined)
- Prompt variant (if applicable): Standard /sp.plan with user-provided Backend/Frontend/Integration structure
- Next experiment (smallest change to try): Execute /sp.tasks to validate that plan provides sufficient detail for task generation, then begin Phase 0 research to validate OpenRouter integration approach
