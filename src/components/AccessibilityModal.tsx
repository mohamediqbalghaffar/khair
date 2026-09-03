import React, { useState } from 'react';
import { Eye, Languages, ZoomIn, ZoomOut, Check, X, Sparkles, BookOpen } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  if (!isOpen) return null;

  const toggleContrast = () => {
    setHighContrast(!highContrast);
    if (!highContrast) {
      document.documentElement.classList.add('contrast-more');
    } else {
      document.documentElement.classList.remove('contrast-more');
    }
  };

  const setAppFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    if (size === 'large') {
      document.documentElement.style.fontSize = '17px';
    } else if (size === 'xlarge') {
      document.documentElement.style.fontSize = '18.5px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

  const terminologyList = [
    { ckb: 'سوودمەند', ar: 'المستفيد', en: 'Beneficiary' },
    { ckb: 'بەخشەر', ar: 'المتبرع', en: 'Donor' },
    { ckb: 'پسوولەی فەرمی', ar: 'وصل استلام رسمي', en: 'Official Receipt' },
    { ckb: 'خۆبەخش', ar: 'المتطوع', en: 'Volunteer' },
    { ckb: 'کۆگا و دابەشکردن', ar: 'المستودع والتوزيع', en: 'Warehouse & Distribution' },
    { ckb: 'کەمپەینی زستانە', ar: 'حملة الشتاء', en: 'Winter Campaign' },
    { ckb: 'پشکنینی ساختەکاری', ar: 'كشف التزوير والازدواجية', en: 'Duplicate Detection' },
    { ckb: 'سندووقی بێباوکان', ar: 'صندوق الأيتام', en: 'Orphan Fund' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              دەستپێگەیشتن و فرەزمانی (Accessibility & Languages)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">ڕێکخراوی بۆتان بامۆکی • ڕێکخستنی بینین و فەرهەنگی زاراوەکان</p>
          </div>
        </div>

        {/* Accessibility Toggles */}
        <div className="space-y-4 mb-6">
          
          {/* High Contrast */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">دۆخی ڕوونی بەرز (High Contrast Mode)</h4>
              <p className="text-[11px] text-slate-500">تۆخکردنی هێڵەکان و زیادکردنی ڕوونی دەقەکان</p>
            </div>
            <button
              onClick={toggleContrast}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                highContrast
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {highContrast ? 'چالاکە ✓' : 'ئاسایی'}
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900">قەبارەی فۆنت (Font Scaling)</h4>
              <p className="text-[11px] text-slate-500">گەورەکردنی فۆنتی سپێدە بۆ خوێندنەوەی ئاسان</p>
            </div>
            <div className="flex items-center gap-1">
              {(['normal', 'large', 'xlarge'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setAppFontSize(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    fontSize === s
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {s === 'normal' ? '١٠٠٪' : s === 'large' ? '١١٥٪' : '١٣٠٪'}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Multilingual Glossary Section */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-cyan-600" />
              فەرهەنگی هاوبەشی زاراوە خێرخوازییەکان (CKB • AR • EN)
            </h4>
            <span className="text-[10px] text-slate-500 font-bold">فرەزمانی نێودەوڵەتی</span>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-100 px-3 py-2 font-bold text-slate-700 border-b border-slate-200">
              <span>کوردی (CKB)</span>
              <span>عربي (AR)</span>
              <span>English (EN)</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {terminologyList.map((t, idx) => (
                <div key={idx} className="grid grid-cols-3 px-3 py-2 text-slate-800 hover:bg-slate-50 transition-colors">
                  <span className="font-bold text-cyan-800">{t.ckb}</span>
                  <span className="text-slate-600 font-arabic">{t.ar}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{t.en}</span>
                </div>
              ))}
            </div>
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
