<template>
  <div class="app-component-root">
    
    <div v-if="!saasUrl && !isViewing" class="internal-version-switcher">
      <button class="minimal-toggle-btn" @click="showOldVersion = !showOldVersion">
        <el-icon><Refresh /></el-icon>
        <span>{{ showOldVersion ? '体验新版' : '回到旧版' }}</span>
      </button>
    </div>

    <div v-if="!showOldVersion" class="app-container">
      <div class="dashboard-mode">
        <div v-if="!saasUrl" class="portal-wrapper">
          <header class="header-section">
            <h1 class="greeting-text">
              欢迎使用 <span class="highlight-name">AI 智教课件空间</span>
            </h1>
            <p class="sub-text">基于多模态大模型的自动化教研助手</p>
          </header>

          <div class="resource-preview-grid">
            <div class="bento-card gradient-blue">
              <div class="bento-info"><h3>智能教案生成</h3><p>一键生成结构化教学设计</p></div>
            </div>
            <div class="bento-card gradient-purple">
              <div class="bento-info"><h3>交互式 PPT</h3><p>动态演示与实时语音交互</p></div>
            </div>
          </div>

          <div class="launch-card">
            <div class="status-indicator">
              <span class="status-dot" :class="{ 'pulse': !loading }"></span>
              {{ loading ? '教学资源初始化中...' : '系统就绪，环境安全' }}
            </div>
            <div v-if="!loading" class="action-area">
              <button class="hero-send-btn-large" @click="openAuthPopup">启动 AI 教学环境</button>
              <p class="security-note">系统将自动同步您的教师身份信息</p>
            </div>
            <div v-else class="init-loading-area">
              <div class="modern-progress"><div class="progress-bar-fill"></div></div>
              <p class="loading-sub-text">{{ loadingText }}</p>
            </div>
          </div>
        </div>

        <transition name="fade">
          <div v-if="saasUrl" class="iframe-wrapper">
            <iframe :src="saasUrl" class="saas-iframe" allow="microphone; camera; geolocation; fullscreen; clipboard-write; compute-pressure;" @load="onIframeLoaded"></iframe>
          </div>
        </transition>
      </div>
    </div>

    <div v-else class="ppt-page-container">
      
      <div v-if="isViewing" class="iframe-full-view">
        <div class="iframe-nav-bar">
          <div class="nav-left">
            <el-button @click="closeIframe" :icon="ArrowLeft" plain round size="small">退出</el-button>
            <span class="nav-title">制作中：<b>{{ currentTitle }}</b></span>
          </div>
          <div class="nav-right">
            <div class="logic-hint-box">
              <el-icon><WarningFilled /></el-icon>
              <span>如无法下载，请点击下方按钮<b>“打开新窗口展示”</b>进行下载</span>
            </div>
          </div>
        </div>
        <div class="iframe-holder">
          <iframe :src="currentUrl" class="real-iframe" frameborder="0" allow="clipboard-read; clipboard-write; microphone; camera; downloads" sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-downloads"></iframe>
        </div>
      </div>

      <div class="selection-box" v-show="!isViewing">
        <div class="selection-top-bar">
          <div class="page-back-btn"></div>
        </div>
        <div class="hero-header">
          <h1 class="main-title">📊 智能课件生成中心</h1>
          <p class="subtitle">请根据具体需求，选择合适的 AI 制作引擎</p>
        </div>
        <div class="cards-center-area">
          <div class="cards-flex-box">
            <div class="tool-card coze-theme" @click="openInternal('coze')">
              <div class="card-badge">深度定制</div>
              <div class="card-content">
                <div class="logo-area">
                  <img :src="cozeIcon" class="img-logo" alt="Coze Logo" />
                  <h2>Coze 扣子 PPT</h2>
                </div>
                <p class="desc">适合需要高度自定义的专业课件。</p>
                <div class="feature-list">
                  <div class="feature-item"><el-icon><Tools /></el-icon> <span>Agent 智能体编排</span></div>
                  <div class="feature-item"><el-icon><Brush /></el-icon> <span>样式深度可控</span></div>
                  <div class="feature-item"><el-icon><Connection /></el-icon> <span>多插件生态支持</span></div>
                </div>
              </div>
              <button class="action-btn">启动专业版 &rarr;</button>
            </div>

            <div class="tool-card kimi-theme" @click="openInternal('kimi')">
              <div class="card-badge">极速生成</div>
              <div class="card-content">
                <div class="logo-area"><span class="emoji-logo">🌙</span><h2>Kimi 演示文稿</h2></div>
                <p class="desc">一分钟内快速生成初稿的场景。</p>
                <div class="feature-list">
                  <div class="feature-item"><el-icon><Document /></el-icon> <span>长文档一键解析</span></div>
                  <div class="feature-item"><el-icon><Timer /></el-icon> <span>秒级极速生成</span></div>
                  <div class="feature-item"><el-icon><MagicStick /></el-icon> <span>自动配图排版</span></div>
                </div>
              </div>
              <button class="action-btn">启动极速版 &rarr;</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { 
  ArrowLeft, WarningFilled, Refresh, 
  Tools, Brush, Connection, Document, Timer, MagicStick 
} from "@element-plus/icons-vue";
import cozeIcon from '@/assets/coze.png';

