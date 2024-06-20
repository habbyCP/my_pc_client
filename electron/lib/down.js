const {BrowserWindow } = require('electron')
const log = require("electron-log");
const path = require("path");
const {get} = require("https");

const  req_list  = new Map()

exports.down_file =  function (event,down_data){
    let mainWindow = BrowserWindow.getFocusedWindow();
    log.info("下载",down_data.url)

    const url = down_data.url
    // 解析URL
    const parsedUrl = new URL(url);
    // 获取路径名
    const pathname = parsedUrl.pathname;
    // 使用path.basename获取文件名
    down_data.file_name = path.basename(pathname);
    let req = get(down_data.url, (res) => {
        const len = parseInt(res.headers['content-length']) // 文件总长度
        let cur = 0
        let on = 0
        res.on('data', function (chunk) {
            cur += chunk.length
            const progress = (100.0 * cur / len).toFixed(2) // 当前进度
            const currProgress = (cur / 1048576).toFixed(2) // 当前了多少
            //这里开启新的线程启动子窗子 将进度条数据传送至子窗口 显示下载进度。
            if (parseInt(progress) === on) {
                return
            }
            on = parseInt(progress)
            let progress_return_data = {
                progress: progress,
                index: down_data.index
            }

            log.info("发送出去的信息:", progress_return_data)
            mainWindow.webContents.send('download-progress', progress_return_data);
        })
        res.on('error', function (chunk) {
            console.log(chunk.message)
        })
        res.on('close', function (chunk) {
            console.log("223")
        })
        res.on('end', function (chunk) {
            console.log("323")
        })
        res.on('aborted', function (chunk) {
            console.log(chunk)
            console.log("423")
        })
    })
    req_list.set(down_data.index,req)
}
//取消
exports.down_cancel = function (event,down_data) {
    req_list.get(down_data.index).abort()
    req_list.delete(down_data.index)
}
