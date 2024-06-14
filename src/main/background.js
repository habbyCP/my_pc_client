'use strict'

import { app, protocol, BrowserWindow ,ipcMain, dialog} from 'electron'
const path =  require('path')
const fs = require('fs');
const https = require('https');
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'


const isDevelopment = process.env.NODE_ENV !== 'production'
// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])
const preload_path = path.join(process.cwd(), 'src/main/preload.js');
console.log('-----------------',  preload_path);
async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      preload: preload_path,
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-main-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})


ipcMain.on('download-file', (event, url) => {
  dialog.showSaveDialog({
    title: 'Save file',
    defaultPath: path.join(app.getPath('downloads'), 'downloaded-file')
  }).then(file => {
    if (!file.canceled) {
      const filePath = file.filePath.toString();
      const fileStream = fs.createWriteStream(filePath);

      https.get(url, (response) => {
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          event.sender.send('download-complete', 'File downloaded successfully');
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        event.sender.send('download-error', err.message);
      });
    } else {
      event.sender.send('download-canceled', 'File download canceled');
    }
  }).catch(err => {
    event.sender.send('download-error', err.message);
  });
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
