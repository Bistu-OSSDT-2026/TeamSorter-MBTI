<template>
  <div class="editor-container">
    
    <div class="top-toolbar">
        <div class="back-btn-group">
            <div class="page-back-btn" @click="goBackHome">
                <el-icon><ArrowLeft /></el-icon> 返回首页
            </div>
            <el-button 
                link 
                type="info" 
                @click="toggleView" 
                class="view-toggle-btn"
                size="small"
            >
                {{ currentPage === 'form' ? '🖼️ 查看生成历史' : '✏️ 返回编辑画板' }}
            </el-button>
        </div>
        
        <div class="header">
            <h2> AI 图像编辑器</h2>
        </div>
        <div style="width: 200px;"></div> 
    </div>

    <transition name="el-fade-in-linear" mode="out-in">
        
        <div v-if="currentPage === 'form'" key="form" class="main-layout-content">
            <div class="main-layout">
                <el-card class="canvas-card" shadow="hover">
                    <div class="canvas-wrapper" ref="wrapperRef">
                        
                        <div v-if="!originalImage" class="upload-placeholder" @click="triggerUpload">
                            <el-icon class="upload-icon"><Plus /></el-icon>
                            <p>点击上传图片 (JPG/PNG)</p>
                            <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*" style="display:none" />
                        </div>

                        <div v-else class="canvas-box" :style="{ width: displayWidth + 'px', height: displayHeight + 'px' }">
                            <canvas ref="imgCanvasRef" class="layer-img"></canvas>
                            <canvas 
                              v-show="feature !== 'variation'"
                              ref="drawCanvasRef" 
                              class="layer-draw"
                              @mousedown="startDrawing"
                              @mousemove="draw"
                              @mouseup="stopDrawing"
                              @mouseleave="stopDrawing"
                            ></canvas>
                        </div>

                        <div v-if="originalImage" class="toolbar">
                            <div class="tool-group" v-if="feature !== 'variation'">
                                <span class="label">笔刷大小:</span>
                                <el-slider v-model="brushSize" :min="10" :max="100" style="width: 100px" />
                            </div>
                            <div class="tool-group">
                                <el-button size="small" @click="clearCanvas" icon="RefreshLeft">重置涂抹</el-button>
                                <el-button size="small" type="danger" plain @click="resetAll" icon="Delete">换张图</el-button>
                            </div>
                        </div>
                    </div>
                </el-card>

                <div class="sidebar-panel">
                    <el-card class="settings-card" shadow="hover">
                        <template #header>
                            <span class="panel-title">⚙️ 编辑设置</span>
                        </template>

                        <el-form label-position="top">
                            
                            <el-form-item label="选择功能">
                              <div class="feature-selector">
                                  <div class="f-item" :class="{ active: feature === 'erase' }" @click="setFeature('erase')">
                                      <div class="icon">🧹</div><span>智能消除</span>
                                  </div>
                                  <div class="f-item" :class="{ active: feature === 'repaint' }" @click="setFeature('repaint')">
                                      <div class="icon">🎨</div><span>局部重绘</span>
                                  </div>
                                  <div class="f-item" :class="{ active: feature === 'variation' }" @click="setFeature('variation')">
                                      <div class="icon">👯</div><span>相似变体</span>
                                  </div>
                              </div>
                              <div class="tip-text">{{ featureTip }}</div>
                            </el-form-item>

                            <el-form-item label="修改描述 (Prompt)">
                              <el-input v-model="prompt" type="textarea" :rows="3" :placeholder="promptPlaceholder" maxlength="220" show-word-limit />
                              <div class="tip-text" style="color:#606266; margin-top: 5px;">* 消除模式下，此项可留空。</div>
                            </el-form-item>

                            <el-form-item label="输出图片尺寸 (Size)">
                                <el-select v-model="size" placeholder="请选择输出尺寸" style="width: 100%">
                                    <el-option
                                        v-for="item in sizeOptions"
                                        :key="item.value"
                                        :label="item.label"
                                        :value="item.value"
                                    >
                                        <span style="float: left">{{ item.label }}</span>
                                        <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{ item.value }}</span>
                                    </el-option>
                                </el-select>
                            </el-form-item>

                            <el-button 
                              type="primary" 
                              class="generate-btn" 
                              @click="handleGenerate" 
                              :loading="loading"
                              size="large"
                            >
                              {{ loading ? 'AI 正在施法...' : '开始生成' }}
                            </el-button>
                        </el-form>
                    </el-card>
                </div>
            </div>
        </div>

        <div v-else key="chat" class="chat-layout-content">
          <div class="chat-messages-area">
            <div 
              v-for="(msg, index) in chatMessages" 
              :key="index" 
              :class="['chat-bubble', msg.role]"
            >
              <div class="bubble-inner">
                <strong>{{ msg.role === 'user' ? '用户输入' : 'AI 结果' }}：</strong>
                <p>{{ msg.content }}</p>
                <div v-if="msg.imageUrl" class="image-result-box">
                    <el-image 
                        :src="msg.imageUrl" 
                        :preview-src-list="[msg.imageUrl]"
                        fit="cover"
                        style="width: 300px; height: 300px; border-radius: 8px; margin: 10px 0;"
                    />
                    <el-button 
                      type="success" 
                      @click="downloadImage(msg.imageUrl, index)" 
                      size="small" 
                      :icon="Download"
                    >
                      下载图片
                    </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Plus, Download } from "@element-plus/icons-vue";

