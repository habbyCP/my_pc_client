import axios from 'axios';
import { ElMessageBox, ElMessage } from 'element-plus'
import { mockApiService, shouldUseMock } from './mock/mockService.js'
import WowAddons from './wow_addons.js'

export default {
    data() {
        return {
            search_form: {
                title: ''
            },
            main_loading_word: "加载中",
            main_loading: false,
            download_progress: 0,
            version: localStorage.getItem("version") || "2.43",
            activeTab: '插件库', // 当前激活的顶部标签
            activeCategory: '全部插件', // 当前激活的左侧分类
            categories: [
                { id: '0', name: '全部插件', icon: 'Collection' },
            ]
        }
    },
    mounted() {
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
            } else if (tab === '客户端') {
                // 切换到客户端标签时加载客户端列表
                setTimeout(() => {
                    if (this.$refs.clientList) {
                        this.handleLoadClients()
                    }
                }, 100)
            }
        },

        // 切换左侧分类
        switchCategory(category, name) {
            this.activeCategory = name
            // 根据分类筛选插件列表
            this.get_addons_list(category)
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
                // 检查是否使用Mock模式
                const useMock = await shouldUseMock()
                if (useMock) {
                    console.log('使用Mock数据获取分类列表')
                    const response = await mockApiService.getCategories()
                    if (response.code === 200) {
                        this.categories = response.data
                    }
                } else { 
                    let url = `${import.meta.env.VITE_API_BASE_URL}/categories/list`
                    const response = await axios.get(url) 
                    if (response.data.code === 200) { 
                        console.log('获取分类列表', response.data.data)
                        this.categories = response.data.data
                    }
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
             
            let params = {
                title: this.search_form.title,
                page: 0,
                page_size: 100,
                category_id: category
            }

            // 显示加载遮罩
            this.main_loading = true
            this.main_loading_word = '加载插件列表...'
            this.download_progress = 0

            try { 
                let res
                 
                console.log('使用真实API获取插件列表')
                let url = `${import.meta.env.VITE_API_BASE_URL}/addons/list`
                const response = await axios.get(url, { params: params })
                res = response.data 
                
                if (res.code === 200) {
                    console.log('获取插件列表成功', res)
                    let tableData = Array.isArray(res.data) ? [...res.data] : []
                    console.log('tableData', tableData)
                    if (tableData.length > 0) {
                        // 为每个插件添加额外的显示信息（如果mock数据中没有的话）
                        tableData = tableData.map((item, index) => {
                            const clone = { ...item }
                            // 只在真实API数据中添加这些字段，mock数据中已经包含了
                            // clone.download_count = ((90 - index * 5) / 10).toFixed(1) + '万'
                            // clone.size = index === 2 ? '35.64MB' : (index % 3 === 0 ? (3 - index * 0.2).toFixed(2) + 'MB' : (400 + index * 20) + 'KB')
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
 
                const url = `${import.meta.env.VITE_API_BASE_URL}/addons/download_url/${id}`
                const response = await axios.get(url)
                if (response.data?.code !== 200) {
                    throw new Error(response.data?.message || '获取下载地址失败')
                }
                downloadUrl = response.data?.data?.download_url
                file_list = response.data?.data?.file_list
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
                const useMock = await shouldUseMock()
                let res
                
                if (useMock) {
                    console.log('使用Mock数据获取客户端列表')
                    res = await mockApiService.getClientsList({ title: searchTitle })
                } else {
                    console.log('使用真实API获取客户端列表')
                    // 真实API调用
                    const base = import.meta.env.VITE_API_BASE_URL
                    const url = base ? `${base}/articles` : '/articles'
                    const response = await axios.get(url, { params: { title: searchTitle } })
                    res = response.data
                }
                
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
