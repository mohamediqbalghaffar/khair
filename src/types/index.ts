export type UserRole = 'admin' | 'manager' | 'staff' | 'volunteer' | 'donor' | 'auditor';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitleKurdish: string;
  avatar: string;
}

export type NeedCategory = 'poor' | 'orphan' | 'sick' | 'disabled' | 'displaced' | 'student';
export type BeneficiaryStatus = 'pending' | 'approved' | 'aided' | 'rejected';

export interface AidRecord {
  id: string;
  date: string;
  type: 'monetary' | 'in-kind';
  amountIQD?: number;
  itemName?: string;
  quantity?: number;
  projectTitle: string;
  distributedBy: string;
  notes?: string;
}

export interface Beneficiary {
  id: string;
  nationalId: string; // بۆ پشکنینی دووبارەبوونەوە
  fullName: string;
  phone: string;
  governorate: 'هەولێر' | 'سلێمانی' | 'دهۆک' | 'هەڵەبجە' | 'کەرکووک' | 'گەرمیان' | 'زاخۆ';
  address: string;
  familyMembers: number;
  monthlyIncomeIQD: number;
  needCategory: NeedCategory;
  status: BeneficiaryStatus;
  notes: string;
  registeredDate: string;
  aidHistory: AidRecord[];
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

export interface Donation {
  id: string;
  receiptNumber: string; // پسوولەی فەرمی
  donorId: string;
  donorName: string;
  amount: number;
  currency: 'IQD' | 'USD';
  method: 'کاش' | 'FastPay' | 'FIB' | 'ZainCash' | 'حەواڵەی بانکی' | 'کەرەستە و کاڵا';
  date: string;
  projectId?: string;
  projectName?: string;
  notes?: string;
  status: 'completed' | 'pending';
}

export interface Project {
  id: string;
  title: string;
  category: 'خۆراک' | 'تەندروستی' | 'کەمپەینی زستانە' | 'نیشتەجێبوون' | 'پەروەردە و فێرکردن' | 'فریاگوزاری خێرا';
  description: string;
  targetBudgetUSD: number;
  raisedBudgetUSD: number;
  spentBudgetUSD: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'upcoming';
  governorates: string[];
  beneficiariesCount: number;
  volunteersCount: number;
  image: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'خۆراک' | 'پۆشاک' | 'پێداویستی پزیشکی' | 'گەرمکەرەوە و سووتەمەنی' | 'کەلوپەلی ناوماڵ';
  quantity: number;
  unit: 'سەبەتە' | 'دانە' | 'کارتۆن' | 'سێت' | 'لیتر' | 'تەن';
  minAlertThreshold: number;
  location: string;
  lastUpdated: string;
}

export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currency: 'IQD' | 'USD';
  category: string;
  date: string;
  description: string;
  recordedBy: string;
  relatedProjectId?: string;
  receiptNumber?: string;
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
