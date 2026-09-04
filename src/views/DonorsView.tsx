import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Donor, Donation, DonorType, DonationCategory, DonationItemDetails } from '../types';
import {
  HeartHandshake,
  Search,
  Plus,
  Receipt,
  Building2,
  User,
  Send,
  Trash2,
  X,
  Coins,
  Package,
  GraduationCap,
  Shirt,
  Stethoscope,
  Flame,
  Warehouse,
  Truck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';

export const DonorsView: React.FC = () => {
  const {
    donors,
    donations,
    projects,
    addDonor,
    deleteDonor,
    addDonation,
    sendSMS
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

  // New Donation Form State with Rich Categories & Details
  const [donationForm, setDonationForm] = useState({
    donorId: '',
    category: 'cash' as DonationCategory,
    // Cash
    amount: 100000,
    currency: 'IQD' as 'IQD' | 'USD',
    // In-Kind specific fields
    quantity: 50,
    unit: 'کارتۆن / سەبەتە',
    weightKgPerUnit: 15,
    contentsDescription: 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە',
    estimatedMarketValue: 0,
    educationStage: 'سەرەتایی',
    clothingType: 'جلوبەرگی زستانە',
    // Payment method (Default is Cash!)
    method: 'کاش' as Donation['method'],
    date: new Date().toISOString().split('T')[0],
    // Destination (Warehouse, direct distribution, funds, or projects)
    destinationType: 'warehouse',
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
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.receiptNumber.toLowerCase().includes(q) ||
      (d.projectName && d.projectName.toLowerCase().includes(q)) ||
      (d.categoryLabel && d.categoryLabel.toLowerCase().includes(q))
    );
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

  // Reset donation form
  const resetDonationForm = (donorId?: string) => {
    setDonationForm({
      donorId: donorId || (donors.length > 0 ? donors[0].id : ''),
      category: 'cash',
      amount: 100000,
      currency: 'IQD',
      quantity: 50,
      unit: 'کارتۆن / سەبەتە',
      weightKgPerUnit: 15,
      contentsDescription: 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە',
      estimatedMarketValue: 0,
      educationStage: 'سەرەتایی',
      clothingType: 'جلوبەرگی زستانە',
      method: 'کاش',
      date: new Date().toISOString().split('T')[0],
      destinationType: 'warehouse',
      notes: ''
    });
  };

  // Handle Category Change with smart defaults
  const handleCategoryChange = (cat: DonationCategory) => {
    let defaultContents = '';
    let defaultUnit = 'دانە';
    let defaultWeight = 0;
    let defaultMethod = donationForm.method;

    if (cat === 'cash') {
      defaultMethod = 'کاش';
    } else if (cat === 'food_basket') {
      defaultUnit = 'کارتۆن / سەبەتە';
      defaultWeight = 15;
      defaultContents = 'برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'student_supplies') {
      defaultUnit = 'جانتا / پاکێج';
      defaultContents = 'جانتای پشت، دەفتەر، قەڵەم، جێقەڵەم، ئامێری ئەندازە';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'clothes') {
      defaultUnit = 'دەست / پارچە';
      defaultContents = 'چاکەت، پێڵاو، جلوبەرگی زستانەی منداڵان و گەوران';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'medical') {
      defaultUnit = 'دانە / پاکەت';
      defaultContents = 'ویلچێری خاوەن پێداویستی، پێداویستی نەشتەرگەری، دەرمانی درێژخایەن';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'heating_appliances') {
      defaultUnit = 'دانە';
      defaultContents = 'سۆپای نەوت، بەتانی زستانە، فەرش';
      defaultMethod = 'کەرەستە و کاڵا';
    } else if (cat === 'qurbani_meat') {
      defaultUnit = 'کیلۆگرام / سەر ئاژەڵ';
      defaultContents = 'گۆشتی قوربانی دابەشکراو بە پاکێجی تەندروست';
      defaultMethod = 'کەرەستە و کاڵا';
    } else {
      defaultUnit = 'دانە';
      defaultContents = '';
      defaultMethod = 'کەرەستە و کاڵا';
    }

    setDonationForm(prev => ({
      ...prev,
      category: cat,
      unit: defaultUnit,
      weightKgPerUnit: defaultWeight,
      contentsDescription: defaultContents,
      method: defaultMethod
    }));
  };

  const handleAddDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetDonor = donors.find(d => d.id === donationForm.donorId);
    if (!targetDonor) {
      alert('تکایە بەخشەرێک هەڵبژێرە');
      return;
    }

    // Resolve Destination / Allocation Name
    const destNames: Record<string, string> = {
      warehouse: 'کۆگای سەرەکی ڕێکخراو (پاشەکەوتکردن بۆ کاتی پێویست)',
      direct_distribution: 'دابەشکردنی دەستبەجێ و ڕاستەوخۆ بەسەر خێزانە هەژارەکاندا',
      general_fund: 'سندووقی گشتی خێرخوازی و فریاگوزاری خێرا',
      orphan_fund: 'سندووقی چاودێری و کەفالەتی مانگانەی هەتیوان',
      medical_fund: 'سندووقی نەشتەرگەری و دەرمانی کتوپڕ',
      students_fund: 'سندووقی خوێندکاران و پشتیوانی پەروەردە',
      winter_campaign: 'سندووقی کەمپەینی زستانە و سوتەمەنی'
    };

    let finalProjectName = '';
    let finalProjectId: string | undefined = undefined;

    if (donationForm.destinationType.startsWith('proj_')) {
      const pId = donationForm.destinationType.replace('proj_', '');
      const p = projects.find(pr => pr.id === pId);
      finalProjectId = p?.id;
      finalProjectName = p ? `پڕۆژە: ${p.title}` : 'پڕۆژەی دیاریکراو';
    } else {
      finalProjectName = destNames[donationForm.destinationType] || 'سندووقی گشتی خێرخوازی';
    }

    // Resolve Category Label & Items
    const categoryLabelsMap: Record<DonationCategory, string> = {
      cash: 'کۆمەکی نەختینەیی (پارەی کاش)',
      food_basket: 'سەبەتەی خۆراکی',
      student_supplies: 'جانتا و پێداویستی خوێندکاران',
      clothes: 'جلوبەرگ و پۆشاک',
      medical: 'دەرمان و پێداویستی پزیشکی',
      heating_appliances: 'کەلوپەلی ناوماڵ و گەرمکەرەوە',
      qurbani_meat: 'قوربانی و گۆشت',
      other_in_kind: 'کەرەستە و کەلوپەلی تر'
    };

    const isCash = donationForm.category === 'cash';
    const finalAmount = isCash
      ? Number(donationForm.amount)
      : Number(donationForm.estimatedMarketValue || 0);

    let itemDetails: DonationItemDetails | undefined = undefined;
    if (!isCash) {
      itemDetails = {
        quantity: Number(donationForm.quantity) || 1,
        unit: donationForm.unit,
        weightKgPerUnit:
          donationForm.category === 'food_basket'
            ? Number(donationForm.weightKgPerUnit)
            : undefined,
        contentsDescription:
          donationForm.category === 'student_supplies'
            ? `${donationForm.contentsDescription} (قۆناغ: ${donationForm.educationStage})`
            : donationForm.category === 'clothes'
            ? `${donationForm.clothingType} - ${donationForm.contentsDescription}`
            : donationForm.contentsDescription,
        estimatedMarketValue: Number(donationForm.estimatedMarketValue || 0)
      };
    }

    const newDonation = addDonation({
      donorId: targetDonor.id,
      donorName: targetDonor.fullName,
      category: donationForm.category,
      categoryLabel: categoryLabelsMap[donationForm.category],
      itemDetails,
      amount: finalAmount,
      currency: donationForm.currency,
      method: donationForm.method,
      date: donationForm.date,
      projectId: finalProjectId,
      projectName: finalProjectName,
      notes: donationForm.notes
    });

    setIsAddDonationModalOpen(false);
    setActiveReceipt(newDonation);
    resetDonationForm();
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-emerald-600" />
            بەڕێوەبردنی بەخشەران و پسوولەی بەخشین
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تۆماری فەرمی بەخشینە نەختینەیی و عەینییەکان و دروستکردنی پسوولەی ئەلیکترۆنی باوەڕپێکراو
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
              resetDonationForm();
              setIsAddDonationModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
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
        donors.length === 0 ? (
          <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
            <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">هیچ بەخشەرێک تۆمار نەکراوە (سفر تۆمار)</p>
            <p className="text-xs text-slate-400 mt-1">بۆ دەستپێکردنی تۆمارکردنی فەرمی، کلیک لە دوگمەی «بەخشەری نوێ» بکە لە سەرەوە</p>
          </div>
        ) : (
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
                      <span className="text-slate-500">کۆی بەخشینی نەختینەیی (دینار):</span>
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
                      sendSMS(donor.phone, donor.fullName, `بەڕێز ${donor.fullName}، سوپاس و پێزانینی بێپایانی ڕێکخراوی بۆتان بامۆکی قبوڵ بفەرموون بۆ هاوکاری و بەخشندەییتان.`);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    نامەی سوپاس (SMS)
                  </button>

                  <button
                    onClick={() => {
                      resetDonationForm(donor.id);
                      setIsAddDonationModalOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors border border-emerald-200"
                    title="تۆمارکردنی بەخشینی نوێ"
                  >
                    + بەخشین
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`دڵنیایت لە سڕینەوەی بەخشەر [${donor.fullName}]؟`)) {
                        deleteDonor(donor.id);
                      }
                    }}
                    className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors border border-rose-200"
                    title="سڕینەوەی بەخشەر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* View 2: Official Receipts Table */}
      {activeSubTab === 'donations' && (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-3.5 px-4">ژمارەی پسوولە</th>
                  <th className="py-3.5 px-4">ناوی بەخشەر / جۆری بەخشین</th>
                  <th className="py-3.5 px-4">بڕ / بەها</th>
                  <th className="py-3.5 px-4">شێوازی ڕادەستکردن</th>
                  <th className="py-3.5 px-4">مەبەست و شوێنی بەخشین</th>
                  <th className="py-3.5 px-4">بەروار</th>
                  <th className="py-3.5 px-4 text-center">پسوولەی فەرمی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700">هیچ پسوولەیەکی بەخشین تۆمار نەکراوە (سفر تۆمار)</p>
                      <p className="text-xs text-slate-400 mt-1">بۆ تۆمارکردنی بەخشینی نوێ، کلیک لە دوگمەی «تۆمارکردنی بەخشین + پسوولە» بکە لە سەرەوە</p>
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map(don => (
                    <tr key={don.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-700">
                        {don.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{don.donorName}</p>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                          {don.categoryLabel || 'کۆمەکی نەختینەیی'}
                          {don.itemDetails?.quantity ? ` (${don.itemDetails.quantity} ${don.itemDetails.unit || ''})` : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {don.amount > 0 ? (
                          <span className="font-black text-emerald-700 text-sm">
                            {don.amount.toLocaleString()} {don.currency === 'IQD' ? 'د.ع' : '$'}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-bold">بەخشینی عەینی</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                          {don.method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
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
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی:</label>
                <textarea
                  rows={2}
                  value={donorForm.notes}
                  onChange={(e) => setDonorForm({ ...donorForm, notes: e.target.value })}
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

      {/* Modal: Add Donation with Rich Category Selection & Details */}
      {isAddDonationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
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
              
              {/* Select Donor */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">دیاریکردنی بەخشەر:</label>
                <select
                  required
                  value={donationForm.donorId}
                  onChange={(e) => setDonationForm({ ...donationForm, donorId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                >
                  {donors.length === 0 ? (
                    <option value="">هیچ بەخشەرێک تۆمار نەکراوە - تکایە سەرەتا بەخشەر تۆمار بکە</option>
                  ) : (
                    donors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.phone})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Requirement 1: Category of Fund (پۆلێنی بەخشین) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-slate-800 font-bold text-sm">
                  ۱. پۆلێن و جۆری بەخشین (Category of Fund):
                </label>

                <select
                  value={donationForm.category}
                  onChange={(e) => handleCategoryChange(e.target.value as DonationCategory)}
                  className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold text-xs sm:text-sm"
                >
                  <option value="cash">💰 کۆمەکی نەختینەیی (پارەی کاش)</option>
                  <option value="food_basket">📦 سەبەتەی خۆراکی (Food Aid Boxes)</option>
                  <option value="student_supplies">🎒 جانتا و پێداویستی خوێندکاران (Student Bags)</option>
                  <option value="clothes">👕 جلوبەرگ و پۆشاک (Clothing & Apparel)</option>
                  <option value="medical">🩺 دەرمان و پێداویستی پزیشکی (Medical Supplies)</option>
                  <option value="heating_appliances">🔥 کەلوپەلی ناوماڵ و گەرمکەرەوە (Home & Heating)</option>
                  <option value="qurbani_meat">🥩 قوربانی و بەخشینی گۆشت (Qurbani / Meat)</option>
                  <option value="other_in_kind">🎁 کەرەستە و کەلوپەلی تر (Other In-Kind)</option>
                </select>

                {/* DYNAMIC CATEGORY DETAILS */}
                {/* 1. If Cash: show cash amount & currency */}
                {donationForm.category === 'cash' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 animate-in fade-in">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">بڕی پارەی بەخشراو:</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={donationForm.amount}
                        onChange={(e) => setDonationForm({ ...donationForm, amount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-base font-bold font-mono"
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
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          دینار (IQD)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDonationForm({ ...donationForm, currency: 'USD' })}
                          className={`py-2 rounded-xl font-bold border transition-all ${
                            donationForm.currency === 'USD'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          دۆلار (USD $)
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. If In-Kind Category: Show common details (boxes, weight, ingredients, bags, etc.) */
                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-3 pt-3 animate-in fade-in">
                    
                    {/* Food Aid specific details */}
                    {donationForm.category === 'food_basket' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی سەبەتە / کارتۆنی خۆراک:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={donationForm.quantity}
                              onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">کێشی هەر کارتۆنێک (کیلۆگرام):</label>
                            <input
                              type="number"
                              min={1}
                              value={donationForm.weightKgPerUnit}
                              onChange={(e) => setDonationForm({ ...donationForm, weightKgPerUnit: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">پێکهاتە و ناوەرۆکی سەبەتەکە (کەلوپەلەکان):</label>
                          <textarea
                            rows={2}
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="نموونە: برنج 5کگم، شەکر 3کگم، زەیت 2لیتر، ئارد، نیسک، چا، دۆشاوی تەماتە"
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 leading-relaxed"
                          />
                        </div>
                      </>
                    )}

                    {/* Student Bags specific details */}
                    {donationForm.category === 'student_supplies' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی جانتا / پاکێجی خوێندکار:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={donationForm.quantity}
                              onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">قۆناغی خوێندن:</label>
                            <select
                              value={donationForm.educationStage}
                              onChange={(e) => setDonationForm({ ...donationForm, educationStage: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                            >
                              <option value="سەرەتایی">پۆلەکانی سەرەتایی (١ تا ٦)</option>
                              <option value="ناوەندی">پۆلەکانی ناوەندی (٧ تا ٩)</option>
                              <option value="ئامادەیی">پۆلەکانی ئامادەیی (١٠ تا ١٢)</option>
                              <option value="زانکۆ">خوێندکارانی پەیمانگە و زانکۆ</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">پێکهاتە و کەلوپەلی ناو جانتا:</label>
                          <input
                            type="text"
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="جانتای پشت، دەفتەر، قەڵەم، جێقەڵەم، ئامێری ئەندازە..."
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Clothing specific details */}
                    {donationForm.category === 'clothes' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">ژمارەی دەست / پارچە جلوبەرگ:</label>
                            <input
                              type="number"
                              min={1}
                              required
                              value={donationForm.quantity}
                              onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-700 font-bold mb-1">جۆری پۆشاک:</label>
                            <select
                              value={donationForm.clothingType}
                              onChange={(e) => setDonationForm({ ...donationForm, clothingType: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                            >
                              <option value="جلوبەرگی زستانە">جلوبەرگی زستانە (چاکەت، کڵاو، دەستکێش)</option>
                              <option value="جلوبەرگی هاوینە">جلوبەرگی هاوینە</option>
                              <option value="جلی جەژن بۆ هەتیوان">جلی جەژن بۆ هەتیوان و منداڵان</option>
                              <option value="پێڵاو">پێڵاوی تازە</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1">وەسف و تێبینی لەسەر پۆشاکەکە:</label>
                          <input
                            type="text"
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="نموونە: چاکەتی کوڕان و کچان بە قەبارەی جیاواز"
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    {/* Medical / Appliances / Qurbani / Other details */}
                    {['medical', 'heating_appliances', 'qurbani_meat', 'other_in_kind'].includes(donationForm.category) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">بڕ و ژمارەی بەخشراو:</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={donationForm.quantity}
                            onChange={(e) => setDonationForm({ ...donationForm, quantity: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">وەسف و جۆری کەرەستەکە:</label>
                          <input
                            type="text"
                            required
                            value={donationForm.contentsDescription}
                            onChange={(e) => setDonationForm({ ...donationForm, contentsDescription: e.target.value })}
                            placeholder="نموونە: ویلچێر، سۆپا، گۆشتی قوربانی..."
                            className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    {/* Estimated Value (Optional for in-kind) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          بەهای خەمڵێنراوی تەواوی کۆمەکەکە (ئارەزوومەندانە):
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={donationForm.estimatedMarketValue || ''}
                          onChange={(e) =>
                            setDonationForm({ ...donationForm, estimatedMarketValue: Number(e.target.value) })
                          }
                          placeholder="0 د.ع"
                          className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">دراوی خەمڵاندن:</label>
                        <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => setDonationForm({ ...donationForm, currency: 'IQD' })}
                            className={`py-2 rounded-xl font-bold border transition-all ${
                              donationForm.currency === 'IQD'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
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
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            دۆلار (USD $)
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Requirement 2: Default payment style is Cash & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ۲. شێوازی پێدان / ڕادەستکردن:
                  </label>
                  <select
                    value={donationForm.method}
                    onChange={(e) => setDonationForm({ ...donationForm, method: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <option value="کاش">💵 کاش (دەستی) - نەختینە</option>
                    <option value="FIB">🏦 بانکی یەکەمی عێراق FIB</option>
                    <option value="FastPay">📱 فاست پەی FastPay</option>
                    <option value="ZainCash">📲 زەین کاش ZainCash</option>
                    <option value="حەواڵەی بانکی">🏛️ حەواڵەی بانکی / ئەلیکترۆنی</option>
                    <option value="کەرەستە و کاڵا">📦 کەرەستە و کاڵای عەینی (ڕادەستکردنی مەیدانی)</option>
                  </select>
                </div>

                {/* Requirement 3: Funding destination - Warehouse, Direct Distribution, Funds, Projects */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ۳. ئاراستە و مەبەستی بەخشین:
                  </label>
                  <select
                    value={donationForm.destinationType}
                    onChange={(e) => setDonationForm({ ...donationForm, destinationType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white font-bold"
                  >
                    <optgroup label="🏢 کۆگا و پاشەکەوتکردن (Warehouse & Storage)">
                      <option value="warehouse">کۆگای سەرەکی ڕێکخراو (پاشەکەوتکردن بۆ کاتی پێویست و فریاگوزاری)</option>
                    </optgroup>

                    <optgroup label="🤝 دابەشکردنی خێرا (Direct Distribution)">
                      <option value="direct_distribution">دابەشکردنی دەستبەجێ و ڕاستەوخۆ بەسەر خێزانە هەژارەکاندا</option>
                    </optgroup>

                    <optgroup label="🛡️ سندووقە فەرمییەکان (Designated Funds)">
                      <option value="general_fund">سندووقی گشتی خێرخوازی و فریاگوزاری خێرا</option>
                      <option value="orphan_fund">سندووقی چاودێری و کەفالەتی مانگانەی هەتیوان</option>
                      <option value="medical_fund">سندووقی نەشتەرگەری و دەرمانی کتوپڕ</option>
                      <option value="students_fund">سندووقی خوێندکاران و پشتیوانی پەروەردە</option>
                      <option value="winter_campaign">سندووقی کەمپەینی زستانە و سوتەمەنی</option>
                    </optgroup>

                    {projects.length > 0 && (
                      <optgroup label="📋 پڕۆژە فەرمییەکان (Active Projects)">
                        {projects.map(p => (
                          <option key={p.id} value={`proj_${p.id}`}>
                            پڕۆژەی دیاریکراو: {p.title}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Receipt Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی سەر پسوولە:</label>
                <input
                  type="text"
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  placeholder="هەر تێبینییەک لەسەر وەرگرتنی ئەم بەخشینە..."
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
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold shadow-md hover:shadow-lg transition-all"
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
