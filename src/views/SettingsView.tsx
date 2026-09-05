import React, { useState } from 'react';
import { Terminal, ShieldCheck, Languages } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeveloperApiModal } from '../components/DeveloperApiModal';
import { SecurityModal } from '../components/SecurityModal';
import { AccessibilityModal } from '../components/AccessibilityModal';

export const SettingsView: React.FC = () => {
  const { currentRole } = useApp();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  return (
    <div className="space-y-6 pb-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">ڕێکخستنەکانی سیستەم</h2>
          <p className="text-slate-500 font-medium mt-1">تایبەتمەندییە پێشکەوتووەکان و ڕێکخستنەکانی ئەدمین</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* API Settings */}
        <div className="liquid-glass p-6 rounded-3xl border border-white/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <Terminal className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">کۆنسۆڵی API بۆ پەرەپێدەران</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">ڕێکخستنی پەیوەندییە دەرەکییەکان و وەرگرتنی API Keys.</p>
          <button 
            onClick={() => setIsApiModalOpen(true)}
            className="w-full py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm transition-colors"
          >
            کردنەوە
          </button>
        </div>

        {/* Security Settings */}
        <div className="liquid-glass p-6 rounded-3xl border border-white/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">سەنتەری ئاسایش و یەدەگ</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">پاراستنی داتاکان و دروستکردنی یەدەگی (Backup) سیستەم.</p>
          <button 
            onClick={() => setIsSecurityModalOpen(true)}
            className="w-full py-2 bg-slate-100 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm transition-colors"
          >
            کردنەوە
          </button>
        </div>

        {/* Accessibility Settings */}
        <div className="liquid-glass p-6 rounded-3xl border border-white/50 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
            <Languages className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">دەستپێگەیشتن و فرەزمانی</h3>
          <p className="text-sm text-slate-500 mb-4 h-10">گۆڕینی زمانی سیستەم و قەبارەی فۆنتەکان.</p>
          <button 
            onClick={() => setIsAccessModalOpen(true)}
            className="w-full py-2 bg-slate-100 hover:bg-amber-50 text-amber-700 font-bold rounded-xl text-sm transition-colors"
          >
            کردنەوە
          </button>
        </div>

      </div>

      <DeveloperApiModal isOpen={isApiModalOpen} onClose={() => setIsApiModalOpen(false)} />
      <SecurityModal isOpen={isSecurityModalOpen} onClose={() => setIsSecurityModalOpen(false)} />
      <AccessibilityModal isOpen={isAccessModalOpen} onClose={() => setIsAccessModalOpen(false)} />
    </div>
  );
};
