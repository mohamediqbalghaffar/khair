import React from 'react';
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
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DashboardView: React.FC = () => {
  const {
    beneficiaries,
    donations,
    projects,
    volunteers,
    currencyView,
    setActiveTab
  } = useApp();

  // Calculations
  const totalDonationsIQD = donations
    .filter(d => d.currency === 'IQD')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalDonationsUSD = donations
    .filter(d => d.currency === 'USD')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalBeneficiaries = beneficiaries.length;
  const aidedBeneficiaries = beneficiaries.filter(b => b.status === 'aided').length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  const totalVolunteerHours = volunteers.reduce((sum, v) => sum + v.hoursLogged, 0);

  // Trigger celebratory confetti
  const celebrateImpact = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  // Recent aid activities across beneficiaries
  const recentAids = beneficiaries
    .flatMap(b => b.aidHistory.map(a => ({ ...a, beneficiaryName: b.fullName, beneficiaryGov: b.governorate })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Category counts for beneficiaries
  const categoriesMap: Record<string, number> = {
    'هەژار و کەمدەرامەت': beneficiaries.filter(b => b.needCategory === 'poor').length,
    'بێباوک و هەتیو': beneficiaries.filter(b => b.needCategory === 'orphan').length,
    'نەخۆش و دەستکورت': beneficiaries.filter(b => b.needCategory === 'sick').length,
    'خاوەن پێداویستی تایبەت': beneficiaries.filter(b => b.needCategory === 'disabled').length,
    'خوێندکاری هەژار': beneficiaries.filter(b => b.needCategory === 'student').length,
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={celebrateImpact}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
            >
              <HeartHandshake className="w-4 h-4" />
              ئاهەنگی کاریگەری هاوکاری
            </button>
            <button
              onClick={() => setActiveTab('beneficiaries')}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/90 hover:bg-white border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-cyan-600" />
              تۆمارکردنی سوودمەند
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Donations */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کۆی بەخشینەکان</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
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
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 flex items-center gap-1 font-bold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +١٨٪ ئەم مانگە
            </span>
            <span className="text-slate-500">{donations.length} بەخشینی فەرمی</span>
          </div>
        </div>

        {/* KPI 2: Beneficiaries */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">خێزانە سوودمەندەکان</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {totalBeneficiaries} <span className="text-sm font-normal text-slate-500">خێزان</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 font-bold">
              {aidedBeneficiaries} خێزان هاوکاری وەرگرتووە ({Math.round((aidedBeneficiaries / (totalBeneficiaries || 1)) * 100)}٪)
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-600">پشکنینی ساختەکاری کارایە</span>
            <span className="text-emerald-600 font-bold">١٠٠٪ پشتڕاستکراو</span>
          </div>
        </div>

        {/* KPI 3: Projects */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">پڕۆژە چالاکەکان</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {activeProjectsCount} <span className="text-sm font-normal text-slate-500">پڕۆژەی بەردەوام</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              لە کۆی {projects.length} پڕۆژەی پلان بۆ داڕێژراو
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-purple-700 font-bold">گەرمایی زستانە و خۆراک</span>
            <span className="text-slate-500">پێشکەوتن: ٨٥٪</span>
          </div>
        </div>

        {/* KPI 4: Volunteer Service */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">خزمەتی خۆبەخشان</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900">
              {totalVolunteerHours} <span className="text-sm font-normal text-slate-500">کاتژمێر</span>
            </div>
            <p className="text-[11px] text-amber-700 mt-1 font-bold">
              {volunteers.length} گەنجی دڵسۆز لە مەیداندا
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">تێکڕای خزمەت</span>
            <span className="text-slate-900 font-bold">{Math.round(totalVolunteerHours / (volunteers.length || 1))} کاتژمێر بۆ هەر کەس</span>
          </div>
        </div>

      </div>

      {/* Visual Analytics & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Needs Category Visual Bar Distribution */}
        <div className="lg:col-span-1 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">پۆلێنکردنی پێداویستییەکان</h3>
              <p className="text-xs text-slate-500 mt-0.5">بەپێی بارودۆخی خێزانەکان</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800">
              {beneficiaries.length} کەس
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(categoriesMap).map(([cat, count]) => {
              const percent = Math.round((count / (beneficiaries.length || 1)) * 100);
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
              <p className="text-center py-8 text-xs text-slate-400">هیچ تۆمارێکی هاوکاری بەردەست نییە</p>
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

    </div>
  );
};
