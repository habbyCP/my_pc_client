<template>
  <div class="common-layout" >
    <el-container>
      <el-container class="main_container"
                    v-loading="main_loading"
                    element-loading-background="rgba(0, 0, 0, 0.8)"
                    :element-loading-text="main_loading_word"
      >
      <el-aside width="150px">
        <el-menu
            :default-active= "version"
            class="el-menu-vertical-demo"
            @select="switch_version"
        >
          <el-menu-item index="2.43">
            <span>2.43 资料下载</span>
          </el-menu-item>
          <el-menu-item index="3.35">
            <span>3.35 资料下载</span>
          </el-menu-item>
        </el-menu>

      </el-aside>
        <el-container>
          <el-main>
            <el-table :data="tableData" stripe style="width: 100%">
              <el-table-column prop="" label=""  >
                <template #default="scope">
                  <el-image
                      width="100%"
                      :src="scope.row.imgList[0]"
                      :preview-src-list="scope.row.imgList">
                  </el-image>

                </template>
              </el-table-column>
              <el-table-column prop="title" width="200" label="插件" />
              <el-table-column prop="addons_version" label="版本号"/>
              <el-table-column prop="version" label="适配版本"/>
              <el-table-column prop="update_time" label="更新时间"/>
              <el-table-column label="下载" width="">
                <template #default="scope">
                  <el-button
                      v-show='scope.row.status  === 0'
                      size="small"
                      @click="down_addons(scope)">
                    下载
                  </el-button>

                  <el-button
                      v-show='scope.row.status  === 1'
                      size="small">
                    下载中...
                  </el-button>
                  <el-button
                      v-show='scope.row.status  === 2'
                      size="small">
                    已安装
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-main>
        </el-container>
      </el-container>
      <el-footer style="border-top:1px solid #e6e6e6">
        <el-row style="line-height: 10vh;font-size: 12px">
          <el-col :span="14">
              <div class="">
              <span style="margin-right: 20px">{{ this.wow_path }}</span>
              <el-button type="warning" size="small" @click="page_select_wow">设置wow.exe</el-button>
            </div>
          </el-col>
          <el-col :span="4"></el-col>
          <el-col :span="2">
<!--            <div>-->
<!--              <el-select-->
<!--                  v-model="server"-->
<!--                  placeholder="选择服务器"-->
<!--                  size="small"-->
<!--              >-->
<!--                <el-option-->
<!--                    v-for="item in server_list"-->
<!--                    :key="item.server"-->
<!--                    :label="item.title"-->
<!--                    :value="item.server"-->
<!--                />-->
<!--              </el-select>-->
<!--            </div>-->
          </el-col>
          <el-col :span="4"><div  style = "line-height: 9vh" class="grid-content bg-purple">
            <el-button  @click="start_wow"  type="success">启动游戏</el-button></div>
          </el-col>
        </el-row>
      </el-footer>
    </el-container>
  </div>
</template>

<script src="./table_list.js">
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
.el-table__cell {
  position: static !important;
}
.common-layout {
  height: 100vh;
}
.main_container {
  height: 90vh;
}
.el-aside .el-menu {
  height: 90vh;
}
.el-header{
    min-height: 5vh;
}
.el-main{
  margin: 0;
  padding: 0;
  min-height: 70vh;
}

</style>