const showOldVersion = ref(false);

// --- 新版逻辑变量 ---
const saasUrl = ref("");
const loading = ref(false);
const loadingText = ref("正在同步身份令牌...");
const APP_ID = "8295936608";
//const API_BASE = "http://localhost:5000";

// --- 旧版逻辑变量 ---
const isViewing = ref(false);
const currentUrl = ref("");
const currentTitle = ref("");

// --- 逻辑方法 ---
const openInternal = (type) => {
  if (type === 'coze') {
    currentUrl.value = "https://space.coze.cn/?skill=ppt";
    currentTitle.value = "Coze 扣子";
  } else {
    currentUrl.value = "https://www.kimi.com/zh/slides";
    currentTitle.value = "Kimi 演示文稿";
  }
  isViewing.value = true;
};
const closeIframe = () => { isViewing.value = false; currentUrl.value = ""; };

const openAuthPopup = async () => {
  loading.value = true;
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem('saas_pkce_verifier', verifier);
  const url = `https://saas.api.yoo-ai.com/oauth/authorize?app_id=${APP_ID}&response_type=code&code_challenge=${challenge}&redirect_uri=${encodeURIComponent(window.location.origin + window.location.pathname)}`;
  window.open(url, 'SaaSAuth', `width=600,height=700,top=100,left=100`);
};

