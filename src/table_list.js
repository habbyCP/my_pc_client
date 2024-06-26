import { format } from "date-fns";
import axios from 'axios';

import LoginButtonWlk from "./components/login_button_wlk.vue";
import {inject} from "vue";
export default {
    components:{
        LoginButtonWlk
    },
    name: 'AddonsList',
    props: {
        msg: ""
    },
    data() {
        return {
            menu_index:this.msg,
            path: "",
            main_loading_word : "",
            main_loading:false,
            isDark: false,
            version:"",
            progress_dialog:false,
            tableData: [
            ],
            version_data:{},
            title:"",
        }
    },
    created() {
        this.get_version_list()
        this.get_addons()
        this.get_wow_exe()
        //进度反馈
        window.electronAPI.onDownloadProgress((event, item) => {
            console.log(item.code)
            let data = item.data
            if (item.code!==200){
                alert("下载失败:"+item.msg)
                this.tableData[data.index].status = 0
                return
            }
            if (item.data.progress ===100){
                this.tableData[data.index].status = 2
                return
            }
            this.tableData[data.index].status = 1
            this.tableData[data.index].progress = item.data.progress
            this.tableData[data.index].status_word = item.data.msg
        });
    },

    methods: {
        //启动客户端
        start_wow:function (){
            window.electronAPI.startWow({"version": this.version})
        },

        //获取当前版本的可执行文件地址
        get_wow_exe: function () {
            window.electronAPI.wowFilePath({"version": this.version}).then(data=>{
                console.log("查询路径的返回值：",data)
            }).catch(err=>{
                console.log(err)
            })

        },
        get_version_list(){
            let json_string = localStorage.getItem('version_list')
            this.version_data = JSON.parse(json_string)[this.menu_index]
        },
        // 下载插件
        down_addons(data){
            this.tableData[data.$index].status = 1
            this.tableData[data.$index].progress = 0
            // this.tableData[data.index].status_word = '启动下载'
            let down_data= {}
            let row = data.row
            down_data = {
                url: row.down_link,
                index: data.$index,
                title: row.title,
                version: this.version,
                addons_version: row.addons_version,
            }
            console.log('下载数据1',down_data)
            //执行下载
            window.electronAPI.downloadFile(down_data)

        },
        // down_cancel(row){
        //   console.log(row.$index)
        //   let down_data = {
        //     index: row.$index
        //   }
        //   window.electronAPI.cancelDownload(down_data)
        // },
        async get_addons(){
            this.version = this.version_data.version
            this.main_loading = true
            const response = await axios.get('https://mock.apipark.cn/m1/4651067-4301781-default/api/addons/list?version='+this.version+'&page');
            let response_content;
            if(response.status!==200){
                return
            }else{
                response_content = response.data
            }

            this.tableData = []
            for (const key in response_content.data) {
                let one = response_content.data[key]
                let one_data= {
                    img:one.img_list[0],
                    title:one.title,
                    addons_version:one.version,
                    version:this.version,
                    down_link :one.down_link,
                    update_time:format(new Date(one.update_time*1000), 'yyyy-MM-dd'),
                    status: 0,
                    progress: 0,
                    status_word:'111',
                }
                this.tableData.push(one_data)
            }
            this.main_loading = false

        },
    }
}
