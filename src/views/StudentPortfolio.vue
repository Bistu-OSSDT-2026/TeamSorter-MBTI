<template>
  <div class="portfolio-container">
    
    <div class="top-bar">
      <div class="left-action">
        <div class="page-back-btn" @click="$router.push('/')">
          <el-icon><ArrowLeft /></el-icon> 返回首页
        </div>
        <h2 class="page-title">📂 学生成长电子档案</h2>
      </div>
      
      <div class="search-box">
        <el-input 
          v-model="searchKey" 
          placeholder="搜索姓名或学号..." 
          prefix-icon="Search"
          clearable
          style="width: 260px"
        />
        <el-button type="primary" icon="Filter">筛选</el-button>
      </div>
    </div>

    <div class="card-grid">
      <div 
        v-for="student in filteredStudents" 
        :key="student.id" 
        class="student-card"
        @click="openProfile(student)"
      >
        <div class="card-header-bg" :class="getRandomGradient(student.id)"></div>
        
        <div class="card-content">
          <el-avatar :size="64" class="student-avatar" :style="{ backgroundColor: getAvatarColor(student.id) }">
            {{ student.name.charAt(student.name.length - 1) }}
          </el-avatar>
          
          <div class="student-info">
            <h3 class="name">{{ student.name }}</h3>
            <span class="id-num">学号: {{ student.studentId }}</span>
          </div>

          <div class="tags-row">
            <el-tag size="small" :type="student.score > 90 ? 'success' : 'warning'" effect="light">
              {{ student.score > 90 ? '🌟 模范生' : '📈 潜力股' }}
            </el-tag>
            <el-tag size="small" type="info" effect="light">{{ student.role }}</el-tag>
          </div>

          <div class="mini-stats">
            <div class="stat-item">
              <span class="label">综合分</span>
              <span class="val">{{ student.score }}</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="label">班级排名</span>
              <span class="val">#{{ student.rank }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-drawer
      v-model="drawerVisible"
      title="学生详细档案"
      size="50%"
      :destroy-on-close="true"
      class="profile-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <span class="drawer-title">👤 学生成长档案</span>
          <el-button type="primary" link icon="Edit">编辑资料</el-button>
        </div>
      </template>

      <div v-if="currentStudent" class="profile-content">
        
        <div class="profile-header">
          <el-avatar :size="80" :style="{ backgroundColor: getAvatarColor(currentStudent.id) }" class="big-avatar">
            {{ currentStudent.name.charAt(currentStudent.name.length - 1) }}
          </el-avatar>
          <div class="header-info">
            <h2>{{ currentStudent.name }} <span class="gender-icon">{{ currentStudent.gender === '男' ? '♂' : '♀' }}</span></h2>
            <p>三年级二班 | 学号：{{ currentStudent.studentId }} | 班级职务：{{ currentStudent.role }}</p>
            <div class="badges">
              <span class="badge">🏆 三好学生</span>
              <span class="badge">🎨 小小画家</span>
              <span class="badge">🏃‍♂️ 运动达人</span>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="section">
          <div class="section-title">📊 综合素质评价 (五育)</div>
          <div class="ability-grid">
            <div class="ability-item" v-for="(val, key) in currentStudent.abilities" :key="key">
              <span class="ability-label">{{ key }}</span>
              <el-progress 
                :percentage="val" 
                :color="getAbilityColor(val)" 
                :stroke-width="10"
              />
            </div>
          </div>
        </div>

        <el-divider />

        <div class="section">
          <div class="section-title">📈 学期成绩追踪</div>
          <div class="score-cards">
            <div class="score-box">
              <span>语文</span>
              <strong>{{ currentStudent.scores.chinese }}</strong>
            </div>
            <div class="score-box">
              <span>数学</span>
              <strong>{{ currentStudent.scores.math }}</strong>
            </div>
            <div class="score-box">
              <span>英语</span>
              <strong>{{ currentStudent.scores.english }}</strong>
            </div>
            <div class="score-box highlight">
              <span>平均分</span>
              <strong>{{ Math.round((currentStudent.scores.chinese + currentStudent.scores.math + currentStudent.scores.english)/3) }}</strong>
            </div>
          </div>
        </div>

        <el-divider />

        <div class="section">
          <div class="section-title">🌱 成长足迹</div>
          <el-timeline>
            <el-timeline-item timestamp="2023-12-01" placement="top" type="primary">
              <el-card shadow="never" class="timeline-card">
                <h4>获得“阅读之星”称号</h4>
                <p>在校园读书节活动中表现优异，累计阅读时长超过50小时。</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2023-11-15" placement="top" color="#0bbd87">
              <el-card shadow="never" class="timeline-card">
                <h4>期中考试进步显著</h4>
                <p>数学成绩较上次月考提升了 15 分，值得表扬。</p>
              </el-card>
            </el-timeline-item>
            <el-timeline-item timestamp="2023-10-20" placement="top">
              <p>参加秋季运动会，获得男子100米第三名。</p>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="section">
          <div class="section-title">👩‍🏫 教师寄语</div>
          <div class="teacher-comment">
            <p>{{ currentStudent.comment }}</p>
            <div class="sign">—— 班主任：王老师</div>
          </div>
        </div>

      </div>
    </el-drawer>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
