import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/styles/index.css'
import './assets/titlebar.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 将Electron API添加到Vue全局属性中，使其在所有组件中可用
if (window.electronAPI) {
  app.config.globalProperties.$electronAPI = window.electronAPI
  // 也可以通过provide/inject使用
  app.provide('electronAPI', window.electronAPI)
  console.log('Electron API 已加载')
} else {
  console.log('未检测到Electron环境，将使用模拟数据')
}

app.use(ElementPlus)
app.mount('#app')
