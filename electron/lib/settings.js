const fs = require('fs');
const path = require('path');
const logger = require('electron-log');
const { WOW_PATH_CONFIG } = require('../config');

// 设置文件路径，统一从 config 中获取，位于 userData 目录
const settingsPath = WOW_PATH_CONFIG;

/**
 * 获取设置
 * @returns {Object} 设置对象
 */
function getSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(settingsData);
      // 确保所有字段都有默认值
      const result = {
        gamePath: settings.gamePath || '',
        autoCheckUpdate: settings.autoCheckUpdate !== undefined ? settings.autoCheckUpdate : true,
        useMockData: settings.useMockData !== undefined ? settings.useMockData : false
      };
 
      return result;
    }
    return {
      gamePath: '',
      autoCheckUpdate: true,
      useMockData: false
    };
  } catch (error) {
    logger.error('读取设置文件失败:', error);
    return {
      gamePath: '',
      autoCheckUpdate: true,
      useMockData: false
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
    console.log('正在保存设置:', settings);
    const settingsData = JSON.stringify(settings, null, 2);
    // 确保目录存在
    try {
      const dir = path.dirname(settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (_) { /* noop */ }
    fs.writeFileSync(settingsPath, settingsData, 'utf8');
    console.log('设置保存成功，路径:', settingsPath);
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
