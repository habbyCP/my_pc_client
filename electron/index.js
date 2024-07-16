const { app, BrowserWindow, session, ipcMain,screen,dialog } = require('electron')
const path = require('path')
const {down_file} = require("./lib/down");
const { wow_file_path } = require('./lib/db')
const { exec } = require('child_process');
const {mkdirSync, existsSync} = require("fs");
const {select_file, select_wow_exe} = require("./lib/wow");
const {send_msg} = require("./lib/notice");
const  {runExec} = require("./lib/runExec");
const reactDevToolsPath = path.resolve(__dirname, '../extension/vue-devtools');

const iconv = require('iconv-lite');

const {get_realmlist,fix_realmlist} = require("./lib/realmlist");
const {ERROR_CODE} = require("./lib/error_code");
const my_logger = require("electron-log");

function createWindow () {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    // 计算窗口的尺寸
    let windowWidth = Math.floor(width / 2);
    if (windowWidth < 1000) windowWidth = 1000

    let windowHeight = Math.floor(height / 2);
    if (windowHeight < 600) windowHeight = 600

    let mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        autoHideMenuBar: true,
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

ipcMain.handle('select-file',select_wow_exe)

//文件下载相关的
ipcMain.on('download-file',  down_file);


//版本相关的查询
ipcMain.handle('wow-file-path', function (event, version_data) {
  return wow_file_path(version_data)
});
//获取realmlist
ipcMain.handle('get-realmlist',get_realmlist)
//修复relmlist
ipcMain.handle('fix-realmlist', fix_realmlist);
//启动程序
ipcMain.on('start-wow', function (event,data) {
    wow_file_path(data).then(res=>{
        if(res.code===200){
            runExec(res.data).then(res=>{
                console.log(res)
            }).catch(err=>{
                console.log(err)
                send_msg(ERROR_CODE,err,"启动失败")
            })
            // exec('open -a '+res.data,function(err,stdout,stderr){
            //     if(err){
            //       console.log(iconv.decode(err.message, 'cp936'))
            //         send_msg(ERROR_CODE,iconv.decode(err.message, 'cp936'),"启动失败")
            //     }
            // })
        }else{
            my_logger.info("wow_file_path error ",res)
            send_msg(res.code,{},res.message)
        }
    }).catch(err=>{
        my_logger.info("wow_file_path catch ",err)
        send_msg(err.code,{},err.message)
    })
});
