import React, { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useHaptics } from '../../utils/useHaptics';
import { useModalFocusTrap } from '../../utils/useModalFocusTrap';

export interface AdaptiveDrawerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  maxHeight?: string;
  maxWidth?: string;
  className?: string;
  contentClassName?: string;
  trigger?: React.ReactNode;
  showCloseButton?: boolean;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  /**
   * When true (default), renders a sleek centered modal on desktop (>= 768px)
   * and an iOS 26 Liquid Glass bottom sheet drawer with Vaul physics on mobile (< 768px).
   */
  adaptive?: boolean;
}

const useIsDesktop = (breakpoint = 768) => {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [breakpoint]);

  return isDesktop;
};

/**
 * iOS 26 Liquid Glass Adaptive Drawer Sheet & Modal (Vaul + Desktop Dialog).
 * Replaces heavy mobile dialogs with natural swipe-to-dismiss gesture physics on mobile,
 * while maintaining accessible centered modals on desktop.
 */
export const AdaptiveDrawerSheet: React.FC<AdaptiveDrawerSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxHeight = 'max-h-[92dvh]',
  maxWidth = 'max-w-xl',
  className = '',
  contentClassName = '',
  trigger,
  showCloseButton = true,
  icon,
  footer,
  adaptive = true,
}) => {
  const haptics = useHaptics();
  const isDesktop = useIsDesktop(768);
  const desktopModalRef = useModalFocusTrap(isOpen && isDesktop && adaptive, onClose);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      haptics.light();
      onClose();
    }
  };

  // If closed and no trigger, return null immediately
  if (!isOpen && !trigger) return null;

  // Desktop Centered Modal
  if (adaptive && isDesktop) {
    if (!isOpen) return trigger ? <>{trigger}</> : null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          ref={desktopModalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="adaptive-dialog-title"
          aria-describedby={description ? 'adaptive-dialog-description' : undefined}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full ${maxWidth} rounded-3xl bg-white border border-slate-200/90 shadow-2xl flex flex-col ${maxHeight} animate-in zoom-in-95 duration-200 ${className}`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h3 id="adaptive-dialog-title" className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {title}
                </h3>
                {description && (
                  <p id="adaptive-dialog-description" className="text-xs text-slate-500 font-bold mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={() => {
                  haptics.light();
                  onClose();
                }}
                aria-label="داخستن"
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors touch-manipulation active:scale-95 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Body Content */}
          <div className={`p-6 overflow-y-auto flex-1 overscroll-contain ${contentClassName}`}>
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/70 rounded-b-3xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile Bottom Sheet Drawer (Vaul Physics)
  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      shouldScaleBackground={false}
      direction="bottom"
    >
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm z-50 transition-opacity" />
        <Drawer.Content
          aria-describedby={description ? 'adaptive-sheet-description' : undefined}
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-50 border-t border-slate-200/90 shadow-2xl flex flex-col focus:outline-none pb-safe select-text ${maxHeight} ${className}`}
          dir="rtl"
        >
          {/* iOS Grab Handle */}
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <Drawer.Handle className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 cursor-grab active:cursor-grabbing transition-colors" />
          </div>

          {/* Header Bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <Drawer.Title className="text-base font-black text-slate-900 leading-tight">
                  {title}
                </Drawer.Title>
                {description && (
                  <Drawer.Description
                    id="adaptive-sheet-description"
                    className="text-xs text-slate-500 font-bold mt-0.5"
                  >
                    {description}
                  </Drawer.Description>
                )}
              </div>
            </div>

            {showCloseButton && (
              <Drawer.Close asChild>
                <button
                  type="button"
                  onClick={() => {
                    haptics.light();
                    onClose();
                  }}
                  aria-label="داخستن"
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors touch-manipulation active:scale-95 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </Drawer.Close>
            )}
          </div>

          {/* Body Content */}
          <div className={`p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain ${contentClassName}`}>
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="p-4 border-t border-slate-100 shrink-0 bg-slate-50/70">
              {footer}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default AdaptiveDrawerSheet;
