type Name = 'directions' | 'outcomes' | 'resources' | 'external' | 'chevron' | 'info';
export function Icon({ name, size = 22 }: { name: Name; size?: number }) {
  const paths: Record<Name, React.ReactNode> = {
    directions: <><path d="M12 3v6M5 21v-5h14v5M12 16v-4M5 16v-4h14v4"/><circle cx="12" cy="5" r="2"/><path d="M3 21h4m3 0h4m3 0h4"/></>,
    outcomes: <><path d="M4 20V10m8 10V4m8 16v-7M2 20h20"/></>,
    resources: <><path d="M12 6c-3-3-7-3-10-1v15c3-2 7-2 10 1 3-3 7-3 10-1V5c-3-2-7-2-10 1Zm0 0v15"/></>,
    external: <><path d="M14 3h7v7m0-7L10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6"/></>,
    chevron: <path d="m8 4 8 8-8 8"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
