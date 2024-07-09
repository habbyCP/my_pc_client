
const my_logger = require('electron-log');


// 配置日志
my_logger.transports.file.level = 'info';  // 你可以设置 'info', 'warn', 'error' 等日志级别
my_logger.transports.console.level = 'info'; // 控制台日志级别
my_logger.transports.file.maxSize = 5 * 1024 * 1024; // 文件大小限制，5MB
my_logger.transports.file.file = `./main.log`; // 日志文件路径
// 可以添加更多的配置
my_logger.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
my_logger.transports.console.format = '{h}:{i}:{s}:{ms} {text}';
// 暴露日志功能
module.exports = my_logger;
