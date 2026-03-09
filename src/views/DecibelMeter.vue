<template>
  <div class="decibel-container fullscreen-cover" :class="bgTheme">
    
    <div class="header">
      <div class="header-left">
        <button class="icon-btn compact" @click="closeWindow">
          <span class="icon">✕</span> 关闭
        </button>
        <button class="icon-btn compact" v-if="step === 'active'" @click="backToSetup">
          <span class="icon">⚙️</span> 调整
        </button>
      </div>
      
      <div class="title" v-if="step === 'active'">
        {{ mode === 'reading' ? '📢 朗读模式' : '🤫 自习模式' }}
      </div>

      <div class="timer-badge-large" v-if="step === 'active'">
        <span class="timer-label">剩余</span>
        <span class="timer-val">{{ formattedTime }}</span>
      </div>
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="step === 'setup'" class="setup-wrapper" key="setup">
        <h1 class="setup-title">课堂挑战设置</h1>
        
        <div class="mode-container">
          <div 
            class="mode-card" 
            :class="{ active: mode === 'reading' }"
            @click="selectMode('reading')"
          >
            <div class="card-icon">📢</div>
            <div class="card-info">
              <h3>早读模式</h3>
              <p>声音越响大树越茂盛</p>
            </div>
            <div class="check-mark" v-if="mode === 'reading'">✔</div>
          </div>

          <div 
            class="mode-card" 
            :class="{ active: mode === 'study' }"
            @click="selectMode('study')"
          >
            <div class="card-icon">🤫</div>
            <div class="card-info">
              <h3>自习模式</h3>
              <p>保持安静花朵越鲜艳</p>
            </div>
            <div class="check-mark" v-if="mode === 'study'">✔</div>
          </div>
        </div>

        <div class="settings-grid">
          
          <div class="setting-card">
            <div class="card-header">
              <span class="label">{{ mode === 'reading' ? '📢 达标音量' : '🤫 警戒音量' }}</span>
              <span class="value-highlight">{{ targetDb }} dB</span>
            </div>
            
            <div class="slider-wrapper">
              <input 
                type="range" min="30" max="100" step="5" 
                v-model="targetDb" class="styled-slider"
              />
            </div>

            <div class="db-reference">
              <span class="ref-label">当前环境:</span>
              <div class="ref-track">
                <div 
                  class="ref-bar" 
                  :class="isGoalMet ? 'bg-green' : 'bg-red'"
                  :style="{ width: Math.min(100, currentDb) + '%' }"
                ></div>
                <div class="ref-marker" :style="{ left: targetDb + '%' }"></div>
              </div>
              <span class="ref-val">{{ currentDb }}dB</span>
            </div>
            <p class="mini-tip">
              {{ mode === 'reading' ? '当前需超过红线' : '当前需低于红线' }}
            </p>
          </div>

          <div class="setting-card">
            <div class="sub-setting">
              <div class="card-header">
                <span class="label">⏱️ 挑战时长</span>
                <span class="value-highlight">{{ challengeDuration }} 分钟</span>
              </div>
              <input 
                type="range" min="1" max="45" step="1" 
                v-model="challengeDuration" class="styled-slider"
              />
            </div>
            
            <div class="divider"></div>

            <div class="sub-setting">
              <div class="card-header">
                <span class="label">🔥 难度系数</span>
                <span class="value-highlight">{{ Math.round(difficulty * 100) }}%</span>
              </div>
              <input 
                type="range" min="0.5" max="0.95" step="0.05" 
                v-model="difficulty" class="styled-slider"
              />
              <p class="mini-tip">需 {{ Math.round(difficulty * 100) }}% 时间达标</p>
            </div>
          </div>
        </div>

        <button class="start-btn" @click="startChallenge">开始挑战</button>
      </div>

      <div v-else class="monitor-wrapper" key="monitor">
        
        <div class="stats-panel">
          <div class="db-display">
            <span class="val">{{ currentDb }}</span>
            <span class="unit">dB</span>
          </div>
          <div class="status-tag" :class="isGoalMet ? 'success' : 'warning'">
            {{ isGoalMet ? '✅ 状态达标' : (mode === 'reading' ? '❌ 声音太小' : '❌ 环境太吵') }}
          </div>
        </div>

        <div class="scene-container">
          <div class="weather-layer" :class="{ stormy: !isGoalMet && mode === 'study' }"></div>
          
          <div class="tree-wrapper">
            <div class="tree-visual" :class="treeShakeClass">
              <transition name="pop">
                <div v-if="growthStage === 0" class="emoji-stage">🌱</div>
                <div v-else-if="growthStage === 1" class="emoji-stage">🌿</div>
                <div v-else-if="growthStage === 2" class="emoji-stage">🌳</div>
                <div v-else class="emoji-stage glowing">🌸🌳🍎</div>
              </transition>
            </div>

            <div class="growth-progress-large">
              <div class="bar-inner" :style="{ width: growthProgress + '%' }"></div>
              <span class="bar-text">🌳 成长进度 {{ growthProgress.toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <div class="victory-modal" v-if="gameResult === 'success'">
          <div class="victory-content">
            <h2>🎉 挑战成功！</h2>
            <p>班级表现完美！大树已长成。</p>
            <button @click="resetGame">再来一次</button>
          </div>
        </div>

        <div class="victory-modal" v-if="gameResult === 'timeout'">
          <div class="victory-content">
            <h2 style="color: #f59e0b;">⌛ 时间到</h2>
            <p>很遗憾，成长值定格在 {{ Math.floor(growthProgress) }}%。</p>
            <button @click="resetGame">再试一次</button>
          </div>
        </div>

      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// --- 状态管理 ---
const step = ref('setup');
const mode = ref('reading');
const targetDb = ref(70);
const challengeDuration = ref(5);
const difficulty = ref(0.8);

const remainingSeconds = ref(0);
const gameResult = ref(null); 

let timerInterval = null;

const currentDb = ref(0);
const growthProgress = ref(0); 

let audioContext = null;
let analyser = null;
let microphone = null;
let jsNode = null;

// --- 核心逻辑 ---

const selectMode = (m) => {
  mode.value = m;
  targetDb.value = m === 'reading' ? 75 : 50;
};

const isGoalMet = computed(() => {
  if (mode.value === 'reading') return currentDb.value >= targetDb.value;
  else return currentDb.value <= targetDb.value;
});

const bgTheme = computed(() => {
  if (step.value === 'setup') return 'theme-dark';
  if (mode.value === 'study' && !isGoalMet.value) return 'theme-alert';
  return mode.value === 'reading' ? 'theme-reading' : 'theme-study';
});

const growthStage = computed(() => {
  if (growthProgress.value < 20) return 0;
  if (growthProgress.value < 50) return 1;
  if (growthProgress.value < 85) return 2;
  return 3;
});

const treeShakeClass = computed(() => {
  if (mode.value === 'study' && !isGoalMet.value) return 'shake-hard';
  if (mode.value === 'reading' && isGoalMet.value) return 'pulse-grow';
  return '';
});

const formattedTime = computed(() => {
  const m = Math.floor(remainingSeconds.value / 60);
  const s = remainingSeconds.value % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

// --- 功能方法 ---

const closeWindow = () => {
  stopMic();
  if (window.history.length <= 1 || window.opener) {
    window.close();
  } else {
    window.location.href = '/';
  }
};

const backToSetup = () => {
  step.value = 'setup';
  gameResult.value = null;
  growthProgress.value = 0;
  if (timerInterval) clearInterval(timerInterval);
};

const resetGame = () => {
  backToSetup();
};

const initAudio = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    microphone = audioContext.createMediaStreamSource(stream);
    
    const bufferSize = 2048; 
    jsNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

    analyser.smoothingTimeConstant = 0.6;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(jsNode);
    jsNode.connect(audioContext.destination);

    jsNode.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      let values = 0;
      for (let i = 0; i < array.length; i++) values += array[i];
      const average = values / array.length;
      
      let db = Math.round(average * 1.5); 
      db = Math.max(10, Math.min(120, db));
      currentDb.value = db;

      if (step.value === 'active' && gameResult.value === null) {
        processGameLogic();
      }
    };
  } catch (err) {
    ElMessage.error('无法启动麦克风权限');
    console.error(err);
  }
};

const processGameLogic = () => {
  if (growthProgress.value >= 100) return;

  const frameDuration = 2048 / audioContext.sampleRate; 
  const requiredEffectiveSeconds = (challengeDuration.value * 60) * difficulty.value;
  const growthPerSecond = 100 / requiredEffectiveSeconds;
  const incrementPerFrame = growthPerSecond * frameDuration;
  const penaltyPerFrame = incrementPerFrame * 3;

  if (isGoalMet.value) {
    growthProgress.value = Math.min(100, growthProgress.value + incrementPerFrame);
  } else {
    if (mode.value === 'study') {
      growthProgress.value = Math.max(0, growthProgress.value - penaltyPerFrame);
    }
  }
  
  if (growthProgress.value >= 100) {
    gameResult.value = 'success';
    if (timerInterval) clearInterval(timerInterval);
  }
};

const startChallenge = () => {
  if (!audioContext) initAudio();
  growthProgress.value = 0;
  gameResult.value = null;
  remainingSeconds.value = challengeDuration.value * 60;
  step.value = 'active';

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--;
    } else {
      if (growthProgress.value < 100) {
        gameResult.value = 'timeout';
      }
      clearInterval(timerInterval);
    }
  }, 1000);
};

