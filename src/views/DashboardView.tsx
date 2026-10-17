import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Users,
  HeartHandshake,
  FolderKanban,
  UserCheck,
  Package,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Filter,
  RotateCcw,
  Search,
  Eye,
  X,
  Download,
  Printer,
  BarChart3
} from 'lucide-react';
import { aggregateAmountsByDayRate, getExchangeRateForDate } from '../utils/exchangeRates';

type ActiveModalType = 'donations' | 'beneficiaries' | 'projects' | 'volunteers' | 'impact-report' | null;

export const DashboardView: React.FC = () => {
  const {
    beneficiaries,
    donations,
    transactions,
    projects,
    volunteers,
    donors,
    currencyView,
    setActiveTab
  } = useApp();

  // Find first and last record dates dynamically across all records
  const { minRecordDate, maxRecordDate } = React.useMemo(() => {
    const allDates: string[] = [
      ...beneficiaries.map(b => b.registeredDate),
      ...donations.map(d => d.date),
      ...beneficiaries.flatMap(b => b.aidHistory.map(a => a.date)),
      ...projects.map(p => p.startDate),
      ...projects.map(p => p.endDate)
    ].filter(Boolean).sort();

    return {
      minRecordDate: allDates.length > 0 ? allDates[0] : `${new Date().getFullYear()}-01-01`,
      maxRecordDate: allDates.length > 0 ? allDates[allDates.length - 1] : `${new Date().getFullYear()}-12-31`
    };
  }, [beneficiaries, donations, projects]);

  // Filters State: Exact From & To Dates of Years (Default: from first record date to last record date)
  const [fromDate, setFromDate] = useState<string>(minRecordDate);
  const [toDate, setToDate] = useState<string>(maxRecordDate);
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Detailed Modal State (Clickable KPI cards)
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);

  // Update default dates if dataset changes
  React.useEffect(() => {
    if (minRecordDate && !fromDate) setFromDate(minRecordDate);
    if (maxRecordDate && !toDate) setToDate(maxRecordDate);
  }, [minRecordDate, maxRecordDate]);

  // Helper date checker: checks if a record date falls within [fromDate, toDate]
  const matchesTime = (dateStr?: string) => {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  // Filtered Beneficiaries
  const filteredBeneficiaries = beneficiaries.filter(b => {
    const matchTime = matchesTime(b.registeredDate);
    const matchGov = governorateFilter === 'all' || b.governorate === governorateFilter;
    const matchCat = categoryFilter === 'all' || b.needCategory === categoryFilter;
    const matchSearch = !searchQuery || b.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || b.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTime && matchGov && matchCat && matchSearch;
  });

  // Filtered Donations
  const filteredDonations = donations.filter(d => {
    const matchTime = matchesTime(d.date);
    const donor = donors.find(dn => dn.id === d.donorId);
    const matchGov = governorateFilter === 'all' || (donor && donor.governorate === governorateFilter);
    const matchSearch = !searchQuery || d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) || d.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTime && matchGov && matchSearch;
  });

  // Filtered Projects
  const filteredProjects = projects.filter(p => {
    const matchGov = governorateFilter === 'all' || p.governorates.includes(governorateFilter);
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGov && matchSearch;
  });

  // Filtered Volunteers
  const filteredVolunteers = volunteers.filter(v => {
    const matchGov = governorateFilter === 'all' || v.governorate === governorateFilter;
    const matchSearch = !searchQuery || v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchGov && matchSearch;
  });

  // Filtered Calculations - Synchronized day-by-day exchange rate aggregation
  const donationsAgg = aggregateAmountsByDayRate(filteredDonations);
  const totalDonationsIQD = donationsAgg.totalIQD;
  const totalDonationsUSD = donationsAgg.totalUSD;

  const totalBeneficiaries = filteredBeneficiaries.length;
  const aidedBeneficiaries = filteredBeneficiaries.filter(b => b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)).length;
  const activeProjectsCount = filteredProjects.filter(p => p.status === 'active').length;
  const totalVolunteerHours = filteredVolunteers.reduce((sum, v) => sum + v.hoursLogged, 0);


  // Recent aid activities across filtered beneficiaries
  const recentAids = filteredBeneficiaries
    .flatMap(b => b.aidHistory.map(a => ({ ...a, beneficiaryName: b.fullName, beneficiaryGov: b.governorate })))
    .filter(a => matchesTime(a.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Category counts for beneficiaries
  const categoriesMap: Record<string, number> = {
    'هەژار و کەمدەرامەت': filteredBeneficiaries.filter(b => b.needCategory === 'poor').length,
    'بێباوک و هەتیو': filteredBeneficiaries.filter(b => b.needCategory === 'orphan').length,
    'نەخۆش و دەستکورت': filteredBeneficiaries.filter(b => b.needCategory === 'sick').length,
    'خاوەن پێداویستی تایبەت': filteredBeneficiaries.filter(b => b.needCategory === 'disabled').length,
    'خوێندکاری هەژار': filteredBeneficiaries.filter(b => b.needCategory === 'student').length,
    'ئاوارە و پەنابەر': filteredBeneficiaries.filter(b => b.needCategory === 'displaced').length,
  };

  // Governorate distribution for SVG visualization
  const governoratesBreakdown = React.useMemo(() => {
    const govList = ['سلێمانی', 'هەولێر', 'دهۆک', 'هەڵەبجە', 'کەرکووک', 'گەرمیان', 'زاخۆ'];
    return govList.map(gov => {
      const total = filteredBeneficiaries.filter(b => b.governorate === gov).length;
      const aided = filteredBeneficiaries.filter(b => b.governorate === gov && (b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0))).length;
      return { gov, total, aided };
    }).filter(g => g.total > 0 || governorateFilter === g.gov);
  }, [filteredBeneficiaries, governorateFilter]);

  const isAnyFilterActive = fromDate !== minRecordDate || toDate !== maxRecordDate || governorateFilter !== 'all' || categoryFilter !== 'all' || searchQuery !== '';

  const resetFilters = () => {
    setFromDate(minRecordDate);
    setToDate(maxRecordDate);
    setGovernorateFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const exportImpactReport = () => {
    const report = [
      `ڕاپۆرتی کاریگەری و شەفافییەت - ڕێکخراوی بۆتان بامۆکی`,
      `بەرواری هەناردەکردن: ${new Date().toLocaleDateString('ckb-IQ')} - ${new Date().toLocaleTimeString()}`,
      `ماوەی فلتەرکراو: لە ${fromDate} بۆ ${toDate}`,
      `پارێزگا: ${governorateFilter}`,
      `حاڵەت: ${categoryFilter}`,
      `------------------------------------------------`,
      `کۆی خێزانە سوودمەندەکان: ${totalBeneficiaries}`,
      `خێزانە هاوکاریکراوەکان: ${aidedBeneficiaries} (${Math.round((aidedBeneficiaries / (totalBeneficiaries || 1)) * 100)}%)`,
      `کۆی بەخشین (دینار): ${totalDonationsIQD.toLocaleString()} د.ع`,
      `کۆی بەخشین (دۆلار): $${totalDonationsUSD.toLocaleString()}`,
      `پڕۆژە چالاکەکان: ${activeProjectsCount}`,
      `کۆی کاتژمێری خزمەتی خۆبەخشان: ${totalVolunteerHours} کاتژمێر`,
      `ژمارەی بەخشینەکان: ${filteredDonations.length}`,
      `------------------------------------------------`,
      `دوایین چالاکییە مەیدانییەکان:`,
      ...recentAids.map((a, i) => `${i+1}. ${a.beneficiaryName} - ${a.projectTitle} (${a.type === 'monetary' ? `${a.amountIQD?.toLocaleString()} د.ع` : `${a.quantity} ${a.itemName}`}) - ${a.date}`)
    ].join('\n');

    const blob = new Blob(["\uFEFF" + report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bamboki_impact_report_${fromDate}_${toDate}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Welcome Hero Banner with Balanced Responsive Proportions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-cyan-50/70 to-blue-50/80 p-6 sm:p-8 lg:p-10 border border-sky-200/90 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-cyan-100/90 text-cyan-800 border border-cyan-200 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-4 h-4 text-cyan-700" />
                داشبۆردی شیكاری و چاودێری ڕاستەوخۆ
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              بەخێربێن بۆ سیستەمی بەڕێوەبردنی خێرخوازی
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed font-normal">
              تۆمارکردن، دابەشکردنی کۆمەک و شەفافییەتی تەواوی دارایی لەسەر ئاستی سەرجەم شار و ناوچەکانی کوردستان.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto shrink-0">
            <button
              onClick={() => setActiveModal('impact-report')}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl liquid-button-primary text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
              title="چاپکردن و بینینی ڕاپۆرتی فەرمی کاریگەری (A4 PDF)"
            >
              <Printer className="w-4 h-4" />
              <span>ڕاپۆرتی فەرمی (چاپ/PDF)</span>
            </button>
            <button
              onClick={exportImpactReport}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
              title="داگرتنی پوختەی ئاماری فلتەرکراو"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>داگرتنی TXT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Dashboard Filter Bar with Balanced 4-Column Responsive Grid */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">فلتەرکردنی زانیاری و ئامارەکانی داشبۆرد</h3>
          </div>
          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>سڕینەوەی فلتەرەکان</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          
          {/* 1. Time Period Filter: Exact From & To Dates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700">ماوەی کات (لە - بۆ):</label>
              <span className="text-xs text-cyan-800 font-mono font-bold bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                {fromDate} ⬅ {toDate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="text-xs text-slate-400 absolute right-2.5 top-2.5 pointer-events-none font-bold">لە:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full h-11 pe-7 ps-2 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 font-mono bg-white font-bold"
                  title="لە بەرواری (From Date)"
                />
              </div>
              <div className="relative">
                <span className="text-xs text-slate-400 absolute right-2.5 top-2.5 pointer-events-none font-bold">بۆ:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full h-11 pe-7 ps-2 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 font-mono bg-white font-bold"
                  title="بۆ بەرواری (To Date)"
                />
              </div>
            </div>
          </div>

          {/* 2. Governorate Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">پارێزگا و ناوچە:</label>
            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
            >
              <option value="all">هەموو پارێزگاکان</option>
              <option value="هەولێر">هەولێر</option>
              <option value="سلێمانی">سلێمانی</option>
              <option value="دهۆک">دهۆک</option>
              <option value="هەڵەبجە">هەڵەبجە</option>
              <option value="کەرکووک">کەرکووک</option>
              <option value="گەرمیان">گەرمیان</option>
              <option value="زاخۆ">زاخۆ</option>
            </select>
          </div>

          {/* 3. Category Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">حاڵەتی سوودمەند:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-11 px-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 cursor-pointer bg-white font-bold"
            >
              <option value="all">هەموو حاڵەتەکان</option>
              <option value="poor">هەژار و کەمدەرامەت</option>
              <option value="orphan">بێباوک و هەتیو</option>
              <option value="sick">نەخۆش و دەستکورت</option>
              <option value="disabled">خاوەن پێداویستی تایبەت</option>
              <option value="student">خوێندکاری هەژار</option>
              <option value="displaced">ئاوارە و پەنابەر</option>
            </select>
          </div>

          {/* 4. Search Query */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">گەڕانی دەقی لە داشبۆرد:</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بەپێی ناو یان ناونیشان..."
                className="w-full h-11 pe-10 ps-3.5 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 placeholder-slate-400 font-bold"
              />
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards Grid with Elevated Kurdish Typography and Proportions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: Donations (Clickable) */}
        <div
          onClick={() => setActiveModal('donations')}
          className="rounded-3xl bg-gradient-to-b from-sky-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-cyan-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری بەخشینەکان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600 group-hover:text-cyan-800 transition-colors">کۆی بەخشینەکان</span>
              <div className="w-12 h-12 rounded-2xl bg-cyan-100/70 border border-cyan-200/80 flex items-center justify-center text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {currencyView === 'IQD'
                  ? `${totalDonationsIQD.toLocaleString()} د.ع`
                  : `$${totalDonationsUSD.toLocaleString()}`}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1.5 font-mono">
                {currencyView === 'IQD'
                  ? `هاوتای $${totalDonationsUSD.toLocaleString()} دۆلار (بە نرخی فەرمی ڕۆژ)`
                  : `هاوتای ${totalDonationsIQD.toLocaleString()} دینار (بە نرخی فەرمی ڕۆژ)`}
              </p>
              {donationsAgg.directIQD > 0 && donationsAgg.directUSD > 0 && (
                <div className="text-[11px] font-mono text-slate-400 mt-1">
                  نەختینەی ڕاستەوخۆ: {donationsAgg.directIQD.toLocaleString()} د.ع + ${donationsAgg.directUSD.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-cyan-700 font-bold flex items-center gap-1.5 group-hover:translate-x-[-3px] transition-transform">
              <Eye className="w-4 h-4" /> بینینی تەواوی وردەکاری
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{filteredDonations.length} بەخشین</span>
          </div>
        </div>

        {/* KPI 2: Beneficiaries (Clickable) */}
        <div
          onClick={() => setActiveModal('beneficiaries')}
          className="rounded-3xl bg-gradient-to-b from-emerald-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری خێزانەکان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600 group-hover:text-emerald-800 transition-colors">خێزانە سوودمەندەکان</span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 border border-emerald-200/80 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {totalBeneficiaries} <span className="text-base sm:text-lg font-normal text-slate-500 font-sans">خێزان</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1.5 font-bold">
                {aidedBeneficiaries} خێزان هاوکاری وەرگرتووە ({totalBeneficiaries > 0 ? Math.round((aidedBeneficiaries / totalBeneficiaries) * 100) : 0}٪)
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 group-hover:translate-x-[-3px] transition-transform">
              <Eye className="w-4 h-4" /> بینینی دۆسیەی خێزانەکان
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{totalBeneficiaries - aidedBeneficiaries} چاوەڕوان</span>
          </div>
        </div>

        {/* KPI 3: Projects (Clickable) */}
        <div
          onClick={() => setActiveModal('projects')}
          className="rounded-3xl bg-gradient-to-b from-purple-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-purple-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری پڕۆژەکان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600 group-hover:text-purple-800 transition-colors">پڕۆژە چالاکەکان</span>
              <div className="w-12 h-12 rounded-2xl bg-purple-100/70 border border-purple-200/80 flex items-center justify-center text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                <FolderKanban className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {activeProjectsCount} <span className="text-base sm:text-lg font-normal text-slate-500 font-sans">پڕۆژەی بەردەوام</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-bold">
                لە کۆی {filteredProjects.length} پڕۆژەی پلان بۆ داڕێژراو
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-purple-700 font-bold flex items-center gap-1.5 group-hover:translate-x-[-3px] transition-transform">
              <Eye className="w-4 h-4" /> بینینی پێشکەوتنی کەمپەینەکان
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{filteredProjects.length} پڕۆژە</span>
          </div>
        </div>

        {/* KPI 4: Volunteer Service (Clickable) */}
        <div
          onClick={() => setActiveModal('volunteers')}
          className="rounded-3xl bg-gradient-to-b from-amber-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-amber-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری تیمی خۆبەخشان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold text-slate-600 group-hover:text-amber-800 transition-colors">خزمەتی خۆبەخشان</span>
              <div className="w-12 h-12 rounded-2xl bg-amber-100/70 border border-amber-200/80 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {totalVolunteerHours} <span className="text-base sm:text-lg font-normal text-slate-500 font-sans">کاتژمێر</span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800 mt-1.5 font-bold">
                {filteredVolunteers.length} خۆبەخش لە مەیداندا
              </p>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-amber-700 font-bold flex items-center gap-1.5 group-hover:translate-x-[-3px] transition-transform">
              <Eye className="w-4 h-4" /> بینینی تیمی خۆبەخشان
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{filteredVolunteers.length} کەس</span>
          </div>
        </div>

      </div>

      {/* Visual Analytics & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Needs Category Visual Bar Distribution */}
        <div className="lg:col-span-1 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">پۆلێنکردنی حاڵەتەکان</h3>
              <p className="text-xs text-slate-500 mt-0.5">بەپێی بارودۆخی خێزانەکان</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800">
              {totalBeneficiaries} کەس
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(categoriesMap).map(([cat, count]) => {
              const percent = Math.round((count / (totalBeneficiaries || 1)) * 100);
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold">{cat}</span>
                    <span className="font-bold text-slate-900">{count} ({percent}٪)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Aid Distribution Stream */}
        <div className="lg:col-span-2 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">دوایین هاوکارییە دابەشکراوەکان</h3>
              <p className="text-xs text-slate-500 mt-0.5">چالاکیی مەیدانی ڕاستەوخۆی ئەم دواییە</p>
            </div>
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition-colors"
            >
              بینینی هەموو <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {recentAids.length === 0 ? (
              <div className="py-8 text-center space-y-1.5 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                <p className="text-sm text-slate-600 font-bold">هیچ هاوکارییەک تۆمار نەکراوە (سفر تۆمار)</p>
                <p className="text-xs text-slate-400">بە تۆمارکردنی سوودمەندان و دابەشکردنی کۆمەک، چالاکییەکان لێرەدا دەردەکەون</p>
              </div>
            ) : (
              recentAids.map((aid) => (
                <div
                  key={aid.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-800 font-bold shrink-0">
                      {aid.type === 'monetary' ? 'د.ع' : <Package className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{aid.beneficiaryName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        {aid.projectTitle} • پارێزگای {aid.beneficiaryGov}
                      </p>
                    </div>
                  </div>

                  <div className="text-start">
                    <span className="text-sm font-black text-cyan-800 block">
                      {aid.type === 'monetary'
                        ? `${aid.amountIQD?.toLocaleString()} دینار`
                        : `${aid.quantity} ${aid.itemName}`}
                    </span>
                    <span className="text-xs text-slate-400 font-medium font-mono">{aid.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Interactive SVG Aid Coverage Gauge & Governorate Distribution Chart */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100/80 border border-cyan-200 flex items-center justify-center text-cyan-700">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">نەخشەی ئاماری ڕووماڵکردنی خێزانەکان بەپێی پارێزگا</h3>
              <p className="text-xs text-slate-500">بەراوردی خێزانە تۆمارکراوەکان و هاوکاریکراوەکان لەسەر ئاستی شارەکان</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" /> کۆی تۆمارکراو ({totalBeneficiaries})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> هاوکاریکراو ({aidedBeneficiaries})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
          {/* SVG Donut Ring Gauge */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
            {(() => {
              const coveragePct = totalBeneficiaries > 0 ? Math.round((aidedBeneficiaries / totalBeneficiaries) * 100) : 0;
              const radius = 52;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (coveragePct / 100) * circumference;
              return (
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128" aria-label="ڕێژەی هاوکاریکردن">
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="transparent"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r={radius}
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-slate-900 font-mono">{coveragePct}٪</span>
                    <span className="text-[11px] font-bold text-emerald-700">ڕووماڵکراو</span>
                  </div>
                </div>
              );
            })()}
            <p className="text-xs font-bold text-slate-600 mt-2 text-center">
              {aidedBeneficiaries} لە {totalBeneficiaries} خێزان کۆمەکیان پێگەیشتووە
            </p>
          </div>

          {/* Governorate Comparative Bars */}
          <div className="lg:col-span-3 space-y-3">
            {governoratesBreakdown.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8 font-bold">هیچ تۆمارێک بۆ ئەم فلتەرە بەردەست نییە</p>
            ) : (
              governoratesBreakdown.map(({ gov, total, aided }) => {
                const maxGov = Math.max(1, ...governoratesBreakdown.map(g => g.total));
                const totalWidth = Math.round((total / maxGov) * 100);
                const aidedWidth = Math.round((aided / maxGov) * 100);
                const govPct = total > 0 ? Math.round((aided / total) * 100) : 0;
                return (
                  <div key={gov} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{gov}</span>
                      <span className="font-mono font-bold text-slate-600">
                        <span className="text-emerald-700">{aided} هاوکاریکراو</span> / {total} خێزان ({govPct}٪)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200/70">
                      <div
                        className="h-full rounded-full bg-cyan-200 transition-all duration-500"
                        style={{ width: `${totalWidth}%` }}
                      />
                      <div
                        className="h-full rounded-full bg-emerald-500 absolute top-0 right-0 transition-all duration-700"
                        style={{ width: `${aidedWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Launchpad Buttons */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-600" />
          دەستپێشخەری و کرداری خێرا
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('beneficiaries')}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-200 text-center transition-all group shadow-sm hover:shadow"
          >
            <Users className="w-7 h-7 text-cyan-600 mx-auto mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">تۆماری خێزانی هەژار</span>
          </button>
          
          <button
            onClick={() => setActiveTab('donors')}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-center transition-all group shadow-sm hover:shadow"
          >
            <HeartHandshake className="w-7 h-7 text-emerald-600 mx-auto mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">تۆمار و پسوولەی بەخشین</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200 text-center transition-all group shadow-sm hover:shadow"
          >
            <Package className="w-7 h-7 text-amber-600 mx-auto mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">دابەشکردنی کاڵای کۆگا</span>
          </button>

          <button
            onClick={() => setActiveTab('geo')}
            className="p-4 sm:p-5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-center transition-all group shadow-sm hover:shadow"
          >
            <FolderKanban className="w-7 h-7 text-purple-600 mx-auto mb-2 transition-transform group-hover:scale-110" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">نەخشەی هاوکاری شارەکان</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUIREMENT 2 MODALS: Full Details for each of the 4 Green-Highlighted Cards */}
      {/* ========================================================================= */}

      {/* MODAL 1: Full Details for Donations (کۆی بەخشینەکان) */}
      {activeModal === 'donations' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">تەواوی وردەکاری و لیستی بەخشینەکان</h3>
                <p className="text-xs sm:text-sm text-slate-500">بەدواداچوونی سەرجەم داهاتە نەختینەییەکان و پسوولەکان</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200">
                <span className="text-xs font-bold text-cyan-800 block">کۆی بەخشین (دینار بە نرخی ڕۆژ):</span>
                <span className="text-lg font-black text-cyan-900">{totalDonationsIQD.toLocaleString()} د.ع</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 block">کۆی بەخشین (دۆلار بە نرخی ڕۆژ):</span>
                <span className="text-lg font-black text-emerald-900">${totalDonationsUSD.toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-purple-800 block">ژمارەی بەخشینەکان:</span>
                <span className="text-lg font-black text-purple-900">{filteredDonations.length} پسوولە</span>
              </div>
            </div>

            {/* Donations Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-700">
                لیستی بەخشینە تۆمارکراوەکان ({filteredDonations.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {filteredDonations.length === 0 ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-bold">
                    هیچ بەخشینێک تۆمار نەکراوە (سفر پسوولە)
                  </div>
                ) : (
                  filteredDonations.map(d => {
                    const dayRate = d.exchangeRateAtDate || getExchangeRateForDate(d.date).rate;
                    const conv = d.convertedAmount || (
                      d.currency === 'IQD'
                        ? Number((d.amount / dayRate).toFixed(2))
                        : Math.round(d.amount * dayRate)
                    );
                    return (
                      <div key={d.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="font-bold text-slate-900">{d.donorName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{d.receiptNumber} • {d.method} • {d.date}</p>
                        </div>
                        <div className="text-start">
                          <span className="font-black text-emerald-700 text-sm block">
                            {d.amount.toLocaleString()} {d.currency === 'IQD' ? 'د.ع' : '$'}
                          </span>
                          {d.amount > 0 && (
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 justify-end mt-0.5" title={`نرخی بۆرسەی ڕۆژ: 1$ = ${dayRate.toLocaleString()} د.ع`}>
                              <span className="text-cyan-700 font-bold">
                                {d.currency === 'IQD' ? `≈ $${conv.toLocaleString()}` : `≈ ${conv.toLocaleString()} د.ع`}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded border border-slate-200">
                                {dayRate.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-slate-500 mt-0.5">{d.projectName || 'سندووقی گشتی'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('donors');
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md"
              >
                <span>چوون بۆ پەڕەی تەواوی بەخشەران</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Details for Beneficiaries (خێزانە سوودمەندەکان) */}
      {activeModal === 'beneficiaries' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">تەواوی وردەکاری خێزانە سوودمەندەکان</h3>
                <p className="text-xs sm:text-sm text-slate-500">دۆسیەی تەواوی خێزانە پەسەندکراوەکان و چاوەڕوانکراوەکان</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block font-bold">کۆی خێزانەکان:</span>
                <span className="text-lg font-black text-slate-900">{totalBeneficiaries} خێزان</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-xs text-emerald-800 block font-bold">هاوکاریکراو:</span>
                <span className="text-lg font-black text-emerald-900">{aidedBeneficiaries}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-center">
                <span className="text-xs text-cyan-800 block font-bold">پەسەندکراو:</span>
                <span className="text-lg font-black text-cyan-900">{filteredBeneficiaries.filter(b => b.status === 'approved').length}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-xs text-amber-800 block font-bold">لەژێر پشکنین:</span>
                <span className="text-lg font-black text-amber-900">{filteredBeneficiaries.filter(b => b.status === 'pending').length}</span>
              </div>
            </div>

            {/* Beneficiaries List */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-700">
                لیستی خێزانەکان ({filteredBeneficiaries.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {filteredBeneficiaries.length === 0 ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-bold">
                    هیچ خێزانێکی سوودمەند تۆمار نەکراوە (سفر خێزان)
                  </div>
                ) : (
                  filteredBeneficiaries.map(b => (
                    <div key={b.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{b.fullName}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{b.governorate} • {b.address} • {b.familyMembers} کەس</p>
                      </div>
                      <div className="text-start flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          {b.status === 'pending' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              لەژێر لێکۆڵینەوە
                            </span>
                          ) : b.status === 'confidential' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              نهێنی
                            </span>
                          ) : b.status === 'urgent' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              بەپەلە
                            </span>
                          ) : b.status === 'approved' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              پەسەندکراو
                            </span>
                          ) : null}

                          {(b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                              هاوکاریکراو ({b.aidHistory.length})
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-700 font-mono">{b.monthlyIncomeIQD.toLocaleString()} د.ع</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('beneficiaries');
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl liquid-button-primary text-white text-xs sm:text-sm font-bold shadow-md"
              >
                <span>چوون بۆ پەڕەی بەڕێوەبردنی سوودمەندان</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Full Details for Projects (پڕۆژە چالاکەکان) */}
      {activeModal === 'projects' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
                <FolderKanban className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">تەواوی وردەکاری پڕۆژە و کەمپەینەکان</h3>
                <p className="text-xs sm:text-sm text-slate-500">بەراوردی بودجە و پێشکەوتنی جێبەجێکردن لە مەیداندا</p>
              </div>
            </div>

            {/* Projects List with Progress */}
            <div className="space-y-3.5 mb-5 max-h-72 overflow-y-auto pe-1">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-bold">
                  هیچ پڕۆژەیەک تۆمار نەکراوە (سفر پڕۆژە)
                </div>
              ) : (
                filteredProjects.map(p => {
                  const linkedDonations = donations.filter(d => d.projectId === p.id);
                  const directIncomeTx = transactions.filter(
                    t => t.relatedProjectId === p.id && t.type === 'income' && (!t.receiptNumber || !linkedDonations.some(d => d.receiptNumber === t.receiptNumber))
                  );
                  const linkedExpenses = transactions.filter(t => t.relatedProjectId === p.id && t.type === 'expense');

                  const donAgg = aggregateAmountsByDayRate(linkedDonations);
                  const txIncomeAgg = aggregateAmountsByDayRate(directIncomeTx);
                  const expAgg = aggregateAmountsByDayRate(linkedExpenses);

                  const pRaisedUSD = Number((donAgg.totalUSD + txIncomeAgg.totalUSD).toFixed(2));
                  const pSpentUSD = expAgg.totalUSD;

                  const raisedPercent = p.targetBudgetUSD > 0 ? Math.min(100, Math.round((pRaisedUSD / p.targetBudgetUSD) * 100)) : 0;
                  const spentPercent = p.targetBudgetUSD > 0 ? Math.min(100, Math.round((pSpentUSD / p.targetBudgetUSD) * 100)) : 0;

                  return (
                    <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                          <span className="text-xs text-purple-700 font-bold">{p.category} • {p.governorates.join(', ')}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {p.status === 'completed' ? 'تەواوکراو' : 'بەردەوامە'}
                        </span>
                      </div>

                      {/* Progress meters */}
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>کۆکراوە: ${pRaisedUSD.toLocaleString()} / ${p.targetBudgetUSD.toLocaleString()}</span>
                          <span className="font-bold text-emerald-700 font-mono">{raisedPercent}٪</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${raisedPercent}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1.5 border-t border-slate-200/80">
                        <span>{p.beneficiariesCount} سوودمەند • {p.volunteersCount} خۆبەخش</span>
                        <span className="font-mono">{p.startDate} تا {p.endDate}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('projects');
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl liquid-button-primary text-white text-xs sm:text-sm font-bold shadow-md"
              >
                <span>چوون بۆ پەڕەی تەواوی پڕۆژەکان</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Details for Volunteers (خزمەتی خۆبەخشان) */}
      {activeModal === 'volunteers' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">تەواوی وردەکاری تیمی خۆبەخشان</h3>
                <p className="text-xs sm:text-sm text-slate-500">تۆماری کاتژمێرەکان، لێهاتووییەکان و ئەندامانی تیم</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold text-amber-800 block">کۆی کاتژمێری خزمەت:</span>
                <span className="text-lg font-black text-amber-900">{totalVolunteerHours} کاتژمێر</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-xs font-bold text-blue-800 block">ئەندامانی خۆبەخش:</span>
                <span className="text-lg font-black text-blue-900">{filteredVolunteers.length} کەس</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-slate-700 block">تێکڕای خزمەت:</span>
                <span className="text-lg font-black text-slate-900">
                  {Math.round(totalVolunteerHours / (filteredVolunteers.length || 1))} کاتژمێر
                </span>
              </div>
            </div>

            {/* Volunteers List */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-700">
                لیستی ئەندامانی تیمی مەیدانی ({filteredVolunteers.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {filteredVolunteers.length === 0 ? (
                  <div className="p-8 text-center text-xs sm:text-sm text-slate-400 font-bold">
                    هیچ خۆبەخشێک تۆمار نەکراوە (سفر ئەندام)
                  </div>
                ) : (
                  filteredVolunteers.map(v => (
                    <div key={v.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {v.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{v.fullName}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{v.badgeNumber} • {v.governorate} • خوێن: {v.bloodType}</p>
                        </div>
                      </div>
                      <div className="text-start">
                        <span className="font-black text-amber-700 text-sm block">
                          {v.hoursLogged} کاتژمێر
                        </span>
                        <span className="text-xs text-slate-500">{v.availability}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                داخستن
              </button>
              <button
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('volunteers');
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl liquid-button-primary text-white text-xs sm:text-sm font-bold shadow-md"
              >
                <span>چوون بۆ پەڕەی تەواوی خۆبەخشان</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Official Printable Impact Report (#printable-impact-report) */}
      {activeModal === 'impact-report' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 no-print">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">ڕاپۆرتی فەرمی کاریگەری و شەفافییەت (A4)</h3>
                  <p className="text-xs text-slate-500">ئامادەکراو بۆ چاپکردن و پێشکەشکردن بە دەستەی کارگێڕی و بەخشەران</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  چاپکردن / PDF
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-impact-report" className="p-6 rounded-2xl border-2 border-slate-800 bg-white space-y-6 text-slate-900">
              {/* Official Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900">ڕێکخراوی خێرخوازی بۆتان بامۆکی</h1>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">ڕاپۆرتی فەرمی ئاماری و شەفافییەتی دارایی و مەیدانی</p>
                </div>
                <div className="text-end text-xs font-mono text-slate-700 space-y-0.5">
                  <div>بەروار: {new Date().toLocaleDateString('ckb-IQ')}</div>
                  <div>ماوە: {fromDate} تا {toDate}</div>
                  <div>پارێزگا: {governorateFilter === 'all' ? 'سەرجەم شارەکان' : governorateFilter}</div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-600 block">کۆی بەخشین (دینار)</span>
                  <span className="text-base font-black font-mono text-slate-900">{totalDonationsIQD.toLocaleString()} د.ع</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-600 block">کۆی بەخشین (دۆلار)</span>
                  <span className="text-base font-black font-mono text-emerald-800">${totalDonationsUSD.toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-600 block">خێزانە سوودمەندەکان</span>
                  <span className="text-base font-black font-mono text-slate-900">{aidedBeneficiaries} / {totalBeneficiaries}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                  <span className="text-[11px] font-bold text-slate-600 block">خزمەتی خۆبەخشان</span>
                  <span className="text-base font-black font-mono text-slate-900">{totalVolunteerHours} کاتژمێر</span>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-2">پۆلێنکردنی خێزانە تۆمارکراوەکان بەپێی حاڵەت:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(categoriesMap).map(([cat, count]) => (
                    <div key={cat} className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-700">{cat}:</span>
                      <span className="font-mono font-black text-slate-900">{count} خێزان</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activities Table */}
              <div>
                <h4 className="text-xs font-black text-slate-800 mb-2">دوایین دابەشکردنە مەیدانییەکان:</h4>
                <table className="w-full text-end text-xs border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                    <tr>
                      <th className="p-2">سوودمەند</th>
                      <th className="p-2">پڕۆژە / بابەت</th>
                      <th className="p-2">پارێزگا</th>
                      <th className="p-2">بڕ / کاڵا</th>
                      <th className="p-2">بەروار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {recentAids.map(a => (
                      <tr key={a.id}>
                        <td className="p-2 font-bold">{a.beneficiaryName}</td>
                        <td className="p-2">{a.projectTitle}</td>
                        <td className="p-2">{a.beneficiaryGov}</td>
                        <td className="p-2 font-mono font-bold">
                          {a.type === 'monetary' ? `${a.amountIQD?.toLocaleString()} د.ع` : `${a.quantity} ${a.itemName}`}
                        </td>
                        <td className="p-2 font-mono">{a.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-700 border-t border-slate-300">
                <div>
                  <p>واژۆی بەشی ژمێریاری و دارایی</p>
                  <div className="h-10 border-b border-dashed border-slate-400 w-40 mx-auto mt-2" />
                </div>
                <div>
                  <p>مۆر و واژۆی سەرۆکی ڕێکخراو</p>
                  <div className="h-10 border-b border-dashed border-slate-400 w-40 mx-auto mt-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
