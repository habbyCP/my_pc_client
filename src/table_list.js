import { ElMessageBox, ElMessage } from 'element-plus' 
import { apiService, initializeApiService } from './apiService.js'
import WowAddons from './wow_addons.js'
import { pa } from 'element-plus/es/locales.mjs'

export default {
    data() {
        return {
            search_form: {
                title: '',
                category_id: 0,
                sort_by: 'download',
            }, 
            main_loading_word: "加载中",
            main_loading: false,
            download_progress: 0,
            version: localStorage.getItem("version") || "2.43",
            activeTab: '插件库', // 当前激活的顶部标签
            activeCategory: '全部插件', // 当前激活的左侧分类
            categories: [
                // { id: '0', name: '全部插件', icon: 'Collection' },
            ],
            // 下列两个属性在方法中被使用/赋值，需预先声明
            tableData: [],
            category: undefined,
        }
    },
    async mounted() {
        await initializeApiService();
        // 监听下载进度
        window.electronAPI.onDownloadProgress((data) => {
            if (data && data.data) {
                this.download_progress = data.data.progress;
                this.main_loading_word = data.data.msg || "下载中...";
                console.log("下载进度:", this.download_progress + "%", this.main_loading_word); 
                
            }
        });
    },
    methods: {
        // 切换顶部标签
        switchTab(tab) { 
            this.activeTab = tab
            // 根据不同的标签加载不同的内容
            if (tab === '插件库') { 
                this.get_categories()
                this.get_addons_list()
            } else if (tab === '文件下载') {
                // 切换到客户端标签时加载客户端列表
                setTimeout(() => {
                    if (this.$refs.clientList) {
                        const comp = this.$refs.clientList
                        if (comp && typeof comp.handleLoadClients === 'function') {
                            comp.handleLoadClients()
                        }
                    }
                }, 100)
            }
        },

        // 切换左侧分类
        switchCategory(category) {
            this.category = category
            // 根据分类筛选插件列表
            this.get_addons_list()
        },

        //启动客户端
        start_wow: async function () { 
            try {
                // 获取设置中的游戏路径
                const settings = await window.electronAPI.getSettings();
                
                if (!settings.gamePath) {
                    ElMessageBox.alert('请先在设置中配置游戏路径', '游戏路径未配置', {
                        confirmButtonText: 'OK',
                        type: 'warning',
                        lockScroll: false,
                        center: true,
                        customClass: 'custom-message-box'
                    });
                    return;
                }
                
                // 验证路径是否有效
                const isValid = await window.electronAPI.validateGamePath(settings.gamePath);
                if (!isValid) {
                    ElMessageBox.alert('游戏路径无效，请检查设置', '路径验证失败', {
                        confirmButtonText: 'OK',
                        type: 'error',
                        lockScroll: false,
                        center: true,
                        customClass: 'custom-message-box'
                    });
                    return;
                }
                
                console.log('启动游戏:', settings.gamePath);
                
                // 启动游戏
                const result = await window.electronAPI.startGame(settings.gamePath);
                if (result.success) {
                    ElMessageBox.alert('游戏启动成功！', '成功', {
                        confirmButtonText: 'OK',
                        lockScroll: false,
                        type: 'success',
                        center: true,
                        customClass: 'custom-message-box'
                    });
                } else {
                    ElMessageBox.alert(result.error || '启动失败', '启动游戏失败', {
                        confirmButtonText: 'OK',
                        lockScroll: false,
                        type: 'error',
                        center: true,
                        customClass: 'custom-message-box'
                    });
                }
            } catch (err) {
                console.error('启动游戏失败:', err);
                ElMessageBox.alert(err.message || '启动游戏时发生错误', '错误', {
                    confirmButtonText: 'OK',
                    lockScroll: false,
                    type: 'error',
                    center: true,
                    customClass: 'custom-message-box'
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
                }
            } catch (error) {
                console.error('获取分类失败:', error)
            }
        },
        async get_addons_list(category) {
            if (category === undefined || category === null) {
                category = this.category
            }else{
                this.category = category
            }
            let params = this.search_form
            params.category_id = category.id
            console.log('params', params)

            // 显示加载遮罩
            this.main_loading = true
            this.main_loading_word = '加载插件列表...'
            this.download_progress = 0

            try { 
                const res = await apiService.getAddonsList(params) 
                if (res.code === 200) { 
                    let tableData = Array.isArray(res.data) ? [...res.data] : []
                    console.log('tableData', tableData)
                    if (tableData.length > 0) {
                        // 为每个插件添加额外的显示信息 
                        tableData = tableData.map((item, index) => {
                            const clone = { ...item }
                            clone.installed = index % 2 === 1
                            clone.modified = new Date().toLocaleString()
                            
                            // 生成稳定唯一 key
                            const baseKey = clone.id ?? clone.slug ?? clone.title ?? `idx-${index}`
                            clone._key = `${String(baseKey)}-${index}`
                            return clone
                        })
                    } 
                    // 更新本地数据
                    this.tableData = tableData
                } else {
                    console.log('获取插件列表失败:', res.message)
                }
            } catch (err) { 
                console.error('获取插件列表错误:', err)
                ElMessageBox.alert(err.message || err, "错误", {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                    lockScroll: false,
                    customClass: 'custom-message-box'
                })
                return []
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

                // 获取下载地址
                this.main_loading = true
                this.main_loading_word = '获取下载地址...'
 
                let downloadUrl = ''
                let file_list = []

                const response = await apiService.getAddonDownloadUrl(id)

                if (response.code !== 200) {
                    throw new Error(response.message || '获取下载地址失败')
                }
                downloadUrl = response.data?.download_url
                file_list = response.data?.file_list
                // 服务端可能返回 JSON 字符串，这里做健壮解析，确保为数组
                if (typeof file_list === 'string') {
                    try {
                        const parsed = JSON.parse(file_list)
                        if (Array.isArray(parsed)) {
                            file_list = parsed
                        } else if (parsed && Array.isArray(parsed.file_list)) {
                            file_list = parsed.file_list
                        } else {
                            file_list = []
                        }
                    } catch (e) {
                        console.warn('file_list JSON 解析失败:', e)
                        file_list = []
                    }
                } else if (!Array.isArray(file_list)) {
                    // 如果不是字符串也不是数组，兜底为空数组
                    file_list = []
                }
                if (!downloadUrl) {
                    throw new Error('接口未返回有效的下载地址')
                }
       
                console.log('获取下载地址成功', file_list)
                // 写回供下载逻辑使用
                if (addon.row) {
                    addon.row.down_link = downloadUrl
                    // 回写解析后的 file_list，供后续目录冲突检查使用
                    addon.row.file_list = file_list
                } else {
                    addon.down_link = downloadUrl
                } 

                this.main_loading_word = '开始下载...'
                await WowAddons.down_addons(addon, this)
            } catch (e) {
                console.error('获取下载地址出错:', e)
                this.main_loading = false
                ElMessage.error(e.message || '获取下载地址失败')
            }
        },
        // 获取客户端列表
        async get_clients_list(searchTitle = '') {
            try {
                // 检查是否使用Mock模式 
                let res
                res = await apiService.getClientsList({ title: searchTitle })
                
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
}
