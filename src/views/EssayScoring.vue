<template>
  <div class="essay-container">
    <div class="page-back-btn" @click="goBackHome">
      <el-icon><ArrowLeft /></el-icon> 返回首页
    </div>
    <div class="header">
      <h2>📝 智能作文识别与评分助手</h2>
      <p class="subtitle">基于自研Su2.1大模型 · 支持图文多模态识别</p>
    </div>

    <transition name="el-fade-in-linear" mode="out-in">
      
      <div v-if="currentPage === 'input'" key="input-page">
        <el-card class="input-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🚀 提交作业</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="评分要求 (Prompt)">
              <el-input
                v-model="userPrompt"
                type="textarea"
                :rows="3"
                placeholder="例如：请识别图片中的作文，并从内容、结构、语言三个维度进行评分和点评。"
              />
            </el-form-item>

            <el-form-item label="上传作文图片">
              <div class="large-uploader">
                <el-upload
                  v-model:file-list="fileList"
                  list-type="picture-card"
                  :auto-upload="false"
                  :on-preview="handlePictureCardPreview"
                  :on-change="handleUploadChange"
                  multiple
                >
                  <div class="upload-placeholder">
                    <el-icon class="uploader-icon"><Plus /></el-icon>
                    <span class="text">上传图片</span>
                  </div>
                </el-upload>
              </div>
              <div class="upload-tip">
                支持JPG/PNG。如果不上传，将直接评测默认显示的范例作文。
              </div>
            </el-form-item>

            <el-button 
              type="primary" 
              @click="handleSubmit" 
              :loading="loading" 
              size="large"
              class="submit-btn"
            >
              {{ loading ? '正在启动...' : '开始智能批改' }}
              <el-icon class="el-icon--right"><ArrowRight /></el-icon>
            </el-button>
            
            <el-button 
              v-if="chatMessages.length > 0"
              link 
              type="info" 
              @click="currentPage = 'chat'"
              class="history-btn"
            >
              查看历史对话 >
            </el-button>
          </el-form>
        </el-card>
      </div>

      <div v-else key="chat-page" class="chat-page-container" ref="chatContainerRef">
        <div class="chat-toolbar">
          <el-button-group>
            <el-button :icon="Back" @click="currentPage = 'input'">返回修改</el-button>
            <el-button :icon="Delete" type="danger" plain @click="clearAndRestart">新的一题</el-button>
          </el-button-group>
          <span class="status-text" v-if="loading">
            <el-icon class="is-loading"><Loading /></el-icon> 正在生成评分...
          </span>
        </div>

        <div class="chat-area">
          <div v-for="(msg, index) in chatMessages" :key="index" :class="['message-row', msg.role]">
            <div class="avatar">
              {{ msg.role === 'user' ? '🧑‍🎓' : '🤖' }}
            </div>
            <div class="message-content">
              <div class="role-name">{{ msg.role === 'user' ? '用户' : 'AI 老师' }}</div>
              <div 
                class="markdown-body" 
                v-html="renderMarkdown(msg.content)"
              ></div>
            </div>
          </div>
        </div>
      </div>

    </transition>

    <el-dialog v-model="dialogVisible">
      <img w-full :src="dialogImageUrl" alt="Preview Image" style="width: 100%" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from "vue"; // 1. 去掉了 onMounted
import { ElMessage } from "element-plus";
import { Plus, ArrowRight, Back, Delete, Loading } from "@element-plus/icons-vue";
import MarkdownIt from "markdown-it"; 

// 引入默认图片
import defaultCompositionImg from "@/assets/composition-test.jpg";

const md = new MarkdownIt({ html: true, breaks: true, linkify: true });

const currentPage = ref("input");
const userPrompt = ref("请识别图片中的作文内容，并进行评分和详细点评。");
const loading = ref(false);
const chatMessages = ref([]);
const dialogImageUrl = ref("");
const dialogVisible = ref(false);
const chatContainerRef = ref(null);

// 初始化 fileList
const fileList = ref([
  {
    name: '范例作文.jpg',
    url: defaultCompositionImg,
    isDefault: true 
  }
]);

import { useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue"; // 记得引入图标

const router = useRouter();

const goBackHome = () => {
  router.push('/'); // 返回首页
};

// 🔥 2. 修改此处：去掉了参数 (uploadFile, uploadFiles)
const handleUploadChange = () => {
  const defaultImageIndex = fileList.value.findIndex(item => item.isDefault);
  
  if (defaultImageIndex !== -1 && fileList.value.length > 1) {
    fileList.value.splice(defaultImageIndex, 1);
    ElMessage.success("已替换为您的图片");
  }
};

const handlePictureCardPreview = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url;
  dialogVisible.value = true;
};

// 图片压缩
const compressImage = (imageSource) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSource;
    img.crossOrigin = "Anonymous"; 
    img.onload = () => {
      const maxWidth = 1024; 
      const maxHeight = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.6); 
      resolve(dataUrl);
    };
    img.onerror = (err) => reject(err);
  });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const handleSubmit = async () => {
  if (!userPrompt.value) return ElMessage.warning("请输入评分要求");
  currentPage.value = "chat";
  await sendRequest();
};

