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
  AidRecord
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
  INITIAL_AUDIT_LOGS
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
  | 'audit';

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserProfile;

  // Beneficiaries
  beneficiaries: Beneficiary[];
  addBeneficiary: (ben: Omit<Beneficiary, 'id' | 'registeredDate' | 'aidHistory'>) => { success: boolean; duplicate?: Beneficiary; message?: string };
  updateBeneficiary: (ben: Beneficiary) => void;
  deleteBeneficiary: (id: string) => void;
  checkDuplicate: (nationalId: string, phone: string, excludeId?: string) => Beneficiary | undefined;
  addAidRecord: (beneficiaryId: string, record: Omit<AidRecord, 'id'>) => void;

  // Donors & Donations
  donors: Donor[];
  donations: Donation[];
  addDonor: (donor: Omit<Donor, 'id' | 'joinedDate' | 'totalDonationsIQD' | 'totalDonationsUSD'>) => void;
  addDonation: (donation: Omit<Donation, 'id' | 'receiptNumber' | 'status'>) => Donation;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'raisedBudgetUSD' | 'spentBudgetUSD' | 'beneficiariesCount' | 'volunteersCount'>) => void;
  updateProject: (project: Project) => void;

  // Inventory
  inventory: InventoryItem[];
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
  logVolunteerHours: (id: string, hours: number) => void;

  // Documents
  documents: DocumentItem[];
  addDocument: (doc: Omit<DocumentItem, 'id' | 'uploadDate'>) => void;

  // Notifications & Communications
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  sendSimulationSMS: (phone: string, recipientName: string, text: string) => void;

  // Audit Logs
  auditLogs: AuditLog[];

  // Spotlight & Utilities
  isSpotlightOpen: boolean;
  setIsSpotlightOpen: (open: boolean) => void;
  exportDataJSON: () => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const ROLE_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    id: 'user-admin',
    name: 'سەرکەوت کامیل',
    role: 'admin',
    roleTitleKurdish: 'بەڕێوەبەری گشتی (Admin)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  manager: {
    id: 'user-manager',
    name: 'ئاکۆ عەبدولڕەحمان',
    role: 'manager',
    roleTitleKurdish: 'بەرپرسی پڕۆژەکان (Manager)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  staff: {
    id: 'user-staff',
    name: 'شەیما نەوزاد',
    role: 'staff',
    roleTitleKurdish: 'کارمەندی تۆمار (Staff)',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  },
  volunteer: {
    id: 'user-volunteer',
    name: 'کاروان ساڵح',
    role: 'volunteer',
    roleTitleKurdish: 'خۆبەخش (Volunteer)',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  donor: {
    id: 'user-donor',
    name: 'حاجی ڕەشید دۆسکی',
    role: 'donor',
    roleTitleKurdish: 'بەخشەر (Donor)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  },
  auditor: {
    id: 'user-auditor',
    name: 'دڵنیا عیزەدین',
    role: 'auditor',
    roleTitleKurdish: 'چاودێری دارایی (Auditor)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [currencyView, setCurrencyView] = useState<'IQD' | 'USD'>('IQD');
  const [isSpotlightOpen, setIsSpotlightOpen] = useState<boolean>(false);

  // Load or initialize state from LocalStorage
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

    logAction('تۆمارکردنی بەخشین', `بڕی ${data.amount.toLocaleString()} ${data.currency} لەلایەن [${data.donorName}] بەخشرا`);
    return newDonation;
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

  // Inventory
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

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const sendSimulationSMS = (phone: string, recipientName: string, text: string) => {
    const notif: AppNotification = {
      id: `sms-${Date.now()}`,
      title: `نامەی کورت نێردرا بۆ [${recipientName}]`,
      message: `ژمارە: ${phone} | ناوەڕۆک: "${text}"`,
      type: 'system',
      timestamp: 'ئێستا',
      read: false,
      priority: 'low'
    };
    setNotifications(prev => [notif, ...prev]);
    logAction('ناردنی SMS', `نامەی کورت نێردرا بۆ [${recipientName}] (${phone})`);
  };

  // Export Data JSON
  const exportDataJSON = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      organization: 'ڕێکخراوی ئایندەی خێرخوازی',
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

  // Reset Data to Defaults
  const resetAllData = () => {
    localStorage.clear();
    setBeneficiaries(INITIAL_BENEFICIARIES);
    setDonors(INITIAL_DONORS);
    setDonations(INITIAL_DONATIONS);
    setProjects(INITIAL_PROJECTS);
    setInventory(INITIAL_INVENTORY);
    setTransactions(INITIAL_TRANSACTIONS);
    setVolunteers(INITIAL_VOLUNTEERS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setDocuments(INITIAL_DOCUMENTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    logAction('گەڕانەوە بۆ داتای سەرەتایی', 'تەواوی داتاکان گەڕێنرانەوە بۆ نموونەی بنەڕەتی', 'update');
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
        updateBeneficiary,
        deleteBeneficiary,
        checkDuplicate,
        addAidRecord,
        donors,
        donations,
        addDonor,
        addDonation,
        projects,
        addProject,
        updateProject,
        inventory,
        updateInventoryQuantity,
        distributeAidFromInventory,
        transactions,
        addTransaction,
        currencyView,
        setCurrencyView,
        volunteers,
        addVolunteer,
        logVolunteerHours,
        documents,
        addDocument,
        notifications,
        markNotificationRead,
        sendSimulationSMS,
        auditLogs,
        isSpotlightOpen,
        setIsSpotlightOpen,
        exportDataJSON,
        resetAllData
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
