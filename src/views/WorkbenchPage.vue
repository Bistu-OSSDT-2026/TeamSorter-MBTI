<template>
  <div class="workbench-container">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3>📂 应用列表</h3>
      </div>
      
      <div class="app-list">
        <div
          v-for="(dialogue, index) in appDialogues"
          :key="dialogue._id"
          class="app-item"
          :class="{ active: selectedAppId === dialogue._id }"
          @click="selectDialogues(dialogue._id)"
        >
          <div class="app-item-content">
            <span class="app-icon">{{ dialogue.appName.slice(0,1) }}</span>
            <span class="app-name">{{ dialogue.appName }}</span>
          </div>

          <div class="action-trigger" @click.stop="toggleMenu(index)">
            ⋮
            <transition name="fade">
              <div v-if="dialogue.showMenu" class="action-menu" @click.stop>
                <div class="menu-item" @click="topApp(index)">📌 置顶</div>
                <div class="menu-item delete" @click="removeApp(index, dialogue._id)">🗑️ 删除</div>
              </div>
            </transition>
          </div>
        </div>
      </div>
    </aside>

    <main class="workspace" v-if="selectedAppId">
      <header class="workspace-header">
        <h2 class="workspace-title">{{ selectedAppName }}</h2>
        
        <div class="mode-switcher">
          <div 
            class="switch-item" 
            :class="{ active: !displayChatBox }"
            @click="switchMode(false)"
          >
            📝 参数配置
          </div>
          <div 
            class="switch-item" 
            :class="{ active: displayChatBox }"
            @click="switchMode(true)"
          >
            💬 生成结果
          </div>
        </div>
      </header>

      <div class="workspace-body" ref="scrollContainer">
        
        <div v-show="!displayChatBox" class="form-container">
          <div class="form-grid">
            <div 
              v-for="(element, index) in metaData" 
              :key="element.key" 
              class="form-group"
              :class="{ 'full-width': isFullWidth(element.type) }"
            >
              <label :for="element.key">{{ element.label }}</label>
              
              <input 
                v-if="element.type === 'text'" 
                type="text" 
                :id="element.key" 
                v-model="element.value" 
                :placeholder="'请输入' + element.label"
                class="form-input"
              />

              <select 
                v-else-if="element.type === 'dropdown'" 
                :id="element.key" 
                v-model="element.value"
                class="form-select"
              >
                <option v-for="opt in element.options" :key="opt.key" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>

              <label v-else-if="element.type === 'checkbox'" class="checkbox-wrapper">
                <input type="checkbox" :id="element.key" v-model="element.value" />
                <span>启用此选项</span>
              </label>

              <div v-else-if="['imageUpload', 'image_url', 'fileUpload'].includes(element.type)" class="upload-wrapper">
                <label class="custom-file-upload">
                  
                  <input type="file" @change="(e) => element.type === 'fileUpload' ? handleFileUpload(e, index) : handleImageUpload(e, index)" />
                </label>
                <div v-if="element.value && Array.isArray(element.value)" class="img-previews">
                   <img v-for="(img, i) in element.value" :key="i" :src="img.url || img" />
                </div>
                <div v-else-if="element.value && typeof element.value === 'string' && element.value.length > 20" class="file-status">
                   ✅ 已解析文本 ({{ element.value.length }} 字)
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="submitForm" class="primary-btn large-btn">🚀 开始生成内容</button>
          </div>
        </div>

        <div v-show="displayChatBox" class="chat-container">
          <div class="chat-list" ref="chatHistoryBox">
            <div v-for="(msg, index) in chatHistory" :key="index" :class="['message-row', msg.senderType]">
              <div class="avatar">
                {{ msg.senderType === 'user' ? '👤' : '🤖' }}
              </div>
              
              <div class="bubble">
                <div v-if="msg.reasoning" class="reasoning-block">
                  <div class="reasoning-header" @click="msg.expandReasoning = !msg.expandReasoning">
                    <span>🧠 深度思考过程</span>
                    <span class="arrow">{{ msg.expandReasoning ? '▲' : '▼' }}</span>
                  </div>
                  <div v-show="msg.expandReasoning" class="reasoning-content">
                    {{ msg.reasoning }}
                  </div>
                </div>

                <div class="markdown-body" v-html="renderMarkdown(msg.message)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="workspace-footer" v-if="displayChatBox">
        <div class="input-wrapper">
          <textarea
            v-model="userInput"
            placeholder="继续对话或提问..."
            rows="1"
            @keyup.enter.exact.prevent="sendMessage"
            class="chat-input"
          ></textarea>
          <button @click="sendMessage" :disabled="loading" class="send-btn">
            {{ loading ? "..." : "发送" }}
          </button>
        </div>
      </footer>
    </main>

    <div v-else class="empty-state">
      <div class="empty-icon">👈</div>
      <p>请在左侧选择一个应用开始备课</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from "vue";
