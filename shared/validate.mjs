import { TABLES, CONFIG, PATHWAYS, RELATIONS, INSTITUTION_TYPES, RESULT_STATUSES, DATA_STATUSES } from './workbook-schema.mjs';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const idPattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
export function isHttpUrl(value) {
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; }
  catch { return false; }
}
export function isDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// 所有问题一次列出，导入和构建共用同一套规则。
export function validateData(data, locations = {}) {
  const errors = [];
  const issue = (table, i, field, message) => {
    const sheet = TABLES[table]?.sheet ?? '使用说明与配置';
    const row = locations[table]?.[i] ?? i + 2;
    const label = TABLES[table]?.columns[field] ?? CONFIG[field]?.[0] ?? field;
    errors.push(`${sheet} 第${row}行「${label}」：${message}`);
  };
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['数据必须是对象'];
  const topFields = ['schemaVersion', 'meta', ...Object.keys(TABLES)];
  for (const key of Object.keys(data)) if (!topFields.includes(key)) errors.push(`发布数据存在未定义字段：${key}`);
  if (data.schemaVersion !== 1) errors.push('不支持的数据格式版本；请按迁移说明更新');
  if (!data.meta || typeof data.meta !== 'object') return [...errors, '缺少网站配置'];
  const metaFields = [...Object.keys(CONFIG).filter(k => k !== 'schemaVersion'), 'snapshotAt'];
  for (const key of Object.keys(data.meta)) if (!metaFields.includes(key)) errors.push(`配置存在未定义字段：${key}`);
  for (const key of metaFields) if (!(key in data.meta)) errors.push(`配置缺少字段：${key}`);
  const m = data.meta;
  if (typeof m.siteName !== 'string' || !m.siteName.trim()) errors.push('网站名称不能为空');
  for (const key of ['defaultYear', 'defaultCohort']) if (!Number.isInteger(m[key]) || m[key] < 2000 || m[key] > 2200) errors.push(`${CONFIG[key][0]}必须是2000至2200之间的整数`);
  for (const key of ['cohortSize', 'reportedCount']) if (m[key] !== null && (!Number.isInteger(m[key]) || m[key] < 0)) errors.push(`${CONFIG[key][0]}必须留空或填写非负整数`);
  if (m.cohortSize !== null && m.reportedCount !== null && m.reportedCount > m.cohortSize) errors.push('已填报人数不能大于年级总人数');
  if (!DATA_STATUSES.includes(m.outcomeStatus)) errors.push('去向统计状态无效');
  if (!isDate(m.teacherCheckedAt)) errors.push('师资核对日期必须为有效的YYYY-MM-DD日期');
  if (typeof m.snapshotAt !== 'string' || !Number.isFinite(Date.parse(m.snapshotAt))) errors.push('快照时间无效');
  if (m.sheetUrl !== '' && !isHttpUrl(m.sheetUrl)) errors.push('腾讯文档链接必须是http或https链接，或留空');
  for (const table of Object.keys(TABLES)) if (!Array.isArray(data[table])) errors.push(`缺少${TABLES[table].sheet}数据表`);
  if (errors.some(e => e.startsWith('缺少'))) return errors;
  const integerFields = { directions: ['order'], admissions: ['year', 'assumed'], outcomes: ['cohort', 'count'] };
  const booleanFields = { directions: ['enabled'], teachers: ['doctoral'], admissions: ['eligible'], resources: ['enabled'] };
  const optionalNumbers = { admissions: ['confirmed', 'actual'] };
  const requiredTexts = { directions: ['id', 'name', 'parent', 'url'], teachers: ['id', 'name', 'position', 'url', 'checkedAt'], admissions: ['teacherId', 'scope', 'sourceUrl', 'updatedAt'], outcomes: ['id', 'pathway', 'relation', 'institutionType', 'resultStatus', 'dataStatus', 'updatedAt'], resources: ['id', 'title', 'category', 'url', 'source'] };
  const ids = {};
  for (const [table, spec] of Object.entries(TABLES)) {
    ids[table] = new Set();
    data[table].forEach((record, i) => {
      if (!record || typeof record !== 'object' || Array.isArray(record)) { issue(table, i, '', '必须是一条记录'); return; }
      for (const key of Object.keys(record)) if (!(key in spec.columns)) issue(table, i, key, '未定义字段不能进入发布数据');
      for (const key of Object.keys(spec.columns)) {
        const v = record[key];
        if ((integerFields[table] ?? []).includes(key)) {
          if (!Number.isSafeInteger(v) || v < 0) issue(table, i, key, '必须是非负整数');
          if (['year', 'cohort'].includes(key) && (v < 2000 || v > 2200)) issue(table, i, key, '年份必须在2000至2200之间');
        } else if ((booleanFields[table] ?? []).includes(key)) {
          if (typeof v !== 'boolean') issue(table, i, key, '必须填写是或否');
        } else if ((optionalNumbers[table] ?? []).includes(key)) {
          if (v !== null && (!Number.isSafeInteger(v) || v < 0)) issue(table, i, key, '必须留空或填写非负整数');
        } else if (typeof v !== 'string') issue(table, i, key, '必须是文本；可选字段请留空');
        else {
          if ((requiredTexts[table] ?? []).includes(key) && !v.trim()) issue(table, i, key, '不能为空');
          if (['url', 'sourceUrl'].includes(key) && v && !isHttpUrl(v)) issue(table, i, key, '只允许http或https链接');
          if (['checkedAt', 'updatedAt', 'publishedAt'].includes(key) && v && !isDate(v)) issue(table, i, key, '必须是有效的YYYY-MM-DD日期');
        }
      }
      if ('id' in spec.columns) {
        if (!idPattern.test(record.id)) issue(table, i, 'id', '编号用英文字母开头，只包含字母、数字、下划线或短横线');
        if (ids[table].has(record.id)) issue(table, i, 'id', '编号重复');
        ids[table].add(record.id);
      }
    });
  }
  if (errors.length) return errors;
  const directions = new Map(data.directions.map(r => [r.id, r]));
  const teachers = new Map(data.teachers.map(r => [r.id, r]));
  for (const table of ['teachers', 'outcomes', 'resources']) data[table].forEach((r, i) => {
    if (r.directionId && !directions.has(r.directionId)) issue(table, i, 'directionId', '方向编号不存在');
  });
  const admissionKeys = new Set();
  data.admissions.forEach((r, i) => {
    const key = `${r.year}:${r.teacherId}`;
    if (admissionKeys.has(key)) issue('admissions', i, 'teacherId', '同年度导师重复，会导致重复计数');
    admissionKeys.add(key);
    if (!teachers.has(r.teacherId)) issue('admissions', i, 'teacherId', '导师编号不存在');
    else if (!teachers.get(r.teacherId).directionId) issue('admissions', i, 'teacherId', '招生记录中的导师必须有计数归属方向');
    else if (!directions.get(teachers.get(r.teacherId).directionId)?.enabled) issue('admissions', i, 'teacherId', '有招生记录的方向不能停用；应保留历史展示');
    if (r.eligible === false && r.assumed > 0) issue('admissions', i, 'assumed', '该年度未列入博导名单时，默认估算人数必须为0');
    if (!r.sourceUrl) issue('admissions', i, 'sourceUrl', '需要记录年度估算或确认计划的来源');
  });
  const outcomeKeys = new Set();
  data.outcomes.forEach((r, i) => {
    const enums = { pathway: PATHWAYS, relation: RELATIONS, institutionType: INSTITUTION_TYPES, resultStatus: RESULT_STATUSES, dataStatus: DATA_STATUSES };
    for (const [key, choices] of Object.entries(enums)) if (!choices.includes(r[key])) issue('outcomes', i, key, `请使用：${choices.join('、')}`);
    if (r.dataStatus === '初始占位' && r.count !== 0) issue('outcomes', i, 'count', '占位记录只能为0；录入人数时改为填报中或已核实');
    if (r.dataStatus !== '初始占位' && r.count > 0 && !r.source.trim()) issue('outcomes', i, 'source', '实际统计需要注明来源');
    if (r.directionId && r.relation !== '工物系') issue('outcomes', i, 'directionId', '本系方向编号只用于工物系去向；校外研究方向填写文字');
    if (r.count > 0 && r.pathway === '直博' && r.relation === '工物系' && !r.directionId) issue('outcomes', i, 'directionId', '本系直博必须指定方向');
    const key = [r.cohort, r.pathway, r.relation, r.institutionType, r.institution, r.department, r.directionId, r.research, r.resultStatus].join('|');
    if (outcomeKeys.has(key)) issue('outcomes', i, 'id', '同一去向组合重复，请合并人数');
    outcomeKeys.add(key);
  });
  const cohortRows = data.outcomes.filter(r => r.cohort === m.defaultCohort);
  const states = new Set(cohortRows.map(r => r.dataStatus));
  const expectedState = states.has('填报中') ? '填报中' : states.has('初始占位') ? '初始占位' : '已核实';
  if (cohortRows.length && m.outcomeStatus !== expectedState) errors.push(`默认年级的配置状态应为「${expectedState}」，请使配置和去向行一致`);
  const reportedTotal = cohortRows.reduce((sum, r) => sum + (r.dataStatus === '初始占位' ? 0 : r.count), 0);
  if (m.reportedCount !== null && reportedTotal > m.reportedCount) errors.push('去向人数合计超过已填报人数；每人只能计入一种当前去向');
  if (m.cohortSize !== null && reportedTotal > m.cohortSize) errors.push('去向人数合计超过年级总人数');
  if (!data.admissions.some(r => r.year === m.defaultYear)) errors.push('默认博士入学年度没有招生记录');
  if (!cohortRows.length) errors.push('默认本科入学年级没有去向记录');
  return errors;
}
