import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Lock, Key, Download, Upload, CheckCircle2, AlertCircle, X, RefreshCw, KeyRound } from 'lucide-react';
import { useModalFocusTrap } from '../utils/useModalFocusTrap';
import { useFeedback } from './ui/FeedbackProvider';
import { SYSTEM_LOCK_PIN_KEY, getStoredLockPin } from './LockScreenModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { twoFactorEnabled, setTwoFactorEnabled, exportDataJSON, importDataJSON, setIsLocked, clearToEmptyDatabase } = useApp();
  const { confirmAction, showToast } = useFeedback();
  const [jsonInput, setJsonInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [lockPin, setLockPin] = useState<string>(() => getStoredLockPin());
  const modalRef = useModalFocusTrap(isOpen, onClose);

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

  const handleSavePin = () => {
    const cleaned = lockPin.replace(/[^0-9]/g, '').slice(0, 4);
    if (cleaned.length !== 4) {
      showToast('تکایە کۆدی PIN دەبێت ٤ ژمارە بێت.', 'warning');
      return;
    }
    try {
      localStorage.setItem(SYSTEM_LOCK_PIN_KEY, cleaned);
      setLockPin(cleaned);
      showToast('کۆدی PINـی شاشەی قوفڵ بە سەرکەوتوویی نوێکرایەوە.', 'success');
    } catch {
      showToast('نەتوانرا کۆدی PIN پاشەکەوت بکرێت.', 'error');
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
      showToast(res.message, 'success');
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="security-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="داخستن"
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 id="security-modal-title" className="text-lg font-black text-slate-900">سەنتەری ئاسایش و پاراستنی داتابەیس</h3>
            <p className="text-xs text-slate-500 mt-0.5">ڕێکخراوی بۆتان بامۆکی • ڕاستاندنی دوو هەنگاوی و کۆپی یەدەگ</p>
          </div>
        </div>

        {/* Security Features List */}
        <div className="space-y-4 mb-6">
          {/* 1. 2FA Two-Factor Authentication */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-cyan-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">ڕاستاندنی دوو هەنگاوی (2FA Security)</h4>
                <p className="text-[11px] text-slate-500">پێویستبوون بە کۆدی SMS لەکاتی چوونەژوورەوە</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              aria-pressed={twoFactorEnabled}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                twoFactorEnabled
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {twoFactorEnabled ? 'چالاکە ✓' : 'ناچالاکە'}
            </button>
          </div>

          {/* 2. Screen Lock PIN Configuration */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">کۆدی PINـی قوفڵی شاشە (٤ ژمارە)</h4>
                <p className="text-[11px] text-slate-500">بۆ کردنەوەی شاشەی قوفڵ (Ctrl + L)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={lockPin}
                onChange={(e) => setLockPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                aria-label="کۆدی PIN"
                className="w-20 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-xs text-center text-slate-900"
              />
              <button
                type="button"
                onClick={handleSavePin}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                پاشەکەوت
              </button>
            </div>
          </div>

          {/* 3. AES-256 Encryption */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">کۆدکردنی داتا (AES-256 Encryption)</h4>
                <p className="text-[11px] text-slate-500">سەرجەم زانیاری ناسنامە و داهات پارێزراوە</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 shrink-0">
              ئۆتۆماتیک کارایە
            </span>
          </div>

          {/* 4. Lock System Immediately */}
          <div className="p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">قوفڵکردنی چرکەیی سیستەم</h4>
              <p className="text-[11px] text-slate-600">پێشاندانی شاشەی قوفڵی پارێزراوی iOS 26</p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsLocked(true);
              }}
              className="px-4 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-sm shrink-0"
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
              type="button"
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
            type="button"
            onClick={handleRestore}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            گەڕاندنەوە و نوێکردنەوەی تەواوی داتابەیس لە فایلی یەدەگ
          </button>
        </div>

        {/* Production Mode / Clean Database */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-amber-900">پاککردنەوەی داتابەیس بۆ دەستپێکی ڕاستەقینە</h4>
              <p className="text-[11px] text-amber-700 mt-0.5">بە کۆتاییهاتنی قۆناغی تاقیکاری، دەتوانیت داتابەیس بەتاڵ بکەیتەوە بۆ دەستپێکردنی تۆماری فەرمی</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const ok = await confirmAction({
                  title: 'پاککردنەوەی تەواوی داتابەیس',
                  message: 'ئایا دڵنیایت لە پاککردنەوەی تەواوی داتابەیس بۆ دەستپێکردنی تۆماری ڕاستەقینە؟ (پێشنیار دەکەین سەرەتا فایلی یەدەگ داببەزێنیت)',
                  confirmLabel: 'بەڵێ، داتابەیس پاک بکەرەوە',
                  variant: 'warning'
                });
                if (ok) {
                  clearToEmptyDatabase();
                  setStatusMessage({ text: 'داتابەیس بە سەرکەوتوویی پاککرایەوە و ئامادەیە بۆ تۆماری فەرمی', isError: false });
                  showToast('داتابەیس بە سەرکەوتوویی پاککرایەوە.', 'success');
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
            type="button"
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
