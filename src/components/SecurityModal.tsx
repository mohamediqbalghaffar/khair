import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Key, Download, Upload, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { twoFactorEnabled, setTwoFactorEnabled, exportDataJSON, importDataJSON, setIsLocked, clearToEmptyDatabase } = useApp();
  const [jsonInput, setJsonInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleRestore = () => {
    if (!jsonInput.trim()) {
      setStatusMessage({ text: 'تکایە سەرەتا فایلێک هەڵبژێرە یان کۆدی JSON لێرە دابنێ.', isError: true });
      return;
    }
    const res = importDataJSON(jsonInput);
    setStatusMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">سەنتەری ئاسایش و پاراستنی داتابەیس</h3>
            <p className="text-xs text-slate-500 mt-0.5">ڕێکخراوی بۆتان بامۆکی • ڕاستاندنی دوو هەنگاوی و کۆپی یەدەگ</p>
          </div>
        </div>

        {/* Security Features List */}
        <div className="space-y-4 mb-6">
          
          {/* 1. 2FA Two-Factor Authentication */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-cyan-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">ڕاستاندنی دوو هەنگاوی (2FA Security)</h4>
                <p className="text-[11px] text-slate-500">پێویستبوون بە کۆدی SMS لەکاتی چوونەژوورەوە</p>
              </div>
            </div>
            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                twoFactorEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {twoFactorEnabled ? 'چالاکە ✓' : 'ناچالاکە'}
            </button>
          </div>

          {/* 2. AES-256 Encryption */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">کۆدکردنی داتا (AES-256 Encryption)</h4>
                <p className="text-[11px] text-slate-500">سەرجەم زانیاری ناسنامە و داهات پارێزراوە</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              ئۆتۆماتیک کارایە
            </span>
          </div>

          {/* 3. Lock System Immediately */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">قوفڵکردنی چرکەیی سیستەم</h4>
              <p className="text-[11px] text-slate-600">پێشاندانی شاشەی قوفڵی پارێزراوی iOS 26</p>
            </div>
            <button
              onClick={() => {
                onClose();
                setIsLocked(true);
              }}
              className="px-4 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-sm"
            >
              قوفڵکردن ئێستا
            </button>
          </div>

        </div>

        {/* Backup and Restore Section */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 mb-6">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4 text-cyan-600" />
            یەدەگ و گەڕاندنەوەی داتابەیس (Backup & Restore JSON)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={exportDataJSON}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 text-slate-800 text-xs font-bold transition-all shadow-sm group"
            >
              <Download className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
              <span>داگرتنی فایلی یەدەگ (.json)</span>
            </button>

            <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 text-slate-800 text-xs font-bold transition-all shadow-sm cursor-pointer group">
              <Upload className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>هەڵبژاردنی فایلی یەدەگ</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Paste or Show JSON */}
          <div>
            <textarea
              rows={3}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="دەتوانیت کۆدی JSONـی یەدەگ لێرە دابنێیت بۆ گەڕاندنەوە..."
              className="w-full p-2.5 text-[11px] font-mono rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400"
            />
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              statusMessage.isError ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {statusMessage.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <button
            onClick={handleRestore}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            گەڕاندنەوە و نوێکردنەوەی تەواوی داتابەیس لە فایلی یەدەگ
          </button>
        </div>

        {/* Production Mode / Clean Database */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-amber-900">پاککردنەوەی داتابەیس بۆ دەستپێکی ڕاستەقینە</h4>
              <p className="text-[10px] text-amber-700 mt-0.5">بە کۆتاییهاتنی قۆناغی تاقیکاری، دەتوانیت داتابەیس بەتاڵ بکەیتەوە بۆ دەستپێکردنی تۆماری فەرمی</p>
            </div>
            <button
              onClick={() => {
                if (confirm('ئایا دڵنیایت لە پاککردنەوەی تەواوی داتابەیس بۆ دەستپێکردنی تۆماری ڕاستەقینە؟ (پێشنیار دەکەین سەرەتا فایلی یەدەگ داببەزێنیت)')) {
                  clearToEmptyDatabase();
                  setStatusMessage({ text: 'داتابەیس بە سەرکەوتوویی پاککرایەوە و ئامادەیە بۆ تۆماری فەرمی', isError: false });
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shrink-0"
            >
              پاککردنەوەی داتا
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
};
