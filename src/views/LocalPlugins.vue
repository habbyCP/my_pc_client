<template>
  <div class="local-plugins-container" >
 

    <div class="plugin-list">
      <div v-for="(item, index) in list" :key="item.plugin_id || index" class="plugin-card">
        <div class="plugin-content"> 
          <div class="plugin-info">
            <div class="plugin-header">
              <div class="plugin-title" v-html="parseWowTitle(item.title || item.plugin_id)"></div>
              <div v-if="item.notes" class="plugin-description" v-html="parseWowTitle(item.notes)"></div>
            </div>
            <div class="plugin-meta">
              <div class="meta-column">
                <span class="meta-item">
                  <span class="meta-label">版本:</span>
                  <span class="meta-value">{{ item.version || '未知' }}</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">安装时间:</span>
                  <span class="meta-value">{{ formatTime(item.installedAt) }}</span>
                </span>
              </div>
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

      <div v-if="!loading && list.length === 0" class="empty-tip">暂无数据</div>
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
        console.log("getInstalledPlugins",res)
        if (res.success) {
          list.value = res.data.addons
        }
        
      } catch (e) {
        list.value = []
      } finally {
        loading.value = false
      }
    }

    // const filteredList = computed(() => {
    //   const k = keyword.value.trim().toLowerCase()
    //   if (!k) return list.value
    //   return list.value.filter(i => String(i.title || i.plugin_id).toLowerCase().includes(k))
    // })

    const formatTime = (t) => {
      if (!t) return '未知'
      try { return new Date(t).toLocaleString() } catch { return t }
    }
    
    /**
     * 解析魔兽世界插件标题中的颜色代码
     * 格式如: "|CFFFF0000[不可禁用]|RLibs函数库|cffff1450[2.19]|R"
     * |C + 8位颜色代码 + 文本 + |R
     * @param {string} title 原始标题
     * @returns {string} 解析后的HTML标题
     */
    const parseWowTitle = (title) => {
      if (!title) return ''
      
      // 首先将所有颜色代码转换为小写以统一处理
      let normalizedTitle = title.replace(/\|C/g, '|c').replace(/\|R/g, '|r')
      
      // 处理嵌套的颜色代码
      let processedTitle = ''
      let currentIndex = 0
      let colorStack = []
      
      while (currentIndex < normalizedTitle.length) {
        // 查找下一个颜色代码标记
        const nextColorStart = normalizedTitle.indexOf('|c', currentIndex)
        const nextColorEnd = normalizedTitle.indexOf('|r', currentIndex)
        
        // 如果没有更多的颜色代码，添加剩余的文本
        if (nextColorStart === -1 && nextColorEnd === -1) {
          processedTitle += normalizedTitle.substring(currentIndex)
          break
        }
        
        // 如果下一个标记是颜色开始
        if (nextColorStart !== -1 && (nextColorEnd === -1 || nextColorStart < nextColorEnd)) {
          // 添加颜色代码前的文本
          processedTitle += normalizedTitle.substring(currentIndex, nextColorStart)
          
          // 提取颜色代码
          if (nextColorStart + 10 <= normalizedTitle.length) {
            const colorCode = normalizedTitle.substring(nextColorStart + 2, nextColorStart + 10)
            if (/^[0-9A-Fa-f]{8}$/.test(colorCode)) {
              // 有效的颜色代码，压入堆栈
              colorStack.push(colorCode)
              // 添加HTML颜色开始标记
              const r = colorCode.substr(2, 2)
              const g = colorCode.substr(4, 2)
              const b = colorCode.substr(6, 2)
              processedTitle += `<span style="color: #${r}${g}${b}">`
              // 移动索引到颜色代码之后
              currentIndex = nextColorStart + 10
            } else {
              // 无效的颜色代码，保留原始文本
              processedTitle += '|c'
              currentIndex = nextColorStart + 2
            }
          } else {
            // 不完整的颜色代码，保留原始文本
            processedTitle += '|c'
            currentIndex = nextColorStart + 2
          }
        }
        // 如果下一个标记是颜色结束
        else if (nextColorEnd !== -1) {
          // 添加颜色结束前的文本
          processedTitle += normalizedTitle.substring(currentIndex, nextColorEnd)
          
          // 如果有对应的颜色开始标记，添加HTML结束标记
          if (colorStack.length > 0) {
            colorStack.pop() // 弹出最近的颜色
            processedTitle += '</span>'
          }
          
          // 移动索引到颜色结束标记之后
          currentIndex = nextColorEnd + 2
        }
      }
      
      // 关闭所有未关闭的颜色标记
      for (let i = 0; i < colorStack.length; i++) {
        processedTitle += '</span>'
      }
      
      return processedTitle
    }

    onMounted(fetchData)

    return { list, loading, keyword, placeholder, formatTime, parseWowTitle }
  }
}
</script>

<style scoped>
.local-plugins-container {
  padding: 20px;
  background-color: #1a1a1a;
  min-height: calc(100vh - 130px);
  width: 100%;
  overflow-y: auto;
  max-height: calc(100vh - 90px);
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
  padding: 10px 15px;
}
 
.plugin-info { flex: 1 1 auto; min-width: 0; min-height: 48px; display: flex; flex-direction: row; align-items: center; gap: 12px; }
.plugin-header { margin: 0; display: flex; flex-direction: column; align-items: flex-start; width: 70%; }
.plugin-title { 
  font-size: 16px; 
  font-weight: 600; 
  color: #e0d6cc; 
  margin: 0; 
  text-align: left; 
  word-wrap: break-word; 
  word-break: break-word; 
  white-space: normal; 
  overflow-wrap: break-word;
}
.plugin-description { 
  font-size: 12px; 
  color: #a09890; 
  margin-top: 12px; 
  line-height: 1.3; 
  text-align: left; 
  width: 100%; 
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 4.5em; /* 3行 * 1.5行高 */
  word-wrap: break-word; 
  word-break: break-word; 
  white-space: normal; 
  overflow-wrap: break-word;
}
.plugin-meta { font-size: 12px; color: #a09890; display: flex; gap: 12px; flex-wrap: nowrap; margin: 0; overflow: hidden; }
.meta-column { display: flex; flex-direction: column; gap: 6px; }
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