const router = useRouter();

// --- 状态 ---
const currentPage = ref("form"); // 'form' | 'chat'
const feature = ref("erase"); // erase | repaint | variation
const prompt = ref("");
const brushSize = ref(30);
const size = ref("1024x1024");
const loading = ref(false);
const originalImage = ref(null); // Image Object

const chatMessages = ref([]); 

// Canvas refs
const imgCanvasRef = ref(null);
const drawCanvasRef = ref(null);
const fileInput = ref(null);

// 绘图状态
const isDrawing = ref(false);
const ctxDraw = ref(null);
const displayWidth = ref(500);
const displayHeight = ref(500);

// 尺寸选项
const sizeOptions = [
    { label: '默认/方形 (1024x1024)', value: '1024x1024' },
    { label: '高清方形 (2048x2048)', value: '2048x2048' },
    { label: '文章配图 (1024x768)', value: '1024x768' },
    { label: '海报/竖图 (768x1024)', value: '768x1024' },
];


// --- 计算属性 ---
const featureTip = computed(() => {
  if (feature.value === 'erase') return "💡 请涂抹想要去除的物体（如路人、水印），无需输入描述。";
  if (feature.value === 'repaint') return "💡 请涂抹想要修改的区域，并在下方输入新的描述。";
  return "💡 无需涂抹，AI 将根据原图生成一张构图相似的新图片。";
});

const promptPlaceholder = computed(() => {
  if (feature.value === 'repaint') return "例如：把这个苹果变成橘子 / 换成蓝色的天空";
  return "例如：赛博朋克风格 / 水彩画风格";
});

// --- 方法 ---

const goBackHome = () => router.push('/');

// 切换视图函数
const toggleView = () => {
    currentPage.value = currentPage.value === 'form' ? 'chat' : 'form';
    nextTick(() => {
        const chatArea = document.querySelector('.chat-layout-content');
        if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    });
};


const setFeature = (f) => { feature.value = f; };
const triggerUpload = () => fileInput.value.click();

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const img = new Image();
    img.onload = () => {
      originalImage.value = img;
      initCanvas(img);
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
};

// 初始化画布
const initCanvas = (img) => {
  nextTick(() => {
    const maxWidth = 600;
    const maxHeight = 500;
    let w = img.width;
    let h = img.height;
    
    if (w > maxWidth || h > maxHeight) {
      const ratio = Math.min(maxWidth / w, maxHeight / h);
      w = w * ratio;
      h = h * ratio;
    }
    
    displayWidth.value = w;
    displayHeight.value = h;

    const canvasImg = imgCanvasRef.value;
    canvasImg.width = w;
    canvasImg.height = h;
    const ctxImg = canvasImg.getContext("2d");
    ctxImg.drawImage(img, 0, 0, w, h);

    const canvasDraw = drawCanvasRef.value;
    canvasDraw.width = w;
    canvasDraw.height = h;
    ctxDraw.value = canvasDraw.getContext("2d");
    
    ctxDraw.value.lineCap = "round";
    ctxDraw.value.lineJoin = "round";
    ctxDraw.value.strokeStyle = "rgba(255, 255, 255, 0.7)"; 
    ctxDraw.value.lineWidth = brushSize.value;
  });
};

// --- 绘图逻辑 ---
const startDrawing = (e) => {
  if (feature.value === 'variation') return;
  isDrawing.value = true;
  const { offsetX, offsetY } = e;
  ctxDraw.value.lineWidth = brushSize.value;
  ctxDraw.value.beginPath();
  ctxDraw.value.moveTo(offsetX, offsetY);
};

const draw = (e) => {
  if (!isDrawing.value) return;
  const { offsetX, offsetY } = e;
  ctxDraw.value.lineTo(offsetX, offsetY);
  ctxDraw.value.stroke();
};

const stopDrawing = () => {
  if (!isDrawing.value) return;
  isDrawing.value = false;
  ctxDraw.value.closePath();
};

const clearCanvas = () => {
  if (!ctxDraw.value) return;
  ctxDraw.value.clearRect(0, 0, displayWidth.value, displayHeight.value);
};

