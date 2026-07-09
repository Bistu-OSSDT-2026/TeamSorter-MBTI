import { createRouter, createWebHistory } from 'vue-router'
import MbtiPage from '../views/MbtiPage.vue'
import MbtiTest from '../views/MbtiTest.vue'
import WcpaTest from '../views/WcpaTest.vue'

const routes = [
  { path: '/', redirect: '/mbti' },
  { path: '/mbti', component: MbtiPage },
  { path: '/test', component: MbtiTest },
  { path: '/wcpa-test', component: WcpaTest }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
