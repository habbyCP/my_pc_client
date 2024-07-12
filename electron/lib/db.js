
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const {NONE_WOW,ERROR_CODE} = require("./error_code");
const json_path = './file.json'
exports.wow_file_path =  function (version_data){
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(json_path)) {
            reject({
                code: NONE_WOW,
                message: "没有配置wow.exe路径"
            });
        }else{
            let file_json_data= fs.readFileSync(json_path,'utf8');
            let file_data = {}
            try {
                file_data = JSON.parse(file_json_data);
            } catch (error) {
                reject({
                    code: ERROR_CODE,
                    message: "路径配置的json文件解析出错,请点击设置wow.exe路径重新设置"
                });
                return;
            }
            if (file_data.hasOwnProperty(version_data.version)){
                resolve({
                    code: 200,
                    data: file_data[version_data.version],
                    message: ''
                });
            }else{
                reject({
                    code: NONE_WOW,
                    message: "没有找到wow.exe路径"
                });
            }
        }
    })
}
exports.set_wow_file = function (version,wow_path){
    console.log("版本",version)
    if (!fs.existsSync(json_path)){
        fs.writeFileSync(json_path, JSON.stringify({[version]: wow_path}));
    }else {
        let file_json_data= fs.readFileSync(json_path,'utf8');
        let file_data
        try {
            file_data = JSON.parse(file_json_data);
        } catch (error) {
            fs.writeFileSync(json_path, JSON.stringify({[version]: wow_path}));
            return false
        }

        file_data[version] = wow_path;
        fs.writeFileSync(json_path, JSON.stringify(file_data));
        console.log('保存成功',file_data)
        return true

    }
}

exports.addons_insert = function (addon_list,data_deal){

    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare('insert into wow_addons(id, title, version, addons_version, path, update_time) values(?, ?, ?, ?, ?, ?)');

    for (const addons of addon_list) {
        //获取当前时间戳
        stmt.run(addons.id, addons.title, addons.version, addons.addons_version, addons.path,new Date(addons.update_time*1000));
    }
    db.run("COMMIT", data_deal);
}

const db = new sqlite3.Database('my_database.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});




