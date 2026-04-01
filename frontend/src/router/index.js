import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login',               component: () => import('@/views/LoginView.vue') },
  { path: '/dashboard',           component: () => import('@/views/DashboardView.vue'),     meta: { requiresAuth: true } },
  { path: '/form-builder/:id',    component: () => import('@/views/FormBuilderView.vue'),   meta: { requiresAuth: true } },
  { path: '/session/:id',         component: () => import('@/views/SessionView.vue'),       meta: { requiresAuth: true } },
  { path: '/session/:id/results', component: () => import('@/views/ResultsView.vue'),       meta: { requiresAuth: true } },
  { path: '/respond/:joinCode',   component: () => import('@/views/RespondView.vue') },
  { path: '/admin',               component: () => import('@/views/AdminView.vue'),         meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/',                    redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return next('/login')
  if (to.meta.requiresAdmin && !auth.isAdmin) return next('/dashboard')
  next()
})

export default router
