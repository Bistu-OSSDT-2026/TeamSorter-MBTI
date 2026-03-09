<template>
  <div style="padding:24px;">
    <!-- ===== 顶部工具栏：仅保留查询 ===== -->
    <el-card>
      <el-row type="flex" justify="end">
        <el-col :span="8">
          <el-input
            v-model="keyword"
            placeholder="请输入应用名称关键词"
            clearable
            @clear="search"
            @keyup.enter="search"
          >
            <template #append>
              <el-button icon="Search" @click="search" />
            </template>
          </el-input>
        </el-col>
      </el-row>
    </el-card>

    <!-- ===== 分类页签 ===== -->
    <el-tabs v-model="activeTab" @tab-change="loadApps">
      <el-tab-pane label="全部" name="all" />
      <el-tab-pane
        v-for="c in categories"
        :key="c.categorynumber"
        :label="c.categoryname"
        :name="c.categorynumber"
      />
    </el-tabs>

    <!-- ===== 应用卡片 ===== -->
    <el-row :gutter="16">
      <el-col
        v-for="app in apps"
        :key="app._id"
        :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
        style="margin-bottom:16px"
      >
        <el-card>
          <template #header>
            <div class="clearfix">
              <span>{{ app.appname }}</span>
              <el-tag size="mini" style="float:right">{{ app.categoryname }}</el-tag>
            </div>
          </template>
          <div>关键词：{{ app.appkeywords }}</div>
          <div>集成AI：{{ app.aicategoryname }}</div>
          <div style="margin-top:12px;text-align:right">
            <el-button size="mini" @click="openEdit(app)">编辑</el-button>
            <el-button size="mini" type="danger" @click="singleDelete(app._id)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="apps.length === 0" description="暂无应用" />

    <!-- ===== 单条编辑抽屉 ===== -->
    <el-drawer v-model="showEdit" title="编辑应用" direction="rtl" size="400px">
      <el-form label-width="80px">
        <el-form-item label="应用名称">
          <el-input v-model="editForm.appname" />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="editForm.appkeywords" />
        </el-form-item>
        <el-form-item label="提示词">
          <el-input v-model="editForm.systemMessage" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.categorynumber" style="width:100%">
            <el-option
              v-for="c in categories"
              :key="c.categorynumber"
              :label="c.categoryname"
              :value="c.categorynumber"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="AI类别" required>
          <el-select v-model="editForm.aicategory" placeholder="请选择AI类别" style="width:100%">
            <el-option
              v-for="item in aiCategories"
              :key="item._id"
              :label="item.AiName"
              :value="item._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showBotIdInput" label="Bot ID">
          <el-input v-model="editForm.bot_id" placeholder="如果AI类别需要Bot ID，请填写" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="doEdit">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

const API_BASE = 'http://localhost:5000/api'

/* -------- 数据 -------- */
const categories = ref([])
const apps       = ref([])
const activeTab  = ref('all')
const keyword    = ref('')
const showEdit   = ref(false)
const editForm   = ref({})
const showBotIdInput = ref(false);

/* -------- 初始拉取 -------- */
onMounted(async () => {
  await loadCategories()
  await loadAiCategories()
  await loadApps()
})

/* -------- 分类 & 列表 -------- */
const loadCategories = async () => {
  const res = await fetch(`${API_BASE}/allAppsCategories`)
  categories.value = await res.json()
}
const loadApps = async () => {
  const q = new URLSearchParams()
  if (activeTab.value !== 'all') q.set('category', activeTab.value)
  if (keyword.value) q.set('keyword', keyword.value)
  const res = await fetch(`${API_BASE}/allApps?${q}`)
  apps.value = await res.json()
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
  const selectedCategory = aiCategories.value.find(aicategory => aicategory._id === editForm.value.aicategory);
  showBotIdInput.value = selectedCategory?.IsNeedBotId || false;
};

// 监听AI类别的变化
watch(() => editForm.value.aicategory, handleAiCategoryChange);

// 监听showBotIdInput的变化
watch(() => showBotIdInput.value, (newValue) => {
  if (!newValue) {
    editForm.value.bot_id = ""; // 当showBotIdInput变为false时，将bot_id设置为空字符串
  }
});

// const handleTabClick = () => loadApps()
const search         = () => loadApps()

/* -------- 单删（GET 查询参数）-------- */
const singleDelete = id => {
  ElMessageBox.confirm('确认删除该应用？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await fetch(`${API_BASE}/deleteApp?id=${id}`)
      const json = await res.json()
      if (json.ok) {
        ElMessage.success('已删除')
        loadApps()          // 重新拉列表
      } else {
        ElMessage.error(json.error || '删除失败')
      }
    })
    .catch(() => {})
}

/* -------- 单编 -------- */
const openEdit = row => {
  editForm.value = {
    _id: row._id,
    appname: row.appname,
    appkeywords: row.appkeywords,
    systemMessage: row.systemMessage,
    categorynumber: row.categorynumber, // 传编码
    aicategory: row.aicategoryid,
    bot_id: row.bot_id
  }
  showBotIdInput.value = row.aicategoryid && aiCategories.value.some(ai => ai._id === row.aicategoryid && ai.IsNeedBotId);
  showEdit.value = true
}
const doEdit = async () => {
  const { _id, appname, appkeywords, systemMessage, categorynumber, aicategory, bot_id } = editForm.value
  if (showBotIdInput.value && !bot_id.trim()) {
    ElMessage.warning('所选AI类别需要填写Bot ID');
    return;
  }
  // 构造查询字符串
  const qs = new URLSearchParams({
    id: _id,
    appname: appname,
    appkeywords: appkeywords,
    systemMessage: systemMessage,
    categorynumber: categorynumber,
    aicategory: aicategory,
    bot_id: bot_id || ""  // 如果 bot_id 为空，则传空字符串
  }).toString();
  // alert(qs)
  const res = await fetch(`${API_BASE}/updateApp?${qs}`)
  const json = await res.json()
  sessionStorage.setItem('appId', _id) // 保存当前编辑的应用ID
  if (json.ok) {
    ElMessage.success('保存成功')
    showEdit.value = false
    loadApps()          // 重新拉列表
    router.push('/admin/pagebuilder')
    .then(() => {
      // 等待路由跳转完成后，使用 window.location 重新加载页面
      window.location.reload();
    });
  } else {
    ElMessage.error(json.error || '更新失败')
  }
}
</script>

<style scoped>
.clearfix::before,
.clearfix::after {
  display: table;
  content: "";
}
.clearfix::after {
  clear: both;
}
</style>