const fs = require('fs');
const path = require('path');
const logger = require('electron-log');
const { getSettings } = require('../lib/settings'); 
const { getInstalledPlugins } = require('../lib/db'); 
const { ERROR_CODE, OK_CODE } = require("../lib/error_code");

function IsDuplicateDirectory(event, data) {
     return new Promise(async (resolve) => {
         try { 
             // 统一解析 AddOns 目录
             const settings = getSettings();
             const gamePath = settings && settings.gamePath ? settings.gamePath : ''; 
             const gameDir = path.dirname(gamePath);
             const addonsPath = path.join(gameDir, 'Interface', 'AddOns');
             console.log('addonsPath', addonsPath)
             if (!fs.existsSync(addonsPath)) {
                 // 无法定位 AddOns 目录则认为没有重复
                 return resolve({ code: OK_CODE, message: '', data: [] });
             }

             const NewAddonsDirs = Array.isArray(data?.dir_list) ? data.dir_list : [];
             const result = [];

             for (const dir of NewAddonsDirs) {
                 if (typeof dir !== 'string') continue;
                 const name = dir.trim();
                 if (!name) continue;

                 const target = path.join(addonsPath, name);
                 try {
                     const stat = fs.statSync(target);
                     if (stat.isDirectory()) {
                         result.push(name);
                     }
                 } catch (e) {
                     // 不存在或无法访问则跳过
                 }
             }

             resolve({ code: OK_CODE, message: '', data: result });
         } catch (e) { 
             resolve({ code: ERROR_CODE, message: 'Error occurred while checking for duplicate directories', data: [] });
         }
     })
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
 * @returns {Promise<Array>} 插件信息数组
 */
async function scanAddons() {
  try {
    let settings = getSettings();
    if (!settings || !settings.gamePath) {
      return [];
    }
    const addonsPath = path.join(path.dirname(settings.gamePath), 'Interface', 'AddOns');
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
        
        // 获取目录创建时间作为安装时间
        const installedAt = getDirectoryCreationTime(addonPath);
        
        // 基本插件信息
        const addonInfo = {
          name: addonDir,
          path: addonPath,
          installedAt: installedAt,
          // 默认值
          title: addonDir,
          notes: '',
          version: '',
          dependencies: []
        };
        
        // 检查是否存在同名的toc文件
        if (fs.existsSync(tocFilePath)) {
          // 读取toc文件内容
          const tocContent = fs.readFileSync(tocFilePath, 'utf8');
          
          // 解析toc文件
          const tocInfo = parseTocFile(tocContent);
          
          // 合并toc信息
          Object.assign(addonInfo, tocInfo);
        }
        
        // 添加到插件信息数组
        addonsInfo.push(addonInfo);
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
 * 获取数据库中的插件信息
 * @returns {Promise<Array>} 插件信息数组
 */
async function getDbPlugins() {
  try {
    // 从数据库中获取已安装的插件信息
    const dbPlugins = await getInstalledPlugins();
    
    // 将数据库中的插件信息转换为与扫描到的插件信息相同的格式
    return dbPlugins.map(plugin => ({
      plugin_id: plugin.plugin_id,
      file_list: plugin.file_list,
      title: plugin.title,
      version: plugin.version,
      installedAt: plugin.installed_at,
      override_mode: plugin.override_mode || 1,
      from_db: true // 标记来自数据库的插件
    }));
  } catch (error) {
    logger.error('从数据库获取插件信息失败:', error);
    return [];
  }
}

/**
 * 合并本地扫描到的插件和数据库中的插件信息
 * @param {Array} localAddons 本地扫描到的插件
 * @param {Array} dbAddons 数据库中的插件
 * @returns {Array} 合并后的插件列表
 */
function mergeAddons(localAddons, dbAddons) {
  // 创建一个映射，以插件名称为键，存放本地插件
  const localAddonMap = {};
  localAddons.forEach(addon => {
    localAddonMap[addon.name] = { ...addon, override_mode: 1, under_controller: 0 }; // 默认 override_mode 为 1
  });

  // 最终的插件列表
  const resultAddons = [];
  
  // 记录已处理过的数据库插件 ID，确保每个插件只添加一次
  const processedDbPluginIds = new Set();
  const needDel = [];
  // 先处理数据库中的插件，以数据库中的数据为准
  for (const dbAddon of dbAddons) {
    // 如果该插件已经处理过，跳过
    if (processedDbPluginIds.has(dbAddon.plugin_id)) {
      continue;
    }
    
    // 如果数据库插件有 file_list
    if (dbAddon.plugin_id && dbAddon.file_list && Array.isArray(dbAddon.file_list)) {
      let matchFound = false;  
      let MissDir = []
      // 首先尝试在本地插件中找到匹配项
      for (const dirName of dbAddon.file_list) { 
        if (typeof dirName === 'string' && dirName.trim()) {
          const trimmedDirName = dirName.trim();
          
          // 如果是 Blizzard_ 开头的插件，直接跳过
          if (trimmedDirName.startsWith('Blizzard_')) {
            continue;
          }
          
          if (localAddonMap[trimmedDirName]) {
            // console.log('找到匹配项:', trimmedDirName);
            matchFound = true; 
            needDel.push(trimmedDirName);
          }else{
            MissDir.push(trimmedDirName)
          }
        }
      }
      
      // 如果找到了匹配项
      if (matchFound) {
        // 创建一个新的插件对象，使用数据库中的数据覆盖本地数据
        const mergedAddon = { 
          title: dbAddon.title,   // 使用数据库中的标题，如果有的话
          version: dbAddon.version,   // 使用数据库中的版本，如果有的话
          installedAt: dbAddon.installedAt,  // 使用数据库中的安装时间，如果有的话
          plugin_id: dbAddon.plugin_id,
          override_mode: dbAddon.override_mode || 1,
          db_file_list: dbAddon.file_list, // 保存数据库中的完整文件列表
          under_controller: 1, 
          miss_dir: MissDir
        };
        
        // 添加到结果列表
        resultAddons.push(mergedAddon); 
      } else {
        // 如果本地没有匹配项，但数据库中有记录
        // 选择第一个有效的目录名作为插件名称
        let addonName = '';
        for (const dirName of dbAddon.file_list) {
          if (typeof dirName === 'string' && dirName.trim()) {
            addonName = dirName.trim();
            break;
          }
        }
        
        if (addonName) {
          resultAddons.push({
            name: addonName,
            title: dbAddon.title || '',
            version: dbAddon.version || '',
            installedAt: dbAddon.installedAt || new Date().toISOString(),
            plugin_id: dbAddon.plugin_id,
            override_mode: dbAddon.override_mode || 1,
            from_db: true,
            db_file_list: dbAddon.file_list,
            under_controller: 1, 
            miss_dir: dbAddon.file_list
          });
        }
      }
       
    }
  }
  for (const addonName of needDel) {
    delete localAddonMap[addonName];
  }
  // 添加剩余的本地插件（数据库中没有的）
  for (const addonName in localAddonMap) {
    // 跳过 Blizzard_ 开头的插件
    if (addonName.startsWith('Blizzard_')) {
      continue;
    }
    resultAddons.push(localAddonMap[addonName]);
  }
  
  return resultAddons;
}

/**
 * 根据 override_mode 对插件进行排序
 * @param {Array} addons 插件数组
 * @returns {Array} 排序后的插件数组
 */
function sortAddonsByOverrideMode(addons) {
  return [...addons].sort((a, b) => {
    // 先按 override_mode 排序，将 override_mode=2 的插件放在前面
    if ((a.override_mode === 2) && (b.override_mode !== 2)) {
      return -1;
    }
    if ((a.override_mode !== 2) && (b.override_mode === 2)) {
      return 1;
    }
    // 如果 override_mode 相同，则按安装时间排序（新到旧）
    return new Date(b.installedAt || 0) - new Date(a.installedAt || 0);
  });
}

/**
 * 获取所有本地插件信息
 * @returns {Promise<Object>} 包含插件信息的对象
 */
async function getLocalAddons() {
  try {
    // 扫描本地插件
    const localAddons = await scanAddons(); 
    // 从数据库中获取插件信息
    const dbAddons = await getDbPlugins(); 
    // 合并本地插件和数据库插件信息
    const mergedAddons = mergeAddons(localAddons, dbAddons);
    
    // 根据 override_mode 排序，将 override_mode=2 的插件放到前面
    // const sortedAddons = sortAddonsByOverrideMode(mergedAddons);
    
    // 构建插件信息映射
    // const addonsMap = {};
    // sortedAddons.forEach(addon => {
    //   addonsMap[addon.name] = addon;
    // });
    
    return {
      success: true,
      message: '成功获取本地插件信息',
      data: {
        addons: mergedAddons,
        // addonsMap: addonsMap
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
  IsDuplicateDirectory
};
