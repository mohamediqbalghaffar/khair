import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Project } from '../types';
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
  X
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { projects, addProject, updateProject, deleteProject } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Project Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'خۆراک' as Project['category'],
    description: '',
    targetBudgetUSD: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'active' as Project['status'],
    governorates: ['هەولێر'],
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80'
  });

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(formData);
    setIsAddModalOpen(false);
    setFormData({
      title: '',
      category: 'خۆراک',
      description: '',
      targetBudgetUSD: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active',
      governorates: ['هەولێر'],
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=80'
    });
  };

  const toggleProjectMilestone = (projectId: string, milestoneId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const defaultMilestones = [
      { id: 'm1', title: 'دەستنیشانکردنی خێزانە کەمدەرامەتەکان', completed: true },
      { id: 'm2', title: 'دابینکردنی بودجە و کاڵاکانی کۆگا', completed: true },
      { id: 'm3', title: 'دابەشکردنی مەیدانی لە ڕێگەی خۆبەخشان', completed: project.status === 'completed' }
    ];
    const currentMilestones = project.milestones || defaultMilestones;
    const updatedMilestones = currentMilestones.map(m => m.id === milestoneId ? { ...m, completed: !m.completed } : m);
    updateProject({ ...project, milestones: updatedMilestones });
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-purple-600" />
            پڕۆژەکان و کەمپەینە خێرخوازییەکان
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            بەدواداچوونی بودجە، کاتژمێری جێبەجێکردن و پێشکەوتنی کەمپەینە مەیدانییەکان
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" />
          دەستپێکردنی کەمپەینی نوێ
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بەدوای پڕۆژە، کەمپەینی زستانە، تەندروستی..."
          className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
        />
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
          <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">هیچ پڕۆژەیەک تۆمار نەکراوە (سفر پڕۆژە)</p>
          <p className="text-xs text-slate-400 mt-1">بۆ دەستپێکردنی یەکەمین کەمپەین یان پڕۆژە، کلیک لە دوگمەی «پڕۆژەی نوێ» بکە لە سەرەوە</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProjects.map(proj => {
            const raisedPercent = proj.targetBudgetUSD > 0 ? Math.min(100, Math.round((proj.raisedBudgetUSD / proj.targetBudgetUSD) * 100)) : 0;
            const spentPercent = proj.targetBudgetUSD > 0 ? Math.min(100, Math.round((proj.spentBudgetUSD / proj.targetBudgetUSD) * 100)) : 0;

          return (
            <div
              key={proj.id}
              className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden flex flex-col justify-between group hover:border-purple-300 shadow-sm hover:shadow-md transition-all"
            >
              {/* Image & Category Header */}
              <div className="relative h-44 w-full overflow-hidden">
                <img
                  src={proj.image}
                  alt={proj.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/90 text-slate-800 shadow-sm">
                    {proj.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      proj.status === 'completed'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-purple-600 text-white animate-pulse shadow-sm'
                    }`}>
                      {proj.status === 'completed' ? 'تەواوکراو' : 'بەردەوامە'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`دڵنیایت لە سڕینەوەی پڕۆژەی [${proj.title}]؟`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="p-1 rounded-full bg-black/40 hover:bg-rose-600 text-white transition-colors"
                      title="سڕینەوەی پڕۆژە"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-3 right-4 left-4">
                  <h3 className="text-lg font-bold text-white leading-snug drop-shadow-md">
                    {proj.title}
                  </h3>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {proj.description}
                </p>

                {/* Budget Progress Meters */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  
                  {/* Raised Budget Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500">بودجەی کۆکراوە:</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        ${proj.raisedBudgetUSD.toLocaleString()} / ${proj.targetBudgetUSD.toLocaleString()} ({raisedPercent}٪)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-700"
                        style={{ width: `${raisedPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Spent Budget Bar */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-500">بڕی خەرجکراو لە مەیداندا:</span>
                      <span className="font-bold text-cyan-800 font-mono">
                        ${proj.spentBudgetUSD.toLocaleString()} ({spentPercent}٪)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                        style={{ width: `${spentPercent}%` }}
                      />
                    </div>
                  </div>

                </div>

                {/* Metadata badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80">
                    <Users className="w-3.5 h-3.5 text-cyan-600" />
                    <span className="font-bold">{proj.beneficiariesCount} سوودمەند</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold">{proj.volunteersCount} خۆبەخش</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/80 col-span-2 sm:col-span-1">
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    <span className="font-mono">{proj.endDate}</span>
                  </div>
                </div>

                {/* Governorates */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] text-slate-500 font-bold">ناوچەکان:</span>
                  {proj.governorates.map(g => (
                    <span key={g} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-700 font-bold border border-slate-200/60">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Interactive Milestones Tracker (Feature 4) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                      قۆناغەکانی جێبەجێکردن (Milestones):
                    </span>
                    <span className="text-[10px] text-purple-800 font-mono bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      {(proj.milestones || [
                        { id: 'm1', title: 'دەستنیشانکردنی خێزانە کەمدەرامەتەکان', completed: true },
                        { id: 'm2', title: 'دابینکردنی بودجە و کاڵاکانی کۆگا', completed: true },
                        { id: 'm3', title: 'دابەشکردنی مەیدانی لە ڕێگەی خۆبەخشان', completed: proj.status === 'completed' }
                      ]).filter(m => m.completed).length} / 3 تەواوکراوە
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {(proj.milestones || [
                      { id: 'm1', title: 'دەستنیشانکردنی خێزانە کەمدەرامەتەکان', completed: true },
                      { id: 'm2', title: 'دابینکردنی بودجە و کاڵاکانی کۆگا', completed: true },
                      { id: 'm3', title: 'دابەشکردنی مەیدانی لە ڕێگەی خۆبەخشان', completed: proj.status === 'completed' }
                    ]).map(m => (
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
                        <span className="flex-1">{m.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-600" />
              دەستپێکردنی پڕۆژەی نوێ
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناونیشانی پڕۆژە / کەمپەین:</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەش / جۆر:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="خۆراک">خۆراک</option>
                    <option value="تەندروستی">تەندروستی</option>
                    <option value="کەمپەینی زستانە">کەمپەینی زستانە</option>
                    <option value="نیشتەجێبوون">نیشتەجێبوون</option>
                    <option value="پەروەردە و فێرکردن">پەروەردە و فێرکردن</option>
                    <option value="فریاگوزاری خێرا">فریاگوزاری خێرا</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بودجەی پێویست ($ دۆلار):</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.targetBudgetUSD}
                    onChange={(e) => setFormData({ ...formData, targetBudgetUSD: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">پوختەی پڕۆژەکە و ئامانجەکان:</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەرواری دەستپێکردن:</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">بەرواری کۆتایی هاتن:</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                  />
                </div>
              </div>

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
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold"
                >
                  دروستکردنی پڕۆژە لە داتابەیس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