// 🔥 修改：移除了未使用的 useRouter 引入
// import { useRouter } from 'vue-router'; 
import { ArrowLeft } from '@element-plus/icons-vue';

// 🔥 修改：移除了 const router = useRouter(); 因为模板里直接用了 $router 或者没用到
const searchKey = ref('');
const drawerVisible = ref(false);
const currentStudent = ref(null);
const students = ref([]);

// --- 1. 模拟数据生成器 ---
const generateStudents = () => {
  const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨'];
  const names = ['子涵', '梓萱', '浩宇', '一诺', '宇轩', '欣怡', '博文', '诗涵', '子轩', '雨桐', '泽宇', '佳宜'];
  const roles = ['班长', '学习委员', '体育委员', '小组长', '学生', '学生', '学生', '学生'];
  
  const list = [];
  for (let i = 1; i <= 35; i++) {
    const name = surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
    list.push({
      id: i,
      studentId: `20230${i < 10 ? '0' + i : i}`,
      name: name,
      gender: Math.random() > 0.5 ? '男' : '女',
      role: roles[Math.floor(Math.random() * roles.length)],
      score: Math.floor(Math.random() * (100 - 75) + 75), // 75-100分
      rank: i,
      // 五育分数
      abilities: {
        '德 (Moral)': Math.floor(Math.random() * 20 + 80),
        '智 (Intellect)': Math.floor(Math.random() * 30 + 70),
        '体 (Physical)': Math.floor(Math.random() * 40 + 60),
        '美 (Art)': Math.floor(Math.random() * 20 + 80),
        '劳 (Labor)': Math.floor(Math.random() * 10 + 90),
      },
      // 成绩
      scores: {
        chinese: Math.floor(Math.random() * 20 + 80),
        math: Math.floor(Math.random() * 30 + 70),
        english: Math.floor(Math.random() * 25 + 75),
      },
      comment: `${name}同学在校表现${Math.random() > 0.5 ? '非常优秀' : '良好'}，${Math.random() > 0.5 ? '能够积极主动地完成学习任务，' : '思维活跃，但有时上课容易走神，'}希望在接下来的学习中继续保持热情，加强自律，争取更大的进步！`
    });
  }
  students.value = list;
};

// --- 2. 逻辑方法 ---

// 筛选逻辑
const filteredStudents = computed(() => {
  if (!searchKey.value) return students.value;
  return students.value.filter(s => s.name.includes(searchKey.value) || s.studentId.includes(searchKey.value));
});

// 打开详情
const openProfile = (student) => {
  currentStudent.value = student;
  drawerVisible.value = true;
};

// 辅助样式方法
const getAvatarColor = (id) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#8e44ad', '#16a085'];
  return colors[id % colors.length];
};

const getRandomGradient = (id) => {
  const gradients = ['bg-blue', 'bg-purple', 'bg-green', 'bg-orange'];
  return gradients[id % gradients.length];
};

