<template>
  <div class="plugins-view-container">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="category-list">
        <div class="category-item"
             v-for="category in store.categories"
             :key="category.id"
             :class="{ active: store.activeCategory && store.activeCategory.id === category.id }"
             @click="store.switchCategory(category)">
          <img v-if="category.icon" :src="category.icon" class="category-icon" alt="category icon" />
          <span>{{ category.name }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <!-- Search and Sort Area -->
      <div class="search-bar">
        <el-input
          v-model="store.search_form.title"
          placeholder="搜索插件"
          clearable
          @keyup.enter="store.get_addons_list"
          @clear="store.get_addons_list"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="start-button" @click="store.get_addons_list">搜索</el-button>
        <el-select v-model="store.search_form.sort_by" placeholder="排序方式" style="width: 150px">
          <el-option label="下载量" value="download"></el-option>
          <el-option label="最新更新" value="update"></el-option>
        </el-select>
      </div>

      <!-- Plugin List -->
      <div class="plugin-list">
        <div v-for="(item, index) in store.tableData" :key="item._key || item.id || item.title || index" class="plugin-card">
          <div class="plugin-content">
            <div class="plugin-image"  @click="showPluginDetail(item)">
              <img :src="item.cover" alt="Plugin Image" />
            </div>
            <div class="plugin-info" @click="showPluginDetail(item)">
              <div class="plugin-header">
                <div class="plugin-title">
                  <span v-if="item.is_featured==1" style="color: #F56C6C; font-weight: bold; margin-right: 8px;">[推荐]</span>{{ item.name || item.title }}
                </div>
                <div class="plugin-badges" v-if="item.categories && item.categories.length > 0">
                  <span class="plugin-badge" v-for="(category, catIndex) in item.categories" :key="catIndex">{{ category.name }}</span>
                </div>
              </div>
              <div class="plugin-description">{{ item.description ? (item.description.length > 100 ? item.description.substring(0, 100) + '...' : item.description) : '暂无描述' }}</div>
              <div class="plugin-meta">
                <span><strong style="color: #909399;">下载量:</strong> {{ item.download_count ?? item.downloads ?? '0' }}</span>
                <span><strong style="color: #909399;">最后更新:</strong> {{ item.updated_at_string || item.updated_at || '未知' }}</span>
                <span v-if="item.version || item.latest_version"><strong style="color: #909399;">最新版本:</strong> {{ item.version || item.latest_version }}</span>
                <span v-if="item.size"><strong style="color: #909399;">大小:</strong> {{ item.size }}</span>
              </div>
            </div>
            <div class="plugin-actions">
              <el-button
                :type="item.installed ? 'success' : 'primary'"
                class="install-button"
                @click.stop="store.down_addons({row: item, $index: index})">
                {{ item.installed ? '已安装' : '下载/安装' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Infinite Scroll Footer -->
      <div class="infinite-footer">
        <div v-if="store.loadingMore" class="infinite-status">加载中...</div>
        <div v-else-if="!store.hasMore" class="infinite-status">没有更多了</div>
        <div ref="infiniteSentinel" class="infinite-sentinel"></div>
      </div>

      <!-- Plugin Detail Dialog -->
      <el-dialog
        v-model="detailDialog"
        :title="selectedPlugin?.name || selectedPlugin?.title"
        width="60%"
        :lock-scroll="false"
        class="app-dialog plugin-detail-dialog"
        @close="closePluginDetail"
      >
        <div v-if="selectedPlugin" class="plugin-detail-container">
          <div v-if="selectedPlugin.screenshots && selectedPlugin.screenshots.length > 0" class="screenshot-carousel">
            <div class="carousel-container">
              <button class="carousel-btn prev-btn" @click="prevImage" v-if="selectedPlugin.screenshots.length > 1">
                <el-icon><ArrowLeft /></el-icon>
              </button>
              <div class="screenshot-display">
                <img :src="selectedPlugin.screenshots[currentImageIndex]" :alt="`Screenshot ${currentImageIndex + 1}`" class="screenshot-image" />
              </div>
              <button class="carousel-btn next-btn" @click="nextImage" v-if="selectedPlugin.screenshots.length > 1">
                <el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
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
            <el-button type="primary" @click="store.down_addons({row: selectedPlugin, $index: 0})">
              <el-icon><Download /></el-icon>
              {{ selectedPlugin?.installed ? '已安装' : '安装插件' }}
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '../store.js'
import { Search, ArrowLeft, ArrowRight, Download } from '@element-plus/icons-vue'

export default {
  name: 'Plugins',
  components: {
    Search,
    ArrowLeft,
    ArrowRight,
    Download
  },
  setup() {
    const store = useAppStore()

    // State for the detail dialog
    const detailDialog = ref(false)
    const selectedPlugin = ref(null)
    const currentImageIndex = ref(0)
    const infiniteSentinel = ref(null)
    let observer = null

    watch(detailDialog, (newVal) => {
      if (!newVal) {
        document.body.style.overflow = ''
      }
    })

    const showPluginDetail = (plugin) => {
      selectedPlugin.value = plugin
      currentImageIndex.value = 0
      detailDialog.value = true
    }

    const closePluginDetail = () => {
      detailDialog.value = false
      selectedPlugin.value = null
    }

    const prevImage = () => {
      if (selectedPlugin.value && selectedPlugin.value.screenshots) {
        currentImageIndex.value = currentImageIndex.value > 0
          ? currentImageIndex.value - 1
          : selectedPlugin.value.screenshots.length - 1
      }
    }

    const nextImage = () => {
      if (selectedPlugin.value && selectedPlugin.value.screenshots) {
        currentImageIndex.value = currentImageIndex.value < selectedPlugin.value.screenshots.length - 1
          ? currentImageIndex.value + 1
          : 0
      }
    }

    // IntersectionObserver for infinite scroll
    onMounted(() => {
      if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // 只有在还有更多并且未在加载中时触发
              if (store.hasMore && !store.loadingMore) {
                store.load_more_addons()
              }
            }
          })
        }, {
          root: null, // 使用视口
          rootMargin: '0px',
          threshold: 0.1,
        })
        if (infiniteSentinel.value) {
          observer.observe(infiniteSentinel.value)
        }
      }
    })

    onBeforeUnmount(() => {
      if (observer && infiniteSentinel.value) {
        observer.unobserve(infiniteSentinel.value)
      }
      if (observer) {
        observer.disconnect()
      }
      observer = null
    })

    return {
      store,
      detailDialog,
      selectedPlugin,
      currentImageIndex,
      infiniteSentinel,
      showPluginDetail,
      closePluginDetail,
      prevImage,
      nextImage
    }
  }
}
</script>