const handleMessage = async (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data && event.data.type === 'AUTH_SUCCESS') {
    try {
      const res = await fetch(`http://localhost:5000/api/get-saas-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: event.data.code, code_verifier: sessionStorage.getItem('saas_pkce_verifier'), app_id: APP_ID, union_id: "Teacher_Demo" })
      });
      const data = await res.json();
      if (data.url) saasUrl.value = data.url;
    } catch (e) { loading.value = false; }
  }
};

onMounted(() => {
  const code = new URLSearchParams(window.location.search).get('code');
  if (window.opener && window.opener !== window && code) {
    window.opener.postMessage({ type: 'AUTH_SUCCESS', code }, window.location.origin);
    window.close();
    return;
  }
  window.addEventListener('message', handleMessage);
});

async function generatePKCE() {
  const randomValues = new Uint8Array(32); window.crypto.getRandomValues(randomValues);
  const verifier = btoa(String.fromCharCode(...randomValues)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const hash = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return { verifier, challenge };
}
const onIframeLoaded = () => { setTimeout(() => { loading.value = false; }, 300); };
onUnmounted(() => { window.removeEventListener('message', handleMessage); });
</script>

<style scoped>
/* 🔄 局部切换器样式：绝对定位在组件内，不会干扰 App.vue 顶栏 */
.app-component-root { position: relative; width: 100%; height: 100vh; overflow: hidden; }
.internal-version-switcher { position: absolute; top: 10px; right: 10px; z-index: 5000; }
.minimal-toggle-btn {
  display: flex; align-items: center; gap: 8px; padding: 6px 12px;
  background: rgba(255, 255, 255, 0.9); border: 1px solid #dcdfe6; border-radius: 6px;
  cursor: pointer; font-size: 12px; color: #606266; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.minimal-toggle-btn:hover { border-color: #409eff; color: #409eff; }

/* --- 1. 新版全量 CSS (保持您提供的) --- */
/* 1. 基础容器（提取你的样式） */
.app-container {
  height: 100vh; width: 100%; margin: 0px auto;
  
  overflow: hidden; position: relative;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}

.dashboard-mode { height: 100%; width: 100%; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; }

/* 2. 标题渐变（提取你的样式） */
.highlight-name {
  background: linear-gradient(120deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  font-weight: 800;
}

.portal-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 30px; }

/* 3. 模拟 Bento 预览卡片（增加正式感） */
.resource-preview-grid { display: flex; gap: 20px; width: 100%; max-width: 600px; }
.bento-card {
  flex: 1; border-radius: 16px; padding: 20px;
  border: 1px solid rgba(255,255,255,0.6);
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
}
.gradient-blue { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #1e40af; }
.gradient-purple { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); color: #5b21b6; }

/* 4. 启动卡片（类似你的 hero-input-container） */
.launch-card {
  width: 100%; max-width: 500px; background: #fff;
  padding: 30px; border-radius: 24px;
  box-shadow: 0 15px 40px -10px rgba(0,0,0,0.08);
  border: 1px solid #f1f5f9; text-align: center;
}

.status-indicator { font-size: 13px; color: #64748b; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
.status-dot.pulse { animation: pulse-green 2s infinite; }

/* 5. 启动按钮（类似你的 hero-send-btn） */
.hero-send-btn-large {
  width: 100%; padding: 14px; border-radius: 12px;
  background: #0f172a; color: white; border: none;
  font-size: 16px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.hero-send-btn-large:hover { background: #334155; transform: scale(1.02); }
.security-note { font-size: 11px; color: #94a3b8; margin-top: 15px; }

/* 6. 现代加载条 */
.modern-progress {
  height: 6px; width: 100%; background: #f1f5f9;
  border-radius: 10px; overflow: hidden; margin-bottom: 10px;
}
.progress-bar-fill {
  height: 100%; width: 40%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  animation: slide 1.5s infinite ease-in-out;
}

@keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
@keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }

.iframe-wrapper { position: absolute; inset: 0; background: #fff; z-index: 20; }
.saas-iframe { width: 100%; height: 100%; border: none; }
.fade-leave-active { transition: opacity 0.6s ease; }
.fade-leave-to { opacity: 0; }

/* --- 2. 旧版全量 CSS (保持您提供的) --- */
/* 💡 修正 1: 容器必须占满父级 content-area 的全部 */
.ppt-page-container {
  width: 100%;
  height: 100%; /* 这里的高度依赖 App.vue 的 content-area: height 100% */
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  overflow: hidden;
}

/* 💡 修正 2: 预览模式层，使用绝对定位确保 100% 覆盖 */
.iframe-full-view {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  z-index: 1000;
}

.iframe-nav-bar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px;
  flex-shrink: 0;
}

.nav-title { font-size: 14px; margin-left: 10px; color: #64748b; }
.nav-title b { color: #1e3a8a; }

/* 💡 修正 3: Iframe 承载容器必须拉满 */
.iframe-holder {
  flex: 1;
  width: 100%;
  height: 100%;
  background: #fdfdfd; /* 给个底色，方便肉眼判断是否渲染 */
}

.real-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block; /* 消除底边间隙 */
}

/* 💡 修正 4: 卡片选择区域布局 */
.selection-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hero-header { padding: 40px 0 20px; text-align: center; }
.main-title { font-size: 28px; font-weight: 800; color: #1e293b; margin: 0; }
.subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }

.cards-center-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding-bottom: 30px;
}

.cards-flex-box { display: flex; gap: 40px; padding: 20px; }

/* --- 🔥 完全保留你的卡片样式开始 --- */
.tool-card {
  width: 360px; background: white; border-radius: 24px; padding: 30px;
  box-sizing: border-box; cursor: pointer; transition: all 0.3s ease;
  position: relative; border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; justify-content: space-between;
}
.tool-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15); }
.card-badge { position: absolute; top: 15px; right: 15px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
.img-logo { width: 64px; height: 64px; object-fit: contain; margin: 0 auto 10px; display: block; }
.emoji-logo { font-size: 48px; display: block; text-align: center; margin-bottom: 5px; }
.desc { color: #64748b; text-align: center; line-height: 1.5; font-size: 13px; margin-bottom: 20px; }
.feature-list { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.feature-item { display: flex; align-items: center; gap: 10px; color: #475569; font-size: 14px; background: #f8fafc; padding: 10px 15px; border-radius: 12px; }
.action-btn { width: 100%; padding: 14px; border: none; border-radius: 12px; font-size: 15px; font-weight: bold; color: white; cursor: pointer; margin-top: 20px; }
.coze-theme { border-top: 5px solid #6366f1; }
.coze-theme .card-badge { background: #e0e7ff; color: #4338ca; }
.coze-theme .action-btn { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.kimi-theme { border-top: 5px solid #0f172a; }
.kimi-theme .card-badge { background: #f1f5f9; color: #334155; }
.kimi-theme .action-btn { background: linear-gradient(135deg, #1e293b, #334155); }
/* --- 🔥 完全保留你的卡片样式结束 --- */

.bottom-alert { padding: 15px; flex-shrink: 0; }

@keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
</style>