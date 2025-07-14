const {exec} = require('child_process');
const os = require("os");
const iconv = require('iconv-lite');
const encoding = os.platform() === 'win32' ? 'cp936' : 'utf-8';
const binaryEncoding = 'binary';
// 执行命令并获取结果
exports.runExec = function(cmd) {
    return new Promise((resolve, reject) => {
        exec (`"${cmd}"`, { encoding: binaryEncoding }, function(error, stdout, stderr) {
            if (error) {
                reject(iconv.decode(new Buffer(error.message, binaryEncoding), encoding));
            } else {
                resolve(iconv.decode(new Buffer(stdout, binaryEncoding), encoding));
            }
        });
    })
}