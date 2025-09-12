<template>
  <div class="local-plugins-container" >
 
    <div class="search-bar"> 
        <el-button type="primary" class="start-button" @click="refreshData">检查更新</el-button>
      </div>

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
                  <span class="meta-value">
                    {{ item.version || '未知' }}
                    <template v-if="item._latest">
                      &nbsp;/&nbsp;远程: {{ getRemoteVersion(item) }}
                    </template>
                  </span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">安装时间:</span>
                  <span class="meta-value">{{ formatTime(item.installedAt) }}</span>
                </span>
              </div> 
            </div>
          </div>
          <div class="plugin-actions">
            <el-button
              v-if="hasMissingDirs(item)"
              class="install-button"
              type="success" 
              @click="handleReinstall(item)"
            >重新安装</el-button>

            <el-button
              v-else-if="item._status === 'update'"
              class="install-button"
              type="primary" 
              @click="handleUpdate(item)"
            >更新</el-button>

            <el-button
              v-else-if="item._status === 'up_to_date'"
              class="install-button"
              type="info"  
              disabled
            >已最新</el-button>

            <el-button
              v-else
              class="install-button"
              type="warning"
              plain  
            >未知插件</el-button>
          </div>
        </div>
        <div v-if="item.miss_dir && item.miss_dir.length > 0" class="missing-dirs-bar">
          <div class="missing-dirs-title">缺失插件目录:</div>
          <div class="missing-dirs-content">
            <span v-for="(dir, dirIndex) in item.miss_dir" :key="dirIndex" class="missing-dir">{{ dir }}</span>
          </div>
        </div>
      </div>

      <div v-if="!loading && list.length === 0" class="empty-tip">暂无数据</div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { apiService } from '../apiService.js'
import { isNewer } from '../utils/version'

