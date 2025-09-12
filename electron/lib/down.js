const {BrowserWindow,session  } = require('electron')
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const compressing = require('compressing');
const {debug,info,error} = require("./log");
const {send_msg} = require("./notice");
const {ERROR_CODE,OK_CODE} = require("./error_code");
const {wow_path} = require("../service/wow_service");
const {send_progress, mainWindowId} = require("../index");
const {getSettings} = require("./settings");
const {findAddonsDirectory} = require("./path_validator");
const { saveInstalledPlugin, savePluginDirectories } = require('./db');
let  req_list  = new Map()

exports.is_duplicate_directory = function (event, data) {
    return new Promise(async (resolve) => {
        try {
            console.log('is_duplicate_directory', data)
            // 统一解析 AddOns 目录
            const settings = getSettings();
            const gamePath = settings && settings.gamePath ? settings.gamePath : '';
            const addonsPath = await findAddonsDirectory(gamePath,data.override_mode);
            console.log('addonsPath', addonsPath)
            if (!addonsPath.success) {
                // 无法定位 AddOns 目录则认为没有重复
                return resolve({ code: OK_CODE, message: '', data: [] });
            }

            const names = Array.isArray(data?.dir_list) ? data.dir_list : [];
            const result = [];

            for (const rawName of names) {
                if (typeof rawName !== 'string') continue;
                const name = rawName.trim();
                if (!name) continue;

                const target = path.join(addonsPath.data.addonsPath, name);
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
            error('is_duplicate_directory error', e);
            resolve({ code: ERROR_CODE, message: 'Error occurred while checking for duplicate directories', data: [] });
        }
    })
}

// 下载文件
async function downloadFile(url, tmp_file_path, index, event) {
    return new Promise((resolve, reject) => {
        // 清理已下载
        if (fs.existsSync(tmp_file_path)) {
            fs.unlinkSync(tmp_file_path);
        }
        debug("下载文件", url, tmp_file_path);
        // 处理get回调，支持 http 和 https
        const isHttps = (() => {
            try { return new URL(url).protocol === 'https:' } catch (_) { return /^https:/i.test(url) }
        })();
        const client = isHttps ? https : http;
        let req = client.get(url, (response) => {
            //创建文件
            const fileStream = fs.createWriteStream(tmp_file_path);
            
            fileStream.on('finish', () => {
                fileStream.close();
                debug(`Downloaded file saved to ${tmp_file_path}`);
                resolve(tmp_file_path);
            });
            
            fileStream.on('error', (err) => {
                reject(err);
            });
            
            response.pipe(fileStream);
            
            let file_length = parseInt(response.headers['content-length']) // 文件总长度
            let has_down_length = 0 //已经下载的长度 
            
            //下载进度
            response.on('data', (chunk) => {
                has_down_length += chunk.length
                const progress = (80.0 * has_down_length / file_length).toFixed(1) // 当前下载进度（最多到70%，解压和安装占30%）
                updateDownloadProgress(event, progress, index, "下载中...");
            });
            
            //下载错误
            response.on('error', (err) => {
                reject(err);
            });
            
            response.on('close', () => {
                // 这里不需要做任何事情，finish事件会处理关闭
            });
        });
        
        req.on('error', function (err) {
            error(err);
            reject(err);
        }); 
        req_list.set(index, req);
    });
}

// 更新下载进度
function updateDownloadProgress(event, progress, index, message) {
    return new Promise((resolve) => {
        let progress_return_data = {
            progress: progress,
            index: index || 0,
            msg: message,
        }
        
        event.sender.send('download-progress', {
            code: 200,
            data: progress_return_data,
            message: message
        });
     
    })
}
 
exports.updateDownloadProgress = updateDownloadProgress;
exports.req_list = req_list;

// 解压文件
async function unzipFile(file_tmp_path, file_unzip_path) {
    return new Promise((resolve, reject) => {
        compressing.zip.uncompress(file_tmp_path, file_unzip_path)
            .then(() => {
                resolve();
            })
            .catch((err) => {
                reject(err);
            });
    });
    
}

exports.unzipFile = unzipFile;
exports.downloadFile = downloadFile;
