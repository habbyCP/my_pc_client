const resolve = require("resolve");
const sqlite3 = require('sqlite3').verbose();

exports.wow_file_path =  function (version_data,data_deal){
    console.log("收到的查询语句",version_data)
    let sql ='select path from wow_file_path where version='+version_data.version+' limit 1'
    console.log("sql:",sql)
    db.all(sql, data_deal);
}


const db = new sqlite3.Database('my_database.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});




