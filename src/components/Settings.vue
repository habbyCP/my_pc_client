<template>
   <div class="client-list-container"> 
  <div class="settings-container">
    <div class="settings-section">
      <h3>应用设置 <span class="auto-save-hint">(自动保存)</span></h3>
      
      <!-- 游戏路径设置 -->
      <div class="setting-group">
        <h4 class="group-title">游戏路径配置</h4>
        <div class="setting-item game-path-item">
          <span class="setting-label">游戏安装路径</span>
          <div class="file-selector">
            <div class="file-path-display">
              <el-input
                v-model="gamePath"
                placeholder="请选择游戏安装路径"
                readonly
                :disabled="isSelectingFile"
              >
                <template #append>
                  <el-button @click="selectGamePath" :loading="isSelectingFile">
                    <el-icon><Folder /></el-icon>
                    浏览
                  </el-button>
                </template>
              </el-input>
            </div>
            <div class="path-status" v-if="gamePath">
              <div class="status-indicator" :class="{ 'valid': isPathValid, 'invalid': !isPathValid }"></div>
              <span>{{ isPathValid ? '路径有效' : '路径无效' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 应用设置 -->
      <div class="setting-group">
        <h4 class="group-title">应用配置</h4>
        <div class="setting-item">
          <span class="setting-label">启动时自动检查更新</span>
          <el-switch v-model="autoCheckUpdate" />
        </div>
        <!-- <div class="setting-item">
          <span class="setting-label">使用本地Mock数据</span>
          <el-switch v-model="useMockData" />
        </div> -->
      </div>

      <!-- 保存状态显示 -->
      <div class="status-info" v-if="gamePath || isSaving">
        <div class="save-status" v-if="isSaving">
          <el-icon class="loading-icon"><Loading /></el-icon>
          <span>正在保存...</span>
        </div>
        <div class="save-status success" v-else-if="isPathValid">
          <el-icon class="success-icon"><Check /></el-icon>
          <span>设置已自动保存</span>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import { Folder, Loading, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'Settings',
  components: {
    Folder,
    Loading,
    Check
  },
  data() {
    return {
      gamePath: '',
      savedGamePath: '',
      isSelectingFile: false,
      isSaving: false,
      isPathValid: false,
      autoCheckUpdate: true,
      useMockData: false
    }
  },
  mounted() {
    // 从本地存储或配置中获取已保存的游戏路径
    this.loadSavedSettings();
  },
  watch: {
    // 监听gamePath变化，验证并自动保存
    gamePath(newVal, oldVal) {
      if (this.savedGamePath !== undefined && newVal !== oldVal) { // 确保已经初始化完成且值确实变化
        this.validateAndSaveGamePath();
      }
    },
    // 监听autoCheckUpdate变化，自动保存
    autoCheckUpdate(newVal) {
      if (this.savedGamePath !== undefined) { // 确保已经初始化完成
        this.autoSaveSettings();
      }
    },
    // 监听useMockData变化，自动保存
    useMockData(newVal) {
      if (this.savedGamePath !== undefined) { // 确保已经初始化完成
        console.log('Mock模式切换为:', newVal);
        this.autoSaveSettings();
      }
    }
  },
  methods: {
    loadSavedSettings() {
      // 从electron的存储中获取已保存的设置
      if (window.electronAPI) {
        this.isSelectingFile = true;
        window.electronAPI.getSettings().then(settings => {
          if (settings) {
            this.gamePath = settings.gamePath || '';
            this.savedGamePath = this.gamePath;
            this.autoCheckUpdate = settings.autoCheckUpdate !== undefined ? settings.autoCheckUpdate : true;
            this.useMockData = settings.useMockData !== undefined ? settings.useMockData : false;
            
            if (this.gamePath) {
              this.validatePath();
            } else {
              this.isPathValid = false;
            }
          }
          this.isSelectingFile = false;
        }).catch(err => {
          console.error('加载设置失败:', err);
          this.isSelectingFile = false;
        });
      }
    },
    selectGamePath() {
      this.isSelectingFile = true;
      
      // 调用electron的对话框API选择文件夹
      if (window.electronAPI) {
        window.electronAPI.selectDirectory({
          title: '选择wow.exe',
          defaultPath: this.gamePath || undefined
        }).then(result => {
          if (!result.canceled && result.filePaths.length > 0) {
            this.gamePath = result.filePaths[0];
            // 路径变化会触发watch自动验证和保存
          }
          this.isSelectingFile = false;
        }).catch(err => {
          console.error('选择wow.exe失败:', err);
          this.isSelectingFile = false;
          ElMessage.error('选择wow.exe失败');
        });
      } else {
        // 如果在浏览器环境中测试，模拟选择文件夹的行为
        setTimeout(() => {
          this.gamePath = '/模拟/游戏/路径';
          // 路径变化会触发watch自动验证和保存
          this.isSelectingFile = false;
        }, 1000);
      }
    },
    validatePath() {
      // 验证选择的路径是否有效
      if (!this.gamePath) {
        this.isPathValid = false;
        return;
      }
      
      if (window.electronAPI) {
        window.electronAPI.validateGamePath(this.gamePath)
          .then(isValid => {
            this.isPathValid = isValid;
          })
          .catch(err => {
            console.error('验证路径失败:', err);
            this.isPathValid = false;
            ElMessage.error('验证路径失败');
          });
      } else {
        // 模拟验证
        this.isPathValid = this.gamePath.length > 5;
      }
    },
    // 验证路径并自动保存
    async validateAndSaveGamePath() {
      if (!this.gamePath) {
        this.isPathValid = false;
        return;
      }
      
      // 先验证路径
      if (window.electronAPI) {
        try {
          const isValid = await window.electronAPI.validateGamePath(this.gamePath);
          this.isPathValid = isValid;
          
          // 如果路径有效，自动保存
          if (isValid) {
            this.autoSaveGamePath();
          }
        } catch (err) {
          console.error('验证路径失败:', err);
          this.isPathValid = false;
          ElMessage.error('验证路径失败');
        }
      } else {
        // 模拟验证
        this.isPathValid = this.gamePath.length > 5;
        if (this.isPathValid) {
          this.autoSaveGamePath();
        }
      }
    },
    // 自动保存游戏路径
    autoSaveGamePath() {
      if (this.isSaving || !this.isPathValid) return;
      
      this.isSaving = true;
      
      const settings = {
        gamePath: this.gamePath,
        autoCheckUpdate: this.autoCheckUpdate,
        useMockData: this.useMockData
      };
      
      if (window.electronAPI) {
        console.log('自动保存游戏路径:', this.gamePath);
        window.electronAPI.saveSettings(settings)
          .then(() => {
            this.savedGamePath = this.gamePath;
            console.log('游戏路径自动保存成功');
            this.isSaving = false;
            // 触发保存事件，通知父组件
            this.$emit('save-settings', settings);
          })
          .catch(err => {
            console.error('自动保存游戏路径失败:', err);
            this.isSaving = false;
            ElMessage.error('保存游戏路径失败');
          });
      } else {
        // 模拟保存
        setTimeout(() => {
          this.savedGamePath = this.gamePath;
          console.log('模拟游戏路径自动保存成功');
          this.isSaving = false;
          this.$emit('save-settings', settings);
        }, 500);
      }
    },
    // 自动保存设置（除了游戏路径）
    autoSaveSettings() {
      if (this.isSaving) return; // 防止重复保存
      
      this.isSaving = true;
      
      const settings = {
        gamePath: this.gamePath,
        autoCheckUpdate: this.autoCheckUpdate,
        useMockData: this.useMockData
      };
      
      if (window.electronAPI) {
        console.log('自动保存设置:', settings);
        window.electronAPI.saveSettings(settings)
          .then(() => {
            console.log('设置自动保存成功');
            this.isSaving = false;
            // 触发保存事件，通知父组件
            this.$emit('save-settings', settings);
          })
          .catch(err => {
            console.error('自动保存设置失败:', err);
            this.isSaving = false;
          });
      } else {
        // 模拟保存
        setTimeout(() => {
          console.log('模拟自动保存设置成功');
          this.isSaving = false;
          this.$emit('save-settings', settings);
        }, 100);
      }
    }
  }
}
</script>

<style scoped>
.settings-container {
  /* max-width: 800px; */
  margin: 0 auto;
}

.settings-section {
  background-color: #252220;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #e0d6cc;
  font-size: 18px;
  border-bottom: 1px solid #332e2a;
  padding-bottom: 10px;
}

.setting-group {
  margin-bottom: 24px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.group-title {
  color: #c28540;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #c28540;
}

.file-selector {
  flex: 1;
  margin-left: 16px;
}

.file-path-display {
  margin-bottom: 10px;
}

.game-path-item {
  flex-direction: column;
  align-items: flex-start;
}

.game-path-item .setting-label {
  margin-bottom: 12px;
  font-weight: 600;
}

.path-status {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 14px;
  color: #a09890;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
}

.status-indicator.valid {
  background-color: #67c23a;
}

.status-indicator.invalid {
  background-color: #f56c6c;
}


.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(195, 133, 64, 0.2);
}

.setting-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.setting-label {
  color: #e0d6cc;
}

.auto-save-hint {
  font-size: 12px;
  color: #a09890;
  font-weight: normal;
}

.status-info {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  background-color: rgba(194, 133, 64, 0.1);
  border: 1px solid rgba(194, 133, 64, 0.3);
}

.save-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.save-status.success {
  color: #67c23a;
}

.save-status:not(.success) {
  color: #a09890;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

.success-icon {
  color: #67c23a;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
