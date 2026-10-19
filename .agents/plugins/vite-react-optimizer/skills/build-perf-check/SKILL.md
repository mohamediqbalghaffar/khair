---
name: build-perf-check
description: Runbook for auditing bundle size, TypeScript cleanliness, and lazy-loading boundaries before shipping code changes.
---

# Build & Performance Verification Runbook

Follow this runbook before committing or pushing changes:

1. **Clean Production Compile**:
   - Run `npm.cmd run build`.
   - Verify `tsc -b` exits with 0 errors.
   - Inspect Vite chunk output to ensure individual views stay partitioned.

2. **Dialog & Deprecation Scan**:
   - Run a regex search for any newly introduced `alert()` or `confirm()` calls:
     ```powershell
     Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | Select-String -Pattern "\b(alert|confirm)\s*\("
     ```
   - All matches must be replaced with `useFeedback()`.

3. **Linter Health**:
   - Run `npm.cmd run lint` (`oxlint`) to catch syntax oversights and unused variables.
