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
  GovernorateStats
} from '../types';

export const INITIAL_BENEFICIARIES: Beneficiary[] = [
  {
    id: 'ben-01',
    nationalId: '19854728901',
    fullName: 'ئاراس قادر مەحموود',
    phone: '07501234567',
    governorate: 'هەولێر',
    address: 'هەولێر - گەڕەکی تەیراوە، نزیک مزگەوتی قازی',
    familyMembers: 6,
    monthlyIncomeIQD: 180000,
    needCategory: 'poor',
    status: 'aided',
    notes: 'خێزانێکی دەستکورتن و کرێچین، باوکی خێزان نەخۆشی درێژخایەنی هەیە',
    registeredDate: '2025-11-14',
    aidHistory: [
      {
        id: 'aid-101',
        date: '2026-01-10',
        type: 'monetary',
        amountIQD: 250000,
        projectTitle: 'کەمپەینی گەرمایی زستانە',
        distributedBy: 'کاروان ساڵح',
        notes: 'هاوکاری نەختینەیی بۆ دابینکردنی سووتەمەنی'
      },
      {
        id: 'aid-102',
        date: '2026-02-20',
        type: 'in-kind',
        itemName: 'سەبەتەی خۆراکی خێزانی',
        quantity: 1,
        projectTitle: 'دابەشکردنی خۆراکی مانگانە',
        distributedBy: 'دڵسۆز کامەران'
      }
    ]
  },
  {
    id: 'ben-02',
    nationalId: '19923847102',
    fullName: 'شلێر عەزیز حەمەئەمین',
    phone: '07709876543',
    governorate: 'سلێمانی',
    address: 'سلێمانی - ڕاپەڕین، نزیک بازاڕی شێخ سەعید',
    familyMembers: 4,
    monthlyIncomeIQD: 90000,
    needCategory: 'orphan',
    status: 'approved',
    notes: 'دایکی ٣ منداڵی بێباوکە و بێ سەرپەرشتن، پێویستیان بە هاوکاری بەردەوام هەیە',
    registeredDate: '2025-12-01',
    aidHistory: [
      {
        id: 'aid-103',
        date: '2026-01-25',
        type: 'monetary',
        amountIQD: 300000,
        projectTitle: 'سندووقی پشتگیری هەتیوان و بێباوکان',
        distributedBy: 'شەیما نەوزاد'
      }
    ]
  },
  {
    id: 'ben-03',
    nationalId: '19799201948',
    fullName: 'ڕێبوار جەلال تۆفیق',
    phone: '07504433221',
    governorate: 'دهۆک',
    address: 'دهۆک - ماسیکێ، کۆڵانی ١٤',
    familyMembers: 7,
    monthlyIncomeIQD: 120000,
    needCategory: 'sick',
    status: 'approved',
    notes: 'کچەکەی پێویستی بە نەشتەرگەری چاو هەیە لە نەخۆشخانەی نانەکەلی',
    registeredDate: '2026-01-18',
    aidHistory: [
      {
        id: 'aid-104',
        date: '2026-02-05',
        type: 'monetary',
        amountIQD: 500000,
        projectTitle: 'سندووقی چارەسەری نەخۆشە هەژارەکان',
        distributedBy: 'دیار نەژاد'
      }
    ]
  },
  {
    id: 'ben-04',
    nationalId: '19957738201',
    fullName: 'پەیمان عومەر عەلی',
    phone: '07715566778',
    governorate: 'هەڵەبجە',
    address: 'هەڵەبجەی شەهید - گەڕەکی مامۆستایان',
    familyMembers: 5,
    monthlyIncomeIQD: 0,
    needCategory: 'disabled',
    status: 'pending',
    notes: 'خاوەن پێداویستی تایبەتە و عەرەبانەی کەمئەندامی نییە، بێ کار و داهاتە',
    registeredDate: '2026-02-28',
    aidHistory: []
  },
  {
    id: 'ben-05',
    nationalId: '19882201934',
    fullName: 'لوقمان فەریق ئەحمەد',
    phone: '07508899001',
    governorate: 'کەرکووک',
    address: 'کەرکووک - ڕەحیماوا، نزیک قوتابخانەی کوردستان',
    familyMembers: 8,
    monthlyIncomeIQD: 220000,
    needCategory: 'poor',
    status: 'aided',
    notes: 'کرێکاری ڕۆژانەیە بەهۆی ڕووداوی کارەوە ئێستا دەستی شکاوە و ناتوانێت کار بکات',
    registeredDate: '2025-10-10',
    aidHistory: [
      {
        id: 'aid-105',
        date: '2026-01-02',
        type: 'in-kind',
        itemName: 'سەبەتەی خۆراک و بەتانی',
        quantity: 2,
        projectTitle: 'کەمپەینی فریاگوزاری زستانە',
        distributedBy: 'ئاری محەمەد'
      }
    ]
  },
  {
    id: 'ben-06',
    nationalId: '19984492015',
    fullName: 'سۆران کەریم مستەفا',
    phone: '07703344556',
    governorate: 'گەرمیان',
    address: 'کەلار - گەڕەکی سەرکەوتن',
    familyMembers: 3,
    monthlyIncomeIQD: 100000,
    needCategory: 'student',
    status: 'approved',
    notes: 'خوێندکاری کۆلێژە و خێزانەکەی توانای دابینکردنی خەرجی خوێندن و کرێی بەشەناوەخۆییان نییە',
    registeredDate: '2026-01-05',
    aidHistory: [
      {
        id: 'aid-106',
        date: '2026-01-15',
        type: 'monetary',
        amountIQD: 150000,
        projectTitle: 'پڕۆژەی پشتیوانی خوێندکارانی زانکۆ',
        distributedBy: 'پشتیوان کەریم'
      }
    ]
  }
];

