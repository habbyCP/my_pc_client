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
    this.get_version()
  },
  methods:{
    start_wow:function (){
      window.electronAPI.startWow({"version": "3.35"})
    },
    get_version:async function () {
      try {
        let info = window.electronAPI.wowFilePath({"version": "3.35"})
        info.then((data)=>{
          console.log(data)
        })
        console.log('获取到的版本数据:',info)
        this.wow_path = info
      }catch (error) {
        console.error(error);
      }

    }
  }
}
</script>
<style>
.login_button_form{
  padding: 3vh;
}
</style>
