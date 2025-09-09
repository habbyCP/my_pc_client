<template>
  <div class="local-plugins-container">
 

    <div class="plugin-list">
      <div v-for="(item, index) in filteredList" :key="item.plugin_id || index" class="plugin-card">
        <div class="plugin-content"> 
          <div class="plugin-info">
            <div class="plugin-header">
              <div class="plugin-title">{{ item.title || item.plugin_id }}</div>
            </div>
            <div class="plugin-meta">
              <span class="meta-item">
                <span class="meta-label">版本:</span>
                <span class="meta-value">{{ item.version || '未知' }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">安装时间:</span>
                <span class="meta-value">{{ formatTime(item.installed_at) }}</span>
              </span>
              <el-tooltip v-if="item.is_broken" content="助手检测到目录有缺失" placement="top">
                <span class="badge badge-danger">破损需更新</span>
              </el-tooltip>
            </div>
          </div>
          <div class="plugin-actions">
            <el-button v-if="item.is_broken" class="install-button" type="success">更新</el-button>
            <el-button v-else class="install-button" type="primary" plain>重新安装</el-button>
          </div>
        </div>
      </div>

      <div v-if="!loading && filteredList.length === 0" class="empty-tip">暂无数据</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'LocalPlugins',
  setup() {
    const list = ref([])
    const loading = ref(false)
    const keyword = ref('')
    const placeholder = '/favicon.ico'

    const fetchData = async () => { 
      loading.value = true
      try {
        const res = await window.electronAPI.getInstalledPlugins()
        const rows = res?.success ? res.data : Array.isArray(res) ? res : []
        // 增加“是否破损”随机字段（占位）
        list.value = rows.map(r => ({ ...r, is_broken: Math.random() < 0.2 }))
      } catch (e) {
        list.value = []
      } finally {
        loading.value = false
      }
    }

    const filteredList = computed(() => {
      const k = keyword.value.trim().toLowerCase()
      if (!k) return list.value
      return list.value.filter(i => String(i.title || i.plugin_id).toLowerCase().includes(k))
    })

    const formatTime = (t) => {
      if (!t) return '未知'
      try { return new Date(t).toLocaleString() } catch { return t }
    }

    onMounted(fetchData)

    return { list, loading, keyword, filteredList, placeholder, formatTime }
  }
}
</script>

<style scoped>
.local-plugins-container {
  padding: 20px;
  background-color: #1a1a1a;
  min-height: calc(100vh - 130px);
  width: 100%;
}
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.plugin-card {
  background-color: #252220;
  border-radius: 8px; 
  border: 1px solid #332e2a;
  transition: all 0.3s ease;
}
.plugin-card:hover {
  /* border-color: #409eff; */
  /* box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15); */
}
.plugin-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
}
 
.plugin-info { flex: 1 1 auto; min-width: 0; min-height: 48px; display: flex; flex-direction: row; align-items: center; gap: 12px; }
.plugin-header { margin: 0; display: flex; align-items: center; }
.plugin-title { font-size: 16px; font-weight: 600; color: #e0d6cc; margin: 0; }
.plugin-meta { font-size: 12px; color: #a09890; display: flex; gap: 12px; flex-wrap: nowrap; margin: 0; overflow: hidden; }
.meta-item { display: inline-flex; align-items: center; gap: 4px; }
.meta-label { color: #a09890; }
.meta-value { color: #e0d6cc; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; line-height: 1; }
.badge-danger { background: rgba(245, 108, 108, 0.15); color: #f56c6c; border: 1px solid rgba(245, 108, 108, 0.5); }
.plugin-actions { display: flex; flex-direction: row; gap: 8px; min-width: 200px; align-items: center; align-self: auto; justify-content: flex-end; } 
.empty-tip { text-align: center; color: #a09890; padding: 20px 0; }

/* 响应式：窄屏时纵向堆叠 */
@media (max-width: 768px) {
  .plugin-content { flex-direction: column; align-items: stretch; gap: 12px; }
  .plugin-info { padding: 0; }
  .plugin-actions { align-self: stretch; flex-direction: row; }
}
</style>
