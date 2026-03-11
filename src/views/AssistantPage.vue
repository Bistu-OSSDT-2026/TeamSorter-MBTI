<template>
  <div class="main-wrapper">
    
    <transition name="fade">
      <div v-if="isLaunching" class="launch-overlay">
        <div class="launch-content">
          <div class="spinner-box">
            <div class="circle-border">
              <div class="circle-core"></div>
            </div>
          </div>
          
          <h2 class="launch-title">大模型正在启动中...</h2>
          <p class="launch-subtitle">正在建立安全连接并加载上下文</p>
          
          <div class="countdown-box">
            <span class="number">{{ countdown }}</span>
            <span class="unit">s</span>
          </div>
        </div>
      </div>
    </transition>

    <div class="app-container">
      
      <div v-if="messages.length === 0 && !loading" class="dashboard-mode">
        
       <div class="header-section">
        <div class="greeting-text">
          {{ timeState.hello }}，<span class="highlight-name">老师</span>
        </div>
        <div class="sub-text">{{ timeState.sub }}</div>
      </div>

        <div class="tools-section">
          
          <div class="tools-header">
            <div class="section-label">⚡ 常用工具</div>
            <div class="header-actions">
              <button class="action-btn" @click="handleSettings" title="调整卡片顺序或增删">
                ⚙️ 管理
              </button>
              <button class="action-btn" title="查看更多应用">
                ::: 更多
              </button>
            </div>
          </div>

          <div class="bento-grid">
            <div 
              v-for="tool in toolsList" 
              :key="tool.id" 
              class="bento-card" 
              :class="[tool.colorClass]"
              @click="handleToolClick(tool)"
            >
              <div class="card-top">
                <div class="bento-icon">{{ tool.icon }}</div>
              </div>
              <div class="bento-info">
                <h3>{{ tool.name }}</h3>
                <p>{{ tool.desc }}</p> 
              </div>
            </div>
          </div>

        </div>

        <div class="hero-input-wrapper">
          <div class="hero-input-container">
            <textarea
              v-model="userInput"
              class="hero-textarea"
              placeholder="✨ 请输入您的备课需求，例如：'帮我生成一份初一年级语文上册教案'..."
              @keydown.enter.prevent="sendMessage"
            ></textarea>
            
            <div class="hero-footer">
              <div class="toggles-area">
                <div class="toggle-pill" :class="{ active: reasoningMode }" @click="toggleReasoning">
                  <span class="icon">🧠</span> 深度思考
                </div>
                <label class="toggle-pill file-upload">
                  <span class="icon">📁</span> 上传文件
                  <input type="file" @change="handleFileUpload" />
                </label>
                <span v-if="uploadedFileContent" class="file-tip">✅ 已读取</span>
              </div>
              <button class="hero-send-btn" @click="sendMessage" :disabled="!userInput.trim() && !uploadedFileContent">
                ➤
              </button>
            </div>
          </div>
        </div>

       <div class="resources-section">
          <div class="section-label">📚 精选资源</div>
          <div class="resource-row">
            <div class="res-pill" @click="handleResourceClick('exam-bank')">📘  精品试题题库  </div>
            <div class="res-pill" @click="handleResourceClick('ai-course')">🏫 人工智能课程体系<span class="pill-tag">Hot</span></div>
            <div class="res-pill" @click="handleResourceClick('portfolio')">
                📊 学生成长档案
            </div>
            <div class="res-pill" @click="handleResourceClick('new-curriculum')">📗 2025新课标解读</div>
          </div>
        </div>

      </div>

      <div v-else class="chat-mode">
        <div class="chat-header-simple">
          <div class="header-left-group">
            <button class="back-home-btn" @click="resetToHome" title="清空对话并返回">
              <span class="back-arrow">←</span> 首页
            </button>
            <span class="divider">|</span>
            <span class="chat-title-text">🤖 备课助手</span>
          </div>
          <div class="header-controls">
            <button @click="toggleReasoning" class="mini-btn" :class="{active: reasoningMode}">
              {{ reasoningMode ? "🧠 深度思考 ON" : "🧠 思考 OFF" }}
            </button>
          </div>
        </div>

        <div class="chat-messages" ref="messagesContainer">
          <div v-for="(msg, index) in messages" :key="index" :class="['chat-bubble', msg.role]">
            <div class="bubble-inner">
              <strong v-if="msg.role === 'user'" class="sender">我：</strong>
              <strong v-else class="sender">助手：</strong>
              <div v-if="msg.reasoning" class="bubble-reasoning">{{ msg.reasoning }}</div>
              <div class="bubble-text">
                <span v-for="(line, i) in formatMessage(msg.content)" :key="i" class="bubble-line">{{ line }}<br /></span>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-input-bar">
          <label class="icon-btn file-btn">📁<input type="file" @change="handleFileUpload" /></label>
          <input v-model="userInput" type="text" placeholder="请输入你的问题..." @keyup.enter="sendMessage" :disabled="loading" />
          <button class="send-btn" @click="sendMessage" :disabled="loading">{{ loading ? "..." : "发送" }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onBeforeUnmount } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import "element-plus/es/components/message-box/style/css";
