---
name: Thrashing Detector
description: Detects unproductive debugging loops
---

# Thrashing Detector Skill

## Recognition (When to Apply)

**Context:** Bug fixing only, not feature development

**Signals:**

- Same file edited 3-4+ times without fixing bug
- Solution getting more complex (adding state/refs/effects)
- Each fix creates new bugs
- Lost track of what was tried

## Protocol

### 1. STOP adding code after 3-4 failed attempts

### 2. STASH

```bash
git diff <file>        # See what changed
git stash              # Store work
```

### 3. VERIFY revert fixed it

- **Fixed**: my changes broke it, rebuild the stashed changes cleanly and incrementally, without introducing breakages
- **Still broken**: bug is elsewhere (data/context), so report this to the user for help (this is the only time it's acceptable to stop working without completing the instructed task)

### 4. REBUILD

- ONE small change → test → repeat if passed

## Example

Added ready state, blob refs, effects... kept failing.
User reverted → immediately fixed → proved my changes broke it.
