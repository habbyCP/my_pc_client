<template>
  <div class="common-layout"      :element-loading-text="main_loading_word">
    <el-container>
      <el-aside width="150px">
        <el-menu
            default-active=1
            class="el-menu-vertical-demo"
            @select="handleOpen"
        >
          <el-menu-item index="243_tools">
            <span>2.43 工具</span>
          </el-menu-item>
          <el-menu-item index="335_tools">
            <span>3.35 工具</span>
          </el-menu-item>
          <el-menu-item index="243_addons">
            <span>2.43 插件</span>
          </el-menu-item>
          <el-menu-item index="335_addons">
            <span>3.35 插件</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <template  v-for="(value,key) in menu_list">
        <AddonsList  v-if="menu_index === key" msg = "value.version"/>
      </template>


<!--      <AddonsList v-if="menu_index === '335_tools'"  msg = "335_tools"/>-->
<!--      <AddonsList v-if="menu_index === '243_addons'"  msg = "243_addons"/>-->
<!--      <AddonsList v-if="menu_index === '335_addons'"  msg = "335_addons"/>-->
    </el-container>
  </div>
</template>
<script>

import AddonsList from './components/addons_list.vue'

export default {
  name: 'App',
  components: {
    AddonsList,

  },
  created() {
    localStorage.setItem('version_list',JSON.stringify(this.menu_list))
  },
  data() {
    return {
      menu_index: "243_tools",
      menu_list: {
        "243_tools":{"version":"2.43","title":"2.43工具下载"},
        "335_tools":{"version":"3.35","title":"3.35工具下载"},
        "243_addons":{"version":"2.43","title":"2.43插件下载"},
        "335_addons":{"version":"3.35","title":"3.35插件下载"},
      }
    }
  },
  methods:{
    handleOpen(key) {
      this.menu_index = key
    },
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
