# Vite & React 19 Performance & Code Architecture Rules

## 1. Code Splitting & View Laziness
- Keep top-level views lazy-loaded via `React.lazy()` with `Suspense` fallbacks in `src/App.tsx`.
- Keep initial bundle size small (below 500 kB). Heavy libraries (like Leaflet, XLSX/ExcelJS) must be dynamically imported or partitioned into lazy chunks.

## 2. Component Structure & Memoization
- Avoid creating inline components inside render functions.
- If a helper needs state or hooks, declare it as a standalone component outside the parent.
- If a helper only renders JSX, call it as a plain render function `{renderToolbar()}` to preserve DOM identity and input focus.
- Wrap expensive filter and sort operations in `useMemo`.

## 3. Build & Type Verification
- Always test modifications with `npm.cmd run build` (`tsc -b && vite build`).
- Do not bypass TypeScript errors with `any` unless dealing with third-party untyped browser events.
