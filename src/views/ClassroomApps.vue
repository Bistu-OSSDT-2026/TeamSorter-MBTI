<template>
  <div class="apps-container">
    
    <div class="apps-header">
      <div class="header-content">
        <h2 class="page-title">🧩 课堂 AI 应用中心</h2>
        <p class="page-subtitle">精选中学全科 AI 互动教具，一键启动，即开即用</p>
      </div>
      
      <div class="filter-scroll">
        <div class="filter-bar">
          <div 
            v-for="sub in subjects" 
            :key="sub"
            class="filter-item"
            :class="{ active: currentSubject === sub }"
            @click="currentSubject = sub"
          >
            {{ sub }}
          </div>
        </div>
      </div>
    </div>

    <div class="apps-grid">
      <transition-group name="list">
        <div 
          v-for="app in filteredApps" 
          :key="app.id" 
          class="app-card"
          @click="handleAppClick(app)"
        >
          <div class="card-top">
            <div class="icon-wrapper" :class="app.colorClass">
              <span class="app-icon">{{ app.icon }}</span>
            </div>
            <span class="subject-tag">{{ app.subject }}</span>
          </div>

          <div class="card-content">
            <h3 class="app-title">{{ app.title }}</h3>
            <p class="app-desc">{{ app.desc }}</p>
          </div>

          <div class="card-footer">
            <span class="status-dot"></span>
            <span class="action-text">新窗口启动</span>
            <el-icon class="arrow-icon"><TopRight /></el-icon>
          </div>
        </div>
      </transition-group>
    </div>

    <div v-if="filteredApps.length === 0" class="empty-state">
      <div class="empty-icon">🚧</div>
      <p>该学科应用正在开发中，敬请期待...</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { TopRight } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- 基础数据配置 ---
const subjects = ['全部', '物理', '化学', '数学', '生物', '地理', '历史', '语文', '英语'];
const currentSubject = ref('全部');

