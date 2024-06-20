const resolve = require("resolve");
const sqlite3 = require('sqlite3').verbose();

exports.wow_file_path = async function (event,version_data){

    return new Promise((resolve, reject) =>{
        db.all('select path from wow_file_path where version='+version_data.version+' limit 1', (err, rows) => {
            console.log("数据： ",rows)
            if (err) {
                reject(err)
            } else {
                if (rows.length >= 1){
                    console.log("查询的版本号",version_data.version)
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




