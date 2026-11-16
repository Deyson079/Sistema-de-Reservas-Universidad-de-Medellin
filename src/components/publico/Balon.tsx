export function Balon() {
  return (
    <svg viewBox="0 0 80 80" aria-hidden>
      <defs><radialGradient id="bgb" cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#FFF3A6" /><stop offset=".55" stopColor="#F3D941" /><stop offset="1" stopColor="#B8970F" /></radialGradient></defs>
      <circle cx="40" cy="40" r="36" fill="url(#bgb)" />
      <g fill="none" stroke="#16222F" strokeWidth="2.4" strokeLinecap="round"><path d="M40 4c-8 14-8 30 0 36s22 10 34 6" /><path d="M6 32c14-2 28 2 34 8s6 22 0 34" /><path d="M14 64c10-8 18-18 26-24" /></g>
    </svg>
  );
}
