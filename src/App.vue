<template>
  <div id="app" class="app-wrapper">
    
    <div v-if="!hasAccess" class="invitation-overlay">
      <h1 style="display:none">AI Agent 技能库搭建平台 - 智能课件生成与备课助手</h1>
  <p style="display:none">提供教案设计、试题生成、课堂 AI 互动等专业教师办公工具。</p>
      <div class="invitation-box">
        <div class="lock-icon">🔒</div>
        <h2>平台内测中</h2>
        <p>请输入邀请码解锁完整功能</p>
        <div class="input-group">
          <el-input 
            v-model="inputCode" 
            placeholder="邀请码" 
            type="password" 
            show-password
            @keyup.enter="verifyCode"
            class="code-input"
          />
          <el-button type="primary" @click="verifyCode" :loading="verifying">解锁</el-button>
        </div>
        <p class="hint-text">联系客服获取体验资格</p>
      </div>
    </div>

    <header class="app-header">
      <div class="header-left">
        <img :src="logoImage" class="logo-img" alt="Logo" />
        <div class="logo-text">AI Agent 技能库搭建平台</div>
      </div>
      
      <div class="header-right">
  <div class="auth-btn-group">
    
    <el-button round class="glass-btn" @click="openIntro">平台介绍</el-button>

    <el-dropdown v-if="isLoggedIn" @command="handleMenuCommand" trigger="click">
      <div class="user-profile">
        <el-avatar :size="32" class="user-avatar">{{ username.charAt(0) }}</el-avatar>
        <span class="username">{{ username }}</span>
        <el-icon class="el-icon--right"><CaretBottom /></el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile" icon="User">个人资料</el-dropdown-item>
          <el-dropdown-item divided command="logout" icon="SwitchButton">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <template v-else>
      <el-button round class="glass-btn" @click="showLogin = true">登录</el-button>
      <el-button round type="success" class="register-btn" @click="showRegister = true">注册账号</el-button>
    </template>

  </div>
</div>
    </header>

    <div class="main-layout">
      <aside class="sidebar">
        <!-- Resource Explorer Tree -->
        <div class="resource-explorer">
          <div class="explorer-header">资源管理器</div>
          <el-tree
            :data="treeData"
            :props="defaultProps"
            default-expand-all
            highlight-current
            @node-click="handleNodeClick"
            class="custom-tree"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <el-icon v-if="data.icon" class="tree-icon" :class="{ 'folder-icon': data.children }">
                  <component :is="data.icon" />
                </el-icon>
                <span>{{ node.label }}</span>
              </span>
            </template>
          </el-tree>
        </div>

        <div class="sidebar-footer">
          <span>v2.1.0 Beta</span>
        </div>
      </aside>

      <main class="content-area">
        <div class="content-wrapper">
          <transition name="fade-slide" mode="out-in">
            <router-view />
          </transition>
        </div>
      </main>
    </div>

    <el-dialog title="欢迎回来" v-model="showLogin" width="380px" center destroy-on-close class="custom-dialog">
      <el-form label-position="top" size="large">
        <el-form-item label="账号">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="loginForm.password" placeholder="请输入密码" prefix-icon="Lock" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="full-width-btn" type="primary" size="large" @click="handleLogin" :loading="loading">立即登录</el-button>
      </template>
    </el-dialog>

    <el-dialog title="创建账号" v-model="showRegister" width="380px" center destroy-on-close class="custom-dialog">
      <el-form label-position="top" size="large">
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" prefix-icon="User" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="registerForm.email" prefix-icon="Message" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="registerForm.password" prefix-icon="Lock" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button class="full-width-btn" type="success" size="large" @click="handleRegister" :loading="loading">注册并登录</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import logoImage from '@/assets/logo_new.jpg';
import { ref, onMounted } from "vue"; 
import { useRouter } from 'vue-router'; // Add useRouter
import { ElMessage } from "element-plus";
import { 
  Odometer, Grid, Monitor, User, InfoFilled, CaretBottom, Platform, Connection,
  Folder, Document, Plus, VideoPlay, MagicStick, School, OfficeBuilding
} from '@element-plus/icons-vue';

const router = useRouter(); // Initialize router

// Resource Tree Data
const treeData = [
  {
    label: '我的智能体 (My Agents)',
    icon: User,
    children: [
      {
        label: '智慧教育 (Education)',
        icon: School,
        children: [
           {
            label: '智能助手',
            icon: Odometer,
            route: '/'
          },
          {
            label: '课堂AI',
            icon: Platform,
            route: '/classroom'
          },
          {
            label: '备课工作台',
            icon: Monitor,
            route: '/workbench'
          }
        ]
      },
      {
        label: '企业办公 (Enterprise)',
        icon: OfficeBuilding,
        children: [
          {
            label: '应用中心',
            icon: Grid,
            route: '/apps'
          }
        ]
      }
    ]
  },
  {
    label: 'Skill编排工坊',
    icon: Connection,
    route: '/studio', // Root node goes to studio dashboard
    children: [
      {
        label: '新建Skill流',
        icon: Plus,
        action: 'create-skill'
      },
      {
        label: '我的Skill流 (草稿)',
        icon: Folder,
        children: [
          { label: '未命名Skill 1', icon: Document, action: 'edit-skill', id: 1 }
        ]
      }
    ]
  },
  {
    label: '系统设置',
    icon: Folder,
    children: [
      { label: '个人中心', icon: User, route: '/home' },
      { label: '关于平台', icon: InfoFilled, route: '/about' }
    ]
  }
];

