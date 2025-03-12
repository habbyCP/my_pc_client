const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const logger = require('electron-log');

// 设置文件路径
const settingsPath = path.join(app.getAppPath(), '..', 'settings.json');

/**
 * 获取设置
 * @returns {Object} 设置对象
 */
function getSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(settingsData);
    }
    return {
      gamePath: '',
      autoCheckUpdate: true
    };
  } catch (error) {
    logger.error('读取设置文件失败:', error);
    return {
      gamePath: '',
      autoCheckUpdate: true
    };
  }
}

/**
 * 保存设置
 * @param {Object} settings 设置对象
 * @returns {boolean} 是否保存成功
 */
function saveSettings(settings) {
  try {
    const settingsData = JSON.stringify(settings, null, 2);
    fs.writeFileSync(settingsPath, settingsData, 'utf8');
    return true;
  } catch (error) {
    logger.error('保存设置文件失败:', error);
    return false;
  }
}

/**
 * 验证游戏路径是否有效
 * @param {string} gamePath 游戏路径
 * @returns {boolean} 路径是否有效
 */
function validateGamePath(gamePath) {
  try {
    // 检查路径是否存在
    if (!fs.existsSync(gamePath)) {
      return false;
    }
    const fileName = path.basename(gamePath).toLowerCase();

    // 检查路径的文件名是否为wow.exe 
    if (fileName !== 'wow.exe') {
      return false;
    }
    return true;
  } catch (error) {
    logger.error('验证游戏路径失败:', error);
    return false;
  }
}

module.exports = {
  getSettings,
  saveSettings,
  validateGamePath
};
