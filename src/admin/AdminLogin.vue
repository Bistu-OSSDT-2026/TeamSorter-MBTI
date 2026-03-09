<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>后台登录</h2>
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="form.password" />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="handleLogin" style="width:100%">登录</el-button>
      <!-- <el-button type="primary" @click="showAdminRegister = true" style="width:40%">注册</el-button> -->
    </el-card>
  </div>

  <!-- 注册对话框
    <el-dialog title="用户注册" v-model="showAdminRegister" width="400px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="registerForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="registerForm.email" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input type="password" v-model="registerForm.password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAdminRegister = false">取消</el-button>
        <el-button type="success" @click="showRegister">注册</el-button>
      </template>
    </el-dialog> -->
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { ElMessage } from "element-plus";

// ======== 前端调用后端 API ======== //
// const API_BASE = "http://localhost:5000/api"// 注意端口和后端一致

const router = useRouter();
const form = ref({ username: "", password: "", role : "admin" });

// 注册表单
// const registerForm = ref({ username: "", email: "", password: "", role: "admin" });
// 注册对话框显示状态
// const showAdminRegister = ref(false)

//登录
const handleLogin = async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/login", form.value);
    const token = res.data.token;
    if (res.data.role == "user") {
      ElMessage.error("无权限访问");
      return;
    }
    sessionStorage.setItem("adminToken", token);
    sessionStorage.setItem("adminUsername", res.data.username);
    sessionStorage.setItem("role", res.data.role);
    sessionStorage.setItem("userId", res.data.id);
    ElMessage.success("登录成功");
    // 使用 router.push 跳转到 /admin/dashboard
    router.push('/admin/dashboard').then(() => {
      // 等待路由跳转完成后，使用 window.location 重新加载页面
      window.location.reload();
    });
  } catch (err) {
    ElMessage.error(err.response?.data?.error || "登录失败");
  }
};

// // 注册处理
// const showRegister = async () => {
//   try {
//     const res = await fetch(`${API_BASE}/register`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(registerForm.value)
//     })
//     const data = await res.json()
//     if (res.ok) {
//       ElMessage.success("注册成功，可以登录了！")
//       showRegister.value = false
//       console.log("注册成功:", data)
//     } else {
//       console.warn("注册失败:", data)
//       ElMessage.error(data.error || "注册失败")
//     }
//   } catch (err) {
//     console.error(err)
//     ElMessage.error("注册接口调用失败")
//   }
// }
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f0f2f5;
}
.login-card {
  width: 360px;
  padding: 30px;
  text-align: center;
}
</style>
