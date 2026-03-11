<template>
  <div class="skill-node" :class="data.type">
    <Handle type="target" position="top" class="handle-input" />
    
    <div class="node-header">
      <span class="icon">{{ data.icon }}</span>
      <span class="title">{{ label }}</span>
    </div>
    
    <div class="node-body">
      <div class="tag">{{ data.tag }}</div>
    </div>

    <Handle type="source" position="bottom" class="handle-output" />
  </div>
</template>

<script setup>
import { Handle } from '@vue-flow/core';

defineProps({
  label: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.skill-node {
  padding: 10px;
  border-radius: 8px;
  background: white;
  border: 1px solid #e2e8f0;
  min-width: 150px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.skill-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.skill-node.scenario { border-top: 4px solid #f97316; }
.skill-node.general { border-top: 4px solid #3b82f6; }
.skill-node.tool { border-top: 4px solid #64748b; }

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.icon { font-size: 18px; }
.title { font-weight: 600; font-size: 14px; color: #1e293b; }

.node-body {
  display: flex;
  justify-content: flex-end;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
}

.skill-node.scenario .tag { background: #fff7ed; color: #c2410c; }
.skill-node.general .tag { background: #eff6ff; color: #1d4ed8; }
.skill-node.tool .tag { background: #f8fafc; color: #374151; }

.handle-input { background: #94a3b8; width: 10px; height: 10px; }
.handle-output { background: #3b82f6; width: 10px; height: 10px; }
</style>