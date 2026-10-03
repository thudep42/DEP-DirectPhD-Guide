import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { validateData } from '../shared/validate.mjs';
import { admissionSummary, outcomeSummary } from '../shared/statistics.mjs';
import { admissionPeriod } from '../shared/admission-period.mjs';
import { publishSnapshot } from '../scripts/import-workbook.mjs';
const seed = JSON.parse(await fs.readFile(new URL('./fixtures/initial-data.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(seed);

test('2024级参考对应2027年推免与2028年博士入学，上一届去向仍为2023级', () => {
  assert.equal(seed.meta.defaultYear, 2028);
  assert.ok(seed.admissions.every(r => r.year === 2028));
  assert.deepEqual(admissionPeriod(seed.meta.defaultYear), { admissionYear: 2028, recommendationYear: 2027, undergraduateCohort: 2024, label: '2027年推免' });
  assert.equal(admissionPeriod(2029).label, '2028年推免');
  assert.equal(seed.meta.defaultCohort, 2023);
  assert.ok(seed.outcomes.every(r => r.cohort === 2023 && r.count === 0));
});

test('九个方向与年度汇总一致，名单差异不进入默认名额', () => {
  assert.deepEqual(validateData(seed), []);
  const total = admissionSummary(seed, 2028);
  assert.equal(total.assumed, 56); assert.equal(total.doctoral, 56);
  const directions = seed.directions.map(d => admissionSummary(seed, 2028, d.id).assumed);
  assert.deepEqual(directions, [10, 7, 9, 6, 4, 5, 8, 2, 5]);
  const exception = seed.teachers.find(t => t.name === '程建平');
  assert.ok(exception.note.includes('汇总页未列入'));
  assert.ok(!total.rows.some(r => r.teacherId === exception.id));
});
test('未知计划不当成零，部分填写也不当成完整年度计划', () => {
  const data = clone();
  assert.equal(admissionSummary(data, 2028).confirmed.total, null);
  data.admissions[0].confirmed = 0;
  let result = admissionSummary(data, 2028).confirmed;
  assert.equal(result.total, null); assert.equal(result.knownTotal, 0); assert.equal(result.knownCount, 1);
  data.admissions.forEach(a => { a.confirmed = 0; });
  result = admissionSummary(data, 2028).confirmed;
  assert.equal(result.total, 0);
});
test('增加年度和修改方向名称不破坏关联与历史统计', () => {
  const data = clone();
  data.directions[0].name = '新显示名称';
  data.admissions.push(...data.admissions.map(a => ({ ...a, year: 2029, assumed: 2 })));
  data.meta.defaultYear = 2029;
  data.teachers[0].doctoral = !data.teachers[0].doctoral;
  assert.deepEqual(validateData(data), []);
  assert.equal(admissionSummary(data, 2029).assumed, 112);
  assert.equal(admissionSummary(data, 2028).assumed, 56);
  assert.equal(admissionSummary(data, 2029, 'accelerator').assumed, 20);
});
test('去向占位不显示比例，填入实际人数需更新状态与来源', () => {
  const data = clone();
  assert.equal(outcomeSummary(data, 2023).percentage, false);
  data.outcomes[0].count = 2;
  assert.ok(validateData(data).some(e => e.includes('占位记录只能为0')));
  data.outcomes[0].dataStatus = '填报中'; data.outcomes[0].source = '本人填报汇总';
  data.meta.outcomeStatus = '填报中';
  assert.deepEqual(validateData(data), []);
  data.meta.cohortSize = 2; data.meta.reportedCount = 2;
  assert.equal(outcomeSummary(data, 2023).percentage, false);
  data.outcomes.forEach(r => { r.dataStatus = '已核实'; }); data.meta.outcomeStatus = '已核实';
  assert.equal(outcomeSummary(data, 2023).percentage, true);
});
test('拒绝重复年度导师、无效方向、危险链接、坏日期和额外私人字段', () => {
  const cases = [
    d => d.admissions.push({ ...d.admissions[0] }),
    d => { d.teachers[0].directionId = 'missing'; },
    d => { d.resources[0].url = 'javascript:alert(1)'; },
    d => { d.outcomes[0].updatedAt = '2026-99-99'; },
    d => { d.outcomes[0].phone = 'private'; },
  ];
  for (const mutate of cases) { const d = clone(); mutate(d); assert.ok(validateData(d).length > 0); }
});
test('错误导入不覆盖旧快照，成功更新保存备份', async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'dep-directphd-guide-test-'));
  const output = path.join(temp, 'site-data.json');
  const backups = path.join(temp, 'backups');
  try {
    await fs.writeFile(output, JSON.stringify(seed));
    const before = await fs.readFile(output, 'utf8');
    const bad = clone(); bad.outcomes[0].count = -1;
    await assert.rejects(publishSnapshot(bad, output, backups), /第2行.*人数/);
    assert.equal(await fs.readFile(output, 'utf8'), before);
    const good = clone(); good.admissions[0].assumed = 2;
    await publishSnapshot(good, output, backups);
    assert.equal(JSON.parse(await fs.readFile(output, 'utf8')).admissions[0].assumed, 2);
    assert.equal((await fs.readdir(backups)).length, 1);
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
});
