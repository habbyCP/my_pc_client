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
  downloadFile: (down_data) => ipcRenderer.send('download-file', down_data),
  // 取消下载
  cancelDownload: (down_data) => ipcRenderer.send('cancel-download',down_data),
  // 用浏览器打开链接
  openLink: (url) => ipcRenderer.send('open-link', url),

 // 判断目录是否重复
  isDuplicateDirectory: (version_data) => ipcRenderer.invoke('is-duplicate-directory', version_data),

  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  // 获取wow.exe路径
  wowFilePath: (version_data) => ipcRenderer.invoke('wow-file-path', version_data),
  // 获取所有wow.exe路径
  allWowFilePath: () => ipcRenderer.invoke('all-wow-file-path'),
  // 选择wow.exe文件
  selectFile: (version_data) => ipcRenderer.invoke('select-file',version_data),
  //获取realmlist文件是否正常
  getRealmlist: (version_data) => ipcRenderer.invoke('get-realmlist',version_data),
  //修复realmelist文件
  fixRealmlist: (version_data) => ipcRenderer.invoke('fix-realmlist',version_data),
  //启动主程序
  startWow: (version_data) => ipcRenderer.send('start-wow', version_data),

  //响应主程序
  onResponse: (callback) => ipcRenderer.on('response', callback),
  // selectFile: selectFile,
  
  // 设置相关API
  // 选择目录
  selectDirectory: (options) => ipcRenderer.invoke('select-directory', options),
  // 验证游戏路径
  validateGamePath: (path) => ipcRenderer.invoke('validate-game-path', path),
  // 获取设置
  getSettings: () => ipcRenderer.invoke('get-settings'),
  // 保存设置
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
});
