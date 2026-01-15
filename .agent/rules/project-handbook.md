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

## 2. Environment & Tooling

- **Node.js**: Use active LTS (>=18) or `engines.node` in `package.json`.
- **Package Manager**: `npm`. `npm ci` (CI), `npm install` (Local).
- **TypeScript**: `tsconfig.json`, `tsconfig.node.json`, `tsconfig.web.json`.
- **Lint/Format**: Run before committing.

## 3. Core Lifecycle Commands

| Purpose | Command |
|---------|---------|
| Bootstrap | `npm install` (local) / `npm ci` (CI) |
| Dev (Watch) | `npm run dev` |
| Type Check | `npm run typecheck` (or `tsc --noEmit`) |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Build (Prod) | `npm run build` |
| Package | `npm run dist` |
| Test | `npm test` |

**If a command fails**:
1. Confirm `node_modules` exists. Confirm the working directory is correct.
2. Remove stale artifacts: `rm -rf node_modules dist out`.
3. Re-run `npm ci` then the command.

## 4. Execution Sequences

### Validating a Change
1. `npm run lint`
2. `npm run typecheck`
3. `npm run build` (confirm prod compilation)
4. `npm test`

## 5. Project Layout & Key Files

- **.editorconfig**: Editor consistency.
- **electron.vite.config.ts**: Central Vite config.
- **electron-builder.yml**: Packaging config.
- **src/main**: Electron main process entry (desktop platform).
- **src/preload**: Preload script.
- **src/renderer**: Frontend (React) built by Vite.

## 6. Linting, Formatting, Quality Gates

1. Run `npm run lint`. Fix auto-fixable with `npx eslint . --fix`.
2. Run `npm run format`.
3. Type checking must pass.
4. Tests must pass locally.

**Dependencies**:
- Ensure production-safe.
- Verify devDependencies vs dependencies.
- Electron security: avoid `nodeIntegration` in renderer.

## 7. Common Pitfalls

- **Missing Types**: Install `@types/<package>` or check `tsconfig`.
- **Electron Blank Window**: Check `npm run dev` output and `electron.vite.config.ts`.
- **Packaging Error**: Check `resources/` for icons.

## 8. Adding New Code

1. **Identify Layer**: Main (OS/IPC), Preload (Bridge), Renderer (UI).
2. **IPC**: Add/reuse IPC channels. Keep namespacing consistent.
3. **Types**: Update central types module if adding IPC.
4. **Tests**: Add tests for new logic, ONLY when requested.
5. **Verification**: Always perform end-to-end manual verification using the browser_subagent for any UI changes before requesting user review. Do not rely solely on static analysis or type checks.

## 9. Security (Electron)

- No `remote` module.
- `contextIsolation: true`.
- Expose minimal surface through preload. No raw `fs`/`child_process` in renderer.

## 10. Working with Dependencies

- Use existing versions where possible.
- Run `npm ci` after adding dependencies to confirm lockfile.

## 11. Packaging / Release

- `npm run build` -> `npm run dist` -> Smoke test.
- Check `electron-builder.yml` for `appId`, `files`, `extraResources`.

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
