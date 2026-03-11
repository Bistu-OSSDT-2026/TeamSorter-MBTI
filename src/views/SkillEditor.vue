<template>
  <div class="skill-editor-page">
    <!-- Header -->
    <header class="editor-header">
      <div class="header-left">
        <el-button link @click="$router.push('/studio')">
          <el-icon><ArrowLeft /></el-icon> 返回Skill工坊
        </el-button>
        <span class="divider">|</span>
        <h2 class="editor-title">{{ pageTitle }}</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" size="small" @click="saveFlow">保存Skill</el-button>
        <el-button type="success" size="small" @click="runFlow">运行测试</el-button>
      </div>
    </header>

    <div class="editor-body">
      <!-- Left Sidebar: Component Library -->
      <aside class="editor-sidebar">
        <div class="sidebar-header">
          <h3>组件库</h3>
          <p class="subtitle">拖拽组件到画布</p>
        </div>
        
        <el-collapse v-model="activeNames">
          <el-collapse-item title="场景 Skill" name="1">
            <div 
              class="dnd-node scenario" 
              draggable="true" 
              @dragstart="onDragStart($event, 'scenario', '课堂互动')"
            >
              <span class="icon">🏫</span> 课堂互动
            </div>
            <div 
              class="dnd-node scenario" 
              draggable="true" 
              @dragstart="onDragStart($event, 'scenario', '作业批改')"
            >
              <span class="icon">📝</span> 作业批改
            </div>
          </el-collapse-item>
          
          <el-collapse-item title="通用 Skill" name="2">
            <div 
              class="dnd-node general" 
              draggable="true" 
              @dragstart="onDragStart($event, 'general', '文本摘要')"
            >
              <span class="icon">📄</span> 文本摘要
            </div>
            <div 
              class="dnd-node general" 
              draggable="true" 
              @dragstart="onDragStart($event, 'general', '翻译助手')"
            >
              <span class="icon">🌐</span> 翻译助手
            </div>
          </el-collapse-item>
          
          <el-collapse-item title="工具 Skill" name="3">
            <div 
              class="dnd-node tool" 
              draggable="true" 
              @dragstart="onDragStart($event, 'tool', 'PDF转Word')"
            >
              <span class="icon">📂</span> PDF转Word
            </div>
            <div 
              class="dnd-node tool" 
              draggable="true" 
              @dragstart="onDragStart($event, 'tool', '图片OCR')"
            >
              <span class="icon">🖼️</span> 图片OCR
            </div>
          </el-collapse-item>
        </el-collapse>
      </aside>

      <!-- Center Canvas: Vue Flow -->
      <main class="editor-canvas" @drop="onDrop" @dragover="onDragOver">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :default-zoom="1.5"
          :min-zoom="0.2"
          :max-zoom="4"
          fit-view-on-init
          class="vue-flow-basic"
        >
          <Background pattern-color="#aaa" gap="8" />
          <Controls />
          <MiniMap />
          
          <!-- Custom Node Template -->
          <template #node-skill="props">
            <SkillNode v-bind="props" />
          </template>
        </VueFlow>
      </main>

      <!-- Right Sidebar: Properties -->
      <aside class="editor-properties">
        <div class="prop-header">
          <h3>属性配置</h3>
        </div>
        <div class="prop-content">
          <div v-if="selectedNode">
            <el-form label-position="top" size="small">
              <el-form-item label="节点名称">
                <el-input v-model="selectedNode.label" />
              </el-form-item>
              
              <!-- Dynamic Properties based on Node Type -->
              <template v-if="selectedNode.data">
                <el-form-item label="Skill 类型">
                  <el-tag>{{ selectedNode.data.tag || '基础节点' }}</el-tag>
                </el-form-item>

                <!-- Mock Configuration Fields -->
                <el-form-item label="模型选择" v-if="selectedNode.data.type !== 'tool'">
                  <el-select v-model="selectedNode.data.model" placeholder="选择模型">
                    <el-option label="GPT-4o" value="gpt-4o" />
                    <el-option label="DeepSeek-V3" value="deepseek-v3" />
                    <el-option label="Claude-3.5" value="claude-3.5" />
                  </el-select>
                </el-form-item>

                <el-form-item label="提示词 (System Prompt)" v-if="selectedNode.data.type !== 'tool'">
                  <el-input 
                    v-model="selectedNode.data.prompt" 
                    type="textarea" 
                    :rows="6" 
                    placeholder="输入系统提示词..." 
                  />
                </el-form-item>

                <el-form-item label="工具参数" v-if="selectedNode.data.type === 'tool'">
                  <el-input v-model="selectedNode.data.params" placeholder="API Key 或其他参数" />
                </el-form-item>
              </template>
            </el-form>
          </div>
          <el-empty v-else description="点击节点配置参数" :image-size="60" />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow, useVueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import SkillNode from '../components/nodes/SkillNode.vue';
import axios from 'axios'; // Added axios

// Import Vue Flow styles
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';

const route = useRoute();
const router = useRouter(); // Added router
const pageTitle = ref('新建技能流');
const activeNames = ref(['1', '2', '3']);
const selectedNode = ref(null); // Track selected node
const skillName = ref('');
const skillDescription = ref('');

// Vue Flow State
const { project, onConnect, onNodeClick, toObject, fromObject } = useVueFlow(); 
const nodes = ref([]);
const edges = ref([]);

let id = 0;
const getId = () => `dndnode_${id++}`;