const resetAll = () => {
  originalImage.value = null;
  prompt.value = "";
  fileInput.value.value = "";
  clearCanvas();
};

const isCanvasMasked = () => {
    if (!drawCanvasRef.value) return false;
    const ctx = drawCanvasRef.value.getContext("2d");
    const imageData = ctx.getImageData(0, 0, displayWidth.value, displayHeight.value);
    return imageData.data.some(c => c > 0);
}

const getMaskBase64 = () => {
  const originalWidth = originalImage.value.naturalWidth || originalImage.value.width;
  const originalHeight = originalImage.value.naturalHeight || originalImage.value.height;

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;
  const tCtx = tempCanvas.getContext("2d");

  tCtx.fillStyle = "#000000";
  tCtx.fillRect(0, 0, originalWidth, originalHeight);

  tCtx.drawImage(
    drawCanvasRef.value, 
    0, 0, displayWidth.value, displayHeight.value,
    0, 0, originalWidth, originalHeight
  );
  
  return tempCanvas.toDataURL("image/png");
};

const getImageBase64 = () => {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = originalImage.value.width;
  tempCanvas.height = originalImage.value.height;
  const ctx = tempCanvas.getContext("2d");
  ctx.drawImage(originalImage.value, 0, 0);
  return tempCanvas.toDataURL("image/png");
};


const handleGenerate = async () => {
  if (!originalImage.value) return ElMessage.warning("请先上传图片");

  const needsMask = feature.value !== 'variation';
  if (needsMask && !isCanvasMasked()) {
      return ElMessage.warning("请先在图片上涂抹要修改的区域");
  }
  
  const needsPrompt = feature.value !== 'erase';
  if (needsPrompt && !prompt.value) {
      return ElMessage.warning("重绘和变体模式需要提供画面描述");
  }

  loading.value = true;

  // 1. 添加用户消息到记录
  chatMessages.value.push({
      role: 'user',
      content: `功能: ${feature.value} | 尺寸: ${size.value} | 描述: ${prompt.value || 'N/A'}`,
      imageUrl: originalImage.value.src, // 保存原图以供参考
  });

  try {
    const imageBase64 = getImageBase64();
    const maskBase64 = needsMask ? getMaskBase64() : null;

    const res = await fetch("http://localhost:5000/api/image-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feature: feature.value,
        image: imageBase64,
        mask: maskBase64,
        prompt: prompt.value,
        size: size.value 
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "请求失败");

    // 2. 将结果添加到记录并切换视图
    chatMessages.value.push({
        role: 'system',
        content: `AI 成功完成编辑。`,
        imageUrl: data.url, // 结果图片
    });
    
    currentPage.value = 'chat'; // 切换到聊天历史
    ElMessage.success("生成成功！已为您记录结果。");

  } catch (err) {
    console.error(err);
    ElMessage.error(err.message);
    chatMessages.value.push({ role: 'system', content: `生成失败: ${err.message}` });
  } finally {
    loading.value = false;
    nextTick(() => {
        const chatArea = document.querySelector('.chat-layout-content');
        if(chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    });
  }
};

// 修复下载功能
const downloadImage = (url, index) => {
    ElMessage.info('正在获取文件，请稍候...');
    
    fetch(url)
        .then(response => response.blob())
        .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `ai_image_edit_${index}_${new Date().getTime()}.png`; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            ElMessage.success('下载已开始！');
        })
        .catch(error => {
            console.error('Download failed:', error);
            ElMessage.error('下载失败：无法获取远程文件，请检查网络或权限。');
        });
};
</script>


<style scoped>
/* ======================================================= */
/* 整体布局容器 */
.editor-container {
max-width: 1100px;
width: 100%;
height: 90vh; /* 确保容器有明确的高度，以便内部 flex 计算 */
margin: 0 auto;
padding: 0 20px; /* 移除顶部 padding */
font-family: 'PingFang SC', sans-serif;
position: relative;
box-sizing: border-box;

/* 🔥 关键：使内容区和工具栏能垂直排列 */
display: flex;
flex-direction: column;
overflow: hidden; /* 整体禁止滚动 */
}

/* ======================================================= */
/* 🔥 顶部工具栏 (top-toolbar) 修正 */
.top-toolbar {
/* 移除 absolute 定位，改为内联 flex，确保其高度被内容区计算在内 */
position: relative; 
flex-shrink: 0; /* 不被压缩 */
height: 60px; /* 固定工具栏高度 */

padding: 0 0 0 15px; /* 移除顶部的 20px padding */
border-bottom: 1px solid #f0f2f5; /* 增加分隔线 */

display: flex;
justify-content: space-between;
align-items: center;
background: white; /* 确保背景是白色 */
z-index: 10;
}

/* 按钮组 */
.back-btn-group { 
display: flex; 
gap: 15px; 
align-items: center; 
flex-shrink: 0; 
}

