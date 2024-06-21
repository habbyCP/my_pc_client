<template>
  <div class="common-layout"      :element-loading-text="main_loading_word">
    <el-container>
      <el-aside width="150px">
        <el-menu
            default-active=1
            class="el-menu-vertical-demo"
            @select="handleOpen"
            @close="handleClose"
        >
          <el-menu-item index=1>
            <span>2.43 工具</span>
          </el-menu-item>
          <el-menu-item index="2">
            <span>3.35 工具</span>
          </el-menu-item>
          <el-menu-item index="3">
            <span>2.43 插件</span>
          </el-menu-item>
          <el-menu-item index="4">
            <span>3.35 插件</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header >
          <div>
            <ClientList v-if="menu_index === '1'"  msg = "2.43 clients"/>
            <ClientList v-if="menu_index === '2'"  msg = "3.35 clients"/>
            <AddonsList v-if="menu_index === '3'"  msg = "2.43 addons"/>
            <AddonsList v-if="menu_index === '4'"  msg = "3.35 addons"/>
          </div>
        </el-header>
        <el-main v-loading="main_loading">
          <el-table :data="tableData"   stripe style="width: 100%">
            <el-table-column prop="" label="头像"  >
              <template #default="scope">
                <img alt="" v-show='!scope.row.show_p' :src="scope.row.img" width="100" height="60"/>
                <div class="demo-progress" style="margin-left: 25%">
                <el-progress
                    type="circle"
                    width = 50
                    v-show='scope.row.show_p'
                    :text-inside="true"
                    :stroke-width="8"
                    :percentage= scope.row.progress
                    status="exception"
                />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="插件" />
            <el-table-column prop="version" label="版本号"/>
            <el-table-column prop="update_time" label="更新时间"/>
            <el-table-column label="下载" width="150">
              <template #default="scope">
                <el-button
                    v-show='scope.row.show_p  === false'
                    size="small"
                    @click="down_addons(scope)">
                  下载
                </el-button>

                <el-button
                    v-show='scope.row.show_p  === true'
                    size="small">
                  下载中...
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-main>
        <el-footer>
          <LoginButtonWlk/>


        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<script>

import AddonsList from './components/addons_list.vue'
import ClientList from './components/client_list.vue'
import MyProgress from './components/Progress.vue'
import axios from 'axios';
import { format } from 'date-fns';
import LoginButtonWlk from "./components/login_button_wlk.vue";
export default {
  name: 'App',
  components: {
    LoginButtonWlk,
    AddonsList,
    ClientList,
    MyProgress,

  },
  data() {
    return {
      main_loading_word : "",
      main_loading:false,
      isDark: false,
      menu_index: "1",
      progress_dialog:false,
      tableData: [
      ]
    }
  },
  created() {
    this.get_addons(this.menu_index)
  },
  methods: {
    // 下载插件
    down_addons(data){
      this.tableData[data.$index].show_p = true
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
        this.tableData[item.index].show_p = true
        this.tableData[item.index].progress = item.progress
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
          show_p: false,
          progress: 0
        }
        // console.log(one_data)
        this.tableData.push(one_data)
      }
      this.main_loading = false

    },
    // eslint-disable-next-line no-unused-vars
    handleOpen(key) {
      this.get_addons()
      this.menu_index = key
    },
    handleClose() {
      alert(2)
    }
  }
}

</script>

<style>
html, body, #app {
  height: 100vh;
  overflow: hidden;
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.common-layout .el-container {
  height: 100vh;
}

.el-aside .el-menu {
  height: 100vh;
}
.el-header{
    min-height: 15vh;
}
.el-main{
  margin: 0;
  padding: 0;
  min-height: 70vh;
}

</style>
