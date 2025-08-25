const axios = require('axios');
const { dialog, shell } = require('electron');
const { version } = require('../../package.json');
const { UPDATE_URL } = require('../config.js');

const updateUrl = UPDATE_URL;

async function checkForUpdates(isManualCheck = false) {
  try {
    const response = await axios.get(updateUrl, { responseType: 'text' });
    const latestVersionInfo = response.data;

    // a simple yaml parser
    const lines = latestVersionInfo.split('\n');
    const versionLine = lines.find(line => line.startsWith('version:'));
    const pathLine = lines.find(line => line.startsWith('path:'));

    if (!versionLine || !pathLine) {
      throw new Error('Invalid latest.yml format');
    }

    const latestVersion = versionLine.split(':')[1].trim();
    const downloadPath = pathLine.split(':')[1].trim();

    if (latestVersion > version) {
      dialog.showMessageBox({
        type: 'info',
        title: '发现新版本',
        message: `发现新版本 ${latestVersion}，是否立即下载更新？`,
        buttons: ['立即更新', '稍后提醒'],
        defaultId: 0,
        cancelId: 1
      }).then(result => {
        if (result.response === 0) {
          const baseUrl = updateUrl.substring(0, updateUrl.lastIndexOf('/'));
          const downloadUrl = `${baseUrl}/${downloadPath}`;
          shell.openExternal(downloadUrl);
        }
      });

    } else if (isManualCheck) {
      dialog.showMessageBox({
        type: 'info',
        title: '无可用更新',
        message: '您当前使用的已是最新版本。'
      });
    }
  } catch (error) {
    if (isManualCheck) {
      dialog.showErrorBox('更新出错', '检查更新时遇到问题，请稍后重试。详情请查看日志。');
    }
    console.error('检查更新失败:', error);
  }
}

module.exports = { checkForUpdates };