/* 🔥 标题定位修正 */
.header { 
text-align: center; 
margin: 0; /* 移除不必要的 margin */
/* 🔥 移除 flex-grow: 1! 让标题只占据自身空间，不挤压按钮 */
flex-grow: 0;
position: absolute; /* 使用绝对定位实现视觉居中，不干扰两侧按钮的 flex */
left: 50%;
transform: translateX(-50%);
}
.header h2 { margin: 0; color: #303133; font-size: 24px; font-weight: 700; } /* 字体略微缩小 */


/* ======================================================= */
/* 🔥 主内容区 (Main Layout Content) 修正 */
.main-layout-content { 
/* 移除多余的 padding-top，因为 top-toolbar 现在占据了空间 */
padding-top: 20px; 
padding-bottom: 20px;
width: 100%; 
flex-grow: 1; /* 占据顶部工具栏以外的所有剩余垂直空间 */
overflow-y: auto; /* 允许内容区自身滚动 */
box-sizing: border-box;
}

.main-layout { 
display: flex; 
gap: 20px; 
align-items: flex-start; 
flex-wrap: wrap; /* 保证小屏幕下会换行 */
}


/* 左侧 Canvas 区域 */
.canvas-card { flex: 2; min-width: 400px; border-radius: 16px; display: flex; justify-content: center; align-items: center; padding: 20px; background: #f8f9fa; min-height: 600px; }
.canvas-wrapper { position: relative; }
.upload-placeholder {
  width: 400px; height: 300px; border: 2px dashed #dcdfe6; border-radius: 12px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  cursor: pointer; color: #909399; background: white;
}
.upload-placeholder:hover { border-color: #409EFF; color: #409EFF; background: #ecf5ff; }
.upload-icon { font-size: 48px; margin-bottom: 10px; }
.canvas-box { position: relative; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.1); background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABpJREFUOE9jTKx+/59hmAEmIGVoGDA0DAwAAJ7sd5eE8366AAAAAElFTkSuQmCC'); }
.layer-img { display: block; width: 100%; height: 100%; }
.layer-draw { position: absolute; top: 0; left: 0; cursor: crosshair; }

.toolbar { margin-top: 15px; display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px 15px; border-radius: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.tool-group { display: flex; align-items: center; gap: 10px; }
.label { font-size: 13px; color: #606266; }

/* 右侧面板 */
.sidebar-panel { flex: 1; min-width: 350px; display: flex; flex-direction: column; gap: 20px; }
.panel-title { font-weight: bold; font-size: 16px; }
.feature-selector { display: flex; gap: 10px; margin-bottom: 10px; }
.f-item { flex: 1; border: 1px solid #dcdfe6; border-radius: 8px; padding: 10px 5px; text-align: center; cursor: pointer; transition: all 0.2s; background: white; }
.f-item:hover { transform: translateY(-2px); border-color: #c6e2ff; }
.f-item.active { background: #ecf5ff; border-color: #409EFF; color: #409EFF; }
.f-item .icon { font-size: 24px; margin-bottom: 5px; }
.f-item span { font-size: 12px; font-weight: bold; white-space: nowrap; }
.tip-text { font-size: 12px; color: #e6a23c; margin-top: 5px; line-height: 1.4; background: #fdf6ec; padding: 8px; border-radius: 4px; }
.generate-btn { width: 100%; margin-top: 20px; font-weight: bold; height: 45px; border-radius: 10px; background: linear-gradient(90deg, #8b5cf6, #ec4899); border: none; }
.generate-btn:hover { opacity: 0.9; transform: scale(1.02); }


/* 聊天历史区样式 */
.chat-layout-content {
/* 🔥 确保聊天区高度占满剩余空间 */
padding-top: 20px; 
width: 100%;
flex-grow: 1;
overflow-y: auto;
max-height: calc(100vh - 60px); /* 减去 Header 高度 */
display: flex;
flex-direction: column;
}
.chat-messages-area {
padding: 20px;
display: flex;
flex-direction: column;
gap: 20px;
}
.chat-bubble {
display: flex;
width: 100%;
}
.chat-bubble.user { justify-content: flex-end; }
.chat-bubble.system { justify-content: flex-start; }

.bubble-inner {
max-width: 70%;
padding: 15px;
border-radius: 12px;
line-height: 1.6;
font-size: 14px;
box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.chat-bubble.user .bubble-inner {
background: #ecf5ff; 
color: #409EFF;
border-bottom-right-radius: 4px;
}
.chat-bubble.system .bubble-inner {
background: #fff;
border: 1px solid #e4e7ed;
border-bottom-left-radius: 4px;
}
.image-result-box {
margin-top: 10px;
border-top: 1px dashed #eee;
padding-top: 10px;
display: flex;
flex-direction: column;
align-items: flex-start;
}
</style>

