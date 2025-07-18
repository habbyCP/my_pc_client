<template>
  <div class="app-container" :class="{ 'dark-theme': isDark }">
    <!-- 顶部标签栏 -->
    <div class="header">
      <div class="logo"> 
        <span>龟龟助手</span>
      </div>
      <div class="header-tabs">
        <div class="tab" v-for="tab in tabs" :key="tab" 
             :class="{ active: activeTab === tab }" 
             @click="switchTab(tab)">
          {{ tab }}
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="medium" class="start-button" @click="start_wow">启动游戏</el-button>
        <!-- <el-switch
          v-model="isDark"
          inline-prompt
          active-text="暗"
          inactive-text="亮"
          style="margin-left: 10px;"
        /> -->
      </div>
    </div>

    <!-- 主体内容区域 -->
    <div class="content-container">
      <!-- 左侧边栏 - 只在插件库标签页显示 -->
      <div class="sidebar" v-if="activeTab === '插件库'">
        <div class="category-list">
          <div class="category-item" 
               v-for="category in categories" 
               :key="category.id"
               :class="{ active: activeCategory === category.name }"
               @click="switchCategory(category.id, category.name)">
            <!-- If icon path starts with '/', it's a local icon -->
            <img v-if="category.icon.startsWith('/')" :src="category.icon" class="category-icon" alt="category icon" />
            <!-- Otherwise use Element Plus icon -->
            <el-icon v-else>
              <component :is="category.icon" />
            </el-icon>
            <span>{{ category.name }}</span>
          </div>
        </div>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content" :class="{ 'full-width': activeTab !== '插件库' }">
        <!-- 插件列表 -->
        <div v-if="activeTab === '插件库'" class="tab-content">

          <plugin-library 
            :table-data="tableData" 
            :sort-by="sortBy"
            @get-addons-list="get_addons_list"
            @down-addons="down_addons"
            @open-link="open_link"
            @show-detail="show_detail"
          />
        </div>
        
        <!-- 其他标签页内容 -->
        <div v-if="activeTab === '天赋'" class="tab-content">
          <h2>天赋模拟器</h2>
          <p>此功能正在开发中...</p>
        </div>
        
        <div v-if="activeTab === '本地插件'" class="tab-content">
          <h2>本地插件管理</h2>
          <p>此功能正在开发中...</p>
        </div> 
        
        <div v-if="activeTab === '配置分享'" class="tab-content">
          <h2>配置分享</h2>
          <p>此功能正在开发中...</p>
        </div>
        
        <div v-if="activeTab === '客户端'" class="tab-content">
          <client-list 
            ref="clientList"
            @load-clients="handleLoadClients"
          />
        </div>
        
        <div v-if="activeTab === '设置'" class="tab-content">
          <h2>设置</h2>
          <settings 
            @save-settings="handleSaveSettings"
          />
        </div>
      </div>
    </div>

    <!-- 加载中遮罩 -->
    <div class="loading-mask" v-if="main_loading">
      <div class="loading-content">
        <el-icon v-if="download_progress < 100" class="loading-icon"><Loading /></el-icon>
        <span>{{ main_loading_word }}</span>
        <div v-if="download_progress > 0" class="progress-bar-container">
          <div class="progress-bar" :style="{ width: download_progress + '%' }"></div>
          <span class="progress-text">{{ download_progress }}%</span>
        </div>
        <el-button 
          v-if="download_progress >= 100" 
          type="success" 
          class="confirm-button" 
          @click="main_loading = false"
        >
          确认
        </el-button>
      </div>
    </div>

 
  </div>
</template>

<script>
import AddonsList from './table_list.js'
import WowAddons from './wow_addons.js'
import { Search, Download, Files, Calendar, Loading } from '@element-plus/icons-vue'
import PluginLibrary from './components/PluginLibrary.vue'
import Settings from './components/Settings.vue'
import ClientList from './components/ClientList.vue'

export default {
  name: 'App',
  mixins: [AddonsList],
  components: {
    Search,
    Download,
    Files,
    Calendar,
    Loading,
    PluginLibrary,
    Settings,
    ClientList
  },
  data() {
    return {
      tabs: [  '插件库',  '客户端', '设置'],

      isDark: true, // 默认使用暗色主题
      tableData: [],
      sortBy: 'download',
      main_loading: false,
      main_loading_word: '',
      download_progress: 0,
      category: 0
    }
  },
  async mounted() {
    // 等待一小段时间确保设置已加载，然后初始化插件列表
    setTimeout(async () => {
      await this.get_categories()
      await this.get_addons_list();
    }, 100);
  },
  methods: {
    handleSaveSettings(settings) {
      console.log('Settings saved:', settings);
      // 这里可以处理设置保存后的逻辑
    },
    async handleLoadClients() {
      try {
        const clients = await this.get_clients_list()
        if (this.$refs.clientList) {
          this.$refs.clientList.updateClients(clients)
        }
      } catch (error) {
        console.error('加载客户端列表失败:', error)
      }
    },
    down_addons(addon) {
      WowAddons.down_addons(addon, this);
    }
  }
}
</script>

<style>
@import './assets/styles/index.css';

.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
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

.confirm-button {
  margin-top: 20px;
  min-width: 100px;
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
