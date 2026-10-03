import { useState } from 'react';
import type { SiteData, Teacher } from '../types';
import { admissionSummary } from '../../shared/statistics.mjs';
import { admissionPeriod } from '../../shared/admission-period.mjs';
import { Metric, Notice, ExternalLink, YearSelect, EmptyState } from '../components/Common';

function TeacherRow({ teacher, assumed, confirmed, actual }: { teacher: Teacher; assumed: number; confirmed: number | null; actual: number | null }) {
  return <li className="teacher-row"><div><ExternalLink href={teacher.url}>{teacher.name}</ExternalLink><span className="teacher-position">{teacher.position}</span></div><div className="teacher-count">估算 <strong>{assumed}</strong> 人</div>{(confirmed !== null || actual !== null) && <p>确认计划：{confirmed ?? '待补充'}；实际人数：{actual ?? '待补充'}</p>}{teacher.note && <p className="teacher-note">{teacher.note}</p>}</li>;
}

export function Directions({ data, year, setYear }: { data: SiteData; year: number; setYear: (y: number) => void }) {
  const [group, setGroup] = useState('全部');
  const years = [...new Set(data.admissions.map(a => a.year))].sort((a, b) => b - a);
  const stats = admissionSummary(data, year);
  const period = admissionPeriod(year);
  const directions = data.directions.filter(d => d.enabled).sort((a, b) => a.order - b.order);
  const groups = ['全部', ...new Set(directions.map(d => d.parent))];
  const teacherMap = new Map(data.teachers.map(t => [t.id, t]));
  const exceptional = data.teachers.filter(t => t.note.includes('汇总页未列入'));
  return <>
    <div className="page-heading"><div><p className="eyebrow">方向与招生</p><h1>找到想了解的方向</h1></div><YearSelect label="推免年度" value={year} years={years} onChange={setYear} formatYear={y => admissionPeriod(y).label}/></div>
    <section className="overview-panel" aria-label="招生年度概览"><div className="primary-metric"><span>博士招生估算</span><p>{stats.assumed}<small>人</small></p><span>按年度名单中每位博导的假设人数计算</span></div><div className="metrics-grid"><Metric label="年度博导" value={stats.doctoral} unit="位"/><Metric label="确认计划" value={stats.confirmed.total ?? '待补充'} unit={stats.confirmed.total === null ? undefined : '人'} note={`已填 ${stats.confirmed.knownCount}/${stats.confirmed.totalCount} 位`}/><Metric label="实际人数" value={stats.actual.total ?? '待补充'} unit={stats.actual.total === null ? undefined : '人'} note={`已填 ${stats.actual.knownCount}/${stats.actual.totalCount} 位`}/></div></section>
    <Notice><strong>{period.undergraduateCohort}级参考：{period.label}，{period.admissionYear}年博士入学。</strong> 估算用于了解方向规模。它不是官方招生计划，也不代表全部名额面向本系本科生。师资快照：{data.meta.teacherCheckedAt}。</Notice>
    <section className="section-heading"><div><h2>按方向查看</h2><p>展开方向，查看导师与名额。</p></div><span className="subtle">{directions.length} 个方向</span></section>
    <div className="filter-strip" role="group" aria-label="筛选研究所">{groups.map(g => <button key={g} className={group === g ? 'chip active' : 'chip'} aria-pressed={group === g} onClick={() => setGroup(g)}>{g === '全部' ? '全部方向' : g}</button>)}</div>
    <div className="direction-grid">{directions.filter(d => group === '全部' || d.parent === group).map(d => {
      const s = admissionSummary(data, year, d.id);
      return <details className="direction-card" key={d.id}><summary><div className="direction-label"><span className="direction-parent">{d.parent}</span><h3>{d.name}</h3><span className="subtle">{s.doctoral} 位博导<span className="dot-separator">·</span>查看导师</span></div><div className="direction-number"><strong>{s.assumed}</strong><span>估算名额</span></div><span className="details-chevron" aria-hidden="true">⌄</span></summary><div className="direction-details"><div className="direction-submetrics"><span>确认计划：{s.confirmed.total ?? '待补充'}</span><span>实际人数：{s.actual.total ?? '待补充'}</span></div>{s.rows.length ? <ul className="teacher-list">{s.rows.map(r => <TeacherRow key={r.teacherId} teacher={teacherMap.get(r.teacherId)!} assumed={r.assumed} confirmed={r.confirmed} actual={r.actual}/>)}</ul> : <EmptyState title="该年度尚无记录">请等待维护者补充。</EmptyState>}<ExternalLink href={d.url}>查看官网方向名单</ExternalLink></div></details>;
    })}</div>
    {exceptional.length > 0 && <details className="exception-panel"><summary>名单差异与统计口径 <span>{exceptional.length} 项</span></summary><div>{exceptional.map(t => <p key={t.id}><ExternalLink href={t.url}>{t.name}</ExternalLink>（{t.position}）：{t.note}</p>)}<p>博导身份以系官网汇总页为准；职务以“职称”入口的个人页为准。<ExternalLink href="https://www.ep.tsinghua.edu.cn/szdw/bssds1.htm">博导汇总页</ExternalLink></p></div></details>}
  </>;
}
