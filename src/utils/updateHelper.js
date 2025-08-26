// 共用的前端更新检查与弹窗逻辑
// 依赖 Element Plus 的 ElMessage 与 ElMessageBox
import { ElMessage, ElMessageBox } from 'element-plus'

/**
 * 仅调用后端（主进程）检查更新，返回结果对象
 * @returns {Promise<{status: 'update-available'|'no-update'|'error', latestVersion?: string, currentVersion?: string, downloadUrl?: string, message?: string} | null>}
 */
export async function checkForUpdatesRaw() {
  if (!(window.electronAPI && typeof window.electronAPI.checkForUpdates === 'function')) {
    ElMessage.warning('当前环境不支持检查更新')
    return null
  }
  try {
    const result = await window.electronAPI.checkForUpdates()
    return result || null
  } catch (e) {
    console.error('检查更新调用失败:', e)
    ElMessage.error('触发检查更新失败')
    return null
  }
}

// 监听主进程的下载进度事件，并转换为全局DOM事件
if (window.electronAPI && typeof window.electronAPI.onDownloadProgress === 'function') {
  window.electronAPI.onDownloadProgress((data) => {
    const { status, percent, message } = data;
    if (status === 'progress') {
      window.dispatchEvent(new CustomEvent('app-update-progress', { detail: { percent } }));
    } else {
      window.dispatchEvent(new CustomEvent('app-update-end', { detail: { status, message } }));
    }
  });
}


/**
 * 调用检查并在前端弹窗提示
 * @param {{
 *  silenceNoUpdate?: boolean, // 为 true 时，遇到无更新不弹窗
 *  showError?: boolean        // 为 true 时，错误用弹窗提示
 * }} options
 */
export async function checkForUpdatesAndPrompt(options = {}) { 
  const { silenceNoUpdate = false, showError = true } = options
  const result = await checkForUpdatesRaw()
  if (!result) return

  const { status, latestVersion, currentVersion, downloadUrl, message } = result

  if (status === 'update-available') {
    try {
      await ElMessageBox.confirm(
        `发现新版本 ${latestVersion}，当前版本 ${currentVersion}。请点击下方按钮开始下载。`,
        '发现新版本',
        {
          type: 'info',
          confirmButtonText: '立即下载',
          showCancelButton: false,
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          lockScroll: false
        }
      );
      
      // User clicked "立即下载"
      if (downloadUrl) {
        if (window.electronAPI && typeof window.electronAPI.downloadUpdate === 'function') {
          window.dispatchEvent(new CustomEvent('app-update-start'));
          window.electronAPI.downloadUpdate({ downloadUrl });
        } else {
          // Fallback for non-electron environment
          ElMessage.warning('当前环境不支持自动下载，将在浏览器中打开链接');
          window.open(downloadUrl, '_blank');
        }
      } else {
        ElMessage.error('下载链接缺失');
      }
    } catch (_) {
      // This catch block will likely not be hit since there is no cancel button,
      // but it's good practice to keep it for unexpected dismissals.
    }
  } else if (status === 'no-update') {
    if (!silenceNoUpdate) {
      await ElMessageBox.alert(`当前已是最新版本（${currentVersion}）。`, '无可用更新', { type: 'success',lockScroll: false })
    }
  } else if (status === 'error') {
    if (showError) {
      await ElMessageBox.alert(message || '检查更新失败', '更新出错', { type: 'error',lockScroll: false })
    } else {
      console.error('检查更新失败:', message)
    }
  } else {
    ElMessage.warning('未知的更新状态')
  }
}