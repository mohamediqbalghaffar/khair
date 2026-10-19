# Responsive Data Tables, Mobile Dock & GeoMap UX Rules

## 1. Paginated Data Tables
- Every table capable of growing beyond 25 rows (`BeneficiariesView`, `DonorsView`, `InventoryView` distributions, `FinanceView` transactions, `AuditView` logs) MUST integrate `<PaginationBar />` (`src/components/ui/PaginationBar.tsx`) with page-size options (`25`, `50`, `100`).
- Reset `currentPage` to `1` whenever search queries or filter pills change.
- Wrap tables in `<div className="overflow-x-auto">` inside a `rounded-3xl bg-white/90 border border-slate-200/90 overflow-hidden shadow-sm` card.

## 2. Mobile Viewport & Navigation Dock Ergonomics
- Filter bars and header toolbars must stack gracefully on mobile (`flex-col sm:flex-row`) and allow horizontal scrolling on tab strips (`overflow-x-auto no-scrollbar`).
- Ensure bottom view content has sufficient bottom padding (`pb-8` or `pb-12`) so content is never obscured by the bottom `NavigationDock`.

## 3. Interactive GeoMap UX (`GeoMapView.tsx`)
- Never render helper sub-views that contain search `<input>` fields as inline JSX component tags (`<MapToolbar />`) if they are defined inside the parent component body—invoke them as render functions (`{MapToolbar(...)}`) so React preserves DOM identity and keyboard focus while typing.
