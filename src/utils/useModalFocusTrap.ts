import { useEffect, useRef, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useModalFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isOpen: boolean,
  containerRefOrOnClose?: RefObject<T | null> | (() => void),
  maybeOnClose?: () => void
): RefObject<T | null> {
  const internalRef = useRef<T | null>(null);

  const isCallback = typeof containerRefOrOnClose === 'function';
  const containerRef = (isCallback ? internalRef : containerRefOrOnClose || internalRef) as RefObject<T | null>;
  const onClose = isCallback ? (containerRefOrOnClose as () => void) : maybeOnClose;

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen, containerRef, onClose]);

  return containerRef;
}
