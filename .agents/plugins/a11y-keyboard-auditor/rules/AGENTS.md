# Accessibility & Keyboard Navigation Standards

## 1. Dialog & Modal Semantics
- Every modal overlay must:
  - Have `role="dialog"` or `role="alertdialog"`.
  - Declare `aria-modal="true"`.
  - Reference an `aria-labelledby` heading and optionally an `aria-describedby` description.
  - Employ `useModalFocusTrap(isOpen, onClose)` to cycle keyboard focus within the dialog and handle `Escape` keys cleanly.

## 2. Interactive Controls & Buttons
- Never use non-interactive elements (like `div` or `span`) as clickable buttons without `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers.
- When toggling states, use `aria-expanded` (dropdowns/accordions) and `aria-checked` (custom checkboxes/milestones).
- All icon-only buttons must provide a visible `title` or an `aria-label` in Kurdish.

## 3. Screen Reader & Live Regions
- Toast notifications must be wrapped in an `aria-live="polite"` region with `aria-atomic="true"`.
- Loading spinners must have descriptive text or `aria-label="بارکردن..."`.
- High contrast preferences (`[data-high-contrast="true"]`) must ensure foreground-to-background contrast ratios exceeding 4.5:1.
