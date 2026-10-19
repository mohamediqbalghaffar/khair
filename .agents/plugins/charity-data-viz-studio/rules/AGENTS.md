# Humanitarian Data Visualization & Chart UX Rules

## 1. Zero-Dependency SVG Architecture
- Build charts using native React `<svg>` elements (`strokeDasharray`, `strokeDashoffset`, `<linearGradient>`, `<path>`) rather than bundling heavy third-party charting libraries.
- Always guard against division-by-zero (`Math.max(1, total)`) so empty databases (`0 records`) render a clean `0%` track instead of `NaN`.

## 2. RTL & Dual-Currency Formatting
- Progress bars inside `dir="rtl"` containers fill naturally from right to left.
- Always format numbers with `.toLocaleString()` and wrap numeric figures in `font-mono`.
- Respect `currencyView` (`'IQD' | 'USD'`) from `useApp()` and display secondary converted amounts where helpful.

## 3. Accessible Visual Storytelling
- Include `<title>` or `aria-label` on SVG gauges and charts.
- Pair every chart with an explicit legend showing both **count** and **percentage** (`%`).
- Highlight actionable insights (e.g., unaided families count, low-stock items, remaining unallocated cash balance).
