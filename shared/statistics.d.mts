import type { Admission, Outcome, SiteData } from '../src/types';
export interface KnownSummary { total: number | null; knownTotal: number; knownCount: number; totalCount: number }
export function nullableSum(records: Admission[], key: 'confirmed' | 'actual'): KnownSummary;
export function admissionSummary(data: SiteData, year: number, directionId?: string): { rows: Admission[]; doctoral: number; assumed: number; confirmed: KnownSummary; actual: KnownSummary };
export function outcomeSummary(data: SiteData, cohort: number): { rows: Outcome[]; total: number; status: string; size: number | null; reported: number | null; percentage: boolean };