import { CozeAPI } from "@coze/api";
import { ElMessage, ElMessageBox } from "element-plus";
import { format } from 'date-fns';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, linkify: true, breaks: true });
const API_BASE = 'http://localhost:5000/api';

// -------------------- 响应式数据 --------------------
const userInput = ref(""); 
const loading = ref(false); 
const appDialogues = ref([]); 
const displayChatBox = ref(false); 
const selectedAppId = ref(null); 
const selectedAppName = ref(null); 
const metaData = ref(null); 
const chatHistoryBox = ref(null); 
const chatHistory = ref([]); 

// -------------------- 辅助函数 --------------------
const renderMarkdown = (text) => {
  if (!text) return '';
  return md.render(text);
};

const isFullWidth = (type) => {
  // 让大文本框或文件上传占满一行
  return ['textarea', 'fileUpload', 'imageUpload', 'image_url'].includes(type);
};

const scrollToBottom = () => {
  if (chatHistoryBox.value) {
    chatHistoryBox.value.scrollTop = chatHistoryBox.value.scrollHeight;
  }
};

const switchMode = (isChat) => {
  displayChatBox.value = isChat;
  if (isChat) nextTick(scrollToBottom);
};

// ... (此处保留原有 removeApp, toggleMenu, hideAllMenus, topApp 逻辑，代码不变，略去以节省空间) ...
// 务必将原代码中的这些函数完整复制过来

// 删除应用对话记录
const removeApp = (index, appDialoguesId) => {
  ElMessageBox.confirm('确认删除该应用对话记录？', '提示', { type: 'warning' })
    .then(async () => {
      const res = await fetch(`${API_BASE}/deleteChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appDialoguesId })
      });
      const json = await res.json();
      if (json.ok) {
        ElMessage.success('已删除');
        if(selectedAppId.value === appDialoguesId) selectedAppId.value = null;
        appDialogues.value.splice(index, 1);
      } else {
        ElMessage.error(json.error || '删除失败');
      }
    })
    .catch(() => {});
};

// 切换下拉菜单
const toggleMenu = (index) => {
  appDialogues.value.forEach((dialogue, i) => {
    dialogue.showMenu = i === index ? !dialogue.showMenu : false;
  });
};

// 点击空白区域隐藏菜单
const hideAllMenus = (event) => {
  if (!event.target.closest('.action-trigger') && !event.target.closest('.action-menu')) {
    appDialogues.value.forEach(d => d.showMenu = false);
  }
};

// 置顶应用
const topApp = (index) => {
  const item = appDialogues.value.splice(index, 1)[0];
  appDialogues.value.unshift(item);
  appDialogues.value.forEach(d => d.showMenu = false);
};

// -------------------- 核心逻辑 (sendMessage) --------------------
// 保持原逻辑，但增加了 expandReasoning 属性
const sendMessage = async () => {
  if (!userInput.value.trim()) return;

  const question = userInput.value;
  loading.value = true;
  userInput.value = "";

  // 获取 Session 数据 (保持原样)
  const systemMessage = sessionStorage.getItem("systemMessage");
  const isNeedBotId = sessionStorage.getItem("isNeedBotId");
  const url = sessionStorage.getItem("url");
  const token = sessionStorage.getItem("token");
  const loginToken = sessionStorage.getItem("loginToken");
  const userId = sessionStorage.getItem("userId");
  const dialogueId = sessionStorage.getItem("dialogueId");

  chatHistory.value.push({ senderType: "user", message: question, timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss') });
  updateChat(dialogueId, chatHistory.value);
  nextTick(scrollToBottom);

  if (isNeedBotId === 'true') {
     // Coze 逻辑保持不变...
     // (此处请保留你原来的 Coze 调用代码)
     const apiClient = new CozeAPI({
      token: token,
      baseURL: url,
      allowPersonalAccessTokenInBrowser: true,
    });
    const bot_id = sessionStorage.getItem("bot_id");
    try {
      const stream = await apiClient.chat.stream({
        bot_id,
        userId,
        additional_messages: [{ content: question, content_type: "text", role: "user", type: "question" }],
      });
      for await (const event of stream) {
        if (event.event === "conversation.message.completed" && event.data?.type === "answer") {
          chatHistory.value.push({
            senderType: "assistant",
            message: event.data.content || "",
            timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
          });
          break;
        }
      }
    } catch (err) {
      chatHistory.value.push({ senderType: "assistant", message: "Error: " + err.message });
    } finally {
       updateChat(dialogueId, chatHistory.value);
       loading.value = false;
    }
  } else {
    // 自定义接口逻辑
    const assistantMsg = { 
      senderType: "assistant", 
      message: "", 
      reasoning: "", 
      expandReasoning: false, // 新增：默认折叠思考
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss') 
    };
    chatHistory.value.push(assistantMsg);
    
    try {
      // 构造 Payload (保持原样)
      let bodyPayload = { url, token, loginToken, systemMessageInfo: systemMessage, message: question };
      if (url.includes("qianfan")) {
         bodyPayload = { model: "qianfan-composition", stream: true, messages: [{ role: "user", content: [{ type: "text", text: question }] }] };
      } else if (url.includes("deepseek")) {
         bodyPayload = { url, token, loginToken, message: question, systemMessageInfo: systemMessage };
      }

      const response = await fetch(`${API_BASE}/chat-app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
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
             // 适配不同的 API 返回结构
             const contentDelta = json.content || json.choices?.[0]?.delta?.content || "";
             const reasoningDelta = json.reasoning_content || json.choices?.[0]?.delta?.reasoning_content || "";
             
             if (contentDelta) assistantMsg.message += contentDelta;
             if (reasoningDelta) assistantMsg.reasoning += reasoningDelta;
             
             // 强制 Vue 更新视图
             chatHistory.value = [...chatHistory.value]; 
             nextTick(scrollToBottom);
           } catch(e) { /* ignore */ }
        });
      }
    } catch (err) {
      assistantMsg.message = "请求失败: " + err.message;
    } finally {
      loading.value = false;
      updateChat(dialogueId, chatHistory.value);
    }
  }
};

