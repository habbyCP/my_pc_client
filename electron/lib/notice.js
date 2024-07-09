const {BrowserWindow } = require('electron')


exports.send_msg = function (code,data,msg) {
    let send_data =
        {
            code: code,
            data: data,
            msg: msg
        }
    BrowserWindow.getFocusedWindow().webContents.send('response', send_data);
}
