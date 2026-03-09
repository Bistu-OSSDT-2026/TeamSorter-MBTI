<template>
  <div class="image-gen-container">
    
    <div class="page-back-btn" @click="goBackHome">
      <el-icon><ArrowLeft /></el-icon> 返回首页
    </div>

    <div class="header">
      <h2>🎨 AI 图片生成</h2>
      <p class="subtitle">输入文字描述，AI 自动为您绘制图片</p>
    </div>

    <transition name="el-fade-in-linear" mode="out-in">
      
      <div v-if="currentPage === 'input'" key="input-page">
        <el-card class="main-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🖌️ 创意描述</span>
            </div>
          </template>
          
          <el-form label-position="top">
            <el-form-item label="画面描述 (Prompt)">
              <el-input
                v-model="prompt"
                type="textarea"
                :rows="4"
                placeholder="例如：一只穿着宇航服的小猫在月球上钓鱼，赛博朋克风格，高清细节..."
                maxlength="500"
                show-word-limit
              />
            </el-form-item>

            <div class="tags-area">
              <span class="tag-label">灵感推荐：</span>
              <el-tag 
                v-for="tag in inspirationTags" 
                :key="tag" 
                class="pointer-tag"
                @click="appendTag(tag)"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>

            <el-button 
              type="primary" 
              @click="handleGenerate" 
              :loading="loading" 
              size="large"
              class="submit-btn"
            >
              {{ loading ? '正在绘制中...' : '✨ 开始生成图片' }}
            </el-button>
          </el-form>
        </el-card>
      </div>

      <div v-else key="result-page" class="result-wrapper">
        <el-card class="result-card" shadow="hover">
          <div class="result-header">
            <h3>生成完成 ✅</h3>
            <div class="actions">
              <el-button @click="currentPage = 'input'" icon="Edit">修改描述</el-button>
              <el-button type="success" @click="downloadImage" icon="Download">下载图片</el-button>
            </div>
          </div>

          <div class="image-display-area" v-loading="loading">
            <el-image 
              :src="resultUrl" 
              :preview-src-list="[resultUrl]"
              fit="contain"
              class="generated-img"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
          </div>

          <div class="prompt-review">
            <span class="label">您的描述：</span>
            <p>{{ prompt }}</p>
          </div>
        </el-card>
      </div>

    </transition>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Picture } from "@element-plus/icons-vue";

const router = useRouter();

// --- 状态 ---
const currentPage = ref("input"); // 'input' | 'result'
const prompt = ref("");
const resultUrl = ref("");
const loading = ref(false);

const inspirationTags = ["赛博朋克", "水墨画风格", "超现实主义", "吉卜力画风", "3D 渲染", "未来城市"];

// --- 逻辑 ---

const goBackHome = () => {
  router.push('/');
};

const appendTag = (tag) => {
  if (prompt.value) {
    prompt.value += `，${tag}`;
  } else {
    prompt.value = tag;
  }
};

const handleGenerate = async () => {
  if (!prompt.value.trim()) return ElMessage.warning("请输入画面描述");

  loading.value = true;
  
  try {
    // 请求后端接口
    const res = await fetch("http://localhost:5000/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "生成失败");
    }

    // 成功
    resultUrl.value = data.url;
    currentPage.value = "result"; // 切换到结果页

  } catch (err) {
    console.error(err);
    ElMessage.error(err.message);
  } finally {
    loading.value = false;
  }
};

const downloadImage = () => {
  if (!resultUrl.value) return;
  // 在新窗口打开图片 (由于跨域问题，直接下载通常需要后端配合流传输，这里用最简单的新窗口打开方式)
  window.open(resultUrl.value, '_blank');
};
</script>

<style scoped>
/* 🔥 核心布局优化：使用 Flex 垂直居中 */
.image-gen-container {
  max-width: 900px;
  width: 100%;
  /* 预留高度，确保垂直居中 */
  min-height: 85vh; 
  margin: 0 auto;
  font-family: 'PingFang SC', sans-serif;
  padding: 40px 20px; /* 增加内边距，防止贴边 */
  position: relative;
  
  /* 垂直居中魔法 */
  display: flex;
  flex-direction: column;
  justify-content: center; 
  box-sizing: border-box;
}

/* 🔥 返回按钮优化：不再贴边 */
.page-back-btn {
  position: absolute;
  top: 0; /* 对齐容器顶部 */
  left: 20px; /* 左侧留出空隙 */
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #606266;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px; /* 更圆润 */
  background: #fff;
  border: 1px solid #e4e7ed; /* 增加边框，更清晰 */
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  transition: all 0.2s;
  z-index: 10;
}
.page-back-btn:hover { 
  color: #409EFF; 
  background: #ecf5ff; 
  border-color: #c6e2ff;
  transform: translateY(-2px); /* 悬浮微动效 */
}

/* 头部区域 */
.header { 
  text-align: center; 
  margin-bottom: 30px; 
  margin-top: 20px; /* 给头部上方留点空间，避免撞到返回按钮 */
}
.header h2 { 
  margin-bottom: 8px; 
  color: #303133; 
  font-size: 32px; /* 字体加大 */
  font-weight: 800;
  letter-spacing: 1px;
}
.subtitle { color: #909399; font-size: 15px; margin: 0; }

/* 输入卡片优化 */
.main-card { 
  border-radius: 16px; 
  border: 1px solid #e4e7ed;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04) !important; /* 更柔和的阴影 */
}
.card-header { font-weight: bold; font-size: 18px; display: flex; align-items: center; gap: 8px; }

/* 标签区 */
.tags-area { margin-top: 15px; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.tag-label { font-size: 13px; color: #909399; }
.pointer-tag { cursor: pointer; transition: all 0.2s; padding: 6px 12px; }
.pointer-tag:hover { transform: translateY(-2px); color: #409EFF; border-color: #409EFF; }

/* 按钮优化 */
.submit-btn { 
  width: 100%; 
  margin-top: 35px; 
  font-weight: bold; 
  font-size: 18px; 
  height: 55px; 
  border-radius: 12px; 
  background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); 
  border: none; 
  transition: transform 0.2s, box-shadow 0.2s; 
  box-shadow: 0 10px 20px rgba(236, 72, 153, 0.2);
}
.submit-btn:hover { 
  transform: scale(1.02); 
  opacity: 0.95; 
  box-shadow: 0 15px 25px rgba(236, 72, 153, 0.3);
}

/* 结果卡片 */
.result-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}
.result-card { 
  border-radius: 16px; 
  overflow: hidden; 
  width: 100%;
}
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #f2f2f2; padding-bottom: 15px; }
.result-header h3 { margin: 0; color: #67c23a; }

.image-display-area {
  width: 100%;
  min-height: 450px;
  background: #f8f9fa;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed #dcdfe6;
  margin-bottom: 20px;
}
.generated-img { width: 100%; height: auto; max-height: 600px; display: block; object-fit: contain; }

.prompt-review { background: #fdf6ec; padding: 15px; border-radius: 8px; border-left: 4px solid #e6a23c; }
.prompt-review .label { font-size: 12px; color: #e6a23c; font-weight: bold; }
.prompt-review p { margin: 5px 0 0; color: #606266; font-size: 14px; line-height: 1.6; }

.image-slot { display: flex; flex-direction: column; align-items: center; color: #909399; font-size: 14px; }
.image-slot .el-icon { font-size: 30px; margin-bottom: 10px; }
</style>