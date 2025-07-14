<template>
  <div class="demo-progress">
    <el-progress type="dashboard" :percentage="percentage">
      <template #default="{ percentage }">
        <span class="percentage-value">{{ percentage }}%</span>
        <span class="percentage-label">下载中</span>
      </template>
    </el-progress>
  </div>
</template>
<style scoped>
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}
.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
.demo-progress .el-progress--line {
  margin-bottom: 15px;
  //max-width: 600px;
}
.demo-progress .el-progress--circle {
  margin-right: 15px;
}
</style>
<script>
export default {
  name: 'MyProgress',
  props:{
    percentage: Number
  }
}
</script>
