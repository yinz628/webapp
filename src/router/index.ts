import { createRouter, createWebHistory } from 'vue-router'
import { useLearningStore } from '@/stores/learning'
import UserLogin from '../views/UserLogin.vue'
import Home from '../views/Home.vue'
import Learning from '../views/Learning.vue'
import Review from '../views/Review.vue'
import Statistics from '../views/Statistics.vue'
import HanziDetail from '../views/HanziDetail.vue'
import Settings from '../views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'UserLogin',
      component: UserLogin,
      meta: { title: '用户登录', requiresGuest: true }
    },
    {
      path: '/',
      name: 'Home',
      component: Home,
      meta: { title: '首页', requiresAuth: true }
    },
    {
      path: '/learning',
      name: 'Learning',
      component: Learning,
      meta: { title: '开始学习', requiresAuth: true }
    },
    {
      path: '/review',
      name: 'Review',
      component: Review,
      meta: { title: '开始复习', requiresAuth: true }
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: Statistics,
      meta: { title: '学习统计', requiresAuth: true }
    },
    {
      path: '/hanzi-detail',
      name: 'HanziDetail',
      component: HanziDetail,
      meta: { title: '汉字详情', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings,
      meta: { title: '设置', requiresAuth: true }
    }
  ]
})

// 全局导航守卫，设置页面标题和用户认证
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  if (to.meta && to.meta.title) {
    document.title = `${to.meta.title} - 汉字学习工具`
  }

  // 获取学习store
  const learningStore = useLearningStore()
  const isAuthenticated = !!learningStore.currentUser

  // 检查认证要求
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 需要认证但未登录，重定向到登录页
    next('/login')
  } else if (to.meta.requiresGuest && isAuthenticated) {
    // 需要游客状态但已登录，重定向到首页
    next('/')
  } else {
    next()
  }
})

export default router 