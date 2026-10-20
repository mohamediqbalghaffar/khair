import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../components/ui/FeedbackProvider';
import { Volunteer } from '../types';
import {
  UserCheck,
  Search,
  Plus,
  Clock,
  Award,
  QrCode,
  Printer,
  Droplet,
  Trash2,
  Edit3,
  X
} from 'lucide-react';
import { AdaptiveDrawerSheet } from '../components/ui/AdaptiveDrawerSheet';

const SKILL_PRESETS = [
  'دابەشکردنی مەیدانی',
  'فریاگوزاری سەرەتایی',
  'شۆفێری و گواستنەوە',
  'فۆتۆگرافی و میدیا',
  'ڕێکخستنی کۆگا',
  'پشتگیری دەروونی و کۆمەڵایەتی',
  'وەرگێڕان و پەیوەندییەکان',
  'تۆمارکردنی داتا و ئامار'
];

export const VolunteersView: React.FC = () => {
  const { volunteers, addVolunteer, updateVolunteer, deleteVolunteer, logVolunteerHours } = useApp();
  const { showToast, confirmAction } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVolunteerBadge, setSelectedVolunteerBadge] = useState<Volunteer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [logHoursVolunteer, setLogHoursVolunteer] = useState<Volunteer | null>(null);
  const [hoursToAdd, setHoursToAdd] = useState(4);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    governorate: 'هەولێر',
    skills: [] as string[],
    bloodType: 'O+',
    availability: 'ڕۆژانی پشوو' as Volunteer['availability'],
    status: 'active' as Volunteer['status']
  });

  const filteredVolunteers = volunteers.filter(v => {
    const q = searchQuery.toLowerCase();
    return (
      v.fullName.toLowerCase().includes(q) ||
      v.phone.includes(q) ||
      v.governorate.toLowerCase().includes(q) ||
      v.skills.some(s => s.toLowerCase().includes(q))
    );
  });

  const openAddModal = () => {
    setEditingVolunteer(null);
    setCustomSkillInput('');
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      governorate: 'هەولێر',
      skills: [],
      bloodType: 'O+',
      availability: 'ڕۆژانی پشوو',
      status: 'active'
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (vol: Volunteer) => {
    setEditingVolunteer(vol);
    setCustomSkillInput('');
    setFormData({
      fullName: vol.fullName,
      phone: vol.phone,
      email: vol.email || '',
      governorate: vol.governorate,
      skills: Array.isArray(vol.skills) ? [...vol.skills] : [],
      bloodType: vol.bloodType,
      availability: vol.availability,
      status: vol.status
    });
    setIsAddModalOpen(true);
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    if (!formData.skills.includes(trimmed)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
    }
    setCustomSkillInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVolunteer) {
      updateVolunteer({
        ...editingVolunteer,
        ...formData
      });
      showToast(`زانیارییەکانی خۆبەخش [${formData.fullName}] بە سەرکەوتوویی نوێکرایەوە`, 'success');
    } else {
      addVolunteer(formData);
      showToast(`خۆبەخشی نوێ [${formData.fullName}] بە سەرکەوتوویی تۆمارکرا`, 'success');
    }
    setIsAddModalOpen(false);
    setEditingVolunteer(null);
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      governorate: 'هەولێر',
      skills: [],
      bloodType: 'O+',
      availability: 'ڕۆژانی پشوو',
      status: 'active'
    });
  };

  const handleLogHoursSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logHoursVolunteer) return;
    logVolunteerHours(logHoursVolunteer.id, hoursToAdd);
    showToast(`${hoursToAdd} کاتژمێری خزمەت بۆ [${logHoursVolunteer.fullName}] تۆمارکرا`, 'success');
    setLogHoursVolunteer(null);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            تیمی خۆبەخشان و کارتی ناسنامەی دیجیتاڵی
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تۆمارکردنی کاتژمێری خزمەت، لێهاتووییەکان و دەرکردنی کارتی فەرمی خۆبەخش
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-button-primary text-white text-xs font-bold shadow-md"
        >
          <Plus className="w-4 h-4" />
          تۆمارکردنی خۆبەخشی نوێ
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="گەڕان بەدوای ناو، لێهاتوویی، پارێزگا..."
          className="w-full ps-10 pe-9 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            aria-label="سڕینەوەی دەق"
            className="absolute end-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg touch-manipulation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Volunteers Grid */}
      {volunteers.length === 0 ? (
        <div className="rounded-3xl bg-white/90 backdrop-blur-2xl p-16 border border-slate-200/90 text-center shadow-sm">
          <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">هیچ خۆبەخشێک تۆمار نەکراوە (سفر ئەندام)</p>
          <p className="text-xs text-slate-400 mt-1">
            بۆ تۆمارکردنی یەکەمین ئەندامی تیمی خۆبەخشان، کلیک لە دوگمەی «خۆبەخشی نوێ» بکە لە سەرەوە
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVolunteers.map(vol => (
            <div
              key={vol.id}
              className="rounded-3xl bg-white/90 backdrop-blur-2xl p-5 border border-slate-200/90 hover:border-blue-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                      {vol.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{vol.fullName}</h3>
                      <span className="text-[11px] font-mono font-bold text-cyan-700">{vol.badgeNumber}</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {vol.availability}
                  </span>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-xs text-slate-500 block">کاتژمێری خزمەت:</span>
                    <span className="font-black text-amber-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> {vol.hoursLogged} کاتژمێر
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">گرووپی خوێن:</span>
                    <span className="font-bold text-rose-700 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-600" /> {vol.bloodType}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-1 mb-3">
                  <span className="text-xs text-slate-500 block font-bold">شارەزایی و تواناکان:</span>
                  <div className="flex flex-wrap gap-1">
                    {vol.skills && vol.skills.length > 0 ? (
                      vol.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-xs text-slate-700 border border-slate-200/60 font-bold"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">دیاری نەکراوە</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <p>
                    مۆبایل: <span className="font-mono font-bold text-slate-800">{vol.phone}</span>
                  </p>
                  <p>
                    پارێزگا: <span className="text-slate-900 font-bold">{vol.governorate}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setLogHoursVolunteer(vol)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  + تۆماری کاتژمێر
                </button>

                <button
                  onClick={() => setSelectedVolunteerBadge(vol)}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200"
                  title="کارتی ناسنامەی فەرمی"
                >
                  <Award className="w-3.5 h-3.5" />
                  کارتی ناسنامە
                </button>

                <button
                  onClick={() => openEditModal(vol)}
                  className="p-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 transition-colors border border-cyan-200"
                  title="دەستکاریکردنی خۆبەخش"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: 'سڕینەوەی خۆبەخش',
                      message: `دڵنیایت لە سڕینەوەی خۆبەخش [${vol.fullName}]؟`,
                      confirmText: 'بەڵێ، بیسڕەوە',
                      variant: 'danger'
                    });
                    if (ok) {
                      deleteVolunteer(vol.id);
                      showToast(`خۆبەخش [${vol.fullName}] سڕایەوە`, 'info');
                    }
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                  title="سڕینەوەی خۆبەخش"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Volunteer ID Badge */}
      <AdaptiveDrawerSheet
        isOpen={!!selectedVolunteerBadge}
        onClose={() => setSelectedVolunteerBadge(null)}
        title="کارتی ناسنامەی فەرمی خۆبەخش"
        icon={<UserCheck className="w-5 h-5 text-blue-600" />}
        maxWidth="max-w-sm"
        footer={
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl liquid-button-primary text-white text-xs font-bold touch-manipulation active:scale-95"
          >
            <Printer className="w-4 h-4" />
            چاپکردنی ناسنامە (Print Badge)
          </button>
        }
      >
        {selectedVolunteerBadge && (
          <div className="text-center">
            {/* Printable Badge Area */}
            <div
              id="volunteer-badge"
              className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 via-white to-slate-50 border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  بـ
                </div>
                <h4 className="text-xs font-bold text-slate-900 tracking-tight">ڕێکخراوی بۆتان بامۆکی</h4>
              </div>

              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 p-[2px] shadow-sm">
                <div className="w-full h-full rounded-[14px] bg-slate-100 flex items-center justify-center text-3xl font-black text-slate-800">
                  {selectedVolunteerBadge.fullName.charAt(0)}
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">{selectedVolunteerBadge.fullName}</h3>
                <p className="text-xs text-cyan-800 font-bold mt-0.5">خۆبەخشی فەرمی مەیدانی</p>
                <span className="inline-block mt-1 font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  کۆد: {selectedVolunteerBadge.badgeNumber}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-white border border-slate-200 text-end">
                <div>
                  <span className="text-slate-500 block">گرووپی خوێن:</span>
                  <span className="font-bold text-rose-700">{selectedVolunteerBadge.bloodType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">پارێزگا:</span>
                  <span className="font-bold text-slate-900">{selectedVolunteerBadge.governorate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">مۆبایل:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedVolunteerBadge.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">خزمەت:</span>
                  <span className="font-bold text-amber-700">{selectedVolunteerBadge.hoursLogged} کاتژمێر</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <QrCode className="w-10 h-10 text-slate-600" />
                <div className="text-start text-xs text-slate-500">
                  <p className="text-emerald-700 font-bold">پشتڕاستکراوە ✓</p>
                  <p>تەنها بۆ کاری خێرخوازی</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdaptiveDrawerSheet>

      {/* Modal: Log Hours */}
      <AdaptiveDrawerSheet
        isOpen={!!logHoursVolunteer}
        onClose={() => setLogHoursVolunteer(null)}
        title="تۆمارکردنی کاتژمێری خزمەت"
        description={logHoursVolunteer ? `بۆ: ${logHoursVolunteer.fullName}` : undefined}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        maxWidth="max-w-sm"
      >
        {logHoursVolunteer && (
          <form onSubmit={handleLogHoursSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">ژمارەی کاتژمێری ئەنجامدراو:</label>
              <input
                type="number"
                min={1}
                max={24}
                required
                value={hoursToAdd}
                onChange={(e) => setHoursToAdd(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-bold text-base"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setLogHoursVolunteer(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold touch-manipulation active:scale-95"
              >
                داخستن
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl liquid-button-primary text-white font-bold touch-manipulation active:scale-95"
              >
                تۆمارکردنی کاتژمێرەکان
              </button>
            </div>
          </form>
        )}
      </AdaptiveDrawerSheet>

      {/* Modal: Add / Edit Volunteer */}
      <AdaptiveDrawerSheet
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVolunteer(null);
        }}
        title={editingVolunteer ? 'دەستکاریکردنی زانیاری خۆبەخش' : 'تۆمارکردنی خۆبەخشی نوێ'}
        icon={<UserCheck className="w-5 h-5 text-blue-600" />}
        maxWidth="max-w-lg"
      >

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">ناوی تەواوی خۆبەخش:</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">ژمارەی مۆبایل:</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">گرووپی خوێن:</label>
                  <select
                    value={formData.bloodType}
                    onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">پارێزگا:</label>
                  <select
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="هەولێر">هەولێر</option>
                    <option value="سلێمانی">سلێمانی</option>
                    <option value="دهۆک">دهۆک</option>
                    <option value="هەڵەبجە">هەڵەبجە</option>
                    <option value="کەرکووک">کەرکووک</option>
                    <option value="گەرمیان">گەرمیان</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">کاتی بەردەستبوون:</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 bg-white"
                  >
                    <option value="ڕۆژانی پشوو">ڕۆژانی پشوو</option>
                    <option value="هەموو کات">هەموو کات</option>
                    <option value="ئێواران">ئێواران</option>
                    <option value="کاتی تەنگانە">کاتی تەنگانە</option>
                  </select>
                </div>
              </div>

              {/* Skills Input & Preset Tags */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="block text-slate-800 font-black">شارەزایی و تواناکان (کلیک بکە یان زیاد بکە):</label>

                <div className="flex flex-wrap gap-1.5">
                  {SKILL_PRESETS.map(preset => {
                    const selected = formData.skills.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => toggleSkill(preset)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customSkillInput}
                    onChange={(e) => setCustomSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSkill();
                      }
                    }}
                    placeholder="شارەزاییەکی تر بنووسە و زیاد بکە..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={addCustomSkill}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold"
                  >
                    + زیادکردن
                  </button>
                </div>

                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-bold">دیاریکراو:</span>
                    {formData.skills.map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="text-blue-500 hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">ئیمەیڵ:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl liquid-input text-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingVolunteer(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold touch-manipulation active:scale-95"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl liquid-button-primary text-white font-bold touch-manipulation active:scale-95"
                >
                  {editingVolunteer ? 'پاشەکەوتکردنی گۆڕانکاری' : 'تۆمارکردن لە داتابەیس'}
                </button>
              </div>
            </form>
      </AdaptiveDrawerSheet>
    </div>
  );
};
