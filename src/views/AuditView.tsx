import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  Search,
  ShieldCheck,
  Download,
  AlertCircle,
  FileCheck
} from 'lucide-react';

export const AuditView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = auditLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);
    const matchesAction = filterAction === 'all' || log.type === filterAction;
    return matchesSearch && matchesAction;
  });

  const exportAuditJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_trail_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-600" />
            مێژووی چاودێری و کردارەکانی سیستەم (Audit Trail)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تۆماری گۆڕانکارییەکان، کاتی ئەنجامدان و ناسنامەی بەکارهێنەر بەپێی ستانداردەکانی شەفافییەت
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>تۆماری پارێزراو (Immutable)</span>
          </div>

          <button
            onClick={exportAuditJSON}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            داگرتنی لۆگ (JSON)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterAction('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterAction === 'all' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            هەموو کردارەکان ({auditLogs.length})
          </button>
          <button
            onClick={() => setFilterAction('create')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterAction === 'create' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تۆمارکردنی نوێ
          </button>
          <button
            onClick={() => setFilterAction('update')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterAction === 'update' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            دەستکاری و نوێکردنەوە
          </button>
          <button
            onClick={() => setFilterAction('auth')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              filterAction === 'auth' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ئاسایش و دووبارەبوونەوە
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="گەڕان لە لۆگ بەپێی کردار، کەس..."
            className="w-full pr-10 pl-3 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">بەروار و کات</th>
                <th className="py-3.5 px-4">بەکارهێنەر</th>
                <th className="py-3.5 px-4">جۆری کردار</th>
                <th className="py-3.5 px-4">ناونیشانی کردار</th>
                <th className="py-3.5 px-4">وردەکاری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    هیچ تۆمارێک نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-cyan-800 font-bold">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.userName}
                    </td>
                    <td className="py-3 px-4">
                      {log.type === 'create' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <FileCheck className="w-3 h-3" /> تۆمارکردن +
                        </span>
                      )}
                      {log.type === 'update' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 w-fit">
                          نوێکردنەوە ✎
                        </span>
                      )}
                      {log.type === 'delete' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                          سڕینەوە ✕
                        </span>
                      )}
                      {log.type === 'auth' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" /> ئاسایش و دەسەڵات
                        </span>
                      )}
                      {log.type === 'export' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                          هەناردەکردن ⤓
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
