import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { DocumentItem, DocumentCategory } from '../types';
import {
  Files,
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  UploadCloud,
  Download,
  Eye,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  Users,
  FolderKanban,
  HeartHandshake,
  Building2,
  Calendar,
  HardDrive,
  CopyPlus,
  CheckCheck,
  Sparkles,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';

const CATEGORY_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'هەموو جۆرەکان' },
  { id: 'ناسنامە', label: 'ناسنامە' },
  { id: 'کارتی نیشتمانی', label: 'کارتی نیشتمانی' },
  { id: 'ڕاپۆرتی پزیشکی', label: 'ڕاپۆرتی پزیشکی' },
  { id: 'پسوولەی دارایی', label: 'پسوولەی دارایی' },
  { id: 'وێنەی مەیدانی', label: 'وێنەی مەیدانی' },
  { id: 'کۆبۆنی خۆراک', label: 'کۆبۆنی خۆراک' },
  { id: 'بەڵگەنامەی نیشتەجێبوون', label: 'نیشتەجێبوون' },
  { id: 'گرێبەست', label: 'گرێبەست' },
  { id: 'پشتگیری فەرمی', label: 'پشتگیری فەرمی' },
  { id: 'پڕۆژە', label: 'پڕۆژە' },
  { id: 'تر', label: 'پۆلەکانی تر' }
];

const ALL_CATEGORIES: DocumentCategory[] = [
  'ناسنامە',
  'کارتی نیشتمانی',
  'ڕاپۆرتی پزیشکی',
  'پسوولەی دارایی',
  'وێنەی مەیدانی',
  'کۆبۆنی خۆراک',
  'بەڵگەنامەی نیشتەجێبوون',
  'گرێبەست',
  'پشتگیری فەرمی',
  'پڕۆژە',
  'تر'
];

interface BulkDocItem {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  fileData: string;
  title: string;
  category: DocumentCategory;
  entityType: 'beneficiary' | 'project' | 'donor' | 'general';
  beneficiaryId: string;
  projectId?: string;
  donorId?: string;
  relatedEntity: string;
}

