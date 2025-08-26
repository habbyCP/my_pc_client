<template>
  <div class="client-list-container">
  <div class="settings-container">
    <div class="settings-section">
      <div class="section-header">
        <h3>客户端优化工具<span class="auto-save-hint"> (基于网络开源项目)</span> </h3>
        <div class="action-area">
          <el-button type="primary" @click="applyPatches" :loading="isLoading">应用补丁</el-button>
        </div>
      </div>
      <div v-if="statusMessage" class="status-area">
        <el-alert :title="statusMessage" :type="statusType" show-icon :closable="false" />
      </div>
      <div v-if="isReady" class="setting-group">
        <h4 class="group-title">功能开关</h4>
        <div v-for="patch in patchList" :key="patch.key" class="setting-item">
          <span class="setting-label">{{ patch.label }}</span>
          <el-switch v-model="patch.value" />
        </div>
      </div>


    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'ClientPatcher',
  props: {
    client: {
      type: Object,
      required: false,
      default: () => ({ path: '' })
    }
  },
  data() {
    return {
      isReady: false,
      patchList: [
        { key: 'fov', label: '宽屏视野修复 (Widescreen FoV)', value: false },
        { key: 'camera', label: '提升最大镜头距离 (Increase Camera Distance)', value: false },
        { key: 'cameraJitter', label: '修复镜头跳动问题 (Fix Camera Jitter)', value: false },
        { key: 'soundChannels', label: '增加声音通道到64 (Increase Sound Channels)', value: false },
        { key: 'soundInBackground', label: '后台播放声音 (Sound in Background)', value: false },
        { key: 'largeAddressAware', label: '允许使用超过2GB内存 (Large Address Aware)', value: false },
        { key: 'fastLoot', label: '反向快速拾取 (Reverse Fast Loot)', value: false },
        { key: 'nameplateDistance', label: '提升姓名板显示距离 (Increase Nameplate Distance)', value: false },
        { key: 'maxRender', label: '提升最大渲染距离 (Increase Max Render Distance)', value: false },
        { key: 'grassRender', label: '提升草地渲染距离 (Increase Grass Render Distance)', value: false },
      ],
      isLoading: false,
      statusMessage: '',
      statusType: 'info', // 'success', 'warning', 'error', 'info'
    };
  },
  mounted() {
    this.$nextTick(() => {
      this.isReady = true;
    });
  },
  methods: {
    async applyPatches() {
      if (!this.client || !this.client.path) {
        this.statusMessage = '错误：请先在“设置”页面中指定有效的 Wow.exe 路径。';
        this.statusType = 'error';
        return;
      }

      this.isLoading = true;
      this.statusMessage = '正在应用补丁，请稍候...';
      this.statusType = 'info';

      // 将数组转换为后端需要的对象格式
      const selectedPatches = this.patchList.reduce((acc, patch) => {
        acc[patch.key] = patch.value;
        return acc;
      }, {});

      try {
        const options = {
          gamePath: this.client.path,
          selectedPatches: selectedPatches,
        };
        
        const result = await window.electronAPI.applyClientPatches(options);

        if (result.success) {
          this.statusMessage = `操作成功：${result.message}`;
          this.statusType = 'success';
        } else {
          this.statusMessage = `操作失败：${result.error}`;
          this.statusType = 'error';
        }
      } catch (error) {
        this.statusMessage = `发生未知错误：${error.message}`;
        this.statusType = 'error';
      } finally {
        this.isLoading = false;
      }
    },
  },
};
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #332e2a;
  padding-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  color: #e0d6cc;
  font-size: 18px;
}

.auto-save-hint {
  font-size: 12px;
  color: #a09890;
  font-weight: normal;
}

.setting-group {
  margin-bottom: 24px;
}

.group-title {
  color: #c28540;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #c28540;
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
}

.setting-label {
  color: #e0d6cc;
}

.action-area {
  /* Styles for the button area if needed */
}

.status-area {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
