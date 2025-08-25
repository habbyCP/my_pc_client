const axios = require('axios');
const { version } = require('../../package.json');
const { API_URL } = require('../config.js');

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
    const response = await axios.get(updateUrl, { responseType: 'text' });
    const latestVersionInfo = response.data;

    // a simple yaml parser
    const lines = latestVersionInfo.split('\n');
    const versionLine = lines.find(line => line.startsWith('version:'));
    const pathLine = lines.find(line => line.startsWith('path:'));

    if (!versionLine || !pathLine) {
      return { status: 'error', message: 'Invalid latest.yml format' };
    }

    const latestVersion = versionLine.split(':')[1].trim();
    const downloadPath = pathLine.split(':')[1].trim();
    const baseUrl = updateUrl.substring(0, updateUrl.lastIndexOf('/'));
    const downloadUrl = `${baseUrl}/${downloadPath}`;

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
    console.error('检查更新失败:', error);
    return { status: 'error', message: error.message };
  }
}

module.exports = { checkForUpdates };
