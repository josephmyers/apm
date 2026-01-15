---
description: high level project context
globs: **/*
---

# Project Context

- **Product**: Audio Project Manager (Electron + Vite + React). For oral Bible translation workflows.
- **Primary Stack**:
  - **Frontend**: TypeScript (Renderer), Orbit.js (Data), Redux (View State), Material UI.
  - **Backend/Platform**: Electron (Main/Preload), Auth0.
- **Key Layers**:
  - `src/main` / `src/preload`: Electron entry and IPC bridge.
  - `src/renderer/src`: React renderer.
  - `src/renderer/src/crud`, `utils`, `store`, `model`: Shared resources.
- **Tooling**: `npm` scripts, `electron-builder`, Prettier, ESLint.
- **Testing**: Vitest/Jest (`src/renderer/src/__tests__`).
- **Security**: Strict isolation, typed IPC.

## Purpose
A desktop and web application for managing and executing oral Bible translation workflows (internalizing, recording, transcribing, reviewing, etc.).
