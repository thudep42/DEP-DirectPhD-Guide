export interface Direction { id: string; name: string; parent: string; url: string; order: number; enabled: boolean }
export interface Teacher { id: string; name: string; position: string; directionId: string; doctoral: boolean; checkedAt: string; url: string; sourceUrl: string; note: string }
export interface Admission { year: number; teacherId: string; eligible: boolean; assumed: number; confirmed: number | null; actual: number | null; scope: string; sourceUrl: string; updatedAt: string }
export interface Outcome { id: string; cohort: number; pathway: string; relation: string; institutionType: string; institution: string; department: string; directionId: string; research: string; count: number; resultStatus: string; dataStatus: string; source: string; updatedAt: string }
export interface Resource { id: string; title: string; category: string; directionId: string; url: string; publishedAt: string; source: string; enabled: boolean }
export interface SiteData {
  schemaVersion: number;
  meta: { siteName: string; defaultYear: number; defaultCohort: number; teacherCheckedAt: string; outcomeStatus: string; cohortSize: number | null; reportedCount: number | null; sheetUrl: string; snapshotAt: string };
  directions: Direction[]; teachers: Teacher[]; admissions: Admission[]; outcomes: Outcome[]; resources: Resource[];
}
