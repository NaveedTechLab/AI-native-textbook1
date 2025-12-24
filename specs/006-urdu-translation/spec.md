# Feature Specification: Dynamic Urdu Translation

**Feature Number:** 006
**Feature Name:** urdu-translation
**Status:** Draft
**Created:** 2025-12-24
**Last Updated:** 2025-12-24
**Owner:** Development Team
**Stakeholders:** Content Team, Users, Education Team

---

## 0. Success Evals (Defined First)

### User Outcome Evals (Pass/Fail)
- ✅ **95% of logged-in users** can successfully translate a chapter to Urdu within 10 seconds
- ✅ **90% of users** who translate once use the feature again within 7 days (retention)
- ✅ **Translation quality rated ≥ 4/5** by 20 native Urdu-speaking technical reviewers
- ✅ **0 security vulnerabilities** (XSS, injection, auth bypass) found in penetration testing
- ✅ **100% of chapters** with `chapter_id` frontmatter support translation

### System Performance Evals (Measurable)
- **Cache hit rate**: ≥ 80% after 1 week of production usage
- **Translation latency (p95)**: < 10 seconds for LLM call, < 1 second for cache hit
- **Concurrent capacity**: 100 simultaneous translation requests without degradation (p95 < 15s)
- **Error rate**: < 1% of translation requests fail
- **Database query time**: < 200ms (p95)

### Cost Optimization Evals
- **Average cost per translation**: < $0.001 (using free-tier LLM)
- **Monthly API costs**: < $50 with 1000 active users
- **Cost per user**: < $0.05/month
- **Cache effectiveness**: > 80% cache hit rate reduces API calls by 5x

### Translation Quality Evals
- **Technical accuracy**: 95%+ (verified by domain experts)
- **Grammar correctness**: 90%+ (proper Urdu grammar rules)
- **Readability score**: 4/5 average rating by native speakers
- **Terminology consistency**: 100% of technical terms follow guidelines
- **Formatting preservation**: 100% (markdown, code blocks, LaTeX)

### Integration Evals
- **Authentication**: 100% of unauthenticated attempts blocked
- **Feature 005 compatibility**: JWT authentication works seamlessly
- **Markdown rendering**: 100% of formatted elements preserved
- **Toggle functionality**: < 100ms switch between languages

---

## 1. Overview

### 1.1 Purpose
Enable logged-in users to dynamically translate chapter content from English to Urdu with a single click, providing accessible education for Urdu-speaking audiences while maintaining technical accuracy and context.

### 1.2 Background
The AI Textbook Assistant currently serves content exclusively in English. To expand accessibility to Urdu-speaking users (particularly in Pakistan and India where Urdu is widely spoken), we need a translation feature that:
- Preserves technical terminology and context
- Maintains code examples and formatting
- Provides instant translation without page reload
- Optimizes API costs through intelligent caching

### 1.3 Scope

**In Scope:**
- Custom React TranslateButton component for MDX chapters
- Authentication-gated translation feature (logged-in users only)
- Backend `/translate/urdu` API endpoint
- OpenRouter LLM integration for high-quality technical translation
- Neon Postgres caching for translated content
- Toggle between English/Urdu views
- Translation state persistence during session

**Out of Scope:**
- Translation of UI elements (navigation, buttons, etc.)
- Support for languages other than Urdu (future feature)
- Offline translation
- User-editable translations
- Translation of code comments
- PDF export of translated content

### 1.4 Dependencies

**External:**
- OpenRouter API (LLM provider)
- Neon Postgres (translation cache)
- Docusaurus MDX (chapter rendering)

**Internal:**
- Feature 005 (Personalized Book Experience) - shares JWT authentication infrastructure
- Existing JWT Authentication (`backend/auth/jwt_utils.py`)
- Existing FastAPI backend
- Existing Docusaurus frontend

### 1.4.1 Feature 005 Integration Points

**Required Authentication APIs** (from Feature 005):
- `POST /api/auth/login` - Returns JWT token
- `GET /api/auth/profile` - Validates JWT, returns user data
- JWT secret: `JWT_SECRET` environment variable
- Session management: 7-day token expiry

**Shared Infrastructure**:
- Neon Postgres database (users table with UUID primary key)
- JWT token format: HS256 signing algorithm
- Authentication middleware: `verify_jwt_token()` dependency

---

## 2. User Stories

### P1 (Critical - MVP)

