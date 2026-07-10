import * as store from "./store.js";

const RECORDS_COL = 'mbti_records';

function cleanMbtiType(raw) {
  if (!raw) return '';
  return raw
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F\u3000\uFEFF\s]/g, '')
    .replace(/[-_][AT]$/, '')
    .replace(/[?]/g, '')
    .trim().toUpperCase();
}

const DIM_LABELS = ['communication', 'collaboration', 'problemSolving', 'projectManagement', 'learningAdaptability', 'responsibility', 'teamwork', 'challenge'];

const TENSION_MAP = {
  E: { communication: 1, collaboration: 1, teamwork: 1 },
  I: { problemSolving: 1, learningAdaptability: 1, projectManagement: 1 },
  N: { learningAdaptability: 1, problemSolving: 1, communication: 1 },
  S: { responsibility: 1, projectManagement: 1, collaboration: 1 },
  T: { problemSolving: 1, projectManagement: 1, responsibility: 1 },
  F: { communication: 1, collaboration: 1, teamwork: 1 },
  J: { projectManagement: 1, responsibility: 1, communication: 1 },
  P: { learningAdaptability: 1, challenge: 1, problemSolving: 1 }
};

function calcTension(mbtiType, scores) {
  const letters = mbtiType.split('');
  let totalScore = 0, totalWeight = 0;
  for (const letter of letters) {
    const map = TENSION_MAP[letter];
    if (!map) continue;
    for (const [dim, weight] of Object.entries(map)) {
      const val = (scores[dim] || 0) / 10;
      totalScore += val * weight;
      totalWeight += weight;
    }
  }
  return totalWeight ? +(totalScore / totalWeight).toFixed(4) : 0.5;
}

function computeMbtiAverages() {
  const SURVEY_COL = 'mbti_survey';
  const all = store.findAll(SURVEY_COL);
  const dims = DIM_LABELS;
  const sums = {};
  const counts = {};
  for (const s of all) {
    const type = cleanMbtiType(s.mbtiType);
    if (!type || !/^[IE][NS][TF][JP]$/.test(type)) continue;
    if (!sums[type]) { sums[type] = {}; counts[type] = 0 }
    for (const d of dims) {
      sums[type][d] = (sums[type][d] || 0) + (s.scores?.[d] || 0);
    }
    counts[type]++;
  }
  const result = {};
  for (const type of Object.keys(sums)) {
    result[type] = {};
    for (const d of dims) {
      result[type][d] = counts[type] ? +(sums[type][d] / counts[type]).toFixed(2) : 0;
    }
    result[type]._count = counts[type];
  }
  return result;
}

function calculateAdaptor(mbtiType, scores) {
  const cleanType = cleanMbtiType(mbtiType);
  if (!/^[IE][NS][TF][JP]$/.test(cleanType)) return '';

  const averages = computeMbtiAverages();
  const typeAvg = averages[cleanType];
  let mbtiResonance = 0;
  if (typeAvg) {
    let sum = 0, count = 0;
    for (const d of DIM_LABELS) {
      sum += (typeAvg[d] || 0) / 10;
      count++;
    }
    mbtiResonance = count ? +(sum / count).toFixed(4) : 0.5;
  } else {
    mbtiResonance = 0.5;
  }

  const defaultThresholds = {
    communication: 6, collaboration: 6, problemSolving: 7,
    projectManagement: 6, learningAdaptability: 6, responsibility: 7,
    teamwork: 6, challenge: 6
  };

  let totalRate = 0, dimCount = 0;
  for (const d of DIM_LABELS) {
    const personVal = scores[d] || 0;
    const threshold = defaultThresholds[d] || 6;
    const rate = threshold > 0 ? Math.min(personVal / threshold, 1) : 0;
    totalRate += rate;
    dimCount++;
  }
  const wcpaRate = dimCount ? +(totalRate / dimCount).toFixed(4) : 0;

  const tension = calcTension(cleanType, scores);
  const total = +(mbtiResonance * 0.3 + wcpaRate * 0.5 + tension * 0.2).toFixed(4);
  const pct = +(total * 100).toFixed(1);

  if (pct >= 85) return '天选共振者';
  if (pct >= 70) return '高潜适配者';
  if (pct >= 55) return '可塑协作者';
  if (pct >= 40) return '风险警示者';
  return '紧急干预对象';
}

const records = store.findAll(RECORDS_COL);
console.log(`共 ${records.length} 条记录`);

let updatedCount = 0;
for (const record of records) {
  const adaptor = calculateAdaptor(record.mbtiType, record.scores || {});
  if (record.adaptor !== adaptor) {
    store.updateById(RECORDS_COL, record._id, { adaptor });
    updatedCount++;
  }
}

console.log(`成功更新 ${updatedCount} 条记录的岗位能力适配值`);
console.log('更新完成！');
