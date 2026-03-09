<template>
  <div class="correction-container">
    <div class="header-section">
      <div class="header-left">
        <div class="back-link" @click="$router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </div>
      </div>
      
      <div class="header-center">
        <h2 class="title">💯 全科作业智能批改</h2>
        <p class="subtitle">AI 老师已准备就绪，支持 AIGC 深度解析</p>
      </div>

      <div class="header-right">
        <el-button type="primary" plain :icon="Link" @click="connectToMachine">
          连接判题机
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="left-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-header">📸 作业照片上传</div>
          </template>

          <div class="upload-area">
            <div class="image-box" @click="triggerUpload">
              <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileChange" />
              
              <div class="preview-wrapper">
                <img :src="previewUrl" class="preview-img" />
                
                <div class="upload-overlay" v-if="!isUserUploaded">
                  <el-icon><Camera /></el-icon>
                  <span>点击更换照片</span>
                </div>

                <div class="processing-overlay" v-if="loading">
                  <div class="pulse-loader"></div>
                  <p class="loading-text-static">{{ statusText }}</p>
                </div>
              </div>
            </div>

            <div class="action-btns">
              <el-button :icon="Upload" @click="triggerUpload" :disabled="loading">上传照片</el-button>
              <el-button 
                type="primary" 
                size="large" 
                @click="startCorrection" 
                :loading="loading"
              >
                开始智能批改
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="right-panel">
        <el-card shadow="never" class="panel-card">
          <template #header>
            <div class="card-header">📊 AI 智能批改报告</div>
          </template>

          <div v-if="!resultData && !loading" class="empty-state">
            <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" class="empty-img" />
            <p>点击下方按钮开始阅卷...</p>
          </div>

          <div v-if="resultData" class="result-scroll">
            <div class="summary-card">
              <div class="summary-top">
                <el-tag effect="dark" type="warning" size="large">
                  {{ getSubjectName(resultData.imageResults[0].paperSubject) }}
                </el-tag>
                <span class="accuracy-tag">准确率：{{ calculateAccuracy }}%</span>
              </div>
              <div class="stat-row">
                <div class="stat-box"><span>全部题目</span><b>{{ resultData.stat_result.all }}</b></div>
                <div class="stat-box green"><span>正确</span><b>{{ getCorrectCount }}</b></div>
                <div class="stat-box red"><span>错误/未做</span><b>{{ getWrongCount }}</b></div>
              </div>
            </div>

            <div class="annotated-section" v-if="resultData.imageResults[0].result[0].cropUrl">
              <h4 class="section-title">🖼️ AI 批改结果预览：</h4>
              <el-image 
                :src="resultData.imageResults[0].result[0].cropUrl" 
                :preview-src-list="[resultData.imageResults[0].result[0].cropUrl]"
                class="full-annotated-img"
                fit="contain"
              />
            </div>

            <el-divider>逐题详情解析</el-divider>

            <div class="question-list">
              <div v-for="(imgRes, i) in resultData.imageResults" :key="i">
                <div v-for="(q, idx) in imgRes.result" :key="idx" class="q-card">
                  <div class="q-meta">
                    <span class="q-no">第 {{ idx + 1 }} 题</span>
                    <el-tag size="small" type="info" plain>{{ getTypeName(q.type) }}</el-tag>
                    <el-tag :type="q.correctResult === 1 ? 'success' : 'danger'" size="small">
                      {{ q.correctResult === 1 ? '正确' : '错误' }}
                    </el-tag>
                  </div>
                  <div class="q-crop" v-if="q.cropUrl">
                    <img :src="q.cropUrl" class="crop-img" />
                  </div>
                  <div class="slot-details">
                    <div v-for="s in q.slot" :key="s.slotId" class="slot-item">
                      <div class="slot-head">
                        <span class="s-no">填空 {{ s.seqence }}</span>
                        <span :class="s.correctResult === 1 ? 's-res ok' : 's-res error'">
                          {{ s.correctResult === 1 ? '● 正确' : '● 错误' }}
                        </span>
                      </div>
                      <p class="s-reason">{{ cleanReason(s.reason) }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <el-dialog
      v-model="showConnectDialog"
      title="连接判题机"
      width="360px"
      center
      class="wifi-dialog"
    >
      <div class="wifi-search-content">
        <div class="radar">
          <div class="circle pulse"></div>
          <div class="circle"></div>
          <el-icon class="searching-icon"><Search /></el-icon>
        </div>
        <p class="searching-text">正在搜索附近的判题机设备...</p>
        <div class="device-list-placeholder">
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showConnectDialog = false">取消搜索</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Camera, Link, Upload, Search } from '@element-plus/icons-vue';

const fileInput = ref(null);
const previewUrl = ref("/homework.jpg"); 
const base64Data = ref("");
const isUserUploaded = ref(false); 
const loading = ref(false);
const statusText = ref("");
const resultData = ref(null);
const showConnectDialog = ref(false); // 控制弹窗

const DEFAULT_TASK_ID = "2008570723757368908";

// --- UI 功能 ---
const connectToMachine = () => {
  showConnectDialog.value = true;
};

const triggerUpload = () => { if (!loading.value) fileInput.value.click(); };

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    isUserUploaded.value = true;
    processFile(file);
  }
};

