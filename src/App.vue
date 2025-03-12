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
          <h2>客户端</h2>
          <p>此功能正在开发中...</p>
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
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>{{ main_loading_word }}</span>
      </div>
    </div>

    <!-- 插件详情弹窗 -->
    <el-dialog
      v-model="detail_dialog"
      :title="detail_title"
      width="70%"
      center
    >
      <div v-html="detail_text"></div>
    </el-dialog>
  </div>
</template>

<script>
import AddonsList from './table_list.js'
import { Search, Download, Files, Calendar, Loading } from '@element-plus/icons-vue'
import PluginLibrary from './components/PluginLibrary.vue'
import Settings from './components/Settings.vue'

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
    Settings
  },
  data() {
    return {
      tabs: [ '本地插件', '插件库', '配置分享', '客户端', '设置'],

      isDark: true, // 默认使用暗色主题
      tableData: [],
      sortBy: 'download'
    }
  },
  async mounted() {
    // 初始化时加载插件列表
    await this.get_addons_list(); 
    console.log("data is ", data[0]["pic_list"])
    // this.tableData = data;
  },
  methods: {
    handleSaveSettings(settings) {
      console.log('Settings saved:', settings);
      // 这里可以处理设置保存后的逻辑
    }
  }
}
</script>

<style>
@import './assets/styles/index.css';
</style>
