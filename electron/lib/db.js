
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const {NONE_WOW,ERROR_CODE} = require("./error_code");
const {wow_path} = require("../service/wow_service");



//
// exports.addons_insert = function (addon_list,data_deal){
//
//     db.run("BEGIN TRANSACTION");
//     const stmt = db.prepare('insert into wow_addons(id, title, version, addons_version, path, update_time) values(?, ?, ?, ?, ?, ?)');
//
//     for (const addons of addon_list) {
//         //获取当前时间戳
//         stmt.run(addons.id, addons.title, addons.version, addons.addons_version, addons.path,new Date(addons.update_time*1000));
//     }
//     db.run("COMMIT", data_deal);
// }
//
// const db = new sqlite3.Database('my_database.db', (err) => {
//     if (err) {
//         console.error('Error opening database ' + err.message);
//     } else {
//         console.log('Connected to the SQLite database.');
//     }
// });




