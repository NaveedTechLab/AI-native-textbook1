# Feature Specification: Personalized AI Book Experience

**Feature Branch**: `005-personalized-book-experience`
**Created**: 2025-12-23
**Status**: Draft
**Input**: User description: "Specify the requirements for a 'Personalized AI Book Experience' with strict Backend/Frontend separation. 1. Authentication (Better Auth): Implement Signup/Signin with mandatory user profile data collection. 2. Personalization Trigger (Frontend): Every chapter features a 'Personalize for My Background' button visible only to logged-in users. 3. Personalization Engine (Backend): FastAPI endpoint /personalize that fetches user background and generates personalized content using OpenRouter LLM. 4. Data Storage (Neon): Store user profiles and personalized snippets in Neon Postgres."

## Overview

This feature transforms the static AI textbook into a personalized learning experience by adapting chapter content to each user's unique software and hardware background. Users authenticate, provide their technical background during signup, and can request personalized roadmaps/summaries for any chapter that adapt explanations and examples to their skill level.

## Clarifications

### Session 2025-12-23

- Q: **Content Strategy** - When the button is pressed, should the entire chapter be rewritten by AI, or should a "Personalized Insight" block be injected at the top? → A: **Inject a dynamic "Personalized Roadmap" block at the top of the chapter** (preserves original content, adds personalized value, faster generation, allows users to see both original and personalized guidance)

- Q: **State Management** - Should the personalized version be saved in Neon so that it persists when the user returns to the chapter? → A: **Yes, save in Neon Postgres with (user_id, chapter_id) composite key** (better UX with instant retrieval, reduces API costs, enables caching behavior)

- Q: **Frontend Implementation** - How should the MDX files in `frontend/` detect the active chapter to send the correct ID to the `backend/`? → A: **Use Docusaurus page metadata (frontmatter) with unique `chapter_id` field in each MDX file** (clean, maintainable, follows Docusaurus conventions, no URL parsing needed)

- Q: **Agent Skill** - How will the 'Personalization Agent' handle cases where a user has 'Expert' software but 'Novice' hardware skills? → A: **Generate personalization that addresses both dimensions independently with bridging explanations** (use advanced programming concepts for software, explain hardware from basics, bridge gap by showing how software expertise helps when learning hardware)

## User Scenarios & Testing

### User Story 1 - New User Registration with Background Collection (Priority: P1)

A new learner visits the textbook platform and wants to create an account to access personalized content. During signup, they provide their email, password, software background (e.g., "Intermediate Python, beginner C++"), and hardware background (e.g., "Familiar with Arduino, no robotics experience").

**Why this priority**: Without user registration and background collection, no personalization can occur. This is the foundational requirement that enables all other features.

**Independent Test**: Can be fully tested by completing the signup flow and verifying user profile data is stored in database. Delivers immediate value by allowing users to access the platform with their personalized profile.

**Acceptance Scenarios**:

1. **Given** user is on the signup page, **When** they submit valid email, password, software background, and hardware background, **Then** account is created and they are logged in automatically
2. **Given** user attempts signup, **When** they leave software or hardware background fields empty, **Then** form validation prevents submission with clear error messages
3. **Given** user provides duplicate email, **When** they attempt signup, **Then** system rejects registration with "Email already exists" message
4. **Given** new user completes signup, **When** their profile is created, **Then** background information is stored in Neon Postgres and retrievable

---

### User Story 2 - User Authentication (Signin/Signout) (Priority: P1)

Existing users return to the platform and need to sign in to access their personalized content. They provide their email and password to authenticate.

**Why this priority**: Authentication is required to identify users and retrieve their background profiles for personalization. Critical for security and multi-session usage.

**Independent Test**: Can be tested by signing in with valid credentials, verifying session persistence, and testing signout. Delivers value by enabling secure access to personalized features.

**Acceptance Scenarios**:

