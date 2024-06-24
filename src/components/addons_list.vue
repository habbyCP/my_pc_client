<template>
  <el-container>
    <el-header >
      <div>
        <h1>{{ msg }}</h1>
      </div>
    </el-header>
    <el-main v-loading="main_loading">
      <el-table :data="tableData"   stripe style="width: 100%">
        <el-table-column prop="" label="头像"  >
          <template #default="scope">
            <img alt="" v-show='scope.row.status !==1 ' :src="scope.row.img" width="100" height="60"/>
            <div class="demo-progress" style="margin-left: 25%">
              <el-progress
                  type="circle"
                  width = 50
                  v-show='scope.row.status===1'
                  :stroke-width="8"
                  :percentage= scope.row.progress
              >
                <span class="percentage-label">{{scope.row.status_word }}</span>
              </el-progress>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="插件" />
        <el-table-column prop="version" label="版本号"/>
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
    <el-footer>
      <LoginButtonWlk/>
    </el-footer>
  </el-container>
</template>

<script src="../table_list.js"/>
