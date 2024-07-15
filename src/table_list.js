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
    data() {
        return {
            detail_dialog:false,
            search_form:{},
            detail_title:'',
            detail_text:'',
            menu_list: {
                "2.43": {"version": "2.43", "title": "2.43工具下载","category_id":8},
                "3.35": {"version": "3.35", "title": "3.35工具下载","category_id":9}
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
        //初始化基本信息
        this.get_addons_list(this.get_version())
        //进度反馈
        window.electronAPI.onDownloadProgress((event, item) => {
            // console.log("进度返回值 : ", item.data)
            this.main_loading_word = '下载ing'
            if (item.code !== 200) {
                this.main_loading = false
                alert("下载失败")
                return
            }
            if (item.data.progress === 100) {
                this.main_loading = false
                ElMessageBox.alert('','下载完成', {
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

            if(item.code===200){
                type = 'success'
            }else{
                type = 'error'
            }

            ElMessageBox.alert(item.data, item.code + ":" + item.message, {
                type: type,
                center: true,
            })
            if (item.hasOwnProperty('sub_code') && item.sub_code===20100){
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
            window.electronAPI.wowFilePath({version: this.version}).then((res) => {
                if (res.code === 200) {
                    this.wow_path = res.data
                }
            }).catch((err) => {
                console.log(err)
            })
            return this.version
        },
        switch_version(key) {
            this.version = key
            localStorage.setItem("version", key)
            this.get_addons_list(key)
            this.get_wow_exe({version: key}).then((res) => {
                console.log(res)
                if (res.code === 200) {
                    this.wow_path = res.data
                } else {
                    this.wow_path = ""
                    if (res.code === 10404) {
                        ElMessageBox.alert("没有配置wow.exe路径", '请选择你的' + this.version + 'wow.exe路径', {
                            confirmButtonText: '现在去配置',
                            type: 'warning',
                            center: true,
                        }).then(() => {
                            this.select_wow_exe({version: this.version})

                        })
                    } else {
                        alert(res.message)
                    }

                }
            }).catch((err) => {

            })
        },
        //启动客户端
        start_wow: async function () {
            let version_data = await this.get_wow_exe({version: this.version})
            if (version_data.code !== 200) {
                if (version_data.code === 10404) {
                    ElMessageBox.alert("没有配置wow.exe路径", '请选择你的' + this.version + 'wow.exe路径', {
                        confirmButtonText: '现在去配置',
                        type: 'warning',
                        center: true,
                    }).then(() => {
                        this.select_wow_exe({version: this.version})
                    })
                } else {
                    await ElMessageBox.alert(version_data.message, "错误", {
                        confirmButtonText: 'OK',
                        type: 'error',
                        center: true,
                    })
                }
                return
            }
            window.electronAPI.getRealmlist({version: this.version}).then(res => {
                if (res.code !== 200) {
                    ElMessageBox.confirm(
                        res.data + ',不是有效的指向内容，点击确认修复为亚洲服务器',
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
        },

        //获取当前版本的可执行文件地址
        get_wow_exe: function (data) {
            return window.electronAPI.wowFilePath(data)
        },
        handle_select_wow: function () {
            this.select_wow_exe({version: this.version})
        },
        // 选择wow.exe文件
        select_wow_exe: function (request_data) {
            if (Object.keys(request_data).length === 0) {
                request_data = {"version": this.version}
            }
            window.electronAPI.selectFile(request_data)
        },
        // 下载插件
        down_addons: async function (data) {
            this.main_loading = true
            this.get_wow_exe({version: this.version}).then(download_return=>{
                // 需要配置wow.exe路径
                if (download_return.code === 10404) {
                    ElMessageBox.alert('请选择你的' + this.version + 'wow.exe路径', "没有配置wow.exe路径", {
                        confirmButtonText: '去配置',
                        type: 'warning',
                        center: true,
                    }).then(() => {
                        this.select_wow_exe({version: this.version})
                    }).catch(() => {

                    }).finally(() => {
                        this.main_loading = false
                    })

                } else if (download_return.code === 200) {
                    let down_data = {}
                    let row = data.row
                    down_data = {
                        url: row.down_link,
                        index: data.$index,
                        title: row.title,
                        version: this.version,
                        addons_version: row.addons_version,
                    }
                    console.log('下载数据', down_data)
                    //执行下载
                    window.electronAPI.downloadFile(down_data)
                }
                console.log(download_return)
            }).catch(err=>{
                console.log(err.msg)
            })
            

        },
        get_addons_list: function (version) {
            if (version == null) {
                version = this.get_version()
            }
            this.main_loading = true
            let url='https://www.9136347.com/api/addons_list?category_id=' + this.menu_list[this.version].category_id
            console.log(url)
            axios.get(url).then(response => {
                if (response.status !== 200) {
                    console.log(response)
                    this.main_loading = false
                } else {
                    const response_content = response.data
                    console.log('下载内容',response.data)
                    this.tableData = []
                    for (const key in response_content.data) {
                        let one = response_content.data[key]
                        console.log(one)
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
                            status_word: '111',
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
