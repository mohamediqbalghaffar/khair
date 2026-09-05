import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Project, ProjectCategory, ProjectMilestone } from '../types';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  Users,
  UserCheck,
  MapPin,
  CheckCircle2,
  Check,
  Trash2,
  Edit3,
  Eye,
  X,
  Filter,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Receipt,
  Wallet,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { getExchangeRateForDate, aggregateAmountsByDayRate } from '../utils/exchangeRates';

const PROJECT_CATEGORIES: { id: ProjectCategory; name: string; image: string }[] = [
  {
    id: 'خۆراک',
    name: 'خۆراک و سەبەتەی خۆراکی',
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'پەروەردە و خوێندکاران',
    name: 'پەروەردە و پێداویستی خوێندکاران',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'تەندروستی و پزیشکی',
    name: 'تەندروستی و دەرمان و نەشتەرگەری',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'کەمپەینی زستانە و سووتەمەنی',
    name: 'کەمپەینی زستانە و سووتەمەنی',
    image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'جلوبەرگ و پۆشاک',
    name: 'جلوبەرگ و پۆشاکی جەژن',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'قوربانی و گۆشت',
    name: 'قوربانی و دابەشکردنی گۆشت',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'نیشتەجێبوون و نۆژەنکردنەوە',
    name: 'نیشتەجێبوون و نۆژەنکردنەوە',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'فریاگوزاری خێرا',
    name: 'فریاگوزاری خێرا و فریاکەوتن',
    image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&auto=format&fit=crop&q=80'
  }
];

const ALL_GOVERNORATES = ['هەولێر', 'سلێمانی', 'دهۆک', 'هەڵەبجە', 'کەرکووک', 'گەرمیان', 'زاخۆ', 'سۆران', 'ڕاپەڕین'];

const DEFAULT_MILESTONES: ProjectMilestone[] = [
  { id: 'm1', title: 'دەستنیشانکردنی کەمدەرامەتان و پێداویستییەکان', completed: true },
  { id: 'm2', title: 'دابینکردنی بودجە و ئامادەکردنی کاڵاکان لە کۆگا', completed: true },
  { id: 'm3', title: 'دابەشکردنی مەیدانی لە ڕێگەی تیمە خۆبەخشەکانەوە', completed: false }
];