**US-001: View Chapter in Urdu**
- **As a** logged-in Urdu-speaking user
- **I want to** click a "Translate to Urdu" button on any chapter
- **So that** I can read technical content in my native language
- **Acceptance Criteria:**
  - Button visible at top of every chapter page
  - Button only functional for authenticated users
  - Translation completes within 10 seconds
  - Translated content maintains original formatting
  - Technical terms preserved or transliterated appropriately

**US-002: Toggle Back to English**
- **As a** user viewing Urdu translation
- **I want to** click "View in English" to return to original
- **So that** I can compare translations or reference original terminology
- **Acceptance Criteria:**
  - Toggle button changes label dynamically
  - Switch happens instantly (no API call needed)
  - Original content exactly matches pre-translation state
  - User preference persists during session

**US-003: Cached Translation Loading**
- **As a** user revisiting a previously translated chapter
- **I want** instant loading from cache
- **So that** I don't waste time waiting for re-translation
- **Acceptance Criteria:**
  - Cache hit loads in < 1 second
  - Cache keyed by (chapter_id, content_hash)
  - Cache invalidation on chapter content updates

### P2 (Important - Post-MVP)

**US-004: Translation Progress Indicator**
- **As a** user waiting for translation
- **I want to** see a progress indicator
- **So that** I know the system is working
- **Acceptance Criteria:**
  - Loading spinner appears immediately on click
  - Estimated time displayed (if > 5 seconds)
  - Error message if translation fails

**US-005: Authentication Prompt**
- **As an** unauthenticated user
- **I want to** see a login prompt when clicking translate
- **So that** I understand I need to sign up for this feature
- **Acceptance Criteria:**
  - Button visible but disabled for non-authenticated users
  - Tooltip explains "Login required for translations"
  - Click redirects to login page

### P3 (Nice to Have)

**US-006: Translation Quality Feedback**
- **As a** user reading translated content
- **I want to** report translation issues
- **So that** content quality improves over time
- **Acceptance Criteria:**
  - "Report Issue" button on translated view
  - Simple form with issue description
  - Feedback stored for review

---

## 3. Functional Requirements

### 3.1 Frontend (Docusaurus + React)

**FR-001: TranslateButton Component**
- Custom React component rendered at top of every MDX chapter
- Props: `chapter_id` (from frontmatter), `user_id` (from auth context)
- Three states: "Translate to Urdu" | "Translating..." | "View in English"
- Component location: `frontend/src/components/translation/TranslateButton.jsx`

**FR-002: Authentication Integration**
- Use JWT authentication context to check authentication status
- Extract user_id from JWT token via API call to `/api/auth/profile`
- Button disabled if `user_id === null`
- Show tooltip "Login required" on hover when disabled

**FR-003: Chapter Content Extraction**
- Extract full MDX chapter content (excluding frontmatter)
- Preserve markdown formatting, code blocks, and LaTeX
- Send to backend as plain text payload

**FR-004: Translation Display**
- Replace original English content with Urdu translation
- Maintain all formatting (headings, lists, code blocks)
- Code blocks remain in English (syntax unchanged)
- Technical terms handled per backend guidelines

**FR-005: Toggle Functionality**
- State management: `useState` hook for `isUrdu` boolean
- Click handler toggles between English/Urdu view
- No API call needed for toggle (content cached in component state)

**FR-006: Error Handling**
- Display user-friendly error messages
- Fallback to English on translation failure
- Retry mechanism (max 2 retries)

**FR-007: MDX Integration**
- Inject TranslateButton via Docusaurus theme wrapper
- Use `useDoc()` hook to access chapter metadata
- Ensure button appears before main content

### 3.2 Backend (FastAPI)

**FR-008: Translation Endpoint**
- Route: `POST /api/translate/urdu`
- Request body:
  ```json
  {
    "chapter_id": "string",
    "user_id": "string",
    "content": "string",
    "content_hash": "string (SHA-256)"
  }
  ```
- Response body:
  ```json
  {
    "translated_content": "string",
    "cached": boolean,
    "translation_id": "uuid"
  }
  ```

**FR-009: Authentication Verification**
- Validate JWT token from request headers
- Return 401 if token invalid/expired
- Extract `user_id` from token payload

**FR-010: Cache Check**
- **SECURITY**: Validate content hash on backend before cache lookup:
  ```python
  import hashlib
  computed_hash = hashlib.sha256(request.content.encode('utf-8')).hexdigest()
  if computed_hash != request.content_hash:
      raise HTTPException(status_code=400, detail="Content hash mismatch")
  ```
