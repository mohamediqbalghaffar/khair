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
  HardDrive
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

export const DocumentsView: React.FC = () => {
  const {
    documents,
    addDocument,
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Beneficiary search inside upload modal
  const [modalBenSearch, setModalBenSearch] = useState('');

  // Form State for uploading new doc
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleSubmit = (e: React.FormEvent) => {
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

  const handleDownload = (doc: DocumentItem) => {
    if (doc.fileData || doc.url) {
      const a = document.createElement('a');
      a.href = doc.fileData || doc.url!;
      a.download = doc.fileName || `${doc.title}.${doc.fileType?.toLowerCase() || 'png'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      // Fallback text summary
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

  const isImageFile = (doc: DocumentItem) => {
    const t = (doc.fileType || '').toUpperCase();
    const data = doc.fileData || doc.url || '';
    return (
      data.startsWith('data:image/') ||
      t.includes('JPG') ||
      t.includes('JPEG') ||
      t.includes('PNG') ||
      t.includes('WEBP') ||
      t.includes('GIF')
    );
  };

  const isPdfFile = (doc: DocumentItem) => {
    const t = (doc.fileType || '').toUpperCase();
    const data = doc.fileData || doc.url || '';
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

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          بارکردنی بەڵگەنامەی نوێ
        </button>
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

      {/* Modal: Add Document */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-teal-600" />
              بارکردنی بەڵگەنامەی نوێ بۆ ئەرشیف
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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

              {/* Dynamic Target Selection */}
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
                    <option value="ناسنامە">ناسنامە</option>
                    <option value="کارتی نیشتمانی">کارتی نیشتمانی</option>
                    <option value="ڕاپۆرتی پزیشکی">ڕاپۆرتی پزیشکی</option>
                    <option value="پسوولەی دارایی">پسوولەی دارایی</option>
                    <option value="وێنەی مەیدانی">وێنەی مەیدانی</option>
                    <option value="کۆبۆنی خۆراک">کۆبۆنی خۆراک</option>
                    <option value="بەڵگەنامەی نیشتەجێبوون">بەڵگەنامەی نیشتەجێبوون</option>
                    <option value="گرێبەست">گرێبەست</option>
                    <option value="پشتگیری فەرمی">پشتگیری فەرمی</option>
                    <option value="پڕۆژە">پڕۆژە</option>
                    <option value="تر">تر</option>
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

              {/* Real File Upload Box */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
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
          </div>
        </div>
      )}
    </div>
  );
};
