import { useEffect, useState } from 'react';
import type { SiteData } from './types';
import { loadSiteData } from './data/load';
import { Directions } from './pages/Directions';
import { Outcomes } from './pages/Outcomes';
import { Resources } from './pages/Resources';
import { Icon } from './components/Icon';
import { ExternalLink } from './components/Common';

type Page = 'directions' | 'outcomes' | 'resources';
const tabs: { id: Page; label: string }[] = [{ id: 'directions', label: '方向与招生' }, { id: 'outcomes', label: '年级去向' }, { id: 'resources', label: '资料' }];
function readRoute() {
  const [name, search = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const page: Page = tabs.some(t => t.id === name) ? name as Page : 'directions';
  const query = new URLSearchParams(search);
  return { page, year: Number(query.get('year')), cohort: Number(query.get('cohort')) };
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [data, setData] = useState<SiteData | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const handler = () => { setRoute(readRoute()); window.scrollTo({ top: 0, behavior: 'instant' }); };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    loadSiteData(controller.signal).then(setData).catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => { if (data) document.title = `${tabs.find(t => t.id === route.page)?.label} · ${data.meta.siteName}`; }, [data, route.page]);
  const year = data?.admissions.some(a => a.year === route.year) ? route.year : data?.meta.defaultYear ?? 2028;
  const cohort = data?.outcomes.some(o => o.cohort === route.cohort) ? route.cohort : data?.meta.defaultCohort ?? 2023;
  const routeLink = (page: Page) => `#${page}${page === 'directions' ? `?year=${year}` : page === 'outcomes' ? `?cohort=${cohort}` : ''}`;
  return <div className="app-shell"><a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus(); }}>跳到内容</a><header className="site-header"><div className="header-inner"><a href={routeLink('directions')} className="brand"><span className="brand-mark" aria-hidden="true">工</span><span>{data?.meta.siteName ?? '工物推研信息库'}<small>工程物理系 · 年级共享</small></span></a><nav className="desktop-nav" aria-label="主要导航">{tabs.map(t => <a key={t.id} href={routeLink(t.id)} aria-current={route.page === t.id ? 'page' : undefined}>{t.label}</a>)}</nav><span className="header-label">推研方向参考</span></div></header><main id="main-content" className="main-content" tabIndex={-1}>{error ? <section className="error-state" role="alert"><h1>暂时无法读取资料</h1><p>{error}</p><button className="primary-button" onClick={() => setAttempt(n => n + 1)}>重新加载</button></section> : !data ? <section className="loading-state" role="status"><div className="loading-line"/><div className="loading-card"/><p>正在读取资料…</p></section> : route.page === 'directions' ? <Directions data={data} year={year} setYear={y => { location.hash = `directions?year=${y}`; }}/> : route.page === 'outcomes' ? <Outcomes data={data} cohort={cohort} setCohort={y => { location.hash = `outcomes?cohort=${y}`; }}/>: <Resources data={data}/>}</main>{data && <footer className="site-footer"><span>数据快照：{new Date(data.meta.snapshotAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}</span><span>年级同学维护 · <ExternalLink href="https://www.ep.tsinghua.edu.cn/">工物系官网</ExternalLink></span></footer>}<nav className="mobile-nav" aria-label="主要导航">{tabs.map(t => <a key={t.id} href={routeLink(t.id)} aria-current={route.page === t.id ? 'page' : undefined}><Icon name={t.id}/><span>{t.label}</span></a>)}</nav></div>;
}
