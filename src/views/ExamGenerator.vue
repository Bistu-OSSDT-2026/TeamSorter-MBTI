<template>
  <div class="exam-container">
    <div class="top-bar">
      <div class="back-btn" @click="$router.push('/')">
        <el-icon><ArrowLeft /></el-icon> 返回首页
      </div>
      <div class="bar-title">📝 智能出题助手 V5</div>
      <div class="actions">
        <el-button v-if="streamBuffer" type="success" @click="handlePrint" :icon="Printer">打印/保存 PDF</el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="config-panel">
        <el-scrollbar>
          <el-card shadow="never" class="form-card">
            <template #header><div class="card-header">⚙️ 出题参数设置</div></template>
            <el-form label-position="top" :model="form">
              <div class="form-row">
                <el-form-item label="年级" style="flex: 1;"><el-select v-model="form.grade" style="width:100%"><el-option v-for="g in grades" :key="g" :label="g" :value="g" /></el-select></el-form-item>
                <el-form-item label="学科" style="flex: 1;"><el-select v-model="form.subject" style="width:100%"><el-option v-for="s in subjects" :key="s" :label="s" :value="s" /></el-select></el-form-item>
              </div>

              <el-form-item label="教材版本"><el-select v-model="form.textbook" style="width:100%"><el-option v-for="v in textbookVersions" :key="v" :label="v" :value="v" /></el-select></el-form-item>
              <el-form-item label="考察范围"><el-input v-model="form.topic" type="textarea" :rows="2" placeholder="如：二次函数综合应用" /></el-form-item>
              
              <el-form-item label="难度控制 (0-30%即为拔高)">
                <el-slider v-model="form.difficulty" :step="10" show-stops :marks="difficultyMarks" />
              </el-form-item>

              <el-form-item label="题目多样性 (Temperature)">
                <el-slider v-model="form.temperature" :min="0" :max="1.9" :step="0.1" show-input />
                <div class="hint-text">越高题目越新颖，越低题目越严谨</div>
              </el-form-item>

              <div class="question-limit-info">
                当前题数总计：<b :class="{ 'text-danger': totalQuestions >= 12 }">{{ totalQuestions }} / 12</b>
              </div>
              <div class="question-counts">
                <div class="count-item"><span class="q-label">单选</span><el-input-number v-model="form.questions.choice" :min="0" :max="maxAddable" style="width:100%" /></div>
                <div class="count-item"><span class="q-label">填空</span><el-input-number v-model="form.questions.fill" :min="0" :max="maxAddable" style="width:100%" /></div>
                <div class="count-item"><span class="q-label">解答</span><el-input-number v-model="form.questions.essay" :min="0" :max="maxAddable" style="width:100%" /></div>
              </div>

              <el-form-item label="自定义附加要求"><el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="备注..." /></el-form-item>

              <el-button type="primary" class="generate-btn" @click="startGeneration" :loading="loading" size="large">
                {{ loading ? 'AI 正在深度思考中...' : '开始生成试卷 ✨' }}
              </el-button>
            </el-form>
          </el-card>
        </el-scrollbar>
      </div>

      <div class="preview-panel">
        <div class="paper-container">
          <div class="paper-header" v-if="streamBuffer">
            <h1 class="paper-title">{{form.grade}}{{form.subject}}深度测试卷</h1>
            <p class="paper-subtitle">(范围：{{form.topic || '全册'}} | 难度：{{form.difficulty}}%)</p>
            <div class="student-info">
              姓名：__________ &nbsp;&nbsp; 班级：__________ &nbsp;&nbsp; 考号：__________
            </div>
            <hr class="header-line" />
          </div>

          <div 
            class="paper-content" 
            contenteditable="true" 
            ref="paperRef"
            v-html="streamBuffer"
          ></div>

          <div v-if="!streamBuffer && !loading" class="empty-state">
            <el-empty description="待生成。已限制题目总量在 12 题内以保证生成质量。" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { ArrowLeft, Printer } from "@element-plus/icons-vue";

const streamBuffer = ref(""); 
const loading = ref(false);
const paperRef = ref(null);

const form = reactive({
  grade: "初一",
  subject: "数学",
  textbook: "人教版 (部编)",
  type: "专项测试",
  // 💡 默认填写考察范围
  topic: "正数和负数，有理数及其大小比较", 
  difficulty: 50,
  temperature: 0.8,
  remarks: "",
  questions: { choice: 4, fill: 4, essay: 2 }
});

