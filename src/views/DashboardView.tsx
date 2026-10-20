import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  Users,
  HeartHandshake,
  FolderKanban,
  UserCheck,
  Package,
  Sparkles,
  ChevronLeft,
  Filter,
  RotateCcw,
  Search,
  Eye,
  X,
  Download,
  Printer,
  BarChart3,
  Banknote,
  ArrowUpLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Accessibility,
  Home,
  Layers
} from 'lucide-react';
import { aggregateAmountsByDayRate, getExchangeRateForDate } from '../utils/exchangeRates';
import { useModalFocusTrap } from '../utils/useModalFocusTrap';
import { useFeedback } from '../components/ui/FeedbackProvider';
import { MobileKpiCarousel } from '../components/ui/MobileKpiCarousel';
import { useHaptics } from '../utils/useHaptics';

type ActiveModalType = 'donations' | 'beneficiaries' | 'projects' | 'volunteers' | 'impact-report' | null;
type DatePresetType = 'all' | 'this_month' | 'last_3_months' | 'this_year' | 'custom';
type DashboardStyleMode = 'enhanced' | 'classic';

function normalizeKurdishSearch(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[ێیيى]/g, 'ی')
    .replace(/[ەةه]/g, 'ە')
    .replace(/[ۆوؤ]/g, 'و')
    .replace(/[کك]/g, 'ک')
    .trim();
}

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
  const { showToast } = useFeedback();
  const haptics = useHaptics();

  // Style Mode Toggle ("Enhanced UI/UX" vs "Classic Previous Style") so user can redo/revert in 1 click
  const [styleMode, setStyleMode] = useState<DashboardStyleMode>(() => {
    const saved = localStorage.getItem('ngo_dashboard_style_mode');
    return saved === 'classic' ? 'classic' : 'enhanced';
  });

  const handleToggleStyleMode = (mode: DashboardStyleMode) => {
    haptics.selection();
    setStyleMode(mode);
    localStorage.setItem('ngo_dashboard_style_mode', mode);
    showToast(
      mode === 'enhanced'
        ? 'دیزاینی نوێی پڕۆفیشناڵ چالاک کرا (بەپێی یاساکانی UI/UX)'
        : 'گەڕێندرایەوە بۆ ستایلی پێشووی داشبۆرد',
      'info'
    );
  };

  // Find first and last record dates dynamically across all records
  const { minRecordDate, maxRecordDate } = useMemo(() => {
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

  // Filters State
  const [fromDate, setFromDate] = useState<string>(minRecordDate);
  const [toDate, setToDate] = useState<string>(maxRecordDate);
  const [datePreset, setDatePreset] = useState<DatePresetType>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Detailed Modal State + Modal Search Input (Rule 1.2: Search on preset/detail lists)
  const [activeModal, setActiveModal] = useState<ActiveModalType>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');

  // Modal accessibility focus trap (Plugin: a11y-keyboard-auditor)
  const modalRef = useModalFocusTrap<HTMLDivElement>(activeModal !== null, () => {
    setActiveModal(null);
    setModalSearchQuery('');
  });

  // Update default dates if dataset changes
  useEffect(() => {
    if (minRecordDate && !fromDate) setFromDate(minRecordDate);
    if (maxRecordDate && !toDate) setToDate(maxRecordDate);
  }, [minRecordDate, maxRecordDate]);

  // Reset modal search when switching modals
  useEffect(() => {
    setModalSearchQuery('');
  }, [activeModal]);

  // Apply quick time preset (Rule 1.4: Surface essential micro-actions)
  const applyDatePreset = (preset: DatePresetType) => {
    haptics.selection();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    setDatePreset(preset);

    if (preset === 'all') {
      setFromDate(minRecordDate);
      setToDate(maxRecordDate);
    } else if (preset === 'this_month') {
      const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      setFromDate(startOfMonth);
      setToDate(todayStr > maxRecordDate ? todayStr : maxRecordDate);
    } else if (preset === 'last_3_months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const fromStr = threeMonthsAgo.toISOString().split('T')[0];
      setFromDate(fromStr);
      setToDate(todayStr > maxRecordDate ? todayStr : maxRecordDate);
    } else if (preset === 'this_year') {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(`${now.getFullYear()}-12-31`);
    }
  };

  // Helper date checker
  const matchesTime = (dateStr?: string) => {
    if (!dateStr) return true;
    if (fromDate && dateStr < fromDate) return false;
    if (toDate && dateStr > toDate) return false;
    return true;
  };

  const normQuery = useMemo(() => normalizeKurdishSearch(searchQuery), [searchQuery]);
  const normModalQuery = useMemo(() => normalizeKurdishSearch(modalSearchQuery), [modalSearchQuery]);

  // Filtered Beneficiaries (Memoized per vite-react-optimizer)
  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const matchTime = matchesTime(b.registeredDate);
      const matchGov = governorateFilter === 'all' || b.governorate === governorateFilter;
      const matchCat = categoryFilter === 'all' || b.needCategory === categoryFilter;
      const matchSearch =
        !normQuery ||
        normalizeKurdishSearch(b.fullName).includes(normQuery) ||
        normalizeKurdishSearch(b.address).includes(normQuery) ||
        b.phone.includes(normQuery);
      return matchTime && matchGov && matchCat && matchSearch;
    });
  }, [beneficiaries, fromDate, toDate, governorateFilter, categoryFilter, normQuery]);

  // Filtered Donations
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchTime = matchesTime(d.date);
      const donor = donors.find(dn => dn.id === d.donorId);
      const matchGov = governorateFilter === 'all' || (donor && donor.governorate === governorateFilter);
      const matchSearch =
        !normQuery ||
        normalizeKurdishSearch(d.donorName).includes(normQuery) ||
        normalizeKurdishSearch(d.receiptNumber).includes(normQuery);
      return matchTime && matchGov && matchSearch;
    });
  }, [donations, donors, fromDate, toDate, governorateFilter, normQuery]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchGov = governorateFilter === 'all' || p.governorates.includes(governorateFilter);
      const matchSearch =
        !normQuery ||
        normalizeKurdishSearch(p.title).includes(normQuery) ||
        normalizeKurdishSearch(p.description).includes(normQuery);
      return matchGov && matchSearch;
    });
  }, [projects, governorateFilter, normQuery]);

  // Filtered Volunteers
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      const matchGov = governorateFilter === 'all' || v.governorate === governorateFilter;
      const matchSearch =
        !normQuery ||
        normalizeKurdishSearch(v.fullName).includes(normQuery) ||
        v.skills.some(s => normalizeKurdishSearch(s).includes(normQuery));
      return matchGov && matchSearch;
    });
  }, [volunteers, governorateFilter, normQuery]);

  // Filtered Calculations - Synchronized day-by-day exchange rate aggregation
  const donationsAgg = useMemo(() => aggregateAmountsByDayRate(filteredDonations), [filteredDonations]);
  const totalDonationsIQD = donationsAgg.totalIQD;
  const totalDonationsUSD = donationsAgg.totalUSD;

  const totalBeneficiaries = filteredBeneficiaries.length;
  const aidedBeneficiaries = useMemo(
    () => filteredBeneficiaries.filter(b => b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)).length,
    [filteredBeneficiaries]
  );
  const unaidedBeneficiaries = Math.max(0, totalBeneficiaries - aidedBeneficiaries);
  const activeProjectsCount = useMemo(
    () => filteredProjects.filter(p => p.status === 'active').length,
    [filteredProjects]
  );
  const totalVolunteerHours = useMemo(
    () => filteredVolunteers.reduce((sum, v) => sum + v.hoursLogged, 0),
    [filteredVolunteers]
  );

  // Recent aid activities across filtered beneficiaries
  const recentAids = useMemo(() => {
    return filteredBeneficiaries
      .flatMap(b => b.aidHistory.map(a => ({ ...a, beneficiaryName: b.fullName, beneficiaryGov: b.governorate })))
      .filter(a => matchesTime(a.date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredBeneficiaries, fromDate, toDate]);

  // Structured Category Metadata with Uniform SVG Outline Icons (Rule 5.2)
  const categoriesData = useMemo(() => {
    const items = [
      {
        key: 'poor',
        label: 'هەژار و کەمدەرامەت',
        icon: Users,
        count: filteredBeneficiaries.filter(b => b.needCategory === 'poor').length
      },
      {
        key: 'orphan',
        label: 'بێباوک و هەتیو',
        icon: HeartHandshake,
        count: filteredBeneficiaries.filter(b => b.needCategory === 'orphan').length
      },
      {
        key: 'sick',
        label: 'نەخۆش و دەستکورت',
        icon: HeartPulse,
        count: filteredBeneficiaries.filter(b => b.needCategory === 'sick').length
      },
      {
        key: 'disabled',
        label: 'خاوەن پێداویستی تایبەت',
        icon: Accessibility,
        count: filteredBeneficiaries.filter(b => b.needCategory === 'disabled').length
      },
      {
        key: 'student',
        label: 'خوێندکاری هەژار',
        icon: GraduationCap,
        count: filteredBeneficiaries.filter(b => b.needCategory === 'student').length
      },
      {
        key: 'displaced',
        label: 'ئاوارە و پەنابەر',
        icon: Home,
        count: filteredBeneficiaries.filter(b => b.needCategory === 'displaced').length
      }
    ];
    return items;
  }, [filteredBeneficiaries]);

  const categoriesMap: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    categoriesData.forEach(c => {
      map[c.label] = c.count;
    });
    return map;
  }, [categoriesData]);

  // Rule 8.4: Faithful Data Mapping across all 7 Kurdistan Governorates
  const allSevenGovernorates = useMemo(() => {
    const govList = ['هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە', 'کەرکووک', 'گەرمیان', 'زاخۆ'];
    return govList.map(gov => {
      const total = filteredBeneficiaries.filter(b => b.governorate === gov).length;
      const aided = filteredBeneficiaries.filter(
        b => b.governorate === gov && (b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0))
      ).length;
      return { gov, total, aided };
    });
  }, [filteredBeneficiaries]);

  // Classic filtered governorates (for Classic Style Mode)
  const governoratesBreakdownClassic = useMemo(() => {
    return allSevenGovernorates.filter(g => g.total > 0 || governorateFilter === g.gov);
  }, [allSevenGovernorates, governorateFilter]);

  const isAnyFilterActive =
    fromDate !== minRecordDate ||
    toDate !== maxRecordDate ||
    governorateFilter !== 'all' ||
    categoryFilter !== 'all' ||
    searchQuery !== '';

  const resetFilters = () => {
    setFromDate(minRecordDate);
    setToDate(maxRecordDate);
    setDatePreset('all');
    setGovernorateFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
    showToast('سەرجەم فلتەرەکانی داشبۆرد سڕانەوە', 'info');
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
      `خێزانە هاوکاریکراوەکان: ${aidedBeneficiaries} (${Math.round((aidedBeneficiaries / Math.max(1, totalBeneficiaries)) * 100)}%)`,
      `کۆی بەخشین (دینار): ${totalDonationsIQD.toLocaleString()} د.ع`,
      `کۆی بەخشین (دۆلار): $${totalDonationsUSD.toLocaleString()}`,
      `پڕۆژە چالاکەکان: ${activeProjectsCount}`,
      `کۆی کاتژمێری خزمەتی خۆبەخشان: ${totalVolunteerHours} کاتژمێر`,
      `ژمارەی بەخشینەکان: ${filteredDonations.length}`,
      `------------------------------------------------`,
      `دوایین چالاکییە مەیدانییەکان:`,
      ...recentAids.map(
        (a, i) =>
          `${i + 1}. ${a.beneficiaryName} - ${a.projectTitle} (${
            a.type === 'monetary' ? `${a.amountIQD?.toLocaleString()} د.ع` : `${a.quantity} ${a.itemName}`
          }) - ${a.date}`
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + report], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `bamboki_impact_report_${fromDate}_${toDate}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('پەڕگەی ڕاپۆرتی TXT بە سەرکەوتوویی داگیرا', 'success');
  };

  // Filtered lists inside Modals (Rule 1.2: Search inside modal lists)
  const modalFilteredDonations = useMemo(() => {
    if (!normModalQuery) return filteredDonations;
    return filteredDonations.filter(
      d =>
        normalizeKurdishSearch(d.donorName).includes(normModalQuery) ||
        normalizeKurdishSearch(d.receiptNumber).includes(normModalQuery) ||
        normalizeKurdishSearch(d.projectName || '').includes(normModalQuery)
    );
  }, [filteredDonations, normModalQuery]);

  const modalFilteredBeneficiaries = useMemo(() => {
    if (!normModalQuery) return filteredBeneficiaries;
    return filteredBeneficiaries.filter(
      b =>
        normalizeKurdishSearch(b.fullName).includes(normModalQuery) ||
        normalizeKurdishSearch(b.governorate).includes(normModalQuery) ||
        normalizeKurdishSearch(b.address).includes(normModalQuery) ||
        b.phone.includes(normModalQuery)
    );
  }, [filteredBeneficiaries, normModalQuery]);

  const modalFilteredProjects = useMemo(() => {
    if (!normModalQuery) return filteredProjects;
    return filteredProjects.filter(
      p =>
        normalizeKurdishSearch(p.title).includes(normModalQuery) ||
        normalizeKurdishSearch(p.category).includes(normModalQuery) ||
        p.governorates.some(g => normalizeKurdishSearch(g).includes(normModalQuery))
    );
  }, [filteredProjects, normModalQuery]);

  const modalFilteredVolunteers = useMemo(() => {
    if (!normModalQuery) return filteredVolunteers;
    return filteredVolunteers.filter(
      v =>
        normalizeKurdishSearch(v.fullName).includes(normModalQuery) ||
        normalizeKurdishSearch(v.governorate).includes(normModalQuery) ||
        normalizeKurdishSearch(v.badgeNumber).includes(normModalQuery)
    );
  }, [filteredVolunteers, normModalQuery]);

  // Helper to render the Style Mode Switcher Pill (Allows instant 1-click revert/redo)
  const renderStyleSwitcher = () => (
    <div
      role="group"
      aria-label="گۆڕینی شێوازی دیزاینی داشبۆرد"
      className="inline-flex items-center p-1 rounded-[10px] bg-slate-100 border border-slate-200/80 text-xs font-bold"
    >
      <button
        type="button"
        onClick={() => handleToggleStyleMode('enhanced')}
        aria-pressed={styleMode === 'enhanced'}
        className={`px-3 py-1.5 rounded-[8px] transition-all flex items-center gap-1.5 ${
          styleMode === 'enhanced'
            ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/80'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="دیزاینی نوێی پڕۆفیشناڵ بەپێی یاساکانی UI/UX"
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
        <span>دیزاینی نوێ</span>
      </button>
      <button
        type="button"
        onClick={() => handleToggleStyleMode('classic')}
        aria-pressed={styleMode === 'classic'}
        className={`px-3 py-1.5 rounded-[8px] transition-all flex items-center gap-1.5 ${
          styleMode === 'classic'
            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        title="گەڕانەوە بۆ ستایلی پێشووی داشبۆرد"
      >
        <Layers className="w-3.5 h-3.5 text-slate-500" />
        <span>ستایلی پێشوو</span>
      </button>
    </div>
  );

  // ============================================================================
  // CLASSIC MODE RENDER (1-Click Undo / Redo to Previous Style)
  // ============================================================================
  if (styleMode === 'classic') {
    return (
      <div className="space-y-6 pb-8">
        {/* Classic Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-50 via-cyan-50/70 to-blue-50/80 p-6 sm:p-8 lg:p-10 border border-sky-200/90 shadow-sm">
          <div className="absolute top-0 end-0 w-96 h-96 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="px-3.5 py-1 rounded-full text-xs sm:text-sm font-bold bg-cyan-100/90 text-cyan-800 border border-cyan-200 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-4 h-4 text-cyan-700" />
                  داشبۆردی شیكاری و چاودێری ڕاستەوخۆ
                </span>
                {renderStyleSwitcher()}
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
                type="button"
                onClick={() => setActiveModal('impact-report')}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl liquid-button-primary text-white text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
              >
                <Printer className="w-4 h-4" />
                <span>ڕاپۆرتی فەرمی (چاپ/PDF)</span>
              </button>
              <button
                type="button"
                onClick={exportImpactReport}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/95 hover:bg-white border border-slate-200/90 text-slate-800 text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>داگرتنی TXT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Classic Filter Bar */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">فلتەرکردنی زانیاری و ئامارەکانی داشبۆرد</h3>
            </div>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>سڕینەوەی فلتەرەکان</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700">ماوەی کات (لە - بۆ):</label>
                <span className="text-xs text-cyan-800 font-mono font-bold bg-cyan-50 px-2 py-0.5 rounded-lg border border-cyan-200">
                  {fromDate} ⬅ {toDate}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <span className="text-xs text-slate-400 absolute start-2.5 top-2.5 pointer-events-none font-bold">لە:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-11 pe-7 ps-2 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 font-mono bg-white font-bold"
                  />
                </div>
                <div className="relative">
                  <span className="text-xs text-slate-400 absolute start-2.5 top-2.5 pointer-events-none font-bold">بۆ:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-11 pe-7 ps-2 text-xs sm:text-sm rounded-xl liquid-input text-slate-900 font-mono bg-white font-bold"
                  />
                </div>
              </div>
            </div>

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

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">گەڕانی دەقی لە داشبۆرد:</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
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

        {/* Classic KPI Cards (Embla Touch Carousel on mobile, Grid on desktop) */}
        <MobileKpiCarousel desktopGridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('donations')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('donations')}
            className="rounded-3xl bg-gradient-to-b from-sky-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-cyan-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
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
              </div>
            </div>
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-cyan-700 font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> بینینی تەواوی وردەکاری
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{filteredDonations.length} بەخشین</span>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('beneficiaries')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('beneficiaries')}
            className="rounded-3xl bg-gradient-to-b from-emerald-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
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
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> بینینی دۆسیەی خێزانەکان
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{unaidedBeneficiaries} چاوەڕوان</span>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('projects')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('projects')}
            className="rounded-3xl bg-gradient-to-b from-purple-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-purple-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
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
              <span className="text-purple-700 font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> بینینی پێشکەوتنی کەمپەینەکان
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{filteredProjects.length} پڕۆژە</span>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveModal('volunteers')}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveModal('volunteers')}
            className="rounded-3xl bg-gradient-to-b from-amber-50/60 to-white backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/90 hover:border-amber-400 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between min-h-[175px]"
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
              <span className="text-amber-700 font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> بینینی تیمی خۆبەخشان
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-600 text-xs">{filteredVolunteers.length} کەس</span>
            </div>
          </div>
        </MobileKpiCarousel>

        {/* Classic Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                const percent = Math.round((count / Math.max(1, totalBeneficiaries)) * 100);
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

          <div className="lg:col-span-2 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">دوایین هاوکارییە دابەشکراوەکان</h3>
                <p className="text-xs text-slate-500 mt-0.5">چالاکیی مەیدانی ڕاستەوخۆی ئەم دواییە</p>
              </div>
              <button
                type="button"
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
                recentAids.map(aid => (
                  <div key={aid.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/80 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-800 font-bold shrink-0">
                        {aid.type === 'monetary' ? 'د.ع' : <Package className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{aid.beneficiaryName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">{aid.projectTitle} • پارێزگای {aid.beneficiaryGov}</p>
                      </div>
                    </div>
                    <div className="text-start">
                      <span className="text-sm font-black text-cyan-800 block">
                        {aid.type === 'monetary' ? `${aid.amountIQD?.toLocaleString()} دینار` : `${aid.quantity} ${aid.itemName}`}
                      </span>
                      <span className="text-xs text-slate-400 font-medium font-mono">{aid.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Classic Governorate Breakdown */}
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
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
            <div className="lg:col-span-1 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
              {(() => {
                const coveragePct = totalBeneficiaries > 0 ? Math.round((aidedBeneficiaries / totalBeneficiaries) * 100) : 0;
                const radius = 52;
                const circumference = 2 * Math.PI * radius;
                const strokeDashoffset = circumference - (coveragePct / 100) * circumference;
                return (
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128" aria-label="ڕێژەی هاوکاریکردن">
                      <circle cx="64" cy="64" r={radius} fill="transparent" stroke="#e2e8f0" strokeWidth="12" />
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
            <div className="lg:col-span-3 space-y-3">
              {governoratesBreakdownClassic.map(({ gov, total, aided }) => {
                const maxGov = Math.max(1, ...governoratesBreakdownClassic.map(g => g.total));
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
                      <div className="h-full rounded-full bg-cyan-200 transition-all duration-500" style={{ width: `${totalWidth}%` }} />
                      <div className="h-full rounded-full bg-emerald-500 absolute top-0 end-0 transition-all duration-700" style={{ width: `${aidedWidth}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ENHANCED PROFESSIONAL UI/UX MODE (Default — Rule.md + 5 Plugins Compliant)
  // ============================================================================
  const coveragePercentage = totalBeneficiaries > 0 ? Math.round((aidedBeneficiaries / totalBeneficiaries) * 100) : 0;
  const maxGovernorateCount = Math.max(4, ...allSevenGovernorates.map(g => g.total));
  const yAxisTicks = [
    maxGovernorateCount,
    Math.round(maxGovernorateCount * 0.75),
    Math.round(maxGovernorateCount * 0.5),
    Math.round(maxGovernorateCount * 0.25),
    0
  ];

  return (
    <div className="space-y-7 pb-10">
      
      {/* ===================================================================== */}
      {/* 1. EXECUTIVE HEADER BANNER (Rule 2: Noise Reduction & Monochromatic)  */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white/95 backdrop-blur-2xl p-6 sm:p-8 border border-slate-200/70 shadow-[0_8px_30px_rgb(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-[10px] text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200/60 inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" strokeWidth={2} />
                <span>داشبۆردی شیکاری و چاودێری ڕاستەوخۆ</span>
              </span>
              {renderStyleSwitcher()}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              ناوەندی بەڕێوەبردنی کاروباری خێرخوازی و مرۆیی
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              پوختەی شەفافییەتی دارایی، دابەشکردنی کۆمەک، و ڕووماڵی مەیدانی خێزانە سوودمەندەکان لە سەرجەم شارەکانی کوردستان.
            </p>
          </div>

          {/* Rule 4.3: Paired Navigation/Utility Controls with identical height (h-10), radius (10px), and padding */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveModal('impact-report')}
              className="flex-1 sm:flex-none h-10 px-4 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-xs"
              title="چاپکردن و بینینی ڕاپۆرتی فەرمی کاریگەری (A4 PDF)"
            >
              <Printer className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>ڕاپۆرتی فەرمی (PDF)</span>
            </button>
            <button
              type="button"
              onClick={exportImpactReport}
              className="flex-1 sm:flex-none h-10 px-4 rounded-[10px] bg-slate-100 hover:bg-slate-200/80 active:scale-[0.98] border border-slate-200/80 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all"
              title="داگرتنی پوختەی ئاماری فلتەرکراو بە فایلی دەقی"
            >
              <Download className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={2} />
              <span>داگرتنی ڕاپۆرت (TXT)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. SYMMETRIC 5-COLUMN FILTER BAR + TIME PRESETS (Rules 1.2, 3.2, 4.1) */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white/95 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200/70 shadow-[0_8px_30px_rgb(15,23,42,0.03)] space-y-4">
        
        {/* Filter Header + 1-Click Time Period Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
              <Filter className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">فلتەرکردنی وردی ئامارەکان</h3>
              <p className="text-[11px] text-slate-500">هەموو کارت و چارتی پارێزگاکان ڕاستەوخۆ نوێ دەبنەوە</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'all', label: 'هەموو کات' },
                { id: 'this_year', label: 'ئەمساڵ' },
                { id: 'last_3_months', label: '٣ مانگی ڕابردوو' },
                { id: 'this_month', label: 'ئەم مانگە' }
              ] as { id: DatePresetType; label: string }[]
            ).map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyDatePreset(preset.id)}
                className={`h-8 px-3 rounded-[10px] text-xs font-bold transition-all active:scale-[0.97] ${
                  datePreset === preset.id
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {preset.label}
              </button>
            ))}

            {isAnyFilterActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-8 px-3 rounded-[10px] bg-rose-50 hover:bg-rose-100 border border-rose-200/80 text-rose-700 text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-[0.97]"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={2} />
                <span>سڕینەوە</span>
              </button>
            )}
          </div>
        </div>

        {/* Symmetric 5-Column Input Grid (Rule 4.1 & 4.2: Uniform h-10 height & 10px radius) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* Col 1: From Date (No cramped 2-in-1 overlap) */}
          <div>
            <label htmlFor="dash-from-date" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span>لە بەرواری:</span>
            </label>
            <input
              id="dash-from-date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full h-10 px-3 text-xs rounded-[10px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-cyan-500 focus:outline-none text-slate-900 font-mono font-bold transition-colors"
            />
          </div>

          {/* Col 2: To Date */}
          <div>
            <label htmlFor="dash-to-date" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span>بۆ بەرواری:</span>
            </label>
            <input
              id="dash-to-date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setDatePreset('custom');
              }}
              className="w-full h-10 px-3 text-xs rounded-[10px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-cyan-500 focus:outline-none text-slate-900 font-mono font-bold transition-colors"
            />
          </div>

          {/* Col 3: Governorate */}
          <div>
            <label htmlFor="dash-gov-filter" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span>پارێزگا و ناوچە:</span>
            </label>
            <select
              id="dash-gov-filter"
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-[10px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-cyan-500 focus:outline-none text-slate-900 cursor-pointer font-bold transition-colors"
            >
              <option value="all">هەموو پارێزگاکان (٧ ناوچە)</option>
              <option value="هەولێر">هەولێر</option>
              <option value="سلێمانی">سلێمانی</option>
              <option value="دهۆک">دهۆک</option>
              <option value="هەڵەبجە">هەڵەبجە</option>
              <option value="کەرکووک">کەرکووک</option>
              <option value="گەرمیان">گەرمیان</option>
              <option value="زاخۆ">زاخۆ</option>
            </select>
          </div>

          {/* Col 4: Need Category */}
          <div>
            <label htmlFor="dash-cat-filter" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span>حاڵەتی سوودمەند:</span>
            </label>
            <select
              id="dash-cat-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs rounded-[10px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-cyan-500 focus:outline-none text-slate-900 cursor-pointer font-bold transition-colors"
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

          {/* Col 5: Standardized Search Bar with inline clear micro-action */}
          <div>
            <label htmlFor="dash-search-input" className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
              <span>گەڕانی خێرا:</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-3 pointer-events-none" strokeWidth={2} />
              <input
                id="dash-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ناو، مۆبایل، پسوولە..."
                className="w-full h-10 ps-9 pe-8 text-xs rounded-[10px] bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-cyan-500 focus:outline-none text-slate-900 placeholder-slate-400 font-bold transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="پاککردنەوەی گەڕان"
                  className="absolute end-2.5 top-2.5 p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. KPI CARDS (Embla Touch Carousel on mobile, Grid on desktop) */}
      {/* ===================================================================== */}
      <MobileKpiCarousel desktopGridClassName="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Total Donations */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveModal('donations')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActiveModal('donations'))}
          aria-label="کۆی بەخشینەکان - کلیک بکە بۆ بینینی وردەکاری"
          className="rounded-3xl bg-white p-6 border border-slate-200/70 hover:border-cyan-300 shadow-[0_8px_30px_rgb(15,23,42,0.03)] hover:shadow-[0_12px_36px_rgb(8,145,178,0.08)] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between min-h-[168px] focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[10px] bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
              <TrendingUp className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="px-2.5 py-1 rounded-[10px] bg-slate-100 text-slate-700 font-mono font-bold text-xs">
              {filteredDonations.length.toLocaleString()} پسوولە
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {currencyView === 'IQD'
                ? `${totalDonationsIQD.toLocaleString()} د.ع`
                : `$${totalDonationsUSD.toLocaleString()}`}
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">کۆی بەخشینەکان</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-cyan-700">
              {currencyView === 'IQD'
                ? `هاوتای $${totalDonationsUSD.toLocaleString()}`
                : `هاوتای ${totalDonationsIQD.toLocaleString()} د.ع`}
            </span>
            <span
              className="w-7 h-7 rounded-[8px] bg-slate-50 group-hover:bg-cyan-50 text-slate-400 group-hover:text-cyan-700 flex items-center justify-center transition-colors"
              title="بینینی لیستی پسوولەکان"
            >
              <ArrowUpLeft className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </div>

        {/* KPI 2: Beneficiaries */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveModal('beneficiaries')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActiveModal('beneficiaries'))}
          aria-label="خێزانە سوودمەندەکان - کلیک بکە بۆ بینینی وردەکاری"
          className="rounded-3xl bg-white p-6 border border-slate-200/70 hover:border-emerald-300 shadow-[0_8px_30px_rgb(15,23,42,0.03)] hover:shadow-[0_12px_36px_rgb(16,185,129,0.08)] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between min-h-[168px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[10px] bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Users className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="px-2.5 py-1 rounded-[10px] bg-emerald-50 text-emerald-800 font-mono font-bold text-xs">
              {coveragePercentage}٪ ڕووماڵکراو
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalBeneficiaries.toLocaleString()} <span className="text-sm font-bold text-slate-500 font-sans">خێزان</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">خێزانە سوودمەندەکان</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-700">
              <span className="font-mono">{aidedBeneficiaries.toLocaleString()}</span> هاوکاریکراو •{' '}
              <span className="font-mono text-slate-500">{unaidedBeneficiaries.toLocaleString()} چاوەڕوان</span>
            </span>
            <span
              className="w-7 h-7 rounded-[8px] bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 flex items-center justify-center transition-colors"
              title="بینینی دۆسیەی خێزانەکان"
            >
              <ArrowUpLeft className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </div>

        {/* KPI 3: Active Projects */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveModal('projects')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActiveModal('projects'))}
          aria-label="پڕۆژە چالاکەکان - کلیک بکە بۆ بینینی وردەکاری"
          className="rounded-3xl bg-white p-6 border border-slate-200/70 hover:border-indigo-300 shadow-[0_8px_30px_rgb(15,23,42,0.03)] hover:shadow-[0_12px_36px_rgb(79,70,229,0.08)] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between min-h-[168px] focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[10px] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FolderKanban className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="px-2.5 py-1 rounded-[10px] bg-slate-100 text-slate-700 font-mono font-bold text-xs">
              کۆی {filteredProjects.length.toLocaleString()} پڕۆژە
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {activeProjectsCount.toLocaleString()} <span className="text-sm font-bold text-slate-500 font-sans">چالاک</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">پڕۆژە و کەمپەینە مەیدانییەکان</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-700">
              <span className="font-mono">{filteredProjects.filter(p => p.status === 'completed').length}</span> پڕۆژەی تەواوکراو
            </span>
            <span
              className="w-7 h-7 rounded-[8px] bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-700 flex items-center justify-center transition-colors"
              title="بینینی بودجە و کەمپەینەکان"
            >
              <ArrowUpLeft className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </div>

        {/* KPI 4: Volunteers */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveModal('volunteers')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setActiveModal('volunteers'))}
          aria-label="خزمەتی خۆبەخشان - کلیک بکە بۆ بینینی وردەکاری"
          className="rounded-3xl bg-white p-6 border border-slate-200/70 hover:border-amber-300 shadow-[0_8px_30px_rgb(15,23,42,0.03)] hover:shadow-[0_12px_36px_rgb(217,119,6,0.08)] active:scale-[0.98] transition-all cursor-pointer group flex flex-col justify-between min-h-[168px] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-[10px] bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <UserCheck className="w-5 h-5" strokeWidth={2} />
            </div>
            <span className="px-2.5 py-1 rounded-[10px] bg-amber-50 text-amber-800 font-mono font-bold text-xs">
              {filteredVolunteers.length.toLocaleString()} خۆبەخش
            </span>
          </div>

          <div className="my-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
              {totalVolunteerHours.toLocaleString()} <span className="text-sm font-bold text-slate-500 font-sans">کاتژمێر</span>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">خزمەتی تیمی خۆبەخشان</p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-800">
              تێکڕای <span className="font-mono">{Math.round(totalVolunteerHours / Math.max(1, filteredVolunteers.length))}</span> کاتژمێر / کەس
            </span>
            <span
              className="w-7 h-7 rounded-[8px] bg-slate-50 group-hover:bg-amber-50 text-slate-400 group-hover:text-amber-700 flex items-center justify-center transition-colors"
              title="بینینی لیستی خۆبەخشان"
            >
              <ArrowUpLeft className="w-4 h-4" strokeWidth={2} />
            </span>
          </div>
        </div>

      </MobileKpiCarousel>

      {/* ===================================================================== */}
      {/* 4. PRECISION GOVERNORATE BAR CHART WITH Y-AXIS & DONUT GAUGE (Rule 8) */}
      {/* ===================================================================== */}
      <div className="rounded-3xl bg-white/95 backdrop-blur-2xl p-6 sm:p-7 border border-slate-200/70 shadow-[0_8px_30px_rgb(15,23,42,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700">
              <BarChart3 className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                شیکاری ڕووماڵکردنی خێزانەکان لەسەر ئاستی سەرجەم پارێزگاکان (٧ ناوچە)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                بەراوردی ورد بەپێی تەوەری ستوونی (Y-Axis)؛ کلیک لەسەر هەر پارێزگایەک بکە بۆ فلتەرکردنی ڕاستەوخۆ
              </p>
            </div>
          </div>

          {/* Explicit Chart Legend with Count & Percentage (charity-data-viz-studio Rule 3) */}
          <div className="flex items-center gap-4 text-xs font-bold bg-slate-50 px-3.5 py-2 rounded-[10px] border border-slate-200/60">
            <span className="flex items-center gap-2 text-slate-700">
              <span className="w-3 h-3 rounded-[3px] bg-cyan-600 inline-block" />
              <span>کۆی تۆمارکراو:</span>
              <span className="font-mono font-black text-slate-900">{totalBeneficiaries.toLocaleString()}</span>
            </span>
            <span className="w-px h-4 bg-slate-200" />
            <span className="flex items-center gap-2 text-emerald-800">
              <span className="w-3 h-3 rounded-[3px] bg-emerald-500 inline-block" />
              <span>هاوکاریکراو:</span>
              <span className="font-mono font-black text-emerald-700">
                {aidedBeneficiaries.toLocaleString()} ({coveragePercentage}٪)
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left/Start 4 Columns: SVG Donut Gauge + Actionable Waiting Insight (build-impact-chart) */}
          <div className="lg:col-span-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 p-5 flex flex-col justify-between">
            <div className="flex flex-col items-center text-center">
              {(() => {
                const radius = 48;
                const circumference = 2 * Math.PI * radius;
                const dashVal = (coveragePercentage / 100) * circumference;
                return (
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 120 120" aria-label="ڕێژەی گشتی ڕووماڵکردنی خێزانەکان">
                      <title>ڕێژەی گشتی هاوکاریکردنی خێزانەکان: {coveragePercentage}%</title>
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${dashVal} ${circumference}`}
                        transform="rotate(-90 60 60)"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900 font-mono">{coveragePercentage}٪</span>
                      <span className="text-xs font-bold text-emerald-700 mt-0.5">ڕووماڵکراو</span>
                    </div>
                  </div>
                );
              })()}
              <p className="text-xs font-bold text-slate-700 mt-3">
                لە کۆی <span className="font-mono font-black">{totalBeneficiaries.toLocaleString()}</span> خێزانی تۆمارکراو،{' '}
                <span className="font-mono font-black text-emerald-700">{aidedBeneficiaries.toLocaleString()}</span> خێزان کۆمەکیان وەرگرتووە
              </p>
            </div>

            {/* Actionable Insight Box (charity-data-viz-studio Rule 3) */}
            <div className="mt-4 pt-3.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
              <div className="text-xs">
                <span className="text-slate-500 block font-medium">خێزانی چاوەڕوان (هاوکاری نەکراو):</span>
                <span className="font-mono font-black text-amber-700 text-sm">
                  {unaidedBeneficiaries.toLocaleString()} خێزان ({100 - coveragePercentage}٪)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('beneficiaries')}
                className="h-8 px-3 rounded-[10px] bg-white hover:bg-slate-100 border border-slate-200/80 text-slate-800 text-xs font-bold transition-colors shrink-0"
              >
                دابەشکردن
              </button>
            </div>
          </div>

          {/* Right/End 8 Columns: Precision Vertical Bar Chart with Y-Axis, Gridlines & Flat/4px Bar Tops (Rule 8.2, 8.3, 8.4) */}
          <div className="lg:col-span-8 rounded-2xl bg-slate-50/40 border border-slate-200/60 p-4 sm:p-5 flex flex-col justify-between">
            <div className="relative flex gap-3 h-56 sm:h-60 pt-4 pb-1">
              
              {/* Y-Axis Numerical Scale Labels (Rule 8.2) */}
              <div className="flex flex-col justify-between text-[11px] font-mono font-bold text-slate-400 pe-2 select-none text-end w-8 shrink-0">
                {yAxisTicks.map((tick, idx) => (
                  <span key={idx} className="leading-none">
                    {tick}
                  </span>
                ))}
              </div>

              {/* Plot Area with Horizontal Baseline Gridlines + 7 Governorate Columns */}
              <div className="relative flex-1 flex flex-col justify-between">
                {/* Horizontal Reference Gridlines (Rule 8.2) */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {yAxisTicks.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-full ${
                        idx === yAxisTicks.length - 1
                          ? 'border-b border-slate-300'
                          : 'border-b border-dashed border-slate-200/80'
                      }`}
                    />
                  ))}
                </div>

                {/* 7 Governorate Bar Groups (Rule 8.3: Subtly rounded 4px bar tops, Rule 8.4: All 7 plotted) */}
                <div className="relative z-10 flex-1 grid grid-cols-7 gap-1.5 sm:gap-3 items-end px-1 sm:px-2">
                  {allSevenGovernorates.map(({ gov, total, aided }) => {
                    const totalHeightPct = Math.round((total / maxGovernorateCount) * 100);
                    const aidedHeightPct = Math.round((aided / maxGovernorateCount) * 100);
                    const isSelectedGov = governorateFilter === gov;

                    return (
                      <button
                        key={gov}
                        type="button"
                        onClick={() => setGovernorateFilter(isSelectedGov ? 'all' : gov)}
                        aria-pressed={isSelectedGov}
                        title={`${gov}: ${total} تۆمارکراو | ${aided} هاوکاریکراو (کلیک بکە بۆ فلتەرکردن)`}
                        className={`group h-full flex flex-col justify-end items-center rounded-t-[8px] px-1 pt-4 transition-colors focus:outline-none ${
                          isSelectedGov ? 'bg-cyan-50/80 ring-1 ring-cyan-300' : 'hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-1.5">
                          {/* Total Registered Bar (Rule 8.3: rounded-t-[4px] flat top accuracy) */}
                          <div className="flex flex-col items-center justify-end h-full w-3 sm:w-4">
                            <span className="text-[11px] font-mono font-bold text-slate-600 mb-1 leading-none">
                              {total}
                            </span>
                            <div
                              className="w-full rounded-t-[4px] bg-cyan-600 group-hover:bg-cyan-700 transition-all duration-500"
                              style={{ height: `${Math.max(total > 0 ? 6 : 2, totalHeightPct)}%` }}
                            />
                          </div>

                          {/* Aided Bar (Rule 8.3: rounded-t-[4px] flat top accuracy) */}
                          <div className="flex flex-col items-center justify-end h-full w-3 sm:w-4">
                            <span className="text-[11px] font-mono font-bold text-emerald-700 mb-1 leading-none">
                              {aided}
                            </span>
                            <div
                              className="w-full rounded-t-[4px] bg-emerald-500 group-hover:bg-emerald-600 transition-all duration-500"
                              style={{ height: `${Math.max(aided > 0 ? 6 : 2, aidedHeightPct)}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* X-Axis Category Labels (All 7 Governorates matched 1:1 to columns — Rule 8.4) */}
            <div className="flex gap-3 pt-2.5">
              <div className="w-8 shrink-0" />
              <div className="flex-1 grid grid-cols-7 gap-1.5 sm:gap-3 text-center px-1 sm:px-2">
                {allSevenGovernorates.map(({ gov, total, aided }) => {
                  const pct = total > 0 ? Math.round((aided / total) * 100) : 0;
                  const isSelectedGov = governorateFilter === gov;
                  return (
                    <button
                      key={gov}
                      type="button"
                      onClick={() => setGovernorateFilter(isSelectedGov ? 'all' : gov)}
                      className={`text-center rounded-[8px] py-1 transition-colors ${
                        isSelectedGov
                          ? 'bg-cyan-600 text-white font-black'
                          : 'text-slate-700 hover:bg-slate-100 font-bold'
                      }`}
                    >
                      <span className="text-xs block truncate">{gov}</span>
                      <span
                        className={`text-[11px] font-mono block ${
                          isSelectedGov ? 'text-cyan-100' : 'text-slate-400'
                        }`}
                      >
                        {pct}٪
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. NEEDS BREAKDOWN & LIVE AID STREAM (Rule 5.2, Rule 8.3, EmptyState) */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Needs Category Breakdown (5 Columns) */}
        <div className="lg:col-span-5 rounded-3xl bg-white/95 backdrop-blur-2xl p-6 border border-slate-200/70 shadow-[0_8px_30px_rgb(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">پۆلێنکردنی حاڵەتەکانی پێویستی</h3>
                <p className="text-xs text-slate-500 mt-0.5">کلیک لەسەر هەر حاڵەتێک بکە بۆ فلتەرکردن</p>
              </div>
              <span className="px-2.5 py-1 rounded-[10px] bg-slate-100 text-slate-800 font-mono font-bold text-xs">
                {totalBeneficiaries.toLocaleString()} خێزان
              </span>
            </div>

            <div className="space-y-2.5">
              {categoriesData.map(({ key, label, icon: IconComp, count }) => {
                const percent = Math.round((count / Math.max(1, totalBeneficiaries)) * 100);
                const isSelected = categoryFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategoryFilter(isSelected ? 'all' : key)}
                    aria-pressed={isSelected}
                    className={`w-full text-start p-2.5 rounded-[10px] border transition-all active:scale-[0.99] ${
                      isSelected
                        ? 'bg-cyan-50/80 border-cyan-300 shadow-xs'
                        : 'bg-slate-50/60 hover:bg-slate-100/70 border-slate-200/50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-bold text-slate-800">
                        <IconComp className="w-4 h-4 text-cyan-700 shrink-0" strokeWidth={2} />
                        <span>{label}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {count.toLocaleString()} <span className="text-slate-400">({percent}٪)</span>
                      </span>
                    </div>
                    {/* Rule 8.3 & Rule 2.2: Monochromatic bar with 4px radius instead of gradient pill */}
                    <div className="w-full h-2 rounded-[4px] bg-slate-200/70 overflow-hidden">
                      <div
                        className="h-full rounded-[4px] bg-cyan-600 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {categoryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className="mt-4 w-full h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              پیشاندانەوەی هەموو حاڵەتەکان
            </button>
          )}
        </div>

        {/* Live Aid Distribution Stream (7 Columns) */}
        <div className="lg:col-span-7 rounded-3xl bg-white/95 backdrop-blur-2xl p-6 border border-slate-200/70 shadow-[0_8px_30px_rgb(15,23,42,0.03)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">دوایین هاوکارییە دابەشکراوەکان</h3>
                <p className="text-xs text-slate-500 mt-0.5">تۆماری ڕاستەوخۆی کۆمەکی نەختینەیی و کەلوپەلی مەیدانی</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('beneficiaries')}
                className="h-9 px-3.5 rounded-[10px] bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors"
              >
                بینینی هەموو تۆمارەکان
              </button>
            </div>

            {recentAids.length === 0 ? (
              /* Liquid Glass Empty State (liquid-glass-polish Rule 3) */
              <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/60 border border-dashed border-slate-200/80 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center mx-auto text-slate-300 shadow-xs">
                  <Package className="w-6 h-6" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-slate-700">هیچ هاوکارییەک لەم ماوەیەدا تۆمار نەکراوە</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    بە تۆمارکردنی دابەشکردنی کۆمەک بۆ خێزانە سوودمەندەکان یان گۆڕینی فلتەرەکان، چالاکییەکان لێرە دەردەکەون.
                  </p>
                </div>
                {isAnyFilterActive && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-9 px-4 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>سڕینەوەی فلتەرەکان</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAids.map(aid => (
                  <div
                    key={aid.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 hover:bg-slate-100/70 border border-slate-200/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rule 5.2: Strict SVG Icon Uniformity (Banknote SVG instead of raw 'د.ع' text) */}
                      <div
                        className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 border ${
                          aid.type === 'monetary'
                            ? 'bg-emerald-50 border-emerald-200/70 text-emerald-700'
                            : 'bg-cyan-50 border-cyan-200/70 text-cyan-700'
                        }`}
                      >
                        {aid.type === 'monetary' ? (
                          <Banknote className="w-5 h-5" strokeWidth={2} />
                        ) : (
                          <Package className="w-5 h-5" strokeWidth={2} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 truncate">{aid.beneficiaryName}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                          {aid.projectTitle} • پارێزگای {aid.beneficiaryGov}
                        </p>
                      </div>
                    </div>

                    <div className="text-end shrink-0 ms-3">
                      <span
                        className={`text-xs sm:text-sm font-black font-mono block ${
                          aid.type === 'monetary' ? 'text-emerald-700' : 'text-cyan-800'
                        }`}
                      >
                        {aid.type === 'monetary'
                          ? `${aid.amountIQD?.toLocaleString()} د.ع`
                          : `${aid.quantity} ${aid.itemName}`}
                      </span>
                      <span className="text-xs text-slate-400 font-mono block mt-0.5">{aid.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Operational Launchpad Integrated at Bottom of Stream Card */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-500 block mb-2.5">دەستپێشخەری و کرداری خێرا:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('beneficiaries')}
                className="h-10 px-3 rounded-[10px] bg-slate-50 hover:bg-cyan-50 border border-slate-200/70 hover:border-cyan-200 text-slate-800 hover:text-cyan-900 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Users className="w-4 h-4 text-cyan-600 shrink-0" strokeWidth={2} />
                <span className="truncate">تۆماری سوودمەند</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('donors')}
                className="h-10 px-3 rounded-[10px] bg-slate-50 hover:bg-emerald-50 border border-slate-200/70 hover:border-emerald-200 text-slate-800 hover:text-emerald-900 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                <span className="truncate">پسوولەی بەخشین</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className="h-10 px-3 rounded-[10px] bg-slate-50 hover:bg-amber-50 border border-slate-200/70 hover:border-amber-200 text-slate-800 hover:text-amber-900 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Package className="w-4 h-4 text-amber-600 shrink-0" strokeWidth={2} />
                <span className="truncate">دابەشکردنی کۆگا</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('geo')}
                className="h-10 px-3 rounded-[10px] bg-slate-50 hover:bg-indigo-50 border border-slate-200/70 hover:border-indigo-200 text-slate-800 hover:text-indigo-900 text-xs font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <MapPin className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2} />
                <span className="truncate">نەخشەی ماڵەکان</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ACCESSIBLE STICKY-HEADER/FOOTER MODALS WITH SEARCH (a11y + Rule 1.2)      */}
      {/* ========================================================================= */}

      {/* MODAL 1: Full Details for Donations (کۆی بەخشینەکان) */}
      {activeModal === 'donations' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-donations-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-cyan-50 border border-cyan-200/70 flex items-center justify-center text-cyan-700">
                  <TrendingUp className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 id="dash-donations-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                    وردەکاری و لیستی بەخشینەکان
                  </h3>
                  <p className="text-xs text-slate-500">بەدواداچوونی سەرجەم داهاتە نەختینەییەکان و پسوولەکان</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="داخستن"
                className="w-9 h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/70">
                  <span className="text-xs font-bold text-cyan-800 block">کۆی بەخشین (دینار):</span>
                  <span className="text-base sm:text-lg font-black font-mono text-cyan-950">
                    {totalDonationsIQD.toLocaleString()} د.ع
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                  <span className="text-xs font-bold text-emerald-800 block">کۆی بەخشین (دۆلار):</span>
                  <span className="text-base sm:text-lg font-black font-mono text-emerald-950">
                    ${totalDonationsUSD.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-600 block">ژمارەی پسوولەکان:</span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                    {filteredDonations.length.toLocaleString()} پسوولە
                  </span>
                </div>
              </div>

              {/* Rule 1.2: Search Input inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="گەڕان لەناو پسوولەکان (ناوی بەخشەر، ژمارەی پسوولە، پڕۆژە)..."
                  className="w-full h-10 ps-10 pe-8 text-xs rounded-[10px] bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none font-bold text-slate-900"
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    aria-label="پاککردنەوەی گەڕان"
                    className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Donations List */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>لیستی پسوولەکان</span>
                  <span className="font-mono">{modalFilteredDonations.length} تۆمار</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {modalFilteredDonations.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-bold">
                      هیچ پسوولەیەکی بەخشین نەدۆزرایەوە
                    </div>
                  ) : (
                    modalFilteredDonations.map(d => {
                      const dayRate = d.exchangeRateAtDate || getExchangeRateForDate(d.date).rate;
                      const conv =
                        d.convertedAmount ||
                        (d.currency === 'IQD'
                          ? Number((d.amount / dayRate).toFixed(2))
                          : Math.round(d.amount * dayRate));
                      return (
                        <div key={d.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{d.donorName}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {d.receiptNumber} • {d.method} • {d.date}
                            </p>
                          </div>
                          <div className="text-end">
                            <span className="font-black font-mono text-emerald-700 text-sm block">
                              {d.amount.toLocaleString()} {d.currency === 'IQD' ? 'د.ع' : '$'}
                            </span>
                            {d.amount > 0 && (
                              <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 justify-end mt-0.5">
                                <span className="text-cyan-700 font-bold">
                                  {d.currency === 'IQD' ? `≈ $${conv.toLocaleString()}` : `≈ ${conv.toLocaleString()} د.ع`}
                                </span>
                                <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                  {dayRate.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer (Rule 4.3 & Rule 6.2: Matched buttons, no arrow clutter) */}
            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-10 px-4 rounded-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('donors');
                }}
                className="h-10 px-5 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                کردنەوەی پەڕەی بەخشەران
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Details for Beneficiaries (خێزانە سوودمەندەکان) */}
      {activeModal === 'beneficiaries' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-beneficiaries-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-emerald-700">
                  <Users className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 id="dash-beneficiaries-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                    وردەکاری خێزانە سوودمەندەکان
                  </h3>
                  <p className="text-xs text-slate-500">دۆسیەی خێزانە پەسەندکراوەکان و چاوەڕوانکراوەکان</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="داخستن"
                className="w-9 h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
                  <span className="text-xs text-slate-500 block font-bold">کۆی خێزان:</span>
                  <span className="text-base font-black font-mono text-slate-900">{totalBeneficiaries}</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 text-center">
                  <span className="text-xs text-emerald-800 block font-bold">هاوکاریکراو:</span>
                  <span className="text-base font-black font-mono text-emerald-900">{aidedBeneficiaries}</span>
                </div>
                <div className="p-3 rounded-2xl bg-cyan-50/70 border border-cyan-200/70 text-center">
                  <span className="text-xs text-cyan-800 block font-bold">پەسەندکراو:</span>
                  <span className="text-base font-black font-mono text-cyan-900">
                    {filteredBeneficiaries.filter(b => b.status === 'approved').length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-center">
                  <span className="text-xs text-amber-800 block font-bold">لەژێر پشکنین:</span>
                  <span className="text-base font-black font-mono text-amber-900">
                    {filteredBeneficiaries.filter(b => b.status === 'pending').length}
                  </span>
                </div>
              </div>

              {/* Search inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="گەڕان بەپێی ناوی سەرۆکی خێزان، پارێزگا، گەڕەک یان مۆبایل..."
                  className="w-full h-10 ps-10 pe-8 text-xs rounded-[10px] bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none font-bold text-slate-900"
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    aria-label="پاککردنەوەی گەڕان"
                    className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Beneficiaries List with Semantic Icon Badges (liquid-glass-polish Rule 2) */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>لیستی خێزانەکان</span>
                  <span className="font-mono">{modalFilteredBeneficiaries.length} خێزان</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {modalFilteredBeneficiaries.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-bold">
                      هیچ خێزانێکی سوودمەند نەدۆزرایەوە
                    </div>
                  ) : (
                    modalFilteredBeneficiaries.map(b => (
                      <div key={b.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{b.fullName}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {b.governorate} • {b.address} • <span className="font-mono">{b.familyMembers}</span> ئەندام
                          </p>
                        </div>
                        <div className="text-end flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {b.status === 'pending' ? (
                              <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> لەژێر پشکنین
                              </span>
                            ) : b.status === 'confidential' ? (
                              <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> نهێنی
                              </span>
                            ) : b.status === 'urgent' ? (
                              <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> بەپەلە
                              </span>
                            ) : b.status === 'approved' ? (
                              <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> پەسەندکراو
                              </span>
                            ) : null}

                            {(b.status === 'aided' || (b.aidHistory && b.aidHistory.length > 0)) && (
                              <span className="px-2 py-0.5 rounded-[8px] text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
                                هاوکاریکراو ({b.aidHistory.length})
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-600 font-mono">
                            داهات: {b.monthlyIncomeIQD.toLocaleString()} د.ع
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-10 px-4 rounded-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('beneficiaries');
                }}
                className="h-10 px-5 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                کردنەوەی پەڕەی سوودمەندان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Full Details for Projects (پڕۆژە چالاکەکان) */}
      {activeModal === 'projects' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-projects-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-indigo-50 border border-indigo-200/70 flex items-center justify-center text-indigo-700">
                  <FolderKanban className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 id="dash-projects-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                    وردەکاری پڕۆژە و کەمپەینەکان
                  </h3>
                  <p className="text-xs text-slate-500">بەراوردی بودجە و پێشکەوتنی جێبەجێکردن لە مەیداندا</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="داخستن"
                className="w-9 h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Search inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="گەڕان لەناو پڕۆژەکان (ناونیشان، پۆلێن، پارێزگا)..."
                  className="w-full h-10 ps-10 pe-8 text-xs rounded-[10px] bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none font-bold text-slate-900"
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    aria-label="پاککردنەوەی گەڕان"
                    className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pe-1">
                {modalFilteredProjects.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-bold">
                    هیچ پڕۆژەیەک نەدۆزرایەوە
                  </div>
                ) : (
                  modalFilteredProjects.map(p => {
                    const linkedDonations = donations.filter(d => d.projectId === p.id);
                    const directIncomeTx = transactions.filter(
                      t =>
                        t.relatedProjectId === p.id &&
                        t.type === 'income' &&
                        (!t.receiptNumber || !linkedDonations.some(d => d.receiptNumber === t.receiptNumber))
                    );
                    const donAgg = aggregateAmountsByDayRate(linkedDonations);
                    const txIncomeAgg = aggregateAmountsByDayRate(directIncomeTx);
                    const pRaisedUSD = Number((donAgg.totalUSD + txIncomeAgg.totalUSD).toFixed(2));
                    const raisedPercent =
                      p.targetBudgetUSD > 0 ? Math.min(100, Math.round((pRaisedUSD / p.targetBudgetUSD) * 100)) : 0;

                    return (
                      <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{p.title}</h4>
                            <span className="text-xs text-indigo-700 font-bold">
                              {p.category} • {p.governorates.join('، ')}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-[8px] text-xs font-bold inline-flex items-center gap-1 ${
                              p.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {p.status === 'completed' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" /> تەواوکراو
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" /> بەردەوامە
                              </>
                            )}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-slate-600 font-mono">
                            <span>
                              کۆکراوە: ${pRaisedUSD.toLocaleString()} / ${p.targetBudgetUSD.toLocaleString()}
                            </span>
                            <span className="font-bold text-emerald-700">{raisedPercent}٪</span>
                          </div>
                          <div className="w-full h-2 rounded-[4px] bg-slate-200 overflow-hidden">
                            <div
                              className="h-full rounded-[4px] bg-emerald-500 transition-all duration-500"
                              style={{ width: `${raisedPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/70">
                          <span>
                            <strong className="font-mono text-slate-700">{p.beneficiariesCount}</strong> سوودمەند •{' '}
                            <strong className="font-mono text-slate-700">{p.volunteersCount}</strong> خۆبەخش
                          </span>
                          <span className="font-mono">
                            {p.startDate} تا {p.endDate}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-10 px-4 rounded-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('projects');
                }}
                className="h-10 px-5 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                کردنەوەی پەڕەی پڕۆژەکان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Details for Volunteers (خزمەتی خۆبەخشان) */}
      {activeModal === 'volunteers' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-volunteers-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[88vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700">
                  <UserCheck className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 id="dash-volunteers-modal-title" className="text-base sm:text-lg font-black text-slate-900">
                    وردەکاری تیمی خۆبەخشان
                  </h3>
                  <p className="text-xs text-slate-500">تۆماری کاتژمێرەکان، لێهاتووییەکان و ئەندامانی تیم</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="داخستن"
                className="w-9 h-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                  <span className="text-xs font-bold text-amber-800 block">کۆی کاتژمێری خزمەت:</span>
                  <span className="text-base sm:text-lg font-black font-mono text-amber-950">
                    {totalVolunteerHours.toLocaleString()} کاتژمێر
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/70">
                  <span className="text-xs font-bold text-cyan-800 block">ئەندامانی خۆبەخش:</span>
                  <span className="text-base sm:text-lg font-black font-mono text-cyan-950">
                    {filteredVolunteers.length.toLocaleString()} کەس
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-600 block">تێکڕای خزمەت:</span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900">
                    {Math.round(totalVolunteerHours / Math.max(1, filteredVolunteers.length))} کاتژمێر
                  </span>
                </div>
              </div>

              {/* Search inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="گەڕان بەپێی ناوی خۆبەخش، کۆدی باج یان پارێزگا..."
                  className="w-full h-10 ps-10 pe-8 text-xs rounded-[10px] bg-slate-50 focus:bg-white border border-slate-200 focus:border-cyan-500 focus:outline-none font-bold text-slate-900"
                />
                {modalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setModalSearchQuery('')}
                    aria-label="پاککردنەوەی گەڕان"
                    className="absolute end-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200/80 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200/80 text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>لیستی ئەندامانی تیمی مەیدانی</span>
                  <span className="font-mono">{modalFilteredVolunteers.length} ئەندام</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {modalFilteredVolunteers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-bold">
                      هیچ خۆبەخشێک نەدۆزرایەوە
                    </div>
                  ) : (
                    modalFilteredVolunteers.map(v => (
                      <div key={v.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[10px] bg-cyan-600 flex items-center justify-center text-white font-black text-sm">
                            {v.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{v.fullName}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {v.badgeNumber} • {v.governorate} • خوێن: {v.bloodType}
                            </p>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="font-black font-mono text-amber-700 text-sm block">
                            {v.hoursLogged} کاتژمێر
                          </span>
                          <span className="text-xs text-slate-500">{v.availability}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="h-10 px-4 rounded-[10px] bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                داخستن
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setActiveTab('volunteers');
                }}
                className="h-10 px-5 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                کردنەوەی پەڕەی خۆبەخشان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Official Printable Impact Report (#printable-impact-report) */}
      {activeModal === 'impact-report' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveModal(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dash-impact-report-title"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200/90 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          >
            {/* Sticky Non-Print Header */}
            <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white shrink-0 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-cyan-50 border border-cyan-200/70 flex items-center justify-center text-cyan-700">
                  <Printer className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 id="dash-impact-report-title" className="text-base sm:text-lg font-black text-slate-900">
                    ڕاپۆرتی فەرمی کاریگەری و شەفافییەت (A4)
                  </h3>
                  <p className="text-xs text-slate-500">ئامادەکراو بۆ چاپکردن و پێشکەشکردن بە دەستەی کارگێڕی و بەخشەران</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-10 px-4 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپکردن / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="داخستن"
                  className="w-10 h-10 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable A4 Container */}
            <div className="p-6 overflow-y-auto flex-1">
              <div id="printable-impact-report" className="p-6 rounded-2xl border-2 border-slate-800 bg-white space-y-6 text-slate-900">
                {/* Official Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-black text-slate-900">ڕێکخراوی بۆتان بامۆکی بۆ کاروباری خێرخوازی و مرۆیی</h1>
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
                    <span className="text-xs font-bold text-slate-600 block">کۆی بەخشین (دینار)</span>
                    <span className="text-base font-black font-mono text-slate-900">{totalDonationsIQD.toLocaleString()} د.ع</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-xs font-bold text-slate-600 block">کۆی بەخشین (دۆلار)</span>
                    <span className="text-base font-black font-mono text-emerald-800">${totalDonationsUSD.toLocaleString()}</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-xs font-bold text-slate-600 block">خێزانە سوودمەندەکان</span>
                    <span className="text-base font-black font-mono text-slate-900">{aidedBeneficiaries} / {totalBeneficiaries}</span>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-300 bg-slate-50">
                    <span className="text-xs font-bold text-slate-600 block">خزمەتی خۆبەخشان</span>
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
                  <table className="w-full text-start text-xs border border-slate-300">
                    <thead className="bg-slate-100 border-b border-slate-300 font-bold">
                      <tr>
                        <th className="p-2 text-start">سوودمەند</th>
                        <th className="p-2 text-start">پڕۆژە / بابەت</th>
                        <th className="p-2 text-start">پارێزگا</th>
                        <th className="p-2 text-start">بڕ / کاڵا</th>
                        <th className="p-2 text-start">بەروار</th>
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
                    <p>مۆری فەرمی ڕێکخراو و واژۆی بەرپرس</p>
                    <div className="h-10 border-b border-dashed border-slate-400 w-40 mx-auto mt-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
