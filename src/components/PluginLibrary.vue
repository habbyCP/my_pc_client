<template>
  <div>
    <div>
    <!-- 搜索和排序区域 -->
    <div class="search-bar">
      <el-input
        v-model="search_form.title"
        placeholder="搜索插件"
        clearable
        @keyup.enter="get_addons_list"
        @clear="get_addons_list"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-button type="primary" class="start-button" @click="get_addons_list">搜索</el-button>
      
      <el-select v-model="search_form.sortBy" placeholder="排序方式" style="width: 150px">
        <el-option label="下载量" value="download"></el-option>
        <el-option label="最新更新" value="update"></el-option>
      </el-select>
    </div>
    
    <div class="plugin-list">
      <div v-for="(item, index) in tableData" :key="item._key || item.id || item.title || index" class="plugin-card">
        <div class="plugin-content">
          <div class="plugin-image">
            <img :src="item.cover" alt="Plugin Image" />
          </div>
          <div class="plugin-info" @click="showPluginDetail(item)">
            <div class="plugin-header">
              <div class="plugin-title">{{ item.name || item.title }}</div>
              <div class="plugin-badges" v-if="item.categories && item.categories.length > 0">
                <span class="plugin-badge" v-for="(category, catIndex) in item.categories" :key="catIndex">{{ category.name }}</span>
              </div>
            </div>
            <div class="plugin-description">{{ item.description ? (item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description) : '暂无描述' }}</div>
            <div class="plugin-meta">
              <span>下载: {{ item.download_count || '0' }}</span>
              <span>体积: {{ item.size || '0KB' }}</span>
              <span>更新: {{ item.updated_at_string || '未知' }}</span>
              <span v-if="item.version">版本: {{ item.version }}</span>
              <span v-if="item.compatibility">适配: {{ item.compatibility }}</span>
            </div>
          </div>
          <div class="plugin-actions">
            <el-button 
              :type="item.installed ? 'success' : 'primary'" 
              class="install-button"
              @click="down_addons({row: item, $index: index})">
              {{ item.installed ? '已安装' : '安装插件' }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 插件详情弹窗 -->
  <el-dialog 
    v-model="detailDialog" 
    :title="selectedPlugin?.name || selectedPlugin?.title" 
    width="60%"
    :lock-scroll=false
    class="plugin-detail-dialog"
    @close="closePluginDetail"
  >
    <div v-if="selectedPlugin" class="plugin-detail-container">
      <!-- 图片轮播区域 -->
      <div v-if="selectedPlugin.screenshots && selectedPlugin.screenshots.length > 0" class="screenshot-carousel">
        <div class="carousel-container">
          <button class="carousel-btn prev-btn" @click="prevImage" v-if="selectedPlugin.screenshots.length > 1">
            <el-icon><ArrowLeft /></el-icon>
          </button>
          <div class="screenshot-display">
            <img 
              :src="selectedPlugin.screenshots[currentImageIndex]" 
              :alt="`Screenshot ${currentImageIndex + 1}`"
              class="screenshot-image"
            />
          </div>
          <button class="carousel-btn next-btn" @click="nextImage" v-if="selectedPlugin.screenshots.length > 1">
            <el-icon><ArrowRight /></el-icon>
          </button>
        </div>
         
      </div>

      <!-- 文本内容区域 -->
      <div class="plugin-text-content">
        
        <div class="plugin-description-detail">
          <h4>插件介绍</h4>
          <div class="text-content">{{ selectedPlugin.text || selectedPlugin.description }}</div>
        </div>

 
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closePluginDetail">关闭</el-button>
        <el-button 
          type="primary" 
          @click="down_addons({row: selectedPlugin, $index: 0})"
        >
          <el-icon><Download /></el-icon>
          {{ selectedPlugin?.installed ? '已安装' : '安装插件' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
  </div>
</template>

<script>
import { ArrowLeft, ArrowRight, Download } from '@element-plus/icons-vue'

export default {
  components: {
    ArrowLeft,
    ArrowRight,
    Download
  },
  name: 'PluginLibrary',
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    search_form: {
      type: Object,
      default: () => ({ title: '', sortBy: 'download' })
    }
  },
  data() {
    return {
      detailDialog: false,
      selectedPlugin: null,
      currentImageIndex: 0
    }
  },
  watch: {
    detailDialog(newVal) {
      if (!newVal) {
        // 弹窗关闭时恢复body滚动
        document.body.style.overflow = ''
      }
    }
  },
  beforeUnmount() {
    // 组件销毁时确保恢复body滚动
    document.body.style.overflow = ''
  },
  methods: {
    get_addons_list() {
      this.$emit('get-addons-list')
    },
    down_addons(data) {
      this.$emit('down-addons', data)
    },
    open_link(link) {
      this.$emit('open-link', link)
    },
    
    showPluginDetail(plugin) {
      this.selectedPlugin = plugin
      this.currentImageIndex = 0
      this.detailDialog = true
      // 阻止body滚动
      // document.body.style.overflow = 'hidden'
      // document.body.style.width = '100%'
    },
    closePluginDetail() {
      this.detailDialog = false
      this.selectedPlugin = null
      // 恢复body滚动
      document.body.style.overflow = ''
    },
    prevImage() {
      if (this.selectedPlugin && this.selectedPlugin.screenshots) {
        this.currentImageIndex = this.currentImageIndex > 0 
          ? this.currentImageIndex - 1 
          : this.selectedPlugin.screenshots.length - 1
      }
    },
    nextImage() {
      if (this.selectedPlugin && this.selectedPlugin.screenshots) {
        this.currentImageIndex = this.currentImageIndex < this.selectedPlugin.screenshots.length - 1 
          ? this.currentImageIndex + 1 
          : 0
      }
    }
  }
}
</script>

<style scoped>
/* 插件详情弹窗样式 */
.plugin-detail-dialog {
  --el-dialog-bg-color: #3c2e26;
  --el-dialog-title-font-size: 18px;
  --el-dialog-header-bg-color: #3c2e26;
  --el-dialog-header-border-bottom: 1px solid #4a3530;
  --el-overlay-color-lighter: rgba(0, 0, 0, 0.7);
}

.plugin-detail-dialog :deep(.el-dialog) {
  margin: 0;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #3c2e26;
  border: 1px solid #4a3530;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.plugin-detail-dialog :deep(.el-dialog__header) {
  background-color: #3c2e26;
  border-bottom: 1px solid #4a3530;
  padding: 20px 20px 15px 20px;
}

.plugin-detail-dialog :deep(.el-dialog__title) {
  color: #e0d6cc;
  font-size: 18px;
  font-weight: 600;
}

.plugin-detail-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.plugin-detail-dialog :deep(.el-dialog__close) {
  color: #a09890;
  font-size: 16px;
}

.plugin-detail-dialog :deep(.el-dialog__close):hover {
  color: #e0d6cc;
}

.plugin-detail-dialog :deep(.el-dialog__body) {
  background-color: #3c2e26;
  padding: 20px;
  flex: 1;
  overflow: hidden;
}

.plugin-detail-dialog :deep(.el-dialog__footer) {
  background-color: #3c2e26;
  border-top: 1px solid #4a3530;
  padding: 15px 20px 20px 20px;
}

.plugin-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 60vh;
  overflow: hidden;
}

/* 图片轮播样式 */
.screenshot-carousel {
  margin-bottom: 20px;
}

.carousel-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #252220;
  border-radius: 8px;
  overflow: hidden;
}

