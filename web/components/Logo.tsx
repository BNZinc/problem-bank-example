/** 문제곳간 mark: a small storehouse roof over a sheet with a check. Drawn for this example. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M4 13.5 16 5l12 8.5" fill="none" stroke="var(--accent-11)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="12" width="16" height="16" rx="2.5" fill="var(--accent-3)" stroke="var(--accent-11)" strokeWidth="2" />
      <path d="M11.5 17h6M11.5 21h4" stroke="var(--accent-11)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m18.5 21.5 1.8 1.8 3.2-3.6" fill="none" stroke="var(--accent-9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
