import type { ReactNode } from 'react';
import { Icon } from './Icon';
export function ExternalLink({ href, children, className = '' }: { href: string; children: ReactNode; className?: string }) {
  return <a className={`external-link ${className}`} href={href} target="_blank" rel="noopener noreferrer">{children}<Icon name="external" size={14}/><span className="sr-only">（在新窗口打开）</span></a>;
}
export function Notice({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'amber' }) {
  return <div className={`notice ${tone}`}><Icon name="info" size={19}/><div>{children}</div></div>;
}
export function Metric({ label, value, unit, note }: { label: string; value: ReactNode; unit?: string; note?: string }) {
  return <div className="metric"><span className="metric-label">{label}</span><div className="metric-value">{value}{unit && <span>{unit}</span>}</div>{note && <span className="metric-note">{note}</span>}</div>;
}
export function YearSelect({ label, value, years, onChange, suffix, formatYear }: { label: string; value: number; years: number[]; onChange: (v: number) => void; suffix?: string; formatYear?: (y: number) => string }) {
  return <label className="year-control"><span>{label}</span><select value={value} onChange={e => onChange(Number(e.target.value))}>{years.map(y => <option key={y} value={y}>{formatYear ? formatYear(y) : `${y}${suffix ?? ''}`}</option>)}</select></label>;
}
export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="empty-state"><Icon name="resources" size={28}/><h3>{title}</h3><p>{children}</p></div>;
}
