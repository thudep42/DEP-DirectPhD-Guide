import { useState } from 'react';
import type { SiteData } from '../types';
import { ExternalLink, EmptyState, Notice } from '../components/Common';
import { Icon } from '../components/Icon';
export function Resources({ data }: { data: SiteData }) {
  const [category, setCategory] = useState('全部');
  const resources = data.resources.filter(r => r.enabled);
  const categories = ['全部', ...new Set([...resources.map(r => r.category), '方向介绍', '经验分享'])];
  const filtered = resources.filter(r => category === '全部' || r.category === category);
  return <>
    <div className="page-heading"><div><p className="eyebrow">资料与来源</p><h1>把有用的资料放在一起</h1></div>{data.meta.sheetUrl && <ExternalLink href={data.meta.sheetUrl} className="outline-button">共享资料库</ExternalLink>}</div>
    <div className="filter-strip" role="group" aria-label="资料分类">{categories.map(c => <button key={c} className={`chip ${category === c ? 'active' : ''}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c === '全部' ? '全部资料' : c}</button>)}</div>
    {filtered.length ? <div className="resource-grid">{filtered.map(r => <article className="resource-card" key={r.id}><div className="resource-icon"><Icon name="resources"/></div><div><span className="resource-category">{r.category}</span><h2><ExternalLink href={r.url}>{r.title}</ExternalLink></h2><p>{r.source}{r.publishedAt && ` · ${r.publishedAt}`}</p>{r.directionId && <span className="subtle">{data.directions.find(d => d.id === r.directionId)?.name}</span>}</div></article>)}</div> : <EmptyState title={`${category}资料待补充`}>后续会在这里整理相关介绍与经验。</EmptyState>}
    <section className="panel methodology"><h2>如何理解这些数字</h2><dl><div><dt>招生估算</dt><dd>按对应年度记录中每位博导的假设人数求和；初版每人1名。不能直接替代官方招生计划。</dd></div><div><dt>博导身份</dt><dd>以工程物理系博导汇总页为准，个人页是否注明不影响计数。网页间的名单差异另行列出。</dd></div><div><dt>年级去向</dt><dd>按本科入学年份标记年级。占位、填报中、已核实分别展示；多个录取机会不重复计入当前去向。</dd></div><div><dt>数据更新</dt><dd>展示已核对的发布快照，具体时间见页尾。共享资料库的编辑与查看权限由维护者单独设置。</dd></div></dl></section>
    <Notice>本资料库由年级同学整理。招生信息请结合对应年度的正式通知和导师确认情况阅读。</Notice>
  </>;
}
