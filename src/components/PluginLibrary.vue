<template>
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
        <template #append>
          <el-button @click="get_addons_list">搜索</el-button>
        </template>
      </el-input>
      
      <el-select v-model="sortBy" placeholder="排序方式" style="width: 150px">
        <el-option label="下载量" value="download"></el-option>
        <el-option label="最新更新" value="update"></el-option>
      </el-select>
    </div>
    
    <div class="plugin-list">
      <div v-for="(item, index) in tableData" :key="index" class="plugin-card">
        <div class="plugin-content">
          <div class="plugin-image">
            <img :src="item.pic_list[0] || 'https://via.placeholder.com/300x150'" alt="Plugin Image" />
          </div>
          <div class="plugin-info">
            <div class="plugin-header">
              <div class="plugin-title">{{ item.title }}</div>
              <div class="plugin-badge" v-if="item.category">{{ item.category }}</div>
            </div>
            <div class="plugin-description">{{ item.text ? (item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text) : '暂无描述' }}</div>
            <div class="plugin-meta">
              <span>下载: {{ item.download_count || '0' }}</span>
              <span>体积: {{ item.size || '0KB' }}</span>
              <span>更新: {{ item.modified || '未知' }}</span>
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
</template>

<script>
export default {
  name: 'PluginLibrary',
  props: {
    tableData: {
      type: Array,
      default: () => []
    },
    
  },
  data() {
    return {
      sortBy: 'download',
      search_form: {
        title: ''
      }
    }
  },
  methods: {
    get_addons_list() {
      this.$emit('get-addons-list', this.search_form)
    },
    down_addons(data) {
      this.$emit('down-addons', data)
    },
    open_link(link) {
      this.$emit('open-link', link)
    },
    show_detail(item) {
      this.$emit('show-detail', item)
    }
  }
}
</script>

<style>
/* Component-specific styles can be added here if needed */
</style>
