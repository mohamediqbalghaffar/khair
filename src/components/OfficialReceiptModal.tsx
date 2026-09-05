import React from 'react';
import { Donation } from '../types';
import { Printer, X, ShieldCheck, QrCode, Package, HeartHandshake, TrendingUp, BadgeCheck } from 'lucide-react';
import { getExchangeRateForDate } from '../utils/exchangeRates';

interface OfficialReceiptModalProps {
  donation: Donation | null;
  onClose: () => void;
}

export const OfficialReceiptModal: React.FC<OfficialReceiptModalProps> = ({ donation, onClose }) => {
  if (!donation) return null;

  const handlePrint = () => {
    window.print();
  };

  const isInKind = donation.category && donation.category !== 'cash';

  const dayRate = donation.exchangeRateAtDate || getExchangeRateForDate(donation.date).rate;
  const convertedAmount = donation.convertedAmount || (
    donation.currency === 'IQD'
      ? Number((donation.amount / dayRate).toFixed(2))
      : Math.round(donation.amount * dayRate)
  );
  const rateSource = donation.exchangeRateSource || 'بۆرسەی کیفاح و هەولێر (AlanChand)';

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
              <span className="text-slate-500 block">شێوازی ڕادەستکردن:</span>
              <span className="font-bold text-emerald-700">{donation.method}</span>
            </div>
          </div>

          {/* Core Donation Info */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-sm text-slate-500">ناوی بەخشەر:</span>
              <span className="text-base font-bold text-slate-900">{donation.donorName}</span>
            </div>

            {/* In-Kind Details Card */}
            {isInKind && donation.itemDetails ? (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-emerald-600" />
                    پۆلێنی بەخشین:
                  </span>
                  <span className="text-sm font-black text-emerald-900 px-3 py-1 rounded-xl bg-white border border-emerald-200">
                    {donation.categoryLabel || 'بەخشینی عەینی'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/80">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                    <span className="text-slate-500 block">بڕ و ژمارەی بەخشراو:</span>
                    <span className="text-sm font-black text-slate-900">
                      {donation.itemDetails.quantity} {donation.itemDetails.unit || 'دانە'}
                    </span>
                  </div>

                  {donation.itemDetails.weightKgPerUnit && (
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                      <span className="text-slate-500 block">کێشی هەر کارتۆنێک:</span>
                      <span className="text-sm font-black text-slate-900">
                        {donation.itemDetails.weightKgPerUnit} کیلۆگرام
                      </span>
                    </div>
                  )}
                </div>

                {donation.itemDetails.contentsDescription && (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100 text-xs">
                    <span className="text-slate-500 block mb-1 font-bold">پێکهاتە و کەلوپەلەکان:</span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {donation.itemDetails.contentsDescription}
                    </p>
                  </div>
                )}

                {donation.amount > 0 && (
                  <div className="pt-2 border-t border-emerald-200/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-bold">بەهای خەمڵێنراوی تەواوی بەخشینەکە:</span>
                      <span className="font-bold text-emerald-800">
                        {donation.amount.toLocaleString()} {donation.currency === 'IQD' ? 'د.ع' : '$'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>نرخی بۆرسەی ڕۆژ (1 USD = {dayRate.toLocaleString()} IQD):</span>
                      <span className="font-mono text-cyan-800 font-bold">
                        هاوتا: {donation.currency === 'IQD' ? `$${convertedAmount.toLocaleString()} USD` : `${convertedAmount.toLocaleString()} د.ع`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Cash Donation Card with Day-by-Day Bazaar Exchange Rate */
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50/90 to-blue-50/80 border border-cyan-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">جۆری بەخشین:</span>
                    <span className="text-sm text-slate-800 font-bold">کۆمەکی نەختینەیی (پارە)</span>
                  </div>
                  <div className="text-left">
                    <span className="text-xs text-slate-500 block">بڕی پارەی بەخشراو:</span>
                    <span className="text-2xl font-black text-cyan-900 tracking-wide font-mono">
                      {donation.amount.toLocaleString()} {donation.currency === 'IQD' ? 'دیناری عێراقی' : 'دۆلاری ئەمریکی ($)'}
                    </span>
                  </div>
                </div>

                {/* Day Exchange Rate & Verified Equivalent Bar */}
                {donation.amount > 0 && (
                  <div className="pt-2.5 border-t border-cyan-200/70 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <TrendingUp className="w-3.5 h-3.5 text-cyan-700" />
                        <span>نرخی بۆرسەی ڕۆژی بەخشین ({donation.date}):</span>
                        <span className="font-mono text-cyan-950 font-black">1 USD = {dayRate.toLocaleString()} IQD</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-cyan-200/90 shadow-xs">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-slate-600 font-medium">هاوتای فەرمی بەخشین:</span>
                        <span className="font-mono font-black text-emerald-800">
                          {donation.currency === 'IQD' ? `$${convertedAmount.toLocaleString()} USD` : `${convertedAmount.toLocaleString()} د.ع`}
                        </span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 text-left pt-0.5">
                      ✓ پشتڕاستکراوە بەپێی بۆرسەی بازاڕی عێراق ({rateSource})
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Destination / Purpose */}
            {donation.projectName && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-sm text-slate-500">ئاراستە و مەبەستی بەخشین:</span>
                <span className="text-sm font-bold text-cyan-900">{donation.projectName}</span>
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
