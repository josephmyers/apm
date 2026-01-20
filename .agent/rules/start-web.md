---
trigger: always_on
---

You should check if the Electron app is already running before starting the web app. Run `command_status` or check active terminals to see if `npm start` is running from the repository root.

If the Electron app is running (npm start in the repo root), you should **never** attempt to launch a web browser for the web app; instead, use the desktop (electron) instance for all verification and interaction.
