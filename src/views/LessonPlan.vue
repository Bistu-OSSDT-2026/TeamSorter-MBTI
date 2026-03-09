<template>
  <div class="lesson-container">
    <div class="top-bar">
      <div class="bar-left">
        <div class="back-link" @click="$router.push('/')">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回首页</span>
        </div>
      </div>
      <div class="bar-center">
        <div class="bar-title">📘 智能教案设计工坊</div>
      </div>
      <div class="bar-right">
        <el-button type="success" @click="exportWord" :icon="Download" :disabled="!shadowContent">
          导出 Word
        </el-button>
      </div>
    </div>

    <div class="main-layout">
      <div class="config-panel">
        <el-scrollbar>
          <div class="panel-content">
            <div class="section-title">📝 课程基础信息</div>
            <el-form :model="form" label-position="top">
              <div class="row-2">
                <el-form-item label="年级">
                  <el-select v-model="form.grade" placeholder="请选择年级" style="width: 100%">
                    <el-option v-for="g in gradesList" :key="g" :label="g" :value="g" />
                  </el-select>
                </el-form-item>
                <el-form-item label="学科">
                  <el-select v-model="form.subject" placeholder="请选择学科" style="width: 100%">
                    <el-option v-for="(val, key) in subjectStandards" :key="key" :label="key" :value="key" />
                  </el-select>
                </el-form-item>
              </div>

              <el-form-item label="课题名称">
                <el-input v-model="form.topic" placeholder="例：有趣的加减法" />
              </el-form-item>

              <div class="row-2">
                <el-form-item label="课时时长(分)">
                  <el-input-number v-model="form.duration" style="width: 100%" :min="1" :max="120" />
                </el-form-item>
                <el-form-item label="教材版本">
                  <el-select v-model="form.textbook" placeholder="请选择教材" style="width: 100%">
                    <el-option v-for="t in textbookList" :key="t" :label="t" :value="t" />
                  </el-select>
                </el-form-item>
              </div>

              <div class="section-divider"></div>
              <div class="section-title">🧠 教学深度定制</div>
              
              <el-form-item label="学情分析">
                <el-input v-model="form.analysis" type="textarea" :rows="2" placeholder="默认：学生好奇心强，思维活跃，已有一定的基础。" />
              </el-form-item>
              
              <el-form-item label="教学方法">
                <el-input v-model="form.method" placeholder="默认：讲授法、小组讨论、启发式教学" />
              </el-form-item>
              
              <el-form-item label="特殊要求">
                <el-input v-model="form.other" type="textarea" :rows="2" placeholder="默认：无特殊要求，注重互动性。" />
              </el-form-item>
              
              <el-button type="primary" class="generate-btn" @click="generatePlan" :loading="loading" size="large">
                {{ loading ? 'AI 正在书写教案...' : '✨ 开始生成教案' }}
              </el-button>
            </el-form>
          </div>
        </el-scrollbar>
      </div>

      <div class="editor-panel">
        <div class="editor-main-canvas" ref="scrollContainer">
          <div 
            class="content-editable-layer" 
            contenteditable="true" 
            ref="paperRef"
            v-html="shadowContent"
          ></div>
          
          <div v-if="loading" class="ai-writing-status">
            <div class="writing-icon"></div>
            <span>AI 正在根据<b>《2022版新课标核心素养》</b>努力书写中...</span>
          </div>

          <div v-if="!shadowContent && !loading" class="empty-guide">
            <el-empty description="在左侧选择并配置完成后，点击“开始生成”" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Download } from '@element-plus/icons-vue';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';

// 💡 1. 核心素养映射表
const subjectStandards = {
  '数学': '数学眼光、数学思维、数学语言',
  '语文': '文化自信、语言运用、思维能力、审美创造',
  '英语': '语言能力、文化意识、思维品质、学习能力',
  '科学': '科学观念、科学思维、探究实践、态度责任',
  '信息科技': '信息意识、计算思维、数字化学习与创新、信息社会责任',
  '道德与法治': '政治认同、道德修养、法治观念、健全人格、责任意识',
  '体育与健康': '运动能力、健康行为、体育品德',
  '物理': '物理观念、科学思维、科学探究、科学态度与责任',
  '艺术': '审美感知、艺术表现、创意实践、文化理解',
  '生物': '生命观念、科学思维、探究实践、态度责任',
  '历史': '唯物史观、时空观念、史料实证、历史解释、家国情怀',
  '劳动': '劳动观念、劳动能力、劳动习惯和品质、劳动精神',
  '化学': '化学观念、科学思维、科学探究与实践、科学态度与责任',
  '地理': '人地协调观、综合思维、区域感知、地理实践力'
};

// 💡 2. 年级列表
const gradesList = [
  '小学一年级', '小学二年级', '小学三年级', '小学四年级', '小学五年级', '小学六年级',
  '初一', '初二', '初三',
  '高一', '高二', '高三'
];

