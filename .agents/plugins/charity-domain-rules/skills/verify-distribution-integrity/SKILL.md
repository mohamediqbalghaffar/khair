---
name: verify-distribution-integrity
description: Verification checklist to ensure aid distributions synchronize inventory, donor receipts, financial ledger, and beneficiary aid history correctly.
---

# Aid Distribution Integrity Verification Runbook

Follow this runbook whenever testing or altering distribution flows in `InventoryView.tsx`, `BeneficiariesView.tsx`, or `AppContext.tsx`:

1. **Beneficiary Dossier Verification**:
   - Check that `beneficiary.aidHistory` has a newly created record with `id`, `date`, `type`, `distributedBy`, and `receiptNumber`.

2. **Inventory Stock Balance**:
   - For in-kind distributions, confirm `inventory.find(i => i.id === itemId).quantity` decreased exactly by the distributed amount.
   - Confirm stock cannot drop below 0.

3. **Financial Ledger Balancing**:
   - Ensure a corresponding `expense` transaction is added to `transactions` with `category: 'دابەشکردنی هاوکاری و کۆمەکی عەینی'` or `'دابەشکردنی هاوکاری نەختینەیی'`.
   - Verify currency conversion between IQD and USD aligns with `exchangeRateAtDate`.

4. **Project Spent Metrics**:
   - If the aid is attached to a project, confirm `project.spentBudgetIQD` and `project.spentBudgetUSD` update to reflect the new expense.
