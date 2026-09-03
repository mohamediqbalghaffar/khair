import React, { useState } from 'react';
import { GOVERNORATE_STATS } from '../data/initialData';
import { GovernorateStats } from '../types';
import {
  MapPin,
  Users,
  FolderKanban,
  Sparkles,
  TrendingUp,
  Award
} from 'lucide-react';

export const GeoMapView: React.FC = () => {
  const governorateStats: GovernorateStats[] = GOVERNORATE_STATS;
  const [selectedGov, setSelectedGov] = useState<string>('هەولێر');

  const activeStat = governorateStats.find(g => g.name === selectedGov) || governorateStats[0];

  // Coordinates simulation on map canvas for Kurdistan governorates
  const mapNodes = [
    { name: 'دهۆک', x: 26, y: 22, count: 280 },
    { name: 'زاخۆ', x: 18, y: 15, count: 140 },
    { name: 'هەولێر', x: 48, y: 38, count: 420 },
    { name: 'سلێمانی', x: 74, y: 55, count: 390 },
    { name: 'کەرکووک', x: 44, y: 62, count: 210 },
    { name: 'هەڵەبجە', x: 86, y: 68, count: 160 },
    { name: 'گەرمیان', x: 78, y: 82, count: 175 },
  ];

  const totalDistributedIQD = governorateStats.reduce((sum, g) => sum + g.totalAidDistributedIQD, 0);

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-rose-600" />
            نەخشەی جوگرافی دابەشبوونی هاوکارییەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            دابەشبوونی خێزانە سوودمەندەکان و چڕیی هاوکارییە مەیدانییەکان لە پارێزگاکانی کوردستان
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-cyan-600" />
          <span>{governorateStats.length} ناوچەی کارا</span>
        </div>
      </div>

      {/* Main Map & Detail Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Selected Area Details Card (Left side in RTL) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900">پارێزگای {activeStat.name}</h3>
                <span className="text-xs text-slate-500">ڕاپۆرتی گشتگیری ناوچەیی</span>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-sm">
                <MapPin className="w-6 h-6" />
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-cyan-600" />
                    خێزانە سوودمەندەکان:
                  </span>
                  <span className="font-black text-slate-900 text-sm">{activeStat.beneficiariesCount} خێزان</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, (activeStat.beneficiariesCount / 500) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {Math.round((activeStat.beneficiariesCount / (governorateStats.reduce((s, g) => s + g.beneficiariesCount, 0) || 1)) * 100)}٪ ی تەواوی سوودمەندان
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-bold flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  کۆی هاوکاری دابەشکراو:
                </span>
                <span className="text-xl font-black text-emerald-900">
                  {activeStat.totalAidDistributedIQD.toLocaleString()} د.ع
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <FolderKanban className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">پڕۆژەکان:</span>
                  <span className="font-black text-slate-900 text-sm">{activeStat.activeProjectsCount} پڕۆژە</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <Award className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-500 block">تیمی خۆبەخش:</span>
                  <span className="font-black text-slate-900 text-sm">{activeStat.volunteersCount} کەس</span>
                </div>
              </div>

            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-slate-600 text-xs leading-relaxed">
            تیمەکانی ڕێکخراو لە هەماهەنگیدان لەگەڵ قایمقامییەت و فەرمانگەی چاودێری کۆمەڵایەتی {activeStat.name} بۆ دڵنیابوون لە دادپەروەری دابەشکردن.
          </div>
        </div>

        {/* Interactive Kurdistan Map Visualizer (Center/Right) */}
        <div className="lg:col-span-8 rounded-3xl bg-white/90 backdrop-blur-2xl p-6 border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              نەخشەی کارلێککاری پارێزگاکان (کلیک لەسەر خاڵەکان بکە)
            </h3>
            <span className="text-xs font-mono font-bold text-slate-500">کۆی هاوکاری: {totalDistributedIQD.toLocaleString()} د.ع</span>
          </div>

          {/* Stylized Vector Map Area */}
          <div className="relative w-full h-[380px] rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
            
            {/* Topographic Background Simulation */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 50 150 Q 200 80 400 130 T 750 200" fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="6,6" />
              <path d="M 80 220 Q 250 180 500 240 T 780 320" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="8,8" />
              <circle cx="380" cy="180" r="140" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="4,4" />
            </svg>

            {/* Interactive Location Nodes */}
            {mapNodes.map((node) => {
              const isSelected = selectedGov === node.name;
              return (
                <button
                  key={node.name}
                  onClick={() => setSelectedGov(node.name)}
                  style={{ top: `${node.y}%`, left: `${node.x}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-white scale-110 shadow-md ring-4 ring-cyan-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:scale-105'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-white animate-ping' : 'bg-rose-500'}`} />
                  <span className="text-xs font-bold whitespace-nowrap">{node.name}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>({node.count})</span>
                </button>
              );
            })}

            <div className="absolute bottom-3 text-center w-full pointer-events-none">
              <p className="text-[11px] text-slate-500 font-bold">
                تێبینی: هەر خاڵێک پیشاندەری چڕی خێزانە هاوکاریکراوەکان و تیمە خۆبەخشە بەردەستەکانە.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Regional Aid Equity Table */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200">
          <h4 className="text-xs font-bold text-slate-900">بەراوردی دادپەروەری دابەشکردنی هاوکاری بەپێی شارەکان</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3 px-4">ناوی پارێزگا / ئیدارە</th>
                <th className="py-3 px-4">خێزانی سوودمەند</th>
                <th className="py-3 px-4">کۆی بڕی هاوکاری (د.ع)</th>
                <th className="py-3 px-4">پڕۆژەی کارا</th>
                <th className="py-3 px-4">خۆبەخشانی ناوچەکە</th>
                <th className="py-3 px-4">ڕێژەی گشتی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {governorateStats.map(stat => {
                const totalBens = governorateStats.reduce((s, g) => s + g.beneficiariesCount, 0);
                const percent = Math.round((stat.beneficiariesCount / (totalBens || 1)) * 100);
                const isCurrent = stat.name === selectedGov;

                return (
                  <tr
                    key={stat.name}
                    onClick={() => setSelectedGov(stat.name)}
                    className={`cursor-pointer transition-colors ${isCurrent ? 'bg-cyan-50/80 font-bold' : 'hover:bg-slate-50/70'}`}
                  >
                    <td className="py-3 px-4 flex items-center gap-1.5 text-slate-900">
                      <MapPin className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-600' : 'text-slate-400'}`} />
                      <span>{stat.name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-900">{stat.beneficiariesCount} خێزان</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {stat.totalAidDistributedIQD.toLocaleString()} د.ع
                    </td>
                    <td className="py-3 px-4 text-purple-700">{stat.activeProjectsCount} پڕۆژە</td>
                    <td className="py-3 px-4 text-amber-700 font-bold">{stat.volunteersCount} کەس</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-600"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{percent}٪</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
