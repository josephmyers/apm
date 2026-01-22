---
trigger: model_decision
description: Verification and consistency rules for UI changes
globs: **/*
---

# Verification and Consistency Rules

## UI Consistency

2.  **No Ad-hoc Colors**: Avoid hardcoded hex colors like `#f5f5f5`. Use theme-based values from App.tsx (e.g., `action.hover`, `divider`, `text.secondary`) where possible.

## Behavioral Verification
1.  **Follow instructions**: Don't just check if a component is "visible" in the UI tree. Verify that state-dependent features (like a playhead jumping to a specific time) are reflected in the variables (e.g., `currentTime`, `duration`). ***IMPORTANT*** This is what following instructions means. ***IMPORTANT***
2.  **Audio/Media Testing**: When implementing media players, verify that:
    -   Audio actually loads (check duration > 0).
    -   Playback state (playing/paused) is correctly reflected.
    -   Regions and cursors are positioned as requested.
3.  **Dialog Readiness**: For components inside Dialogs or Modals, ensure initialization logic (like WaveSurfer) accounts for internal rendering delays or animations. Use small timeouts or `ready` events only when necessary, and then make sure they're used robustly.

## "Premium" Directive
1.  **Polish Last**: If a user asks for a feature, don't spend effort on the theming at all until you verify you've fulfilled the instructions completely. This includes proper spacing (gaps), consistent typography, and smooth transitions.