1. **Given** user has an existing account, **When** they provide correct email and password, **Then** they are authenticated and redirected to the textbook
2. **Given** user provides incorrect credentials, **When** they attempt signin, **Then** authentication fails with "Invalid email or password" message
3. **Given** user is logged in, **When** they click signout, **Then** session is terminated and they are redirected to signin page
4. **Given** user is authenticated, **When** they close browser and return, **Then** session persists and they remain logged in (session duration: 7 days)

---

### User Story 3 - Request Chapter Personalization (Priority: P1)

A logged-in user is reading a chapter about "Humanoid Robot Control Systems" and clicks the "Personalize for My Background" button at the top. The system generates a customized roadmap showing how to understand this chapter based on their specific software/hardware skills, with examples tailored to their experience level.

**Why this priority**: This is the core value proposition - delivering personalized learning content. Without this, the feature provides no differentiation from a static textbook.

**Independent Test**: Can be tested by clicking the personalization button on any chapter and verifying customized content is generated and displayed. Delivers immediate value by adapting complex content to user's skill level.

**Acceptance Scenarios**:

1. **Given** logged-in user is viewing a chapter, **When** they click "Personalize for My Background", **Then** system generates and displays a personalized roadmap within 5 seconds
2. **Given** user with "beginner Python" background requests personalization, **When** AI generates content, **Then** roadmap includes Python-specific examples and avoids advanced C++ concepts
3. **Given** user with "no hardware experience" requests personalization, **When** AI generates content, **Then** roadmap starts with fundamental hardware concepts before advanced topics
4. **Given** user requests personalization for Chapter 5, **When** content is generated, **Then** personalized snippet is stored in database linked to user ID and chapter ID
5. **Given** user has previously personalized Chapter 5, **When** they click button again, **Then** system retrieves cached personalization instead of regenerating (unless user explicitly requests refresh)

---

### User Story 4 - Personalization Button Visibility Control (Priority: P2)

Anonymous (non-logged-in) visitors browse the textbook and see chapter content, but the "Personalize for My Background" button is hidden. When they log in, the button becomes visible on all chapter pages.

**Why this priority**: Ensures feature is only available to authenticated users with profiles. Lower priority than core authentication and personalization, but important for user experience and preventing abuse.

**Independent Test**: Can be tested by comparing chapter view for anonymous vs authenticated users. Delivers value by clearly signaling personalization as a logged-in feature.

**Acceptance Scenarios**:

1. **Given** anonymous user views any chapter, **When** page loads, **Then** "Personalize for My Background" button is not visible
2. **Given** logged-in user views any chapter, **When** page loads, **Then** "Personalize for My Background" button is prominently displayed at the top
3. **Given** user is logged in and viewing a chapter, **When** they sign out, **Then** button disappears without page reload

---

### User Story 5 - View Previously Generated Personalizations (Priority: P3)

A logged-in user returns to a chapter they previously personalized and wants to see their custom roadmap again. The system retrieves and displays their stored personalization.

**Why this priority**: Enhances user experience by preserving personalization history, but not critical for MVP. Users can regenerate if needed.

**Independent Test**: Can be tested by personalizing a chapter, navigating away, returning, and verifying cached content displays. Delivers value by avoiding redundant API calls and providing instant access to past personalizations.

**Acceptance Scenarios**:

1. **Given** user previously personalized Chapter 3, **When** they return to Chapter 3, **Then** their stored personalization is displayed automatically
2. **Given** user has 10 stored personalizations, **When** they view their profile, **Then** system displays list of personalized chapters with access to each roadmap
3. **Given** user wants fresh personalization, **When** they click "Regenerate Personalization", **Then** system creates new content and overwrites previous version

---

### Edge Cases

- **What happens when user provides vague or minimal background information** (e.g., just "Python")?
  - System proceeds with personalization but prompts user to provide more details for better results. AI generates content with disclaimer: "Based on limited background information - update your profile for more tailored content."

