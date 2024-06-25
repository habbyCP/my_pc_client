<template>
  <div class="login_button_form">
  <el-row>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /><el-button style="max-width: 100px" size="" type="success">{{wow_path.path}}</el-button></el-col>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /><el-button  size="" type="success">3.35欧洲</el-button></el-col>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /><el-button  @click="start_wow()" size="" type="primary">3.35欧洲</el-button></el-col>
  </el-row>
  </div>
</template>
<script>
export default {
  name: 'LoginButtonWlk',
  data(){
    return {
      wow_path : {}
    }

  },
  created() {
    //获取版本号
    this.get_version()
  },
  methods:{
    //启动客户端
    start_wow:function (){
      window.electronAPI.startWow({"version": "3.35"})
    },

    //获取当前版本的可执行文件地址
    get_version:async function () {
      let info = window.electronAPI.wowFilePath({"version": "3.35"})
      info.then((data) => {
        this.wow_path = data['path']
        console.log('接些的数据', data)
      }).catch((error) => {
        console.log(error)
      })
    }
  }
}
</script>
<style>
.login_button_form{
  padding: 3vh;
}
</style>
