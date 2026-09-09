import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CreditCard, Smartphone, CheckCircle2, X, Sparkles, Receipt, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReceiptGenerated?: (receiptNumber: string) => void;
}

export const OnlinePaymentModal: React.FC<Props> = ({ isOpen, onClose, onReceiptGenerated }) => {
  const { addDonation, donors, projects } = useApp();

  const [gateway, setGateway] = useState<'fib' | 'fastpay' | 'zaincash' | 'card'>('fib');
  const [amount, setAmount] = useState<number>(50000);
  const [currency, setCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [donorName, setDonorName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      // 1. Add donation (automatically creates transaction, updates donor and project)
      const newDonation = addDonation({
        donorId: donors[0]?.id || 'donor-anon',
        donorName: donorName || 'بەخشەری ئۆنلاین',
        amount,
        currency,
        date: new Date().toISOString().split('T')[0],
        method: gateway === 'fib' ? 'FIB' : gateway === 'fastpay' ? 'FastPay' : gateway === 'zaincash' ? 'ZainCash' : 'حەواڵەی بانکی',
        projectId: selectedProjectId || undefined,
        projectName: projects.find(p => p.id === selectedProjectId)?.title || 'سندووقی گشتی هاوکاری',
        notes: notes ? `بەخشینی ئەلیکترۆنی لە ڕێگەی ${gateway.toUpperCase()} - ${notes}` : `بەخشینی ئەلیکترۆنی لە ڕێگەی ${gateway.toUpperCase()}`
      });

      setIsProcessing(false);
      setSuccessReceipt(newDonation.receiptNumber);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              دەروازەی بەخشینی ئەلیکترۆنی (Online Gateway)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
                ڕاستەوخۆ
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">بەخشینی نەختینەیی پارێزراو لە ڕێگەی FIB، FastPay، زین کاش</p>
          </div>
        </div>

        {successReceipt ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">بەخشینەکەت بە سەرکەوتوویی وەرگیرا!</h4>
              <p className="text-xs text-slate-500 mt-1">
                پسوولەی ئەلیکترۆنی فەرمی ژمارە: <span className="font-mono font-bold text-cyan-800">{successReceipt}</span>
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1 text-right">
              <div className="flex justify-between">
                <span className="text-slate-500">بڕی بەخشین:</span>
                <span className="font-bold text-emerald-700">{amount.toLocaleString()} {currency === 'IQD' ? 'د.ع' : '$'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">بەخشەر:</span>
                <span className="font-bold">{donorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">دەروازە:</span>
                <span className="font-bold font-mono uppercase">{gateway}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  if (onReceiptGenerated) onReceiptGenerated(successReceipt);
                }}
                className="flex-1 py-2.5 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                بینینی پسوولەی فەرمی
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            
            {/* Gateway Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">هەڵبژاردنی دەروازەی پارەدان:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'fib', label: 'FIB بنکە', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
                  { id: 'fastpay', label: 'FastPay', color: 'bg-rose-50 text-rose-800 border-rose-300' },
                  { id: 'zaincash', label: 'ZainCash', color: 'bg-purple-50 text-purple-800 border-purple-300' },
                  { id: 'card', label: 'Visa/Master', color: 'bg-blue-50 text-blue-800 border-blue-300' }
                ].map(gw => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setGateway(gw.id as any)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                      gateway === gw.id
                        ? `${gw.color} shadow-sm ring-2 ring-cyan-500/20`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {gw.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount & Currency */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">بڕی پارە:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1000}
                  className="w-full px-3 py-2 text-xs rounded-xl liquid-input font-bold text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دراو:</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 font-bold bg-white"
                >
                  <option value="IQD">دینار (IQD)</option>
                  <option value="USD">دۆلار (USD)</option>
                </select>
              </div>
            </div>

            {/* Quick Amount Pills */}
            <div className="flex items-center gap-2">
              {[25000, 50000, 100000, 250000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Donor Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ناوی بەخشەر:</label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ژمارەی مۆبایل:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 font-mono"
                  required
                />
              </div>
            </div>

            {/* Target Project */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">پڕۆژە یان سندووقی خێرخوازی:</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 bg-white"
              >
                <option value="">سندووقی گشتی هاوکاری ڕێکخراو</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                پاشگەزبوونەوە
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isProcessing ? 'لە چاوەڕوانیدایە...' : 'پارەدان و دەرکردنی پسوولە'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
