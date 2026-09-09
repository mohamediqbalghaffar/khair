import React, { useState, useEffect, useRef } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import { Search, X, Users, HeartHandshake, FolderKanban, PackageSearch, UserCheck, ArrowRight } from 'lucide-react';

export const SpotlightModal: React.FC = () => {
  const {
    isSpotlightOpen,
    setIsSpotlightOpen,
    beneficiaries,
    donors,
    projects,
    inventory,
    volunteers,
    setActiveTab
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(!isSpotlightOpen);
      }
      if (e.key === 'Escape' && isSpotlightOpen) {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen, setIsSpotlightOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isSpotlightOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSpotlightOpen]);

  if (!isSpotlightOpen) return null;

  const q = query.trim().toLowerCase();

  // Search matches
  const filteredBeneficiaries = q
    ? beneficiaries.filter(b => b.fullName.toLowerCase().includes(q) || b.phone.includes(q) || b.nationalId.includes(q) || b.address.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const filteredDonors = q
    ? donors.filter(d => d.fullName.toLowerCase().includes(q) || d.phone.includes(q)).slice(0, 3)
    : [];

  const filteredProjects = q
    ? projects.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const filteredInventory = q
    ? inventory.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const filteredVolunteers = q
    ? volunteers.filter(v => v.fullName.toLowerCase().includes(q) || v.phone.includes(q) || v.skills.some(s => s.toLowerCase().includes(q))).slice(0, 3)
    : [];

  const totalResults =
    filteredBeneficiaries.length +
    filteredDonors.length +
    filteredProjects.length +
    filteredInventory.length +
    filteredVolunteers.length;

  const handleSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setIsSpotlightOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-cyan-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="گەڕان بەدوای سوودمەند، بەخشەر، پڕۆژە، کۆگا، یان خۆبەخش..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 shrink-0 shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4 text-xs">
          {q === '' ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-bold text-slate-700 mb-1">گەڕانی خێرای داتابەیس</p>
              <p className="text-xs text-slate-500">ناوی هەر کەسێک، ژمارەی مۆبایل، ناوی کاڵا یان پڕۆژەیەک بنووسە...</p>
            </div>
          ) : totalResults === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm text-slate-600">هیچ ئەنجامێک نەدۆزرایەوە بۆ "{query}"</p>
            </div>
          ) : (
            <>
              {/* Beneficiaries Section */}
              {filteredBeneficiaries.length > 0 && (
                <div>
                  <h4 className="font-bold text-cyan-800 text-[11px] mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> سوودمەندان
                  </h4>
                  <div className="space-y-1.5">
                    {filteredBeneficiaries.map(b => (
                      <div
                        key={b.id}
                        onClick={() => handleSelect('beneficiaries')}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{b.fullName}</p>
                          <p className="text-[10px] text-slate-500">
                            {b.governorate} • {b.phone} • دۆخ: {
                              b.status === 'pending' ? 'لەژێر لێکۆڵینەوە' :
                              b.status === 'confidential' ? 'سوودمەندی نهێنی' :
                              b.status === 'urgent' ? 'فریاگوزاری بەپەلە' :
                              b.status === 'approved' ? 'پەسەندکراو' :
                              b.status === 'aided' ? 'هاوکاریکراو' :
                              b.status === 'periodic' ? 'هاوکاری مانگانە' :
                              b.status === 'suspended' ? 'ڕاگیراو' :
                              b.status === 'rejected' ? 'ڕەتکراوە' : 'ئەرشیڤکراو'
                            }{b.aidHistory?.length > 0 ? ` (هاوکاریکراو: ${b.aidHistory.length})` : ''}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Donors Section */}
              {filteredDonors.length > 0 && (
                <div>
                  <h4 className="font-bold text-emerald-800 text-[11px] mb-2 flex items-center gap-1.5">
                    <HeartHandshake className="w-3.5 h-3.5" /> بەخشەران
                  </h4>
                  <div className="space-y-1.5">
                    {filteredDonors.map(d => (
                      <div
                        key={d.id}
                        onClick={() => handleSelect('donors')}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{d.fullName}</p>
                          <p className="text-[10px] text-slate-500">{d.phone} • {d.totalDonationsIQD.toLocaleString()} دینار</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {filteredProjects.length > 0 && (
                <div>
                  <h4 className="font-bold text-purple-800 text-[11px] mb-2 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5" /> پڕۆژەکان
                  </h4>
                  <div className="space-y-1.5">
                    {filteredProjects.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect('projects')}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{p.title}</p>
                          <p className="text-[10px] text-slate-500">بودجە: ${p.targetBudgetUSD.toLocaleString()} • کۆکراوە: ${p.raisedBudgetUSD.toLocaleString()}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory Section */}
              {filteredInventory.length > 0 && (
                <div>
                  <h4 className="font-bold text-amber-800 text-[11px] mb-2 flex items-center gap-1.5">
                    <PackageSearch className="w-3.5 h-3.5" /> کۆگا
                  </h4>
                  <div className="space-y-1.5">
                    {filteredInventory.map(i => (
                      <div
                        key={i.id}
                        onClick={() => handleSelect('inventory')}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{i.name}</p>
                          <p className="text-[10px] text-slate-500">بڕی بەردەست: {i.quantity} {i.unit} ({i.location})</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volunteers Section */}
              {filteredVolunteers.length > 0 && (
                <div>
                  <h4 className="font-bold text-blue-800 text-[11px] mb-2 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> خۆبەخشان
                  </h4>
                  <div className="space-y-1.5">
                    {filteredVolunteers.map(v => (
                      <div
                        key={v.id}
                        onClick={() => handleSelect('volunteers')}
                        className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 cursor-pointer transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">{v.fullName}</p>
                          <p className="text-[10px] text-slate-500">{v.governorate} • {v.hoursLogged} کاتژمێر کارکردن • {v.phone}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
