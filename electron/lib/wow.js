const {dialog, BrowserWindow} = require("electron");
const {basename} = require("path");
const {ERROR_CODE, OK_CODE, OK_WOW_PATH, NONE_WOW} = require("./error_code");
const {send_msg} = require("./notice");
const {wow_path,addons_dir_list, all_wow_path} = require("../service/wow_service");
const fs = require("fs");
const json_path = './file.json'
const {runExec} = require("./runExec");
const vi = require("win-version-info");
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
        let version = get_wow_version(res.filePaths[0])
        return
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

let get_wow_version = async function (exeFilePath) {
    let res = vi(exeFilePath)
    console.log(res)
// 获取 EXE 文件的版本信息（Windows 下）
//     exec(`wmic datafile where name="${exeFilePath.replace(/\\/g, '\\\\')}" get Version`, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`执行错误: ${error}`);
//             return;
//         }
//         if (stderr) {
//             console.error(`标准错误: ${stderr}`);
//             return;
//         }
//         console.log(`EXE 文件版本信息: ${stdout}`);
//     });

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
