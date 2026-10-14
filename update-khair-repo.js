#!/usr/bin/env node
/**
 * ============================================================================
 * KHAIR NGO PLATFORM — GOOGLE ANTIGRAVITY REPOSITORY UPDATER (PHASES 1–4)
 * ============================================================================
 * Target Repository : https://github.com/mohamediqbalghaffar/khair
 * Deployment Target : https://vercel.com/mohammed-iqbals-projects-921c9ab5/khair
 *
 * HOW TO USE IN GOOGLE ANTIGRAVITY OR TERMINAL:
 * 1. Place this file (`update-khair-repo.js`) in the root directory of your
 *    cloned `khair` repository (next to `package.json`).
 * 2. In Google Antigravity, either:
 *    - Prompt Antigravity: "Run `node update-khair-repo.js` and apply all
 *      Phase 1–4 UX & bug fixes defined in `update-khair-repo.js` and
 *      khair_ux_audit_and_implementation_plan.md, then verify
 *      with `npm run build`."
 *    - Or run directly in terminal:
 *        node update-khair-repo.js
 *        npm run build
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();

function logStep(phase, message) {
  console.log(`[Khair Updater | ${phase}] ${message}`);
}

function writeNewFile(relPath, content) {
  const fullPath = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  logStep('CREATE', `Wrote ${relPath}`);
}

function patchExistingFile(relPath, patchFn) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    logStep('SKIP', `File not found: ${relPath}`);
    return false;
  }
  const before = fs.readFileSync(fullPath, 'utf8');
  const after = patchFn(before);
  if (after !== before) {
    fs.writeFileSync(fullPath, after, 'utf8');
    logStep('UPDATED', `Patched ${relPath}`);
    return true;
  }
  logStep('NO-OP', `${relPath} already contains target patch`);
  return false;
}

// ============================================================================
// PHASE 1: CRITICAL BUG FIXES, DATA SAFETY & ENVIRONMENT HARDENING
// ============================================================================

// 1.1 Safe LocalStorage Version Migration Helper (`src/utils/storageMigration.ts`)
writeNewFile(
  'src/utils/storageMigration.ts',
  `/**
 * Non-destructive localStorage migration helper for Khair NGO Platform.
 * Replaces blanket localStorage.clear() calls on SYSTEM_VERSION updates.
 */
export const KHAIR_VERSION_KEY = 'KHAIR_SYSTEM_VERSION';
export const KHAIR_STATE_PREFIX = 'KHAIR_APP_STATE_';

export function migrateKhairLocalStorage(currentVersion: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const savedVersion = localStorage.getItem(KHAIR_VERSION_KEY);
    if (savedVersion === currentVersion) return;

    let latestStatePayload: Record<string, unknown> | null = null;
    const staleStateKeys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith(KHAIR_STATE_PREFIX) &&
        key !== \`\${KHAIR_STATE_PREFIX}\${currentVersion}\`
      ) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              latestStatePayload = parsed as Record<string, unknown>;
            }
          }
        } catch {
          // Ignore malformed legacy state entry
        }
        staleStateKeys.push(key);
      }
    }

    staleStateKeys.forEach((key) => localStorage.removeItem(key));

    const targetKey = \`\${KHAIR_STATE_PREFIX}\${currentVersion}\`;
    if (latestStatePayload && !localStorage.getItem(targetKey)) {
      localStorage.setItem(targetKey, JSON.stringify(latestStatePayload));
    }

    localStorage.setItem(KHAIR_VERSION_KEY, currentVersion);
  } catch (err) {
    console.warn('[Khair] Storage migration warning:', err);
  }
}
`
);

// 1.2 Remove non-standard `html { zoom: 0.9; }` from `src/index.css`
patchExistingFile('src/index.css', (content) => {
  const withoutZoom = content.replace(
    /html\s*\{\s*zoom:\s*0\.9;?\s*\}/gi,
    `/* Standard responsive root scaling (fixes Leaflet coordinate & mobile viewport bugs) */
  html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
  }

  @media (min-width: 1024px) {
    html {
      font-size: 14.5px;
    }
  }`
  );
  return withoutZoom;
});

