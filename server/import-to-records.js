import XLSX from "xlsx";
import * as store from "./store.js";

const RECORDS_COL = 'mbti_records';
const filePath = "E:\\issue3\\test3\\test1_0119\\test1\\server\\uploads\\mbti1.xlsx";

console.log(`读取文件: ${filePath}`);
const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
console.log(`共 ${data.length} 行数据`);

const keys = Object.keys(data[0] || {});
const getName = (row) => { for (const k of keys) { if (k.includes('姓名')) return String(row[k]).trim() } return '' };
const getMbti = (row) => { for (const k of keys) { if (k.toLowerCase().includes('mbti')) return String(row[k]).trim().toUpperCase() } return '' };
const getScore = (row, key) => { const raw = row[key]; if (raw === undefined || raw === '') return 0; const n = Number(String(raw).trim()); return isNaN(n) ? 0 : n };

const list = data.map(row => {
  const name = getName(row);
  if (!name) return null;
  const mbtiType = getMbti(row);
  if (!mbtiType) return null;
  const ei = mbtiType[0];
  return {
    name,
    mbtiType,
    ei,
    scores: {
      communication: getScore(row, '沟通表达'),
      collaboration: getScore(row, '社交协助'),
      problemSolving: getScore(row, '解决问题'),
      projectManagement: getScore(row, '项目管理'),
      learningAdaptability: getScore(row, '学习适应'),
      responsibility: getScore(row, '承担责任意愿') || getScore(row, '承担责任'),
      teamwork: getScore(row, '团队贡献意愿'),
      challenge: getScore(row, '接受挑战意愿')
    },
    tags: ['mbti1']
  };
}).filter(Boolean);

console.log(`有效数据 ${list.length} 条`);

store.dropCol(RECORDS_COL);
const inserted = store.insertMany(RECORDS_COL, list);
console.log(`成功导入 ${inserted.length} 条记录到人格档案`);

console.log("\n导入完成");
