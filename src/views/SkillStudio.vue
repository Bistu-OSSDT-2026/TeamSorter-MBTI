<template>
  <div class="studio-container" @contextmenu.prevent>
    <!-- Default View: Skill List (Marketplace/Drafts) -->
    <div class="default-view">
      <div class="toolbar-container">
        <div class="page-header">
          <h2 class="page-title">Skill编排工坊</h2>
          <span class="page-subtitle">管理您的智能体与Skill流</span>
        </div>
        <div class="actions-area">
          <el-button type="primary" size="large" @click="createNewSkill">
            <el-icon class="el-icon--left"><Plus /></el-icon>
            新建Skill流
          </el-button>
        </div>
      </div>

      <!-- Application Scenarios Section -->
      <div class="section-container">
        <div class="section-header">
          <h3 class="section-title">应用场景 (Application Scenarios)</h3>
          <el-button type="primary" link @click="createScenario">
            <el-icon><Plus /></el-icon> 新建场景
          </el-button>
        </div>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-for="scenario in scenarios" :key="scenario.id">
            <el-card class="scenario-card" shadow="hover">
              <div class="scenario-icon" :style="{ background: scenario.color }">
                <el-icon><component :is="scenario.icon" /></el-icon>
              </div>
              <div class="scenario-info">
                <h4>{{ scenario.name }}</h4>
                <p>{{ scenario.desc }}</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- All Skills Section -->
      <div class="section-container">
        <h3 class="section-title">全部Skill</h3>
        <el-row :gutter="20">
          <!-- Add New Skill Card Placeholder -->
          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="skill-col">
            <div class="skill-card add-card" @click="createNewSkill">
              <div class="add-icon"><Plus /></div>
              <div class="add-text">创建新Skill</div>
            </div>
          </el-col>

          <el-col
            v-for="skill in allSkills"
            :key="skill._id"
            :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
            class="skill-col"
            @contextmenu.prevent="showContextMenu($event, skill)"
          >
            <el-card class="skill-card" shadow="hover" :body-style="{ padding: '0px', height: '100%' }">
              <div class="card-inner">
                <div class="card-header-section">
                  <div class="skill-icon" :class="skill.type || 'general'">{{ skill.icon || '⚡' }}</div>
                  <div class="skill-info">
                    <div class="skill-name">{{ skill.name }}</div>
                    <el-tag size="small" effect="plain">{{ getTypeName(skill.type) }}</el-tag>
                  </div>
                </div>
                <div class="card-desc-section">
                  <p class="skill-desc">{{ skill.description || '暂无描述' }}</p>
                </div>
                <div class="card-footer-section">
                  <el-button text type="primary" @click="editSkill(skill)">编辑</el-button>
                  <el-button text type="danger" @click.stop="deleteSkill(skill)">删除</el-button>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- Custom Context Menu -->
    <div 
      v-if="contextMenuVisible" 
      class="context-menu" 
      :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
    >
      <div class="menu-item" @click="handleRename">
        <el-icon><Edit /></el-icon> 重命名
      </div>
      <div class="menu-item delete" @click="handleDelete">
        <el-icon><Delete /></el-icon> 删除
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Plus, Monitor, School, OfficeBuilding, Edit, Delete
} from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import axios from 'axios';

const router = useRouter();
const allSkills = ref([]);

const scenarios = ref([
  { id: 1, name: '智慧教育', desc: '教案生成、作业批改、课堂互动', icon: School, color: '#fef3c7' },
  { id: 2, name: '企业办公', desc: '会议纪要、周报生成、数据分析', icon: OfficeBuilding, color: '#eff6ff' },
  { id: 3, name: '工业互联', desc: '故障诊断、流程监控、安全预警', icon: Monitor, color: '#f3f4f6' },
]);

// Context Menu State
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const currentContextSkill = ref(null);

const fetchSkills = async () => {
  try {
    const { data } = await axios.get('http://localhost:5000/api/skills');
    
    // Fallback if empty to show examples
    if (data.length === 0) {
      allSkills.value = [
        { _id: 'mock1', name: '课堂互动助手', type: 'scenario', description: '针对课堂提问环节的自动应答与评分', icon: '🏫' },
        { _id: 'mock2', name: '作业批改流', type: 'scenario', description: '自动化批改作业并生成反馈报告', icon: '📝' },
        { _id: 'mock3', name: '文本摘要', type: 'general', description: '通用长文本摘要生成', icon: '📄' },
        { _id: 'mock4', name: '多语言翻译', type: 'general', description: '支持100+种语言的实时互译', icon: '🌐' },
        { _id: 'mock5', name: 'PDF转Word', type: 'tool', description: '文档格式无损转换工具', icon: '📂' },
      ];
    } else {
      allSkills.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch skills', error);
    ElMessage.error('获取技能列表失败');
    // Fallback on error too
    allSkills.value = [
        { _id: 'mock1', name: '课堂互动助手', type: 'scenario', description: '针对课堂提问环节的自动应答与评分', icon: '🏫' },
        { _id: 'mock2', name: '作业批改流', type: 'scenario', description: '自动化批改作业并生成反馈报告', icon: '📝' },
    ];
  }
};

const createScenario = () => {
  router.push('/create-scenario');
};

onMounted(() => {
  fetchSkills();
  document.addEventListener('click', closeContextMenu);
});

onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu);
});

