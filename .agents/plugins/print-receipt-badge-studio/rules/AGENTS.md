# Official Print Studio & Document Isolation Rules

## 1. Supported Printable Root Containers
- Every printable document must use one of the registered print IDs in `src/index.css` (or register any new ID in `@media print`):
  - `#printable-receipt` (Official Donor Receipt in `OfficialReceiptModal.tsx`)
  - `#volunteer-badge` (Field Volunteer ID Card in `VolunteersView.tsx`)
  - `#printable-beneficiary-report` (Beneficiary Family Dossier in `BeneficiariesView.tsx`)
  - `#printable-impact-report` (Executive Humanitarian Impact Report in `DashboardView.tsx`)

## 2. Print Chrome & Backdrop Isolation
- Always add `.no-print` to modal close buttons (`<X />`), action toolbars (`چاپکردن`, `داخستن`), and floating overlays inside printable modals.
- Ensure printable containers use high-contrast slate/white backgrounds (`bg-white text-slate-900`) and include `-webkit-print-color-adjust: exact; print-color-adjust: exact;`.

## 3. Official Charity Document Anatomy
- Official documents must include:
  1. **Header**: Organization emblem (`ڕێکخراوی بۆتان بامۆکی بۆ کاروباری خێرخوازی و مرۆیی`), document reference/receipt number in `font-mono`, and issue date.
  2. **Body**: Structured RTL key-value grid and itemized tables with clear borders (`border-slate-200`).
  3. **Footer**: Official stamp area (`مۆری فەرمی ڕێکخراو`), authorized signature line (`واژۆی بەرپرس`), and QR verification badge.
