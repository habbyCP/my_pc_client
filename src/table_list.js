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
            search_form:{},
            detail_title:'',
            detail_text:'',
            menu_list: {
                "2.43": {"version": "2.43", "title": "2.43工具下载","category_id": 8,'wow_path':''},
                "3.35": {"version": "3.35", "title": "3.35工具下载","category_id": 9,'wow_path':''},
            },
            wow_path: "",
            main_loading_word: "加载中",
            main_loading: false,
            isDark: false,
            version: "",
            progress_dialog: false,
            tableData: [],
            version_data: {},
            title: "",
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
                    ElMessageBox.alert(err, "错误", {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                    })
                })

            }
        },

        //获取当前版本的可执行文件地址
        get_wow_exe: function (data) {
            return window.electronAPI.wowFilePath(data)
        },
        //判断目录是否重复
        is_duplicate_directory: function (data) {
            window.electronAPI.isDuplicateDirectory(data)
        },

        handle_select_wow: function () {
            this.select_wow_exe({version: this.version})
        },
        // 选择wow.exe文件
        select_wow_exe: async function (request_data) {
            if (Object.keys(request_data).length === 0) {
                request_data = {"version": this.version}
            }
            return await window.electronAPI.selectFile(request_data)
        },
        open_link: function (url) {
            window.electronAPI.openLink({outLink: url})
        },
        jump_kook: function () {
            window.electronAPI.openLink({outLink: "https://www.kookapp.cn/app/channels/6751610954578881/2870232716026733"})
        },
        jump_website: function () {
            window.electronAPI.openLink({outLink: "https://cn.stormforge.gg/cn"})
        },
        jump_my_site: function () {
            window.electronAPI.openLink({outLink: "https://www.9136347.com"})
        },
        // 下载插件
        down_addons: async function (data) {
            this.main_loading = true
            this.main_loading_word = '下载ing'
            if (this.wow_path === '') {
                ElMessageBox.alert('', '没有设置wow.exe路径', {
                    confirmButtonText: 'OK',
                    type: 'error',
                    center: true,
                }).finally(()=>{
                    this.main_loading = false
                })
            }else{
                let req = {"dir_list":[...data.row.dirList],"version":this.version}
                window.electronAPI.isDuplicateDirectory(req).then(res=>{
                    if(res.code===200){
                        if (res.data.length > 0) {
                            ElMessageBox.alert(res.data.join(',\n'), '目录会被覆盖，是否继续', {
                                confirmButtonText: 'OK',
                                type: 'error',
                                center: true,
                            }).then(() => {
                                let row = data.row
                                let down_data = {
                                    url: row.down_link,
                                    index: data.$index,
                                    title: row.title,
                                    version: this.version,
                                    addons_version: row.addons_version,
                                }
                                //执行下载
                                window.electronAPI.downloadFile(down_data)
                            })
                        }
                    }else{
                        this.main_loading = false
                        ElMessageBox.alert(res.data, res.message, {
                            confirmButtonText: 'OK',
                            type: 'error',
                            center: true,
                        })
                    }
                }).catch(error=>{
                    alert(error)
                })
            }


        },
        get_addons_list: function () {
            this.main_loading = true
            let url='https://www.9136347.com/api/addons_list?category_id=' + this.menu_list[this.version].category_id
            axios.get(url).then(response => {
                if (response.status !== 200) {
                    console.log(response)
                    this.main_loading = false
                } else {
                    const response_content = response.data
                    this.tableData = []
                    for (const key in response_content.data) {
                        let one = response_content.data[key]
                        console.log(one)
                        let dir_list = []
                        for (let one_dir of one.dir_list){
                             dir_list.push(one_dir.trim())
                        }
                        let one_data = {
                            imgList: one.pic_list,
                            title: one.title,
                            addons_version: one.version,
                            version: this.version,
                            text: one.text,
                            down_link: one.down_link,
                            update_time: format(new Date(one.modified * 1000), 'yyyy-MM-dd'),
                            status: 0,
                            progress: 0,
                            outLink: one.out_link,
                            dirList : dir_list,
                        }
                        this.tableData.push(one_data)
                    }
                    this.main_loading = false
                }

            }).catch(err => {
                console.log(err)
            })
        },
    }
}