const processFile = (file) => {
  previewUrl.value = URL.createObjectURL(file);
  resultData.value = null;
  const reader = new FileReader();
  reader.onload = (e) => { base64Data.value = e.target.result.split(',')[1]; };
  reader.readAsDataURL(file);
};

// --- 批改核心逻辑 ---
const startCorrection = async () => {
  loading.value = true;
  resultData.value = null;

  try {
    let taskId = "";

    // 逻辑 A：如果使用默认图片（未上传）
    if (!isUserUploaded.value) {
      statusText.value = "🔍 正在检索 AI 批改数据 (请稍候)...";
      taskId = DEFAULT_TASK_ID;
      
      // 🔥 要求一：默认等待 10 秒呈现结果
      await new Promise(resolve => setTimeout(resolve, 7000));
    } 
    // 逻辑 B：用户上传了图片
    else {
      statusText.value = "📤 正在上传并分析...";
      const createRes = await fetch('http://localhost:5000/api/homework/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data.value })
      });
      const createData = await createRes.json();
      taskId = createData.task_id || createData.result?.task_id;
    }

    if (!taskId) throw new Error("无法获取任务 ID，请重试");

    // 开始轮询 (无论 A 还是 B，最后都走这里拿最终数据)
    let pollCount = 0;
    const pollTimer = setInterval(async () => {
      pollCount++;
      statusText.value = isUserUploaded.value ? `🤖 AI 阅卷中... (${pollCount * 2}s)` : "🤖 正在生成批改报告...";
      
      try {
        const queryRes = await fetch(`http://localhost:5000/api/homework/query?task_id=${taskId}&t=${Date.now()}`);
        const queryData = await queryRes.json();

        if (queryData.error_code == 0 && queryData.isAllFinished) {
          clearInterval(pollTimer);
          resultData.value = queryData;
          loading.value = false;
          ElMessage.success("批改任务已完成！");
        } else if (queryData.error_code != 1 && queryData.error_code != 0) {
          throw new Error("批改任务遇到了预料外的异常");
        }
        
        if (pollCount > 40) throw new Error("批改请求超时，请检查网络");
      } catch (e) {
        clearInterval(pollTimer);
        loading.value = false;
        ElMessage.error(e.message);
      }
    }, 5000);

  } catch (err) {
    loading.value = false;
    ElMessage.error(err.message);
  }
};

// --- 映射与辅助 ---
const subjectMap = { chinese: "语文", math: "数学", english: "英语" };
const typeMap = { 1: "口算题", 4: "填空题" };
const getSubjectName = (key) => subjectMap[key] || "全科";
const getTypeName = (code) => typeMap[code] || "普通题";
const cleanReason = (reason) => reason ? reason.replace(/\[.*?\]/g, '').trim() : "解析完毕";
const getCorrectCount = computed(() => resultData.value?.imageResults[0].result.filter(q => q.correctResult === 1).length || 0);
const getWrongCount = computed(() => (resultData.value?.stat_result.all || 0) - getCorrectCount.value);
const calculateAccuracy = computed(() => {
  const all = resultData.value?.stat_result.all || 0;
  return all > 0 ? Math.round((getCorrectCount.value / all) * 100) : 0;
});
</script>

