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
 

function checkForUpdates(isManualCheck = false) {
  autoUpdater.removeAllListeners();
  my_logger.info('检查更新...');
  autoUpdater.checkForUpdates();
}

module.exports = { checkForUpdates };