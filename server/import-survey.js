import XLSX from "xlsx";
import * as store from "./store.js";

const SURVEY_COL = 'mbti_survey';
const FILES = ["D:\\Desktop\\mbti1.xlsx", "D:\\Desktop\\mbti2.xlsx"];

for (const filePath of FILES) {
  console.log(`\n读取文件: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  console.log(`  共 ${data.length} 行数据`);

  const keys = Object.keys(data[0] || {});
  const getName = (row) => { for (const k of keys) { if (k.includes('姓名')) return String(row[k]).trim() } return '' };
  const getMbti = (row) => { for (const k of keys) { if (k.toLowerCase().includes('mbti')) return String(row[k]).trim().toUpperCase() } return '' };
  const getScore = (row, key) => { const raw = row[key]; if (raw === undefined || raw === '') return 0; const n = Number(String(raw).trim()); return isNaN(n) ? 0 : n };

  const list = data.map(row => {
    const name = getName(row);
    if (!name) return null;
    return {
      source: filePath.includes('mbti1') ? 'mbti1' : 'mbti2',
      submitTime: String(row['提交时间'] || row['提交'] || ''),
      fillId: String(row['填写ID'] || ''),
      duration: String(row['用时(秒)'] || row['用时'] || ''),
      phone: String(row['手机号'] || ''),
      name,
      studentId: String(row['学号'] || ''),
      college: String(row['学院'] || ''),
      major: String(row['专业'] || ''),
      mbtiType: getMbti(row),
      scores: {
        communication: getScore(row, '沟通表达'),
        collaboration: getScore(row, '社交协作'),
        problemSolving: getScore(row, '解决问题'),
        projectManagement: getScore(row, '项目管理'),
        learningAdaptability: getScore(row, '学习适应'),
        responsibility: getScore(row, '承担责任意愿') || getScore(row, '承担责任'),
        teamwork: getScore(row, '团队合作意愿'),
        challenge: getScore(row, '接受挑战意愿')
      },
      preferences: {
        activity: String(row['活动参与偏好'] || ''),
        activityType: String(row['活动类型偏好'] || ''),
        hobby: String(row['业余兴趣'] || '')
      }
    };
  }).filter(Boolean);

  console.log(`  有效数据 ${list.length} 条`);
  store.deleteMany(SURVEY_COL, { source: list[0]?.source });
  const inserted = store.insertMany(SURVEY_COL, list);
  console.log(`  ✅ 导入 ${inserted.length} 条记录`);
}

console.log("\n全部导入完成");