export const INITIAL_DONORS: Donor[] = [
  {
    id: 'donor-01',
    fullName: 'حاجی ڕەشید ئەحمەد دۆسکی',
    type: 'individual',
    phone: '07501112233',
    email: 'haji.rashid@gmail.com',
    governorate: 'دهۆک',
    totalDonationsIQD: 15000000,
    totalDonationsUSD: 10000,
    status: 'active',
    notes: 'بەخشەری مانگانەی بەردەوامە بۆ سندووقی هەتیوان',
    joinedDate: '2024-03-10'
  },
  {
    id: 'donor-02',
    fullName: 'کۆمپانیای ئاسیاسێڵ بۆ پەیوەندییەکان',
    type: 'corporate',
    phone: '07701110000',
    email: 'csr@asiacell.com',
    governorate: 'سلێمانی',
    totalDonationsIQD: 45000000,
    totalDonationsUSD: 30000,
    status: 'active',
    notes: 'سپۆنسەری کەمپەینەکانی زستان و سەبەتەی خۆراکی ڕەمەزان',
    joinedDate: '2023-01-15'
  },
  {
    id: 'donor-03',
    fullName: 'دکتۆرە شلێر فەرهاد زەنگەنە',
    type: 'individual',
    phone: '07509988776',
    email: 'dr.shler@medical-ngo.krd',
    governorate: 'هەولێر',
    totalDonationsIQD: 8500000,
    totalDonationsUSD: 5500,
    status: 'active',
    notes: 'پشتگیری دارایی نەشتەرگەری نەخۆشانی دڵ و چاو دەکات',
    joinedDate: '2024-08-20'
  },
  {
    id: 'donor-04',
    fullName: 'دەزگای خێرخوازی نێودەوڵەتی هاوبەش',
    type: 'organization',
    phone: '07505556677',
    email: 'info@partner-aid.org',
    governorate: 'هەولێر',
    totalDonationsIQD: 75000000,
    totalDonationsUSD: 50000,
    status: 'active',
    notes: 'دابینکردنی بەتانی و ئامێرەکانی فلتەری ئاو بۆ کەمپەکان',
    joinedDate: '2023-06-01'
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'don-01',
    receiptNumber: 'REC-2026-001',
    donorId: 'donor-01',
    donorName: 'حاجی ڕەشید ئەحمەد دۆسکی',
    amount: 2500000,
    currency: 'IQD',
    method: 'کاش',
    date: '2026-02-15',
    projectId: 'proj-01',
    projectName: 'سەبەتەی خۆراکی خێزانی پیرۆز',
    notes: 'بەخشینی کاش بە دەستی ژمێریار گەیشت',
    status: 'completed'
  },
  {
    id: 'don-02',
    receiptNumber: 'REC-2026-002',
    donorId: 'donor-02',
    donorName: 'کۆمپانیای ئاسیاسێڵ بۆ پەیوەندییەکان',
    amount: 10000,
    currency: 'USD',
    method: 'حەواڵەی بانکی',
    date: '2026-02-18',
    projectId: 'proj-02',
    projectName: 'کەمپەینی زستانە و گەرمکەرەوە بۆ هەژاران',
    notes: 'حەواڵە لە ڕێگەی بانکی جیهان بۆ هەژماری فەرمی ڕێکخراو',
    status: 'completed'
  },
  {
    id: 'don-03',
    receiptNumber: 'REC-2026-003',
    donorId: 'donor-03',
    donorName: 'دکتۆرە شلێر فەرهاد زەنگەنە',
    amount: 1500000,
    currency: 'IQD',
    method: 'FIB',
    date: '2026-02-25',
    projectId: 'proj-03',
    projectName: 'سندووقی چارەسەری نەخۆشانی شێرپەنجە',
    notes: 'لەڕێی کارتی ئەلیکترۆنی بانکی یەکەمی عێراق FIB دراوە',
    status: 'completed'
  },
  {
    id: 'don-04',
    receiptNumber: 'REC-2026-004',
    donorId: 'donor-01',
    donorName: 'حاجی ڕەشید ئەحمەد دۆسکی',
    amount: 1000,
    currency: 'USD',
    method: 'FastPay',
    date: '2026-03-01',
    projectId: 'proj-04',
    projectName: 'هاوکاری خوێندکارانی هەژاری زانکۆکان',
    notes: 'بەخشینی مانگانەی خوێندکاران',
    status: 'completed'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-01',
    title: 'سەبەتەی خۆراکی پیرۆز بۆ ٥٠٠ خێزان',
    category: 'خۆراک',
    description: 'دابینکردنی سەبەتەی تەواوی خۆراکی پڕ پێداویستی بۆ ٥٠٠ خێزانی کەمدرامەت و بێباوک لە شارەکانی کوردستان.',
    targetBudgetUSD: 25000,
    raisedBudgetUSD: 21500,
    spentBudgetUSD: 18000,
    startDate: '2026-01-10',
    endDate: '2026-04-15',
    status: 'active',
    governorates: ['هەولێر', 'سلێمانی', 'دهۆک'],
    beneficiariesCount: 420,
    volunteersCount: 34,
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'proj-02',
    title: 'کەمپەینی گەرمایی زستانە و سووتەمەنی',
    category: 'کەمپەینی زستانە',
    description: 'دابەشکردنی زۆپای نەوت، بەتانی ئەستوور، و نەوتی سپی بۆ خێزانە هەژارەکان لە ناوچە شاخاوییەکان.',
    targetBudgetUSD: 35000,
    raisedBudgetUSD: 35000,
    spentBudgetUSD: 33400,
    startDate: '2025-11-01',
    endDate: '2026-03-10',
    status: 'completed',
    governorates: ['دهۆک', 'هەڵەبجە', 'سلێمانی'],
    beneficiariesCount: 650,
    volunteersCount: 48,
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'proj-03',
    title: 'سندووقی چارەسەری نەخۆشە هەژارەکان',
    category: 'تەندروستی',
    description: 'دابینکردنی خەرجی نەشتەرگەری، کڕینی دەرمانی گرانبەها، و چارەسەری کیمیایی بۆ نەخۆشانی کەمدەرامەت.',
    targetBudgetUSD: 50000,
    raisedBudgetUSD: 38200,
    spentBudgetUSD: 29000,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    governorates: ['هەولێر', 'سلێمانی', 'کەرکووک'],
    beneficiariesCount: 180,
    volunteersCount: 16,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'proj-04',
    title: 'پشتیوانی خوێندکارانی بێباوک و هەژار',
    category: 'پەروەردە و فێرکردن',
    description: 'دابینکردنی جانتا، کەرەستەی خوێندن، لاپتۆپ و هاوکاری دارایی کرێی هاتوچۆ بۆ خوێندکارانی زانکۆ و قوتابخانە.',
    targetBudgetUSD: 18000,
    raisedBudgetUSD: 12400,
    spentBudgetUSD: 9800,
    startDate: '2025-09-15',
    endDate: '2026-06-30',
    status: 'active',
    governorates: ['هەولێر', 'سلێمانی', 'گەرمیان', 'هەڵەبجە'],
    beneficiariesCount: 310,
    volunteersCount: 22,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-01',
    name: 'سەبەتەی خۆراکی تەواو (ڕۆن، برنج، شەکر، ئارد، نیسک)',
    category: 'خۆراک',
    quantity: 48,
    unit: 'سەبەتە',
    minAlertThreshold: 50,
    location: 'کۆگای سەرەکی - هەولێر',
    lastUpdated: '2026-03-01'
  },
  {
    id: 'inv-02',
    name: 'بەتانی ئەستووری زستانە دوو کەسی',
    category: 'پۆشاک',
    quantity: 14,
    unit: 'دانە',
    minAlertThreshold: 30, // Low stock warning!
    location: 'کۆگای سلێمانی - تاسڵوجە',
    lastUpdated: '2026-02-28'
  },
  {
    id: 'inv-03',
    name: 'زۆپای نەوتی عەلائەدین',
    category: 'گەرمکەرەوە و سووتەمەنی',
    quantity: 8,
    unit: 'دانە',
    minAlertThreshold: 15, // Low stock warning!
    location: 'کۆگای دهۆک',
    lastUpdated: '2026-02-20'
  },
  {
    id: 'inv-04',
    name: 'عەرەبانەی کەمئەندامی دەستی و کارەبایی',
    category: 'پێداویستی پزیشکی',
    quantity: 22,
    unit: 'دانە',
    minAlertThreshold: 5,
    location: 'کۆگای سەرەکی - هەولێر',
    lastUpdated: '2026-02-24'
  },
  {
    id: 'inv-05',
    name: 'جانتای قوتابخانە بە کەرەستەی تەواوەوە',
    category: 'کەلوپەلی ناوماڵ',
    quantity: 160,
    unit: 'سێت',
    minAlertThreshold: 40,
    location: 'کۆگای سلێمانی',
    lastUpdated: '2026-01-30'
  }
];

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'tx-01',
    type: 'income',
    amount: 10000,
    currency: 'USD',
    category: 'بەخشینی کۆمپانیاکان',
    date: '2026-02-18',
    description: 'بەخشینی ئاسیاسێڵ بۆ کەمپەینی زستانە',
    recordedBy: 'هێمن ئەحمەد (ژمێریار)',
    relatedProjectId: 'proj-02',
    receiptNumber: 'REC-2026-002'
  },
  {
    id: 'tx-02',
    type: 'expense',
    amount: 4500000,
    currency: 'IQD',
    category: 'کڕینی خۆراک و سەبەتە',
    date: '2026-02-22',
    description: 'کڕینی برنج و زەیتی کوردی بۆ پڕۆژەی سەبەتەی خۆراک',
    recordedBy: 'هێمن ئەحمەد (ژمێریار)',
    relatedProjectId: 'proj-01',
    receiptNumber: 'EXP-2026-044'
  },
  {
    id: 'tx-03',
    type: 'income',
    amount: 2500000,
    currency: 'IQD',
    category: 'بەخشینی کەسی کاش',
    date: '2026-02-15',
    description: 'بەخشینی حاجی ڕەشید ئەحمەد بۆ بێباوکان',
    recordedBy: 'شەیما نەوزاد',
    relatedProjectId: 'proj-01',
    receiptNumber: 'REC-2026-001'
  },
  {
    id: 'tx-04',
    type: 'expense',
    amount: 1800,
    currency: 'USD',
    category: 'خەرجی لۆجستی و گواستنەوە',
    date: '2026-02-26',
    description: 'کرێی بارهەڵگرەکانی گواستنەوەی هاوکاری بۆ گوندەکانی باڵەکایەتی',
    recordedBy: 'هێمن ئەحمەد (ژمێریار)',
    relatedProjectId: 'proj-02',
    receiptNumber: 'EXP-2026-049'
  },
  {
    id: 'tx-05',
    type: 'income',
    amount: 1500000,
    currency: 'IQD',
    category: 'بەخشینی ئۆنلاین FIB',
    date: '2026-02-25',
    description: 'بەخشینی د. شلێر بۆ سندووقی نەخۆشەکان',
    recordedBy: 'سیستەمی خۆکار',
    relatedProjectId: 'proj-03',
    receiptNumber: 'REC-2026-003'
  }
];

