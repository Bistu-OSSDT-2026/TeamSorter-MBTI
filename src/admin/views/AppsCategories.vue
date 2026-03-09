<template>
  <div style="padding:24px;">
    <!-- ===== 分类页签 ===== -->
    <el-tabs v-model="activeTab" @tab-change="loadApps">
      <el-tab-pane label="应用分类管理" name="appCategories">
        <!-- 1. 顶部新增按钮 -->
        <el-row style="margin-bottom:16px">
          <el-button type="primary" @click="openAppCategoryDialog">新增分类</el-button>
        </el-row>

        <!-- ===== 分类卡片 ===== -->
        <el-row :gutter="16">
          <el-col
            v-for="category in categories"
            :key="category._id"
            :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
            style="margin-bottom:16px"
          >
            <el-card>
              <template #header>
                <div class="clearfix">
                  <span>{{ category.categorynumber }}</span>
                  <el-tag size="mini" style="float:right">{{ category.categorynumber }}</el-tag>
                </div>
              </template>
              <div>分类：{{ category.categoryname }}</div>
              <div style="margin-top:12px;text-align:right">
                <el-button size="mini" @click="openAppCategoryEdit(category)">编辑</el-button>
                <el-button size="mini" type="danger" @click="singleDeleteAppCategory(category._id)">删除</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="categories.length === 0" description="暂无应用分类" />

        <!-- ===== 单条编辑抽屉 ===== -->
        <el-drawer v-model="showAppCategoryEdit" title="编辑分类" direction="rtl" size="400px">
          <el-form label-width="80px">
            <el-form-item label="分类编码">
              <el-input v-model="editAppCategoryForm.categorynumber" />
            </el-form-item>
            <el-form-item label="分类名称">
              <el-input v-model="editAppCategoryForm.categoryname" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showAppCategoryEdit = false">取消</el-button>
            <el-button type="primary" @click="doAppCategoryEdit">保存</el-button>
          </template>
        </el-drawer>
      </el-tab-pane>
      <el-tab-pane label="AI分类管理" name="aiCategories">
        <!-- 1. 顶部新增按钮 -->
        <el-row style="margin-bottom:16px">
          <el-button type="primary" @click="openAiCategoryDialog">新增分类</el-button>
        </el-row>

        <!-- ===== 分类卡片 ===== -->
        <el-row :gutter="16">
          <el-col
            v-for="aiCategory in aiCategories"
            :key="aiCategory._id"
            :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
            style="margin-bottom:16px"
          >
            <el-card>
              <template #header>
                <div class="clearfix">
                  <span>{{ aiCategory.AiName }}</span>
                  <el-tag size="mini" style="float:right">{{ aiCategory.AiName }}</el-tag>
                </div>
              </template>
              <div>分类：{{ aiCategory.AiName }}</div>
              <div style="margin-top:12px;text-align:right">
                <el-button size="mini" @click="openAiCategoryEdit(aiCategory)">编辑</el-button>
                <el-button size="mini" type="danger" @click="singleDeleteAiCategory(aiCategory._id)">删除</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-empty v-if="aiCategories.length === 0" description="暂无Ai分类" />

        <!-- ===== 单条编辑抽屉 ===== -->
        <el-drawer v-model="showAiCategoryEdit" title="编辑分类" direction="rtl" size="400px">
          <el-form label-width="80px">
            <el-form-item label="Ai名称">
              <el-input v-model="editAiCategoryForm.AiName" />
            </el-form-item>
            <el-form-item label="Ai URL">
              <el-input v-model="editAiCategoryForm.AiUrl" />
            </el-form-item>
            <el-form-item label="Ai Token">
              <el-input v-model="editAiCategoryForm.AiToken" />
            </el-form-item>
            <el-form-item label="是否需要 Bot ID">
              <el-switch v-model="editAiCategoryForm.IsNeedBotId" />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="showAiCategoryEdit = false">取消</el-button>
            <el-button type="primary" @click="doAiCategoryEdit">保存</el-button>
          </template>
        </el-drawer>
      </el-tab-pane>
    </el-tabs>

    <!-- 2. 分类创建弹窗 -->
    <el-dialog title="新增分类" v-model="showAppCategoryDialog" width="400px">
      <el-form label-width="80px">
        <el-form-item label="分类编码" required>
          <el-input v-model="appCategoryForm.categorynumber" placeholder="如 tool" />
        </el-form-item>
        <el-form-item label="分类名称" required>
          <el-input v-model="appCategoryForm.categoryname" placeholder="如 工具" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAppCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAppCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 3. AI分类创建弹窗 -->
    <el-dialog title="新增分类" v-model="showAiCategoryDialog" width="400px">
      <el-form label-width="80px">
        <el-form-item label="Ai名称" required>
          <el-input v-model="aiCategoryForm.AiName" placeholder="如 Chat-GPT" />
        </el-form-item>
        <el-form-item label="Ai URL" required>
          <el-input v-model="aiCategoryForm.AiUrl" placeholder="如 https://xxxxxx.com" />
        </el-form-item>
        <el-form-item label="Ai Token" required>
          <el-input v-model="aiCategoryForm.AiToken" placeholder="如 zxcvbnmasdfghjkl1234567890qwertyuiop" />
        </el-form-item>
        <el-form-item label="是否需要 Bot ID">
          <el-switch v-model="aiCategoryForm.IsNeedBotId" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAiCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="submitAiCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch  } from 'vue'
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus'

