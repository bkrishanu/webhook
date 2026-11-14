export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hn-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#hn-g)" />
      <path d="M26 14v22a8 8 0 0 0 16 0v-4" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M42 32l-5 5M42 32l5 5" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M26 14c6-6 16-5 18 2-7 3-14 2-18-2z" fill="#d1fae5" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-tight">
        <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Hook<span className="text-brand-600 dark:text-brand-400">Nest</span>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Webhook Inspector
        </div>
      </div>
    </div>
  );
}
