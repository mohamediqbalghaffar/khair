import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { InventoryItem } from '../types';
import {
  PackageSearch,
  Search,
  AlertTriangle,
  Send,
  Warehouse,
  Plus,
  Trash2,
  X
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    inventory,
    beneficiaries,
    addInventoryItem,
    deleteInventoryItem,
    updateInventoryQuantity,
    distributeAidFromInventory
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForDistribution, setSelectedItemForDistribution] = useState<InventoryItem | null>(null);
  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

  // New Item Form
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    category: 'خۆراک' as InventoryItem['category'],
    quantity: 0,
    unit: 'دانە' as InventoryItem['unit'],
    location: 'هەولێر - کۆگای سەرەکی بەحرکە',
    minAlertThreshold: 10
  });

  // Distribution Form
  const [targetBeneficiaryId, setTargetBeneficiaryId] = useState('');
  const [distributeQty, setDistributeQty] = useState(1);
  const [selectedProjectTitle, setSelectedProjectTitle] = useState('دابەشکردنی خۆراکی خێزانی');

  const filteredInventory = inventory.filter(i => {
    const q = searchQuery.toLowerCase();
    return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.location.toLowerCase().includes(q);
  });

  const lowStockItems = inventory.filter(i => i.quantity <= i.minAlertThreshold);

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

  const handleDistributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForDistribution || !targetBeneficiaryId) return;

    const success = distributeAidFromInventory(
      selectedItemForDistribution.id,
      targetBeneficiaryId,
      distributeQty,
      selectedProjectTitle
    );

    if (success) {
      setIsDistributeModalOpen(false);
      setSelectedItemForDistribution(null);
    } else {
      alert('بڕی دیاریکراو زیاترە لەوەی لە کۆگادا بەردەستە!');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-amber-600" />
            کۆگا و دابەشکردنی کەلوپەل و کۆمەک
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بەدواداچوونی سەبەتەی خۆراک، جلوبەرگ، زۆپا، و دابەشکردنی ڕاستەوخۆ بۆ خێزانەکان
          </p>
        </div>

        <button
          onClick={() => setIsAddItemModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          زیادکردنی کاڵای نوێ بۆ کۆگا
        </button>
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

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بەپێی ناوی کاڵا، جۆر، یان شوێنی کۆگا..."
          className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
        />
      </div>

      {/* Inventory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInventory.map(item => {
          const isLow = item.quantity <= item.minAlertThreshold;
          return (
            <div
              key={item.id}
              className={`rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border transition-all flex flex-col justify-between shadow-sm hover:shadow-md ${
                isLow ? 'border-amber-300 hover:border-amber-400' : 'border-slate-200/90 hover:border-cyan-400'
              }`}
            >
              <div>
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

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{item.name}</h3>

                <div className="flex items-baseline gap-2 mb-3">
                  <span className={`text-3xl font-black ${isLow ? 'text-amber-600' : 'text-slate-900'}`}>
                    {item.quantity}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">{item.unit}</span>
                </div>

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
                  onClick={() => {
                    setSelectedItemForDistribution(item);
                    if (beneficiaries.length > 0 && !targetBeneficiaryId) {
                      setTargetBeneficiaryId(beneficiaries[0].id);
                    }
                    setIsDistributeModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl liquid-button-primary text-white text-xs font-bold shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  دابەشکردن بۆ خێزانێک
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Direct Distribution Modal */}
      {isDistributeModalOpen && selectedItemForDistribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl">
            <button
              onClick={() => setIsDistributeModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <PackageSearch className="w-5 h-5 text-amber-600" />
              دابەشکردنی کۆمەک لە کۆگاوە
            </h3>
            <p className="text-xs text-cyan-800 mb-4 font-bold">
              کاڵا: {selectedItemForDistribution.name} ({selectedItemForDistribution.quantity} {selectedItemForDistribution.unit} بەردەستە)
            </p>

            <form onSubmit={handleDistributeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">دیاریکردنی سوودمەند / خێزان:</label>
                <select
                  required
                  value={targetBeneficiaryId}
                  onChange={(e) => setTargetBeneficiaryId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl liquid-input text-slate-900 bg-white"
                >
                  {beneficiaries.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.fullName} ({b.governorate} - {b.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بڕی دابەشکراو ({selectedItemForDistribution.unit}):</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedItemForDistribution.quantity}
                    required
                    value={distributeQty}
                    onChange={(e) => setDistributeQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">لە چوارچێوەی کام پڕۆژە:</label>
                  <input
                    type="text"
                    value={selectedProjectTitle}
                    onChange={(e) => setSelectedProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-900 text-[11px] leading-relaxed">
                بە پەسەندکردن، ئەم کاڵایە لە کۆگا کەم دەبێتەوە و ڕاستەوخۆ دەخرێتە سەر مێژووی هاوکارییەکانی ئەم خێزانە.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDistributeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold"
                >
                  تەواوکردنی دابەشکردن
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

    </div>
  );
};
