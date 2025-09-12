const fs = require('fs');
const path = require('path');
const { app } = require('electron');
let BetterSqlite3;

try {
  // 动态引入，若未安装会抛错，便于后续提示
  BetterSqlite3 = require('better-sqlite3');
} catch (e) {
  BetterSqlite3 = null;
}

function getInstalledPlugins() {
  if (!db) {
    console.warn('[db] SQLite 不可用，返回空列表');
    return Promise.resolve([]);
  }
  return new Promise((resolve) => {
    try {
      const sql = `SELECT plugin_id, title, version, file_list, installed_at FROM installed_plugins ORDER BY datetime(installed_at) DESC`;
      const rows = db.prepare(sql).all();
      const list = Array.isArray(rows) ? rows.map(r => ({
        plugin_id: r.plugin_id,
        title: r.title,
        version: r.version,
        file_list: (() => { try { return JSON.parse(r.file_list || '[]') } catch { return [] } })(),
        installed_at: r.installed_at,
      })) : [];
      resolve(list);
    } catch (err) {
      console.error('[db] 读取插件记录失败:', err);
      resolve([]);
    }
  });
}

const getDbPath = () => {
  try {
    // 统一使用用户数据目录
    // 开发：%APPDATA%/turtle-helper
    // 打包：%APPDATA%/龟龟助手（来自 electron-builder productName）
    const userData = app ? app.getPath('userData') : process.cwd();
    const dbDir = path.join(userData, 'data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    return path.join(dbDir, 'plugins.db');
  } catch (_) {
    // 兜底
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    return path.join(dbDir, 'plugins.db');
  }
};

let db = null;

function initDB() {
  if (!BetterSqlite3) {
    console.warn('[db] better-sqlite3 未安装，无法启用 SQLite 持久化');
    return;
  }
  try {
    const dbPath = getDbPath();
    db = new BetterSqlite3(dbPath);
    db.prepare(
      `CREATE TABLE IF NOT EXISTS installed_plugins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT,
        title TEXT,
        version TEXT,
        file_list TEXT,
        installed_at TEXT,
        override_mode INTEGER
      )`
    ).run();
    // 为 plugin_id 创建唯一索引，便于按插件唯一更新
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_installed_plugins_plugin_id ON installed_plugins(plugin_id)`
    ).run();
    
    // 创建插件目录表，用于存储插件的每个目录信息
    db.prepare(
      `CREATE TABLE IF NOT EXISTS plugin_directories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT,
        directory TEXT,
        created_at TEXT,
        override_mode INTEGER
      )`
    ).run();
    // 为 plugin_id 和 directory 创建联合唯一索引，确保每个插件的目录不重复
    db.prepare(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_plugin_directories_plugin_dir ON plugin_directories(plugin_id, directory)`
    ).run();
  } catch (err) {
    console.error('[db] 初始化数据库失败:', err);
  }
}

function saveInstalledPlugin({ plugin_id, title = '', version = '', file_list = [],override_mode=1}) {
  if (!db) {
    console.warn('[db] SQLite 不可用，跳过保存插件记录');
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    try {
      const pid = String(plugin_id ?? '');
      const now = new Date().toISOString();
      const files = JSON.stringify(Array.isArray(file_list) ? file_list : []);

      const sel = db.prepare(`SELECT id FROM installed_plugins WHERE plugin_id = ?`).get(pid);
      if (sel) {
        const stmtU = db.prepare(`UPDATE installed_plugins SET title = ?, version = ?, file_list = ?, installed_at = ?, override_mode = ? WHERE plugin_id = ?`);
        stmtU.run(String(title ?? ''), String(version ?? ''), files, now, override_mode, pid);
        return resolve(true);
      } else {
        const stmtI = db.prepare(`INSERT INTO installed_plugins (plugin_id, title, version, file_list, installed_at, override_mode) VALUES (?, ?, ?, ?, ?, ?)`);
        stmtI.run(pid, String(title ?? ''), String(version ?? ''), files, now, override_mode);
        return resolve(true);
      }
    } catch (err) {
      console.error('[db] 保存插件记录失败:', err);
      return resolve(false);
    }
  });
}



/**
 * 保存插件目录信息到 plugin_directories 表
 * @param {string} plugin_id - 插件ID
 * @param {Array<string>} directories - 目录列表
 * @returns {Promise<boolean>} - 是否保存成功
 */
function savePluginDirectories(plugin_id, directories = []) {
  if (!db) {
    console.warn('[db] SQLite 不可用，跳过保存插件目录记录');
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    try {
      const pid = String(plugin_id ?? '');
      if (!pid) {
        console.warn('[db] 插件ID为空，跳过保存目录记录');
        return resolve(false);
      }
      
      const now = new Date().toISOString();
      const dirs = Array.isArray(directories) ? directories : [];
      
      // 开始事务
      db.prepare('BEGIN').run();
      
      try {
        // 先删除该插件的所有目录记录
        const stmtD = db.prepare(`DELETE FROM plugin_directories WHERE plugin_id = ?`);
        stmtD.run(pid);
        
        // 如果有目录，则插入新记录
        if (dirs.length > 0) {
          const stmtI = db.prepare(`INSERT INTO plugin_directories (plugin_id, directory, created_at) VALUES (?, ?, ?)`);
          for (const dir of dirs) {
            if (typeof dir === 'string' && dir.trim()) {
              stmtI.run(pid, dir.trim(), now);
            }
          }
        }
        
        // 提交事务
        db.prepare('COMMIT').run();
        return resolve(true);
      } catch (err) {
        // 回滚事务
        db.prepare('ROLLBACK').run();
        throw err;
      }
    } catch (err) {
      console.error('[db] 保存插件目录记录失败:', err);
      return resolve(false);
    }
  });
}

initDB();

module.exports = {
  initDB,
  saveInstalledPlugin,
  savePluginDirectories,
  getInstalledPlugins,
};
