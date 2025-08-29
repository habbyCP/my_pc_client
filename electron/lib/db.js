const fs = require('fs');
const path = require('path');
const { app } = require('electron');
let sqlite3;

try {
  // 动态引入，若未安装会抛错，便于后续提示
  sqlite3 = require('sqlite3').verbose();
} catch (e) {
  sqlite3 = null;
}

function getInstalledPlugins() {
  if (!db) {
    console.warn('[db] SQLite 不可用，返回空列表');
    return Promise.resolve([]);
  }
  return new Promise((resolve) => {
    const sql = `SELECT plugin_id, title, version, file_list, installed_at FROM installed_plugins ORDER BY datetime(installed_at) DESC`;
 
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error('[db] 读取插件记录失败:', err);
        return resolve([]);
      }
      console.log(rows)
      const list = Array.isArray(rows) ? rows.map(r => ({
        plugin_id: r.plugin_id,
        title: r.title,
        version: r.version,
        file_list: (() => { try { return JSON.parse(r.file_list || '[]') } catch { return [] } })(),
        installed_at: r.installed_at,
      })) : [];
      console.log(list)
      resolve(list);
    });
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
  if (!sqlite3) {
    console.warn('[db] sqlite3 未安装，无法启用 SQLite 持久化');
    return;
  }
  const dbPath = getDbPath();
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[db] 打开数据库失败:', err);
      return;
    }
    db.run(
      `CREATE TABLE IF NOT EXISTS installed_plugins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plugin_id TEXT,
        title TEXT,
        version TEXT,
        file_list TEXT,
        installed_at TEXT
      )`,
      (e) => {
        if (e) console.error('[db] 初始化表失败:', e);
        // 为 plugin_id 创建唯一索引，便于按插件唯一更新
        db.run(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_installed_plugins_plugin_id ON installed_plugins(plugin_id)`,
          (ie) => { if (ie) console.error('[db] 创建索引失败:', ie); }
        );
      }
    );
  });
}

function saveInstalledPlugin({ plugin_id, title = '', version = '', file_list = [] }) {
  if (!db) {
    console.warn('[db] SQLite 不可用，跳过保存插件记录');
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    const pid = String(plugin_id ?? '');
    const now = new Date().toISOString();
    const files = JSON.stringify(Array.isArray(file_list) ? file_list : []);

    // 先查是否存在
    db.get(`SELECT id FROM installed_plugins WHERE plugin_id = ?`, [pid], (selErr, row) => {
      if (selErr) {
        console.error('[db] 查询插件记录失败:', selErr);
        return resolve(false);
      }
      if (row) {
        // 存在则更新
        const sqlU = `UPDATE installed_plugins SET title = ?, version = ?, file_list = ?, installed_at = ? WHERE plugin_id = ?`;
        const paramsU = [String(title ?? ''), String(version ?? ''), files, now, pid];
        db.run(sqlU, paramsU, function (updErr) {
          if (updErr) {
            console.error('[db] 更新插件记录失败:', updErr);
            return resolve(false);
          }
          return resolve(true);
        });
      } else {
        // 不存在则插入
        const sqlI = `INSERT INTO installed_plugins (plugin_id, title, version, file_list, installed_at) VALUES (?, ?, ?, ?, ?)`;
        const paramsI = [pid, String(title ?? ''), String(version ?? ''), files, now];
        db.run(sqlI, paramsI, function (insErr) {
          if (insErr) {
            console.error('[db] 插入插件记录失败:', insErr);
            return resolve(false);
          }
          return resolve(true);
        });
      }
    });
  });
}

initDB();

module.exports = {
  initDB,
  saveInstalledPlugin,
  getInstalledPlugins,
};
