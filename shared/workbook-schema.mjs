// 工作簿字段映射的唯一入口。增加列时同步扩展类型、校验和迁移说明。
export const TABLES = {
  directions: { sheet: '方向字典', columns: {
    id: '方向编号', name: '方向名称', parent: '上级单位', url: '官网链接', order: '排序', enabled: '是否启用',
  } },
  teachers: { sheet: '导师资料', columns: {
    id: '导师编号', name: '姓名', position: '职务', directionId: '方向编号', doctoral: '博导汇总列入', checkedAt: '核对日期', url: '个人页链接', sourceUrl: '博导依据链接', note: '异常备注',
  } },
  admissions: { sheet: '年度招生', columns: {
    year: '博士入学年度', teacherId: '导师编号', eligible: '该年度博导列入', assumed: '假设人数', confirmed: '确认计划', actual: '实际人数', scope: '适用口径', sourceUrl: '来源链接', updatedAt: '更新时间',
  } },
  outcomes: { sheet: '去向汇总', columns: {
    id: '记录编号', cohort: '本科入学年级', pathway: '路径', relation: '与清华的关系', institutionType: '机构类型', institution: '接收单位', department: '接收院系', directionId: '本系方向编号', research: '研究方向', count: '人数', resultStatus: '结果状态', dataStatus: '统计状态', source: '来源', updatedAt: '更新时间',
  } },
  resources: { sheet: '资料索引', columns: {
    id: '资料编号', title: '标题', category: '类别', directionId: '相关方向编号', url: '链接', publishedAt: '发布日期', source: '来源', enabled: '是否启用',
  } },
};
export const CONFIG = {
  schemaVersion: ['数据格式版本', 1, '固定为1；结构改变时需要迁移'],
  siteName: ['网站名称', '工物推研信息库', '显示在网站顶部'],
  defaultYear: ['默认博士入学年度', 2028, '填博士入学年；2028对应2027年推免、2024级参考；须有招生记录'],
  defaultCohort: ['默认本科入学年级', 2023, '这里是上一届去向统计年级；当前参考年级为2024级'],
  teacherCheckedAt: ['师资核对日期', '2026-10-03', '师资名单的来源日期'],
  outcomeStatus: ['去向统计状态', '初始占位', '初始占位／填报中／已核实；每一届可用去向行的统计状态区分'],
  cohortSize: ['年级总人数', null, '未知留空；对应默认年级'],
  reportedCount: ['已填报人数', null, '未知留空；对应默认年级'],
  sheetUrl: ['腾讯文档链接', '', '只填希望展示的共享文档链接；可留空'],
};
export const PATHWAYS = ['直博', '硕士', '就业', '其他', '待定'];
export const RELATIONS = ['工物系', '清华其他单位', '校外'];
export const INSTITUTION_TYPES = ['高校', '科研院所', '企业', '其他'];
export const RESULT_STATUSES = ['意向', '拟录取', '正式录取', '已就业', '待定'];
export const DATA_STATUSES = ['初始占位', '填报中', '已核实'];
