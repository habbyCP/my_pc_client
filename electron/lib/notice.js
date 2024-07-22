const {debug} = require("./log");


function send_msg  (event,code, data, msg,sub_code) {
        let send_data =
            {
                code: code,
                sub_code: sub_code,
                data: data,
                message: msg
            }
        debug("下发指令", send_data)
    event.sender.send('response', send_data);
}

module.exports = {
    send_msg,

};