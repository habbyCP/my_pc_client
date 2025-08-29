import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/plugins'
  },
  {
    path: '/plugins',
    name: 'Plugins',
    // Lazy load the component
    component: () => import('./views/Plugins.vue')
  },
  {
    path: '/downloads',
    name: 'Downloads',
    component: () => import('./views/Downloads.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./views/Settings.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
