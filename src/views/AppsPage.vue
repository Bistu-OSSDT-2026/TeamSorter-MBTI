<template>
  <div class="apps-page">
    <div class="toolbar-container">
      <div class="page-header">
        <h2 class="page-title">🛠️ 工具箱</h2>
        <span class="page-subtitle">选择合适的 AI 助手开始备课</span>
      </div>

      <div class="search-area">
  <el-input
    v-model="keyword"
    placeholder="搜索应用名称..."
    clearable
    @clear="search"
    @keyup.enter="search"
    class="custom-search-input"
  >
    <template #append>
  <el-button @click="search" class="search-btn-inner">
    <el-icon style="vertical-align: middle; margin-right: 4px">
      <Search />
    </el-icon>
    <span style="vertical-align: middle">搜索</span>
  </el-button>
</template>
  </el-input>
</div>
    </div>

    <div class="tabs-container">
      <el-tabs v-model="activeTab" @tab-change="loadApps" class="custom-tabs">
        <el-tab-pane label="全部应用" name="all" />
        <el-tab-pane
          v-for="c in categories"
          :key="c.categorynumber"
          :label="c.categoryname"
          :name="c.categorynumber"
        />
      </el-tabs>
    </div>

    <div class="apps-grid-container" v-loading="loading">
      <el-row :gutter="20">
        <el-col
          v-for="app in apps"
          :key="app._id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="4"
          class="app-col"
        >
          <el-card class="app-card" shadow="hover" :body-style="{ padding: '0px', height: '100%' }">
            <div class="card-inner">
              <div class="card-header-section">
                <div 
                  class="app-icon" 
                  :style="{ background: generateColor ? generateColor(app.appname) : '#409EFF' }"
                >
                  {{ app.appname ? app.appname.substring(0, 1) : 'A' }}
                </div>
                
                <div class="app-info">
                  <div class="app-name" :title="app.appname">{{ app.appname }}</div>
                  <el-tag size="small" type="info" effect="plain" class="category-tag">
                    {{ app.categoryname }}
                  </el-tag>
                </div>
              </div>

              <div class="card-desc-section">
                <p class="app-desc" :title="app.appkeywords">
                  {{ app.appkeywords || '该应用暂无详细功能描述。' }}
                </p>
              </div>

              <div class="card-footer-section">
                <el-button 
                  type="primary" 
                  plain 
                  class="action-btn" 
                  @click="dowork(app)"
                >
                  立即使用
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty 
        v-if="apps.length === 0 && !loading" 
        description="没有找到相关应用" 
        :image-size="120"
      />
    </div>
  </div>
</template>

<script>
import router from "@/router";
import axios from "axios";
import { Search } from '@element-plus/icons-vue';
export default {
  components: {
    Search
  },
  data() {
    return {
      categories: [],
      apps: [],
      keyword: '',
      activeTab: 'all'
    }
  },
  methods: {
    async loadCategories() {
      const res = await axios.get('http://localhost:5000/api/allAppsCategories');
      this.categories = res.data;
    },
    async loadApps() {
      const q = new URLSearchParams();
      if (this.activeTab !== 'all') q.set('category', this.activeTab);
      if (this.keyword) q.set('keyword', this.keyword);
      const res = await axios.get(`http://localhost:5000/api/allApps?${q}`);
      this.apps = res.data;
    },
    generateColor(name) {
    if (!name) return '#ccc';
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    // 简单的根据字符串长度取余分配颜色
    const index = name.length % colors.length;
    return colors[index];
  },
    async search() {
      await this.loadApps();
    },
    async dowork(row) {
      sessionStorage.setItem('appId', row._id);
      router.push('/workbench');
    }
  },
  mounted() {
    this.loadCategories();
    this.loadApps();
  }
};
</script>

<style scoped>
/* ===== 全局容器布局 ===== */
.apps-page {
  padding: 24px 32px;
  background-color: #f8fafc; /* 极浅的蓝灰底色，更护眼 */
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* ===== 顶部 Header 与 搜索栏 ===== */
.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-left: 12px;
  font-weight: 400;
}

