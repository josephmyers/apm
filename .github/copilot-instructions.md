# Copilot Coding Agent Onboarding Guide

Repository: sillsdev/apm
Description: “Flexible audio-text orality tool.”
Primary Stack: TypeScript (≈75%), JavaScript, HTML, CSS. Desktop application built with Electron + Vite.
Purpose (inferred): A desktop and web application for managing and executing oral Bible translation workflows, including but not limited to internalizing preliminary resources, recording drafts, transcribing drafts, recording back translations of the drafts, reviewing by peers and consultants, and comprehension testing by community members.

> Follow these instructions first. Only fall back to repository-wide searching if something you need is **not** covered. If something appears incorrect, ask a question before proceeding.

---

## Memory File Convention

Path: `.github/.memory.md`

Usage Rules:

1. ALWAYS consult the memory file at the start of any multi-step task and before applying a patch.
2. Treat its preferences as binding unless the user explicitly overrides them in the current conversation.
3. You MAY update `.github/.memory.md` to capture newly clarified preferences or workflow agreements without asking first.
4. Do NOT extrapolate memory entries into unsolicited source code changes (no styling/refactors/perf changes) unless the user explicitly requests them.
5. If a direct instruction conflicts with memory, follow the instruction and then amend memory to reflect the change.

---

## Development Workflow

- **Lint & Format**: Enforced via ESLint & Prettier.
- **Type Check**: Strict TypeScript. Run `npm run typecheck` or `tsc --noEmit`.
- **Tests**: Run `npm test`.
- **Validation**: Ensure lint, format, typecheck, and tests pass before finalizing changes.

## Architecture & Layers

- **Main Process**: `src/main`. Lifecycle, IPC, file system.
- **Preload**: `src/preload`. Secure bridge. Expose minimal surface.
- **Renderer**: `src/renderer`. UI logic (React).
- **Packaging**: `electron-builder.yml`.

## Conventions

- **Dependencies**: Use `npm`. Do not introduce Yarn/PNPM. Do not introduce new third-party dependencies without approval.
- **Style**: Respect `.prettierrc.yaml`. Keep functions small.
- **Security**: `contextIsolation: true`. No `remote` module. No raw `fs` in renderer.

## Forbidden Actions

- Do not disable lint rules.
- Do not change `tsconfig` files without explicit reason.
- Do not alter `dev-app-update.yml` unless working on updates.
