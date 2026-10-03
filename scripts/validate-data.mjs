import fs from 'node:fs/promises';
import { validateData } from '../shared/validate.mjs';
const path = new URL('../public/data/site-data.json', import.meta.url);
try {
  const data = JSON.parse(await fs.readFile(path, 'utf8'));
  const errors = validateData(data);
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log(`数据校验通过：${data.directions.length}个方向、${data.teachers.length}条教师资料、${data.admissions.length}条年度招生记录。`);
} catch (error) { console.error('数据校验失败：' + error.message); process.exitCode = 1; }
