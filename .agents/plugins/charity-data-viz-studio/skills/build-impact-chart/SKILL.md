---
name: build-impact-chart
description: Design and implement interactive SVG donut gauges, governorate comparison bars, and financial thermometers for charity analytics views.
---

# Humanitarian Impact Chart Runbook

Follow these patterns when adding or enhancing visual analytics in `DashboardView.tsx`, `FinanceView.tsx`, `DonorsView.tsx`, or `ProjectsView.tsx`:

1. **SVG Donut Gauge Pattern**:
   - Use a `viewBox="0 0 120 120"` SVG with radius `r = 48` (`circumference = 2 * Math.PI * 48 ≈ 301.59`).
   - Render a base track `<circle stroke="#f1f5f9" strokeWidth="12" />` and an animated value arc `<circle stroke="url(#grad)" strokeDasharray={`${(pct / 100) * 301.59} 301.59`} strokeLinecap="round" transform="rotate(-90 60 60)" />`.
   - Center the primary percentage (`text-2xl font-black font-mono`) and Kurdish subtitle inside the ring.

2. **Comparative Horizontal Bar Pattern**:
   - For each category or governorate, display the Kurdish name on the start (right) and `aided / total (pct%)` in `font-mono` on the end (left).
   - Render a dual-layer bar: outer container `h-2.5 rounded-full bg-slate-100 overflow-hidden` and inner fill `h-full rounded-full transition-all duration-500`.

3. **KPI Card Hierarchy**:
   - Top row: Icon badge (`w-11 h-11 rounded-2xl`) + trend/percentage pill.
   - Middle: Primary metric (`text-2xl font-black font-mono text-slate-900`).
   - Bottom: Kurdish label (`text-xs font-bold text-slate-500`) + secondary contextual metric.
