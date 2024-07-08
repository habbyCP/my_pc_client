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
            menu_list: {
                "2.43": {"version": "2.43", "title": "2.43工具下载"},
                "3.35": {"version": "3.35", "title": "3.35工具下载"}
            },
            path: "",
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
        //this.初始化()
        this.get_addons(this.get_version())
        // this.get_wow_exe()

        //进度反馈
        window.electronAPI.onDownloadProgress((event, item) => {
            console.log("进度返回值 : ", item.data)
            if (item.code !== 200) {
                this.main_loading = false
                alert("下载失败")
                return
            }
            if (item.data.progress === 100) {
                this.main_loading = false
                return
            }
            // this.main_loading_word = "12312"
        });
    },
    methods: {
        get_version() {
            this.version = localStorage.getItem("version")
            if (this.version == null) {
                this.version = "2.43"
                localStorage.setItem("version", this.version)
            }
            console.log("版本号", this.version)
            return this.version
        },
        handleOpen(key) {
            this.version = key
            localStorage.setItem("version", key)
            this.get_addons(key)
        },
        //启动客户端
        start_wow: function () {
            window.electronAPI.startWow({"version": this.version})
        },

        //获取当前版本的可执行文件地址
        get_wow_exe: function (data) {
            return window.electronAPI.wowFilePath(data)
        },
        // 下载插件
        down_addons(data) {
            this.get_wow_exe({version: this.version}).then((res) => {
                console.log(res)
                if (res.code !== 200) {
                    ElMessageBox.alert(res.message, '错误', {
                        confirmButtonText: 'OK',
                        type: 'warning',
                        center: true,
                    }).then(r => {
                        alert('配置')
                    }).catch(c => {})//cancel
                } else {
                    let down_data = {}
                    let row = data.row
                    down_data = {
                        url: row.down_link,
                        index: data.$index,
                        title: row.title,
                        version: this.version,
                        addons_version: row.addons_version,
                    }
                    console.log('下载数据1', down_data)
                    //执行下载
                    window.electronAPI.downloadFile(down_data)
                }
            }).catch((error) => {
                ElMessageBox.alert(error)
            })

        },
        get_addons(version) {
            if (version == null) {
                version = this.get_version()
            }
            this.main_loading = true
            axios.get('https://mock.apipark.cn/m1/4651067-4301781-default/api/addons/list?version=' + this.version + '&page').then(response => {
                if (response.status !== 200) {
                    console.log(response)
                    this.main_loading = false
                } else {
                    const response_content = response.data
                    this.tableData = []
                    for (const key in response_content.data) {
                        let one = response_content.data[key]
                        let one_data = {
                            imgList: one.img_list,
                            title: one.title,
                            addons_version: one.version,
                            version: this.version,
                            down_link: one.down_link,
                            update_time: format(new Date(one.update_time * 1000), 'yyyy-MM-dd'),
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