// 💡 3. 教材版本列表
const textbookList = ['人教版', '北师大版', '苏教版', '鲁教版', '沪教版', '湘教版', '通用版'];

const shadowContent = ref(""); 
const loading = ref(false);
const paperRef = ref(null);
const scrollContainer = ref(null);

const form = reactive({
  grade: '小学三年级', 
  subject: '数学', 
  topic: '', 
  duration: 40, 
  textbook: '人教版',
  analysis: '', 
  method: '', 
  other: ''
});

const generatePlan = async () => {
  // 核心预填写处理逻辑
  const finalForm = {
    ...form,
    topic: form.topic.trim() || "本学科典型课题",
    analysis: form.analysis.trim() || "学生好奇心强，思维活跃，已有一定的学科基础，善于观察生活。",
    method: form.method.trim() || "讲授法、小组合作研讨法、启发式教学法。",
    other: form.other.trim() || "无特殊要求，注重课堂互动与评价。"
  };

  if (!form.grade || !form.subject) return ElMessage.warning("请选择年级和学科");
  
  loading.value = true;
  shadowContent.value = ""; 

  const coreDimensions = subjectStandards[form.subject] || "核心素养目标";
  
  // 💡 获取当前用户ID (假设存储在 sessionStorage 中)
  const userId = sessionStorage.getItem('userId') || 'guest';

  try {
    const response = await fetch("http://localhost:5000/api/generate-lesson-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...finalForm,
        coreDimensions: coreDimensions,
        userId: userId // 💡 传给后端用于保存
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    /* eslint-disable no-constant-condition */
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const dataStr = line.replace("data: ", "");
        if (dataStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.content) {
            let cleanChunk = parsed.content
              .replace(/```html|```/g, "")
              .replace(/<table/g, '<table style="width: 100%; table-layout: fixed; border-collapse: collapse;" border="1"');
            shadowContent.value += cleanChunk;
            nextTick(() => {
              if (scrollContainer.value) scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
            });
          }
        } catch (e) { /* skip */ }
      }
    }
    ElMessage.success("教案生成完毕！");
  } catch (err) {
    ElMessage.error("生成中断");
  } finally {
    loading.value = false;
  }
};

const exportWord = async () => {
  const content = paperRef.value ? paperRef.value.innerHTML : shadowContent.value;
  if (!content) return;
  try {
    const aiLayoutStyles = `table { width: 100%; border-collapse: collapse; table-layout: fixed; } th, td { border: 1px solid #000; padding: 10px; }`;
    const htmlString = `<html><head><meta charset="UTF-8"><style>${aiLayoutStyles}</style></head><body>${content}</body></html>`;
    const buffer = await asBlob(htmlString);
    saveAs(buffer, `${form.topic || '智能教案'}_教案.docx`);
  } catch (err) { ElMessage.error("导出失败"); }
};
</script>

<style scoped>
.lesson-container { height: 100vh; display: flex; flex-direction: column; background-color: #f8fafc; overflow: hidden; }
.top-bar { height: 60px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; flex-shrink: 0; z-index: 100; }
.bar-title { font-size: 18px; font-weight: 800; color: #1e293b; }
.main-layout { flex: 1; display: flex; overflow: hidden; }
.config-panel { width: 400px; background: white; border-right: 1px solid #e2e8f0; flex-shrink: 0; }
.panel-content { padding: 25px; }
.editor-panel { flex: 1; background: #f1f5f9; padding: 20px; display: flex; justify-content: center; }
.editor-main-canvas { width: 100%; max-width: 1000px; background: white; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-radius: 4px; overflow-y: auto; padding: 60px 80px; position: relative; box-sizing: border-box; }
.content-editable-layer { outline: none; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; font-size: 15px; line-height: 1.8; color: #334155; min-height: 500px; }
.ai-writing-status { display: flex; align-items: center; gap: 12px; margin-top: 30px; padding: 15px; background: #f0f7ff; border-radius: 8px; color: #3b82f6; font-weight: 600; font-size: 14px; border: 1px dashed #3b82f6; }
.writing-icon { width: 16px; height: 16px; background: #3b82f6; border-radius: 50%; animation: pulse 1.2s infinite; }
@keyframes pulse { 0% { transform: scale(0.8); opacity: 0.5; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(0.8); opacity: 0.5; } }
:deep(table) { width: 100% !important; table-layout: fixed !important; border-collapse: collapse; margin: 20px 0; }
:deep(td), :deep(th) { border: 1px solid #cbd5e1 !important; padding: 12px !important; word-wrap: break-word; }
.section-title { font-size: 15px; font-weight: bold; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px; color: #1e293b; }
.row-2 { display: flex; gap: 15px; }
.row-2 .el-form-item { flex: 1; }
.generate-btn { width: 100%; margin-top: 15px; font-weight: bold; height: 48px; }
.back-link { cursor: pointer; display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 14px; }
.section-divider { height: 1px; background: #f1f5f9; margin: 25px 0; }
</style>