- Query Neon Postgres: `SELECT * FROM translations WHERE chapter_id = ? AND content_hash = ? AND target_language = 'urdu'`
- If cache hit: return immediately (set `cached: true`)
- If cache miss: proceed to LLM translation
- **Rationale**: Prevents cache poisoning attacks where malicious clients send incorrect content_hash

**FR-011: LLM Translation**
- Use OpenRouter API with model: `google/gemini-2.0-flash-exp:free` (fast, high-quality, free tier)
- System prompt (references Section 5.4 guidelines):
  ```
  You are a technical translator specializing in AI, robotics, and computer science education.
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
  - Do not mix English and Urdu in same sentence except for technical terms listed above

  Translate now:
  ```
- Temperature: 0.3 (deterministic but natural)
- Max tokens: 8000
- **Reference**: Full translation guidelines in Section 5.4

**FR-012: Database Caching**
- Table: `translations`
- Schema:
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

**FR-013: Error Handling**
- OpenRouter API failure: Return 503 with retry-after header
- Invalid chapter_id: Return 404
- Rate limiting: Return 429 (max 10 translations per user per hour)
- Database failure: Return 500 with generic error

**FR-014: Logging**
- Log every translation request (user_id, chapter_id, cache_hit, latency)
- Log API failures for monitoring
- Track cost (API calls vs cache hits)

### 3.3 Database (Neon Postgres)

**FR-015: Schema Extension**
- Add `translations` table (see FR-012)
- Add foreign key to `users` table
- Add indexes for performance

**FR-016: Migration**
- Alembic migration script: `006_add_translations_table.py`
- Rollback support

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-001:** Cache hit response time < 1 second (p95)
- **NFR-002:** LLM translation time < 10 seconds (p95)
- **NFR-003:** Database query time < 200ms (p95)

### 4.2 Scalability
- **NFR-004:** Support 100 concurrent translation requests
- **NFR-005:** Cache storage: 100MB per 1000 chapters (estimate)

### 4.3 Security
- **NFR-006:** Validate JWT tokens on every request
- **NFR-007:** Sanitize user input (prevent XSS in translated content)
- **NFR-008:** Rate limiting per user (10 translations/hour)
- **NFR-009:** No PII in logs

### 4.4 Reliability
- **NFR-010:** 99.5% uptime for translation endpoint
- **NFR-011:** Graceful degradation (disable button on backend failure)

### 4.5 Cost Optimization
- **NFR-012:** Cache hit rate target: > 80% after 1 week
- **NFR-013:** Estimated cost: $0.001 per translation (Gemini free tier)

---

## 5. Technical Design

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Docusaurus Frontend                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MDX Chapter (frontmatter: chapter_id)               │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  TranslateButton Component                     │  │  │
│  │  │  - JWT Auth Context (user_id)                 │  │  │
│  │  │  - Extract chapter content                     │  │  │
│  │  │  - Compute SHA-256 hash                        │  │  │
│  │  │  - POST /api/translate/urdu                    │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/translate/urdu                            │  │
│  │  1. Verify JWT token                                 │  │
│  │  2. Check cache (Neon Postgres)                      │  │
│  │  3. If miss: Call OpenRouter                         │  │
│  │  4. Save to cache                                    │  │
│  │  5. Return translated content                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           │                                    │
           │ SQL                                │ HTTPS
           ▼                                    ▼
┌──────────────────────┐          ┌─────────────────────────┐
│   Neon Postgres      │          │   OpenRouter API        │
│   translations table │          │   (Gemini Flash)        │
└──────────────────────┘          └─────────────────────────┘
```

### 5.2 Data Flow

**Translation Request Flow:**
1. User clicks "Translate to Urdu"
2. Frontend extracts chapter content + computes SHA-256 hash
3. Frontend sends POST request with (chapter_id, user_id, content, content_hash)
4. Backend validates JWT token
5. Backend queries cache: `SELECT translated_content WHERE chapter_id=? AND content_hash=?`
6. **Cache Hit:** Return cached translation immediately
7. **Cache Miss:**
   - Call OpenRouter API with system prompt + content
   - Wait for LLM response (streaming not implemented in v1)
   - Save to database: `INSERT INTO translations (...)`
   - Return translated content
8. Frontend replaces English content with Urdu content
9. Toggle button changes to "View in English"

**Toggle Flow:**
1. User clicks "View in English"
2. Frontend toggles `isUrdu` state (no API call)
3. Component re-renders with original content
4. Button changes to "Translate to Urdu"

### 5.3 Component Specifications

**TranslateButton.jsx Structure:**
```jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDoc } from '@docusaurus/theme-common/internal';
import styles from './TranslateButton.module.css';

