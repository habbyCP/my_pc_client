const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const path = require('path');
const my_logger = require('electron-log');

// 设置日志
autoUpdater.logger = my_logger;
autoUpdater.logger.transports.file.level = 'info';

if (process.env.NODE_ENV === 'development') {
  autoUpdater.forceDevUpdateConfig = true;
  autoUpdater.updateConfigPath = path.join(__dirname, '../../latest.yml');
  autoUpdater.autoDownload = false;
}

function initializeUpdater(isManualCheck = false) {
  // 监听找到可用更新事件
  autoUpdater.on('update-available', (info) => {
    my_logger.info('找到可用更新。', info);
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}，是否立即下载更新？`,
      buttons: ['立即更新', '稍后提醒'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        my_logger.info('用户同意更新，开始下载...');
        autoUpdater.downloadUpdate();
      }
    });
  });

  // 监听没有可用更新事件
  autoUpdater.on('update-not-available', (info) => {
    my_logger.info('当前已是最新版本。', info);
    if (isManualCheck) {
      dialog.showMessageBox({
        type: 'info',
        title: '无可用更新',
        message: '您当前使用的已是最新版本。'
      });
    }
  });

  // 监听更新下载进度事件
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "下载速度: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - 已下载 ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    my_logger.info(log_message);
    // 如果需要，可以在这里通过 a_mainWindow.webContents.send 将进度发送给渲染进程
  });

  // 监听更新下载完成事件
  autoUpdater.on('update-downloaded', (info) => {
    my_logger.info('更新下载完成。', info);
    dialog.showMessageBox({
      type: 'info',
      title: '安装更新',
      message: '新版本已下载完成，应用将退出并开始安装更新。',
      buttons: ['立即安装']
    }).then(() => {
      // unistallOldVersion 默认在 NSIS 安装脚本中是 true
      // setImmediate 用于确保所有UI事件处理完毕后再退出
      setImmediate(() => autoUpdater.quitAndInstall());
    });
  });

  // 监听错误事件
  autoUpdater.on('error', (err) => {
    my_logger.error('更新过程中发生错误: ' + err.message);
    dialog.showErrorBox('更新出错', '检查更新时遇到问题，请稍后重试。详情请查看日志。');
  });
}

function checkForUpdates(isManualCheck = false) {
  autoUpdater.removeAllListeners();
  my_logger.info('检查更新...');
  autoUpdater.checkForUpdates();
}

module.exports = { checkForUpdates, initializeUpdater };