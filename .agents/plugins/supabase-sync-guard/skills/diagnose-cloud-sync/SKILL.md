---
name: diagnose-cloud-sync
description: Step-by-step diagnostic runbook for Supabase connectivity, table mapping mismatches, and offline local cache health.
---

# Supabase Cloud Sync Diagnostic Runbook

When diagnosing cloud sync or multi-device replication issues:

1. **Connection Health Check**:
   - Call `checkSupabaseConnection()` or inspect `isCloudConnected` in `AppContext`.
   - Verify environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

2. **Cache Integrity Verification**:
   - Inspect browser `localStorage` keys: `ngo_beneficiaries`, `ngo_donors`, `ngo_inventory`, `ngo_transactions`, `ngo_system_version`.
   - Verify `SYSTEM_VERSION` constant in `AppContext.tsx` matches the active storage version.

3. **Multi-device Merge Conflicts**:
   - Use `syncLocalDataToCloud()` logic in `AppContext.tsx`: remote records take precedence when IDs match, while local-only IDs are pushed via bulk upsert.
