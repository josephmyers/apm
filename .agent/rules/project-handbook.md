---
trigger: always_on
description: general project standards, lifecycle, and coding conventions
globs: **/*
---

# Onboarding Guide (Adapted for Workspace Rules)

**Repository**: sillsdev/apm
**Stack**: TypeScript (≈75%), JavaScript, HTML, CSS. Electron + Vite.
**Purpose**: Desktop/Web app for oral Bible translation workflows.

> **Guideline**: Follow these instructions first. Only fall back to generic knowledge if not covered here.

## 1. High-Level Overview

- **Language**: TypeScript is dominant. Strict type checking expected.
- **Formatting/Linting**: Prettier (`.prettierrc.yaml`) + ESLint (`eslint.config.mjs`).
- **Packaging**: `electron-builder` (`electron-builder.yml`).
- **Config**: `package.json` contains standard metadata.

## 8. Adding New Code

1. **Identify Layer**: Main (OS/IPC), Preload (Bridge), Renderer (UI).
2. **IPC**: Add/reuse IPC channels. Keep namespacing consistent.
3. **Types**: Update central types module if adding IPC.
4. **Tests**: Add tests for new logic, ONLY when requested.
5. **Verification**: Check if the Electron app is already running (`npm start` in repo root). If so, use it for verification by utilizing the `electron-dev` MCP tools (e.g., `mcp_electron-dev_get_ui_tree`, `mcp_electron-dev_click_element`). Do NOT launch a web browser if the Electron app is running.

## 9. Security (Electron)

- No `remote` module.
- `contextIsolation: true`.
- Expose minimal surface through preload. No raw `fs`/`child_process` in renderer.

## 10. Working with Dependencies

- Use existing versions where possible.
- Run `npm ci` after adding dependencies to confirm lockfile.

## 12. Conventions & Style

- Respect Prettier.
- Keep functions small, cohesive.
- Typescript strict typing (avoid `any`).
- Consistent naming for async (`getXAsync`).
- Group IPC channel constants.
- Reuse code where possible. Analyze similar files to determine repeated patterns. Extract to resable methods when straightforward to do so.

## 13. What NOT To Do

- Do NOT introduce Yarn/PNPM.
- Do NOT remove/rename tsconfig files.
- Do NOT disable lint rules for single files without approval.
- Do NOT add large binary assets without consultation.
- Do NOT refactor existing components (i.e. being reused throughout the app) without approval. THIS IS IMPORTANT.