<style scoped>
.correction-container { height: 100vh; display: flex; flex-direction: column; background: #f8fafc; }

/* 页头布局 */
.header-section { 
  background: white; 
  padding: 12px 40px; 
  border-bottom: 1px solid #e2e8f0; 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
}
.header-left { flex: 1; display: flex; align-items: center; }
.header-center { flex: 2; text-align: center; }
.header-right { flex: 1; display: flex; justify-content: flex-end; }

.back-link { 
  cursor: pointer; 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  color: #64748b; 
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}
.back-link:hover { color: #3b82f6; transform: translateX(-4px); }

.title { margin: 0; font-size: 22px; color: #1e293b; font-weight: 800; letter-spacing: 1px; }
.subtitle { margin: 4px 0 0; font-size: 13px; color: #94a3b8; }

.main-content { flex: 1; display: flex; padding: 25px; gap: 25px; overflow: hidden; }
.left-panel { flex: 4; }
.right-panel { flex: 6; }
.panel-card { height: 100%; display: flex; flex-direction: column; border-radius: 16px; border: none; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); }
.card-header { font-weight: bold; color: #3b82f6; border-left: 5px solid #3b82f6; padding-left: 12px; }

.upload-area { flex: 1; display: flex; flex-direction: column; gap: 20px; }

.image-box {
  flex: 1; border: 2px dashed #cbd5e1; border-radius: 12px; background: #fff;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  position: relative; overflow: hidden; transition: border-color 0.3s;
}
.image-box:hover { border-color: #3b82f6; }
.image-box:hover .upload-overlay { opacity: 1; }

.preview-img { width: 100%; height: 100%; object-fit: contain; }

.upload-overlay {
  position: absolute; inset: 0; background: rgba(59, 130, 246, 0.1);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: #3b82f6; font-size: 14px; opacity: 0; transition: opacity 0.3s;
}
.upload-overlay .el-icon { font-size: 30px; margin-bottom: 8px; }

/* 呼吸灯加载 */
.processing-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 20; }
.pulse-loader { width: 60px; height: 60px; border-radius: 50%; background: #3b82f6; animation: pulse 1.5s infinite; margin-bottom: 20px; }
@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }

/* --- 判题机模拟弹窗样式 --- */
.wifi-search-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}
.radar {
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}
.searching-icon {
  font-size: 32px;
  color: #3b82f6;
  z-index: 5;
}
.radar .circle {
  position: absolute;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  opacity: 0;
}
.radar .circle.pulse {
  animation: radar-pulse 2s infinite;
}
@keyframes radar-pulse {
  0% { transform: scale(1); opacity: 0.5; }
  100% { transform: scale(3); opacity: 0; }
}
.searching-text { color: #64748b; font-size: 14px; margin-bottom: 20px; }
.device-list-placeholder { width: 100%; }
.skeleton-line { height: 12px; background: #f1f5f9; border-radius: 6px; margin-bottom: 10px; width: 80%; }
.skeleton-line.short { width: 50%; }

.result-scroll { flex: 1; overflow-y: auto; padding-right: 12px; }
.summary-card { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 25px; }
.stat-row { display: flex; justify-content: space-around; margin-top: 15px; }
.full-annotated-img { width: 100%; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 15px; }
.q-card { border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 20px; background: #fff; }
.q-crop { background: #f8fafc; padding: 12px; text-align: center; border-radius: 8px; margin-bottom: 12px; }
.crop-img { max-width: 100%; max-height: 180px; border-radius: 4px; }
.s-res.ok { color: #10b981; font-weight: bold; }
.s-res.error { color: #ef4444; font-weight: bold; }
</style>