import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Terminal, Copy, Check, Play, Code2, Database, X, KeyRound, Globe } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DeveloperApiModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { beneficiaries, donations, projects, inventory } = useApp();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('beneficiaries');
  const [copied, setCopied] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);

  if (!isOpen) return null;

  const endpoints = [
    {
      id: 'beneficiaries',
      method: 'GET',
      path: '/api/v1/beneficiaries',
      title: 'لیستی سوودمەندان و خێزانەکان',
      curl: 'curl -X GET "https://api.bamboki-charity.org/v1/beneficiaries" -H "Authorization: Bearer sec_live_9412krd"',
      data: beneficiaries.slice(0, 3)
    },
    {
      id: 'donations',
      method: 'GET',
      path: '/api/v1/donations',
      title: 'بەدواداچوونی بەخشینە داراییەکان',
      curl: 'curl -X GET "https://api.bamboki-charity.org/v1/donations" -H "Authorization: Bearer sec_live_9412krd"',
      data: donations.slice(0, 3)
    },
    {
      id: 'projects',
      method: 'GET',
      path: '/api/v1/projects',
      title: 'کەمپەینە مەیدانییەکان و بودجە',
      curl: 'curl -X GET "https://api.bamboki-charity.org/v1/projects" -H "Authorization: Bearer sec_live_9412krd"',
      data: projects.slice(0, 3)
    },
    {
      id: 'inventory',
      method: 'GET',
      path: '/api/v1/inventory',
      title: 'مەوجوودی کۆگا و ئاگادارییەکان',
      curl: 'curl -X GET "https://api.bamboki-charity.org/v1/inventory" -H "Authorization: Bearer sec_live_9412krd"',
      data: inventory.slice(0, 3)
    }
  ];

  const currentEndpoint = endpoints.find(e => e.id === selectedEndpoint) || endpoints[0];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = () => {
    setApiResponse({
      status: 200,
      timestamp: new Date().toISOString(),
      organization: 'ڕێکخراوی بۆتان بامۆکی',
      endpoint: currentEndpoint.path,
      resultsCount: currentEndpoint.data.length,
      data: currentEndpoint.data
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              کۆنسۆڵی API بۆ پەرەپێدەران و بەستنەوەی سیستەم
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                REST API v1
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ڕێکخراوی بۆتان بامۆکی • دەروازەی بەستنەوەی نەرمەکاڵا و مۆبایل ئەپەکان
            </p>
          </div>
        </div>

        {/* API Key Banner */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-700 block">کلیلی تایبەتی بەستنەوە (API Secret Key):</span>
              <span className="font-mono text-xs text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                sec_live_9412krd_bamboki_2026
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            چالاکە • سنووردارنەکراو
          </span>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {endpoints.map(e => (
            <button
              key={e.id}
              onClick={() => {
                setSelectedEndpoint(e.id);
                setApiResponse(null);
              }}
              className={`p-2.5 rounded-xl border text-right transition-all text-xs ${
                selectedEndpoint === e.id
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="font-mono text-[10px] text-indigo-700 block font-bold">{e.method}</span>
              <span className="truncate block mt-0.5">{e.path}</span>
            </button>
          ))}
        </div>

        {/* Active Endpoint Info & cURL Box */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">{currentEndpoint.title}</span>
            <button
              onClick={() => handleCopy(currentEndpoint.curl)}
              className="flex items-center gap-1 text-cyan-700 hover:text-cyan-800 font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'کۆپیکرا' : 'کۆپیکردنی فەرمانی cURL'}
            </button>
          </div>

          <div dir="ltr" className="p-3.5 rounded-2xl bg-slate-900 text-cyan-400 font-mono text-xs overflow-x-auto select-all text-left">
            {currentEndpoint.curl}
          </div>

          <button
            onClick={handleTest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5" />
            ناردنی داواکاری و وەرگرتنی داتای ڕاستەوخۆ (Execute API Endpoint)
          </button>
        </div>

        {/* Live Response Box */}
        {apiResponse && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6">
            <div dir="ltr" className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span className="flex items-center gap-1.5 font-mono">
                <Code2 className="w-4 h-4 text-emerald-600" />
                Response (HTTP 200 OK)
              </span>
              <span className="text-[11px] text-slate-500 font-normal">{apiResponse.timestamp}</span>
            </div>
            <pre dir="ltr" className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] max-h-56 overflow-y-auto leading-relaxed text-left">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
};
