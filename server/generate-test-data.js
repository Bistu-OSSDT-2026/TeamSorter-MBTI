import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'mbti_records.json');

const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹', '易', '黎', '常', '武', '乔', '贺', '赖', '龚', '文'];
const givenNames = ['伟', '芳', '娜', '敏', '静', '强', '磊', '洋', '勇', '军', '丽', '平', '涛', '斌', '杰', '敏', '婷', '超', '鹏', '亮', '辉', '燕', '浩', '鑫', '宇', '欣', '凯', '佳', '宁', '洁', '婷', '雪', '蕾', '琳', '慧', '颖', '霞', '芳', '薇', '静', '妍', '萱', '怡', '琪', '璇', '曦', '玥', '萱', '涵', '雨', '萱', '萌', '欣', '诺', '妍', '彤', '琪', '芮', '琳', '嘉', '懿', '梓', '欣', '婧', '怡', '玥', '茹', '瑶', '萱', '涵', '婷', '琳', '洁', '颖', '欣', '蓉', '燕', '艳', '红', '娟', '英', '华', '萍', '霞', '兰', '桂', '珍', '珠', '翠', '香', '莲', '菊', '娥', '凤', '梅', '兰', '竹', '菊', '琴', '棋', '书', '画'];

const mbtiTypes = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 1) {
  return +(Math.random() * (max - min) + min).toFixed(decimals);
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName() {
  const surname = randomItem(surnames);
  const givenName = Math.random() > 0.7 ? randomItem(givenNames) + randomItem(givenNames) : randomItem(givenNames);
  return surname + givenName;
}

function calcAdaptor(scores) {
  const sum = Object.values(scores).reduce((a, b) => a + b, 0);
  const avg = sum / 8;
  if (avg >= 8.5) return '天选共振者';
  if (avg >= 7) return '高潜适配者';
  if (avg >= 5.5) return '可塑协作者';
  if (avg >= 4) return '风险警示者';
  return '紧急干预对象';
}

function generateRecord(id) {
  const mbtiType = randomItem(mbtiTypes);
  const ei = mbtiType[0];
  const scores = {
    communication: randomFloat(0, 10),
    collaboration: randomFloat(0, 10),
    problemSolving: randomFloat(0, 10),
    projectManagement: randomFloat(0, 10),
    learningAdaptability: randomFloat(0, 10),
    responsibility: randomFloat(0, 10),
    teamwork: randomFloat(0, 10),
    challenge: randomFloat(0, 10)
  };
  const adaptor = calcAdaptor(scores);
  
  return {
    _id: String(id),
    name: generateName(),
    mbtiType,
    ei,
    scores,
    tags: ['test'],
    adaptor,
    createdAt: new Date().toISOString()
  };
}

function main() {
  let existing = [];
  if (fs.existsSync(RECORDS_FILE)) {
    existing = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
  }
  
  const startId = Date.now();
  const records = [];
  
  for (let i = 0; i < 100; i++) {
    records.push(generateRecord(startId + i));
  }
  
  const allRecords = [...existing, ...records];
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(allRecords, null, 2), 'utf-8');
  
  console.log(`Generated ${records.length} test records. Total records: ${allRecords.length}`);
}

main();
