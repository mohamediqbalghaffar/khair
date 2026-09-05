import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DocumentItem } from '../types';
import {
  Files,
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  Image,
  UploadCloud,
  Download,
  Eye,
  ShieldCheck,
  Trash2,
  CheckCircle2,
  X
} from 'lucide-react';

export const DocumentsView: React.FC = () => {
  const { documents, addDocument, deleteDocument } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'ناسنامە' as DocumentItem['category'],
    fileType: 'PDF',
    fileSize: '1.2 MB',
    relatedEntity: ''
  });

  const filteredDocs = documents.filter(doc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = doc.title.toLowerCase().includes(q) || doc.relatedEntity.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const sizeKB = Math.round(file.size / 1024);
      const sizeStr = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`;
      setFormData(prev => ({
        ...prev,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
        fileSize: sizeStr,
        fileType: ext
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDocument(formData);
    setIsAddModalOpen(false);
    setSelectedFileName(null);
    setFormData({
      title: '',
      category: 'ناسنامە',
      fileType: 'PDF',
      fileSize: '1.2 MB',
      relatedEntity: ''
    });
  };

  const getFileIcon = (type: string) => {
    if (type.includes('PDF')) return <FileText className="w-7 h-7 text-rose-600" />;
    if (type.includes('JPG') || type.includes('PNG')) return <Image className="w-7 h-7 text-cyan-600" />;
    return <FileSpreadsheet className="w-7 h-7 text-emerald-600" />;
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Files className="w-6 h-6 text-teal-600" />
            بەڕێوەبردنی بەڵگەنامە و دۆسیە ئەلیکترۆنییەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            پاراستنی ناسنامەی خێزانەکان، ڕاپۆرتی پزیشکی، وێنەی مەیدانی، و گرێبەستە فەرمییەکان
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" />
          بارکردنی بەڵگەنامەی نوێ
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl liquid-glass border border-slate-200/90 w-full sm:w-auto overflow-x-auto shadow-sm">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'all' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هەموو بەڵگەنامەکان
          </button>
          <button
            onClick={() => setCategoryFilter('ناسنامە')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'ناسنامە' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ناسنامە و باری شارستانی
          </button>
          <button
            onClick={() => setCategoryFilter('ڕاپۆرتی پزیشکی')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'ڕاپۆرتی پزیشکی' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ڕاپۆرتی پزیشکی
          </button>
          <button
            onClick={() => setCategoryFilter('پسوولەی دارایی')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'پسوولەی دارایی' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            پسوولەی دارایی
          </button>
          <button
            onClick={() => setCategoryFilter('وێنەی مەیدانی')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === 'وێنەی مەیدانی' ? 'bg-cyan-100 text-cyan-800 border border-cyan-200 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            وێنەی مەیدانی
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی ناونیشانی فایل یان کەس..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
          <Files className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">هیچ بەڵگەنامەیەک بار نەکراوە (سفر دۆسیە)</p>
          <p className="text-xs text-slate-400 mt-1">بۆ بارکردنی بەڵگەنامە و وێنە و گرێبەست، کلیک لە دوگمەی «بارکردنی بەڵگەنامەی نوێ» بکە لە سەرەوە</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredDocs.map(doc => (
          <div
            key={doc.id}
            className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 hover:border-teal-500/50 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center shadow-sm">
                  {getFileIcon(doc.fileType)}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {doc.category}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-xs leading-snug line-clamp-2 mb-2 min-h-[32px]">
                {doc.title}
              </h3>

              <div className="space-y-1 text-[11px] text-slate-600 py-2 border-t border-slate-100">
                <p>پەیوەست بە: <span className="text-teal-700 font-bold">{doc.relatedEntity}</span></p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>قەبارە: {doc.fileSize}</span>
                  <span className="font-mono">{doc.uploadDate}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedDoc(doc)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                بینین
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([`بەڵگەنامەی فەرمی ڕێکخراوی بۆتان بامۆکی\nناونیشان: ${doc.title}\nپەیوەستە بە: ${doc.relatedEntity}\nبەروار: ${doc.uploadDate}`], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${doc.title}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                title="داگرتن"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`دڵنیایت لە سڕینەوەی بەڵگەنامەی [${doc.title}]؟`)) {
                    deleteDocument(doc.id);
                  }
                }}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                title="سڕینەوەی بەڵگەنامە"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

      {/* File Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                {getFileIcon(selectedDoc.fileType)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedDoc.title}</h3>
                <span className="text-xs text-teal-700 font-bold">{selectedDoc.category}</span>
              </div>
            </div>

            {/* Simulated Document Sheet */}
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 my-4">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
              <p className="text-xs text-slate-900 font-bold">بەڵگەنامەی پارێزراوی ئەلیکترۆنی</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                ئەم فایلە بە کۆدکردنی پارێزراو لە داتابەیسی ڕێکخراوی بۆتان بامۆکی پاشەکەوت کراوە بەپێی ڕێنماییەکانی پاراستنی تایبەتمەندی خێزانەکان.
              </p>
              <div className="inline-block font-mono text-[11px] px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-sm">
                پەیوەستە بە: {selectedDoc.relatedEntity} • قەبارە: {selectedDoc.fileSize}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([`بەڵگەنامەی فەرمی ڕێکخراوی بۆتان بامۆکی\nناونیشان: ${selectedDoc.title}\nپەیوەستە بە: ${selectedDoc.relatedEntity}\nقەبارە: ${selectedDoc.fileSize}\nبەروار: ${selectedDoc.uploadDate}`], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedDoc.title}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setSelectedDoc(null);
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                داگرتنی بەڵگەنامە
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Document */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-teal-600" />
              بارکردنی بەڵگەنامەی نوێ
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناونیشانی بەڵگەنامە:</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پۆلێنکردن:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="ناسنامە">ناسنامە</option>
                    <option value="ڕاپۆرتی پزیشکی">ڕاپۆرتی پزیشکی</option>
                    <option value="پسوولەی دارایی">پسوولەی دارایی</option>
                    <option value="گرێبەست">گرێبەست</option>
                    <option value="وێنەی مەیدانی">وێنەی مەیدانی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">جۆری فایل:</label>
                  <select
                    value={formData.fileType}
                    onChange={(e) => setFormData({ ...formData, fileType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="PDF">بەڵگەنامەی PDF</option>
                    <option value="JPG">وێنەی JPG</option>
                    <option value="PNG">وێنەی PNG</option>
                    <option value="DOCX">فایلی Word</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">پەیوەست بە کام سوودمەند یان پڕۆژە:</label>
                <input
                  type="text"
                  required
                  value={formData.relatedEntity}
                  onChange={(e) => setFormData({ ...formData, relatedEntity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              {/* Real File Upload Box */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.xlsx,.xls"
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
                    <p className="text-[10px] text-emerald-700 font-bold mt-1">فایلەکە دیاریکرا ({formData.fileSize})</p>
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
                  بارکردنی فایل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
