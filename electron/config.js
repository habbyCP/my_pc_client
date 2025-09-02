const baseConfig = { 
  API_URL: 'https://addons_api.9136347.com/api',
  WOW_PATH_CONFIG: './file.json'
};

const devConfig = {
  ...baseConfig,
  API_URL: 'http://127.0.0.1:8888/api', // Example of overriding for development
};

const prodConfig = {
  ...baseConfig,
};

const config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

module.exports = config;