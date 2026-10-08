import { NavItemConfig } from '../types';

export const DEFAULT_NAV_CONFIGS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'داشبۆرد',
    englishLabel: 'Dashboard',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'beneficiaries',
    label: 'سوودمەندان',
    englishLabel: 'Beneficiaries',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'donors',
    label: 'بەخشەران',
    englishLabel: 'Donors',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'projects',
    label: 'پڕۆژەکان',
    englishLabel: 'Projects',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'inventory',
    label: 'کۆگا و دابەشکردن',
    englishLabel: 'Inventory',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'finance',
    label: 'دارایی',
    englishLabel: 'Finance',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization']
  },
  {
    id: 'volunteers',
    label: 'خۆبەخشان',
    englishLabel: 'Volunteers',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'geo',
    label: 'نەخشەی هاوکاری',
    englishLabel: 'Geo Map',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'documents',
    label: 'بەڵگەنامەکان',
    englishLabel: 'Documents',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization', 'user']
  },
  {
    id: 'audit',
    label: 'مێژووی چاودێری',
    englishLabel: 'Audit Log',
    isVisible: true,
    allowedRoles: ['developer', 'head_of_organization']
  },
  {
    id: 'settings',
    label: 'ڕێکخستنەکان',
    englishLabel: 'Settings',
    isVisible: true,
    allowedRoles: ['developer']
  }
];
