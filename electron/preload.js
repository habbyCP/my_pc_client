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
  cancelDownload: (down_data) => ipcRenderer.send('cancel-download',down_data),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
  onDownloadError: (callback) => ipcRenderer.on('download-error', callback),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),

  wow_file_path: (version_data) => ipcRenderer.invoke('wow-file-path', version_data),

  startWow: (version_data) => ipcRenderer.send('start-wow', version_data),
});


