import { format } from "date-fns";
import axios from 'axios';

import LoginButtonWlk from "./components/login_button_wlk.vue";
export default {
    components:{
        LoginButtonWlk
    },
    name: 'AddonsList',
    props: {
        msg: String
    },
    data() {
        return {
            main_loading_word : "",
            main_loading:false,
            isDark: false,
            menu_index: "243_tools",
            progress_dialog:false,
            tableData: [
            ]
        }
    },
    created() {
        this.get_addons(this.menu_index)
    },

    watch: {
        msg(val) {
            console.log(val)
            //当a值变化时
            this.menu_index = val
        }
    },

    methods: {
        // 下载插件
        down_addons(data){
            this.tableData[data.$index].status = 1
            this.tableData[data.$index].progress = 0
            this.tableData[data.index].status_word = "启动下载"
            let down_data= {}
            let row = data.row
            down_data = {
                url: row.down_link,
                index: data.$index
            }
            console.log('下载数据1',down_data)
            //执行下载
            window.electronAPI.downloadFile(down_data)
            //进度反馈
            window.electronAPI.onDownloadProgress((event, item) => {
                if (item.progress ===100){
                    this.tableData[item.index].status = 2
                    return
                }
                this.tableData[item.index].status = 1
                this.tableData[item.index].progress = item.progress
                this.tableData[item.index].status_word = item.msg
            });
        },
        // down_cancel(row){
        //   console.log(row.$index)
        //   let down_data = {
        //     index: row.$index
        //   }
        //   window.electronAPI.cancelDownload(down_data)
        // },
        async get_addons(version){
            this.main_loading = true
            const response = await axios.get('https://mock.apipark.cn/m1/4651067-4301781-default/api/addons/list?version='+version+'&page');
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
                    version:one.version,
                    down_link :one.down_link,
                    update_time:format(new Date(one.update_time*1000), 'yyyy-MM-dd'),
                    status: 0,
                    progress: 0
                }
                this.tableData.push(one_data)
            }
            this.main_loading = false

        },

        handleClose() {
            alert(2)
        }
    }
}
