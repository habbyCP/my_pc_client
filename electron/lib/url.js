const url = require('url');
const path = require('path');

function getFileNameFromUrl(inputUrl) {
    // 解析URL
    const parsedUrl = new URL(inputUrl);

    // 获取路径名
    const pathname = parsedUrl.pathname;

    // 使用path.basename获取文件名
    return path.basename(pathname);
}
