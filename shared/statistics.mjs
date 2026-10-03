// 已知0与未知空值分别处理；缺少部分计划时不给出完整年度总数。
export function nullableSum(records, key) {
  const known = records.filter(r => r[key] !== null);
  return { total: known.length === records.length && records.length ? known.reduce((s, r) => s + r[key], 0) : null, knownTotal: known.reduce((s, r) => s + r[key], 0), knownCount: known.length, totalCount: records.length };
}
export function admissionSummary(data, year, directionId) {
  const teachers = new Map(data.teachers.map(t => [t.id, t]));
  const rows = data.admissions.filter(r => r.year === year && (!directionId || teachers.get(r.teacherId)?.directionId === directionId));
  return { rows, doctoral: rows.filter(r => r.eligible).length, assumed: rows.reduce((s, r) => s + r.assumed, 0), confirmed: nullableSum(rows, 'confirmed'), actual: nullableSum(rows, 'actual') };
}
export function outcomeSummary(data, cohort) {
  const rows = data.outcomes.filter(r => r.cohort === cohort);
  const total = rows.reduce((s, r) => s + r.count, 0);
  const states = new Set(rows.map(r => r.dataStatus));
  const status = states.has('填报中') ? '填报中' : states.has('初始占位') ? '初始占位' : rows.length ? '已核实' : '未建立';
  const size = cohort === data.meta.defaultCohort ? data.meta.cohortSize : null;
  const reported = cohort === data.meta.defaultCohort ? data.meta.reportedCount : null;
  const percentage = status === '已核实' && size !== null && size > 0 && reported === size && total === size;
  return { rows, total, status, size, reported, percentage };
}