// 1.3 Patch `src/context/AppContext.tsx` to replace destructive `localStorage.clear()`
//     and add Phase 2 URL hash routing synchronization (`#dashboard`, `#beneficiaries`, etc.)
patchExistingFile('src/context/AppContext.tsx', (content) => {
  let updated = content;

  // Replace destructive localStorage.clear() during version check
  updated = updated.replace(
    /localStorage\.clear\(\);/g,
    `Object.keys(localStorage)
        .filter((k) => k.startsWith('KHAIR_APP_STATE_') && !k.includes(SYSTEM_VERSION))
        .forEach((k) => localStorage.removeItem(k));`
  );

  return updated;
});

// 1.4 Patch `src/views/GeoMapView.tsx` to ensure Leaflet map calls `invalidateSize()`
patchExistingFile('src/views/GeoMapView.tsx', (content) => {
  if (content.includes('ResizeObserver') && content.includes('invalidateSize')) {
    return content;
  }
  // Inject invalidateSize trigger when map instance is created
  return content.replace(
    /(L\.map\([^)]+\)[^;]*;)/,
    `$1\n    setTimeout(() => { try { map.invalidateSize({ animate: false }); } catch {} }, 150);`
  );
});

// ============================================================================
// PHASE 2: URL DEEP-LINKING & RTL/LTR LOGICAL SPACING MIGRATION
// ============================================================================

// 2.1 Create URL Hash Sync Hook (`src/utils/useUrlTabSync.ts`)
writeNewFile(
  'src/utils/useUrlTabSync.ts',
  `import { useEffect } from 'react';
import { NavTab } from '../types';

const VALID_TABS: ReadonlySet<NavTab> = new Set<NavTab>([
  'dashboard',
  'beneficiaries',
  'donors',
  'projects',
  'inventory',
  'finance',
  'volunteers',
  'geo',
  'documents',
  'audit',
  'settings',
]);

export function parseTabFromWindowHash(): NavTab | null {
  if (typeof window === 'undefined') return null;
  const cleaned = window.location.hash.replace(/^#\\/?/, '').trim().toLowerCase() as NavTab;
  return VALID_TABS.has(cleaned) ? cleaned : null;
}

export function useUrlTabSync(activeTab: NavTab, setActiveTab: (tab: NavTab) => void): void {
  useEffect(() => {
    const initialHashTab = parseTabFromWindowHash();
    if (initialHashTab && initialHashTab !== activeTab) {
      setActiveTab(initialHashTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const targetHash = \`#\${activeTab}\`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ tab: activeTab }, '', targetHash);
    }
  }, [activeTab]);

  useEffect(() => {
    const onHashOrPopState = () => {
      const nextTab = parseTabFromWindowHash();
      if (nextTab && nextTab !== activeTab) {
        setActiveTab(nextTab);
      }
    };
    window.addEventListener('hashchange', onHashOrPopState);
    window.addEventListener('popstate', onHashOrPopState);
    return () => {
      window.removeEventListener('hashchange', onHashOrPopState);
      window.removeEventListener('popstate', onHashOrPopState);
    };
  }, [activeTab, setActiveTab]);
}
`
);

// 2.2 Wire `useUrlTabSync` into `src/App.tsx`
patchExistingFile('src/App.tsx', (content) => {
  if (content.includes('useUrlTabSync')) return content;
  let updated = `import { useUrlTabSync } from './utils/useUrlTabSync';\n` + content;
  updated = updated.replace(
    /(const\s*\{[^}]*activeTab)([^}]*\}\s*=\s*useApp\(\);)/,
    `$1, setActiveTab$2\n  useUrlTabSync(activeTab, setActiveTab);`
  );
  return updated;
});

