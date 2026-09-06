import { createClient } from '@supabase/supabase-js';
import {
  Beneficiary,
  Donor,
  Donation,
  Project,
  InventoryItem,
  FinancialTransaction,
  Volunteer,
  DocumentItem,
  AuditLog
} from '../types';

// Detect Supabase credentials from environment or fallback
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.khair_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_khair_SUPABASE_URL ||
  'https://yagqdxfauysamtcejpir.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_khair_SUPABASE_ANON_KEY ||
  import.meta.env.khair_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ3FkeGZhdXlzYW10Y2VqcGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTQ4NzUsImV4cCI6MjEwNDI3MDg3NX0.-NrzTci9GPoNjHuScrlQ44xFYTcQkXoQ4u-0KkGa9Qw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Safe background sync executor that gracefully handles PromiseLike Postgrest builders
export const safeSupabaseSync = async (promiseLike: PromiseLike<any>) => {
  try {
    const res = await promiseLike;
    if (res?.error) {
      console.warn('Supabase sync warning:', res.error.message || res.error);
    }
    return res;
  } catch (err: any) {
    console.warn('Supabase sync catch:', err?.message || err);
  }
};

// ==========================================
// Beneficiaries Mapper & API
// ==========================================
export const mapBeneficiaryToDb = (b: Beneficiary) => ({
  id: b.id,
  national_id: b.nationalId || '',
  full_name: b.fullName,
  phone: b.phone || '',
  gender: b.gender || 'male',
  age: b.age || 0,
  is_family_head: b.isFamilyHead ?? true,
  is_provider: b.isProvider ?? true,
  provider_name: b.providerName || '',
  is_only_provider: b.isOnlyProvider ?? true,
  other_providers: b.otherProviders || [],
  governorate: b.governorate,
  address: b.address || '',
  family_members: b.familyMembers || 1,
  monthly_income_iqd: b.monthlyIncomeIQD || 0,
  need_category: b.needCategory || 'poor',
  status: b.status || 'pending',
  notes: b.notes || '',
  registered_date: b.registeredDate,
  aid_history: b.aidHistory || [],
  documents: b.documents || [],
  location: b.location || {},
  updated_at: new Date().toISOString()
});

export const mapBeneficiaryFromDb = (row: any): Beneficiary => ({
  id: row.id,
  nationalId: row.national_id || '',
  fullName: row.full_name,
  phone: row.phone || '',
  gender: row.gender || 'male',
  age: Number(row.age) || 0,
  isFamilyHead: row.is_family_head ?? true,
  isProvider: row.is_provider ?? true,
  providerName: row.provider_name || '',
  isOnlyProvider: row.is_only_provider ?? true,
  otherProviders: row.other_providers || [],
  governorate: row.governorate || 'هەولێر',
  address: row.address || '',
  familyMembers: Number(row.family_members) || 1,
  monthlyIncomeIQD: Number(row.monthly_income_iqd) || 0,
  needCategory: row.need_category || 'poor',
  status: row.status || 'pending',
  notes: row.notes || '',
  registeredDate: row.registered_date || new Date().toISOString().split('T')[0],
  aidHistory: row.aid_history || [],
  documents: row.documents || [],
  location: row.location || undefined
});

// ==========================================
// Donors Mapper & API
// ==========================================
export const mapDonorToDb = (d: Donor) => ({
  id: d.id,
  full_name: d.fullName,
  type: d.type || 'individual',
  phone: d.phone || '',
  email: d.email || '',
  governorate: d.governorate || '',
  total_donations_iqd: d.totalDonationsIQD || 0,
  total_donations_usd: d.totalDonationsUSD || 0,
  status: d.status || 'active',
  notes: d.notes || '',
  joined_date: d.joinedDate,
  updated_at: new Date().toISOString()
});

export const mapDonorFromDb = (row: any): Donor => ({
  id: row.id,
  fullName: row.full_name,
  type: row.type || 'individual',
  phone: row.phone || '',
  email: row.email || '',
  governorate: row.governorate || '',
  totalDonationsIQD: Number(row.total_donations_iqd) || 0,
  totalDonationsUSD: Number(row.total_donations_usd) || 0,
  status: row.status || 'active',
  notes: row.notes || '',
  joinedDate: row.joined_date || new Date().toISOString().split('T')[0]
});