// --- 模拟应用数据 (您可以后续替换为真实 URL) ---
const apps = [
  // 物理
  { id: 1, subject: '物理', title: '动能势能转化', icon: '🎢', desc: '模拟过山车模型，实时展示机械能守恒数据变化。', url: 'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_zh_CN.html', colorClass: 'bg-blue' },
  { id: 2, subject: '物理', title: '电路搭建实验室', icon: '💡', desc: '自由拖拽电池、灯泡、电阻，模拟串并联电路。', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_zh_CN.html', colorClass: 'bg-blue' },
  { id: 3, title: '凸透镜成像', subject: '物理', icon: '🔍', desc: '拖动物距与像距，自动生成光路图与成像虚实。', url: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_zh_CN.html', colorClass: 'bg-blue' },
  
  // 化学
  { id: 4, subject: '化学', title: '分子结构构建', icon: '🧪', desc: '3D 视角搭建有机分子，直观理解化学键与空间构型。', url: 'https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light_zh_CN.html', colorClass: 'bg-green' },
  { id: 5, subject: '化学', title: '化学实验室', icon: '💧', desc: '模拟化学实验室器材，进行各种实验。', url: 'https://hx-app.nobook.com/', colorClass: 'bg-green' },
  

  // 数学
  { id: 7, subject: '数学', title: '函数图像生成器', icon: '📈', desc: '输入解析式即刻生成图像，支持参数 k/b 动态调整。', url: 'https://www.geogebra.org/calculator', colorClass: 'bg-purple' },
  { id: 8, subject: '数学', title: '立体几何画板', icon: '🧊', desc: '3D 空间绘制几何体，支持展开图与截面观察。', url: '/ClassRoom/hand.html', colorClass: 'bg-purple' },

  // 生物
  { id: 9, subject: '生物', title: '细胞有丝分裂', icon: '🧬', desc: '显微镜视角演示细胞分裂各时期染色体行为。', url: '/ClassRoom/biology.html', colorClass: 'bg-teal' },
  { id: 10, subject: '生物', title: '人体循环系统', icon: '🫀', desc: '人体模型，追踪血液在心脏与血管中的流动。', url: '/ClassRoom/blood.html', colorClass: 'bg-teal' },

  // 地理
  { id: 11, subject: '地理', title: '等高线地形图', icon: '🏔️', desc: '从山体模型自动生成等高线，理解山脊山谷特征。', url: '/ClassRoom/hight.html', colorClass: 'bg-orange' },
  { id: 12, subject: '地理', title: '太阳直射点移动', icon: '☀️', desc: '模拟四季变化与昼夜长短，观察地球公转影响。', url: '/ClassRoom/sun.html', colorClass: 'bg-orange' },

  // 历史/人文
  { id: 13, subject: '历史', title: '世界历史地图', icon: '🐪', desc: '世界历史地图，时间轴交互观看', url: '/ClassRoom/history.html', colorClass: 'bg-red' },
  { id: 14, subject: '语文', title: '古诗词意境生成', icon: '🎑', desc: '输入诗句，AI 自动生成对应的水墨意境动画。', url: '', colorClass: 'bg-cyan' },
];

// --- 逻辑处理 ---
const filteredApps = computed(() => {
  if (currentSubject.value === '全部') return apps;
  return apps.filter(app => app.subject === currentSubject.value);
});

// 点击卡片，新窗口打开
const handleAppClick = (app) => {
  if (app.url) {
    // 如果有链接，直接打开
    window.open(app.url, '_blank');
  } else {
    // 如果没有链接（占位符），提示用户
    ElMessage.info(`【${app.title}】正在部署中，即将上线...`);
  }
};
</script>

<style scoped>
/* 全局容器 */
.apps-container {
  height: 100%;
  padding: 0 40px;
  background-color: #f8fafc;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* 顶部 Header */
.apps-header {
  padding: 30px 0 20px;
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 10;
  /* 增加底部渐变遮罩，让滚动更自然 */
  background: linear-gradient(180deg, #f8fafc 80%, rgba(248,250,252,0) 100%);
}

.header-content { margin-bottom: 20px; }
.page-title { margin: 0 0 8px 0; color: #1e293b; font-size: 28px; font-weight: 800; }
.page-subtitle { margin: 0; color: #64748b; font-size: 14px; }

/* 筛选器 */
.filter-scroll { overflow-x: auto; padding-bottom: 5px; /* 隐藏滚动条 */ }
.filter-scroll::-webkit-scrollbar { display: none; }

.filter-bar {
  display: flex; gap: 10px; flex-wrap: wrap;
}
.filter-item {
  padding: 8px 24px;
  border-radius: 20px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.filter-item:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}
.filter-item.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transform: translateY(-1px);
}

/* 卡片网格 */
.apps-grid {
  display: grid;
  /* 响应式 Grid：最小宽度 260px，自动填充 */
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 24px;
  padding-bottom: 60px;
}

/* 卡片样式 */
.app-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  height: 200px; /* 固定高度，整齐划一 */
}

.app-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 15px 30px -5px rgba(0,0,0,0.1);
  border-color: #e0e7ff;
}

/* 顶部图标与标签 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.icon-wrapper {
  width: 56px; height: 56px;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px;
  transition: transform 0.3s;
}
.app-card:hover .icon-wrapper { transform: scale(1.1) rotate(5deg); }

/* 图标背景色配置 */
.bg-blue   { background: #eff6ff; color: #3b82f6; }
.bg-green  { background: #f0fdf4; color: #22c55e; }
.bg-purple { background: #f3e8ff; color: #a855f7; }
.bg-teal   { background: #ccfbf1; color: #14b8a6; }
.bg-orange { background: #ffedd5; color: #f97316; }
.bg-red    { background: #fef2f2; color: #ef4444; }
.bg-cyan   { background: #ecfeff; color: #06b6d4; }

.subject-tag {
  font-size: 12px;
  color: #94a3b8;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 10px;
  font-weight: 600;
}

/* 内容 */
.card-content { flex: 1; }
.app-title {
  margin: 0 0 8px 0;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}
.app-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  /* 限制两行文本 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 底部 Action */
.card-footer {
  display: flex; align-items: center; justify-content: flex-end;
  margin-top: auto; gap: 6px;
  opacity: 0.6;
  transition: all 0.3s;
}
.app-card:hover .card-footer { opacity: 1; color: #3b82f6; }

.action-text { font-size: 12px; font-weight: 600; }
.status-dot {
  width: 6px; height: 6px; background: #22c55e; border-radius: 50%;
  margin-right: auto; /* 把其他元素推到右边 */
}

/* 空状态 */
.empty-state {
  text-align: center; padding: 60px 0;
  color: #94a3b8;
}
.empty-icon { font-size: 64px; margin-bottom: 10px; opacity: 0.5; }

/* 列表过渡动画 */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
/* 确保离开的元素脱离文档流，让后面的元素平滑补位 */
.list-leave-active { position: absolute; }
</style>