const defaultProps = {
  children: 'children',
  label: 'label'
};

const handleNodeClick = (data) => {
  if (data.route) {
    router.push(data.route);
  } else if (data.action === 'create-skill') {
    router.push('/skill-editor');
  } else if (data.action === 'edit-skill') {
    router.push(`/skill-editor/${data.id}`);
  }
};


// --- 状态管理 ---
const showLogin = ref(false);
const showRegister = ref(false);
const isLoggedIn = ref(false);
const username = ref("");
const loading = ref(false);

// --- 🔥 邀请码相关状态 ---
const hasAccess = ref(false); // 默认为 false，必须验证
const inputCode = ref("");
const verifying = ref(false);

// 默认邀请码
const DEFAULT_CODE = "XUNKE2025"; 

// --- 生命周期检查 ---
onMounted(() => {
    // 🔥 修改：删除了“从 localStorage 读取 site_access_granted”的逻辑
    // 这样每次刷新页面，hasAccess 都会重置为 false，强制用户重新输入。
    
    // 检查登录状态 (自动登录)
    const storedToken = sessionStorage.getItem("loginToken");
    if (storedToken) {
        isLoggedIn.value = true;
    }
});

// --- 邀请码验证逻辑 ---
const verifyCode = () => {
    verifying.value = true;
    setTimeout(() => {
        // 读取管理员在后台设置的最新邀请码，如果没有则用默认的
        const currentCode = localStorage.getItem("admin_invite_code") || DEFAULT_CODE;
        
        if (inputCode.value === currentCode) {
            hasAccess.value = true;
            // 注意：这里不再保存 site_access_granted 到本地，确保刷新即失效
            ElMessage.success("验证通过，欢迎使用！");
        } else {
            ElMessage.error("邀请码错误");
            inputCode.value = "";
        }
        verifying.value = false;
    }, 600);
};

// --- 登录/注册逻辑 ---
const loginForm = ref({ username: "", password: "", role: "user" });
const registerForm = ref({ username: "", email: "", password: "", role: "user" });
const API_BASE = "http://localhost:5000/api";

const handleLogin = async () => {
  if(!loginForm.value.username || !loginForm.value.password) return ElMessage.warning("请填写完整信息");
  
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm.value)
    });
    const data = await res.json();
    if (res.ok) {
      isLoggedIn.value = true;
      username.value = data.username;
      showLogin.value = false;
      sessionStorage.setItem("userId", data.id);
      sessionStorage.setItem("loginToken", data.token);
      ElMessage.success(`欢迎回来，${data.username}`);
    } else {
      ElMessage.error(data.error || "登录失败");
    }
  } catch (err) {
    ElMessage.error("服务器连接失败");
  } finally {
    loading.value = false;
  }
};

const handleRegister = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerForm.value)
    });
    const data = await res.json();
    if (res.ok) {
      ElMessage.success("注册成功，请登录");
      showRegister.value = false;
      showLogin.value = true;
    } else {
      ElMessage.error(data.error || "注册失败");
    }
  } catch (err) {
    ElMessage.error("服务器连接失败");
  } finally {
    loading.value = false;
  }
};

const handleMenuCommand = (command) => {
  if (command === "logout") {
    isLoggedIn.value = false;
    username.value = "";
    sessionStorage.clear();
    ElMessage.info("已安全退出");
  } 
  // 删除了 admin 命令处理
};

const openIntro = () => {
  window.open('/about.pdf#toolbar=0', '_blank');
};
</script>

<style>
:root {
  --el-color-primary: #8b5cf6;
  --el-color-primary-light-3: #a78bfa;
  --el-color-primary-light-5: #c4b5fd;
  --el-color-primary-light-7: #ddd6fe;
  --el-color-primary-light-8: #ede9fe;
  --el-color-primary-light-9: #f5f3ff;
  --el-color-primary-dark-2: #5b21b6;
  
  --bg-color-dark: #f8fafc; /* Reverted to light */
  --bg-color-panel: #ffffff;
  --bg-color-card: #ffffff;
  --text-color-primary: #1e293b;
  --text-color-secondary: #64748b;
  --border-color: #e2e8f0;
}

body {
  margin: 0;
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-color-dark);
  color: var(--text-color-primary);
}

/* Reverted Theme Overrides */
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #fff;
}

.app-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-img {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: 0.5px;
  background: none;
  -webkit-text-fill-color: initial;
}

