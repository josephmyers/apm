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

## Usage Policy
- **Update this file**: You MAY update this file to record clarified preferences or workflow agreements.
- **Conflict**: If a direct instruction conflicts with this file, follow the instruction and Amend this file.
