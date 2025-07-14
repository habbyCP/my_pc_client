

const{OK_CODE,ERROR_CODE} = require("./error_code");
const fs = require("fs");
const path = require("path");
const {debug,info,error} = require("./log");
const {wow_file_path} = require("./wow");
const {wow_path} = require("../service/wow_service");

//获取realmlist文件路径
get_realmlist_path = function(version){
    let realmlist_file_path = ''
    switch (version) {
        case "3.35":
            realmlist_file_path = "/data/zhCN/realmlist.wtf"
            break
        case "2.43":
            realmlist_file_path = "/realmlist.wtf"
            break
    }
    return  realmlist_file_path
}

//获取realmlist文件
get_realmlist = function (event,version_data){
    return new  Promise((resolve, reject) =>{
        let wow_file_path = wow_path({version: version_data.version})
        if (wow_file_path.length<=0){
            resolve({
                code: ERROR_CODE,
                message: "没有配置wow.exe路径"
            });
        }else{
            let realmlist_file_path = path.dirname(wow_file_path)+get_realmlist_path(version_data.version)
            if (!fs.existsSync(realmlist_file_path)) {
                resolve({
                    code: ERROR_CODE,
                    message: "不存在realmlist.wtf文件"
                });
            }
            let realmlist_file_content = fs.readFileSync(realmlist_file_path,'utf8')
            if(realmlist_file_content.trim().replace(/\s{2,}/g, ' ')!=="set realmlist cn-logon.stormforge.gg"){
                resolve({
                    code: ERROR_CODE,
                    message: realmlist_file_path+"文件内容无效",
                    data:realmlist_file_content
                });
            }
            resolve({
                code:OK_CODE,
                message:"OK",
                data:realmlist_file_content,
            })
        }
    })
}

//修复realmlist
fix_realmlist = function(_,version_data){
    return new  Promise((resolve, reject) =>{
        let wow_file_path = wow_path({version: version_data.version})
        let realmlist_path = get_realmlist_path(version_data.version)
        realmlist_path = path.dirname(wow_file_path)+realmlist_path
        //写入文件内容
        //向realmlist_path写入内容
        try {
            fs.writeFileSync(realmlist_path, "set realmlist cn-logon.stormforge.gg");
            resolve({
                code: OK_CODE,
                message: "成功修复realmlist文件"
            });
        } catch (error) {
            resolve({
                code: ERROR_CODE,
                message: "修复realmlist文件出错",
                data: error.message
            });
        }
    })
}


module.exports = {
    get_realmlist,
    fix_realmlist
}
