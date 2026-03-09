<template>
  <div>
    <!-- 登录页单独显示 -->
    <template v-if="!isadminLoggedIn">
      <router-view :key="$route.fullPath" />
    </template>

    <!-- 管理后台布局 -->
    <div v-else class="admin-layout">
      <!-- 页头 -->
      <header class="admin-header">
        <div class="left">
          <span class="project-name">后台管理系统</span>
        </div>
        <div class="right">
          <span class="username">欢迎，{{ username }}</span>
          <el-button type="primary" size="small" @click="showAdminRegister = true">添加管理员</el-button>
          <el-button type="primary" size="small" @click="openChangePwd">修改密码</el-button>
          <el-button type="danger" size="small" @click="logout">退出</el-button>
        </div>
      </header>

      <!-- 侧边栏 + 主体 -->
      <div class="admin-body">
        <aside class="admin-sidebar">
          <ul>
            <li :class="{ active: isActive('/admin/dashboard') }" @click="goTo('/admin/dashboard')">仪表盘</li>
          <li :class="{ active: isActive('/admin/apps-categories') }" @click="goTo('/admin/apps-categories')">应用分类管理</li>
          <li :class="{ active: isActive('/admin/apps-create') }" @click="goTo('/admin/apps-create')">应用创建</li>
          <li :class="{ active: isActive('/admin/apps-list') }" @click="goTo('/admin/apps-list')">应用列表</li>
          <li :class="{ active: isActive('/admin/users') }" @click="goTo('/admin/users')">用户管理</li>
          <li :class="{ active: isActive('/admin/settings') }" @click="goTo('/admin/settings')">系统设置</li>
          </ul>
        </aside>

        <main class="admin-main">
          <router-view :key="$route.path"></router-view>
        </main>
      </div>

      <!-- 注册对话框 -->
      <el-dialog title="用户注册" v-model="showAdminRegister" width="400px">
        <el-form label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="registerForm.username" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="registerForm.email" />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="registerForm.role" placeholder="请选择角色">
              <el-option
                v-for="item in availableRoles"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="密码">
            <el-input type="password" v-model="registerForm.password" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAdminRegister = false">取消</el-button>
          <el-button type="success" @click="showRegister">注册</el-button>
        </template>
      </el-dialog>

      <!-- 修改密码弹窗 -->
      <el-dialog title="修改密码" v-model="showChangePwd" width="400px">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-form-item label="原密码" prop="oldPwd">
            <el-input v-model="form.oldPwd" type="password" show-password />
          </el-form-item>
          <el-form-item label="新密码" prop="newPwd">
            <el-input v-model="form.newPwd" type="password" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPwd">
            <el-input v-model="form.confirmPwd" type="password" show-password />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showChangePwd = false">取消</el-button>
          <el-button type="primary" @click="submitChangePwd">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import axios from "axios";

// ======== 前端调用后端 API ======== //
const API_BASE = "http://localhost:5000/api"// 注意端口和后端一致

const router = useRouter();
const route = useRoute();

const username = ref(sessionStorage.getItem("adminUsername") || "Admin");
const isadminLoggedIn = ref(!!sessionStorage.getItem("adminToken"));
const role = ref(sessionStorage.getItem('role') || '')   // 登录时存一下

// 修改密码弹窗
const showChangePwd = ref(false);
const form = ref({ oldPwd: "", newPwd: "", confirmPwd: "" });
const formRef = ref(null);

// 注册表单
const registerForm = ref({ username: "", email: "", password: "", role: "" });
// 注册对话框显示状态
const showAdminRegister = ref(false)

/* 角色枚举：前台汉字 ↔ 后台英文 */
const ROLE_OPTS = [
  { label: '管理员', value: 'admin' },
  { label: '运营员', value: 'operator' },
  { label: '普通用户', value: 'user' }
]

/* 根据权限给出可选角色 */
const availableRoles = computed(() => {
  // 超级管理员可以创建任何角色
  if (role.value === 'admin' && username.value == 'admin') return ROLE_OPTS

  // 普通运营员只能创建比自己低的角色
  if (role.value === 'operator') return ROLE_OPTS.filter(r => r.value !== 'admin')

  // 普通用户无权创建账号（这里其实不应该让他进对话框）
  return []
})

// 校验规则
const rules = {
  oldPwd: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPwd: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPwd: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (value !== form.value.newPwd) callback(new Error("两次密码不一致"));
        else callback();
      },
      trigger: "blur",
    },
  ],
};

// 打开修改密码弹窗
const openChangePwd = () => {
  form.value = { oldPwd: "", newPwd: "", confirmPwd: "" };
  showChangePwd.value = true;
};

// 提交修改密码
const submitChangePwd = async () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      await axios.post("http://localhost:5000/api/change-password", {
        username: username.value,
        oldPassword: form.value.oldPwd,
        newPassword: form.value.newPwd,
      });
      ElMessage.success("密码修改成功，请重新登录");
      logout();
    } catch (err) {
      ElMessage.error(err.response?.data?.error || "修改失败");
    }
  });
};

// 注册处理
const showRegister = async () => {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerForm.value)
    })
    const data = await res.json()
    if (res.ok) {
      ElMessage.success("注册成功，可以登录了！")
      showRegister.value = false
      console.log("注册成功:", data)
    } else {
      console.warn("注册失败:", data)
      ElMessage.error(data.error || "注册失败")
    }
  } catch (err) {
    console.error(err)
    ElMessage.error("注册接口调用失败")
  }
}

// 登出
const logout = () => {
  sessionStorage.removeItem("adminToken");
  sessionStorage.removeItem("adminUsername");
  sessionStorage.removeItem("role");
  isadminLoggedIn.value = false;
  router.push("/admin/login");
};

// 路由跳转
const goTo = (path) => router.push(path);

// 判断当前路由是否高亮
const isActive = (path) => route.path === path;
</script>

<style scoped>
.admin-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 20px;
  background: #409eff;
  color: white;
}
.admin-header .project-name {
  font-weight: bold;
  font-size: 18px;
}
.admin-header .right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.admin-body {
  display: flex;
  flex: 1;
}
.admin-sidebar {
  width: 200px;
  background: #2c3e50;
  color: #ecf0f1;
}
.admin-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.admin-sidebar li {
  padding: 15px;
  cursor: pointer;
}
.admin-sidebar li:hover {
  background: #34495e;
}
.admin-sidebar li.active {
  background: #1abc9c;
}
.admin-main {
  flex: 1;
  padding: 20px;
  background: #f5f6f7;
  overflow-y: auto;
}
</style>