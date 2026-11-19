import clsx from 'clsx';
import type { ReactNode } from 'react';

/** Circular progress ring (SVG). */
export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  color = '#00D1FF',
  track = 'rgb(var(--line) / .6)',
  children,
  className,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx('relative inline-grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

/** Horizontal progress bar. */
export function ProgressBar({ value, color, className, height = 8 }: { value: number; color?: string; className?: string; height?: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx('w-full overflow-hidden rounded-full bg-line/50', className)} style={{ height }}>
      <div
        className={clsx('h-full rounded-full transition-[width] duration-700', !color && 'bg-brand-gradient')}
        style={{ width: `${v}%`, background: color }}
      />
    </div>
  );
}
