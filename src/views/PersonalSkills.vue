<template>
  <div class="skills-page">
    <div class="toolbar-container">
      <div class="page-header">
        <h2 class="page-title">⚡ 个人技能流</h2>
        <span class="page-subtitle">可视化编排您的专属 AI 技能 (Zero-code Skill Visual Editor)</span>
      </div>

      <div class="actions-area">
        <el-button type="primary" size="large" @click="createNewSkill">
          <el-icon class="el-icon--left"><Plus /></el-icon>
          新建技能
        </el-button>
        <div class="search-area">
          <el-input
            v-model="keyword"
            placeholder="搜索技能..."
            clearable
            class="custom-search-input"
          >
            <template #append>
              <el-button @click="search">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <div class="tabs-container">
      <el-tabs v-model="activeTab" class="custom-tabs">
        <el-tab-pane label="全部skill" name="all" />
        <el-tab-pane label="场景skill" name="scenario" />
        <el-tab-pane label="通用skill" name="general" />
        <el-tab-pane label="工具skill" name="tool" />
      </el-tabs>
    </div>

    <div class="skills-grid-container">
      <el-row :gutter="20">
        <!-- Add New Skill Card Placeholder -->
        <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="4" class="skill-col">
          <div class="skill-card add-card" @click="createNewSkill">
            <div class="add-icon"><Plus /></div>
            <div class="add-text">创建新技能</div>
          </div>
        </el-col>

        <el-col
          v-for="skill in filteredSkills"
          :key="skill.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
          class="skill-col"
        >
          <el-card class="skill-card" shadow="hover" :body-style="{ padding: '0px', height: '100%' }">
            <div class="card-inner">
              <div class="card-header-section">
                <div class="skill-icon" :class="skill.type">
                  {{ skill.icon || '⚡' }}
                </div>
                <div class="skill-info">
                  <div class="skill-name" :title="skill.name">{{ skill.name }}</div>
                  <el-tag size="small" :type="getTagType(skill.type)" effect="plain" class="category-tag">
                    {{ getTypeName(skill.type) }}
                  </el-tag>
                </div>
              </div>

              <div class="card-desc-section">
                <p class="skill-desc" :title="skill.desc">
                  {{ skill.desc || '暂无描述' }}
                </p>
              </div>

              <div class="card-footer-section">
                <el-button text type="primary" @click="editSkill(skill)">编辑</el-button>
                <el-button text type="success" @click="runSkill(skill)">运行</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { Search, Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

export default {
  name: 'PersonalSkills',
  components: {
    Search,
    Plus
  },
  data() {
    return {
      keyword: '',
      activeTab: 'all',
      // Mock Data
      allSkills: [
        { id: 1, name: '课堂互动助手', type: 'scenario', desc: '针对课堂提问环节的自动应答与评分', icon: '🏫' },
        { id: 2, name: '作业批改流', type: 'scenario', desc: '自动化批改作业并生成反馈报告', icon: '📝' },
        { id: 3, name: '文本摘要', type: 'general', desc: '通用长文本摘要生成', icon: '📄' },
        { id: 4, name: '翻译助手', type: 'general', desc: '多语言实时翻译', icon: '🌐' },
        { id: 5, name: 'PDF转Word', type: 'tool', desc: '文档格式转换工具', icon: '📂' },
        { id: 6, name: '图片OCR', type: 'tool', desc: '提取图片中的文字信息', icon: '🖼️' },
      ]
    }
  },
  computed: {
    filteredSkills() {
      let result = this.allSkills;
      
      // Filter by Tab
      if (this.activeTab !== 'all') {
        result = result.filter(s => s.type === this.activeTab);
      }
      
      // Filter by Keyword
      if (this.keyword) {
        const k = this.keyword.toLowerCase();
        result = result.filter(s => s.name.toLowerCase().includes(k) || s.desc.toLowerCase().includes(k));
      }
      
      return result;
    }
  },
  methods: {
    search() {
      // computed property handles search automatically
    },
    createNewSkill() {
      // ElMessage.success('即将进入可视化编辑器...');
      this.$router.push('/skill-editor');
    },
    editSkill(skill) {
      // ElMessage.info(`编辑技能: ${skill.name}`);
      this.$router.push(`/skill-editor/${skill.id}`);
    },
    runSkill(skill) {
      ElMessage.success(`运行技能: ${skill.name}`);
    },
    getTypeName(type) {
      const map = {
        'scenario': '场景skill',
        'general': '通用skill',
        'tool': '工具skill'
      };
      return map[type] || type;
    },
    getTagType(type) {
      const map = {
        'scenario': 'warning',
        'general': 'primary',
        'tool': 'info'
      };
      return map[type] || '';
    }
  }
};
</script>

<style scoped>
.skills-page {
  padding: 24px 32px;
  background-color: #f8fafc;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
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

.actions-area {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-area {
  width: 260px;
}

.tabs-container {
  margin-bottom: 24px;
}

.skill-col {
  margin-bottom: 20px;
}

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

.add-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

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
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 12px;
  background-color: #e0e7ff;
}

.skill-icon.scenario { background-color: #fff7ed; color: #c2410c; }
.skill-icon.general { background-color: #eff6ff; color: #1d4ed8; }
.skill-icon.tool { background-color: #f3f4f6; color: #374151; }

.skill-info {
  flex: 1;
  overflow: hidden;
}

.skill-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc-section {
  flex: 1;
  overflow: hidden;
}

.skill-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer-section {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
}
</style>