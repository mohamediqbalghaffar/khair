import React from 'react';
import { Donation } from '../types';
import { Printer, X, ShieldCheck, QrCode } from 'lucide-react';

interface OfficialReceiptModalProps {
  donation: Donation | null;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({ donation, onClose }) => {
  if (!donation) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Area */}
        <div id="printable-receipt" className="space-y-6 text-slate-900">
          
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
                بـ
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">ڕێکخراوی بۆتان بامۆکی بۆ کاری خێرخوازی</h2>
                <p className="text-xs text-cyan-700 font-bold">مۆڵەتی فەرمی ژمارە: NGO-KRG-2024-9412</p>
              </div>
            </div>
            <div className="inline-block px-4 py-1 mt-2 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 font-bold text-sm">
              پسوولەی فەرمی وەرگرتنی بەخشین (Official Donation Receipt)
            </div>
          </div>

          {/* Meta Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">ژمارەی پسوولە:</span>
              <span className="font-bold text-cyan-800 font-mono text-sm">{donation.receiptNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">بەرواری وەرگرتن:</span>
              <span className="font-bold text-slate-900 font-mono">{donation.date}</span>
            </div>
            <div>
              <span className="text-slate-500 block">شێوازی پارەدان:</span>
              <span className="font-bold text-emerald-700">{donation.method}</span>
            </div>
          </div>

          {/* Core Donation Info */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-sm text-slate-500">ناوی بەخشەر:</span>
              <span className="text-base font-bold text-slate-900">{donation.donorName}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-50 border border-cyan-200">
              <span className="text-sm text-slate-700 font-bold">بڕی بەخشراو:</span>
              <span className="text-2xl font-black text-cyan-800 tracking-wide">
                {donation.amount.toLocaleString()} {donation.currency === 'IQD' ? 'دیناری عێراقی' : 'دۆلاری ئەمریکی ($)'}
              </span>
            </div>

            {donation.projectName && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-sm text-slate-500">پڕۆژەی خێرخوازی:</span>
                <span className="text-sm font-bold text-slate-900">{donation.projectName}</span>
              </div>
            )}

            {donation.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500 block mb-1">تێبینی:</span>
                <p className="text-xs text-slate-700 leading-relaxed">{donation.notes}</p>
              </div>
            )}
          </div>

          {/* Official Verification & Stamp */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                <QrCode className="w-12 h-12 text-slate-700" />
              </div>
              <div className="text-[11px] text-slate-500">
                <div className="flex items-center gap-1 text-emerald-700 font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4" />
                  پسوولەی باوەڕپێکراوی ئەلیکترۆنی
                </div>
                <p>کۆدی دڵنیابوونەوە: SEC-{donation.id.toUpperCase()}</p>
                <p>سوپاس بۆ بەخشندەیی و پاڵپشتییە بەردەوامەکەت</p>
              </div>
            </div>

            {/* Official Organization Stamp */}
            <div className="relative border-2 border-dashed border-cyan-600/60 rounded-2xl p-3 text-center rotate-[-3deg] bg-cyan-50/70">
              <p className="text-[10px] text-cyan-800 font-bold uppercase tracking-wider">مۆری فەرمی ڕێکخراو</p>
              <p className="text-xs font-black text-cyan-900">بەشی دارایی و وەرگرتن</p>
              <p className="text-[10px] text-emerald-700 font-bold">پەسەندکراوە ✓</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            داخستن
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl liquid-button-primary text-white text-xs font-bold"
          >
            <Printer className="w-4 h-4" />
            چاپکردنی پسوولە (Print)
          </button>
        </div>

      </div>
    </div>
  );
};
