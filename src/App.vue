<template>
  <div class="app-container" :class="{ 'dark-theme': isDark }">
    <!-- 顶部标签栏 -->
    <div class="header">
      <div class="logo">
        <img src="./assets/logo.png" alt="logo" class="app-logo" />
      </div>
      <div class="header-tabs">
        <router-link v-for="tab in tabs" :key="tab.name" :to="tab.path" class="tab" active-class="active">
          {{ tab.name }}
        </router-link>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="medium" class="start-button" @click="store.start_wow">启动游戏</el-button>
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="content-container">
      <!-- 路由视图将在这里渲染当前页面 -->
      <router-view />

      <!-- 全局加载遮罩 -->
      <div class="loading-mask" v-if="store.main_loading">
        <div class="loading-content">
          <el-icon v-if="store.download_progress < 100" class="loading-icon"><Loading /></el-icon>
          <span>{{ store.main_loading_word }}</span>
          <div v-if="store.download_progress > 0" class="progress-bar-container">
            <div class="progress-bar" :style="{ width: store.download_progress + '%' }"></div>
            <span class="progress-text">{{ store.download_progress }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAppStore } from './store.js'
import { checkForUpdatesAndPrompt } from './utils/updateHelper.js'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: { Loading },
  setup() {
    const store = useAppStore()
    const isDark = ref(true) // 默认使用暗色主题
    
    // 顶部 Logo 图片
    const logoImg = new URL('./assets/logo.png', import.meta.url).href

    const tabs = ref([
      { name: '插件库', path: '/plugins' },
      { name: '资源下载', path: '/downloads' },
      // { name: '本地插件', path: '/local-plugins' },
      { name: '设置', path: '/settings' },
    ])

    onMounted(async () => {
      // 初始化 store，包括API服务和事件监听
      await store.initialize()
      
      // 应用启动时检查一次更新
      if (window.electronAPI) {
        try {
          checkForUpdatesAndPrompt({ silenceNoUpdate: true, showError: true })
        } catch (e) {
          console.error('启动检查更新失败:', e)
        }
      }

      // 初始化插件分类和列表
      await store.get_categories()
      await store.get_addons_list()
    })

    return {
      tabs,
      isDark,
      store, // 将 store 暴露给模板
      logoImg,
    }
  },
}
</script>

<style>
@import './assets/styles/index.css';

.header-tabs .tab {
  text-decoration: none;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 16px;
}

.app-logo {
  height: 48px;
  width: auto;
  display: block;
}

.content-container {
  position: relative;
}

.loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-size: 18px;
}

.loading-icon {
  font-size: 40px;
  margin-bottom: 10px;
  animation: rotate 1.5s linear infinite;
}

.progress-bar-container {
  width: 300px;
  height: 20px;
  background-color: #444;
  border-radius: 10px;
  margin-top: 15px;
  position: relative;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #67c23a;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: bold;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>