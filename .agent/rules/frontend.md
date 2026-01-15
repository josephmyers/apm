---
trigger: always_on
description: detailed architecture and usage guide for the frontend (renderer)
globs: src/renderer/src/**
---

# Renderer Stack Guide

## Scope

- The React renderer under `src/renderer/src`.
- Primary goals: explain how control flows from the DOM bootstrap through auth, routing, Orbit data sources, Redux slices, and domain contexts; highlight platform differences (Electron vs web) and offline support.

## Startup Flow

- **Entry Point**: `main.tsx`. Imports Orbit `coordinator`/`memory` singletons (`schema.tsx`), probes platform (`window.api`), primes local storage, restores IndexedDB backups (desktop).
- **Rendering**: `main.tsx` renders `Root` inside `GlobalProvider`. Initial `GlobalState` is composed here.
- **Providers**: `Root` composes `DataProvider` (Orbit), Redux store (`store/index.tsx`), and auth renderer (Electron: `TokenChecked`, Web: Auth0).

## Auth and Platform Layers

- **TokenProvider**: (`context/TokenProvider.tsx`) Primary auth context.
    - Web: Talks to Auth0 via `@auth0/auth0-react`.
    - Electron: Reaches preload bridge via typed `MainAPI` (`window.api`).
- **Usage**: Pull tokens from `TokenProvider` for authenticated requests.
- **Error Handling**: `ErrorManagedApp` wraps React tree in Bugsnag and custom `ErrorBoundary`.

## State Management Stack

1. **GlobalContext**: Central app session state (org/project selection, connectivity, snacks). Use `useGlobal`/`useGetGlobal`. Avoid derived UI state here.
2. **Orbit Memory / Coordinator**: (`schema.tsx`) Orbit models for backend records. Coordinator handles sync + IndexedDB. Use CRUD helpers (`src/renderer/src/crud`) and hooks (`useOrbitData`).
3. **Redux Store**: (`store/index.tsx`) View-model slices (localization, upload workflow, auth UI, import/export). only for non-Orbit state shared across distant components.
4. **Feature Contexts**: `UnsavedContext`, `PlanContext`, `PassageDetailContext`, etc.

## Data Synchronization & Offline Support

- **DataChanges**: Mounted at top of `App`. Monitors Orbit sources, schedules syncs (`useInterval`), triggers offline backups (`electronExport`).
- **Config**: Sync cadence configurable/user (hot-key prefs).
- **Background Fetch**: Respect busy flags (`remoteBusy`, `importexportBusy`, `anySaving`).
- **IndexedDB**: Migrations/backups in `schema.tsx`. Update schema and migration steps if adding models.

## UI Composition

- **App.tsx**: Layers providers, renders router tree (`routes/NavRoutes.tsx`).
- **MUI Theme**: Defined in `App.tsx`.
- **Components**: `components/`, `routes/`, `burrito/`. Receive data via hooks (Orbit, Redux selectors, contexts). Avoid threading props.

## Utility Layer

- **Shared Helpers**: `utils/`. Prefer these over ad-hoc logic.
- **Platform Helpers**: `dataPath`, `execFolder`, `launch`, `exitElectronApp`, `useCheckOnline`. WRAP Electron IPC/Environment quirks.
- **Orbit/Persistence**: `waitForIt`, `resetData`, `rememberCurrentPassage`, `useProjectsLoaded`.
- **Domain Logic**: `refMatch`, `getWhereis`, `localize*`, `burritoMetadata`.
- **Hooks**: `utils/` (`useDebounce`, `useProjectPermissions`, `useTraceUpdate`, `useAudioAi`).

## Routes & Navigation

- **NavRoutes.tsx**: Single source of truth. `createHashRouter` (Electron), `createBrowserRouter` (Web).
- **Protection**: `PrivateRoute` HOC (`../hoc/PrivateRoute`) for authenticated screens.
- **Redirection**: Use `useMyNavigate` (persists deeplinks) or `StickyRedirect`. Avoid direct `useNavigate`.
- **Structure**: Route components in `routes/` own orchestration. Hand off to feature providers.
- **Auth Flows**: `Access.tsx`, `accessActions.ts`, `Logout.tsx`. Coordinate with `TokenProvider`.

## Redux Store Modules

- **Location**: `store/`. Wired in `store/index.tsx`.
- **Structure**: `types.tsx`, `actions.tsx`, `reducers.tsx`, `*CleanState.ts`.
- **Pattern**: Use exported action creators (thunks) from `actions.tsx`.
- **Existing**: Localization, paratext, uploads, auth metadata, transient Orbit flags.

## Domain Models

- **Orbit Records**: `model/`. Mirrors JSON:API resources.
- **Composite Data**: `SectionArray`, `wfSaveRec`, `projData`.
- **IPC Bindings**: `model/main-api.ts`. Use exposed interfaces, NOT `any`.
- **Schema**: Update `schema.tsx` when extending Orbit models.
- **Metadata**: Occurrences of "burrito" refer to a specific project data structure for import and export.

## Testing

- **Unit Tests**: `__tests__/` (Vitest/Jest).
- **Helpers**: Use helpers in `__tests__/` for memory stores and mock providers.

## Working Guidelines

- Prefer extending existing hooks (`crud/`, `context/`).
- Update `main.tsx` and `App.tsx` when adding providers.
- Respect platform differences (guard Electron calls with `isElectron`).