// ==========================================
// Donations Mapper & API
// ==========================================
export const mapDonationToDb = (don: Donation) => ({
  id: don.id,
  donor_id: don.donorId || '',
  donor_name: don.donorName,
  amount: don.amount,
  currency: don.currency || 'IQD',
  exchange_rate_at_date: don.exchangeRateAtDate || 150000,
  converted_amount: don.convertedAmount || 0,
  exchange_rate_source: don.exchangeRateSource || '',
  date: don.date,
  method: don.method,
  project_id: don.projectId || '',
  project_name: don.projectName || '',
  receipt_number: don.receiptNumber,
  category: don.category || 'cash',
  category_label: don.categoryLabel || '',
  item_details: don.itemDetails || {},
  status: don.status || 'completed',
  notes: don.notes || '',
  updated_at: new Date().toISOString()
});

export const mapDonationFromDb = (row: any): Donation => ({
  id: row.id,
  donorId: row.donor_id || '',
  donorName: row.donor_name,
  amount: Number(row.amount) || 0,
  currency: row.currency || 'IQD',
  exchangeRateAtDate: row.exchange_rate_at_date ? Number(row.exchange_rate_at_date) : undefined,
  convertedAmount: row.converted_amount ? Number(row.converted_amount) : undefined,
  exchangeRateSource: row.exchange_rate_source || undefined,
  date: row.date,
  method: row.method,
  projectId: row.project_id || undefined,
  projectName: row.project_name || undefined,
  receiptNumber: row.receipt_number,
  category: row.category || 'cash',
  categoryLabel: row.category_label || undefined,
  itemDetails: row.item_details || undefined,
  status: row.status || 'completed',
  notes: row.notes || ''
});

// ==========================================
// Projects Mapper & API
// ==========================================
export const mapProjectToDb = (p: Project) => ({
  id: p.id,
  title: p.title,
  category: p.category,
  description: p.description,
  target_budget_usd: p.targetBudgetUSD || 0,
  target_budget_iqd: p.targetBudgetIQD || 0,
  budget_currency: p.budgetCurrency || 'USD',
  raised_budget_usd: p.raisedBudgetUSD || 0,
  raised_budget_iqd: p.raisedBudgetIQD || 0,
  spent_budget_usd: p.spentBudgetUSD || 0,
  spent_budget_iqd: p.spentBudgetIQD || 0,
  start_date: p.startDate,
  end_date: p.endDate,
  status: p.status,
  beneficiaries_count: p.beneficiariesCount || 0,
  volunteers_count: p.volunteersCount || 0,
  governorates: p.governorates || [],
  milestones: p.milestones || [],
  image: p.image || '',
  updated_at: new Date().toISOString()
});

export const mapProjectFromDb = (row: any): Project => ({
  id: row.id,
  title: row.title,
  category: row.category,
  description: row.description,
  targetBudgetUSD: Number(row.target_budget_usd) || 0,
  targetBudgetIQD: row.target_budget_iqd ? Number(row.target_budget_iqd) : undefined,
  budgetCurrency: row.budget_currency || 'USD',
  raisedBudgetUSD: Number(row.raised_budget_usd) || 0,
  raisedBudgetIQD: row.raised_budget_iqd ? Number(row.raised_budget_iqd) : undefined,
  spentBudgetUSD: Number(row.spent_budget_usd) || 0,
  spentBudgetIQD: row.spent_budget_iqd ? Number(row.spent_budget_iqd) : undefined,
  startDate: row.start_date,
  endDate: row.end_date,
  status: row.status,
  beneficiariesCount: Number(row.beneficiaries_count) || 0,
  volunteersCount: Number(row.volunteers_count) || 0,
  governorates: row.governorates || [],
  milestones: row.milestones || [],
  image: row.image || ''
});

// ==========================================
// Inventory Mapper & API
// ==========================================
export const mapInventoryToDb = (item: InventoryItem) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  quantity: item.quantity,
  unit: item.unit,
  location: item.location,
  min_alert_threshold: item.minAlertThreshold,
  last_updated: item.lastUpdated,
  source_receipt_number: item.sourceReceiptNumber || null,
  source_donor_name: item.sourceDonorName || null,
  source_donation_id: item.sourceDonationId || null,
  donor_id: item.donorId || null,
  estimated_market_value: item.estimatedMarketValue || 0,
  contents_description: item.contentsDescription || '',
  notes: item.notes || '',
  updated_at: new Date().toISOString()
});

