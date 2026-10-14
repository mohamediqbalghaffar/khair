import { useEffect } from 'react';
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
  const cleaned = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase() as NavTab;
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
    const targetHash = `#${activeTab}`;
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
