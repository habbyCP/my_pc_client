const resolve = require("resolve");
const sqlite3 = require('sqlite3').verbose();

exports.wow_file_path = async function (version_data){
    console.log("收到的查询语句",version_data)
    return new Promise((resolve, reject) =>{
        let sql ='select path from wow_file_path where version='+version_data.version+' limit 1'
        console.log("sql:",sql)
        db.all(sql, (err, rows) => {
            console.log("数据： ",rows)
            if (err) {
                reject(err)
            } else {
                if (rows.length >= 1){
                    resolve(rows[0]);
                }
            }
        });
    })
}


const db = new sqlite3.Database('my_database.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});




