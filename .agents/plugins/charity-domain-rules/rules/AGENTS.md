# Humanitarian Aid & Charity Management Domain Rules

## 1. Vulnerability Scoring Model
- Vulnerability index ranges from 0 to 100 based on `computeVulnerabilityScore`:
  - `90 - 100`: فریاکەوتنی بەپەلە (Urgent Emergency)
  - `70 - 89`: پێشینەی بەرز (High Priority)
  - `40 - 69`: مامناوەند (Moderate)
  - `< 40`: جێگیر (Stable)
- Always display breakdown factors (e.g. orphan count, disability, displacement status, chronic illness, monthly income).

## 2. Inventory & Distribution Safeguards
- In-kind aid cannot be distributed if inventory quantity is insufficient (`item.quantity < requestedQuantity`).
- Monetary aid cannot exceed the unallocated receipt balance (`remainingAmount`).
- Every aid distribution MUST atomically:
  1. Add an `AidRecord` to the beneficiary's dossier.
  2. Deduct item stock from `inventory` or cash balance from `donations`.
  3. Create an automated expense transaction in `transactions`.
  4. Recalculate project spent metrics if linked to a `projectId`.
  5. Log the action into `auditLogs`.

## 3. Donor Tiers
- Automatically assign donor badges based on cumulative lifetime contribution:
  - `ئەڵماس 💎`: Total > 10,000,000 IQD (or > $7,500 USD)
  - `زێڕین 🥇`: Total > 5,000,000 IQD (or > $3,500 USD)
  - `زیوین 🥈`: Total > 1,500,000 IQD (or > $1,000 USD)
  - `برۆنزی 🥉`: Any confirmed donation below Silver tier
