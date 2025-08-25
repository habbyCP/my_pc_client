const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const my_logger = require("electron-log");
 

async function applyClientPatches(app, options) {
 
 
  const { gamePath, selectedPatches } = options;
  my_logger.info(`开始为 ${gamePath} 应用补丁...`);

  const gameDir = path.dirname(gamePath);
  const wowExe = path.basename(gamePath);
  const backupPath = path.join(gameDir, `${wowExe}.bak`);
  const patcherPath = path.join(app.getAppPath(), 'tools', 'vanilla_tweaks.exe');
  const patchedExeName = `${wowExe}_patched.exe`; // vanilla-tweaks默认输出文件名
  const patchedFilePath = path.join(gameDir, patchedExeName);

  try {
    // 1. 检查 Patcher 是否存在
    try {
      await fs.access(patcherPath);
    } catch (e) {
      throw new Error('补丁工具 vanilla_tweaks.exe 未在 tools 目录中找到。');
    }

    // 2. 备份原始 Wow.exe (如果备份不存在)
    try {
      await fs.access(backupPath);
      my_logger.info('备份文件已存在，跳过备份步骤。');
    } catch (e) {
      my_logger.info(`未找到备份，正在创建备份文件: ${backupPath}`);
      await fs.rename(gamePath, backupPath);
    }

    // 3. 准备待打补丁的文件 (从备份复制)
    my_logger.info(`从备份复制新的 ${wowExe} 用于打补丁...`);
    await fs.copyFile(backupPath, gamePath);

    // 4. 构建参数并执行 Patcher
    const patcherArgs = [];
    const patchMap = {
      fov: '--fov',
      camera: '--camera-distance',
      soundChannels: '--sound-channels',
      soundInBackground: '--sound-in-background',
      largeAddressAware: '--large-address-aware',
      fastLoot: '--fast-loot',
      nameplateDistance: '--nameplate-distance',
      cameraJitter: '--fix-camera-jitter',
      maxRender: '--increase-max-render-distance',
      grassRender: '--increase-grass-render-distance'
    };

    for (const [key, value] of Object.entries(selectedPatches)) {
      if (value && patchMap[key]) {
        patcherArgs.push(patchMap[key]);
      }
    }
    patcherArgs.push(gamePath); // 将wow.exe路径作为最后一个参数

    my_logger.info(`执行补丁工具，参数: ${patcherArgs.join(' ')}`);

    await new Promise((resolve, reject) => {
      const process = spawn(patcherPath, patcherArgs, { cwd: gameDir });

      process.stdout.on('data', (data) => my_logger.info(`Patcher-stdout: ${data}`));
      process.stderr.on('data', (data) => my_logger.error(`Patcher-stderr: ${data}`));

      process.on('close', (code) => {
        if (code === 0) {
          my_logger.info('补丁工具成功执行。');
          resolve();
        } else {
          reject(new Error(`补丁工具执行失败，退出码: ${code}`));
        }
      });
    });

    // 5. 清理和重命名
    my_logger.info(`删除临时的 ${wowExe}...`);
    await fs.unlink(gamePath);

    my_logger.info(`将 ${patchedExeName} 重命名为 ${wowExe}...`);
    await fs.rename(patchedFilePath, gamePath);

    my_logger.info('补丁应用成功！');
    return { success: true, message: '所有选定的补丁已成功应用！' };

  } catch (error) {
    my_logger.error(`应用补丁时发生错误: ${error.message}`);
    // 尝试恢复
    try {
      const backupExists = await fs.access(backupPath).then(() => true).catch(() => false);
      if (backupExists) {
        await fs.copyFile(backupPath, gamePath);
        my_logger.info('已从备份中恢复原始 Wow.exe。');
      }
    } catch (recoveryError) {
      my_logger.error(`恢复原始 Wow.exe 失败: ${recoveryError.message}`);
    }
    return { success: false, error: error.message };
  }
}

module.exports = { applyClientPatches };