- **What happens when OpenRouter API fails or times out?**
  - User sees error message: "Personalization temporarily unavailable. Please try again in a moment." System logs error and original request is not lost.

- **What happens when user updates their profile background information?**
  - Previously generated personalizations remain unchanged (historical record). New personalization requests use updated profile. User is notified: "Using updated background profile for this personalization."

- **What happens when chapter content is too long for LLM context window?**
  - System truncates chapter to first 10,000 characters with clear indication in personalized output: "Personalization based on first section of chapter due to length constraints."

- **What happens when user has no software or no hardware background?**
  - System accepts null/empty values for one field (e.g., pure software developer with no hardware experience). Personalization focuses only on the provided background dimension.

- **What happens when multiple users request personalization simultaneously?**
  - Requests are queued and processed sequentially by backend. User sees loading indicator: "Generating your personalized roadmap..." with estimated wait time if queue is long.

- **How does system handle user attempting to access personalization API endpoint directly without authentication?**
  - Backend validates JWT token in request header. Unauthenticated requests return 401 Unauthorized with message: "Authentication required."

## Requirements

### Functional Requirements

#### Authentication & User Management

- **FR-001**: System MUST provide signup endpoint that accepts email, password, software background, and hardware background
- **FR-002**: System MUST validate email format (RFC 5322 compliant) and password strength (minimum 8 characters, 1 uppercase, 1 number, 1 special character)
- **FR-003**: System MUST hash passwords using industry-standard algorithm (bcrypt with salt, cost factor 12) before storage
- **FR-004**: System MUST enforce unique email addresses per account
- **FR-005**: System MUST require both software background and hardware background fields during signup (cannot be empty, minimum 10 characters each)
- **FR-006**: System MUST provide signin endpoint that accepts email and password and returns JWT token on success
- **FR-007**: System MUST implement session management with JWT tokens valid for 7 days
- **FR-008**: System MUST provide signout endpoint that invalidates current session token
- **FR-009**: System MUST store user profiles (email, hashed password, software background, hardware background, creation timestamp) in Neon Postgres

#### Personalization Engine

- **FR-010**: System MUST provide `/personalize` endpoint that accepts authenticated user ID and chapter ID
- **FR-011**: System MUST retrieve user's software and hardware background from Neon Postgres when processing personalization request
- **FR-012**: System MUST extract chapter content (title, headings, first 10,000 characters of body text) for personalization context
- **FR-013**: System MUST send structured prompt to OpenRouter LLM containing: user background (software + hardware), chapter content, request for personalized roadmap that addresses both skill dimensions independently with bridging explanations (e.g., for expert software + novice hardware: use advanced programming concepts while explaining hardware basics, showing how software expertise aids hardware learning)
- **FR-014**: System MUST generate personalized content formatted as structured roadmap with sections: Key Concepts, Prerequisites You Have, Prerequisites to Learn, Step-by-Step Learning Path, Resources Tailored to Your Background
- **FR-015**: System MUST complete personalization generation within 30 seconds or return timeout error
- **FR-016**: System MUST store generated personalization (user ID, chapter ID, generated content, timestamp) in Neon Postgres with composite unique constraint on (user_id, chapter_id)
- **FR-017**: System MUST return generated personalization as JSON response to frontend for injection as dynamic block at top of chapter

#### Frontend Integration

- **FR-018**: Frontend MUST display "Personalize for My Background" button at top of every chapter page (MDX files)
- **FR-018a**: Each MDX chapter file MUST define a unique `chapter_id` in its frontmatter metadata (e.g., `chapter_id: "ch05-robot-control"`) for backend API requests
- **FR-019**: Frontend MUST hide personalization button when user is not authenticated (check JWT token presence)
- **FR-020**: Frontend MUST show personalization button when user is authenticated
- **FR-021**: Frontend MUST display loading spinner and "Generating personalization..." message when button is clicked
- **FR-022**: Frontend MUST inject personalized content as dynamic "Personalized Roadmap" block at the top of chapter (below title, above original content) when received from backend
- **FR-022a**: Frontend MUST extract chapter_id from current page's Docusaurus metadata/frontmatter using useDocusaurusContext() hook to send correct ID to backend
- **FR-023**: Frontend MUST handle error states (API failure, timeout) with user-friendly messages and retry option

