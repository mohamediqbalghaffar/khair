# iOS 26 Liquid Glass Design System Rules

## 1. Surface & Elevation Hierarchy
- **Primary Containers / Cards**: Use `rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all`.
- **Nested Sub-Panels**: Use `rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3.5`.
- **Modal Dialogs**: Use `rounded-3xl bg-white border border-slate-200 shadow-2xl` over a `bg-slate-950/45 backdrop-blur-md` overlay. Never use dark/black modal bodies for data entry or content views.
- **Interactive Controls**:
  - Primary CTA: `.liquid-button-primary text-white font-bold rounded-2xl shadow-md`
  - Secondary Action: `bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors`
  - Danger Action: `bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl`
  - Inputs & Selects: `.liquid-input` or `rounded-xl bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none`

## 2. Typography Scale & Readability
- Avoid `text-[9px]` or `text-[10px]` on primary data labels; use `text-xs` (`12px`) or `text-[11px]` minimum with `font-bold` for Kurdish Sorani legibility.
- Section titles: `text-2xl font-black text-slate-900 flex items-center gap-2`.
- KPI numbers and monetary values: `font-mono font-black tracking-tight`.

## 3. Semantic Color Tokens
- **Cyan / Blue (`cyan-600`, `blue-600`)**: Primary navigation, beneficiaries, general actions.
- **Emerald (`emerald-600`)**: Financial income, active projects, completed distributions, verified status.
- **Amber (`amber-600`)**: High-priority warnings, pending reviews, volunteer hours.
- **Rose (`rose-600`)**: Urgent emergency vulnerability (`90-100`), expenses, low-stock alerts, destructive actions.
- **Indigo / Violet (`indigo-600`)**: In-kind valuation, administrative archives.

## 4. Micro-Interactions & Animations
- Use `.animate-in .fade-in .zoom-in-95 duration-200` on modals and popovers (backed by keyframes in `src/index.css`).
- Respect `[data-reduced-motion="true"]` and `[data-high-contrast="true"]` attributes on `document.documentElement`.