const stopMic = () => {
  if (audioContext && audioContext.state !== 'closed') audioContext.close();
  if (jsNode) jsNode.onaudioprocess = null;
  if (timerInterval) clearInterval(timerInterval);
};

onMounted(() => {
  initAudio();
});

onBeforeUnmount(stopMic);
</script>

<style scoped>
/* 全局基础设置 */
.decibel-container {
  width: 100vw; 
  height: 100vh;
  position: fixed; 
  top: 0; left: 0;
  z-index: 9999;
  display: flex; flex-direction: column;
  overflow: hidden; /* 禁止滚动 */
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  user-select: none;
}

/* 主题色 */
.theme-dark { background: #111827; color: white; }
.theme-reading { background: linear-gradient(to bottom, #2563eb, #93c5fd); color: white; }
.theme-study { background: linear-gradient(to bottom, #047857, #6ee7b7); color: white; }
.theme-alert { background: linear-gradient(to bottom, #991b1b, #ef4444); color: white; }

/* 顶部栏 (压缩高度) */
.header { 
  height: 60px; /* 固定高度 */
  padding: 0 20px; 
  display: flex; justify-content: space-between; align-items: center; 
  flex-shrink: 0;
  z-index: 20; 
}
.header-left { display: flex; gap: 10px; }

.icon-btn { 
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); 
  color: white; padding: 6px 12px; border-radius: 20px; 
  cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 14px;
}
.icon-btn:hover { background: rgba(255,255,255,0.25); }

.title { 
  font-size: 24px; font-weight: 800; 
  position: absolute; left: 50%; transform: translateX(-50%); 
}

.timer-badge-large {
  display: flex; flex-direction: column; align-items: flex-end;
  background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 8px;
}
.timer-label { font-size: 10px; opacity: 0.8; }
.timer-val { font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold; color: #fbbf24; line-height: 1; }

/* ================= 核心自适应布局区 (Flex + vh) ================= */
.setup-wrapper {
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; /* 垂直居中 */
  gap: 2vh; /* 使用 vh 间距自适应 */
  width: 100%; 
  max-width: 900px; /* 限制最大宽 */
  margin: 0 auto;
  padding: 10px;
  box-sizing: border-box;
}

.setup-title { font-size: 28px; margin: 0; font-weight: 800; opacity: 0.9; }

/* 模式选择 (横排) */
.mode-container { display: flex; gap: 20px; width: 100%; justify-content: center; }
.mode-card {
  flex: 1; max-width: 320px;
  background: rgba(255,255,255,0.08); border: 2px solid transparent;
  padding: 15px; border-radius: 16px; cursor: pointer; 
  display: flex; align-items: center; gap: 15px;
  transition: all 0.2s;
}
.mode-card.active { border-color: #3b82f6; background: rgba(59, 130, 246, 0.15); }
.card-icon { font-size: 40px; }
.card-info h3 { margin: 0; font-size: 18px; }
.card-info p { margin: 4px 0 0; font-size: 12px; opacity: 0.7; }
.check-mark { margin-left: auto; font-size: 20px; color: #3b82f6; }

/* 设置卡片网格 (紧凑) */
.settings-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 20px; 
  width: 100%; 
}

.setting-card {
  background: rgba(0,0,0,0.25); 
  padding: 15px 20px; 
  border-radius: 16px; 
  backdrop-filter: blur(10px);
  display: flex; flex-direction: column; justify-content: center;
}

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.label { font-size: 15px; font-weight: bold; opacity: 0.9; }
.value-highlight { color: #fbbf24; font-size: 18px; font-weight: bold; }

.styled-slider { width: 100%; accent-color: #3b82f6; height: 6px; cursor: pointer; margin-bottom: 5px;}

.divider { height: 1px; background: rgba(255,255,255,0.1); margin: 10px 0; }
.mini-tip { font-size: 12px; opacity: 0.5; text-align: center; margin-top: 5px; }

/* 分贝实时条 */
.db-reference { display: flex; align-items: center; gap: 10px; margin-top: 10px; background: rgba(0,0,0,0.2); padding: 6px 10px; border-radius: 8px; }
.ref-label { font-size: 12px; opacity: 0.7; white-space: nowrap; }
.ref-track { flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; position: relative; overflow: hidden; }
.ref-bar { height: 100%; transition: width 0.1s; }
.bg-green { background: #34d399; }
.bg-red { background: #f87171; }
.ref-marker { position: absolute; top: 0; width: 2px; height: 100%; background: #fbbf24; box-shadow: 0 0 4px #fbbf24; z-index: 2; }
.ref-val { font-family: monospace; font-size: 14px; min-width: 40px; text-align: right; }

.start-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; 
  padding: 12px 60px; font-size: 20px; border-radius: 50px; cursor: pointer; font-weight: 800;
  box-shadow: 0 5px 20px rgba(0,0,0,0.3); transition: transform 0.2s;
  margin-top: 1vh;
}
.start-btn:hover { transform: scale(1.05); }

/* ========== 监测模式 ========== */
.monitor-wrapper { flex: 1; width: 100%; position: relative; display: flex; flex-direction: column; align-items: center; }
.stats-panel { margin-top: 5vh; text-align: center; z-index: 10; }
.db-display { font-size: 70px; font-weight: 900; line-height: 1; }
.db-display .unit { font-size: 24px; opacity: 0.8; margin-left: 5px; }
.status-tag { display: inline-block; padding: 6px 18px; border-radius: 20px; font-weight: bold; font-size: 18px; margin-top: 5px; backdrop-filter: blur(8px); }
.status-tag.success { background: rgba(16, 185, 129, 0.25); color: #d1fae5; border: 1px solid #10b981; }
.status-tag.warning { background: rgba(239, 68, 68, 0.25); color: #fee2e2; border: 1px solid #ef4444; }

.scene-container { flex: 1; width: 100%; position: relative; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 8vh; }
.tree-wrapper { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }

/* 进度条位置和样式 */
.growth-progress-large { 
  width: 60%; max-width: 600px; height: 36px;
  background: rgba(0,0,0,0.4); border-radius: 18px; overflow: hidden; 
  border: 3px solid rgba(255,255,255,0.3); position: relative;
  margin-top: 20px;
}
.bar-inner { height: 100%; background: linear-gradient(90deg, #84cc16, #22c55e, #10b981); transition: width 0.3s linear; }
.bar-text { position: absolute; width: 100%; text-align: center; line-height: 36px; font-size: 16px; font-weight: bold; top: 0; color: white; text-shadow: 0 1px 3px black; }

.tree-visual { font-size: 180px; transition: transform 0.3s; margin-bottom: 20px; }
.emoji-stage { font-size: 280px; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.4)); }

/* 动画类 */
.shake-hard { animation: shake 0.5s infinite; }
.pulse-grow { animation: pulse 1s infinite; }
@keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 25% { transform: translate(-3px, 0px) rotate(-5deg); } 50% { transform: translate(3px, -1px) rotate(5deg); } 75% { transform: translate(-1px, 2px) rotate(-2deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }
@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }

/* 弹窗 */
.victory-modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 100; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
.victory-content { background: white; color: #111827; padding: 40px; border-radius: 30px; text-align: center; animation: popUp 0.5s; box-shadow: 0 20px 60px rgba(0,0,0,0.5); width: 400px; }
.victory-content h2 { font-size: 36px; margin-bottom: 10px; }
.victory-content button { padding: 12px 40px; background: #3b82f6; color: white; border: none; border-radius: 12px; font-size: 18px; cursor: pointer; font-weight: bold; }
@keyframes popUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.pop-enter-active { animation: popUp 0.5s; }
</style>