const API_BASE = 'http://localhost:5000/api'

/* -------- 数据 -------- */
const categories = ref([])
const showAppCategoryEdit   = ref(false)
const editAppCategoryForm   = ref({})
const aiCategories = ref([])
const showAiCategoryEdit   = ref(false)
const editAiCategoryForm   = ref({})

const route = useRoute();
const activeTab = ref(route.params.defaultTab || 'appCategories'); // 默认页签名称

/* -------- 分类 & 列表 -------- */
const loadAppCategories = async () => {
  const res = await fetch(`${API_BASE}/allAppsCategories`)
  categories.value = await res.json()
}

/* -------- 分类弹窗 -------- */
const showAppCategoryDialog = ref(false)
const appCategoryForm = ref({ categorynumber: '', categoryname: '' })

const openAppCategoryDialog = () => {
  appCategoryForm.value = { categorynumber: '', categoryname: '' }
  showAppCategoryDialog.value = true
}
const submitAppCategory = async () => {
  const { categorynumber, categoryname } = appCategoryForm.value
  if (!categorynumber.trim() || !categoryname.trim()) {
    ElMessage.warning('编码和名称不能为空')
    return
  }
  const res = await fetch(`${API_BASE}/appsCategories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categorynumber, categoryname })
  })
  const data = await res.json()
  if (res.ok) {
    ElMessage.success('分类新增成功')
    showAppCategoryDialog.value = false
    loadAppCategories()          // 刷新下拉
  } else {
    ElMessage.error(data.error || '创建失败')
  }
}

/* -------- 单删（GET 查询参数）-------- */
const singleDeleteAppCategory = id => {
  ElMessageBox.confirm('确认删除该分类？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await fetch(`${API_BASE}/deleteCategory?id=${id}`)
      const json = await res.json()
      if (json.ok) {
        ElMessage.success('已删除')
        loadAppCategories()          // 重新拉列表
      } else {
        ElMessage.error(json.error || '删除失败')
      }
    })
    .catch(() => {})
}

/* -------- 单编 -------- */
const openAppCategoryEdit = row => {
  editAppCategoryForm.value = {
    _id: row._id,
    categoryname: row.categoryname,
    categorynumber: row.categorynumber, // 传编码
  }
  showAppCategoryEdit.value = true
}
const doAppCategoryEdit = async () => {
  const { _id, categoryname, categorynumber } = editAppCategoryForm.value
  // 构造查询字符串
  const qs = new URLSearchParams({
    id: _id,
    categoryname,
    categorynumber
  }).toString()
  const res = await fetch(`${API_BASE}/updateCategory?${qs}`)
  const json = await res.json()

  if (json.ok) {
    ElMessage.success('保存成功')
    showAppCategoryEdit.value = false
    loadAppCategories()          // 重新拉列表
  } else {
    ElMessage.error(json.error || '更新失败')
  }
};

/* -------- 分类 & 列表 -------- */
const loadAiCategories = async () => {
  const res = await fetch(`${API_BASE}/allAiCategories`)
  aiCategories.value = await res.json()
}

/* -------- 分类弹窗 -------- */
const showAiCategoryDialog = ref(false)
const aiCategoryForm = ref({ AiName: '', AiUrl: '', AiToken: '', IsNeedBotId: false })

const openAiCategoryDialog = () => {
  aiCategoryForm.value = { AiName: '', AiUrl: '', AiToken: '', IsNeedBotId: false }
  showAiCategoryDialog.value = true
}
const submitAiCategory = async () => {
  const { AiName, AiUrl, AiToken, IsNeedBotId } = aiCategoryForm.value
  if (!AiName.trim() || !AiUrl.trim() || !AiToken.trim()) {
    ElMessage.warning('名称、URL 和 Token 不能为空')
    return
  }
  const res = await fetch(`${API_BASE}/aiCategories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ AiName, AiUrl, AiToken, IsNeedBotId })
  })
  const data = await res.json()
  if (res.ok) {
    ElMessage.success('分类新增成功')
    showAiCategoryDialog.value = false
    loadAiCategories()          // 刷新下拉
  } else {
    ElMessage.error(data.error || '创建失败')
  }
}

