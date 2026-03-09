<template>
  <div class="profile-container">
    
    <div class="page-header">
      <h2>个人中心</h2>
      <p>管理您的账号信息与 AI 偏好设置</p>
    </div>

    <div class="profile-layout">
      
      <div class="left-column">
        
        <div class="bento-card profile-card">
          <div class="avatar-wrapper">
            <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <div class="vip-badge" v-if="userInfo.isVip">PRO</div>
          </div>
          <h3 class="user-name">{{ userInfo.name }}</h3>
          <p class="user-role">{{ userInfo.school }} · {{ userInfo.subject }}老师</p>
          
          <div class="tags-row">
            <span class="tag">教龄 {{ userInfo.teachingYears }} 年</span>
            <span class="tag">班主任</span>
          </div>

          <div class="check-in-area">
            <el-button type="primary" round class="check-in-btn" @click="handleCheckIn" :disabled="isCheckedIn">
              {{ isCheckedIn ? '今日已签到' : '📅 每日签到 (+10积分)' }}
            </el-button>
          </div>
        </div>

        <div class="bento-card vip-card gradient-blue">
          <div class="card-header">
            <span class="icon">💎</span>
            <span class="title">会员权益</span>
          </div>
          <div class="vip-info">
            <div class="vip-row">
              <span class="label">当前版本</span>
              <span class="value">校园专业版 (Pro)</span>
            </div>
            <div class="vip-row">
              <span class="label">AI 算力点数</span>
              <span class="value highlight">8,540 点</span>
            </div>
            <div class="vip-row">
              <span class="label">到期时间</span>
              <span class="value">2099-12-31</span>
            </div>
          </div>
          <el-button class="upgrade-btn">立即续费</el-button>
        </div>

      </div>

      <div class="right-column">
        
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-num">128</div>
            <div class="stat-label">生成教案</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">45</div>
            <div class="stat-label">制作课件</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">~64h</div>
            <div class="stat-label">节省时间</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">12</div>
            <div class="stat-label">我的收藏</div>
          </div>
        </div>

        <div class="bento-card settings-card">
          <el-tabs v-model="activeTab" class="custom-tabs">
            
            <el-tab-pane label="基础资料" name="basic">
              <el-form :model="form" label-position="top" class="setting-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="昵称">
                      <el-input v-model="form.name" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="手机号">
                      <el-input v-model="form.phone" disabled placeholder="138****8888">
                        <template #append><el-button link>换绑</el-button></template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="任教学校">
                      <el-input v-model="form.school" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="执教学科">
                      <el-select v-model="form.subject" style="width: 100%">
                        <el-option label="语文" value="chinese" />
                        <el-option label="数学" value="math" />
                        <el-option label="英语" value="english" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                
                <el-form-item label="AI 生成偏好 (Teaching Style)">
                  <div class="style-tags">
                    <el-check-tag checked>严谨逻辑</el-check-tag>
                    <el-check-tag :checked="false">幽默风趣</el-check-tag>
                    <el-check-tag :checked="false">互动性强</el-check-tag>
                    <el-check-tag checked>新课标导向</el-check-tag>
                  </div>
                  <div class="form-tip">AI 将根据您的偏好生成更符合您风格的教案。</div>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" class="save-btn">保存修改</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="账号安全" name="security">
              <div class="security-list">
                <div class="security-item">
                  <div class="sec-icon">🔒</div>
                  <div class="sec-info">
                    <h4>登录密码</h4>
                    <p>建议定期修改密码以保护账号安全</p>
                  </div>
                  <el-button link type="primary">修改</el-button>
                </div>
                <div class="security-item">
                  <div class="sec-icon green">💬</div>
                  <div class="sec-info">
                    <h4>微信绑定</h4>
                    <p>已绑定：Andy_Teacher</p>
                  </div>
                  <el-button link type="danger">解绑</el-button>
                </div>
              </div>
            </el-tab-pane>

          </el-tabs>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';

const activeTab = ref('basic');
const isCheckedIn = ref(false);

const userInfo = reactive({
  name: '张云远',
  school: '深圳市第一中学',
  subject: '初中数学',
  teachingYears: 8,
  isVip: true
});

const form = reactive({
  name: '张云远',
  phone: '138****0000',
  school: '深圳市第一中学',
  subject: 'math'
});

const handleCheckIn = () => {
  isCheckedIn.value = true;
  ElMessage.success('签到成功！积分 +10');
};
</script>

<style scoped>
/* 容器 */
.profile-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 40px;
  /* 确保背景透明，透出全局放射性渐变 */
  background: transparent; 
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 24px;
}
.page-header h2 { margin: 0; font-size: 24px; color: #1e293b; }
.page-header p { margin: 4px 0 0; color: #64748b; font-size: 14px; }

/* 布局网格 */
.profile-layout {
  display: flex;
  gap: 24px;
}

.left-column {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 通用卡片样式 */
.bento-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255,255,255,0.6);
}

/* 左侧：个人信息卡 */
.profile-card {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar-wrapper { position: relative; margin-bottom: 12px; }
.vip-badge {
  position: absolute;
  bottom: 0; right: 0;
  background: #f59e0b;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
  border: 2px solid #fff;
}
.user-name { margin: 0; font-size: 20px; color: #1e293b; }
.user-role { margin: 4px 0 16px; color: #64748b; font-size: 14px; }

.tags-row { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
.tag {
  background: #f1f5f9;
  color: #475569;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.check-in-btn { width: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border: none; }

/* 左侧：VIP 卡 */
.vip-card {
  color: #1e3a8a;
  position: relative;
  overflow: hidden;
}
.gradient-blue { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
.card-header { display: flex; align-items: center; gap: 8px; font-weight: bold; margin-bottom: 16px; }
.vip-info { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.vip-row { display: flex; justify-content: space-between; font-size: 13px; }
.vip-row .value { font-weight: 600; }
.vip-row .highlight { color: #2563eb; }
.upgrade-btn {
  width: 100%;
  border-radius: 12px;
  background: #1e3a8a;
  color: white;
  border: none;
}
.upgrade-btn:hover { background: #1e40af; }

/* 右侧：统计胶囊 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.stat-item {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.02);
  transition: transform 0.2s;
  cursor: default;
}
.stat-item:hover { transform: translateY(-3px); }
.stat-num { font-size: 24px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
.stat-label { font-size: 12px; color: #94a3b8; }

/* 右侧：设置面板 */
.settings-card {
  flex: 1; /* 填满剩余高度 */
}
.setting-form { max-width: 600px; }
.style-tags { display: flex; gap: 10px; margin-top: 8px; }
.form-tip { font-size: 12px; color: #94a3b8; margin-top: 8px; }
.save-btn { padding: 10px 30px; border-radius: 8px; }

/* 安全列表 */
.security-list { display: flex; flex-direction: column; gap: 16px; }
.security-item {
  display: flex; align-items: center; padding: 16px;
  border: 1px solid #f1f5f9; border-radius: 12px;
}
.sec-icon {
  width: 40px; height: 40px; background: #eff6ff; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 20px;
}
.sec-icon.green { background: #f0fdf4; color: #16a34a; }
.sec-info h4 { margin: 0 0 4px; font-size: 15px; color: #1e293b; }
.sec-info p { margin: 0; font-size: 13px; color: #94a3b8; }
.security-item .el-button { margin-left: auto; }

/* 移动端适配 */
@media (max-width: 768px) {
  .profile-layout { flex-direction: column; }
  .left-column { width: 100%; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>