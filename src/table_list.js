import { format } from "date-fns";
import axios from 'axios';
import { ElMessageBox } from 'element-plus'
import { mockApiService, shouldUseMock } from './mock/mockService.js'

export default {
    components: {
        // LoginButtonWlk
    },
    tableData: [],
    categories: [],
    name: 'AddonsList',
    props: {
        msg: ""
    },
    filters: {
        ellipsis(value) {
            if (!value) return ''
            if (value.length > 8) {
                return value.slice(0, 8) + '...'
            }
            return value
        }
    },
    data() {
        return {
            detail_dialog: false,
            search_form: {
                title: ''
            },
            detail_title: '',
            detail_text: '',
            // menu_list: {
            //     "2.43": {"version": "2.43", "title": "2.43工具下载","category_id": 8,'wow_path':''},
            //     "3.35": {"version": "3.35", "title": "3.35工具下载","category_id": 9,'wow_path':''},
            // },
            wow_path: "",
            main_loading_word: "加载中",
            main_loading: false,
            download_progress: 0,
            isDark: false,
            version: localStorage.getItem("version") || "2.43",
            progress_dialog: false,
            tableData: [],
            version_data: {},
            title: "",
            // 新增数据
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
    created() {
        return
        let version = this.get_version()
        window.electronAPI.allWowFilePath().then(res => {
            for (const key in this.menu_list) {
                if (res.data.hasOwnProperty(key)) {
                    this.menu_list[key].wow_path = res.data[key]
                }
            }
            this.wow_path = ""
        })
        //初始化基本信息
        this.get_addons_list(version)
        //进度反馈
        window.electronAPI.onDownloadProgress((event, item) => {
            this.main_loading_word = '下载ing'
            if (item.code !== 200) {
                this.main_loading = false
                ElMessageBox.alert(item.data, item.code + ":" + item.message, {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                    customClass: 'custom-message-box'
                })
                console.log(item)
                return
            }
            if (item.data.progress === 100) {
                this.main_loading = false
                ElMessageBox.alert('', '下载完成', {
                    confirmButtonText: 'OK',
                    type: 'success',
                    center: true,
                    customClass: 'custom-message-box'
                })

            }
            // this.main_loading_word = "12312"
        });
        window.electronAPI.onResponse((event, item) => {
            console.log("服务器返回 : ", item)
            this.main_loading = false
            let type

            if (item.code === 200) {
                type = 'success'
            } else {
                type = 'error'
            }

            ElMessageBox.alert(item.data, item.code + ":" + item.message, {
                type: type,
                center: true,
                customClass: 'custom-message-box'
            })
            if (item.hasOwnProperty('sub_code') && item.sub_code === 20100) {
                this.menu_list[this.version].wow_path = item.data
                this.wow_path = item.data
            }
        })
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

        show_detail: function (data) {
            this.detail_title = data.title
            this.detail_text = data.text
            this.detail_dialog = true
        },
        get_version() {
            this.version = localStorage.getItem("version")
            if (this.version == null) {
                this.version = "2.43"
                localStorage.setItem("version", this.version)
            }
            return this.version
        },
        async check_wow_path(version) {
            if (this.menu_list[version].wow_path === '') {
                let path_data = await this.get_wow_exe({ version: version })
                console.log(path_data)
                if (path_data.code === 200) {
                    this.menu_list[version].wow_path = path_data.data
                } else if (path_data.code === 10404) {
                    let confirm = await ElMessageBox.alert("没有配置wow.exe路径", '请选择你的' + version + 'wow.exe路径', {
                        confirmButtonText: '现在去配置',
                        type: 'warning',
                        center: true,
                        customClass: 'custom-message-box'
                    })
                    if (confirm === 'confirm') {
                        let path_data = await this.select_wow_exe({ version: version })
                        console.log('path_data', path_data)
                        return ''
                    }
                } else {
                    ElMessageBox.alert(path_data.message, path_data.code, {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                        customClass: 'custom-message-box'
                    })
                }

            }
        },
        //切换版本
        // async switch_version(key) {
        //     this.version = key
        //     localStorage.setItem("version", key)
        //     this.get_addons_list(key)
        //     if (this.menu_list.hasOwnProperty(key)) {
        //         this.wow_path = this.menu_list[key].wow_path
        //     } else {
        //         this.wow_path = ''
        //     }

        // },
        //启动客户端
        start_wow: async function () { 
            try {
                // 获取设置中的游戏路径
                const settings = await window.electronAPI.getSettings();
                
                if (!settings.gamePath) {
                    ElMessageBox.alert('请先在设置中配置游戏路径', '游戏路径未配置', {
                        confirmButtonText: 'OK',
                        type: 'warning',
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
                        type: 'success',
                        center: true,
                        customClass: 'custom-message-box'
                    });
                } else {
                    ElMessageBox.alert(result.error || '启动失败', '启动游戏失败', {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                        customClass: 'custom-message-box'
                    });
                }
            } catch (err) {
                console.error('启动游戏失败:', err);
                ElMessageBox.alert(err.message || '启动游戏时发生错误', '错误', {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                    customClass: 'custom-message-box'
                });
            }
        },
        // 获取当前版本的可执行文件地址
        get_wow_exe(data) {
            return window.electronAPI.wowFilePath(data)
        },
        // 判断目录是否重复
        is_duplicate_directory(data) {
            return window.electronAPI.isDuplicateDirectory(data)
        },

        handle_select_wow() {
            this.select_wow_exe({ version: this.version })
        },
        // 选择wow.exe文件
        select_wow_exe(request_data) {
            return window.electronAPI.selectFile(request_data)
        },
        open_link(url) {
            window.electronAPI.openLink({ outLink: url })
        },
        jump_kook() {
            window.electronAPI.openLink({ outLink: 'https://kook.top/K8G1ir' })
        },
        jump_website() {
            window.electronAPI.openLink({ outLink: 'https://www.stormwow.com/' })
        },
        jump_frost() {
            window.electronAPI.openLink({ outLink: 'https://www.stormwow.com/frost' })
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

            try {
                // 检查是否使用Mock模式
                const useMock = await shouldUseMock()
                let res
                
                if (useMock) {
                    console.log('使用Mock数据获取插件列表')
                    res = await mockApiService.getAddonsList(params)
                } else {
                    console.log('使用真实API获取插件列表')
                    let url = `${import.meta.env.VITE_API_BASE_URL}/addons/list`
                    const response = await axios.get(url, { params: params })
                    res = response.data
                }
                
                if (res.code === 200) {
                    console.log('获取插件列表成功', res)
                    let tableData = Array.isArray(res.data) ? [...res.data] : []
                    console.log('tableData', tableData)
                    if (tableData.length > 0) {
                        // 为每个插件添加额外的显示信息（如果mock数据中没有的话）
                        tableData = tableData.map((item, index) => {
                            const clone = { ...item }
                            // 只在真实API数据中添加这些字段，mock数据中已经包含了
                            if (!useMock) {
                                clone.download_count = ((90 - index * 5) / 10).toFixed(1) + '万'
                                clone.size = index === 2 ? '35.64MB' : (index % 3 === 0 ? (3 - index * 0.2).toFixed(2) + 'MB' : (400 + index * 20) + 'KB')
                                clone.installed = index % 2 === 1
                                clone.modified = new Date().toLocaleString()
                            }
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
                this.main_loading = false
                console.error('获取插件列表错误:', err)
                ElMessageBox.alert(err.message || err, "错误", {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                    customClass: 'custom-message-box'
                })
                return []
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
                    // 真实API调用 - 暂时使用mock数据
                    res = await mockApiService.getClientsList({ title: searchTitle })
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
