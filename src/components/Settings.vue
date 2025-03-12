<template>
  <div class="settings-container">
    <div class="settings-section">
      <h3>游戏路径设置</h3>
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
      
      <div class="action-buttons">
        <el-button type="primary" @click="saveSettings" :disabled="!isPathValid || isSaving">
          <el-icon v-if="isSaving"><Loading /></el-icon>
          <span>保存设置</span>
        </el-button>
        <el-button @click="resetSettings" :disabled="isSaving">重置</el-button>
      </div>
    </div>

    <div class="settings-section">
      <h3>其他设置</h3>
      <div class="setting-item">
        <span class="setting-label">启动时自动检查更新</span>
        <el-switch v-model="autoCheckUpdate" />
      </div>
    </div>
  </div>
</template>

<script>
import { Folder, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'Settings',
  components: {
    Folder,
    Loading
  },
  data() {
    return {
      gamePath: '',
      savedGamePath: '',
      isSelectingFile: false,
      isSaving: false,
      isPathValid: false,
      autoCheckUpdate: true
    }
  },
  mounted() {
    // 从本地存储或配置中获取已保存的游戏路径
    this.loadSavedSettings();
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
            this.validatePath();
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
          this.validatePath();
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
    saveSettings() {
      if (!this.isPathValid) {
        ElMessage.warning('请选择有效的游戏路径');
        return;
      }
      
      this.isSaving = true;
      
      // 保存设置到electron的存储
      const settings = {
        gamePath: this.gamePath,
        autoCheckUpdate: this.autoCheckUpdate
      };
      
      if (window.electronAPI) {
        window.electronAPI.saveSettings(settings)
          .then(() => {
            this.savedGamePath = this.gamePath;
            ElMessage.success('设置已保存');
            this.isSaving = false;
            // 触发保存事件，通知父组件
            this.$emit('save-settings', settings);
          })
          .catch(err => {
            console.error('保存设置失败:', err);
            ElMessage.error('保存设置失败');
            this.isSaving = false;
          });
      } else {
        // 模拟保存
        setTimeout(() => {
          this.savedGamePath = this.gamePath;
          ElMessage.success('设置已保存');
          this.isSaving = false;
          // 触发保存事件，通知父组件
          this.$emit('save-settings', settings);
        }, 1000);
      }
    },
    resetSettings() {
      this.gamePath = this.savedGamePath;
      this.validatePath();
    }
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
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

.file-selector {
  margin-bottom: 20px;
}

.file-path-display {
  margin-bottom: 10px;
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

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #332e2a;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  color: #e0d6cc;
}
</style>
