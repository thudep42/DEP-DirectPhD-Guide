import type { SiteData } from '../types';
import { validateData } from '../../shared/validate.mjs';

// 页面仅依赖此接口；将来可替换为在线表格服务或独立数据库。
export async function loadSiteData(signal?: AbortSignal): Promise<SiteData> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/site-data.json`, { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error('资料暂时无法读取，请稍后重试。');
  const raw: unknown = await response.json();
  const errors = validateData(raw);
  if (errors.length) throw new Error('这份资料的格式有误，请联系维护者检查。');
  return raw as SiteData;
}
