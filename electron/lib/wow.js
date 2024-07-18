const {dialog, BrowserWindow} = require("electron");
const {basename} = require("path");
const {set_wow_file} = require("./db");
const {ERROR_CODE, OK_CODE, OK_WOW_PATH} = require("./error_code");
const {send_msg} = require("./notice");


select_wow_exe = function(event, version_data){
    dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        properties: ['openFile'],
        title: "请选择wow.exe文件",
        filters: [
            {name: 'wow.exe', extensions: ['exe']}
        ]
    }).then(res=>{
        if (res.canceled){
            return
        }
        let fileName = basename(res.filePaths[0]);
        if (fileName!=='wow.exe' && fileName!=='Wow.exe'){
            send_msg(ERROR_CODE,res.filePaths[0],"请选择有效的wow.exe文件");
        }else{
            if (set_wow_file(version_data.version,res.filePaths[0])){
                send_msg(OK_CODE,res.filePaths[0],"保存文件路径成功",OK_WOW_PATH);
            }else{
                send_msg(ERROR_CODE,res.filePaths[0],"保存文件路径失败");
            }
        }
    }).catch(err=>{
        send_msg(ERROR_CODE,err,"保存文件路径失败");
    })
}
is_duplicate_directory = function (event,data) {
    return new Promise((resolve, reject)=>{

    })
}
module.exports = {
    select_wow_exe,
    is_duplicate_directory
}
