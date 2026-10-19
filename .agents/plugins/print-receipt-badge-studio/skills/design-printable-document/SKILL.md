---
name: design-printable-document
description: Create or audit printable A4 charity receipts, beneficiary dossiers, volunteer ID badges, and official impact reports.
---

# Printable Charity Document Runbook

When creating or modifying a printable modal or report:

1. **Verify `@media print` Registration in `src/index.css`**:
   - Ensure the printable wrapper ID (e.g., `#printable-receipt`) is listed in both the `visibility: visible !important` selector and the `position: fixed; inset: 0; width: 100%` layout selector inside `src/index.css`.

2. **Check `.no-print` Coverage**:
   - Inspect the modal wrapper to ensure all buttons (`window.print()`, close `X`, WhatsApp share) and modal instructions have the `no-print` class.

3. **Verify Scroll Clipping**:
   - Printable modals often use `max-h-[90vh] overflow-y-auto` on screen; verify that `@media print` overrides `max-height: none !important; overflow: visible !important;` so multi-section reports never clip when printed to A4 PDF.
