<template>
  <el-container>
    <el-main>
      <el-table :data="tableData"   stripe style="width: 100%">
        <el-table-column prop="" label="头像"  >
          <template #default="scope">
            <img alt=""   :src="scope.row.img" width="100" height="60"/>

          </template>
        </el-table-column>
        <el-table-column prop="title" label="插件" />
        <el-table-column prop="addons_version" label="版本号"/>
        <el-table-column prop="version" label="适配版本"/>
        <el-table-column prop="update_time" label="更新时间"/>
        <el-table-column label="下载" width="150">
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
</template>

<script src="../table_list.js"/>