const getTypeName = (type) => {
  const map = {
    'scenario': '场景Skill',
    'general': '通用Skill',
    'tool': '工具Skill',
    'analysis': '分析Skill',
    'creative': '创意Skill',
    'flow': 'Skill流'
  };
  return map[type] || 'Skill';
};

const createNewSkill = () => {
  router.push('/skill-editor');
};

const editSkill = (skill) => {
  router.push(`/skill-editor/${skill._id}`);
};

const deleteSkill = async (skill) => {
  try {
    await ElMessageBox.confirm(`确定要删除 "${skill.name}" 吗？`, '警告', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    await axios.delete(`http://localhost:5000/api/skills/${skill._id}`);
    ElMessage.success('删除成功');
    fetchSkills();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// Context Menu Logic
const showContextMenu = (event, skill) => {
  event.preventDefault();
  contextMenuVisible.value = true;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  currentContextSkill.value = skill;
};

const closeContextMenu = () => {
  contextMenuVisible.value = false;
};

const handleRename = async () => {
  if (!currentContextSkill.value) return;
  try {
    const { value } = await ElMessageBox.prompt('请输入新的名称', '重命名', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: currentContextSkill.value.name,
    });
    
    await axios.put(`http://localhost:5000/api/skills/${currentContextSkill.value._id}`, {
      name: value
    });
    ElMessage.success('重命名成功');
    fetchSkills();
  } catch (error) {
    // Cancelled or error
  }
};

const handleDelete = () => {
  if (currentContextSkill.value) {
    deleteSkill(currentContextSkill.value);
  }
};

</script>

<style scoped>
/* Context Menu Styles */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  padding: 4px 0;
  min-width: 120px;
  z-index: 1000;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #334155;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f1f5f9;
}

.menu-item.delete {
  color: #ef4444;
}

.menu-item.delete:hover {
  background-color: #fef2f2;
}

/* Reverted Theme Adaptation */
.studio-container {
  padding: 24px 32px;
  background-color: #f8fafc;
  min-height: 100vh;
}

.page-title {
  color: #1e293b;
}

.scenario-card, .skill-card {
  background-color: #fff;
  border: 1px solid #e2e8f0;
  color: inherit;
}

.scenario-info h4, .skill-name {
  color: #1e293b;
}

.scenario-info p, .skill-desc {
  color: #64748b;
}

.card-footer-section {
  border-top: 1px solid #f1f5f9;
}

.add-card {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
  color: #64748b;
}

.add-card:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background-color: #f5f3ff;
}

.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-left: 12px;
}

.section-container {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-left: 4px solid var(--el-color-primary);
  padding-left: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin: 0;
  border-left: none;
  padding-left: 0;
}

/* Scenario Cards */
.scenario-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
  margin-bottom: 20px;
}

.scenario-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.scenario-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}

.scenario-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  color: #475569;
}

.scenario-info h4 { margin: 0 0 4px 0; font-size: 16px; color: #1e293b; }
.scenario-info p { margin: 0; font-size: 13px; color: #64748b; }

/* Skill Cards (Reused) */
.skills-grid-container { margin-top: 20px; }
.skill-col { margin-bottom: 20px; }

.skill-card {
  height: 180px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
  cursor: pointer;
}

.skill-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.add-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px dashed #cbd5e1;
  background-color: #f1f5f9;
  color: #64748b;
}

.add-card:hover {
  border-color: #8b5cf6;
  color: #8b5cf6;
  background-color: #f5f3ff;
}

.add-icon { font-size: 32px; margin-bottom: 8px; }

.card-inner {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
}

.card-header-section {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.skill-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 12px;
  background-color: #e0e7ff;
}
.skill-icon.scenario { background-color: #fff7ed; color: #c2410c; }
.skill-icon.general { background-color: #eff6ff; color: #1d4ed8; }
.skill-icon.tool { background-color: #f3f4f6; color: #374151; }
.skill-icon.analysis { background-color: #ecfdf5; color: #047857; }
.skill-icon.creative { background-color: #fdf4ff; color: #be185d; }

.skill-info { flex: 1; overflow: hidden; }
.skill-name { font-weight: 600; color: #1e293b; margin-bottom: 4px; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.card-desc-section { flex: 1; overflow: hidden; }
.skill-desc { font-size: 12px; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card-footer-section {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
}
</style>