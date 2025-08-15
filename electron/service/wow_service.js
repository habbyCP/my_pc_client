const fs = require("fs");
const {WOW_PATH_CONFIG} = require("../config");
const my_logger = require("electron-log");
const path = require("path");


wow_path = function (wow_data) {
    if (!fs.existsSync(WOW_PATH_CONFIG)) {
        return ''
    }
    let file_json_data= fs.readFileSync(WOW_PATH_CONFIG,'utf8');
    let file_data = {}
    try {
        file_data = JSON.parse(file_json_data);
    } catch (error) {
        my_logger.error(error)
        return ''
    }
    if (file_data.hasOwnProperty(wow_data.version)){
        return file_data[wow_data.version]
    }else{
        return ''
    }
}
all_wow_path = function () {
    if (!fs.existsSync(WOW_PATH_CONFIG)) {
        return {}
    }
    let file_json_data= fs.readFileSync(WOW_PATH_CONFIG,'utf8');
    let file_data = {}
    try {
        file_data = JSON.parse(file_json_data);
    } catch (error) {
        my_logger.error(error)
        return {}
    }
    return file_data
}
addons_dir_list = function (wow_data) {
    let the_wow_path = wow_path(wow_data)
    if(path.length<=0){
        return []
    }else{
        let addons_path = path.dirname(the_wow_path) + "/Interface/Addons/"
        return fs.readdirSync(addons_path)
    }
}
module.exports = {
    wow_path,
    addons_dir_list,
    all_wow_path
}
