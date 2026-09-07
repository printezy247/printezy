# Hide the "Edit with Lovable" badge

The badge is currently visible (`hide_badge: false`) and is overlapping the chat card. The fix is a single publish-setting change.

## Steps
1. Call `publish_settings--set_badge_visibility` with `hide_badge: true`.
2. Confirm the setting reports `hide_badge: true`.
3. No code or styling changes are needed.

## Notes
- This only affects the published deployment badge, not the in-editor preview.
- Repositioning via CSS is not required because the chosen approach is to hide it completely.
