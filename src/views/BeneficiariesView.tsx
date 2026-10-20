import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Beneficiary, NeedCategory, BeneficiaryStatus, OtherProvider, BeneficiaryDocument, BeneficiaryDocCategory, BeneficiaryLocation, AidRecord } from '../types';
import {
  downloadBeneficiaryExcelTemplate,
  parseBeneficiaryExcelFile,
  ParseResult
} from '../utils/excelBeneficiaryUtils';
import {
  Users,
  Search,
  Plus,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  MapPin,
  MessageSquare,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  UserCheck,
  User,
  Edit3,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ExternalLink,
  File,
  Check,
  UploadCloud,
  Navigation,
  Crosshair,
  RotateCcw,
  ShieldCheck,
  Lock,
  RefreshCw,
  PauseCircle,
  Archive,
  Banknote,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Filter,
  Phone
} from 'lucide-react';
import { getDonationCashMetrics } from '../utils/donationDistributionUtils';
import { useFeedback } from '../components/ui/FeedbackProvider';
import { PaginationBar } from '../components/ui/PaginationBar';
import { computeVulnerabilityScore } from '../utils/vulnerabilityScore';
import { useHaptics } from '../utils/useHaptics';

const categoryLabels: Record<NeedCategory, string> = {
  poor: 'هەژار و دەستکورت',
  orphan: 'بێباوک و هەتیو',
  sick: 'نەخۆشی درێژخایەن',
  disabled: 'خاوەن پێداویستی تایبەت',
  displaced: 'ئاوارە و پەنابەر',
  student: 'خوێندکاری هەژار'
};

const statusLabels: Record<string, string> = {
  pending: 'لەژێر لێکۆڵینەوە',
  approved: 'پەسەندکراوە',
  aided: 'هاوکاری پێدراوە',
  urgent: 'بەپەلە / فریاگوزاری',
  periodic: 'هاوکاری مانگانە',
  suspended: 'ڕاگیراوی کاتی',
  rejected: 'ڕەتکراوەتەوە',
  archived: 'ئەرشیڤکراو',
  confidential: 'دۆسیەی نهێنی'
};

export type BeneficiarySortField =
  | 'fullName'
  | 'age'
  | 'gender'
  | 'nationalId'
  | 'phone'
  | 'governorate'
  | 'address'
  | 'hasGps'
  | 'isProvider'
  | 'isFamilyHead'
  | 'needCategory'
  | 'familyMembers'
  | 'monthlyIncomeIQD'
  | 'status';

const sortFieldLabels: Record<BeneficiarySortField, string> = {
  fullName: 'ناوی تەواو',
  age: 'تەمەن',
  gender: 'ڕەگەز',
  nationalId: 'ژمارەی ناسنامە',
  phone: 'ژمارەی مۆبایل',
  governorate: 'پارێزگا',
  address: 'ناونیشان',
  hasGps: 'شوێنی GPS',
  isProvider: 'پێگەی بژێوی',
  isFamilyHead: 'سەرۆکایەتی خێزان',
  needCategory: 'حاڵەتی پێویستی',
  familyMembers: 'ئەندامانی خێزان',
  monthlyIncomeIQD: 'داهاتی مانگانە',
  status: 'دۆخی دۆسیە'
};

