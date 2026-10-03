import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { CONFIG, TABLES } from '../shared/workbook-schema.mjs';
import { validateData } from '../shared/validate.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const boolFields = new Set(['enabled', 'doctoral', 'eligible']);
const numberFields = new Set(['order', 'year', 'assumed', 'confirmed', 'actual', 'cohort', 'count']);
const dateFields = new Set(['checkedAt', 'updatedAt', 'publishedAt', 'teacherCheckedAt']);
function value(cell) {
  const v = cell.value;
  if (v && typeof v === 'object' && !(v instanceof Date)) {
    if ('formula' in v || 'sharedFormula' in v) return v.result;
    if ('richText' in v) return v.richText.map(t => t.text).join('');
    if ('text' in v) return v.text;
    throw new Error(`单元格${cell.address}包含不支持的内容`);
  }
  return v;
}
function convert(v, key) {
  if (dateFields.has(key)) {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    // 腾讯文档若导出为Excel日期序号，也恢复为统一日期。
    if (typeof v === 'number') return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  if (boolFields.has(key)) return v === true || v === '是' ? true : v === false || v === '否' ? false : v;
  if (numberFields.has(key)) return v === null || v === undefined || v === '' ? (['confirmed', 'actual'].includes(key) ? null : NaN) : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : v;
  return v === null || v === undefined ? '' : String(v).trim();
}

export async function readWorkbook(filename) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filename);
  const data = { schemaVersion: 1, meta: {} };
  const locations = {};
  const config = workbook.getWorksheet('使用说明与配置');
  if (!config) throw new Error('找不到工作表「使用说明与配置」');
  const labels = new Map(Object.entries(CONFIG).map(([key, spec]) => [spec[0], key]));
  const seenConfig = new Set();
  config.eachRow((row, i) => {
    if (i === 1) return;
    const label = String(value(row.getCell(1)) ?? '').trim();
    if (!label) return;
    const key = labels.get(label);
    if (!key) throw new Error(`使用说明与配置 第${i}行：未知配置「${label}」`);
    if (seenConfig.has(key)) throw new Error(`使用说明与配置 第${i}行：配置重复「${label}」`);
    seenConfig.add(key);
    let v = value(row.getCell(2));
    if (['schemaVersion', 'defaultYear', 'defaultCohort', 'cohortSize', 'reportedCount'].includes(key)) v = v === null || v === undefined || v === '' ? null : typeof v === 'string' && /^\d+$/.test(v.trim()) ? Number(v) : v;
    else v = convert(v, key);
    if (key === 'schemaVersion') data.schemaVersion = v;
    else data.meta[key] = v;
  });
  for (const [key, spec] of Object.entries(CONFIG)) if (!seenConfig.has(key)) throw new Error(`使用说明与配置：缺少配置「${spec[0]}」`);
  data.meta.snapshotAt = new Date().toISOString();
  for (const [table, spec] of Object.entries(TABLES)) {
    const sheet = workbook.getWorksheet(spec.sheet);
    if (!sheet) throw new Error(`找不到工作表「${spec.sheet}」`);
    const header = sheet.getRow(1);
    const indexes = {};
    header.eachCell((cell, col) => {
      const label = String(value(cell) ?? '').trim();
      const key = Object.keys(spec.columns).find(k => spec.columns[k] === label);
      if (!key && label) throw new Error(`${spec.sheet} 第1行：未知列「${label}」，请按字段说明添加新功能`);
      if (key) {
        if (key in indexes) throw new Error(`${spec.sheet} 第1行：重复列「${label}」`);
        indexes[key] = col;
      }
    });
    for (const [key, label] of Object.entries(spec.columns)) if (!(key in indexes)) throw new Error(`${spec.sheet} 第1行：缺少列「${label}」`);
    data[table] = []; locations[table] = [];
    sheet.eachRow((row, i) => {
      if (i === 1) return;
      if (Object.values(indexes).every(col => [null, undefined, ''].includes(value(row.getCell(col))))) return;
      const record = {};
      for (const [key, col] of Object.entries(indexes)) record[key] = convert(value(row.getCell(col)), key);
      data[table].push(record); locations[table].push(i);
    });
  }
  return { data, locations };
}

export async function publishSnapshot(data, output, backupDir, locations = {}) {
  const errors = validateData(data, locations);
  if (errors.length) throw new Error('未更新网站数据，请先修正：\n' + errors.join('\n'));
  await fs.mkdir(path.dirname(output), { recursive: true });
  try {
    const old = await fs.readFile(output, 'utf8');
    await fs.mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.writeFile(path.join(backupDir, `${stamp}.json`), old);
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const temp = output + '.tmp';
  try {
    await fs.writeFile(temp, JSON.stringify(data, null, 2) + '\n');
    await fs.rename(temp, output);
  } catch (e) { await fs.rm(temp, { force: true }); throw e; }
}

async function main() {
  let filename = process.argv[2];
  if (!filename) {
    const dir = path.join(projectRoot, 'local-imports');
    const files = (await fs.readdir(dir)).filter(f => f.endsWith('.xlsx') && !f.startsWith('~$'));
    if (files.length !== 1) throw new Error('请在local-imports目录只放一份腾讯文档导出的.xlsx文件，或传入文件路径');
    filename = path.join(dir, files[0]);
  }
  const { data, locations } = await readWorkbook(path.resolve(filename));
  await publishSnapshot(data, path.join(projectRoot, 'public/data/site-data.json'), path.join(projectRoot, 'local-snapshots'), locations);
  console.log('导入成功。网站数据已更新，上次数据已备份；请预览后提交并手动发布。');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(e => { console.error(e.message); process.exitCode = 1; });
