import { useState } from 'react';
import type { SiteData } from '../types';
import { outcomeSummary } from '../../shared/statistics.mjs';
import { PATHWAYS } from '../../shared/workbook-schema.mjs';
import { Metric, Notice, YearSelect, EmptyState } from '../components/Common';

export function Outcomes({ data, cohort, setCohort }: { data: SiteData; cohort: number; setCohort: (y: number) => void }) {
  const [pathway, setPathway] = useState('直博');
  const years = [...new Set(data.outcomes.map(o => o.cohort))].sort((a, b) => b - a);
  const summary = outcomeSummary(data, cohort);
  const selected = summary.rows.filter(r => r.pathway === pathway);
  const isPlaceholder = summary.status === '初始占位';
  const totalFor = (key: string, value: string) => selected.filter(r => r[key as keyof typeof r] === value).reduce((s, r) => s + r.count, 0);
  const directions = data.directions.filter(d => d.enabled).sort((a, b) => a.order - b.order);
  return <>
    <div className="page-heading"><div><p className="eyebrow">年级去向</p><h1>看看上一届的选择</h1></div><YearSelect label="本科入学年级" value={cohort} years={years} onChange={setCohort} suffix="级"/></div>
    <Notice tone={isPlaceholder ? 'amber' : 'neutral'}>{isPlaceholder ? <><strong>初始占位，尚未填报。</strong> 当前0人不代表实际无人选择；信息更新后将显示填报状态。</> : <><strong>当前状态：{summary.status}。</strong> {summary.percentage ? '已覆盖全年级，可查看人数比例。' : '统计范围尚未完整确认，暂不显示全年级比例。'}</>}</Notice>
    <div className="cohort-caption"><span>{cohort}级 · {cohort}年入学</span><span className={`status-badge ${isPlaceholder ? 'amber' : ''}`}>{summary.status}</span></div>
    <section className="outcome-metrics" aria-label="去向统计覆盖"><Metric label="年级总人数" value={summary.size ?? '待补充'} unit={summary.size === null ? undefined : '人'}/><Metric label="已填报人数" value={summary.reported ?? '待补充'} unit={summary.reported === null ? undefined : '人'}/><Metric label={isPlaceholder ? '占位人数合计' : '当前去向人数'} value={summary.total} unit="人"/></section>
    <section className="section-heading"><div><h2>升学与就业路径</h2><p>{isPlaceholder ? '所有人数均为初始占位。' : '每人只计入一种当前去向。'}</p></div></section>
    <div className="pathway-grid" role="group" aria-label="选择升学就业路径">{PATHWAYS.map(p => {
      const count = summary.rows.filter(r => r.pathway === p).reduce((s, r) => s + r.count, 0);
      return <button className={`pathway-card ${pathway === p ? 'active' : ''}`} key={p} aria-pressed={pathway === p} onClick={() => setPathway(p)}><span>{p}</span><strong>{count}<small>人</small></strong>{summary.percentage && <span>{(count / summary.size! * 100).toFixed(1)}%</span>}</button>;
    })}</div>
    <section className="section-heading"><div><h2>{pathway}去向</h2><p>校内外归属与机构类型分别统计。</p></div></section>
    <div className="relation-grid">{['工物系', '清华其他单位', '校外'].map(r => <Metric key={r} label={r} value={totalFor('relation', r)} unit="人"/>)}</div>
    {(pathway === '直博' || pathway === '硕士') && <section className="panel"><div className="panel-title"><h3>本系方向分布</h3><span className="subtle">{isPlaceholder ? '初始占位' : '按方向汇总'}</span></div><div className="outcome-directions">{directions.map(d => {
      const count = selected.filter(r => r.relation === '工物系' && r.directionId === d.id).reduce((s, r) => s + r.count, 0);
      return <div key={d.id}><span>{d.name}</span><strong>{count}<small>人</small></strong></div>;
    })}</div></section>}
    <section className="panel"><div className="panel-title"><h3>接收单位与研究方向</h3><span className="subtle">{pathway}</span></div>{selected.some(r => r.count > 0 && r.dataStatus !== '初始占位') ? <ul className="destination-list">{selected.filter(r => r.count > 0 && r.dataStatus !== '初始占位').map(r => <li key={r.id}><div><strong>{r.institution || r.relation}</strong><span>{[r.department, r.research].filter(Boolean).join(' · ') || '方向待补充'}</span><span className="subtle">{r.institutionType} · {r.resultStatus} · {r.dataStatus}</span></div><strong className="destination-count">{r.count}<small>人</small></strong></li>)}</ul> : <EmptyState title="接收单位信息待补充">填报后可在这里查看院系、院所与研究方向。</EmptyState>}</section>
  </>;
}
