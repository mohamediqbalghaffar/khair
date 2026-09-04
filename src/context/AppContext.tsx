import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserProfile,
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
  AidRecord,
  Announcement,
  AutomatedReminder
} from '../types';
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

export type NavTab =
  | 'dashboard'
  | 'beneficiaries'
  | 'donors'
  | 'projects'
  | 'inventory'
  | 'finance'
  | 'volunteers'
  | 'geo'
  | 'documents'
  | 'audit'
  | 'settings';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;

  // Beneficiaries
  beneficiaries: Beneficiary[];
  addBeneficiary: (ben: Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>) => { success: boolean; duplicate?: Beneficiary; message?: string };
  addBeneficiariesBulk: (bens: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>>) => { added: number; skippedDuplicates: number; total: number };
  updateBeneficiary: (ben: Beneficiary) => void;
  deleteBeneficiary: (id: string) => void;
  checkDuplicate: (nationalId: string, phone: string, excludeId?: string) => Beneficiary | undefined;
  addAidRecord: (beneficiaryId: string, record: Omit<AidRecord, 'id'>) => void;

  // Donors & Donations
  donors: Donor[];
  donations: Donation[];
  addDonor: (donor: Omit<Donor, 'id' | 'joinedDate' | 'totalDonationsIQD' | 'totalDonationsUSD'>) => void;
  deleteDonor: (id: string) => void;
  addDonation: (donation: Omit<Donation, 'id' | 'receiptNumber' | 'status'>) => Donation;

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

  // Finance
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, 'id'>) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SYSTEM_VERSION = 'v5_clean_zero_production';

