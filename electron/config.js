const { app } = require('electron');
const path = require('path');

// 统一使用用户数据目录，兜底到进程工作目录
const userDataDir = (app && app.getPath) ? app.getPath('userData') : process.cwd();
const wowPathConfigFile = path.join(userDataDir, 'file.json'); 

const baseConfig = { 
  API_URL: 'https://addons_api.9136347.com/api',
  WOW_PATH_CONFIG: wowPathConfigFile,
  //静态资源地址
  STATIC_URL: 'https://download.9136347.com'
};

const devConfig = {
  ...baseConfig,
  API_URL: 'https://addons_api.9136347.com/api',
  WOW_PATH_CONFIG: wowPathConfigFile, 
  //静态资源地址
  STATIC_URL: 'https://download.9136347.com'
};

const prodConfig = {
  ...baseConfig,
};

const config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

module.exports = config;