#### Data Persistence

- **FR-024**: System MUST store user profiles in `users` table with fields: id (UUID), email (unique), password_hash, software_background (text), hardware_background (text), created_at (timestamp)
- **FR-025**: System MUST store personalizations in `personalizations` table with fields: id (UUID), user_id (foreign key), chapter_id (string), personalized_content (text), created_at (timestamp), updated_at (timestamp)
- **FR-026**: System MUST create indexes on frequently queried fields: users.email, personalizations.user_id, personalizations.chapter_id
- **FR-027**: System MUST implement composite unique constraint on (user_id, chapter_id) in personalizations table to prevent duplicate entries

### Non-Functional Requirements

- **NFR-001**: Authentication endpoints MUST use HTTPS in production to protect credentials in transit
- **NFR-002**: Personalization API MUST handle at least 50 concurrent requests without performance degradation
- **NFR-003**: Database queries MUST complete within 200ms for 95th percentile
- **NFR-004**: Frontend personalization button MUST be styled consistently with existing UI theme
- **NFR-005**: Error messages MUST not expose sensitive information (e.g., "Invalid credentials" instead of "Email not found" or "Wrong password")
- **NFR-006**: System MUST log all authentication attempts (success/failure) with timestamp and IP address for security audit

### Key Entities

- **User**: Represents a registered learner with unique credentials and technical background. Key attributes: email (unique identifier), password (secured), software background (free-text description of programming skills), hardware background (free-text description of electronics/robotics experience), account creation date.

- **Personalization**: Represents a generated custom learning roadmap for a specific user and chapter. Key attributes: associated user, associated chapter identifier, generated content (formatted roadmap), creation timestamp, last update timestamp. Relationships: belongs to one User, references one Chapter (by ID).

- **Chapter**: Represents a textbook chapter (MDX file). Key attributes: unique identifier (`chapter_id` defined in frontmatter metadata, e.g., "ch05-robot-control"), title, content body, headings structure. Note: Chapter entity exists in file system (MDX files), not database. Each chapter MDX file must include `chapter_id` in its frontmatter for personalization tracking.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete signup with background information in under 3 minutes
- **SC-002**: Users can successfully sign in and access personalized features in under 30 seconds
- **SC-003**: Personalized chapter roadmaps are generated and displayed within 10 seconds of button click for 90% of requests
- **SC-004**: System supports at least 100 concurrent users requesting personalizations without timeout errors
- **SC-005**: 80% of users who create accounts request at least one chapter personalization within their first session
- **SC-006**: Personalized content is demonstrably different based on user background (verified through sample testing with "beginner" vs "advanced" profiles)
- **SC-007**: Zero exposed user credentials or plain-text passwords in database or logs
- **SC-008**: Personalization button visibility correctly matches authentication state for 100% of page loads

### Assumptions

- **Assumption 1**: Users can accurately self-assess their software and hardware backgrounds in free-text format (no predefined skill levels like "beginner/intermediate/advanced")
- **Assumption 2**: OpenRouter LLM API will be available with 99% uptime and sufficient quota for expected request volume
- **Assumption 3**: Neon Postgres free tier has sufficient storage for user profiles and personalizations (estimated 100 users × 10 personalizations × 2KB per personalization = ~2MB initial storage)
- **Assumption 4**: Chapter content is accessible to backend as plain text or markdown for LLM processing (not rendered HTML)
- **Assumption 5**: Users will primarily access platform from desktop browsers (mobile responsiveness for personalization modal is secondary)
- **Assumption 6**: JWT tokens stored in browser localStorage are acceptable security model for this educational platform (not handling payment or sensitive personal data)
- **Assumption 7**: Single personalization per user per chapter (overwrite previous if regenerated) is sufficient - full history not required for MVP