export const ProjectsView: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject, donations, transactions, currencyView } = useApp();

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'active' | 'completed' | 'upcoming'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;
  const setSelectedProject = (p: Project | null) => setSelectedProjectId(p ? p.id : null);

  // New Project Form State
  const [budgetCurrency, setBudgetCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [budgetAmountStr, setBudgetAmountStr] = useState('');
  const [newMilestoneInput, setNewMilestoneInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'خۆراک' as ProjectCategory,
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active' as Project['status'],
    governorates: ['هەولێر'],
    image: PROJECT_CATEGORIES[0].image,
    milestones: [...DEFAULT_MILESTONES]
  });

  // Edit Project Form State
  const [editBudgetCurrency, setEditBudgetCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [editBudgetAmountStr, setEditBudgetAmountStr] = useState('');
  const [editMilestoneInput, setEditMilestoneInput] = useState('');
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'خۆراک' as ProjectCategory,
    description: '',
    startDate: '',
    endDate: '',
    status: 'active' as Project['status'],
    governorates: [] as string[],
    image: '',
    milestones: [] as ProjectMilestone[]
  });

  // Currency Switcher helper for Add Modal
  const handleAddCurrencySwitch = (newCurr: 'IQD' | 'USD') => {
    if (newCurr === budgetCurrency) return;
    const clean = budgetAmountStr.replace(/[^0-9]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    const rate = getExchangeRateForDate(formData.startDate).rate;
    if (num > 0 && rate > 0) {
      if (newCurr === 'USD') {
        setBudgetAmountStr(Number((num / rate).toFixed(2)).toString());
      } else {
        setBudgetAmountStr(Math.round(num * rate).toString());
      }
    }
    setBudgetCurrency(newCurr);
  };

  // Currency Switcher helper for Edit Modal
  const handleEditCurrencySwitch = (newCurr: 'IQD' | 'USD') => {
    if (newCurr === editBudgetCurrency) return;
    const clean = editBudgetAmountStr.replace(/[^0-9]/g, '');
    const num = clean ? parseInt(clean, 10) : 0;
    const rate = getExchangeRateForDate(editFormData.startDate).rate;
    if (num > 0 && rate > 0) {
      if (newCurr === 'USD') {
        setEditBudgetAmountStr(Number((num / rate).toFixed(2)).toString());
      } else {
        setEditBudgetAmountStr(Math.round(num * rate).toString());
      }
    }
    setEditBudgetCurrency(newCurr);
  };

  // Open Edit Modal
  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    const curr = proj.budgetCurrency || 'USD';
    setEditBudgetCurrency(curr);
    const rate = getExchangeRateForDate(proj.startDate).rate;
    const targetAmt = curr === 'USD'
      ? (proj.targetBudgetUSD || 0)
      : (proj.targetBudgetIQD || Math.round((proj.targetBudgetUSD || 0) * rate) || 0);
    setEditBudgetAmountStr(targetAmt > 0 ? targetAmt.toString() : '');
    setEditFormData({
      title: proj.title,
      category: proj.category,
      description: proj.description,
      startDate: proj.startDate,
      endDate: proj.endDate,
      status: proj.status,
      governorates: proj.governorates && proj.governorates.length > 0 ? [...proj.governorates] : ['هەولێر'],
      image: proj.image || PROJECT_CATEGORIES[0].image,
      milestones: proj.milestones ? [...proj.milestones] : [...DEFAULT_MILESTONES]
    });
    setEditMilestoneInput('');
    setIsEditModalOpen(true);
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const matchCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
    return matchQuery && matchCategory && matchStatus;
  });

  // Handle Add Project Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVal = budgetAmountStr.replace(/[^0-9]/g, '');
    const targetAmount = cleanVal ? parseInt(cleanVal, 10) : 0;
    const rate = getExchangeRateForDate(formData.startDate).rate;
    const targetUSD = budgetCurrency === 'USD' ? targetAmount : Number((targetAmount / rate).toFixed(2));
    const targetIQD = budgetCurrency === 'IQD' ? targetAmount : Math.round(targetAmount * rate);

    addProject({
      title: formData.title,
      category: formData.category,
      description: formData.description,
      budgetCurrency,
      targetBudgetUSD: targetUSD,
      targetBudgetIQD: targetIQD,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      governorates: formData.governorates.length > 0 ? formData.governorates : ['هەولێر'],
      image: formData.image,
      milestones: formData.milestones
    });

    setIsAddModalOpen(false);
    setBudgetAmountStr('');
    setFormData({
      title: '',
      category: 'خۆراک',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      governorates: ['هەولێر'],
      image: PROJECT_CATEGORIES[0].image,
      milestones: [...DEFAULT_MILESTONES]
    });
  };

  // Handle Edit Project Submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    const cleanVal = editBudgetAmountStr.replace(/[^0-9]/g, '');
    const targetAmount = cleanVal ? parseInt(cleanVal, 10) : 0;
    const rate = getExchangeRateForDate(editFormData.startDate).rate;
    const targetUSD = editBudgetCurrency === 'USD' ? targetAmount : Number((targetAmount / rate).toFixed(2));
    const targetIQD = editBudgetCurrency === 'IQD' ? targetAmount : Math.round(targetAmount * rate);

    const updated: Project = {
      ...editingProject,
      ...editFormData,
      budgetCurrency: editBudgetCurrency,
      targetBudgetUSD: targetUSD,
      targetBudgetIQD: targetIQD
    };

    updateProject(updated);
    setIsEditModalOpen(false);
    setEditingProject(null);

    if (selectedProject?.id === editingProject.id) {
      setSelectedProject(updated);
    }
  };

  // Interactive milestone toggle
  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const currentMilestones = project.milestones || DEFAULT_MILESTONES;
    const updatedMilestones = currentMilestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
    const updated = { ...project, milestones: updatedMilestones };
    updateProject(updated);
    if (selectedProject?.id === projectId) {
      setSelectedProject(updated);
    }
  };

  // Toggle governorate in Add Form
  const toggleAddGov = (gov: string) => {
    setFormData(prev => ({
      ...prev,
      governorates: prev.governorates.includes(gov)
        ? prev.governorates.filter(g => g !== gov)
        : [...prev.governorates, gov]
    }));
  };

  // Toggle governorate in Edit Form
  const toggleEditGov = (gov: string) => {
    setEditFormData(prev => ({
      ...prev,
      governorates: prev.governorates.includes(gov)
        ? prev.governorates.filter(g => g !== gov)
        : [...prev.governorates, gov]
    }));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-purple-600" />
            پڕۆژەکان و کەمپەینە خێرخوازییەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بەدواداچوونی بودجە، کاتژمێری جێبەجێکردن، بەخشینە پەیوەندیدارەکان و قۆناغەکانی کەمپەین
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          <Plus className="w-4 h-4" />
          دەستپێکردنی پڕۆژەی نوێ
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان بەدوای پڕۆژە، ناونیشان، جۆر یان ئامانج..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 outline-none hover:border-purple-300"
          >
            <option value="all">هەموو بەشەکان ({projects.length})</option>
            {PROJECT_CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter Buttons */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold shrink-0">
            <button
              onClick={() => setSelectedStatusFilter('all')}
              className={`px-3 py-1 rounded-xl transition-all ${
                selectedStatusFilter === 'all'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هەموو
            </button>
            <button
              onClick={() => setSelectedStatusFilter('active')}
              className={`px-3 py-1 rounded-xl transition-all ${
                selectedStatusFilter === 'active'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              چالاک
            </button>
            <button
              onClick={() => setSelectedStatusFilter('completed')}
              className={`px-3 py-1 rounded-xl transition-all ${
                selectedStatusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تەواوکراو
            </button>
            <button
              onClick={() => setSelectedStatusFilter('upcoming')}
              className={`px-3 py-1 rounded-xl transition-all ${
                selectedStatusFilter === 'upcoming'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              داهاتوو
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">هیچ پڕۆژەیەک نەدۆزرایەوە</p>
          <p className="text-xs text-slate-400 mt-1">
            پڕۆژەیەک دروستبکە یان فلتەری گەڕان بگۆڕە
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(proj => {
            const projRate = getExchangeRateForDate(proj.startDate).rate;
            const targetUSD = proj.targetBudgetUSD || (proj.targetBudgetIQD ? Number((proj.targetBudgetIQD / projRate).toFixed(2)) : 0);
            const targetIQD = proj.targetBudgetIQD || Math.round(targetUSD * projRate);

            const linkedDonations = donations.filter(d => d.projectId === proj.id);
            const directIncomeTx = transactions.filter(
              t => t.relatedProjectId === proj.id && t.type === 'income' && (!t.receiptNumber || !linkedDonations.some(d => d.receiptNumber === t.receiptNumber))
            );
            const linkedExpenses = transactions.filter(t => t.relatedProjectId === proj.id && t.type === 'expense');

            const donAgg = aggregateAmountsByDayRate(linkedDonations);
            const txIncomeAgg = aggregateAmountsByDayRate(directIncomeTx);
            const expAgg = aggregateAmountsByDayRate(linkedExpenses);

            const raisedUSD = Number((donAgg.totalUSD + txIncomeAgg.totalUSD).toFixed(2));
            const raisedIQD = donAgg.totalIQD + txIncomeAgg.totalIQD;

            const spentUSD = expAgg.totalUSD;
            const spentIQD = expAgg.totalIQD;

            const raisedPercent = targetUSD > 0 ? Math.min(100, Math.round((raisedUSD / targetUSD) * 100)) : 0;
            const spentPercent = targetUSD > 0 ? Math.min(100, Math.round((spentUSD / targetUSD) * 100)) : 0;

            const projectMilestones = proj.milestones && proj.milestones.length > 0 ? proj.milestones : DEFAULT_MILESTONES;
            const completedMilestones = projectMilestones.filter(m => m.completed).length;

            return (
              <div
                key={proj.id}
                className="rounded-3xl bg-white/95 backdrop-blur-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between group hover:border-purple-300 shadow-sm hover:shadow-lg transition-all"
              >
                {/* Image & Top Badges Header */}
                <div className="relative h-44 w-full overflow-hidden">
                  <img
                    src={proj.image || PROJECT_CATEGORIES[0].image}
                    alt={proj.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                  {/* Top Bar on Image */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-sm">
                      {proj.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === 'completed'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : proj.status === 'upcoming'
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-purple-600 text-white animate-pulse shadow-sm'
                      }`}>
                        {proj.status === 'completed' ? 'تەواوکراو' : proj.status === 'upcoming' ? 'لە داهاتوودا' : 'بەردەوامە'}
                      </span>

                      {/* Quick Action Buttons */}
                      <button
                        onClick={() => openEditModal(proj)}
                        className="p-1.5 rounded-full bg-black/40 hover:bg-purple-600 text-white transition-colors"
                        title="دەستکاریکردنی پڕۆژە"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`دڵنیایت لە سڕینەوەی پڕۆژەی [${proj.title}]؟`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 rounded-full bg-black/40 hover:bg-rose-600 text-white transition-colors"
                        title="سڕینەوەی پڕۆژە"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title on Image */}
                  <div className="absolute bottom-3 right-3 left-3">
                    <h3 className="text-base font-bold text-white leading-snug drop-shadow-md">
                      {proj.title}
                    </h3>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {proj.description}
                    </p>

                    {/* Dynamic Budget Display based on currencyView */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs">
                      {/* Target & Raised */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500 text-[11px]">بودجەی کۆکراوە:</span>
                          <div className="text-left font-mono">
                            {currencyView === 'IQD' ? (
                              <span className="font-bold text-emerald-700">
                                {raisedIQD.toLocaleString()} د.ع / {targetIQD.toLocaleString()} د.ع ({raisedPercent}٪)
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-700">
                                ${raisedUSD.toLocaleString()} / ${targetUSD.toLocaleString()} ({raisedPercent}٪)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-700"
                            style={{ width: `${raisedPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Spent Field */}
                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-500 text-[11px]">خەرجکراو لە مەیداندا:</span>
                          <span className="font-bold text-cyan-800 font-mono">
                            {currencyView === 'IQD' ? `${spentIQD.toLocaleString()} د.ع` : `$${spentUSD.toLocaleString()}`} ({spentPercent}٪)
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                            style={{ width: `${spentPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80">
                        <Users className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span className="font-bold truncate">{proj.beneficiariesCount || 0} سوودمەند</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80">
                        <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold truncate">{proj.volunteersCount || 0} خۆبەخش</span>
                      </div>
                    </div>

                    {/* Governorates */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {proj.governorates.slice(0, 3).map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-md bg-purple-50 text-[10px] text-purple-700 font-bold border border-purple-200/60">
                          {g}
                        </span>
                      ))}
                      {proj.governorates.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-600 font-bold">
                          +{proj.governorates.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Interactive Milestones Tracker */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          قۆناغەکانی جێبەجێکردن:
                        </span>
                        <span className="text-[10px] text-purple-800 font-mono bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {completedMilestones} / {projectMilestones.length}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {projectMilestones.slice(0, 3).map(m => (
                          <div
                            key={m.id}
                            onClick={() => toggleProjectMilestone(proj.id, m.id)}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer ${
                              m.completed
                                ? 'bg-purple-50/70 border-purple-200 text-purple-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                              m.completed ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                            }`}>
                              {m.completed && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="flex-1 truncate">{m.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedProject(proj)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      بینینی وردەکاری و بەخشینەکان
                    </button>
                    <button
                      onClick={() => openEditModal(proj)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-purple-600 transition-colors"
                      title="دەستکاری"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          MODAL 1: ADD NEW PROJECT
          ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-600" />
              دەستپێکردنی پڕۆژەی خێرخوازیی نوێ
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Project Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناونیشانی پڕۆژە / کەمپەین:</label>
                <input
                  type="text"
                  required
                  placeholder="نموونە: دابەشکردنی سەبەتەی خۆراک بۆ مانگی رەمەزان"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-medium"
                />
              </div>

              {/* Category & Cover Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەش و جۆری پڕۆژە:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value as ProjectCategory;
                      const matched = PROJECT_CATEGORIES.find(c => c.id === cat);
                      setFormData({
                        ...formData,
                        category: cat,
                        image: matched ? matched.image : formData.image
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-medium"
                  >
                    {PROJECT_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دۆخی سەرەتایی:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-medium"
                  >
                    <option value="active">چالاک و بەردەوام (Active)</option>
                    <option value="upcoming">لە داهاتوودا دەستپێدەکات (Upcoming)</option>
                    <option value="completed">تەواوکراو (Completed)</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Budget Section with Currency Switch and Manual Typing */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-purple-950 font-black flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    بودجەی پێویست بۆ ئەم کەمپەینە:
                  </label>
                  {/* Currency Selection Pill */}
                  <div className="flex items-center p-1 rounded-xl bg-white border border-purple-200 text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleAddCurrencySwitch('IQD')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        budgetCurrency === 'IQD'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      دیناری عێراقی (IQD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCurrencySwitch('USD')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        budgetCurrency === 'USD'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      دۆلاری ئەمریکی ($ USD)
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={budgetAmountStr}
                    onChange={(e) => {
                      // Allow free manual typing, backspacing and clearing
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setBudgetAmountStr(clean);
                    }}
                    placeholder={budgetCurrency === 'IQD' ? 'نموونە: 15,000,000 دینار' : 'نموونە: 10,000 دۆلار'}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 font-mono text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                    {budgetCurrency === 'IQD' ? 'د.ع' : '$ دۆلار'}
                  </div>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">بڕی خێرا:</span>
                  {(budgetCurrency === 'IQD'
                    ? ['1000000', '5000000', '10000000', '25000000', '50000000']
                    : ['1000', '3000', '5000', '10000', '25000']
                  ).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudgetAmountStr(val)}
                      className="px-2 py-0.5 rounded-lg bg-white border border-purple-200/80 text-[11px] font-mono text-purple-800 hover:bg-purple-100 transition-colors"
                    >
                      {budgetCurrency === 'IQD' ? `${parseInt(val, 10).toLocaleString()} د.ع` : `$${parseInt(val, 10).toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {/* Real-time Currency Conversion Display */}
                {budgetAmountStr && parseInt(budgetAmountStr, 10) > 0 && (() => {
                  const rate = getExchangeRateForDate(formData.startDate).rate;
                  const amt = parseInt(budgetAmountStr, 10);
                  const convStr = budgetCurrency === 'IQD'
                    ? `بەرامبەر بە نزیکەی: $${(amt / rate).toFixed(2)}`
                    : `بەرامبەر بە نزیکەی: ${Math.round(amt * rate).toLocaleString()} دینار`;
                  return (
                    <div className="text-[11px] font-medium text-purple-900 bg-purple-100/70 px-3 py-1.5 rounded-lg flex items-center justify-between">
                      <span>نرخی بۆرسەی ڕۆژ (1 USD = {rate.toLocaleString()} IQD):</span>
                      <span className="font-mono font-bold">{convStr}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">پوختەی کەمپەین و ئامانجەکان:</label>
                <textarea
                  rows={2}
                  required
                  placeholder="ڕوونکردنەوە لەسەر ئەم پڕۆژەیە و چۆنیەتی ئەنجامدانی بنووسە..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-medium"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەرواری دەستپێکردن:</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەرواری پێشبینیکراوی کۆتایی:</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Governorates Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">شار و دەڤەرەکانی جێبەجێکردن:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ALL_GOVERNORATES.map(gov => {
                    const isSelected = formData.governorates.includes(gov);
                    return (
                      <button
                        key={gov}
                        type="button"
                        onClick={() => toggleAddGov(gov)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {gov}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Milestones Management */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">قۆناغەکانی پڕۆژە (Milestones):</label>
                <div className="space-y-1.5 mb-2">
                  {formData.milestones.map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-xs text-slate-700 font-medium">{idx + 1}. {m.title}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, milestones: prev.milestones.filter(item => item.id !== m.id) }))}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add Custom Milestone */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMilestoneInput}
                    onChange={(e) => setNewMilestoneInput(e.target.value)}
                    placeholder="زیادکردنی قۆناغێکی نوێ..."
                    className="flex-1 px-3 py-1.5 rounded-xl liquid-input text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newMilestoneInput.trim()) return;
                      setFormData(prev => ({
                        ...prev,
                        milestones: [...prev.milestones, { id: `m-${Date.now()}`, title: newMilestoneInput.trim(), completed: false }]
                      }));
                      setNewMilestoneInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shrink-0"
                  >
                    زیادکردن
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  تۆمارکردن و دەستپێکردنی پڕۆژە
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EDIT PROJECT
          ======================================================== */}
      {isEditModalOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingProject(null);
              }}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-purple-600" />
              دەستکاریکردنی پڕۆژەی [{editingProject.title}]
            </h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناونیشانی پڕۆژە / کەمپەین:</label>
                <input
                  type="text"
                  required
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-medium"
                />
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەش و جۆری پڕۆژە:</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value as ProjectCategory })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-medium"
                  >
                    {PROJECT_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دۆخی پڕۆژە:</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white font-medium"
                  >
                    <option value="active">چالاک و بەردەوام (Active)</option>
                    <option value="completed">تەواوکراو (Completed)</option>
                    <option value="upcoming">لە داهاتوودا (Upcoming)</option>
                  </select>
                </div>
              </div>

              {/* Enhanced Budget Section with Currency Switch and Manual Typing */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-purple-950 font-black flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-purple-600" />
                    بودجەی پڕۆژە:
                  </label>
                  {/* Currency Selection Pill */}
                  <div className="flex items-center p-1 rounded-xl bg-white border border-purple-200 text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleEditCurrencySwitch('IQD')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        editBudgetCurrency === 'IQD'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      دیناری عێراقی (IQD)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCurrencySwitch('USD')}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        editBudgetCurrency === 'USD'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      دۆلاری ئەمریکی ($ USD)
                    </button>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    value={editBudgetAmountStr}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setEditBudgetAmountStr(clean);
                    }}
                    placeholder={editBudgetCurrency === 'IQD' ? 'نموونە: 15,000,000 دینار' : 'نموونە: 10,000 دۆلار'}
                    className="w-full px-4 py-2.5 rounded-xl border border-purple-200 bg-white text-slate-900 font-mono text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">
                    {editBudgetCurrency === 'IQD' ? 'د.ع' : '$ دۆلار'}
                  </div>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-500 font-bold">بڕی خێرا:</span>
                  {(editBudgetCurrency === 'IQD'
                    ? ['1000000', '5000000', '10000000', '25000000', '50000000']
                    : ['1000', '3000', '5000', '10000', '25000']
                  ).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditBudgetAmountStr(val)}
                      className="px-2 py-0.5 rounded-lg bg-white border border-purple-200/80 text-[11px] font-mono text-purple-800 hover:bg-purple-100 transition-colors"
                    >
                      {editBudgetCurrency === 'IQD' ? `${parseInt(val, 10).toLocaleString()} د.ع` : `$${parseInt(val, 10).toLocaleString()}`}
                    </button>
                  ))}
                </div>

                {/* Real-time Currency Conversion Display */}
                {editBudgetAmountStr && parseInt(editBudgetAmountStr, 10) > 0 && (() => {
                  const rate = getExchangeRateForDate(editFormData.startDate).rate;
                  const amt = parseInt(editBudgetAmountStr, 10);
                  const convStr = editBudgetCurrency === 'IQD'
                    ? `بەرامبەر بە نزیکەی: $${(amt / rate).toFixed(2)}`
                    : `بەرامبەر بە نزیکەی: ${Math.round(amt * rate).toLocaleString()} دینار`;
                  return (
                    <div className="text-[11px] font-medium text-purple-900 bg-purple-100/70 px-3 py-1.5 rounded-lg flex items-center justify-between">
                      <span>نرخی بۆرسەی ڕۆژ (1 USD = {rate.toLocaleString()} IQD):</span>
                      <span className="font-mono font-bold">{convStr}</span>
                    </div>
                  );
                })()}
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">پوختەی کەمپەین و ئامانجەکان:</label>
                <textarea
                  rows={3}
                  required
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-medium"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەرواری دەستپێکردن:</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەرواری پێشبینیکراوی کۆتایی:</label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Governorates */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">شار و دەڤەرەکانی جێبەجێکردن:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ALL_GOVERNORATES.map(gov => {
                    const isSelected = editFormData.governorates.includes(gov);
                    return (
                      <button
                        key={gov}
                        type="button"
                        onClick={() => toggleEditGov(gov)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600 text-white shadow-2xs'
                            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {gov}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Milestones Management */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">قۆناغەکانی پڕۆژە (Milestones):</label>
                <div className="space-y-1.5 mb-2">
                  {editFormData.milestones.map((m, idx) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={(e) => {
                            const updated = editFormData.milestones.map(item => item.id === m.id ? { ...item, completed: e.target.checked } : item);
                            setEditFormData({ ...editFormData, milestones: updated });
                          }}
                          className="w-4 h-4 rounded text-purple-600"
                        />
                        <span className={`text-xs ${m.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                          {idx + 1}. {m.title}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, milestones: prev.milestones.filter(item => item.id !== m.id) }))}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editMilestoneInput}
                    onChange={(e) => setEditMilestoneInput(e.target.value)}
                    placeholder="زیادکردنی قۆناغێکی نوێ..."
                    className="flex-1 px-3 py-1.5 rounded-xl liquid-input text-slate-900 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!editMilestoneInput.trim()) return;
                      setEditFormData(prev => ({
                        ...prev,
                        milestones: [...prev.milestones, { id: `m-${Date.now()}`, title: editMilestoneInput.trim(), completed: false }]
                      }));
                      setEditMilestoneInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shrink-0"
                  >
                    زیادکردن
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  پاشەکەوتکردنی گۆڕانکارییەکان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: PROJECT DETAILS & DOSSIER
          ======================================================== */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            {/* Header with image */}
            <div className="relative h-48 sm:h-56 w-full shrink-0">
              <img
                src={selectedProject.image || PROJECT_CATEGORIES[0].image}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-800 shadow-sm">
                  {selectedProject.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                  selectedProject.status === 'completed'
                    ? 'bg-emerald-600'
                    : selectedProject.status === 'upcoming'
                    ? 'bg-amber-600'
                    : 'bg-purple-600'
                }`}>
                  {selectedProject.status === 'completed' ? 'تەواوکراو' : selectedProject.status === 'upcoming' ? 'لە داهاتوودا' : 'بەردەوامە'}
                </span>
              </div>

              <div className="absolute bottom-4 right-5 left-5">
                <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                  {selectedProject.title}
                </h2>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Description */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 leading-relaxed text-slate-700">
                <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  دەربارەی ئەم پڕۆژەیە:
                </h4>
                <p>{selectedProject.description}</p>
              </div>

              {/* Financial & Budget Breakdown */}
              {(() => {
                const projRate = getExchangeRateForDate(selectedProject.startDate).rate;
                const tUSD = selectedProject.targetBudgetUSD || (selectedProject.targetBudgetIQD ? Number((selectedProject.targetBudgetIQD / projRate).toFixed(2)) : 0);
                const tIQD = selectedProject.targetBudgetIQD || Math.round(tUSD * projRate);

                const linkedDonations = donations.filter(d => d.projectId === selectedProject.id);
                const directIncomeTx = transactions.filter(
                  t => t.relatedProjectId === selectedProject.id && t.type === 'income' && (!t.receiptNumber || !linkedDonations.some(d => d.receiptNumber === t.receiptNumber))
                );
                const linkedExpenses = transactions.filter(t => t.relatedProjectId === selectedProject.id && t.type === 'expense');

                const donAgg = aggregateAmountsByDayRate(linkedDonations);
                const txIncomeAgg = aggregateAmountsByDayRate(directIncomeTx);
                const expAgg = aggregateAmountsByDayRate(linkedExpenses);

                const rUSD = Number((donAgg.totalUSD + txIncomeAgg.totalUSD).toFixed(2));
                const rIQD = donAgg.totalIQD + txIncomeAgg.totalIQD;

                const sUSD = expAgg.totalUSD;
                const sIQD = expAgg.totalIQD;

                const percent = tUSD > 0 ? Math.min(100, Math.round((rUSD / tUSD) * 100)) : 0;

                return (
                  <div className="space-y-3 p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80">
                    <h4 className="font-bold text-purple-950 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Wallet className="w-4 h-4 text-purple-600" />
                        دۆخی بودجە و دارایی پڕۆژە
                      </span>
                      <span className="text-[11px] font-mono text-purple-700">ڕێژەی کۆکراوە: {percent}٪</span>
                    </h4>

                    {/* 3 Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                        <span className="text-slate-500 text-[11px] block">بودجەی دیاریکراو:</span>
                        <span className="font-black text-sm text-purple-900 font-mono block mt-0.5">
                          {currencyView === 'IQD' ? `${tIQD.toLocaleString()} د.ع` : `$${tUSD.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currencyView === 'IQD' ? `$${tUSD.toLocaleString()}` : `${tIQD.toLocaleString()} د.ع`}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                        <span className="text-slate-500 text-[11px] block">کۆی بەخشینی کۆکراوە:</span>
                        <span className="font-black text-sm text-emerald-600 font-mono block mt-0.5">
                          {currencyView === 'IQD' ? `${rIQD.toLocaleString()} د.ع` : `$${rUSD.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currencyView === 'IQD' ? `$${rUSD.toLocaleString()}` : `${rIQD.toLocaleString()} د.ع`}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-purple-100 shadow-2xs">
                        <span className="text-slate-500 text-[11px] block">خەرجکراو لە مەیداندا:</span>
                        <span className="font-black text-sm text-cyan-700 font-mono block mt-0.5">
                          {currencyView === 'IQD' ? `${sIQD.toLocaleString()} د.ع` : `$${sUSD.toLocaleString()}`}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {currencyView === 'IQD' ? `$${sUSD.toLocaleString()}` : `${sIQD.toLocaleString()} د.ع`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Milestones Checklist in Modal */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  قۆناغە بەڕێوەچووەکان (دەتوانیت لێرەوە کلیك بکەیت بۆ گۆڕینی دۆخ):
                </h4>
                <div className="space-y-1.5">
                  {(selectedProject.milestones && selectedProject.milestones.length > 0 ? selectedProject.milestones : DEFAULT_MILESTONES).map(m => (
                    <div
                      key={m.id}
                      onClick={() => toggleProjectMilestone(selectedProject.id, m.id)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        m.completed
                          ? 'bg-purple-50 border-purple-200 text-purple-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        m.completed ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {m.completed && <Check className="w-3 h-3" />}
                      </div>
                      <span className="flex-1">{m.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {m.completed ? 'تەواوکراوە' : 'لە چاوەڕوانیدایە'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Related Donations Received */}
              {(() => {
                const projectDonations = donations.filter(d => d.projectId === selectedProject.id);
                return (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        پسوولە و بەخشینە تۆمارکراوەکان بۆ ئەم کەمپەینە:
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({projectDonations.length}) پسوولە
                      </span>
                    </h4>

                    {projectDonations.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400">
                        تا ئێستا هیچ پسوولەیەکی فەرمی بەناوی ئەم کەمپەینەوە تۆمار نەکراوە
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        {projectDonations.map(don => (
                          <div key={don.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{don.donorName}</span>
                                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                  {don.receiptNumber}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{don.date} • {don.method}</span>
                            </div>
                            <span className="font-bold text-emerald-700 font-mono text-sm">
                              {don.amount.toLocaleString()} {don.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Related Field Expenses */}
              {(() => {
                const projectExpenses = transactions.filter(t => t.relatedProjectId === selectedProject.id);
                return (
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-rose-600" />
                        خەرجییە تۆمارکراوەکانی پڕۆژە لە دارایی:
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        ({projectExpenses.length}) خەرجی
                      </span>
                    </h4>

                    {projectExpenses.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400">
                        هیچ خەرجییەکی دارایی بۆ ئەم کەمپەینە لە بەشی ژمێریاری تۆمار نەکراوە
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                        {projectExpenses.map(tx => (
                          <div key={tx.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                            <div>
                              <span className="font-bold text-slate-900 block">{tx.description}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{tx.date} • {tx.recordedBy}</span>
                            </div>
                            <span className="font-bold text-rose-600 font-mono">
                              -{tx.amount.toLocaleString()} {tx.currency}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = selectedProject;
                    setSelectedProject(null);
                    openEditModal(toEdit);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  دەستکاریکردنی پڕۆژە
                </button>
                <button
                  onClick={() => {
                    if (confirm(`دڵنیایت لە سڕینەوەی پڕۆژەی [${selectedProject.title}]؟`)) {
                      deleteProject(selectedProject.id);
                      setSelectedProject(null);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  سڕینەوە
                </button>
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
              >
                داخستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
