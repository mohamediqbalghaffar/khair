import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Donation } from '../types';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  FileSpreadsheet,
  Smartphone,
  Target,
  PieChart,
  Package,
  Boxes,
  Gift,
  ArrowDownRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { OnlinePaymentModal } from '../components/OnlinePaymentModal';
import { OfficialReceiptModal } from '../components/OfficialReceiptModal';
import { getExchangeRateForDate, aggregateAmountsByDayRate } from '../utils/exchangeRates';

export const FinanceView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    donations,
    projects,
    inventory,
    currencyView,
    setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'in_kind' | 'cash'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isOnlinePayOpen, setIsOnlinePayOpen] = useState(false);
  const [activeReceiptDonation, setActiveReceiptDonation] = useState<Donation | null>(null);

  // New Transaction Form State
  const [txAmountStr, setTxAmountStr] = useState('');
  const [txForm, setTxForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 0,
    currency: 'IQD' as 'IQD' | 'USD',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recordedBy: 'ژمێریاری ڕێکخراو',
    relatedProjectId: '',
    receiptNumber: ''
  });

  // Helper to identify in-kind aid and goods transactions
  const isInKindTx = (t: typeof transactions[0]) => {
    if (t.isCash === false) return true;
    if (t.itemQuantity && t.itemQuantity > 0) return true;
    if (t.itemUnitPrice && t.itemUnitPrice > 0) return true;
    const cat = (t.category || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();
    return (
      cat.includes('عەینی') ||
      cat.includes('کۆمەک') ||
      cat.includes('کەرەستە') ||
      cat.includes('کاڵا') ||
      cat.includes('خۆراک') ||
      desc.includes('عەینی') ||
      desc.includes('کارتۆن') ||
      desc.includes('سەبەتە') ||
      desc.includes('هاوکاری عەینی')
    );
  };

  // Financial aggregates - Day-by-day synchronized
  const incomeTx = transactions.filter(t => t.type === 'income');
  const expenseTx = transactions.filter(t => t.type === 'expense');

  const incomeAgg = aggregateAmountsByDayRate(incomeTx);
  const expenseAgg = aggregateAmountsByDayRate(expenseTx);

  const totalIncomeIQD = incomeAgg.totalIQD;
  const totalIncomeUSD = incomeAgg.totalUSD;
  const totalExpenseIQD = expenseAgg.totalIQD;
  const totalExpenseUSD = expenseAgg.totalUSD;

  const balanceIQD = totalIncomeIQD - totalExpenseIQD;
  const balanceUSD = Number((totalIncomeUSD - totalExpenseUSD).toFixed(2));

  // Cash vs In-Kind breakdown
  const inKindIncomeTx = incomeTx.filter(isInKindTx);
  const cashIncomeTx = incomeTx.filter(t => !isInKindTx(t));
  const inKindIncomeAgg = aggregateAmountsByDayRate(inKindIncomeTx);
  const cashIncomeAgg = aggregateAmountsByDayRate(cashIncomeTx);

  const inKindExpenseTx = expenseTx.filter(isInKindTx);
  const cashExpenseTx = expenseTx.filter(t => !isInKindTx(t));
  const inKindExpenseAgg = aggregateAmountsByDayRate(inKindExpenseTx);
  const cashExpenseAgg = aggregateAmountsByDayRate(cashExpenseTx);

  const cashBalanceIQD = cashIncomeAgg.totalIQD - cashExpenseAgg.totalIQD;
  const cashBalanceUSD = Number((cashIncomeAgg.totalUSD - cashExpenseAgg.totalUSD).toFixed(2));

  // Warehouse total valuation (Remaining assets in warehouse)
  let totalWarehouseValuationIQD = 0;
  let totalWarehouseUnits = 0;
  for (const item of inventory) {
    const val = item.estimatedMarketValue !== undefined
      ? item.estimatedMarketValue
      : (item.quantity * (item.unitPrice || 0));
    totalWarehouseValuationIQD += val;
    totalWarehouseUnits += (item.quantity || 0);
  }
  const todayRate = getExchangeRateForDate(new Date().toISOString().split('T')[0]).rate || 1543;
  const totalWarehouseValuationUSD = Number((totalWarehouseValuationIQD / todayRate).toFixed(2));

  // In-Kind received items summary count
  let totalInKindReceivedUnits = 0;
  for (const t of inKindIncomeTx) {
    if (t.itemQuantity) {
      totalInKindReceivedUnits += t.itemQuantity;
    } else {
      const don = donations.find(d => d.receiptNumber === t.receiptNumber);
      if (don?.itemDetails?.quantity) totalInKindReceivedUnits += don.itemDetails.quantity;
    }
  }

  // In-Kind distributed items summary count
  let totalInKindDistributedUnits = 0;
  for (const t of inKindExpenseTx) {
    if (t.itemQuantity) {
      totalInKindDistributedUnits += t.itemQuantity;
    } else if (t.itemUnitPrice && t.itemUnitPrice > 0) {
      totalInKindDistributedUnits += Math.round(t.amount / t.itemUnitPrice);
    }
  }

  // Dynamic Budget Planning & Forecasting metrics (connected to projects & transactions, 0 when empty)
  let totalPlannedBudgetUSD = 0;
  let totalPlannedBudgetIQD = 0;
  for (const p of projects) {
    const rate = getExchangeRateForDate(p.startDate).rate;
    const pUSD = p.targetBudgetUSD || (p.targetBudgetIQD ? Number((p.targetBudgetIQD / rate).toFixed(2)) : 0);
    const pIQD = p.targetBudgetIQD || Math.round(pUSD * rate);
    totalPlannedBudgetUSD += pUSD;
    totalPlannedBudgetIQD += pIQD;
  }
  totalPlannedBudgetUSD = Number(totalPlannedBudgetUSD.toFixed(2));

  const totalSpentUSD = totalExpenseUSD;
  const totalSpentIQD = totalExpenseIQD;

  const overallBudgetUSD = totalPlannedBudgetUSD;
  const overallBudgetIQD = totalPlannedBudgetIQD;
  const overallBudgetPercent = (currencyView === 'IQD' ? overallBudgetIQD : overallBudgetUSD) > 0
    ? Math.min(100, Math.round(((currencyView === 'IQD' ? totalSpentIQD : totalSpentUSD) / (currencyView === 'IQD' ? overallBudgetIQD : overallBudgetUSD)) * 100))
    : 0;

  const remainingBudgetUSD = Math.max(0, Number((totalPlannedBudgetUSD - totalSpentUSD).toFixed(2)));
  const remainingBudgetIQD = Math.max(0, totalPlannedBudgetIQD - totalSpentIQD);

  // Dynamic Category Breakdown linked directly to projects and transactions
  const categoryTemplates = [
    {
      title: 'کڕینی خۆراک و سەبەتە',
      categoryKey: 'خۆراک',
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'دەرمان و چارەسەری نەخۆش',
      categoryKey: 'تەندروستی',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      title: 'سندووقی بێباوک و پەروەردە',
      categoryKey: 'پەروەردە و فێرکردن',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      title: 'تێچووی گواستنەوە و فریاگوزاری',
      categoryKey: 'فریاگوزاری خێرا',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  const budgetCategories = categoryTemplates.map(cat => {
    const matchingProjects = projects.filter(p => p.category === cat.categoryKey || p.title.includes(cat.categoryKey));
    let catBudgetUSD = 0;
    let catBudgetIQD = 0;
    for (const p of matchingProjects) {
      const rate = getExchangeRateForDate(p.startDate).rate;
      const pUSD = p.targetBudgetUSD || (p.targetBudgetIQD ? Number((p.targetBudgetIQD / rate).toFixed(2)) : 0);
      const pIQD = p.targetBudgetIQD || Math.round(pUSD * rate);
      catBudgetUSD += pUSD;
      catBudgetIQD += pIQD;
    }
    catBudgetUSD = Number(catBudgetUSD.toFixed(2));

    const matchingTx = transactions.filter(t => t.type === 'expense' && (t.category.includes(cat.categoryKey) || matchingProjects.some(p => p.id === t.relatedProjectId)));
    const txAgg = aggregateAmountsByDayRate(matchingTx);

    let projSpentUSD = 0;
    let projSpentIQD = 0;
    for (const p of matchingProjects) {
      const rate = getExchangeRateForDate(p.startDate).rate;
      const sUSD = p.spentBudgetUSD || (p.spentBudgetIQD ? Number((p.spentBudgetIQD / rate).toFixed(2)) : 0);
      const sIQD = p.spentBudgetIQD || Math.round(sUSD * rate);
      projSpentUSD += sUSD;
      projSpentIQD += sIQD;
    }

    const catSpentIQD = Math.max(txAgg.totalIQD, projSpentIQD);
    const catSpentUSD = Math.max(txAgg.totalUSD, Number(projSpentUSD.toFixed(2)));

    const percent = (currencyView === 'IQD' ? catBudgetIQD : catBudgetUSD) > 0
      ? Math.min(100, Math.round(((currencyView === 'IQD' ? catSpentIQD : catSpentUSD) / (currencyView === 'IQD' ? catBudgetIQD : catBudgetUSD)) * 100))
      : 0;

    return {
      title: cat.title,
      budgetIQD: catBudgetIQD,
      budgetUSD: catBudgetUSD,
      spentIQD: catSpentIQD,
      spentUSD: catSpentUSD,
      percent,
      color: cat.color,
      projectsCount: matchingProjects.length
    };
  });

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q));
    const inKind = isInKindTx(t);
    let matchesType = true;
    if (typeFilter === 'income') matchesType = t.type === 'income';
    else if (typeFilter === 'expense') matchesType = t.type === 'expense';
    else if (typeFilter === 'in_kind') matchesType = inKind;
    else if (typeFilter === 'cash') matchesType = !inKind;
    return matchesSearch && matchesType;
  });

  const handleTxCurrencySwitch = (newCurr: 'IQD' | 'USD') => {
    if (newCurr === txForm.currency) return;
    const clean = txAmountStr.replace(/[^0-9]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    const rate = getExchangeRateForDate(txForm.date).rate;
    if (num > 0 && rate > 0) {
      if (newCurr === 'USD') {
        setTxAmountStr(Number((num / rate).toFixed(2)).toString());
      } else {
        setTxAmountStr(Math.round(num * rate).toString());
      }
    }
    setTxForm(prev => ({ ...prev, currency: newCurr }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = txAmountStr.replace(/[^0-9]/g, '');
    const amountVal = cleanAmount ? parseInt(cleanAmount, 10) : 0;
    addTransaction({ ...txForm, amount: amountVal });
    setIsAddModalOpen(false);
    setTxAmountStr('');
    setTxForm({
      type: 'expense',
      amount: 0,
      currency: 'IQD',
      category: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      recordedBy: 'ژمێریاری ڕێکخراو',
      relatedProjectId: '',
      receiptNumber: ''
    });
  };

  const exportCSV = () => {
    const headers = "ژمارە,جۆر,پۆلێنی دارایی,بڕی پارە,دراو,نرخی تاک,بڕی دانە,بەش,بەروار,ڕوونکردنەوە,پسوولە\n";
    const rows = filteredTransactions.map(t =>
      `"${t.id}","${t.type === 'income' ? 'داهات' : 'خەرجی'}","${isInKindTx(t) ? 'کۆمەک و هاوکاری عەینی' : 'نەختینەیی'}","${t.amount}","${t.currency}","${t.itemUnitPrice || ''}","${t.itemQuantity || ''}","${t.category}","${t.date}","${t.description.replace(/"/g, '""')}","${t.receiptNumber || ''}"`
    ).join("\n");

    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-cyan-600" />
            دارایی، داهات و خەرجییەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تۆماری شەفافی داهاتەکان و خەرجییەکانی سەرجەم پڕۆژە خێرخوازییەکان
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            هەناردەکردنی Excel/CSV
          </button>
          
          <button
            onClick={() => setIsOnlinePayOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-800 text-xs font-bold transition-all shadow-sm"
          >
            <Smartphone className="w-4 h-4 text-cyan-600" />
            بەخشینی ئۆنلاین (FIB/FastPay)
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4" />
            تۆماری دارایی نوێ
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Income Card */}
        <div className="rounded-3xl bg-emerald-50/70 backdrop-blur-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-800">کۆی گشتی داهات (Total Inflow)</span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-900 font-mono">
              {currencyView === 'IQD' ? `${totalIncomeIQD.toLocaleString()} د.ع` : `$${totalIncomeUSD.toLocaleString()}`}
            </div>
            <p className="text-xs text-emerald-700 mt-1 font-mono font-bold">
              {currencyView === 'IQD'
                ? `هاوتای $${totalIncomeUSD.toLocaleString()} دۆلار (بە نرخی ڕۆژ)`
                : `هاوتای ${totalIncomeIQD.toLocaleString()} دینار (بە نرخی ڕۆژ)`}
            </p>
          </div>

          {/* Cash vs In-Kind Breakdown */}
          <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-white/80 border border-emerald-100/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] font-bold">💵 نەختینە (کاش):</span>
              <span className="font-mono font-black text-emerald-800">
                {currencyView === 'IQD' ? `${cashIncomeAgg.totalIQD.toLocaleString()} د.ع` : `$${cashIncomeAgg.totalUSD.toLocaleString()}`}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-emerald-100/80 shadow-xs">
              <span className="text-indigo-700 block text-[10px] font-bold">📦 بەخشینی عەینی:</span>
              <span className="font-mono font-black text-indigo-900">
                {currencyView === 'IQD' ? `${inKindIncomeAgg.totalIQD.toLocaleString()} د.ع` : `$${inKindIncomeAgg.totalUSD.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="rounded-3xl bg-rose-50/70 backdrop-blur-2xl p-5 border border-rose-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-rose-800">کۆی خەرجی و داشکاندن (Total Outflow)</span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-900 font-mono">
              {currencyView === 'IQD' ? `${totalExpenseIQD.toLocaleString()} د.ع` : `$${totalExpenseUSD.toLocaleString()}`}
            </div>
            <p className="text-xs text-rose-700 mt-1 font-mono font-bold">
              {currencyView === 'IQD'
                ? `هاوتای $${totalExpenseUSD.toLocaleString()} دۆلار (بە نرخی ڕۆژ)`
                : `هاوتای ${totalExpenseIQD.toLocaleString()} دینار (بە نرخی ڕۆژ)`}
            </p>
          </div>

          {/* Cash vs In-Kind Aid Breakdown */}
          <div className="mt-3 pt-3 border-t border-rose-200/60 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-white/80 border border-rose-100/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] font-bold">💳 خەرجی نەختینە:</span>
              <span className="font-mono font-black text-rose-800">
                {currencyView === 'IQD' ? `${cashExpenseAgg.totalIQD.toLocaleString()} د.ع` : `$${cashExpenseAgg.totalUSD.toLocaleString()}`}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-rose-100/80 shadow-xs">
              <span className="text-rose-700 block text-[10px] font-bold">🎁 هاوکاری عەینی داشکێنراو:</span>
              <span className="font-mono font-black text-rose-800">
                {currencyView === 'IQD' ? `${inKindExpenseAgg.totalIQD.toLocaleString()} د.ع` : `$${inKindExpenseAgg.totalUSD.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="rounded-3xl bg-cyan-50/70 backdrop-blur-2xl p-5 border border-cyan-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-cyan-900">باڵانسی خاوێن و سەروەت (Net Assets)</span>
              <div className="w-9 h-9 rounded-2xl bg-white border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-2xl font-black font-mono ${balanceIQD >= 0 ? 'text-cyan-900' : 'text-rose-700'}`}>
              {currencyView === 'IQD' ? `${balanceIQD.toLocaleString()} د.ع` : `$${balanceUSD.toLocaleString()}`}
            </div>
            <p className="text-xs text-cyan-800 mt-1 font-mono font-bold">
              {currencyView === 'IQD'
                ? `هاوتای $${balanceUSD.toLocaleString()} دۆلار (بە نرخی ڕۆژ)`
                : `هاوتای ${balanceIQD.toLocaleString()} دینار (بە نرخی ڕۆژ)`}
            </p>
          </div>

          {/* Cash in hand vs Warehouse stock value */}
          <div className="mt-3 pt-3 border-t border-cyan-200/60 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-white/80 border border-cyan-100/80 shadow-xs">
              <span className="text-slate-500 block text-[10px] font-bold">💰 کاشی بەردەست:</span>
              <span className="font-mono font-black text-cyan-900">
                {currencyView === 'IQD' ? `${cashBalanceIQD.toLocaleString()} د.ع` : `$${cashBalanceUSD.toLocaleString()}`}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white/80 border border-cyan-100/80 shadow-xs">
              <span className="text-indigo-700 block text-[10px] font-bold">🏢 بەهای ماوە لە کۆگا:</span>
              <span className="font-mono font-black text-indigo-900">
                {currencyView === 'IQD' ? `${totalWarehouseValuationIQD.toLocaleString()} د.ع` : `$${totalWarehouseValuationUSD.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* In-Kind Donations & Warehouse Assets Section */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-5 sm:p-6 text-white shadow-xl relative overflow-hidden border border-indigo-700/40 space-y-4">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  پوختەی بەخشینە عەینییەکان و بەهای کۆگا (In-Kind & Warehouse Ledger)
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    بەستراوە بە دارایی
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  داشکاندنی ئۆتۆماتیکی بەهای کەرەستە و سەبەتە لە دارایی لە کاتی دابەشکردن بەسەر سوودمەنداندا
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-cyan-200 transition-all self-start sm:self-center"
            >
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              بەڕێوەبردنی کۆگا ({inventory.length}) ←
            </button>
          </div>

          {/* 3 Interactive Highlight Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Received */}
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-emerald-400" />
                  کۆی بەهای وەرگیراو (Inflow)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  داهاتی عەینی
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {currencyView === 'IQD' ? `${inKindIncomeAgg.totalIQD.toLocaleString()} د.ع` : `$${inKindIncomeAgg.totalUSD.toLocaleString()}`}
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1.5 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">بڕی وەرگیراو:</span>
                  <span className="font-bold text-white">{totalInKindReceivedUnits} دانە / کارتۆن</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>نرخی تاک:</span>
                  <span className="text-emerald-300 font-bold">
                    {inKindIncomeTx[0]?.itemUnitPrice
                      ? `${inKindIncomeTx[0].itemUnitPrice.toLocaleString()} د.ع`
                      : (totalInKindReceivedUnits > 0 ? `${Math.round(inKindIncomeAgg.totalIQD / totalInKindReceivedUnits).toLocaleString()} د.ع` : '—')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Distributed */}
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-rose-400" />
                  کۆی بەهای دابەشکراو (Outflow)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  داشکێنراو لە باڵانس
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-rose-400">
                {currencyView === 'IQD' ? `${inKindExpenseAgg.totalIQD.toLocaleString()} د.ع` : `$${inKindExpenseAgg.totalUSD.toLocaleString()}`}
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1.5 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">بڕی بەخشراو بە خێزانەکان:</span>
                  <span className="font-bold text-white">{totalInKindDistributedUnits} دانە / کارتۆن</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>نرخی داشکێنراوی تاک:</span>
                  <span className="text-rose-300 font-bold">
                    {inKindExpenseTx[0]?.itemUnitPrice
                      ? `${inKindExpenseTx[0].itemUnitPrice.toLocaleString()} د.ع`
                      : (totalInKindDistributedUnits > 0 ? `${Math.round(inKindExpenseAgg.totalIQD / totalInKindDistributedUnits).toLocaleString()} د.ع` : '—')}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Warehouse Remaining */}
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4 space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-cyan-400" />
                  بەهای ماوە لە کۆگا (Warehouse Stock)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  سەروەتی ماوە
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-cyan-400">
                {currencyView === 'IQD' ? `${totalWarehouseValuationIQD.toLocaleString()} د.ع` : `$${totalWarehouseValuationUSD.toLocaleString()}`}
              </div>
              <div className="text-[11px] text-slate-300 space-y-1 pt-1.5 border-t border-white/10 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ماوەی فیزیکی لە کۆگا:</span>
                  <span className="font-bold text-white">{totalWarehouseUnits} دانە / کارتۆن</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>نرخی خەمڵێنراوی تاک:</span>
                  <span className="text-cyan-300 font-bold">
                    {totalWarehouseUnits > 0 ? `${Math.round(totalWarehouseValuationIQD / totalWarehouseUnits).toLocaleString()} د.ع` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Equation Pill */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center flex-wrap gap-2 text-slate-200">
              <span className="font-bold text-white">هاوکێشەی وردی کۆگا:</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                وەرگیراو: {totalInKindReceivedUnits} دانە ({inKindIncomeAgg.totalIQD.toLocaleString()} د.ع)
              </span>
              <span className="text-slate-400 font-bold">−</span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
                دابەشکراو: {totalInKindDistributedUnits} دانە ({inKindExpenseAgg.totalIQD.toLocaleString()} د.ع)
              </span>
              <span className="text-slate-400 font-bold">=</span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                ماوە لە کۆگا: {totalWarehouseUnits} دانە ({totalWarehouseValuationIQD.toLocaleString()} د.ع)
              </span>
            </div>

            {totalInKindReceivedUnits > 0 && (
              <div className="flex items-center gap-3 w-full md:w-52 text-[11px]">
                <div className="w-full bg-slate-700/60 rounded-full h-2.5 overflow-hidden flex">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-rose-400 h-full"
                    style={{ width: `${Math.min(100, Math.round((totalInKindDistributedUnits / totalInKindReceivedUnits) * 100))}%` }}
                    title={`دابەشکراو: ${Math.round((totalInKindDistributedUnits / totalInKindReceivedUnits) * 100)}%`}
                  />
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-cyan-300 h-full"
                    style={{ width: `${Math.min(100, Math.round((totalWarehouseUnits / totalInKindReceivedUnits) * 100))}%` }}
                    title={`ماوە لە کۆگا: ${Math.round((totalWarehouseUnits / totalInKindReceivedUnits) * 100)}%`}
                  />
                </div>
                <span className="text-[10px] font-mono text-cyan-200 font-bold whitespace-nowrap">
                  {Math.round((totalInKindDistributedUnits / totalInKindReceivedUnits) * 100)}٪ بەخشرا
                </span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Budget Planning & Forecasting Widget (Feature 6 - Dynamic Live Synchronization) */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">پلاندانانی بودجە و پێشبینی خەرجییەکان (Budget Planning & Forecast)</h3>
              <p className="text-[11px] text-slate-500">بەراوردی بودجەی تەرخانکراو بەرامبەر خەرجی ڕاستەقینە بەپێی بەش و پڕۆژەکان</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
              ساڵی ٢٠٢٦
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              ڕێژەی بەکارهێنان: {overallBudgetPercent}٪
            </span>
          </div>
        </div>

        {/* Live Forecast Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-indigo-100/80">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">کۆی بودجەی پلان بۆ داڕێژراو:</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {currencyView === 'IQD' ? `${totalPlannedBudgetIQD.toLocaleString()} د.ع` : `$${totalPlannedBudgetUSD.toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-rose-600 font-bold block">کۆی خەرجکراوی ڕاستەقینە:</span>
            <span className="text-sm font-black text-rose-700 font-mono">
              {currencyView === 'IQD' ? `${totalSpentIQD.toLocaleString()} د.ع` : `$${totalSpentUSD.toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 font-bold block">پێشبینی بودجەی ماوە:</span>
            <span className="text-sm font-black text-emerald-700 font-mono">
              {currencyView === 'IQD' ? `${remainingBudgetIQD.toLocaleString()} د.ع` : `$${remainingBudgetUSD.toLocaleString()}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-indigo-600 font-bold block">پڕۆژە بەستراوەکان:</span>
            <span className="text-sm font-black text-indigo-900 font-mono">
              {projects.length} پڕۆژەی چالاک
            </span>
          </div>
        </div>

        {/* Category Budget Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {budgetCategories.map((cat, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{cat.title}</span>
                <span className="font-mono font-bold text-slate-900">{cat.percent}٪</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${cat.color}`} style={{ width: `${cat.percent}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>خەرجکراو: {currencyView === 'IQD' ? `${cat.spentIQD.toLocaleString()} د.ع` : `$${cat.spentUSD.toLocaleString()}`}</span>
                <span>بودجە: {currencyView === 'IQD' ? `${cat.budgetIQD.toLocaleString()} د.ع` : `$${cat.budgetUSD.toLocaleString()}`}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Zero-data indicator or active projects status */}
        {projects.length === 0 && transactions.length === 0 ? (
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-center text-amber-900 text-xs flex flex-col sm:flex-row items-center justify-center gap-2">
            <span className="font-bold">سفر داتای بودجە تۆمارکراوە (سیستەم لە سفرەوە دەستپێدەکات).</span>
            <span className="text-[11px] text-amber-700">بە دروستکردنی هەر پڕۆژەیەک لە بەشی پڕۆژەکان یان تۆمارکردنی خەرجی، ژمارە و پێشبینییەکان ئۆتۆماتیکی نوێ دەبنەوە.</span>
          </div>
        ) : projects.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700">بەدواداچوونی بودجەی پڕۆژە چالاکەکان ({projects.length})</span>
              <button
                onClick={() => setActiveTab('projects')}
                className="text-indigo-600 hover:text-indigo-800 font-bold"
              >
                بەڕێوەبردنی پڕۆژەکان ←
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {projects.map(p => {
                const pPercent = p.targetBudgetUSD > 0 ? Math.min(100, Math.round((p.spentBudgetUSD / p.targetBudgetUSD) * 100)) : 0;
                return (
                  <div key={p.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">{p.title}</span>
                      <span className="font-mono font-bold text-slate-700">{pPercent}٪</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pPercent}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>خەرج: ${p.spentBudgetUSD.toLocaleString()}</span>
                      <span>بودجە: ${p.targetBudgetUSD.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هەموو ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'income' ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            داهات ({incomeTx.length})
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'expense' ? 'bg-white text-rose-800 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            خەرجی ({expenseTx.length})
          </button>
          <button
            onClick={() => setTypeFilter('in_kind')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'in_kind' ? 'bg-white text-indigo-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📦 کاڵا و عەینی ({inKindIncomeTx.length + inKindExpenseTx.length})
          </button>
          <button
            onClick={() => setTypeFilter('cash')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              typeFilter === 'cash' ? 'bg-white text-emerald-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💵 نەختینە ({cashIncomeTx.length + cashExpenseTx.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان لە خەرجی، داهات، پسوولە..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">جۆر</th>
                <th className="py-3.5 px-4">بڕی پارە</th>
                <th className="py-3.5 px-4">بەش / پۆلێن</th>
                <th className="py-3.5 px-4">ڕوونکردنەوە</th>
                <th className="py-3.5 px-4">تۆمارکار</th>
                <th className="py-3.5 px-4">ژمارەی پسوولە</th>
                <th className="py-3.5 px-4">بەروار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Wallet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">هیچ جووڵەیەکی دارایی تۆمار نەکراوە (سفر داهات و خەرجی)</p>
                    <p className="text-xs text-slate-400 mt-1">بۆ تۆمارکردنی داهات یان خەرجی، کلیک لە دوگمەی «تۆمارکردنی خەرجی / داهات» بکە لە سەرەوە</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    هیچ تۆمارێکی دارایی نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const inKind = isInKindTx(tx);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        {tx.type === 'income' ? (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                              داهات +
                            </span>
                            {inKind ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 block text-center">
                                📦 عەینی
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 block text-center">
                                💵 نەختینە
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                              خەرجی -
                            </span>
                            {inKind ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 block text-center">
                                🎁 هاوکاری
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200 block text-center">
                                💳 نەختینە
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-black text-sm block ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency === 'IQD' ? 'د.ع' : '$'}
                        </span>
                        {(() => {
                          const dayRate = tx.exchangeRateAtDate || getExchangeRateForDate(tx.date).rate;
                          const conv = tx.convertedAmount || (
                            tx.currency === 'IQD'
                              ? Number((tx.amount / dayRate).toFixed(2))
                              : Math.round(tx.amount * dayRate)
                          );
                          return (
                            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5" title={`نرخی بۆرسەی ڕۆژ: 1$ = ${dayRate.toLocaleString()} د.ع`}>
                              <span className={tx.type === 'income' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                {tx.currency === 'IQD' ? `≈ $${conv.toLocaleString()}` : `≈ ${conv.toLocaleString()} د.ع`}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded border border-slate-200">
                                {dayRate.toLocaleString()}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {tx.category}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                        <div className="font-medium leading-relaxed">{tx.description}</div>
                        {(tx.itemQuantity || tx.itemUnitPrice) && (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {tx.itemQuantity && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                                بڕ: {tx.itemQuantity} {tx.itemUnit || 'دانە'}
                              </span>
                            )}
                            {tx.itemUnitPrice && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-mono font-bold border border-indigo-200">
                                نرخی تاک: {tx.itemUnitPrice.toLocaleString()} د.ع
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {tx.recordedBy}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-cyan-800 text-[11px] font-bold">
                      {tx.receiptNumber || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {tx.date}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-cyan-600" />
              تۆمارکردنی جووڵەی دارایی نوێ
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-700 font-bold mb-1">جۆری جووڵە:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'income' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      txForm.type === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    داهات (Income)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxForm({ ...txForm, type: 'expense' })}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      txForm.type === 'expense' ? 'bg-rose-50 text-rose-800 border-rose-300' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    خەرجی (Expense)
                  </button>
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">بڕی پارە:</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={txAmountStr}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '');
                          setTxAmountStr(clean);
                        }}
                        placeholder={txForm.currency === 'IQD' ? 'نموونە: 150,000' : 'نموونە: 100'}
                        className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-base font-bold font-mono focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                        {txForm.currency === 'IQD' ? 'د.ع' : '$ USD'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">دراو:</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => handleTxCurrencySwitch('IQD')}
                        className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                          txForm.currency === 'IQD'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        دینار (IQD)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTxCurrencySwitch('USD')}
                        className={`py-2 rounded-xl font-bold border transition-all text-xs ${
                          txForm.currency === 'USD'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        دۆلار (USD $)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick suggestion pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">بڕی ئامادەکراو:</span>
                  {(txForm.currency === 'IQD'
                    ? ['25000', '50000', '100000', '250000', '500000', '1000000']
                    : ['25', '50', '100', '250', '500', '1000']
                  ).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTxAmountStr(val)}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-700 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
                    >
                      {txForm.currency === 'IQD' ? `${parseInt(val, 10).toLocaleString()} د.ع` : `$${parseInt(val, 10).toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {/* Live rate preview */}
                {txAmountStr && parseInt(txAmountStr, 10) > 0 && (() => {
                  const rate = getExchangeRateForDate(txForm.date).rate;
                  const amt = parseInt(txAmountStr, 10);
                  const convStr = txForm.currency === 'IQD'
                    ? `بەرامبەر بە نزیکەی: $${(amt / rate).toFixed(2)}`
                    : `بەرامبەر بە نزیکەی: ${Math.round(amt * rate).toLocaleString()} دینار`;
                  return (
                    <div className="text-[11px] font-medium text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center justify-between border border-emerald-200/60">
                      <span className="text-slate-600">نرخی بۆرسەی ڕۆژ (1 USD = {rate.toLocaleString()} IQD):</span>
                      <span className="font-mono font-bold text-emerald-700">{convStr}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەش / پۆلێن:</label>
                  <input
                    type="text"
                    required
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                    placeholder="نموونە: خۆراک، تەندروستی..."
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەروار:</label>
                  <input
                    type="date"
                    value={txForm.date}
                    onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پڕۆژەی پەیوەندیدار (ئارەزوومەندانە):</label>
                  <select
                    value={txForm.relatedProjectId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const selectedProj = projects.find(p => p.id === pId);
                      setTxForm({
                        ...txForm,
                        relatedProjectId: pId,
                        category: selectedProj ? selectedProj.category : txForm.category
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="">گشتی (بێ پڕۆژە)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.category})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی پسوولە (ئارەزوومەندانە):</label>
                  <input
                    type="text"
                    value={txForm.receiptNumber}
                    onChange={(e) => setTxForm({ ...txForm, receiptNumber: e.target.value })}
                    placeholder="نموونە: REC-001"
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ڕوونکردنەوەی تەواو:</label>
                <textarea
                  rows={2}
                  required
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
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
      {/* Feature 6: Online Payment Gateway Modal */}
      <OnlinePaymentModal
        isOpen={isOnlinePayOpen}
        onClose={() => setIsOnlinePayOpen(false)}
        onReceiptGenerated={(rec) => {
          const match = donations.find(d => d.receiptNumber === rec);
          if (match) setActiveReceiptDonation(match);
        }}
      />

      {/* Official Receipt Modal for online donations */}
      <OfficialReceiptModal
        donation={activeReceiptDonation}
        onClose={() => setActiveReceiptDonation(null)}
      />

    </div>
  );
};