.screenshot-display {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.screenshot-image {
  height: 300px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  color: #e0d6cc;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
}

.carousel-btn:hover {
  background-color: rgba(0, 0, 0, 0.8);
  color: #c28540;
}

.prev-btn {
  left: 10px;
}

.next-btn {
  right: 10px;
}

/* 文本内容样式 */
.plugin-text-content {
  flex: 1;
  overflow-y: auto;
  color: #e0d6cc;
}

.plugin-text-content::-webkit-scrollbar {
  width: 6px;
}

.plugin-text-content::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 3px;
}

.plugin-text-content::-webkit-scrollbar-thumb {
  background: #a09890;
  border-radius: 3px;
}

.plugin-text-content::-webkit-scrollbar-thumb:hover {
  background: #e0d6cc;
}

.plugin-description-detail {
  margin-bottom: 20px;
}

.plugin-description-detail h4 {
  color: #c28540;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
}

.text-content {
  background-color: #252220;
  color: #e0d6cc;
  line-height: 1.8;
  white-space: pre-line;
  padding: 12px 14px;
  border: 1px solid #4a3530;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
  overflow-wrap: anywhere;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 插件卡片点击样式 */
.plugin-content {
  cursor: pointer;
}

.plugin-content:hover {
  background-color: #2a2520 !important;
}
</style>
