const axios = require('axios');
const { app, shell } = require('electron');
const version = app.getVersion();
const { STATIC_URL } = require('../config.js');  
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const updateUrl = STATIC_URL + "/release/latest-win32.yml"; 

function cmpVersion(a, b) {
  // 调试日志：版本比较输入
  try { console.log('[Updater] cmpVersion input => a:', a, 'b:', b); } catch (_) {}
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x > y) return 1
    if (x < y) return -1
  }
  // 调试日志：版本相等
  try { console.log('[Updater] cmpVersion result => equal'); } catch (_) {}
  return 0
}

// #region 更新检查
// 检查更新 - 服务端返回YAML格式的更新信息
// 包含version、files、path等字段
async function checkForUpdates() {
  try {
    // 调试日志：开始检查更新
    try { console.log('[Updater] checkForUpdates: request URL =>', updateUrl); } catch (_) {}
    const client = updateUrl.startsWith('https:') ? https : http;
    const res = await new Promise((resolve, reject) => {
      const req = client.get(updateUrl, (response) => {
        resolve(response);
      });
      req.on('error', reject);
    });

    // 如果是 3xx（如 302），不跳转，直接返回提示
    if (res.statusCode >= 300 && res.statusCode < 400) {
      try { console.warn('[Updater] redirect status received:', res.statusCode, 'location:', res.headers?.location); } catch (_) {}
      return {
        status: 'redirect-blocked',
        code: res.statusCode,
        location: res.headers?.location || '',
        message: 'Update endpoint responded with redirect; not following as requested',
      };
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      try { console.error('[Updater] HTTP error status:', res.statusCode); } catch (_) {}
      return { status: 'error', message: `HTTP ${res.statusCode}` };
    }

    // 读取YAML响应数据
    const chunks = [];
    await new Promise((resolve, reject) => {
      res.on('data', (c) => chunks.push(c));
      res.on('end', resolve);
      res.on('error', reject);
    });
    
    const yamlContent = Buffer.concat(chunks).toString('utf-8').trim();
    try { console.log('[Updater] YAML content length:', yamlContent.length); } catch (_) {}
    
    // 简单解析YAML格式 (不使用外部库)
    const lines = yamlContent.split('\n');
    let latestVersion = null;
    let fileName = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('version:')) {
        latestVersion = trimmedLine.split(':')[1].trim();
      } else if (trimmedLine.startsWith('path:')) {
        fileName = trimmedLine.split(':')[1].trim();
      }
    }
    
    if (!latestVersion || !fileName) {
      try { console.error('[Updater] YAML parse failed. version:', latestVersion, 'fileName:', fileName); } catch (_) {}
      return { status: 'error', message: 'Invalid YAML format from server' };
    }
    
    // 构建下载URL - 安装包与yml文件在同个目录
    const downloadUrl = `${STATIC_URL}/release/${fileName}`;
    try { console.log('[Updater] Parsed version:', latestVersion, 'file:', fileName, 'downloadUrl:', downloadUrl); } catch (_) {}

    if (cmpVersion(latestVersion, version) > 0) {
      try { console.log('[Updater] Update available. current:', version, 'latest:', latestVersion); } catch (_) {}
      return {
        status: 'update-available',
        latestVersion,
        currentVersion: version,
        downloadUrl,
        fileName
      };
    }

    try { console.log('[Updater] No update. current:', version, 'latest:', latestVersion); } catch (_) {}
    return {
      status: 'no-update',
      latestVersion,
      currentVersion: version
    };
  } catch (error) {
    console.error('检查更新失败:', updateUrl + " " + error);
    return { status: 'error', message: error.message };
  }
}

async function downloadUpdateAndInstall(win, downloadUrl) {
  const tempDir = app.getPath('temp');
  // 从 URL 提取文件名
  let fileName;
  try {
    fileName = path.basename(new URL(downloadUrl).pathname);
  } catch (e) {
    // 当 URL 无效时的回退处理
    const urlParts = downloadUrl.split('/');
    fileName = urlParts[urlParts.length - 1] || 'update.exe';
  }
  const filePath = path.join(tempDir, fileName);

  // 确保不存在同名文件
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const client = downloadUrl.startsWith('https:') ? https : http;
  // 下载开始日志
  try { console.log('[Updater][Download] 开始下载 =>', downloadUrl); } catch (_) {}

  const req = client.get(downloadUrl, (response) => {
    try { console.log('[Updater][Download] 响应状态码 =>', response.statusCode); } catch (_) {}
    if (response.statusCode < 200 || response.statusCode >= 300) {
      try { console.error('[Updater][Download] 非成功状态码，下载失败 =>', response.statusCode); } catch (_) {}
      win.webContents.send('download-progress', { status: 'error', message: `下载失败: ${response.statusCode}` });
      return;
    }

    const fileStream = fs.createWriteStream(filePath);
    const totalBytes = parseInt(response.headers['content-length'], 10);
    try { console.log('[Updater][Download] 保存路径 =>', filePath, '总大小(bytes) =>', totalBytes); } catch (_) {}
    let downloadedBytes = 0;

    response.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const progress = (downloadedBytes / totalBytes) * 100;
      win.webContents.send('app-update-progress', { status: 'progress', percent: progress.toFixed(2), message: '下载中...' });
      // 进度日志（保留两位小数）
      try { console.log('[Updater][Download] 进度 =>', progress.toFixed(2) + '%'); } catch (_) {}
    });

    response.on('end', () => {
      fileStream.close(() => {
        win.webContents.send('app-update-end', { status: 'completed', path: filePath, message: '下载完成' });
        try { console.log('[Updater][Download] 下载完成，已保存 =>', filePath); } catch (_) {}
        shell.openPath(filePath).catch(err => {
            console.error('Failed to open installer:', err);
            win.webContents.send('app-update-end', { status: 'error', message: '无法打开安装程序' });
        });
      });
    });

    response.on('error', (err) => {
        fs.unlink(filePath, () => {}); // 清理临时文件
        win.webContents.send('app-update-end', { status: 'error', message: `下载出错: ${err.message}` });
    });

    response.pipe(fileStream);
  });

  req.on('error', (err) => {
    try { console.error('[Updater][Download] 请求错误 =>', err && err.message ? err.message : err); } catch (_) {}
    win.webContents.send('app-update-end', { status: 'error', message: `请求错误: ${err.message}` });
  });
}

module.exports = { checkForUpdates, downloadUpdateAndInstall };