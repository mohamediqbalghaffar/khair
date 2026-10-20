import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem, Donation, NeedCategory } from '../types';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { getExchangeRateForDate } from '../utils/exchangeRates';
import { getDonationCashMetrics, getTotalTreasuryCashAvailable } from '../utils/donationDistributionUtils';
import { useFeedback } from '../components/ui/FeedbackProvider';
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
  Banknote,
  Coins,
  Users,
  CheckSquare,
  Square,
  Filter,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Check,
  Calendar,
  FileText,
  Edit3,
  Phone,
  ExternalLink
} from 'lucide-react';
import { useHaptics } from '../utils/useHaptics';

export type DistributionTarget =
  | { type: 'item'; item: InventoryItem; sourceDonation?: Donation }
  | { type: 'cash'; donation: Donation };

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
    donors,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryQuantity,
    distributeAidFromInventory,
    distributeAidBulkFromInventory,
    distributeCashAidBulk,
    updateAidRecord,
    deleteAidRecord,
    bulkUpdateAidRecords,
    pendingDistributionDonationId,
    setPendingDistributionDonationId,
    setActiveTab
  } = useApp();
  const { showToast, confirmAction } = useFeedback();
  const haptics = useHaptics();

  const [activeSubTab, setActiveSubTab] = useState<'stock' | 'receipts' | 'distributions'>('stock');
  const [distTypeFilter, setDistTypeFilter] = useState<'all' | 'in-kind' | 'monetary'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [distributionTarget, setDistributionTarget] = useState<DistributionTarget | null>(null);
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

  // Auto-open distribution when triggered externally from DonorsView
  useEffect(() => {
    if (pendingDistributionDonationId) {
      const don = donations.find(
        d => d.id === pendingDistributionDonationId || d.receiptNumber === pendingDistributionDonationId
      );
      if (don) {
        setActiveSubTab('receipts');
        const isCash = !don.category || don.category === 'cash';
        if (isCash) {
          handleOpenDistributeCash(don);
        } else {
          handleQuickDistributeFromDonation(don);
        }
      }
      setPendingDistributionDonationId(null);
    }
  }, [pendingDistributionDonationId, donations]);

  // Aggregated distributions from all beneficiaries
  const allDistributions = useMemo(() => {
    return beneficiaries.flatMap(b =>
      (b.aidHistory || []).map(record => ({
        ...record,
        beneficiaryId: b.id,
        beneficiaryName: b.fullName,
        beneficiaryPhone: b.phone,
        beneficiaryGovernorate: b.governorate,
        beneficiaryNeed: b.needCategory
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [beneficiaries]);

  // Distribution History Edit & Batch Edit State
  const [selectedDistKeys, setSelectedDistKeys] = useState<Set<string>>(new Set());
  const [editingDist, setEditingDist] = useState<any | null>(null);
  const [isEditDistModalOpen, setIsEditDistModalOpen] = useState(false);
  const [editDistForm, setEditDistForm] = useState({
    amount: 0,
    projectTitle: '',
    date: '',
    distributedBy: '',
    notes: ''
  });
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditAmount, setBulkEditAmount] = useState<number>(150000);

  const handleOpenEditDist = (dist: any) => {
    setEditingDist(dist);
    setEditDistForm({
      amount: dist.amount || dist.amountIQD || dist.quantity || 0,
      projectTitle: dist.projectTitle || '',
      date: dist.date || new Date().toISOString().split('T')[0],
      distributedBy: dist.distributedBy || '',
      notes: dist.notes || ''
    });
    setIsEditDistModalOpen(true);
  };

  const handleSaveEditDist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDist) return;

    const isMonetary = editingDist.type === 'monetary';
    const isIQD = editingDist.currency !== 'USD';

    const success = updateAidRecord(editingDist.beneficiaryId, editingDist.id, {
      amount: isMonetary ? editDistForm.amount : undefined,
      amountIQD: isMonetary && isIQD ? editDistForm.amount : undefined,
      quantity: !isMonetary ? editDistForm.amount : undefined,
      projectTitle: editDistForm.projectTitle,
      date: editDistForm.date,
      distributedBy: editDistForm.distributedBy,
      notes: editDistForm.notes,
      receiptNumber: editingDist.receiptNumber
    });

    if (success) {
      haptics.success();
      setIsEditDistModalOpen(false);
      setEditingDist(null);
      showToast('تۆماری هاوکارییەکە بە سەرکەوتوویی نوێکرایەوە.', 'success');
    }
  };

  const handleDeleteDist = async (dist: any) => {
    const ok = await confirmAction({
      title: 'سڕینەوەی تۆماری دابەشکردن',
      message: `ئایا دڵنیایت لە سڕینەوەی ئەم تۆماری هاوکارییە بۆ [${dist.beneficiaryName}]؟`,
      confirmLabel: 'بەڵێ، بیسڕەوە',
      variant: 'danger'
    });
    if (!ok) return;

    haptics.warning();
    const success = deleteAidRecord(dist.beneficiaryId, dist.id);
    if (success) {
      setSelectedDistKeys(prev => {
        const next = new Set(prev);
        next.delete(`${dist.beneficiaryId}::${dist.id}`);
        return next;
      });
      showToast('تۆماری هاوکارییەکە بە سەرکەوتوویی سڕایەوە.', 'info');
    }
  };

  const handleBulkEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDistKeys.size === 0 || bulkEditAmount <= 0) return;

    const selectedList = allDistributions.filter(d =>
      selectedDistKeys.has(`${d.beneficiaryId}::${d.id}`)
    );

    const updates = selectedList.map(d => ({
      beneficiaryId: d.beneficiaryId,
      aidRecordId: d.id,
      updatedData: {
        amount: d.type === 'monetary' ? bulkEditAmount : undefined,
        amountIQD: d.type === 'monetary' && d.currency !== 'USD' ? bulkEditAmount : undefined,
        quantity: d.type === 'in-kind' ? bulkEditAmount : undefined,
        receiptNumber: d.receiptNumber
      }
    }));

    const success = bulkUpdateAidRecords(updates);
    if (success) {
      setIsBulkEditModalOpen(false);
      setSelectedDistKeys(new Set());
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      showToast(`بڕی سەرجەم (${updates.length}) تۆمارە دیاریکراوەکە بە سەرکەوتوویی نوێکرایەوە.`, 'success');
    }
  };

  // Treasury Cash Summary
  const treasuryCash = useMemo(() => {
    return getTotalTreasuryCashAvailable(donations, beneficiaries);
  }, [donations, beneficiaries]);

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
    haptics.success();
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

  // Distribution target live calculations (Items vs Cash)
  const activeCashMetrics = useMemo(() => {
    if (distributionTarget?.type === 'cash') {
      return getDonationCashMetrics(distributionTarget.donation, beneficiaries);
    }
    return null;
  }, [distributionTarget, beneficiaries]);

  const totalStockAvailable = useMemo(() => {
    if (!distributionTarget) return 0;
    if (distributionTarget.type === 'item') {
      return distributionTarget.item.quantity || 0;
    } else {
      return activeCashMetrics?.remainingAmount || 0;
    }
  }, [distributionTarget, activeCashMetrics]);

  const distributionUnit = useMemo(() => {
    if (!distributionTarget) return '';
    if (distributionTarget.type === 'item') {
      return distributionTarget.item.unit || 'دانە';
    } else {
      return activeCashMetrics?.currencySymbol || (distributionTarget.donation.currency === 'USD' ? '$' : 'د.ع');
    }
  }, [distributionTarget, activeCashMetrics]);

  const totalDistributeQuantity = useMemo(() => {
    return selectedBeneficiaryIds.reduce((sum, id) => {
      const qty = allocationMode === 'custom'
        ? Number(customQuantities[id] !== undefined ? customQuantities[id] : qtyPerBeneficiary) || 0
        : Number(qtyPerBeneficiary) || 0;
      return sum + qty;
    }, 0);
  }, [selectedBeneficiaryIds, allocationMode, customQuantities, qtyPerBeneficiary]);

  const remainingAfterDist = totalStockAvailable - totalDistributeQuantity;
  const isExceedingStock = totalDistributeQuantity > totalStockAvailable;

  // Beneficiary Selection Handlers
  const handleToggleBeneficiary = (id: string) => {
    haptics.selection();
    setSelectedBeneficiaryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    haptics.selection();
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
    setDistributionTarget({ type: 'item', item });
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
      setDistributionTarget({ type: 'item', item: matched, sourceDonation: donation });
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
      setSelectedProjectTitle(donation.projectName || `دابەشکردنی کۆمەکی پسوولەی ${donation.receiptNumber}`);
      setDistributionNotes('');
      setIsDistributeModalOpen(true);
    } else {
      showToast('ئەم کاڵایە لە کۆگادا بەردەست نییە یان پێشتر دابەشکراوە.', 'warning');
    }
  };

  // Helper to open distribution modal directly for a CASH donation
  const handleOpenDistributeCash = (donation: Donation) => {
    const cashM = getDonationCashMetrics(donation, beneficiaries);
    if (cashM.remainingAmount <= 0) {
      showToast(
        `تەواوی پارەی نەختینەیی ئەم پسوولەیە [${donation.receiptNumber}] پێشتر بەسەر خێزانەکاندا دابەشکراوە و هیچ بڕێکی نەماوە.`,
        'warning'
      );
      return;
    }

    setDistributionTarget({ type: 'cash', donation });
    if (beneficiaries.length > 0) {
      setSelectedBeneficiaryIds([beneficiaries[0].id]);
    } else {
      setSelectedBeneficiaryIds([]);
    }
    const isIQD = donation.currency === 'IQD';
    const defaultAmount = isIQD ? 100000 : 50;
    setQtyPerBeneficiary(defaultAmount);
    setAllocationMode('equal');
    setCustomQuantities({});
    setModalBenSearch('');
    setModalGovFilter('all');
    setModalNeedFilter('all');
    setSelectedProjectTitle(
      donation.projectName || `دابەشکردنی هاوکاری نەختینەیی پسوولەی ${donation.receiptNumber}`
    );
    setDistributionNotes('');
    setIsDistributeModalOpen(true);
  };

  const handleDistributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributionTarget || selectedBeneficiaryIds.length === 0) {
      showToast('تکایە بەلایەنی کەمەوە یەک سوودمەند / خێزان دیاریبکە!', 'warning');
      return;
    }

    if (isExceedingStock) {
      showToast(
        `بڕی داواکراو (${totalDistributeQuantity.toLocaleString()} ${distributionUnit}) زیاترە لەوەی بەردەستە (${totalStockAvailable.toLocaleString()} ${distributionUnit})!`,
        'error'
      );
      return;
    }

    if (distributionTarget.type === 'item') {
      const distributions = selectedBeneficiaryIds.map(id => ({
        beneficiaryId: id,
        quantity: allocationMode === 'custom'
          ? Number(customQuantities[id] !== undefined ? customQuantities[id] : qtyPerBeneficiary) || 1
          : Number(qtyPerBeneficiary) || 1
      }));

      const success = distributeAidBulkFromInventory(
        distributionTarget.item.id,
        distributions,
        selectedProjectTitle,
        distributionNotes
      );

      if (success) {
        haptics.success();
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
        setIsDistributeModalOpen(false);
        setDistributionTarget(null);
        setSelectedBeneficiaryIds([]);
        setCustomQuantities({});
        setDistributionNotes('');
        showToast(`دابەشکردنی کاڵا بۆ (${distributions.length}) خێزان تۆمارکرا.`, 'success');
      } else {
        showToast('بڕی دیاریکراو زیاترە لەوەی لە کۆگادا بەردەستە!', 'error');
      }
    } else {
      // CASH DISTRIBUTION
      const distributions = selectedBeneficiaryIds.map(id => ({
        beneficiaryId: id,
        amount: allocationMode === 'custom'
          ? Number(customQuantities[id] !== undefined ? customQuantities[id] : qtyPerBeneficiary) || 0
          : Number(qtyPerBeneficiary) || 0
      }));

      const success = distributeCashAidBulk(
        distributionTarget.donation.id,
        distributions,
        selectedProjectTitle,
        distributionNotes
      );

      if (success) {
        haptics.success();
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
        setIsDistributeModalOpen(false);
        setDistributionTarget(null);
        setSelectedBeneficiaryIds([]);
        setCustomQuantities({});
        setDistributionNotes('');
        showToast(`دابەشکردنی کۆمەکی نەختینە بۆ (${distributions.length}) خێزان تۆمارکرا.`, 'success');
      } else {
        showToast('بڕی داواکراو زیاترە لە پارەی بەردەستی ئەم پسوولەیە لە سندووقدا!', 'error');
      }
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
            className="w-full pe-10 ps-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
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
                          onClick={async () => {
                            const ok = await confirmAction({
                              title: 'سڕینەوەی کاڵا لە کۆگا',
                              message: `دڵنیایت لە سڕینەوەی کاڵای [${item.name}] لە کۆگا؟`,
                              confirmLabel: 'بەڵێ، بیسڕەوە',
                              variant: 'danger'
                            });
                            if (ok) {
                              deleteInventoryItem(item.id);
                              showToast(`کاڵای «${item.name}» لە کۆگا سڕایەوە.`, 'info');
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
              {/* Mobile Viewport In-Kind Receipt Cards (< 1024px) */}
              <div className="block lg:hidden p-3.5 space-y-3">
                {filteredDonations.map(don => {
                  const isInKind = don.category && don.category !== 'cash';
                  const matchingInv = isInKind
                    ? inventory.find(i => i.sourceReceiptNumber === don.receiptNumber || i.sourceDonationId === don.id)
                    : null;
                  const donor = donors.find(d => d.id === don.donorId);

                  return (
                    <div
                      key={don.id}
                      className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-2.5 touch-manipulation active:scale-[0.99] transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-50 border border-cyan-200 font-mono font-black text-cyan-800 text-xs">
                            <Receipt className="w-3.5 h-3.5 text-cyan-600" />
                            {don.receiptNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                            {don.categoryLabel || 'بەخشین'}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {don.date}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{don.donorName}</p>
                            {donor?.phone && (
                              <div className="pt-1">
                                <a
                                  href={`tel:${donor.phone}`}
                                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-mono text-[11px] font-bold transition-colors touch-manipulation"
                                  title="پەیوەندیکردن بە بەخشەر"
                                >
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{donor.phone}</span>
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="text-start">
                            {isInKind && don.itemDetails ? (
                              <div>
                                <span className="font-bold text-slate-900 text-sm block">
                                  {don.itemDetails.quantity} {don.itemDetails.unit}
                                </span>
                                {don.itemDetails.weightKgPerUnit ? (
                                  <span className="text-[10px] text-slate-500 font-mono block">
                                    {don.itemDetails.weightKgPerUnit} کگم / یەکە
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="font-mono font-black text-emerald-700 text-sm block">
                                {don.amount.toLocaleString()} {don.currency === 'IQD' ? 'د.ع' : '$'}
                              </span>
                            )}
                          </div>
                        </div>

                        {isInKind && don.itemDetails?.contentsDescription && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            پێکهاتە: {don.itemDetails.contentsDescription}
                          </p>
                        )}
                      </div>

                      {/* Warehouse Status & Location */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-slate-500">مەبەست: <strong className="text-slate-700">{don.projectName || 'کۆگای سەرەکی'}</strong></span>
                        <div>
                          {matchingInv ? (
                            matchingInv.quantity > 0 ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                                لە کۆگا ({matchingInv.quantity} {matchingInv.unit})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[10px]">
                                دابەشکراوە
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold border border-slate-200 text-[10px]">
                              نەختینەیی
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setActiveReceipt(don)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors touch-manipulation active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-700" />
                          <span>پسوولە</span>
                        </button>

                        {((isInKind && matchingInv && matchingInv.quantity > 0) || (!isInKind && getDonationCashMetrics(don, beneficiaries).remainingAmount > 0)) && (
                          <button
                            onClick={() => isInKind ? handleQuickDistributeFromDonation(don) : handleOpenDistributeCash(don)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-xs transition-all touch-manipulation active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>دابەشکردن</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Viewport Table (>= 1024px) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-end text-xs">
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
                              (() => {
                                const cashM = getDonationCashMetrics(don, beneficiaries);
                                return cashM.remainingAmount > 0 ? (
                                  <div className="space-y-1">
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit shadow-xs">
                                      <DollarSign className="w-3 h-3 text-emerald-600" />
                                      بەردەست لە سندووق ({cashM.remainingAmount.toLocaleString()} {cashM.currencySymbol})
                                    </span>
                                    {cashM.distributedAmount > 0 && (
                                      <span className="text-[10px] text-slate-500 font-mono block pe-1">
                                        ({cashM.distributedAmount.toLocaleString()} {cashM.currencySymbol} دابەشکراوە)
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-fit">
                                    سەرجەمی دابەشکراوە ({cashM.totalAmount.toLocaleString()} {cashM.currencySymbol})
                                  </span>
                                );
                              })()
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
                                  className="px-3 py-1.5 rounded-xl liquid-button-primary text-white text-[11px] font-bold flex items-center gap-1 shadow-sm hover:shadow transition-all"
                                  title="دابەشکردنی ڕاستەوخۆ بۆ خێزانەکان"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  دابەشکردن
                                </button>
                              )}

                              {/* Quick Distribute Button for cash donations */}
                              {!isInKind && (() => {
                                const cashM = getDonationCashMetrics(don, beneficiaries);
                                return cashM.remainingAmount > 0 ? (
                                  <button
                                    onClick={() => handleOpenDistributeCash(don)}
                                    className="px-3 py-1.5 rounded-xl liquid-button-primary text-white text-[11px] font-bold flex items-center gap-1 shadow-sm hover:shadow transition-all animate-pulse hover:animate-none"
                                    title="دابەشکردنی پارەی کاش بەسەر خێزانەکاندا"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    دابەشکردن
                                  </button>
                                ) : null;
                              })()}
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
          
          {/* Sub-Filter Pills (All vs In-Kind vs Cash) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setDistTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                distTypeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>هەموو دابەشکردنەکان</span>
              <span className="font-mono font-black opacity-80">({allDistributions.length})</span>
            </button>
            <button
              onClick={() => setDistTypeFilter('in-kind')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                distTypeFilter === 'in-kind'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>کەلوپەل و عەینی</span>
              <span className="font-mono font-black opacity-80">
                ({allDistributions.filter(d => d.type === 'in-kind').length})
              </span>
            </button>
            <button
              onClick={() => setDistTypeFilter('monetary')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                distTypeFilter === 'monetary'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>پارەی کاش و نەختینەیی</span>
              <span className="font-mono font-black opacity-80">
                ({allDistributions.filter(d => d.type === 'monetary').length})
              </span>
            </button>
          </div>

          {/* Batch Action Toolbar when rows are checked */}
          {selectedDistKeys.size > 0 && (
            <div className="p-3.5 mb-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-between flex-wrap gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-cyan-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                <span>ژمارەی تۆمارە دیاریکراوەکان: <span className="font-mono font-black text-sm">{selectedDistKeys.size}</span> دانە</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkEditAmount(150000);
                    setIsBulkEditModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  دەستکاریکردنی بەکۆمەڵ (گۆڕینی بڕ بۆ هەموویان)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDistKeys(new Set())}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200"
                >
                  پاککردنەوە
                </button>
              </div>
            </div>
          )}

          {allDistributions.length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
              <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">هیچ دابەشکردنێک بۆ خێزانەکان تۆمار نەکراوە (سفر تۆمار)</p>
              <p className="text-xs text-slate-400 mt-1">
                کاتێک کاڵا یان پارەی کاش دەبەخشیتە خێزانەکان، مێژووی تەواوی دابەشکردنەکە لێرەدا تۆمار دەبێت
              </p>
            </div>
          ) : filteredDistributions.filter(d => distTypeFilter === 'all' || d.type === distTypeFilter).length === 0 ? (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-12 border border-slate-200/90 text-center shadow-sm">
              <p className="text-sm font-bold text-slate-700">هیچ تۆمارێکی دابەشکردن بەپێی ئەم فلتەر یان گەڕانە نەدۆزرایەوە</p>
            </div>
          ) : (
            <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
              {/* Mobile Viewport Distribution Cards (< 1024px) */}
              <div className="block lg:hidden p-3.5 space-y-3">
                {filteredDistributions
                  .filter(d => distTypeFilter === 'all' || d.type === distTypeFilter)
                  .map((dist, idx) => {
                    const ben = beneficiaries.find(b => b.id === dist.beneficiaryId);
                    const lat = ben?.location?.lat;
                    const lng = ben?.location?.lng;
                    const hasGps = Boolean(lat && lng);

                    return (
                      <div
                        key={`${dist.id}-${idx}`}
                        className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-2.5 touch-manipulation active:scale-[0.99] transition-all"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              dist.type === 'monetary'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {dist.type === 'monetary' ? '💵 نەختینە' : '📦 عەینی'}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{dist.beneficiaryName}</span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            {dist.date}
                          </span>
                        </div>

                        {/* Governorate, Phone & GPS */}
                        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {dist.beneficiaryGovernorate}
                          </span>

                          {dist.beneficiaryPhone && (
                            <a
                              href={`tel:${dist.beneficiaryPhone}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-800 font-mono text-[11px] font-bold border border-cyan-200 hover:bg-cyan-100 transition-colors touch-manipulation"
                              title="پەیوەندیکردن بە سوودمەند"
                            >
                              <Phone className="w-3 h-3 text-cyan-600" />
                              <span>{dist.beneficiaryPhone}</span>
                            </a>
                          )}

                          {hasGps && (
                            <a
                              href={`https://www.google.com/maps?q=${lat},${lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200 hover:bg-slate-200 transition-colors touch-manipulation"
                              title="بینینی شوێن لەسەر گووگڵ ماپ"
                            >
                              <ExternalLink className="w-3 h-3 text-cyan-600" />
                              <span>GPS</span>
                            </a>
                          )}
                        </div>

                        {/* Aid Item / Amount */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-500 block">جۆری هاوکاری:</span>
                            <span className="text-xs font-bold text-slate-900">
                              {dist.type === 'monetary' ? 'هاوکاری نەختینەیی' : (dist.itemName || 'کۆمەکی عەینی')}
                            </span>
                          </div>
                          <div className="text-start">
                            <span className="text-[10px] text-slate-500 block">بڕ:</span>
                            {dist.type === 'monetary' ? (
                              <span className="text-sm font-black font-mono text-emerald-700">
                                {dist.currency === 'USD' ? `$${(dist.amount || 0).toLocaleString()}` : `${(dist.amount || dist.amountIQD || 0).toLocaleString()} د.ع`}
                              </span>
                            ) : (
                              <span className="text-sm font-black font-mono text-amber-700">
                                {dist.quantity ? `${dist.quantity} ${dist.unit || 'دانە'}` : '-'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Project & Receipt Source */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                          <span>پڕۆژە: <strong className="text-slate-700">{dist.projectTitle}</strong></span>
                          {dist.receiptNumber && (
                            <span className="font-mono text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                              {dist.receiptNumber}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">
                            دابەشکراوە لەلایەن: <strong className="text-slate-700">{dist.distributedBy || 'ڕێکخراو'}</strong>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditDist(dist)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-700 transition-colors touch-manipulation active:scale-95"
                              title="دەستکاری"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDist(dist)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200 touch-manipulation active:scale-95"
                              title="سڕینەوە"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Desktop Viewport Table (>= 1024px) */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-end text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const curFiltered = filteredDistributions.filter(d => distTypeFilter === 'all' || d.type === distTypeFilter);
                            const allKeys = curFiltered.map(d => `${d.beneficiaryId}::${d.id}`);
                            const allSelected = allKeys.length > 0 && allKeys.every(k => selectedDistKeys.has(k));
                            if (allSelected) {
                              setSelectedDistKeys(new Set());
                            } else {
                              setSelectedDistKeys(new Set(allKeys));
                            }
                          }}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          title="دیاریکردنی هەمووی"
                        >
                          {(() => {
                            const curFiltered = filteredDistributions.filter(d => distTypeFilter === 'all' || d.type === distTypeFilter);
                            const allKeys = curFiltered.map(d => `${d.beneficiaryId}::${d.id}`);
                            const allSelected = allKeys.length > 0 && allKeys.every(k => selectedDistKeys.has(k));
                            return allSelected && allKeys.length > 0 ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            );
                          })()}
                        </button>
                      </th>
                      <th className="p-3.5">ناوی سوودمەند / خێزان</th>
                      <th className="p-3.5">پارێزگا / تەلەفۆن</th>
                      <th className="p-3.5">جۆری هاوکاری / کاڵا</th>
                      <th className="p-3.5">بڕی دراوە</th>
                      <th className="p-3.5">پڕۆژە / کەمپەین</th>
                      <th className="p-3.5">سەرچاوەی بەخشین</th>
                      <th className="p-3.5">بەروار</th>
                      <th className="p-3.5">دابەشکراوە لەلایەن</th>
                      <th className="p-3.5 text-center">کردارەکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDistributions
                      .filter(d => distTypeFilter === 'all' || d.type === distTypeFilter)
                      .map((dist, idx) => {
                        const distKey = `${dist.beneficiaryId}::${dist.id}`;
                        const isChecked = selectedDistKeys.has(distKey);
                        return (
                          <tr key={`${dist.id}-${idx}`} className={`hover:bg-slate-50/60 transition-all ${isChecked ? 'bg-cyan-50/40' : ''}`}>
                            {/* Checkbox */}
                            <td className="p-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDistKeys(prev => {
                                    const next = new Set(prev);
                                    if (next.has(distKey)) next.delete(distKey);
                                    else next.add(distKey);
                                    return next;
                                  });
                                }}
                                className="text-slate-400 hover:text-slate-700 transition-colors"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-cyan-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            {/* Beneficiary Name */}
                            <td className="p-3.5 font-bold text-slate-900">
                              {dist.beneficiaryName}
                            </td>

                            {/* Governorate & Phone */}
                            <td className="p-3.5 text-slate-600">
                              <span>{dist.beneficiaryGovernorate}</span>
                              <span className="text-[11px] text-slate-400 block font-mono">{dist.beneficiaryPhone}</span>
                            </td>

                            {/* Item Name / Monetary */}
                            <td className="p-3.5 font-bold">
                              {dist.type === 'monetary' ? (
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                  <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  هاوکاری نەختینەیی (کاش)
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-slate-800">
                                  <Boxes className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  {dist.itemName || 'کۆمەکی عەینی'}
                                </span>
                              )}
                            </td>

                            {/* Quantity / Amount */}
                            <td className="p-3.5 font-bold font-mono">
                              {dist.type === 'monetary' ? (
                                <span className="text-emerald-700 font-black text-xs">
                                  {dist.currency === 'USD' ? `$${(dist.amount || 0).toLocaleString()}` : `${(dist.amount || dist.amountIQD || 0).toLocaleString()} د.ع`}
                                </span>
                              ) : (
                                <span className="text-amber-700 font-black text-xs">
                                  {dist.quantity ? `${dist.quantity} ${dist.unit || 'دانە'}` : '-'}
                                </span>
                              )}
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

                            {/* Actions (Edit & Delete) */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditDist(dist)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 transition-colors"
                                  title="دەستکاریکردنی ئەم هاوکارییە"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDist(dist)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 transition-colors"
                                  title="سڕینەوەی ئەم تۆمارە"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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

      {/* Multi-Beneficiary Distribution Modal (Items & Cash) */}
      {isDistributeModalOpen && distributionTarget && (
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
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                distributionTarget.type === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {distributionTarget.type === 'cash' ? (
                  <Banknote className="w-6 h-6" />
                ) : (
                  <Users className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 pe-1">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  {distributionTarget.type === 'cash'
                    ? 'دابەشکردنی بە کۆمەڵی هاوکاری نەختینەیی (پارەی کاش)'
                    : 'دابەشکردنی بە کۆمەڵی هاوکاری و کاڵاکان'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {distributionTarget.type === 'cash'
                    ? 'دیاریکردنی یەک یان چەندین خێزانی سوودمەند بۆ وەرگرتنی هاوکاری نەختینەیی لەم پسوولەی بەخشینە'
                    : 'دەتوانیت یەک یان چەندین خێزانی سوودمەند لە یەک کاتدا دیاری بکەیت بۆ وەرگرتنی ئەم کاڵایە'}
                </p>
              </div>
            </div>

            {/* Target Overview Card */}
            {distributionTarget.type === 'cash' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 mb-4 text-xs">
                <div>
                  <span className="text-emerald-800 block text-[11px] font-bold">پسوولەی بەخشین:</span>
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5 mt-0.5">
                    <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                    {distributionTarget.donation.receiptNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 block">بەخشەر: {distributionTarget.donation.donorName}</span>
                </div>
                <div>
                  <span className="text-emerald-800 block text-[11px] font-bold">بڕی بەردەست لە سندووق:</span>
                  <span className="font-black text-emerald-800 font-mono text-base block mt-0.5">
                    {totalStockAvailable.toLocaleString()} {distributionUnit}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    کۆی بەخشین: {distributionTarget.donation.amount.toLocaleString()} {distributionUnit}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800 block text-[11px] font-bold">پڕۆژە / مەبەستی بەخشین:</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {distributionTarget.donation.projectName || 'دابەشکردنی خێرخوازی دەستبەجێ'}
                  </span>
                  <span className="text-[10px] text-slate-500 block">بەروار: {distributionTarget.donation.date}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">ناوی کاڵا:</span>
                  <span className="font-bold text-slate-900 text-sm">{distributionTarget.item.name}</span>
                  <span className="text-[10px] text-slate-500 block">({distributionTarget.item.category})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">کۆی بەردەست لە مەخزەن:</span>
                  <span className="font-black text-amber-700 font-mono text-base">
                    {totalStockAvailable} {distributionTarget.item.unit}
                  </span>
                  <span className="text-[10px] text-slate-500 block">{distributionTarget.item.location}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">سەرچاوەی بەخشین:</span>
                  {distributionTarget.item.sourceReceiptNumber ? (
                    <span className="font-bold text-emerald-800 flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      {distributionTarget.item.sourceDonorName || 'بەخشەر'} ({distributionTarget.item.sourceReceiptNumber})
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">پاشەکەوتی ڕێکخراو</span>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleDistributeSubmit} className="space-y-4 text-xs">
              
              {/* Allocation Mode Selector & Default Qty/Amount */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-slate-800 font-bold mb-0.5">
                      {distributionTarget.type === 'cash'
                        ? 'شێوازی دیاریکردنی بڕی پارە بۆ هەر خێزانێک:'
                        : 'شێوازی دیاریکردنی بڕی کاڵا بۆ هەر خێزانێک:'}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {distributionTarget.type === 'cash'
                        ? 'هەڵبژێرە کە ئایا بڕی پارەکە بۆ هەمووان یەکسان بێت یان بۆ هەر خێزانێک بە جیا دیاری بکرێت'
                        : 'هەڵبژێرە کە ئایا بڕەکە بۆ هەمووان یەکسان بێت یان بەپێی قەبارەی خێزان دەستکاری بکرێت'}
                    </span>
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
                          ? distributionTarget.type === 'cash' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      بڕی تایبەت بە هەر خێزانێک
                    </button>
                  </div>
                </div>

                {allocationMode === 'equal' && (
                  <div className="space-y-2.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <label className="text-slate-700 font-bold whitespace-nowrap">
                        {distributionTarget.type === 'cash' ? 'بڕی پارە بۆ هەر خێزانێک:' : 'بڕ بۆ هەر خێزانێک:'}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          step="any"
                          required
                          value={qtyPerBeneficiary}
                          onChange={(e) => setQtyPerBeneficiary(Math.max(1, Number(e.target.value) || 0))}
                          className="w-32 px-3 py-1.5 rounded-xl liquid-input font-bold text-sm text-center text-slate-900 font-mono"
                        />
                        <span className="text-slate-700 font-bold">{distributionUnit}</span>
                      </div>
                    </div>

                    {/* Quick Preset Buttons for Cash */}
                    {distributionTarget.type === 'cash' && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-slate-400 font-bold">بڕە ئامادەکراوەکان:</span>
                        {(distributionUnit === '$'
                          ? [25, 50, 100, 150, 200, 300]
                          : [25000, 50000, 75000, 100000, 150000, 200000, 250000, 500000]
                        ).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setQtyPerBeneficiary(preset)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition-all border ${
                              qtyPerBeneficiary === preset
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {preset.toLocaleString()} {distributionUnit}
                          </button>
                        ))}
                      </div>
                    )}
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
                      className="w-full pe-8 ps-3 py-2 text-xs rounded-xl liquid-input text-slate-900 placeholder-slate-400"
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
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all ${
                        distributionTarget.type === 'cash'
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                      }`}
                      title="دیاریکردنی ئەوپەڕی خێزان کە بەشی کۆی مەخزەن یان سندووق دەکات"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      بەپێی کۆی بەردەست ({Math.min(filteredModalBeneficiaries.length, Math.floor(totalStockAvailable / (qtyPerBeneficiary || 1)))} خێزان)
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

                          {/* Custom Quantity/Amount Input for this beneficiary */}
                          {allocationMode === 'custom' && isSelected && (
                            <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-cyan-200">
                              <span className="text-[10px] text-slate-500 font-bold">بڕ:</span>
                              <input
                                type="number"
                                min={1}
                                step="any"
                                value={customQty}
                                onChange={(e) => {
                                  const val = Math.max(1, Number(e.target.value) || 0);
                                  setCustomQuantities(prev => ({ ...prev, [ben.id]: val }));
                                }}
                                className="w-24 px-2 py-1 rounded-lg border border-slate-200 font-bold font-mono text-xs text-center text-slate-900"
                              />
                              <span className="text-[10px] text-slate-500 font-bold">{distributionUnit}</span>
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
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-xs font-medium"
                    placeholder={distributionTarget.type === 'cash' ? 'نموونە: دابەشکردنی دەستبەجێی هاوکاری نەختینەیی' : 'نموونە: دابەشکردنی سەبەتەی خۆراکی ڕەمەزان'}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">تێبینی یان ناوچەی دابەشکردن (ئارەزوومەندانە):</label>
                  <input
                    type="text"
                    value={distributionNotes}
                    onChange={(e) => setDistributionNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-xs font-medium"
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
                    <span>کۆی پێویست: <span className="font-mono font-black text-sm">{totalDistributeQuantity.toLocaleString()} {distributionUnit}</span></span>
                  </div>
                  <div>
                    {isExceedingStock ? (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        بڕی داواکراو ({totalDistributeQuantity.toLocaleString()}) لە بەردەست زیاترە! ({totalStockAvailable.toLocaleString()} {distributionUnit} بەردەستە)
                      </span>
                    ) : (
                      <span>ماوە دوای دابەشکردن: <span className="font-mono font-black text-emerald-800">{remainingAfterDist.toLocaleString()} {distributionUnit}</span></span>
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
                  دابەشکردن بۆ ({selectedBeneficiaryIds.length}) خێزان ({totalDistributeQuantity.toLocaleString()} {distributionUnit})
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

      {/* Edit Single Distribution Modal */}
      {isEditDistModalOpen && editingDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                دەستکاریکردنی تۆماری هاوکاری
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditDistModalOpen(false);
                  setEditingDist(null);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 mb-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p><span className="text-slate-500 font-bold">سوودمەند:</span> <span className="font-black text-slate-900">{editingDist.beneficiaryName}</span></p>
              {editingDist.receiptNumber && (
                <p><span className="text-slate-500 font-bold">پسوولەی بەخشین:</span> <span className="font-mono font-bold text-emerald-700">{editingDist.receiptNumber} {editingDist.donorName ? `(${editingDist.donorName})` : ''}</span></p>
              )}
            </div>

            <form onSubmit={handleSaveEditDist} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {editingDist.type === 'monetary' ? `بڕی پارە (${editingDist.currency === 'USD' ? 'دۆلار $' : 'دینار د.ع'}):` : `بڕ / ژمارە (${editingDist.unit || 'دانە'}):`}
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={editDistForm.amount}
                  onChange={(e) => setEditDistForm({ ...editDistForm, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono text-sm"
                />
                {editingDist.type === 'monetary' && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(editingDist.currency === 'USD' ? [25, 50, 100, 150, 200] : [25000, 50000, 100000, 150000, 200000, 250000]).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditDistForm(prev => ({ ...prev, amount: preset }))}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                          editDistForm.amount === preset
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {editingDist.currency === 'USD' ? `$${preset}` : `${(preset / 1000)} هەزار`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">پڕۆژە / کەمپەین:</label>
                <input
                  type="text"
                  value={editDistForm.projectTitle}
                  onChange={(e) => setEditDistForm({ ...editDistForm, projectTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەروار:</label>
                  <input
                    type="date"
                    value={editDistForm.date}
                    onChange={(e) => setEditDistForm({ ...editDistForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دابەشکراوە لەلایەن:</label>
                  <input
                    type="text"
                    value={editDistForm.distributedBy}
                    onChange={(e) => setEditDistForm({ ...editDistForm, distributedBy: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">تێبینی:</label>
                <textarea
                  rows={2}
                  value={editDistForm.notes}
                  onChange={(e) => setEditDistForm({ ...editDistForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditDistModalOpen(false);
                    setEditingDist(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  پاشەکەوتکردنی گۆڕانکاری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600" />
                دەستکاریکردنی بەکۆمەڵی بڕ بۆ ({selectedDistKeys.size}) تۆمار
              </h3>
              <button
                type="button"
                onClick={() => setIsBulkEditModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              ئەم بڕەی خوارەوە بە شێوەیەکی یەکسان بۆ سەرجەم <span className="font-bold text-slate-900 font-mono">({selectedDistKeys.size})</span> تۆماری هەڵبژێردراو دادەنرێت:
            </p>

            <form onSubmit={handleBulkEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  بڕی نوێ (دینار / ژمارە):
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  required
                  value={bulkEditAmount}
                  onChange={(e) => setBulkEditAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold font-mono text-base text-center"
                />
                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
                  {[25000, 50000, 75000, 100000, 150000, 200000, 250000].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBulkEditAmount(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        bulkEditAmount === preset
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {preset === 150000 ? '★ ۱۵۰،۰۰۰ د.ع' : `${preset / 1000} هەزار`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-bold"
                >
                  جێبەجێکردن بۆ هەموویان
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
