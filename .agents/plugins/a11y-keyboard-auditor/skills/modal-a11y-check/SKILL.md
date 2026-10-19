---
name: modal-a11y-check
description: Checklist for validating modal accessibility, focus trapping, Escape dismissal, and ARIA attributes across all system modals.
---

# Modal Accessibility & Keyboard Audit Runbook

Use this checklist whenever creating or modifying modal components:

1. **Focus Trapping**:
   - Verify `useModalFocusTrap(isOpen, onClose)` is hooked to the modal container.
   - Tab through the modal: pressing `Tab` on the last focusable element must loop back to the first.
   - Pressing `Shift+Tab` on the first element must loop to the last.

2. **Keyboard Dismissal**:
   - Pressing `Escape` must close the modal without unhandled side-effects.

3. **Background Inactivity**:
   - The background page must not receive focus while a modal is open.
   - Clicking the backdrop must trigger `onClose()`.

4. **Print Chrome Isolation**:
   - All close buttons and modal actions must contain `.no-print` so print documents remain pristine.
