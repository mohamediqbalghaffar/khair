import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useFeedback } from '../components/ui/FeedbackProvider';
import { PaginationBar } from '../components/ui/PaginationBar';
import { AuditLog } from '../types';
import {
  History,
  Search,
  ShieldCheck,
  Download,
  AlertCircle,
  FileCheck,
  FileSpreadsheet,
  X
} from 'lucide-react';

type SeverityFilter = 'all' | 'info' | 'warning' | 'critical';

const getLogSeverity = (log: AuditLog): 'info' | 'warning' | 'critical' => {
  if (log.type === 'delete') return 'critical';
  if (log.type === 'auth') return 'warning';
  return 'info';
};

export const AuditView: React.FC = () => {
  const { auditLogs } = useApp();
  const { showToast } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Defensive array sanitization against malformed items or nulls
  const safeLogs: AuditLog[] = useMemo(
    () =>
      Array.isArray(auditLogs)
        ? auditLogs.filter((log): log is AuditLog => Boolean(log && typeof log === 'object'))
        : [],
    [auditLogs]
  );

  const filteredLogs = useMemo(() => {
    return safeLogs.filter(log => {
      const q = (searchQuery || '').toLowerCase().trim();
      const actionStr = String(log.action || '').toLowerCase();
      const userStr = String(log.userName || '').toLowerCase();
      const detailsStr = String(log.details || '').toLowerCase();

      const matchesSearch =
        !q ||
        actionStr.includes(q) ||
        userStr.includes(q) ||
        detailsStr.includes(q);

      const matchesAction = filterAction === 'all' || log.type === filterAction;
      const severity = getLogSeverity(log);
      const matchesSeverity = severityFilter === 'all' || severity === severityFilter;

      return matchesSearch && matchesAction && matchesSeverity;
    });
  }, [safeLogs, searchQuery, filterAction, severityFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  const exportAuditJSON = () => {
    try {
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `audit_trail_${new Date().toISOString().split('T')[0]}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('فایلی JSONی تۆماری چاودێری دابەزێنرا', 'success');
    } catch (err) {
      console.error('Error exporting audit JSON:', err);
      showToast('هەڵە لە کاتی دابەزاندنی لۆگ', 'error');
    }
  };

  const exportAuditCSV = () => {
    try {
      const headers = ['بەروار و کات', 'ئەنجامدەر', 'جۆری کردار', 'ئاستی گرنگی', 'ناونیشانی کردار', 'وردەکاری'];
      const rows = filteredLogs.map(log => {
        const sev = getLogSeverity(log);
        const sevLabel = sev === 'critical' ? 'هەستیار' : sev === 'warning' ? 'ئاگاداری' : 'ئاسایی';
        return [
          log.timestamp || '',
          log.userName || 'سیستەم',
          log.type || 'general',
          sevLabel,
          log.action || '',
          log.details || ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`);
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('فایلی CSVی تۆماری چاودێری بە سەرکەوتوویی دابەزێنرا', 'success');
    } catch (err) {
      console.error('Error exporting audit CSV:', err);
      showToast('هەڵە لە کاتی هەناردەکردنی CSV', 'error');
    }
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
            تۆماری گۆڕانکارییەکان، کاتی ئەنجامدان و ناسنامەی ئەنجامدەر بەپێی ستانداردەکانی شەفافییەت
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>تۆماری پارێزراو (Immutable)</span>
          </div>

          <button
            onClick={exportAuditCSV}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            هەناردەی CSV
          </button>

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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Type Filter */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm overflow-x-auto">
            <button
              onClick={() => {
                setFilterAction('all');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterAction === 'all'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هەموو کردارەکان ({safeLogs.length})
            </button>
            <button
              onClick={() => {
                setFilterAction('create');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterAction === 'create'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تۆمارکردنی نوێ
            </button>
            <button
              onClick={() => {
                setFilterAction('update');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterAction === 'update'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              دەستکاری و نوێکردنەوە
            </button>
            <button
              onClick={() => {
                setFilterAction('delete');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterAction === 'delete'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سڕینەوە
            </button>
            <button
              onClick={() => {
                setFilterAction('auth');
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filterAction === 'auth'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ئاسایش و سیستەم
            </button>
          </div>

          {/* Severity Filter Pills */}
          <div className="flex items-center p-1 rounded-2xl bg-white border border-slate-200 shadow-sm gap-1">
            {(
              [
                { id: 'all', label: 'هەموو ئاستەکان' },
                { id: 'info', label: 'ئاسایی (Info)' },
                { id: 'warning', label: 'ئاگاداری (Warning)' },
                { id: 'critical', label: 'هەستیار (Critical)' }
              ] as { id: SeverityFilter; label: string }[]
            ).map(pill => (
              <button
                key={pill.id}
                onClick={() => {
                  setSeverityFilter(pill.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  severityFilter === pill.id
                    ? pill.id === 'critical'
                      ? 'bg-rose-600 text-white'
                      : pill.id === 'warning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-cyan-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="گەڕان لە لۆگ بەپێی کردار، کەس..."
            className="w-full ps-10 pe-9 py-2 text-xs rounded-2xl liquid-input text-slate-900 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              aria-label="سڕینەوەی دەق"
              className="absolute end-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Table & Mobile Stack Card */}
      <div className="rounded-3xl bg-white/90 backdrop-blur-2xl border border-slate-200/90 overflow-hidden shadow-sm">
        {/* Mobile Card Stack (< lg) */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {paginatedLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              هیچ تۆمارێک نەدۆزرایەوە
            </div>
          ) : (
            paginatedLogs.map((log, idx) => (
              <div key={log.id || `audit-card-${idx}`} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-cyan-800 font-bold">
                    {log.timestamp || '—'}
                  </span>
                  <div>
                    {log.type === 'create' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> تۆمارکردن +
                      </span>
                    )}
                    {log.type === 'update' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1">
                        نوێکردنەوە ✎
                      </span>
                    )}
                    {log.type === 'delete' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        سڕینەوە ✕
                      </span>
                    )}
                    {log.type === 'auth' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> ئاسایش و سیستەم
                      </span>
                    )}
                    {log.type === 'export' && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        هەناردەکردن ⤓
                      </span>
                    )}
                    {!['create', 'update', 'delete', 'auth', 'export'].includes(log.type) && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        {log.type || 'گشتی'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900">{log.action || '—'}</span>
                  <span className="text-xs text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                    {log.userName || 'سیستەم'}
                  </span>
                </div>

                {log.details && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed break-words">
                    {log.details}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (>= lg) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-end text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">بەروار و کات</th>
                <th className="py-3.5 px-4">ئەنجامدەر</th>
                <th className="py-3.5 px-4">جۆری کردار</th>
                <th className="py-3.5 px-4">ناونیشانی کردار</th>
                <th className="py-3.5 px-4">وردەکاری</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    هیچ تۆمارێک نەدۆزرایەوە
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => (
                  <tr key={log.id || `audit-row-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-cyan-800 font-bold">
                      {log.timestamp || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.userName || 'سیستەم'}
                    </td>
                    <td className="py-3 px-4">
                      {log.type === 'create' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                          <FileCheck className="w-3 h-3" /> تۆمارکردن +
                        </span>
                      )}
                      {log.type === 'update' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 flex items-center gap-1 w-fit">
                          نوێکردنەوە ✎
                        </span>
                      )}
                      {log.type === 'delete' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-fit">
                          سڕینەوە ✕
                        </span>
                      )}
                      {log.type === 'auth' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" /> ئاسایش و سیستەم
                        </span>
                      )}
                      {log.type === 'export' && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 w-fit">
                          هەناردەکردن ⤓
                        </span>
                      )}
                      {!['create', 'update', 'delete', 'auth', 'export'].includes(log.type) && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 w-fit">
                          {log.type || 'گشتی'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.action || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalItems={filteredLogs.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
