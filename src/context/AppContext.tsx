import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserRole,
  UserProfile,
  Beneficiary,
  BeneficiaryDocument,
  Donor,
  Donation,
  Project,
  InventoryItem,
  FinancialTransaction,
  Volunteer,
  AppNotification,
  DocumentItem,
  AuditLog,
  AidRecord,
  Announcement,
  AutomatedReminder,
  NavTab,
  NavItemConfig
} from '../types';
import { DEFAULT_NAV_CONFIGS } from '../data/navConfig';
import {
  INITIAL_BENEFICIARIES,
  INITIAL_DONORS,
  INITIAL_DONATIONS,
  INITIAL_PROJECTS,
  INITIAL_INVENTORY,
  INITIAL_TRANSACTIONS,
  INITIAL_VOLUNTEERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_REMINDERS
} from '../data/initialData';
import { getExchangeRateForDate, calcItemAmountInUSD, calcItemAmountInIQD, aggregateAmountsByDayRate } from '../utils/exchangeRates';
import { getDonationCashMetrics } from '../utils/donationDistributionUtils';
import {
  supabase,
  checkSupabaseConnection,
  strictSupabaseMutation,
  mapBeneficiaryToDb,
  mapBeneficiaryFromDb,
  mapDonorToDb,
  mapDonorFromDb,
  mapDonationToDb,
  mapDonationFromDb,
  mapProjectToDb,
  mapProjectFromDb,
  mapInventoryToDb,
  mapInventoryFromDb,
  mapTransactionToDb,
  mapTransactionFromDb,
  mapVolunteerToDb,
  mapVolunteerFromDb,
  mapDocumentToDb,
  mapDocumentFromDb,
  mapAuditLogToDb,
  mapAuditLogFromDb,
  safeSupabaseSync
} from '../services/supabase';
import {
  INITIAL_ADMIN_USER,
  ROLE_LABELS,
  authenticateUser,
  registerNewUser
} from '../services/auth';

export type { NavTab, NavItemConfig };

export interface MapFocusLocation {
  lat: number;
  lng: number;
  label?: string;
  beneficiaryId?: string;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  mapFocusLocation: MapFocusLocation | null;
  setMapFocusLocation: (loc: MapFocusLocation | null) => void;
  navigateToLocationOnMap: (lat: number, lng: number, label?: string, beneficiaryId?: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isAuthenticated: boolean;
  login: (identifier: string, passwordPlain: string) => Promise<{ success: boolean; user?: UserProfile; message?: string }>;
  signup: (fullName: string, email: string, passwordPlain: string, phone?: string, role?: UserRole) => Promise<{ success: boolean; user?: UserProfile; message?: string }>;
  logout: () => void;

  // Beneficiaries
  beneficiaries: Beneficiary[];
  addBeneficiary: (ben: Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>) => Promise<{ success: boolean; duplicate?: Beneficiary; message?: string }>;
  addBeneficiariesBulk: (bens: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>>) => Promise<{ added: number; skippedDuplicates: number; total: number; success: boolean; message?: string }>;
  updateBeneficiary: (ben: Beneficiary) => Promise<{ success: boolean; message?: string }>;
  deleteBeneficiary: (id: string) => Promise<{ success: boolean; message?: string }>;
  checkDuplicate: (nationalId: string, phone: string, excludeId?: string) => Beneficiary | undefined;
  addAidRecord: (beneficiaryId: string, record: Omit<AidRecord, 'id'>) => void;
  updateAidRecord: (beneficiaryId: string, aidRecordId: string, updatedRecord: Partial<AidRecord>) => boolean;
  deleteAidRecord: (beneficiaryId: string, aidRecordId: string) => boolean;
  bulkUpdateAidRecords: (updates: Array<{ beneficiaryId: string; aidRecordId: string; updatedData: Partial<AidRecord> }>) => boolean;
  addBeneficiaryDocument: (beneficiaryId: string, doc: Omit<BeneficiaryDocument, 'id' | 'uploadDate'>) => void;
  updateBeneficiaryDocument: (beneficiaryId: string, doc: BeneficiaryDocument) => void;
  deleteBeneficiaryDocument: (beneficiaryId: string, docId: string) => void;

  // Donors & Donations
  donors: Donor[];
  donations: Donation[];
  addDonor: (donor: Omit<Donor, 'id' | 'joinedDate' | 'totalDonationsIQD' | 'totalDonationsUSD'>) => void;
  updateDonor: (donor: Donor) => void;
  deleteDonor: (id: string) => void;
  addDonation: (donation: Omit<Donation, 'id' | 'receiptNumber' | 'status'>) => Donation;
  updateDonation: (donation: Donation) => void;
  deleteDonation: (id: string) => void;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'raisedBudgetUSD' | 'spentBudgetUSD' | 'beneficiariesCount' | 'volunteersCount'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;

  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  deleteInventoryItem: (id: string) => void;
  updateInventoryQuantity: (id: string, delta: number) => void;
  distributeAidFromInventory: (itemId: string, beneficiaryId: string, quantity: number, projectTitle: string) => boolean;
  distributeAidBulkFromInventory: (
    itemId: string,
    distributions: { beneficiaryId: string; quantity: number }[],
    projectTitle: string,
    notes?: string
  ) => boolean;
  distributeCashAidBulk: (
    donationIdOrReceipt: string,
    distributions: { beneficiaryId: string; amount: number }[],
    projectTitle: string,
    notes?: string
  ) => boolean;
  pendingDistributionDonationId: string | null;
  setPendingDistributionDonationId: (id: string | null) => void;
  openDistributionForDonation: (donationIdOrReceipt: string) => void;

  // Finance
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  currencyView: 'IQD' | 'USD';
  setCurrencyView: (c: 'IQD' | 'USD') => void;

  // Volunteers
  volunteers: Volunteer[];
  addVolunteer: (vol: Omit<Volunteer, 'id' | 'joinedDate' | 'hoursLogged' | 'badgeNumber'>) => void;
  deleteVolunteer: (id: string) => void;
  logVolunteerHours: (id: string, hours: number) => void;

  // Documents
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => void;
  deleteDocument: (id: string) => void;

  // Notifications & Communications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  sendSMS: (phone: string, recipientName: string, text: string) => void;
  sendSimulationSMS: (phone: string, recipientName: string, text: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];

  // Announcements & Automated Reminders (Feature 9)
  announcements: Announcement[];
  addAnnouncement: (title: string, content: string, tag: 'مەیدانی' | 'کۆبوونەوە' | 'پڕۆژەکان' | 'بەپەلە') => void;
  reminders: AutomatedReminder[];
  toggleReminder: (id: string) => void;
  addReminder: (title: string, details: string, dueDate: string, type: 'distribution' | 'followup' | 'inventory' | 'finance') => void;

  // Security (Feature 14)
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;

  // Technical Foundations (Feature 15)
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: (open: boolean) => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonData: string) => { success: boolean; message: string };
  resetAllData: () => void;
  clearToEmptyDatabase: () => void;
  isCloudConnected: boolean;
  isCloudSyncing: boolean;
  syncLocalDataToCloud: () => Promise<{ success: boolean; syncedCount: number; message: string }>;
  checkConnectionHealth: () => Promise<boolean>;

  // Navigation & Role Permissions (Feature 16)
  navConfigs: NavItemConfig[];
  updateNavConfig: (tabId: NavTab, updates: Partial<NavItemConfig>) => void;
  toggleNavSectionVisibility: (tabId: NavTab) => void;
  toggleRoleForNavSection: (tabId: NavTab, role: UserRole) => void;
  resetNavConfigs: () => void;
  isTabAllowedForRole: (tabId: NavTab, role: UserRole) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SYSTEM_VERSION = 'v5_clean_zero_production';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear legacy mock records from browser LocalStorage if version upgraded
  if (typeof window !== 'undefined') {
    const savedVer = localStorage.getItem('ngo_system_version');
    if (savedVer !== SYSTEM_VERSION) {
      localStorage.clear();
      localStorage.setItem('ngo_system_version', SYSTEM_VERSION);
    }
  }

  // Active user (Clean direct access with no sign-up or log-in required)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(INITIAL_ADMIN_USER);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Keep currentRole in sync with active user
  useEffect(() => {
    if (currentUser) {
      setCurrentRole(currentUser.role);
    }
  }, [currentUser]);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [pendingDistributionDonationId, setPendingDistributionDonationId] = useState<string | null>(null);

  const openDistributionForDonation = useCallback((donationIdOrReceipt: string) => {
    setPendingDistributionDonationId(donationIdOrReceipt);
    setActiveTab('inventory');
  }, []);

  const [mapFocusLocation, setMapFocusLocation] = useState<MapFocusLocation | null>(null);

  const navigateToLocationOnMap = (lat: number, lng: number, label?: string, beneficiaryId?: string) => {
    setMapFocusLocation({ lat, lng, label, beneficiaryId });
    setActiveTab('geo');
  };

