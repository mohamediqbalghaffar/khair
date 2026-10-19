---
name: liquid-glass-polish
description: Audit and upgrade UI components, cards, modals, and empty states to adhere to the iOS 26 Liquid Glass white design system.
---

# iOS 26 Liquid Glass Polish Runbook

When asked to polish or redesign a screen or component:

1. **Surface Audit**:
   - Replace flat opaque gray boxes or harsh dark cards with light Liquid Glass surfaces (`bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-3xl shadow-sm`).
   - Use subtle gradient accents for hero KPI cards (`bg-gradient-to-br from-cyan-50/90 via-white to-blue-50/80 border border-cyan-200/80`).

2. **Typography & Badge Normalization**:
   - Upgrade cramped `text-[9px]` / `text-[10px]` labels to `text-xs font-bold` so Kurdish Sorani diacritics (`ێ`, `ۆ`, `ڕ`, `ڵ`) render crisply.
   - Pair every status badge with a semantic Lucide icon (`CheckCircle2`, `AlertTriangle`, `Clock`, `ShieldCheck`) so status is never communicated by color alone.

3. **Empty & Loading States**:
   - Every list, grid, or table must have a centered Liquid Glass empty state with a muted icon (`w-12 h-12 text-slate-300`), clear Kurdish heading, helper subtitle, and a reset-filter or primary action button.