export const INITIAL_VOLUNTEERS: Volunteer[] = [
  {
    id: 'vol-01',
    fullName: 'کاروان ساڵح عومەر',
    phone: '07503332211',
    email: 'karwan.saleh@gmail.com',
    governorate: 'هەولێر',
    skills: ['شۆفێری بارهەڵگر', 'دابەشکردنی مەیدانی', 'فریاگوزاری سەرەتایی'],
    bloodType: 'O+',
    availability: 'ڕۆژانی پشوو',
    hoursLogged: 142,
    assignedProjectId: 'proj-01',
    status: 'active',
    joinedDate: '2024-05-12',
    badgeNumber: 'VOL-881'
  },
  {
    id: 'vol-02',
    fullName: 'شەیما نەوزاد ئەحمەد',
    phone: '07706665544',
    email: 'shayma.nawzad@outlook.com',
    governorate: 'سلێمانی',
    skills: ['تۆماری داتا و ئایتی', 'پەیوەندی کۆمەڵایەتی', 'وەرگێڕان'],
    bloodType: 'A+',
    availability: 'هەموو کات',
    hoursLogged: 215,
    assignedProjectId: 'proj-03',
    status: 'active',
    joinedDate: '2023-11-01',
    badgeNumber: 'VOL-602'
  },
  {
    id: 'vol-03',
    fullName: 'دیار نەژاد حسێن',
    phone: '07507778899',
    email: 'diyar.medical@yahoo.com',
    governorate: 'دهۆک',
    skills: ['پەرستاری و تەندروستی', 'ڕێکخستنی کۆگا'],
    bloodType: 'B+',
    availability: 'ئێواران',
    hoursLogged: 88,
    assignedProjectId: 'proj-03',
    status: 'active',
    joinedDate: '2025-02-10',
    badgeNumber: 'VOL-914'
  },
  {
    id: 'vol-04',
    fullName: 'لانە کامەران جەمیل',
    phone: '07712223344',
    email: 'lana.photography@gmail.com',
    governorate: 'هەڵەبجە',
    skills: ['فۆتۆگرافی و میدیا', 'دیزاینی گرافیک'],
    bloodType: 'AB+',
    availability: 'ڕۆژانی پشوو',
    hoursLogged: 95,
    assignedProjectId: 'proj-04',
    status: 'active',
    joinedDate: '2024-09-01',
    badgeNumber: 'VOL-740'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    title: 'ئاگاداری کەمبوونەوەی کۆگا!',
    message: 'بڕی بەتانی ئەستووری زستانە لە کۆگای سلێمانی کەمترە لە ئاستی دیاریکراو (١٤ دانە ماوە).',
    type: 'inventory',
    timestamp: 'پێش ٢ کاتژمێر',
    read: false,
    priority: 'high'
  },
  {
    id: 'notif-02',
    title: 'بەخشینی نوێی ئۆنلاین تۆمارکرا',
    message: 'بڕی ١,٥٠٠,٠٠٠ دینار لەڕێی FIB لەلایەن دکتۆرە شلێرەوە بەخشرا.',
    type: 'donation',
    timestamp: 'پێش ٥ کاتژمێر',
    read: false,
    priority: 'medium'
  },
  {
    id: 'notif-03',
    title: 'تەختەی ئاگاداری ڕێکخراو',
    message: 'کۆبوونەوەی ساڵانەی دەستەی باڵا و خۆبەخشان ڕۆژی شەممە لە هۆڵی سەرەکی دەبەسترێت.',
    type: 'announcement',
    timestamp: 'دوێنێ',
    read: true,
    priority: 'low'
  }
];

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-01',
    title: 'ناسنامەی باری شارستانی - ئاراس قادر',
    category: 'ناسنامە',
    fileType: 'PDF',
    fileSize: '1.4 MB',
    uploadDate: '2026-01-10',
    relatedEntity: 'ئاراس قادر مەحموود',
    url: '#'
  },
  {
    id: 'doc-02',
    title: 'ڕاپۆرتی پزیشکی نەخۆشخانەی نانەکەلی - ڕێبوار جەلال',
    category: 'ڕاپۆرتی پزیشکی',
    fileType: 'PDF',
    fileSize: '3.2 MB',
    uploadDate: '2026-01-18',
    relatedEntity: 'ڕێبوار جەلال تۆفیق',
    url: '#'
  },
  {
    id: 'doc-03',
    title: 'پسوولەی حەواڵەی بانکی بەخشینی ئاسیاسێڵ',
    category: 'پسوولەی دارایی',
    fileType: 'PNG',
    fileSize: '840 KB',
    uploadDate: '2026-02-18',
    relatedEntity: 'کۆمپانیای ئاسیاسێڵ',
    url: '#'
  },
  {
    id: 'doc-04',
    title: 'وێنەی مەیدانی دابەشکردنی زۆپا و بەتانی لە باڵەکایەتی',
    category: 'وێنەی مەیدانی',
    fileType: 'JPG',
    fileSize: '4.8 MB',
    uploadDate: '2026-02-26',
    relatedEntity: 'کەمپەینی زستانە',
    url: '#'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    timestamp: '2026-03-03 09:15:20',
    userName: 'سەرکەوت کامیل (بەڕێوەبەری سیستەم)',
    userRole: 'admin',
    action: 'تۆمارکردنی سوودمەندی نوێ',
    details: 'سوودمەند [پەیمان عومەر عەلی] تۆمارکرا بە سەرکەوتوویی',
    type: 'create'
  },
  {
    id: 'log-02',
    timestamp: '2026-03-02 16:40:11',
    userName: 'هێمن ئەحمەد (ژمێریار)',
    userRole: 'staff',
    action: 'دەرکردنی پسوولەی دارایی',
    details: 'پسوولەی بەخشین ژمارە REC-2026-004 دەرکرا بۆ حاجی ڕەشید دۆسکی',
    type: 'create'
  },
  {
    id: 'log-03',
    timestamp: '2026-03-01 11:22:04',
    userName: 'سەرکەوت کامیل (بەڕێوەبەر)',
    userRole: 'admin',
    action: 'نوێکردنەوەی بڕی کۆگا',
    details: 'کەمکردنەوەی ٢ سەبەتەی خۆراک بۆ دابەشکردنی مەیدانی',
    type: 'update'
  },
  {
    id: 'log-04',
    timestamp: '2026-02-28 14:05:33',
    userName: 'شەیما نەوزاد (کارمەند)',
    userRole: 'staff',
    action: 'پشکنینی ساختەکاری و دووبارەبوونەوە',
    details: 'پشکنین بۆ ژمارەی نیشتمانی ئەنجامدرا، هیچ دووبارەبوونەوەیەک نەدۆزرایەوە',
    type: 'auth'
  }
];