.glass-btn {
  /* Reverted glass styles if needed, or standard Element Plus styles */
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #f8fafc;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.resource-explorer {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.explorer-header {
  padding: 0 20px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.custom-tree {
  background: transparent;
}

.custom-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #334155;
}

.tree-icon {
  font-size: 16px;
  color: #64748b;
}
.tree-icon.folder-icon {
  color: #eab308; /* Folder Color */
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e2e8f0;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.content-area {
  flex: 1;
  background: #fff;
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  height: 100%;
  overflow-y: auto;
  padding: 0; /* Remove padding to let views control layout */
}

/* Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>

<style scoped>
/* ================= 🔥 核心修改：透明遮罩样式 ================= */
.invitation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    
    /* 修改点：更透明的背景，让用户能看清底下的内容 */
    background: rgba(0, 0, 0, 0.025); 

    /* 修改点：降低模糊度，从 10px 降为 2px，产生“雾里看花”的诱导感 */
    backdrop-filter: blur(2px);

    z-index: 9999; /* 确保在最上层阻挡点击 */
    display: flex;
    justify-content: center;
    align-items: center;
    
    /* 增加一个鼠标样式，暗示下面不可点 */
    cursor: not-allowed;
}

.invitation-box {
    /* 恢复鼠标样式为默认，方便输入 */
    cursor: default;
    
    background: rgba(255, 255, 255, 0.35); /* 盒子本身保持不透明，突出输入框 */
    padding: 30px;
    border-radius: 16px;
    text-align: center;
    width: 320px;
    box-shadow: 0 15px 40px rgba(0,0,0,0.2); /* 强阴影增加立体感 */
    animation: bounceIn 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.28);
}

.lock-icon {
    font-size: 40px;
    margin-bottom: 15px;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

.invitation-box h2 {
    margin: 0 0 5px 0;
    color: #5b21b6;
    font-size: 20px;
}

.invitation-box p {
    color: #666;
    margin-bottom: 25px;
    font-size: 14px;
}

.input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 15px;
}

.hint-text {
    font-size: 12px;
    color: #909399;
    margin-top: 10px;
}

@keyframes bounceIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

/* ================= App 基础布局 (保持不变) ================= */
.app-wrapper {
  height: 100vh; 
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  background-color: #f3f4f6;
}

/* Header */
.app-header {
  height: 60px;
  flex-shrink: 0;
  background: linear-gradient(90deg, #5b21b6 0%, #8b5cf6 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  color: white;
  z-index: 100;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.logo-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 8px;
}
.logo-text {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.auth-btn-group { display: flex; gap: 12px; }
.glass-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; }
.glass-btn:hover { background: rgba(255,255,255,0.3); color: white; border-color: white; }

.user-profile { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 12px; border-radius: 20px; transition: background 0.2s; }
.user-profile:hover { background: rgba(255,255,255,0.1); }
.username { color: white; font-weight: 500; }
.el-icon--right { color: rgba(255,255,255,0.7); }

/* Main Layout */
.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: calc(100vh - 60px);
}

/* Sidebar */
.sidebar {
  width: 250px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  z-index: 90;
  flex-shrink: 0;
}
.nav-menu {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  text-decoration: none;
  color: #64748b;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.2s;
  font-weight: 500;
}
.nav-icon { margin-right: 12px; font-size: 18px; transition: transform 0.2s; }
.nav-item:hover { background: #f1f5f9; color: #1e293b; }
.nav-item:hover .nav-icon { transform: scale(1.1); }
.nav-item.active { background: #f5f3ff; color: #8b5cf6; position: relative; }
.nav-item.active::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
  height: 20px; width: 3px; background: #8b5cf6; border-radius: 0 2px 2px 0;
}
/* Resource Explorer Styles */
.resource-explorer {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-top: 10px;
}

.explorer-header {
  padding: 0 20px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-tree {
  background: transparent;
  color: #64748b;
  font-size: 14px;
}

:deep(.el-tree-node__content) {
  height: 36px;
  border-radius: 4px;
  margin: 0 8px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f1f5f9;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #eff6ff;
  color: #3b82f6;
  font-weight: 500;
}

.custom-tree-node {
  display: flex;
  align-items: center;
}

.tree-icon {
  margin-right: 8px;
  font-size: 16px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #f1f5f9;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
}

/* Content Area */
.content-area {
  flex: 1;
  position: relative;
  background-color: #f8fafc;
  background-image: radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
  height: 100%;
  /* 💡 核心改动：允许溢出滚动 */
  overflow-y: auto; 
  
  /* 💡 针对 Firefox 和 IE 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 💡 针对 Chrome、Safari 和新版 Edge 隐藏滚动条 */
.content-area::-webkit-scrollbar {
  display: none;
  position: relative;
}
.content-wrapper { min-height: 100%; width: 100%; box-sizing: border-box; background-color: transparent; }

/* Dialog & Animations */
.full-width-btn { width: 100%; }
.fade-slide-enter-active, .fade-slide-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateX(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-10px); }
</style>