const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    id: 'user-admin',
    name: 'ئەحمەد محمد قادر',
    role: 'admin',
    roleTitleKurdish: 'بەڕێوەبەری گشتی (Admin)',
    avatar: ''
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear legacy mock records from browser LocalStorage if version upgraded
  if (typeof window !== 'undefined') {
    const savedVer = localStorage.getItem('ngo_system_version');
    if (savedVer !== SYSTEM_VERSION) {
      localStorage.clear();
      localStorage.setItem('ngo_system_version', SYSTEM_VERSION);
    }
  }

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
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
    const saved = localStorage.getItem('ngo_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
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

  // Helper to log audit actions
  const logAction = (action: string, details: string, type: AuditLog['type'] = 'create') => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userName: ROLE_PROFILES[currentRole].name,
      userRole: currentRole,
      action,
      details,
      type
    };
    setAuditLogs(prev => [newLog, ...prev]);
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

  // Add Beneficiary with Duplicate Detection
  const addBeneficiary = (data: Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>) => {
    const duplicate = checkDuplicate(data.nationalId, data.phone);
    if (duplicate) {
      // Add warning notification
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
      id: `ben-${Date.now()}`,
      registeredDate: new Date().toISOString().split('T')[0],
      aidHistory: []
    };

    setBeneficiaries(prev => [newBen, ...prev]);
    logAction('تۆمارکردنی سوودمەند', `سوودمەند [${newBen.fullName}] تۆمارکرا`);
    return { success: true };
  };

  const addBeneficiariesBulk = (items: Array<Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>>) => {
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
        id: `ben-${Date.now()}-${index}`,
        registeredDate: new Date().toISOString().split('T')[0],
        aidHistory: []
      };
      newItems.push(newBen);
      addedCount++;
    });

    if (newItems.length > 0) {
      setBeneficiaries(prev => [...newItems, ...prev]);
      logAction('هاوردەکردنی بەکۆمەڵ', `ژمارەی (${addedCount}) سوودمەند بە فایلی ئێکسڵ هاوردەکران بۆ سیستەم`, 'create');
    }

    return { added: addedCount, skippedDuplicates: skippedCount, total: items.length };
  };

  const updateBeneficiary = (updated: Beneficiary) => {
    setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));
    logAction('نوێکردنەوەی سوودمەند', `زانیارییەکانی [${updated.fullName}] دەستکاری کرا`, 'update');
  };

  const deleteBeneficiary = (id: string) => {
    const target = beneficiaries.find(b => b.id === id);
    setBeneficiaries(prev => prev.filter(b => b.id !== id));
    logAction('سڕینەوەی سوودمەند', `دۆسیەی [${target?.fullName || id}] سڕایەوە`, 'delete');
  };

  const addAidRecord = (beneficiaryId: string, record: Omit<AidRecord, 'id'>) => {
    const newRecord: AidRecord = {
      ...record,
      id: `aid-${Date.now()}`
    };

    setBeneficiaries(prev => prev.map(b => {
      if (b.id === beneficiaryId) {
        return {
          ...b,
          status: 'aided',
          aidHistory: [newRecord, ...b.aidHistory]
        };
      }
      return b;
    }));

    const ben = beneficiaries.find(b => b.id === beneficiaryId);

    // Synchronize with Project
    let matchedProjectId: string | undefined = undefined;
    if (record.projectTitle) {
      setProjects(prev => prev.map(p => {
        if (p.title === record.projectTitle) {
          matchedProjectId = p.id;
          const spentAddUSD = (record.type === 'monetary' && record.amountIQD) ? Math.round(record.amountIQD / 1500) : 0;
          return {
            ...p,
            beneficiariesCount: p.beneficiariesCount + 1,
            spentBudgetUSD: p.spentBudgetUSD + spentAddUSD
          };
        }
        return p;
      }));
    }

    // Auto-record financial expense transaction if monetary aid
    if (record.type === 'monetary' && record.amountIQD && record.amountIQD > 0) {
      const aidTx: FinancialTransaction = {
        id: `tx-aid-${Date.now()}`,
        type: 'expense',
        amount: record.amountIQD,
        currency: 'IQD',
        category: 'هاوکاری نەختینەیی سوودمەند',
        date: record.date || new Date().toISOString().split('T')[0],
        description: `هاوکاری نەختینەیی بۆ [${ben?.fullName || 'سوودمەند'}] - ${record.projectTitle}`,
        recordedBy: record.distributedBy || ROLE_PROFILES[currentRole].name,
        relatedProjectId: matchedProjectId
      };
      setTransactions(prev => [aidTx, ...prev]);
    }

    logAction('دابەشکردنی هاوکاری', `هاوکاری لە پڕۆژەی [${record.projectTitle}] بەخشرا بە [${ben?.fullName}]`);
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

    // Update Donor total
    setDonors(prev => prev.map(d => {
      if (d.id === data.donorId) {
        return {
          ...d,
          totalDonationsIQD: data.currency === 'IQD' ? d.totalDonationsIQD + data.amount : d.totalDonationsIQD,
          totalDonationsUSD: data.currency === 'USD' ? d.totalDonationsUSD + data.amount : d.totalDonationsUSD
        };
      }
      return d;
    }));

    // Auto-create income transaction in financial ledger
    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      type: 'income',
      amount: data.amount,
      currency: data.currency,
      category: `بەخشینی ${data.method}`,
      date: data.date,
      description: `بەخشینی فەرمی لەلایەن [${data.donorName}] بە پسوولەی ${receiptNumber}`,
      recordedBy: ROLE_PROFILES[currentRole].name,
      relatedProjectId: data.projectId,
      receiptNumber
    };
    setTransactions(prev => [newTx, ...prev]);

    // Synchronize with Project raised budget
    if (data.projectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === data.projectId) {
          const addedUSD = data.currency === 'USD' ? data.amount : Math.round(data.amount / 1500);
          return {
            ...p,
            raisedBudgetUSD: p.raisedBudgetUSD + addedUSD
          };
        }
        return p;
      }));
    }

    logAction('تۆمارکردنی بەخشین', `بڕی ${data.amount.toLocaleString()} ${data.currency} لەلایەن [${data.donorName}] بەخشرا`);
    return newDonation;
  };

  const deleteDonor = (id: string) => {
    const d = donors.find(item => item.id === id);
    setDonors(prev => prev.filter(item => item.id !== id));
    logAction('سڕینەوەی بەخشەر', `بەخشەر [${d?.fullName || id}] لە سیستەم سڕایەوە`, 'delete');
  };

  // Projects
  const addProject = (data: Omit<Project, 'id' | 'raisedBudgetUSD' | 'spentBudgetUSD' | 'beneficiariesCount' | 'volunteersCount'>) => {
    const newProject: Project = {
      ...data,
      id: `proj-${Date.now()}`,
      raisedBudgetUSD: 0,
      spentBudgetUSD: 0,
      beneficiariesCount: 0,
      volunteersCount: 0
    };
    setProjects(prev => [newProject, ...prev]);
    logAction('دروستکردنی پڕۆژە', `پڕۆژەی نوێ بە ناوی [${newProject.title}] دەستیپێکرد`);
  };

  const updateProject = (updated: Project) => {
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    logAction('نوێکردنەوەی پڕۆژە', `پڕۆژەی [${updated.title}] نوێکرایەوە`, 'update');
  };

  const deleteProject = (id: string) => {
    const p = projects.find(item => item.id === id);
    setProjects(prev => prev.filter(item => item.id !== id));
    logAction('سڕینەوەی پڕۆژە', `پڕۆژەی [${p?.title || id}] لە سیستەم سڕایەوە`, 'delete');
  };

  // Inventory
  const addInventoryItem = (data: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...data,
      id: `inv-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    setInventory(prev => [newItem, ...prev]);
    logAction('زیادکردنی کاڵا بۆ کۆگا', `کاڵای [${newItem.name}] بە بڕی (${newItem.quantity} ${newItem.unit}) لە کۆگای ${newItem.location} زیادکرا`, 'create');
  };

  const deleteInventoryItem = (id: string) => {
    const item = inventory.find(i => i.id === id);
    setInventory(prev => prev.filter(i => i.id !== id));
    logAction('سڕینەوەی کاڵا', `کاڵای [${item?.name || id}] لە کۆگا سڕایەوە`, 'delete');
  };

  const updateInventoryQuantity = (id: string, delta: number) => {
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
        return { ...item, quantity: newQty, lastUpdated: new Date().toISOString().split('T')[0] };
      }
      return item;
    }));
    logAction('دەستکاری کۆگا', `بڕی کاڵا بە ڕێژەی (${delta}) گۆڕدرا`, 'update');
  };

  const distributeAidFromInventory = (itemId: string, beneficiaryId: string, quantity: number, projectTitle: string): boolean => {
    const item = inventory.find(i => i.id === itemId);
    const beneficiary = beneficiaries.find(b => b.id === beneficiaryId);
    if (!item || !beneficiary || item.quantity < quantity) return false;

    // Deduct stock
    updateInventoryQuantity(itemId, -quantity);

    // Add aid record
    addAidRecord(beneficiaryId, {
      date: new Date().toISOString().split('T')[0],
      type: 'in-kind',
      itemName: item.name,
      quantity,
      projectTitle,
      distributedBy: ROLE_PROFILES[currentRole].name,
      notes: `دابەشکردن لە کۆگای ${item.location}`
    });

    logAction('دابەشکردنی کۆگا', `${quantity} ${item.unit} لە [${item.name}] درا بە [${beneficiary.fullName}]`);
    return true;
  };

  // Finance
  const addTransaction = (data: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...data,
      id: `tx-${Date.now()}`
    };
    setTransactions(prev => [newTx, ...prev]);

    // Synchronize with related project
    if (data.relatedProjectId) {
      setProjects(prev => prev.map(p => {
        if (p.id === data.relatedProjectId) {
          const amountUSD = data.currency === 'USD' ? data.amount : Math.round(data.amount / 1500);
          if (data.type === 'expense') {
            return { ...p, spentBudgetUSD: p.spentBudgetUSD + amountUSD };
          } else if (data.type === 'income') {
            return { ...p, raisedBudgetUSD: p.raisedBudgetUSD + amountUSD };
          }
        }
        return p;
      }));
    }

    logAction('تۆماری ژمێریاری', `${data.type === 'income' ? 'داهات' : 'خەرجی'}: ${data.amount.toLocaleString()} ${data.currency} - ${data.description}`);
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
    logAction('تۆمارکردنی خۆبەخش', `خۆبەخشی نوێ [${newVol.fullName}] بە ناسنامەی ${newVol.badgeNumber} تۆمارکرا`);
  };

  const logVolunteerHours = (id: string, hours: number) => {
    setVolunteers(prev => prev.map(v => v.id === id ? { ...v, hoursLogged: v.hoursLogged + hours } : v));
    const vol = volunteers.find(v => v.id === id);
    logAction('تۆمارکردنی کاتژمێری خۆبەخش', `${hours} کاتژمێری خزمەت بۆ [${vol?.fullName}] تۆمارکرا`);
  };

  const deleteVolunteer = (id: string) => {
    const vol = volunteers.find(v => v.id === id);
    setVolunteers(prev => prev.filter(v => v.id !== id));
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
    logAction('بارکردنی بەڵگەنامە', `بەڵگەنامەی [${newDoc.title}] بە قەبارەی ${newDoc.fileSize} بارکرا`);
  };

  const deleteDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
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
      auditLogs
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

  // Import Data JSON
  const importDataJSON = (jsonData: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonData);
      if (data.beneficiaries && Array.isArray(data.beneficiaries)) setBeneficiaries(data.beneficiaries);
      if (data.donors && Array.isArray(data.donors)) setDonors(data.donors);
      if (data.donations && Array.isArray(data.donations)) setDonations(data.donations);
      if (data.projects && Array.isArray(data.projects)) setProjects(data.projects);
      if (data.inventory && Array.isArray(data.inventory)) setInventory(data.inventory);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.volunteers && Array.isArray(data.volunteers)) setVolunteers(data.volunteers);
      if (data.documents && Array.isArray(data.documents)) setDocuments(data.documents);
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
      author: ROLE_PROFILES[currentRole].name,
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

  // Reset Data to Clean Zero
  const resetAllData = () => {
    localStorage.clear();
    localStorage.setItem('ngo_system_version', SYSTEM_VERSION);
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
    logAction('دەستپێکردنی سیستەم لە سفرەوە', 'سەرجەم داتاکان خاوێنکرانەوە بۆ دەستپێکی نوێ لە سفرەوە', 'update');
  };

  const clearToEmptyDatabase = () => {
    localStorage.clear();
    localStorage.setItem('ngo_system_version', SYSTEM_VERSION);
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
    logAction('پاککردنەوەی تەواوی داتابەیس', 'داتابەیسەکە بە سەرکەوتوویی پاککرایەوە بۆ سفر تۆمار بۆ دەستپێکی فەرمی', 'delete');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentRole,
        setCurrentRole,
        currentUser: ROLE_PROFILES[currentRole],
        beneficiaries,
        addBeneficiary,
        addBeneficiariesBulk,
        updateBeneficiary,
        deleteBeneficiary,
        checkDuplicate,
        addAidRecord,
        donors,
        donations,
        addDonor,
        deleteDonor,
        addDonation,
        projects,
        addProject,
        updateProject,
        deleteProject,
        inventory,
        addInventoryItem,
        deleteInventoryItem,
        updateInventoryQuantity,
        distributeAidFromInventory,
        transactions,
        addTransaction,
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
        clearToEmptyDatabase
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
