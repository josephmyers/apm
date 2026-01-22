---
trigger: always_on
description: user preferences and project memory
globs: **/*
---

# Project Memory / User Preferences

## Naming Conventions

- **Avoid "mobile"**: Do not use "mobile" in file names/identifiers (e.g., use `ProjectsScreen` not `ProjectsMobile`). Functionality is cross-platform (desktop+web).

## UI / Platform Guidance

- **Responsive naming**: Use generic names (`*Screen`, `*View`, `*Panel`) unless strictly platform-specific.

## Behavioral Rules

- **Explicit Instructions**: Only implement exactly what is requested.
- **No Unsolicited Changes**: Do not refactor, style, or optimize without approval.
- **Ask First**: If in doubt about scope or if a command might be destructive, ask for confirmation.
- Look for opportunites to simplify code and reduce duplication and waste. But do not make those changes without approval. Simply recommend them.
- **Direct Answers**: Answer questions directly before taking actions.
- **Auto-Login**: If forced to authenticate in browser, look for `.env` or ask. Do not commit credentials.
- **Verification Platform**: If the Electron app is running (`npm start` in repo root), ALWAYS use it for verification. NEVER launch a browser if Electron is already active.

## UI Verification Requirements (THIS IS MANDATORY)

- **Mandatory Testing**: When any UI-related changes are made to the renderer (components, routes, hooks that affect UI), you MUST invoke the **UI Tester** skill (`.agent/skills/ui-tester/SKILL.md`) before considering the task complete.
- **Testing Process**:
  1. Implement the requested changes
  2. Use `view_file` to read the UI Tester skill instructions
  3. Follow the skill's methodology to verify changes using MCP tools
  4. If tests FAIL, continue fixing issues and re-testing
  5. Only mark task as complete when verification PASSES
- **Never Skip**: Do not bypass UI testing for "small" changes. Even trivial UI changes must be verified if the Electron app is running.

## Implementation Plans

- **Detailed Code Examples**: Implementation plans MUST include specific code snippets showing proposed changes. Not everything must be shown, but the overall, encapsulating changes must be, to describe intent.
- **Before/After Examples**: When modifying existing code, show both the current state and the proposed change.
- **Complete Context**: Include enough surrounding code to make the intent clear. Plans should be readable and organized for reviewers.
- **Usage Examples**: When changing or adding anything that will be reused, include practical usage examples demonstrating how it will be used in the application.

## Anti-Thrashing Rules

- **Simplification first**: When debugging, prefer removing code over adding more code to fix. But first understand why the problem exists and when it was introduced.
- **3-4 failures = STOP**: Use the thrash detector skill
- **Only for bug fixes**, not feature development

## Usage Policy

- **Update this file**: You MAY update this file to record clarified preferences or workflow agreements.
- **Conflict**: If a direct instruction conflicts with this file, follow the instruction and Amend this file.
