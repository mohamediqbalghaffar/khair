import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, Donation, NeedCategory } from '../types';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { getExchangeRateForDate } from '../utils/exchangeRates';
import confetti from 'canvas-confetti';
import {
  PackageSearch,
  Search,
  AlertTriangle,
  Send,
  Warehouse,
  Plus,
  Trash2,
  X,
  Receipt,
  HeartHandshake,
  History,
  Eye,
  Boxes,
  CheckCircle2,
  DollarSign,
  Users,
  CheckSquare,
  Square,
  Filter,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Check,
  Calendar,
  FileText
} from 'lucide-react';

const needLabelsMap: Record<string, string> = {
  poor: 'هەژار و کەمدەرامەت',
  orphan: 'هەتیو و بێباوک',
  sick: 'نەخۆش و دەستکورت',
  disabled: 'خاوەن پێداویستی تایبەت',
  displaced: 'ئاوارە و لێقەوماو',
  student: 'خوێندکار'
};

export const InventoryView: React.FC = () => {
  const {
    inventory,
    beneficiaries,
    donations,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryQuantity,
    distributeAidFromInventory,
    distributeAidBulkFromInventory,
    setActiveTab
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'receipts' | 'distributions'>('stock');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedItemForDistribution, setSelectedItemForDistribution] = useState<InventoryItem | null>(null);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<Donation | null>(null);

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'خۆراک',
    quantity: 0,
    unit: 'دانە',
    location: 'هەولێر - کۆگای سەرەکی بەحرکە',
    minAlertThreshold: 10
  });

  // Multi-Beneficiary Distribution Form State
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);
  const [customQuantities, setCustomQuantities] = useState<Record<string, number>>({});
  const [allocationMode, setAllocationMode] = useState<'equal' | 'custom'>('equal');
  const [qtyPerBeneficiary, setQtyPerBeneficiary] = useState<number>(1);
  const [modalBenSearch, setModalBenSearch] = useState('');
  const [modalGovFilter, setModalGovFilter] = useState('all');
  const [modalNeedFilter, setModalNeedFilter] = useState('all');
  const [selectedProjectTitle, setSelectedProjectTitle] = useState('دابەشکردنی خۆراکی خێزانی');
  const [distributionNotes, setDistributionNotes] = useState('');

  // Aggregated distributions from all beneficiaries
  const allDistributions = beneficiaries.flatMap(b =>
    (b.aidHistory || []).map(record => ({
      ...record,
      beneficiaryId: b.id,
      beneficiaryName: b.fullName,
      beneficiaryPhone: b.phone,
      beneficiaryGovernorate: b.governorate,
      beneficiaryNeed: b.needCategory
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Stock filtering
  const filteredInventory = inventory.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      (item.sourceDonorName && item.sourceDonorName.toLowerCase().includes(q)) ||
      (item.sourceReceiptNumber && item.sourceReceiptNumber.toLowerCase().includes(q)) ||
      (item.contentsDescription && item.contentsDescription.toLowerCase().includes(q));

    const matchesCategory =
      categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Receipts filtering (all donations from بەخشەران -> پسوولەکانی بەخشین)
  const filteredDonations = donations.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.donorName.toLowerCase().includes(q) ||
      d.receiptNumber.toLowerCase().includes(q) ||
      (d.categoryLabel && d.categoryLabel.toLowerCase().includes(q)) ||
      (d.projectName && d.projectName.toLowerCase().includes(q)) ||
      (d.itemDetails?.contentsDescription && d.itemDetails.contentsDescription.toLowerCase().includes(q)) ||
      (d.notes && d.notes.toLowerCase().includes(q))
    );
  });

  // Distributions filtering
  const filteredDistributions = allDistributions.filter(dist => {
    const q = searchQuery.toLowerCase();
    return (
      dist.beneficiaryName.toLowerCase().includes(q) ||
      dist.beneficiaryPhone.includes(q) ||
      dist.beneficiaryGovernorate.toLowerCase().includes(q) ||
      (dist.itemName && dist.itemName.toLowerCase().includes(q)) ||
      (dist.projectTitle && dist.projectTitle.toLowerCase().includes(q)) ||
      (dist.receiptNumber && dist.receiptNumber.toLowerCase().includes(q)) ||
      (dist.donorName && dist.donorName.toLowerCase().includes(q))
    );
  });

  const lowStockItems = inventory.filter(i => i.quantity <= i.minAlertThreshold);
  const totalStockQty = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name) return;
    addInventoryItem(newItemForm);
    setIsAddItemModalOpen(false);
    setNewItemForm({
      name: '',
      category: 'خۆراک',
      quantity: 0,
      unit: 'دانە',
      location: 'هەولێر - کۆگای سەرەکی بەحرکە',
      minAlertThreshold: 10
    });
  };

  // Filter beneficiaries inside the Distribution Modal
  const filteredModalBeneficiaries = useMemo(() => {
    return beneficiaries.filter(b => {
      const q = modalBenSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        b.fullName.toLowerCase().includes(q) ||
        b.phone.includes(q) ||
        (b.nationalId && b.nationalId.includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q));

      const matchGov = modalGovFilter === 'all' || b.governorate === modalGovFilter;
      const matchNeed = modalNeedFilter === 'all' || b.needCategory === modalNeedFilter;

      return matchSearch && matchGov && matchNeed;
    });
  }, [beneficiaries, modalBenSearch, modalGovFilter, modalNeedFilter]);

  // Calculations for Stock and Allocation
  const totalStockAvailable = selectedItemForDistribution?.quantity || 0;

  const totalDistributeQuantity = useMemo(() => {
    return selectedBeneficiaryIds.reduce((sum, id) => {
      const qty = allocationMode === 'custom'
        ? Number(customQuantities[id] !== undefined ? customQuantities[id] : qtyPerBeneficiary) || 1
        : Number(qtyPerBeneficiary) || 1;
      return sum + qty;
    }, 0);
  }, [selectedBeneficiaryIds, allocationMode, customQuantities, qtyPerBeneficiary]);

  const remainingAfterDist = totalStockAvailable - totalDistributeQuantity;
  const isExceedingStock = totalDistributeQuantity > totalStockAvailable;

  // Beneficiary Selection Handlers
  const handleToggleBeneficiary = (id: string) => {
    setSelectedBeneficiaryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredModalBeneficiaries.map(b => b.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedBeneficiaryIds.includes(id));
    if (allSelected) {
      setSelectedBeneficiaryIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedBeneficiaryIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSelectMaxStock = () => {
    const perQty = Math.max(1, qtyPerBeneficiary || 1);
    const maxCount = Math.min(filteredModalBeneficiaries.length, Math.floor(totalStockAvailable / perQty));
    setSelectedBeneficiaryIds(filteredModalBeneficiaries.slice(0, maxCount).map(b => b.id));
  };

  const handleSelectN = (count: number) => {
    setSelectedBeneficiaryIds(filteredModalBeneficiaries.slice(0, count).map(b => b.id));
  };

  const handleOpenDistributeModal = (item: InventoryItem) => {
    setSelectedItemForDistribution(item);
    if (beneficiaries.length > 0) {
      setSelectedBeneficiaryIds([beneficiaries[0].id]);
    } else {
      setSelectedBeneficiaryIds([]);
    }
    setQtyPerBeneficiary(1);
    setAllocationMode('equal');
    setCustomQuantities({});
    setModalBenSearch('');
    setModalGovFilter('all');
    setModalNeedFilter('all');
    setSelectedProjectTitle(
      item.sourceReceiptNumber
        ? `دابەشکردنی کۆمەکی پسوولەی ${item.sourceReceiptNumber}`
        : item.name ? `دابەشکردنی ${item.name}` : 'دابەشکردنی کۆمەکی بەخشراو'
    );
    setDistributionNotes('');
    setIsDistributeModalOpen(true);
  };

  // Helper to open distribution modal directly for an in-kind donation
  const handleQuickDistributeFromDonation = (donation: Donation) => {
    const matched = inventory.find(
      i => i.sourceReceiptNumber === donation.receiptNumber || i.sourceDonationId === donation.id
    );

    if (matched) {
      handleOpenDistributeModal(matched);
      if (donation.projectName) {
        setSelectedProjectTitle(donation.projectName);
      }
    } else {
      alert('ئەم کاڵایە لە کۆگادا بەردەست نییە یان دابەشکراوە.');
    }
  };

  const handleDistributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForDistribution || selectedBeneficiaryIds.length === 0) {
      alert('تکایە بەلایەنی کەمەوە یەک سوودمەند / خێزان دیاریبکە!');
      return;
    }

    if (isExceedingStock) {
      alert(`بڕی داواکراو (${totalDistributeQuantity}) زیاترە لەوەی لە کۆگادا بەردەستە (${totalStockAvailable})!`);
      return;
    }

    const distributions = selectedBeneficiaryIds.map(id => ({
      beneficiaryId: id,
      quantity: allocationMode === 'custom'
        ? Number(customQuantities[id] !== undefined ? customQuantities[id] : qtyPerBeneficiary) || 1
        : Number(qtyPerBeneficiary) || 1
    }));

    const success = distributeAidBulkFromInventory(
      selectedItemForDistribution.id,
      distributions,
      selectedProjectTitle,
      distributionNotes
    );

    if (success) {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 }
      });
      setIsDistributeModalOpen(false);
      setSelectedItemForDistribution(null);
      setSelectedBeneficiaryIds([]);
      setCustomQuantities({});
      setDistributionNotes('');
    } else {
      alert('بڕی دیاریکراو زیاترە لەوەی لە کۆگادا بەردەستە!');
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-amber-600" />
            کۆگا و دابەشکردنی کەلوپەل و بەخشینەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سەرجەم بەخشینە تۆمارکراوەکانی بەشی «پسوولەکانی بەخشین» دەخرێنە سەر ئەم تۆمارە بۆ پاشەکەوت و دابەشکردن
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('donors')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            تۆماری بەخشەران و پسوولە
          </button>
          
          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            تۆمارکردنی کاڵای نوێ بۆ کۆگا
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-bold">
            <span>کاڵاکانی کۆگا</span>
            <Boxes className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-900">{inventory.length}</span>
            <span className="text-[11px] text-slate-400 font-bold">جۆری کاڵا</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-bold">
            <span>کۆی بڕی بەردەست</span>
            <Warehouse className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-700">{totalStockQty}</span>
            <span className="text-[11px] text-slate-400 font-bold">دانە / یەکە</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-bold">
            <span>پسوولە هاتووەکان</span>
            <Receipt className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-700">{donations.length}</span>
            <span className="text-[11px] text-slate-400 font-bold">پسوولەی بەخشین</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 text-xs font-bold">
            <span>دابەشکراو بۆ خێزانەکان</span>
            <HeartHandshake className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-700">{allDistributions.length}</span>
            <span className="text-[11px] text-slate-400 font-bold">دۆسیەی هاوکاری</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('stock')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'stock'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-amber-600" />
            کاڵا و کۆگاکان ({inventory.length})
          </button>

          <button
            onClick={() => setActiveSubTab('receipts')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'receipts'
                ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            تۆماری پسوولەکانی بەخشین لە کۆگادا ({donations.length})
          </button>

          <button
            onClick={() => setActiveSubTab('distributions')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'distributions'
                ? 'bg-white text-purple-800 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-600" />
            مێژووی دابەشکردنەکان ({allDistributions.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەپێی کاڵا، بەخشەر، ژمارەی پسوولە، شوێن..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* ========================================================
          TAB 1: INVENTORY STOCK (مەخزەن و کاڵاکان)
      ======================================================== */}
      {activeSubTab === 'stock' && (
        <div className="space-y-5">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              هەموو جۆرەکان ({inventory.length})
            </button>
            {['خۆراک', 'پۆشاک', 'پێداویستی پزیشکی', 'گەرمکەرەوە و سووتەمەنی', 'پەروەردە و خوێندکاران', 'کەلوپەلی ناوماڵ'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Low Stock Warning Banner */}
          {lowStockItems.length > 0 && (
            <div className="rounded-3xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-900">ئاگاداری کەمبوونەوەی کۆگا (Low Stock Alert):</h4>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  {lowStockItems.map(item => (
                    <span
                      key={item.id}
                      className="px-2.5 py-1 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{item.name}:</span>
                      <span className="text-amber-900 font-mono font-black">{item.quantity} {item.unit} ماوە</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {inventory.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
              <PackageSearch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">هیچ کاڵایەک لە کۆگادا تۆمار نەکراوە (سفر تۆمار)</p>
              <p className="text-xs text-slate-400 mt-1">
                کاتێک پسوولەی بەخشین لە بەشی «بەخشەران» تۆمار دەکەیت یان کلیک لە «تۆمارکردنی کاڵای نوێ» دەکەیت، ڕاستەوخۆ دەخرێتە ئێرە
              </p>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-12 border border-slate-200/90 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-700">هیچ کاڵایەک بەپێی فلتەر یان گەڕانەکەت نەدۆزرایەوە</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInventory.map(item => {
                const isLow = item.quantity <= item.minAlertThreshold;
                const matchingDonation = item.sourceReceiptNumber
                  ? donations.find(d => d.receiptNumber === item.sourceReceiptNumber)
                  : null;

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                      isLow ? 'border-amber-300 hover:border-amber-400' : 'border-slate-200/90 hover:border-cyan-400'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                        {isLow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> کەمە لە کۆگا
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            بەردەستە
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{item.name}</h3>

                      {/* Sourced from Donation Receipt Badge */}
                      {item.sourceReceiptNumber && (
                        <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-xs mb-3 space-y-1">
                          <div className="flex items-center justify-between text-emerald-900 font-bold">
                            <span className="flex items-center gap-1">
                              <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                              لە بەخشینی: {item.sourceDonorName || 'بەخشەر'}
                            </span>
                            <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-800">
                              {item.sourceReceiptNumber}
                            </span>
                          </div>
                          {item.contentsDescription && (
                            <p className="text-[11px] text-emerald-800/90 leading-tight">
                              ناوەڕۆک: {item.contentsDescription}
                            </p>
                          )}
                          {matchingDonation && (
                            <button
                              type="button"
                              onClick={() => setActiveReceipt(matchingDonation)}
                              className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 mt-1 underline"
                            >
                              <Eye className="w-3 h-3" />
                              بینینی پسوولەی فەرمی ({matchingDonation.receiptNumber})
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quantity */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className={`text-3xl font-black ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{item.unit}</span>
                      </div>

                      {/* Location & Details */}
                      <div className="space-y-1.5 py-3 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="flex items-center gap-1 text-slate-500">
                            <Warehouse className="w-3.5 h-3.5" /> شوێنی کۆگا:
                          </span>
                          <span className="text-slate-900 font-bold">{item.location}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-500">ئاستی کەمبوونەوە:</span>
                          <span className="text-slate-800 font-bold">{item.minAlertThreshold} {item.unit}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>دواین دەستکاری:</span>
                          <span className="font-mono text-slate-500">{item.lastUpdated}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions: Adjust stock & Direct Distribute */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateInventoryQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200"
                          title="کەمکردنەوەی ١ دانە"
                        >
                          -
                        </button>
                        <button
                          onClick={() => updateInventoryQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200"
                          title="زیادکردنی ١ دانە"
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`دڵنیایت لە سڕینەوەی کاڵای [${item.name}] لە کۆگا؟`)) {
                              deleteInventoryItem(item.id);
                            }
                          }}
                          className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200"
                          title="سڕینەوەی کاڵا"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenDistributeModal(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        دابەشکردن بۆ خێزانەکان
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          TAB 2: DONATION RECEIPTS IN WAREHOUSE (تۆماری سەرجەم پسوولەکانی بەخشین لە کۆگا)
      ======================================================== */}
      {activeSubTab === 'receipts' && (
        <div className="space-y-5">
          
          {/* Synchronized Notice Banner */}
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900 shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 mb-0.5">تۆماری ڕاستەوخۆی بەخشینەکان لە کۆگا:</h4>
              <p className="text-emerald-800 leading-relaxed">
                سەرجەم پسوولەکانی بەخشین (نەختینەیی و عەینی) کە لە بەشی «بەخشەران» تۆمار دەکرێن، هاوکات لێرەدا پاشەکەوت دەبن بۆ چاودێری کۆگا و دابەشکردنی خێرا بۆ سەر خێزانە هەژارەکان.
              </p>
            </div>
          </div>

          {donations.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">هیچ پسوولەیەکی بەخشین تۆمار نەکراوە (سفر تۆمار)</p>
              <p className="text-xs text-slate-400 mt-1">
                بۆ تۆمارکردنی پسوولەی بەخشینی نوێ، بچۆ سەر بەشی «بەڕێوەبردنی بەخشەران» و پسوولەی بەخشین دروست بکە
              </p>
            </div>
          ) : filteredDonations.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-12 border border-slate-200/90 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-700">هیچ پسوولەیەک بەپێی وشەی گەڕانەکەت نەدۆزرایەوە</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">ژمارەی پسوولە</th>
                      <th className="p-3.5">بەخشەر</th>
                      <th className="p-3.5">جۆری بەخشین</th>
                      <th className="p-3.5">بڕ / کەرەستە</th>
                      <th className="p-3.5">مەبەست و شوێن</th>
                      <th className="p-3.5">بەروار</th>
                      <th className="p-3.5">دۆخ لە کۆگا</th>
                      <th className="p-3.5 text-center">کرداری فەرمی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDonations.map(don => {
                      const isInKind = don.category && don.category !== 'cash';
                      const matchingInv = isInKind
                        ? inventory.find(i => i.sourceReceiptNumber === don.receiptNumber || i.sourceDonationId === don.id)
                        : null;

                      return (
                        <tr key={don.id} className="hover:bg-slate-50/60 transition-all">
                          {/* Receipt Number */}
                          <td className="p-3.5 font-mono font-bold text-cyan-800">
                            <div className="flex items-center gap-1.5">
                              <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                              {don.receiptNumber}
                            </div>
                          </td>

                          {/* Donor Name */}
                          <td className="p-3.5 font-bold text-slate-900">
                            {don.donorName}
                          </td>

                          {/* Category */}
                          <td className="p-3.5">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 inline-block">
                              {don.categoryLabel || 'بەخشین'}
                            </span>
                          </td>

                          {/* Amount / Items */}
                          <td className="p-3.5">
                            {isInKind && don.itemDetails ? (
                              <div>
                                <span className="font-bold text-slate-900 text-sm">
                                  {don.itemDetails.quantity} {don.itemDetails.unit}
                                </span>
                                {don.itemDetails.weightKgPerUnit ? (
                                  <span className="text-[10px] text-slate-500 block">
                                    (کێش: {don.itemDetails.weightKgPerUnit} کگم هەر یەکە)
                                  </span>
                                ) : null}
                                {don.itemDetails.contentsDescription && (
                                  <span className="text-[10px] text-slate-500 block max-w-xs truncate" title={don.itemDetails.contentsDescription}>
                                    {don.itemDetails.contentsDescription}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-mono font-black text-slate-900 text-sm block">
                                  {don.amount.toLocaleString()} {don.currency === 'IQD' ? 'د.ع' : '$'}
                                </span>
                                {(() => {
                                  const dayRate = don.exchangeRateAtDate || getExchangeRateForDate(don.date).rate;
                                  const conv = don.convertedAmount || (
                                    don.currency === 'IQD'
                                      ? Number((don.amount / dayRate).toFixed(2))
                                      : Math.round(don.amount * dayRate)
                                  );
                                  return (
                                    <span className="text-[10px] text-cyan-700 font-mono block" title={`نرخی بۆرسەی ڕۆژ: 1$ = ${dayRate.toLocaleString()} د.ع`}>
                                      {don.currency === 'IQD' ? `≈ $${conv.toLocaleString()}` : `≈ ${conv.toLocaleString()} د.ع`} ({dayRate.toLocaleString()})
                                    </span>
                                  );
                                })()}
                                <span className="text-[10px] text-slate-500 block">{don.method}</span>
                              </div>
                            )}
                          </td>

                          {/* Destination */}
                          <td className="p-3.5 text-slate-700 font-medium">
                            {don.projectName || 'کۆگای سەرەکی ڕێکخراو'}
                          </td>

                          {/* Date */}
                          <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                            {don.date}
                          </td>

                          {/* Warehouse Status */}
                          <td className="p-3.5">
                            {isInKind ? (
                              matchingInv && matchingInv.quantity > 0 ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                                  <Warehouse className="w-3 h-3 text-emerald-600" />
                                  لە کۆگا بەردەستە ({matchingInv.quantity} {matchingInv.unit})
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit">
                                  دابەشکراوە یان سفرە
                                </span>
                              )
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 flex items-center gap-1 w-fit">
                                <DollarSign className="w-3 h-3 text-cyan-600" />
                                سندووقی نەختینەیی
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Official Receipt Button */}
                              <button
                                onClick={() => setActiveReceipt(don)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold flex items-center gap-1 border border-slate-200"
                                title="بینینی پسوولەی فەرمی بۆ چاپکردن"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-700" />
                                پسوولە
                              </button>

                              {/* Quick Distribute Button for in-kind items */}
                              {isInKind && matchingInv && matchingInv.quantity > 0 && (
                                <button
                                  onClick={() => handleQuickDistributeFromDonation(don)}
                                  className="px-3 py-1.5 rounded-xl liquid-button-primary text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                                  title="دابەشکردنی ڕاستەوخۆ بۆ خێزانێک"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  دابەشکردن
                                </button>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================
          TAB 3: DISTRIBUTIONS HISTORY (مێژووی دابەشکردنەکان)
      ======================================================== */}
      {activeSubTab === 'distributions' && (
        <div className="space-y-5">
          {allDistributions.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">هیچ دابەشکردنێک بۆ خێزانەکان تۆمار نەکراوە (سفر تۆمار)</p>
              <p className="text-xs text-slate-400 mt-1">
                کاتێک کاڵایەک لە کۆگاوە دەبەخشیتە خێزانێک، مێژووی دابەشکردنەکەی لێرەدا تۆمار دەبێت
              </p>
            </div>
          ) : filteredDistributions.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-12 border border-slate-200/90 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-700">هیچ تۆمارێکی دابەشکردن بەپێی گەڕانەکەت نەدۆزرایەوە</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">ناوی سوودمەند / خێزان</th>
                      <th className="p-3.5">پارێزگا / تەلەفۆن</th>
                      <th className="p-3.5">کاڵای پێدراو</th>
                      <th className="p-3.5">بڕ</th>
                      <th className="p-3.5">پڕۆژە / کەمپەین</th>
                      <th className="p-3.5">سەرچاوەی بەخشین</th>
                      <th className="p-3.5">بەروار</th>
                      <th className="p-3.5">دابەشکراوە لەلایەن</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDistributions.map((dist, idx) => (
                      <tr key={`${dist.id}-${idx}`} className="hover:bg-slate-50/60 transition-all">
                        {/* Beneficiary Name */}
                        <td className="p-3.5 font-bold text-slate-900">
                          {dist.beneficiaryName}
                        </td>

                        {/* Governorate & Phone */}
                        <td className="p-3.5 text-slate-600">
                          <span>{dist.beneficiaryGovernorate}</span>
                          <span className="text-[11px] text-slate-400 block font-mono">{dist.beneficiaryPhone}</span>
                        </td>

                        {/* Item Name */}
                        <td className="p-3.5 font-bold text-slate-800">
                          {dist.itemName || (dist.type === 'monetary' ? `${dist.amountIQD?.toLocaleString()} د.ع` : 'هاوکاری')}
                        </td>

                        {/* Quantity */}
                        <td className="p-3.5 font-black text-amber-700 font-mono">
                          {dist.quantity ? `${dist.quantity} دانە` : '-'}
                        </td>

                        {/* Project */}
                        <td className="p-3.5 text-slate-700">
                          {dist.projectTitle}
                        </td>

                        {/* Sourced from Receipt / Donor */}
                        <td className="p-3.5">
                          {dist.receiptNumber ? (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-[10px] font-bold inline-block">
                              {dist.receiptNumber} {dist.donorName ? `(${dist.donorName})` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">
                          {dist.date}
                        </td>

                        {/* Distributed By */}
                        <td className="p-3.5 text-slate-600 text-[11px]">
                          {dist.distributedBy || 'ڕێکخراو'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Multi-Beneficiary Distribution Modal */}
      {isDistributeModalOpen && selectedItemForDistribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-2xl my-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setIsDistributeModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 pr-1">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  دابەشکردنی بە کۆمەڵی هاوکاری و کاڵاکان
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  دەتوانیت یەک یان چەندین خێزانی سوودمەند لە یەک کاتدا دیاری بکەیت بۆ وەرگرتنی ئەم کاڵایە
                </p>
              </div>
            </div>

            {/* Item and Stock Overview Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">ناوی کاڵا:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedItemForDistribution.name}</span>
                <span className="text-[10px] text-slate-500 block">({selectedItemForDistribution.category})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">کۆی بەردەست لە مەخزەن:</span>
                <span className="font-black text-amber-700 font-mono text-base">
                  {totalStockAvailable} {selectedItemForDistribution.unit}
                </span>
                <span className="text-[10px] text-slate-500 block">{selectedItemForDistribution.location}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">سەرچاوەی بەخشین:</span>
                {selectedItemForDistribution.sourceReceiptNumber ? (
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {selectedItemForDistribution.sourceDonorName || 'بەخشەر'} ({selectedItemForDistribution.sourceReceiptNumber})
                  </span>
                ) : (
                  <span className="text-slate-600 font-medium">پاشەکەوتی ڕێکخراو</span>
                )}
              </div>
            </div>

            <form onSubmit={handleDistributeSubmit} className="space-y-4 text-xs">
              
              {/* Allocation Mode Selector & Default Qty */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-0.5">شێوازی دیاریکردنی بڕی کاڵا بۆ هەر خێزانێک:</label>
                    <span className="text-[11px] text-slate-500">هەڵبژێرە کە ئایا بڕەکە بۆ هەمووان یەکسان بێت یان بەپێی قەبارەی خێزان دەستکاری بکرێت</span>
                  </div>

                  {/* Toggle Modes */}
                  <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAllocationMode('equal')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        allocationMode === 'equal'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      بڕی یەکسان بۆ هەمووان
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllocationMode('custom')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        allocationMode === 'custom'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      بڕی تایبەت بە هەر خێزانێک
                    </button>
                  </div>
                </div>

                {allocationMode === 'equal' && (
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                    <label className="text-slate-700 font-bold whitespace-nowrap">
                      بڕ بۆ هەر خێزانێک ({selectedItemForDistribution.unit}):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={totalStockAvailable || 1}
                        required
                        value={qtyPerBeneficiary}
                        onChange={(e) => setQtyPerBeneficiary(Math.max(1, Number(e.target.value) || 1))}
                        className="w-24 px-3 py-1.5 rounded-xl liquid-input font-bold text-sm text-center text-slate-900"
                      />
                      <span className="text-slate-500 font-bold">{selectedItemForDistribution.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Beneficiary Search & Filter Controls */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={modalBenSearch}
                      onChange={(e) => setModalBenSearch(e.target.value)}
                      placeholder="گەڕان بەپێی ناوی خێزان، ژمارە تەلەفۆن، ناسنامە، ناونیشان..."
                      className="w-full pr-8 pl-3 py-2 text-xs rounded-xl liquid-input text-slate-900 placeholder-slate-400"
                    />
                  </div>

                  {/* Governorate Filter */}
                  <select
                    value={modalGovFilter}
                    onChange={(e) => setModalGovFilter(e.target.value)}
                    className="px-2.5 py-2 rounded-xl liquid-input text-slate-900 bg-white text-xs"
                  >
                    <option value="all">هەموو پارێزگاکان</option>
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                  </select>

                  {/* Need Category Filter */}
                  <select
                    value={modalNeedFilter}
                    onChange={(e) => setModalNeedFilter(e.target.value)}
                    className="px-2.5 py-2 rounded-xl liquid-input text-slate-900 bg-white text-xs"
                  >
                    <option value="all">هەموو پێداویستییەکان</option>
                    <option value="poor">هەژار و کەمدەرامەت</option>
                    <option value="orphan">هەتیو و بێباوک</option>
                    <option value="sick">نەخۆش و دەستکورت</option>
                    <option value="disabled">خاوەن پێداویستی تایبەت</option>
                    <option value="displaced">ئاوارە و لێقەوماو</option>
                    <option value="student">خوێندکار</option>
                  </select>
                </div>

                {/* Quick Selection Buttons */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <CheckSquare className="w-3 h-3 text-cyan-700" />
                      دیاریکردنی هەموو فلتەرکراوەکان ({filteredModalBeneficiaries.length})
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectMaxStock}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center gap-1 transition-all"
                      title="دیاریکردنی ئەوپەڕی خێزان کە بەشی کۆی مەخزەن دەکات"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      بەپێی کۆی مەخزەن ({Math.min(filteredModalBeneficiaries.length, Math.floor(totalStockAvailable / (qtyPerBeneficiary || 1)))} خێزان)
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectN(5)}
                      className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200"
                    >
                      ٥ خێزان
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectN(10)}
                      className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200"
                    >
                      ١٠ خێزان
                    </button>

                    {selectedBeneficiaryIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedBeneficiaryIds([])}
                        className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold"
                      >
                        پاککردنەوەی هەڵبژاردن
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-slate-600">
                    دیاریکراو: <span className="font-mono text-cyan-800 font-black text-xs">{selectedBeneficiaryIds.length}</span> خێزان
                  </span>
                </div>
              </div>

              {/* Beneficiaries Scrollable Checkbox List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-200/70">
                  {filteredModalBeneficiaries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      هیچ خێزانێک بەپێی ئەم فلتەرە نەدۆزرایەوە
                    </div>
                  ) : (
                    filteredModalBeneficiaries.map(ben => {
                      const isSelected = selectedBeneficiaryIds.includes(ben.id);
                      const customQty = customQuantities[ben.id] !== undefined ? customQuantities[ben.id] : qtyPerBeneficiary;

                      return (
                        <div
                          key={ben.id}
                          className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                            isSelected ? 'bg-cyan-50/80' : 'hover:bg-white'
                          }`}
                        >
                          <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleBeneficiary(ben.id)}
                              className="w-4 h-4 text-cyan-600 focus:ring-cyan-500 border-slate-300 rounded cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 text-xs">{ben.fullName}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                                  {ben.governorate}
                                </span>
                                {ben.needCategory && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100/70 text-amber-900">
                                    {needLabelsMap[ben.needCategory] || ben.needCategory}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono">{ben.phone}</span>
                                {ben.familyMembers !== undefined && (
                                  <span>ژمارەی خێزان: {ben.familyMembers}</span>
                                )}
                                <span>هاوکاری وەرگیراو: {(ben.aidHistory || []).length} جار</span>
                              </div>
                            </div>
                          </label>

                          {/* Custom Quantity Input for this beneficiary */}
                          {allocationMode === 'custom' && isSelected && (
                            <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-cyan-200">
                              <span className="text-[10px] text-slate-500 font-bold">بڕ:</span>
                              <input
                                type="number"
                                min={1}
                                max={totalStockAvailable}
                                value={customQty}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 1);
                                  setCustomQuantities(prev => ({ ...prev, [ben.id]: val }));
                                }}
                                className="w-16 px-2 py-1 rounded-lg border border-slate-200 font-bold text-xs text-center text-slate-900"
                              />
                              <span className="text-[10px] text-slate-500 font-bold">{selectedItemForDistribution.unit}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Project & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">لە چوارچێوەی کام پڕۆژە / کەمپەین:</label>
                  <input
                    type="text"
                    required
                    value={selectedProjectTitle}
                    onChange={(e) => setSelectedProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-xs"
                    placeholder="نموونە: دابەشکردنی سەبەتەی خۆراکی ڕەمەزان"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تێبینی یان ناوچەی دابەشکردن (ئارەزوومەندانە):</label>
                  <input
                    type="text"
                    value={distributionNotes}
                    onChange={(e) => setDistributionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-xs"
                    placeholder="نموونە: گەڕەکی باداوە - تیمی مەیدانی ١"
                  />
                </div>
              </div>

              {/* Live Stock Gauge Summary */}
              <div className={`p-3.5 rounded-2xl border text-xs ${
                isExceedingStock
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-2 font-bold">
                  <div className="flex items-center gap-4">
                    <span>خێزانە هەڵبژێردراوەکان: <span className="font-mono font-black">{selectedBeneficiaryIds.length}</span></span>
                    <span>کۆی پێویست: <span className="font-mono font-black text-sm">{totalDistributeQuantity} {selectedItemForDistribution.unit}</span></span>
                  </div>
                  <div>
                    {isExceedingStock ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        بڕی داواکراو ({totalDistributeQuantity}) لە مەخزەن زیاترە! ({totalStockAvailable} بەردەستە)
                      </span>
                    ) : (
                      <span>ماوەی مەخزەن دوای دابەشکردن: <span className="font-mono font-black text-emerald-800">{remainingAfterDist} {selectedItemForDistribution.unit}</span></span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDistributeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  disabled={selectedBeneficiaryIds.length === 0 || isExceedingStock}
                  className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all ${
                    selectedBeneficiaryIds.length === 0 || isExceedingStock
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'liquid-button-primary text-white hover:shadow-lg'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  دابەشکردن بۆ ({selectedBeneficiaryIds.length}) خێزان ({totalDistributeQuantity} {selectedItemForDistribution.unit})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAddItemModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-600" />
              تۆمارکردنی کاڵای نوێ لە کۆگا
            </h3>

            <form onSubmit={handleAddItemSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناوی کاڵا:</label>
                <input
                  type="text"
                  required
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پۆلێن / جۆر:</label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value as InventoryItem['category'] })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="خۆراک">خۆراک</option>
                    <option value="پۆشاک">پۆشاک</option>
                    <option value="پێداویستی پزیشکی">پێداویستی پزیشکی</option>
                    <option value="گەرمکەرەوە و سووتەمەنی">گەرمکەرەوە و سووتەمەنی</option>
                    <option value="کەلوپەلی ناوماڵ">کەلوپەلی ناوماڵ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">یەکە:</label>
                  <select
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value as InventoryItem['unit'] })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="دانە">دانە</option>
                    <option value="سەبەتە">سەبەتە</option>
                    <option value="کارتۆن">کارتۆن</option>
                    <option value="سێت">سێت</option>
                    <option value="لیتر">لیتر</option>
                    <option value="تەن">تەن</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بڕی سەرەتایی:</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newItemForm.quantity}
                    onChange={(e) => setNewItemForm({ ...newItemForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ئاستی هۆشداری کەمبوونەوە:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newItemForm.minAlertThreshold}
                    onChange={(e) => setNewItemForm({ ...newItemForm, minAlertThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">شوێنی کۆگا:</label>
                <select
                  value={newItemForm.location}
                  onChange={(e) => setNewItemForm({ ...newItemForm, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                >
                  <option value="هەولێر - کۆگای سەرەکی بەحرکە">هەولێر - کۆگای سەرەکی بەحرکە</option>
                  <option value="سلێمانی - کۆگای تاسڵوجە">سلێمانی - کۆگای تاسڵوجە</option>
                  <option value="دهۆک - کۆگای ناوەندی">دهۆک - کۆگای ناوەندی</option>
                  <option value="هەڵەبجە - بنکەی دابەشکردن">هەڵەبجە - بنکەی دابەشکردن</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  تۆمارکردن لە کۆگا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Modal Viewer */}
      {activeReceipt && (
        <OfficialReceiptModal
          donation={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

    </div>
  );
};
