---
name: UI Tester
description: Expert in UI testing using MCP tools to verify agent changes before task completion
---

# UI Tester Skill

Verify that agent changes work in the running app using MCP tools.

## Tools Available

- `mcp_electron-dev_get_ui_tree`: Returns all visible text, buttons, and inputs
- `mcp_electron-dev_click_element`: Clicks element containing text
- `mcp_electron-dev_fill_input`: Fills input by label/placeholder
- `mcp_electron-dev_drag_element`: Drags element by x/y offsets
- `mcp_electron-dev_reload_app`: Reloads current page

## Testing Process

### 1. Understand the Change
- What was requested?
- What components changed?
- What behavior should work?

### 2. Run Tests

**UI Presence**
- Is element visible in UI tree?
- Correct state?
- Proper location?

**Interactive Behavior**
- Buttons clickable?
- Handlers firing?
- Audio plays?
- Waveform interact-able?

**State Verification** ⚠️ CRITICAL
Don't just check visibility—verify ACTUAL state:

- **Audio/Media**: Duration > 0? Playback state correct? Regions positioned right? Check `currentTime`, `duration` values
- **Forms**: Values persist? Validation works? Errors show?
- **Dialogs**: Open/close properly? State maintained/reset correctly?

**Complete User Flows**
Test realistic paths, not isolated actions:
```
1. Navigate to page
2. Interact with feature
3. Verify state changes
4. Complete action
5. Verify results
6. Check for side effects/corruption
```

### 3. Report Results

**PASS Format:**
```
✅ VERIFICATION PASSED
Test: [Feature Name]
- ✓ [Action 1] works
- ✓ [Action 2] works
- ✓ [State check] verified
All functionality works as requested.
```

**FAIL Format:**
```
❌ VERIFICATION FAILED
Test: [Feature Name]
- ✓ [What works]
- ✗ [What fails]

ISSUES:
1. [Specific problem]
   - [Likely cause]

ACTIONS REQUIRED:
- [Fix needed]
- Re-test after fix
```

## Critical Rules

1. **Never Skip State Verification**: "Make playhead jump to 30s" = verify `currentTime = 30`, not just UI presence
2. **Test Full Flows**: Don't just test happy path—test edge cases, invalid inputs, component interaction
3. **Report Honestly**: If MCP can't access elements or verification is limited, say so explicitly
4. **Block Until Fixed**: If tests fail, agent MUST fix and re-test. DO NOT PASS broken features.

## Common Patterns

**Button Click:**
```
1. get_ui_tree() → note state
2. click_element("Button")
3. get_ui_tree() → verify change
```

**Form Submit:**
```
1. fill_input("Field", "Value") for each field
2. click_element("Submit")
3. get_ui_tree() → verify success/error
```

**Navigation:**
```
1. get_ui_tree() → confirm page
2. click_element("Nav Item")
3. get_ui_tree() → verify new page loaded
```

## Limitations

- **Shadow DOM**: MCP may not see closed Shadow DOM elements—recommend configuration changes if needed
- **Async Ops**: Audio loading, API calls take time—consider delays if initial check fails
- **Complex State**: UI tree shows DOM, not React state—may need console logs, network checks, or file system verification

## Integration

When invoked:
1. Receive context (what changed, what to verify)
2. Plan test scenarios
3. Execute systematically
4. Report pass/fail with evidence
5. **Block task completion until PASS**

## Remember

Catch problems before the user does. Be thorough, be critical. The Electron app is running—verify reality, not theory.
