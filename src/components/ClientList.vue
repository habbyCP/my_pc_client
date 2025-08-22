<template>
  <div class="client-list-container">
 

    <div class="client-list">
      <div v-for="client in filteredClients" :key="client.id" class="client-item">
        <div class="client-info">
          <h3 class="client-title">{{ client.title }}</h3>
          <div class="client-meta">
            <span class="update-time">
              <el-icon><Calendar /></el-icon>
              更新时间: {{ client.update_time }}
            </span>
          </div>
          <div class="client-description" @click="showFullDescription(client)">
            {{ client.shortDescription }}
            
          </div>
        </div>
        <div class="client-actions">
          <el-button type="primary" @click="downloadClient(client)" :loading="client.downloading">
            <el-icon><Download /></el-icon>
            {{ client.downloading ? '下载中...' : '下载' }}
          </el-button>
          <el-button type="primary" @click="copyLink(client)">
            <el-icon><DocumentCopy /></el-icon>
            复制链接
          </el-button>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog 
      v-model="detailDialog" 
      :title="selectedClient?.title" 
      width="60%"
      class="client-detail-dialog"
    >
      <div class="client-detail-content" v-html="selectedClient?.description"></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialog = false">关闭</el-button>
          <el-button type="primary" @click="downloadClient(selectedClient)">
            <el-icon><Download /></el-icon>
            下载客户端
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Search, Download, Calendar, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'ClientList',
  components: {
    Search,
    Download,
    Calendar,
    DocumentCopy
  },
  data() {
    return {
      searchForm: {
        title: ''
      },
      detailDialog: false,
      selectedClient: null,
      clients: []
    }
  },
  computed: {
    filteredClients() {
      if (!this.searchForm.title.trim()) {
        return this.clients
      }
      const keyword = this.searchForm.title.toLowerCase()
      return this.clients.filter(client => 
        client.title.toLowerCase().includes(keyword) ||
        client.description.toLowerCase().includes(keyword)
      )
    }
  },
  mounted() {
    this.loadClients()
  },
  watch: {
    detailDialog(newVal) {
      if (!newVal) {
        // 弹窗关闭时恢复body滚动
        document.body.style.overflow = ''
        document.body.style.width = '100%'
      }
    }
  },
  beforeDestroy() {
    // 组件销毁时确保恢复body滚动
    document.body.style.overflow = ''
    document.body.style.width = '100%'
  },
  methods: {
    async loadClients() {
      // 这里会调用API或mock数据
      this.$emit('load-clients')
    },
    searchClients() {
      // 搜索功能已通过computed实现
      console.log('搜索客户端:', this.searchForm.title)
    },
 
    downloadClient(client) {
      if (!client || !client.download_url) {
        ElMessage.error('下载链接无效')
        return
      }
      

      
      
      // 跳转到外部网页
      if (window.electronAPI) {
        window.electronAPI.openLink({ outLink: client.download_url })
      } else {
        // 浏览器环境下直接跳转
        window.open(client.download_url, '_blank')
      }
      

      
    },
    async copyLink(client) {
      if (!client || !client.download_url) {
        ElMessage.error('无效的下载链接')
        return
      }
      const text = String(client.download_url)
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = text
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.focus()
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        ElMessage.success('链接已复制到剪贴板')
      } catch (e) {
        console.error('复制失败:', e)
        ElMessage.error('复制失败，请手动复制')
      }
    },
 
    // 接收父组件传入的客户端数据
    updateClients(clients) {
      this.clients = clients.map(client => ({
        ...client,
        shortDescription: this.truncateDescription(client.description, 100),
        downloading: false
      }))
    },
    truncateDescription(description, maxLength) {
      // 移除HTML标签来计算纯文本长度
      const textOnly = description.replace(/<[^>]*>/g, '')
      if (textOnly.length <= maxLength) {
        return textOnly
      }
      return textOnly.substring(0, maxLength)
    }
  }
}
</script>

