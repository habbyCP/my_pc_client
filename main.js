//引入两个模块：app 和 BrowserWindow

//app 模块，控制整个应用程序的事件生命周期。
//BrowserWindow 模块，它创建和管理程序的窗口。

const {app, BrowserWindow, dialog, Menu, ipcMain,session} = require('electron')
const path = require('path')
const iconPath = path.join(__dirname, './src/img/logo.png')
const { unzipFile } = require('./src/js/unzip');
const urlModule = require('url');
try {
    require('electron-reloader')(module, {});
} catch (_) {

}

//在 Electron 中，只有在 app 模块的 ready 事件被激发后才能创建浏览器窗口
app.on('ready', () => {

    //创建一个窗口
    const mainWindow = new BrowserWindow(
        {
            resizable: false,   //不允许用户改变窗口大小
            width: 800,
            height: 600,
            title: "魔兽世界多服务启动器",
            icon: iconPath,
            webPreferences: {
                nodeIntegration: true,      // 是否在node工作器中启用工作集成默认false
                enableRemoteModule: true,   // 是否启用remote模块默认false        // 网页功能设置
                preload: path.join(__dirname, 'src/js/preload.js'),
                contextIsolation: true, // 启用上下文隔离
            }
        }
    )
    ipcMain.on('mainWindow:close', () => {
        mainWindow.hide()
    })
    ipcMain.handle('download-file', async (event, { url }) => {
        const win = BrowserWindow.getFocusedWindow();
        const ses = session.defaultSession;
        const downloadListener = (event, item) => {
                const  fileName = path.basename(urlModule.parse(url).pathname);
                item.setSavePath("./tmp/"+fileName);
                item.on('updated', (event, state) => {
                    if (state === 'progressing') {
                        const  has = item.getReceivedBytes()
                        const all = item.getTotalBytes()
                        console.log((has*100/all)+'%');
                    }
                });
        }
        ses.on('will-download', downloadListener);
        ses.downloadURL(url);

        return { success: true };
    });
    ipcMain.handle('dialog:openFile', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile']
        });
        unzipFile(result.filePaths[0], "./tmp/");
        return result.filePaths;
    });

    mainWindow.removeMenu()
    //窗口加载html文件
    mainWindow.loadFile('./src/index.html');
    //调试
    mainWindow.openDevTools({mode: 'detach'});

    // tray = new Tray(iconPath)      //实例化一个tray对象，构造函数的唯一参数是需要在托盘中显示的图标url
    // tray.setToolTip('Tasky')       //鼠标移到托盘中应用程序的图标上时，显示的文本
    // tray.on('click', () => {       //点击图标的响应事件，这里是切换主窗口的显示和隐藏
    //   if(mainWindow.isVisible()){
    //     mainWindow.hide()
    //   }else{
    //     mainWindow.show()
    //   }
    // })
    // //右键点击图标时，出现的菜单，通过Menu.buildFromTemplate定制，这里只包含退出程序的选项。
    // tray.on('right-click', () => {
    //   const menuConfig = Menu.buildFromTemplate([
    //     {
    //       label: 'Quit',
    //       click: () => app.quit()
    //     }
    //   ])
    //   tray.popUpContextMenu(menuConfig)
    // })

})
