---
applyTo: 'src/renderer/src/**'
---

# Renderer Stack Guide

## Architecture

- **Entry**: `main.tsx` (GlobalProvider, Orbit coordinator).
- **Routing**: `routes/NavRoutes.tsx`. Use `PrivateRoute` for auth pages.
- **Auth**: `context/TokenProvider.tsx`. Use `useToken` context.

## State Management

- **Orbit (Data)**: `schema.tsx` & `crud/` helpers. Primary data store. Use `useOrbitData`.
- **GlobalContext**: Session state (org/project selection).
- **Redux**: `store/index.tsx`. View-model slices, uploads, localization.

## Code Patterns

- **Helpers**: Use `utils/` for shared logic (`dataPath`, `isElectron`, `localize*`).
- **Data Access**: Predominantly via hooks (`useOrbitData`) or Contexts.
- **Electron IPC**: Access via `window.api` (typed in `model/main-api.ts`), but prefer `utils/` wrappers.
- **Navigation**: Use `useMyNavigate` (persists query params/deeplinks).

## Guidelines

- **Modifying State**: Update `schema.tsx` for new Orbit models. Add Redux slices in `store/` only for cross-component view state.
- **Testing**: Test utils in `__tests__/`.
- **Platform**: Check `isElectron` for desktop-specific logic.
