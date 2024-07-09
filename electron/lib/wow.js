const {dialog, BrowserWindow} = require("electron");
const {basename} = require("path");
const {set_wow_file} = require("./db");


select_file = function(event, version_data){
    console.log('传参',version_data)
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
                resolve({code: 502, message: fileName+'不是有效的wow.exe文件'});
            }else{
                set_wow_file(version_data.version,res.filePaths[0])
                resolve({code: 200, message: res.filePaths[0]});

            }
         }).catch(err=>{
             reject({code: 400, message: err});
         })

    })
}

module.exports = {
    select_file
}
