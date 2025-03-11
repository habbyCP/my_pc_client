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
        <el-button type="primary" class="start-button" @click="start_wow">启动游戏</el-button>
        <el-switch
          v-model="isDark"
          inline-prompt
          active-text="暗"
          inactive-text="亮"
          style="margin-left: 10px;"
        />
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
               @click="switchCategory(category.name)">
            <el-icon>
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
        
        <div v-if="activeTab === '管理'" class="tab-content">
          <h2>账号管理</h2>
          <p>此功能正在开发中...</p>
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

export default {
  name: 'App',
  mixins: [AddonsList],
  components: {
    Search,
    Download,
    Files,
    Calendar,
    Loading,
    PluginLibrary
  },
  data() {
    return {
      tabs: [ '本地插件', '插件库', '配置分享', '客户端', '管理'],

      isDark: true, // 默认使用暗色主题
      tableData: [
        {
          title: '插件1',
          text: '这是插件1的描述',
          pic_url: 'https://via.placeholder.com/300x150',
          download_count: 100,
          size: '10MB',
          update_time: '2022-01-01',
          installed: false,
          outLink: 'https://www.example.com'
        },
        {
          title: '插件2',
          text: '这是插件2的描述',
          pic_url: 'https://via.placeholder.com/300x150',
          download_count: 200,
          size: '20MB',
          update_time: '2022-01-02',
          installed: true,
          outLink: 'https://www.example.com'
        },
        {
          title: '插件3',
          text: '这是插件3的描述',
          pic_url: 'https://via.placeholder.com/300x150',
          download_count: 300,
          size: '30MB',
          update_time: '2022-01-03',
          installed: false,
          outLink: 'https://www.example.com'
        }
      ]
    }
  },
  mounted() {
    // 初始化时加载插件列表
    this.get_addons_list()
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #303133;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

/* 暗色主题 */
.dark-theme {
  background-color: #1e1e1e;
  color: #e0e0e0;
}

.dark-theme .header {
  background-color: #252525;
  border-bottom: 1px solid #333;
}

.dark-theme .sidebar {
  background-color: #252525;
  border-right: 1px solid #333;
}

.dark-theme .main-content {
  background-color: #1e1e1e;
}

.dark-theme .tab {
  color: #e0e0e0;
}

.dark-theme .tab.active {
  background-color: #333;
  color: #fff;
}

.dark-theme .tab:hover {
  background-color: #333;
}

.dark-theme .category-item {
  color: #e0e0e0;
}

.dark-theme .category-item:hover, .dark-theme .category-item.active {
  background-color: #333;
  color: #fff;
}

.dark-theme .plugin-card {
  background-color: #252525;
  border: 1px solid #333;
}

.dark-theme .plugin-title {
  color: #fff;
}

.dark-theme .plugin-description {
  color: #ccc;
}

.dark-theme .plugin-meta {
  color: #aaa;
}

.dark-theme .tab-content {
  background-color: #252525;
  color: #e0e0e0;
}

.dark-theme .el-dialog {
  background-color: #252525;
  color: #e0e0e0;
}

.dark-theme .el-dialog__title {
  color: #e0e0e0;
}

.dark-theme .el-button {
  border-color: #444;
}

/* 修复暗色主题下搜索框和搜索按钮的白边问题 */
.dark-theme .el-input__wrapper {
  background-color: #252525;
  box-shadow: 0 0 0 1px #444 inset;
}

.dark-theme .el-input__inner {
  color: #e0e0e0;
}

.dark-theme .el-input-group__append {
  background-color: #333;
  box-shadow: 0 0 0 1px #444 inset;
  border-left: none;
}

.dark-theme .el-input-group__append .el-button {
  border: none;
  background-color: transparent;
  color: #e0e0e0;
}

/* 修复排序下拉框在暗色主题下的背景问题 */
.dark-theme .el-select {
  --el-select-input-focus-border-color: #444;
}

.dark-theme .el-select .el-input__wrapper {
  background-color: #252525;
  box-shadow: 0 0 0 1px #444 inset !important;
}

.dark-theme .el-select .el-input.is-focus .el-input__wrapper {
  box-shadow: 0 0 0 1px #444 inset !important;
}

.dark-theme .el-select-dropdown__item {
  color: #000000;
}

.dark-theme .el-select-dropdown__item.hover, .dark-theme .el-select-dropdown__item:hover {
  background-color: #333;
}

.dark-theme .el-select-dropdown {
  background-color: #252525;
  border: 1px solid #444;
}

.dark-theme .el-popper__arrow::before {
  background-color: #252525;
  border: 1px solid #444;
}

/* 顶部标签栏 */
.header {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 30px;
}

.logo img {
  height: 40px;
  margin-right: 10px;
}

.logo span {
  font-size: 18px;
  font-weight: bold;
}

.header-tabs {
  display: flex;
  height: 100%;
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.header-actions .el-button {
  height: 36px;
  padding: 0 15px;
  font-weight: 500;
}

.dark-theme .header-actions .el-button--primary {
  background-color: #f57c00;
  border-color: #f57c00;
}

.dark-theme .header-actions .el-button--primary:hover {
  background-color: #ff9800;
  border-color: #ff9800;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  height: 100%;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
}

.tab:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.tab.active {
  color: #409EFF;
  border-bottom: 2px solid #409EFF;
}

.dark-theme .tab.active {
  color: #f57c00;
  border-bottom: 2px solid #f57c00;
}

/* 内容区域 */
.content-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 侧边栏 */
.sidebar {
  width: 220px;
  background-color: #fff;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.version-selector {
  padding: 15px;
  border-bottom: 1px solid #e6e6e6;
}

.version-selector .el-select {
  width: 100%;
  margin-bottom: 10px;
}

.version-selector .el-button {
  width: 100%;
}

.category-list {
  flex: 1;
  padding: 10px 0;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.category-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.dark-theme .category-item:hover {
  background-color: #333;
}

.category-item.active {
  background-color: #ecf5ff;
  color: #409EFF;
}

.dark-theme .category-item.active {
  background-color: rgba(245, 124, 0, 0.2);
  color: #f57c00;
}

.category-item .el-icon {
  margin-right: 10px;
  font-size: 18px;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

.main-content.full-width {
  width: 100%;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  margin-bottom: 20px;
  gap: 10px;
}

.search-bar .el-input {
  flex: 1;
}

/* 插件列表 */
.plugin-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.plugin-card {
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  margin-bottom: 5px;
}

.plugin-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.plugin-image {
  height: 150px;
  overflow: hidden;
}

.plugin-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plugin-info { 
  flex: 1;
}

.plugin-title {
  font-size: 16px;
  font-weight: bold; 
}

.plugin-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px; 
  overflow: hidden;
}

.dark-theme .plugin-description {
  color: #aaa;
}

.plugin-meta {
  display: flex;
  justify-content: space-between;
  color: #909399;
  font-size: 12px;
}

.dark-theme .plugin-meta {
  color: #888;
}

.plugin-meta span {
  display: flex;
  align-items: center;
}

.plugin-meta .el-icon {
  margin-right: 5px;
}

.plugin-actions {
  display: flex;
  padding: 10px 15px;
  border-top: 1px solid #ebeef5;
  justify-content: space-between;
}

.dark-theme .plugin-actions {
  border-top: 1px solid #333;
}

/* 加载中遮罩 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
}

.loading-icon {
  font-size: 40px;
  margin-bottom: 10px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 标签页内容 */
.tab-content {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tab-content h2 {
  margin-bottom: 20px;
  color: #303133;
}

.dark-theme .tab-content h2 {
  color: #e0e0e0;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.dark-theme ::-webkit-scrollbar-track {
  background: #252525;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.dark-theme ::-webkit-scrollbar-thumb {
  background: #555;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}

.dark-theme ::-webkit-scrollbar-thumb:hover {
  background: #777;
}
</style>
