<template>
  <div style="padding:24px;">
    <!-- ===== 1. 应用创建 ===== -->
    <el-card title="应用创建">
      <template #header><span>应用创建</span></template>
      <el-form label-width="80px">
        <el-form-item label="应用名称" required>
          <el-input v-model="appRegisterForm.appname" placeholder="应用名称" />
        </el-form-item>
        <el-form-item label="关键词" required>
          <el-input v-model="appRegisterForm.appkeywords" placeholder="多个关键词用空格分隔" />
        </el-form-item>
        <el-form-item label="提示词" required>
          <el-input v-model="appRegisterForm.systemMessage" placeholder="限定应用回复方向" />
        </el-form-item>
        <el-form-item label="类别" required>
          <el-select v-model="appRegisterForm.category" placeholder="请选择应用类别" style="width:100%">
            <el-option
              v-for="item in categories"
              :key="item.categorynumber"
              :label="item.categoryname"
              :value="item.categorynumber"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="AI类别" required>
          <el-select v-model="appRegisterForm.aicategory" placeholder="请选择AI类别" style="width:100%">
            <el-option
              v-for="item in aiCategories"
              :key="item._id"
              :label="item.AiName"
              :value="item._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showBotIdInput" label="Bot ID">
          <el-input v-model="appRegisterForm.bot_id" placeholder="如果AI类别需要Bot ID，请填写" />
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="appRegister">创建应用</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';

const API_BASE = 'http://localhost:5000/api';
const showBotIdInput = ref(false);
const router = useRouter();

/* -------- 应用创建相关 -------- */
const appRegisterForm = ref({
  appname: '',
  appkeywords: '',
  systemMessage: '',
  category: '',
  aicategory: '',
  bot_id: ''
})
const appRegister = async () => {
  const { appname, appkeywords, systemMessage, category, aicategory, bot_id } = appRegisterForm.value;
  if (!appname.trim() || !appkeywords.trim() || !systemMessage.trim() || !category || !aicategory) {
    ElMessage.warning('应用名称、关键词、系统提示词、类别和AI类别均不能为空');
    return
  }
  if (showBotIdInput.value && !bot_id.trim()) {
    ElMessage.warning('所选AI类别需要填写Bot ID');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appname, appkeywords, systemMessage, category, aicategory, bot_id })
    })
    const data = await res.json();
    if (res.ok) {
      ElMessage.success('应用创建成功');
      sessionStorage.setItem('appId', data.appId);
      onAppCreateSuccess();
      // 成功清空
      appRegisterForm.value = { appname: '', appkeywords: '', systemMessage: '', category: '', aicategory: '', bot_id: '' };
    } else {
      ElMessage.error(data.error || '应用创建失败');
    }
  } catch (err) {
    console.error(err);
    ElMessage.error('接口调用失败');
  }
}

const onAppCreateSuccess = () => {
  router.push('/admin/pagebuilder');
};

/* -------- 分类下拉数据 -------- */
const categories = ref([]);
const loadCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/allAppsCategories`);
    const data = await res.json();
    categories.value = data;
  } catch (err) {
    console.error(err);
    ElMessage.error('获取分类失败');
  }
}

/* -------- 分类下拉数据 -------- */
const aiCategories = ref([]);
const loadAiCategories = async () => {
  try {
    const res = await fetch(`${API_BASE}/allAiCategories`);
    const data = await res.json();
    aiCategories.value = data;
  } catch (err) {
    console.error(err);
    ElMessage.error('获取分类失败');
  }
}

// 处理AI类别改变事件
const handleAiCategoryChange = () => {
  const selectedCategory = aiCategories.value.find(aicategory => aicategory._id === appRegisterForm.value.aicategory);
  showBotIdInput.value = selectedCategory?.IsNeedBotId || false;
};

// 监听AI类别的变化
watch(() => appRegisterForm.value.aicategory, handleAiCategoryChange);

onMounted(() => {
  loadCategories();
  loadAiCategories();
});
</script>