## Constraints

- **Authentication library**: Must use Better Auth or compatible library that integrates with Neon Postgres
- **Backend framework**: FastAPI (Python) as specified in existing architecture
- **Database**: Neon Postgres (cloud-hosted PostgreSQL) for all persistent data
- **LLM provider**: OpenRouter API with OpenAI-compatible interface
- **Frontend framework**: Docusaurus with MDX for chapter content
- **Strict separation**: Backend exposes REST API endpoints, frontend makes HTTP requests - no direct database access from frontend
- **Chapter format**: Existing MDX files - personalization button must be injectable without rewriting all chapters individually

## Out of Scope

- **User profile editing**: Updating software/hardware background after signup (can be added in future iteration)
- **Social features**: Sharing personalizations with other users, commenting, or community discussions
- **Admin dashboard**: Viewing user analytics, managing accounts, or moderating content
- **Payment/subscription**: All features are free for all authenticated users
- **Multi-language support**: Personalization content generated only in English
- **Offline access**: Personalization requires active internet connection to backend API
- **Mobile app**: Native iOS/Android applications (web responsive only)
- **Email verification**: Account activation via email confirmation link (can be added later)
- **Password reset**: Forgot password flow with email recovery (can be added later)
- **Advanced personalization preferences**: Fine-tuning LLM tone, verbosity, or format preferences
- **Personalization quality ratings**: User feedback mechanism on generated content quality

## Security Considerations

- **Password storage**: Must use bcrypt with salt and cost factor 12 minimum (never store plain text)
- **JWT secrets**: Must be stored in environment variables, never committed to version control
- **SQL injection**: Must use parameterized queries for all database operations
- **XSS protection**: Must sanitize user-provided background text before rendering in UI
- **Rate limiting**: Must implement rate limiting on personalization endpoint (max 10 requests per user per minute) to prevent abuse/cost overruns
- **CORS configuration**: Backend must whitelist only frontend domain for API access
- **Sensitive data exposure**: Never log passwords, JWT tokens, or raw API keys

## Dependencies

- **External services**:
  - Neon Postgres (cloud database)
  - OpenRouter API (LLM inference)
  - Better Auth library (authentication)

- **Internal systems**:
  - Existing Docusaurus frontend codebase
  - Existing FastAPI backend infrastructure
  - Chapter content (MDX files in `docs/` directory)

## Open Questions

[NEEDS CLARIFICATION: Should the system support updating user background profiles after initial signup, or is background information immutable once set?]

**Options**:
- **A**: Background is immutable after signup (simpler MVP, forces careful initial input)
- **B**: Allow editing via profile page (better UX, requires profile edit endpoint and UI)
- **C**: Allow editing but preserve history (complex, enables tracking skill progression over time)

**Recommendation**: Option A for MVP (immutable), add Option B in next iteration.

---

[NEEDS CLARIFICATION: How should the system handle chapters that have been updated after personalization was generated?]

**Options**:
- **A**: Display cached personalization regardless of chapter updates (simple, may show outdated info)
- **B**: Detect chapter content changes and mark cached personalizations as "stale" (requires content hashing/versioning)
- **C**: Automatically regenerate personalizations when chapter content changes (expensive, many API calls)

**Recommendation**: Option A for MVP, notify users with small badge "Personalized on [date]" to indicate age.

---

[NEEDS CLARIFICATION: Should personalizations be visible to other users (public) or private to the requesting user only?]

**Options**:
- **A**: Private - only the user who generated can view (more secure, personalized to individual)
- **B**: Public - anyone can see any personalization (enables community learning, but less personal)
- **C**: Opt-in sharing - user can choose to make specific personalizations public (flexible, requires sharing UI)

**Recommendation**: Option A for MVP (private) to emphasize personalized experience.