export const DocumentsView: React.FC = () => {
  const {
    documents,
    addDocument,
    addDocumentsBulk,
    deleteDocument,
    beneficiaries,
    projects,
    donors,
    openBeneficiaryProfile
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState<'all' | 'beneficiary' | 'project' | 'donor' | 'general'>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');

  // Single Upload Form State
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalBenSearch, setModalBenSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'ناسنامە' as DocumentCategory,
    fileType: 'PDF',
    fileSize: '1.2 MB',
    relatedEntity: '',
    entityType: 'beneficiary' as 'beneficiary' | 'project' | 'donor' | 'general',
    beneficiaryId: beneficiaries[0]?.id || '',
    projectId: projects[0]?.id || '',
    donorId: donors[0]?.id || '',
    fileName: '',
    fileData: ''
  });

  // Bulk Upload State
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const [bulkItems, setBulkItems] = useState<BulkDocItem[]>([]);
  const [isReadingBulkFiles, setIsReadingBulkFiles] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [bulkGlobalBeneficiaryId, setBulkGlobalBeneficiaryId] = useState<string>('');
  const [bulkGlobalCategory, setBulkGlobalCategory] = useState<DocumentCategory | ''>('');

  // Calculate counts per entity
  const countsByEntity = useMemo(() => {
    let beneficiaryCount = 0;
    let projectCount = 0;
    let donorCount = 0;
    let generalCount = 0;

    documents.forEach(d => {
      const type = d.entityType || (d.beneficiaryId ? 'beneficiary' : 'general');
      if (type === 'beneficiary') beneficiaryCount++;
      else if (type === 'project') projectCount++;
      else if (type === 'donor') donorCount++;
      else generalCount++;
    });

    return {
      all: documents.length,
      beneficiary: beneficiaryCount,
      project: projectCount,
      donor: donorCount,
      general: generalCount
    };
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const q = searchQuery.toLowerCase().trim();
      const docType = doc.entityType || (doc.beneficiaryId ? 'beneficiary' : 'general');

      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.relatedEntity.toLowerCase().includes(q) ||
        (doc.category && doc.category.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q));

      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      const matchesEntity = entityFilter === 'all' || docType === entityFilter;

      return matchesSearch && matchesCategory && matchesEntity;
    });
  }, [documents, searchQuery, categoryFilter, entityFilter]);

  // Handle single file upload
  const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setFormData(prev => ({
          ...prev,
          title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
          fileName: file.name,
          fileSize: sizeStr,
          fileType: ext,
          fileData: dataUrl
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit single file
  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('تکایە ناونیشانی بەڵگەنامە بنووسە');
      return;
    }

    let relatedName = formData.relatedEntity;
    let bId = formData.beneficiaryId;
    let pId = formData.projectId;
    let dId = formData.donorId;

    if (formData.entityType === 'beneficiary') {
      const ben = beneficiaries.find(b => b.id === bId);
      if (ben) {
        relatedName = ben.fullName;
      } else if (!bId && beneficiaries.length > 0) {
        bId = beneficiaries[0].id;
        relatedName = beneficiaries[0].fullName;
      }
    } else if (formData.entityType === 'project') {
      const proj = projects.find(p => p.id === pId);
      if (proj) {
        relatedName = proj.title;
      } else if (!pId && projects.length > 0) {
        pId = projects[0].id;
        relatedName = projects[0].title;
      }
    } else if (formData.entityType === 'donor') {
      const don = donors.find(d => d.id === dId);
      if (don) {
        relatedName = don.fullName;
      } else if (!dId && donors.length > 0) {
        dId = donors[0].id;
        relatedName = donors[0].fullName;
      }
    } else {
      relatedName = relatedName || 'ئەرشیفی کارگێڕی گشتی';
    }

    addDocument({
      title: formData.title,
      category: formData.category,
      fileType: formData.fileType || 'بەڵگەنامە',
      fileSize: formData.fileSize || '1 MB',
      relatedEntity: relatedName,
      entityType: formData.entityType,
      entityId: bId || pId || dId,
      beneficiaryId: bId,
      projectId: pId,
      donorId: dId,
      fileName: formData.fileName,
      fileData: formData.fileData,
      url: formData.fileData
    });

    setIsAddModalOpen(false);
    setSelectedFileName(null);
    setFormData({
      title: '',
      category: 'ناسنامە',
      fileType: 'PDF',
      fileSize: '1.2 MB',
      relatedEntity: '',
      entityType: 'beneficiary',
      beneficiaryId: beneficiaries[0]?.id || '',
      projectId: projects[0]?.id || '',
      donorId: donors[0]?.id || '',
      fileName: '',
      fileData: ''
    });
  };

  // Handle Multi-file Select (Bulk Upload)
  const handleBulkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingBulkFiles(true);
    const newItems: BulkDocItem[] = [];

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

        // Smart Category Detection
        let inferredCategory: DocumentCategory = (bulkGlobalCategory as DocumentCategory) || 'ناسنامە';
        const lowerName = file.name.toLowerCase();
        if (lowerName.includes('kart') || lowerName.includes('nishtimani') || lowerName.includes('نیشتمانی')) {
          inferredCategory = 'کارتی نیشتمانی';
        } else if (lowerName.includes('pizishki') || lowerName.includes('medical') || lowerName.includes('پزیشکی')) {
          inferredCategory = 'ڕاپۆرتی پزیشکی';
        } else if (lowerName.includes('food') || lowerName.includes('kapon') || lowerName.includes('کۆبۆن')) {
          inferredCategory = 'کۆبۆنی خۆراک';
        } else if (lowerName.includes('wena') || lowerName.includes('photo') || lowerName.includes('وێنە')) {
          inferredCategory = 'وێنەی مەیدانی';
        } else if (lowerName.includes('receipt') || lowerName.includes('psula') || lowerName.includes('پسوولە')) {
          inferredCategory = 'پسوولەی دارایی';
        } else if (lowerName.includes('contract') || lowerName.includes('grebast') || lowerName.includes('گرێبەست')) {
          inferredCategory = 'گرێبەست';
        } else if (lowerName.includes('address') || lowerName.includes('nishtaje') || lowerName.includes('نیشتەجێبوون')) {
          inferredCategory = 'بەڵگەنامەی نیشتەجێبوون';
        }

        // Smart Beneficiary Detection: match nationalId, phone, or name from filename
        let matchedBenId = bulkGlobalBeneficiaryId || (beneficiaries[0]?.id || '');
        let matchedBenName = beneficiaries.find(b => b.id === matchedBenId)?.fullName || 'سوودمەند';

        if (!bulkGlobalBeneficiaryId) {
          const foundBen = beneficiaries.find(b =>
            (b.nationalId && lowerName.includes(b.nationalId.toLowerCase())) ||
            (b.phone && lowerName.includes(b.phone.replace(/[^0-9]/g, ''))) ||
            (b.fullName && lowerName.includes(b.fullName.toLowerCase()))
          );
          if (foundBen) {
            matchedBenId = foundBen.id;
            matchedBenName = foundBen.fullName;
          }
        }

        newItems.push({
          id: `bulk-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          fileName: file.name,
          fileSize: sizeStr,
          fileType: ext,
          fileData: dataUrl,
          title: baseName,
          category: inferredCategory,
          entityType: 'beneficiary',
          beneficiaryId: matchedBenId,
          relatedEntity: matchedBenName
        });
      } catch (err) {
        console.error('Error reading bulk file:', err);
      }
    }

    setBulkItems(prev => [...prev, ...newItems]);
    setIsReadingBulkFiles(false);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
  };

  // Update a single bulk item in table
  const updateBulkItem = (id: string, updates: Partial<BulkDocItem>) => {
    setBulkItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          let newRelated = item.relatedEntity;
          if (updates.beneficiaryId) {
            const ben = beneficiaries.find(b => b.id === updates.beneficiaryId);
            if (ben) newRelated = ben.fullName;
          } else if (updates.projectId) {
            const proj = projects.find(p => p.id === updates.projectId);
            if (proj) newRelated = proj.title;
          } else if (updates.donorId) {
            const don = donors.find(d => d.id === updates.donorId);
            if (don) newRelated = don.fullName;
          }
          return { ...item, ...updates, relatedEntity: newRelated };
        }
        return item;
      })
    );
  };

  // Remove one item from bulk list
  const removeBulkItem = (id: string) => {
    setBulkItems(prev => prev.filter(item => item.id !== id));
  };

  // Apply one beneficiary to ALL bulk items
  const applyBeneficiaryToAllBulk = (benId: string) => {
    if (!benId) return;
    const ben = beneficiaries.find(b => b.id === benId);
    if (!ben) return;
    setBulkItems(prev =>
      prev.map(item => ({
        ...item,
        entityType: 'beneficiary',
        beneficiaryId: benId,
        relatedEntity: ben.fullName
      }))
    );
  };

  // Apply category to ALL bulk items
  const applyCategoryToAllBulk = (cat: DocumentCategory) => {
    if (!cat) return;
    setBulkItems(prev =>
      prev.map(item => ({
        ...item,
        category: cat
      }))
    );
  };

  // Submit all bulk documents
  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      alert('تکایە سەرەتا چەند فایلێک دیاری بکە بۆ بارکردن');
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const docsToUpload = bulkItems.map(item => ({
        title: item.title.trim() || item.fileName.replace(/\.[^/.]+$/, ''),
        category: item.category,
        fileType: item.fileType,
        fileSize: item.fileSize,
        relatedEntity: item.relatedEntity || 'سوودمەند',
        entityType: item.entityType,
        entityId: item.beneficiaryId || item.projectId || item.donorId,
        beneficiaryId: item.beneficiaryId,
        projectId: item.projectId,
        donorId: item.donorId,
        fileName: item.fileName,
        fileData: item.fileData,
        url: item.fileData
      }));

      const res = await addDocumentsBulk(docsToUpload);
      if (res.success) {
        setIsAddModalOpen(false);
        setBulkItems([]);
        alert(`سەرکەوتوو بوو: ${res.count} بەڵگەنامە بە سەرکەوتوویی بارکران و بەسترانەوە بە دۆسیەی سوودمەندان.`);
      }
    } catch (err: any) {
      alert('هەڵەیەک ڕوویدا لە کاتی بارکردنی بەکۆمەڵ: ' + (err?.message || 'تکایە دووبارە هەوڵ بدەوە'));
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    if (doc.fileData || doc.url) {
      const a = document.createElement('a');
      a.href = doc.fileData || doc.url!;
      a.download = doc.fileName || `${doc.title}.${doc.fileType?.toLowerCase() || 'png'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      const blob = new Blob(
        [
          `بەڵگەنامەی فەرمی ڕێکخراوی بۆتان بامۆکی\n` +
          `ناونیشان: ${doc.title}\n` +
          `پۆلێن: ${doc.category}\n` +
          `پەیوەستە بە: ${doc.relatedEntity}\n` +
          `بەروار: ${doc.uploadDate}\n` +
          `قەبارە: ${doc.fileSize}`
        ],
        { type: 'text/plain;charset=utf-8' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getFileIcon = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('PDF')) return <FileText className="w-6 h-6 text-rose-600" />;
    if (t.includes('JPG') || t.includes('JPEG') || t.includes('PNG') || t.includes('IMAGE') || t.includes('WEBP')) {
      return <ImageIcon className="w-6 h-6 text-cyan-600" />;
    }
    if (t.includes('XLS') || t.includes('SHEET') || t.includes('CSV')) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-600" />;
    }
    return <Files className="w-6 h-6 text-teal-600" />;
  };

  const isImageFile = (doc: DocumentItem | BulkDocItem) => {
    const t = (doc.fileType || '').toUpperCase();
    const data = doc.fileData || (doc as any).url || '';
    return (
      data.startsWith('data:image/') ||
      t.includes('JPG') ||
      t.includes('JPEG') ||
      t.includes('PNG') ||
      t.includes('WEBP') ||
      t.includes('GIF')
    );
  };

  const isPdfFile = (doc: DocumentItem | BulkDocItem) => {
    const t = (doc.fileType || '').toUpperCase();
    const data = doc.fileData || (doc as any).url || '';
    return data.startsWith('data:application/pdf') || t.includes('PDF');
  };

  // Filtered beneficiaries inside modal
  const modalFilteredBeneficiaries = useMemo(() => {
    if (!modalBenSearch.trim()) return beneficiaries.slice(0, 50);
    const q = modalBenSearch.toLowerCase();
    return beneficiaries
      .filter(b => b.fullName.toLowerCase().includes(q) || b.phone.includes(q) || (b.nationalId && b.nationalId.includes(q)))
      .slice(0, 50);
  }, [beneficiaries, modalBenSearch]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Files className="w-6 h-6 text-teal-600" />
            بەڕێوەبردنی بەڵگەنامە و ئەرشیفی یەکگرتوو
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            پەیوەستکردنی دوولایەنەی دۆسیەی سوودمەندان، پڕۆژەکان، و بەڵگەنامە فەرمییەکانی ڕێکخراو بە شێوازی سەرهێڵ
          </p>
        </div>

        {/* Action Buttons: Single & Bulk */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setUploadMode('bulk');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            title="بارکردنی چەندین بەڵگەنامە پێکەوە و دیاریکردنی سوودمەندەکان"
          >
            <CopyPlus className="w-4 h-4" />
            بارکردنی بەکۆمەڵ (فایلەکان پێکەوە)
          </button>

          <button
            onClick={() => {
              setUploadMode('single');
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            بارکردنی یەک بەڵگەنامە
          </button>
        </div>
      </div>

      {/* Primary Dimension: Section / Archive Source Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setEntityFilter('all')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
            entityFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-black">سەرجەم بەشەکان</span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${
            entityFilter === 'all' ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-600'
          }`}>
            {countsByEntity.all}
          </span>
        </button>

        <button
          onClick={() => setEntityFilter('beneficiary')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
            entityFilter === 'beneficiary'
              ? 'bg-cyan-600 text-white border-cyan-600 shadow-md'
              : 'bg-white hover:bg-cyan-50/50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-500" />
            <span className="text-xs font-black">دۆسیەی سوودمەندان</span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${
            entityFilter === 'beneficiary' ? 'bg-cyan-700 text-white' : 'bg-cyan-50 text-cyan-700'
          }`}>
            {countsByEntity.beneficiary}
          </span>
        </button>

        <button
          onClick={() => setEntityFilter('project')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
            entityFilter === 'project'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white hover:bg-emerald-50/50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black">پڕۆژەکان</span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${
            entityFilter === 'project' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {countsByEntity.project}
          </span>
        </button>

        <button
          onClick={() => setEntityFilter('donor')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
            entityFilter === 'donor'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md'
              : 'bg-white hover:bg-amber-50/50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black">بەخشەران</span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${
            entityFilter === 'donor' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-700'
          }`}>
            {countsByEntity.donor}
          </span>
        </button>

        <button
          onClick={() => setEntityFilter('general')}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-right ${
            entityFilter === 'general'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white hover:bg-indigo-50/50 text-slate-700 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-black">ئەرشیفی کارگێڕی</span>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg ${
            entityFilter === 'general' ? 'bg-indigo-700 text-white' : 'bg-indigo-50 text-indigo-700'
          }`}>
            {countsByEntity.general}
          </span>
        </button>
      </div>

      {/* Secondary Dimension: Category Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-white border border-slate-200 w-full sm:w-auto overflow-x-auto shadow-sm gap-1 scrollbar-thin">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === tab.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناونیشانی فایل یان ناوی کەس..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-sm"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="rounded-3xl bg-white p-16 border border-slate-200 text-center shadow-sm">
          <Files className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">هیچ بەڵگەنامەیەک لە سیستەمدا تۆمار نەکراوە</p>
          <p className="text-xs text-slate-400 mt-1">
            هەر بەڵگەنامەیەک لە دۆسیەی سوودمەندان باربکرێت یان لێرەوە زیاد بکرێت، بە یەکگرتوویی دەردەکەوێت.
          </p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 border border-slate-200 text-center shadow-sm">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">هیچ بەڵگەنامەیەک بەپێی ئەم فلتەرە نەدۆزرایەوە</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setEntityFilter('all');
            }}
            className="mt-3 px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200"
          >
            خاوێنکردنەوەی فلتەرەکان
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocs.map(doc => {
            const docType = doc.entityType || (doc.beneficiaryId ? 'beneficiary' : 'general');
            const hasBenId = doc.beneficiaryId || (docType === 'beneficiary' && doc.entityId);

            return (
              <div
                key={doc.id}
                className="rounded-3xl bg-white p-4 sm:p-5 border border-slate-200 hover:border-teal-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Bar with Icon & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {doc.category}
                      </span>
                      {docType === 'beneficiary' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                          <Users className="w-3 h-3 text-cyan-600" />
                          دۆسیەی سوودمەند
                        </span>
                      )}
                      {docType === 'project' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3 text-emerald-600" />
                          پڕۆژە
                        </span>
                      )}
                      {docType === 'donor' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <HeartHandshake className="w-3 h-3 text-amber-600" />
                          بەخشەر
                        </span>
                      )}
                      {docType === 'general' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-indigo-600" />
                          گشتی
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 mb-2 min-h-[34px]" title={doc.title}>
                    {doc.title}
                  </h3>

                  {/* Thumbnail Preview if Image */}
                  {isImageFile(doc) && (doc.fileData || doc.url) && (
                    <div
                      onClick={() => setSelectedDoc(doc)}
                      className="mb-3 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer relative group/img"
                    >
                      <img
                        src={doc.fileData || doc.url}
                        alt={doc.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <Eye className="w-4 h-4" />
                        بینینی وێنە
                      </div>
                    </div>
                  )}

                  {/* Meta Details */}
                  <div className="space-y-1.5 text-[11px] text-slate-600 py-2 border-t border-slate-100">
                    <p className="truncate">
                      پەیوەستە بە: <span className="text-teal-700 font-bold">{doc.relatedEntity}</span>
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        {doc.fileSize}
                      </span>
                      <span className="font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {doc.uploadDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Action: Jump to Beneficiary Dossier */}
                {hasBenId && (
                  <button
                    onClick={() => openBeneficiaryProfile(doc.beneficiaryId || (doc.entityId as string))}
                    className="w-full my-2 py-1.5 px-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200/80 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-700" />
                    چوون بۆ دۆسیەی سوودمەند
                  </button>
                )}

                {/* Action Buttons */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-teal-600" />
                    بینین
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                    title="داگرتنی فایل"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`دڵنیایت لە سڕینەوەی بەڵگەنامەی [${doc.title}]؟ ئەم بەڵگەنامەیە لە هەموو بەشەکانی پەیوەندیدار دەسڕێتەوە.`)) {
                        deleteDocument(doc.id);
                      }
                    }}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                    title="سڕینەوەی بەڵگەنامە"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl max-h-[90vh] flex flex-col justify-between">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4 pr-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                {getFileIcon(selectedDoc.fileType)}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate" title={selectedDoc.title}>
                  {selectedDoc.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                    {selectedDoc.category}
                  </span>
                  <span>• پەیوەستە بە: <strong className="text-slate-800">{selectedDoc.relatedEntity}</strong></span>
                </div>
              </div>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
              {isImageFile(selectedDoc) && (selectedDoc.fileData || selectedDoc.url) ? (
                <div className="text-center">
                  <img
                    src={selectedDoc.fileData || selectedDoc.url}
                    alt={selectedDoc.title}
                    className="max-h-[55vh] mx-auto rounded-xl object-contain border border-slate-200 shadow-sm"
                  />
                </div>
              ) : isPdfFile(selectedDoc) && (selectedDoc.fileData || selectedDoc.url) ? (
                <div className="h-[55vh] w-full">
                  <iframe
                    src={selectedDoc.fileData || selectedDoc.url}
                    title={selectedDoc.title}
                    className="w-full h-full rounded-xl border border-slate-200 shadow-sm"
                  />
                </div>
              ) : (
                <div className="p-8 text-center space-y-3">
                  <FileText className="w-14 h-14 text-teal-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">{selectedDoc.title}</p>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    ئەم فایلە بە فۆرماتی {selectedDoc.fileType} پارێزراوە لە داتابەیسی ڕێکخراو. دەتوانیت ڕاستەوخۆ دایبگریت بۆ بینینی تەواوی ناوەڕۆکەکەی.
                  </p>
                  <div className="inline-block font-mono text-xs px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm">
                    قەبارە: {selectedDoc.fileSize} • بەرواری تۆمارکردن: {selectedDoc.uploadDate}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
              <div className="flex items-center gap-2">
                {(selectedDoc.beneficiaryId || (selectedDoc.entityType === 'beneficiary' && selectedDoc.entityId)) && (
                  <button
                    onClick={() => {
                      const bId = selectedDoc.beneficiaryId || (selectedDoc.entityId as string);
                      setSelectedDoc(null);
                      openBeneficiaryProfile(bId);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    چوون بۆ دۆسیەی تەواوی ئەم سوودمەندە
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  داخستن
                </button>
                <button
                  onClick={() => handleDownload(selectedDoc)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  داگرتنی بەڵگەنامە
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Upload Modal (Single & Bulk Modes) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`relative rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-2xl max-h-[92vh] flex flex-col justify-between transition-all duration-200 ${
              uploadMode === 'bulk' ? 'w-full max-w-4xl' : 'w-full max-w-lg'
            }`}
          >
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title & Upload Mode Switcher */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UploadCloud className="w-5 h-5 text-teal-600" />
                <h3 className="text-lg font-bold text-slate-900">بارکردنی بەڵگەنامەی نوێ بۆ ئەرشیف</h3>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 mb-4 max-w-md">
                <button
                  type="button"
                  onClick={() => setUploadMode('single')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadMode === 'single'
                      ? 'bg-white text-teal-800 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  یەک بەڵگەنامە (Single)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('bulk')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                    uploadMode === 'bulk'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CopyPlus className="w-4 h-4" />
                  بارکردنی بەکۆمەڵ (Bulk)
                  {bulkItems.length > 0 && (
                    <span className="bg-white text-cyan-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {bulkItems.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* MODE 1: SINGLE UPLOAD */}
            {uploadMode === 'single' ? (
              <form onSubmit={handleSingleSubmit} className="space-y-4 text-xs overflow-y-auto max-h-[68vh] pr-1">
                {/* Section Target Choice */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">ئەم بەڵگەنامەیە پەیوەستە بە کام بەش:</label>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, entityType: 'beneficiary' }))}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
                        formData.entityType === 'beneficiary'
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      سوودمەند
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, entityType: 'project' }))}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
                        formData.entityType === 'project'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      پڕۆژە
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, entityType: 'donor' }))}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
                        formData.entityType === 'donor'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      بەخشەر
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, entityType: 'general' }))}
                      className={`py-2 px-2 rounded-xl border text-center font-bold text-[11px] transition-all ${
                        formData.entityType === 'general'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      گشتی
                    </button>
                  </div>
                </div>

                {/* Target Dropdowns */}
                {formData.entityType === 'beneficiary' && (
                  <div className="p-3 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-2">
                    <label className="block text-cyan-900 font-bold">دیاریکردنی سوودمەند:</label>
                    <input
                      type="text"
                      value={modalBenSearch}
                      onChange={(e) => setModalBenSearch(e.target.value)}
                      placeholder="گەڕان بەپێی ناو یان ژمارە مۆبایل..."
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-cyan-200 text-slate-900 text-xs focus:outline-none"
                    />
                    <select
                      value={formData.beneficiaryId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const ben = beneficiaries.find(b => b.id === selectedId);
                        setFormData(prev => ({
                          ...prev,
                          beneficiaryId: selectedId,
                          relatedEntity: ben?.fullName || ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-cyan-200 text-slate-900 text-xs font-bold"
                    >
                      {modalFilteredBeneficiaries.map(ben => (
                        <option key={ben.id} value={ben.id}>
                          {ben.fullName} - {ben.phone} ({ben.governorate})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-cyan-700">
                      ئەم بەڵگەنامەیە ڕاستەوخۆ دەچێتە ناو دۆسیەی ئەم سوودمەندەوە لە بەشی سوودمەندان.
                    </p>
                  </div>
                )}

                {formData.entityType === 'project' && (
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <label className="block text-emerald-900 font-bold">دیاریکردنی پڕۆژە:</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => {
                        const pId = e.target.value;
                        const proj = projects.find(p => p.id === pId);
                        setFormData(prev => ({
                          ...prev,
                          projectId: pId,
                          relatedEntity: proj?.title || ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 text-slate-900 text-xs font-bold"
                    >
                      {projects.map(proj => (
                        <option key={proj.id} value={proj.id}>
                          {proj.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.entityType === 'donor' && (
                  <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <label className="block text-amber-900 font-bold">دیاریکردنی بەخشەر:</label>
                    <select
                      value={formData.donorId}
                      onChange={(e) => {
                        const dId = e.target.value;
                        const don = donors.find(d => d.id === dId);
                        setFormData(prev => ({
                          ...prev,
                          donorId: dId,
                          relatedEntity: don?.fullName || ''
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 text-xs font-bold"
                    >
                      {donors.map(don => (
                        <option key={don.id} value={don.id}>
                          {don.fullName} ({don.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.entityType === 'general' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تێبینی یان بەشی پەیوەندیدار:</label>
                    <input
                      type="text"
                      value={formData.relatedEntity}
                      onChange={(e) => setFormData(prev => ({ ...prev, relatedEntity: e.target.value }))}
                      placeholder="نموونە: بەڕێوەبەرایەتی، گرێبەستی بینا، ڕاپۆرتی ساڵانە..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                    />
                  </div>
                )}

                {/* Title & Category */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ناونیشانی بەڵگەنامە:</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="نموونە: کارتی نیشتمانی سەرۆک خێزان، ڕاپۆرتی نەخۆشخانە..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">پۆلێنکردن:</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                    >
                      {ALL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">جۆری فایل:</label>
                    <select
                      value={formData.fileType}
                      onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                    >
                      <option value="PDF">بەڵگەنامەی PDF</option>
                      <option value="JPG">وێنەی JPG</option>
                      <option value="PNG">وێنەی PNG</option>
                      <option value="DOCX">فایلی Word</option>
                      <option value="XLSX">فایلی Excel</option>
                    </select>
                  </div>
                </div>

                {/* Single File Upload Box */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleSingleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.xlsx,.xls"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                    selectedFileName
                      ? 'border-emerald-400 bg-emerald-50/60'
                      : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
                  }`}
                >
                  {selectedFileName ? (
                    <>
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-900">{selectedFileName}</p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-1">
                        فایلەکە بە سەرکەوتوویی خوێندرایەوە ({formData.fileSize})
                      </p>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-cyan-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">کلیک بکە بۆ دیاریکردنی فایل لە ئامێرەکەتەوە</p>
                      <p className="text-[10px] text-slate-500 mt-1">پشتیوانی PDF, JPG, PNG, DOCX تا قەبارەی 15MB</p>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl liquid-button-primary text-white font-bold"
                  >
                    بارکردن و پاشەکەوتکردن
                  </button>
                </div>
              </form>
            ) : (
              /* MODE 2: BULK UPLOAD (MULTI-FILES WITH PER-BENEFICIARY SELECTION) */
              <div className="space-y-4 text-xs flex-1 flex flex-col min-h-0">
                {/* Hidden Multi-file input */}
                <input
                  type="file"
                  multiple
                  ref={bulkFileInputRef}
                  onChange={handleBulkFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.doc,.xlsx,.xls"
                  className="hidden"
                />

                {/* If no files loaded yet, show large dropzone */}
                {bulkItems.length === 0 ? (
                  <div
                    onClick={() => bulkFileInputRef.current?.click()}
                    className="border-2 border-dashed border-cyan-400 bg-cyan-50/40 hover:bg-cyan-50 rounded-3xl p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center my-6 group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-cyan-100 border border-cyan-200 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {isReadingBulkFiles ? (
                        <RefreshCw className="w-8 h-8 text-cyan-700 animate-spin" />
                      ) : (
                        <CopyPlus className="w-8 h-8 text-cyan-700" />
                      )}
                    </div>
                    <h4 className="text-base font-black text-slate-900 mb-1">
                      {isReadingBulkFiles
                        ? 'فایلەکان لەژێر خوێندنەوەدان، تکایە کەمێک چاوەڕێبە...'
                        : 'کلیک بکە بۆ دیاریکردنی چەندین بەڵگەنامە پێکەوە (Bulk Select)'}
                    </h4>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed mt-1">
                      دەتوانیت 5، 10، 20 یان زیاتر فایلی ناسنامە و ڕاپۆرتی پزیشکی و وێنە بەیەکجار هەڵبژێریت، پاشان
                      دیاری بکە هەر بەڵگەنامەیەک دەچێتە ناو دۆسیەی کام سوودمەند.
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs shadow-sm">
                      <UploadCloud className="w-4 h-4" />
                      هەڵبژاردنی فایلەکان لە کۆمپیوتەرەکەتەوە
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Bulk Assistant Bar (Apply to All) */}
                    <div className="p-3.5 rounded-2xl bg-cyan-50/80 border border-cyan-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-cyan-950 text-xs flex items-center gap-1.5">
                          <CheckCheck className="w-4 h-4 text-cyan-700" />
                          کۆی گشتی:
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-600 text-white font-bold font-mono text-xs">
                          {bulkItems.length} فایل ئامادەیە
                        </span>
                      </div>

                      {/* Quick Global Beneficiary Assignment */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <span className="text-[11px] text-cyan-900 font-bold whitespace-nowrap">
                          دانانی هەمان سوودمەند بۆ هەمووان:
                        </span>
                        <select
                          value={bulkGlobalBeneficiaryId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBulkGlobalBeneficiaryId(val);
                            if (val) applyBeneficiaryToAllBulk(val);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-cyan-300 text-slate-900 text-xs font-bold max-w-[200px]"
                        >
                          <option value="">-- دیاریکردن بۆ هەمووان --</option>
                          {beneficiaries.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.fullName} ({b.governorate})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => bulkFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-cyan-200 text-cyan-800 text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5 text-cyan-600" />
                          زیادکردنی فایلی تر
                        </button>

                        <button
                          type="button"
                          onClick={() => setBulkItems([])}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200"
                          title="خاوێنکردنەوەی لیستی فایلەکان"
                        >
                          خاوێنکردنەوە
                        </button>
                      </div>
                    </div>

                    {/* Scrollable List of Files with Beneficiary Assignment */}
                    <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-2.5 scrollbar-thin">
                      {bulkItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-cyan-400 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                        >
                          {/* File Thumbnail & Name */}
                          <div className="flex items-center gap-3 min-w-0 sm:w-1/4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              {isImageFile(item) && item.fileData ? (
                                <img src={item.fileData} alt={item.fileName} className="w-full h-full object-cover" />
                              ) : (
                                getFileIcon(item.fileType)
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate" title={item.fileName}>
                                {index + 1}. {item.fileName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">
                                {item.fileType} • {item.fileSize}
                              </p>
                            </div>
                          </div>

                          {/* Editable Title */}
                          <div className="w-full sm:w-1/4">
                            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">ناونیشانی بەڵگەنامە:</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateBulkItem(item.id, { title: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-medium focus:bg-white"
                            />
                          </div>

                          {/* Category Selector */}
                          <div className="w-full sm:w-1/6">
                            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">پۆلێنکردن:</label>
                            <select
                              value={item.category}
                              onChange={(e) => updateBulkItem(item.id, { category: e.target.value as any })}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white"
                            >
                              {ALL_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Beneficiary Assignment Dropdown */}
                          <div className="w-full sm:w-1/3">
                            <label className="block text-[10px] text-cyan-800 font-bold mb-0.5 flex items-center gap-1">
                              <Users className="w-3 h-3 text-cyan-600" />
                              پەیوەست بە کام سوودمەند:
                            </label>
                            <select
                              value={item.beneficiaryId}
                              onChange={(e) => updateBulkItem(item.id, { beneficiaryId: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-cyan-50/60 border border-cyan-300 text-cyan-950 text-xs font-bold focus:bg-white"
                            >
                              {beneficiaries.map(ben => (
                                <option key={ben.id} value={ben.id}>
                                  {ben.fullName} - {ben.phone} ({ben.governorate})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Remove button */}
                          <div className="self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => removeBulkItem(item.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="سڕینەوەی ئەم فایلە لە لیستەکە"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bulk Submit Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-2">
                      <div className="text-xs text-slate-500">
                        سەرجەم فایلەکان پەیوەست دەکرێن بە دۆسیەی سوودمەندەکانی دیاریکراو و لە Supabase پاشەکەوت دەکرێن.
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                        >
                          پاشگەزبوونەوە
                        </button>
                        <button
                          type="button"
                          disabled={isSubmittingBulk || bulkItems.length === 0}
                          onClick={handleBulkSubmit}
                          className="flex items-center gap-2 px-6 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                        >
                          {isSubmittingBulk ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              لە پاشەکەوتکردندایە...
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4" />
                              بارکردن و پاشەکەوتکردنی هەمووی ({bulkItems.length} فایل)
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
