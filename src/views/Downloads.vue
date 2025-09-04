<template>
  <div class="downloads-view">
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
        class="app-dialog client-detail-dialog"
        :lock-scroll="false"
      >
        <div class="client-detail-content" v-html="selectedClient?.description"></div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="detailDialog = false">关闭</el-button>
            <el-button type="primary" @click="downloadClient(selectedClient)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Download, DocumentCopy } from '@element-plus/icons-vue'
import { useAppStore } from '../store.js'

export default {
  name: 'Downloads',
  components: {
    Calendar,
    Download,
    DocumentCopy
  },
  setup() {
    const store = useAppStore()
    const clients = ref([])
    const detailDialog = ref(false)
    const selectedClient = ref(null)
    const searchForm = ref({ title: '' })

    const truncateDescription = (description, maxLength) => {
      const textOnly = String(description || '').replace(/<[^>]*>/g, '')
      if (textOnly.length <= maxLength) return textOnly
      return textOnly.substring(0, maxLength) + '...'
    }

    const filteredClients = computed(() => {
      const withShort = clients.value.map(c => ({
        ...c,
        shortDescription: truncateDescription(String(c?.description || ''), 120)
      }))
      const keyword = (searchForm.value.title || '').trim().toLowerCase()
      if (!keyword) return withShort
      const toText = (s) => String(s || '').replace(/<[^>]*>/g, '').toLowerCase()
      return withShort.filter(client =>
        String(client.title || '').toLowerCase().includes(keyword) ||
        toText(client.description).includes(keyword)
      )
    })

    const downloadClient = (client) => {
      if (!client || !client.download_url) {
        ElMessage.error('下载链接无效')
        return
      }
      if (window.electronAPI) {
        window.electronAPI.openLink({ outLink: client.download_url })
      } else {
        window.open(client.download_url, '_blank')
      }
    }

    const showFullDescription = (client) => {
      if (!client) return
      selectedClient.value = client
      detailDialog.value = true
      document.body.style.overflow = 'hidden'
      document.body.style.width = '100%'
    }

    const copyLink = async (client) => {
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
    }

    onMounted(async () => {
      clients.value = await store.get_clients_list()
    })

    onBeforeUnmount(() => {
      document.body.style.overflow = ''
      document.body.style.width = '100%'
    })

    return {
      filteredClients,
      detailDialog,
      selectedClient,
      downloadClient,
      showFullDescription,
      copyLink,
      Calendar,
      Download,
      DocumentCopy
    }
  }
}
</script>

<style scoped>
.downloads-view {
  height: 100%;
  width: 100%;
}

.client-list-container {
  padding: 20px;
  background-color: #1a1a1a;
  min-height: calc(100vh - 130px);
}

.client-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.client-item {
  background-color: #252220;
  border-radius: 8px;
  padding: 12px 15px;
  border: 1px solid #332e2a;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s ease;
}

.client-item:hover {
  border-left: 3px solid #c28540;
}

.client-info {
  flex: 1;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  min-height: 70px;
}

.client-title {
  margin: 0 0 8px 0;
  color: #e0d6cc;
  font-size: 18px;
  font-weight: 600;
}

.client-meta { 
  display: flex;
  gap: 16px;
  align-items: center;
  order: 2;
  margin-top: auto;
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
  order: 1;
  flex: 1;
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
  margin-left: 0;
}

/* 弹窗通用结构样式已由 .app-dialog 提供，这里仅保留内容区样式 */
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
  .client-info { margin-right: 0; }
  .client-actions { align-self: stretch; }
}
</style>