export default function TranslateButton() {
  const { user } = useAuth();
  const { frontMatter } = useDoc();
  const [isUrdu, setIsUrdu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [urduContent, setUrduContent] = useState(null);
  const [originalContent, setOriginalContent] = useState(null);
  const [error, setError] = useState(null);

  const handleTranslate = async () => {
    // Implementation details in plan.md
  };

  const handleToggle = () => {
    setIsUrdu(!isUrdu);
    // Swap content in DOM
  };

  return (
    <div className={styles.translateContainer}>
      <button
        onClick={isUrdu ? handleToggle : handleTranslate}
        disabled={!user || loading}
        className={styles.translateButton}
      >
        {loading ? 'Translating...' : isUrdu ? 'View in English' : 'Translate to Urdu'}
      </button>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
```

### 5.4 Translation Quality Guidelines

**Technical Term Handling Rules:**

| Category | Rule | Example |
|----------|------|---------|
| **Standard Technical Terms** | Keep in English (no translation) | ROS2, Python, API, HTTP, JSON, ML, AI |
| **Programming Concepts** | Keep in English | function, class, variable, loop, array |
| **Domain Concepts with Urdu Equivalents** | Translate | robot → روبوٹ, computer → کمپیوٹر, network → نیٹ ورک |
| **Ambiguous/New Terms** | Transliterate + English in parentheses | سینسر (Sensor), ایکچویٹر (Actuator) |
| **Code Identifiers** | Never translate | `get_user_data()`, `UserProfile`, `$API_KEY` |

**Formatting Preservation Rules:**

| Element | Preservation Strategy |
|---------|----------------------|
| **Markdown Headings** | Translate text, keep # syntax |
| **Bold/Italic** | Translate text, keep `**` and `_` syntax |
| **Code Blocks** | Keep entirely in English (including comments) |
| **Inline Code** | Keep in English: \`variable_name\` |
| **Links** | Translate link text, keep URL unchanged: `[ترجمہ شدہ متن](https://example.com)` |
| **LaTeX Math** | Keep entirely unchanged: `$E = mc^2$` |
| **Lists** | Translate items, keep `-, *, 1.` syntax |
| **Tables** | Translate cell content, keep markdown table syntax |
| **Images** | Translate alt text, keep src unchanged: `![روبوٹ کی تصویر](robot.png)` |

**Tone and Style:**
- Formal educational tone (not conversational)
- Use standard Urdu grammar rules
- Avoid mixing English and Urdu in same sentence (except for technical terms as defined above)
- Use proper Urdu punctuation (،؟ instead of ,?)

**Example Translation:**

**English:**
```markdown
## Introduction to ROS2

ROS2 (Robot Operating System 2) is a middleware framework for building robot applications. It provides **hardware abstraction**, device drivers, and communication tools.

To install ROS2:
1. Update your system: `sudo apt update`
2. Install ROS2: `sudo apt install ros-humble-desktop`
```

**Urdu:**
```markdown
## ROS2 کا تعارف

ROS2 (Robot Operating System 2) ایک middleware فریم ورک ہے جو روبوٹ ایپلیکیشنز بنانے کے لیے استعمال ہوتا ہے۔ یہ **ہارڈ ویئر abstraction**، device drivers، اور communication ٹولز فراہم کرتا ہے۔

ROS2 انسٹال کرنے کے لیے:
1. اپنے سسٹم کو اپ ڈیٹ کریں: `sudo apt update`
2. ROS2 انسٹال کریں: `sudo apt install ros-humble-desktop`
```

**Backend Endpoint Signature:**
```python
# backend/api/translate.py
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import hashlib

router = APIRouter(prefix="/api/translate", tags=["translation"])

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
    user_id: str = Depends(verify_jwt_token)
):
    # Implementation details in plan.md
    pass
```

---

## 6. Success Criteria

**SC-001:** Users can successfully translate any chapter to Urdu within 10 seconds
**SC-002:** Cache hit rate exceeds 70% within first week of deployment
**SC-003:** Zero security vulnerabilities (XSS, injection, auth bypass)
**SC-004:** Translation quality rated ≥ 4/5 by Urdu-speaking beta testers
**SC-005:** Button renders correctly on all chapters with `chapter_id` in frontmatter
**SC-006:** Backend handles 100 concurrent requests without degradation
**SC-007:** Failed translations fall back gracefully (show error, don't break page)

---

## 7. Edge Cases & Error Handling

**EC-001: Unauthenticated User Clicks Translate**
- Action: Show tooltip "Login required for translations"
- No API call made
- Button remains disabled

**EC-002: OpenRouter API Timeout**
- Action: Retry once after 5 seconds
- If second attempt fails: Show error "Translation service unavailable. Please try again later."
- Log incident for monitoring

**EC-003: Chapter Content Exceeds Token Limit**
- Action: Split content into chunks (max 6000 tokens per chunk)
- Translate chunks sequentially
- Concatenate results
- Note: Implement in v1.1 if needed

**EC-004: Database Write Failure**
- Action: Return translated content to user (don't cache)
- Log error for ops team
- Notify via monitoring alert

**EC-005: Duplicate Translation Request (Race Condition)**
- Action: Use `ON CONFLICT DO NOTHING` in INSERT
- Return existing cached translation
- No duplicate API calls

**EC-006: Chapter Content Updated (Invalidate Cache)**
- Action: Compute new content_hash on frontend
- Cache miss triggers new translation
- Old translation remains in DB (historical record)

**EC-007: User Exceeds Rate Limit**
- Action: Return 429 with message "Translation limit reached. Please try again in {X} minutes."
- Reset counter after 1 hour

**EC-008: Malicious Content Injection**
- Action: Sanitize user input on backend
- Escape HTML entities in translated content
- Use Docusaurus's built-in XSS protection

---

## 8. Testing Strategy

### 8.1 Unit Tests
- TranslateButton component rendering (authenticated/unauthenticated)
- Content hash computation (SHA-256)
- Toggle state management
- Error boundary behavior

### 8.2 Integration Tests
- POST /api/translate/urdu (cache hit/miss)
- JWT validation
- Database caching logic
- OpenRouter API integration

### 8.3 End-to-End Tests
- Full user flow: login → navigate to chapter → translate → toggle → logout
- Cache invalidation on content update
- Concurrent translation requests

### 8.4 Performance Tests
- Load test: 100 concurrent translation requests
- Cache performance: 1000 cached translations lookup time

### 8.5 Security Tests
- JWT token tampering
- XSS injection in translated content
- Rate limiting enforcement

---

## 9. Deployment Plan

### 9.1 Prerequisites
- Feature 005 (Personalized Book Experience) deployed (shares auth infrastructure)
- OpenRouter API key configured in `.env`
- Neon Postgres migrations applied

### 9.2 Rollout Strategy
1. Deploy backend to staging (run migrations)
2. Deploy frontend to staging (feature flag: `ENABLE_URDU_TRANSLATION=false`)
3. QA testing (manual + automated)
4. Enable feature flag for 10% of users (beta)
5. Monitor metrics (cache hit rate, error rate, latency)
6. Full rollout (100% of users)

### 9.3 Rollback Plan
- Set `ENABLE_URDU_TRANSLATION=false` (instant rollback)
- Revert database migrations if needed
- No data loss (translations table isolated)

---

## 10. Monitoring & Metrics

**M-001:** Translation request rate (requests/minute)
**M-002:** Cache hit rate (hits / total requests)
**M-003:** Average translation latency (p50, p95, p99)
**M-004:** Error rate (4xx, 5xx)
**M-005:** OpenRouter API cost ($USD/day)
**M-006:** Database storage growth (MB/day)

**Alerts:**
- Error rate > 5% for 5 minutes
- Translation latency p95 > 15 seconds
- Cache hit rate < 50% (after 1 week)

---

## 11. Future Enhancements

**FE-001:** Support additional languages (Arabic, Hindi, Bengali)
**FE-002:** User-editable translations (community contributions)
**FE-003:** Translation quality voting system
**FE-004:** Offline translation (pre-cache popular chapters)
**FE-005:** PDF export of translated chapters
**FE-006:** Translation of UI elements (i18n)
**FE-007:** Real-time streaming translation (for long chapters)
**FE-008:** Translation comparison view (English + Urdu side-by-side)

---

## 12. Open Questions

**OQ-001:** Should we translate code comments? (Recommendation: No, keep in English)
**OQ-002:** How to handle technical terms without Urdu equivalents? (Recommendation: Transliterate + add English in parentheses)
**OQ-003:** Should translations be user-specific or global? (Current spec: Global, cached per content_hash)
**OQ-004:** Do we need translation versioning? (Recommendation: v1 - no, v2 - yes)

---

## 13. Glossary

- **MDX:** Markdown with JSX support (Docusaurus content format)
- **Content Hash:** SHA-256 hash of chapter content (for cache invalidation)
- **JWT Authentication:** Token-based authentication using HS256 signing (implemented in Feature 005)
- **OpenRouter:** LLM API aggregator (provides access to multiple models)
- **Gemini Flash:** Google's fast, cost-effective LLM model
- **Neon Postgres:** Serverless Postgres database
- **JWT:** JSON Web Token (authentication mechanism)
- **XSS:** Cross-Site Scripting (security vulnerability)
- **Rate Limiting:** Restricting number of requests per user per time period

---

## 14. Architectural Decision: OpenRouter Migration

### Decision Context

The existing codebase has a working translation service (`backend/services/translation_service.py`) that uses Google's Gemini API directly via the `google.generativeai` library. This specification proposes using OpenRouter as the LLM provider.

### Options Considered

**Option A: Replace Existing Service with OpenRouter**
- Migrate all LLM calls to OpenRouter with `base_url` override
- Breaking change: requires updating existing translation calls
- Benefit: Single LLM provider interface across all features

**Option B: Create Feature-Specific OpenRouter Implementation**
- Coexist with existing `translation_service.py`
- Keep Feature 006 isolated from existing translation logic
- Risk: Code duplication, inconsistent API patterns

**Option C: Refactor Existing Service (Recommended)**
- Update `translation_service.py` to use OpenRouter with OpenAI SDK compatibility
- Use adapter pattern: `OpenAI(base_url="https://openrouter.ai/api/v1", api_key=OPENROUTER_KEY)`
- Maintain backward compatibility for existing callers
- Benefits:
  - Consistency across codebase
  - OpenRouter provides model fallback/routing
  - Cost optimization (free tier models available)
  - Future-proof (easy to switch models)

### Decision

**Selected: Option C** - Refactor existing translation service to use OpenRouter

### Implementation Strategy

1. **Update `backend/services/translation_service.py`**:
   ```python
   from openai import OpenAI

   client = OpenAI(
       base_url="https://openrouter.ai/api/v1",
       api_key=os.getenv("OPENROUTER_API_KEY")
   )

   def translate_text(text: str, target_language: str) -> str:
       response = client.chat.completions.create(
           model="google/gemini-2.0-flash-exp:free",
           messages=[
               {"role": "system", "content": TRANSLATION_SYSTEM_PROMPT},
               {"role": "user", "content": f"Translate to {target_language}:\n\n{text}"}
           ]
       )
       return response.choices[0].message.content
   ```

2. **Environment Variables**:
   - Add `OPENROUTER_API_KEY` to `.env`
   - Deprecate `GOOGLE_API_KEY` (migration plan in ADR)

3. **Backward Compatibility**:
   - Existing translation calls continue working unchanged
   - Only internal implementation changes

### Consequences

**Positive:**
- Single LLM provider interface
- Cost savings (free tier models)
- Model flexibility (easy to A/B test)
- Consistent error handling

**Negative:**
- Requires OpenRouter API key provisioning
- One-time migration effort (2-3 hours)
- Existing cached translations remain valid

### Rollout Plan

1. Add OpenRouter API key to staging environment
2. Deploy refactored `translation_service.py` to staging
3. Run regression tests on existing translation features
4. Deploy Feature 006 with OpenRouter backend
5. Monitor for 48 hours, then fully migrate existing features

---

## 15. References

- Feature 005 Specification (Personalized Book Experience)
- Docusaurus MDX Documentation: https://docusaurus.io/docs/markdown-features
- OpenRouter API Documentation: https://openrouter.ai/docs
- OpenAI SDK Documentation: https://platform.openai.com/docs
- JWT Authentication: RFC 7519 (JSON Web Token standard)
- Neon Postgres Documentation: https://neon.tech/docs

---

## 16. Approval

**Spec Author:** AI Development Team
**Reviewed By:** [Pending]
**Approved By:** [Pending]
**Approval Date:** [Pending]

---

**End of Specification**
