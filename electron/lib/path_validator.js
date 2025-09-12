const fs = require('fs');
const path = require('path');
const { ERROR_CODE } = require('./error_code');

/**
 * 查找插件目录（不区分大小写），如果不存在则创建
 * @param {string} gamePath 游戏可执行文件路径
 * @returns {Object} 包含查找结果的对象
 */
async function AddonsInstallDirectory(gamePath, override_mode) {
    return new Promise((resolve, reject) => {
        if (!gamePath) {
            resolve({
                success: false,
                code: ERROR_CODE.PARAM_ERROR,
                message: "游戏路径未设置",
                data: null
            });
            return;
        }

        const gameDir = path.dirname(gamePath); // 获取游戏目录（去掉可执行文件名）
    
        // 覆盖模式 2：直接将插件目录视为游戏目录
        if (override_mode === 2) {
            resolve({
                success: true,
                code: 200,
                message: "已使用覆盖模式，插件目录为游戏目录",
                data: {
                    addonsPath: gameDir
                }
            });
            return;
        }

        try {
            // 读取游戏目录下的所有文件和文件夹
            const items = fs.readdirSync(gameDir);
        
            // 查找Interface目录（不区分大小写）
            let interfaceDir = items.find(item => 
                item.toLowerCase() === 'interface' && 
                fs.statSync(path.join(gameDir, item)).isDirectory()
            );
        
            let interfacePath;
        
            // 如果Interface目录不存在，则创建
            if (!interfaceDir) {
                console.log("Interface目录不存在，创建中...");
                interfaceDir = 'Interface'; // 使用标准大小写
                interfacePath = path.join(gameDir, interfaceDir);
                fs.mkdirSync(interfacePath, { recursive: true });
                console.log("已创建Interface目录:", interfacePath);
            } else {
                interfacePath = path.join(gameDir, interfaceDir);
            }
        
            // 检查Interface目录下是否有Addons目录（不区分大小写）
            let interfaceItems;
            try {
                interfaceItems = fs.readdirSync(interfacePath);
            } catch (error) {
                // 如果读取失败，可能是权限问题
                return {
                    success: false,
                    code: ERROR_CODE.SYSTEM_ERROR,
                    message: "无法读取Interface目录: " + error.message,
                    data: null
                };
            }
        
            let addonsDir = interfaceItems.find(item => 
                item.toLowerCase() === 'addons' && 
                fs.statSync(path.join(interfacePath, item)).isDirectory()
            );
        
            let addonsPath;
        
            // 如果Addons目录不存在，则创建
            if (!addonsDir) {
                console.log("Addons目录不存在，创建中...");
                addonsDir = 'AddOns'; // WoW通常使用这种大小写
                addonsPath = path.join(interfacePath, addonsDir);
                fs.mkdirSync(addonsPath, { recursive: true });
                console.log("已创建Addons目录:", addonsPath);
            } else {
                addonsPath = path.join(interfacePath, addonsDir);
            }
        
            // 返回找到或创建的插件目录
            return {
                success: true,
                code: 200,
                message: "成功找到或创建插件目录",
                data: {
                    addonsPath: addonsPath
                }
            };
        
        } catch (error) {
            console.error("检查或创建插件目录时出错:", error);
        return {
            success: false,
            code: ERROR_CODE.SYSTEM_ERROR,
            message: "检查或创建插件目录时出错: " + error.message,
            data: null
        };
        }
    });
}

function copy_dir(tmp_dir, addons_dir) {
    const {debug, error} = require("../lib/log"); 
    
    return new Promise((resolve, reject) => {
        // 读取源目录中的所有文件和文件夹
        fs.readdir(tmp_dir, { withFileTypes: true }, (err, entries) => {
            if (err) {
                error(`读取源目录失败: ${err.message}`);
                return reject(err);
            }
            
            // 确保目标目录存在
            if (!fs.existsSync(addons_dir)) {
                try {
                    fs.mkdirSync(addons_dir, { recursive: true });
                    debug(`创建目标目录: ${addons_dir}`);
                } catch (mkdirErr) {
                    error(`创建目标目录失败: ${mkdirErr.message}`);
                    return reject(mkdirErr);
                }
            }
            
            // 如果源目录为空，直接返回成功
            if (entries.length === 0) {
                debug(`源目录为空，无需复制`);
                return resolve();
            }
            
            // 跟踪复制操作的完成情况
            let completed = 0;
            let hasError = false;
            
            // 遍历源目录中的每个条目
            entries.forEach(entry => {
                const sourcePath = path.join(tmp_dir, entry.name);
                const destPath = path.join(addons_dir, entry.name);
                
                debug(`复制: ${sourcePath} -> ${destPath}`);
                
                // 使用递归复制
                fs.cp(sourcePath, destPath, { recursive: true }, (cpErr) => {
                    if (cpErr && !hasError) {
                        hasError = true;
                        error(`复制失败: ${cpErr.message}`);
                        return reject(cpErr);
                    }
                    
                    completed++;
                    debug(`完成复制 ${entry.name} (${completed}/${entries.length})`);
                    
                    // 当所有条目都复制完成时，解析 Promise
                    if (completed === entries.length && !hasError) {
                        debug(`所有文件复制完成，共 ${entries.length} 个条目`);
                        resolve();
                    }
                });
            });
        });
    });
}


function deletePath(targetPath) {
    if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
    }
}


module.exports = {
    AddonsInstallDirectory,
    copy_dir,
    deletePath
};