// -------------------- 文件/表单处理 (保持原逻辑) --------------------
const handleImageUpload = async (event, index) => {
  const files = Array.from(event.target.files || []);
  metaData.value[index].value = [];
  for (const file of files) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    await new Promise((resolve) => {
      reader.onload = () => { metaData.value[index].value.push({ url: reader.result }); resolve(); };
    });
  }
};

const handleFileUpload = async (event, index) => {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`${API_BASE}/parse-file`, { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
      metaData.value[index].value = data.text || '';
      ElMessage.success('文件解析成功');
    } else ElMessage.error(data.error);
  } catch (err) { ElMessage.error('上传失败'); }
};

const submitForm = async () => {
  if (!metaData.value) return;
  const messageToSendArray = [];
  // ... (保持原有的表单转文字逻辑)
  metaData.value.forEach(f => {
    if (!f.value) return;
    switch (f.type) {
      case 'text': case 'dropdown': case 'checkbox': case 'fileUpload':
        messageToSendArray.push({ type: "text", text: `${f.label}是${f.value}` }); break;
      case 'imageUpload':
        f.value.forEach(imgUrl => messageToSendArray.push({ type: "image_url", image_url: { url: imgUrl } })); break;
    }
  });

  if (messageToSendArray.length === 0) return ElMessage.warning('表单为空');
  
  userInput.value = JSON.stringify(messageToSendArray);
  switchMode(true); // 切换到聊天模式
  await sendMessage();
};

// ... (saveChat, updateChat, selectDialogues, initAppDialogues, getAllDialogues 保持不变) ...
// -------------------- 聊天记录操作 --------------------
const saveChat = async(appId, userId, chats) => {
  try {
    const res = await fetch(`${API_BASE}/saveChat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId, userId, chats }) });
    const data = await res.json();
    if (res.ok) ElMessage.success('对话存储成功'); else ElMessage.error(data.error || '对话存储失败');
  } catch (err) { console.error(err); ElMessage.error('接口调用失败'); }
};

const updateChat = async(dialogueId, chats) => {
  try {
    const res = await fetch(`${API_BASE}/updateChat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: dialogueId, chats }) });
    const data = await res.json();
    if (res.ok) ElMessage.success('对话更新成功'); else ElMessage.error(data.error || '对话更新失败');
  } catch (err) { console.error(err); ElMessage.error('接口调用失败'); }
};

