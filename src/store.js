import { defineStore } from 'pinia'
import { ElMessageBox, ElMessage } from 'element-plus'
import { apiService, initializeApiService } from './apiService.js'
import WowAddons from './wow_addons.js'
import { add } from 'date-fns'

export const useAppStore = defineStore('app', {
  state: () => ({
    search_form: {
      title: '',
      category_id: 0,
      sort_by: 'download',
    },
    main_loading_word: "加载中",
    main_loading: false,
    download_progress: 0,
    categories: [],
    activeCategory: null,
    tableData: [],
  }),

  actions: {
    // 初始化 API 服务和下载进度监听
    async initialize() {
      await initializeApiService();
      window.electronAPI.onDownloadProgress((data) => {
        if (data && data.data) {
          this.download_progress = data.data.progress;
          this.main_loading_word = data.data.msg || "下载中...";
          // console.log("下载进度:", this.download_progress + "%", this.main_loading_word);
        }
      });
    },

    // 切换左侧分类
    switchCategory(category) {
      this.activeCategory = category
      this.get_addons_list()
    },

    //启动客户端
    async start_wow() {
      try {
        const settings = await window.electronAPI.getSettings();
        if (!settings.gamePath) {
          ElMessageBox.alert('请先在设置中配置游戏路径', '游戏路径未配置', {
            confirmButtonText: 'OK', type: 'warning', lockScroll: false, center: true, customClass: 'custom-message-box'
          });
          return;
        }
        const isValid = await window.electronAPI.validateGamePath(settings.gamePath);
        if (!isValid) {
          ElMessageBox.alert('游戏路径无效，请检查设置', '路径验证失败', {
            confirmButtonText: 'OK', type: 'error', lockScroll: false, center: true, customClass: 'custom-message-box'
          });
          return;
        }
        console.log('启动游戏:', settings.gamePath);
        const result = await window.electronAPI.startGame(settings.gamePath);
        if (result.success) {
          ElMessageBox.alert('游戏启动成功！', '成功', {
            confirmButtonText: 'OK', lockScroll: false, type: 'success', center: true, customClass: 'custom-message-box'
          });
        } else {
          ElMessageBox.alert(result.error || '启动失败', '启动游戏失败', {
            confirmButtonText: 'OK', lockScroll: false, type: 'error', center: true, customClass: 'custom-message-box'
          });
        }
      } catch (err) {
        console.error('启动游戏失败:', err);
        ElMessageBox.alert(err.message || '启动游戏时发生错误', '错误', {
          confirmButtonText: 'OK', lockScroll: false, type: 'error', center: true, customClass: 'custom-message-box'
        });
      }
    },

    open_link(url) {
      window.electronAPI.openLink({ outLink: url })
    },

    async get_categories() { 
      try {
        const response = await apiService.getCategories()
        if (response.code === 200) {
          console.log('获取分类列表', response.data)
          this.categories = response.data
          if (!this.activeCategory && this.categories.length > 0) {
            this.activeCategory = this.categories[0];
          }
        }
      } catch (error) {
        console.error('获取分类失败:', error)
      }
    },

    async get_addons_list() {
      if (!this.activeCategory) {
        console.warn('get_addons_list called without an active category.');
        return;
      }
      let params = { ...this.search_form };
      params.category_id = this.activeCategory.id;
      console.log('params', params)

      this.main_loading = true
      this.main_loading_word = '加载插件列表...'
      this.download_progress = 0

      try {
        const res = await apiService.getAddonsList(params)
        if (res.code === 200) {
          let data = Array.isArray(res.data) ? [...res.data] : []
          console.log('tableData', data)
          if (data.length > 0) {
            data = data.map((item, index) => {
              const clone = { ...item } 
              clone.modified = new Date().toLocaleString()
              const baseKey = clone.id ?? clone.slug ?? clone.title ?? `idx-${index}`
              clone._key = `${String(baseKey)}-${index}`
              return clone
            })
          }
          this.tableData = data
        } else {
          console.log('获取插件列表失败:', res.message)
        }
      } catch (err) {
        console.error('获取插件列表错误:', err)
        ElMessageBox.alert(err.message || err, "错误", {
          confirmButtonText: 'OK', type: 'error', center: true, lockScroll: false, customClass: 'custom-message-box'
        })
      } finally {
        this.main_loading = false
      }
    },

    async down_addons(addon) {
      try {
        const id = addon?.row?.id || addon?.id
        if (!id) {
          ElMessage.error('缺少插件ID，无法获取下载地址')
          return
        }

        this.main_loading = true
        this.main_loading_word = '获取下载地址...'

        const response = await apiService.getAddonDownloadUrl(id)
        if (response.code !== 200) {
          throw new Error(response.message || '获取下载地址失败')
        }
        
        const downloadUrl = response.data?.download_url
        let file_list = response.data?.file_list

        if (typeof file_list === 'string') {
          try {
            const parsed = JSON.parse(file_list)
            file_list = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.file_list) ? parsed.file_list : [])
          } catch (e) {
            console.warn('file_list JSON 解析失败:', e)
            file_list = []
          }
        } else if (!Array.isArray(file_list)) {
          file_list = []
        }

        if (!downloadUrl) {
          throw new Error('接口未返回有效的下载地址')
        } 
        console.log('获取下载地址成功', file_list)
        
        const addonToDownload = addon.row;
        addonToDownload.down_link = downloadUrl
        addonToDownload.file_list = file_list
        addonToDownload.override_mode = addon.row.override_mode
        console.log('addonToDownload', addonToDownload)
        this.main_loading_word = '开始下载...'
        await WowAddons.down_addons(addonToDownload, this)
      } catch (e) {
        console.error('获取下载地址出错:', e)
        this.main_loading = false
        ElMessage.error(e.message || '获取下载地址失败')
      }
    },

    async get_clients_list(searchTitle = '') {
      try {
        const res = await apiService.getClientsList({ title: searchTitle })
        if (res.code === 200) {
          console.log('获取客户端列表成功', res)
          return res.data
        } else {
          console.log('获取客户端列表失败:', res.message)
          return []
        }
      } catch (err) {
        console.error('获取客户端列表错误:', err)
        return []
      }
    }
  }
})
