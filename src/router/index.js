import { createRouter, createWebHistory } from 'vue-router'

// 原有前端页面
import AssistantPage from '../views/AssistantPage.vue'
import AppsPage from '../views/AppsPage.vue'
import SkillStudio from '../views/SkillStudio.vue' // Updated
import SkillEditor from '../views/SkillEditor.vue'
import ScenarioCreate from '../views/ScenarioCreate.vue' // Added
import WorkbenchPage from '../views/WorkbenchPage.vue'
import HomePage from '../views/HomePage.vue'
import AboutPage from '../views/AboutPage.vue'

// 后台管理页面
import AdminLogin from '../admin/AdminLogin.vue'
import AdminApp from '../admin/AdminApp.vue'
import AdminDashboard from '../admin/views/AdminDashboard.vue'
import AdminUsers from '../admin/views/AdminUsers.vue'
import AdminSettings from '../admin/views/AdminSettings.vue'
import EssayScoring from '../views/EssayScoring.vue' // 假设你放在 views 目录下
import DecibelMeter from '../views/DecibelMeter.vue'
import TextToImage from '../views/TextToImage.vue'
import ImageEditor from '../views/ImageEditor.vue'
import PptGenerator from '../views/PptGenerator.vue'
import ExamGenerator from '../views/ExamGenerator.vue'
import LessonPlan from '../views/LessonPlan.vue'
import StudentPortfolio from '../views/StudentPortfolio.vue'
import ClassroomApps from '../views/ClassroomApps.vue'
import HomeworkCorrection from '../views/HomeworkCorrection.vue'
import TestPanelest from '../views/TestPanel.vue';
const routes = [
  // 前端页面
  { path: '/', component: AssistantPage },
  { path: '/apps', component: AppsPage },
  { path: '/workbench', component: WorkbenchPage },
  { path: '/home', component: HomePage },
  { path: '/about', component: AboutPage },
  { path: '/image-gen', component: TextToImage },
  { path: '/image-edit', component: ImageEditor },
  { path: '/essay', name: 'EssayScoring', component: EssayScoring },
  { path: '/exam', component: ExamGenerator }, // ID: 3
  { path: '/ppt', component: PptGenerator },
  { path: '/lesson-plan', component: LessonPlan },
  { path: '/portfolio', component: StudentPortfolio }, // 新增
  {
    path: '/studio',
    name: 'SkillStudio',
    component: SkillStudio
  },
  {
    path: '/create-scenario',
    name: 'ScenarioCreate',
    component: ScenarioCreate
  },
  {
    path: '/skill-editor/:id?',
    name: 'SkillEditor',
    component: SkillEditor
  },
  {
    path: '/classroom', component: ClassroomApps
  }, // 新增路由
  { path: '/homework-correction', component: HomeworkCorrection },
  { path: '/test', component: TestPanelest },
  // 注册路由
  {
    path: '/decibel',
    name: 'DecibelMeter',
    component: DecibelMeter
  },
  // 后台登录页独立显示
  { path: '/admin/login', component: AdminLogin },

  // 后台管理布局
  {
    path: '/admin',
    component: AdminApp,
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: AdminUsers },
      { path: 'settings', component: AdminSettings },
      { path: '', redirect: '/admin/dashboard' }// 默认子路由

    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 登录保护（仅后台管理页面）
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('adminToken')
  if (to.path.startsWith('/admin') && to.path !== '/admin/login' && !token) {
    next('/admin/login')
  } else {
    next()
  }
})

export default router