import { useRouter } from "vue-router"; 

const router = useRouter(); 

// --- 状态变量 ---
const userInput = ref("");
const messages = ref([]);
const loading = ref(false);
const reasoningMode = ref(false);
const messagesContainer = ref(null);
const uploadedFileContent = ref("");

// 🔥 2. 新增：倒计时动画相关状态
const isLaunching = ref(false);
const countdown = ref(6);
let timer = null;

// --- 工具列表数据 ---
const toolsList = ref([
  { id: 1, name: "智能教案", icon: "🤖", desc: "一键生成完整教案", colorClass: "gradient-blue" },
  { id: 2, name: "课件PPT", icon: "📺", desc: "大纲生成课件", colorClass: "gradient-purple" },
  { id: 3, name: "出题助手", icon: "📝", desc: "智能生成试卷", colorClass: "gradient-green" },
  { id: 4, name: "作文批改", icon: "✍️", desc: "语文作文一键批改", colorClass: "gradient-orange" },
  { id: 5, name: "文生图", icon: "🎨", desc: "图片一键修改", colorClass: "gradient-pink" },
  { id: 6, name: "全科作业批改", icon: "🗣️", desc: "AI智能批改", colorClass: "gradient-indigo" },
  { id: 7, name: "AI图像编辑", icon: "🖼️", desc: "图片一键修改", colorClass: "gradient-cyan" },
  { id: 8, name: "朗读分贝", icon: "📢", desc: "班级噪音监测", colorClass: "gradient-teal" },
]);

// --- 时间问候 ---
const timeState = computed(() => {
  const hour = new Date().getHours();

  // 1. 深夜/凌晨模式 (21:00 - 06:00)
  if (hour >= 21 || hour < 6) {
    return {
      hello: "深夜好",
      sub: "夜深了，注意身体，老师该休息了 🌙" // 您的特定需求
    };
  }
  
  // 2. 上午模式 (06:00 - 12:00)
  if (hour < 12) {
    return {
      hello: "上午好",
      sub: "一日之计在于晨，准备好开始今天的备课了吗？ ☀️"
    };
  }
  
  // 3. 下午模式 (12:00 - 18:00)
  if (hour < 18) {
    return {
      hello: "下午好",
      sub: "午后时光，喝杯茶继续高效备课吧 ☕"
    };
  }
  
  // 4. 晚上模式 (18:00 - 21:00)
  return {
    hello: "晚上好",
    sub: "忙碌了一天，整理一下明天的教学思路吧 🌟"
  };
});

// --- 🔥 3. 核心修改：点击处理与倒计时逻辑 ---
function handleToolClick(tool) {
  if (tool.id === 4) {
    // 启动倒计时跳转流程
    startLaunchProcess('/essay');  
  }

  // 🔥 2. 课件PPT (新增跳转)
  else if (tool.id === 2) {
    // 这里使用本页路由跳转，不使用倒计时，因为 PPT 页面本身就是一个导航页
    router.push('/ppt');
  }
  // 🔥 1. 智能教案
  else if (tool.id === 1) {
    router.push('/lesson-plan');
  }

  else if (tool.id === 3) {
    // 跳转到出题页面
    router.push('/exam');
  }

   else if (tool.id === 6) {
    // 跳转到出题页面
    router.push('/homework-correction');
  }

  // 🔥 新增：文生图 (ID 5)
  else if (tool.id === 5) {
    startLaunchProcess('/image-gen'); // 复用倒计时启动效果
  }

  else if (tool.id === 7) {
    startLaunchProcess('/image-edit');
  }

  else if (tool.id === 8) {
    //startLaunchProcess('/decibel');
    const routeData = router.resolve({ path: '/decibel' });
    // 2. 打开新窗口
    window.open(routeData.href, '_blank');
  }
  else {
    ElMessage.info(`功能【${tool.name}】正在内测中，敬请期待...`);
  }
}

