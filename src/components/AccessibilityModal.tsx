import React, { useState, useEffect } from 'react';
import { Eye, BookOpen } from 'lucide-react';
import { AdaptiveDrawerSheet } from './ui/AdaptiveDrawerSheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ACCESSIBILITY_PREFS_KEY = 'botan_accessibility_prefs_v1';

export interface AccessibilityPrefs {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
}

export const applyAccessibilityPrefs = (prefs: AccessibilityPrefs) => {
  if (prefs.highContrast) {
    document.documentElement.classList.add('contrast-more');
  } else {
    document.documentElement.classList.remove('contrast-more');
  }

  if (prefs.fontSize === 'large') {
    document.documentElement.style.fontSize = '17px';
  } else if (prefs.fontSize === 'xlarge') {
    document.documentElement.style.fontSize = '18.5px';
  } else {
    document.documentElement.style.fontSize = '';
  }
};

export const loadAndApplyAccessibilityPrefs = (): AccessibilityPrefs => {
  try {
    const raw = localStorage.getItem(ACCESSIBILITY_PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AccessibilityPrefs;
      applyAccessibilityPrefs(parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return { highContrast: false, fontSize: 'normal' };
};

export const AccessibilityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  useEffect(() => {
    const prefs = loadAndApplyAccessibilityPrefs();
    setHighContrast(prefs.highContrast);
    setFontSize(prefs.fontSize);
  }, [isOpen]);

  const savePrefs = (next: AccessibilityPrefs) => {
    applyAccessibilityPrefs(next);
    try {
      localStorage.setItem(ACCESSIBILITY_PREFS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleContrast = () => {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    savePrefs({ highContrast: nextVal, fontSize });
  };

  const setAppFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    savePrefs({ highContrast, fontSize: size });
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
    <AdaptiveDrawerSheet
      isOpen={isOpen}
      onClose={onClose}
      title="دەستپێگەیشتن و فرەزمانی"
      description="ڕێکخراوی بۆتان بامۆکی • ڕێکخستنی بینین و فەرهەنگی زاراوەکان"
      icon={<Eye className="w-5 h-5 text-amber-600" />}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors touch-manipulation active:scale-95"
          >
            داخستن
          </button>
        </div>
      }
    >
      {/* Accessibility Toggles */}
      <div className="space-y-4 mb-6">
        {/* High Contrast */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900">دۆخی ڕوونی بەرز (High Contrast Mode)</h4>
            <p className="text-[11px] text-slate-500">تۆخکردنی هێڵەکان و زیادکردنی ڕوونی دەقەکان (پاشەکەوت دەکرێت)</p>
          </div>
          <button
            type="button"
            onClick={toggleContrast}
            aria-pressed={highContrast}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 touch-manipulation active:scale-95 ${
              highContrast
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {highContrast ? 'چالاکە ✓' : 'ئاسایی'}
          </button>
        </div>

        {/* Font Size Adjuster */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h4 className="text-xs font-bold text-slate-900">قەبارەی فۆنت (Font Scaling)</h4>
            <p className="text-[11px] text-slate-500">گەورەکردنی فۆنتی سپێدە بۆ خوێندنەوەی ئاسان</p>
          </div>
          <div className="flex items-center gap-1.5">
            {(['normal', 'large', 'xlarge'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setAppFontSize(s)}
                aria-pressed={fontSize === s}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation active:scale-95 ${
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-cyan-600" />
            فەرهەنگی هاوبەشی زاراوە خێرخوازییەکان (CKB • AR • EN)
          </h4>
          <span className="text-[11px] text-slate-500 font-bold">فرەزمانی نێودەوڵەتی</span>
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
                <span className="text-slate-600">{t.ar}</span>
                <span className="text-slate-500 font-mono text-[11px]">{t.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdaptiveDrawerSheet>
  );
};
