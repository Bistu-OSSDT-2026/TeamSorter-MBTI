<template>
  <div class="create-scenario-page">
    <div class="page-header">
      <el-button link @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回Skill工坊
      </el-button>
      <h2>创建新应用场景</h2>
    </div>

    <div class="form-container">
      <el-form :model="form" label-position="top" size="large">
        <el-form-item label="场景名称 (Scenario Name)">
          <el-input v-model="form.name" placeholder="例如：智慧医疗、法律顾问..." />
        </el-form-item>
        
        <el-form-item label="场景描述 (Description)">
          <el-input 
            v-model="form.desc" 
            type="textarea" 
            :rows="4" 
            placeholder="描述该场景的主要用途和目标受众..." 
          />
        </el-form-item>

        <el-form-item label="领域分类 (Domain)">
          <el-select v-model="form.domain" placeholder="选择所属领域">
            <el-option label="教育 (Education)" value="education" />
            <el-option label="商业 (Business)" value="business" />
            <el-option label="科技 (Technology)" value="technology" />
            <el-option label="生活 (Lifestyle)" value="lifestyle" />
            <el-option label="其他 (Other)" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="主题色 (Theme Color)">
          <el-color-picker v-model="form.color" show-alpha />
        </el-form-item>

        <el-form-item label="图标 (Icon)">
          <div class="icon-selector">
            <div 
              v-for="icon in icons" 
              :key="icon" 
              class="icon-item"
              :class="{ active: form.icon === icon }"
              @click="form.icon = icon"
            >
              <el-icon><component :is="icon" /></el-icon>
            </div>
          </div>
        </el-form-item>

        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">创建场景</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  ArrowLeft, School, OfficeBuilding, Monitor, 
  Reading, ChatDotRound, DataAnalysis, VideoCamera
} from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);

const form = ref({
  name: '',
  desc: '',
  domain: '',
  color: '#4ade80',
  icon: 'School'
});

const icons = [
  'School', 'OfficeBuilding', 'Monitor', 
  'Reading', 'ChatDotRound', 'DataAnalysis', 'VideoCamera'
];

const handleSubmit = () => {
  if (!form.value.name) {
    ElMessage.warning('请输入场景名称');
    return;
  }
  
  loading.value = true;
  // Mock API call
  setTimeout(() => {
    ElMessage.success('场景创建成功！(演示)');
    loading.value = false;
    router.back();
  }, 1000);
};
</script>

<style scoped>
.create-scenario-page {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  color: #1e293b;
}

.page-header {
  margin-bottom: 40px;
}

.page-header h2 {
  margin-top: 16px;
  font-size: 28px;
}

.form-container {
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.icon-selector {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.icon-item {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-item:hover {
  background: #f8fafc;
}

.icon-item.active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: #f5f3ff;
}

.form-actions {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
</style>