  const [currencyView, setCurrencyView] = useState<'IQD' | 'USD'>('IQD');
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);

  // Load or initialize state from LocalStorage (starts from clean zero records)
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(() => {
    const saved = localStorage.getItem('ngo_beneficiaries');
    return saved ? JSON.parse(saved) : INITIAL_BENEFICIARIES;
  });

  const [donors, setDonors] = useState<Donor[]>(() => {
    const saved = localStorage.getItem('ngo_donors');
    return saved ? JSON.parse(saved) : INITIAL_DONORS;
  });

  const [donations, setDonations] = useState<Donation[]>(() => {
    const saved = localStorage.getItem('ngo_donations');
    return saved ? JSON.parse(saved) : INITIAL_DONATIONS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('ngo_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('ngo_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('ngo_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    const saved = localStorage.getItem('ngo_volunteers');
    return saved ? JSON.parse(saved) : INITIAL_VOLUNTEERS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('ngo_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('ngo_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ngo_audit_logs');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const clean = parsed
              .filter(item => item && item.id !== 'test' && item.id !== 'probe_audit_logs' && (item.action || item.details))
              .map(item => ({
                id: String(item.id || `log-${Date.now()}`),
                timestamp: String(item.timestamp || ''),
                userName: String(item.userName || item.user_name || 'سیستەم'),
                userRole: String(item.userRole || 'admin'),
                action: String(item.action || 'تۆماری چاودێری'),
                details: String(item.details || ''),
                type: (item.type || 'update') as AuditLog['type']
              }));
            if (clean.length > 0) return clean;
          }
        } catch (e) {
          // fallback
        }
      }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('ngo_announcements');
    return saved ? JSON.parse(saved) : INITIAL_ANNOUNCEMENTS;
  });

  const [reminders, setReminders] = useState<AutomatedReminder[]>(() => {
    const saved = localStorage.getItem('ngo_reminders');
    return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
  });

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(true);

  // Navigation & Role Permissions state
  const [navConfigs, setNavConfigs] = useState<NavItemConfig[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ngo_nav_configs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return DEFAULT_NAV_CONFIGS.map(def => {
              const found = parsed.find((p: any) => p && p.id === def.id);
              return found ? { ...def, ...found } : def;
            });
          }
        }
      } catch (e) {
        console.warn('Failed to parse saved nav configs', e);
      }
    }
    return DEFAULT_NAV_CONFIGS;
  });

  // Sync navConfigs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ngo_nav_configs', JSON.stringify(navConfigs));
      } catch (e) {
        console.error('Failed to save nav configs to localStorage', e);
      }
    }
  }, [navConfigs]);

  const updateNavConfig = useCallback((tabId: NavTab, updates: Partial<NavItemConfig>) => {
    setNavConfigs(prev =>
      prev.map(c => {
        if (c.id === tabId) {
          let updatedRoles = updates.allowedRoles !== undefined ? updates.allowedRoles : c.allowedRoles;
          if (c.id === 'settings' && !updatedRoles.includes('developer')) {
            updatedRoles = [...updatedRoles, 'developer'];
          }
          return { ...c, ...updates, allowedRoles: updatedRoles };
        }
        return c;
      })
    );
  }, []);

  const toggleNavSectionVisibility = useCallback((tabId: NavTab) => {
    setNavConfigs(prev =>
      prev.map(c => {
        if (c.id === tabId) {
          return { ...c, isVisible: !c.isVisible };
        }
        return c;
      })
    );
  }, []);

  const toggleRoleForNavSection = useCallback((tabId: NavTab, role: UserRole) => {
    setNavConfigs(prev =>
      prev.map(c => {
        if (c.id === tabId) {
          if (c.id === 'settings' && role === 'developer') {
            return c;
          }
          const exists = c.allowedRoles.includes(role);
          const nextRoles = exists
            ? c.allowedRoles.filter(r => r !== role)
            : [...c.allowedRoles, role];
          return { ...c, allowedRoles: nextRoles };
        }
        return c;
      })
    );
  }, []);

  const resetNavConfigs = useCallback(() => {
    setNavConfigs(DEFAULT_NAV_CONFIGS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ngo_nav_configs', JSON.stringify(DEFAULT_NAV_CONFIGS));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const isTabAllowedForRole = useCallback((tabId: NavTab, role: UserRole): boolean => {
    if (role === 'developer' && tabId === 'settings') {
      return true;
    }
    const config = navConfigs.find(c => c.id === tabId);
    if (!config) return true;
    if (!config.isVisible) return false;
    return config.allowedRoles.includes(role);
  }, [navConfigs]);

  // If current active tab is not allowed for the active role, auto-switch to first allowed tab
  useEffect(() => {
    if (!isTabAllowedForRole(activeTab, currentRole)) {
      const firstAllowed = navConfigs.find(c => isTabAllowedForRole(c.id, currentRole));
      if (firstAllowed) {
        setActiveTab(firstAllowed.id);
      }
    }
  }, [activeTab, currentRole, isTabAllowedForRole, navConfigs]);

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  /**
   * Health check to test Supabase reachability
   */
  const checkConnectionHealth = useCallback(async (): Promise<boolean> => {
    const isOnline = await checkSupabaseConnection();
    setIsCloudConnected(isOnline);
    return isOnline;
  }, []);

  /**
   * Comprehensive cloud data synchronizer & local cache reconciler:
   * - Pulls latest records from Supabase
   * - Uploads any local records that were stored on this device but missing in Supabase (e.g. initial 53 beneficiaries)
   * - Keeps state and localStorage in perfect parity
   */
  const syncLocalDataToCloud = useCallback(async (): Promise<{ success: boolean; syncedCount: number; message: string }> => {
    try {
      setIsCloudSyncing(true);
      const isOnline = await checkSupabaseConnection();
      setIsCloudConnected(isOnline);
      if (!isOnline) {
        return {
          success: false,
          syncedCount: 0,
          message: 'پەیوەندی لەگەڵ داتابەیسی سەرهێڵ (Supabase) بەردەست نییە.'
        };
      }

      // 1. Fetch remote data from all tables
      const [
        bensRes,
        donorsRes,
        donationsRes,
        projectsRes,
        inventoryRes,
        txRes,
        volunteersRes,
        docsRes,
        logsRes
      ] = await Promise.all([
        supabase.from('beneficiaries').select('*'),
        supabase.from('donors').select('*'),
        supabase.from('donations').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('volunteers').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('audit_logs').select('*')
      ]);

      let pushedBeneficiariesCount = 0;

      // 2. Beneficiaries Reconciliation
      if (!bensRes.error) {
        const remoteBens = (bensRes.data || []).map(mapBeneficiaryFromDb);
        const remoteIds = new Set(remoteBens.map(b => b.id));
        const remoteNationalIds = new Set(remoteBens.map(b => (b.nationalId || '').trim()).filter(Boolean));

        // Read directly from current localStorage to ensure we capture any unsynced records on this device
        const savedBensRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_beneficiaries') : null;
        const currentLocalBens: Beneficiary[] = savedBensRaw ? JSON.parse(savedBensRaw) : [];

        const missingInCloud = currentLocalBens.filter(
          lb => !remoteIds.has(lb.id) && (!lb.nationalId || !remoteNationalIds.has(lb.nationalId.trim()))
        );

        if (missingInCloud.length > 0) {
          console.log(`[Reconciliation]: Pushing ${missingInCloud.length} local beneficiaries to Supabase...`);
          for (let i = 0; i < missingInCloud.length; i += 50) {
            const batch = missingInCloud.slice(i, i + 50);
            const uploadRes = await supabase.from('beneficiaries').upsert(batch.map(mapBeneficiaryToDb));
            if (uploadRes.error) {
              console.error('Batch upload error:', uploadRes.error);
            } else {
              pushedBeneficiariesCount += batch.length;
            }
          }
          const merged = [...remoteBens, ...missingInCloud];
          setBeneficiaries(merged);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ngo_beneficiaries', JSON.stringify(merged));
          }
        } else {
          if (remoteBens.length > 0) {
            setBeneficiaries(remoteBens);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ngo_beneficiaries', JSON.stringify(remoteBens));
            }
          }
        }
      }

      // 3. Donors Reconciliation
      if (!donorsRes.error) {
        const remoteDonors = (donorsRes.data || []).map(mapDonorFromDb);
        const remoteIds = new Set(remoteDonors.map(d => d.id));
        const savedDonorsRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_donors') : null;
        const localDonors: Donor[] = savedDonorsRaw ? JSON.parse(savedDonorsRaw) : [];
        const missingInCloud = localDonors.filter(d => !remoteIds.has(d.id));

        if (missingInCloud.length > 0) {
          await supabase.from('donors').upsert(missingInCloud.map(mapDonorToDb));
          const merged = [...remoteDonors, ...missingInCloud];
          setDonors(merged);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_donors', JSON.stringify(merged));
        } else if (remoteDonors.length > 0) {
          setDonors(remoteDonors);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_donors', JSON.stringify(remoteDonors));
        }
      }

      // 4. Donations Reconciliation
      if (!donationsRes.error) {
        const remoteDonations = (donationsRes.data || []).map(mapDonationFromDb);
        const remoteIds = new Set(remoteDonations.map(d => d.id));
        const remoteReceipts = new Set(remoteDonations.map(d => d.receiptNumber).filter(Boolean));
        const savedDonationsRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_donations') : null;
        const localDonations: Donation[] = savedDonationsRaw ? JSON.parse(savedDonationsRaw) : [];
        
        const missingInCloud = localDonations.filter(
          d => !remoteIds.has(d.id) && (!d.receiptNumber || !remoteReceipts.has(d.receiptNumber))
        );

        if (missingInCloud.length > 0) {
          await supabase.from('donations').upsert(missingInCloud.map(mapDonationToDb));
          const merged = [...remoteDonations, ...missingInCloud];
          setDonations(merged);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_donations', JSON.stringify(merged));
        } else if (remoteDonations.length > 0) {
          setDonations(remoteDonations);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_donations', JSON.stringify(remoteDonations));
        }
      }

      // 5. Projects Reconciliation
      if (!projectsRes.error) {
        const remoteProjects = (projectsRes.data || []).map(mapProjectFromDb);
        const remoteIds = new Set(remoteProjects.map(p => p.id));
        const savedProjectsRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_projects') : null;
        const localProjects: Project[] = savedProjectsRaw ? JSON.parse(savedProjectsRaw) : [];
        const missingInCloud = localProjects.filter(p => !remoteIds.has(p.id));

        if (missingInCloud.length > 0) {
          await supabase.from('projects').upsert(missingInCloud.map(mapProjectToDb));
          const merged = [...remoteProjects, ...missingInCloud];
          setProjects(merged);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_projects', JSON.stringify(merged));
        } else if (remoteProjects.length > 0) {
          setProjects(remoteProjects);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_projects', JSON.stringify(remoteProjects));
        }
      }

      // 6. Inventory Reconciliation
      if (!inventoryRes.error) {
        const remoteInv = (inventoryRes.data || []).map(mapInventoryFromDb);
        const savedInvRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_inventory') : null;
        const localInv: InventoryItem[] = savedInvRaw ? JSON.parse(savedInvRaw) : [];

        const mergedMap = new Map<string, InventoryItem>();
        const seenReceipts = new Set<string>();
        const seenDonationIds = new Set<string>();

        // Remote inventory takes primary precedence
        for (const item of remoteInv) {
          if (item.sourceReceiptNumber && seenReceipts.has(item.sourceReceiptNumber)) continue;
          if (item.sourceDonationId && seenDonationIds.has(item.sourceDonationId)) continue;
          
          mergedMap.set(item.id, item);
          if (item.sourceReceiptNumber) seenReceipts.add(item.sourceReceiptNumber);
          if (item.sourceDonationId) seenDonationIds.add(item.sourceDonationId);
        }

        const missingInCloud: InventoryItem[] = [];
        for (const item of localInv) {
          if (mergedMap.has(item.id)) continue;
          if (item.sourceReceiptNumber && seenReceipts.has(item.sourceReceiptNumber)) continue;
          if (item.sourceDonationId && seenDonationIds.has(item.sourceDonationId)) continue;

          mergedMap.set(item.id, item);
          if (item.sourceReceiptNumber) seenReceipts.add(item.sourceReceiptNumber);
          if (item.sourceDonationId) seenDonationIds.add(item.sourceDonationId);
          missingInCloud.push(item);
        }

        if (missingInCloud.length > 0) {
          await supabase.from('inventory').upsert(missingInCloud.map(mapInventoryToDb));
        }

        const finalMerged = Array.from(mergedMap.values());
        setInventory(finalMerged);
        if (typeof window !== 'undefined') localStorage.setItem('ngo_inventory', JSON.stringify(finalMerged));
      }

      // 7. Transactions Reconciliation
      if (!txRes.error) {
        const remoteTx = (txRes.data || []).map(mapTransactionFromDb);
        const remoteIds = new Set(remoteTx.map(t => t.id));
        const remoteReceipts = new Set(remoteTx.filter(t => t.type === 'income').map(t => t.receiptNumber).filter(Boolean));
        const savedTxRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_transactions') : null;
        const localTx: FinancialTransaction[] = savedTxRaw ? JSON.parse(savedTxRaw) : [];
        
        const missingInCloud = localTx.filter(
          t => !remoteIds.has(t.id) && (t.type !== 'income' || !t.receiptNumber || !remoteReceipts.has(t.receiptNumber))
        );

        if (missingInCloud.length > 0) {
          await supabase.from('transactions').upsert(missingInCloud.map(mapTransactionToDb));
          const merged = [...remoteTx, ...missingInCloud];
          setTransactions(merged);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_transactions', JSON.stringify(merged));
        } else if (remoteTx.length > 0) {
          setTransactions(remoteTx);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_transactions', JSON.stringify(remoteTx));
        }
      }

      // 8. Volunteers Reconciliation
      if (!volunteersRes.error) {
        const remoteVols = (volunteersRes.data || []).map(mapVolunteerFromDb);
        const remoteIds = new Set(remoteVols.map(v => v.id));
        const savedVolsRaw = typeof window !== 'undefined' ? localStorage.getItem('ngo_volunteers') : null;
        const localVols: Volunteer[] = savedVolsRaw ? JSON.parse(savedVolsRaw) : [];
        const missingInCloud = localVols.filter(v => !remoteIds.has(v.id));

        if (missingInCloud.length > 0) {
          await supabase.from('volunteers').upsert(missingInCloud.map(mapVolunteerToDb));
          const merged = [...remoteVols, ...missingInCloud];
          setVolunteers(merged);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_volunteers', JSON.stringify(merged));
        } else if (remoteVols.length > 0) {
          setVolunteers(remoteVols);
          if (typeof window !== 'undefined') localStorage.setItem('ngo_volunteers', JSON.stringify(remoteVols));
        }
      }

      // 9. Documents & Logs
      if (!docsRes.error && docsRes.data && docsRes.data.length > 0) {
        setDocuments(docsRes.data.map(mapDocumentFromDb));
      }
      if (!logsRes.error && logsRes.data && logsRes.data.length > 0) {
        const validDbLogs = logsRes.data
          .filter((row: any) => row && row.id !== 'test' && row.id !== 'probe_audit_logs' && (row.action || row.details))
          .map(mapAuditLogFromDb);
        if (validDbLogs.length > 0) {
          setAuditLogs(validDbLogs);
          if (typeof window !== 'undefined') {
            localStorage.setItem('ngo_audit_logs', JSON.stringify(validDbLogs));
          }
        }
      }

      return {
        success: true,
        syncedCount: pushedBeneficiariesCount,
        message: pushedBeneficiariesCount > 0
          ? `سەرکەوتووانە (${pushedBeneficiariesCount}) دۆسیەی سوودمەند لەم ئامێرەوە ڕەوانەی داتابەیسی سەرهێڵ (Supabase) کران.`
          : 'هەموو داتاکان لەگەڵ داتابەیسی سەرهێڵ (Supabase) هاوکات و یەکخراون.'
      };
    } catch (err: any) {
      console.error('[Cloud Sync Error]:', err);
      return {
        success: false,
        syncedCount: 0,
        message: err?.message || 'هەڵە ڕوویدا لە کاتی هاوکاتکردن بە داتابەیس'
      };
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // Launch initial cloud fetch, network status listeners, and heartbeat
  useEffect(() => {
    let isMounted = true;
    checkConnectionHealth().then(online => {
      if (isMounted) setIsCloudConnected(online);
    });
    syncLocalDataToCloud();

    const handleOnline = () => {
      checkConnectionHealth();
      syncLocalDataToCloud();
    };
    const handleOffline = () => {
      setIsCloudConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', checkConnectionHealth);

    const interval = setInterval(() => {
      checkConnectionHealth();
    }, 20000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', checkConnectionHealth);
      clearInterval(interval);
    };
  }, [checkConnectionHealth, syncLocalDataToCloud]);

  // Realtime multi-client subscription across all open devices and tabs
  useEffect(() => {
    const channel = supabase
      .channel('app_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beneficiaries' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapBeneficiaryFromDb(payload.new);
          setBeneficiaries(prev => (prev.some(b => b.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = mapBeneficiaryFromDb(payload.new);
          setBeneficiaries(prev => prev.map(b => b.id === row.id ? row : b));
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id;
          if (delId) setBeneficiaries(prev => prev.filter(b => b.id !== delId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donors' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapDonorFromDb(payload.new);
          setDonors(prev => (prev.some(d => d.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = mapDonorFromDb(payload.new);
          setDonors(prev => prev.map(d => d.id === row.id ? row : d));
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id;
          if (delId) setDonors(prev => prev.filter(d => d.id !== delId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapDonationFromDb(payload.new);
          setDonations(prev => (prev.some(d => d.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = mapDonationFromDb(payload.new);
          setDonations(prev => prev.map(d => d.id === row.id ? row : d));
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id;
          if (delId) setDonations(prev => prev.filter(d => d.id !== delId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapProjectFromDb(payload.new);
          setProjects(prev => (prev.some(p => p.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = mapProjectFromDb(payload.new);
          setProjects(prev => prev.map(p => p.id === row.id ? row : p));
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id;
          if (delId) setProjects(prev => prev.filter(p => p.id !== delId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapInventoryFromDb(payload.new);
          setInventory(prev => (prev.some(i => i.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = mapInventoryFromDb(payload.new);
          setInventory(prev => prev.map(i => i.id === row.id ? row : i));
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id;
          if (delId) setInventory(prev => prev.filter(i => i.id !== delId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const row = mapTransactionFromDb(payload.new);
          setTransactions(prev => (prev.some(t => t.id === row.id) ? prev : [row, ...prev]));
        } else if (payload.eventType === 'UPDATE') {
          const row = mapTransactionFromDb(payload.new);
          setTransactions(prev => prev.map(t => t.id === row.id ? row : t));
        } else if (payload.eventType === 'DELETE') {
          const delId = payload.old?.id;
          if (delId) setTransactions(prev => prev.filter(t => t.id !== delId));
        }
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setIsCloudConnected(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('ngo_beneficiaries', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  useEffect(() => {
    localStorage.setItem('ngo_donors', JSON.stringify(donors));
  }, [donors]);

  useEffect(() => {
    localStorage.setItem('ngo_donations', JSON.stringify(donations));
  }, [donations]);

  useEffect(() => {
    localStorage.setItem('ngo_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('ngo_inventory', JSON.stringify(inventory));
  }, [inventory]);

  // Synchronize any in-kind donations into inventory records if not already present
  useEffect(() => {
    if (donations.length === 0) return;
    setInventory(prevInv => {
      const existingReceipts = new Set(prevInv.map(i => i.sourceReceiptNumber).filter(Boolean));
      const existingDonationIds = new Set(prevInv.map(i => i.sourceDonationId).filter(Boolean));
      const existingIds = new Set(prevInv.map(i => i.id));
      const missingItems: InventoryItem[] = [];

      donations.forEach(don => {
        if (
          don.category &&
          don.category !== 'cash' &&
          !existingReceipts.has(don.receiptNumber) &&
          !existingDonationIds.has(don.id) &&
          !existingIds.has(`inv-don-${don.id}`)
        ) {
          const invCategory =
            don.category === 'food_basket' ? 'خۆراک' :
            don.category === 'clothes' ? 'پۆشاک' :
            don.category === 'medical' ? 'پێداویستی پزیشکی' :
            don.category === 'heating_appliances' ? 'گەرمکەرەوە و سووتەمەنی' :
            don.category === 'student_supplies' ? 'پەروەردە و خوێندکاران' :
            don.category === 'qurbani_meat' ? 'قوربانی و گۆشت' : 'کەرەستە و کاڵا';

          const warehouseLocation = don.projectName && don.projectName.includes('کۆگا')
            ? don.projectName
            : 'هەولێر - کۆگای سەرەکی ڕێکخراو';

          const totalAlreadyDist = beneficiaries.reduce((total, ben) => {
            return total + (ben.aidHistory || [])
              .filter(aid =>
                aid.type === 'in-kind' && (
                  (aid.receiptNumber && aid.receiptNumber === don.receiptNumber) ||
                  (aid.receiptNumber && aid.receiptNumber === don.id)
                )
              )
              .reduce((sum, aid) => sum + (Number(aid.quantity) || 0), 0);
          }, 0);

          const newItem: InventoryItem = {
            id: `inv-don-${don.id}`,
            name: don.categoryLabel || 'کۆمەکی بەخشراو',
            category: invCategory,
            quantity: Math.max(0, (don.itemDetails?.quantity || 1) - totalAlreadyDist),
            unit: don.itemDetails?.unit || 'دانە',
            minAlertThreshold: 5,
            location: warehouseLocation,
            lastUpdated: don.date,
            sourceReceiptNumber: don.receiptNumber,
            sourceDonorName: don.donorName,
            sourceDonationId: don.id,
            donorId: don.donorId,
            estimatedMarketValue: don.itemDetails?.estimatedMarketValue || don.amount,
            contentsDescription: don.itemDetails?.contentsDescription,
            notes: don.notes
          };
          missingItems.push(newItem);
          safeSupabaseSync(supabase.from('inventory').upsert(mapInventoryToDb(newItem)));
        }
      });

      if (missingItems.length > 0) {
        return [...missingItems, ...prevInv];
      }
      return prevInv;
    });
  }, [donations, beneficiaries]);

  useEffect(() => {
    localStorage.setItem('ngo_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ngo_volunteers', JSON.stringify(volunteers));
  }, [volunteers]);

  useEffect(() => {
    localStorage.setItem('ngo_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('ngo_documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('ngo_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  /**
   * Computes live, 100% mathematically synchronized metrics for a project
   * using ground-truth donations, financial transactions, and beneficiaries.
   */
  const computeProjectLiveMetrics = (
    projectId: string,
    projectTitle: string,
    allDonations: Donation[],
    allTransactions: FinancialTransaction[],
    allBeneficiaries: Beneficiary[]
  ) => {
    const linkedDonations = allDonations.filter(d => d.projectId === projectId);
    const directIncomeTx = allTransactions.filter(
      t => t.relatedProjectId === projectId && t.type === 'income' && (!t.receiptNumber || !linkedDonations.some(d => d.receiptNumber === t.receiptNumber))
    );
    const linkedExpenses = allTransactions.filter(
      t => t.relatedProjectId === projectId && t.type === 'expense'
    );

    const donAgg = aggregateAmountsByDayRate(linkedDonations);
    const txIncomeAgg = aggregateAmountsByDayRate(directIncomeTx);
    const expAgg = aggregateAmountsByDayRate(linkedExpenses);

    const raisedUSD = Number((donAgg.totalUSD + txIncomeAgg.totalUSD).toFixed(2));
    const raisedIQD = donAgg.totalIQD + txIncomeAgg.totalIQD;
    const spentUSD = expAgg.totalUSD;
    const spentIQD = expAgg.totalIQD;

    const beneficiariesCount = allBeneficiaries.filter(b =>
      (b.aidHistory || []).some(a => a.projectTitle === projectTitle)
    ).length;

    return {
      raisedUSD,
      raisedIQD,
      spentUSD,
      spentIQD,
      beneficiariesCount
    };
  };

  /**
   * Computes live synchronized donation totals for a donor
   */
  const computeDonorLiveMetrics = (
    donorId: string,
    allDonations: Donation[]
  ) => {
    const donorDonations = allDonations.filter(d => d.donorId === donorId);
    const agg = aggregateAmountsByDayRate(donorDonations);
    return {
      totalDonationsIQD: agg.totalIQD,
      totalDonationsUSD: agg.totalUSD
    };
  };

  // Database Auto-Reconciliation on launch: cleans up orphaned data and heals any desynchronized figures from localStorage
  useEffect(() => {
    // 1. Purge orphaned transactions (income transactions tied to deleted donation receipts)
    const validReceiptNumbers = new Set(donations.map(d => d.receiptNumber).filter(Boolean));
    const sanitizedTransactions = transactions.filter(t => {
      if (t.type === 'income' && t.receiptNumber && !validReceiptNumbers.has(t.receiptNumber)) {
        return false;
      }
      return true;
    });

    if (sanitizedTransactions.length !== transactions.length) {
      setTransactions(sanitizedTransactions);
    }

    // 2. Purge orphaned inventory items & de-duplicate inventory
    const validDonationIds = new Set(donations.map(d => d.id));
    const seenInvIds = new Set<string>();
    const seenReceipts = new Set<string>();
    const seenDonationIds = new Set<string>();
    const sanitizedInventory: InventoryItem[] = [];

    for (const item of inventory) {
      // Purge orphaned items
      if (item.sourceDonationId && !validDonationIds.has(item.sourceDonationId)) continue;
      if (item.sourceReceiptNumber && !validReceiptNumbers.has(item.sourceReceiptNumber)) continue;

      // De-duplicate
      if (seenInvIds.has(item.id)) continue;
      if (item.sourceReceiptNumber && seenReceipts.has(item.sourceReceiptNumber)) continue;
      if (item.sourceDonationId && seenDonationIds.has(item.sourceDonationId)) continue;

      seenInvIds.add(item.id);
      if (item.sourceReceiptNumber) seenReceipts.add(item.sourceReceiptNumber);
      if (item.sourceDonationId) seenDonationIds.add(item.sourceDonationId);
      sanitizedInventory.push(item);
    }

    if (sanitizedInventory.length !== inventory.length) {
      setInventory(sanitizedInventory);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ngo_inventory', JSON.stringify(sanitizedInventory));
      }
    }

    // 3. Reconcile all projects' raised/spent budgets and beneficiary counts
    setProjects(prevProjects => {
      return prevProjects.map(p => {
        const m = computeProjectLiveMetrics(p.id, p.title, donations, sanitizedTransactions, beneficiaries);
        return {
          ...p,
          raisedBudgetUSD: m.raisedUSD,
          raisedBudgetIQD: m.raisedIQD,
          spentBudgetUSD: m.spentUSD,
          spentBudgetIQD: m.spentIQD,
          beneficiariesCount: m.beneficiariesCount
        };
      });
    });

    // 4. Reconcile all donors' total donations
    setDonors(prevDonors => {
      return prevDonors.map(d => {
        const m = computeDonorLiveMetrics(d.id, donations);
        return {
          ...d,
          totalDonationsIQD: m.totalDonationsIQD,
          totalDonationsUSD: m.totalDonationsUSD
        };
      });
    });
  }, []);

  // Helper to log audit actions
  const logAction = (action: string, details: string, type: AuditLog['type'] = 'create') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: currentUser ? currentUser.name : 'محمد ئیقبال',
      userRole: currentRole,
      action,
      details,
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
    safeSupabaseSync(supabase.from('audit_logs').insert(mapAuditLogToDb(newLog)));
  };

  // Check for duplicate beneficiary by nationalId or phone
  const checkDuplicate = (nationalId: string, phone: string, excludeId?: string): Beneficiary | undefined => {
    const cleanId = nationalId.trim();
    const cleanPhone = phone.trim();
    return beneficiaries.find(b => {
      if (excludeId && b.id === excludeId) return false;
      return (cleanId && b.nationalId === cleanId) || (cleanPhone && b.phone === cleanPhone);
    });
  };

  // Add Beneficiary with Strict Online Validation and Duplicate Detection
  const addBeneficiary = async (data: Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>) => {
    // 1. Strict connectivity check
    const isOnline = await checkConnectionHealth();
    if (!isOnline) {
      return {
        success: false,
        message: 'داخڵکردن ڕاگیراوە: پەیوەندی بە داتابەیسی سەرهێڵ (Supabase) نییە. بۆ ڕێگریکردن لە ونبوونی داتا لە نێوان ئامێرەکان، پێویستە ئینتەرنێت پەیوەست بێت.'
      };
    }

    const duplicate = checkDuplicate(data.nationalId, data.phone);
    if (duplicate) {
      const alertNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'ئاگاداری ساختەکاری: ناسنامەی دووبارە!',
        message: `هەوڵی تۆمارکردنی کەسێک درا بە ژمارەی ناسنامەی [${data.nationalId}] کە پێشتر بە ناوی [${duplicate.fullName}] تۆمارکراوە!`,
        type: 'duplicate',
        timestamp: 'دەستبەجێ',
        read: false,
        priority: 'high'
      };
      setNotifications(prev => [alertNotif, ...prev]);
      logAction('هۆشداری دووبارەبوونەوە', `هەوڵی تۆماری دووبارە بۆ [${data.fullName}] بە ژمارەی [${data.nationalId}] درا`, 'auth');
      return {
        success: false,
        duplicate,
        message: `ئەم کەسە یان ژمارە مۆبایلە پێشتر بە ناوی (${duplicate.fullName}) لە پارێزگای (${duplicate.governorate}) تۆمارکراوە!`
      };
    }

    const newBen: Beneficiary = {
      ...data,
      id: `ben-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: data.status || 'pending',
      documents: data.documents || [],
      registeredDate: new Date().toISOString().split('T')[0],
      aidHistory: []
    };

    // 2. Strict mutation to Supabase first
    const dbRes = await strictSupabaseMutation(
      supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(newBen)),
      'سوودمەند'
    );

    if (!dbRes.success) {
      return {
        success: false,
        message: dbRes.error || 'هەڵە لە تۆمارکردنی سوودمەند لە داتابەیسی سەرهێڵ'
      };
    }

    // 3. Only on confirmed Supabase success, update local state
    setBeneficiaries(prev => [newBen, ...prev]);
    logAction('تۆمارکردنی سوودمەند', `سوودمەند [${newBen.fullName}] لە داتابەیسی سەرهێڵ تۆمارکرا`);
    return { success: true };
  };

  const addBeneficiariesBulk = async (items: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>>) => {
    const isOnline = await checkConnectionHealth();
    if (!isOnline) {
      return {
        added: 0,
        skippedDuplicates: 0,
        total: items.length,
        success: false,
        message: 'داخڵکردنی بەکۆمەڵ ڕاگیراوە: پەیوەندی بە داتابەیسی سەرهێڵ (Supabase) بەردەست نییە.'
      };
    }

    let addedCount = 0;
    let skippedCount = 0;
    const newItems: Beneficiary[] = [];

    const existingNationalIds = new Set(beneficiaries.map(b => b.nationalId.trim()));
    const existingPhones = new Set(beneficiaries.map(b => b.phone.trim()));

    items.forEach((data, index) => {
      const cleanNationalId = (data.nationalId || '').toString().trim();
      const cleanPhone = (data.phone || '').toString().trim();

      if (!cleanNationalId || existingNationalIds.has(cleanNationalId) || (cleanPhone && existingPhones.has(cleanPhone))) {
        skippedCount++;
        return;
      }

      existingNationalIds.add(cleanNationalId);
      if (cleanPhone) existingPhones.add(cleanPhone);

      const newBen: Beneficiary = {
        ...data,
        id: `ben-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        status: data.status || 'pending',
        documents: data.documents || [],
        registeredDate: new Date().toISOString().split('T')[0],
        aidHistory: []
      };
      newItems.push(newBen);
      addedCount++;
    });

    if (newItems.length > 0) {
      // Chunked strict upload
      for (let i = 0; i < newItems.length; i += 50) {
        const chunk = newItems.slice(i, i + 50);
        const dbRes = await strictSupabaseMutation(
          supabase.from('beneficiaries').upsert(chunk.map(mapBeneficiaryToDb)),
          'هاوردەکردنی بەکۆمەڵ'
        );
        if (!dbRes.success) {
          return {
            added: 0,
            skippedDuplicates: skippedCount,
            total: items.length,
            success: false,
            message: dbRes.error
          };
        }
      }

      setBeneficiaries(prev => [...newItems, ...prev]);
      logAction('هاوردەکردنی بەکۆمەڵ', `ژمارەی (${addedCount}) سوودمەند لە داتابەیسی سەرهێڵ تۆمارکران`, 'create');
    }

    return { added: addedCount, skippedDuplicates: skippedCount, total: items.length, success: true };
  };

  const updateBeneficiary = async (updated: Beneficiary) => {
    const isOnline = await checkConnectionHealth();
    if (!isOnline) {
      return { success: false, message: 'دەستکاریکردن ڕاگیراوە: پەیوەندی بە داتابەیسی سەرهێڵ بەردەست نییە.' };
    }
    const dbRes = await strictSupabaseMutation(
      supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updated)),
      'دەستکاری سوودمەند'
    );
    if (!dbRes.success) {
      return { success: false, message: dbRes.error };
    }
    setBeneficiaries(prev => prev.map(b => b.id === updated.id ? { ...updated, documents: updated.documents || [] } : b));
    logAction('نوێکردنەوەی سوودمەند', `زانیارییەکانی [${updated.fullName}] لە داتابەیسی سەرهێڵ نوێکرایەوە`, 'update');
    return { success: true };
  };

  const deleteBeneficiary = async (id: string) => {
    const isOnline = await checkConnectionHealth();
    if (!isOnline) {
      return { success: false, message: 'سڕینەوە ڕاگیراوە: پەیوەندی بە داتابەیسی سەرهێڵ بەردەست نییە.' };
    }
    const target = beneficiaries.find(b => b.id === id);
    if (!target) return { success: false, message: 'سوودمەند نەدۆزرایەوە' };

    const dbRes = await strictSupabaseMutation(
      supabase.from('beneficiaries').delete().eq('id', id),
      'سڕینەوەی سوودمەند'
    );
    if (!dbRes.success) {
      return { success: false, message: dbRes.error };
    }

    const targetName = target.fullName;
    const nextBeneficiaries = beneficiaries.filter(b => b.id !== id);
    const nextTransactions = transactions.filter(t => {
      if (t.id.startsWith('tx-aid-') && (t.description.includes(targetName) || (target.id && t.description.includes(target.id)))) {
        return false;
      }
      return true;
    });

    const nextProjects = projects.map(p => {
      const m = computeProjectLiveMetrics(p.id, p.title, donations, nextTransactions, nextBeneficiaries);
      return {
        ...p,
        spentBudgetUSD: m.spentUSD,
        spentBudgetIQD: m.spentIQD,
        beneficiariesCount: m.beneficiariesCount
      };
    });

    setBeneficiaries(nextBeneficiaries);
    setTransactions(nextTransactions);
    setProjects(nextProjects);

    logAction('سڕینەوەی سوودمەند', `دۆسیەی [${target.fullName}] لە داتابەیسی سەرهێڵ سڕایەوە`, 'delete');
    return { success: true };
  };

  const addBeneficiaryDocument = (beneficiaryId: string, doc: Omit<BeneficiaryDocument, 'id' | 'uploadDate'>) => {
    const newDoc: BeneficiaryDocument = {
      ...doc,
      id: `bdoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };

    let updatedBeneficiary: Beneficiary | undefined;
    setBeneficiaries(prev => prev.map(b => {
      if (b.id === beneficiaryId) {
        const currentDocs = b.documents || [];
        updatedBeneficiary = { ...b, documents: [newDoc, ...currentDocs] };
        return updatedBeneficiary;
      }
      return b;
    }));

    if (updatedBeneficiary) {
      safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedBeneficiary)));
    }

    const targetBen = beneficiaries.find(b => b.id === beneficiaryId);
    // Mirror in global documents list
    addDocument({
      title: `${newDoc.title} (${targetBen?.fullName || 'سوودمەند'})`,
      category: newDoc.category === 'ڕاپۆرتی پزیشکی' ? 'ڕاپۆرتی پزیشکی' : 'ناسنامە',
      fileType: newDoc.fileType || 'بەڵگەنامە',
      fileSize: newDoc.fileSize || '1 MB',
      relatedEntity: targetBen?.fullName || 'سوودمەند'
    });

    logAction('بارکردنی بەڵگەنامەی سوودمەند', `بەڵگەنامەی [${newDoc.title}] بۆ دۆسیەی [${targetBen?.fullName || beneficiaryId}] زیادکرا`, 'create');
  };

  const updateBeneficiaryDocument = (beneficiaryId: string, doc: BeneficiaryDocument) => {
    let updatedBeneficiary: Beneficiary | undefined;
    setBeneficiaries(prev => prev.map(b => {
      if (b.id === beneficiaryId) {
        const updatedDocs = (b.documents || []).map(d => d.id === doc.id ? doc : d);
        updatedBeneficiary = { ...b, documents: updatedDocs };
        return updatedBeneficiary;
      }
      return b;
    }));
    if (updatedBeneficiary) {
      safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedBeneficiary)));
    }
    logAction('دەستکاریکردنی بەڵگەنامە', `زانیاری بەڵگەنامەی [${doc.title}] دەستکاری کرا`, 'update');
  };

  const deleteBeneficiaryDocument = (beneficiaryId: string, docId: string) => {
    let updatedBeneficiary: Beneficiary | undefined;
    setBeneficiaries(prev => prev.map(b => {
      if (b.id === beneficiaryId) {
        const filteredDocs = (b.documents || []).filter(d => d.id !== docId);
        updatedBeneficiary = { ...b, documents: filteredDocs };
        return updatedBeneficiary;
      }
      return b;
    }));
    if (updatedBeneficiary) {
      safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedBeneficiary)));
    }
    logAction('سڕینەوەی بەڵگەنامە', `بەڵگەنامە لە دۆسیەی سوودمەند سڕایەوە`, 'delete');
  };

  const addAidRecord = (beneficiaryId: string, record: Omit<AidRecord, 'id'>) => {
    const newRecord: AidRecord = {
      ...record,
      id: `aid-${Date.now()}`
    };

    let updatedTargetBen: Beneficiary | undefined;
    const nextBeneficiaries = beneficiaries.map(b => {
      if (b.id === beneficiaryId) {
        updatedTargetBen = {
          ...b,
          status: b.status || 'pending',
          aidHistory: [newRecord, ...b.aidHistory]
        };
        return updatedTargetBen;
      }
      return b;
    });
    setBeneficiaries(nextBeneficiaries);
    if (updatedTargetBen) {
      safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedTargetBen)));
    }

    const ben = beneficiaries.find(b => b.id === beneficiaryId);

    // Synchronize with Project to get matchedProjectId
    let matchedProjectId: string | undefined = undefined;
    if (record.projectTitle) {
      const targetProj = projects.find(p => p.title === record.projectTitle);
      if (targetProj) matchedProjectId = targetProj.id;
    }

    // Auto-record financial expense transaction if monetary aid
    let nextTransactions = transactions;
    if (record.type === 'monetary' && record.amountIQD && record.amountIQD > 0) {
      const aidDate = record.date || new Date().toISOString().split('T')[0];
      const dayRate = getExchangeRateForDate(aidDate).rate;
      const aidTx: FinancialTransaction = {
        id: `tx-aid-${Date.now()}`,
        type: 'expense',
        amount: record.amountIQD,
        currency: 'IQD',
        exchangeRateAtDate: dayRate,
        convertedAmount: Number((record.amountIQD / dayRate).toFixed(2)),
        category: 'هاوکاری نەختینەیی سوودمەند',
        date: aidDate,
        description: `هاوکاری نەختینەیی بۆ [${ben?.fullName || 'سوودمەند'}] - ${record.projectTitle}`,
        recordedBy: record.distributedBy || (currentUser ? currentUser.name : 'محمد ئیقبال'),
        relatedProjectId: matchedProjectId,
        receiptNumber: record.receiptNumber,
        isCash: true
      };
      nextTransactions = [aidTx, ...transactions];
      setTransactions(nextTransactions);
      safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(aidTx)));
    }

    // Reconcile projects live metrics
    setProjects(prevProjects => prevProjects.map(p => {
      const m = computeProjectLiveMetrics(p.id, p.title, donations, nextTransactions, nextBeneficiaries);
      const updatedP = {
        ...p,
        beneficiariesCount: m.beneficiariesCount,
        spentBudgetUSD: m.spentUSD,
        spentBudgetIQD: m.spentIQD
      };
      safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(updatedP)));
      return updatedP;
    }));

    logAction('دابەشکردنی هاوکاری', `هاوکاری لە پڕۆژەی [${record.projectTitle}] بەخشرا بە [${ben?.fullName}]`);
  };

  const updateAidRecord = (
    beneficiaryId: string,
    aidRecordId: string,
    updatedData: Partial<AidRecord>
  ): boolean => {
    let oldAid: AidRecord | undefined;
    let targetBen: Beneficiary | undefined;

    const nextBeneficiaries = beneficiaries.map(b => {
      if (b.id === beneficiaryId) {
        targetBen = b;
        const nextHistory = (b.aidHistory || []).map(aid => {
          if (aid.id === aidRecordId) {
            oldAid = aid;
            const effectiveCurrency = updatedData.currency || aid.currency || 'IQD';
            const isIQD = effectiveCurrency === 'IQD';
            const newAmount = updatedData.amount !== undefined
              ? updatedData.amount
              : (updatedData.amountIQD !== undefined ? updatedData.amountIQD : (aid.amount || aid.amountIQD || 0));
            const newAmountIQD = isIQD ? newAmount : (updatedData.amountIQD || aid.amountIQD);

            return {
              ...aid,
              ...updatedData,
              amount: newAmount,
              amountIQD: newAmountIQD,
              currency: effectiveCurrency
            };
          }
          return aid;
        });
        const updatedB: Beneficiary = {
          ...b,
          aidHistory: nextHistory
        };
        safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedB)));
        return updatedB;
      }
      return b;
    });

    if (!oldAid || !targetBen) return false;
    setBeneficiaries(nextBeneficiaries);

    // If linked to a donation receipt, recalculate consolidated distribution financial transaction
    const receiptNum = updatedData.receiptNumber || oldAid.receiptNumber;
    if (receiptNum) {
      const linkedAids = nextBeneficiaries.flatMap(b =>
        (b.aidHistory || []).filter(aid =>
          aid.type === 'monetary' &&
          (aid.receiptNumber === receiptNum || (aid.donationId && aid.donationId === (updatedData.donationId || oldAid?.donationId)))
        )
      );
      const totalDistributedAmt = linkedAids.reduce((sum, a) => sum + (a.amount || a.amountIQD || 0), 0);

      const nextTransactions = transactions.map(tx => {
        if (tx.receiptNumber === receiptNum && tx.type === 'expense') {
          const isIQD = tx.currency === 'IQD';
          const dayRate = tx.exchangeRateAtDate || 1530;
          const totalIQD = isIQD ? totalDistributedAmt : Math.round(totalDistributedAmt * dayRate);
          const totalUSD = isIQD ? Number((totalDistributedAmt / dayRate).toFixed(2)) : totalDistributedAmt;
          const updatedTx: FinancialTransaction = {
            ...tx,
            amount: totalDistributedAmt,
            convertedAmount: isIQD ? totalUSD : totalIQD,
            description: `دابەشکردنی هاوکاری نەختینەیی (${totalDistributedAmt.toLocaleString()} ${isIQD ? 'د.ع' : '$'}) بەسەر ${linkedAids.length} خێزانی سوودمەند لە پسوولەی ${receiptNum}`
          };
          safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(updatedTx)));
          return updatedTx;
        }
        return tx;
      });
      setTransactions(nextTransactions);
    }

    logAction('دەستکاریکردنی هاوکاری', `دەستکاری تۆماری هاوکاری بۆ [${targetBen.fullName}] ئەنجامدرا`, 'update');
    return true;
  };

  const bulkUpdateAidRecords = (
    updates: Array<{ beneficiaryId: string; aidRecordId: string; updatedData: Partial<AidRecord> }>
  ): boolean => {
    if (updates.length === 0) return false;

    const updatesMap = new Map<string, Map<string, Partial<AidRecord>>>();
    const affectedReceipts = new Set<string>();

    updates.forEach(u => {
      if (!updatesMap.has(u.beneficiaryId)) {
        updatesMap.set(u.beneficiaryId, new Map());
      }
      updatesMap.get(u.beneficiaryId)!.set(u.aidRecordId, u.updatedData);
      if (u.updatedData.receiptNumber) affectedReceipts.add(u.updatedData.receiptNumber);
    });

    const nextBeneficiaries = beneficiaries.map(b => {
      const benUpdates = updatesMap.get(b.id);
      if (!benUpdates) return b;

      const nextHistory = (b.aidHistory || []).map(aid => {
        const uData = benUpdates.get(aid.id);
        if (!uData) return aid;

        if (aid.receiptNumber) affectedReceipts.add(aid.receiptNumber);
        const effectiveCurrency = uData.currency || aid.currency || 'IQD';
        const isIQD = effectiveCurrency === 'IQD';
        const newAmount = uData.amount !== undefined
          ? uData.amount
          : (uData.amountIQD !== undefined ? uData.amountIQD : (aid.amount || aid.amountIQD || 0));
        const newAmountIQD = isIQD ? newAmount : (uData.amountIQD || aid.amountIQD);

        return {
          ...aid,
          ...uData,
          amount: newAmount,
          amountIQD: newAmountIQD,
          currency: effectiveCurrency
        };
      });

      const updatedB: Beneficiary = {
        ...b,
        aidHistory: nextHistory
      };
      safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedB)));
      return updatedB;
    });

    setBeneficiaries(nextBeneficiaries);

    // Recalculate transactions for all affected receipts
    let nextTransactions = transactions;
    affectedReceipts.forEach(receiptNum => {
      const linkedAids = nextBeneficiaries.flatMap(b =>
        (b.aidHistory || []).filter(aid => aid.type === 'monetary' && aid.receiptNumber === receiptNum)
      );
      const totalDistributedAmt = linkedAids.reduce((sum, a) => sum + (a.amount || a.amountIQD || 0), 0);

      nextTransactions = nextTransactions.map(tx => {
        if (tx.receiptNumber === receiptNum && tx.type === 'expense') {
          const isIQD = tx.currency === 'IQD';
          const dayRate = tx.exchangeRateAtDate || 1530;
          const totalIQD = isIQD ? totalDistributedAmt : Math.round(totalDistributedAmt * dayRate);
          const totalUSD = isIQD ? Number((totalDistributedAmt / dayRate).toFixed(2)) : totalDistributedAmt;
          const updatedTx: FinancialTransaction = {
            ...tx,
            amount: totalDistributedAmt,
            convertedAmount: isIQD ? totalUSD : totalIQD,
            description: `دابەشکردنی هاوکاری نەختینەیی (${totalDistributedAmt.toLocaleString()} ${isIQD ? 'د.ع' : '$'}) بەسەر ${linkedAids.length} خێزانی سوودمەند لە پسوولەی ${receiptNum}`
          };
          safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(updatedTx)));
          return updatedTx;
        }
        return tx;
      });
    });
    setTransactions(nextTransactions);

    logAction('دەستکاریکردنی بەکۆمەڵی هاوکاری', `${updates.length} تۆماری هاوکاری نوێکرانەوە`, 'update');
    return true;
  };

  const deleteAidRecord = (
    beneficiaryId: string,
    aidRecordId: string
  ): boolean => {
    let deletedAid: AidRecord | undefined;
    let targetBen: Beneficiary | undefined;

    const nextBeneficiaries = beneficiaries.map(b => {
      if (b.id === beneficiaryId) {
        targetBen = b;
        deletedAid = (b.aidHistory || []).find(a => a.id === aidRecordId);
        const nextHistory = (b.aidHistory || []).filter(a => a.id !== aidRecordId);
        const updatedB: Beneficiary = {
          ...b,
          aidHistory: nextHistory
        };
        safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedB)));
        return updatedB;
      }
      return b;
    });

    if (!deletedAid || !targetBen) return false;
    setBeneficiaries(nextBeneficiaries);

    // If receiptNumber is linked, recalculate consolidated distribution transaction
    const receiptNum = deletedAid.receiptNumber;
    if (receiptNum) {
      const linkedAids = nextBeneficiaries.flatMap(b =>
        (b.aidHistory || []).filter(aid => aid.type === 'monetary' && aid.receiptNumber === receiptNum)
      );
      const totalDistributedAmt = linkedAids.reduce((sum, a) => sum + (a.amount || a.amountIQD || 0), 0);

      const nextTransactions = transactions.map(tx => {
        if (tx.receiptNumber === receiptNum && tx.type === 'expense') {
          const isIQD = tx.currency === 'IQD';
          const dayRate = tx.exchangeRateAtDate || 1530;
          const totalIQD = isIQD ? totalDistributedAmt : Math.round(totalDistributedAmt * dayRate);
          const totalUSD = isIQD ? Number((totalDistributedAmt / dayRate).toFixed(2)) : totalDistributedAmt;
          const updatedTx: FinancialTransaction = {
            ...tx,
            amount: totalDistributedAmt,
            convertedAmount: isIQD ? totalUSD : totalIQD,
            description: `دابەشکردنی هاوکاری نەختینەیی (${totalDistributedAmt.toLocaleString()} ${isIQD ? 'د.ع' : '$'}) بەسەر ${linkedAids.length} خێزانی سوودمەند لە پسوولەی ${receiptNum}`
          };
          safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(updatedTx)));
          return updatedTx;
        }
        return tx;
      });
      setTransactions(nextTransactions);
    }

    logAction('سڕینەوەی تۆماری هاوکاری', `تۆماری هاوکاری بۆ [${targetBen.fullName}] سڕایەوە`, 'delete');
    return true;
  };

  // Donors & Donations
  const addDonor = (data: Omit<Donor, 'id' | 'joinedDate' | 'totalDonationsIQD' | 'totalDonationsUSD'>) => {
    const newDonor: Donor = {
      ...data,
      id: `donor-${Date.now()}`,
      totalDonationsIQD: 0,
      totalDonationsUSD: 0,
      status: 'active',
      joinedDate: new Date().toISOString().split('T')[0]
    };
    setDonors(prev => [newDonor, ...prev]);
    safeSupabaseSync(supabase.from('donors').upsert(mapDonorToDb(newDonor)));
    logAction('تۆمارکردنی بەخشەر', `بەخشەری نوێ [${newDonor.fullName}] زیادکرا`);
  };

  const addDonation = (data: Omit<Donation, 'id' | 'receiptNumber' | 'status'>): Donation => {
    const count = donations.length + 1;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
    
    const newDonation: Donation = {
      ...data,
      id: `don-${Date.now()}`,
      receiptNumber,
      status: 'completed'
    };

    setDonations(prev => [newDonation, ...prev]);
    safeSupabaseSync(supabase.from('donations').upsert(mapDonationToDb(newDonation)));

    // Update Donor total
    const itemIQD = calcItemAmountInIQD(newDonation);
    const itemUSD = calcItemAmountInUSD(newDonation);

    setDonors(prev => prev.map(d => {
      if (d.id === data.donorId) {
        const updatedDonor = {
          ...d,
          totalDonationsIQD: d.totalDonationsIQD + itemIQD,
          totalDonationsUSD: Number((d.totalDonationsUSD + itemUSD).toFixed(2))
        };
        safeSupabaseSync(supabase.from('donors').upsert(mapDonorToDb(updatedDonor)));
        return updatedDonor;
      }
      return d;
    }));

    // Auto-create income transaction in financial ledger
    const isInKind = data.category && data.category !== 'cash';
    const donQty = data.itemDetails?.quantity || 1;
    const unitPrice = data.itemDetails?.unitPrice || (isInKind && donQty > 0 ? Math.round(data.amount / donQty) : undefined);

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type: 'income',
      amount: data.amount,
      currency: data.currency,
      exchangeRateAtDate: newDonation.exchangeRateAtDate || getExchangeRateForDate(data.date).rate,
      convertedAmount: newDonation.convertedAmount,
      category: isInKind ? 'بەخشینی کەرەستە و کاڵا (عەینی)' : `بەخشینی ${data.method}`,
      date: data.date,
      description: isInKind && data.itemDetails
        ? `بەخشینی فەرمی [${data.categoryLabel || 'کۆمەک'}] لەلایەن [${data.donorName}] - ${data.itemDetails.quantity} ${data.itemDetails.unit || 'دانە'} (هەر دانەیەک ${(unitPrice || 0).toLocaleString()} ${data.currency === 'IQD' ? 'د.ع' : '$'}) بە پسوولەی ${receiptNumber}`
        : `بەخشینی فەرمی لەلایەن [${data.donorName}] بە پسوولەی ${receiptNumber}`,
      recordedBy: currentUser ? currentUser.name : 'محمد ئیقبال',
      relatedProjectId: data.projectId,
      receiptNumber,
      isCash: !isInKind,
      itemQuantity: isInKind ? data.itemDetails?.quantity : undefined,
      itemUnit: isInKind ? data.itemDetails?.unit : undefined,
      itemUnitPrice: unitPrice
    };
    setTransactions(prev => [newTx, ...prev]);
    safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(newTx)));

    // Synchronize with Project raised budget
    if (data.projectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === data.projectId) {
          const m = computeProjectLiveMetrics(p.id, p.title, [newDonation, ...donations], [newTx, ...transactions], beneficiaries);
          return {
            ...p,
            raisedBudgetUSD: m.raisedUSD,
            raisedBudgetIQD: m.raisedIQD
          };
        }
        return p;
      }));
    }

    // Auto-create inventory item for in-kind donations
    if (isInKind) {
      const invCategory =
        data.category === 'food_basket' ? 'خۆراک' :
        data.category === 'clothes' ? 'پۆشاک' :
        data.category === 'medical' ? 'پێداویستی پزیشکی' :
        data.category === 'heating_appliances' ? 'گەرمکەرەوە و سووتەمەنی' :
        data.category === 'student_supplies' ? 'پەروەردە و خوێندکاران' :
        data.category === 'qurbani_meat' ? 'قوربانی و گۆشت' : 'کەرەستە و کاڵا';

      const warehouseLocation = data.projectName && data.projectName.includes('کۆگا')
        ? data.projectName
        : 'هەولێر - کۆگای سەرەکی ڕێکخراو';

      const newInvItem: InventoryItem = {
        id: `inv-don-${newDonation.id}`,
        name: data.categoryLabel || 'کۆمەکی بەخشراو',
        category: invCategory,
        quantity: donQty,
        unit: data.itemDetails?.unit || 'دانە',
        minAlertThreshold: 5,
        location: warehouseLocation,
        lastUpdated: data.date,
        sourceReceiptNumber: receiptNumber,
        sourceDonorName: data.donorName,
        sourceDonationId: newDonation.id,
        donorId: data.donorId,
        unitPrice: unitPrice,
        estimatedMarketValue: data.amount || (donQty * (unitPrice || 0)),
        contentsDescription: data.itemDetails?.contentsDescription,
        notes: data.notes
      };

      setInventory(prev => {
        if (prev.some(i => i.id === newInvItem.id || i.sourceDonationId === newDonation.id || (i.sourceReceiptNumber && i.sourceReceiptNumber === receiptNumber))) {
          return prev;
        }
        return [newInvItem, ...prev];
      });
      safeSupabaseSync(supabase.from('inventory').upsert(mapInventoryToDb(newInvItem)));
      logAction('تۆمار لە کۆگا', `کەرەستەی بەخشراو [${newInvItem.name}] بە بڕی (${newInvItem.quantity} ${newInvItem.unit}) لە پسوولەی ${receiptNumber} خرایە کۆگاوە`, 'create');
    }

    logAction('تۆمارکردنی بەخشین', `بڕی ${data.amount.toLocaleString()} ${data.currency} لەلایەن [${data.donorName}] بەخشرا`);
    return newDonation;
  };

  const updateDonor = (updated: Donor) => {
    setDonors(prev => prev.map(d => d.id === updated.id ? updated : d));
    setDonations(prev => prev.map(don => don.donorId === updated.id ? { ...don, donorName: updated.fullName } : don));
    setInventory(prev => prev.map(inv => inv.donorId === updated.id ? { ...inv, sourceDonorName: updated.fullName } : inv));
    safeSupabaseSync(supabase.from('donors').upsert(mapDonorToDb(updated)));
    logAction('نوێکردنەوەی بەخشەر', `زانیارییەکانی بەخشەر [${updated.fullName}] نوێکرایەوە`, 'update');
  };

  const deleteDonor = (id: string) => {
    const targetDonor = donors.find(item => item.id === id);
    if (!targetDonor) return;

    // 1. Collect all donations belonging to this donor
    const donorDonations = donations.filter(d => d.donorId === id);
    const receiptNumbers = new Set(donorDonations.map(d => d.receiptNumber).filter(Boolean));
    const donationIds = new Set(donorDonations.map(d => d.id));

    // 2. Cascade delete donations
    const nextDonations = donations.filter(d => d.donorId !== id);

    // 3. Cascade delete financial transactions created by these donation receipts
    const nextTransactions = transactions.filter(t => !t.receiptNumber || !receiptNumbers.has(t.receiptNumber));

    // 4. Cascade delete inventory items created by these donations or tied to this donor
    const nextInventory = inventory.filter(i =>
      i.donorId !== id &&
      (!i.sourceReceiptNumber || !receiptNumbers.has(i.sourceReceiptNumber)) &&
      (!i.sourceDonationId || !donationIds.has(i.sourceDonationId))
    );

    // 5. Cascade recalculate project budgets with remaining donations & transactions
    const nextProjects = projects.map(p => {
      const m = computeProjectLiveMetrics(p.id, p.title, nextDonations, nextTransactions, beneficiaries);
      return {
        ...p,
        raisedBudgetUSD: m.raisedUSD,
        raisedBudgetIQD: m.raisedIQD,
        spentBudgetUSD: m.spentUSD,
        spentBudgetIQD: m.spentIQD,
        beneficiariesCount: m.beneficiariesCount
      };
    });

    // 6. Delete donor
    const nextDonors = donors.filter(item => item.id !== id);

    // Apply all atomic updates
    setDonors(nextDonors);
    setDonations(nextDonations);
    setTransactions(nextTransactions);
    setInventory(nextInventory);
    setProjects(nextProjects);

    safeSupabaseSync(supabase.from('donors').delete().eq('id', id));
    safeSupabaseSync(supabase.from('donations').delete().eq('donor_id', id));

    logAction('سڕینەوەی بەخشەر', `بەخشەر [${targetDonor.fullName}] و (${donorDonations.length}) پسوولەی بەخشین لە سیستەم سڕانەوە و بودجەی پڕۆژەکان نوێکرانەوە`, 'delete');
  };

  const updateDonation = (updated: Donation) => {
    const oldDonation = donations.find(d => d.id === updated.id);
    if (!oldDonation) return;

    const nextDonations = donations.map(d => d.id === updated.id ? updated : d);
    setDonations(nextDonations);
    safeSupabaseSync(supabase.from('donations').upsert(mapDonationToDb(updated)));

    // Update Financial Transaction if exists
    const isInKind = updated.category && updated.category !== 'cash';
    const wasInKind = oldDonation.category && oldDonation.category !== 'cash';
    const newDonationQty = updated.itemDetails?.quantity || 1;
    const unitPrice = updated.itemDetails?.unitPrice || (isInKind && newDonationQty > 0 ? Math.round(updated.amount / newDonationQty) : undefined);

    let updatedTx: FinancialTransaction | undefined;
    const nextTransactions = transactions.map(tx => {
      if (tx.receiptNumber === updated.receiptNumber && tx.type === 'income') {
        updatedTx = {
          ...tx,
          amount: updated.amount,
          currency: updated.currency,
          exchangeRateAtDate: updated.exchangeRateAtDate || getExchangeRateForDate(updated.date).rate,
          convertedAmount: updated.convertedAmount,
          date: updated.date,
          category: isInKind ? 'بەخشینی کەرەستە و کاڵا (عەینی)' : `بەخشینی ${updated.method}`,
          description: isInKind && updated.itemDetails
            ? `بەخشینی فەرمی [${updated.categoryLabel || 'کۆمەک'}] لەلایەن [${updated.donorName}] - ${updated.itemDetails.quantity} ${updated.itemDetails.unit || 'دانە'} (هەر دانەیەک ${(unitPrice || 0).toLocaleString()} ${updated.currency === 'IQD' ? 'د.ع' : '$'}) بە پسوولەی ${updated.receiptNumber}`
            : `بەخشینی فەرمی لەلایەن [${updated.donorName}] بە پسوولەی ${updated.receiptNumber}`,
          relatedProjectId: updated.projectId,
          isCash: !isInKind,
          itemQuantity: isInKind ? updated.itemDetails?.quantity : undefined,
          itemUnit: isInKind ? updated.itemDetails?.unit : undefined,
          itemUnitPrice: unitPrice
        };
        return updatedTx;
      }
      return tx;
    });
    setTransactions(nextTransactions);
    if (updatedTx) {
      safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(updatedTx)));
    }

    // Synchronize Donors
    setDonors(prev => prev.map(d => {
      const m = computeDonorLiveMetrics(d.id, nextDonations);
      const updatedDonor = {
        ...d,
        totalDonationsIQD: m.totalDonationsIQD,
        totalDonationsUSD: m.totalDonationsUSD
      };
      if (d.id === updated.donorId || d.id === oldDonation.donorId) {
        safeSupabaseSync(supabase.from('donors').upsert(mapDonorToDb(updatedDonor)));
      }
      return updatedDonor;
    }));

    // Synchronize Projects
    setProjects(prev => prev.map(p => {
      const m = computeProjectLiveMetrics(p.id, p.title, nextDonations, nextTransactions, beneficiaries);
      const updatedP = {
        ...p,
        raisedBudgetUSD: m.raisedUSD,
        raisedBudgetIQD: m.raisedIQD,
        spentBudgetUSD: m.spentUSD,
        spentBudgetIQD: m.spentIQD,
        beneficiariesCount: m.beneficiariesCount
      };
      if (p.id === updated.projectId || p.id === oldDonation.projectId) {
        safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(updatedP)));
      }
      return updatedP;
    }));

    // Synchronize with Inventory
    if (isInKind) {
      const invCategory =
        updated.category === 'food_basket' ? 'خۆراک' :
        updated.category === 'clothes' ? 'پۆشاک' :
        updated.category === 'medical' ? 'پێداویستی پزیشکی' :
        updated.category === 'heating_appliances' ? 'گەرمکەرەوە و سووتەمەنی' :
        updated.category === 'student_supplies' ? 'پەروەردە و خوێندکاران' :
        updated.category === 'qurbani_meat' ? 'قوربانی و گۆشت' : 'کەرەستە و کاڵا';

      const warehouseLocation = updated.projectName && updated.projectName.includes('کۆگا')
        ? updated.projectName
        : 'هەولێر - کۆگای سەرەکی بەحرکە';

      // CRITICAL: Calculate how much has already been distributed from this inventory item
      // by scanning all beneficiary aid history records linked to this receipt/donation
      const totalAlreadyDistributed = beneficiaries.reduce((total, ben) => {
        return total + (ben.aidHistory || [])
          .filter(aid =>
            aid.type === 'in-kind' && (
              (aid.receiptNumber && aid.receiptNumber === (oldDonation.receiptNumber || updated.receiptNumber)) ||
              (aid.receiptNumber && aid.receiptNumber === updated.receiptNumber)
            )
          )
          .reduce((sum, aid) => sum + (Number(aid.quantity) || 0), 0);
      }, 0);

      setInventory(prev => {
        const existingIndex = prev.findIndex(i => i.sourceReceiptNumber === updated.receiptNumber || i.sourceDonationId === updated.id);
        if (existingIndex >= 0) {
          const updatedInv = [...prev];
          // Preserve distributed amounts: new stock = new donation qty - already distributed
          const correctQuantity = Math.max(0, newDonationQty - totalAlreadyDistributed);
          const remainingStockValue = correctQuantity * (unitPrice || 0);
          const itemToSave: InventoryItem = {
            ...updatedInv[existingIndex],
            name: updated.categoryLabel || 'کۆمەکی بەخشراو',
            category: invCategory,
            quantity: correctQuantity,
            unit: updated.itemDetails?.unit || 'دانە',
            location: warehouseLocation,
            lastUpdated: updated.date,
            sourceDonorName: updated.donorName,
            donorId: updated.donorId,
            unitPrice: unitPrice,
            estimatedMarketValue: remainingStockValue,
            contentsDescription: updated.itemDetails?.contentsDescription,
            notes: updated.notes
          };
          updatedInv[existingIndex] = itemToSave;
          safeSupabaseSync(supabase.from('inventory').upsert(mapInventoryToDb(itemToSave)));
          return updatedInv;
        } else {
          // No existing inventory item: this is a new in-kind donation or category was changed to in-kind
          const correctQuantity = Math.max(0, newDonationQty - totalAlreadyDistributed);
          const remainingStockValue = correctQuantity * (unitPrice || 0);
          const newInvItem: InventoryItem = {
            id: `inv-don-${updated.id}`,
            name: updated.categoryLabel || 'کۆمەکی بەخشراو',
            category: invCategory,
            quantity: correctQuantity,
            unit: updated.itemDetails?.unit || 'دانە',
            minAlertThreshold: 5,
            location: warehouseLocation,
            lastUpdated: updated.date,
            sourceReceiptNumber: updated.receiptNumber,
            sourceDonorName: updated.donorName,
            sourceDonationId: updated.id,
            donorId: updated.donorId,
            unitPrice: unitPrice,
            estimatedMarketValue: remainingStockValue,
            contentsDescription: updated.itemDetails?.contentsDescription,
            notes: updated.notes
          };
          safeSupabaseSync(supabase.from('inventory').upsert(mapInventoryToDb(newInvItem)));
          return [newInvItem, ...prev];
        }
      });
    } else if (wasInKind && !isInKind) {
      setInventory(prev => prev.filter(i => i.sourceReceiptNumber !== updated.receiptNumber && i.sourceDonationId !== updated.id));
      safeSupabaseSync(supabase.from('inventory').delete().or(`source_receipt_number.eq.${updated.receiptNumber},source_donation_id.eq.${updated.id}`));
    }

    logAction('دەستکاریکردنی بەخشین', `پسوولەی [${updated.receiptNumber}] دەستکاری کرا`, 'update');
  };

  const deleteDonation = (id: string) => {
    const target = donations.find(d => d.id === id);
    if (!target) return;

    // 1. Remove from donations
    const nextDonations = donations.filter(d => d.id !== id);

    // 2. Remove matching financial transaction
    const nextTransactions = transactions.filter(tx => tx.receiptNumber !== target.receiptNumber);

    // 3. Remove matching inventory item if in-kind
    const nextInventory = inventory.filter(i => i.sourceReceiptNumber !== target.receiptNumber && i.sourceDonationId !== target.id);

    // 4. Recalculate donors
    const nextDonors = donors.map(d => {
      const m = computeDonorLiveMetrics(d.id, nextDonations);
      const updatedDonor = {
        ...d,
        totalDonationsIQD: m.totalDonationsIQD,
        totalDonationsUSD: m.totalDonationsUSD
      };
      if (d.id === target.donorId) {
        safeSupabaseSync(supabase.from('donors').upsert(mapDonorToDb(updatedDonor)));
      }
      return updatedDonor;
    });

    // 5. Recalculate projects
    const nextProjects = projects.map(p => {
      const m = computeProjectLiveMetrics(p.id, p.title, nextDonations, nextTransactions, beneficiaries);
      const updatedP = {
        ...p,
        raisedBudgetUSD: m.raisedUSD,
        raisedBudgetIQD: m.raisedIQD,
        spentBudgetUSD: m.spentUSD,
        spentBudgetIQD: m.spentIQD,
        beneficiariesCount: m.beneficiariesCount
      };
      if (p.id === target.projectId) {
        safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(updatedP)));
      }
      return updatedP;
    });

    // Apply updates
    setDonations(nextDonations);
    setTransactions(nextTransactions);
    setInventory(nextInventory);
    setDonors(nextDonors);
    setProjects(nextProjects);

    // Supabase deletes
    safeSupabaseSync(supabase.from('donations').delete().eq('id', id));
    if (target.receiptNumber) {
      safeSupabaseSync(supabase.from('transactions').delete().eq('receipt_number', target.receiptNumber));
      safeSupabaseSync(supabase.from('inventory').delete().eq('source_receipt_number', target.receiptNumber));
    }

    logAction('سڕینەوەی پسوولەی بەخشین', `پسوولەی بەخشینی [${target.receiptNumber}] لە سیستەم سڕایەوە و بودجەی پڕۆژە نوێکرایەوە`, 'delete');
  };

  // Projects
  const addProject = (data: Omit<Project, 'id' | 'raisedBudgetUSD' | 'spentBudgetUSD' | 'beneficiariesCount' | 'volunteersCount'>) => {
    const budgetCurrency = data.budgetCurrency || 'USD';
    const rate = getExchangeRateForDate(data.startDate || new Date().toISOString()).rate;
    const targetBudgetUSD = budgetCurrency === 'USD'
      ? data.targetBudgetUSD
      : Number(((data.targetBudgetIQD || 0) / rate).toFixed(2));
    const targetBudgetIQD = budgetCurrency === 'IQD'
      ? (data.targetBudgetIQD || 0)
      : Math.round(data.targetBudgetUSD * rate);

    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      budgetCurrency,
      targetBudgetUSD,
      targetBudgetIQD,
      raisedBudgetUSD: 0,
      raisedBudgetIQD: 0,
      spentBudgetUSD: 0,
      spentBudgetIQD: 0,
      beneficiariesCount: 0,
      volunteersCount: 0
    };
    setProjects(prev => [newProject, ...prev]);
    safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(newProject)));
    logAction('دروستکردنی پڕۆژە', `پڕۆژەی نوێ بە ناوی [${newProject.title}] دەستیپێکرد`, 'create');
  };

  const updateProject = (updated: Project) => {
    const budgetCurrency = updated.budgetCurrency || 'USD';
    const rate = getExchangeRateForDate(updated.startDate || new Date().toISOString()).rate;
    const targetBudgetUSD = budgetCurrency === 'USD'
      ? updated.targetBudgetUSD
      : Number(((updated.targetBudgetIQD || 0) / rate).toFixed(2));
    const targetBudgetIQD = budgetCurrency === 'IQD'
      ? (updated.targetBudgetIQD || 0)
      : Math.round(updated.targetBudgetUSD * rate);

    // Compute live accurate metrics from actual records so editing metadata preserves true numbers
    const liveMetrics = computeProjectLiveMetrics(updated.id, updated.title, donations, transactions, beneficiaries);

    const projectToSave: Project = {
      ...updated,
      targetBudgetUSD,
      targetBudgetIQD,
      raisedBudgetUSD: liveMetrics.raisedUSD,
      raisedBudgetIQD: liveMetrics.raisedIQD,
      spentBudgetUSD: liveMetrics.spentUSD,
      spentBudgetIQD: liveMetrics.spentIQD,
      beneficiariesCount: liveMetrics.beneficiariesCount
    };

    setProjects(prev => prev.map(p => p.id === updated.id ? projectToSave : p));
    safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(projectToSave)));
    logAction('نوێکردنەوەی پڕۆژە', `پڕۆژەی [${updated.title}] دەستکاری کرا`, 'update');
  };

  const deleteProject = (id: string) => {
    const targetProject = projects.find(item => item.id === id);
    if (!targetProject) return;

    // 1. Detach donations linked to this project so they aren't orphaned
    setDonations(prev => prev.map(d =>
      d.projectId === id ? { ...d, projectId: undefined, projectName: 'سندووقی گشتی (پڕۆژەی سڕاوە)' } : d
    ));

    // 2. Detach transactions linked to this project
    setTransactions(prev => prev.map(t =>
      t.relatedProjectId === id ? { ...t, relatedProjectId: undefined } : t
    ));

    // 3. Remove project from projects list
    setProjects(prev => prev.filter(item => item.id !== id));

    safeSupabaseSync(supabase.from('projects').delete().eq('id', id));
    logAction('سڕینەوەی پڕۆژە', `پڕۆژەی [${targetProject.title}] سڕایەوە و بەخشینە پەیوەندیدارەکان خرانە سندووقی گشتی`, 'delete');
  };

  // Inventory
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...data,
      id: `inv-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setInventory(prev => [newItem, ...prev]);
    safeSupabaseSync(supabase.from('inventory').upsert(mapInventoryToDb(newItem)));
    logAction('زیادکردنی کاڵا بۆ کۆگا', `کاڵای [${newItem.name}] بە بڕی (${newItem.quantity} ${newItem.unit}) لە کۆگای ${newItem.location} زیادکرا`, 'create');
  };

  const deleteInventoryItem = (id: string) => {
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    safeSupabaseSync(supabase.from('inventory').delete().eq('id', id));
    logAction('سڕینەوەی کاڵا', `کاڵای [${item?.name || id}] لە کۆگا سڕایەوە`, 'delete');
  };

  const updateInventoryQuantity = (id: string, delta: number) => {
    let itemToSave: InventoryItem | undefined;
    setInventory(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty <= item.minAlertThreshold) {
          // Trigger alert
          const notif: AppNotification = {
            id: `notif-${Date.now()}`,
            title: 'ئاگاداری کەمبوونەوەی کۆگا!',
            message: `کاڵای [${item.name}] گەیشتە ئاستی مەترسیدار (${newQty} ${item.unit} ماوە).`,
            type: 'inventory',
            timestamp: 'دەستبەجێ',
            read: false,
            priority: 'high'
          };
          setNotifications(n => [notif, ...n]);
        }
        itemToSave = { ...item, quantity: newQty, lastUpdated: new Date().toISOString().split('T')[0] };
        return itemToSave;
      }
      return item;
    }));
    if (itemToSave) {
      safeSupabaseSync(supabase.from('inventory').upsert(mapInventoryToDb(itemToSave)));
    }
    logAction('دەستکاری کۆگا', `بڕی کاڵا بە ڕێژەی (${delta}) گۆڕدرا`, 'update');
  };

  const distributeAidFromInventory = (itemId: string, beneficiaryId: string, quantity: number, projectTitle: string): boolean => {
    const item = inventory.find(i => i.id === itemId);
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    if (!item || !beneficiary || item.quantity < quantity) return false;

    // Deduct stock
    updateInventoryQuantity(itemId, -quantity);

    const todayStr = new Date().toISOString().split('T')[0];
    const distributorName = currentUser ? currentUser.name : 'محمد ئیقبال';

    // Add aid record
    addAidRecord(beneficiaryId, {
      date: todayStr,
      type: 'in-kind',
      itemName: item.name,
      quantity,
      projectTitle,
      distributedBy: distributorName,
      receiptNumber: item.sourceReceiptNumber,
      donorName: item.sourceDonorName,
      notes: `دابەشکردن لە کۆگای ${item.location}${item.sourceReceiptNumber ? ` (پسوولەی ${item.sourceReceiptNumber}${item.sourceDonorName ? ` - ${item.sourceDonorName}` : ''})` : ''}`
    });

    // Auto-deduct financial value in transactions
    const sourceDonation = donations.find(
      d => (item.sourceReceiptNumber && d.receiptNumber === item.sourceReceiptNumber) ||
           (item.sourceDonationId && d.id === item.sourceDonationId)
    );
    const donCurr = sourceDonation?.currency || 'IQD';
    const donQty = sourceDonation?.itemDetails?.quantity || 1;
    let unitPrice = item.unitPrice || sourceDonation?.itemDetails?.unitPrice || 0;
    if (!unitPrice && sourceDonation && sourceDonation.amount > 0 && donQty > 0) {
      unitPrice = Math.round(sourceDonation.amount / donQty);
    } else if (!unitPrice && item.estimatedMarketValue && item.quantity > 0) {
      unitPrice = Math.round(item.estimatedMarketValue / item.quantity);
    }

    const deductedAmount = Math.round(quantity * unitPrice);
    if (deductedAmount > 0) {
      const dayRate = getExchangeRateForDate(todayStr).rate;
      const convertedDeducted = donCurr === 'IQD'
        ? Number((deductedAmount / dayRate).toFixed(2))
        : Math.round(deductedAmount * dayRate);

      const expenseTx: FinancialTransaction = {
        id: `tx-dist-${Date.now()}`,
        type: 'expense',
        amount: deductedAmount,
        currency: donCurr,
        exchangeRateAtDate: dayRate,
        convertedAmount: convertedDeducted,
        category: 'دابەشکردنی هاوکاری و کۆمەکی عەینی',
        date: todayStr,
        description: `دابەشکردنی ${quantity} ${item.unit} لە [${item.name}] (هەر دانەیەک ${unitPrice.toLocaleString()} ${donCurr === 'IQD' ? 'د.ع' : '$'}) بۆ [${beneficiary.fullName}]${item.sourceReceiptNumber ? ` - پسوولەی ${item.sourceReceiptNumber}` : ''}`,
        recordedBy: distributorName,
        relatedProjectId: sourceDonation?.projectId,
        receiptNumber: item.sourceReceiptNumber,
        isCash: false,
        itemQuantity: quantity,
        itemUnit: item.unit,
        itemUnitPrice: unitPrice
      };

      setTransactions(prev => [expenseTx, ...prev]);
      safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(expenseTx)));

      if (sourceDonation?.projectId) {
        setProjects(prev => prev.map(p => {
          if (p.id === sourceDonation.projectId) {
            const m = computeProjectLiveMetrics(p.id, p.title, donations, [expenseTx, ...transactions], beneficiaries);
            return {
              ...p,
              spentBudgetUSD: m.spentUSD,
              spentBudgetIQD: m.spentIQD
            };
          }
          return p;
        }));
      }
    }

    logAction('دابەشکردنی کۆگا', `${quantity} ${item.unit} لە [${item.name}] درا بە [${beneficiary.fullName}]`);
    return true;
  };

  const distributeAidBulkFromInventory = (
    itemId: string,
    distributions: { beneficiaryId: string; quantity: number }[],
    projectTitle: string,
    notes?: string
  ): boolean => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || distributions.length === 0) return false;

    const validDists = distributions.filter(d => (Number(d.quantity) || 0) > 0);
    const totalNeeded = validDists.reduce((sum, b) => sum + Number(b.quantity), 0);
    if (totalNeeded <= 0 || item.quantity < totalNeeded) return false;

    // Deduct stock in one atomic update
    updateInventoryQuantity(itemId, -totalNeeded);

    const todayStr = new Date().toISOString().split('T')[0];
    const distributorName = currentUser ? currentUser.name : 'محمد ئیقبال';

    // Add aid records to all target beneficiaries
    validDists.forEach(({ beneficiaryId, quantity }) => {
      addAidRecord(beneficiaryId, {
        date: todayStr,
        type: 'in-kind',
        itemName: item.name,
        quantity,
        projectTitle: projectTitle || 'دابەشکردنی کۆمەکی بەخشراو',
        distributedBy: distributorName,
        receiptNumber: item.sourceReceiptNumber,
        donorName: item.sourceDonorName,
        notes: notes || `دابەشکردن لە کۆگای ${item.location}${item.sourceReceiptNumber ? ` (پسوولەی ${item.sourceReceiptNumber}${item.sourceDonorName ? ` - ${item.sourceDonorName}` : ''})` : ''}`
      });
    });

    // Auto-deduct financial value in transactions
    const sourceDonation = donations.find(
      d => (item.sourceReceiptNumber && d.receiptNumber === item.sourceReceiptNumber) ||
           (item.sourceDonationId && d.id === item.sourceDonationId)
    );
    const donCurr = sourceDonation?.currency || 'IQD';
    const donQty = sourceDonation?.itemDetails?.quantity || 1;
    let unitPrice = item.unitPrice || sourceDonation?.itemDetails?.unitPrice || 0;
    if (!unitPrice && sourceDonation && sourceDonation.amount > 0 && donQty > 0) {
      unitPrice = Math.round(sourceDonation.amount / donQty);
    } else if (!unitPrice && item.estimatedMarketValue && item.quantity > 0) {
      unitPrice = Math.round(item.estimatedMarketValue / item.quantity);
    }

    const deductedAmount = Math.round(totalNeeded * unitPrice);
    if (deductedAmount > 0) {
      const dayRate = getExchangeRateForDate(todayStr).rate;
      const convertedDeducted = donCurr === 'IQD'
        ? Number((deductedAmount / dayRate).toFixed(2))
        : Math.round(deductedAmount * dayRate);

      const expenseTx: FinancialTransaction = {
        id: `tx-dist-${Date.now()}`,
        type: 'expense',
        amount: deductedAmount,
        currency: donCurr,
        exchangeRateAtDate: dayRate,
        convertedAmount: convertedDeducted,
        category: 'دابەشکردنی هاوکاری و کۆمەکی عەینی',
        date: todayStr,
        description: `دابەشکردنی ${totalNeeded} ${item.unit} لە [${item.name}] (هەر دانەیەک ${unitPrice.toLocaleString()} ${donCurr === 'IQD' ? 'د.ع' : '$'}) بەسەر ${validDists.length} خێزانی سوودمەنددا${item.sourceReceiptNumber ? ` - پسوولەی ${item.sourceReceiptNumber}` : ''}`,
        recordedBy: distributorName,
        relatedProjectId: sourceDonation?.projectId,
        receiptNumber: item.sourceReceiptNumber,
        isCash: false,
        itemQuantity: totalNeeded,
        itemUnit: item.unit,
        itemUnitPrice: unitPrice
      };

      setTransactions(prev => [expenseTx, ...prev]);
      safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(expenseTx)));

      if (sourceDonation?.projectId) {
        setProjects(prev => prev.map(p => {
          if (p.id === sourceDonation.projectId) {
            const m = computeProjectLiveMetrics(p.id, p.title, donations, [expenseTx, ...transactions], beneficiaries);
            return {
              ...p,
              spentBudgetUSD: m.spentUSD,
              spentBudgetIQD: m.spentIQD
            };
          }
          return p;
        }));
      }
    }

    logAction(
      'دابەشکردنی بەکۆمەڵی کۆگا',
      `کۆی (${totalNeeded} ${item.unit}) لە [${item.name}] (بە بەهای ${deductedAmount.toLocaleString()} ${donCurr === 'IQD' ? 'د.ع' : '$'}) دابەشکرا بەسەر ${validDists.length} خێزانی سوودمەنددا`,
      'update'
    );
    return true;
  };

  const distributeCashAidBulk = (
    donationIdOrReceipt: string,
    distributions: { beneficiaryId: string; amount: number }[],
    projectTitle: string,
    notes?: string
  ): boolean => {
    const donation = donations.find(
      d => d.id === donationIdOrReceipt || d.receiptNumber === donationIdOrReceipt
    );
    if (!donation || distributions.length === 0) return false;

    const validDists = distributions.filter(d => (Number(d.amount) || 0) > 0);
    const totalNeeded = validDists.reduce((sum, b) => sum + Number(b.amount), 0);
    if (totalNeeded <= 0) return false;

    // Validate against live available cash balance
    const cashMetrics = getDonationCashMetrics(donation, beneficiaries);
    if (totalNeeded > cashMetrics.remainingAmount) {
      return false;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const distributorName = currentUser ? currentUser.name : 'محمد ئیقبال';
    const dayRate = donation.exchangeRateAtDate || getExchangeRateForDate(todayStr).rate || 1530;
    const isIQD = donation.currency === 'IQD';

    // Atomic update of all target beneficiaries with new monetary AidRecords
    const nextBeneficiaries = beneficiaries.map(b => {
      const match = validDists.find(d => d.beneficiaryId === b.id);
      if (match) {
        const amountIQD = isIQD
          ? Math.round(match.amount)
          : Math.round(match.amount * dayRate);

        const newAidRecord: AidRecord = {
          id: `aid-cash-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          date: todayStr,
          type: 'monetary',
          amount: match.amount,
          currency: donation.currency,
          amountIQD,
          projectTitle: projectTitle || donation.projectName || 'دابەشکردنی هاوکاری نەختینەیی',
          distributedBy: distributorName,
          receiptNumber: donation.receiptNumber,
          donorName: donation.donorName,
          donationId: donation.id,
          notes: notes || `هاوکاری نەختینەیی لە پسوولەی ${donation.receiptNumber} (${donation.donorName})`
        };

        const updatedBen: Beneficiary = {
          ...b,
          aidHistory: [newAidRecord, ...(b.aidHistory || [])]
        };
        safeSupabaseSync(supabase.from('beneficiaries').upsert(mapBeneficiaryToDb(updatedBen)));
        return updatedBen;
      }
      return b;
    });

    setBeneficiaries(nextBeneficiaries);

    // Record consolidated financial expense transaction in ledger
    const totalIQD = isIQD ? totalNeeded : Math.round(totalNeeded * dayRate);
    const totalUSD = isIQD ? Number((totalNeeded / dayRate).toFixed(2)) : totalNeeded;

    const expenseTx: FinancialTransaction = {
      id: `tx-dist-cash-${Date.now()}`,
      type: 'expense',
      amount: totalNeeded,
      currency: donation.currency,
      exchangeRateAtDate: dayRate,
      convertedAmount: isIQD ? totalUSD : totalIQD,
      category: 'دابەشکردنی هاوکاری نەختینەیی',
      date: todayStr,
      description: `دابەشکردنی هاوکاری نەختینەیی (${totalNeeded.toLocaleString()} ${isIQD ? 'د.ع' : '$'}) بەسەر ${validDists.length} خێزانی سوودمەند لە پسوولەی ${donation.receiptNumber} - ${donation.donorName}`,
      recordedBy: distributorName,
      relatedProjectId: donation.projectId,
      receiptNumber: donation.receiptNumber,
      isCash: true
    };

    const nextTransactions = [expenseTx, ...transactions];
    setTransactions(nextTransactions);
    safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(expenseTx)));

    // Synchronize Project metrics if donation has projectId
    if (donation.projectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === donation.projectId) {
          const m = computeProjectLiveMetrics(p.id, p.title, donations, nextTransactions, nextBeneficiaries);
          const updatedP = {
            ...p,
            spentBudgetUSD: m.spentUSD,
            spentBudgetIQD: m.spentIQD,
            beneficiariesCount: m.beneficiariesCount
          };
          safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(updatedP)));
          return updatedP;
        }
        return p;
      }));
    }

    logAction(
      'دابەشکردنی هاوکاری نەختینەیی',
      `کۆی (${totalNeeded.toLocaleString()} ${isIQD ? 'د.ع' : '$'}) لە پسوولەی [${donation.receiptNumber}] بەسەر ${validDists.length} خێزانی سوودمەنددا دابەشکرا`,
      'update'
    );

    return true;
  };

  // Finance
  const addTransaction = (data: Omit<FinancialTransaction, 'id'>) => {
    const dayRate = data.exchangeRateAtDate || getExchangeRateForDate(data.date).rate;
    const convertedAmount = data.convertedAmount || (
      data.currency === 'IQD'
        ? Number((data.amount / dayRate).toFixed(2))
        : Math.round(data.amount * dayRate)
    );

    const newTx: FinancialTransaction = {
      ...data,
      exchangeRateAtDate: dayRate,
      convertedAmount,
      id: `tx-${Date.now()}`
    };
    const nextTransactions = [newTx, ...transactions];
    setTransactions(nextTransactions);
    safeSupabaseSync(supabase.from('transactions').upsert(mapTransactionToDb(newTx)));

    // Synchronize with related project live metrics
    if (data.relatedProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === data.relatedProjectId) {
          const m = computeProjectLiveMetrics(p.id, p.title, donations, nextTransactions, beneficiaries);
          const updatedP = {
            ...p,
            raisedBudgetUSD: m.raisedUSD,
            raisedBudgetIQD: m.raisedIQD,
            spentBudgetUSD: m.spentUSD,
            spentBudgetIQD: m.spentIQD
          };
          safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(updatedP)));
          return updatedP;
        }
        return p;
      }));
    }

    logAction('تۆماری ژمێریاری', `${data.type === 'income' ? 'داهات' : 'خەرجی'}: ${data.amount.toLocaleString()} ${data.currency} - ${data.description}`);
  };

  const deleteTransaction = (id: string) => {
    const targetTx = transactions.find(t => t.id === id);
    if (!targetTx) return;

    const nextTransactions = transactions.filter(t => t.id !== id);
    setTransactions(nextTransactions);
    safeSupabaseSync(supabase.from('transactions').delete().eq('id', id));

    if (targetTx.relatedProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === targetTx.relatedProjectId) {
          const m = computeProjectLiveMetrics(p.id, p.title, donations, nextTransactions, beneficiaries);
          const updatedP = {
            ...p,
            raisedBudgetUSD: m.raisedUSD,
            raisedBudgetIQD: m.raisedIQD,
            spentBudgetUSD: m.spentUSD,
            spentBudgetIQD: m.spentIQD
          };
          safeSupabaseSync(supabase.from('projects').upsert(mapProjectToDb(updatedP)));
          return updatedP;
        }
        return p;
      }));
    }

    logAction('سڕینەوەی تۆماری دارایی', `تۆماری دارایی [${targetTx.description}] سڕایەوە`, 'delete');
  };

  // Volunteers
  const addVolunteer = (data: Omit<Volunteer, 'id' | 'joinedDate' | 'hoursLogged' | 'badgeNumber'>) => {
    const count = volunteers.length + 1;
    const newVol: Volunteer = {
      ...data,
      id: `vol-${Date.now()}`,
      joinedDate: new Date().toISOString().split('T')[0],
      hoursLogged: 0,
      badgeNumber: `VOL-${100 + count}`
    };
    setVolunteers(prev => [newVol, ...prev]);
    safeSupabaseSync(supabase.from('volunteers').upsert(mapVolunteerToDb(newVol)));
    logAction('تۆمارکردنی خۆبەخش', `خۆبەخشی نوێ [${newVol.fullName}] بە ناسنامەی ${newVol.badgeNumber} تۆمارکرا`);
  };

  const logVolunteerHours = (id: string, hours: number) => {
    let updatedVol: Volunteer | undefined;
    setVolunteers(prev => prev.map(v => {
      if (v.id === id) {
        updatedVol = { ...v, hoursLogged: v.hoursLogged + hours };
        return updatedVol;
      }
      return v;
    }));
    if (updatedVol) {
      safeSupabaseSync(supabase.from('volunteers').upsert(mapVolunteerToDb(updatedVol)));
    }
    const vol = volunteers.find(v => v.id === id);
    logAction('تۆمارکردنی کاتژمێری خۆبەخش', `${hours} کاتژمێری خزمەت بۆ [${vol?.fullName}] تۆمارکرا`);
  };

  const deleteVolunteer = (id: string) => {
    const vol = volunteers.find(v => v.id === id);
    setVolunteers(prev => prev.filter(v => v.id !== id));
    safeSupabaseSync(supabase.from('volunteers').delete().eq('id', id));
    logAction('سڕینەوەی خۆبەخش', `خۆبەخش [${vol?.fullName || id}] سڕایەوە`, 'delete');
  };

  // Documents
  const addDocument = (data: Omit<DocumentItem, 'id' | 'uploadDate'>) => {
    const newDoc: DocumentItem = {
      ...data,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [newDoc, ...prev]);
    safeSupabaseSync(supabase.from('documents').upsert(mapDocumentToDb(newDoc)));
    logAction('بارکردنی بەڵگەنامە', `بەڵگەنامەی [${newDoc.title}] بە قەبارەی ${newDoc.fileSize} بارکرا`);
  };

  const deleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    safeSupabaseSync(supabase.from('documents').delete().eq('id', id));
    logAction('سڕینەوەی بەڵگەنامە', `بەڵگەنامەی [${doc?.title || id}] سڕایەوە`, 'delete');
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const sendSMS = (phone: string, recipientName: string, text: string) => {
    const notif: AppNotification = {
      id: `sms-${Date.now()}`,
      title: `کورتەنامەی فەرمی گەیشت بە [${recipientName}]`,
      message: `ژمارە: ${phone} | دەق: "${text}"`,
      type: 'system',
      timestamp: 'ئێستا',
      read: false,
      priority: 'low'
    };
    setNotifications(prev => [notif, ...prev]);
    logAction('ناردنی SMSـی فەرمی', `کورتەنامەی فەرمی نێردرا بۆ [${recipientName}] (${phone}) لە ڕێگەی SMS Gateway`, 'create');
  };

  const sendSimulationSMS = sendSMS; // alias for backwards compatibility

  // Export Data JSON
  const exportDataJSON = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      organization: 'ڕێکخراوی بۆتان بامۆکی',
      beneficiaries,
      donors,
      donations,
      projects,
      inventory,
      transactions,
      volunteers,
      documents,
      auditLogs,
      navConfigs
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `charity_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    logAction('هەناردەکردنی داتا', 'یەدەگی تەواوی داتابەیسەکە بە فۆرماتی JSON دابەزێندرا', 'export');
  };

  // Helper to purge Supabase data on reset
  const purgeSupabaseData = () => {
    safeSupabaseSync(Promise.all([
      supabase.from('beneficiaries').delete().neq('id', 'placeholder_guard'),
      supabase.from('donors').delete().neq('id', 'placeholder_guard'),
      supabase.from('donations').delete().neq('id', 'placeholder_guard'),
      supabase.from('projects').delete().neq('id', 'placeholder_guard'),
      supabase.from('inventory').delete().neq('id', 'placeholder_guard'),
      supabase.from('transactions').delete().neq('id', 'placeholder_guard'),
      supabase.from('volunteers').delete().neq('id', 'placeholder_guard'),
      supabase.from('documents').delete().neq('id', 'placeholder_guard'),
      supabase.from('audit_logs').delete().neq('id', 'placeholder_guard')
    ]));
  };

  // Import Data JSON
  const importDataJSON = (jsonData: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonData);
      if (data.beneficiaries && Array.isArray(data.beneficiaries)) {
        setBeneficiaries(data.beneficiaries);
        safeSupabaseSync(supabase.from('beneficiaries').upsert(data.beneficiaries.map(mapBeneficiaryToDb)));
      }
      if (data.donors && Array.isArray(data.donors)) {
        setDonors(data.donors);
        safeSupabaseSync(supabase.from('donors').upsert(data.donors.map(mapDonorToDb)));
      }
      if (data.donations && Array.isArray(data.donations)) {
        setDonations(data.donations);
        safeSupabaseSync(supabase.from('donations').upsert(data.donations.map(mapDonationToDb)));
      }
      if (data.projects && Array.isArray(data.projects)) {
        setProjects(data.projects);
        safeSupabaseSync(supabase.from('projects').upsert(data.projects.map(mapProjectToDb)));
      }
      if (data.inventory && Array.isArray(data.inventory)) {
        setInventory(data.inventory);
        safeSupabaseSync(supabase.from('inventory').upsert(data.inventory.map(mapInventoryToDb)));
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        safeSupabaseSync(supabase.from('transactions').upsert(data.transactions.map(mapTransactionToDb)));
      }
      if (data.volunteers && Array.isArray(data.volunteers)) {
        setVolunteers(data.volunteers);
        safeSupabaseSync(supabase.from('volunteers').upsert(data.volunteers.map(mapVolunteerToDb)));
      }
      if (data.documents && Array.isArray(data.documents)) {
        setDocuments(data.documents);
        safeSupabaseSync(supabase.from('documents').upsert(data.documents.map(mapDocumentToDb)));
      }
      if (data.navConfigs && Array.isArray(data.navConfigs)) {
        setNavConfigs(data.navConfigs);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ngo_nav_configs', JSON.stringify(data.navConfigs));
          } catch (e) {
            console.error(e);
          }
        }
      }
      logAction('هاوردەکردنی داتا', 'داتابەیسەکە لە فایلی یەدەگی JSON بە سەرکەوتوویی نوێکرایەوە', 'create');
      return { success: true, message: 'داتاکان بە سەرکەوتوویی هاوردەکران و تەواوی بەشەکان نوێکرانەوە.' };
    } catch (err) {
      return { success: false, message: 'فایلی JSON هەڵەی تێدایە یان فۆرماتەکەی نادروستە.' };
    }
  };

  // Announcements & Reminders
  const addAnnouncement = (title: string, content: string, tag: 'مەیدانی' | 'کۆبوونەوە' | 'پڕۆژەکان' | 'بەپەلە') => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      author: currentUser ? currentUser.name : 'محمد ئیقبال',
      date: new Date().toISOString().split('T')[0],
      tag
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    logAction('ڕاگەیاندراوی نوێ', `ڕاگەیاندراو بڵاوکرایەوە: ${title}`, 'create');
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const addReminder = (title: string, details: string, dueDate: string, type: 'distribution' | 'followup' | 'inventory' | 'finance') => {
    const newRem: AutomatedReminder = {
      id: `rem-${Date.now()}`,
      title,
      details,
      dueDate,
      type,
      completed: false
    };
    setReminders(prev => [newRem, ...prev]);
    logAction('بیرخەرەوەی نوێ', `بیرخەرەوە زیادکرا: ${title}`, 'create');
  };

  // Authentication System (Log-in, Sign-up, Logout)
  const login = async (identifier: string, passwordPlain: string) => {
    const res = await authenticateUser(identifier, passwordPlain);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ngo_auth_user', JSON.stringify(res.user));
      }
      logAction('چوونەژوورەوەی سیستم', `بەکارهێنەر [${res.user.name}] بە سەرکەوتوویی چووە ژوورەوە`, 'update');
    }
    return res;
  };

  const signup = async (
    fullName: string,
    email: string,
    passwordPlain: string,
    phone?: string,
    role?: UserRole
  ) => {
    const res = await registerNewUser({
      fullName,
      email,
      password: passwordPlain,
      phone,
      role
    });
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ngo_auth_user', JSON.stringify(res.user));
      }
      logAction('تۆمارکردنی هەژماری نوێ', `هەژماری نوێ بۆ [${res.user.name}] بە ڕۆڵی [${res.user.roleTitleKurdish}] دروستکرا`, 'create');
    }
    return res;
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ngo_auth_user');
    }
    setCurrentUser(INITIAL_ADMIN_USER);
  };

  // Reset Data to Clean Zero
  const resetAllData = () => {
    const activeAuth = currentUser ? JSON.stringify(currentUser) : null;
    localStorage.clear();
    localStorage.setItem('ngo_system_version', SYSTEM_VERSION);
    if (activeAuth) {
      localStorage.setItem('ngo_auth_user', activeAuth);
    }
    setBeneficiaries([]);
    setDonors([]);
    setDonations([]);
    setProjects([]);
    setInventory([]);
    setTransactions([]);
    setVolunteers([]);
    setNotifications([]);
    setDocuments([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setAnnouncements([]);
    setReminders([]);
    purgeSupabaseData();
    logAction('دەستپێکردنی سیستەم لە سفرەوە', 'سەرجەم داتاکان خاوێنکرانەوە بۆ دەستپێکی نوێ لە سفرەوە', 'update');
  };

  const clearToEmptyDatabase = () => {
    const activeAuth = currentUser ? JSON.stringify(currentUser) : null;
    localStorage.clear();
    localStorage.setItem('ngo_system_version', SYSTEM_VERSION);
    if (activeAuth) {
      localStorage.setItem('ngo_auth_user', activeAuth);
    }
    setBeneficiaries([]);
    setDonors([]);
    setDonations([]);
    setProjects([]);
    setInventory([]);
    setTransactions([]);
    setVolunteers([]);
    setDocuments([]);
    setNotifications([]);
    setAnnouncements([]);
    setReminders([]);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    purgeSupabaseData();
    logAction('پاککردنەوەی تەواوی داتابەیس', 'داتابەیسەکە بە سەرکەوتوویی پاککرایەوە بۆ سفر تۆمار بۆ دەستپێکی فەرمی', 'delete');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        mapFocusLocation,
        setMapFocusLocation,
        navigateToLocationOnMap,
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser,
        isAuthenticated: !!currentUser,
        login,
        signup,
        logout,
        beneficiaries,
        addBeneficiary,
        addBeneficiariesBulk,
        updateBeneficiary,
        deleteBeneficiary,
        checkDuplicate,
        addAidRecord,
        updateAidRecord,
        deleteAidRecord,
        bulkUpdateAidRecords,
        addBeneficiaryDocument,
        updateBeneficiaryDocument,
        deleteBeneficiaryDocument,
        donors,
        donations,
        addDonor,
        updateDonor,
        deleteDonor,
        addDonation,
        updateDonation,
        deleteDonation,
        projects,
        addProject,
        updateProject,
        deleteProject,
        inventory,
        addInventoryItem,
        deleteInventoryItem,
        updateInventoryQuantity,
        distributeAidFromInventory,
        distributeAidBulkFromInventory,
        distributeCashAidBulk,
        pendingDistributionDonationId,
        setPendingDistributionDonationId,
        openDistributionForDonation,
        transactions,
        addTransaction,
        deleteTransaction,
        currencyView,
        setCurrencyView,
        volunteers,
        addVolunteer,
        deleteVolunteer,
        logVolunteerHours,
        documents,
        addDocument,
        deleteDocument,
        notifications,
        markNotificationRead,
        sendSMS,
        sendSimulationSMS,
        auditLogs,
        announcements,
        addAnnouncement,
        reminders,
        toggleReminder,
        addReminder,
        isLocked,
        setIsLocked,
        twoFactorEnabled,
        setTwoFactorEnabled,
        isSpotlightOpen,
        setIsSpotlightOpen,
        exportDataJSON,
        importDataJSON,
        resetAllData,
        clearToEmptyDatabase,
        isCloudConnected,
        isCloudSyncing,
        syncLocalDataToCloud,
        checkConnectionHealth,
        navConfigs,
        updateNavConfig,
        toggleNavSectionVisibility,
        toggleRoleForNavSection,
        resetNavConfigs,
        isTabAllowedForRole
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
