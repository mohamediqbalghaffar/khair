import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { triggerHaptic } from '../../utils/useHaptics';
import { AdaptiveDrawerSheet } from './AdaptiveDrawerSheet';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  actionLabel?: string;
  onAction?: () => void;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface FeedbackContextType {
  showToast: (message: string, variant?: ToastVariant, title?: string, action?: { label: string; onClick: () => void }) => void;
  confirmAction: (options: string | ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextType | null>(null);

export const useFeedback = (): FeedbackContextType => {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    return {
      showToast: (msg) => console.info('[Toast]', msg),
      confirmAction: async () => true
    };
  }
  return ctx;
};

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { isOpen: boolean }) | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: ToastVariant = 'info',
      title?: string,
      action?: { label: string; onClick: () => void }
    ) => {
      // Auto-infer variant from Kurdish message keywords if default 'info' was passed
      let resolvedVariant = variant;
      if (variant === 'info') {
        if (message.includes('هەڵە') || message.includes('نەتوانرا') || message.includes('تکایە') || message.includes('ناکرێت')) {
          resolvedVariant = 'warning';
        } else if (message.includes('سەرکەوتوو') || message.includes('پاشەکەوت') || message.includes('زیادکرا') || message.includes('کۆپی کرا') || message.includes('تەواو')) {
          resolvedVariant = 'success';
        }
      }

      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      triggerHaptic(
        resolvedVariant === 'error'
          ? 'error'
          : resolvedVariant === 'warning'
          ? 'warning'
          : resolvedVariant === 'success'
          ? 'success'
          : 'light'
      );
      setToasts((prev) => [
        ...prev.slice(-4),
        {
          id,
          title,
          message,
          variant: resolvedVariant,
          actionLabel: action?.label,
          onAction: action?.onClick
        }
      ]);

      setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast]
  );

  const confirmAction = useCallback((options: string | ConfirmOptions): Promise<boolean> => {
    const normalized: ConfirmOptions =
      typeof options === 'string'
        ? {
            title: options.includes('سڕینەوە') ? 'دڵنیابوونەوە لە سڕینەوە' : 'پشتڕاستکردنەوەی کردار',
            message: options,
            confirmLabel: options.includes('سڕینەوە') ? 'بەڵێ، بیسڕەوە' : 'بەڵێ، دڵنیام',
            cancelLabel: 'پاشگەزبوونەوە',
            variant: options.includes('سڕینەوە') ? 'danger' : 'warning'
          }
        : {
            title: options.title || 'پشتڕاستکردنەوەی کردار',
            message: options.message,
            confirmLabel: options.confirmLabel || options.confirmText || 'بەڵێ، دڵنیام',
            cancelLabel: options.cancelLabel || options.cancelText || 'پاشگەزبوونەوە',
            variant: options.variant || 'danger'
          };

    triggerHaptic('warning');
    setConfirmState({ ...normalized, isOpen: true });
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirmResolve = useCallback((result: boolean) => {
    setConfirmState(null);
    if (result) {
      triggerHaptic('medium');
    } else {
      triggerHaptic('light');
    }
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  return (
    <FeedbackContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Floating iOS 26 Liquid Glass Toast Stack */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed top-20 inset-x-4 sm:inset-x-auto sm:start-6 z-[120] flex flex-col gap-2.5 max-w-sm mx-auto sm:mx-0 w-[calc(100vw-2rem)] sm:w-96 pointer-events-none no-print"
      >
        {toasts.map((t) => {
          const styles = {
            success: {
              bg: 'bg-white/95 border-emerald-200 text-slate-900',
              iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
              Icon: CheckCircle2,
              defaultTitle: 'سەرکەوتوو بوو'
            },
            warning: {
              bg: 'bg-white/95 border-amber-200 text-slate-900',
              iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
              Icon: AlertTriangle,
              defaultTitle: 'ئاگاداری'
            },
            error: {
              bg: 'bg-white/95 border-rose-200 text-slate-900',
              iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
              Icon: XCircle,
              defaultTitle: 'هەڵە ڕوویدا'
            },
            info: {
              bg: 'bg-white/95 border-cyan-200 text-slate-900',
              iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
              Icon: Info,
              defaultTitle: 'زانیاری سیستەم'
            }
          }[t.variant];

          const IconComp = styles.Icon;

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto rounded-2xl border p-3.5 shadow-xl backdrop-blur-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${styles.bg}`}
            >
              <div className={`p-2 rounded-xl border shrink-0 ${styles.iconBg}`}>
                <IconComp className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-900">{t.title || styles.defaultTitle}</p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed whitespace-pre-line break-words">
                  {t.message}
                </p>
                {t.actionLabel && t.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      t.onAction?.();
                      dismissToast(t.id);
                    }}
                    className="mt-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors"
                  >
                    {t.actionLabel}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="داخستنی ئاگادارکردنەوە"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Accessible Liquid Glass Confirmation Drawer / Modal */}
      <AdaptiveDrawerSheet
        isOpen={!!confirmState?.isOpen}
        onClose={() => handleConfirmResolve(false)}
        title={confirmState?.title || 'دڵنیابوونەوە لە ئەنجامدانی کردار'}
        maxWidth="max-w-md"
        maxHeight="max-h-[85dvh]"
        icon={
          <div
            className={`w-full h-full flex items-center justify-center rounded-xl ${
              confirmState?.variant === 'danger'
                ? 'bg-rose-50 text-rose-600'
                : confirmState?.variant === 'warning'
                ? 'bg-amber-50 text-amber-600'
                : 'bg-cyan-50 text-cyan-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => handleConfirmResolve(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors touch-manipulation active:scale-95"
            >
              {confirmState?.cancelLabel || confirmState?.cancelText || 'پاشگەزبوونەوە'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmResolve(true)}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all touch-manipulation active:scale-95 ${
                confirmState?.variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : confirmState?.variant === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'liquid-button-primary'
              }`}
            >
              {confirmState?.confirmLabel || confirmState?.confirmText || 'بەڵێ، دڵنیام'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {confirmState?.message}
          </p>
        </div>
      </AdaptiveDrawerSheet>
    </FeedbackContext.Provider>
  );
};