const getAbilityColor = (val) => {
  if (val >= 90) return '#67C23A';
  if (val >= 80) return '#409EFF';
  return '#E6A23C';
};

onMounted(() => {
  generateStudents();
});
</script>

<style scoped>
.portfolio-container {
  min-height: 100vh;
  background-color: #f3f4f6;
  padding: 20px 40px;
  font-family: 'PingFang SC', sans-serif;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 15px 30px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
}
.left-action { display: flex; align-items: center; gap: 20px; }
.page-back-btn {
  cursor: pointer; display: flex; align-items: center; gap: 5px;
  color: #606266; font-size: 14px; padding: 6px 12px;
  border-radius: 20px; background: #f4f4f5; transition: all 0.2s;
}
.page-back-btn:hover { color: #409EFF; background: #ecf5ff; }
.page-title { font-size: 22px; font-weight: 800; color: #303133; margin: 0; }

/* 学生卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* 自适应列宽 */
  gap: 25px;
  padding-bottom: 40px;
}

/* 单个学生卡片 */
.student-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  border: 1px solid #f0f0f0;
}
.student-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.08);
}

.card-header-bg { height: 60px; width: 100%; opacity: 0.8; }
/* 渐变背景类 */
.bg-blue { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%); }
.bg-purple { background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); }
.bg-green { background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%); }
.bg-orange { background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%); }

.card-content {
  padding: 0 20px 20px;
  text-align: center;
  margin-top: -32px; /* 头像上移 */
}

.student-avatar { border: 4px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-size: 24px; font-weight: bold; color: white; }

.student-info { margin-top: 10px; margin-bottom: 12px; }
.name { margin: 0; font-size: 18px; color: #303133; }
.id-num { font-size: 12px; color: #909399; }

.tags-row { display: flex; justify-content: center; gap: 8px; margin-bottom: 15px; }

.mini-stats {
  display: flex; justify-content: center; align-items: center;
  background: #f8f9fa; padding: 10px; border-radius: 10px;
}
.stat-item { display: flex; flex-direction: column; width: 45%; }
.stat-divider { width: 1px; height: 20px; background: #e4e7ed; }
.label { font-size: 11px; color: #909399; }
.val { font-size: 16px; font-weight: bold; color: #303133; }

/* 详情抽屉样式 */
.profile-content { padding: 0 20px 40px; }

.profile-header { display: flex; gap: 20px; align-items: center; }
.big-avatar { font-size: 32px; color: white; border: 4px solid #f2f6fc; }
.header-info h2 { margin: 0 0 5px 0; font-size: 24px; }
.gender-icon { font-size: 18px; color: #409EFF; }
.header-info p { margin: 0 0 10px 0; color: #606266; font-size: 14px; }
.badges { display: flex; gap: 10px; }
.badge { background: #fff7e6; color: #e6a23c; padding: 2px 8px; border-radius: 4px; font-size: 12px; border: 1px solid #faecd8; }

.section { margin: 20px 0; }
.section-title { font-size: 16px; font-weight: bold; border-left: 4px solid #409EFF; padding-left: 10px; margin-bottom: 15px; color: #303133; }

/* 五育 */
.ability-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.ability-item { display: flex; flex-direction: column; gap: 5px; }
.ability-label { font-size: 13px; color: #606266; }

/* 成绩 */
.score-cards { display: flex; gap: 15px; }
.score-box { 
  flex: 1; background: #f4f4f5; padding: 15px; 
  border-radius: 12px; text-align: center; display: flex; flex-direction: column; 
}
.score-box span { font-size: 12px; color: #909399; margin-bottom: 5px; }
.score-box strong { font-size: 20px; color: #303133; }
.score-box.highlight { background: #ecf5ff; }
.score-box.highlight strong { color: #409EFF; }

/* 寄语 */
.teacher-comment {
  background: #fdf6ec; border: 1px dashed #e6a23c;
  padding: 20px; border-radius: 12px; color: #5e4623; line-height: 1.6;
}
.sign { text-align: right; margin-top: 10px; font-weight: bold; }

.timeline-card h4 { margin: 0 0 5px 0; }
.timeline-card p { margin: 0; font-size: 13px; color: #606266; }
</style>