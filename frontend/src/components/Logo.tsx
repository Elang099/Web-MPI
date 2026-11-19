import clsx from 'clsx';
import { Link } from 'react-router-dom';

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id="fec-logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#00D1FF" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="#0A1030" />
      <rect x="1" y="1" width="62" height="62" rx="17" fill="none" stroke="url(#fec-logo-g)" strokeOpacity=".5" />
      <path d="M18 46V18h22v6H25v5h12v6H25v11z" fill="url(#fec-logo-g)" />
      <circle cx="46" cy="42" r="5" fill="#00D1FF" />
    </svg>
  );
}

export function Logo({ compact, className, to = '/' }: { compact?: boolean; className?: string; to?: string }) {
  return (
    <Link to={to} className={clsx('flex items-center gap-2.5', className)} aria-label="FUTURE ENGLISH CENTER home">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[15px] font-bold tracking-wide">FUTURE ENGLISH</span>
          <span className="block font-ui text-[10px] font-semibold tracking-[0.32em] text-cyan">CENTER</span>
        </span>
      )}
    </Link>
  );
}
