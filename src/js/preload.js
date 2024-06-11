const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getfile: () => ipcRenderer.invoke('dialog:openFile'),
    downloadFile: (url, filePath) => ipcRenderer.invoke('download-file', { url }),
});
