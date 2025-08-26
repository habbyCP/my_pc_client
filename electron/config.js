const baseConfig = { 
  API_URL: 'https://your-api-server.com',
  WOW_PATH_CONFIG: './file.json'
};

const devConfig = {
  ...baseConfig,
  API_URL: 'http://localhost:8888/api', // Example of overriding for development
};

const prodConfig = {
  ...baseConfig,
};

const config = process.env.NODE_ENV === 'development' ? devConfig : prodConfig;

module.exports = config;