/* -------- 单删（GET 查询参数）-------- */
const singleDeleteAiCategory = id => {
  ElMessageBox.confirm('确认删除该分类？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await fetch(`${API_BASE}/deleteAiCategory?id=${id}`)
      const json = await res.json()
      if (json.ok) {
        ElMessage.success('已删除')
        loadAiCategories()          // 重新拉列表
      } else {
        ElMessage.error(json.error || '删除失败')
      }
    })
    .catch(() => {})
}

/* -------- 单编 -------- */
const openAiCategoryEdit = row => {
  editAiCategoryForm.value = {
    _id: row._id,
    AiName: row.AiName,
    AiUrl: row.AiUrl,
    AiToken: row.AiToken,
    IsNeedBotId: row.IsNeedBotId
  }
  showAiCategoryEdit.value = true
}
const doAiCategoryEdit = async () => {
  const { _id, AiName, AiUrl, AiToken, IsNeedBotId } = editAiCategoryForm.value
  // 构造查询字符串
  const qs = new URLSearchParams({
    id: _id,
    AiName,
    AiUrl,
    AiToken,
    IsNeedBotId
  }).toString()
  const res = await fetch(`${API_BASE}/updateAiCategory?${qs}`)
  const json = await res.json()

  if (json.ok) {
    ElMessage.success('保存成功')
    showAppCategoryEdit.value = false
    loadAiCategories()          // 重新拉列表
  } else {
    ElMessage.error(json.error || '更新失败')
  }
};

// 监听路由参数变化
watch(() => route.params.defaultTab, (newTab) => {
  activeTab.value = newTab || 'appCategories';
});

// 加载应用分类数据
const loadApps = (tabName) => {
  // 根据激活的页签名称加载数据
  if (tabName === 'appCategories') {
    loadAppCategories();
  } else if (tabName === 'aiCategories') {
    loadAiCategories();
  }
};

/* -------- 初始拉取 -------- */
onMounted(async () => {
  loadApps(activeTab.value); // 组件加载时加载数据
})
</script>