const clearAndRestart = () => {
  chatMessages.value = [];
  fileList.value = [{
    name: '范例作文.jpg',
    url: defaultCompositionImg,
    isDefault: true
  }];
  currentPage.value = "input";
};

const renderMarkdown = (text) => {
  if (!text) return "";
  if (text.includes('"作文":') || text.includes('```json')) {
    let content = text;
    let score = "";
    content = content.replace(/^```json\s*/, '').replace(/```$/, '');
    const scoreMatch = content.match(/"得分"\s*:\s*"(\d+)"/);
    if (scoreMatch) score = scoreMatch[1];
    content = content.replace(/^{?\s*"作文"\s*:\s*"/, '');
    content = content.replace(/",\s*"得分".*$/, '').replace(/"}\s*$/, '');
    content = content.replace(/\\n/g, '\n').replace(/\\"/g, '"');
    let finalHtml = md.render(content);
    if (score) {
      return `<div style="margin-bottom: 15px; padding: 10px; background: #f0f9eb; border-left: 5px solid #67c23a; border-radius: 4px;">
          <span style="font-weight: bold; color: #67c23a; font-size: 16px;">🎯 AI 评分：${score} 分</span>
        </div>` + finalHtml;
    }
    return finalHtml;
  }
  try { return md.render(text); } catch (e) { return text; }
};

const sendRequest = async () => {
  loading.value = true;
  try {
    const processedImages = [];
    
    for (const file of fileList.value) {
      let url = file.url;
      if (file.raw) {
        url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file.raw);
          reader.onload = (e) => resolve(e.target.result);
        });
      }
      url = await compressImage(url);
      processedImages.push({ type: "image_url", image_url: { url } });
    }

    const userContent = [{ type: "text", text: userPrompt.value }, ...processedImages];
    chatMessages.value.push({ role: "user", content: userPrompt.value });
    const assistantMsg = reactive({ role: "assistant", content: "" });
    chatMessages.value.push(assistantMsg);

    const res = await fetch("http://localhost:5000/api/essay-score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: userContent }] }),
    });

    if (!res.ok) throw new Error("请求失败");
    if (!res.body) throw new Error("无法读取流");

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    /* eslint-disable no-constant-condition */
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:") || trimmed.includes("[DONE]")) continue;
        try {
          const json = JSON.parse(trimmed.replace(/^data:\s*/, ""));
          if (json.error) throw new Error(json.error);
          const content = json.choices?.[0]?.delta?.content || "";
          if (content) {
            assistantMsg.content += content;
            scrollToBottom();
          }
        } catch (e) { /* ignore */ }
      }
    }
  } catch (err) {
    console.error(err);
    ElMessage.error(err.message);
    if (chatMessages.value.length > 0) {
      chatMessages.value[chatMessages.value.length - 1].content += `\n\n❌ **请求出错**: ${err.message}`;
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.essay-container {
  max-width: 900px;
  margin: 30px auto;
  font-family: 'PingFang SC', sans-serif;
  padding: 0 15px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}
.subtitle { color: #909399; font-size: 14px; margin-top: 5px; }

/* 🔥 CSS 修复核心区域 */
.large-uploader :deep(.el-upload--picture-card) {
  width: 220px;       /* 增大宽度 */
  height: 220px;      /* 增大高度 */
  
  /* 关键：使用 Flex 布局强制居中 */
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  line-height: normal; /* 重置可能影响居中的 line-height */
}

/* 上传列表里的图片也同步放大 */
.large-uploader :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 220px;
  height: 220px;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #8c939d;
  width: 100%; /* 占满容器 */
}

.uploader-icon { font-size: 40px; margin-bottom: 10px; }
.text { font-size: 16px; font-weight: bold; }

.input-card { border-radius: 12px; }
.card-header { font-weight: bold; font-size: 18px; }
.upload-tip { font-size: 13px; color: #999; margin-top: 10px; }
.submit-btn { width: 100%; margin-top: 25px; font-weight: bold; font-size: 16px; }
.history-btn { margin-top: 10px; width: 100%; }

.chat-page-container {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 12px;
  height: 600px; 
  overflow-y: auto; 
  display: flex;
  flex-direction: column;
}

.chat-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.chat-area {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-row { display: flex; gap: 15px; align-items: flex-start; }
.message-row.user { flex-direction: row-reverse; }
.avatar {
  width: 42px; height: 42px; background: #e6e8eb; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.message-row.assistant .avatar { background: #e1f3d8; }
.message-row.user .avatar { background: #d9ecff; }
.message-content {
  max-width: 85%; background: #fff; padding: 15px 20px; border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05); line-height: 1.6;
}
.message-row.user .message-content { background: #ecf5ff; }
.role-name { font-size: 12px; color: #999; margin-bottom: 6px; }

:deep(.markdown-body h1), :deep(.markdown-body h2) { margin: 10px 0; font-size: 18px; }

/* 返回按钮样式 */
.page-back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.2s;
  z-index: 100;
}
.page-back-btn:hover {
  color: #409EFF;
  background: #ecf5ff;
}

/* 确保容器相对定位，以便按钮定位 */
.essay-container {
  position: relative; 
  /* ...原有样式... */
}

</style>