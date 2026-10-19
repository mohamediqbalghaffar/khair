---
name: rtl-audit
description: Review and validate Kurdish Sorani text, RTL layout alignment, logical Tailwind classes, and Liquid Glass design tokens across view components.
---

# RTL & Kurdish Typography Audit Runbook

Run this checklist when modifying or creating components in this charity app:

1. **RTL Directional Checks**:
   - Verify all horizontal spacing uses `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`.
   - Verify modals and drawers open from the natural reading direction (`pe-` for close buttons).
   - Check navigation icons: Next actions point left (`ChevronLeft`), back actions point right (`ChevronRight`).

2. **Kurdish Grammar & Terminology**:
   - Beneficiaries: `سوودمەندان`
   - Donors: `بەخشەران`
   - Projects: `پڕۆژەکان`
   - Inventory / Warehouse: `کۆگا و دابەشکردن`
   - Finance: `دارایی و ژمێریاری`
   - Volunteers: `خۆبەخشان`
   - Audit Trail: `مێژووی چاودێری`

3. **Number Formatting**:
   - Currency IQD: format as `#,### د.ع` or `IQD`.
   - Currency USD: format as `$#,###` or `USD`.
   - Exchange rate computations must use `getExchangeRateForDate()`.

4. **Print Optimization**:
   - All printable views (`#printable-receipt`, `#volunteer-badge`, `#printable-impact-report`) must have `.no-print` on action buttons and backdrops.
