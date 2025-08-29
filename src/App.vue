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
      <div class="sidebar" v-if="activeTab === '插件库'">
        <div class="category-list">
          <div class="category-item" 
               v-for="category in categories" 
               :key="category.id"
               :class="{ active: activeCategory === category.name }"
               @click="switchCategory(category)">
            <!-- If icon path starts with '/', it's a local icon -->
            <img v-if="category.icon.length > 0" :src="category.icon" class="category-icon" alt="category icon" />
            <!-- Otherwise use Element Plus icon -->
            
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
        
        <div v-if="activeTab === '文件下载'" class="tab-content">
          <client-list 
            ref="clientList"
            @load-clients="handleLoadClients"
          />
        </div>

        <div v-if="activeTab === '游戏补丁'" class="tab-content">
 
          <client-patcher :client="activeClient" />
        </div>
        
        <div v-if="activeTab === '设置'" class="tab-content"> 
          <settings 
            @save-settings="handleSaveSettings"
          />
        </div>
      </div>

      <!-- 加载中遮罩（仅覆盖 content-container） -->
      <div class="loading-mask" v-if="main_loading">
        <div class="loading-content">
          <el-icon v-if="download_progress < 100" class="loading-icon"><Loading /></el-icon>
          <span>{{ main_loading_word }}</span>
          <div v-if="download_progress > 0" class="progress-bar-container">
            <div class="progress-bar" :style="{ width: download_progress + '%' }"></div>
            <span class="progress-text">{{ download_progress }}%</span>
          </div>
 
        </div>
      </div>
    </div>

 
  </div>
</template>

<script>
import AddonsList from './table_list.js'
import { Search, Download, Files, Calendar, Loading } from '@element-plus/icons-vue'
import PluginLibrary from './components/PluginLibrary.vue'
import Settings from './components/Settings.vue'
import ClientList from './components/ClientList.vue'
import ClientPatcher from './components/ClientPatcher.vue'
import { checkForUpdatesAndPrompt } from './utils/updateHelper.js'

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
    ClientList,
    ClientPatcher
  },
  data() {
    return {
      tabs: ['插件库', '文件下载',  '设置'],
      activeClient: { path: '' }, // 初始化为空对象以避免渲染问题
      isDark: true, // 默认使用暗色主题
      tableData: [],
      sortBy: 'download',
      main_loading: false,
      main_loading_word: '',
      download_progress: 0,
      downloadedInstallerPath: '', // New property to store the path
      category: 0
    }
  },
  async mounted() {
    // 应用启动时检查一次更新，并由前端弹窗处理结果
    if (window.electronAPI) {
      await this.checkForUpdatesAtStartup()
    }
    // 等待一小段时间确保设置已加载，然后初始化插件列表
    setTimeout(async () => {
      await this.get_categories()
      await this.get_addons_list();
    }, 100);

    // 监听应用更新事件
    window.addEventListener('app-update-start', () => {
      this.main_loading = true;
      this.main_loading_word = '正在下载更新...';
      this.download_progress = 0;
    });

    window.addEventListener('app-update-progress', (e) => {
      this.download_progress = parseFloat(e.detail.percent);
    });

    window.addEventListener('app-update-end', (e) => {
      const { status, message } = e.detail;
      if (status === 'completed') {
        this.main_loading_word = '下载完成！安装程序已启动';
        this.download_progress = 100;
        this.downloadedInstallerPath = e.detail.path; // Store the path
        // The loading mask will show a "确认" button for the user to dismiss.
      } else {
        // On error, hide the mask and log the error.
        this.main_loading = false;
        console.error("Update download failed:", message);
        // You could use ElMessage here if you import it.
        // For now, we just log the error and hide the loading screen.
      }
    });
  },
  methods: {
    async checkForUpdatesAtStartup() {
      try {
        await checkForUpdatesAndPrompt({ silenceNoUpdate: true, showError: true })
      } catch (e) {
        // 静默失败，避免启动打扰；如需提示可打印日志
        console.error('启动检查更新失败:', e)
      }
    },
    async loadActiveClient() {
      if (window.electronAPI) {
        try {
          const settings = await window.electronAPI.getSettings();
          if (settings && settings.gamePath) {
            this.activeClient = { path: settings.gamePath };
          } else {
            this.activeClient = { path: '' }; // 确保 activeClient 不为 null
          }
        } catch (error) {
          console.error('加载游戏路径设置失败:', error);
          this.activeClient = { path: '' };
        }
      }
    },
    handleSaveSettings(settings) {
      console.log('Settings saved:', settings);
      // 当设置被保存后，重新加载客户端路径
      this.loadActiveClient();
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
    reopenInstaller() {
      if (this.downloadedInstallerPath && window.electronAPI && typeof window.electronAPI.openLocalPath === 'function') {
        window.electronAPI.openLocalPath({ path: this.downloadedInstallerPath });
        this.main_loading = false; // Close the dialog after attempting to open
      } else {
        console.error('无法重新打开安装程序：路径缺失或API不可用');
        this.main_loading = false; // Close the dialog anyway if it can't reopen
      }
    },
    
  }
}
</script>

<style>
@import './assets/styles/index.css';

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
