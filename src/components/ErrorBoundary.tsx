import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[System Error Boundary Caught]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-[400px] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-lg w-full bg-white/95 backdrop-blur-2xl rounded-3xl border border-rose-200 p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">
                {this.props.fallbackTitle || 'هەڵەیەک ڕوویدا لە بارکردنی ئەم بەشە'}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                بەهۆی ناڕێکییەک لە داتاکان یان تۆمارەکانی پێشوو، نیشاندانی ئەم پەڕەیە کاتی ڕاوەستا. سیستەم بە تەواوی پارێزراوە.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 text-start font-mono text-[11px] text-slate-700 max-h-32 overflow-y-auto" dir="ltr">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                <span>دووبارە هەوڵدانەوە</span>
              </button>

              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>نوێکردنەوەی پەیج</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