onMounted(async () => {
  if (route.params.id) {
    pageTitle.value = '编辑技能';
    try {
      const { data } = await axios.get(`http://localhost:5000/api/skills/${route.params.id}`);
      skillName.value = data.name;
      skillDescription.value = data.description;
      if (data.data) {
        fromObject(data.data);
      }
    } catch (error) {
      ElMessage.error('加载技能失败');
    }
  } else {
    // Initialize with start node if new
    nodes.value = [
      { id: '1', type: 'input', label: '开始节点', position: { x: 250, y: 5 }, class: 'light', data: { label: '开始节点' } },
    ];
  }
});

// --- Connection Logic ---
onConnect((params) => {
  // addEdges([params]); // useVueFlow addEdges might still work if using internal store, but better to update ref manually
  edges.value.push(params);
  ElMessage.success('连接成功');
});

// --- Node Selection Logic ---
onNodeClick(({ node }) => {
  selectedNode.value = node;
});

// Drag and Drop Logic
const onDragStart = (event, type, label) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify({ type, label }));
    event.dataTransfer.effectAllowed = 'move';
  }
};

const onDragOver = (event) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onDrop = (event) => {
  const data = event.dataTransfer?.getData('application/vueflow');
  if (!data) return;
  
  const { type, label } = JSON.parse(data);

  // Calculate position relative to the flow pane
  // This is a simplified version; for production, use project() from useVueFlow
  const { left, top } = document.querySelector('.vue-flow-basic').getBoundingClientRect();
  const position = project({
    x: event.clientX - left,
    y: event.clientY - top,
  });

  const newNode = {
    id: getId(),
    type: 'skill', // Use custom node type
    position,
    label: `${label}`,
    data: { 
      label: `${label}`,
      type: type, // 'scenario', 'general', 'tool'
      icon: getIcon(type),
      tag: getTagName(type)
    },
  };

  nodes.value.push(newNode);
};

const getIcon = (type) => {
  const map = { 'scenario': '🏫', 'general': '📄', 'tool': '🛠️' };
  return map[type] || '⚡';
};

const getTagName = (type) => {
  const map = { 'scenario': '场景技能', 'general': '通用技能', 'tool': '工具技能' };
  return map[type] || '技能';
};

const saveFlow = async () => {
  try {
    const flowData = toObject();
    
    // Simple prompt for name if new
    if (!skillName.value) {
      skillName.value = prompt('请输入技能名称', '新技能') || '新技能';
    }

    const payload = {
      name: skillName.value,
      description: skillDescription.value,
      data: flowData
    };

    if (route.params.id) {
      await axios.put(`http://localhost:5000/api/skills/${route.params.id}`, payload);
      ElMessage.success('技能更新成功！');
    } else {
      const { data } = await axios.post('http://localhost:5000/api/skills', payload);
      ElMessage.success('技能创建成功！');
      router.replace(`/skill-editor/${data._id}`);
      pageTitle.value = '编辑技能';
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('保存失败');
  }
};

const runFlow = () => {
  ElMessage.success('正在运行测试...');
};
</script>

<style scoped>
/* Reverted Canvas Styles */
.editor-canvas {
  background-color: #fff;
  /* background-image: radial-gradient(#333 1px, transparent 1px); removed */
  background-size: 20px 20px;
}

:deep(.vue-flow__node) {
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

:deep(.vue-flow__node:hover) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
}

:deep(.vue-flow__node.selected) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary);
}

:deep(.vue-flow__edge-path) {
  stroke: #b1b1b7;
  stroke-width: 2;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: var(--el-color-primary);
}

:deep(.vue-flow__controls) {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
}

:deep(.vue-flow__controls-button) {
  background: transparent;
  border-bottom: 1px solid #e2e8f0;
  fill: #64748b;
}
:deep(.vue-flow__controls-button:hover) {
  background: #f8fafc;
  fill: var(--el-color-primary);
}

:deep(.vue-flow__minimap) {
  background: #fff;
  border: 1px solid #e2e8f0;
}
:deep(.vue-flow__minimap-mask) {
  fill: rgba(241, 245, 249, 0.6);
}

.skill-editor-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: inherit;
}

.editor-header {
  height: 50px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1e293b;
}

.divider { color: #e2e8f0; }

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-sidebar {
  width: 240px;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.sidebar-header h3 { margin: 0; font-size: 14px; font-weight: 600; }
.subtitle { margin: 5px 0 0; font-size: 12px; color: #94a3b8; }

.dnd-node {
  padding: 10px;
  margin: 10px;
  border-radius: 6px;
  cursor: grab;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid transparent;
  background: white;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.dnd-node:hover { transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

.dnd-node.scenario { border-left: 3px solid #f97316; }
.dnd-node.general { border-left: 3px solid #3b82f6; }
.dnd-node.tool { border-left: 3px solid #64748b; }

.editor-canvas {
  flex: 1;
  background: #f1f5f9;
  position: relative;
}

.editor-properties {
  width: 300px;
  border-left: 1px solid #e2e8f0;
  background: #fff;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.prop-header {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.prop-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.prop-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

/* Reverted Theme Overrides */
:deep(.el-collapse-item__header) {
  background-color: #fff;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
}
:deep(.el-collapse-item__content) {
  background-color: #fff;
  color: #64748b;
  padding-bottom: 0;
}
:deep(.el-collapse) {
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.dnd-node {
  padding: 10px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: grab;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.dnd-node:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: #f5f3ff;
}

:deep(.el-form-item__label) {
  color: #1e293b;
}

:deep(.el-input__wrapper), :deep(.el-textarea__inner) {
  background-color: #fff;
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}
:deep(.el-input__inner) {
  color: #606266;
}

/* Vue Flow Node Styles */
:deep(.vue-flow__node-default.scenario) { background: #fff7ed; border-color: #fdba74; }
:deep(.vue-flow__node-default.general) { background: #eff6ff; border-color: #bfdbfe; }
:deep(.vue-flow__node-default.tool) { background: #f8fafc; border-color: #cbd5e1; }
</style>