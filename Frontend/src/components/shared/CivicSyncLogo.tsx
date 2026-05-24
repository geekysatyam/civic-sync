/**
 * CivicSyncLogo — single source of truth for the brand mark.
 *
 * Drop your logo image at:  /public/logo.svg  (or logo.png)
 * Until then it renders the gradient-icon + wordmark fallback.
 *
 * Props:
 *   size      — icon box size in px  (default 36)
 *   showText  — show "CivicSync" wordmark next to icon (default true)
 *   textClass — extra classes on the wordmark span
 *   className — wrapper div classes
 */

type Props = {
  size?: number;
  showText?: boolean;
  textClass?: string;
  className?: string;
};

const LOGO_SRC = '/logo.png'; // swap to /logo.png if you use PNG

const CivicSyncLogo = ({ size = 36, showText = true, textClass = '', className = '' }: Props) => (
  <div className={`flex items-center gap-2 shrink-0 ${className}`}>
    <img
      src={LOGO_SRC}
      alt="CivicSync logo"
      width={size}
      height={size}
      className="rounded-xl object-contain"
      onError={(e) => {
        // fallback to gradient icon if image missing
        const img = e.currentTarget;
        img.style.display = 'none';
        const next = img.nextElementSibling as HTMLElement | null;
        if (next) next.style.display = 'flex';
      }}
    />
    {/* fallback icon — hidden when image loads */}
    <span
      style={{ width: size, height: size, display: 'none' }}
      className="rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="4" y1="22" x2="4" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>

    {showText && (
      <span className={`font-bold tracking-tight ${textClass}`}>CivicSync</span>
    )}
  </div>
);

export default CivicSyncLogo;
