# Supabase & Cloud-Local Data Synchronization Rules

## 1. Dual-Tier Persistence Architecture
- The system operates on an **Offline-First / Realtime-Synced** model:
  - Local state lives in React Context (`AppContext.tsx`) and persists in `localStorage` (`ngo_*` keys).
  - Remote state syncs to Supabase tables via `src/services/supabase.ts`.

## 2. Safe Sync & Mapping Contracts
- Never directly insert raw client UI objects into Supabase tables without schema mappers:
  - Beneficiaries -> `mapBeneficiaryToDb` / `mapBeneficiaryFromDb`
  - Donors -> `mapDonorToDb` / `mapDonorFromDb`
  - Donations -> `mapDonationToDb` / `mapDonationFromDb`
  - Projects -> `mapProjectToDb` / `mapProjectFromDb`
  - Inventory -> `mapInventoryToDb` / `mapInventoryFromDb`
  - Transactions -> `mapTransactionToDb` / `mapTransactionFromDb`
  - Volunteers -> `mapVolunteerToDb` / `mapVolunteerFromDb`
  - Documents -> `mapDocumentToDb` / `mapDocumentFromDb`
  - Audit Logs -> `mapAuditLogToDb` / `mapAuditLogFromDb`
- Always wrap non-critical cloud mutations in `safeSupabaseSync(...)` to prevent blocking the UI when network connectivity is lost.

## 3. Realtime Channel Subscriptions
- Listeners for `postgres_changes` must ignore loopback events when the local device already holds the update.
- Ensure all Supabase subscriptions clean up in `useEffect` return hooks with `supabase.removeChannel(channel)`.
