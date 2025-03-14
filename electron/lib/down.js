const {BrowserWindow,session  } = require('electron')
const path = require("path");
const {get} = require("https");
const fs = require('fs');
const compressing = require('compressing');
const {debug,info,error} = require("./log");
const {send_msg} = require("./notice");
const {ERROR_CODE,OK_CODE} = require("./error_code");
const {wow_path} = require("../service/wow_service");
const {send_progress, mainWindowId} = require("../index");
const {getSettings} = require("./settings");
const {findAddonsDirectory} = require("./path_validator");
let  req_list  = new Map()

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


//下载插件
exports.down_addons =  async function (event, down_data) {
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
    const result = findAddonsDirectory(settings.gamePath);
     
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
    try{
        // 解析URL
        const parsedUrl = new URL(down_data.url);
        // 获取路径名
        const pathname = parsedUrl.pathname;
        // 使用path.basename获取文件名
        down_data.file_name = path.basename(pathname);
        // 处理get回调
        let req = get(down_data.url, (response) => {
            let file_tmp_path = path.join('downloaded_files', down_data.file_name);
            // 清理已下载
            if (fs.existsSync(file_tmp_path)) {
                fs.unlinkSync(file_tmp_path);
            }
            //创建文件
            const fileStream = fs.createWriteStream(file_tmp_path);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`Downloaded file s  aved to ${file_tmp_path}`);
                let progress_return_data = {
                    progress: 81,
                    index: down_data.index || 0,
                    msg: "开始解压",
                }
                // 发送解压进度更新
                event.sender.send('download-progress', {
                    code: 200,
                    data: progress_return_data,
                    message: ""
                })
                    //去掉文件命后缀
                let file_name = down_data.file_name.split(".")[0]
                //组合目录
                let file_unzip_path = path.join('downloaded_files', file_name)
                console.log("解压目录:", file_tmp_path, file_unzip_path)
                // 先解压到一个本地的目录，
                compressing.zip.uncompress(file_tmp_path, file_unzip_path).then(() => {
                    let progress_return_data = {
                        progress: 80,
                        index: down_data.index || 0,
                        msg: "解压完毕，开始安装",
                    }
                    // 发送解压进度更新
                    event.sender.send('download-progress', {
                        code: 200,
                        data: progress_return_data,
                        message: "解压完毕"
                    })
                    
                    error("wow路径",down_data.addonsPath)
                    //组合目录
                    let addons_path = down_data.addonsPath
                    error("插件路径",addons_path)
                    //安装插件
                     exports.addons_install(file_unzip_path, addons_path).then(() => {
                        //解压完成后删除临时文件
                        fs.unlinkSync(file_tmp_path)
                        removeDir(file_unzip_path)
                        
                        // 发送安装完成进度更新
                        event.sender.send('download-progress', {
                            code: 200,
                            data: {
                                progress: 100,
                                index: down_data.index || 0,
                                msg: "安装完成",
                            },
                            message: "插件安装完成"
                        })
                        
                        send_msg(event,OK_CODE,'下载完成','成功')
                    }).catch((err)=>{
                        error(err)
                         send_msg(event,ERROR_CODE,down_data,err)
                    })

                }).catch(err=>{
                    send_msg(event,ERROR_CODE,err,'解压失败')
                })
            });
            response.pipe(fileStream);
            let file_length = parseInt(response.headers['content-length']) // 文件总长度
            let has_down_length = 0 //已经下载的长度
            let progress_now = 0 //进度判断，只有没变化 5% 才给界面发消息
            //下载进度
            response.on('data', (chunk) => {
                has_down_length += chunk.length
                const progress = (80.0 * has_down_length / file_length).toFixed(1) // 当前下载进度（最多到70%，解压和安装占30%）
                
                // 只有进度变化超过5%才发送进度更新
                if (progress - progress_now >= 5 || progress >= 80) {
                    progress_now = progress
                    let progress_return_data = {
                        progress: progress,
                        index: down_data.index || 0,
                        msg: "下载中...",
                    }
                    // 发送进度更新
                    event.sender.send('download-progress', {
                        code: 200,
                        data: progress_return_data,
                        message: "下载中..."
                    })
                }
            })
            //下载错误
            response.on('error', (err) => {
                send_msg(event,ERROR_CODE,err,'下载失败');
            })
            response.on('close', () => {

                // send_msg(event,ERROR_CODE,err,'下载失败');
                // BrowserWindow.getFocusedWindow().webContents.send('download-complete', progress_return_data);
            })

        })
        req.on('error',function (err){
            console.log(err)
        })
        req_list.set(down_data.index, req)
    }
    catch (e) {
        return {
            code: ERROR_CODE.PARAM_ERROR,
            message: "下载失败:"+e.message,
            data: e.message
        }; 
    }


}
//取消
exports.down_cancel = function (event,down_data) {
    req_list.get(down_data.index).abort()
    req_list.delete(down_data.index)
}
