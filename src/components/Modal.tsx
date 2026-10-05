import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';

interface ModalProps {
  onClose: () => void;
  /** id del título del diálogo */
  labelledBy: string;
  /** sheet: hoja desde abajo en móvil y centrada en ≥sm. center: centrada siempre. */
  variant?: 'center' | 'sheet';
  id?: string;
  /** Tamaño del panel, p. ej. "max-w-md max-h-[85vh]" */
  className?: string;
  /** Recibe `close`, que anima la salida y después llama a onClose. */
  children: (close: () => void) => React.ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const EXIT_MS = 150;
const ENTER = { duration: 0.25, ease: 'easeOut' } as const;
const EXIT = { duration: EXIT_MS / 1000, ease: 'easeIn' } as const;

export const Modal: React.FC<ModalProps> = ({
  onClose,
  labelledBy,
  variant = 'center',
  id,
  className = '',
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => onCloseRef.current(), reduced ? 0 : EXIT_MS);
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current!;
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);

    (focusables()[0] ?? panel).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const inside = panel.contains(document.activeElement);
      if (e.shiftKey && (!inside || document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus();
    };
  }, [close]);

  const isSheet = variant === 'sheet';

  return (
    <m.div
      className={`fixed inset-0 z-50 flex justify-center bg-ink/60 backdrop-blur-sm ${
        isSheet ? 'items-end sm:items-center sm:p-4' : 'items-center p-4'
      }`}
      initial={{ opacity: 0 }}
      animate={closing ? { opacity: 0, transition: EXIT } : { opacity: 1, transition: ENTER }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <m.div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={`w-full bg-surface-card border border-line shadow-elev-3 overflow-hidden flex flex-col outline-none ${
          isSheet ? 'rounded-t-sheet sm:rounded-sheet' : 'rounded-sheet'
        } ${className}`}
        initial={{ opacity: 0, y: 24 }}
        animate={closing ? { opacity: 0, y: 24, transition: EXIT } : { opacity: 1, y: 0, transition: ENTER }}
      >
        {children(close)}
      </m.div>
    </m.div>
  );
};
