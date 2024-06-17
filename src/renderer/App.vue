<template>
  <!--  <img alt="Vue logo" src="../assets/logo.png">-->
  <div class="common-layout" v-loading="main_loading"     :element-loading-text="main_loading_word">
    <el-container>
      <el-aside width="150px">
        <el-menu
            default-active=1
            class="el-menu-vertical-demo"
            @select="handleOpen"
            @close="handleClose"
        >
          <el-menu-item index=1>
            <span>2.43客户端</span>
          </el-menu-item>
          <el-menu-item index="2">
            <span>3.35客户端</span>
          </el-menu-item>
          <el-menu-item index="3">
            <span>2.43插件</span>
          </el-menu-item>
          <el-menu-item index="4">
            <span>3.35插件</span>
          </el-menu-item>
        </el-menu>

      </el-aside>
      <el-container>
        <el-header>
          <ClientList v-if="menu_index === '1'"  msg = "2.43客户端"/>
          <ClientList v-if="menu_index === '2'"  msg = "3.35客户端"/>
          <AddonsList v-if="menu_index === '3'"  msg = "2.43插件"/>
          <AddonsList v-if="menu_index === '4'"  msg = "3.35插件"/>
        </el-header>
        <el-main>
          <el-table :data="tableData"   stripe style="width: 100%">
            <el-table-column prop="" label="头像"  >
              <template #default="scope">
                <img alt="" :src="scope.row.img" width="100" height="50"/>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="插件" />
            <el-table-column prop="version" label="版本号" width="180"/>
            <el-table-column prop="update_time" label="更新时间"/>
            <el-table-column label="下载">
              <template #default="scope">
                <el-button size="small" @click="down_addons(scope.row)">
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-main>
        <el-footer>Footer</el-footer>
      </el-container>
    </el-container>
  </div>
  <el-dialog @close="down_cancel()"  v-model="progress_dialog" >
    <my-progress percentage = 20 />
  </el-dialog>
</template>

<script>

import AddonsList from './components/addons_list.vue'
import ClientList from './components/client_list.vue'
import MyProgress from './components/Progress.vue'
import axios from 'axios';
import { format } from 'date-fns';

export default {
  name: 'App',
  components: {
    AddonsList,
    ClientList,
    MyProgress
  },
  data() {
    return {
      main_loading_word : "",
      main_loading:false,
      isDark: false,
      menu_index: "1",
      progress_dialog:false,
      options: [
        {
          value: 'Option1',
          label: 'Option1',
        },
        {
          value: 'Option2',
          label: 'Option2',
        }],
      tableData: [
      ]
    }
  },
  created() {
    this.get_addons(this.menu_index)
  },
  methods: {
    down_addons(b){
      // console.log(window.electronAPI)
      console.log(b.down_link)
      this.progress_dialog = true
      // window.electronAPI.downloadFile("https://cdn.wow-china.gg/clients/TBC_335/Full.zip");
      // // window.electronAPI.downloadFile("https://cdn.wowlibrary.com/clients/TBC-2.4.3.8606-enGB-Repack.zip")
      // window.electronAPI.onDownloadProgress((event, item) => {
      //   console.log(item)
      // });

    },
    down_cancel(){
      alert(1)
        window.electronAPI.cancelDownload()
    },
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
        }
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
.el-main{
  margin: 0;
  padding: 0;
  min-height: 70vh;
  border: #2c3e50 1px;
}

</style>
