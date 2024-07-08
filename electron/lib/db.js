const resolve = require("resolve");
const sqlite3 = require('sqlite3').verbose();

exports.wow_file_path =  function (version_data){
    console.log("收到的查询语句",version_data)
    return new Promise((resolve, reject) => {
        let sql ='select path from wow_file_path where version='+version_data.version+' limit 1'
        console.log("sql:",sql)
        db.all(sql, (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row.length === 0) {
                    reject("没有选择路径");
                }else{
                    resolve(row);
                }
            }
        });
    })

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




