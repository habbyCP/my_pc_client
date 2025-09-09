const fs = require('fs');
const path = require('path');
const logger = require('electron-log');
const { getSettings } = require('../lib/settings');
const { findAddonsDirectory } = require('../lib/path_validator');
const { promisify } = require('util');

/**
 * 获取游戏目录下的插件目录路径
 * @returns {string|null} 插件目录路径，如果未找到则返回null
 */
function getAddonsPath() {
  try {
    // 从设置中获取游戏路径
    const settings = getSettings();
    if (!settings || !settings.gamePath) {
      logger.warn('游戏路径未设置');
      return null;
    }

    // 使用path_validator查找AddOns目录
    const result = findAddonsDirectory(settings.gamePath);
    if (!result || !result.success || !result.data || !result.data.addonsPath) {
      logger.warn('未找到AddOns目录');
      return null;
    }

    return result.data.addonsPath;
  } catch (error) {
    logger.error('获取插件目录路径失败:', error);
    return null;
  }
}

/**
 * 解析TOC文件内容
 * @param {string} tocContent TOC文件内容
 * @returns {Object} 解析后的TOC信息
 */
function parseTocFile(tocContent) {
  const result = {
    title: '',
    notes: '',
    version: '',
    dependencies: []
  };

  // 按行分割内容
  const lines = tocContent.split('\n');

  // 遍历每一行，查找所需信息
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 匹配Title
    if (trimmedLine.startsWith('## Title')) {
      const titleMatch = trimmedLine.match(/## Title.*?:\s*(.*)/i);
      if (titleMatch && titleMatch[1]) {
        result.title = titleMatch[1].trim();
      }
    }
    // 匹配中文Title
    else if (trimmedLine.startsWith('## Title-zhCN')) {
      const titleZhMatch = trimmedLine.match(/## Title-zhCN:\s*(.*)/i);
      if (titleZhMatch && titleZhMatch[1]) {
        // 优先使用中文标题
        result.title = titleZhMatch[1].trim();
      }
    }
    // 匹配Notes
    else if (trimmedLine.startsWith('## Notes')) {
      const notesMatch = trimmedLine.match(/## Notes.*?:\s*(.*)/i);
      if (notesMatch && notesMatch[1]) {
        result.notes = notesMatch[1].trim();
      }
    }
    // 匹配中文Notes
    else if (trimmedLine.startsWith('## Notes-zhCN')) {
      const notesZhMatch = trimmedLine.match(/## Notes-zhCN:\s*(.*)/i);
      if (notesZhMatch && notesZhMatch[1]) {
        // 优先使用中文说明
        result.notes = notesZhMatch[1].trim();
      }
    }
    // 匹配Version
    else if (trimmedLine.startsWith('## Version:')) {
      const versionMatch = trimmedLine.match(/## Version:\s*(.*)/i);
      if (versionMatch && versionMatch[1]) {
        result.version = versionMatch[1].trim();
      }
    }
    // 匹配Dependencies
    else if (trimmedLine.startsWith('## Dependencies:') || trimmedLine.startsWith('## RequiredDeps:')) {
      const depsMatch = trimmedLine.match(/## (?:Dependencies|RequiredDeps):\s*(.*)/i);
      if (depsMatch && depsMatch[1]) {
        // 分割依赖项，通常以逗号分隔
        result.dependencies = depsMatch[1].split(',').map(dep => dep.trim()).filter(Boolean);
      }
    }
  }

  return result;
}

/**
 * 获取目录的创建时间
 * @param {string} dirPath 目录路径
 * @returns {string} 创建时间的ISO字符串
 */
function getDirectoryCreationTime(dirPath) {
  try {
    const stats = fs.statSync(dirPath);
    // 在Windows上，birthtime通常是可靠的创建时间
    // 在其他系统上，可能需要使用ctime或mtime作为替代
    return stats.birthtime.toISOString();
  } catch (error) {
    logger.error(`获取目录创建时间失败: ${dirPath}`, error);
    return new Date().toISOString(); // 如果获取失败，返回当前时间
  }
}

/**
 * 扫描游戏目录下的所有插件
 * @returns {Array} 插件信息数组
 */
function scanAddons() {
  try {
    const addonsPath = getAddonsPath();
    if (!addonsPath) {
      return [];
    }

    // 检查插件目录是否存在
    if (!fs.existsSync(addonsPath)) {
      logger.warn('插件目录不存在:', addonsPath);
      return [];
    }

    // 读取插件目录下的所有子目录
    const addonDirs = fs.readdirSync(addonsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // 存储所有插件信息的数组
    const addonsInfo = [];

    // 遍历每个插件目录
    for (const addonDir of addonDirs) {
      try {
        const addonPath = path.join(addonsPath, addonDir);
        const tocFilePath = path.join(addonPath, `${addonDir}.toc`);

        // 检查是否存在同名的toc文件
        if (fs.existsSync(tocFilePath)) {
          // 读取toc文件内容
          const tocContent = fs.readFileSync(tocFilePath, 'utf8');
          
          // 解析toc文件
          const tocInfo = parseTocFile(tocContent);
          
          // 获取目录创建时间作为安装时间
          const installedAt = getDirectoryCreationTime(addonPath);
          
          // 添加到插件信息数组
          addonsInfo.push({
            name: addonDir,
            path: addonPath,
            installedAt: installedAt,
            ...tocInfo
          });
        }
      } catch (error) {
        logger.error(`解析插件 ${addonDir} 失败:`, error);
      }
    }

    return addonsInfo;
  } catch (error) {
    logger.error('扫描插件失败:', error);
    return [];
  }
}

/**
 * 获取所有本地插件信息
 * @returns {Object} 包含插件信息的对象
 */
function getLocalAddons() {
  try {
    const addons = scanAddons();
    
    // 构建插件信息映射
    const addonsMap = {};
    addons.forEach(addon => {
      addonsMap[addon.name] = addon;
    });
    
    return {
      success: true,
      message: '成功获取本地插件信息',
      data: {
        addons: addons,
        addonsMap: addonsMap
      }
    };
  } catch (error) {
    logger.error('获取本地插件信息失败:', error);
    return {
      success: false,
      message: '获取本地插件信息失败: ' + error.message,
      data: {
        addons: [],
        addonsMap: {}
      }
    };
  }
}

module.exports = { 
  getLocalAddons, 
};