// 2.3 Migrate physical horizontal spacing classes to RTL/LTR logical utilities
const componentDirs = ['src/components', 'src/views'];
for (const relDir of componentDirs) {
  const fullDir = path.join(rootDir, relDir);
  if (!fs.existsSync(fullDir)) continue;
  for (const file of fs.readdirSync(fullDir)) {
    if (!file.endsWith('.tsx')) continue;
    patchExistingFile(path.join(relDir, file), (content) =>
      content
        .replace(/\bml-auto\b/g, 'ms-auto')
        .replace(/\bmr-auto\b/g, 'me-auto')
        .replace(/\bml-(\d+(?:\.\d+)?)\b/g, 'ms-$1')
        .replace(/\bmr-(\d+(?:\.\d+)?)\b/g, 'me-$1')
        .replace(/\bpl-(\d+(?:\.\d+)?)\b/g, 'ps-$1')
        .replace(/\bpr-(\d+(?:\.\d+)?)\b/g, 'pe-$1')
        .replace(/\btext-left\b/g, 'text-start')
        .replace(/\btext-right\b/g, 'text-end')
    );
  }
}

// ============================================================================
// PHASE 3 & 4: EXCEL STAGING HELPER & WCAG 2.1 AA FOCUS TRAP HOOK
// ============================================================================

// 3.1 Create Beneficiary Excel Duplicate & Staging Validator (`src/utils/excelStagingValidator.ts`)
writeNewFile(
  'src/utils/excelStagingValidator.ts',
  `import { ParseResult } from './excelBeneficiaryUtils';

export interface StagedExcelImportReport {
  fileName: string;
  validRows: ParseResult['valid'];
  duplicateRows: Array<{
    rowData: ParseResult['valid'][number];
    reason: string;
  }>;
  errorRows: ParseResult['errors'];
}

export function buildStagedExcelReport(
  fileName: string,
  parsed: ParseResult,
  existingBeneficiaries: Array<{ fullName?: string; name?: string; phone?: string }>,
  language: 'ckb' | 'ar' | 'en' = 'ckb'
): StagedExcelImportReport {
  const existingPhones = new Set(
    existingBeneficiaries
      .map((b) => (b.phone || '').replace(/\\D+/g, ''))
      .filter(Boolean)
  );
  const existingNames = new Set(
    existingBeneficiaries.map((b) => (b.fullName || b.name || '').trim().toLowerCase()).filter(Boolean)
  );

  const validRows: ParseResult['valid'] = [];
  const duplicateRows: StagedExcelImportReport['duplicateRows'] = [];

  for (const row of parsed.valid) {
    const cleanPhone = (row.phone || '').replace(/\\D+/g, '');
    const cleanName = (row.fullName || '').trim().toLowerCase();

    if (cleanPhone && existingPhones.has(cleanPhone)) {
      duplicateRows.push({
        rowData: row,
        reason:
          language === 'en'
            ? \`Duplicate phone number (\${row.phone})\`
            : \`ژمارەی مۆبایل دووبارەیە (\${row.phone})\`,
      });
    } else if (cleanName && existingNames.has(cleanName)) {
      duplicateRows.push({
        rowData: row,
        reason:
          language === 'en'
            ? \`Duplicate beneficiary name (\${row.fullName})\`
            : \`ناوی سوودمەند دووبارەیە (\${row.fullName})\`,
      });
    } else {
      validRows.push(row);
    }
  }

  return {
    fileName,
    validRows,
    duplicateRows,
    errorRows: parsed.errors,
  };
}
`
);

// 4.1 Create Accessible Modal Focus Trap Hook (`src/utils/useModalFocusTrap.ts`)
writeNewFile(
  'src/utils/useModalFocusTrap.ts',
  `import { useEffect, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocusTrap(
  isOpen: boolean,
  containerRef: RefObject<HTMLElement | null>,
  onClose?: () => void
): void {
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, containerRef, onClose]);
}
`
);

logStep(
  'COMPLETE',
  'All Phase 1–4 patches and utilities generated. Run "npm run build" to verify TypeScript and Vite bundle.'
);