export const GOVERNORATE_STATS: GovernorateStats[] = [
  {
    name: 'هەولێر',
    beneficiariesCount: 420,
    totalAidDistributedIQD: 48500000,
    activeProjectsCount: 3,
    volunteersCount: 42,
    coordinates: { x: 55, y: 40 }
  },
  {
    name: 'سلێمانی',
    beneficiariesCount: 390,
    totalAidDistributedIQD: 41200000,
    activeProjectsCount: 4,
    volunteersCount: 38,
    coordinates: { x: 72, y: 62 }
  },
  {
    name: 'دهۆک',
    beneficiariesCount: 280,
    totalAidDistributedIQD: 32000000,
    activeProjectsCount: 2,
    volunteersCount: 28,
    coordinates: { x: 30, y: 22 }
  },
  {
    name: 'هەڵەبجە',
    beneficiariesCount: 160,
    totalAidDistributedIQD: 18400000,
    activeProjectsCount: 2,
    volunteersCount: 19,
    coordinates: { x: 84, y: 76 }
  },
  {
    name: 'کەرکووک',
    beneficiariesCount: 210,
    totalAidDistributedIQD: 24700000,
    activeProjectsCount: 2,
    volunteersCount: 22,
    coordinates: { x: 52, y: 65 }
  },
  {
    name: 'گەرمیان',
    beneficiariesCount: 175,
    totalAidDistributedIQD: 19800000,
    activeProjectsCount: 1,
    volunteersCount: 15,
    coordinates: { x: 78, y: 88 }
  },
  {
    name: 'زاخۆ',
    beneficiariesCount: 140,
    totalAidDistributedIQD: 15600000,
    activeProjectsCount: 2,
    volunteersCount: 14,
    coordinates: { x: 22, y: 15 }
  }
];