export default {
  name: 'LocalPlugins',
  setup() {
    const list = ref([])
    const loading = ref(false)
    const keyword = ref('')
    const placeholder = '/favicon.ico'

    // 工具：是否缺失目录
    const hasMissingDirs = (item) => Array.isArray(item?.miss_dir) && item.miss_dir.length > 0

    // 工具：是否有 plugin_id
    const hasPluginId = (item) => !!item?.plugin_id

    // 版本比较已抽离至 utils/version.ts

    // 根据接口返回结果标注每个 item 的状态
    const annotateItems = (items, latestMapById, bySubDirMap) => {
      items.forEach((it) => {
        if (hasMissingDirs(it)) {
          it._status = 'reinstall'
          return
        }

        if (hasPluginId(it)) {
          const info = latestMapById.get(String(it.plugin_id))
          if (info && isNewer(info.last_version, it.version)) {
            it._status = 'update'
            it._latest = info
          } else if (info) {
            it._status = 'up_to_date'
            it._latest = info
          } else {
            // 未拿到对应该 ID 的信息，保守认为未知
            it._status = 'unknown'
          }
          return
        }

        // 无 plugin_id 的情况：使用 db_file_list 做映射
        const dirs = Array.isArray(it.db_file_list) ? it.db_file_list : []
        let matched = false
        for (const d of dirs) {
          const candidates = bySubDirMap.get(d)
          if (Array.isArray(candidates) && candidates.length > 0) {
            matched = true
            // 任意命中即认为可更新（具体匹配策略可在后续细化）
            const info = candidates[0]
            const remoteVersion = info.last_version || info.version // by_sub_dirs 返回 version 字段
            if (isNewer(remoteVersion, it.version)) {
              it._status = 'update'
              it._latest = info
            } else {
              it._status = 'up_to_date'
              it._latest = info
            }
            break
          }
        }
        if (!matched) {
          it._status = 'unknown'
        }
      })
    }

    // 从 API 加载数据的函数
    const loadDataFromAPI = async () => {
 
      loading.value = true
      try {
        console.log('开始调用 getInstalledPlugins API')
        const res = await window.electronAPI.getInstalledPlugins()
        console.log('API 返回结果:', res)
        if (res.success) {
          list.value = res.data.addons

          // 批量判断是否可更新
          try {
            const withIdNoMissing = list.value.filter(it => hasPluginId(it) && !hasMissingDirs(it))
            const withoutId = list.value.filter(it => !hasPluginId(it))

            // 1) 根据 plugin_id 批量获取最新版本
            const idSet = Array.from(new Set(withIdNoMissing.map(it => String(it.plugin_id))))
            let latestByIds = []
            if (idSet.length > 0) {
              latestByIds = await apiService.checkLatestVersionsByIds(idSet)
            }
            const latestMapById = new Map()
            for (const r of (latestByIds || [])) {
              latestMapById.set(String(r.id), r)
            }

            // 2) 对于没有 plugin_id 的，汇总 db_file_list 后请求
            const allDirs = new Set()
            for (const it of withoutId) {
              (Array.isArray(it.db_file_list) ? it.db_file_list : []).forEach(d => { if (d) allDirs.add(d) })
            }
            let bySubDirObj = {}
            if (allDirs.size > 0) {
              bySubDirObj = await apiService.getAddonsBySubDirs(Array.from(allDirs))
            }
            const bySubDirMap = new Map(Object.entries(bySubDirObj || {}))

            // 标注每个条目的状态
            annotateItems(list.value, latestMapById, bySubDirMap)
          } catch (markErr) {
            console.error('标注更新状态失败:', markErr)
          }

          // 将数据缓存到 sessionStorage（包含标注后的按钮状态）
          sessionStorage.setItem('localPluginsData', JSON.stringify(list.value))
        } else {
          console.error('API 返回失败:', res.message || '未知错误')
          list.value = []
        }
      } catch (e) {
        console.error('捕获到异常:', e)
        list.value = []
      } finally {
        console.log('finally 块执行')
        loading.value = false
      }
    }
    
    // 强制刷新数据的函数
    const refreshData = async () => { 
      // 删除缓存数据
      sessionStorage.removeItem('localPluginsData')
      // 重新加载数据 
      await loadDataFromAPI()
    }
    
    // 获取数据的函数，优先使用缓存
    const fetchData = async () => { 
      // 检查 sessionStorage 中是否有缓存数据
      const cachedData = sessionStorage.getItem('localPluginsData')
      
      if (cachedData) {
        // 如果有缓存数据，直接使用缓存（缓存中已包含按钮状态等派生字段）
        console.log('使用缓存数据')
        list.value = JSON.parse(cachedData)
        return
      }
      
      // 没有缓存数据，需要重新加载 
      await loadDataFromAPI()
    }

    // 格式化时间
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

    onMounted(()=>{
      fetchData()
    })

    // 点击处理（后续接真接口/主进程）
    const handleReinstall = (item) => {
      console.log('重新安装', item)
      // TODO: 触发主进程重新安装流程
    }

    const handleUpdate = (item) => {
      console.log('更新', item)
      // TODO: 触发更新流程：若有 plugin_id，直接按 id 更新；否则根据 _latest 信息选择对应包
    }

    // 显示远程版本号（last_version 或 version），无则显示“未知”
    const getRemoteVersion = (item) => {
      const latest = item && item._latest
      if (!latest) return '未知'
      return latest.last_version || latest.version || '未知'
    }

    return { list, loading, keyword, placeholder, formatTime, parseWowTitle, refreshData, hasMissingDirs, handleReinstall, handleUpdate, getRemoteVersion }
  }
}
</script>

<style scoped>
.local-plugins-container {
  padding: 15px;
  background-color: #1a1a1a;
  min-height: calc(100vh - 130px);
  width: 100%;
  overflow-y: auto;
  max-height: calc(100vh - 90px);
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

/* 缺失目录横条样式 */
.missing-dirs-bar {
  background-color: rgba(245, 108, 108, 0.1);
  border-top: 1px solid rgba(245, 108, 108, 0.3);
  padding: 8px 15px;
  display: flex;
  /* align-items: center; */
  border-radius: 0 0 8px 8px;
  overflow: auto;
  max-height: 60px;
}

.missing-dirs-title {
  color: #f56c6c;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
  white-space: nowrap;
}

.missing-dirs-content {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.missing-dir {
  background: rgba(245, 108, 108, 0.15);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.3);
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
}

/* 响应式：窄屏时纵向堆叠 */
@media (max-width: 768px) {
  .plugin-content { flex-direction: column; align-items: stretch; gap: 12px; }
  .plugin-info { padding: 0; }
  .plugin-actions { align-self: stretch; flex-direction: row; }
  .missing-dirs-bar { flex-direction: column; align-items: flex-start; }
  .missing-dirs-title { margin-bottom: 6px; }
}
</style>
