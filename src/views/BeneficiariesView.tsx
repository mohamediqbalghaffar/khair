import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Beneficiary, NeedCategory, BeneficiaryStatus } from '../types';
import {
  Users,
  Search,
  Plus,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gift,
  MapPin,
  MessageSquare,
  Printer,
  X
} from 'lucide-react';

export const BeneficiariesView: React.FC = () => {
  const {
    beneficiaries,
    addBeneficiary,
    deleteBeneficiary,
    addAidRecord,
    sendSMS
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [isGiveAidModalOpen, setIsGiveAidModalOpen] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    nationalId: '',
    fullName: '',
    phone: '',
    governorate: 'هەولێر' as Beneficiary['governorate'],
    address: '',
    familyMembers: 1,
    monthlyIncomeIQD: 0,
    needCategory: 'poor' as NeedCategory,
    status: 'approved' as BeneficiaryStatus,
    notes: ''
  });

  // Give Aid Form State
  const [aidForm, setAidForm] = useState({
    type: 'monetary' as 'monetary' | 'in-kind',
    amountIQD: 200000,
    itemName: 'سەبەتەی خۆراک',
    quantity: 1,
    projectTitle: 'دابەشکردنی خۆراکی مانگانە',
    notes: ''
  });

  // SMS Form State
  const [smsText, setSmsText] = useState('سڵاو بەڕێز، تکایە ئاگاداربە هاوکارییە دیاریکراوەکەت لە بنکەی سەرەکی ڕێکخراوی بۆتان بامۆکی ئامادەیە بۆ وەرگرتن.');

  // Filtering
  const filteredBeneficiaries = beneficiaries.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      b.fullName.toLowerCase().includes(q) ||
      b.phone.includes(q) ||
      b.nationalId.includes(q) ||
      b.address.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesCat = categoryFilter === 'all' || b.needCategory === categoryFilter;
    const matchesGov = governorateFilter === 'all' || b.governorate === governorateFilter;

    return matchesSearch && matchesStatus && matchesCat && matchesGov;
  });

  const handleSubmitBeneficiary = (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateAlert(null);

    const res = addBeneficiary(formData);
    if (!res.success) {
      setDuplicateAlert(res.message || 'ئەم کەسە دووبارەیە!');
      return;
    }

    setIsAddModalOpen(false);
    setFormData({
      nationalId: '',
      fullName: '',
      phone: '',
      governorate: 'هەولێر',
      address: '',
      familyMembers: 4,
      monthlyIncomeIQD: 100000,
      needCategory: 'poor',
      status: 'approved',
      notes: ''
    });
  };

  const handleGiveAidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeneficiary) return;

    addAidRecord(selectedBeneficiary.id, {
      date: new Date().toISOString().split('T')[0],
      type: aidForm.type,
      amountIQD: aidForm.type === 'monetary' ? aidForm.amountIQD : undefined,
      itemName: aidForm.type === 'in-kind' ? aidForm.itemName : undefined,
      quantity: aidForm.type === 'in-kind' ? aidForm.quantity : undefined,
      projectTitle: aidForm.projectTitle,
      distributedBy: 'کارمەندی مەیدانی',
      notes: aidForm.notes
    });

    setIsGiveAidModalOpen(false);
    const updated = beneficiaries.find(b => b.id === selectedBeneficiary.id);
    if (updated) setSelectedBeneficiary(updated);
  };

  const handleSendSMS = () => {
    if (!selectedBeneficiary) return;
    sendSMS(selectedBeneficiary.phone, selectedBeneficiary.fullName, smsText);
    setIsSMSModalOpen(false);
  };

  const categoryLabels: Record<NeedCategory, string> = {
    poor: 'هەژار و دەستکورت',
    orphan: 'بێباوک و هەتیو',
    sick: 'نەخۆشی درێژخایەن',
    disabled: 'خاوەن پێداویستی تایبەت',
    displaced: 'ئاوارە و پەنابەر',
    student: 'خوێندکاری هەژار'
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-600" />
            بەڕێوەبردنی سوودمەندان و خێزانەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            پشکنینی دۆسیەی خێزانە هەژارەکان بە سیستەمی زیرەکی ڕێگری لە هاوکاری دووبارە
          </p>
        </div>

        <button
          onClick={() => {
            setDuplicateAlert(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" />
          تۆمارکردنی سوودمەندی نوێ
        </button>
      </div>

      {/* Filter and Search Pill Bar */}
      <div className="rounded-3xl liquid-glass p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بەپێی ناو، مۆبایل، ژمارەی نیشتمانی..."
              className="w-full pr-10 pl-3 py-2 text-xs rounded-xl liquid-input text-slate-900 placeholder-slate-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white"
          >
            <option value="all">هەموو دۆخەکان</option>
            <option value="approved">پەسەندکراو بۆ هاوکاری</option>
            <option value="aided">هاوکاری وەرگرتووە</option>
            <option value="pending">لەژێر لێکۆڵینەوە</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white"
          >
            <option value="all">هەموو حاڵەتەکان</option>
            <option value="poor">هەژار و دەستکورت</option>
            <option value="orphan">بێباوک و هەتیو</option>
            <option value="sick">نەخۆشی درێژخایەن</option>
            <option value="disabled">خاوەن پێداویستی تایبەت</option>
            <option value="student">خوێندکاری هەژار</option>
          </select>

          {/* Governorate Filter */}
          <select
            value={governorateFilter}
            onChange={(e) => setGovernorateFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white"
          >
            <option value="all">هەموو پارێزگاکان</option>
            <option value="هەولێر">هەولێر</option>
            <option value="سلێمانی">سلێمانی</option>
            <option value="دهۆک">دهۆک</option>
            <option value="هەڵەبجە">هەڵەبجە</option>
            <option value="کەرکووک">کەرکووک</option>
            <option value="گەرمیان">گەرمیان</option>
          </select>

        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">ناوی تەواو</th>
                <th className="py-3.5 px-4">ژ. ناسنامە / مۆبایل</th>
                <th className="py-3.5 px-4">پارێزگا / ناونیشان</th>
                <th className="py-3.5 px-4">حاڵەت / خێزان</th>
                <th className="py-3.5 px-4">داهاتی مانگانە</th>
                <th className="py-3.5 px-4">دۆخی دۆسیە</th>
                <th className="py-3.5 px-4 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {beneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">هیچ خێزانێکی سوودمەند تۆمار نەکراوە (سفر تۆمار)</p>
                    <p className="text-xs text-slate-400 mt-1">بۆ دەستپێکردنی تۆمارکردنی فەرمی، کلیک لە دوگمەی «تۆمارکردنی سوودمەندی نوێ» بکە لە سەرەوە</p>
                  </td>
                </tr>
              ) : filteredBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    هیچ کەسێک نەدۆزرایەوە بەپێی ئەم گەڕانە
                  </td>
                </tr>
              ) : (
                filteredBeneficiaries.map(ben => (
                  <tr key={ben.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 text-sm">{ben.fullName}</p>
                      <span className="text-[10px] text-slate-500">تۆمار: {ben.registeredDate}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-mono font-bold text-cyan-700">{ben.nationalId}</p>
                      <p className="text-slate-600 text-[11px]">{ben.phone}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold mb-1 border border-slate-200/60">
                        {ben.governorate}
                      </span>
                      <p className="text-[11px] text-slate-600 max-w-xs truncate">{ben.address}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-amber-700 font-bold block">{categoryLabels[ben.needCategory]}</span>
                      <span className="text-[11px] text-slate-500">{ben.familyMembers} ئەندامی خێزان</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {ben.monthlyIncomeIQD === 0 ? (
                        <span className="text-rose-600 font-bold">بێ داهات</span>
                      ) : (
                        `${ben.monthlyIncomeIQD.toLocaleString()} د.ع`
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {ben.status === 'aided' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> هاوکاریکراو ({ben.aidHistory.length})
                        </span>
                      ) : ben.status === 'approved' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-cyan-600" /> پەسەندکراوە
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3 text-amber-600" /> لەژێر پشکنین
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedBeneficiary(ben)}
                          className="p-1.5 rounded-xl bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors border border-cyan-200/60"
                          title="بینینی دۆسیەی تەواو"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`دڵنیایت لە سڕینەوەی دۆسیەی (${ben.fullName})؟`)) {
                              deleteBeneficiary(ben.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/60"
                          title="سڕینەوە"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beneficiary Details Modal & Aid History Drawer */}
      {selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setSelectedBeneficiary(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-slate-900">{selectedBeneficiary.fullName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    {categoryLabels[selectedBeneficiary.needCategory]}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" /> {selectedBeneficiary.address}
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">ژمارەی ناسنامە:</span>
                <span className="font-mono text-xs font-bold text-cyan-700">{selectedBeneficiary.nationalId}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">مۆبایل:</span>
                <span className="font-bold text-xs text-slate-900">{selectedBeneficiary.phone}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">ئەندامانی خێزان:</span>
                <span className="font-bold text-xs text-amber-700">{selectedBeneficiary.familyMembers} کەس</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">داهاتی مانگانە:</span>
                <span className="font-bold text-xs text-emerald-700">{selectedBeneficiary.monthlyIncomeIQD.toLocaleString()} د.ع</span>
              </div>
            </div>

            {/* Notes */}
            {selectedBeneficiary.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
                <span className="text-xs font-bold text-slate-800 block mb-1">تێبینی و ڕاپۆرتی لێکۆڵینەوە:</span>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedBeneficiary.notes}</p>
              </div>
            )}

            {/* Aid History Timeline */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  مێژووی هاوکارییە وەرگیراوەکان ({selectedBeneficiary.aidHistory.length})
                </h4>
                <button
                  onClick={() => setIsGiveAidModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl liquid-button-primary text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  پێدانی هاوکاری نوێ
                </button>
              </div>

              <div className="space-y-2.5">
                {selectedBeneficiary.aidHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">تاکو ئێستا هیچ هاوکارییەکی پێ نەگەیشتووە</p>
                ) : (
                  selectedBeneficiary.aidHistory.map(aid => (
                    <div
                      key={aid.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {aid.type === 'monetary' ? `${aid.amountIQD?.toLocaleString()} دیناری عێراقی` : `${aid.quantity} ${aid.itemName}`}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {aid.projectTitle} • لەلایەن: {aid.distributedBy}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{aid.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions: Send SMS, Print Card */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsSMSModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-cyan-600" />
                ناردنی نامەی SMS
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                چاپکردنی کارتی خێزان
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Give Aid Modal */}
      {isGiveAidModalOpen && selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              تۆمارکردنی هاوکاری بۆ ({selectedBeneficiary.fullName})
            </h3>

            <form onSubmit={handleGiveAidSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">جۆری هاوکاری:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAidForm({ ...aidForm, type: 'monetary' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      aidForm.type === 'monetary' ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    پارەی نەختینەیی (د.ع)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAidForm({ ...aidForm, type: 'in-kind' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      aidForm.type === 'in-kind' ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    کاڵا و پێداویستی خۆراک
                  </button>
                </div>
              </div>

              {aidForm.type === 'monetary' ? (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بڕی پارە بە دینار:</label>
                  <input
                    type="number"
                    value={aidForm.amountIQD}
                    onChange={(e) => setAidForm({ ...aidForm, amountIQD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ناوی کاڵا:</label>
                    <input
                      type="text"
                      value={aidForm.itemName}
                      onChange={(e) => setAidForm({ ...aidForm, itemName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">ژمارە / دانە:</label>
                    <input
                      type="number"
                      value={aidForm.quantity}
                      onChange={(e) => setAidForm({ ...aidForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">لە چوارچێوەی کام پڕۆژە:</label>
                <input
                  type="text"
                  value={aidForm.projectTitle}
                  onChange={(e) => setAidForm({ ...aidForm, projectTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGiveAidModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پەشیمانبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  پەسەندکردنی هاوکاری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Modal */}
      {isSMSModalOpen && selectedBeneficiary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              ناردنی کورتەنامە (SMS)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              بۆ: {selectedBeneficiary.fullName} ({selectedBeneficiary.phone})
            </p>

            <textarea
              rows={4}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              className="w-full p-3 rounded-2xl liquid-input text-slate-900 text-xs leading-relaxed"
            />

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsSMSModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={handleSendSMS}
                className="px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold"
              >
                ناردنی ئێستا
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Beneficiary Modal with Duplicate Detector Warning */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-600" />
              تۆمارکردنی سوودمەندی نوێ
            </h3>

            {duplicateAlert && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs mb-4 flex items-start gap-2.5 animate-bounce">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="font-bold">هۆشداریی ساختەکاری و دووبارەبوونەوە!</p>
                  <p className="mt-0.5">{duplicateAlert}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitBeneficiary} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ناوی تەواوی کەس / سەرپەرشتیار:</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی نیشتمانی یان ناسنامە:</label>
                  <input
                    type="text"
                    required
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                  <select
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                    <option value="گەرمیان">گەرمیان</option>
                    <option value="زاخۆ">زاخۆ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ناونیشانی ورد (گەڕەک، کۆڵان، نزیکترین شوێن):</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ئەندامانی خێزان:</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.familyMembers}
                    onChange={(e) => setFormData({ ...formData, familyMembers: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">داهاتی مانگانە (دینار):</label>
                  <input
                    type="number"
                    value={formData.monthlyIncomeIQD}
                    onChange={(e) => setFormData({ ...formData, monthlyIncomeIQD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">حاڵەت:</label>
                  <select
                    value={formData.needCategory}
                    onChange={(e) => setFormData({ ...formData, needCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="poor">هەژار و کەمدەرامەت</option>
                    <option value="orphan">بێباوک و هەتیو</option>
                    <option value="sick">نەخۆشی درێژخایەن</option>
                    <option value="disabled">خاوەن پێداویستی تایبەت</option>
                    <option value="student">خوێندکاری هەژار</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی و بارودۆخی تایبەت:</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white text-xs font-bold"
                >
                  تۆمارکردن لە داتابەیس
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
