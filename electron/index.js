const { app, BrowserWindow, session, ipcMain,screen } = require('electron')
const path = require('path')
const {down_file, down_cancel} = require("./lib/down");
const { wow_file_path } = require('./lib/db')
const { exec } = require('child_process');
const {mkdirSync, existsSync} = require("fs");
const reactDevToolsPath = path.resolve(__dirname, '../extension/vue-devtools');

let mainWindow;

function createWindow () {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // 计算窗口的尺寸
    let windowWidth = Math.floor(width / 2);
    if (windowWidth < 1000) windowWidth = 1000

    let windowHeight = Math.floor(height / 2);
    if (windowHeight < 600) windowHeight = 600
    console.log(windowWidth, height)
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

  // 创建下载目录
  if (!existsSync('downloaded_files')) {
    mkdirSync('downloaded_files', { recursive: true });
  }
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

//取消下载
ipcMain.on('cancel-download', down_cancel);

//版本相关的查询
ipcMain.handle('wow-file-path', async (event,down_data_info)=>{
    return wow_file_path(down_data_info);
});

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
