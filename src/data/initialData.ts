import {
  Beneficiary,
  Donor,
  Donation,
  Project,
  InventoryItem,
  FinancialTransaction,
  Volunteer,
  AppNotification,
  DocumentItem,
  AuditLog,
  GovernorateStats,
  Announcement,
  AutomatedReminder
} from '../types';

export const INITIAL_BENEFICIARIES: Beneficiary[] = [];

export const INITIAL_DONORS: Donor[] = [];

export const INITIAL_DONATIONS: Donation[] = [];

export const INITIAL_PROJECTS: Project[] = [];

export const INITIAL_INVENTORY: InventoryItem[] = [];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [];

export const INITIAL_VOLUNTEERS: Volunteer[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_DOCUMENTS: DocumentItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2026-03-03 00:00:00',
    userName: 'بەڕێوەبەری سیستەم',
    userRole: 'admin',
    action: 'دەستپێکردنی سیستەم لە سفرەوە',
    details: 'داتابەیسی ڕێکخراوی بۆتان بامۆکی بە فەرمی ئامادەکرا و سەرجەم تۆمارەکان لە سفرەوە دەستپێدەکەن',
    type: 'auth'
  }
];

export const GOVERNORATE_STATS: GovernorateStats[] = [
  {
    name: 'هەولێر',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 55, y: 40 }
  },
  {
    name: 'سلێمانی',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 72, y: 62 }
  },
  {
    name: 'دهۆک',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 30, y: 22 }
  },
  {
    name: 'هەڵەبجە',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 84, y: 76 }
  },
  {
    name: 'کەرکووک',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 52, y: 65 }
  },
  {
    name: 'گەرمیان',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 78, y: 88 }
  },
  {
    name: 'زاخۆ',
    beneficiariesCount: 0,
    totalAidDistributedIQD: 0,
    activeProjectsCount: 0,
    volunteersCount: 0,
    coordinates: { x: 22, y: 15 }
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [];

export const INITIAL_REMINDERS: AutomatedReminder[] = [];
