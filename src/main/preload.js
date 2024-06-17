const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    downloadFile: (url) => ipcRenderer.send('download-file', {url}),
    cancelDownload: () => ipcRenderer.send('cancel-download'),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
    onDownloadError: (callback) => ipcRenderer.on('download-error', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    onDownloadCanceled: (callback) => ipcRenderer.on('download-canceled', callback),
});
