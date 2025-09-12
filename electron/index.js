const { app, BrowserWindow, session, ipcMain, screen, shell, dialog, globalShortcut } = require('electron')
const path = require('path')
const { mkdirSync, existsSync } = require("fs");
const fs = require('fs').promises; 
const reactDevToolsPath = path.resolve(__dirname, '../extension/vue-devtools');
const { webContents } = require('electron')  
const { down_addons } = require("./service/addons_download");  
const { getSettings, saveSettings, validateGamePath } = require("./lib/settings");
const { applyClientPatches } = require("./lib/patcher_service");
const { checkForUpdates, downloadUpdateAndInstall } = require("./lib/custom_updater");
const { getLocalAddons, IsDuplicateDirectory } = require('./service/local_addon_service');

const { runExec } = require("./lib/runExec");

const my_logger = require("electron-log");
const { send_msg } = require("./lib/notice");
const { error } = require("electron-log");
const { WOW_PATH_CONFIG } = require('./config');

let mainWindowId

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  // 计算窗口的尺寸
  let windowWidth = Math.floor(width / 2);
  if (windowWidth < 1000) windowWidth = 1200

  let windowHeight = Math.floor(height / 1.75);
  if (windowHeight < 600) windowHeight = 750

  let mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    autoHideMenuBar: true,
    frame: false,
    resizable: false,
    icon: path.join(__dirname, '../build/icons/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // 创建下载目录
  if (!existsSync('downloaded_files')) {
    mkdirSync('downloaded_files', { recursive: true });
  }

  // 屏蔽系统快捷键打开 DevTools（F12、Ctrl/Cmd+Shift+I）
  mainWindow.webContents.on('before-input-event', (event, input) => {
    const isToggleDevtoolsCombo =
      // Ctrl/Cmd + Shift + I
      input.type === 'keyDown' && input.shift && (input.control || input.meta) && String(input.key).toUpperCase() === 'I';
    const isF12 = input.type === 'keyDown' && String(input.key).toUpperCase() === 'F12';
    if (isToggleDevtoolsCombo || isF12) {
      event.preventDefault();
    }
  });


  // 打开开发者工具
  let url
  if (process.env.NODE_ENV === 'development') {
    url = 'http://localhost:3000'
    // 开发模式下默认打开 DevTools
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    url = 'file://' + path.join(__dirname, '../dist/index.html')
  }
  mainWindow.loadURL(url).catch(err => {
    my_logger.error(err)
  })
}

app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    try {
      if (existsSync(reactDevToolsPath)) {
        await session.defaultSession.loadExtension(reactDevToolsPath)
      } else {
        console.warn('Vue Devtools extension not found at:', reactDevToolsPath)
      }
    } catch (e) {
      console.warn('Failed to load Vue Devtools extension:', e)
    }
  }
  // 确保 WOW_PATH_CONFIG 文件存在（位于 userData 目录）
  try {
    const cfgDir = path.dirname(WOW_PATH_CONFIG);
    if (!existsSync(cfgDir)) mkdirSync(cfgDir, { recursive: true });
    if (!existsSync(WOW_PATH_CONFIG)) {
      await fs.writeFile(WOW_PATH_CONFIG, '{}', 'utf8');
    }
  } catch (e) {
    console.warn('初始化 WOW_PATH_CONFIG 失败:', e);
  }
  createWindow()
  // 注册自定义全局快捷键：Ctrl/Cmd + Alt + Shift + D 切换 DevTools
  const accelerator = 'CommandOrControl+Alt+Shift+D'
  const ok = globalShortcut.register(accelerator, () => {
    const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
    if (win && win.webContents) {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools()
      } else {
        win.webContents.openDevTools({ mode: 'detach' })
      }
    }
  })
  if (!ok) {
    console.warn('注册全局快捷键失败:', accelerator)
  }
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

})

