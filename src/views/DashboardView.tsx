import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Users,
  HeartHandshake,
  FolderKanban,
  UserCheck,
  Package,
  PlusCircle,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Filter,
  RotateCcw,
  Search,
  Eye,
  X,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Droplet,
  ArrowRight,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';

type ActiveModalType = 'donations' | 'beneficiaries' | 'projects' | 'volunteers' | null;

export const DashboardView: React.FC = () => {
  const {
    beneficiaries,
    donations,
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

  // Filtered Calculations
  const totalDonationsIQD = filteredDonations
    .filter(d => d.currency === 'IQD')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalDonationsUSD = filteredDonations
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalBeneficiaries = filteredBeneficiaries.length;
  const aidedBeneficiaries = filteredBeneficiaries.filter(b => b.status === 'aided').length;
  const activeProjectsCount = filteredProjects.filter(p => p.status === 'active').length;
  const totalVolunteerHours = filteredVolunteers.reduce((sum, v) => sum + v.hoursLogged, 0);

  // Trigger celebratory confetti
  const celebrateImpact = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

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
  };

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
    <div className="space-y-6 pb-24">
      
      {/* Welcome Hero Banner with Liquid Specular Glass on White */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-cyan-50/60 to-blue-50/80 p-6 sm:p-8 border border-sky-200/80 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-700" />
                داشبۆردی شیكاری و چاودێری ڕاستەوخۆ
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              بەخێربێن بۆ سیستەمی بەڕێوەبردنی خێرخوازی
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed font-normal">
              تۆمارکردن، دابەشکردنی کۆمەک و شەفافییەتی تەواوی دارایی لەسەر ئاستی سەرجەم شار و ناوچەکانی کوردستان.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <button
              onClick={celebrateImpact}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
            >
              <HeartHandshake className="w-4 h-4" />
              ئاهەنگی کاریگەری هاوکاری
            </button>
            <button
              onClick={exportImpactReport}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
              title="داگرتنی پوختەی ئاماری فلتەرکراو"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              هەناردەکردنی ڕاپۆرت
            </button>
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-cyan-600" />
              تۆمارکردنی سوودمەند
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Dashboard Filter Bar (Requirement 3: Filters for Time Period, Gov, Category, Search) */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-900">فلتەرکردنی زانیاری و ئامارەکانی داشبۆرد</h3>
          </div>
          {isAnyFilterActive && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-bold px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              سڕینەوەی فلتەرەکان
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* 1. Time Period Filter: Exact From & To Dates of Years */}
          <div className="sm:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-slate-700">ماوەی کات (لە - بۆ بەروار):</label>
              <span className="text-[10px] text-cyan-800 font-mono bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                {fromDate} ⬅ {toDate}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="text-[10px] text-slate-400 absolute right-2.5 top-2 pointer-events-none font-bold">لە:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full pr-7 pl-2 py-1.5 text-xs rounded-xl liquid-input text-slate-900 font-mono bg-white"
                  title="لە بەرواری (From Date)"
                />
              </div>
              <div className="relative">
                <span className="text-[10px] text-slate-400 absolute right-2.5 top-2 pointer-events-none font-bold">بۆ:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full pr-7 pl-2 py-1.5 text-xs rounded-xl liquid-input text-slate-900 font-mono bg-white"
                  title="بۆ بەرواری (To Date)"
                />
              </div>
            </div>
          </div>

          {/* 2. Governorate Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">پارێزگا و ناوچە:</label>
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
              <option value="زاخۆ">زاخۆ</option>
            </select>
          </div>

          {/* 3. Category Filter: Renamed strictly to حاڵەت */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">حاڵەت:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl liquid-input text-slate-900 cursor-pointer bg-white"
            >
              <option value="all">هەموو حاڵەتەکان</option>
              <option value="poor">هەژار و کەمدەرامەت</option>
              <option value="orphan">بێباوک و هەتیو</option>
              <option value="sick">نەخۆش و دەستکورت</option>
              <option value="disabled">خاوەن پێداویستی تایبەت</option>
              <option value="student">خوێندکاری هەژار</option>
            </select>
          </div>

          {/* 4. Search Query */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">گەڕانی دەقی لە داشبۆرد:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="گەڕان بەپێی ناو یان ناونیشان..."
                className="w-full pr-8 pl-3 py-2 text-xs rounded-xl liquid-input text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

        </div>
      </div>

      {/* KPI Cards Grid (Requirement 2: Clickable with Full Details Modal + Requirement 1: Erased duplicate detection footer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Donations (Clickable) */}
        <div
          onClick={() => setActiveModal('donations')}
          className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-cyan-400 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری بەخشینەکان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 group-hover:text-cyan-700 transition-colors">کۆی بەخشینەکان</span>
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-all shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900">
                {currencyView === 'IQD'
                  ? `${totalDonationsIQD.toLocaleString()} د.ع`
                  : `$${totalDonationsUSD.toLocaleString()}`}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {currencyView === 'IQD'
                  ? `هاوتای $${totalDonationsUSD.toLocaleString()} دۆلار`
                  : `هاوتای ${totalDonationsIQD.toLocaleString()} دینار`}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-cyan-700 font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
              <Eye className="w-3.5 h-3.5" /> بینینی تەواوی وردەکاری
            </span>
            <span className="text-slate-500 font-bold">{filteredDonations.length} بەخشین</span>
          </div>
        </div>

        {/* KPI 2: Beneficiaries (Clickable, and ERASED the fraud detection section!) */}
        <div
          onClick={() => setActiveModal('beneficiaries')}
          className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-emerald-400 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری خێزانەکان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 group-hover:text-emerald-700 transition-colors">خێزانە سوودمەندەکان</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900">
                {totalBeneficiaries} <span className="text-sm font-normal text-slate-500">خێزان</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-1 font-bold">
                {aidedBeneficiaries} خێزان هاوکاری وەرگرتووە ({totalBeneficiaries > 0 ? Math.round((aidedBeneficiaries / totalBeneficiaries) * 100) : 0}٪)
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700 font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
              <Eye className="w-3.5 h-3.5" /> بینینی دۆسیەی خێزانەکان
            </span>
            <span className="text-slate-500 font-bold">{totalBeneficiaries - aidedBeneficiaries} چاوەڕوان</span>
          </div>
        </div>

        {/* KPI 3: Projects (Clickable) */}
        <div
          onClick={() => setActiveModal('projects')}
          className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-purple-400 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری پڕۆژەکان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 group-hover:text-purple-700 transition-colors">پڕۆژە چالاکەکان</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900">
                {activeProjectsCount} <span className="text-sm font-normal text-slate-500">پڕۆژەی بەردەوام</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                لە کۆی {filteredProjects.length} پڕۆژەی پلان بۆ داڕێژراو
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
              <Eye className="w-3.5 h-3.5" /> بینینی پێشکەوتنی کەمپەینەکان
            </span>
            <span className="text-slate-500 font-bold">{filteredProjects.length} پڕۆژە</span>
          </div>
        </div>

        {/* KPI 4: Volunteer Service (Clickable) */}
        <div
          onClick={() => setActiveModal('volunteers')}
          className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-amber-400 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between"
          title="کلیک بکە بۆ بینینی تەواوی وردەکاری تیمی خۆبەخشان"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 group-hover:text-amber-700 transition-colors">خزمەتی خۆبەخشان</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-black text-slate-900">
                {totalVolunteerHours} <span className="text-sm font-normal text-slate-500">کاتژمێر</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1 font-bold">
                {filteredVolunteers.length} خۆبەخش لە مەیداندا
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-amber-700 font-bold flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
              <Eye className="w-3.5 h-3.5" /> بینینی تیمی خۆبەخشان
            </span>
            <span className="text-slate-500 font-bold">{filteredVolunteers.length} کەس</span>
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
              بینینی هەموو <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
          </div>

          <div className="space-y-3">
            {recentAids.length === 0 ? (
              <div className="py-8 text-center space-y-1 rounded-2xl bg-slate-50/50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-600 font-bold">هیچ هاوکارییەک تۆمار نەکراوە (سفر تۆمار)</p>
                <p className="text-[10px] text-slate-400">بە تۆمارکردنی سوودمەندان و دابەشکردنی کۆمەک، چالاکییەکان لێرەدا دەردەکەون</p>
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
                      <h4 className="text-xs font-bold text-slate-900">{aid.beneficiaryName}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {aid.projectTitle} • پارێزگای {aid.beneficiaryGov}
                      </p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-xs font-bold text-cyan-800 block">
                      {aid.type === 'monetary'
                        ? `${aid.amountIQD?.toLocaleString()} دینار`
                        : `${aid.quantity} ${aid.itemName}`}
                    </span>
                    <span className="text-[10px] text-slate-400">{aid.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Quick Launchpad Buttons */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-600" />
          دەستپێشخەری و کرداری خێرا
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('beneficiaries')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-200 text-center transition-all group"
          >
            <Users className="w-6 h-6 text-cyan-600 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800">تۆماری خێزانی هەژار</span>
          </button>
          
          <button
            onClick={() => setActiveTab('donors')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-200 text-center transition-all group"
          >
            <HeartHandshake className="w-6 h-6 text-emerald-600 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800">تۆمار و پسوولەی بەخشین</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-200 text-center transition-all group"
          >
            <Package className="w-6 h-6 text-amber-600 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800">دابەشکردنی کاڵای کۆگا</span>
          </button>

          <button
            onClick={() => setActiveTab('geo')}
            className="p-3 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 text-center transition-all group"
          >
            <FolderKanban className="w-6 h-6 text-purple-600 mx-auto mb-1.5 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold text-slate-800">نەخشەی هاوکاری شارەکان</span>
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
                <p className="text-xs text-slate-500">بەدواداچوونی سەرجەم داهاتە نەختینەییەکان و پسوولەکان</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200">
                <span className="text-[11px] text-cyan-800 font-bold block">کۆی بەخشین (دینار):</span>
                <span className="text-lg font-black text-cyan-900">{totalDonationsIQD.toLocaleString()} د.ع</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-bold block">کۆی بەخشین (دۆلار):</span>
                <span className="text-lg font-black text-emerald-900">${totalDonationsUSD.toLocaleString()}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-purple-800 font-bold block">ژمارەی بەخشینەکان:</span>
                <span className="text-lg font-black text-purple-900">{filteredDonations.length} پسوولە</span>
              </div>
            </div>

            {/* Donations Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
                لیستی بەخشینە تۆمارکراوەکان ({filteredDonations.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {filteredDonations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    هیچ بەخشینێک تۆمار نەکراوە (سفر پسوولە)
                  </div>
                ) : (
                  filteredDonations.map(d => (
                    <div key={d.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900">{d.donorName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{d.receiptNumber} • {d.method} • {d.date}</p>
                      </div>
                      <div className="text-left">
                        <span className="font-black text-emerald-700 text-sm">
                          {d.amount.toLocaleString()} {d.currency === 'IQD' ? 'د.ع' : '$'}
                        </span>
                        <p className="text-[10px] text-slate-500">{d.projectName || 'سندووقی گشتی'}</p>
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
                <p className="text-xs text-slate-500">دۆسیەی تەواوی خێزانە پەسەندکراوەکان و چاوەڕوانکراوەکان</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 block font-bold">کۆی خێزانەکان:</span>
                <span className="text-lg font-black text-slate-900">{totalBeneficiaries} خێزان</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-800 block font-bold">هاوکاریکراو:</span>
                <span className="text-lg font-black text-emerald-900">{aidedBeneficiaries}</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 text-center">
                <span className="text-[10px] text-cyan-800 block font-bold">پەسەندکراو:</span>
                <span className="text-lg font-black text-cyan-900">{filteredBeneficiaries.filter(b => b.status === 'approved').length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] text-amber-800 block font-bold">لەژێر پشکنین:</span>
                <span className="text-lg font-black text-amber-900">{filteredBeneficiaries.filter(b => b.status === 'pending').length}</span>
              </div>
            </div>

            {/* Beneficiaries List */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
                لیستی خێزانەکان ({filteredBeneficiaries.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {filteredBeneficiaries.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    هیچ خێزانێکی سوودمەند تۆمار نەکراوە (سفر خێزان)
                  </div>
                ) : (
                  filteredBeneficiaries.map(b => (
                    <div key={b.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{b.fullName}</p>
                        <p className="text-[11px] text-slate-500">{b.governorate} • {b.address} • {b.familyMembers} کەس</p>
                      </div>
                      <div className="text-left">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'aided' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        }`}>
                          {b.status === 'aided' ? `هاوکاریکراو (${b.aidHistory.length})` : 'پەسەندکراوە'}
                        </span>
                        <p className="text-[11px] font-bold text-slate-700 mt-1">{b.monthlyIncomeIQD.toLocaleString()} د.ع</p>
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
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md"
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
                <p className="text-xs text-slate-500">بەراوردی بودجە و پێشکەوتنی جێبەجێکردن لە مەیداندا</p>
              </div>
            </div>

            {/* Projects List with Progress */}
            <div className="space-y-3.5 mb-5 max-h-72 overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold">
                  هیچ پڕۆژەیەک تۆمار نەکراوە (سفر پڕۆژە)
                </div>
              ) : (
                filteredProjects.map(p => {
                  const raisedPercent = p.targetBudgetUSD > 0 ? Math.min(100, Math.round((p.raisedBudgetUSD / p.targetBudgetUSD) * 100)) : 0;
                  const spentPercent = p.targetBudgetUSD > 0 ? Math.min(100, Math.round((p.spentBudgetUSD / p.targetBudgetUSD) * 100)) : 0;

                  return (
                    <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
                          <span className="text-[10px] text-purple-700 font-bold">{p.category} • {p.governorates.join(', ')}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {p.status === 'completed' ? 'تەواوکراو' : 'بەردەوامە'}
                        </span>
                      </div>

                      {/* Progress meters */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>کۆکراوە: ${p.raisedBudgetUSD.toLocaleString()} / ${p.targetBudgetUSD.toLocaleString()}</span>
                          <span className="font-bold text-emerald-700 font-mono">{raisedPercent}٪</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${raisedPercent}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/80">
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
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md"
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
                <p className="text-xs text-slate-500">تۆماری کاتژمێرەکان، لێهاتووییەکان و ئەندامانی تیم</p>
              </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-800 font-bold block">کۆی کاتژمێری خزمەت:</span>
                <span className="text-lg font-black text-amber-900">{totalVolunteerHours} کاتژمێر</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[11px] text-blue-800 font-bold block">ئەندامانی خۆبەخش:</span>
                <span className="text-lg font-black text-blue-900">{filteredVolunteers.length} کەس</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-slate-700 font-bold block">تێکڕای خزمەت:</span>
                <span className="text-lg font-black text-slate-900">
                  {Math.round(totalVolunteerHours / (filteredVolunteers.length || 1))} کاتژمێر
                </span>
              </div>
            </div>

            {/* Volunteers List */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden mb-5">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700">
                لیستی ئەندامانی تیمی مەیدانی ({filteredVolunteers.length})
              </div>
              <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {filteredVolunteers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    هیچ خۆبەخشێک تۆمار نەکراوە (سفر ئەندام)
                  </div>
                ) : (
                  filteredVolunteers.map(v => (
                    <div key={v.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                          {v.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{v.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{v.badgeNumber} • {v.governorate} • خوێن: {v.bloodType}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-black text-amber-700 text-xs block">
                          {v.hoursLogged} کاتژمێر
                        </span>
                        <span className="text-[10px] text-slate-500">{v.availability}</span>
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
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md"
              >
                <span>چوون بۆ پەڕەی تەواوی خۆبەخشان</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