function handleResourceClick(type) {
  if (type === 'portfolio') {
    // Navigate to Student Portfolio
    router.push('/portfolio');
  } 
   else if (type === 'ai-course') {
    // 链接到 public 目录下的 AIclass.pdf
    window.open('/AIclass.pdf#toolbar=0', '_blank');
  }
  //else if (type === 'exam-bank') {
    // 链接到 public 目录下的 AIclass.pdf
    //router.push('/test');
  //}
  else {
    // Placeholder for other resources
    ElMessage.info("该资源正在更新中，请稍后访问...");
  }
}

function startLaunchProcess(targetPath) {
  isLaunching.value = true;
  countdown.value = 3; // 设置倒计时秒数

  // 可以在这里预加载资源，例如:
  // const img = new Image(); img.src = '@/assets/composition-test.jpg';

  timer = setInterval(() => {
    countdown.value--;
    
    if (countdown.value <= 0) {
      clearInterval(timer);
      // 跳转路由
      router.push(targetPath);
      
      // 稍微延迟关闭遮罩，让过渡更平滑 (可选，不需要则直接 false)
      setTimeout(() => {
        isLaunching.value = false;
      }, 1000);
    }
  }, 1000);
}

// 销毁组件前清理定时器
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

// --- 其他原有功能函数 ---

function toggleReasoning() {
  reasoningMode.value = !reasoningMode.value;
}

function handleSettings() {
  ElMessageBox.alert('此处将弹窗允许用户拖拽排序、隐藏/显示卡片', '卡片管理');
}

function resetToHome() {
  const doReset = () => {
    messages.value = [];
    userInput.value = "";
    uploadedFileContent.value = "";
    loading.value = false;
  };

  if (messages.value.length > 0) {
    ElMessageBox.confirm(
      '确定要结束当前对话并返回首页吗？聊天记录将被清空。',
      '返回首页',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    ).then(() => doReset()).catch(() => {});
  } else {
    doReset();
  }
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (messages.value.length > 0) {
    messages.value.push({ role: "user", content: `📄 已上传文件：${file.name}` });
    await nextTick();
    scrollToBottom();
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("http://localhost:5000/api/parse-file", { method: "POST", body: formData });
    const data = await res.json();
    uploadedFileContent.value = data.text || "";

    if (messages.value.length > 0) {
      messages.value.push({ role: "assistant", content: `✅ 文件解析成功，已提取 ${data.text.length} 个字符。` });
      await nextTick();
      scrollToBottom();
    }
  } catch (err) {
    if(messages.value.length > 0) messages.value.push({ role: "assistant", content: "⚠️ 文件解析失败。" });
  }
}

