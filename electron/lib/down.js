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
exports.down_addons =  function (event, down_data) {
    console.log(event.sender)
    debug("收到下载需求：", down_data)
    try{
        let the_path =  wow_path({version: down_data.version})
        if (the_path === ""){
            send_msg(event,ERROR_CODE,'','没有定义wow.exe路径')
        }
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
                // let progress_return_data = {
                //     progress: 70,
                //     index: down_data.index,
                //     msg: "下载完成，开始解压",
                // }
                // send_progress(200, progress_return_data, "")
                fileStream.close();
                console.log(`Downloaded file saved to ${file_tmp_path}`);


                //去掉文件命后缀
                let file_name = down_data.file_name.split(".")[0]
                //组合目录
                let file_unzip_path = path.join('downloaded_files', file_name)
                console.log("解压目录:", file_tmp_path, file_unzip_path)
                // 先解压到一个本地的目录，
                compressing.zip.uncompress(file_tmp_path, file_unzip_path).then(() => {
                    // let progress_return_data = {
                    //     progress: 80,
                    //     index: down_data.index,
                    //     msg: "解压完毕",
                    // }
                    // send_progress(200, progress_return_data)
                    error("wow路径",the_path)
                    //组合目录
                    let addons_path = path.dirname(the_path) + "/Interface/Addons/"
                    error("插件路径",addons_path)
                    //安装插件
                     exports.addons_install(file_unzip_path, addons_path).then(() => {
                        //解压完成后删除临时文件
                        fs.unlinkSync(file_tmp_path)
                        removeDir(file_unzip_path)
                         send_msg(event,OK_CODE,'下载完成','成功')
                        // send_progress(200, {
                        //     progress: 100,
                        //     index: down_data.index,
                        //     msg: "安装完成",
                        // }, "插件安装完成")
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
            // response.on('data', (chunk) => {
            //     has_down_length += chunk.length
            //     const progress = (70.0 * has_down_length / file_length).toFixed(1) // 当前进度
            //     //除以5，没有变化则返回
            //     if (~~(progress / 5) === progress_now) {
            //         return
            //     }
            //     //记录进度变化
            //     progress_now = ~~(progress / 5)
            //     let progress_return_data = {
            //         progress: progress,
            //         index: down_data.index,
            //         msg: "下载中",
            //     }
            //     send_progress(200, progress_return_data,'')
            //
            // })
            //下载完成
            // response.on('end', () => {
            //     info("下载完成")
            //     let progress_return_data = {
            //         progress: 70,
            //         index: down_data.index
            //     }
            //     BrowserWindow.getFocusedWindow().webContents.send('download-complete', progress_return_data);
            //
            // })
            //下载取消
            // response.on('aborted', () => {
            //     info("下载取消")
            //     let progress_return_data = {
            //         progress: 0,
            //         index: down_data.index
            //     }
            //     BrowserWindow.getFocusedWindow().webContents.send('download-error', progress_return_data);
            // })
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
        send_progress(502,down_data,e.msg)
    }


}
//取消
exports.down_cancel = function (event,down_data) {
    req_list.get(down_data.index).abort()
    req_list.delete(down_data.index)
}
