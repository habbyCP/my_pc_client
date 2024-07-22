const {dialog, BrowserWindow} = require("electron");
const {basename} = require("path");
const {ERROR_CODE, OK_CODE, OK_WOW_PATH, NONE_WOW} = require("./error_code");
const {send_msg} = require("./notice");
const {wow_path,addons_dir_list, all_wow_path} = require("../service/wow_service");
const fs = require("fs");
const json_path = './file.json'
const vi = require("win-version-info");
const version_map = {
    "2.43":"2, 4, 3, 8606",
    "3.35":"3, 3, 5, 12340",
}
wow_file_path =  function (version_data){
    return new Promise((resolve, reject) => {
        let the_path = wow_path({version: version_data.version})
        if (the_path.length<=0){
            resolve({
                code: NONE_WOW,
                message: "没有配置wow.exe路径"
            });
        }else{
            resolve({
                code: 200,
                data: the_path,
                message: ''
            });
        }
    })
}
all_wow_file_path = function (){
    return new Promise((resolve, reject) => {
        let path_list = all_wow_path()
        if (path_list.length<=0){
            resolve({
                code: NONE_WOW,
                message: "没有配置wow.exe路径"
            });
        }else{
            resolve({
                code: 200,
                data: path_list,
                message: ''
            });
        }
    })
}

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
        if (fileName.toLowerCase()!=='wow.exe'){
            send_msg(event,ERROR_CODE,res.filePaths[0],"请选择有效的wow.exe文件");
        }else{
            let version = get_wow_version(res.filePaths[0])
            if (version!==version_map[version_data.version]){
                send_msg(event,ERROR_CODE,res.filePaths[0],"这个 wow.exe 不是版本: "+version_data.version);
                return
            }
            if (set_wow_file(version_data.version,res.filePaths[0])){
                send_msg(event,OK_CODE,res.filePaths[0],"保存文件路径成功",OK_WOW_PATH);
            }else{
                send_msg(event,ERROR_CODE,res.filePaths[0],"保存文件路径失败");
            }
        }
    }).catch(err=>{
        send_msg(event,ERROR_CODE,err,"保存文件路径失败");
    })
}

let get_wow_version =  function (exeFilePath) {
    let res = vi(exeFilePath)
    if (res.hasOwnProperty('FileVersion')){
        return res.FileVersion.trim()
    }else{
        return ''
    }

}

let set_wow_file = function (version,wow_path){
    if (!fs.existsSync(json_path)){
        fs.writeFileSync(json_path, JSON.stringify({[version]: wow_path}));
        return true
    } else {
        let file_json_data= fs.readFileSync(json_path,'utf8');
        let file_data
        try {
            file_data = JSON.parse(file_json_data);
        } catch (error) {
            fs.writeFileSync(json_path, JSON.stringify({[version]: wow_path}));
            return true
        }

        file_data[version] = wow_path;
        fs.writeFileSync(json_path, JSON.stringify(file_data));
        console.log('保存成功',file_data)
        return true

    }
}

is_duplicate_directory = function (event,data) {
    return new Promise((resolve, reject)=>{
        let dir_list = addons_dir_list({version:data.version})
        let result = dir_list.filter(item => data.dir_list.includes(item));
        resolve({
            code: OK_CODE,
            message: "",
            data:result
        });

    })
}
module.exports = {
    select_wow_exe,
    is_duplicate_directory,
    wow_file_path,
    all_wow_file_path
}
