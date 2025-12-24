# Implementation Plan: Dynamic Urdu Translation

**Branch**: `006-urdu-translation` | **Date**: 2025-12-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/mnt/e/hakaton 1/AI-native-textbook/specs/006-urdu-translation/spec.md`

## Summary

This feature enables authenticated users to translate chapter content from English to Urdu dynamically using OpenRouter's LLM API. The implementation refactors existing translation services to use OpenRouter (via OpenAI SDK compatibility), adds database-backed caching with Neon Postgres, and integrates with Feature 005's JWT authentication. The system prioritizes cost optimization (target <$0.001 per translation via caching), performance (p95 <10s for LLM calls, <1s for cache hits), and security (JWT validation, XSS prevention, rate limiting).

**Key Technical Approach**:
- Refactor existing `backend/services/translation_service.py` from Google Gemini to OpenRouter
- Add `translations` table in Neon Postgres with content hash-based caching
- Implement `POST /api/translate/urdu` endpoint with JWT authentication
- Update existing `UrduTranslationButton.jsx` component for authentication integration
- Use Docusaurus theme swizzling to inject TranslateButton into all chapter pages

## Technical Context

**Language/Version**: Python 3.12, JavaScript (React 18+)
**Primary Dependencies**:
- Backend: FastAPI, OpenAI SDK (openai>=1.0.0), SQLAlchemy, Alembic, python-jose (JWT), bcrypt
- Frontend: React, Docusaurus 3+, @docusaurus/theme-common
**Storage**: Neon Postgres (SQLAlchemy ORM) for users, chat_sessions, translations tables
**Testing**: pytest (backend), Jest (frontend), Playwright (E2E)
**Target Platform**: Linux server (backend), Web browser (frontend)
**Project Type**: Web application (separated backend/frontend)
**Performance Goals**:
- Translation latency: <10s (p95) for LLM call, <1s (p95) for cache hit
- Concurrent capacity: 100 simultaneous requests
- Database query time: <200ms (p95)
**Constraints**:
- Cache hit rate: ≥80% after 1 week
- Error rate: <1%
- Cost: <$0.001 per translation
- Security: 0 vulnerabilities (XSS, injection, auth bypass)
**Scale/Scope**:
- ~100-200 chapters (initial content)
- 1000+ active users (target)
- 10,000+ translations/month (estimated)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: AI-Native Educational Content ✅
- Translation service leverages OpenRouter LLM for technical accuracy
- System prompt optimized for educational robotics/AI content
- Maintains technical terminology in original language where appropriate

### Principle II: Modular & Extensible Architecture ✅
- Translation service isolated from RAG chatbot
- Database schema extensible for future languages (Arabic, Hindi)
- Frontend component reusable across all MDX chapters

### Principle III: Test-First Development (NON-NEGOTIABLE) ✅
- **RED Phase**: Write failing tests for translation endpoint, caching logic, JWT verification
- **GREEN Phase**: Implement minimum viable code to pass tests
- **REFACTOR Phase**: Optimize cache queries, improve error handling
- Test coverage targets: Unit (>90%), Integration (>80%), E2E (critical paths)

### Principle IV: Full Integration Testing ✅
- Test interactions: JWT auth → Translation endpoint → OpenRouter API → Database cache
- Test RAG chatbot unaffected by translation feature
- Test concurrent translation requests with shared cache

### Principle V: Performance & Accessibility ✅
- Sub-2s response for cached translations (target: <1s p95)
- WCAG 2.1 AA compliance: keyboard navigation, screen reader support, color contrast
- Async/await for non-blocking translations
- Database connection pooling (NullPool for serverless Neon)

### Principle VI: Data Privacy & Security ✅
- JWT validation on every translation request (reuses Feature 005 infrastructure)
- Content hash validation prevents cache poisoning attacks
- Rate limiting: 10 translations/user/hour
- XSS prevention: sanitize translated content before rendering
- SQL injection prevention: SQLAlchemy ORM parameterized queries
- No PII in translation logs

### Technology Stack Compliance ✅
- ✅ FastAPI (backend API)
- ✅ Docusaurus v3+ (frontend)
- ✅ Neon Postgres (database)
- ✅ OpenRouter API (LLM provider via OpenAI SDK)
- ✅ JWT authentication (Feature 005 dependency)

## Project Structure

### Documentation (this feature)

```text
specs/006-urdu-translation/
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0: OpenRouter integration, Docusaurus swizzling
├── data-model.md        # Phase 1: Database schema design
├── quickstart.md        # Phase 1: Developer quickstart guide
├── contracts/           # Phase 1: API specifications
│   ├── translate-urdu-request.json
│   ├── translate-urdu-response.json
│   └── translation-system-prompt.md
└── tasks.md             # Phase 2: NOT created by /sp.plan (use /sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── api/
│   ├── translation.py               # EXISTING - refactor endpoint
│   └── auth.py                      # EXISTING - JWT endpoints
├── services/
│   ├── translation_service.py       # EXISTING - migrate to OpenRouter
│   └── rate_limiter.py              # NEW - rate limiting logic
├── models/
│   ├── user.py                      # EXISTING
│   └── translation.py               # NEW - SQLAlchemy Translation model
├── database/
│   ├── db.py                        # EXISTING - session management
│   └── migrations/                  # NEW - Alembic migrations
│       └── versions/
│           └── 006_add_translations_table.py
├── auth/
│   └── jwt_utils.py                 # EXISTING - JWT verification
├── tests/
│   ├── unit/
│   │   ├── test_translation_service.py
│   │   ├── test_rate_limiter.py
│   │   └── test_translation_model.py
│   ├── integration/
│   │   ├── test_translation_endpoint.py
│   │   ├── test_translation_caching.py
│   │   └── test_translation_auth.py
│   └── e2e/
│       └── test_translation_flow.py
└── requirements.txt                 # UPDATE - add openai>=1.0.0

frontend/
├── src/
│   ├── components/
│   │   ├── translation/
│   │   │   ├── UrduTranslationButton.jsx    # EXISTING - update for auth
│   │   │   ├── TranslationHandler.js        # NEW - state management
│   │   │   └── TranslationButton.module.css # NEW - styling
│   │   └── auth/
│   │       └── AuthContext.jsx              # EXISTING - user context
│   ├── theme/
│   │   └── DocItem/                         # NEW - swizzled theme wrapper
│   │       ├── Layout/
│   │       │   └── index.js                 # Injects TranslateButton
│   │       └── index.js
│   └── services/
│       └── translationApi.js                # NEW - API client
└── tests/
    ├── unit/
    │   └── TranslationHandler.test.js
    └── e2e/
        └── translation-flow.spec.js

docs/                                        # Docusaurus content
├── intro.md                                 # Chapters with chapter_id in frontmatter
└── chapters/
    └── *.md
