import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Donation, DonorType } from '../types';
import {
  HeartHandshake,
  Search,
  Plus,
  Receipt,
  Building2,
  User,
  Send,
  X
} from 'lucide-react';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';

export const DonorsView: React.FC = () => {
  const {
    donors,
    donations,
    projects,
    addDonor,
    addDonation,
    sendSimulationSMS
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'donors' | 'donations'>('donors');
  const [isAddDonorModalOpen, setIsAddDonorModalOpen] = useState(false);
  const [isAddDonationModalOpen, setIsAddDonationModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Donation | null>(null);

  // New Donor Form State
  const [donorForm, setDonorForm] = useState({
    fullName: '',
    type: 'individual' as DonorType,
    phone: '',
    email: '',
    governorate: 'هەولێر',
    status: 'active' as 'active' | 'inactive',
    notes: ''
  });

  // New Donation Form State
  const [donationForm, setDonationForm] = useState({
    donorId: '',
    amount: 500000,
    currency: 'IQD' as 'IQD' | 'USD',
    method: 'FIB' as Donation['method'],
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    notes: ''
  });

  // Filtered Donors
  const filteredDonors = donors.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.fullName.toLowerCase().includes(q) || d.phone.includes(q) || d.governorate.toLowerCase().includes(q);
  });

  // Filtered Donations
  const filteredDonations = donations.filter(d => {
    const q = searchQuery.toLowerCase();
    return d.donorName.toLowerCase().includes(q) || d.receiptNumber.toLowerCase().includes(q) || (d.projectName && d.projectName.toLowerCase().includes(q));
  });

  const handleAddDonorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDonor(donorForm);
    setIsAddDonorModalOpen(false);
    setDonorForm({
      fullName: '',
      type: 'individual',
      phone: '',
      email: '',
      governorate: 'هەولێر',
      status: 'active',
      notes: ''
    });
  };

  const handleAddDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDonor = donors.find(d => d.id === donationForm.donorId);
    if (!targetDonor) return;

    const targetProject = projects.find(p => p.id === donationForm.projectId);

    const newDonation = addDonation({
      donorId: targetDonor.id,
      donorName: targetDonor.fullName,
      amount: Number(donationForm.amount),
      currency: donationForm.currency,
      method: donationForm.method,
      date: donationForm.date,
      projectId: targetProject?.id,
      projectName: targetProject?.title,
      notes: donationForm.notes
    });

    setIsAddDonationModalOpen(false);
    setActiveReceipt(newDonation);
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
            بەڕێوەبردنی بەخشەران و پسوولەی بەخشین
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تۆماری فەرمی بەخشینەکان و دروستکردنی پسوولەی ئەلیکترۆنی باوەڕپێکراو
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddDonorModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            بەخشەری نوێ
          </button>
          
          <button
            onClick={() => {
              if (donors.length > 0 && !donationForm.donorId) {
                setDonationForm(prev => ({ ...prev, donorId: donors[0].id }));
              }
              setIsAddDonationModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
          >
            <Receipt className="w-4 h-4" />
            تۆمارکردنی بەخشین + پسوولە
          </button>
        </div>
      </div>

      {/* Sub Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('donors')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'donors'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            لیستی بەخشەران ({donors.length})
          </button>
          <button
            onClick={() => setActiveSubTab('donations')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'donations'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            پسوولەکانی بەخشین ({donations.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەدوای ناو، ژمارەی پسوولە..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* View 1: Donors Cards Grid */}
      {activeSubTab === 'donors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonors.map(donor => (
            <div
              key={donor.id}
              className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 hover:border-emerald-500/50 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                      {donor.type === 'corporate' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{donor.fullName}</h3>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        {donor.type === 'corporate' ? 'کۆمپانیا و بازرگان' : donor.type === 'organization' ? 'دەزگا و ڕێکخراو' : 'بەخشەری کەسی'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    چالاک
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">کۆی بەخشین (دینار):</span>
                    <span className="font-bold text-slate-900">{donor.totalDonationsIQD.toLocaleString()} د.ع</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">کۆی بەخشین (دۆلار):</span>
                    <span className="font-bold text-cyan-700">${donor.totalDonationsUSD.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">مۆبایل:</span>
                    <span className="font-mono font-bold text-slate-700">{donor.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    sendSimulationSMS(donor.phone, donor.fullName, `بەڕێز ${donor.fullName}، سوپاس و پێزانینی بێپایانی ڕێکخراوی ئایندە قبوڵ بفەرموون بۆ هاوکاری و بەخشندەییتان.`);
                    alert(`نامەی سوپاسگوزاری بۆ (${donor.fullName}) نێردرا!`);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  نامەی سوپاس (SMS)
                </button>

                <button
                  onClick={() => {
                    setDonationForm(prev => ({ ...prev, donorId: donor.id }));
                    setIsAddDonationModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors border border-emerald-200"
                  title="تۆمارکردنی بەخشینی نوێ"
                >
                  + بەخشین
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Donations List & Official Receipts */}
      {activeSubTab === 'donations' && (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3.5 px-4">ژمارەی پسوولە</th>
                  <th className="py-3.5 px-4">ناوی بەخشەر</th>
                  <th className="py-3.5 px-4">بڕی بەخشراو</th>
                  <th className="py-3.5 px-4">شێوازی پارەدان</th>
                  <th className="py-3.5 px-4">پڕۆژەی خێرخوازی</th>
                  <th className="py-3.5 px-4">بەروار</th>
                  <th className="py-3.5 px-4 text-center">پسوولەی فەرمی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      هیچ بەخشینێک نەدۆزرایەوە
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map(don => (
                    <tr key={don.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">
                        {don.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {don.donorName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-emerald-700 text-sm">
                          {don.amount.toLocaleString()} {don.currency === 'IQD' ? 'د.ع' : '$'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {don.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {don.projectName || 'سندووقی گشتی هاوکاری'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {don.date}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setActiveReceipt(don)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 hover:bg-cyan-100 font-bold text-[11px] mx-auto transition-colors border border-cyan-200"
                        >
                          <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                          بینینی پسوولە
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Donor */}
      {isAddDonorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAddDonorModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-emerald-600" />
              تۆمارکردنی بەخشەری نوێ
            </h3>

            <form onSubmit={handleAddDonorSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناوی تەواو یان ناوی کۆمپانیا:</label>
                <input
                  type="text"
                  required
                  value={donorForm.fullName}
                  onChange={(e) => setDonorForm({ ...donorForm, fullName: e.target.value })}
                  placeholder="بۆ نموونە: حاجی عومەر یان کۆمپانیای دڵنیا"
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">جۆری بەخشەر:</label>
                <select
                  value={donorForm.type}
                  onChange={(e) => setDonorForm({ ...donorForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                >
                  <option value="individual">کەسی (خێرخوازی ئاسایی)</option>
                  <option value="corporate">کۆمپانیا و بازرگان</option>
                  <option value="organization">دەزگای نێودەوڵەتی یان ناوخۆیی</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    required
                    value={donorForm.phone}
                    onChange={(e) => setDonorForm({ ...donorForm, phone: e.target.value })}
                    placeholder="0750XXXXXXX"
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                  <select
                    value={donorForm.governorate}
                    onChange={(e) => setDonorForm({ ...donorForm, governorate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ئیمەیڵ (ئارەزوومەندانە):</label>
                <input
                  type="email"
                  value={donorForm.email}
                  onChange={(e) => setDonorForm({ ...donorForm, email: e.target.value })}
                  placeholder="donor@example.com"
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی:</label>
                <textarea
                  rows={2}
                  value={donorForm.notes}
                  onChange={(e) => setDonorForm({ ...donorForm, notes: e.target.value })}
                  placeholder="تێبینی سەبارەت بە خواستی بەخشینەکانی..."
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDonorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  تۆمارکردن لە داتابەیس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Donation */}
      {isAddDonationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAddDonationModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              تۆمارکردنی بەخشین و دەرکردنی پسوولەی فەرمی
            </h3>

            <form onSubmit={handleAddDonationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">دیاریکردنی بەخشەر:</label>
                <select
                  required
                  value={donationForm.donorId}
                  onChange={(e) => setDonationForm({ ...donationForm, donorId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white"
                >
                  {donors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بڕی بەخشراو:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دراو:</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                    <button
                      type="button"
                      onClick={() => setDonationForm({ ...donationForm, currency: 'IQD' })}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        donationForm.currency === 'IQD'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      دینار (IQD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDonationForm({ ...donationForm, currency: 'USD' })}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        donationForm.currency === 'USD'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      دۆلار (USD $)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">شێوازی پێدان:</label>
                  <select
                    value={donationForm.method}
                    onChange={(e) => setDonationForm({ ...donationForm, method: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="کاش">کاش (دەستی)</option>
                    <option value="FIB">بانکی یەکەمی عێراق FIB</option>
                    <option value="FastPay">فاست پەی FastPay</option>
                    <option value="ZainCash">زەین کاش ZainCash</option>
                    <option value="حەواڵەی بانکی">حەواڵەی بانکی</option>
                    <option value="کەرەستە و کاڵا">کەرەستە و کاڵا</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پڕۆژەی دیاریکراو:</label>
                  <select
                    value={donationForm.projectId}
                    onChange={(e) => setDonationForm({ ...donationForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="">سندووقی گشتی خێرخوازی</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی سەر پسوولە:</label>
                <input
                  type="text"
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  placeholder="بۆ نموونە: هاوکاری بۆ سندووقی زستانە"
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddDonationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold"
                >
                  دەرکردنی پسوولەی فەرمی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Generator Modal */}
      <OfficialReceiptModal
        donation={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

    </div>
  );
};
