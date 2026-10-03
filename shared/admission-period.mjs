// 年度记录保存博士入学年份；推免在此前一年，四年制本科对应入学前四年的年级。
export function admissionPeriod(admissionYear) {
  return {
    admissionYear,
    recommendationYear: admissionYear - 1,
    undergraduateCohort: admissionYear - 4,
    label: `${admissionYear - 1}年推免`,
  };
}
