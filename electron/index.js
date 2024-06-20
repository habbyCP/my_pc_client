const { app, BrowserWindow, session, ipcMain } = require('electron')
const path = require('path')
const {down_file, down_cancel} = require("./lib/down");
const { wow_file_path } = require('./lib/db')
const { exec } = require('child_process');
const reactDevToolsPath = path.resolve(__dirname, '../extension/vue-devtools');

let mainWindow;


function createWindow () {
   mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  let url = process.env.NODE_ENV === 'development' ?
  'http://localhost:3000' :
  'file://' + path.join(__dirname, '../dist/index.html');
  mainWindow.webContents.openDevTools()
  mainWindow.loadURL( url )
}

app.whenReady().then( async () => {
  if (process.env.NODE_ENV === 'development'){
    await session.defaultSession.loadExtension(reactDevToolsPath)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// ipcMain.on('download-file2',down_file)
//文件下载相关的
ipcMain.on('download-file',  down_file);
ipcMain.on('cancel-download', down_cancel);



//版本相关的查询
ipcMain.handle('wow-file-path',  wow_file_path);

ipcMain.on('start-wow', function (event,data) {
    exec('open -a /usr/local/bin/code', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error opening TextEdit: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
});
