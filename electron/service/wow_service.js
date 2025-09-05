// const fs = require("fs");
// const {WOW_PATH_CONFIG} = require("../config");
// const my_logger = require("electron-log");
// const path = require("path");
// const { getSettings } = require("../lib/settings");
// const { findAddonsDirectory } = require("../lib/path_validator");

 


// addons_dir_list = function (wow_data) {
//     try {
//         // 与 electron/lib/down.js 一致：优先从设置中读取 gamePath，并通过 findAddonsDirectory 解析/创建 AddOns 目录
//         const settings = getSettings();
//         if (!settings || !settings.gamePath) {
//             return [];
//         }

//         const result = findAddonsDirectory(settings.gamePath);
//         if (!result || !result.success || !result.data || !result.data.addonsPath) {
//             return [];
//         }
//         const addonsPath = result.data.addonsPath;
//         return fs.existsSync(addonsPath) ? fs.readdirSync(addonsPath) : [];
//     } catch (err) {
//         // 兜底：保持旧逻辑（基于 wow_path）以避免极端情况下完全不可用
//         try {
//             const the_wow_path = wow_path(wow_data) || '';
//             if (!the_wow_path || the_wow_path.length <= 0) {
//                 return [];
//             }
//             const addons_path_fallback = path.join(path.dirname(the_wow_path), 'Interface', 'AddOns');
//             return fs.existsSync(addons_path_fallback) ? fs.readdirSync(addons_path_fallback) : [];
//         } catch (e2) {
//             my_logger.error('addons_dir_list error:', err, e2);
//             return [];
//         }
//     }
// }
// module.exports = {
//     wow_path,
//     addons_dir_list,
//     all_wow_path
// }
