const { contextBridge, ipcRenderer } = require('electron');
console.log("我在这里")
alert(111)
contextBridge.exposeInMainWorld('electronAPI', {
    downloadFile: (url) => ipcRenderer.send('download-file', url),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
    onDownloadError: (callback) => ipcRenderer.on('download-error', callback),
    onDownloadCanceled: (callback) => ipcRenderer.on('download-canceled', callback),
});
