const {BrowserWindow} = require('electron')
const {info} = require("./log");


exports.send_msg = function (code, data, msg,sub_code) {
    let send_data =
        {
            code: code,
            sub_code: sub_code,
            data: data,
            message: msg
        }
    info("下发指令", send_data)
    BrowserWindow.getFocusedWindow().webContents.send('response', send_data);
}
