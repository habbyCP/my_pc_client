const { contextBridge, ipcRenderer } = require('electron');
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  console.log('系统进程：', process.versions);
})

contextBridge.exposeInMainWorld('electronAPI', {
  //下载文件
  downloadFile: (down_data) => ipcRenderer.invoke('download-file', down_data),
  // 用浏览器打开链接
  openLink: (url) => ipcRenderer.send('open-link', url),

  // 窗口控制
  windowControls: {
    minimize: () => ipcRenderer.send('window-controls', 'minimize'),
    maximize: () => ipcRenderer.send('window-controls', 'maximize'),
    restore: () => ipcRenderer.send('window-controls', 'restore'),
    close: () => ipcRenderer.send('window-controls', 'close'),
  },

  // 判断目录是否重复
  isDuplicateDirectory: (version_data) => ipcRenderer.invoke('is-duplicate-directory', version_data),

  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_, data) => callback(data)),
  
  // 设置相关API
  // 选择目录
  selectDirectory: (options) => ipcRenderer.invoke('select-directory', options),
  // 验证游戏路径
  validateGamePath: (path) => ipcRenderer.invoke('validate-game-path', path),
  // 获取设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  // 保存设置
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  // 启动游戏
  startGame: (gamePath) => ipcRenderer.invoke('start-game', gamePath),
  // 应用补丁
  applyClientPatches: (options) => ipcRenderer.invoke('apply-client-patches', options),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  // 获取配置
  getConfig: () => ipcRenderer.invoke('get-config'),
  // 下载更新
  downloadUpdate: (args) => ipcRenderer.send('download-update', args),
  // 打开本地路径
  openLocalPath: (args) => ipcRenderer.send('open-local-path', args),
});
