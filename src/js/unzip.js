const unzipper = require('unzipper');
const fs = require('fs');
const unzipFile = (zipPath, outputPath) => {
    fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: outputPath }))
        .on('close', () => {
            console.log('Files successfully decompressed');
        });
};
module.exports = {
    unzipFile
};