// 优化后的选中逻辑
const selectDialogues = async (dialogueId) => {
  selectedAppId.value = dialogueId;

  const d = appDialogues.value.find(item => item._id === dialogueId);
  if (d) {
    // 1. 存 Session (保持不变)
    sessionStorage.setItem("systemMessage", d.systemMessage || "");
    sessionStorage.setItem("isNeedBotId", d.isNeedBotId);
    sessionStorage.setItem("url", d.url);
    sessionStorage.setItem("dialogueId", dialogueId);
    sessionStorage.setItem("token", d.token);
    sessionStorage.setItem("bot_id", d.bot_id);

    // 2. 赋值界面变量
    selectedAppName.value = d.appName;
    chatHistory.value = d.chats || [];

    // 3. 核心：强制进入“参数配置”模式
    displayChatBox.value = false; 

    // 4. 赋值 metaData 并等待渲染
    // 必须确保 metaInfo 是数组，否则 v-for 会报错
    metaData.value = Array.isArray(d.metaInfo) ? d.metaInfo : [];
    
    // 使用 nextTick 确保数据变化后，DOM 中的 Input 能够正确回填 value
    await nextTick(); 
  }
};

// -------------------- 初始化与获取对话 --------------------
// 修改后的 initAppDialogues
const initAppDialogues = async () => {
  loading.value = true; // 开启全局加载状态
  try {
    const currentAppId = sessionStorage.getItem('appId');
    const userId = sessionStorage.getItem('userId');

    // 1. 只有当确实是从列表页跳转过来（带着 appId），且用户已登录时，才尝试创建/保存
    // 注意：如果你的 saveChat 逻辑是“不存在则创建，存在则不创建”，这里没问题。
    // 如果是“每次都创建新对话”，这里会产生新记录，所以后面必须取最新的。
    if (currentAppId && userId) {
      await saveChat(currentAppId, userId, []);
    }

    // 2. 获取最新全量列表
    await getAllDialogues();

    // 3. 关键优化：对列表进行降序排序（按时间倒序），确保 appDialogues[0] 是最新的
    // 假设你的数据里有 updatedAt 或 createdAt 字段，如果没有，依赖后端返回顺序可能有风险
    if (appDialogues.value.length > 0 && (appDialogues.value[0].updatedAt || appDialogues.value[0].createdAt)) {
       appDialogues.value.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt).getTime();
          return timeB - timeA; // 降序：最新的在前面
       });
    }

    // 4. 尝试自动选中
    if (currentAppId) {
      // 查找策略：因为排过序了，find 找到的第一个就是最新的
      const targetDialogue = appDialogues.value.find(d => d.appId === currentAppId);
      
      if (targetDialogue) {
        // 选中并加载数据
        await selectDialogues(targetDialogue._id);
        
        // 5. 额外保险：强制切换到“参数配置”模式
        // 即使 selectDialogues 里写了，这里再次确认，确保视觉上是表单
        displayChatBox.value = false; 
      }
    }
  } catch (error) {
    console.error("初始化应用失败:", error);
    ElMessage.error("应用加载异常");
  } finally {
    loading.value = false; // 关闭加载状态
  }
};


// 请务必将这些函数复制过来




const getAllDialogues = async() => {
  const userId = sessionStorage.getItem('userId');
  if (!userId) return;
  fetch(`${API_BASE}/getChats`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId })
  }).then(res => res.json()).then(data => appDialogues.value = data);
};

onMounted(() => { 
  initAppDialogues();
  document.addEventListener('click', hideAllMenus);
});
</script>

<style scoped>
/* ===== 布局框架 ===== */
.workbench-container {
  display: flex;
  height: 85vh; /* 全屏高度 */
  background: #f8fafc; /* 极简灰白底 */
  color: #334155;
  overflow: hidden;
}

/* 1. 左侧侧边栏 */
.sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1e293b;
  font-weight: 700;
}

.app-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.app-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.app-item:hover {
  background: #f1f5f9;
}

.app-item.active {
  background: #eff6ff; /* 激活态淡蓝 */
  color: #3b82f6;
}

