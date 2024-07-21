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
          <el-header>
            <el-row :gutter="24" style="line-height: var(--el-header-height);">
              <el-col :span="10"></el-col>
              <el-col :span="8"><el-input v-model="search_form.title" style="width: 100%" size="small" placeholder="插件名查找" /> </el-col>
              <el-col :span="2"><div class="grid-content ep-bg-purple" /><el-button type="primary" size="small" @click="onSubmit">搜索</el-button></el-col>
              <el-col :span="1"></el-col>
            </el-row>
          </el-header>
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

              <el-table-column  width="200">
                <template #default="scope">
                  <div style="height: 100%;" @click="show_detail(scope.row)">{{ scope.row.title }}</div>
                  </template>
              </el-table-column>
              <el-table-column prop="addons_version" label="版本号"/>
              <el-table-column prop="version" label="适配版本"/>
              <el-table-column prop="update_time" label="更新时间"/>
              <el-table-column label="下载" width="">
                <template #default="scope">
                  <el-button v-if="scope.row.outLink.length > 0"
                      size="small"
                      @click="open_link(scope.row.outLink)"
                      >
                    打开
                  </el-button>
                  <el-button
                      v-else
                      size="small"
                      @click="down_addons(scope)">
                    下载
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-main>
        </el-container>
      </el-container>
      <el-footer style="border-top:1px solid #e6e6e6">
        <el-row style="line-height: 10vh;font-size: 12px">
          <el-col :span="2">
            <el-button type="success" size="small" @click="jump_website">荷兰服官网</el-button>

          </el-col>
          <el-col :span="2">
            <el-button type="success" size="small" @click="jump_kook">荷兰服kook</el-button>
          </el-col>
          <el-col :span="3">
            <el-button type="success" size="small" @click="jump_my_site">风暴助手</el-button>
          </el-col>
          <el-col :span="2">
            <el-button type="warning" size="small" @click="handle_select_wow">设置wow.exe</el-button>
          </el-col>
          <el-col :span="9">
            <el-tooltip
                class="box-item"
                effect="light"
                :content="this.wow_path"
                placement="top-start"
            >
              <el-text    style="max-width: 300px" truncated>
                {{ this.wow_path }}
              </el-text>
            </el-tooltip>


          </el-col>

          <el-col :span="3"><div   class="grid-content bg-purple">
            <el-button  @click="start_wow"  type="success">启动游戏</el-button></div>
          </el-col>
        </el-row>
      </el-footer>
    </el-container>
  </div>
  <el-dialog

    v-model="detail_dialog"
    :title=" detail_title "
    width="80%"
  >
  <div class="dalog_div">{{ this.detail_text }}</div>

  </el-dialog>
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
.dalog_div{
  text-align: start;
  white-space: pre-wrap;
  max-height: 100vh;
  max-width: 100%;
  overflow: auto;

}
.el-footer button{
  padding: 4px 6px;
}

</style>
