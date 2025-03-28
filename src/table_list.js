import { format } from "date-fns";
import axios from 'axios';
import { ElMessageBox } from 'element-plus'

export default {
    components: {
        // LoginButtonWlk
    },
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
            if (this.wow_path === '') {
                await this.check_wow_path(this.version)
            } else {
                window.electronAPI.getRealmlist({ version: this.version }).then(res => {
                    if (res.code !== 200) {
                        ElMessageBox.confirm(
                            res.message + ',不是有效的指向内容，点击确认修复为亚洲服务器',
                            'realmlist指向文件错误:',
                            {
                                confirmButtonText: 'OK',
                                cancelButtonText: 'Cancel',
                                type: 'warning',
                                customClass: 'custom-message-box',
                                distinguishCancelAndClose: true,
                                center: true
                            }
                        ).then(() => {
                            window.electronAPI.fixRealmlist({ version: this.version }).then(res => {
                                if (res.code === 200) {
                                    ElMessageBox.alert(res.message, "成功", {
                                        confirmButtonText: 'OK',
                                        type: 'success',
                                        center: true,
                                        customClass: 'custom-message-box'
                                    }).then(() => {
                                        window.electronAPI.startWow({ "version": this.version })
                                    }).catch(err => {
                                        ElMessageBox.alert(err, "错误", {
                                            confirmButtonText: 'OK',
                                            type: 'error',
                                            center: true,
                                            customClass: 'custom-message-box'
                                        })
                                    })

                                } else {
                                    ElMessageBox.alert(res.data, res.message, {
                                        confirmButtonText: 'OK',
                                        type: 'error',
                                        center: true,
                                        customClass: 'custom-message-box'
                                    })
                                }
                            }).catch(err => {
                                console.log('报错', err)
                                ElMessageBox.alert(err, "错误", {
                                    confirmButtonText: 'OK',
                                    type: 'error',
                                    center: true,
                                    customClass: 'custom-message-box'
                                })
                            })
                        })
                    } else {
                        window.electronAPI.startWow({ "version": this.version })
                    }
                }).catch(err => {
                    console.log('报错', err)
                    ElMessageBox.alert(err, "错误", {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                        customClass: 'custom-message-box'
                    })
                })
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
            let url = `${import.meta.env.VITE_API_BASE_URL}/categories/list`
            try {
                const response = await axios.get(url)
                if (response.data.code === 200) { 
                    this.categories = response.data.data
                    // this.categories.unshift({ id: '0', name: '全部插件', icon: 'Collection' })
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
            
            console.log('获取插件列表', category)
            
            let url = `${import.meta.env.VITE_API_BASE_URL}/addons/list`
            let params = {
                title: this.search_form.title,
                page: 0,
                page_size: 100,
                category_id: category
            }


            // this.main_loading = true
            // this.main_loading_word = "加载中..."
            try { 
                const res = await axios.get(url, { params: params }) 
                // this.main_loading = false
                
                if (res.data.code === 200) {
                    console.log('获取插件列表成功', res.data)
                    const tableData = res.data.data
                    if (Array.isArray(res.data.data) && res.data.data.length > 0) {
                        
                        // 为每个插件添加额外的显示信息
                        tableData.forEach((item, index) => {
                            // 随机生成下载量
                            item.download_count = ((90 - index * 5) / 10).toFixed(1) + '万'
                            // 随机生成体积
                            item.size = index === 2 ? '35.64MB' : (index % 3 === 0 ? (3 - index * 0.2).toFixed(2) + 'MB' : (400 + index * 20) + 'KB')
                            // 随机生成是否已安装
                            item.installed = index % 2 === 1
                            item.modified = new Date().toLocaleString()
                        })
                    }
  
                    // 更新本地数据并返回
                    this.tableData = tableData
                    // return tableData
                } else {
                    // ElMessageBox.alert(res.data.message, res.data.code, {
                    //     confirmButtonText: 'OK',
                    //     type: 'error',
                    //     center: true,
                    //     customClass: 'custom-message-box'
                    // })
                    // return []
                }
            } catch (err) { 
                this.main_loading = false
                ElMessageBox.alert(err, "错误", {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                    customClass: 'custom-message-box'
                })
                return []
            }
        }
    }
}