export const BeneficiariesView: React.FC = () => {
  const {
    beneficiaries,
    donations,
    addBeneficiary,
    addBeneficiariesBulk,
    updateBeneficiary,
    deleteBeneficiary,
    checkDuplicate,
    addAidRecord,
    updateAidRecord,
    deleteAidRecord,
    sendSMS,
    addBeneficiaryDocument,
    updateBeneficiaryDocument,
    deleteBeneficiaryDocument,
    selectedBeneficiaryIdForView,
    setSelectedBeneficiaryIdForView,
    setActiveTab,
    navigateToLocationOnMap,
    isCloudConnected,
    isCloudSyncing,
    syncLocalDataToCloud
  } = useApp();
  const { showToast, confirmAction } = useFeedback();
  const haptics = useHaptics();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');

  // Additional Table Head Filters
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');
  const [familyHeadFilter, setFamilyHeadFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [familyMembersFilter, setFamilyMembersFilter] = useState<string>('all');
  const [incomeFilter, setIncomeFilter] = useState<string>('all');
  const [hasGpsFilter, setHasGpsFilter] = useState<string>('all');
  const [isFiltersExpanded, setIsFiltersExpanded] = useState<boolean>(true);

  // Sorting State
  const [sortField, setSortField] = useState<BeneficiarySortField | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);

  // Screen Interactive Layout State
  const [isFullscreenTable, setIsFullscreenTable] = useState(false);
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Close fullscreen on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenTable) {
        setIsFullscreenTable(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenTable]);

  // Entry Mode inside modal: 'single' (one-by-one) | 'bulk' (excel)
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);

  // Auto-open dossier if navigated from DocumentsView or another section
  useEffect(() => {
    if (selectedBeneficiaryIdForView) {
      const target = beneficiaries.find(b => b.id === selectedBeneficiaryIdForView);
      if (target) {
        setSelectedBeneficiary(target);
      }
      setSelectedBeneficiaryIdForView(null);
    }
  }, [selectedBeneficiaryIdForView, beneficiaries, setSelectedBeneficiaryIdForView]);

  // Keep selectedBeneficiary synced with latest state
  useEffect(() => {
    if (selectedBeneficiary) {
      const refreshed = beneficiaries.find(b => b.id === selectedBeneficiary.id);
      if (refreshed && refreshed !== selectedBeneficiary) {
        setSelectedBeneficiary(refreshed);
      }
    }
  }, [beneficiaries]);
  const [isGiveAidModalOpen, setIsGiveAidModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  // Edit Beneficiary Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    nationalId: '',
    fullName: '',
    phone: '',
    gender: 'male' as 'male' | 'female',
    age: 35,
    isFamilyHead: true,
    isProvider: true,
    providerName: '',
    isOnlyProvider: true,
    otherProviders: [] as OtherProvider[],
    governorate: 'هەولێر' as Beneficiary['governorate'],
    address: '',
    familyMembers: 1,
    monthlyIncomeIQD: 0,
    needCategory: 'poor' as NeedCategory,
    status: 'pending' as BeneficiaryStatus,
    isConfidential: false,
    notes: '',
    documents: [] as BeneficiaryDocument[],
    location: undefined as BeneficiaryLocation | undefined
  });
  const [newEditOtherProvider, setNewEditOtherProvider] = useState<OtherProvider>({
    name: '',
    relation: 'کوڕ',
    monthlyIncomeIQD: 0
  });
  const [editDuplicateAlert, setEditDuplicateAlert] = useState<string | null>(null);

  // GPS Helper State
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleGetCurrentGPS = (isEdit: boolean) => {
    if (!navigator.geolocation) {
      showToast('وێبگەڕەکەت پشتگیری وەرگرتنی پێگەی GPS ناکات.', 'warning');
      return;
    }
    setIsGettingGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setIsGettingGPS(false);
        if (isEdit) {
          setEditFormData(prev => ({
            ...prev,
            location: {
              lat,
              lng,
              label: prev.fullName || 'ماڵی سوودمەند',
              addressDetails: prev.address,
              tagDate: new Date().toISOString().split('T')[0]
            }
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            location: {
              lat,
              lng,
              label: prev.fullName || 'ماڵی سوودمەند',
              addressDetails: prev.address,
              tagDate: new Date().toISOString().split('T')[0]
            }
          }));
        }
      },
      (err) => {
        setIsGettingGPS(false);
        setGpsError('نەتوانرا شوێنی ورد وەربگیرێت: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Lightbox / Document Preview State
  const [previewDocument, setPreviewDocument] = useState<BeneficiaryDocument | null>(null);

  // Document Upload Refs & Status
  const singleDocInputRef = useRef<HTMLInputElement>(null);
  const editDocInputRef = useRef<HTMLInputElement>(null);
  const viewDocInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingDocs, setIsProcessingDocs] = useState(false);

  // Form State for Single Add (Default status: pending / لەژێر لێکۆڵینەوە)
  const [formData, setFormData] = useState({
    nationalId: '',
    fullName: '',
    phone: '',
    gender: 'male' as 'male' | 'female',
    age: 35,
    isFamilyHead: true,
    isProvider: true,
    providerName: '',
    isOnlyProvider: true,
    otherProviders: [] as OtherProvider[],
    governorate: 'هەولێر' as Beneficiary['governorate'],
    address: '',
    familyMembers: 1,
    monthlyIncomeIQD: 0,
    needCategory: 'poor' as NeedCategory,
    status: 'pending' as BeneficiaryStatus,
    isConfidential: false,
    notes: '',
    documents: [] as BeneficiaryDocument[],
    location: undefined as BeneficiaryLocation | undefined
  });

  // State for new dynamic other provider inputs
  const [newOtherProvider, setNewOtherProvider] = useState<OtherProvider>({
    name: '',
    relation: 'کوڕ',
    monthlyIncomeIQD: 0
  });

  // Bulk Excel Import States
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ParseResult | null>(null);
  const [bulkImportSuccess, setBulkImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Give Aid Form State
  const [aidForm, setAidForm] = useState({
    type: 'monetary' as 'monetary' | 'in-kind',
    amountIQD: 50000,
    currency: 'IQD' as 'IQD' | 'USD',
    selectedDonationId: '',
    itemName: 'سەبەتەی خۆراک',
    quantity: 1,
    projectTitle: 'دابەشکردنی نەختینەی خێرخوازی',
    notes: ''
  });

  // Calculate available cash donations with remaining funds
  const availableCashDonations = (donations || [])
    .filter(d => !d.itemDetails)
    .map(d => ({
      donation: d,
      metrics: getDonationCashMetrics(d, beneficiaries)
    }))
    .filter(item => item.metrics.remainingCash > 0);

  // SMS Form State
  const [smsText, setSmsText] = useState(
    'سڵاو بەڕێز، تکایە ئاگاداربە هاوکارییە دیاریکراوەکەت لە بنکەی سەرەکی ڕێکخراوی بۆتان بامۆکی ئامادەیە بۆ وەرگرتن.'
  );

  // Edit Beneficiary Aid Record State
  const [editingBenAid, setEditingBenAid] = useState<AidRecord | null>(null);
  const [isEditBenAidModalOpen, setIsEditBenAidModalOpen] = useState(false);
  const [editBenAidForm, setEditBenAidForm] = useState({
    amount: 0,
    projectTitle: '',
    date: '',
    notes: ''
  });

  // Sorting Handlers
  const handleSort = (field: BeneficiarySortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField(null);
        setSortOrder('asc');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleTopFilterSortChange = (val: string) => {
    if (val === 'default') {
      setSortField(null);
      setSortOrder('asc');
    } else {
      const [field, order] = val.split(':');
      setSortField(field as BeneficiarySortField);
      setSortOrder((order as 'asc' | 'desc') || 'asc');
    }
  };

  const secondaryFiltersCount =
    (genderFilter !== 'all' ? 1 : 0) +
    (ageFilter !== 'all' ? 1 : 0) +
    (familyHeadFilter !== 'all' ? 1 : 0) +
    (providerFilter !== 'all' ? 1 : 0) +
    (familyMembersFilter !== 'all' ? 1 : 0) +
    (incomeFilter !== 'all' ? 1 : 0) +
    (hasGpsFilter !== 'all' ? 1 : 0) +
    (sortField !== null ? 1 : 0);

  const activeFiltersCount =
    (searchQuery.trim() ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (governorateFilter !== 'all' ? 1 : 0) +
    secondaryFiltersCount;

  const resetAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setGovernorateFilter('all');
    setGenderFilter('all');
    setAgeFilter('all');
    setFamilyHeadFilter('all');
    setProviderFilter('all');
    setFamilyMembersFilter('all');
    setIncomeFilter('all');
    setHasGpsFilter('all');
    setSortField(null);
    setSortOrder('asc');
  };

  // 1. Filtering across all table heads and criteria
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      // 1. Search Query (Name, ID, Mobile, Address, Provider name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          (b.fullName && b.fullName.toLowerCase().includes(q)) ||
          (b.phone && b.phone.includes(q)) ||
          (b.nationalId && b.nationalId.includes(q)) ||
          (b.address && b.address.toLowerCase().includes(q)) ||
          (b.governorate && b.governorate.toLowerCase().includes(q)) ||
          (b.providerName && b.providerName.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // 2. Status Filter (دۆخی دۆسیە)
      if (statusFilter !== 'all') {
        if (statusFilter === 'aided') {
          const isAided = b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0);
          if (!isAided) return false;
        } else if (statusFilter === 'confidential') {
          const isConf = b.status === 'confidential' || b.isConfidential === true;
          if (!isConf) return false;
        } else {
          if (b.status !== statusFilter) return false;
        }
      }

      // 3. Category Filter (حاڵەتی پێویستی)
      if (categoryFilter !== 'all' && b.needCategory !== categoryFilter) {
        return false;
      }

      // 4. Governorate Filter (پارێزگا)
      if (governorateFilter !== 'all' && b.governorate !== governorateFilter) {
        return false;
      }

      // 5. Gender Filter (Table head 1: ڕەگەز)
      if (genderFilter !== 'all' && b.gender !== genderFilter) {
        return false;
      }

      // 6. Age Group Filter (Table head 1: تەمەن)
      if (ageFilter !== 'all') {
        const age = Number(b.age) || 0;
        if (ageFilter === 'under18' && (age <= 0 || age >= 18)) return false;
        if (ageFilter === '18-35' && (age < 18 || age > 35)) return false;
        if (ageFilter === '36-59' && (age < 36 || age > 59)) return false;
        if (ageFilter === '60plus' && age < 60) return false;
      }

      // 7. Family Head Filter (Table head 4: سەرۆکی خێزان)
      if (familyHeadFilter !== 'all') {
        if (familyHeadFilter === 'head' && !b.isFamilyHead) return false;
        if (familyHeadFilter === 'member' && b.isFamilyHead) return false;
      }

      // 8. Provider Filter (Table head 4: پێگەی خێزان و بژێوی)
      if (providerFilter !== 'all') {
        if (providerFilter === 'provider' && !b.isProvider) return false;
        if (providerFilter === 'not_provider' && b.isProvider) return false;
        if (providerFilter === 'only_provider' && (!b.isProvider || !b.isOnlyProvider)) return false;
      }

      // 9. Family Members Filter (Table head 5: حاڵەت / ئەندام)
      if (familyMembersFilter !== 'all') {
        const count = Number(b.familyMembers) || 1;
        if (familyMembersFilter === '1' && count !== 1) return false;
        if (familyMembersFilter === '2-3' && (count < 2 || count > 3)) return false;
        if (familyMembersFilter === '4-6' && (count < 4 || count > 6)) return false;
        if (familyMembersFilter === '7+' && count < 7) return false;
      }

      // 10. Income Filter (Table head 6: داهاتی مانگانە)
      if (incomeFilter !== 'all') {
        const inc = Number(b.monthlyIncomeIQD) || 0;
        if (incomeFilter === 'zero' && inc !== 0) return false;
        if (incomeFilter === 'low' && (inc <= 0 || inc > 300000)) return false;
        if (incomeFilter === 'under300k' && inc > 300000) return false;
        if (incomeFilter === '300k-600k' && (inc < 300000 || inc > 600000)) return false;
        if (incomeFilter === 'above600k' && inc <= 600000) return false;
      }

      // 11. GPS Filter (Table head 3: پارێزگا / ناونیشان)
      if (hasGpsFilter !== 'all') {
        const hasLoc = !!(b.location && b.location.lat && b.location.lng);
        if (hasGpsFilter === 'with_gps' && !hasLoc) return false;
        if (hasGpsFilter === 'without_gps' && hasLoc) return false;
      }

      return true;
    });
  }, [
    beneficiaries,
    searchQuery,
    statusFilter,
    categoryFilter,
    governorateFilter,
    genderFilter,
    ageFilter,
    familyHeadFilter,
    providerFilter,
    familyMembersFilter,
    incomeFilter,
    hasGpsFilter
  ]);

  // 2. Sorting across all table heads
  const sortedBeneficiaries = useMemo(() => {
    if (!sortField) return filteredBeneficiaries;

    return [...filteredBeneficiaries].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'fullName':
          cmp = (a.fullName || '').localeCompare(b.fullName || '', 'ku', { sensitivity: 'base' });
          break;
        case 'age':
          cmp = (Number(a.age) || 0) - (Number(b.age) || 0);
          break;
        case 'gender':
          cmp = (a.gender || '').localeCompare(b.gender || '');
          break;
        case 'nationalId':
          cmp = (a.nationalId || '').localeCompare(b.nationalId || '', undefined, { numeric: true });
          break;
        case 'phone':
          cmp = (a.phone || '').localeCompare(b.phone || '', undefined, { numeric: true });
          break;
        case 'governorate':
          cmp = (a.governorate || '').localeCompare(b.governorate || '', 'ku');
          break;
        case 'address':
          cmp = (a.address || '').localeCompare(b.address || '', 'ku');
          break;
        case 'hasGps': {
          const aGps = a.location?.lat && a.location?.lng ? 1 : 0;
          const bGps = b.location?.lat && b.location?.lng ? 1 : 0;
          cmp = aGps - bGps;
          break;
        }
        case 'isProvider': {
          const aP = a.isProvider ? 1 : 0;
          const bP = b.isProvider ? 1 : 0;
          cmp = aP - bP;
          break;
        }
        case 'isFamilyHead': {
          const aH = a.isFamilyHead ? 1 : 0;
          const bH = b.isFamilyHead ? 1 : 0;
          cmp = aH - bH;
          break;
        }
        case 'needCategory': {
          const labelA = categoryLabels[a.needCategory] || a.needCategory || '';
          const labelB = categoryLabels[b.needCategory] || b.needCategory || '';
          cmp = labelA.localeCompare(labelB, 'ku');
          break;
        }
        case 'familyMembers':
          cmp = (Number(a.familyMembers) || 0) - (Number(b.familyMembers) || 0);
          break;
        case 'monthlyIncomeIQD':
          cmp = (Number(a.monthlyIncomeIQD) || 0) - (Number(b.monthlyIncomeIQD) || 0);
          break;
        case 'status': {
          const labelA = statusLabels[a.status] || a.status || '';
          const labelB = statusLabels[b.status] || b.status || '';
          cmp = labelA.localeCompare(labelB, 'ku');
          break;
        }
        default:
          cmp = 0;
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [filteredBeneficiaries, sortField, sortOrder]);

  const totalMonthlyIncomeFiltered = useMemo(() => {
    return sortedBeneficiaries.reduce((sum, b) => sum + (Number(b.monthlyIncomeIQD) || 0), 0);
  }, [sortedBeneficiaries]);

  const totalFamilyMembersFiltered = useMemo(() => {
    return sortedBeneficiaries.reduce((sum, b) => sum + (Number(b.familyMembers) || 1), 0);
  }, [sortedBeneficiaries]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    statusFilter,
    categoryFilter,
    governorateFilter,
    genderFilter,
    ageFilter,
    familyHeadFilter,
    providerFilter,
    familyMembersFilter,
    incomeFilter,
    hasGpsFilter,
    sortField,
    sortOrder
  ]);

  const paginatedBeneficiaries = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedBeneficiaries.slice(startIdx, startIdx + pageSize);
  }, [sortedBeneficiaries, currentPage, pageSize]);

  // Process uploaded files to BeneficiaryDocument
  const processUploadedFiles = async (
    files: FileList | File[],
    defaultCategory: BeneficiaryDocCategory = 'ناسنامە'
  ): Promise<BeneficiaryDocument[]> => {
    const newDocs: BeneficiaryDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        const sizeKB = Math.round(file.size / 1024);
        const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
        const baseName = file.name.replace(/\.[^/.]+$/, '');

        let inferredCategory: BeneficiaryDocCategory = defaultCategory;
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('nasnama') || lowerName.includes('identity') || lowerName.includes('ناسنامە')) {
          inferredCategory = 'ناسنامە';
        } else if (lowerName.includes('kart') || lowerName.includes('nishtimani') || lowerName.includes('نیشتمانی')) {
          inferredCategory = 'کارتی نیشتمانی';
        } else if (lowerName.includes('pizishki') || lowerName.includes('medical') || lowerName.includes('پزیشکی')) {
          inferredCategory = 'ڕاپۆرتی پزیشکی';
        } else if (lowerName.includes('food') || lowerName.includes('kapon') || lowerName.includes('کۆبۆن')) {
          inferredCategory = 'کۆبۆنی خۆراک';
        } else if (lowerName.includes('wena') || lowerName.includes('photo') || lowerName.includes('وێنە')) {
          inferredCategory = 'وێنەی مەیدانی';
        } else if (lowerName.includes('address') || lowerName.includes('place') || lowerName.includes('نیشتەجێبوون')) {
          inferredCategory = 'بەڵگەنامەی نیشتەجێبوون';
        }

        newDocs.push({
          id: `bdoc-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          title: baseName || 'بەڵگەنامەی سوودمەند',
          category: inferredCategory,
          fileName: file.name,
          fileSize: sizeStr,
          fileType: ext,
          fileData: dataUrl,
          uploadDate: new Date().toISOString().split('T')[0]
        });
      } catch (err) {
        console.error('File reading failed', err);
      }
    }
    return newDocs;
  };

  // Reset Single Form
  const resetSingleForm = () => {
    setFormData({
      nationalId: '',
      fullName: '',
      phone: '',
      gender: 'male',
      age: 35,
      isFamilyHead: true,
      isProvider: true,
      providerName: '',
      isOnlyProvider: true,
      otherProviders: [],
      governorate: 'هەولێر',
      address: '',
      familyMembers: 1,
      monthlyIncomeIQD: 0,
      needCategory: 'poor',
      status: 'pending',
      isConfidential: false,
      notes: '',
      documents: [],
      location: undefined
    });
    setNewOtherProvider({ name: '', relation: 'کوڕ', monthlyIncomeIQD: 0 });
    setDuplicateAlert(null);
    if (singleDocInputRef.current) singleDocInputRef.current.value = '';
  };

  // Add Other Provider into formData
  const handleAddOtherProvider = () => {
    if (!newOtherProvider.name.trim()) return;
    setFormData(prev => ({
      ...prev,
      otherProviders: [...prev.otherProviders, { ...newOtherProvider }]
    }));
    setNewOtherProvider({ name: '', relation: 'کوڕ', monthlyIncomeIQD: 0 });
  };

  // Remove Other Provider
  const handleRemoveOtherProvider = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      otherProviders: prev.otherProviders.filter((_, i) => i !== idx)
    }));
  };

  // Single Add Doc Upload
  const handleSingleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingDocs(true);
    const newDocs = await processUploadedFiles(files);
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...newDocs]
    }));
    setIsProcessingDocs(false);
    if (singleDocInputRef.current) singleDocInputRef.current.value = '';
  };

  const handleSingleRemoveDoc = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== id)
    }));
  };

  // Submit Single Beneficiary Form
  const handleSubmitBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateAlert(null);

    const dataToSave = {
      ...formData,
      providerName: !formData.isProvider ? (formData.providerName || 'کەسی تر') : undefined,
      isOnlyProvider: formData.isProvider ? formData.isOnlyProvider : undefined,
      otherProviders:
        formData.isProvider && !formData.isOnlyProvider && formData.otherProviders.length > 0
          ? formData.otherProviders
          : undefined,
      documents: formData.documents || []
    };

    setIsSubmitting(true);
    try {
      const res = await addBeneficiary(dataToSave);
      if (!res.success) {
        setDuplicateAlert(res.message || 'ئەم کەسە دووبارەیە و ناتوانرێت دووبارە تۆماربکرێت!');
        return;
      }

      setIsAddModalOpen(false);
      haptics.success();
      resetSingleForm();
    } catch (err: any) {
      setDuplicateAlert('هەڵەیەک ڕوویدا لە کاتی پەیوەندیکردن بە سێرڤەر: ' + (err?.message || 'تکایە دووبارە هەوڵ بدەوە'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (ben: Beneficiary) => {
    setEditingBeneficiary(ben);
    setEditFormData({
      id: ben.id,
      nationalId: ben.nationalId,
      fullName: ben.fullName,
      phone: ben.phone,
      gender: ben.gender || 'male',
      age: ben.age || 35,
      isFamilyHead: ben.isFamilyHead ?? true,
      isProvider: ben.isProvider ?? true,
      providerName: ben.providerName || '',
      isOnlyProvider: ben.isOnlyProvider ?? true,
      otherProviders: ben.otherProviders ? [...ben.otherProviders] : [],
      governorate: ben.governorate || 'هەولێر',
      address: ben.address || '',
      familyMembers: ben.familyMembers || 1,
      monthlyIncomeIQD: ben.monthlyIncomeIQD || 0,
      needCategory: ben.needCategory || 'poor',
      status: ben.status || 'pending',
      isConfidential: ben.isConfidential ?? (ben.status === 'confidential'),
      notes: ben.notes || '',
      documents: ben.documents ? [...ben.documents] : [],
      location: ben.location ? { ...ben.location } : undefined
    });
    setNewEditOtherProvider({ name: '', relation: 'کوڕ', monthlyIncomeIQD: 0 });
    setEditDuplicateAlert(null);
    setIsEditModalOpen(true);
  };

  // Edit Other Provider Handlers
  const handleAddEditOtherProvider = () => {
    if (!newEditOtherProvider.name.trim()) return;
    setEditFormData(prev => ({
      ...prev,
      otherProviders: [...prev.otherProviders, { ...newEditOtherProvider }]
    }));
    setNewEditOtherProvider({ name: '', relation: 'کوڕ', monthlyIncomeIQD: 0 });
  };

  const handleRemoveEditOtherProvider = (idx: number) => {
    setEditFormData(prev => ({
      ...prev,
      otherProviders: prev.otherProviders.filter((_, i) => i !== idx)
    }));
  };

  // Edit Doc Handlers
  const handleEditDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingDocs(true);
    const newDocs = await processUploadedFiles(files);
    setEditFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...newDocs]
    }));
    setIsProcessingDocs(false);
    if (editDocInputRef.current) editDocInputRef.current.value = '';
  };

  const handleEditRemoveDoc = (id: string) => {
    setEditFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).filter(d => d.id !== id)
    }));
  };

  const handleEditUpdateDocTitle = (id: string, newTitle: string) => {
    setEditFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).map(d => d.id === id ? { ...d, title: newTitle } : d)
    }));
  };

  const handleEditUpdateDocCategory = (id: string, newCat: BeneficiaryDocCategory) => {
    setEditFormData(prev => ({
      ...prev,
      documents: (prev.documents || []).map(d => d.id === id ? { ...d, category: newCat } : d)
    }));
  };

  // Save Edit Beneficiary Form
  const handleSaveEditBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBeneficiary) return;

    // Check duplicate
    const duplicate = checkDuplicate(editFormData.nationalId, editFormData.phone, editingBeneficiary.id);
    if (duplicate) {
      setEditDuplicateAlert(`ئەم ژمارەی ناسنامە یان مۆبایلە پێشتر بە ناوی (${duplicate.fullName}) تۆمارکراوە!`);
      return;
    }

    const updatedBen: Beneficiary = {
      ...editingBeneficiary,
      fullName: editFormData.fullName,
      nationalId: editFormData.nationalId,
      phone: editFormData.phone,
      gender: editFormData.gender,
      age: Number(editFormData.age) || 35,
      isFamilyHead: editFormData.isFamilyHead,
      isProvider: editFormData.isProvider,
      providerName: !editFormData.isProvider ? (editFormData.providerName || 'کەسی تر') : undefined,
      isOnlyProvider: editFormData.isProvider ? editFormData.isOnlyProvider : undefined,
      otherProviders:
        editFormData.isProvider && !editFormData.isOnlyProvider && editFormData.otherProviders.length > 0
          ? editFormData.otherProviders
          : undefined,
      governorate: editFormData.governorate,
      address: editFormData.address,
      familyMembers: Number(editFormData.familyMembers) || 1,
      monthlyIncomeIQD: Number(editFormData.monthlyIncomeIQD) || 0,
      needCategory: editFormData.needCategory,
      status: editFormData.status,
      isConfidential: editFormData.isConfidential ?? (editFormData.status === 'confidential'),
      notes: editFormData.notes,
      documents: editFormData.documents || [],
      location: editFormData.location
    };

    setIsSubmitting(true);
    try {
      const res = await updateBeneficiary(updatedBen);
      if (res && !res.success) {
        showToast(res.message || 'هەڵەیەک ڕوویدا لە کاتی نوێکردنەوەی سوودمەند لە داتابەیسی سەرهێڵ.', 'error');
        return;
      }
      setIsEditModalOpen(false);
      setEditingBeneficiary(null);
      showToast('زانیارییەکانی سوودمەند بە سەرکەوتوویی نوێکرانەوە.', 'success');

      // If dossier view modal is open for this beneficiary, update it too
      if (selectedBeneficiary && selectedBeneficiary.id === updatedBen.id) {
        setSelectedBeneficiary(updatedBen);
      }
    } catch (err: any) {
      showToast('هەڵەیەک ڕوویدا لە نوێکردنەوە: ' + (err?.message || 'تکایە دووبارە هەوڵ بدەوە'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload directly from Dossier View Modal
  const handleViewDossierDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBeneficiary) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessingDocs(true);
    const newDocs = await processUploadedFiles(files);
    for (const doc of newDocs) {
      addBeneficiaryDocument(selectedBeneficiary.id, doc);
    }
    setIsProcessingDocs(false);
    if (viewDocInputRef.current) viewDocInputRef.current.value = '';

    // Update local selectedBeneficiary
    setSelectedBeneficiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        documents: [...newDocs, ...(prev.documents || [])]
      };
    });
    showToast(`${newDocs.length} بەڵگەنامەی نوێ هاوپێچکرا.`, 'success');
  };

  const handleViewDossierDocDelete = async (docId: string) => {
    if (!selectedBeneficiary) return;
    const ok = await confirmAction({
      title: 'سڕینەوەی بەڵگەنامە',
      message: 'دڵنیایت لە سڕینەوەی ئەم بەڵگەنامەیە لە دۆسیەکە؟',
      confirmLabel: 'بەڵێ، بیسڕەوە',
      variant: 'danger'
    });
    if (!ok) return;
    deleteBeneficiaryDocument(selectedBeneficiary.id, docId);
    setSelectedBeneficiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        documents: (prev.documents || []).filter(d => d.id !== docId)
      };
    });
    showToast('بەڵگەنامەکە لە دۆسیە سڕایەوە.', 'info');
  };

  // Handle Excel File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setBulkImportSuccess(null);

    try {
      const result = await parseBeneficiaryExcelFile(file);
      setParsedData(result);
    } catch (err: any) {
      showToast('هەڵەیەک ڕوویدا لە کاتی خوێندنەوەی فایلی ئێکسڵ: ' + (err?.message || 'فایلەکە نادروستە'), 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm Bulk Import
  const handleConfirmBulkImport = async () => {
    if (!parsedData || parsedData.valid.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await addBeneficiariesBulk(parsedData.valid);
      if (!result.success) {
        showToast(result.message || 'هەڵەیەک ڕوویدا لە کاتی هاوردەکردنی بەکۆمەڵ.', 'error');
        return;
      }
      setBulkImportSuccess(
        `سەرکەوتوو بوو! ژمارەی (${result.added}) سوودمەند بە سەرکەوتوویی لە داتابەیسی سەرهێڵ زیادکران. ${
          result.skippedDuplicates > 0
            ? `(ژمارەی ${result.skippedDuplicates} دۆسیەی دووبارە ڕێگری لێکرا)`
            : ''
        }`
      );
      showToast(`${result.added} سوودمەند بە سەرکەوتوویی هاوردەکران.`, 'success');
      setParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast('هەڵەیەک ڕوویدا لە کاتی هاوردەکردن: ' + (err?.message || 'تکایە دووبارە هەوڵ بدەوە'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Give Aid Submit
  const handleGiveAidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiary) return;

    const chosenDonation = aidForm.selectedDonationId
      ? (donations || []).find(d => d.id === aidForm.selectedDonationId)
      : undefined;

    addAidRecord(selectedBeneficiary.id, {
      date: new Date().toISOString().split('T')[0],
      type: aidForm.type,
      amountIQD: aidForm.type === 'monetary' && aidForm.currency === 'IQD' ? aidForm.amountIQD : undefined,
      amount: aidForm.type === 'monetary' ? aidForm.amountIQD : undefined,
      currency: aidForm.type === 'monetary' ? aidForm.currency : undefined,
      itemName: aidForm.type === 'in-kind' ? aidForm.itemName : undefined,
      quantity: aidForm.type === 'in-kind' ? aidForm.quantity : undefined,
      projectTitle: aidForm.projectTitle,
      distributedBy: 'بەڕێوەبەری سیستەم',
      notes: aidForm.notes,
      receiptNumber: chosenDonation ? chosenDonation.receiptNumber : undefined,
      donationId: chosenDonation ? chosenDonation.id : undefined
    });

    setIsGiveAidModalOpen(false);
    haptics.success();
    const updated = beneficiaries.find(b => b.id === selectedBeneficiary.id);
    if (updated) setSelectedBeneficiary(updated);
    showToast('هاوکارییەکە بە سەرکەوتوویی تۆمارکرا.', 'success');
  };

  // Handle Send SMS
  const handleSendSMS = () => {
    if (!selectedBeneficiary) return;
    sendSMS(selectedBeneficiary.phone, selectedBeneficiary.fullName, smsText);
    setIsSMSModalOpen(false);
    showToast('کورتەنامەکە (SMS) ڕەوانەکرا.', 'success');
  };

  const handleOpenEditBenAid = (aid: AidRecord) => {
    setEditingBenAid(aid);
    setEditBenAidForm({
      amount: aid.amount || aid.amountIQD || aid.quantity || 0,
      projectTitle: aid.projectTitle || '',
      date: aid.date || new Date().toISOString().split('T')[0],
      notes: aid.notes || ''
    });
    setIsEditBenAidModalOpen(true);
  };

  const handleSaveEditBenAid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiary || !editingBenAid) return;

    const isMonetary = editingBenAid.type === 'monetary';
    const isIQD = editingBenAid.currency !== 'USD';

    updateAidRecord(selectedBeneficiary.id, editingBenAid.id, {
      amount: isMonetary ? editBenAidForm.amount : undefined,
      amountIQD: isMonetary && isIQD ? editBenAidForm.amount : undefined,
      quantity: !isMonetary ? editBenAidForm.amount : undefined,
      projectTitle: editBenAidForm.projectTitle,
      date: editBenAidForm.date,
      notes: editBenAidForm.notes
    });

    setIsEditBenAidModalOpen(false);
    setEditingBenAid(null);
    const updated = beneficiaries.find(b => b.id === selectedBeneficiary.id);
    if (updated) setSelectedBeneficiary(updated);
    showToast('تۆماری هاوکارییەکە نوێکرایەوە.', 'success');
  };

  const handleDeleteBenAid = async (aidId: string) => {
    if (!selectedBeneficiary) return;
    const ok = await confirmAction({
      title: 'سڕینەوەی تۆماری هاوکاری',
      message: 'ئایا دڵنیایت لە سڕینەوەی ئەم تۆماری هاوکارییە؟',
      confirmLabel: 'بەڵێ، بیسڕەوە',
      variant: 'danger'
    });
    if (!ok) return;

    deleteAidRecord(selectedBeneficiary.id, aidId);
    const updated = beneficiaries.find(b => b.id === selectedBeneficiary.id);
    if (updated) setSelectedBeneficiary(updated);
    showToast('تۆماری هاوکارییەکە سڕایەوە.', 'info');
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-600" />
            بەڕێوەبردنی سوودمەندان و خێزانەکان
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تۆمارکردنی یەک بە یەک، هاوردەکردنی بەکۆمەڵ بە ئێکسڵ، و شەفافییەتی تەواوی کۆمەک
          </p>
        </div>

        <button
          onClick={() => {
            setEntryMode('single');
            resetSingleForm();
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>تۆمارکردنی سوودمەندی نوێ</span>
        </button>
      </div>

      {/* Cloud Status Alert if offline */}
      {!isCloudConnected && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">داتابەیسی سەرهێڵ (Supabase) بەردەست نییە</p>
              <p className="text-xs text-rose-700 mt-0.5">
                بۆ ڕێگریکردن لە ونبوون یان ناکۆکی داتا لە نێوان ئامێرەکان، داخڵکردن و دەستکاریکردنی سوودمەندان کاتییانە ڕاگیراوە تا ئینتەرنێت دەگەڕێتەوە.
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              const res = await syncLocalDataToCloud();
              showToast(res.message, res.success ? 'success' : 'warning');
            }}
            disabled={isCloudSyncing}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isCloudSyncing ? 'پشکنین...' : 'دووبارە پشکنینەوەی پەیوەندی'}</span>
          </button>
        </div>
      )}

      {/* Filter and Search Pill Bar with Table Head Filters & Sorting */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3.5">
        {/* Row 1: Primary Search, Status, Category, Governorate & Filter Bar Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی ناو، مۆبایل، ژمارەی نیشتمانی..."
              className="w-full h-10 pe-10 ps-8 text-xs rounded-xl liquid-input text-slate-900 placeholder-slate-400 font-bold"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="پاککردنەوەی گەڕان"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter (Table Head: دۆخی دۆسیە) */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
            title="فلتەر بەپێی دۆخی دۆسیە"
          >
            <option value="all">هەموو دۆخەکان ({beneficiaries.length})</option>
            <option value="pending">⏳ لەژێر لێکۆڵینەوە ({beneficiaries.filter(b => b.status === 'pending').length})</option>
            <option value="approved">✅ پەسەندکراو بۆ هاوکاری ({beneficiaries.filter(b => b.status === 'approved').length})</option>
            <option value="aided">🎁 هاوکاری وەرگرتووە ({beneficiaries.filter(b => b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)).length})</option>
            <option value="confidential">🔒 سوودمەندی نهێنی و پارێزراو ({beneficiaries.filter(b => b.status === 'confidential' || b.isConfidential).length})</option>
            <option value="urgent">🚨 فریاگوزاری و بەپەلە ({beneficiaries.filter(b => b.status === 'urgent').length})</option>
            <option value="periodic">🔄 هاوکاری خولیی و مانگانە ({beneficiaries.filter(b => b.status === 'periodic').length})</option>
            <option value="suspended">⏸ ڕاگیراوی کاتی ({beneficiaries.filter(b => b.status === 'suspended').length})</option>
            <option value="rejected">❌ ڕەتکراوەتەوە ({beneficiaries.filter(b => b.status === 'rejected').length})</option>
            <option value="archived">📁 دۆسیەی ئەرشیڤکراو ({beneficiaries.filter(b => b.status === 'archived').length})</option>
          </select>

          {/* Category Filter (Table Head: حاڵەت) */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
            title="فلتەر بەپێی حاڵەتی پێویستی"
          >
            <option value="all">هەموو حاڵەتەکان</option>
            <option value="poor">هەژار و دەستکورت</option>
            <option value="orphan">بێباوک و هەتیو</option>
            <option value="sick">نەخۆشی درێژخایەن</option>
            <option value="disabled">خاوەن پێداویستی تایبەت</option>
            <option value="student">خوێندکاری هەژار</option>
            <option value="displaced">ئاوارە و پەنابەر</option>
          </select>

          {/* Governorate Filter (Table Head: پارێزگا) */}
          <select
            value={governorateFilter}
            onChange={(e) => setGovernorateFilter(e.target.value)}
            className="w-full h-10 px-3 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
            title="فلتەر بەپێی پارێزگا"
          >
            <option value="all">هەموو پارێزگاکان</option>
            <option value="هەولێر">هەولێر</option>
            <option value="سلێمانی">سلێمانی</option>
            <option value="دهۆک">دهۆک</option>
            <option value="هەڵەبجە">هەڵەبجە</option>
            <option value="کەرکووک">کەرکووک</option>
            <option value="گەرمیان">گەرمیان</option>
            <option value="زاخۆ">زاخۆ</option>
          </select>
        </div>

        {/* Row 2: Secondary Table Head Filters (Collapsible Section) */}
        {isFiltersExpanded && (
          <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-3.5 rounded-2xl animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Gender Filter (Table Head: ڕەگەز) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  ڕەگەز (ناوی تەواو / ڕەگەز):
                </label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو ڕەگەزەکان</option>
                  <option value="male">👨 نێرینە</option>
                  <option value="female">👩 مێینە</option>
                </select>
              </div>

              {/* Age Group Filter (Table Head: تەمەن) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  تەمەن (ناوی تەواو / تەمەن):
                </label>
                <select
                  value={ageFilter}
                  onChange={(e) => setAgeFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو تەمەنەکان</option>
                  <option value="under18">👶 خوار ١٨ ساڵ (منداڵ و نەوجەوان)</option>
                  <option value="18-35">🧑 ١٨ بۆ ٣٥ ساڵ (گەنجان)</option>
                  <option value="36-59">👨‍💼 ٣٦ بۆ ٥٩ ساڵ (پێگەیشتوو)</option>
                  <option value="60plus">👴 ٦٠ ساڵ و زیاتر (بەساڵاچوو)</option>
                </select>
              </div>

              {/* Family Head Filter (Table Head: پێگەی خێزان) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  پێگەی خێزان (سەرۆکی خێزان):
                </label>
                <select
                  value={familyHeadFilter}
                  onChange={(e) => setFamilyHeadFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو پێگەکانی خێزان</option>
                  <option value="head">👑 تەنها سەرۆکی خێزان</option>
                  <option value="member">👤 تەنها ئەندامی خێزان</option>
                </select>
              </div>

              {/* Provider Filter (Table Head: پێگەی بژێوی) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  پێگەی بژێوی و دابینکەر:
                </label>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو پێگەکانی بژێوی</option>
                  <option value="provider">💼 دابینکەری سەرەکی</option>
                  <option value="not_provider">⚠️ دابینکەر نییە (پشتپێبەستراو)</option>
                  <option value="only_provider">🛡️ تەنها دابینکەرە (بێ هاوکار)</option>
                </select>
              </div>

              {/* Family Members Count Filter (Table Head: ئەندام) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  قەبارەی خێزان (ئەندامان):
                </label>
                <select
                  value={familyMembersFilter}
                  onChange={(e) => setFamilyMembersFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو ژمارەی ئەندامان</option>
                  <option value="1">تاکەکەسی (1 ئەندام)</option>
                  <option value="2-3">خێزانی بچووک (2 - 3 ئەندام)</option>
                  <option value="4-6">خێزانی مامناوەند (4 - 6 ئەندام)</option>
                  <option value="7+">خێزانی گەورە (7 ئەندام و زیاتر)</option>
                </select>
              </div>

              {/* Monthly Income Filter (Table Head: داهاتی مانگانە) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  ئاستی داهاتی مانگانە:
                </label>
                <select
                  value={incomeFilter}
                  onChange={(e) => setIncomeFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو ئاستەکانی داهات</option>
                  <option value="zero">🔴 بێ داهات (0 د.ع)</option>
                  <option value="low">🟡 کەمداهات (1 - 300,000 د.ع)</option>
                  <option value="under300k">🟠 کەمتر لە 300,000 د.ع (سفر و کەمداهات)</option>
                  <option value="300k-600k">🟢 300,000 بۆ 600,000 د.ع</option>
                  <option value="above600k">🔵 زیاتر لە 600,000 د.ع</option>
                </select>
              </div>

              {/* GPS Location Filter (Table Head: ناونیشان / شوێن) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  شوێنی GPS (ناونیشان / نەخشە):
                </label>
                <select
                  value={hasGpsFilter}
                  onChange={(e) => setHasGpsFilter(e.target.value)}
                  className="w-full h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                >
                  <option value="all">هەموو ناونیشانەکان</option>
                  <option value="with_gps">📍 تەنها خاوەن GPS (لەسەر نەخشە)</option>
                  <option value="without_gps">🗺️ بێ GPS</option>
                </select>
              </div>

              {/* Table Head Synchronized Sorting Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  ڕیزبەندکردنی خشتە:
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={sortField ? `${sortField}:${sortOrder}` : 'default'}
                    onChange={(e) => handleTopFilterSortChange(e.target.value)}
                    className="flex-1 h-9 px-2.5 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
                  >
                    <option value="default">بنەڕەتی (بەرواری تۆمارکردن)</option>
                    <option value="fullName:asc">ناوی تەواو (ئەلفوبێ ئ - ی)</option>
                    <option value="fullName:desc">ناوی تەواو (پێچەوانە ی - ئ)</option>
                    <option value="age:asc">تەمەن (بچووک بۆ گەورە)</option>
                    <option value="age:desc">تەمەن (گەورە بۆ بچووک)</option>
                    <option value="gender:asc">ڕەگەز (مێینە / نێرینە)</option>
                    <option value="nationalId:asc">ژمارەی ناسنامە (سەرکەوتوو)</option>
                    <option value="nationalId:desc">ژمارەی ناسنامە (دابەزیو)</option>
                    <option value="phone:asc">ژمارەی مۆبایل</option>
                    <option value="governorate:asc">پارێزگا (ئەلفوبێ)</option>
                    <option value="address:asc">ناونیشان (ئەلفوبێ)</option>
                    <option value="hasGps:desc">شوێنی GPS (خاوەن شوێن لەپێشەوە)</option>
                    <option value="isProvider:desc">پێگەی بژێوی (دابینکەر لەپێشەوە)</option>
                    <option value="isFamilyHead:desc">سەرۆکی خێزان لەپێشەوە</option>
                    <option value="needCategory:asc">حاڵەتی پێویستی</option>
                    <option value="familyMembers:desc">ئەندامانی خێزان (زۆر بۆ کەم)</option>
                    <option value="familyMembers:asc">ئەندامانی خێزان (کەم بۆ زۆر)</option>
                    <option value="monthlyIncomeIQD:asc">داهاتی مانگانە (کەم بۆ زۆر)</option>
                    <option value="monthlyIncomeIQD:desc">داهاتی مانگانە (زۆر بۆ کەم)</option>
                    <option value="status:asc">دۆخی دۆسیە (بەپێی پۆلێنکردن)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (!sortField) {
                        setSortField('fullName');
                        setSortOrder('asc');
                      } else {
                        setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
                      }
                    }}
                    className={`h-9 px-2.5 rounded-xl border flex items-center justify-center text-xs font-bold transition-all shadow-xs shrink-0 ${
                      sortField
                        ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title={sortOrder === 'asc' ? 'ڕیزبەندی سەرکەوتوو (کەم بۆ زۆر) - کلیک بکە بۆ گۆڕین' : 'ڕیزبەندی دابەزیو (زۆر بۆ کەم) - کلیک بکە بۆ گۆڕین'}
                  >
                    {sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-cyan-700" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row 3: Action Bar (Expand Toggle, Reset Filters Button, Results Count) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Table Head Filters Expansion */}
            <button
              type="button"
              onClick={() => setIsFiltersExpanded(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-xs ${
                isFiltersExpanded
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-cyan-600" />
              <span>فلتەرەکانی تری خشتە</span>
              {secondaryFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-cyan-600 text-white text-[10px] flex items-center justify-center font-black">
                  {secondaryFiltersCount}
                </span>
              )}
              {isFiltersExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            {/* Reset Filters Button */}
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-xs"
                title="سڕینەوەی سەرجەم فلتەر و ڕیزبەندییەکان"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                <span>سڕینەوەی فلتەرەکان</span>
                <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 text-[10px] flex items-center justify-center font-black">
                  {activeFiltersCount}
                </span>
              </button>
            )}
          </div>

          <div className="text-[11px] font-bold text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200">
            دۆزراوەتەوە: <span className="text-cyan-800 font-black">{sortedBeneficiaries.length}</span> لە کۆی <span className="text-slate-900 font-bold">{beneficiaries.length}</span>
          </div>
        </div>

        {/* Active Filter Chips / Pills */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100/80 text-[11px]">
            <span className="text-slate-400 font-bold ms-1">فلتەرە چالاکەکان:</span>
            
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                گەڕان: {searchQuery}
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}
            
            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                دۆخ: {statusLabels[statusFilter] || statusFilter}
                <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {categoryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                حاڵەت: {categoryLabels[categoryFilter as NeedCategory] || categoryFilter}
                <button type="button" onClick={() => setCategoryFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {governorateFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                پارێزگا: {governorateFilter}
                <button type="button" onClick={() => setGovernorateFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {genderFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                ڕەگەز: {genderFilter === 'male' ? 'نێرینە' : 'مێینە'}
                <button type="button" onClick={() => setGenderFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {ageFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                تەمەن: {ageFilter === 'under18' ? 'خوار ١٨ ساڵ' : ageFilter === '18-35' ? '١٨ - ٣٥ ساڵ' : ageFilter === '36-59' ? '٣٦ - ٥٩ ساڵ' : '٦٠ ساڵ و زیاتر'}
                <button type="button" onClick={() => setAgeFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {familyHeadFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                پێگەی خێزان: {familyHeadFilter === 'head' ? 'سەرۆکی خێزان' : 'ئەندامی خێزان'}
                <button type="button" onClick={() => setFamilyHeadFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {providerFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                بژێوی: {providerFilter === 'provider' ? 'دابینکەری سەرەکی' : providerFilter === 'not_provider' ? 'دابینکەر نییە' : 'تەنها دابینکەر'}
                <button type="button" onClick={() => setProviderFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {familyMembersFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                ئەندامان: {familyMembersFilter} ئەندام
                <button type="button" onClick={() => setFamilyMembersFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {incomeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                داهات: {incomeFilter === 'zero' ? 'بێ داهات' : incomeFilter === 'low' ? '1 - 300,000 د.ع' : incomeFilter === 'under300k' ? '< 300,000 د.ع' : incomeFilter === '300k-600k' ? '300k - 600k د.ع' : '> 600,000 د.ع'}
                <button type="button" onClick={() => setIncomeFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {hasGpsFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold shadow-2xs">
                GPS: {hasGpsFilter === 'with_gps' ? 'خاوەن GPS' : 'بێ GPS'}
                <button type="button" onClick={() => setHasGpsFilter('all')} className="hover:text-cyan-950 font-bold ms-0.5">×</button>
              </span>
            )}

            {sortField && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-bold shadow-2xs">
                ڕیزبەندی: {sortFieldLabels[sortField]} ({sortOrder === 'asc' ? 'سەرکەوتوو ↑' : 'دابەزیو ↓'})
                <button type="button" onClick={() => { setSortField(null); setSortOrder('asc'); }} className="hover:text-purple-950 font-bold ms-0.5">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Beneficiaries Table with Screen Interactive Layout & Custom Scrollbar */}
      <div
        className={`rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
          isFullscreenTable
            ? 'fixed inset-2 sm:inset-4 z-40 bg-white shadow-2xl border-2 border-cyan-500 p-2 sm:p-4'
            : ''
        }`}
      >
        {/* Table Top Interactive Controls Bar */}
        <div className="p-3 sm:p-3.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-100 text-cyan-700">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">خشتەی زانیارییەکانی سوودمەندان</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  {sortedBeneficiaries.length} لە کۆی {beneficiaries.length} کەس
                </span>
                {sortField && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-900 border border-cyan-200">
                    ڕیزبەندی: {sortFieldLabels[sortField]} ({sortOrder === 'asc' ? 'سەرکەوتوو ↑' : 'دابەزیو ↓'})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Density Toggle (Compact vs Comfortable) */}
            <button
              type="button"
              onClick={() => setTableDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="گۆڕینی چڕیی خشتەکە (Compact / Comfortable)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>{tableDensity === 'comfortable' ? 'دیمەنی چڕ' : 'دیمەنی فراوان'}</span>
            </button>

            {/* Screen Interactive Layout Fullscreen / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreenTable(f => !f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isFullscreenTable
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
              title={isFullscreenTable ? 'داخستنی شاشەی تەواو (Escape)' : 'فراوانکردنی خشتە بۆ هەموو شاشەکە'}
            >
              {isFullscreenTable ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>داخستنی تەواوی شاشە</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>شاشەی تەواو</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile View: High-density Touch Cards (< 1024px) */}
        <div className="block lg:hidden p-3 space-y-3">
          {beneficiaries.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">هیچ کەسێکی سوودمەند تۆمار نەکراوە (سفر تۆمار)</p>
              <p className="text-xs text-slate-400 mt-1">
                دەتوانیت بە یەک بە یەک تۆماریان بکەیت یان فایلی ئێکسڵ بە کۆمەڵ هاوردە بکەیت
              </p>
            </div>
          ) : sortedBeneficiaries.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-2xl border border-slate-200">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">هیچ کەسێک نەدۆزرایەوە بەپێی ئەم فلتەرانە</p>
              <p className="text-xs text-slate-400 mt-1">دەتوانیت فلتەرەکان پاکبکەیتەوە تا هەموو لیستەکە دەربکەوێت</p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold transition-all shadow-xs"
              >
                سڕینەوەی سەرجەم فلتەرەکان
              </button>
            </div>
          ) : (
            paginatedBeneficiaries.map(ben => {
              const vuln = computeVulnerabilityScore(ben);
              return (
                <div
                  key={ben.id}
                  onClick={() => {
                    haptics.selection();
                    setSelectedBeneficiary(ben);
                  }}
                  className={`rounded-2xl border p-3.5 transition-all shadow-xs active:scale-[0.99] touch-manipulation cursor-pointer ${
                    selectedBeneficiary?.id === ben.id
                      ? 'bg-cyan-50/90 border-cyan-300 ring-2 ring-cyan-400/20'
                      : 'bg-white hover:border-cyan-300 border-slate-200/90'
                  }`}
                >
                  {/* Card Header: Avatar/Gender, Name, Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          ben.gender === 'female'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                        title={ben.gender === 'female' ? 'مێینە' : 'نێرینە'}
                      >
                        {ben.gender === 'female' ? 'مێ' : 'نێر'}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">{ben.fullName}</h4>
                          {(ben.isConfidential || ben.status === 'confidential') && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                              <Lock className="w-2.5 h-2.5 text-purple-600" />
                              <span>نهێنی</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {ben.age ? `${ben.age} ساڵ` : ''} {ben.isFamilyHead ? '• سەرۆکی خێزان' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Status badge & Vulnerability */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {ben.status === 'pending' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> لەژێر لێکۆڵینەوە
                        </span>
                      ) : ben.status === 'approved' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> پەسەندکراوە
                        </span>
                      ) : ben.status === 'confidential' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-purple-600" /> نهێنی
                        </span>
                      ) : ben.status === 'urgent' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> بەپەلە
                        </span>
                      ) : ben.status === 'periodic' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 text-blue-600" /> مانگانە
                        </span>
                      ) : ben.status === 'suspended' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                          <PauseCircle className="w-3 h-3 text-slate-500" /> ڕاگیراو
                        </span>
                      ) : ben.status === 'rejected' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-600" /> ڕەتکراوەتەوە
                        </span>
                      ) : ben.status === 'archived' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <Archive className="w-3 h-3 text-slate-400" /> ئەرشیڤ
                        </span>
                      ) : ben.status === 'aided' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                          <Gift className="w-3 h-3 text-cyan-600" /> هاوکاریکراو ({ben.aidHistory?.length || 1})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> لەژێر لێکۆڵینەوە
                        </span>
                      )}

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${vuln.badgeClass}`}
                        title={`نمرەی پێویستی خێزان: ${vuln.score}/100 (${vuln.label})`}
                      >
                        <span>{vuln.score}%</span>
                        <span>• {vuln.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">ناسنامەی باری شارستانی:</span>
                      <span className="font-mono font-bold text-cyan-800 text-[11px]">{ben.nationalId || '—'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">مۆبایل:</span>
                      {ben.phone ? (
                        <a
                          href={`tel:${ben.phone}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            haptics.light();
                          }}
                          className="inline-flex items-center gap-1 font-mono font-bold text-cyan-700 hover:text-cyan-800 hover:underline text-[11px]"
                        >
                          <Phone className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span>{ben.phone}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پارێزگا و ناونیشان:</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-bold text-slate-800 text-[11px]">{ben.governorate}</span>
                        {ben.address && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[120px]" title={ben.address}>
                            • {ben.address}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پێداویستی و ئەندامان:</span>
                      <span className="text-[11px] font-bold text-amber-800">
                        {categoryLabels[ben.needCategory] || ben.needCategory} ({ben.familyMembers} کەس)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">داهاتی مانگانە:</span>
                      <span className={`text-[11px] font-bold ${ben.monthlyIncomeIQD === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {ben.monthlyIncomeIQD === 0 ? 'بێ داهات' : `${ben.monthlyIncomeIQD.toLocaleString()} د.ع`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">پێگەی بژێوی:</span>
                      <span className="text-[11px] text-slate-700 font-medium">
                        {ben.isProvider ? 'دابینکەری سەرەکی' : `نابەخێوکەر (${ben.providerName || 'کەسی تر'})`}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Badges & Actions */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ben.aidHistory && ben.aidHistory.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                          <Gift className="w-2.5 h-2.5 text-cyan-600" />
                          <span>هاوکاری: {ben.aidHistory.length} جار</span>
                        </span>
                      )}

                      {ben.location && (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              haptics.selection();
                              navigateToLocationOnMap(ben.location!.lat, ben.location!.lng, ben.location!.label || ben.fullName, ben.id);
                            }}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors shadow-xs"
                            title={`GPS: ${ben.location.lat}, ${ben.location.lng}`}
                          >
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                            <span>GPS نەخشە</span>
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${ben.location.lat},${ben.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:text-cyan-700"
                            title="Google Maps"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 ms-auto" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setSelectedBeneficiary(ben);
                          setIsGiveAidModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-colors flex items-center gap-1"
                        title="پێدانی هاوکاری بە سوودمەند"
                      >
                        <Gift className="w-3.5 h-3.5 text-emerald-600" />
                        <span>هاوکاری</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptics.light();
                          setSelectedBeneficiary(ben);
                        }}
                        className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200 transition-colors"
                        title="بینینی دۆسیە"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptics.light();
                          handleOpenEditModal(ben);
                        }}
                        className="p-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                        title="دەستکاری"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          haptics.warning();
                          const ok = await confirmAction({
                            title: 'سڕینەوەی دۆسیەی سوودمەند',
                            message: `دڵنیایت لە سڕینەوەی دۆسیەی (${ben.fullName}) لە داتابەیسی سەرهێڵ؟`,
                            confirmLabel: 'بەڵێ، دۆسیەکە بسڕەوە',
                            variant: 'danger'
                          });
                          if (ok) {
                            const res = await deleteBeneficiary(ben.id);
                            if (res && !res.success) {
                              showToast(res.message || 'هەڵەیەک ڕوویدا لە کاتی سڕینەوەی سوودمەند لە سێرڤەر.', 'error');
                            } else {
                              showToast(`دۆسیەی (${ben.fullName}) سڕایەوە.`, 'info');
                            }
                          }
                        }}
                        className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                        title="سڕینەوە لە داتابەیس"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= 1024px) */}
        <div
          ref={tableContainerRef}
          className={`hidden lg:block overflow-x-auto overflow-y-auto interactive-table-scrollbar ${
            isFullscreenTable ? 'flex-1 min-h-0' : 'max-h-[calc(100vh-270px)] min-h-[420px]'
          }`}
        >
          <table className="w-full text-end text-xs min-w-[1200px] border-collapse select-text">
            <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur-md border-b-2 border-slate-200 text-slate-700 font-bold shadow-xs">
              <tr>
                {/* 1. ناوی تەواو / تەمەن و ڕەگەز */}
                <th
                  scope="col"
                  className={`py-3 px-3.5 select-none transition-colors border-b ${
                    sortField === 'fullName' || sortField === 'age' || sortField === 'gender'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div
                      onClick={() => handleSort('fullName')}
                      className="flex items-center justify-between gap-1.5 cursor-pointer group hover:text-cyan-800 transition-colors"
                      title="کلیک بکە بۆ ڕیزبەندکردن بەپێی ناوی تەواو"
                    >
                      <span className="font-extrabold text-xs">ناوی تەواو</span>
                      <span className="flex items-center">
                        {sortField === 'fullName' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSort('age')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'age'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی تەمەن"
                      >
                        <span>تەمەن</span>
                        {sortField === 'age' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSort('gender')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'gender'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی ڕەگەز"
                      >
                        <span>ڕەگەز</span>
                        {sortField === 'gender' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                    </div>
                  </div>
                </th>

                {/* 2. ناسنامە / مۆبایل */}
                <th
                  scope="col"
                  className={`py-3 px-3.5 select-none transition-colors border-b ${
                    sortField === 'nationalId' || sortField === 'phone'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div
                      onClick={() => handleSort('nationalId')}
                      className="flex items-center justify-between gap-1.5 cursor-pointer group hover:text-cyan-800 transition-colors"
                      title="کلیک بکە بۆ ڕیزبەندکردن بەپێی ژمارەی ناسنامە"
                    >
                      <span className="font-extrabold text-xs">ناسنامە</span>
                      <span className="flex items-center">
                        {sortField === 'nationalId' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSort('phone')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'phone'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی ژمارەی مۆبایل"
                      >
                        <span>مۆبایل</span>
                        {sortField === 'phone' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                    </div>
                  </div>
                </th>

                {/* 3. پارێزگا / ناونیشان */}
                <th
                  scope="col"
                  className={`py-3 px-3.5 select-none transition-colors border-b ${
                    sortField === 'governorate' || sortField === 'address' || sortField === 'hasGps'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div
                      onClick={() => handleSort('governorate')}
                      className="flex items-center justify-between gap-1.5 cursor-pointer group hover:text-cyan-800 transition-colors"
                      title="کلیک بکە بۆ ڕیزبەندکردن بەپێی پارێزگا"
                    >
                      <span className="font-extrabold text-xs">پارێزگا</span>
                      <span className="flex items-center">
                        {sortField === 'governorate' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSort('address')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'address'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی ناونیشان"
                      >
                        <span>ناونیشان</span>
                        {sortField === 'address' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSort('hasGps')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'hasGps'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی بوونی GPS لەسەر نەخشە"
                      >
                        <span>GPS</span>
                        {sortField === 'hasGps' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                    </div>
                  </div>
                </th>

                {/* 4. پێگەی خێزان و بژێوی */}
                <th
                  scope="col"
                  className={`py-3 px-3.5 select-none transition-colors border-b ${
                    sortField === 'isProvider' || sortField === 'isFamilyHead'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div
                      onClick={() => handleSort('isProvider')}
                      className="flex items-center justify-between gap-1.5 cursor-pointer group hover:text-cyan-800 transition-colors"
                      title="کلیک بکە بۆ ڕیزبەندکردن بەپێی پێگەی بژێوی"
                    >
                      <span className="font-extrabold text-xs">پێگەی بژێوی</span>
                      <span className="flex items-center">
                        {sortField === 'isProvider' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSort('isFamilyHead')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'isFamilyHead'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی سەرۆکایەتی خێزان"
                      >
                        <span>سەرۆکی خێزان</span>
                        {sortField === 'isFamilyHead' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                    </div>
                  </div>
                </th>

                {/* 5. حاڵەت / ئەندام */}
                <th
                  scope="col"
                  className={`py-3 px-3.5 select-none transition-colors border-b ${
                    sortField === 'needCategory' || sortField === 'familyMembers'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div
                      onClick={() => handleSort('needCategory')}
                      className="flex items-center justify-between gap-1.5 cursor-pointer group hover:text-cyan-800 transition-colors"
                      title="کلیک بکە بۆ ڕیزبەندکردن بەپێی حاڵەتی پێویستی"
                    >
                      <span className="font-extrabold text-xs">حاڵەتی پێویستی</span>
                      <span className="flex items-center">
                        {sortField === 'needCategory' ? (
                          sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleSort('familyMembers')}
                        className={`px-1.5 py-0.5 rounded font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                          sortField === 'familyMembers'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'bg-slate-200/80 hover:bg-slate-300 text-slate-700'
                        }`}
                        title="ڕیزبەندکردن بەپێی ژمارەی ئەندامان"
                      >
                        <span>ئەندامانی خێزان</span>
                        {sortField === 'familyMembers' && (sortOrder === 'asc' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />)}
                      </button>
                    </div>
                  </div>
                </th>

                {/* 6. داهاتی مانگانە */}
                <th
                  scope="col"
                  onClick={() => handleSort('monthlyIncomeIQD')}
                  className={`py-3 px-3.5 select-none cursor-pointer transition-colors border-b group ${
                    sortField === 'monthlyIncomeIQD'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                  title="کلیک بکە بۆ ڕیزبەندکردن بەپێی داهاتی مانگانە"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-extrabold text-xs">داهاتی مانگانە</span>
                    <span className="flex items-center">
                      {sortField === 'monthlyIncomeIQD' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 7. دۆخی دۆسیە */}
                <th
                  scope="col"
                  onClick={() => handleSort('status')}
                  className={`py-3 px-3.5 select-none cursor-pointer transition-colors border-b group ${
                    sortField === 'status'
                      ? 'bg-cyan-100/90 text-cyan-950 border-b-2 border-cyan-500'
                      : 'hover:bg-slate-200/70'
                  }`}
                  title="کلیک بکە بۆ ڕیزبەندکردن بەپێی دۆخی دۆسیە"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-extrabold text-xs">دۆخی دۆسیە</span>
                    <span className="flex items-center">
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-cyan-700" /> : <ArrowDown className="w-3.5 h-3.5 text-cyan-700" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-40 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>

                {/* 8. کردارەکان */}
                <th scope="col" className="py-3 px-3.5 text-center font-extrabold text-xs border-b">
                  کردارەکان
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">هیچ کەسێکی سوودمەند تۆمار نەکراوە (سفر تۆمار)</p>
                    <p className="text-xs text-slate-400 mt-1">
                      دەتوانیت بە یەک بە یەک تۆماریان بکەیت یان فایلی ئێکسڵ بە کۆمەڵ هاوردە بکەیت
                    </p>
                  </td>
                </tr>
              ) : sortedBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Search className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-600 text-sm">هیچ کەسێک نەدۆزرایەوە بەپێی ئەم فلتەرانە</p>
                      <p className="text-xs text-slate-400">دەتوانیت فلتەرەکان پاکبکەیتەوە تا هەموو لیستەکە دەربکەوێت</p>
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 text-xs font-bold transition-all shadow-xs"
                      >
                        سڕینەوەی سەرجەم فلتەرەکان
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBeneficiaries.map(ben => {
                  const vuln = computeVulnerabilityScore(ben);
                  return (
                  <tr
                    key={ben.id}
                    onClick={() => setSelectedBeneficiary(ben)}
                    className={`cursor-pointer transition-colors group ${
                      selectedBeneficiary?.id === ben.id
                        ? 'bg-cyan-50/90 hover:bg-cyan-100/90'
                        : 'odd:bg-white even:bg-slate-50/40 hover:bg-cyan-50/50'
                    }`}
                  >
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-[11px]' : 'py-3.5 px-4 text-xs'}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            ben.gender === 'female'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-cyan-100 text-cyan-700'
                          }`}
                          title={ben.gender === 'female' ? 'مێینە' : 'نێرینە'}
                        >
                          {ben.gender === 'female' ? 'مێ' : 'نێر'}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 group-hover:text-cyan-800 transition-colors">
                              {ben.fullName}
                            </p>
                            {(ben.isConfidential || ben.status === 'confidential') && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold" title="دۆسیەی هەستیار و پارێزراو">
                                <Lock className="w-2.5 h-2.5 text-purple-600" />
                                <span>نهێنی</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {ben.age ? `${ben.age} ساڵ` : ''} {ben.isFamilyHead ? '• سەرۆکی خێزان' : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-[11px]' : 'py-3.5 px-4 text-xs'}`}>
                      <p className="font-mono font-bold text-cyan-700">{ben.nationalId}</p>
                      <p className="text-slate-600 text-[11px]">{ben.phone}</p>
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-[11px]' : 'py-3.5 px-4 text-xs'}`}>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold mb-1 border border-slate-200/60">
                        {ben.governorate}
                      </span>
                      <p className="text-[11px] text-slate-600 max-w-xs truncate">{ben.address}</p>
                      {ben.location && (
                        <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigateToLocationOnMap(ben.location!.lat, ben.location!.lng, ben.location!.label || ben.fullName, ben.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 transition-colors shadow-xs"
                            title={`GPS: ${ben.location.lat}, ${ben.location.lng}${ben.location.label ? ` (${ben.location.label})` : ''}`}
                          >
                            <MapPin className="w-3 h-3 text-emerald-600" />
                            <span>ماڵ لەسەر نەخشەیە</span>
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${ben.location.lat},${ben.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-cyan-700 p-0.5 rounded"
                            title="Google Maps"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-[11px]' : 'py-3.5 px-4 text-xs'}`}>
                      {ben.isProvider ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 block w-fit mb-0.5">
                            دابینکەری سەرەکی
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {ben.isOnlyProvider ? 'تەنها خۆیەتی' : `+${ben.otherProviders?.length || 0} کەسی تر`}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 block w-fit mb-0.5">
                            دابینکەر نییە
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[120px] block" title={ben.providerName}>
                            لەلایەن: {ben.providerName || 'کەسی تر'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-[11px]' : 'py-3.5 px-4 text-xs'}`}>
                      <span className="text-amber-800 font-bold block">{categoryLabels[ben.needCategory] || ben.needCategory}</span>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-500">{ben.familyMembers} ئەندام</span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${vuln.badgeClass}`}
                          title={`نمرەی پێویستی خێزان: ${vuln.score}/100 (${vuln.label})`}
                        >
                          <span>{vuln.score}%</span>
                          <span>• {vuln.label}</span>
                        </span>
                      </div>
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 font-bold text-slate-800 text-[11px]' : 'py-3.5 px-4 font-bold text-slate-800 text-xs'}`}>
                      {ben.monthlyIncomeIQD === 0 ? (
                        <span className="text-rose-600 font-bold">بێ داهات</span>
                      ) : (
                        `${ben.monthlyIncomeIQD.toLocaleString()} د.ع`
                      )}
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-[11px]' : 'py-3.5 px-4 text-xs'}`}>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* 1. Primary Case Status Badge */}
                        {ben.status === 'pending' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-600" /> لەژێر لێکۆڵینەوە
                          </span>
                        ) : ben.status === 'approved' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> پەسەندکراوە
                          </span>
                        ) : ben.status === 'confidential' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit whitespace-nowrap" title="دۆسیەی هەستیار و پارێزراو">
                            <ShieldCheck className="w-3 h-3 text-purple-600" /> سوودمەندی نهێنی
                          </span>
                        ) : ben.status === 'urgent' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit whitespace-nowrap animate-pulse">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> بەپەلە / فریاگوزاری
                          </span>
                        ) : ben.status === 'periodic' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <RefreshCw className="w-3 h-3 text-blue-600" /> هاوکاری مانگانە
                          </span>
                        ) : ben.status === 'suspended' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1 w-fit whitespace-nowrap">
                            <PauseCircle className="w-3 h-3 text-slate-500" /> ڕاگیراوی کاتی
                          </span>
                        ) : ben.status === 'rejected' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <X className="w-3 h-3 text-rose-600" /> ڕەتکراوەتەوە
                          </span>
                        ) : ben.status === 'archived' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <Archive className="w-3 h-3 text-slate-400" /> ئەرشیڤکراو
                          </span>
                        ) : ben.status === 'aided' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <Gift className="w-3 h-3 text-cyan-600" /> هاوکاریکراو ({ben.aidHistory?.length || 1})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit whitespace-nowrap">
                            <Clock className="w-3 h-3 text-amber-600" /> لەژێر لێکۆڵینەوە
                          </span>
                        )}

                        {/* 2. Confidential badge if flagged via isConfidential and status isn't confidential */}
                        {ben.isConfidential && ben.status !== 'confidential' && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit whitespace-nowrap" title="دۆسیەی هەستیار و پارێزراو">
                            <ShieldCheck className="w-2.5 h-2.5 text-purple-600" /> نهێنی
                          </span>
                        )}

                        {/* 3. Secondary Aid Badge: display alongside case status if beneficiary has received aid */}
                        {ben.status !== 'aided' && ben.aidHistory && ben.aidHistory.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 w-fit whitespace-nowrap shadow-xs" title={`کۆی هاوکارییە تۆمارکراوەکان: ${ben.aidHistory.length}`}>
                            <Gift className="w-3 h-3 text-cyan-600" /> هاوکاریکراو ({ben.aidHistory.length})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${tableDensity === 'compact' ? 'py-2 px-3 text-center' : 'py-3.5 px-4 text-center'}`}>
                      <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedBeneficiary(ben)}
                          className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors border border-cyan-200/60"
                          title="بینینی دۆسیەی تەواو"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(ben)}
                          className="p-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200/60"
                          title="دەستکاریکردنی زانیاری و بەڵگەنامەکان"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await confirmAction({
                              title: 'سڕینەوەی دۆسیەی سوودمەند',
                              message: `دڵنیایت لە سڕینەوەی دۆسیەی (${ben.fullName}) لە داتابەیسی سەرهێڵ؟`,
                              confirmLabel: 'بەڵێ، دۆسیەکە بسڕەوە',
                              variant: 'danger'
                            });
                            if (ok) {
                              const res = await deleteBeneficiary(ben.id);
                              if (res && !res.success) {
                                showToast(res.message || 'هەڵەیەک ڕوویدا لە کاتی سڕینەوەی سوودمەند لە سێرڤەر.', 'error');
                              } else {
                                showToast(`دۆسیەی (${ben.fullName}) سڕایەوە.`, 'info');
                              }
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/60"
                          title="سڕینەوە لە داتابەیس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <PaginationBar
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={sortedBeneficiaries.length}
          onPageChange={(p) => {
            setCurrentPage(p);
            tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="سوودمەند"
        />

        {/* Table Interactive Footer with Metrics & Scroll-to-Top */}
        <div className="p-3 sm:p-3.5 bg-slate-50/95 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 font-medium shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <span className="font-bold text-slate-800">
              کۆی سوودمەندان: <span className="text-cyan-700 font-black">{sortedBeneficiaries.length}</span> کەس
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>
              کۆی ئەندامانی خێزان: <span className="text-slate-900 font-bold">{totalFamilyMembersFiltered}</span> ئەندام
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>
              کۆی داهاتی مانگانە: <span className="text-emerald-700 font-bold">{totalMonthlyIncomeFiltered.toLocaleString()} د.ع</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-3 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold transition-colors shadow-xs flex items-center gap-1"
              title="گەڕانەوە بۆ سەرەوەی خشتەکە"
            >
              <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              <span>سەرەوەی خشتە</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Dual Registration Modal (Single vs Bulk Excel) */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-beneficiary-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            
            {/* Sticky Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-700 flex items-center justify-center font-bold shadow-xs">
                  <Users className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <h3 id="add-beneficiary-modal-title" className="text-base font-black text-slate-900 leading-tight">
                    {entryMode === 'single' ? 'تۆمارکردنی کەس یان خێزانی نوێ' : 'هاوردەکردنی بەکۆمەڵ بە ئێکسڵ'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {entryMode === 'single'
                      ? 'داخڵکردنی زانیارییە سەرەکییەکان و دۆخی بژێوی بۆ ناو داتابەیس'
                      : 'هاوردەکردنی سەدان دۆسیە لە چەند چرکەیەکدا بە فایلی Excel'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="داخستن"
                aria-label="داخستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pinned Mode Switcher Tabs */}
            <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setEntryMode('single')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    entryMode === 'single'
                      ? 'bg-white text-cyan-800 shadow-sm border border-slate-200/70'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>تۆمارکردنی تاکەکەسی (یەک بە یەک)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode('bulk')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    entryMode === 'bulk'
                      ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/70'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>هاوردەکردنی بەکۆمەڵ (ئێکسڵ)</span>
                </button>
              </div>
            </div>

            {/* -------------------- MODE 1: SINGLE ONE-BY-ONE ENTRY -------------------- */}
            {entryMode === 'single' && (
              <form onSubmit={handleSubmitBeneficiary} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                  {duplicateAlert && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-start gap-2.5 animate-bounce">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <div>
                        <p className="font-bold">هۆشداریی دووبارەبوونەوە!</p>
                        <p className="mt-0.5">{duplicateAlert}</p>
                      </div>
                    </div>
                  )}

                  {/* Basic Identifiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ناوی تەواوی کەس / سەرپەرشتیار:</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="ناوی چواری و نازناو"
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ژمارەی نیشتمانی یان ناسنامە:</label>
                      <input
                        type="text"
                        required
                        value={formData.nationalId}
                        onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                        placeholder="ژمارەی کارتی نیشتمانی"
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Demographics: Gender & Age */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1.5">ڕەگەز:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: 'male' })}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                            formData.gender === 'male'
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          نێر (پیاو)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, gender: 'female' })}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                            formData.gender === 'female'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          مێ (ئافرەت)
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">تەمەن (ساڵ):</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        required
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Head of Family & Provider Conditional Engine */}
                  <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-4">
                    {/* Head of family question */}
                    <div className="space-y-1.5">
                      <span className="block text-slate-800 font-bold text-xs">
                        ئایا ئەم کەسە سەرۆکی خێزانە؟
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isFamilyHead: true })}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 text-xs ${
                            formData.isFamilyHead === true
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>✓ بەڵێ (سەرۆکی خێزانە)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isFamilyHead: false })}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 text-xs ${
                            formData.isFamilyHead === false
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>نەخێر</span>
                        </button>
                      </div>
                    </div>

                    {/* Is Provider question */}
                    <div className="space-y-1.5 pt-3 border-t border-slate-200/80">
                      <span className="block text-slate-800 font-bold text-xs">
                        ئایا بژێوی خێزانەکە دابین دەکات؟
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isProvider: true })}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 text-xs ${
                            formData.isProvider === true
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>✓ بەڵێ (بژێوی دابین دەکات)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isProvider: false })}
                          className={`py-2 px-3 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1.5 text-xs ${
                            formData.isProvider === false
                              ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>نەخێر (کەسی تر دابین دەکات)</span>
                        </button>
                      </div>
                    </div>

                    {/* Sub-scenario A: If NOT provider -> Ask who is provider */}
                    {!formData.isProvider && (
                      <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-1.5 animate-in fade-in">
                        <label className="block text-amber-900 font-bold text-xs">
                          کێ بژێوی خێزانەکە دابین دەکات؟ (ناوی دابینکەر / پەیوەندی):
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.providerName}
                          onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                          placeholder="نموونە: باوک، کوڕی گەورە، خێرخوازان..."
                          className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                        />
                      </div>
                    )}

                    {/* Sub-scenario B: If IS provider -> Ask if ONLY provider or others exist */}
                    {formData.isProvider && (
                      <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in">
                        <span className="block text-slate-800 font-bold text-xs">
                          ئایا تەنها خۆیەتی بژێوی دابین دەکات یان کەسی تریش هەیە لە هەمان خێزاندا؟
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isOnlyProvider: true })}
                            className={`py-2 px-3 rounded-xl font-bold border transition-all text-center text-xs ${
                              formData.isOnlyProvider === true
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            تەنها خۆیەتی دابینکەر
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, isOnlyProvider: false })}
                            className={`py-2 px-3 rounded-xl font-bold border transition-all text-center text-xs ${
                              formData.isOnlyProvider === false
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            دابینکەری تریش هەیە لە خێزانەکەدا
                          </button>
                        </div>

                        {/* List other providers in the same family */}
                        {!formData.isOnlyProvider && (
                          <div className="pt-3 border-t border-slate-100 space-y-2.5">
                            <span className="text-xs font-bold text-slate-800 block">
                              تۆمارکردنی دابینکەرانی تر لە هەمان خێزاندا:
                            </span>

                            {formData.otherProviders.length > 0 && (
                              <div className="space-y-1.5 mb-2">
                                {formData.otherProviders.map((prov, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800">{prov.name}</span>
                                      <span className="text-slate-500">({prov.relation})</span>
                                      {prov.monthlyIncomeIQD ? (
                                        <span className="text-emerald-700 font-bold font-mono">
                                          - {prov.monthlyIncomeIQD.toLocaleString()} د.ع
                                        </span>
                                      ) : null}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOtherProvider(i)}
                                      className="text-rose-500 hover:text-rose-700 p-1"
                                      title="سڕینەوە"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add other provider row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                              <input
                                type="text"
                                value={newOtherProvider.name}
                                onChange={(e) => setNewOtherProvider({ ...newOtherProvider, name: e.target.value })}
                                placeholder="ناوی دابینکەر"
                                className="px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white"
                              />
                              <input
                                type="text"
                                value={newOtherProvider.relation}
                                onChange={(e) => setNewOtherProvider({ ...newOtherProvider, relation: e.target.value })}
                                placeholder="پەیوەندی (کوڕ، کچ...)"
                                className="px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white"
                              />
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={newOtherProvider.monthlyIncomeIQD || ''}
                                  onChange={(e) =>
                                    setNewOtherProvider({
                                      ...newOtherProvider,
                                      monthlyIncomeIQD: Number(e.target.value)
                                    })
                                  }
                                  placeholder="داهات (د.ع)"
                                  className="w-full px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddOtherProvider}
                                  className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shrink-0"
                                >
                                  زیادکردن
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phone & Governorate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0750XXXXXXX"
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                      <select
                        value={formData.governorate}
                        onChange={(e) => setFormData({ ...formData, governorate: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                      >
                        <option value="هەولێر">هەولێر</option>
                        <option value="سلێمانی">سلێمانی</option>
                        <option value="دهۆک">دهۆک</option>
                        <option value="هەڵەبجە">هەڵەبجە</option>
                        <option value="کەرکووک">کەرکووک</option>
                        <option value="گەرمیان">گەرمیان</option>
                        <option value="زاخۆ">زاخۆ</option>
                      </select>
                    </div>
                  </div>

                  {/* Detailed Address */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ناونیشانی ورد (گەڕەک، کۆڵان، نزیکترین شوێن):</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="شار / قەزا / گەڕەک / ژمارەی کۆڵان"
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    />
                  </div>

                  {/* GPS House Location on Map */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                        <MapPin className="w-4 h-4 text-cyan-600" />
                        دیاریکردنی وردی سەربان و پێگەی ماڵ لەسەر نەخشە (GPS):
                      </label>
                      {formData.location ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          پێگە دیاریکراوە
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">ئارەزوومەندانە</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1">هێڵی پانی و درێژی (Lat, Lng):</label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={formData.location ? `${formData.location.lat}, ${formData.location.lng}` : ''}
                            placeholder="پێگە دیاری نەکراوە"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-800"
                          />
                          {formData.location && (
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, location: undefined }))}
                              className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                              title="سڕینەوەی پێگە"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 font-medium mb-1">تێبینی ماڵ / ئاماژەی شوێن:</label>
                        <input
                          type="text"
                          value={formData.location?.label || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            location: prev.location
                              ? { ...prev.location, label: e.target.value }
                              : { lat: 36.19, lng: 44.01, label: e.target.value, tagDate: new Date().toISOString() }
                          }))}
                          placeholder="وەک: خانوی دوو نهۆم، سەربانی شین"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                        />
                      </div>
                    </div>

                    {gpsError && (
                      <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">
                        {gpsError}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleGetCurrentGPS(false)}
                        disabled={isGettingGPS}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all shadow-xs"
                      >
                        <Navigation className={`w-3.5 h-3.5 text-cyan-600 ${isGettingGPS ? 'animate-spin' : ''}`} />
                        <span>{isGettingGPS ? 'وەرگرتنی پێگە...' : 'وەرگرتنی پێگەی ئێستام (GPS مۆبایل)'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddModalOpen(false);
                          if (formData.location) {
                            navigateToLocationOnMap(formData.location.lat, formData.location.lng, formData.location.label || formData.fullName || 'ماڵی سوودمەند');
                          } else {
                            setActiveTab('geo');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-slate-600" />
                        <span>دیاریکردن لەسەر نەخشەی گشتی</span>
                      </button>
                    </div>
                  </div>

                  {/* Family Count, Monthly Income & Need Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">ئەندامانی خێزان:</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.familyMembers}
                        onChange={(e) => setFormData({ ...formData, familyMembers: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">داهاتی مانگانە (دینار):</label>
                      <input
                        type="number"
                        value={formData.monthlyIncomeIQD}
                        onChange={(e) => setFormData({ ...formData, monthlyIncomeIQD: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">حاڵەت:</label>
                      <select
                        value={formData.needCategory}
                        onChange={(e) => setFormData({ ...formData, needCategory: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                      >
                        <option value="poor">هەژار و کەمدەرامەت</option>
                        <option value="orphan">بێباوک و هەتیو</option>
                        <option value="sick">نەخۆشی درێژخایەن</option>
                        <option value="disabled">خاوەن پێداویستی تایبەت</option>
                        <option value="displaced">ئاوارە و پەنابەر</option>
                        <option value="student">خوێندکاری هەژار</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تێبینی و بارودۆخی تایبەت:</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="هەر تێبینییەکی مەیدانی یان بارودۆخی تایبەت..."
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    />
                  </div>

                  {/* Status Selection - Default is 'pending' (لەژێر لێکۆڵینەوە) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
                    <label className="block text-slate-800 font-bold mb-1 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      دۆخی سەرەتایی دۆسیە (Status):
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as BeneficiaryStatus;
                        setFormData(prev => ({
                          ...prev,
                          status: newStatus,
                          isConfidential: newStatus === 'confidential' ? true : prev.isConfidential
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold text-xs sm:text-sm"
                    >
                      <option value="pending">⏳ لەژێر لێکۆڵینەوە (پێویستی بە سەردانی مەیدانی و بەدواداچوونە)</option>
                      <option value="approved">✅ پەسەندکراو بۆ وەرگرتنی هاوکاری (Approved)</option>
                      <option value="urgent">🚨 حاڵەتی فریاگوزاری و بەپەلە (Urgent Emergency Case)</option>
                      <option value="confidential">🔒 سوودمەندی نهێنی و پارێزراو (Confidential Beneficiary)</option>
                      <option value="periodic">🔄 هاوکاری مانگانە / خولیی بەردەوام (Periodic Aid)</option>
                      <option value="aided">🎁 هاوکاری وەرگرتووە (Aided)</option>
                      <option value="suspended">⏸ ڕاگیراوی کاتی (Temporarily Suspended)</option>
                      <option value="rejected">❌ ڕەتکراوەتەوە (Rejected)</option>
                      <option value="archived">📁 دۆسیەی ئەرشیڤکراو (Archived Case)</option>
                    </select>

                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.isConfidential || formData.status === 'confidential'}
                          onChange={(e) => setFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                        />
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>دۆسیەی هەستیار و نهێنی (Confidential Record)</span>
                      </label>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        پاراستنی تایبەتمەندی
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      * بە شێوەی خۆکار لەسەر (لەژێر لێکۆڵینەوە) دانراوە. تەنانەت ئەگەر هاوکاریش وەربگرێت، دۆخی لێکۆڵینەوەکەی پارێزراو دەبێت.
                    </p>
                  </div>

                  {/* Attached Documents Upload (Optional) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-cyan-600" />
                        بەڵگەنامە و دۆکیۆمێنتەکان (ئارەزوومەندانە):
                      </label>
                      <span className="text-[11px] text-slate-500">
                        {formData.documents.length > 0 ? `${formData.documents.length} بەڵگەنامە زیادکراوە` : 'دەتوانیت یەک یان چەند فایلێک هاوپێچ بکەیت'}
                      </span>
                    </div>

                    <div>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        ref={singleDocInputRef}
                        onChange={handleSingleDocUpload}
                        className="hidden"
                        id="single-doc-upload-input"
                      />
                      <label
                        htmlFor="single-doc-upload-input"
                        className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl cursor-pointer bg-white transition-all hover:bg-cyan-50/30 group"
                      >
                        <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-cyan-600 mb-1 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-cyan-700">
                          کلیک بکە بۆ دیاریکردنی بەڵگەنامە (ناسنامە، وێنەی مەیدانی، ڕاپۆرتی پزیشکی...)
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          دەتوانیت یەک یان چەند فایلێک هەڵبژێریت (JPG, PNG, PDF)
                        </span>
                      </label>
                    </div>

                    {formData.documents.length > 0 && (
                      <div className="space-y-2 mt-2 max-h-44 overflow-y-auto">
                        {formData.documents.map(doc => (
                          <div
                            key={doc.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                                {doc.fileType?.includes('PDF') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-800 truncate">{doc.title}</p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{doc.category}</span>
                                  <span>{doc.fileSize}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {doc.fileData && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocument(doc)}
                                  className="p-1 text-cyan-600 hover:text-cyan-800 rounded-lg hover:bg-cyan-50"
                                  title="بینین"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleSingleRemoveDoc(doc.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50"
                                title="سڕینەوە"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Modal Footer (Permanently Visible) */}
                <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shrink-0 rounded-b-3xl">
                  {!isCloudConnected ? (
                    <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>داتابەیسی سەرهێڵ ناپەیوەستە</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 text-xs font-medium">
                      * پڕکردنەوەی ناوی تەواو و ناسنامە پێویستە
                    </span>
                  )}

                  <div className="flex items-center gap-2.5 ms-auto">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-xs"
                    >
                      پاشگەزبوونەوە
                    </button>
                    <button
                      type="submit"
                      disabled={!isCloudConnected || isSubmitting}
                      className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
                        !isCloudConnected || isSubmitting
                          ? 'bg-slate-400 cursor-not-allowed opacity-75'
                          : 'liquid-button-primary'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                          <span>تۆمارکردن لە داتابەیسی سەرهێڵ...</span>
                        </>
                      ) : (
                        <span>تۆمارکردن لە داتابەیس</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* -------------------- MODE 2: BULK EXCEL ENTRY -------------------- */}
            {entryMode === 'bulk' && (
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      هاوردەکردنی سوودمەندان بە کۆمەڵ بە فایلی ئێکسڵ
                    </h3>
                    <p className="text-xs text-slate-500">
                      دەتوانیت سەدان خێزانی سوودمەند لە چەند چرکەیەکدا هاوردەی داتابەیس بکەیت بە بەکارهێنانی فایلی Excel (.xlsx) یان CSV
                    </p>
                  </div>

                  {bulkImportSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <p className="font-bold">{bulkImportSuccess}</p>
                    </div>
                  )}

                  {/* Step 1: Download template */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">هەنگاوی ۱: داگرتنی تێمپلەیتی خاوێنی ئێکسڵ</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        تێمپلەیتەکە بە زمانی کوردی ئامادەکراوە و خانە و نموونەی سەرەکی تێدایە
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={downloadBeneficiaryExcelTemplate}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-xs transition-all shrink-0"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>داگرتنی تێمپلەیت (.xlsx)</span>
                    </button>
                  </div>

                  {/* Step 2: Upload File */}
                  <div className="p-6 rounded-3xl border-2 border-dashed border-slate-300 hover:border-cyan-500 transition-colors text-center bg-slate-50/50">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-xs sm:text-sm font-bold text-slate-700 mb-1">
                      فایلی ئێکسڵە پڕکراوەکە هەڵبژێرە یان ڕایبکێشە بۆ ئێرە
                    </p>
                    <p className="text-[11px] text-slate-400 mb-4">
                      پشتیوانی فۆرماتەکانی .xlsx, .xls, .csv دەکات
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="excel-file-input"
                    />
                    <label
                      htmlFor="excel-file-input"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer shadow-sm transition-colors"
                    >
                      {isUploading ? 'خوێندنەوەی فایل...' : 'هەڵبژاردنی فایل لە کۆمپیوتەر'}
                    </label>
                  </div>

                  {/* Step 3: Parsed Data Preview & Confirmation */}
                  {parsedData && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            دۆسیە دروستەکان: {parsedData.valid.length}
                          </span>
                          {parsedData.errors.length > 0 && (
                            <span className="text-rose-700 flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              کێشەکان: {parsedData.errors.length}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-500 font-mono">
                          کۆی گشتی: {parsedData.valid.length + parsedData.errors.length}
                        </span>
                      </div>

                      {/* Error Details List */}
                      {parsedData.errors.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-rose-50/90 border border-rose-200 space-y-2">
                          <h5 className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>وردەکاری دێڕە نادروستەکان لە فایلەکەدا ({parsedData.errors.length} دێڕ):</span>
                          </h5>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pe-1">
                            {parsedData.errors.map((err, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-xl bg-white border border-rose-200/70 flex items-center justify-between gap-2 text-[11px]"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono font-bold shrink-0">
                                    دێڕی #{err.row}
                                  </span>
                                  <span className="font-bold text-slate-800 truncate">
                                    {err.name || 'بێ ناو'}
                                  </span>
                                </div>
                                <span className="text-rose-700 font-medium text-end">
                                  {err.reason}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Preview Table */}
                      {parsedData.valid.length > 0 && (
                        <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200">
                          <table className="w-full text-end text-[11px]">
                            <thead className="bg-slate-100 sticky top-0 text-slate-700 font-bold">
                              <tr>
                                <th className="p-2">ناو</th>
                                <th className="p-2">ناسنامە</th>
                                <th className="p-2">ڕەگەز / تەمەن</th>
                                <th className="p-2">بژێوی</th>
                                <th className="p-2">پارێزگا</th>
                                <th className="p-2">داهات</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {parsedData.valid.slice(0, 15).map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                  <td className="p-2 font-bold text-slate-800">{row.fullName}</td>
                                  <td className="p-2 font-mono text-cyan-700">{row.nationalId}</td>
                                  <td className="p-2">
                                    {row.gender === 'female' ? 'مێ' : 'نێر'} • {row.age} ساڵ
                                  </td>
                                  <td className="p-2">
                                    {row.isProvider ? 'دابینکەرە' : `لەلایەن ${row.providerName || 'کەسی تر'}`}
                                  </td>
                                  <td className="p-2">{row.governorate}</td>
                                  <td className="p-2 font-mono">{row.monthlyIncomeIQD.toLocaleString()} د.ع</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedData.valid.length > 15 && (
                            <div className="p-2 text-center text-slate-400 text-[11px] bg-slate-50 font-medium">
                              پیشاندانی یەکەم ۱۵ خێزان لە کۆی {parsedData.valid.length} خێزان...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Sticky Bulk Import Footer (Permanently Visible) */}
                <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200/90 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                  <button
                    type="button"
                    onClick={() => {
                      if (parsedData) {
                        setParsedData(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      } else {
                        setIsAddModalOpen(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-xs"
                  >
                    پاشگەزبوونەوە
                  </button>
                  {parsedData && (
                    <button
                      type="button"
                      onClick={handleConfirmBulkImport}
                      disabled={parsedData.valid.length === 0 || !isCloudConnected || isSubmitting}
                      className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
                        parsedData.valid.length === 0 || !isCloudConnected || isSubmitting
                          ? 'bg-slate-400 cursor-not-allowed opacity-60'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                          <span>تۆمارکردن لە داتابەیسی سەرهێڵ...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>پەسەندکردن و تۆمارکردنی ({parsedData.valid.length}) سوودمەند لە داتابەیسی سەرهێڵ</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Beneficiary Details Modal & Aid History Drawer */}
      {selectedBeneficiary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="beneficiary-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 id="beneficiary-details-title" className="text-lg font-black text-slate-900 leading-tight truncate">
                    {selectedBeneficiary.fullName}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedBeneficiary.gender === 'female'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}
                  >
                    {selectedBeneficiary.gender === 'female' ? 'مێینە' : 'نێرینە'} ({selectedBeneficiary.age} ساڵ)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {categoryLabels[selectedBeneficiary.needCategory]}
                  </span>
                  {selectedBeneficiary.isFamilyHead && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      سەرۆکی خێزان
                    </span>
                  )}
                  {/* Primary Case Status Badge */}
                  {selectedBeneficiary.status === 'pending' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" /> لەژێر لێکۆڵینەوە
                    </span>
                  ) : selectedBeneficiary.status === 'approved' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> پەسەندکراوە
                    </span>
                  ) : selectedBeneficiary.status === 'confidential' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-xs">
                      <Lock className="w-3 h-3 text-purple-700" /> سوودمەندی نهێنی و پارێزراو
                    </span>
                  ) : selectedBeneficiary.status === 'urgent' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-600" /> فریاگوزاری بەپەلە
                    </span>
                  ) : selectedBeneficiary.status === 'periodic' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-blue-600" /> هاوکاری مانگانە / خولیی
                    </span>
                  ) : selectedBeneficiary.status === 'suspended' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                      <PauseCircle className="w-3 h-3 text-slate-500" /> ڕاگیراوی کاتی
                    </span>
                  ) : selectedBeneficiary.status === 'rejected' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <X className="w-3 h-3 text-rose-600" /> ڕەتکراوەتەوە
                    </span>
                  ) : selectedBeneficiary.status === 'archived' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                      <Archive className="w-3 h-3 text-slate-400" /> ئەرشیڤکراو
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                      <Gift className="w-3 h-3 text-cyan-600" /> هاوکاریکراو ({selectedBeneficiary.aidHistory?.length || 1})
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> {selectedBeneficiary.address} ({selectedBeneficiary.governorate})
                </p>
              </div>

              {/* Edit Beneficiary & Close Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(selectedBeneficiary)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">دەستکاریکردن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBeneficiary(null)}
                  className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                  title="داخستن"
                  aria-label="داخستن"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

            {/* Confidential Warning / Protection Notice */}
            {(selectedBeneficiary.isConfidential || selectedBeneficiary.status === 'confidential') && (
              <div className="my-3.5 p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-3 text-purple-900">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                  <Lock className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">ئەم دۆسیەیە بە پێگەی سوودمەندی نهێنی و پارێزراو پۆلێن کراوە (Confidential Beneficiary)</p>
                  <p className="text-[11px] text-purple-700/90 mt-0.5">
                    بە مەبەستی پاراستنی کەرامەت و تایبەتمەندی خێزانەکە، ناونیشان و ناسنامەکەی پارێزراوە و تەنها بۆ بەڕێوەبەری سەرەکی دەبینرێت.
                  </p>
                </div>
              </div>
            )}

            {/* GPS House Location Card */}
            {selectedBeneficiary.location && (
              <div className="my-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-900">پێگەی دیاریکراوی ماڵ لەسەر نەخشە</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/60 text-emerald-800">
                        GPS تۆمارکراوە
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                      {selectedBeneficiary.location.lat}, {selectedBeneficiary.location.lng}
                      {selectedBeneficiary.location.label ? ` • ${selectedBeneficiary.location.label}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      const loc = selectedBeneficiary.location!;
                      setSelectedBeneficiary(null);
                      navigateToLocationOnMap(loc.lat, loc.lng, loc.label || selectedBeneficiary.fullName, selectedBeneficiary.id);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>بینین لەسەر نەخشە</span>
                  </button>
                  <a
                    href={`https://www.google.com/maps?q=${selectedBeneficiary.location.lat},${selectedBeneficiary.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>
            )}

            {/* Quick Stats Grid + Vulnerability Score */}
            {(() => {
              const dossierVuln = computeVulnerabilityScore(selectedBeneficiary);
              return (
                <div className="my-5 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">ژمارەی ناسنامە:</span>
                      <span className="font-mono text-xs font-bold text-cyan-700">{selectedBeneficiary.nationalId}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">مۆبایل:</span>
                      <span className="font-bold text-xs text-slate-900">{selectedBeneficiary.phone}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">ئەندامانی خێزان:</span>
                      <span className="font-bold text-xs text-amber-700">{selectedBeneficiary.familyMembers} کەس</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">داهاتی مانگانە (بۆ هەر تاکێک):</span>
                      <span className="font-bold text-xs text-emerald-700">
                        {selectedBeneficiary.monthlyIncomeIQD.toLocaleString()} د.ع
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">
                        ({dossierVuln.perCapitaIncomeIQD.toLocaleString()} د.ع / کەس)
                      </span>
                    </div>
                  </div>

                  {/* Household Vulnerability Score Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800">نمرەی هەڵسەنگاندنی پێویستی خێزان:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${dossierVuln.badgeClass}`}>
                          {dossierVuln.score}/100 • {dossierVuln.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {dossierVuln.factors.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-700"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${dossierVuln.barClass}`}
                        style={{ width: `${dossierVuln.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Provider & Family Financial Support Details Box */}
            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 mb-5">
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-600" />
                زانیاری بژێوی و سەرچاوەی داهاتی خێزان:
              </h4>
              <div className="text-xs text-slate-700 space-y-1.5">
                <p>
                  <span className="font-bold">ئایا ئەم کەسە بژێوی دابین دەکات:</span>{' '}
                  {selectedBeneficiary.isProvider ? (
                    <span className="text-emerald-700 font-bold">بەڵێ (دابینکەری سەرەکییە)</span>
                  ) : (
                    <span className="text-amber-800 font-bold">نەخێر</span>
                  )}
                </p>

                {!selectedBeneficiary.isProvider && (
                  <p>
                    <span className="font-bold">کێ بژێوی خێزانەکە دابین دەکات:</span>{' '}
                    <span className="font-bold text-slate-900">{selectedBeneficiary.providerName || 'کەسی تر'}</span>
                  </p>
                )}

                {selectedBeneficiary.isProvider && (
                  <p>
                    <span className="font-bold">ئایا تەنها خۆیەتی بژێوی دابین دەکات:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {selectedBeneficiary.isOnlyProvider ? 'بەڵێ (تەنها خۆیەتی)' : 'نەخێر (دابینکەری تریش هەیە)'}
                    </span>
                  </p>
                )}

                {selectedBeneficiary.otherProviders && selectedBeneficiary.otherProviders.length > 0 && (
                  <div className="mt-2.5 pt-2.5 border-t border-cyan-200">
                    <span className="font-bold block mb-1">دابینکەرانی تر لە هەمان خێزاندا:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedBeneficiary.otherProviders.map((op, i) => (
                        <div key={i} className="p-2 rounded-xl bg-white border border-cyan-100 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-900">{op.name}</p>
                            <span className="text-[10px] text-slate-500">پەیوەندی: {op.relation}</span>
                          </div>
                          {op.monthlyIncomeIQD ? (
                            <span className="font-bold text-emerald-700">{op.monthlyIncomeIQD.toLocaleString()} د.ع</span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedBeneficiary.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
                <span className="text-xs font-bold text-slate-800 block mb-1">تێبینی و ڕاپۆرتی مەیدانی:</span>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedBeneficiary.notes}</p>
              </div>
            )}

            {/* Attached Documents Section (بەڵگەنامە هاوپێچکراوەکان) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-cyan-600" />
                  بەڵگەنامە و دۆکیۆمێنتە هاوپێچکراوەکانی ئەم دۆسیەیە ({selectedBeneficiary.documents?.length || 0})
                </h4>
                
                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    ref={viewDocInputRef}
                    onChange={handleViewDossierDocUpload}
                    className="hidden"
                    id="view-doc-upload-input"
                  />
                  <label
                    htmlFor="view-doc-upload-input"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>بارکردنی بەڵگەنامەی نوێ</span>
                  </label>
                </div>
              </div>

              {(!selectedBeneficiary.documents || selectedBeneficiary.documents.length === 0) ? (
                <div className="p-4 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                  هیچ بەڵگەنامەیەک بۆ ئەم سوودمەندە هاوپێچ نەکراوە. دەتوانیت لە دوگمەی سەرەوە وێنەی ناسنامە، کارتی زانیاری، یان ڕاپۆرتی پزیشکی باربکەیت.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedBeneficiary.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                          {doc.fileType?.includes('PDF') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate" title={doc.title}>{doc.title}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold">{doc.category}</span>
                            <span>{doc.fileSize}</span>
                            <span>• {doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {doc.fileData && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocument(doc)}
                            className="p-1.5 text-cyan-700 hover:bg-cyan-50 rounded-lg border border-cyan-200/60"
                            title="بینینی تەواو"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {doc.fileData && (
                          <a
                            href={doc.fileData}
                            download={doc.fileName || `${doc.title}.png`}
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200/60"
                            title="داگرتن"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleViewDossierDocDelete(doc.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200/60"
                          title="سڕینەوەی ئەم بەڵگەنامەیە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Aid History Timeline */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  مێژووی هاوکارییە وەرگیراوەکان ({selectedBeneficiary.aidHistory.length})
                </h4>
                <button
                  onClick={() => setIsGiveAidModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl liquid-button-primary text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  هاوکاریکردنی ئەم دۆسیەیە
                </button>
              </div>

              {selectedBeneficiary.aidHistory.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                  تا ئێستا هیچ کۆمەک و هاوکارییەک بۆ ئەم خێزانە تۆمار نەکراوە
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedBeneficiary.aidHistory.map(aid => (
                    <div
                      key={aid.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{aid.projectTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500">بەروار: {aid.date}</span>
                          {aid.receiptNumber && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono border border-emerald-200">
                              پسوولە: {aid.receiptNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-start font-bold">
                          {aid.type === 'monetary' ? (
                            <span className="text-emerald-700">
                              {aid.currency === 'USD'
                                ? `$${(aid.amount || aid.amountIQD || 0).toLocaleString()}`
                                : `${(aid.amount || aid.amountIQD || 0).toLocaleString()} د.ع`}
                            </span>
                          ) : (
                            <span className="text-cyan-700">
                              {aid.quantity} {aid.itemName} {aid.unit || ''}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 border-r border-slate-200 pe-1.5 me-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditBenAid(aid)}
                            className="p-1 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 border border-slate-200 transition-colors"
                            title="دەستکاریکردنی ئەم هاوکارییە"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBenAid(aid.id)}
                            className="p-1 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 transition-colors"
                            title="سڕینەوەی ئەم تۆمارە"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200/90 flex items-center justify-between gap-3 shrink-0 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setIsSMSModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200 shadow-xs"
              >
                <MessageSquare className="w-4 h-4 text-cyan-600" />
                <span>ناردنی کورتەنامە (SMS)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedBeneficiary(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Give Aid Modal */}
      {isGiveAidModalOpen && selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              تۆمارکردنی هاوکاری بۆ: {selectedBeneficiary.fullName}
            </h3>

            <form onSubmit={handleGiveAidSubmit} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">جۆری هاوکاری:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAidForm({ ...aidForm, type: 'monetary' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      aidForm.type === 'monetary'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    نەختینەیی (پارەی کاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAidForm({ ...aidForm, type: 'in-kind' })}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all text-center ${
                      aidForm.type === 'in-kind'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    ماددی (خۆراک/کەلوپەل)
                  </button>
                </div>
              </div>

              {aidForm.type === 'monetary' ? (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        سەرچاوەی نەختینە لە خەزێنە (پسوولەی بەخشین):
                      </span>
                      {aidForm.selectedDonationId && (
                        <button
                          type="button"
                          onClick={() => setAidForm(prev => ({ ...prev, selectedDonationId: '' }))}
                          className="text-[10px] text-slate-400 hover:text-slate-600 underline font-normal"
                        >
                          پاککردنەوە
                        </button>
                      )}
                    </label>
                    <select
                      value={aidForm.selectedDonationId}
                      onChange={(e) => {
                        const donId = e.target.value;
                        const matched = availableCashDonations.find(item => item.donation.id === donId);
                        setAidForm(prev => ({
                          ...prev,
                          selectedDonationId: donId,
                          currency: matched?.donation.currency === 'USD' ? 'USD' : 'IQD',
                          amountIQD: matched ? Math.min(prev.amountIQD, matched.metrics.remainingCash) : prev.amountIQD,
                          projectTitle: matched ? `دابەشکردنی کۆمەکی نەختینەی پسوولەی ${matched.donation.receiptNumber} (${matched.donation.donorName})` : prev.projectTitle
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                    >
                      <option value="">خەزێنەی گشتی (بەبێ بەستنەوە بە پسوولەی دیاریکراو)</option>
                      {availableCashDonations.map(({ donation, metrics }) => (
                        <option key={donation.id} value={donation.id}>
                          پسوولەی {donation.receiptNumber} ({donation.donorName}) — ماوە: {metrics.remainingCash.toLocaleString()} {metrics.currencySymbol}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const selectedDonMetrics = availableCashDonations.find(item => item.donation.id === aidForm.selectedDonationId);
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-700 font-bold">
                            بڕی پارە ({aidForm.currency === 'USD' ? 'دۆلار $' : 'دینار د.ع'}):
                          </label>
                          {selectedDonMetrics && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              بەردەست لە پسوولە: {selectedDonMetrics.metrics.remainingCash.toLocaleString()} {selectedDonMetrics.metrics.currencySymbol}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={1}
                          step="any"
                          value={aidForm.amountIQD}
                          onChange={(e) => setAidForm({ ...aidForm, amountIQD: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                        />
                        {/* Quick preset amounts */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(aidForm.currency === 'USD' ? [25, 50, 100, 200] : [25000, 50000, 100000, 150000, 250000]).map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                const maxAllowed = selectedDonMetrics ? selectedDonMetrics.metrics.remainingCash : preset;
                                setAidForm(prev => ({ ...prev, amountIQD: Math.min(preset, maxAllowed) }));
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                                aidForm.amountIQD === preset
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {aidForm.currency === 'USD' ? `$${preset}` : `${(preset / 1000)} هەزار`}
                            </button>
                          ))}
                          {selectedDonMetrics && (
                            <button
                              type="button"
                              onClick={() => setAidForm(prev => ({ ...prev, amountIQD: selectedDonMetrics.metrics.remainingCash }))}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 me-auto"
                            >
                              تەواوی ماوە ({selectedDonMetrics.metrics.remainingCash.toLocaleString()})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ناوی کەلوپەل:</label>
                    <input
                      type="text"
                      value={aidForm.itemName}
                      onChange={(e) => setAidForm({ ...aidForm, itemName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ژمارە / دانە:</label>
                    <input
                      type="number"
                      value={aidForm.quantity}
                      onChange={(e) => setAidForm({ ...aidForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">لە چوارچێوەی کام پڕۆژە:</label>
                <input
                  type="text"
                  value={aidForm.projectTitle}
                  onChange={(e) => setAidForm({ ...aidForm, projectTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGiveAidModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  پەسەندکردنی هاوکاری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Beneficiary Aid Modal */}
      {isEditBenAidModalOpen && editingBenAid && selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                دەستکاریکردنی هاوکاری بۆ: {selectedBeneficiary.fullName}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditBenAidModalOpen(false);
                  setEditingBenAid(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBenAid} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {editingBenAid.type === 'monetary'
                    ? `بڕی پارە (${editingBenAid.currency === 'USD' ? 'دۆلار $' : 'دینار د.ع'}):`
                    : `بڕ / دانە (${editingBenAid.unit || 'دانە'}):`}
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={editBenAidForm.amount}
                  onChange={(e) => setEditBenAidForm({ ...editBenAidForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">لە چوارچێوەی کام پڕۆژە:</label>
                <input
                  type="text"
                  value={editBenAidForm.projectTitle}
                  onChange={(e) => setEditBenAidForm({ ...editBenAidForm, projectTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">بەروار:</label>
                <input
                  type="date"
                  value={editBenAidForm.date}
                  onChange={(e) => setEditBenAidForm({ ...editBenAidForm, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی:</label>
                <textarea
                  rows={2}
                  value={editBenAidForm.notes}
                  onChange={(e) => setEditBenAidForm({ ...editBenAidForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditBenAidModalOpen(false);
                    setEditingBenAid(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  پاشەکەوتکردنی گۆڕانکاری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {isSMSModalOpen && selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              ناردنی کورتەنامە (SMS)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              بۆ: {selectedBeneficiary.fullName} ({selectedBeneficiary.phone})
            </p>

            <textarea
              rows={4}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              className="w-full p-3 rounded-2xl liquid-input text-slate-900 text-xs leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSMSModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={handleSendSMS}
                className="px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold"
              >
                ناردنی ئێستا
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Beneficiary & Manage Documents */}
      {isEditModalOpen && editingBeneficiary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-beneficiary-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/95 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="edit-beneficiary-modal-title" className="text-base font-black text-slate-900 leading-tight">
                    دەستکاریکردنی دۆسیە و بەڵگەنامەکانی سوودمەند
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                    <span>دۆسیەی:</span>
                    <strong className="text-slate-800">{editingBeneficiary.fullName}</strong>
                    <span className="font-mono font-bold text-cyan-700">({editingBeneficiary.nationalId})</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBeneficiary(null);
                }}
                className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="داخستن"
                aria-label="داخستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBeneficiary} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {editDuplicateAlert && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{editDuplicateAlert}</span>
                  </div>
                )}

              {/* Requirement 2: Status is editable and can be approved */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-900 font-black text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    دۆخی فەرمی دۆسیە (Status):
                  </label>
                  <span className="text-[11px] text-amber-800 font-bold bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300/60">
                    دەستکاریکردنی دۆخ
                  </span>
                </div>

                <select
                  value={editFormData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as BeneficiaryStatus;
                    setEditFormData(prev => ({
                      ...prev,
                      status: newStatus,
                      isConfidential: newStatus === 'confidential' ? true : prev.isConfidential
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold text-xs sm:text-sm"
                >
                  <option value="pending">⏳ لەژێر لێکۆڵینەوە (پێویستی بە سەردانی مەیدانی و بەدواداچوونە)</option>
                  <option value="approved">✅ پەسەندکراو بۆ وەرگرتنی هاوکاری (Approved)</option>
                  <option value="urgent">🚨 حاڵەتی فریاگوزاری و بەپەلە (Urgent Emergency Case)</option>
                  <option value="confidential">🔒 سوودمەندی نهێنی و پارێزراو (Confidential Beneficiary)</option>
                  <option value="periodic">🔄 هاوکاری مانگانە / خولیی بەردەوام (Periodic Aid)</option>
                  <option value="aided">🎁 هاوکاری وەرگرتووە (Aided)</option>
                  <option value="suspended">⏸ ڕاگیراوی کاتی (Temporarily Suspended)</option>
                  <option value="rejected">❌ ڕەتکراوەتەوە (Rejected)</option>
                  <option value="archived">📁 دۆسیەی ئەرشیڤکراو (Archived Case)</option>
                </select>

                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.isConfidential || editFormData.status === 'confidential'}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, isConfidential: e.target.checked }))}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                    />
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>دۆسیەی هەستیار و نهێنی (Confidential Record)</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    پاراستنی نهێنی
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  * سوودمەند دەتوانێت لە یەک کاتدا دۆخی دۆسیەکەی لەژێر لێکۆڵینەوە بێت و هاوکاریشی پێدرابێت. هاوکاریکردن دۆخی سەرەکی ناسڕێتەوە.
                </p>
              </div>

              {/* Full Name & National ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ناوی تەواوی کەس:</label>
                  <input
                    type="text"
                    required
                    value={editFormData.fullName}
                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی ناسنامە (بۆ ڕێگری لە دووبارەبوونەوە):</label>
                  <input
                    type="text"
                    required
                    value={editFormData.nationalId}
                    onChange={(e) => setEditFormData({ ...editFormData, nationalId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ڕەگەز:</label>
                  <select
                    value={editFormData.gender}
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <option value="male">نێر (پیاو)</option>
                    <option value="female">مێ (ئافرەت)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تەمەن (ساڵ):</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={editFormData.age}
                    onChange={(e) => setEditFormData({ ...editFormData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              </div>

              {/* Family Head & Provider Section */}
              <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold">ئایا ئەم کەسە سەرۆکی خێزانە؟</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="radio"
                        name="editIsFamilyHead"
                        checked={editFormData.isFamilyHead === true}
                        onChange={() => setEditFormData({ ...editFormData, isFamilyHead: true })}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>بەڵێ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                      <input
                        type="radio"
                        name="editIsFamilyHead"
                        checked={editFormData.isFamilyHead === false}
                        onChange={() => setEditFormData({ ...editFormData, isFamilyHead: false })}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span>نەخێر</span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-cyan-200/60 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold">ئایا ئەم کەسە بژێوی خێزانەکە دابین دەکات؟</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                        <input
                          type="radio"
                          name="editIsProvider"
                          checked={editFormData.isProvider === true}
                          onChange={() => setEditFormData({ ...editFormData, isProvider: true })}
                          className="text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>بەڵێ</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                        <input
                          type="radio"
                          name="editIsProvider"
                          checked={editFormData.isProvider === false}
                          onChange={() => setEditFormData({ ...editFormData, isProvider: false })}
                          className="text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>نەخێر</span>
                      </label>
                    </div>
                  </div>

                  {!editFormData.isProvider && (
                    <div className="mt-3 bg-white p-3 rounded-xl border border-cyan-200">
                      <label className="block text-slate-700 font-bold mb-1">ئەگەر نەخێر، کێ بژێوی خێزان دابین دەکات؟</label>
                      <input
                        type="text"
                        required
                        value={editFormData.providerName}
                        onChange={(e) => setEditFormData({ ...editFormData, providerName: e.target.value })}
                        placeholder="ناوی ئەو کەسەی بژێوی دابین دەکات..."
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                      />
                    </div>
                  )}

                  {editFormData.isProvider && (
                    <div className="mt-3 space-y-3 bg-white p-3.5 rounded-xl border border-cyan-200">
                      <div className="flex items-center justify-between">
                        <label className="text-slate-800 font-bold">ئایا تەنها خۆیەتی بژێوی خێزان دابین دەکات؟</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="editIsOnlyProvider"
                              checked={editFormData.isOnlyProvider === true}
                              onChange={() => setEditFormData({ ...editFormData, isOnlyProvider: true })}
                              className="text-cyan-600 focus:ring-cyan-500"
                            />
                            <span>بەڵێ (تەنها خۆیەتی)</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="editIsOnlyProvider"
                              checked={editFormData.isOnlyProvider === false}
                              onChange={() => setEditFormData({ ...editFormData, isOnlyProvider: false })}
                              className="text-cyan-600 focus:ring-cyan-500"
                            />
                            <span>نەخێر (کەسی تریش هەیە)</span>
                          </label>
                        </div>
                      </div>

                      {!editFormData.isOnlyProvider && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                          <label className="block text-slate-700 font-bold">
                            تۆمارکردنی دابینکەرانی تر لە هەمان خێزاندا:
                          </label>

                          {editFormData.otherProviders.length > 0 && (
                            <div className="space-y-2">
                              {editFormData.otherProviders.map((op, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-slate-900">{op.name}</span>
                                    <span className="text-slate-500 me-2">({op.relation})</span>
                                    {op.monthlyIncomeIQD ? (
                                      <span className="text-emerald-700 font-bold me-2">
                                        • داهات: {op.monthlyIncomeIQD.toLocaleString()} د.ع
                                      </span>
                                    ) : null}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEditOtherProvider(i)}
                                    className="text-rose-500 hover:text-rose-700 p-1"
                                    title="سڕینەوە"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <input
                              type="text"
                              value={newEditOtherProvider.name}
                              onChange={(e) => setNewEditOtherProvider({ ...newEditOtherProvider, name: e.target.value })}
                              placeholder="ناوی دابینکەر"
                              className="px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white"
                            />
                            <input
                              type="text"
                              value={newEditOtherProvider.relation}
                              onChange={(e) => setNewEditOtherProvider({ ...newEditOtherProvider, relation: e.target.value })}
                              placeholder="پەیوەندی (کوڕ، کچ...)"
                              className="px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={newEditOtherProvider.monthlyIncomeIQD || ''}
                                onChange={(e) =>
                                  setNewEditOtherProvider({
                                    ...newEditOtherProvider,
                                    monthlyIncomeIQD: Number(e.target.value)
                                  })
                                }
                                placeholder="داهات (د.ع)"
                                className="w-full px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white"
                              />
                              <button
                                type="button"
                                onClick={handleAddEditOtherProvider}
                                className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shrink-0"
                              >
                                زیادکردن
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone & Governorate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    required
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                  <select
                    value={editFormData.governorate}
                    onChange={(e) => setEditFormData({ ...editFormData, governorate: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                    <option value="گەرمیان">گەرمیان</option>
                    <option value="زاخۆ">زاخۆ</option>
                  </select>
                </div>
              </div>

              {/* Detailed Address */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناونیشانی ورد (گەڕەک، کۆڵان، نزیکترین شوێن):</label>
                <input
                  type="text"
                  required
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              {/* GPS House Location on Map */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                    <MapPin className="w-4 h-4 text-cyan-600" />
                    دیاریکردنی وردی سەربان و پێگەی ماڵ لەسەر نەخشە (GPS):
                  </label>
                  {editFormData.location ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      پێگە دیاریکراوە
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">ئارەزوومەندانە</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">هێڵی پانی و درێژی (Lat, Lng):</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        readOnly
                        value={editFormData.location ? `${editFormData.location.lat}, ${editFormData.location.lng}` : ''}
                        placeholder="پێگە دیاری نەکراوە"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono bg-white text-slate-800"
                      />
                      {editFormData.location && (
                        <button
                          type="button"
                          onClick={() => setEditFormData(prev => ({ ...prev, location: undefined }))}
                          className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                          title="سڕینەوەی پێگە"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">تێبینی ماڵ / ئاماژەی شوێن:</label>
                    <input
                      type="text"
                      value={editFormData.location?.label || ''}
                      onChange={(e) => setEditFormData(prev => ({
                        ...prev,
                        location: prev.location
                          ? { ...prev.location, label: e.target.value }
                          : { lat: 36.19, lng: 44.01, label: e.target.value, tagDate: new Date().toISOString() }
                      }))}
                      placeholder="وەک: خانوی دوو نهۆم، سەربانی شین"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-800"
                    />
                  </div>
                </div>

                {gpsError && (
                  <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-2 rounded-xl border border-rose-200">
                    {gpsError}
                  </p>
                )}

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleGetCurrentGPS(true)}
                    disabled={isGettingGPS}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all shadow-sm"
                  >
                    <Navigation className={`w-3.5 h-3.5 text-cyan-600 ${isGettingGPS ? 'animate-spin' : ''}`} />
                    <span>{isGettingGPS ? 'وەرگرتنی پێگە...' : 'وەرگرتنی پێگەی ئێستام (GPS مۆبایل)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      if (editingBeneficiary?.location) {
                        navigateToLocationOnMap(
                          editingBeneficiary.location.lat,
                          editingBeneficiary.location.lng,
                          editingBeneficiary.location.label || editingBeneficiary.fullName,
                          editingBeneficiary.id
                        );
                      } else {
                        setActiveTab('geo');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-sm"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-slate-600" />
                    <span>دیاریکردن لەسەر نەخشەی گشتی</span>
                  </button>
                </div>
              </div>

              {/* Family Count, Monthly Income & Need Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ئەندامانی خێزان:</label>
                  <input
                    type="number"
                    min={1}
                    value={editFormData.familyMembers}
                    onChange={(e) => setEditFormData({ ...editFormData, familyMembers: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">داهاتی مانگانە (دینار):</label>
                  <input
                    type="number"
                    value={editFormData.monthlyIncomeIQD}
                    onChange={(e) => setEditFormData({ ...editFormData, monthlyIncomeIQD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">حاڵەت:</label>
                  <select
                    value={editFormData.needCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, needCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <option value="poor">هەژار و کەمدەرامەت</option>
                    <option value="orphan">بێباوک و هەتیو</option>
                    <option value="sick">نەخۆشی درێژخایەن</option>
                    <option value="disabled">خاوەن پێداویستی تایبەت</option>
                    <option value="displaced">ئاوارە و پەنابەر</option>
                    <option value="student">خوێندکاری هەژار</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی و بارودۆخی تایبەت:</label>
                <textarea
                  rows={2}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              {/* Requirement 1: Manage Documents (Upload, Edit, Delete) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-900 font-bold flex items-center gap-1.5 text-xs sm:text-sm">
                    <Paperclip className="w-4 h-4 text-cyan-600" />
                    بەڕێوەبردنی بەڵگەنامە و دۆکیۆمێنتەکان ({editFormData.documents.length}):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    دەتوانیت یەک یان چەند فایلێک باربکەیت، دەستکاری بکەیت، یان بسڕیتەوە
                  </span>
                </div>

                <div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    ref={editDocInputRef}
                    onChange={handleEditDocUpload}
                    className="hidden"
                    id="edit-doc-upload-input"
                  />
                  <label
                    htmlFor="edit-doc-upload-input"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-cyan-500 rounded-2xl cursor-pointer bg-white transition-all hover:bg-cyan-50/30 group"
                  >
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-cyan-600 mb-1 transition-colors" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-cyan-700">
                      کلیک بکە بۆ زیادکردنی بەڵگەنامەی نوێ بۆ ئەم سوودمەندە
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      وێنەی ناسنامە، کارتی نیشتمانی، ڕاپۆرتی پزیشکی، کۆبۆنی خۆراک (JPG, PNG, PDF)
                    </span>
                  </label>
                </div>

                {editFormData.documents.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs bg-white rounded-xl border border-slate-200">
                    تا ئێستا هیچ بەڵگەنامەیەک بۆ ئەم سوودمەندە هاوپێچ نەکراوە
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {editFormData.documents.map(doc => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                              {doc.fileType?.includes('PDF') ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-[10px] text-slate-400">{doc.fileName}</span>
                              <span className="text-[10px] text-slate-400 me-2">({doc.fileSize} • {doc.uploadDate})</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {doc.fileData && (
                              <button
                                type="button"
                                onClick={() => setPreviewDocument(doc)}
                                className="p-1.5 text-cyan-600 hover:text-cyan-800 rounded-lg hover:bg-cyan-50 border border-cyan-100"
                                title="بینین"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEditRemoveDoc(doc.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 border border-rose-100"
                              title="سڕینەوەی ئەم بەڵگەنامەیە"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Editable Title and Category inline */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-bold">ناوی بەڵگەنامە:</label>
                            <input
                              type="text"
                              value={doc.title}
                              onChange={(e) => handleEditUpdateDocTitle(doc.id, e.target.value)}
                              className="w-full px-2.5 py-1 rounded-lg liquid-input text-xs text-slate-800 font-bold"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 block mb-0.5 font-bold">پۆلێن / جۆر:</label>
                            <select
                              value={doc.category}
                              onChange={(e) => handleEditUpdateDocCategory(doc.id, e.target.value as BeneficiaryDocCategory)}
                              className="w-full px-2.5 py-1 rounded-lg liquid-input text-xs text-slate-800 font-bold bg-white"
                            >
                              <option value="ناسنامە">ناسنامە</option>
                              <option value="کارتی نیشتمانی">کارتی نیشتمانی</option>
                              <option value="کۆبۆنی خۆراک">کۆبۆنی خۆراک</option>
                              <option value="ڕاپۆرتی پزیشکی">ڕاپۆرتی پزیشکی</option>
                              <option value="بەڵگەنامەی نیشتەجێبوون">بەڵگەنامەی نیشتەجێبوون</option>
                              <option value="وێنەی مەیدانی">وێنەی مەیدانی</option>
                              <option value="تر">تر</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200/90 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBeneficiary(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-colors shadow-xs"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  پاشەکەوتکردنی دەستکارییەکان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <button
              onClick={() => setPreviewDocument(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewDocument.title}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">{previewDocument.category}</span>
                  <span>{previewDocument.fileSize}</span>
                  <span>بەروار: {previewDocument.uploadDate}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-slate-100 p-2 flex items-center justify-center min-h-[300px]">
              {previewDocument.fileData && (previewDocument.fileData.startsWith('data:image') || previewDocument.fileType?.match(/(JPG|JPEG|PNG|WEBP|GIF)/i)) ? (
                <img
                  src={previewDocument.fileData}
                  alt={previewDocument.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : previewDocument.fileData && previewDocument.fileData.startsWith('data:application/pdf') ? (
                <iframe
                  src={previewDocument.fileData}
                  title={previewDocument.title}
                  className="w-full h-[60vh] rounded-xl border border-slate-200"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700 mb-1">{previewDocument.fileName}</p>
                  <p className="text-xs text-slate-500 mb-4">ئەم جۆرە فایلە پشتگیری لە پیشاندانی ڕاستەوخۆ ناکات، دەتوانیت دایبەزێنیت</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              {previewDocument.fileData && (
                <a
                  href={previewDocument.fileData}
                  download={previewDocument.fileName || `${previewDocument.title}.png`}
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>داگرتنی فایل</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
