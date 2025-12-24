---
id: 0002
title: Generate Tasks for Urdu Translation
stage: tasks
date: 2025-12-24
surface: agent
model: claude-sonnet-4-5
feature: 006-urdu-translation
branch: 006-urdu-translation
user: development-team
command: /sp.tasks
labels: ["tasks", "tdd", "user-stories", "backend", "frontend", "database", "testing"]
links:
  spec: specs/006-urdu-translation/spec.md
  ticket: null
  adr: null
  pr: null
files:
 - specs/006-urdu-translation/tasks.md
tests:
 - TDD methodology enforced (53 tasks total, 16 test tasks)
 - All test tasks marked to run FIRST before implementation
---

## Prompt

/sp.tasks Break down the Urdu Translation feature into granular, folder-specific tasks.

[BACKEND TASKS]:
1. [Neon]: Create the `translations` table and set up indexes for fast lookup.
2. [AI Skill]: Write the System Prompt for OpenRouter to ensure accurate Urdu translation of Robotics concepts.
3. [FastAPI]: Implement the `/translate` endpoint with caching logic (Check Neon first -> If not found, call OpenRouter -> Store in Neon -> Return).

[FRONTEND TASKS]:
1. [Component]: Build the `UrduToggleButton` with a loading spinner and error handling.
2. [Auth Integration]: Ensure the button correctly checks for a valid Better Auth session before allowing a request.
3. [RTL Support]: Implement a basic CSS toggle to switch the text container to `direction: rtl` when Urdu is selected.
4. [Deployment]: Update the GitHub Actions workflow to ensure the backend environment variables (OpenRouter Key, Neon URL) are configured for the translation service.

## Response snapshot

Generated 53 tasks across 9 phases, organized by 6 user stories with TDD methodology. MVP identified as US1-US3 (29 tasks, ~40 hours).

## Outcome

- ✅ Impact: Comprehensive 53-task breakdown ready for /sp.implement execution
- 🧪 Tests: 16 test tasks (30%) enforce RED-GREEN-REFACTOR cycle
- 📁 Files: tasks.md with 9 phases, 6 user stories, dependency graph
- 🔁 Next prompts: /sp.implement to begin automated task execution
- 🧠 Reflection: All user-provided folder-specific tasks integrated, CLI-first and documentation lookup principles applied

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): User story organization (PASS), TDD methodology (PASS), CLI-first (PASS), Dependencies (PASS), Checklist format (PASS)
- Prompt variant (if applicable): Standard /sp.tasks with user folder-specific context
- Next experiment (smallest change to try): Execute Phase 1 to validate task clarity