// 添加窗口控制事件处理
ipcMain.on('window-controls', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  switch (action) {
    case 'minimize':
      win.minimize();
      break;
    case 'maximize':
      if (win.isMaximized()) {
        win.restore();
      } else {
        win.maximize();
      }
      break;
    case 'restore':
      if (win.isMaximized()) {
        win.restore();
      }
      break;
    case 'close':
      win.close();
      break;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 

// 应用即将退出时，注销所有全局快捷键
app.on('will-quit', () => {
  try { globalShortcut.unregisterAll() } catch (e) { /* noop */ }
})

//文件下载相关的
ipcMain.handle('download-file',  down_addons);

// 浏览器打开链接（支持直接传字符串或 { outLink } 对象）
ipcMain.on('open-link', function (event, data) {
  try {
    const url = typeof data === 'string' ? data : (data && data.outLink);
    if (url) {
      shell.openExternal(url);
    } else {
      console.warn('open-link 调用缺少 URL:', data);
    }
  } catch (e) {
    console.error('open-link 处理失败:', e);
  }
})
// 打开本地路径
ipcMain.on('open-local-path', function (event, data) {
  shell.openPath(data.path).catch(err => {
    console.error('Failed to open local path:', err);
  });
})
//检查目录是否重复
ipcMain.handle('is-duplicate-directory', IsDuplicateDirectory)

// 设置相关的处理
// 选择目录
ipcMain.handle('select-directory', async (event, options) => {
  try {
    const result = await dialog.showOpenDialog({
      title: options.title || '请选择wow.exe文件',
      defaultPath: options.defaultPath,
      properties: ['openFile'],
      filters: [
        { name: 'wow.exe', extensions: ['exe'] }
      ],
      openFile: true,
    });
    return result;
  } catch (error) {
    my_logger.error('选择目录失败:', error);
    return { canceled: true, filePaths: [] };
  }
});

// 验证游戏路径
ipcMain.handle('validate-game-path', async (event, path) => {
  return validateGamePath(path);
});

// 获取设置
ipcMain.handle('get-settings', async () => {
  return getSettings();
});

// 保存设置
ipcMain.handle('save-settings', async (event, settings) => {
  return saveSettings(settings);
});

// 启动游戏
ipcMain.handle('start-game', async (event, gamePath) => {
  try {
    const { spawn, exec } = require('child_process');
    const path = require('path');
    const fs = require('fs');
    
    my_logger.info('启动游戏:', gamePath);
    
    // 检查文件是否存在
    if (!fs.existsSync(gamePath)) {
      throw new Error('游戏文件不存在');
    }
    
    // 获取exe文件的目录作为工作目录
    const workingDir = path.dirname(gamePath);
    const fileName = path.basename(gamePath);
    
    my_logger.info('工作目录:', workingDir);
    my_logger.info('执行文件:', fileName);
    
    return new Promise((resolve, reject) => {
      // 在Windows环境下使用spawn启动exe文件
      const gameProcess = spawn(gamePath, [], {
        cwd: workingDir,
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
        windowsHide: false // 在Windows下显示窗口
      });
      
      // 处理启动成功
      gameProcess.on('spawn', () => {
        my_logger.info('游戏进程启动成功, PID:', gameProcess.pid);
        
        // 让子进程脱离父进程独立运行
        gameProcess.unref();
        
        resolve({ 
          success: true, 
          message: '游戏启动成功',
          pid: gameProcess.pid 
        });
      });
      
      // 处理启动错误
      gameProcess.on('error', (error) => {
        my_logger.error('启动游戏进程失败:', error);
        resolve({ 
          success: false, 
          error: `启动失败: ${error.message}` 
        });
      });
      
      // 如果进程立即退出，可能是启动失败
      gameProcess.on('exit', (code, signal) => {
        if (code !== null && code !== 0) {
          my_logger.error('游戏进程异常退出, 退出码:', code);
          resolve({ 
            success: false, 
            error: `游戏进程异常退出，退出码: ${code}` 
          });
        }
      });
      
      // 设置超时，防止长时间等待
      setTimeout(() => {
        if (!gameProcess.pid) {
          resolve({ 
            success: false, 
            error: '启动超时，请检查游戏文件是否损坏' 
          });
        }
      }, 5000);
    });
    
  } catch (error) {
    my_logger.error('启动游戏失败:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
});

// 应用客户端补丁
ipcMain.handle('apply-client-patches', async (event, options) => {
  return applyClientPatches(app, options);
});

ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await checkForUpdates();
    return result;
  } catch (e) {
    return { status: 'error', message: e.message };
  }
});

ipcMain.on('download-update', (event, { downloadUrl }) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    downloadUpdateAndInstall(win, downloadUrl);
  }
});

ipcMain.handle('get-config', () => {
  const config = require('./config.js');
  return config;
}); 

// 本地已安装插件列表
ipcMain.handle('get-installed-plugins', async () => {
  try {
    // 使用新的 addon_service 模块获取本地插件信息
    return getLocalAddons();
  } catch (e) {
    return { success: false, data: { addons: [], addonsMap: {} }, error: e.message };
  }
});

// 已弃用：open-image-viewer（现在使用应用内覆盖层显示图片）

send_progress = function (code, data, msg) {

  let send_data =
  {
    code: code,
    data: data,
    msg: msg
  }
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', send_data);
  } else {
    error("mainWindow 為空")
  }

}
get_id = function () {
  console.log(mainWindowId)
}
module.exports = {
  get_id,
  mainWindowId
};