import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  FileSpreadsheet,
  X
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const {
    transactions,
    addTransaction,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Transaction Form State
  const [txForm, setTxForm] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: 1500000,
    currency: 'IQD' as 'IQD' | 'USD',
    category: 'کڕینی خۆراک و سەبەتە',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recordedBy: 'ژمێریاری ڕێکخراو',
    relatedProjectId: '',
    receiptNumber: `EXP-${new Date().getFullYear()}-0${Math.floor(Math.random() * 90 + 10)}`
  });

  // Financial aggregates
  const incomeIQD = transactions.filter(t => t.type === 'income' && t.currency === 'IQD').reduce((s, t) => s + t.amount, 0);
  const expenseIQD = transactions.filter(t => t.type === 'expense' && t.currency === 'IQD').reduce((s, t) => s + t.amount, 0);
  const balanceIQD = incomeIQD - expenseIQD;

  const incomeUSD = transactions.filter(t => t.type === 'income' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const expenseUSD = transactions.filter(t => t.type === 'expense' && t.currency === 'USD').reduce((s, t) => s + t.amount, 0);
  const balanceUSD = incomeUSD - expenseUSD;

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.receiptNumber && t.receiptNumber.toLowerCase().includes(q));
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction(txForm);
    setIsAddModalOpen(false);
    setTxForm({
      type: 'expense',
      amount: 1500000,
      currency: 'IQD',
      category: 'کڕینی خۆراک و سەبەتە',
      date: new Date().toISOString().split('T')[0],
      description: '',
      recordedBy: 'ژمێریاری ڕێکخراو',
      relatedProjectId: '',
      receiptNumber: `EXP-${new Date().getFullYear()}-0${Math.floor(Math.random() * 90 + 10)}`
    });
  };

  const exportCSV = () => {
    const headers = "ژمارە,جۆر,بڕی پارە,دراو,بەش,بەروار,ڕوونکردنەوە,پسوولە\n";
    const rows = filteredTransactions.map(t =>
      `"${t.id}","${t.type === 'income' ? 'داهات' : 'خەرجی'}","${t.amount}","${t.currency}","${t.category}","${t.date}","${t.description}","${t.receiptNumber || ''}"`
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
    <div className="space-y-6 pb-24">
      
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
        <div className="rounded-3xl bg-emerald-50/70 backdrop-blur-2xl p-5 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800">کۆی داهات (Income)</span>
            <div className="w-9 h-9 rounded-2xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {incomeIQD.toLocaleString()} <span className="text-xs font-normal">د.ع</span>
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-mono font-bold">
            + ${incomeUSD.toLocaleString()} دۆلاری ئەمریکی
          </p>
        </div>

        {/* Expense Card */}
        <div className="rounded-3xl bg-rose-50/70 backdrop-blur-2xl p-5 border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800">کۆی خەرجی (Expenditure)</span>
            <div className="w-9 h-9 rounded-2xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shadow-sm">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-900">
            {expenseIQD.toLocaleString()} <span className="text-xs font-normal">د.ع</span>
          </div>
          <p className="text-xs text-rose-700 mt-1 font-mono font-bold">
            - ${expenseUSD.toLocaleString()} دۆلاری ئەمریکی
          </p>
        </div>

        {/* Balance Card */}
        <div className="rounded-3xl bg-cyan-50/70 backdrop-blur-2xl p-5 border border-cyan-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-900">باڵانسی نەختینەیی (Balance)</span>
            <div className="w-9 h-9 rounded-2xl bg-white border border-cyan-200 text-cyan-600 flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black ${balanceIQD >= 0 ? 'text-cyan-900' : 'text-rose-700'}`}>
            {balanceIQD.toLocaleString()} <span className="text-xs font-normal">د.ع</span>
          </div>
          <p className="text-xs text-cyan-800 mt-1 font-mono font-bold">
            باڵانس: ${balanceUSD.toLocaleString()} دۆلار
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هەموو جووڵەکان
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'income' ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تەنها داهات
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              typeFilter === 'expense' ? 'bg-white text-rose-800 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تەنها خەرجی
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
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    هیچ تۆمارێکی دارایی نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      {tx.type === 'income' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          داهات +
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          خەرجی -
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-black text-sm ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.currency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {tx.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-sm truncate">
                      {tx.description}
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
                ))
              )}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بڕی پارە:</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={txForm.amount}
                    onChange={(e) => setTxForm({ ...txForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 text-base font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دراو:</label>
                  <select
                    value={txForm.currency}
                    onChange={(e) => setTxForm({ ...txForm, currency: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="IQD">دیناری عێراقی (IQD)</option>
                    <option value="USD">دۆلاری ئەمریکی (USD $)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەش / پۆلێن:</label>
                  <input
                    type="text"
                    required
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    placeholder="خۆراک، لۆجستی، مووچە..."
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">ڕوونکردنەوەی تەواو:</label>
                <textarea
                  rows={2}
                  required
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                  placeholder="هۆکاری خەرجی یان داهات، شوێنی کڕین..."
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

    </div>
  );
};
