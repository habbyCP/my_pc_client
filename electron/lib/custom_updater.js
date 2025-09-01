const axios = require('axios');
const { app, shell } = require('electron');
const version = app.getVersion();
const { API_URL } = require('../config.js');  
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const updateUrl = API_URL + "/update/latest"; 
function cmpVersion(a, b) {
  const pa = String(a).split('.').map(n => parseInt(n, 10) || 0)
  const pb = String(b).split('.').map(n => parseInt(n, 10) || 0)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const x = pa[i] || 0
    const y = pb[i] || 0
    if (x > y) return 1
    if (x < y) return -1
  }
  return 0
}

async function checkForUpdates() {
  try {
    const client = updateUrl.startsWith('https:') ? https : http;
    const res = await new Promise((resolve, reject) => {
      const req = client.get(updateUrl, { headers: { 'Accept': 'application/json' } }, (response) => {
        resolve(response);
      });
      req.on('error', reject);
    });

    // 如果是 3xx（如 302），不跳转，直接返回提示
    if (res.statusCode >= 300 && res.statusCode < 400) {
      return {
        status: 'redirect-blocked',
        code: res.statusCode,
        location: res.headers?.location || '',
        message: 'Update endpoint responded with redirect; not following as requested',
      };
    }

    if (res.statusCode < 200 || res.statusCode >= 300) {
      return { status: 'error', message: `HTTP ${res.statusCode}` };
    }

    // 读取 body 并解析 JSON
    const chunks = [];
    await new Promise((resolve, reject) => {
      res.on('data', (c) => chunks.push(c));
      res.on('end', resolve);
      res.on('error', reject);
    });
    let latestVersionInfo;
    try {
      latestVersionInfo = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    } catch (_) {
      return { status: 'error', message: 'Invalid JSON format from server' };
    }

    if (!latestVersionInfo.version || !latestVersionInfo.path) {
      return { status: 'error', message: 'Invalid JSON format from server' };
    }

    const latestVersion = latestVersionInfo.version;
    const downloadUrl = latestVersionInfo.path;

    if (cmpVersion(latestVersion, version) > 0) {
      return {
        status: 'update-available',
        latestVersion,
        currentVersion: version,
        downloadUrl
      };
    }

    return {
      status: 'no-update',
      latestVersion,
      currentVersion: version
    };
  } catch (error) {
    console.error('检查更新失败:', updateUrl+" "+error);
    return { status: 'error', message: error.message };
  }
}

async function downloadUpdateAndInstall(win, downloadUrl) {
  const tempDir = app.getPath('temp');
  // Extract filename from URL
  let fileName;
  try {
    fileName = path.basename(new URL(downloadUrl).pathname);
  } catch (e) {
    // fallback for invalid URLs
    const urlParts = downloadUrl.split('/');
    fileName = urlParts[urlParts.length - 1] || 'update.exe';
  }
  const filePath = path.join(tempDir, fileName);

  // Ensure file doesn't exist
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const client = downloadUrl.startsWith('https:') ? https : http;

  const req = client.get(downloadUrl, (response) => {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      win.webContents.send('download-progress', { status: 'error', message: `下载失败: ${response.statusCode}` });
      return;
    }

    const fileStream = fs.createWriteStream(filePath);
    const totalBytes = parseInt(response.headers['content-length'], 10);
    let downloadedBytes = 0;

    response.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      const progress = (downloadedBytes / totalBytes) * 100;
      win.webContents.send('download-progress', { status: 'progress', percent: progress.toFixed(2), message: '下载中...' });
    });

    response.on('end', () => {
      fileStream.close(() => {
        win.webContents.send('download-progress', { status: 'completed', path: filePath, message: '下载完成' });
        shell.openPath(filePath).catch(err => {
            console.error('Failed to open installer:', err);
            win.webContents.send('download-progress', { status: 'error', message: '无法打开安装程序' });
        });
      });
    });

    response.on('error', (err) => {
        fs.unlink(filePath, () => {}); // cleanup
        win.webContents.send('download-progress', { status: 'error', message: `下载出错: ${err.message}` });
    });

    response.pipe(fileStream);
  });

  req.on('error', (err) => {
    win.webContents.send('download-progress', { status: 'error', message: `请求错误: ${err.message}` });
  });
}

module.exports = { checkForUpdates, downloadUpdateAndInstall };