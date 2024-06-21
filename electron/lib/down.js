const {BrowserWindow } = require('electron')
const log = require("electron-log");
const path = require("path");
const {get} = require("https");
const fs = require('fs');
const compressing = require('compressing');
let  req_list  = new Map()

//文件总大小
let file_length = 0
//文件已经下载的大小
let has_down_length = 0
//文件当前下载的进度百分比
let progress_now = 0
let down_data = {}
let file_save_path = ""

//响应https.get的data事件回调，实现进度返回
response_data_callback = function(chunk){ 
    has_down_length += chunk.length
    const progress = (100.0 * has_down_length / file_length).toFixed(1) // 当前进度 
    
    //除以5，没有变化则返回
    if (~~(progress/5) === progress_now) {
        return
    }
    //记录进度变化
    progress_now = ~~(progress/5)
    let progress_return_data = {
        progress: progress,
        index: down_data.index
    }
    log.info("发送出去的信息:", progress_return_data)
    BrowserWindow.getFocusedWindow().webContents.send('download-progress', progress_return_data);
}

// 处理close事件回调
response_close_callback = function () {
    log.info("下载close")
    let progress_return_data = {
        progress: 100,
        index: down_data.index
    }
    BrowserWindow.getFocusedWindow().webContents.send('download-complete', progress_return_data);
}
// 处理end事件回调
response_end_callback = function () {
    log.info("下载完成")
    let progress_return_data = {
        progress: 100,
        index: down_data.index
    }
    BrowserWindow.getFocusedWindow().webContents.send('download-complete', progress_return_data);
}
//处理aborted事件回调
response_aborted_callback = function () {
    log.info("下载取消")
    let progress_return_data = {
        progress: 0,
        index: down_data.index
    }
    BrowserWindow.getFocusedWindow().webContents.send('download-error', progress_return_data);
}


exports.down_file =  function (event,down_data_info){
    down_data = down_data_info

    log.info("下载",down_data)

    // 解析URL
    const parsedUrl = new URL(down_data.url);
    // 获取路径名
    const pathname = parsedUrl.pathname;
    // 使用path.basename获取文件名
    down_data.file_name = path.basename(pathname);
    // 处理get回调
    let req = get(down_data.url,(response)=>{
        file_save_path = path.join('downloaded_files', down_data.file_name);
        // 清理已下载
        if (fs.existsSync(file_save_path)) {
            fs.unlinkSync(file_save_path);
        }
        //创建文件
        const fileStream = fs.createWriteStream(file_save_path);
        fileStream.on('finish', () => {
            fileStream.close();
            compressing.zip.uncompress(file_save_path,'test').then(() => {
                console.log('解压完成')
            }).catch(() => {
                console.log('解压失败')
            })
            console.log(`Downloaded file saved to ${file_save_path}`);
        });
        response.pipe(fileStream);
        
        
        file_length = parseInt(response.headers['content-length']) // 文件总长度
        //下载进度
        response.on('data',response_data_callback)
        //下载完成
        response.on('end',response_end_callback)
        //下载取消
        response.on('aborted',response_aborted_callback)
        //下载错误
        response.on('error',(err) => {
            log.info("下载错误:", err)
            let progress_return_data = {
                progress: 0,
                index: down_data.index
            }
            BrowserWindow.getFocusedWindow().webContents.send('download-error', progress_return_data);
        })
    
    })
    // let req = get(down_data.url, (res) => {
    //     const len = parseInt(res.headers['content-length']) // 文件总长度
    //     let cur = 0
    //     let on = 0
    //     res.on('data', function (chunk) {
    //         cur += chunk.length
    //         const progress = (100.0 * cur / len).toFixed(2) // 当前进度
    //         const currProgress = (cur / 1048576).toFixed(2) // 当前了多少
    //         //这里开启新的线程启动子窗子 将进度条数据传送至子窗口 显示下载进度。
    //         if (parseInt(progress) === on) {
    //             return
    //         }
    //         on = parseInt(progress)
    //         let progress_return_data = {
    //             progress: progress,
    //             index: down_data.index
    //         }

    //         log.info("发送出去的信息:", progress_return_data)
    //         mainWindow.webContents.send('download-progress', progress_return_data);
    //     })
    //     res.on('error', function (chunk) {
    //         console.log(chunk.message)
    //     })
    //     res.on('close', function (chunk) {
    //         console.log("223")
    //     })
    //     res.on('end', function (chunk) {
    //         console.log("323")
    //     })
    //     res.on('aborted', function (chunk) {
    //         console.log(chunk)
    //         console.log("423")
    //     })
    // })
    req_list.set(down_data.index,req)
}
//取消
exports.down_cancel = function (event,down_data) {
    req_list.get(down_data.index).abort()
    req_list.delete(down_data.index)
}
