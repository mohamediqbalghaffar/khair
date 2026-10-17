import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  Search,
  X,
  Users,
  HeartHandshake,
  FolderKanban,
  PackageSearch,
  UserCheck,
  ArrowLeft,
  Receipt,
  MapPin,
  Wallet,
  Lock,
  Sparkles,
  CornerDownLeft
} from 'lucide-react';
import { useModalFocusTrap } from '../utils/useModalFocusTrap';

interface SpotlightItem {
  id: string;
  group: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  onSelect: () => void;
}

export const SpotlightModal: React.FC = () => {
  const {
    isSpotlightOpen,
    setIsSpotlightOpen,
    beneficiaries,
    donors,
    donations,
    projects,
    inventory,
    volunteers,
    setActiveTab,
    setSelectedBeneficiaryIdForView,
    openDistributionForDonation,
    setIsLocked
  } = useApp();

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useModalFocusTrap(isSpotlightOpen, () => setIsSpotlightOpen(false));

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(!isSpotlightOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen, setIsSpotlightOpen]);

  useEffect(() => {
    if (isSpotlightOpen) {
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    } else {
      setQuery('');
    }
  }, [isSpotlightOpen]);

  const q = query.trim().toLowerCase();

  const items: SpotlightItem[] = useMemo(() => {
    if (!q) {
      // Quick Command Palette Actions when query is empty
      return [
        {
          id: 'cmd-beneficiaries',
          group: 'فەرمانە خێراکان (Quick Actions)',
          title: 'بەڕێوەبردن و تۆمارکردنی سوودمەندان',
          subtitle: `کۆی تۆمارکراو: ${beneficiaries.length} خێزان و سوودمەند`,
          badge: 'سوودمەندان',
          icon: Users,
          accentClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          onSelect: () => {
            setActiveTab('beneficiaries');
            setIsSpotlightOpen(false);
          }
        },
        {
          id: 'cmd-donors',
          group: 'فەرمانە خێراکان (Quick Actions)',
          title: 'تۆمارکردنی بەخشین و بڕینی پسوولەی فەرمی',
          subtitle: `${donors.length} بەخشەر • ${donations.length} پسوولەی فەرمی`,
          badge: 'پسوولە',
          icon: Receipt,
          accentClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          onSelect: () => {
            setActiveTab('donors');
            setIsSpotlightOpen(false);
          }
        },
        {
          id: 'cmd-inventory',
          group: 'فەرمانە خێراکان (Quick Actions)',
          title: 'کۆگا و دابەشکردنی کۆمەک بەسەر خێزانەکاندا',
          subtitle: `${inventory.length} جۆر کاڵا لە کۆگادا بەردەستە`,
          badge: 'کۆگا',
          icon: PackageSearch,
          accentClass: 'bg-amber-50 text-amber-700 border-amber-200',
          onSelect: () => {
            setActiveTab('inventory');
            setIsSpotlightOpen(false);
          }
        },
        {
          id: 'cmd-geomap',
          group: 'فەرمانە خێراکان (Quick Actions)',
          title: 'نەخشەی جوگرافیی ماڵی سوودمەندان (GPS)',
          subtitle: 'پشکنینی سەربانی ماڵەکان و دابەشبوونی هاوکاری بەپێی ناوچە',
          badge: 'نەخشە',
          icon: MapPin,
          accentClass: 'bg-blue-50 text-blue-700 border-blue-200',
          onSelect: () => {
            setActiveTab('geo');
            setIsSpotlightOpen(false);
          }
        },
        {
          id: 'cmd-finance',
          group: 'فەرمانە خێراکان (Quick Actions)',
          title: 'سندوق و ڕاپۆرتی دارایی و خەرجییەکان',
          subtitle: 'چاودێری باڵانسی نەختینەیی بە دینار و دۆلار',
          badge: 'دارایی',
          icon: Wallet,
          accentClass: 'bg-purple-50 text-purple-700 border-purple-200',
          onSelect: () => {
            setActiveTab('finance');
            setIsSpotlightOpen(false);
          }
        },
        {
          id: 'cmd-lock',
          group: 'فەرمانە خێراکان (Quick Actions)',
          title: 'قوفڵکردنی خێرای شاشەی سیستەم',
          subtitle: 'پاراستنی زانیارییەکان کاتی دوورکەوتنەوە لە کۆمپیوتەر (Ctrl + L)',
          badge: 'ئاسایش',
          icon: Lock,
          accentClass: 'bg-rose-50 text-rose-700 border-rose-200',
          onSelect: () => {
            setIsSpotlightOpen(false);
            setIsLocked(true);
          }
        }
      ];
    }

    const list: SpotlightItem[] = [];

    // 1. Beneficiaries (deep-links directly to Dossier!)
    beneficiaries
      .filter(
        b =>
          b.fullName.toLowerCase().includes(q) ||
          b.phone.includes(q) ||
          b.nationalId.includes(q) ||
          b.address.toLowerCase().includes(q) ||
          b.governorate.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .forEach(b => {
        list.push({
          id: `ben-${b.id}`,
          group: 'سوودمەندان (کلیک بکە بۆ کردنەوەی دۆسیە)',
          title: b.fullName,
          subtitle: `${b.governorate} • مۆبایل: ${b.phone} • ناسنامە: ${b.nationalId}`,
          badge:
            b.status === 'pending'
              ? 'لەژێر لێکۆڵینەوە'
              : b.status === 'urgent'
              ? 'فریاگوزاری بەپەلە'
              : b.status === 'approved'
              ? 'پەسەندکراو'
              : 'سوودمەند',
          icon: Users,
          accentClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          onSelect: () => {
            setSelectedBeneficiaryIdForView(b.id);
            setActiveTab('beneficiaries');
            setIsSpotlightOpen(false);
          }
        });
      });

    // 2. Official Donation Receipts
    donations
      .filter(
        d =>
          d.receiptNumber.toLowerCase().includes(q) ||
          d.donorName.toLowerCase().includes(q) ||
          (d.projectName && d.projectName.toLowerCase().includes(q))
      )
      .slice(0, 4)
      .forEach(d => {
        list.push({
          id: `don-rec-${d.id}`,
          group: 'پسوولەکانی بەخشین',
          title: `${d.receiptNumber} — ${d.donorName}`,
          subtitle: `${d.amount.toLocaleString()} ${d.currency === 'IQD' ? 'د.ع' : '$'} • ${d.date} • ${d.projectName || 'سندووقی گشتی'}`,
          badge: 'پسوولە',
          icon: Receipt,
          accentClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          onSelect: () => {
            setActiveTab('donors');
            setIsSpotlightOpen(false);
          }
        });
      });

    // 3. Donors
    donors
      .filter(d => d.fullName.toLowerCase().includes(q) || d.phone.includes(q))
      .slice(0, 3)
      .forEach(d => {
        list.push({
          id: `donor-${d.id}`,
          group: 'بەخشەران',
          title: d.fullName,
          subtitle: `${d.governorate} • ${d.phone} • کۆی بەخشین: ${d.totalDonationsIQD.toLocaleString()} د.ع`,
          badge: d.type === 'corporate' ? 'کۆمپانیا' : 'بەخشەر',
          icon: HeartHandshake,
          accentClass: 'bg-teal-50 text-teal-700 border-teal-200',
          onSelect: () => {
            setActiveTab('donors');
            setIsSpotlightOpen(false);
          }
        });
      });

    // 4. Projects
    projects
      .filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(p => {
        list.push({
          id: `proj-${p.id}`,
          group: 'پڕۆژە خێرخوازییەکان',
          title: p.title,
          subtitle: `ئامانج: $${p.targetBudgetUSD.toLocaleString()} • کۆکراوە: $${p.raisedBudgetUSD.toLocaleString()}`,
          badge: p.category,
          icon: FolderKanban,
          accentClass: 'bg-purple-50 text-purple-700 border-purple-200',
          onSelect: () => {
            setActiveTab('projects');
            setIsSpotlightOpen(false);
          }
        });
      });

    // 5. Inventory
    inventory
      .filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach(i => {
        list.push({
          id: `inv-${i.id}`,
          group: 'کۆگا و کەلوپەل',
          title: i.name,
          subtitle: `بەردەست: ${i.quantity} ${i.unit} • شوێن: ${i.location}`,
          badge: i.quantity <= i.minAlertThreshold ? 'کەمبووە' : 'کۆگا',
          icon: PackageSearch,
          accentClass: 'bg-amber-50 text-amber-700 border-amber-200',
          onSelect: () => {
            if (i.sourceDonationId) {
              openDistributionForDonation(i.sourceDonationId);
            } else {
              setActiveTab('inventory');
            }
            setIsSpotlightOpen(false);
          }
        });
      });

    // 6. Volunteers
    volunteers
      .filter(
        v =>
          v.fullName.toLowerCase().includes(q) ||
          v.phone.includes(q) ||
          v.skills.some(s => s.toLowerCase().includes(q))
      )
      .slice(0, 3)
      .forEach(v => {
        list.push({
          id: `vol-${v.id}`,
          group: 'خۆبەخشان',
          title: v.fullName,
          subtitle: `${v.governorate} • ${v.hoursLogged} کاتژمێر • ${v.phone}`,
          badge: 'خۆبەخش',
          icon: UserCheck,
          accentClass: 'bg-blue-50 text-blue-700 border-blue-200',
          onSelect: () => {
            setActiveTab('volunteers');
            setIsSpotlightOpen(false);
          }
        });
      });

    return list;
  }, [
    q,
    beneficiaries,
    donations,
    donors,
    projects,
    inventory,
    volunteers,
    setActiveTab,
    setIsSpotlightOpen,
    setSelectedBeneficiaryIdForView,
    openDistributionForDonation,
    setIsLocked
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [q]);

  if (!isSpotlightOpen) return null;

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      items[activeIndex]?.onSelect();
    }
  };

  // Group items by group title while preserving flat index for keyboard nav
  const groupedEntries: { group: string; entries: { item: SpotlightItem; flatIndex: number }[] }[] = [];
  items.forEach((item, idx) => {
    let g = groupedEntries.find(x => x.group === item.group);
    if (!g) {
      g = { group: item.group, entries: [] };
      groupedEntries.push(g);
    }
    g.entries.push({ item, flatIndex: idx });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-4 bg-slate-950/45 backdrop-blur-md animate-in fade-in duration-150 no-print"
      onClick={() => setIsSpotlightOpen(false)}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="گەڕانی خێرا و فەرمانەکان"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <Search className="w-5 h-5 text-cyan-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="گەڕان بەدوای سوودمەند، ژمارەی پسوولە، ناسنامە، مۆبایل، بەخشەر..."
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm font-bold focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="پاککردنەوەی گەڕان"
              className="p-1 rounded-full text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 shrink-0 shadow-sm font-mono">
            ESC
          </kbd>
        </div>

        {/* Results & Quick Actions List */}
        <div className="max-h-[65vh] overflow-y-auto p-4 space-y-4 text-xs">
          {items.length === 0 ? (
            <div className="py-10 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">هیچ ئەنجامێک نەدۆزرایەوە بۆ «{query}»</p>
              <p className="text-xs text-slate-400 mt-1">تکایە ناو، ژمارەی مۆبایل یان ژمارەی پسوولەیەکی تر تاقیبکەرەوە</p>
            </div>
          ) : (
            groupedEntries.map(groupBlock => (
              <div key={groupBlock.group}>
                <h4 className="font-bold text-slate-500 text-[11px] mb-2 px-1 flex items-center justify-between">
                  <span>{groupBlock.group}</span>
                  <span className="text-slate-400 font-mono">{groupBlock.entries.length}</span>
                </h4>
                <div className="space-y-1.5">
                  {groupBlock.entries.map(({ item, flatIndex }) => {
                    const Icon = item.icon;
                    const isSelected = flatIndex === activeIndex;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        onClick={item.onSelect}
                        className={`w-full text-start flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-50/90 border-cyan-300 shadow-xs'
                            : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl border shrink-0 ${item.accentClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate">{item.title}</p>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white border border-slate-200 text-slate-700">
                              {item.badge}
                            </span>
                          )}
                          <ArrowLeft className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-700 -translate-x-0.5' : 'text-slate-400'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Keyboard Hints Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑↓</kbd>
              <span>هەڵبژاردن</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px] flex items-center gap-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" /> Enter
              </kbd>
              <span>کردنەوە</span>
            </span>
          </div>
          <span className="font-bold text-cyan-700">ڕێکخراوی بۆتان بامۆکی</span>
        </div>
      </div>
    </div>
  );
};
