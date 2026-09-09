import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Beneficiary, NeedCategory, BeneficiaryStatus, OtherProvider, BeneficiaryDocument, BeneficiaryDocCategory, BeneficiaryLocation } from '../types';
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
  ShieldAlert,
  Info,
  Edit3,
  FileText,
  Image as ImageIcon,
  Paperclip,
  FilePlus,
  ExternalLink,
  File,
  Check,
  UploadCloud,
  Navigation,
  Crosshair,
  Compass,
  RotateCcw,
  Database,
  ShieldCheck,
  Lock,
  RefreshCw,
  PauseCircle,
  Archive
} from 'lucide-react';

export const BeneficiariesView: React.FC = () => {
  const {
    beneficiaries,
    addBeneficiary,
    addBeneficiariesBulk,
    updateBeneficiary,
    deleteBeneficiary,
    checkDuplicate,
    addAidRecord,
    sendSMS,
    addBeneficiaryDocument,
    updateBeneficiaryDocument,
    deleteBeneficiaryDocument,
    setActiveTab,
    navigateToLocationOnMap,
    isCloudConnected,
    isCloudSyncing,
    syncLocalDataToCloud
  } = useApp();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');

  // Entry Mode inside modal: 'single' (one-by-one) | 'bulk' (excel)
  const [entryMode, setEntryMode] = useState<'single' | 'bulk'>('single');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
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
      alert('وێبگەڕەکەت پشتگیری وەرگرتنی پێگەی GPS ناکات.');
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
    amountIQD: 200000,
    itemName: 'سەبەتەی خۆراک',
    quantity: 1,
    projectTitle: 'دابەشکردنی خۆراکی مانگانە',
    notes: ''
  });

  // SMS Form State
  const [smsText, setSmsText] = useState(
    'سڵاو بەڕێز، تکایە ئاگاداربە هاوکارییە دیاریکراوەکەت لە بنکەی سەرەکی ڕێکخراوی بۆتان بامۆکی ئامادەیە بۆ وەرگرتن.'
  );

  // Filtering
  const filteredBeneficiaries = beneficiaries.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.fullName.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.nationalId.includes(q) ||
      b.address.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'aided') {
        matchesStatus = b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0);
      } else if (statusFilter === 'confidential') {
        matchesStatus = b.status === 'confidential' || b.isConfidential === true;
      } else {
        matchesStatus = b.status === statusFilter;
      }
    }

    const matchesCat = categoryFilter === 'all' || b.needCategory === categoryFilter;
    const matchesGov = governorateFilter === 'all' || b.governorate === governorateFilter;

    return matchesSearch && matchesStatus && matchesCat && matchesGov;
  });

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
        alert(res.message || 'هەڵەیەک ڕوویدا لە کاتی نوێکردنەوەی سوودمەند لە داتابەیسی سەرهێڵ.');
        return;
      }
      setIsEditModalOpen(false);
      setEditingBeneficiary(null);

      // If dossier view modal is open for this beneficiary, update it too
      if (selectedBeneficiary && selectedBeneficiary.id === updatedBen.id) {
        setSelectedBeneficiary(updatedBen);
      }
    } catch (err: any) {
      alert('هەڵەیەک ڕوویدا لە نوێکردنەوە: ' + (err?.message || 'تکایە دووبارە هەوڵ بدەوە'));
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
  };

  const handleViewDossierDocDelete = (docId: string) => {
    if (!selectedBeneficiary) return;
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم بەڵگەنامەیە لە دۆسیەکە؟')) return;
    deleteBeneficiaryDocument(selectedBeneficiary.id, docId);
    setSelectedBeneficiary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        documents: (prev.documents || []).filter(d => d.id !== docId)
      };
    });
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
      alert('هەڵەیەک ڕوویدا لە کاتی خوێندنەوەی فایلی ئێکسڵ: ' + (err?.message || 'فایلەکە نادروستە'));
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
        alert(result.message || 'هەڵەیەک ڕوویدا لە کاتی هاوردەکردنی بەکۆمەڵ.');
        return;
      }
      setBulkImportSuccess(
        `سەرکەوتوو بوو! ژمارەی (${result.added}) سوودمەند بە سەرکەوتوویی لە داتابەیسی سەرهێڵ زیادکران. ${
          result.skippedDuplicates > 0
            ? `(ژمارەی ${result.skippedDuplicates} دۆسیەی دووبارە ڕێگری لێکرا)`
            : ''
        }`
      );
      setParsedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert('هەڵەیەک ڕوویدا لە کاتی هاوردەکردن: ' + (err?.message || 'تکایە دووبارە هەوڵ بدەوە'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Give Aid Submit
  const handleGiveAidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiary) return;

    addAidRecord(selectedBeneficiary.id, {
      date: new Date().toISOString().split('T')[0],
      type: aidForm.type,
      amountIQD: aidForm.type === 'monetary' ? aidForm.amountIQD : undefined,
      itemName: aidForm.type === 'in-kind' ? aidForm.itemName : undefined,
      quantity: aidForm.type === 'in-kind' ? aidForm.quantity : undefined,
      projectTitle: aidForm.projectTitle,
      distributedBy: 'بەڕێوەبەری سیستەم',
      notes: aidForm.notes
    });

    setIsGiveAidModalOpen(false);
    const updated = beneficiaries.find(b => b.id === selectedBeneficiary.id);
    if (updated) setSelectedBeneficiary(updated);
  };

  // Handle Send SMS
  const handleSendSMS = () => {
    if (!selectedBeneficiary) return;
    sendSMS(selectedBeneficiary.phone, selectedBeneficiary.fullName, smsText);
    setIsSMSModalOpen(false);
  };

  const categoryLabels: Record<NeedCategory, string> = {
    poor: 'هەژار و دەستکورت',
    orphan: 'بێباوک و هەتیو',
    sick: 'نەخۆشی درێژخایەن',
    disabled: 'خاوەن پێداویستی تایبەت',
    displaced: 'ئاوارە و پەنابەر',
    student: 'خوێندکاری هەژار'
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
              alert(res.message);
            }}
            disabled={isCloudSyncing}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shrink-0 shadow-sm transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            <span>{isCloudSyncing ? 'پشکنین...' : 'دووبارە پشکنینەوەی پەیوەندی'}</span>
          </button>
        </div>
      )}

      {/* Filter and Search Pill Bar */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی ناو، مۆبایل، ژمارەی نیشتمانی..."
              className="w-full h-11 pr-10 pl-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 placeholder-slate-400 font-bold"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
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

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
          >
            <option value="all">هەموو حاڵەتەکان</option>
            <option value="poor">هەژار و دەستکورت</option>
            <option value="orphan">بێباوک و هەتیو</option>
            <option value="sick">نەخۆشی درێژخایەن</option>
            <option value="disabled">خاوەن پێداویستی تایبەت</option>
            <option value="student">خوێندکاری هەژار</option>
          </select>

          {/* Governorate Filter */}
          <select
            value={governorateFilter}
            onChange={(e) => setGovernorateFilter(e.target.value)}
            className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
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
      </div>

      {/* Beneficiaries Table */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">ناوی تەواو / تەمەن و ڕەگەز</th>
                <th className="py-3.5 px-4">ناسنامە / مۆبایل</th>
                <th className="py-3.5 px-4">پارێزگا / ناونیشان</th>
                <th className="py-3.5 px-4">پێگەی خێزان و بژێوی</th>
                <th className="py-3.5 px-4">حاڵەت / ئەندام</th>
                <th className="py-3.5 px-4">داهاتی مانگانە</th>
                <th className="py-3.5 px-4">دۆخی دۆسیە</th>
                <th className="py-3.5 px-4 text-center">کردارەکان</th>
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
              ) : filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    هیچ کەسێک نەدۆزرایەوە بەپێی ئەم فلتەرە
                  </td>
                </tr>
              ) : (
                filteredBeneficiaries.map(ben => (
                  <tr key={ben.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
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
                            <p className="font-bold text-slate-900 text-sm">{ben.fullName}</p>
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
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-cyan-700">{ben.nationalId}</p>
                      <p className="text-slate-600 text-[11px]">{ben.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold mb-1 border border-slate-200/60">
                        {ben.governorate}
                      </span>
                      <p className="text-[11px] text-slate-600 max-w-xs truncate">{ben.address}</p>
                      {ben.location && (
                        <div className="flex items-center gap-1.5 mt-1">
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
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4">
                      <span className="text-amber-800 font-bold block">{categoryLabels[ben.needCategory] || ben.needCategory}</span>
                      <span className="text-[11px] text-slate-500">{ben.familyMembers} ئەندامی خێزان</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {ben.monthlyIncomeIQD === 0 ? (
                        <span className="text-rose-600 font-bold">بێ داهات</span>
                      ) : (
                        `${ben.monthlyIncomeIQD.toLocaleString()} د.ع`
                      )}
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
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
                            if (confirm(`دڵنیایت لە سڕینەوەی دۆسیەی (${ben.fullName}) لە داتابەیسی سەرهێڵ؟`)) {
                              const res = await deleteBeneficiary(ben.id);
                              if (res && !res.success) {
                                alert(res.message || 'هەڵەیەک ڕوویدا لە کاتی سڕینەوەی سوودمەند لە سێرڤەر.');
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Dual Registration Modal (Single vs Bulk Excel) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl mb-6 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setEntryMode('single')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  entryMode === 'single'
                    ? 'bg-white text-cyan-800 shadow-sm border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>تۆمارکردنی تاکەکەسی (یەک بە یەک)</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('bulk')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  entryMode === 'bulk'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>هاوردەکردنی بەکۆمەڵ (ئێکسڵ)</span>
              </button>
            </div>

            {/* -------------------- MODE 1: SINGLE ONE-BY-ONE ENTRY -------------------- */}
            {entryMode === 'single' && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-600" />
                  تۆمارکردنی کەس یان خێزانی نوێ
                </h3>

                {duplicateAlert && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs mb-4 flex items-start gap-2.5 animate-bounce">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="font-bold">هۆشداریی دووبارەبوونەوە!</p>
                      <p className="mt-0.5">{duplicateAlert}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitBeneficiary} className="space-y-4 text-xs">
                  
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
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
                  <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-3.5">
                    
                    {/* Head of family question */}
                    <div>
                      <label className="block text-slate-800 font-bold mb-1.5">
                        ئایا ئەم کەسە سەرۆکی خێزانە؟
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="isFamilyHead"
                            checked={formData.isFamilyHead === true}
                            onChange={() => setFormData({ ...formData, isFamilyHead: true })}
                            className="text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>بەڵێ (سەرۆکی خێزانە)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="isFamilyHead"
                            checked={formData.isFamilyHead === false}
                            onChange={() => setFormData({ ...formData, isFamilyHead: false })}
                            className="text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>نەخێر</span>
                        </label>
                      </div>
                    </div>

                    {/* Is Provider question */}
                    <div className="pt-2 border-t border-cyan-100">
                      <label className="block text-slate-800 font-bold mb-1.5">
                        ئایا بژێوی خێزانەکە دابین دەکات؟
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="isProvider"
                            checked={formData.isProvider === true}
                            onChange={() => setFormData({ ...formData, isProvider: true })}
                            className="text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>بەڵێ (بژێوی دابین دەکات)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                          <input
                            type="radio"
                            name="isProvider"
                            checked={formData.isProvider === false}
                            onChange={() => setFormData({ ...formData, isProvider: false })}
                            className="text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>نەخێر (کەسی تر دابینی دەکات)</span>
                        </label>
                      </div>
                    </div>

                    {/* Sub-scenario A: If NOT provider -> Ask who is provider */}
                    {!formData.isProvider && (
                      <div className="p-3 bg-white rounded-xl border border-amber-200 animate-in fade-in">
                        <label className="block text-amber-900 font-bold mb-1">
                          کێ بژێوی خێزانەکە دابین دەکات؟ (ناوی دابینکەر / پەیوەندی):
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.providerName}
                          onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                          placeholder="نموونە: باوک، کوڕی گەورە، خێرخوازان..."
                          className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                        />
                      </div>
                    )}

                    {/* Sub-scenario B: If IS provider -> Ask if ONLY provider or others exist */}
                    {formData.isProvider && (
                      <div className="p-3.5 bg-white rounded-xl border border-cyan-200 space-y-3 animate-in fade-in">
                        <label className="block text-slate-800 font-bold">
                          ئایا تەنها خۆیەتی بژێوی دابین دەکات یان کەسی تریش هەیە لە هەمان خێزاندا؟
                        </label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                            <input
                              type="radio"
                              name="isOnlyProvider"
                              checked={formData.isOnlyProvider === true}
                              onChange={() => setFormData({ ...formData, isOnlyProvider: true })}
                              className="text-cyan-600"
                            />
                            <span>بەڵێ، تەنها خۆیەتی دابینکەر</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700">
                            <input
                              type="radio"
                              name="isOnlyProvider"
                              checked={formData.isOnlyProvider === false}
                              onChange={() => setFormData({ ...formData, isOnlyProvider: false })}
                              className="text-cyan-600"
                            />
                            <span>نەخێر، دابینکەری تریش هەیە لە خێزانەکەدا</span>
                          </label>
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
                                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800">{prov.name}</span>
                                      <span className="text-slate-500">({prov.relation})</span>
                                      {prov.monthlyIncomeIQD ? (
                                        <span className="text-emerald-700 font-bold">
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
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
                                  className="w-full px-2.5 py-1.5 rounded-lg liquid-input text-slate-900 bg-white"
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
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold flex items-center gap-1.5 text-xs">
                        <MapPin className="w-4 h-4 text-cyan-600" />
                        دیاریکردنی وردی سەربان و پێگەی ماڵ لەسەر نەخشە (GPS):
                      </label>
                      {formData.location ? (
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-all shadow-sm"
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
                        value={formData.familyMembers}
                        onChange={(e) => setFormData({ ...formData, familyMembers: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">داهاتی مانگانە (دینار):</label>
                      <input
                        type="number"
                        value={formData.monthlyIncomeIQD}
                        onChange={(e) => setFormData({ ...formData, monthlyIncomeIQD: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
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
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        پاراستنی تایبەتمەندی
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      * بە شێوەی خۆکار لەسەر (لەژێر لێکۆڵینەوە) دانراوە. تەنانەت ئەگەر هاوکاریش وەربگرێت، دۆخی لێکۆڵینەوەکەی پارێزراو دەبێت.
                    </p>
                  </div>

                  {/* Attached Documents Upload (Optional) */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-800 font-bold flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-cyan-600" />
                        بەڵگەنامە و دۆکیۆمێنتەکان (ئارەزوومەندانە):
                      </label>
                      <span className="text-[10px] text-slate-500">
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
                        <span className="text-[10px] text-slate-400 mt-0.5">
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
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
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

                  {/* Offline warning inside modal */}
                  {!isCloudConnected && (
                    <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>داتابەیسی سەرهێڵ ناپەیوەستە. داخڵکردن تەنها لە کاتی بوونی پەیوەندی بە Supabase کاردەکات.</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      پاشگەزبوونەوە
                    </button>
                    <button
                      type="submit"
                      disabled={!isCloudConnected || isSubmitting}
                      className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all ${
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

                </form>
              </div>
            )}

            {/* -------------------- MODE 2: BULK EXCEL ENTRY -------------------- */}
            {entryMode === 'bulk' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
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
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">هەنگاوی ۱: داگرتنی تێمپلەیتی خاوێنی ئێکسڵ</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تێمپلەیتەکە بە زمانی کوردی ئامادەکراوە و خانە و نموونەی سەرەکی تێدایە
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadBeneficiaryExcelTemplate}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-bold shadow-sm transition-all shrink-0"
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
                      <span className="text-slate-500">
                        کۆی گشتی: {parsedData.valid.length + parsedData.errors.length}
                      </span>
                    </div>

                    {/* Preview Table */}
                    {parsedData.valid.length > 0 && (
                      <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200">
                        <table className="w-full text-right text-[11px]">
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
                                <td className="p-2">{row.monthlyIncomeIQD.toLocaleString()} د.ع</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {parsedData.valid.length > 15 && (
                          <div className="p-2 text-center text-slate-400 text-[10px] bg-slate-50">
                            پیشاندانی یەکەم ۱۵ خێزان لە کۆی {parsedData.valid.length} خێزان...
                          </div>
                        )}
                      </div>
                    )}

                    {/* Submit Bulk Import Button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setParsedData(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        پاشگەزبوونەوە
                      </button>
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
                    </div>

                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* Beneficiary Details Modal & Aid History Drawer */}
      {selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedBeneficiary(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 pb-5 gap-3">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">{selectedBeneficiary.fullName}</h3>
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

                  {/* Confidential Tag if isConfidential */}
                  {selectedBeneficiary.isConfidential && selectedBeneficiary.status !== 'confidential' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-purple-600" /> دۆسیەی نهێنی
                    </span>
                  )}

                  {/* Secondary Aid Badge if received aid */}
                  {selectedBeneficiary.status !== 'aided' && selectedBeneficiary.aidHistory && selectedBeneficiary.aidHistory.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 shadow-xs">
                      <Gift className="w-3 h-3 text-cyan-600" /> هاوکاریکراو ({selectedBeneficiary.aidHistory.length} جار)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> {selectedBeneficiary.address} ({selectedBeneficiary.governorate})
                </p>
              </div>

              {/* Edit Beneficiary Button */}
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedBeneficiary)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-all shadow-sm shrink-0"
              >
                <Edit3 className="w-4 h-4 text-amber-700" />
                <span>دەستکاریکردنی دۆسیە و بەڵگەنامەکان</span>
              </button>
            </div>

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

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
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
                <span className="text-[10px] text-slate-500 block">داهاتی مانگانە:</span>
                <span className="font-bold text-xs text-emerald-700">{selectedBeneficiary.monthlyIncomeIQD.toLocaleString()} د.ع</span>
              </div>
            </div>

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
                        <span className="text-[10px] text-slate-500">بەروار: {aid.date}</span>
                      </div>
                      <div className="text-left font-bold">
                        {aid.type === 'monetary' ? (
                          <span className="text-emerald-700">{aid.amountIQD?.toLocaleString()} د.ع</span>
                        ) : (
                          <span className="text-cyan-700">
                            {aid.quantity} {aid.itemName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SMS Trigger */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsSMSModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
              >
                <MessageSquare className="w-4 h-4" />
                ناردنی کورتەنامە (SMS) بۆ خێزان
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
                    نەختینەیی (دینار)
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
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بڕی پارە (دینار):</label>
                  <input
                    type="number"
                    value={aidForm.amountIQD}
                    onChange={(e) => setAidForm({ ...aidForm, amountIQD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingBeneficiary(null);
              }}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  دەستکاریکردنی دۆسیە و بەڵگەنامەکانی سوودمەند
                </h3>
                <span className="text-xs text-slate-500">
                  دۆسیەی: <strong className="text-slate-800">{editingBeneficiary.fullName}</strong> ({editingBeneficiary.nationalId})
                </span>
              </div>
            </div>

            {editDuplicateAlert && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editDuplicateAlert}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditBeneficiary} className="space-y-4 text-xs">

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
                                    <span className="text-slate-500 mr-2">({op.relation})</span>
                                    {op.monthlyIncomeIQD ? (
                                      <span className="text-emerald-700 font-bold mr-2">
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
                              <span className="text-[10px] text-slate-400 mr-2">({doc.fileSize} • {doc.uploadDate})</span>
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

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingBeneficiary(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
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
