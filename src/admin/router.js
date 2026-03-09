import { createRouter, createWebHistory } from "vue-router";
import AdminApp from "./AdminApp.vue";
import AdminLogin from "./AdminLogin.vue";
import Dashboard from "../admin/views/AdminDashboard.vue";
import Users from "../admin/views/AdminUsers.vue";
import Settings from "../admin/views/AdminSettings.vue";
import AppsCategories from "../admin/views/AppsCategories.vue";
import AppsCreate from "../admin/views/AppsCreate.vue";
import AppsList from "../admin/views/AppsList.vue";
import PageBuilder from "./views/PageBuilder.vue";
import AssistantPage from "@/views/AssistantPage.vue";
// import App from "../App.vue";

const routes = [
  { path: "/workbench", component: AssistantPage },
  { path: "/admin/login", component: AdminLogin },
  // { path: "/admin", component: AdminApp },
  { path: "/admin/dashboard", component: Dashboard },
  { path: "/admin/users", component: Users },
  { path: "/admin/settings", component: Settings },
  { path: "/admin/apps-categories", component: AppsCategories },
  { path: "/admin/apps-create", component: AppsCreate },
  { path: "/admin/apps-list", component: AppsList },
  { path: "/admin/pagebuilder", component: PageBuilder },
  {
    path: "/admin",
    component: AdminApp,
    children: [
      { path: "dashboard", component: Dashboard },
      { path: "users", component: Users },
      { path: "settings", component: Settings },
      { path: "apps-categories", component: AppsCategories },
      { path: "apps-create", component: AppsCreate },
      { path: "apps-list", component: AppsList },
      { path: "pagebuilder", component: PageBuilder },
      { path: "", redirect: '/admin/dashboard' }
    ]
  },
  // { path: "/", redirect: "/admin/dashboard" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 登录保护（仅后台管理页面）
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('adminToken')
  if (to.path.startsWith('/admin') && to.path !== '/admin/login' && !token) {
    next('/admin/login')
  } else {
    // alert(from.path + ' -> ' + to.path)
    next()
  }
})

export default router;