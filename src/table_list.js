import {format} from "date-fns";
import axios from 'axios';
import {ElMessageBox} from 'element-plus'

export default {
    components: {
        // LoginButtonWlk
    },
    name: 'AddonsList',
    props: {
        msg: ""
    },
    filters: {
        ellipsis (value) {
            if (!value) return ''
            if (value.length > 8) {
                return value.slice(0,8) + '...'
            }
            return value
        }
    },
    data() {
        return {
            detail_dialog:false,
            search_form:{
                title:''
            },
            detail_title:'',
            detail_text:'',
            // menu_list: {
            //     "2.43": {"version": "2.43", "title": "2.43工具下载","category_id": 8,'wow_path':''},
            //     "3.35": {"version": "3.35", "title": "3.35工具下载","category_id": 9,'wow_path':''},
            // },
            wow_path: "",
            main_loading_word: "加载中",
            main_loading: false,
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
                {id: 'all', name: '全部插件', icon: 'Collection'},
                {id: 'package', name: '整合包', icon: 'Files'},
                {id: 'turtle', name: '乌龟', icon: 'Avatar'},
                {id: 'raid', name: '副本&团队', icon: 'User'},
                {id: 'combat', name: '战斗', icon: 'Aim'},
                {id: 'buff', name: '增益&减益', icon: 'TrendCharts'},
                {id: 'quest', name: '任务', icon: 'List'},
                {id: 'pvp', name: 'PvP', icon: 'Aim'},
                {id: 'character', name: '角色', icon: 'User'},
                {id: 'pet', name: '宠物&坐骑', icon: 'Avatar'},
                {id: 'ui', name: '界面美化', icon: 'Picture'},
                {id: 'unit', name: '单位框架', icon: 'Monitor'},
                {id: 'action', name: '动作条', icon: 'Menu'},
                {id: 'bag', name: '背包&银行', icon: 'Suitcase'},
                {id: 'chat', name: '聊天', icon: 'ChatDotRound'},
                {id: 'mail', name: '邮箱', icon: 'Message'},
                {id: 'map', name: '地图', icon: 'Location'},
                {id: 'class', name: '职业', icon: 'User'},
                {id: 'commerce', name: '商业', icon: 'Goods'},
                {id: 'profession', name: '专业', icon: 'Tools'}
            ]
        }
    },
    created() {
        let version = this.get_version()
        window.electronAPI.allWowFilePath().then(res => {
                for (const key in this.menu_list) {
                    if (res.data.hasOwnProperty(key)) {
                        this.menu_list[key].wow_path = res.data[key]
                    }
                }
                this.wow_path = this.menu_list[version].wow_path
        })
        //初始化基本信息
        this.get_addons_list(version)
        //进度反馈
        window.electronAPI.onDownloadProgress((event, item) => {
            this.main_loading_word = '下载ing'
            if (item.code !== 200) {
                this.main_loading = false
                ElMessageBox.alert(item.data, item.code + ":" + item.message, {
                    type: 'error',
                    center: true,
                })
                console.log(item)
                return
            }
            if (item.data.progress === 100) {
                this.main_loading = false
                ElMessageBox.alert('', '下载完成', {
                    type: 'success',
                    center: true,
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
                this.get_addons_list()
            }
        },
        
        // 切换左侧分类
        switchCategory(category) {
            this.activeCategory = category
            // 根据分类筛选插件列表
            this.get_addons_list(this.version, category)
        },
        
        show_detail:function(data){
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
                let path_data = await this.get_wow_exe({version: version})
                console.log(path_data)
                if (path_data.code === 200) {
                    this.menu_list[version].wow_path = path_data.data
                }else if (path_data.code === 10404) {
                   let confirm = await ElMessageBox.alert("没有配置wow.exe路径", '请选择你的' + version + 'wow.exe路径', {
                        confirmButtonText: '现在去配置',
                        type: 'warning',
                        center: true,
                    })
                    if (confirm==='confirm'){
                        let path_data = await this.select_wow_exe({version: version})
                        console.log('path_data',path_data)
                        return ''
                    }
                }else{
                    alert(path_data.message)
                }

            }
        },
        //切换版本
        async switch_version(key) {
            this.version = key
            localStorage.setItem("version", key)
            this.get_addons_list(key)
            if (this.menu_list.hasOwnProperty(key)){
                this.wow_path = this.menu_list[key].wow_path
            }else{
                this.wow_path = ''
            }

        },
        //启动客户端
        start_wow: async function () {
            console.log('path',this.wow_path)
            if (this.wow_path === '') {
                await this.check_wow_path(this.version)
            }else{
                window.electronAPI.getRealmlist({version: this.version}).then(res => {
                    if (res.code !== 200) {
                        ElMessageBox.confirm(
                            res.message + ',不是有效的指向内容，点击确认修复为亚洲服务器',
                            'realmlist指向文件错误:',
                            {
                                confirmButtonText: 'OK',
                                cancelButtonText: 'Cancel',
                                type: 'warning',
                            }
                        ).then(() => {
                            window.electronAPI.fixRealmlist({version: this.version}).then(res => {
                                if (res.code === 200) {
                                    ElMessageBox.alert(res.message, "成功", {
                                        confirmButtonText: 'OK',
                                        type: 'success',
                                        center: true,
                                    }).then(() => {
                                        window.electronAPI.startWow({"version": this.version})
                                    }).catch(err => {
                                        ElMessageBox.alert(err, "错误", {
                                            confirmButtonText: 'OK',
                                            type: 'error',
                                            center: true,
                                        })
                                    })

                                } else {
                                    ElMessageBox.alert(res.data, data.message, {
                                        confirmButtonText: 'OK',
                                        type: 'error',
                                        center: true,
                                    })
                                }
                            }).catch(err => {
                                console.log('报错', err)
                                ElMessageBox.alert(err, "错误", {
                                    confirmButtonText: 'OK',
                                    type: 'error',
                                    center: true,
                                })
                            })
                        })
                    } else {
                        window.electronAPI.startWow({"version": this.version})
                    }
                }).catch(err => {
                    console.log('报错', err)
                    ElMessageBox.alert(err, "错误", {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
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
            this.select_wow_exe({version: this.version})
        },
        // 选择wow.exe文件
        select_wow_exe(request_data) {
            return window.electronAPI.selectFile(request_data)
        },
        open_link(url) {
            window.electronAPI.openLink({outLink: url})
        },
        jump_kook() {
            window.electronAPI.openLink({outLink: 'https://kook.top/K8G1ir'})
        },
        jump_website() {
            window.electronAPI.openLink({outLink: 'https://www.stormwow.com/'})
        },
        jump_frost() {
            window.electronAPI.openLink({outLink: 'https://www.stormwow.com/frost'})
        },
        // 下载插件
        down_addons(data) {
            let row = data.row
            this.main_loading = true
            this.main_loading_word = "下载中..."
            let version_data = {
                version: this.version
            }
            console.log('version_data', version_data)
            this.is_duplicate_directory(version_data).then(res => {
                if (res.code !== 200) {
                    this.main_loading = false
                    ElMessageBox.alert(res.message, res.code, {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                    })
                    return
                }
                if (res.data.is_duplicate) {
                    this.main_loading = false
                    ElMessageBox.confirm(
                        '检测到目录已存在，是否覆盖？',
                        '提示',
                        {
                            confirmButtonText: '覆盖',
                            cancelButtonText: '取消',
                            type: 'warning',
                        }
                    ).then(() => {
                        this.main_loading = true
                        this.main_loading_word = "下载中..."
                        window.electronAPI.downloadFile({
                            version: this.version,
                            id: row.id,
                            title: row.title,
                            cover: false
                        })
                    }).catch(() => {
                        this.main_loading = false
                    })
                } else {
                    window.electronAPI.downloadFile({
                        version: this.version,
                        id: row.id,
                        title: row.title,
                        cover: false
                    })
                }
            }).catch(err => {
                this.main_loading = false
                ElMessageBox.alert(err, "错误", {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                })
            })
        },
        get_addons_list(version, category) {
            if (version !== undefined) {
                this.version = version
            }
            let url = 'https://www.stormwow.com/api/addons/list'
            let params = {
                version: this.version,
                title: this.search_form.title,
                page: 1,
                page_size: 100
            }
            
            // 如果有分类参数，添加到请求中
            if (category && category !== '全部插件') {
                params.category = category
            }
            
            this.main_loading = true
            this.main_loading_word = "加载中..."
            
            // 模拟数据，实际项目中应该使用真实API
            // 这里我们创建一些模拟数据来展示界面效果
            setTimeout(() => {
                this.main_loading = false
                
                // 创建模拟数据
                const mockData = [];
                for (let i = 0; i < 20; i++) {
                    mockData.push({
                        id: i + 1,
                        title: `插件 ${i + 1} ${i % 3 === 0 ? '[整合包]' : ''}`,
                        text: `这是插件 ${i + 1} 的描述。这个插件可以帮助玩家更好地管理界面和游戏体验。${i % 2 === 0 ? '支持最新版本的游戏客户端。' : ''}${i % 3 === 0 ? '包含多个功能模块，适合新手和老手。' : ''}`,
                        pic_url: `https://picsum.photos/300/150?random=${i}`,
                        download_count: ((90 - i * 5) / 10).toFixed(1) + '万',
                        size: i === 2 ? '35.64MB' : (i % 3 === 0 ? (3 - i * 0.2).toFixed(2) + 'MB' : (400 + i * 20) + 'KB'),
                        update_time: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
                        installed: i % 5 === 1,
                        outLink: i % 7 === 0 ? 'https://www.stormwow.com' : '',
                        version: this.version
                    });
                }
                
                this.tableData = mockData;
            }, 500);
            
            // 注释掉实际API调用，使用模拟数据
            /*
            axios.get(url, {params: params}).then(res => {
                this.main_loading = false
                if (res.data.code === 200) {
                    this.tableData = res.data.data.list
                    // 为每个插件添加额外的显示信息
                    this.tableData.forEach((item, index) => {
                        // 随机生成下载量
                        item.download_count = ((90 - index * 5) / 10).toFixed(1) + '万'
                        // 随机生成体积
                        item.size = index === 2 ? '35.64MB' : (index % 3 === 0 ? (3 - index * 0.2).toFixed(2) + 'MB' : (400 + index * 20) + 'KB')
                        // 随机生成是否已安装
                        item.installed = index % 2 === 1
                    })
                } else {
                    ElMessageBox.alert(res.data.message, res.data.code, {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                    })
                }
            }).catch(err => {
                this.main_loading = false
                ElMessageBox.alert(err, "错误", {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                })
            })
            */
        }
    }
}
