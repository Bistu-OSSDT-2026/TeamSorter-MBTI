import express from "express";
import * as store from "./store.js";

const POSITIONS_COL = 'mbti_positions';

const defaultPositions = [
  {
    name: '项目管理岗', icon: '📋', color: '#8b5cf6',
    req: { communication: 6, collaboration: 6, problemSolving: 7, projectManagement: 9, learningAdaptability: 6, responsibility: 8, teamwork: 6, challenge: 6 },
    description: '负责项目整体规划、进度管控与资源协调'
  },
  {
    name: '技术研发岗', icon: '💻', color: '#3b82f6',
    req: { communication: 5, collaboration: 5, problemSolving: 9, projectManagement: 6, learningAdaptability: 8, responsibility: 7, teamwork: 5, challenge: 7 },
    description: '负责产品技术研发、架构设计与核心代码开发'
  },
  {
    name: '运营支持岗', icon: '📊', color: '#10b981',
    req: { communication: 7, collaboration: 8, problemSolving: 5, projectManagement: 5, learningAdaptability: 6, responsibility: 7, teamwork: 8, challenge: 5 },
    description: '负责日常运营维护、用户支持与流程优化'
  },
  {
    name: '市场拓展岗', icon: '🚀', color: '#f59e0b',
    req: { communication: 8, collaboration: 7, problemSolving: 6, projectManagement: 5, learningAdaptability: 6, responsibility: 5, teamwork: 6, challenge: 8 },
    description: '负责市场开拓、商务合作与品牌推广'
  },
  {
    name: '行政管理岗', icon: '📁', color: '#ec4899',
    req: { communication: 7, collaboration: 6, problemSolving: 5, projectManagement: 7, learningAdaptability: 5, responsibility: 8, teamwork: 6, challenge: 4 },
    description: '负责行政事务、制度管理与后勤保障'
  },
  {
    name: '设计创意岗', icon: '🎨', color: '#14b8a6',
    req: { communication: 6, collaboration: 6, problemSolving: 7, projectManagement: 4, learningAdaptability: 7, responsibility: 5, teamwork: 6, challenge: 8 },
    description: '负责视觉设计、UI/UX与创意策划'
  },
  {
    name: '数据分析岗', icon: '📈', color: '#6366f1',
    req: { communication: 5, collaboration: 5, problemSolving: 8, projectManagement: 5, learningAdaptability: 7, responsibility: 6, teamwork: 5, challenge: 6 },
    description: '负责数据采集、分析建模与决策支持'
  },
  {
    name: '客户服务岗', icon: '💬', color: '#f43f5e',
    req: { communication: 9, collaboration: 7, problemSolving: 6, projectManagement: 4, learningAdaptability: 6, responsibility: 7, teamwork: 7, challenge: 5 },
    description: '负责客户咨询、投诉处理与满意度管理'
  },
];

store.dropCol(POSITIONS_COL);
const inserted = store.insertMany(POSITIONS_COL, defaultPositions);
console.log(`成功导入 ${inserted.length} 个岗位到数据库`);
console.log('岗位列表:');
inserted.forEach(p => {
  const reqStr = Object.entries(p.req).map(([k, v]) => `${k}=${v}`).join(', ');
  console.log(`  ${p.icon} ${p.name}: ${reqStr}`);
});
