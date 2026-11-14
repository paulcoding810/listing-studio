export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg)" />
      <rect x="7" y="8" width="8" height="16" rx="2.5" fill="#fff" opacity="0.55" />
      <rect x="12" y="6" width="9" height="20" rx="2.8" fill="#fff" />
      <rect x="19" y="9" width="7" height="14" rx="2.3" fill="#fff" opacity="0.75" />
    </svg>
  )
}
