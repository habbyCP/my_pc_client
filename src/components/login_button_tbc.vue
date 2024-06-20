<template>
  <div class="login_button_form">
  <el-row>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /><el-button size="" type="success">设置路径</el-button></el-col>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /><el-button  size="" type="success">2.43欧洲</el-button></el-col>
    <el-col :span="8"><div class="grid-content ep-bg-purple" /><el-button size="" type="primary">2.43欧洲</el-button></el-col>
  </el-row>
  </div>
</template>
<script>
export default {
  name: 'LoginButtonTbc',
}
</script>
<style>
.login_button_form{
  padding: 3vh;
}
</style>
