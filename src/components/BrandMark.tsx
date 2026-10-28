/** The open C and ascending V form CV Studio's compact, scalable monogram. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="18" fill="#173F35" />
      <path
        d="M38 17.5a16 16 0 1 0 0 29"
        stroke="#F6F7EC"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="m30 29 9 14 13-25"
        stroke="#D1E5AA"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