// 💡 计算属性：控制题目总数
const totalQuestions = computed(() => {
  return form.questions.choice + form.questions.fill + form.questions.essay;
});
const maxAddable = computed(() => {
  return 12; // 允许单个题型最大12，但总数会在提交前校验
});

const grades = ["初一", "初二", "初三", "高一", "高二", "高三"];
const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "信息科技"];
const textbookVersions = ["人教版 (部编)", "北师大版", "苏教版", "通用版"];
const difficultyMarks = { 0: '基础', 50: '正常', 100: '困难' };

/**
 * 💡 启动生成
 */
const startGeneration = async () => {
  if (!form.topic) return ElMessage.warning("请填写考察范围");
  if (totalQuestions.value > 12) return ElMessage.warning("为保证生成质量，请将总题数限制在 12 题以内");
  
  loading.value = true;
  streamBuffer.value = "正在连接 AI 教师...";

  try {
    const response = await fetch("http://localhost:5000/api/generate-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isFirst = true;
/* eslint-disable no-constant-condition */
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value).split("\n\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.replace("data: ", ""));
            if (data.content) {
              if (isFirst) { streamBuffer.value = ""; isFirst = false; }
              streamBuffer.value += data.content;
            }
          } catch (e) { /* ignore */ }
        }
      }
    }
    ElMessage.success("试卷生成完毕！内容已在右侧呈现，可直接点击修改。");
  } catch (err) {
    ElMessage.error("连接异常，请检查后端服务");
  } finally {
    loading.value = false;
  }
};

/**
 * 💡 打印预览
 */
const handlePrint = () => {
  const content = paperRef.value ? paperRef.value.innerHTML : streamBuffer.value;
  const win = window.open('', '_blank');
  win.document.write(`
    <html>
      <head>
        <title>打印试卷</title>
        <style>
          body { font-family: SimSun, serif; padding: 20mm; line-height: 1.8; font-size: 15px; }
          .page-break { page-break-before: always; }
          p { margin: 12px 0; }
          h1, h2 { text-align: center; }
          div[style*="inline-block"] { font-family: Arial; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body onload="window.print()">${content}</body>
    </html>
  `);
  win.document.close();
};

onBeforeUnmount(() => {});
</script>

<style scoped>
.exam-container { height: 100vh; display: flex; flex-direction: column; background: #f5f7fa; overflow: hidden; }
.top-bar { height: 60px; background: white; border-bottom: 1px solid #e4e7ed; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; flex-shrink: 0; }
.main-content { flex: 1; display: flex; overflow: hidden; }
.config-panel { width: 420px; background: white; border-right: 1px solid #e4e7ed; flex-shrink: 0; }

/* 💡 预览容器滚动修复 */
.preview-panel { 
  flex: 1; 
  background: #525659; 
  padding: 40px 20px; 
  overflow-y: auto; 
  display: block; 
}

/* 💡 纸张模拟：向下无限延伸，彻底解决遮挡问题 */
.paper-container {
  width: 210mm; 
  min-height: 297mm; 
  height: auto; 
  overflow: visible; /* 关键：确保内容不被裁剪 */
  background: white; 
  box-shadow: 0 0 20px rgba(0,0,0,0.5); 
  padding: 25mm 20mm; 
  margin: 0 auto 50px auto;
  box-sizing: border-box;
}

.paper-content {
  outline: none; font-family: SimSun, serif; font-size: 15px; line-height: 1.8; color: #000;
  text-align: left;
}

/* 卷头样式 */
.paper-header { text-align: center; margin-bottom: 20px; }
.paper-title { font-size: 26px; margin: 0 0 10px 0; }
.student-info { font-weight: bold; margin-top: 15px; }
.header-line { border: 1px solid #000; margin-top: 20px; }

.question-limit-info { font-size: 12px; margin-top: 10px; text-align: right; }
.text-danger { color: #f56c6c; }

.generate-btn { width: 100%; height: 50px; font-weight: bold; margin-top: 10px; }
.hint-text { font-size: 12px; color: #999; line-height: 1.2; margin-top: 5px; }
.question-counts { display: flex; gap: 10px; margin-bottom: 20px; margin-top: 10px; }
.count-item { flex: 1; text-align: center; }
.q-label { font-size: 12px; color: #999; display: block; margin-bottom: 5px; }
</style>