<style>
.client-list-container {
  padding: 20px;
  background-color: #1a1a1a;
  min-height: calc(100vh - 60px);
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-bar .el-input {
  flex: 1;
  max-width: 300px;
}

.search-button {
  min-width: 80px;
}

.client-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.client-item {
  background-color: #252220;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #332e2a;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.client-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.client-info {
  flex: 1;
  margin-right: 20px;
}

.client-title {
  margin: 0 0 8px 0;
  color: #e0d6cc;
  font-size: 18px;
  font-weight: 600;
}

.client-meta {
  margin-bottom: 12px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.update-time {
  color: #a09890;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.client-description {
  color: #b8b8b8;
  line-height: 1.6;
  cursor: pointer;
  transition: color 0.3s ease;
}

.client-description:hover {
  color: #e0d6cc;
}

.expand-hint {
  color: #409eff;
  font-size: 12px;
  margin-left: 4px;
}

.client-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
  align-items: stretch;
}
.client-actions .el-button {
  width: 100%;
}
.client-actions .el-button + .el-button {
  margin-left: 0; /* 覆盖 Element Plus 默认相邻按钮左间距 */
}
.el-dialog__header{
  color: #e0d6cc !important;
}
.client-detail-dialog {
  --el-dialog-bg-color: #3c2e26;
  --el-dialog-title-font-size: 18px;
  --el-dialog-header-bg-color: #3c2e26;
  --el-dialog-header-border-bottom: 1px solid #4a3530;
  --el-overlay-color-lighter: rgba(0, 0, 0, 0.7);
}

/* 修复弹窗显示时的滚动条问题 */
.client-detail-dialog :deep(.el-overlay) {
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.client-detail-dialog :deep(.el-overlay-dialog) {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  height: 100%;
}

/* 确保弹窗本身不会导致页面滚动 */
.client-detail-dialog :deep(.el-dialog) {
  margin: 0;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #3c2e26;
  border: 1px solid #4a3530;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.client-detail-dialog :deep(.el-dialog__header) {
  background-color: #3c2e26;
  border-bottom: 1px solid #4a3530;
  padding: 20px 20px 15px 20px;
}

.client-detail-dialog :deep(.el-dialog__title) {
  color: #e0d6cc;
  font-size: 18px;
  font-weight: 600;
}

.client-detail-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.client-detail-dialog :deep(.el-dialog__close) {
  color: #a09890;
  font-size: 16px;
}

.client-detail-dialog :deep(.el-dialog__close):hover {
  color: #e0d6cc;
}

.client-detail-dialog :deep(.el-dialog__body) {
  background-color: #3c2e26;
  padding: 20px;
  flex: 1;
  overflow: hidden;
}

.client-detail-dialog :deep(.el-dialog__footer) {
  background-color: #3c2e26;
  border-top: 1px solid #4a3530;
  padding: 15px 20px 20px 20px;
}

.client-detail-content {
  color: #e0d6cc;
  line-height: 1.8;
  max-height: 60vh;
  overflow-y: auto;
}

.client-detail-content::-webkit-scrollbar {
  width: 6px;
}

.client-detail-content::-webkit-scrollbar-track {
  background: #1a1a1a;
  border-radius: 3px;
}

.client-detail-content::-webkit-scrollbar-thumb {
  background: #a09890;
  border-radius: 3px;
}

.client-detail-content::-webkit-scrollbar-thumb:hover {
  background: #e0d6cc;
}

.client-detail-content :deep(img) {
  height: 300px;
  width: auto;
  margin: 10px 0;
  border-radius: 4px;
  object-fit: contain;
  display: block;
}

.client-detail-content :deep(p) {
  margin-bottom: 12px;
}

.client-detail-content :deep(h1),
.client-detail-content :deep(h2),
.client-detail-content :deep(h3) {
  color: #409eff;
  margin: 16px 0 8px 0;
}

.client-detail-content :deep(h4) {
  color: #67c23a;
  margin: 14px 0 6px 0;
  font-size: 16px;
}

.client-detail-content :deep(ul) {
  margin: 8px 0 12px 0;
  padding-left: 20px;
}

.client-detail-content :deep(li) {
  margin-bottom: 4px;
  color: #b8b8b8;
}

.client-detail-content :deep(strong) {
  color: #e0d6cc;
  font-weight: 600;
}

.client-detail-content :deep(p) {
  margin-bottom: 12px;
  color: #b8b8b8;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .client-item {
    flex-direction: column;
    gap: 16px;
  }
  
  .client-info {
    margin-right: 0;
  }
  
  .client-actions {
    align-self: stretch;
  }
}
</style>