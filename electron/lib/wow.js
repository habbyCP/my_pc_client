const {dialog, BrowserWindow} = require("electron");
const {basename} = require("path");
const {set_wow_file} = require("./db");
const {ERROR_CODE, OK_CODE, NONE_WOW} = require("./error_code");
 



select_file = function(event, version_data){ 
    return new Promise((resolve, reject) =>{
         dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
            properties: ['openFile'],
            title: "请选择wow.exe文件",
            filters: [
                {name: 'wow.exe', extensions: ['wow.exe']}
            ]
        }).then(res=>{
             let fileName = basename(res.filePaths[0]);
            if (fileName!=='wow.exe' && fileName!=='Wow.exe'){
                resolve({code: ERROR_CODE, message: fileName+'不是有效的wow.exe文件'});
            }else{
                if (set_wow_file(version_data.version,res.filePaths[0])){
                    resolve({code: OK_CODE, data: res.filePaths[0]});
                }else{
                    resolve({code: ERROR_CODE, message: '保存文件路径失败'});
                }
            }
         }).catch(err=>{
             reject({code: 400, message: err});
         })

    })
}

module.exports = {
    select_file
}