.app-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.app-icon {
  width: 28px;
  height: 28px;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.app-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 侧边栏菜单 */
.action-trigger {
  padding: 4px;
  color: #94a3b8;
  position: relative;
  border-radius: 4px;
}
.action-trigger:hover { background: #e2e8f0; color: #334155; }

.action-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-radius: 6px;
  min-width: 100px;
  z-index: 50;
  overflow: hidden;
}

.menu-item {
  padding: 8px 12px;
  font-size: 13px;
  color: #475569;
}
.menu-item:hover { background: #f8fafc; }
.menu-item.delete { color: #ef4444; }
.menu-item.delete:hover { background: #fef2f2; }

/* 2. 右侧工作区 */
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 顶部导航 */
.workspace-header {
  height: 64px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.workspace-title {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

/* 模式切换 Tabs */
.mode-switcher {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.switch-item {
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.switch-item.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 内容滚动区 */
.workspace-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  /* 平滑滚动 */
  scroll-behavior: smooth; 
}

/* ===== A. 表单样式 ===== */
/* ===== A. 表单样式 (修复对齐版) ===== */
.form-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%; /* 确保容器自身宽度正常 */
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: white;
  padding: 40px; /* 增加内边距，让整体看起来不那么挤 */
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* 柔和阴影 */
  border: 1px solid #e2e8f0;
  
  /* 关键修复 1：防止 padding 撑大盒子导致溢出 */
  box-sizing: border-box; 
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%; /* 占满父容器 */
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-left: 2px; /* label 微调对齐 */
}

.form-input, 
.form-select {
  /* 关键修复 2：宽度设为100%，但包含 padding 和 border */
  width: 100%; 
  box-sizing: border-box; 
  
  padding: 12px 16px; /* 内部文字留出呼吸感 */
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  margin: 0; /* 去除浏览器默认 margin */
  background-color: #f8fafc; /* 给输入框一个极淡的背景，增加层次感 */
}

.form-input:focus, 
.form-select:focus {
  outline: none;
  background-color: #ffffff; /* 聚焦时变白 */
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 按钮区域修复 */
.form-actions {
  margin-top: 10px;
  text-align: right;
  /* 确保按钮区域和输入框一样宽 */
  width: 100%; 
  box-sizing: border-box;
}

.primary-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 36px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.2s;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
}

/* 原有的文件上传和预览样式保持不变 */
.custom-file-upload {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  color: #64748b;
  font-size: 14px;
  background: #f8fafc;
  transition: all 0.2s;
  box-sizing: border-box; /* 确保文件上传框也对齐 */
  width: 100%;
}
.custom-file-upload:hover { 
  border-color: #3b82f6; 
  color: #3b82f6; 
  background: #eff6ff; 
}
.img-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
.img-previews img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.form-actions {
  margin-top: 24px;
  text-align: right;
}

.primary-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.primary-btn:hover { background: #2563eb; }

/* ===== B. 聊天样式 ===== */
.chat-container {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 80px; /* 给底部输入框留位置 */
}

.message-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.message-row.user .avatar { background: #3b82f6; } /* 用户头像蓝底 */
.message-row.assistant .avatar { background: white; border: 1px solid #e2e8f0; } 

.bubble {
  max-width: 80%;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.6;
}

.message-row.user .bubble {
  background: #3b82f6;
  color: white;
  border-radius: 12px 2px 12px 12px;
}

.message-row.assistant .bubble {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 2px 12px 12px 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

/* 思考过程样式 */
.reasoning-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
}

.reasoning-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  background: #f1f5f9;
}

.reasoning-content {
  padding: 10px 12px;
  font-size: 13px;
  color: #475569;
  font-family: monospace;
  white-space: pre-wrap;
  border-top: 1px solid #e2e8f0;
}

/* Markdown 样式 */
.markdown-body :deep(p) { margin-bottom: 10px; }
.markdown-body :deep(h1), .markdown-body :deep(h2) { font-weight: 700; margin-top: 16px; margin-bottom: 8px; }
.markdown-body :deep(pre) { background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; }
.markdown-body :deep(code) { font-family: monospace; background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; }
.message-row.user .markdown-body :deep(code) { background: rgba(255,255,255,0.2); }

/* 3. 底部固定输入区 */
.workspace-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: white;
  border-top: 1px solid #e2e8f0;
  padding: 16px 24px;
  z-index: 10;
}

.input-wrapper {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  gap: 12px;
  background: #f8fafc;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: border-color 0.2s;
}

.input-wrapper:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: white;
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px;
  font-size: 15px;
  resize: none;
  outline: none;
  max-height: 120px;
}

.send-btn {
  padding: 0 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}
.send-btn:disabled { background: #94a3b8; cursor: not-allowed; }

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 16px;
}
.empty-icon { font-size: 48px; }

/* 动画 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>