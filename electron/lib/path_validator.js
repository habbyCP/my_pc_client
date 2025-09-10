const fs = require('fs');
const path = require('path');
const { ERROR_CODE } = require('./error_code');

/**
 * 查找插件目录（不区分大小写），如果不存在则创建
 * @param {string} gamePath 游戏可执行文件路径
 * @returns {Object} 包含查找结果的对象
 */
function findAddonsDirectory(gamePath, override_mode) {
    if (!gamePath) {
        return {
            success: false,
            code: ERROR_CODE.PARAM_ERROR,
            message: "游戏路径未设置",
            data: null
        };
    }
    
    const gameDir = path.dirname(gamePath); // 获取游戏目录（去掉可执行文件名）
    
    // 覆盖模式 2：直接将插件目录视为游戏目录
    // if (override_mode === 2) {
    //     return {
    //         success: true,
    //         code: 200,
    //         message: "已使用覆盖模式，插件目录为游戏目录",
    //         data: {
    //             addonsPath: gameDir
    //         }
    //     };
    // }
    
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
}

module.exports = {
    findAddonsDirectory
};