.search-area {
  width: 320px;
}

/* 1. 强行重置 Element Plus 输入框容器布局 */
.custom-search-input {
  display: flex; /* 确保内部元素弹性布局 */
  align-items: stretch; /* 强制高度拉伸对齐 */
  height: 40px; /* 显式指定高度，防止字体撑开差异 */
}

/* 2. 左侧输入框本体 */
.custom-search-input :deep(.el-input__wrapper) {
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  
  /* 关键修复：禁用默认的 box-shadow，改用 border 以保证和右边高度一致 */
  box-shadow: none !important; 
  border: 1px solid #e2e8f0;
  border-right: none; /* 去掉右边框，准备拼接 */
  
  padding-left: 16px;
  height: 100%; /* 撑满父容器 */
  box-sizing: border-box; /* 边框计算在高度内 */
}

/* 聚焦时边框变色 */
.custom-search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #3b82f6;
}

/* 3. 右侧搜索按钮容器 */
.custom-search-input :deep(.el-input-group__append) {
  background-color: #3b82f6;
  border: 1px solid #3b82f6; /* 必须加 1px 边框以匹配左侧的输入框高度 */
  color: white;
  
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  
  padding: 0;
  box-shadow: none !important;
  height: 100%; /* 撑满父容器 */
  box-sizing: border-box; /* 边框计算在高度内 */
  overflow: hidden; /* 防止圆角溢出 */
}

/* 4. 按钮内部微调 */
.custom-search-input :deep(.el-input-group__append button.el-button) {
  border: none;
  background: transparent;
  color: white;
  margin: 0;
  height: 100%;
  padding: 0 24px; /* 调整左右内边距 */
  border-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

/* 悬停效果 */
.custom-search-input :deep(.el-input-group__append:hover) {
  background-color: #2563eb;
  border-color: #2563eb;
}

/* ===== 标签页样式 ===== */
.tabs-container {
  margin-bottom: 24px;
}

.custom-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e2e8f0;
}

.custom-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  color: #64748b;
  transition: all 0.3s;
}

.custom-tabs :deep(.el-tabs__item.is-active) {
  color: #3b82f6;
  font-weight: 600;
}

.custom-tabs :deep(.el-tabs__active-bar) {
  background-color: #3b82f6;
  height: 3px;
  border-radius: 3px;
}

/* ===== 卡片网格布局 ===== */
.app-col {
  margin-bottom: 24px;
}

/* 卡片本体 */
.app-card {
  border: none;
  border-radius: 16px; /* 更圆润的角 */
  background: #ffffff;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease;
  overflow: visible; /* 允许阴影溢出 */
  height: 240px; /* 固定高度，确保整齐 */
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.app-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.1);
  border-color: #bfdbfe;
  z-index: 10;
}

/* 卡片内部 Flex 结构 */
.card-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
}

/* 1. 头部：图标+标题 */
.card-header-section {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
  align-items: flex-start;
}

.app-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.app-info {
  flex: 1;
  overflow: hidden;
}

.app-name {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-tag {
  border: none;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  height: 22px;
  padding: 0 8px;
  border-radius: 6px;
}

/* 2. 中部：描述 (Line Clamp) */
.card-desc-section {
  flex: 1; /* 占据中间剩余空间 */
  overflow: hidden;
  margin-bottom: 16px;
}

.app-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  
  /* 多行省略核心 CSS */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; /* 最多显示3行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 3. 底部：按钮 */
.card-footer-section {
  margin-top: auto; /* 确保贴底 */
}

.action-btn {
  width: 100%;
  border-radius: 10px;
  font-weight: 600;
  background-color: #eff6ff;
  border-color: #dbeafe;
  color: #3b82f6;
  padding: 18px 0; /* 增加点击区域高度 */
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}
</style>