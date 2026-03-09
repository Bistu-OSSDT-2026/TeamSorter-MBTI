<template>
  <div class="admin-container">
    <div class="admin-sidebar">
      <div class="sidebar-header">
        <div class="logo">🛡️</div>
        <h3>讯科后台管理</h3>
      </div>
      <div class="menu-list">
        <div class="menu-item active">
          <el-icon><Odometer /></el-icon> 仪表盘
        </div>
        <div class="menu-item">
          <el-icon><User /></el-icon> 用户管理
        </div>
        <div class="menu-item">
          <el-icon><Setting /></el-icon> 系统设置
        </div>
      </div>
      <div class="sidebar-bottom">
        <div class="menu-item logout" @click="goBackApp">
          <el-icon><Back /></el-icon> 返回前台
        </div>
      </div>
    </div>

    <div class="admin-content">
      <header class="admin-header">
        <h2 class="page-title">系统仪表盘</h2>
        <div class="admin-user">管理员: Admin</div>
      </header>

      <main class="dashboard-grid">
        
        <el-card shadow="hover" class="config-card">
          <template #header>
            <div class="card-header">
              <span>🔑 站点访问控制 (邀请码)</span>
              <el-tag type="danger" size="small">核心安全</el-tag>
            </div>
          </template>
          
          <div class="config-body">
            <p class="desc">设置全站访问邀请码。修改后，新用户需输入新码才能访问。</p>
            
            <el-form label-position="top">
              <el-form-item label="当前邀请码">
                <el-input 
                  v-model="inviteCode" 
                  placeholder="未设置 (默认 XUNKE2025)" 
                  size="large"
                  type="text"
                  show-password
                >
                  <template #prepend>Code</template>
                </el-input>
              </el-form-item>
              
              <el-button type="primary" class="save-btn" @click="saveSettings" :loading="loading">
                保存生效
              </el-button>
            </el-form>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <template #header><span>👥 累计访问用户</span></template>
          <div class="stat-value">1,204</div>
          <div class="stat-trendup">+15% 较上周</div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <template #header><span>🚀 AI 调用次数</span></template>
          <div class="stat-value">8,530</div>
          <div class="stat-trendup">+22% 较上周</div>
        </el-card>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Odometer, User, Setting, Back } from '@element-plus/icons-vue';

const router = useRouter();
const inviteCode = ref("");
const loading = ref(false);

// 初始化：读取当前的邀请码
onMounted(() => {
  const savedCode = localStorage.getItem("admin_invite_code");
  if (savedCode) {
    inviteCode.value = savedCode;
  }
});

// 保存设置
const saveSettings = () => {
  if (!inviteCode.value.trim()) {
    return ElMessage.warning("邀请码不能为空");
  }
  
  loading.value = true;
  // 模拟保存延迟
  setTimeout(() => {
    // 🔥 核心逻辑：写入 localStorage，App.vue 会读取这个 key
    localStorage.setItem("admin_invite_code", inviteCode.value);
    
    ElMessage.success({
      message: "系统配置已更新，新邀请码立即生效",
      type: "success",
    });
    loading.value = false;
  }, 600);
};

// 返回前台
const goBackApp = () => {
  router.push('/');
};
</script>

<style scoped>
.admin-container {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;
  font-family: 'PingFang SC', sans-serif;
}

/* 左侧栏 */
.admin-sidebar {
  width: 240px;
  background: #001529;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #002140;
}
.logo { font-size: 24px; }
.sidebar-header h3 { margin: 0; font-size: 18px; font-weight: 600; }

.menu-list { flex: 1; padding-top: 20px; }
.menu-item {
  padding: 15px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255,255,255,0.65);
  transition: all 0.3s;
}
.menu-item:hover { color: white; background: rgba(255,255,255,0.08); }
.menu-item.active { background: #1890ff; color: white; }
.menu-item.logout { color: #ff7875; }
.menu-item.logout:hover { background: rgba(255, 77, 79, 0.2); }

/* 右侧内容 */
.admin-content { flex: 1; display: flex; flex-direction: column; }

.admin-header {
  height: 64px;
  background: white;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
}
.page-title { margin: 0; font-size: 20px; color: #333; }
.admin-user { font-weight: bold; color: #666; }

/* 仪表盘网格 */
.dashboard-grid {
  padding: 30px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr; /* 左侧宽，右侧窄 */
  gap: 20px;
}

/* 卡片样式 */
.config-card { border-radius: 8px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.config-body { padding: 10px 0; }
.desc { color: #666; font-size: 14px; margin-bottom: 20px; }
.save-btn { width: 100%; margin-top: 10px; }

.stat-card { border-radius: 8px; text-align: center; }
.stat-value { font-size: 36px; font-weight: bold; color: #1890ff; margin: 15px 0; }
.stat-trendup { color: #52c41a; font-size: 14px; }
</style>