# Kurdish Sorani (ckb) & RTL Design System Standards

## 1. Typography & Script Integrity
- **Primary Font**: Speda with fallback to `Noto Sans Arabic` and `Inter` for monospace/Latin digits.
- **Directionality**: The application root is strictly `dir="rtl"` with Kurdish Sorani (`lang="ckb"`).
- **Logical Tailwind Properties**:
  - NEVER use `ml-*`, `mr-*`, `left-*`, `right-*` when positioning inline content.
  - ALWAYS use logical properties: `ms-*` (margin-inline-start), `me-*` (margin-inline-end), `ps-*`, `pe-*`, `start-*`, `end-*`.
  - Icon chevrons: In RTL, `ChevronLeft` is forward (next), and `ChevronRight` is backward (previous).
  - Status dots & badges: Pin indicators using `me-` rather than `mr-` or `ml-`.

## 2. Text Normalization Rules
- Always normalize Kurdish and Arabic letters before matching or filtering:
  - Letters `ێ`, `ی`, `ي`, `ى` should be normalized.
  - Letters `ە`, `ة`, `ه` should be normalized.
  - Letters `ۆ`, `و`, `ؤ` should be normalized.
  - Letters `ک`, `ك` should be normalized.
  - Stripping diacritics / Harakat (`\u064B-\u0652`).
  - Use `normalizeArabicKurdish(str)` from `src/views/DocumentsView.tsx` or shared utils.

## 3. iOS 26 Liquid Glass White Aesthetics
- Clean translucent backdrops: `bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-sm`.
- Primary interactive buttons: `.liquid-button-primary` with subtle glossy transitions.
- Inputs: `.liquid-input` with crisp borders and subtle focus rings.
- Avoid heavy black backgrounds in content modals; use light Liquid Glass finishes with deep slate text (`text-slate-900`, `text-slate-700`).

## 4. Accessibility & UI Non-blocking Dialogs
- Never use blocking browser `alert()` or `confirm()`.
- Use `useFeedback()` (`showToast` with Kurdish labels, `confirmAction` with accessible dialog and keyboard trapping).
