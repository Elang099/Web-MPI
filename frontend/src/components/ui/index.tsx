import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

export function Badge({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-ui text-[11px] font-semibold uppercase tracking-wide', className)}
      style={color ? { background: `${color}22`, color, boxShadow: `inset 0 0 0 1px ${color}44` } : undefined}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={clsx('relative overflow-hidden rounded-2xl bg-surface-2/70', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <div className={clsx('h-6 w-6 animate-spin rounded-full border-2 border-cyan border-t-transparent', className)} />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-3 p-10 text-center">
      {icon && <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-cyan">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      {body && <p className="max-w-md text-sm text-muted">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="panel flex flex-col items-center gap-3 border-danger/40 p-8 text-center">
      <h3 className="font-bold text-danger">Something went wrong</h3>
      <p className="text-sm text-muted">{(error as Error)?.message ?? 'Please try again.'}</p>
      {onRetry && (
        <button className="text-sm font-semibold text-cyan hover:underline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions, className }: { eyebrow?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between', className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, className }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; className?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            className={clsx('panel relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6', className)}
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button aria-label="Close" className="absolute right-4 top-4 rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink" onClick={onClose}>
              <X className="h-5 w-5" />
            </button>
            {title && <h2 className="mb-4 pr-8 text-xl font-bold">{title}</h2>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={clsx('scrollbar-none inline-flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface-2/50 p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            'relative whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition',
            value === t.value ? 'text-ink' : 'text-muted hover:text-ink',
          )}
        >
          {value === t.value && <motion.span layoutId={`tab-${tabs.map((x) => x.value).join()}`} className="absolute inset-0 rounded-xl bg-surface shadow-soft" />}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Count-up number animation. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n.toLocaleString()}</>;
}
