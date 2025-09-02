const {BrowserWindow,session  } = require('electron')
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const compressing = require('compressing');
const {debug,info,error} = require("./log");
const {send_msg} = require("./notice");
const {ERROR_CODE,OK_CODE} = require("./error_code");
const {wow_path} = require("../service/wow_service");
const {send_progress, mainWindowId} = require("../index");
const {getSettings} = require("./settings");
const {findAddonsDirectory} = require("./path_validator");
const { saveInstalledPlugin } = require('./db');
let  req_list  = new Map()

exports.is_duplicate_directory = function (event, data) {
    return new Promise((resolve) => {
        try {
            console.log('is_duplicate_directory', data)
            // 统一解析 AddOns 目录
            const settings = getSettings();
            const gamePath = settings && settings.gamePath ? settings.gamePath : '';
            const addonsPath = findAddonsDirectory(gamePath,data.override_mode);

            if (!addonsPath) {
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
            resolve({ code: OK_CODE, message: '', data: [] });
        }
    })
} 

//安装插件
exports.addons_install =  function (tmp_dir,addons_dir){
    console.log(tmp_dir,addons_dir)
    return new Promise((resolve, reject) => {
        fs.cp(tmp_dir, addons_dir, { recursive: true }, (err) => {
        if (err) {
            reject(err);
        }
        resolve();
    })
    });
}

function removeDir(dir) {
    let files = fs.readdirSync(dir)
    for(var i=0;i<files.length;i++){
        let newPath = path.join(dir,files[i]);
        let stat = fs.statSync(newPath)
        if(stat.isDirectory()){
            //如果是文件夹就递归下去
            removeDir(newPath);
        }else {
            //删除文件
            fs.unlinkSync(newPath);
        }
    }
    fs.rmdirSync(dir)//如果文件夹是空的，就将自己删除掉
}

// 下载文件
async function downloadFile(url, fileName, index, event) {
    return new Promise((resolve, reject) => {
        let file_tmp_path = path.join('downloaded_files', fileName);
        
        // 清理已下载
        if (fs.existsSync(file_tmp_path)) {
            fs.unlinkSync(file_tmp_path);
        }
        debug("下载文件", url, fileName);
        // 处理get回调，支持 http 和 https
        const isHttps = (() => {
            try { return new URL(url).protocol === 'https:' } catch (_) { return /^https:/i.test(url) }
        })();
        const client = isHttps ? https : http;
        let req = client.get(url, (response) => {
            //创建文件
            const fileStream = fs.createWriteStream(file_tmp_path);
            
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded file saved to ${file_tmp_path}`);
                resolve(file_tmp_path);
            });
            
            fileStream.on('error', (err) => {
                reject(err);
            });
            
            response.pipe(fileStream);
            
            let file_length = parseInt(response.headers['content-length']) // 文件总长度
            let has_down_length = 0 //已经下载的长度
            let progress_now = 0 //进度判断，只有没变化 5% 才给界面发消息
            
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
            console.log(err);
            reject(err);
        });
        
        req_list.set(index, req);
    });
}

// 更新下载进度
function updateDownloadProgress(event, progress, index, message) {
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
    
    return progress_return_data;
}

// 解压文件
async function unzipFile(file_tmp_path, file_unzip_path, event, index) {
    await compressing.zip.uncompress(file_tmp_path, file_unzip_path);
    return updateDownloadProgress(event, 90, index, "解压完毕，开始安装");
}

// 安装插件
async function installAddon(file_unzip_path, addons_path, file_tmp_path, event, index) {
    await exports.addons_install(file_unzip_path, addons_path);
    
    //解压完成后删除临时文件
    fs.unlinkSync(file_tmp_path);
    removeDir(file_unzip_path);
    
    // 发送安装完成进度更新
    event.sender.send('download-progress', {
        code: 200,
        data: {
            progress: 100,
            index: index || 0,
            msg: "安装完成",
        },
        message: "插件安装完成"
    });
    
    send_msg(event, OK_CODE, '下载完成', '成功');
}

//下载插件
exports.down_addons = async function (event, down_data) {
    console.log("收到下载需求：", down_data)
    // 获取设置信息
    let settings = getSettings()
    
    if (!settings || !settings.gamePath) {
        return {
            code: ERROR_CODE.PARAM_ERROR,
            message: "游戏路径未设置",
            data: null
        }
    }
    
    // 使用path_validator模块查找或创建插件目录
    const result = findAddonsDirectory(settings.gamePath,down_data.override_mode);
     
    if (!result.success) {
        return {
            code: result.code,
            message: result.message,
            data: result.data
        };
    }
    
    // 将插件目录路径添加到下载数据中
    down_data.addonsPath = result.data.addonsPath;
    console.log("找到或创建的插件目录:", result.data.addonsPath);
    
    console.log(event.sender)
    debug("收到下载需求：", down_data)
    try {
        // 解析URL
        const parsedUrl = new URL(down_data.url);
        // 获取路径名
        const pathname = parsedUrl.pathname;
        // 使用path.basename获取文件名
        down_data.file_name = path.basename(pathname);
        
        // 1. 下载文件
        const file_tmp_path = await downloadFile(down_data.url, down_data.file_name, down_data.index, event);
        
        // 2. 更新进度为开始解压
        updateDownloadProgress(event, 85, down_data.index, "开始解压");
        
        // 3. 准备解压路径
        let file_name = down_data.file_name.split(".")[0];
        let file_unzip_path = path.join('downloaded_files', file_name);
        console.log("解压目录:", file_tmp_path, file_unzip_path);
        
        try {
            // 4. 解压文件
            await unzipFile(file_tmp_path, file_unzip_path, event, down_data.index);
            
            let addons_path = down_data.addonsPath;
            error("插件路径", addons_path);
            
            try {
                // 5. 安装插件
                await installAddon(file_unzip_path, addons_path, file_tmp_path, event, down_data.index);

                // 6. 安装成功后，记录到本地 SQLite（若可用）
                try {
                    await saveInstalledPlugin({
                        plugin_id: down_data.id ?? down_data.plugin_id ?? '',
                        title: down_data.title ?? '',
                        version: down_data.version ?? '',
                        file_list: Array.isArray(down_data.file_list) ? down_data.file_list : [],
                    });
                } catch (dbErr) {
                    error('保存已安装插件到本地数据库失败:', dbErr);
                }

                return {
                    code: OK_CODE,
                    message: "下载安装成功",
                    data: null
                };
            } catch (err) {
                error(err);
                send_msg(event, ERROR_CODE, down_data, err);
                throw err;
            }
        } catch (err) {
            send_msg(event, ERROR_CODE, err, '解压失败');
            throw err;
        }
    } catch (e) {
        return {
            code: ERROR_CODE.PARAM_ERROR,
            message: "下载失败:" + e.message,
            data: e.message
        }; 
    }
}

//取消
exports.down_cancel = function (event,down_data) {
    req_list.get(down_data.index).abort()
    req_list.delete(down_data.index)
}
