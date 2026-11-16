/** Logo: la boca del bolsin cerrada con su precinto. */
export function Marca({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="7" fill="#2E46C8" />
      <path d="M11 9h10v4a5 5 0 0 1-10 0z" fill="none" stroke="#F5C400" strokeWidth="2.4" strokeLinejoin="round" />
      <rect x="8" y="17" width="16" height="7" rx="2" fill="#F5C400" />
      <circle cx="12" cy="20.5" r="1.2" fill="#2E46C8" />
    </svg>
  )
}