async function sendMessage() {
  if (!userInput.value.trim() && !uploadedFileContent.value) return;

  loading.value = true;
  const combinedContent = `${uploadedFileContent.value}\n\n${userInput.value.trim()}`;

  messages.value.push({ role: "user", content: combinedContent });
  const assistantMsg = { role: "assistant", content: "", reasoning: "" };
  messages.value.push(assistantMsg);

  userInput.value = "";
  uploadedFileContent.value = ""; 
  await nextTick();
  scrollToBottom();

  try {
    // 💡 获取当前用户ID (假设存储在 sessionStorage 中，如果没有则使用默认 'guest')
    const userId = sessionStorage.getItem('userId') || 'guest';
    const appId = "default_assistant"; // 默认助手的 ID

    const response = await fetch("http://localhost:5000/api/chat-stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        content: combinedContent, 
        reasoningMode: reasoningMode.value,
        userId: userId,
        appId: appId
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    /* eslint-disable no-constant-condition */
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      chunk.split("\n").filter(line => line.startsWith("data: ")).forEach(line => {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta;
          if (delta) {
            if (delta.content) assistantMsg.content += delta.content;
            if (delta.reasoning_content) assistantMsg.reasoning += delta.reasoning_content;
            messages.value = [...messages.value];
            nextTick().then(scrollToBottom);
          }
        } catch (err) { console.warn("解析流数据失败", err, data);}
      });
    }
  } catch (err) {
    assistantMsg.content = "⚠️ 请求失败。";
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function formatMessage(text) {
  if (!text) return [];
  return text.replace(/#/g, "").replace(/\r\n|\r|\n/g, "\n").split(/\n+/).map(l => l.trim()).filter(l => l.length > 0);
}

function scrollToBottom() {
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
}
</script>

<style scoped>
/* ================= 样式修正 ================= */

/* 包裹层：锁定全屏，禁止出现全局滚动条 */
.main-wrapper {
  position: relative;
  width: 100%;
  height: 90vh; /* 锁定视口高度 */
  overflow: hidden; 
  
}

/* ================= 启动遮罩层样式 (保持不变) ================= */
.launch-overlay {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.launch-content {
  text-align: center;
  animation: floatUp 0.5s ease-out;
}

.launch-title {
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  margin: 20px 0 10px;
  letter-spacing: 1px;
}

.launch-subtitle {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 30px;
}

.countdown-box {
  font-family: 'Arial', sans-serif;
  font-size: 56px;
  font-weight: bold;
  color: #8b5cf6;
  display: flex;
  align-items: baseline;
  justify-content: center;
}
.countdown-box .unit {
  font-size: 20px;
  margin-left: 5px;
  color: #94a3b8;
}

.spinner-box {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  position: relative;
}

.circle-border {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid #e2e8f0;
  border-top-color: #8b5cf6;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes floatUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ================= 仪表盘自适应布局修正 ================= */

.app-container {
  height: 100%; /* 填满 main-wrapper */
  width: 100%; 
  position: relative;
  overflow: hidden; 
  box-sizing: border-box;
  margin: 0 auto; 
}

.dashboard-mode {
  height: 100%;
  width: 100%;         
  max-width: 1600px;  
  margin: 0 auto;    
  display: flex;
  flex-direction: column;
  padding: 2vh 40px; /* 使用vh单位随高度缩放 */
  box-sizing: border-box;
  gap: 1.5vh;        /* 间距随屏幕高度自动缩放，防止堆叠 */
  justify-content: space-between; /* 关键：让内容在垂直方向均匀分布 */
  overflow-y: auto;   /* 如果屏幕实在太小，允许内部滚动，不撑开全局 */
}

/* 顶部问候 */
.header-section { 
  text-align: center; 
  margin-top: 1vh; 
  flex-shrink: 0; 
}
.greeting-text { font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.5px; }
.highlight-name { background: linear-gradient(120deg, #8b5cf6 0%, #d946ef 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.sub-text { margin-top: 4px; color: #94a3b8; font-size: 15px; }

/* 工具区域：锁定4列，不乱动 */
.tools-section { 
  width: 100%; 
  flex-shrink: 0; 
}
.tools-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 0 4px; }
.section-label { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
.header-actions { display: flex; gap: 10px; }
.action-btn { background: transparent; border: 1px solid #e2e8f0; color: #64748b; font-size: 12px; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 4px; }
.action-btn:hover { background: #fff; border-color: #8b5cf6; color: #8b5cf6; }

/* 锁定网格结构 */
.bento-grid { 
  display: grid; 
  grid-template-columns: repeat(4, 1fr); /* 保持4列不变 */
  grid-auto-rows: 95px; 
  gap: 16px; 
}
.bento-card { border-radius: 16px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; justify-content: center; border: 1px solid rgba(255,255,255,0.6); position: relative; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.bento-card:hover { transform: translateY(-2px); box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1); }
.card-top { margin-bottom: 6px; }
.bento-icon { font-size: 24px; background: rgba(255,255,255,0.5); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bento-info h3 { margin: 0; font-size: 15px; font-weight: 700; white-space: nowrap; }
.bento-info p { margin: 2px 0 0; font-size: 11px; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 渐变定义 (保持不变) */
.gradient-blue   { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #1e40af; }
.gradient-purple { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); color: #5b21b6; }
.gradient-green  { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); color: #166534; }
.gradient-orange { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); color: #c2410c; }
.gradient-pink   { background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); color: #be185d; }
.gradient-indigo { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); color: #3730a3; }
.gradient-cyan   { background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%); color: #0e7490; }
.gradient-teal   { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); color: #0f766e; }

/* 输入框自适应 */
.hero-input-wrapper { width: 100%; display: flex; justify-content: center; flex-shrink: 0; }
.hero-input-container { width: 100%; background: #ffffff; border-radius: 24px; box-shadow: 0 15px 40px -10px rgba(0,0,0,0.08); padding: 20px 24px; border: 1px solid #f1f5f9; transition: border-color 0.3s; }
.hero-input-container:focus-within { border-color: #8b5cf6; box-shadow: 0 20px 50px -12px rgba(139, 92, 246, 0.15); }
.hero-textarea { width: 100%; min-height: 60px; /* 适当缩小最小高度防止溢出 */ border: none; font-size: 16px; line-height: 1.6; resize: none; outline: none; color: #334155; background: transparent; }
.hero-textarea::placeholder { color: #cbd5e1; }
.hero-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.toggles-area { display: flex; gap: 10px; flex-wrap: wrap; }
.toggle-pill { padding: 5px 12px; background: #f8fafc; border-radius: 20px; font-size: 13px; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 5px; border: 1px solid transparent; font-weight: 500; }
.toggle-pill:hover { background: #f1f5f9; }
.toggle-pill.active { background: #f5f3ff; color: #7c3aed; border-color: #ddd6fe; }
.file-upload input { display: none; }
.hero-send-btn { width: 40px; height: 40px; border-radius: 12px; background: #0f172a; color: white; border: none; cursor: pointer; font-size: 16px; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
.hero-send-btn:hover { background: #334155; transform: scale(1.05); }
.hero-send-btn:disabled { background: #e2e8f0; cursor: not-allowed; transform: none; }

/* 资源部分：锁定不换行 */
.resources-section { width: 100%; flex-shrink: 0; margin-bottom: 5px; }
.resource-row { 
  display: flex; 
  gap: 12px; 
  flex-wrap: nowrap; /* 核心：禁止换行堆叠 */
  overflow-x: auto;  /* 如果屏幕太窄，支持横向滑动 */
  padding-bottom: 5px;
}
/* 隐藏资源栏的横向滚动条，保持美观 */
.resource-row::-webkit-scrollbar { display: none; }
.resource-row { -ms-overflow-style: none; scrollbar-width: none; }

.res-pill { flex: 1; min-width: 150px; background: #fff; border: 1px solid #e2e8f0; padding: 10px 16px; border-radius: 12px; font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s; }
.res-pill:hover { border-color: #cbd5e1; background: #f8fafc; color: #1e293b; }
.pill-tag { font-size: 10px; background: #fee2e2; color: #ef4444; padding: 2px 5px; border-radius: 4px; }

/* ================= 聊天模式 (保持不变) ================= */
.chat-mode { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: #f8fafc; display: flex; flex-direction: column; overflow: hidden; }
.chat-header-simple { height: 50px; flex-shrink: 0; border-bottom: 1px solid #e2e8f0; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; z-index: 10; }
.header-left-group { display: flex; align-items: center; gap: 12px; }
.back-home-btn { background: none; border: 1px solid transparent; color: #64748b; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; }
.back-home-btn:hover { background: #f1f5f9; color: #334155; }
.mini-btn { padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; font-size: 12px; cursor: pointer; }
.mini-btn.active { background: #f5f3ff; color: #8b5cf6; border-color: #8b5cf6; }
.chat-messages { flex: 1; overflow-y: auto; padding: 20px; padding-bottom: 90px; display: flex; flex-direction: column; gap: 20px; width: 100%; }
.chat-bubble { display: flex; width: 100%; }
.chat-bubble.user { justify-content: flex-end; }
.chat-bubble.assistant { justify-content: flex-start; }
.bubble-inner { max-width: 80%; padding: 14px 18px; border-radius: 16px; line-height: 1.6; font-size: 15px; }
.chat-bubble.user .bubble-inner { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-bottom-right-radius: 2px; }
.chat-bubble.assistant .bubble-inner { background: #ffffff; border: 1px solid #e2e8f0; color: #1f2937; border-bottom-left-radius: 2px; }
.bubble-reasoning { background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 8px 12px; margin-bottom: 8px; font-size: 13px; color: #64748b; }
.chat-input-bar { position: absolute; bottom: 0; left: 0; width: 100%; height: 70px; padding: 15px 20px; background: #fff; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; align-items: center; box-sizing: border-box; z-index: 20; }
.chat-input-bar input { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; outline: none; background: #f8fafc; }
.chat-input-bar input:focus { background: #fff; border-color: #8b5cf6; }
.icon-btn { cursor: pointer; font-size: 20px; }
.file-btn input { display: none; }
.send-btn { padding: 8px 20px; background: #8b5cf6; color: white; border: none; border-radius: 8px; cursor: pointer; }
</style>