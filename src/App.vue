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
        <el-button size="medium" @click="openUrl('https://cn.turtle-wow.org/')">乌龟官网</el-button>
        <el-button size="medium" @click="openUrl('https://www.kookapp.cn/app/invite/jzgWqY')">乌龟Kook</el-button>
        <el-button type="primary" size="medium" class="start-button" @click="openUrl('https://kook.vip/tIsMSv')">龟龟助手KOOK</el-button>
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

      <!-- 应用更新全局遮罩（与插件下载分离的更新进度显示） -->
      <div class="loading-mask" v-if="appUpdateVisible">
        <div class="loading-content">
          <el-icon v-if="appUpdatePercent < 100" class="loading-icon"><Loading /></el-icon>
          <span>{{ appUpdateMsg }}</span>
          <div v-if="appUpdatePercent >= 0" class="progress-bar-container">
            <div class="progress-bar" :style="{ width: appUpdatePercent + '%' }"></div>
            <span class="progress-text">{{ appUpdatePercent.toFixed(2) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from './store.js'
import { checkForUpdatesAndPrompt } from './utils/updateHelper.js'
import { Loading } from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: { Loading },
  setup() {
    const store = useAppStore()
    const isDark = ref(true) // 默认使用暗色主题
    // 应用更新下载的全局状态
    const appUpdateVisible = ref(false)
    const appUpdatePercent = ref(0)
    const appUpdateMsg = ref('应用更新下载中...')
    
    // 顶部 Logo 图片
    const logoImg = new URL('./assets/logo.png', import.meta.url).href

    const tabs = ref([
      { name: '本地插件', path: '/local-plugins' },
      { name: '插件库', path: '/plugins' },
      { name: '资源下载', path: '/downloads' },
      { name: '设置', path: '/settings' },
    ])

    let onStart, onProgress, onEnd

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

      // 监听来自 updateHelper.js 转发的应用更新事件
      onStart = () => {
        appUpdateVisible.value = true
        appUpdatePercent.value = 0
        appUpdateMsg.value = '应用更新下载中...'
      }
      onProgress = (e) => {
        const p = Number(e?.detail?.percent ?? 0)
        if (!Number.isNaN(p)) {
          appUpdatePercent.value = Math.max(0, Math.min(100, p))
        }
      }
      onEnd = (e) => {
        const { status, message } = e?.detail || {}
        if (status === 'completed') {
          appUpdateMsg.value = '更新包下载完成，正在打开安装程序...'
          appUpdatePercent.value = 100
        } else if (status === 'error') {
          appUpdateMsg.value = message || '更新下载失败'
        }
        // 稍作延迟让用户看到状态
        setTimeout(() => {
          appUpdateVisible.value = false
        }, 1200)
      }

      window.addEventListener('app-update-start', onStart)
      window.addEventListener('app-update-progress', onProgress)
      window.addEventListener('app-update-end', onEnd)
    })

    onBeforeUnmount(() => {
      if (onStart) window.removeEventListener('app-update-start', onStart)
      if (onProgress) window.removeEventListener('app-update-progress', onProgress)
      if (onEnd) window.removeEventListener('app-update-end', onEnd)
    })

    const openUrl = (url) => {
      try {
        if (window?.electronAPI?.openLink) {
          window.electronAPI.openLink(url)
        } else {
          console.error('electronAPI.openLink 不可用：请确保在 preload 中通过 contextBridge 暴露 openLink，并在主进程使用 shell.openExternal 处理。')
        }
      } catch (e) {
        console.error('打开外部链接失败:', e)
      }
    }

    return {
      tabs,
      isDark,
      store, // 将 store 暴露给模板
      logoImg,
      openUrl,
      appUpdateVisible,
      appUpdatePercent,
      appUpdateMsg,
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.contact-button {
  font-weight: 700;
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