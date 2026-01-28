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
- `mcp_electron-dev_take_screenshot`: Take screenshot of app

## Testing Process

### 1. Understand the Change
- What was requested?

### 2. Run Tests

**State Verification** ⚠️ CRITICAL
Don't just check visibility—verify ACTUAL state. Test realistic paths, not isolated actions:
```
1. Navigate to page
2. Interact with impacted features
3. Verify state changes as expected
4. Look carefully for side effects/corruption
```

## Critical Rules

1. **Never Skip State Verification**: "Make playhead jump to 30s" = verify `currentTime = 30`, not just UI presence
2. **Test Full Flows**: Don't just test happy path; test edge cases, invalid inputs, component interaction
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
