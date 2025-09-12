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
let  req_list  = new Map()


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
        // 立即完成，避免调用方 await 时卡住
        resolve();
    })
}


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

module.exports = {
    downloadFile,
    updateDownloadProgress,
    req_list,
    unzipFile
}