```

**Structure Decision**: Web application (Option 2)
- **Rationale**: Clear separation between backend (FastAPI) and frontend (Docusaurus/React)
- **Backend**: RESTful API, database integration, LLM service orchestration
- **Frontend**: SSG with dynamic React components for translation UI
- **Integration**: Backend serves API at `/api/*`, frontend consumes via fetch/axios

## Complexity Tracking

**No constitution violations identified.** Feature aligns with all principles and technology stack requirements.

---

## Phase 0: Research & Discovery

**Goal**: Resolve all technical unknowns before design phase. Document findings in `research.md`.

### Research Areas

#### R1: OpenRouter API Integration
**Question**: How to migrate from Google Gemini API to OpenRouter while maintaining backward compatibility?

**Research Tasks**:
- [x] Read OpenRouter API documentation (https://openrouter.ai/docs)
- [ ] Test OpenAI SDK with `base_url` override: `OpenAI(base_url="https://openrouter.ai/api/v1")`
- [ ] Verify model selection: `google/gemini-2.0-flash-exp:free` (spec requirement)
- [ ] Test system prompt format compatibility (chat completions API)
- [ ] Document API rate limits and error codes
- [ ] Test streaming vs non-streaming responses
- [ ] Measure baseline latency for 500-word chapter (target: <10s p95)

**Success Criteria**: Working proof-of-concept translation script using OpenRouter

#### R2: Content Hash-Based Caching Strategy
**Question**: How to implement cache invalidation when chapter content updates?

**Research Tasks**:
- [ ] Test SHA-256 hash computation performance (Python `hashlib` vs alternatives)
- [ ] Design cache key format: `(chapter_id, content_hash, target_language)`
- [ ] Research Neon Postgres query performance for composite key lookups
- [ ] Test `UNIQUE(chapter_id, content_hash, target_language)` constraint
- [ ] Document race condition handling: `ON CONFLICT DO NOTHING`
- [ ] Measure cache storage size for 100 chapters (~500KB per chapter estimate)

**Success Criteria**: Cache hit/miss logic with <200ms query time

#### R3: Docusaurus Theme Swizzling
**Question**: How to inject TranslateButton into all chapter pages without manual MDX edits?

**Research Tasks**:
- [ ] Read Docusaurus theme documentation (https://docusaurus.io/docs/swizzling)
- [ ] Identify correct component to swizzle: `@theme/DocItem/Layout` or `@theme/DocItem/Content`
- [ ] Test `useDoc()` hook for accessing chapter metadata (`frontMatter.chapter_id`)
- [ ] Verify button placement: top of content area, before TOC
- [ ] Test hot-reload behavior during development
- [ ] Document build-time implications (static vs dynamic rendering)

**Success Criteria**: TranslateButton appears on all chapters with `chapter_id` frontmatter

#### R4: JWT Authentication Integration (Feature 005 Dependency)
**Question**: How to reuse Feature 005's authentication infrastructure?

**Research Tasks**:
- [x] Review `backend/auth/jwt_utils.py` implementation
- [x] Confirm JWT token format: HS256, 7-day expiry, `sub` field contains user_id
- [ ] Test `verify_jwt_token()` dependency function in FastAPI routes
- [ ] Document Authorization header format: `Bearer <token>`
- [ ] Test token expiry handling (401 response)
- [ ] Verify frontend AuthContext provides user data

**Success Criteria**: Translation endpoint rejects unauthenticated requests with 401

#### R5: Rate Limiting Implementation
**Question**: How to enforce 10 translations/user/hour without external dependencies?

**Research Tasks**:
- [ ] Evaluate in-memory solution (dict with TTL) vs database-backed
- [ ] Research `slowapi` library for FastAPI rate limiting
- [ ] Design rate limit key: `user_id + timestamp window`
- [ ] Test rate limit reset logic (sliding window vs fixed window)
- [ ] Document 429 response format with `Retry-After` header

**Success Criteria**: 11th translation request within 1 hour returns 429 error

#### R6: XSS Prevention for Translated Content
**Question**: How to safely render LLM-generated Urdu content in Docusaurus?

**Research Tasks**:
- [ ] Test Docusaurus's built-in XSS protection (ReactDOM escaping)
- [ ] Research `DOMPurify` library for HTML sanitization
- [ ] Test edge case: LLM injects `<script>` tags in translation
- [ ] Document content security policy (CSP) headers
- [ ] Verify markdown rendering preserves formatting without executing code

**Success Criteria**: Malicious HTML in translated content is escaped/removed

### Deliverable: `research.md`

**Template Structure**:
```markdown
# Feature 006: Research Findings

## OpenRouter API Integration
- API Endpoint: https://openrouter.ai/api/v1
- Authentication: Bearer token in headers
- Model: google/gemini-2.0-flash-exp:free
- Latency: [measured value]
- Rate Limits: [documented limits]

## Cache Strategy
- Hash Algorithm: SHA-256
- Cache Key: (chapter_id, content_hash, target_language)
- Query Performance: [measured p95 latency]

## Docusaurus Swizzling
- Component: @theme/DocItem/Layout
- Hook: useDoc() for frontMatter access
- Placement: [screenshot/description]

## JWT Integration
- Verification: verify_jwt_token() dependency
- Header Format: Authorization: Bearer <token>
- Expiry Handling: [error response format]

## Rate Limiting
- Implementation: [chosen approach]
- Storage: [in-memory vs database]
- Reset Logic: [sliding vs fixed window]

## Security
- XSS Prevention: [chosen approach]
- Content Sanitization: [library/method]
- Test Results: [injection test outcomes]

## Open Questions
- [Any remaining unknowns for Phase 1]
```

**Exit Criteria**: All research tasks completed, `research.md` committed to branch.

---

## Phase 1: Design & Architecture

**Goal**: Produce detailed designs for database schema, API contracts, component architecture, and data flow.

### Component Breakdown

#### Backend Components

##### 1.1 Database Layer

**File**: `backend/models/translation.py`

**SQLAlchemy Model**:
```python
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from backend.database.db import Base

class Translation(Base):
    __tablename__ = "translations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(String(255), nullable=False, index=True)
    content_hash = Column(String(64), nullable=False, index=True)  # SHA-256
    source_language = Column(String(10), default="english", nullable=False)
    target_language = Column(String(10), nullable=False, index=True)
    original_content = Column(Text, nullable=False)
    translated_content = Column(Text, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('chapter_id', 'content_hash', 'target_language', name='uq_translation_key'),
        Index('idx_translations_lookup', 'chapter_id', 'content_hash', 'target_language'),
    )
```

**Migration Script**: `backend/database/migrations/versions/006_add_translations_table.py`

**Alembic Migration**:
```python
"""Add translations table for chapter translations

Revision ID: 006
Revises: 005
Create Date: 2025-12-24
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '006'
down_revision = '005'  # Previous migration
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'translations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('chapter_id', sa.String(255), nullable=False),
        sa.Column('content_hash', sa.String(64), nullable=False),
        sa.Column('source_language', sa.String(10), default='english', nullable=False),
        sa.Column('target_language', sa.String(10), nullable=False),
        sa.Column('original_content', sa.Text, nullable=False),
        sa.Column('translated_content', sa.Text, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('updated_at', sa.DateTime, nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.UniqueConstraint('chapter_id', 'content_hash', 'target_language', name='uq_translation_key'),
    )
    op.create_index('idx_translations_lookup', 'translations', ['chapter_id', 'content_hash', 'target_language'])

def downgrade():
    op.drop_index('idx_translations_lookup', table_name='translations')
    op.drop_table('translations')
```

##### 1.2 OpenRouter Translation Service

**File**: `backend/services/translation_service.py` (REFACTOR EXISTING)

**Architecture Decision**: Replace Google Gemini API with OpenRouter (via OpenAI SDK)

**Before (Current)**:
```python
import google.generativeai as genai

class TranslationService:
    def __init__(self, gemini_api_key: str):
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
```

**After (OpenRouter)**:
```python
from openai import OpenAI
import os
import logging

logger = logging.getLogger(__name__)

class TranslationService:
    def __init__(self, openrouter_api_key: str = None):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=openrouter_api_key or os.getenv("OPENROUTER_API_KEY")
        )
        self.model = "google/gemini-2.0-flash-exp:free"
        logger.info("TranslationService initialized with OpenRouter")

    def translate_to_urdu(self, text: str) -> str:
        """Translate English text to Urdu using OpenRouter LLM"""
        system_prompt = self._get_urdu_translation_prompt()

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.3,
            max_tokens=8000
        )

        return response.choices[0].message.content

    def _get_urdu_translation_prompt(self) -> str:
        """System prompt for technical Urdu translation (from spec Section 5.4)"""
        return """You are a technical translator specializing in AI, robotics, and computer science education.
Translate the following English text to Urdu following these rules strictly:

TECHNICAL TERMS:
- Keep in English: ROS2, Python, API, HTTP, JSON, ML, AI, function, class, variable, loop, array
- Translate common words: robot → روبوٹ, computer → کمپیوٹر, network → نیٹ ورک
- Transliterate ambiguous terms: Sensor → سینسر (Sensor), Actuator → ایکچویٹر (Actuator)
- NEVER translate code identifiers (function names, variables, etc.)

FORMATTING:
- Preserve ALL markdown syntax (headings #, bold **, italic _, lists -, links [](url))
- Keep code blocks entirely in English (including comments): ```language ... ```
- Keep inline code in English: `variable_name`
- Keep LaTeX math unchanged: $equation$
- Translate link text but keep URLs: [ترجمہ شدہ متن](https://example.com)
- Translate image alt text but keep src: ![روبوٹ کی تصویر](robot.png)

TONE:
- Use formal educational tone (not conversational)
- Follow standard Urdu grammar rules
- Use proper Urdu punctuation (،؟ instead of ,?)
- Do not mix English and Urdu in same sentence except for technical terms listed above"""
```

**Backward Compatibility**: Existing `translate_to_english()` method signature unchanged

##### 1.3 Rate Limiting Service

**File**: `backend/services/rate_limiter.py` (NEW)

**Implementation**:
```python
from datetime import datetime, timedelta
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    """In-memory rate limiter with sliding window"""

    def __init__(self, max_requests: int = 10, window_minutes: int = 60):
        self.max_requests = max_requests
        self.window_minutes = window_minutes
        self.requests: Dict[str, list] = {}  # user_id -> [timestamps]

    def is_allowed(self, user_id: str) -> Tuple[bool, int]:
        """
        Check if user is within rate limit
        Returns: (is_allowed, remaining_requests)
        """
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=self.window_minutes)

        # Initialize or clean old requests
        if user_id not in self.requests:
            self.requests[user_id] = []

        # Remove requests outside window
        self.requests[user_id] = [
            ts for ts in self.requests[user_id]
            if ts > window_start
        ]

        current_count = len(self.requests[user_id])

        if current_count >= self.max_requests:
            logger.warning(f"Rate limit exceeded for user {user_id}")
            return False, 0

        # Record this request
        self.requests[user_id].append(now)
        return True, self.max_requests - current_count - 1

    def reset(self, user_id: str):
        """Reset rate limit for user (admin override)"""
        if user_id in self.requests:
            del self.requests[user_id]
            logger.info(f"Rate limit reset for user {user_id}")
```

**Note**: In-memory solution suitable for single-instance deployments. For multi-instance, migrate to Redis.

##### 1.4 Translation API Endpoint

**File**: `backend/api/translation.py` (REFACTOR EXISTING)

**New Endpoint**: `POST /api/translate/urdu`

**Implementation**:
```python
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import hashlib
import logging

from backend.database.db import get_db
from backend.models.translation import Translation
from backend.auth.jwt_utils import get_current_user_id_from_token
from backend.services.translation_service import TranslationService
from backend.services.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/translate", tags=["translation"])

# Singleton instances
translation_service = TranslationService()
rate_limiter = RateLimiter(max_requests=10, window_minutes=60)

class TranslationRequest(BaseModel):
    chapter_id: str
    content: str
    content_hash: str

class TranslationResponse(BaseModel):
    translated_content: str
    cached: bool
    translation_id: str

@router.post("/urdu", response_model=TranslationResponse)
async def translate_to_urdu(
    request: TranslationRequest,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Translate chapter content to Urdu with JWT authentication and caching
    """
    # 1. Verify JWT token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    user_id = get_current_user_id_from_token(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # 2. Rate limiting
    is_allowed, remaining = rate_limiter.is_allowed(user_id)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail="Translation limit reached. Please try again in 1 hour.",
            headers={"Retry-After": "3600"}
        )

    # 3. Validate content hash (prevent cache poisoning)
    computed_hash = hashlib.sha256(request.content.encode('utf-8')).hexdigest()
    if computed_hash != request.content_hash:
        raise HTTPException(status_code=400, detail="Content hash mismatch")

    # 4. Check cache
    cached_translation = db.query(Translation).filter(
        Translation.chapter_id == request.chapter_id,
        Translation.content_hash == request.content_hash,
        Translation.target_language == "urdu"
    ).first()

    if cached_translation:
        logger.info(f"Cache hit for chapter {request.chapter_id}, user {user_id}")
        return TranslationResponse(
            translated_content=cached_translation.translated_content,
            cached=True,
            translation_id=str(cached_translation.id)
        )

    # 5. Translate via OpenRouter (cache miss)
    try:
        translated_text = translation_service.translate_to_urdu(request.content)
    except Exception as e:
        logger.error(f"OpenRouter API error: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="Translation service unavailable. Please try again later.",
            headers={"Retry-After": "60"}
        )

    # 6. Save to cache
    try:
        new_translation = Translation(
            chapter_id=request.chapter_id,
            content_hash=request.content_hash,
            source_language="english",
            target_language="urdu",
            original_content=request.content,
            translated_content=translated_text,
            user_id=user_id
        )
        db.add(new_translation)
        db.commit()
        db.refresh(new_translation)

        logger.info(f"Cache miss: translated and saved chapter {request.chapter_id}")

        return TranslationResponse(
            translated_content=translated_text,
            cached=False,
            translation_id=str(new_translation.id)
        )
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        # Still return translation to user (graceful degradation)
        return TranslationResponse(
            translated_content=translated_text,
            cached=False,
            translation_id="none"
        )
```

**Error Handling Matrix**:

| Error | HTTP Code | Response | Action |
|-------|-----------|----------|--------|
| Missing auth header | 401 | `{"detail": "Missing or invalid Authorization header"}` | Redirect to login |
| Invalid JWT | 401 | `{"detail": "Invalid or expired token"}` | Redirect to login |
| Rate limit exceeded | 429 | `{"detail": "Translation limit reached..."}` | Show wait message |
| Content hash mismatch | 400 | `{"detail": "Content hash mismatch"}` | Re-compute hash |
| OpenRouter API failure | 503 | `{"detail": "Translation service unavailable..."}` | Retry with exponential backoff |
| Database failure | 500 | Returns translation without caching | Log error, alert ops |

#### Frontend Components

##### 2.1 TranslationHandler Component

**File**: `frontend/src/components/translation/TranslationHandler.js` (NEW)

**Purpose**: Centralized state management and API communication for translations

**Implementation**:
```jsx
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { translateToUrdu } from '@/services/translationApi';

export const useTranslation = (chapterId, initialContent) => {
  const { user, token } = useAuth();
  const [isUrdu, setIsUrdu] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [urduContent, setUrduContent] = useState(null);
  const [error, setError] = useState(null);

  const computeContentHash = useCallback((content) => {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
      .then(hashBuffer => {
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
  }, []);

  const translate = useCallback(async () => {
    if (!user) {
      setError('Please login to translate chapters');
      return;
    }

    if (isTranslating) return;

    setIsTranslating(true);
    setError(null);

    try {
      const contentHash = await computeContentHash(initialContent);

      const response = await translateToUrdu({
        chapter_id: chapterId,
        content: initialContent,
        content_hash: contentHash
      }, token);

      setUrduContent(response.translated_content);
      setIsUrdu(true);
    } catch (err) {
      console.error('Translation error:', err);

      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 429) {
        setError('Translation limit reached. Please try again in 1 hour.');
      } else {
        setError('Translation failed. Please try again later.');
      }
    } finally {
      setIsTranslating(false);
    }
  }, [user, token, chapterId, initialContent, isTranslating, computeContentHash]);

  const toggleLanguage = useCallback(() => {
    setIsUrdu(!isUrdu);
    setError(null);
  }, [isUrdu]);

  return {
    isUrdu,
    isTranslating,
    urduContent,
    error,
    translate,
    toggleLanguage,
    currentContent: isUrdu ? urduContent : initialContent
  };
};
```

##### 2.2 TranslateButton Component (Update Existing)

**File**: `frontend/src/components/translation/UrduTranslationButton.jsx` (REFACTOR)

**Changes**:
- Add JWT authentication check
- Use TranslationHandler hook
- Compute content hash on frontend
- Handle 401/429 errors gracefully

**Updated Implementation**:
```jsx
import React from 'react';
import { useTranslation } from './TranslationHandler';
import styles from './TranslationButton.module.css';

const UrduTranslationButton = ({ chapterId, content }) => {
  const {
    isUrdu,
    isTranslating,
    urduContent,
    error,
    translate,
    toggleLanguage,
    currentContent
  } = useTranslation(chapterId, content);

  return (
    <div className={styles.translationContainer}>
      <button
        onClick={isUrdu ? toggleLanguage : translate}
        disabled={isTranslating}
        className={styles.translateButton}
        aria-label={isUrdu ? "Switch to English" : "Translate to Urdu"}
      >
        {isTranslating ? (
          <>
            <span className={styles.spinner} aria-hidden="true"></span>
            Translating...
          </>
        ) : isUrdu ? (
          'View in English'
        ) : (
          'اردو میں دیکھیں'
        )}
      </button>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {isUrdu && (
        <div className={styles.indicator} aria-live="polite">
          Displaying content in Urdu
        </div>
      )}
    </div>
  );
};

export default UrduTranslationButton;
```

##### 2.3 API Client Service

**File**: `frontend/src/services/translationApi.js` (NEW)

**Implementation**:
```javascript
const API_BASE = process.env.NODE_ENV === 'production'
  ? '/api'
  : 'http://localhost:8001/api';

export async function translateToUrdu(data, token) {
  const response = await fetch(`${API_BASE}/translate/urdu`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = new Error('Translation request failed');
    error.response = response;
    error.data = await response.json().catch(() => ({}));
    throw error;
  }

  return response.json();
}
```

##### 2.4 Docusaurus Theme Swizzling

**File**: `frontend/src/theme/DocItem/Layout/index.js` (NEW)

**Implementation**:
```jsx
import React from 'react';
import clsx from 'clsx';
import { useDoc } from '@docusaurus/theme-common/internal';
import Layout from '@theme-original/DocItem/Layout';
import UrduTranslationButton from '@site/src/components/translation/UrduTranslationButton';

export default function DocItemLayoutWrapper(props) {
  const { frontMatter } = useDoc();
  const chapterId = frontMatter?.chapter_id;

  return (
    <>
      {chapterId && (
        <div className="translation-wrapper">
          <UrduTranslationButton
            chapterId={chapterId}
            content={props.children.props.children} // MDX content
          />
        </div>
      )}
      <Layout {...props} />
    </>
  );
}
```

**Swizzle Command**:
```bash
npm run swizzle @docusaurus/theme-classic DocItem/Layout -- --wrap
```

### Data Flow Diagrams

#### Translation Request Flow (Cache Miss)

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  1. User clicks "اردو میں دیکھیں"                     │     │
│  │  2. TranslationHandler extracts content + computes SHA │     │
│  │  3. POST /api/translate/urdu                          │     │
│  │     Headers: Authorization: Bearer <JWT>              │     │
│  │     Body: {chapter_id, content, content_hash}        │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  4. Verify JWT token (401 if invalid)                 │     │
│  │  5. Check rate limit (429 if exceeded)                │     │
│  │  6. Validate content_hash (400 if mismatch)           │     │
│  └────────────────────────────────────────────────────────┘     │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  7. Query Neon Postgres:                              │     │
│  │     SELECT * FROM translations                        │     │
│  │     WHERE chapter_id=? AND content_hash=?             │     │
│  │     AND target_language='urdu'                        │     │
│  └────────────────────────────────────────────────────────┘     │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  8. Cache MISS → Call OpenRouter API                  │     │
│  │     POST https://openrouter.ai/api/v1/chat/completions│     │
│  │     Model: google/gemini-2.0-flash-exp:free           │     │
│  │     Messages: [system_prompt, user_content]           │     │
│  └────────────────────────────────────────────────────────┘     │
│                              │                                    │
│                              ▼                                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  9. Receive translated text (8-10 seconds)            │     │
│  │  10. INSERT INTO translations (...)                   │     │
│  │  11. Return response: {translated_content, cached:false}│    │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JSON Response
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  12. Replace English content with Urdu content         │     │
│  │  13. Change button to "View in English"                │     │
│  │  14. Store urduContent in component state             │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

#### Translation Request Flow (Cache Hit)

```
User → Frontend → Backend → Neon Postgres (SELECT)
                    ↓
                  Cache HIT (<1 second)
                    ↓
                  Return cached translation
                    ↓
                  Frontend renders Urdu content
```

#### Toggle Back to English Flow

```
User clicks "View in English"
    ↓
TranslationHandler toggles isUrdu state (no API call)
    ↓
Component re-renders with original English content
    ↓
Button changes to "اردو میں دیکھیں"
```

### API Contract Specifications

#### Request Schema: `contracts/translate-urdu-request.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["chapter_id", "content", "content_hash"],
  "properties": {
    "chapter_id": {
      "type": "string",
      "description": "Unique chapter identifier from frontmatter",
      "pattern": "^[a-z0-9-]+$",
      "minLength": 3,
      "maxLength": 255,
      "examples": ["intro-to-ros2", "chapter-01-basics"]
    },
    "content": {
      "type": "string",
      "description": "Full chapter content in Markdown/MDX format",
      "minLength": 10,
      "maxLength": 50000
    },
    "content_hash": {
      "type": "string",
      "description": "SHA-256 hash of content for cache validation",
      "pattern": "^[a-f0-9]{64}$",
      "examples": ["5d41402abc4b2a76b9719d911017c592"]
    }
  },
  "additionalProperties": false
}
```

#### Response Schema: `contracts/translate-urdu-response.json`

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["translated_content", "cached", "translation_id"],
  "properties": {
    "translated_content": {
      "type": "string",
      "description": "Translated Urdu content with preserved markdown formatting"
    },
    "cached": {
      "type": "boolean",
      "description": "True if returned from cache, false if fresh translation"
    },
    "translation_id": {
      "type": "string",
      "description": "UUID of translation record (or 'none' if caching failed)",
      "pattern": "^[a-f0-9-]{36}|none$"
    }
  },
  "additionalProperties": false
}
```

#### System Prompt: `contracts/translation-system-prompt.md`

*(Full prompt documented in spec Section 5.4)*

**Key Requirements**:
- Keep technical terms in English: ROS2, Python, API, JSON, ML
- Translate domain terms: robot → روبوٹ, computer → کمپیوٹر
- Preserve all markdown syntax (headings, lists, links, code blocks)
- Use formal educational Urdu tone
- Apply proper Urdu punctuation (،؟)

### Error Handling Strategy

#### Client-Side Error Handling

```javascript
// frontend/src/components/translation/TranslationHandler.js
try {
  const response = await translateToUrdu(...);
} catch (err) {
  if (err.response?.status === 401) {
    // Session expired
    setError('Session expired. Please login again.');
    // Optional: trigger logout and redirect
  } else if (err.response?.status === 429) {
    // Rate limit exceeded
    const retryAfter = err.response.headers.get('Retry-After');
    setError(`Translation limit reached. Try again in ${retryAfter/60} minutes.`);
  } else if (err.response?.status === 503) {
    // OpenRouter API down
    setError('Translation service temporarily unavailable. Please try again in 1 minute.');
    // Optional: retry with exponential backoff
  } else {
    // Generic error
    setError('Translation failed. Please try again later.');
  }
}
```

#### Server-Side Error Recovery

**OpenRouter API Retry Logic**:
```python
# backend/services/translation_service.py
import time
from openai import APIError, APIConnectionError

def translate_to_urdu(self, text: str, max_retries: int = 2) -> str:
    for attempt in range(max_retries):
        try:
            response = self.client.chat.completions.create(...)
            return response.choices[0].message.content
        except APIConnectionError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s
                logger.warning(f"OpenRouter connection error, retrying in {wait_time}s")
                time.sleep(wait_time)
            else:
                raise
        except APIError as e:
            logger.error(f"OpenRouter API error: {e.status_code}")
            raise
```

**Database Failure Graceful Degradation**:
```python
# backend/api/translation.py
try:
    db.add(new_translation)
    db.commit()
except Exception as e:
    logger.error(f"Database error: {str(e)}")
    db.rollback()
    # STILL return translation to user
    return TranslationResponse(
        translated_content=translated_text,
        cached=False,
        translation_id="none"
    )
```

### Deliverables: Phase 1 Artifacts

**1. `data-model.md`**: Database schema with ERD and migration scripts

**2. `quickstart.md`**: Developer setup guide
```markdown
# Feature 006: Developer Quickstart

## Environment Setup
1. Add to backend/.env:
   OPENROUTER_API_KEY=<your-key>
   NEON_POSTGRES_URL=<neon-connection-string>
   JWT_SECRET_KEY=<shared-with-feature-005>

2. Install dependencies:
   cd backend && pip install openai>=1.0.0 alembic

3. Run migrations:
   alembic upgrade head

4. Start backend:
   uvicorn main:app --reload --port 8001

5. Start frontend:
   cd frontend && npm run start

## Testing Translation
1. Login via /login page
2. Navigate to any chapter with chapter_id frontmatter
3. Click "اردو میں دیکھیں" button
4. Verify translation appears within 10 seconds

## Troubleshooting
- 401 error: Check JWT_SECRET_KEY matches Feature 005
- 503 error: Verify OPENROUTER_API_KEY is valid
- Slow translation: Check OpenRouter API status
```

**3. `contracts/`**: API request/response schemas (JSON Schema) + system prompt

**Exit Criteria**: All design documents reviewed, database schema approved, API contracts validated.

---

## Phase 2: Implementation Sequence

**Goal**: Implement components in dependency order, writing tests BEFORE code (TDD).

### Task Ordering by Dependencies

```
Layer 1 (Foundation) - NO DEPENDENCIES
├── Task 1: Database migration + Translation model
└── Task 2: OpenRouter service refactor

Layer 2 (Core Logic) - DEPENDS ON LAYER 1
├── Task 3: Rate limiting service
└── Task 4: Translation API endpoint

Layer 3 (Frontend) - DEPENDS ON LAYER 2
├── Task 5: TranslationHandler hook
├── Task 6: Update UrduTranslationButton
└── Task 7: API client service

Layer 4 (Integration) - DEPENDS ON ALL LAYERS
├── Task 8: Docusaurus theme swizzling
└── Task 9: End-to-end testing
```

### Task 1: Database Migration + Translation Model

**Files**:
- `backend/models/translation.py` (NEW)
- `backend/database/migrations/versions/006_add_translations_table.py` (NEW)

**TDD Steps**:

**1.1 RED: Write failing tests**

`backend/tests/unit/test_translation_model.py`:
```python
import pytest
from backend.models.translation import Translation
from sqlalchemy.exc import IntegrityError

def test_translation_model_creation():
    """Test Translation model instantiation"""
    t = Translation(
        chapter_id="test-chapter",
        content_hash="a" * 64,
        source_language="english",
        target_language="urdu",
        original_content="Hello world",
        translated_content="ہیلو دنیا",
        user_id="user-123"
    )
    assert t.chapter_id == "test-chapter"
    assert t.target_language == "urdu"

def test_unique_constraint(db_session):
    """Test unique constraint on (chapter_id, content_hash, target_language)"""
    t1 = Translation(chapter_id="ch1", content_hash="hash1", target_language="urdu", ...)
    db_session.add(t1)
    db_session.commit()

    # Duplicate should fail
    t2 = Translation(chapter_id="ch1", content_hash="hash1", target_language="urdu", ...)
    db_session.add(t2)
    with pytest.raises(IntegrityError):
        db_session.commit()
```

**1.2 GREEN: Implement model**

Create `backend/models/translation.py` (see Phase 1 design)

**1.3 RED: Write migration test**

`backend/tests/integration/test_migrations.py`:
```python
def test_006_migration_creates_translations_table(db_engine):
    """Test migration creates translations table with correct schema"""
    from sqlalchemy import inspect

    inspector = inspect(db_engine)
    assert 'translations' in inspector.get_table_names()

    columns = {col['name']: col for col in inspector.get_columns('translations')}
    assert 'chapter_id' in columns
    assert 'content_hash' in columns
    assert 'translated_content' in columns

    indexes = inspector.get_indexes('translations')
    assert any(idx['name'] == 'idx_translations_lookup' for idx in indexes)
```

**1.4 GREEN: Create migration**

```bash
cd backend
alembic revision -m "Add translations table"
# Edit generated file to match Phase 1 design
alembic upgrade head
```

**1.5 REFACTOR**: Optimize indexes, add comments

**Acceptance Criteria**:
- [ ] Translation model tests pass
- [ ] Migration creates table with correct schema
- [ ] Unique constraint enforced in database
- [ ] Foreign key to users table validated

**Estimated Time**: 2 hours

---

### Task 2: OpenRouter Service Refactor

**Files**:
- `backend/services/translation_service.py` (REFACTOR)

**TDD Steps**:

**2.1 RED: Write failing tests**

`backend/tests/unit/test_translation_service.py`:
```python
import pytest
from unittest.mock import patch, MagicMock
from backend.services.translation_service import TranslationService

def test_translate_to_urdu_success():
    """Test successful translation via OpenRouter"""
    service = TranslationService(openrouter_api_key="test-key")

    with patch.object(service.client.chat.completions, 'create') as mock_create:
        mock_create.return_value = MagicMock(
            choices=[MagicMock(message=MagicMock(content="ٹیسٹ"))]
        )

        result = service.translate_to_urdu("test")
        assert result == "ٹیسٹ"
        mock_create.assert_called_once()

def test_translate_to_urdu_uses_correct_model():
    """Test translation uses google/gemini-2.0-flash-exp:free"""
    service = TranslationService()

    with patch.object(service.client.chat.completions, 'create') as mock_create:
        mock_create.return_value = MagicMock(choices=[...])
        service.translate_to_urdu("test")

        call_args = mock_create.call_args
        assert call_args.kwargs['model'] == "google/gemini-2.0-flash-exp:free"

def test_translate_to_urdu_includes_system_prompt():
    """Test translation includes technical Urdu system prompt"""
    service = TranslationService()

    with patch.object(service.client.chat.completions, 'create') as mock_create:
        mock_create.return_value = MagicMock(choices=[...])
        service.translate_to_urdu("test")

        messages = mock_create.call_args.kwargs['messages']
        assert len(messages) == 2
        assert messages[0]['role'] == 'system'
        assert 'ROS2' in messages[0]['content']
        assert 'markdown' in messages[0]['content'].lower()

def test_translate_to_urdu_retry_on_connection_error():
    """Test retry logic on OpenRouter connection failure"""
    service = TranslationService()

    with patch.object(service.client.chat.completions, 'create') as mock_create:
        # First call fails, second succeeds
        mock_create.side_effect = [
            APIConnectionError("Connection timeout"),
            MagicMock(choices=[MagicMock(message=MagicMock(content="success"))])
        ]

        result = service.translate_to_urdu("test")
        assert result == "success"
        assert mock_create.call_count == 2
```

**2.2 GREEN: Refactor service**

Replace `google.generativeai` with OpenAI client (see Phase 1 design)

**2.3 REFACTOR**: Add retry logic, improve error messages

**Acceptance Criteria**:
- [ ] All unit tests pass
- [ ] OpenRouter API called with correct parameters
- [ ] System prompt includes technical term rules
- [ ] Retry logic handles connection errors
- [ ] Backward compatibility: existing `translate_to_english()` unchanged

**Estimated Time**: 3 hours

---

### Task 3: Rate Limiting Service

**Files**:
- `backend/services/rate_limiter.py` (NEW)

**TDD Steps**:

**3.1 RED: Write failing tests**

`backend/tests/unit/test_rate_limiter.py`:
```python
from backend.services.rate_limiter import RateLimiter
from datetime import datetime, timedelta

def test_rate_limiter_allows_within_limit():
    """Test requests within limit are allowed"""
    limiter = RateLimiter(max_requests=3, window_minutes=60)

    assert limiter.is_allowed("user1") == (True, 2)
    assert limiter.is_allowed("user1") == (True, 1)
    assert limiter.is_allowed("user1") == (True, 0)

def test_rate_limiter_blocks_over_limit():
    """Test requests over limit are blocked"""
    limiter = RateLimiter(max_requests=2, window_minutes=60)

    limiter.is_allowed("user1")
    limiter.is_allowed("user1")

    is_allowed, remaining = limiter.is_allowed("user1")
    assert is_allowed == False
    assert remaining == 0

def test_rate_limiter_sliding_window():
    """Test sliding window resets after time passes"""
    limiter = RateLimiter(max_requests=2, window_minutes=1)

    limiter.is_allowed("user1")
    limiter.is_allowed("user1")
    assert limiter.is_allowed("user1")[0] == False

    # Fast-forward time (mock datetime)
    # After 61 seconds, should reset
    # ... implementation depends on time mocking strategy

def test_rate_limiter_per_user_isolation():
    """Test rate limits are per-user"""
    limiter = RateLimiter(max_requests=1, window_minutes=60)

    assert limiter.is_allowed("user1")[0] == True
    assert limiter.is_allowed("user2")[0] == True  # Different user
    assert limiter.is_allowed("user1")[0] == False  # First user blocked
```

**3.2 GREEN: Implement rate limiter** (see Phase 1 design)

**3.3 REFACTOR**: Add logging, optimize memory usage

**Acceptance Criteria**:
- [ ] All unit tests pass
- [ ] Sliding window logic correct
- [ ] Per-user isolation enforced
- [ ] Reset mechanism works

**Estimated Time**: 2 hours

---

### Task 4: Translation API Endpoint

**Files**:
- `backend/api/translation.py` (REFACTOR - add new endpoint)

**TDD Steps**:

**4.1 RED: Write failing integration tests**

`backend/tests/integration/test_translation_endpoint.py`:
```python
from fastapi.testclient import TestClient
import hashlib

def test_translate_urdu_requires_auth(client: TestClient):
    """Test endpoint returns 401 without Authorization header"""
    response = client.post("/api/translate/urdu", json={
        "chapter_id": "test",
        "content": "test",
        "content_hash": "hash"
    })
    assert response.status_code == 401

def test_translate_urdu_validates_content_hash(client: TestClient, auth_token):
    """Test endpoint validates content hash"""
    content = "test content"
    wrong_hash = "0" * 64

    response = client.post(
        "/api/translate/urdu",
        json={"chapter_id": "test", "content": content, "content_hash": wrong_hash},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 400
    assert "hash mismatch" in response.json()["detail"].lower()

def test_translate_urdu_cache_hit(client: TestClient, auth_token, db_session):
    """Test endpoint returns cached translation"""
    # Pre-populate cache
    content = "test content"
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    cached_translation = Translation(
        chapter_id="test",
        content_hash=content_hash,
        target_language="urdu",
        original_content=content,
        translated_content="cached urdu",
        user_id="user-123"
    )
    db_session.add(cached_translation)
    db_session.commit()

    response = client.post(
        "/api/translate/urdu",
        json={"chapter_id": "test", "content": content, "content_hash": content_hash},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["cached"] == True
    assert data["translated_content"] == "cached urdu"

def test_translate_urdu_cache_miss_calls_llm(client: TestClient, auth_token, mock_openrouter):
    """Test endpoint calls OpenRouter on cache miss"""
    content = "new content"
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    mock_openrouter.return_value = "new urdu translation"

    response = client.post(
        "/api/translate/urdu",
        json={"chapter_id": "new", "content": content, "content_hash": content_hash},
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["cached"] == False
    assert data["translated_content"] == "new urdu translation"
    mock_openrouter.assert_called_once()

def test_translate_urdu_rate_limiting(client: TestClient, auth_token):
    """Test endpoint enforces rate limits"""
    content = "test"
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    # Make 10 successful requests
    for i in range(10):
        response = client.post(
            "/api/translate/urdu",
            json={"chapter_id": f"ch{i}", "content": content, "content_hash": content_hash},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code in [200, 503]  # Allow OpenRouter failures

    # 11th request should be rate limited
    response = client.post(
        "/api/translate/urdu",
        json={"chapter_id": "ch11", "content": content, "content_hash": content_hash},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 429
    assert "Retry-After" in response.headers
```

**4.2 GREEN: Implement endpoint** (see Phase 1 design)

**4.3 REFACTOR**: Extract helper functions, improve logging

**Acceptance Criteria**:
- [ ] All integration tests pass
- [ ] JWT authentication enforced
- [ ] Content hash validation works
- [ ] Cache hit/miss logic correct
- [ ] Rate limiting enforced
- [ ] Error responses match spec (401, 429, 503)

**Estimated Time**: 4 hours

---

### Task 5: TranslationHandler Hook

**Files**:
- `frontend/src/components/translation/TranslationHandler.js` (NEW)

**TDD Steps**:

**5.1 RED: Write failing tests**

`frontend/src/components/translation/__tests__/TranslationHandler.test.js`:
```javascript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTranslation } from '../TranslationHandler';
import * as translationApi from '@/services/translationApi';

jest.mock('@/services/translationApi');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user1' }, token: 'test-token' })
}));

test('useTranslation initial state', () => {
  const { result } = renderHook(() => useTranslation('chapter1', 'Hello'));

  expect(result.current.isUrdu).toBe(false);
  expect(result.current.isTranslating).toBe(false);
  expect(result.current.urduContent).toBe(null);
  expect(result.current.currentContent).toBe('Hello');
});

test('translate function calls API and updates state', async () => {
  translationApi.translateToUrdu.mockResolvedValue({
    translated_content: 'ہیلو',
    cached: false
  });

  const { result } = renderHook(() => useTranslation('chapter1', 'Hello'));

  await act(async () => {
    await result.current.translate();
  });

  expect(result.current.isUrdu).toBe(true);
  expect(result.current.urduContent).toBe('ہیلو');
  expect(result.current.currentContent).toBe('ہیلو');
});

test('translate function handles 401 error', async () => {
  translationApi.translateToUrdu.mockRejectedValue({
    response: { status: 401 }
  });

  const { result } = renderHook(() => useTranslation('chapter1', 'Hello'));

  await act(async () => {
    await result.current.translate();
  });

  expect(result.current.error).toContain('Session expired');
});

test('toggleLanguage switches between English and Urdu', async () => {
  translationApi.translateToUrdu.mockResolvedValue({ translated_content: 'ہیلو' });

  const { result } = renderHook(() => useTranslation('chapter1', 'Hello'));

  await act(async () => {
    await result.current.translate();
  });

  expect(result.current.isUrdu).toBe(true);

  act(() => {
    result.current.toggleLanguage();
  });

  expect(result.current.isUrdu).toBe(false);
  expect(result.current.currentContent).toBe('Hello');
});
```

**5.2 GREEN: Implement hook** (see Phase 1 design)

**5.3 REFACTOR**: Extract content hash computation

**Acceptance Criteria**:
- [ ] All unit tests pass
- [ ] Hook manages translation state correctly
- [ ] Error handling works for 401, 429, 503
- [ ] Toggle functionality works without API call

**Estimated Time**: 3 hours

---

### Task 6: Update UrduTranslationButton

**Files**:
- `frontend/src/components/translation/UrduTranslationButton.jsx` (REFACTOR)
- `frontend/src/components/translation/TranslationButton.module.css` (NEW)

**TDD Steps**:

**6.1 RED: Write failing tests**

`frontend/src/components/translation/__tests__/UrduTranslationButton.test.jsx`:
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UrduTranslationButton from '../UrduTranslationButton';
import * as translationApi from '@/services/translationApi';

jest.mock('@/services/translationApi');
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user1' }, token: 'token' })
}));

test('renders translate button', () => {
  render(<UrduTranslationButton chapterId="ch1" content="Hello" />);
  expect(screen.getByText('اردو میں دیکھیں')).toBeInTheDocument();
});

test('shows loading state during translation', async () => {
  translationApi.translateToUrdu.mockImplementation(() =>
    new Promise(resolve => setTimeout(() => resolve({ translated_content: 'ہیلو' }), 100))
  );

  render(<UrduTranslationButton chapterId="ch1" content="Hello" />);

  fireEvent.click(screen.getByText('اردو میں دیکھیں'));

  expect(await screen.findByText('Translating...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('View in English')).toBeInTheDocument();
  });
});

test('displays error message on failure', async () => {
  translationApi.translateToUrdu.mockRejectedValue(new Error('API error'));

  render(<UrduTranslationButton chapterId="ch1" content="Hello" />);

  fireEvent.click(screen.getByText('اردو میں دیکھیں'));

  expect(await screen.findByRole('alert')).toHaveTextContent('Translation failed');
});

test('toggles back to English without API call', async () => {
  translationApi.translateToUrdu.mockResolvedValue({ translated_content: 'ہیلو' });

  render(<UrduTranslationButton chapterId="ch1" content="Hello" />);

  fireEvent.click(screen.getByText('اردو میں دیکھیں'));

  await waitFor(() => {
    expect(screen.getByText('View in English')).toBeInTheDocument();
  });

  translationApi.translateToUrdu.mockClear();

  fireEvent.click(screen.getByText('View in English'));

  expect(screen.getByText('اردو میں دیکھیں')).toBeInTheDocument();
  expect(translationApi.translateToUrdu).not.toHaveBeenCalled();
});
```

**6.2 GREEN: Refactor component** (see Phase 1 design)

**6.3 REFACTOR**: Add CSS styling, improve accessibility

`frontend/src/components/translation/TranslationButton.module.css`:
```css
.translationContainer {
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.translateButton {
  padding: 0.5rem 1rem;
  background-color: var(--ifm-color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.translateButton:hover:not(:disabled) {
  background-color: var(--ifm-color-primary-dark);
}

.translateButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error {
  color: var(--ifm-color-danger);
  font-size: 0.875rem;
  padding: 0.5rem;
  background-color: var(--ifm-color-danger-lightest);
  border-radius: 4px;
}

.indicator {
  font-size: 0.875rem;
  color: var(--ifm-color-success);
}
```

**Acceptance Criteria**:
- [ ] All component tests pass
- [ ] Button states render correctly (idle, loading, error)
- [ ] Accessibility: keyboard navigation, ARIA labels, screen reader support
- [ ] CSS: responsive, matches Docusaurus theme

**Estimated Time**: 3 hours

---

### Task 7: API Client Service

**Files**:
- `frontend/src/services/translationApi.js` (NEW)

**TDD Steps**:

**7.1 RED: Write failing tests**

`frontend/src/services/__tests__/translationApi.test.js`:
```javascript
import { translateToUrdu } from '../translationApi';

global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

test('translateToUrdu sends correct request', async () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ translated_content: 'ہیلو', cached: true })
  });

  const result = await translateToUrdu({
    chapter_id: 'ch1',
    content: 'Hello',
    content_hash: 'hash123'
  }, 'test-token');

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/translate/urdu'),
    expect.objectContaining({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: expect.any(String)
    })
  );

  expect(result.translated_content).toBe('ہیلو');
});

test('translateToUrdu throws on HTTP error', async () => {
  fetch.mockResolvedValue({
    ok: false,
    status: 401,
    json: async () => ({ detail: 'Unauthorized' })
  });

  await expect(translateToUrdu({ chapter_id: 'ch1', content: 'test', content_hash: 'hash' }, 'token'))
    .rejects.toThrow('Translation request failed');
});
```

**7.2 GREEN: Implement API client** (see Phase 1 design)

**7.3 REFACTOR**: Add timeout handling, improve error messages

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Correct API endpoint called
- [ ] Authorization header included
- [ ] Error handling robust

**Estimated Time**: 2 hours

---

### Task 8: Docusaurus Theme Swizzling

**Files**:
- `frontend/src/theme/DocItem/Layout/index.js` (NEW)

**Steps**:

**8.1 Swizzle theme component**

```bash
cd frontend
npm run swizzle @docusaurus/theme-classic DocItem/Layout -- --wrap
```

**8.2 Inject TranslateButton**

Edit generated file to inject `UrduTranslationButton` when `chapter_id` exists (see Phase 1 design)

**8.3 Manual Testing**

1. Start dev server: `npm run start`
2. Navigate to chapter with `chapter_id: "intro-to-ros2"` in frontmatter
3. Verify button appears at top of content
4. Verify button does NOT appear on pages without `chapter_id`

**Acceptance Criteria**:
- [ ] Button appears on all chapters with `chapter_id`
- [ ] Button does NOT appear on non-chapter pages (blog, docs home)
- [ ] Hot reload works during development
- [ ] Production build succeeds

**Estimated Time**: 2 hours

---

### Task 9: End-to-End Testing

**Files**:
- `backend/tests/e2e/test_translation_flow.py` (NEW)
- `frontend/tests/e2e/translation-flow.spec.js` (NEW)

**9.1 Backend E2E Test**

`backend/tests/e2e/test_translation_flow.py`:
```python
import pytest
from fastapi.testclient import TestClient
import hashlib

def test_full_translation_flow(client: TestClient, test_user, test_token):
    """Test complete translation flow: auth → cache miss → cache hit"""

    # 1. Login
    login_response = client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "password123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["token"]

    # 2. First translation (cache miss)
    content = "This is a test chapter about ROS2 robotics."
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    translate_response = client.post(
        "/api/translate/urdu",
        json={
            "chapter_id": "test-chapter",
            "content": content,
            "content_hash": content_hash
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert translate_response.status_code == 200
    data = translate_response.json()
    assert data["cached"] == False
    assert "ROS2" in data["translated_content"]  # Technical term preserved
    translated = data["translated_content"]

    # 3. Second translation (cache hit)
    translate_response_2 = client.post(
        "/api/translate/urdu",
        json={
            "chapter_id": "test-chapter",
            "content": content,
            "content_hash": content_hash
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert translate_response_2.status_code == 200
    data_2 = translate_response_2.json()
    assert data_2["cached"] == True
    assert data_2["translated_content"] == translated  # Same translation
```

**9.2 Frontend E2E Test (Playwright)**

`frontend/tests/e2e/translation-flow.spec.js`:
```javascript
import { test, expect } from '@playwright/test';

test.describe('Translation Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('translate chapter to Urdu and back', async ({ page }) => {
    // Navigate to chapter
    await page.goto('/docs/intro-to-ros2');

    // Verify English content
    await expect(page.locator('h1')).toContainText('Introduction to ROS2');

    // Click translate button
    await page.click('text=اردو میں دیکھیں');

    // Wait for translation (max 15 seconds)
    await page.waitForSelector('text=View in English', { timeout: 15000 });

    // Verify Urdu content appears
    const heading = await page.locator('h1').textContent();
    expect(heading).toContain('ROS2');  // Technical term preserved
    expect(heading).toMatch(/[\u0600-\u06FF]/);  // Contains Urdu characters

    // Toggle back to English
    await page.click('text=View in English');

    // Verify English content restored
    await expect(page.locator('h1')).toContainText('Introduction to ROS2');
  });

  test('handles unauthenticated user gracefully', async ({ page }) => {
    // Logout
    await page.goto('/logout');

    // Navigate to chapter
    await page.goto('/docs/intro-to-ros2');

    // Click translate button (should show error)
    await page.click('text=اردو میں دیکھیں');

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText('login');
  });

  test('second translation loads from cache quickly', async ({ page }) => {
    await page.goto('/docs/intro-to-ros2');

    // First translation (cache miss)
    const start1 = Date.now();
    await page.click('text=اردو میں دیکھیں');
    await page.waitForSelector('text=View in English', { timeout: 15000 });
    const duration1 = Date.now() - start1;

    // Toggle back
    await page.click('text=View in English');

    // Second translation (cache hit - should be < 2s)
    const start2 = Date.now();
    await page.click('text=اردو میں دیکھیں');
    await page.waitForSelector('text=View in English', { timeout: 3000 });
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(2000);  // Cache hit < 2s
    expect(duration2).toBeLessThan(duration1 / 2);  // Significantly faster
  });
});
```

**Acceptance Criteria**:
- [ ] All E2E tests pass
- [ ] Full user flow works (login → translate → toggle → logout)
- [ ] Cache performance validated (< 2s for cache hit)
- [ ] Error handling tested (unauthenticated user)

**Estimated Time**: 4 hours

---

## Phase 3: Testing Strategy

**Goal**: Comprehensive test coverage across all layers (unit, integration, E2E).

### Unit Tests

**Backend Unit Tests** (Target: >90% coverage)

| File | Test Cases | Priority |
|------|------------|----------|
| `translation_service.py` | OpenRouter API calls, retry logic, system prompt | P1 |
| `rate_limiter.py` | Sliding window, per-user limits, reset | P1 |
| `translation.py` (model) | Model instantiation, constraints, validation | P2 |

**Frontend Unit Tests** (Target: >85% coverage)

| Component | Test Cases | Priority |
|-----------|------------|----------|
| `TranslationHandler.js` | State management, API calls, error handling | P1 |
| `UrduTranslationButton.jsx` | Rendering, loading states, accessibility | P1 |
| `translationApi.js` | Fetch calls, error handling | P2 |

**Test Commands**:
```bash
# Backend
cd backend
pytest tests/unit -v --cov=backend --cov-report=term-missing

# Frontend
cd frontend
npm test -- --coverage
```

### Integration Tests

**Backend Integration Tests** (Target: >80% coverage)

| Feature | Test Scenarios | Priority |
|---------|---------------|----------|
| `/translate/urdu` endpoint | Auth, cache hit/miss, rate limiting, errors | P1 |
| Database caching | Insert, query, unique constraints | P1 |
| OpenRouter integration | Real API calls (dev env), mocked (CI) | P2 |

**Test Fixtures**:
```python
# backend/tests/conftest.py
@pytest.fixture
def test_user(db_session):
    from backend.models.user import User
    user = User(id="test-user-123", email="test@example.com", ...)
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def test_token(test_user):
    from backend.auth.jwt_utils import create_access_token
    return create_access_token({"sub": test_user.id})

@pytest.fixture
def mock_openrouter(monkeypatch):
    def mock_translate(text):
        return f"[MOCKED URDU: {text}]"
    monkeypatch.setattr('backend.services.translation_service.TranslationService.translate_to_urdu', mock_translate)
```

**Test Commands**:
```bash
cd backend
pytest tests/integration -v --cov=backend
```

### End-to-End Tests

**Playwright E2E Tests** (Critical user paths)

| User Flow | Test Scenarios | Priority |
|-----------|---------------|----------|
| Translation flow | Login → translate → toggle → logout | P1 |
| Cache performance | First translation (10s) vs second (<2s) | P1 |
| Error handling | Unauthenticated, rate limited, API failure | P2 |
| Accessibility | Keyboard navigation, screen reader | P2 |

**Test Commands**:
```bash
cd frontend
npx playwright test tests/e2e/translation-flow.spec.js
```

### Performance Tests

**Load Testing** (Target: 100 concurrent users)

`backend/tests/performance/test_translation_load.py`:
```python
import asyncio
import aiohttp
import time

async def translate_request(session, token, chapter_id):
    async with session.post(
        'http://localhost:8001/api/translate/urdu',
        json={"chapter_id": chapter_id, "content": "test", "content_hash": "hash"},
        headers={"Authorization": f"Bearer {token}"}
    ) as response:
        return response.status, await response.json()

async def load_test(num_users=100):
    async with aiohttp.ClientSession() as session:
        start = time.time()
        tasks = [translate_request(session, f"token-{i}", f"ch-{i}") for i in range(num_users)]
        results = await asyncio.gather(*tasks)
        duration = time.time() - start

        success_count = sum(1 for status, _ in results if status == 200)
        print(f"Completed {num_users} requests in {duration:.2f}s")
        print(f"Success rate: {success_count}/{num_users} ({success_count/num_users*100:.1f}%)")

        # Assertions
        assert success_count >= num_users * 0.95  # 95% success rate
        assert duration < 30  # All requests complete within 30s

if __name__ == "__main__":
    asyncio.run(load_test(100))
```

**Test Commands**:
```bash
python backend/tests/performance/test_translation_load.py
```

### Security Tests

**Penetration Testing Checklist**

| Attack Vector | Test Method | Expected Result |
|---------------|-------------|-----------------|
| XSS injection | Submit `<script>alert('xss')</script>` in content | Content escaped, no script execution |
| SQL injection | Submit `'; DROP TABLE translations; --` in chapter_id | Parameterized query prevents injection |
| JWT tampering | Modify token payload and submit | 401 Unauthorized |
| Cache poisoning | Submit mismatched content_hash | 400 Bad Request |
| Rate limit bypass | Send 20 requests with different IPs | 429 after 10 requests |

**Test Script**:
```python
# backend/tests/security/test_vulnerabilities.py
def test_xss_prevention(client, test_token):
    """Test XSS injection is prevented"""
    malicious_content = '<script>alert("xss")</script>'
    content_hash = hashlib.sha256(malicious_content.encode()).hexdigest()

    response = client.post(
        "/api/translate/urdu",
        json={"chapter_id": "xss-test", "content": malicious_content, "content_hash": content_hash},
        headers={"Authorization": f"Bearer {test_token}"}
    )

    translated = response.json()["translated_content"]
    assert '<script>' not in translated  # HTML tags escaped
    assert '&lt;script&gt;' in translated or '<' not in translated
```

---

## Phase 4: Deployment Plan

**Goal**: Safe, incremental rollout with monitoring and rollback capability.

### Environment Setup

**Staging Environment**

1. **Create staging Neon database**:
   ```bash
   # Create new branch in Neon dashboard: "staging-006-urdu-translation"
   # Copy connection string to backend/.env.staging
   ```

2. **Deploy backend to staging**:
   ```bash
   cd backend
   # Update .env.staging
   export NEON_POSTGRES_URL="<staging-connection-string>"
   export OPENROUTER_API_KEY="<staging-api-key>"
   export JWT_SECRET_KEY="<shared-with-feature-005>"

   # Run migrations
   alembic upgrade head

   # Start backend
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```

3. **Deploy frontend to staging**:
   ```bash
   cd frontend
   # Update .env.staging
   export REACT_APP_API_BASE_URL="<staging-backend-url>"

   # Build and deploy
   npm run build
   # Deploy to staging server (e.g., Vercel preview)
   ```

**Production Environment**

1. **Create production database migration**:
   ```bash
   # In Neon dashboard, apply migration to main branch
   # OR use Alembic in production
   alembic upgrade head
   ```

2. **Set production environment variables**:
   ```bash
   # Backend .env.production
   NEON_POSTGRES_URL="<prod-connection-string>"
   OPENROUTER_API_KEY="<prod-api-key>"
   JWT_SECRET_KEY="<same-as-feature-005>"

   # Frontend .env.production
   REACT_APP_API_BASE_URL="https://api.yourdomain.com"
   ```

### Rollout Strategy

**Phase 4.1: Staging Deployment (Week 1)**

**Day 1-2: Deploy to Staging**
- [ ] Deploy backend to staging server
- [ ] Run all migrations
- [ ] Deploy frontend to staging
- [ ] Verify feature flag: `ENABLE_URDU_TRANSLATION=false` (disabled by default)

**Day 3-4: QA Testing**
- [ ] Manual testing: login → translate → toggle → logout
- [ ] Run automated test suite (unit, integration, E2E)
- [ ] Performance testing: 100 concurrent users
- [ ] Security testing: penetration tests
- [ ] Accessibility testing: WCAG 2.1 AA compliance

**Day 5: Beta Testing**
- [ ] Enable feature flag for 5 internal testers
- [ ] Collect feedback on translation quality
- [ ] Monitor metrics: latency, cache hit rate, error rate
- [ ] Fix critical bugs (if any)

**Phase 4.2: Production Rollout (Week 2)**

**10% Rollout (Day 1-2)**
- [ ] Deploy backend to production (migrations)
- [ ] Deploy frontend to production
- [ ] Enable feature flag for 10% of users (random sampling)
- [ ] Monitor metrics:
  - Translation request rate
  - Cache hit rate (target: >50% by day 2)
  - Error rate (target: <1%)
  - p95 latency (target: <10s for LLM, <1s for cache)

**50% Rollout (Day 3-4)**
- [ ] Increase feature flag to 50% of users
- [ ] Monitor for 48 hours
- [ ] Verify cache hit rate improving (target: >70%)
- [ ] Check database storage growth (estimate: 1MB/100 translations)

**100% Rollout (Day 5)**
- [ ] Enable feature flag for all users
- [ ] Send announcement email/notification
- [ ] Monitor for 24 hours
- [ ] Document lessons learned

### Feature Flag Implementation

**Backend Feature Flag** (`backend/config/feature_flags.py`):
```python
import os

class FeatureFlags:
    ENABLE_URDU_TRANSLATION = os.getenv("ENABLE_URDU_TRANSLATION", "false").lower() == "true"
    TRANSLATION_ROLLOUT_PERCENTAGE = int(os.getenv("TRANSLATION_ROLLOUT_PERCENTAGE", "0"))

# In translation endpoint
if not FeatureFlags.ENABLE_URDU_TRANSLATION:
    raise HTTPException(status_code=503, detail="Translation feature is currently disabled")

# Optional: percentage-based rollout
import hashlib
user_hash = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
if user_hash % 100 >= FeatureFlags.TRANSLATION_ROLLOUT_PERCENTAGE:
    raise HTTPException(status_code=503, detail="Translation feature not yet available for your account")
```

**Frontend Feature Flag** (`frontend/src/config/featureFlags.js`):
```javascript
export const featureFlags = {
  enableUrduTranslation: process.env.REACT_APP_ENABLE_URDU_TRANSLATION === 'true'
};

// In TranslateButton component
if (!featureFlags.enableUrduTranslation) {
  return null;  // Don't render button
}
```

### Rollback Procedures

**Immediate Rollback Triggers**:
- Error rate > 5% for 5 minutes
- p95 latency > 30 seconds
- Database connection failures
- Critical security vulnerability discovered

**Rollback Steps**:

**Backend Rollback**:
```bash
# 1. Disable feature flag (instant)
export ENABLE_URDU_TRANSLATION=false
# Restart backend service

# 2. Revert code (if needed)
git revert <commit-hash>
git push origin main

# 3. Rollback database (only if schema changes cause issues)
alembic downgrade -1  # Reverts last migration
```

**Frontend Rollback**:
```bash
# 1. Disable feature flag
export REACT_APP_ENABLE_URDU_TRANSLATION=false

# 2. Rebuild and redeploy
npm run build
# Deploy to production

# 3. Revert code (if needed)
git revert <commit-hash>
npm run build && deploy
```

**Data Preservation**:
- `translations` table is NOT dropped during rollback
- Cached translations remain for future rollout
- No data loss for users

### Monitoring & Alerts

**Key Metrics**

| Metric | Target | Alert Threshold | Tool |
|--------|--------|----------------|------|
| Translation request rate | - | Spike >200% | CloudWatch/Datadog |
| Cache hit rate | >80% | <50% after 7 days | Custom dashboard |
| Error rate | <1% | >5% for 5 min | Sentry |
| p95 latency (LLM) | <10s | >15s for 5 min | APM |
| p95 latency (cache) | <1s | >2s for 5 min | APM |
| Database storage | <100MB/week | >500MB/week | Neon dashboard |
| OpenRouter API cost | <$50/month | >$100/month | OpenRouter dashboard |

**Logging Configuration**

`backend/main.py`:
```python
import logging
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger()

# Log translation requests
logger.info(
    "translation_request",
    user_id=user_id,
    chapter_id=chapter_id,
    cached=cached,
    latency_ms=latency
)
```

**Dashboard Queries** (Example: CloudWatch Insights)
```sql
# Average translation latency
fields @timestamp, latency_ms
| filter event = "translation_request"
| stats avg(latency_ms) as avg_latency by bin(5m)

# Cache hit rate
fields @timestamp, cached
| filter event = "translation_request"
| stats sum(cached) / count(*) * 100 as cache_hit_rate by bin(1h)

# Error rate
fields @timestamp, error
| filter event = "translation_error"
| stats count(*) as error_count by bin(5m)
```

**Alert Rules**:
```yaml
# Example: Prometheus/Alertmanager
groups:
  - name: translation_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(translation_errors_total[5m]) > 0.05
        annotations:
          summary: "Translation error rate > 5%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, translation_latency_seconds) > 15
        annotations:
          summary: "Translation p95 latency > 15s"

      - alert: LowCacheHitRate
        expr: translation_cache_hit_rate < 0.5
        for: 24h
        annotations:
          summary: "Cache hit rate < 50% for 24 hours"
```

---

## Appendix A: Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| OpenRouter API downtime | Medium | High | Implement retry logic, show graceful error message |
| Translation quality issues | Medium | High | Beta test with native Urdu speakers, refine system prompt |
| Cache storage exceeds limits | Low | Medium | Monitor growth, implement cache eviction policy (LRU) |
| Database migration failures | Low | High | Test migrations in staging, have rollback plan |
| Content hash collisions | Very Low | High | Use SHA-256 (collision probability negligible) |
| JWT authentication conflicts | Low | Medium | Coordinate with Feature 005 team, shared secret |

### Performance Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| Slow OpenRouter API calls | Medium | High | Set timeout (30s), cache aggressively, show progress indicator |
| Database query slowness | Low | Medium | Optimize indexes, use connection pooling |
| Frontend bundle size increase | Low | Low | Code splitting, lazy load translation components |
| Concurrent request bottleneck | Medium | High | Load test with 100 users, optimize rate limiting logic |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| XSS via translated content | Medium | High | Sanitize LLM output, use React's built-in escaping |
| Cache poisoning attack | Low | High | Validate content_hash on backend (implemented) |
| JWT token theft | Low | High | Use HTTPS only, secure cookie storage, short expiry |
| Rate limit bypass | Medium | Medium | Implement IP-based rate limiting (future) |
| SQL injection | Very Low | High | Use SQLAlchemy ORM (parameterized queries) |

### Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| High OpenRouter API costs | Medium | Medium | Monitor usage daily, set budget alerts, optimize prompts |
| Database storage costs | Low | Low | Estimate: 100MB/1000 translations (~$1/month Neon) |
| Translation quality complaints | Medium | Medium | Provide feedback mechanism, iteratively improve prompts |
| Feature flag misconfiguration | Low | High | Document flag values clearly, automate deployments |

---

## Appendix B: Complexity Justifications

**No complexity violations identified.** This feature aligns with constitution principles:
- Single responsibility per component
- Minimal abstractions (no repository pattern needed)
- Direct database access via SQLAlchemy ORM (simpler than separate data layer)
- In-memory rate limiting (sufficient for MVP, Redis optional for scale)

---

## Appendix C: Open Questions (Post-Research)

**Resolved Questions**:
- ✅ OpenRouter API integration: Use OpenAI SDK with `base_url` override
- ✅ JWT authentication: Reuse Feature 005's `verify_jwt_token()` dependency
- ✅ Docusaurus swizzling: Wrap `DocItem/Layout` component

**Remaining Questions**:
- **Q1**: Should we translate code comments within code blocks? → **Decision**: No, keep all code in English (spec guideline)
- **Q2**: Multi-instance rate limiting strategy? → **Decision**: Use in-memory for MVP, migrate to Redis if scaling to multiple backend instances
- **Q3**: Translation versioning (track changes to system prompt)? → **Decision**: Not in v1, add `prompt_version` column in v2

---

## Summary: Implementation Plan Complete

This implementation plan provides a comprehensive roadmap for Feature 006: Dynamic Urdu Translation, covering:

✅ **Technical Context**: All dependencies, technologies, and constraints documented
✅ **Constitution Check**: Verified alignment with all 6 core principles
✅ **Phase 0 (Research)**: 6 research areas with specific tasks and success criteria
✅ **Phase 1 (Design)**: Detailed component designs, API contracts, data flow diagrams
✅ **Phase 2 (Implementation)**: 9 tasks ordered by dependencies, with TDD steps and acceptance criteria
✅ **Phase 3 (Testing)**: Comprehensive strategy covering unit, integration, E2E, performance, and security tests
✅ **Phase 4 (Deployment)**: Staged rollout (10% → 50% → 100%), feature flags, monitoring, rollback procedures

**Estimated Total Time**: 25 hours (1 sprint)
- Phase 0: 8 hours
- Phase 1: 6 hours
- Phase 2: 25 hours
- Phase 3: 10 hours
- Phase 4: 8 hours

**Next Steps**:
1. Review this plan with stakeholders
2. Execute Phase 0 research → create `research.md`
3. Execute Phase 1 design → create `data-model.md`, `quickstart.md`, `contracts/`
4. Use `/sp.tasks` command to generate detailed task breakdown from this plan
5. Begin TDD implementation (Phase 2)

**Critical Dependencies**:
- Feature 005 (JWT authentication) must be deployed and stable
- OpenRouter API key provisioned
- Neon Postgres database accessible from backend

All architectural decisions are documented, all risks identified, and all test strategies defined. The plan is ready for execution.