<style scoped>
/* Scoped styles from both files, merged */
.plugins-view-container {
  display: flex;
  height: 100%;
}

.sidebar {
  width: 200px;
  background-color: #2c2c2c; 
  overflow-y: auto;
  height: 100%;
}


.category-list {
  display: flex;
  flex-direction: column;
}

 

/* .category-item:hover {
  background-color: #3a3a3a;
}

.category-item.active {
  background-color: #c28540;
  color: white;
  font-weight: bold;
} */

 

/* 弹窗通用结构样式已抽取到 src/assets/styles/dialog.css 并通过 .app-dialog 应用。
   这里仅保留与内容显示相关的样式。 */

.plugin-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 60vh;
  overflow: hidden;
}

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
  padding: 10px;
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

.plugin-content {
  cursor: pointer;
}

.plugin-content:hover {
  background-color: #2a2520 !important;
}

/* Copied from PluginLibrary.vue, but it's not scoped, so it should be global or in a separate css file if needed */
/* I will keep it here for now */
.search-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
}

.plugin-image {
  width: 120px;
  height: 80px;
  flex: none;
  border-radius: 8px;
  overflow: hidden;
}

.plugin-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plugin-info {
  flex: 1 1 auto;
  min-width: 0;
}

.plugin-header {
  margin-bottom: 10px;
}

.plugin-title {
  font-size: 16px;
  font-weight: 600;
  color: #e0d6cc;
  margin-bottom: 5px;
}

.plugin-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.plugin-badge {
  background-color: #4a3530;
  color: #e0d6cc;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.plugin-description {
  font-size: 14px;
  color: #a09890;
  line-height: 1.5;
  margin-bottom: 10px;
}

.plugin-meta {
  font-size: 12px;
  color: #a09890;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.plugin-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 160px;
  flex: none;
  padding: 0 12px 0 16px;
  border-left: 1px solid #332e2a;
}

.install-button {
  width: 120px;
}

/* Infinite scroll */
.infinite-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 0 24px;
}

.infinite-status {
  color: #a09890;
  font-size: 14px;
  margin-bottom: 8px;
}

.infinite-sentinel {
  width: 100%;
  height: 1px;
}
</style>
