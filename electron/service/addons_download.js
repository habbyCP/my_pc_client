const {BrowserWindow,session  } = require('electron')
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os'); 
const {debug,info,error} = require("../lib/log");
const {send_msg} = require("../lib/notice");
const {ERROR_CODE,OK_CODE} = require("../lib/error_code"); 
const {getSettings} = require("../lib/settings");
const { findAddonsDirectory, copy_dir, deletePath } = require("../lib/path_validator");

 
 


 

//下载插件
exports.down_addons = async function (event, down_data) {
    debug("收到下载需求：", down_data)
    // 获取设置信息
    let settings = getSettings()
    
    let pathResult = findAddonsDirectory(settings.gamePath, down_data.override_mode);
    if (!pathResult.success) {
        return {
            code: pathResult.code,
            message: pathResult.message,
            data: pathResult.data
        };
    }
    let addons_install_path = pathResult.data.addonsPath;
    
    debug("找到或创建的插件目录:", addons_install_path);
    try {
        // 解析URL
        const parsedUrl = new URL(down_data.url);
        // 获取路径名
        const pathname = parsedUrl.pathname;
        // 使用path.basename获取文件名
        down_data.file_name = path.basename(pathname);

        let tmp_file_path = path.join(os.tmpdir(), down_data.file_name);
        
        await downloadFile(down_data.url, tmp_file_path, down_data.index, event);
        
        // 2. 更新进度为开始解压
        await updateDownloadProgress(event, 85, down_data.index, "开始解压");
        
        // 解压
        let tmp_unzip_path = path.join(os.tmpdir(), down_data.file_name.split(".")[0]);

        debug("解压目录:", tmp_file_path, tmp_unzip_path);
 
        // 4. 解压文件
        await unzipFile(tmp_file_path, tmp_unzip_path);
        await updateDownloadProgress(event, 90, down_data.index, "解压完毕，开始安装");

        let addons_path = addons_install_path;

        debug("复制插件到目录", addons_path);
        await copy_dir(tmp_unzip_path, addons_path);
 
        
        // 6. 安装成功后，记录到本地 SQLite（若可用）
 
        const plugin_id = down_data.id ?? down_data.plugin_id ?? '';
        const file_list = Array.isArray(down_data.file_list) ? down_data.file_list : [];
        
        // 保存插件基本信息
        await saveInstalledPlugin({
            plugin_id,
            title: down_data.title ?? '',
            version: down_data.version ?? '',
            file_list,
            override_mode: down_data.override_mode
        });
        // 保存插件目录信息到新表
        await savePluginDirectories(plugin_id, file_list);

        await updateDownloadProgress(event, 100, down_data.index, "安装完毕");
        return {
            code: OK_CODE,
            message: "下载安装成功",
            data: null
        };
        
 
    } catch (e) {
        return {
            code: ERROR_CODE.PARAM_ERROR,
            message: "下载失败:" + e.message,
            data: e.message
        }; 
    }
}
 