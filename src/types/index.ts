export type UserRole = 'admin' | 'finance' | 'field_officer' | 'volunteer' | 'auditor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitleKurdish: string;
  avatar: string;
  phone?: string;
  status?: 'active' | 'pending' | 'suspended';
  lastLogin?: string;
  createdAt?: string;
}

export interface AppUserRecord {
  id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: UserRole;
  role_title_kurdish: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended';
  avatar?: string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export type NeedCategory = 'poor' | 'orphan' | 'sick' | 'disabled' | 'displaced' | 'student';
export type BeneficiaryStatus =
  | 'pending' // ⏳ لەژێر لێکۆڵینەوە (پێویستی بە سەردانی مەیدانی و بەدواداچوونە)
  | 'approved' // ✅ پەسەندکراو بۆ هاوکاری
  | 'urgent' // 🚨 حاڵەتی فریاگوزاری و بەپەلە
  | 'confidential' // 🔒 سوودمەندی نهێنی و پارێزراو
  | 'periodic' // 🔄 هاوکاری مانگانە / خولیی بەردەوام
  | 'suspended' // ⏸ ڕاگیراوی کاتی
  | 'rejected' // ❌ ڕەتکراوەتەوە
  | 'archived' // 📁 ئەرشیڤکراو
  | 'aided'; // 🎁 هاوکاریکراو

export interface AidRecord {
  id: string;
  date: string;
  type: 'monetary' | 'in-kind';
  amountIQD?: number;
  itemName?: string;
  quantity?: number;
  projectTitle: string;
  distributedBy: string;
  receiptNumber?: string;
  donorName?: string;
  notes?: string;
}

export interface OtherProvider {
  name: string;
  relation: string; // e.g. کوڕ، کچ، برای گەورە، هاوسەر
  monthlyIncomeIQD?: number;
}

export type BeneficiaryDocCategory =
  | 'ناسنامە'
  | 'کارتی نیشتمانی'
  | 'کۆبۆنی خۆراک'
  | 'ڕاپۆرتی پزیشکی'
  | 'بەڵگەنامەی نیشتەجێبوون'
  | 'وێنەی مەیدانی'
  | 'تر';

export interface BeneficiaryDocument {
  id: string;
  title: string;
  category: BeneficiaryDocCategory;
  fileName: string;
  fileSize?: string;
  fileType?: string;
  fileData?: string; // base64 / data URL for preview and download
  uploadDate: string;
}

export interface BeneficiaryLocation {
  lat: number;
  lng: number;
  label?: string;
  addressDetails?: string;
  tagDate?: string;
}

export interface Beneficiary {
  id: string;
  nationalId: string; // بۆ پشکنینی دووبارەبوونەوە
  fullName: string;
  phone: string;
  gender: 'male' | 'female'; // ڕەگەز: نێر / مێ
  age: number; // تەمەن
  isFamilyHead: boolean; // ئایا سەرۆکی خێزانە؟
  isProvider: boolean; // ئایا بژێوی خێزانەکە دابین دەکات؟
  providerName?: string; // ئەگەر نەخێر، کێ بژێوی دابین دەکات؟
  isOnlyProvider?: boolean; // ئەگەر بەڵێ، ئایا تەنها خۆیەتی؟
  otherProviders?: OtherProvider[]; // ئەگەر تەنها خۆی نییە، دابینکەرانی تر لە هەمان خێزان
  governorate: 'هەولێر' | 'سلێمانی' | 'دهۆک' | 'هەڵەبجە' | 'کەرکووک' | 'گەرمیان' | 'زاخۆ';
  address: string;
  familyMembers: number;
  monthlyIncomeIQD: number;
  needCategory: NeedCategory;
  status: BeneficiaryStatus;
  isConfidential?: boolean; // ئایا دۆسیەیەکی هەستیار و پارێزراوە؟
  notes: string;
  registeredDate: string;
  aidHistory: AidRecord[];
  documents?: BeneficiaryDocument[];
  location?: BeneficiaryLocation; // پێگەی جوگرافی وردی ماڵ لەسەر نەخشە
}

export type DonorType = 'individual' | 'corporate' | 'organization';

export interface Donor {
  id: string;
  fullName: string;
  type: DonorType;
  phone: string;
  email: string;
  governorate: string;
  totalDonationsIQD: number;
  totalDonationsUSD: number;
  status: 'active' | 'inactive';
  notes: string;
  joinedDate: string;
}

export type DonationCategory =
  | 'cash'
  | 'food_basket'
  | 'student_supplies'
  | 'clothes'
  | 'medical'
  | 'heating_appliances'
  | 'qurbani_meat'
  | 'other_in_kind';

export interface DonationItemDetails {
  quantity?: number;
  unit?: string;
  weightKgPerUnit?: number;
  contentsDescription?: string;
  unitPrice?: number; // نرخی یەکە (بۆ هەر دانەیەک/سەبەتەیەک)
  estimatedMarketValue?: number; // کۆی بەهای گشتی
}

export interface Donation {
  id: string;
  receiptNumber: string; // پسوولەی فەرمی
  donorId: string;
  donorName: string;
  category?: DonationCategory;
  categoryLabel?: string;
  itemDetails?: DonationItemDetails;
  amount: number;
  currency: 'IQD' | 'USD';
  exchangeRateAtDate?: number; // نرخی بۆرسەی ڕۆژی بەخشین، بۆ نموونە 1530
  convertedAmount?: number; // هاوتای بەخشین بە دراوەکەی تر بەپێی نرخی ئەو ڕۆژە
  exchangeRateSource?: string; // سەرچاوەی بۆرسە، وەک AlanChand / بۆرسەی کیفاح و هەولێر
  method: 'کاش' | 'FastPay' | 'FIB' | 'ZainCash' | 'حەواڵەی بانکی' | 'کەرەستە و کاڵا' | 'ڕادەستکردنی مەیدانی';
  date: string;
  projectId?: string;
  projectName?: string;
  notes?: string;
  status: 'completed' | 'pending';
}

export type ProjectCategory =
  | 'خۆراک'
  | 'پەروەردە و خوێندکاران'
  | 'تەندروستی و پزیشکی'
  | 'کەمپەینی زستانە و سووتەمەنی'
  | 'جلوبەرگ و پۆشاک'
  | 'قوربانی و گۆشت'
  | 'نیشتەجێبوون و نۆژەنکردنەوە'
  | 'فریاگوزاری خێرا'
  | string;

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  description: string;
  targetBudgetUSD: number;
  targetBudgetIQD?: number;
  budgetCurrency?: 'USD' | 'IQD';
  raisedBudgetUSD: number;
  raisedBudgetIQD?: number;
  spentBudgetUSD: number;
  spentBudgetIQD?: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  governorates: string[];
  beneficiariesCount: number;
  volunteersCount: number;
  image: string;
  milestones?: ProjectMilestone[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'خۆراک' | 'پۆشاک' | 'پێداویستی پزیشکی' | 'گەرمکەرەوە و سووتەمەنی' | 'کەلوپەلی ناوماڵ' | string;
  quantity: number;
  unit: 'سەبەتە' | 'دانە' | 'کارتۆن' | 'سێت' | 'لیتر' | 'تەن' | string;
  minAlertThreshold: number;
  location: string;
  lastUpdated: string;
  sourceReceiptNumber?: string;
  sourceDonorName?: string;
  sourceDonationId?: string;
  donorId?: string;
  unitPrice?: number; // نرخی یەکە
  estimatedMarketValue?: number; // کۆی بەهای ماوە لە کۆگا
  contentsDescription?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: 'IQD' | 'USD';
  exchangeRateAtDate?: number;
  convertedAmount?: number;
  category: string;
  date: string;
  description: string;
  recordedBy: string;
  relatedProjectId?: string;
  receiptNumber?: string;
  isCash?: boolean; // ئایا نەختینەییە یان کەرەستە و عەینی
  itemQuantity?: number; // بڕی دانە لە بەخشینی عەینی
  itemUnit?: string; // یەکە
  itemUnitPrice?: number; // نرخی هەر یەکەیەک
}

export interface Volunteer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  governorate: string;
  skills: string[];
  bloodType: string;
  availability: 'هەموو کات' | 'ڕۆژانی پشوو' | 'ئێواران' | 'کاتی تەنگانە';
  hoursLogged: number;
  assignedProjectId?: string;
  status: 'active' | 'on_leave';
  joinedDate: string;
  badgeNumber: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'duplicate' | 'inventory' | 'donation' | 'announcement' | 'system';
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'ناسنامە' | 'ڕاپۆرتی پزیشکی' | 'پسوولەی دارایی' | 'گرێبەست' | 'وێنەی مەیدانی';
  fileType: string;
  fileSize: string;
  uploadDate: string;
  relatedEntity: string;
  url?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  type: 'create' | 'update' | 'delete' | 'auth' | 'export';
}

export interface GovernorateStats {
  name: string;
  beneficiariesCount: number;
  totalAidDistributedIQD: number;
  activeProjectsCount: number;
  volunteersCount: number;
  coordinates: { x: number; y: number }; // For visual liquid map
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tag: 'مەیدانی' | 'کۆبوونەوە' | 'پڕۆژەکان' | 'بەپەلە';
}

export interface AutomatedReminder {
  id: string;
  title: string;
  details: string;
  dueDate: string;
  type: 'distribution' | 'followup' | 'inventory' | 'finance';
  completed: boolean;
}