export const mapInventoryFromDb = (row: any): InventoryItem => ({
  id: row.id,
  name: row.name,
  category: row.category,
  quantity: Number(row.quantity) || 0,
  unit: row.unit,
  location: row.location,
  minAlertThreshold: Number(row.min_alert_threshold) || 10,
  lastUpdated: row.last_updated,
  sourceReceiptNumber: row.source_receipt_number || undefined,
  sourceDonorName: row.source_donor_name || undefined,
  sourceDonationId: row.source_donation_id || undefined,
  donorId: row.donor_id || undefined,
  estimatedMarketValue: row.estimated_market_value ? Number(row.estimated_market_value) : undefined,
  contentsDescription: row.contents_description || undefined,
  notes: row.notes || undefined
});

// ==========================================
// Financial Transactions Mapper & API
// ==========================================
export const mapTransactionToDb = (tx: FinancialTransaction) => ({
  id: tx.id,
  type: tx.type,
  amount: tx.amount,
  currency: tx.currency,
  exchange_rate_at_date: tx.exchangeRateAtDate || 150000,
  converted_amount: tx.convertedAmount || 0,
  category: tx.category,
  description: tx.description,
  date: tx.date,
  recorded_by: tx.recordedBy,
  receipt_number: tx.receiptNumber || '',
  related_project_id: tx.relatedProjectId || '',
  updated_at: new Date().toISOString()
});

export const mapTransactionFromDb = (row: any): FinancialTransaction => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount) || 0,
  currency: row.currency,
  exchangeRateAtDate: row.exchange_rate_at_date ? Number(row.exchange_rate_at_date) : undefined,
  convertedAmount: row.converted_amount ? Number(row.converted_amount) : undefined,
  category: row.category,
  description: row.description,
  date: row.date,
  recordedBy: row.recorded_by,
  receiptNumber: row.receipt_number || undefined,
  relatedProjectId: row.related_project_id || undefined
});

// ==========================================
// Volunteers Mapper & API
// ==========================================
export const mapVolunteerToDb = (v: Volunteer) => ({
  id: v.id,
  full_name: v.fullName,
  phone: v.phone,
  email: v.email || '',
  governorate: v.governorate,
  skills: v.skills || [],
  hours_logged: v.hoursLogged || 0,
  availability: v.availability,
  blood_type: v.bloodType,
  badge_number: v.badgeNumber,
  assigned_project_id: v.assignedProjectId || '',
  status: v.status || 'active',
  joined_date: v.joinedDate,
  updated_at: new Date().toISOString()
});

export const mapVolunteerFromDb = (row: any): Volunteer => ({
  id: row.id,
  fullName: row.full_name,
  phone: row.phone,
  email: row.email || '',
  governorate: row.governorate,
  skills: row.skills || [],
  hoursLogged: Number(row.hours_logged) || 0,
  availability: row.availability,
  bloodType: row.blood_type,
  badgeNumber: row.badge_number,
  assignedProjectId: row.assigned_project_id || undefined,
  status: row.status || 'active',
  joinedDate: row.joined_date
});

// ==========================================
// Documents Mapper & API
// ==========================================
export const mapDocumentToDb = (doc: DocumentItem) => ({
  id: doc.id,
  title: doc.title,
  category: doc.category,
  file_type: doc.fileType,
  file_size: doc.fileSize,
  upload_date: doc.uploadDate,
  related_entity: doc.relatedEntity,
  url: doc.url || '',
  updated_at: new Date().toISOString()
});

export const mapDocumentFromDb = (row: any): DocumentItem => ({
  id: row.id,
  title: row.title,
  category: row.category,
  fileType: row.file_type,
  fileSize: row.file_size,
  uploadDate: row.upload_date,
  relatedEntity: row.related_entity,
  url: row.url || undefined
});

// ==========================================
// Audit Logs Mapper & API
// ==========================================
export const mapAuditLogToDb = (log: AuditLog) => ({
  id: log.id,
  timestamp: log.timestamp,
  user_name: log.userName,
  user_role: log.userRole || 'admin',
  action: log.action,
  details: log.details,
  type: log.type
});

export const mapAuditLogFromDb = (row: any): AuditLog => ({
  id: row.id,
  timestamp: row.timestamp,
  userName: row.user_name,
  userRole: row.user_role || 'admin',
  action: row.action,
  details: row.details,
  type: row.type
});
