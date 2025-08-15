import { ElMessageBox } from 'element-plus'

// 统一的详细错误日志工具函数：任意位置可复用
export function logDetailedError(tag, e) {
    try {
        const title = tag ? `${tag} 详细信息` : '错误详细信息'
        console.groupCollapsed(title)
        console.error('message:', e && e.message)
        console.error('name:', e && e.name)
        console.error('stack:', e && e.stack)
        console.error('toString:', e && e.toString && e.toString())
        console.error('raw error object:', e)
        console.groupEnd()
    } catch (_logErr) {
        console.error(tag || '错误', e)
    }
}

export default {
    // 下载插件
    down_addons(data, context) {
        // 检查是否已经选择wow.exe路径
        return window.electronAPI.getSettings().then(async (settings) => {
            if (!settings || !settings.gamePath) {
                // 如果没有选择wow.exe路径，显示确认对话框
                ElMessageBox.confirm(
                    '您还没有设置WoW路径,是否前往设置',
                    '提示',
                    {
                        confirmButtonText: '前往设置',
                        cancelButtonText: '取消',
                        type: 'warning',
                        customClass: 'custom-message-box',
                        distinguishCancelAndClose: true,
                        center: true
                    }
                ).then(() => {
                    // 用户点击确认后跳转到设置页面
                    context.activeTab = '设置'
                }).catch(() => {
                    // 用户取消，不做任何操作
                })
                return
            }
            
            // 继续下载插件的逻辑
            let row = data.row 
            context.main_loading = true
            context.main_loading_word = "开始下载..."
            context.download_progress = 0

            // 准备下载参数
            const downloadParams = {
                version: context.version,
                id: row.id,
                title: row.title,
                cover: false,
                url: row.down_link,
                file_list: Array.isArray(row?.file_list) ? row.file_list : []
            }  
            // 下载前目录冲突检查（如果提供了 file_list）
            if (downloadParams.file_list && downloadParams.file_list.length > 0) { 
                try {
                    // 确保传给主进程的是可结构化克隆的纯数据（避免 Vue Proxy/复杂对象）
                    const safeDirList = JSON.parse(JSON.stringify(
                        downloadParams.file_list.map(it => {
                            if (it == null) return ''
                            try { return String(it) } catch (_) { return '' }
                        })
                    ))
                    const dupRes = await window.electronAPI.isDuplicateDirectory({
                        version: String(context.version || ''),
                        dir_list: safeDirList
                    })
                    const conflicts = Array.isArray(dupRes?.data) ? dupRes.data : []
                    if (conflicts.length > 0) {
                        // 弹出确认对话框
                        try {
                            await ElMessageBox.confirm(
                                `以下插件文件夹已存在：\n${conflicts.join(', ')}\n是否覆盖安装？`,
                                '检测到目录冲突',
                                {
                                    confirmButtonText: '覆盖安装',
                                    cancelButtonText: '取消',
                                    type: 'warning',
                                    customClass: 'custom-message-box',
                                    distinguishCancelAndClose: true,
                                    center: true
                                }
                            )
                            downloadParams.cover = true
                        } catch (_) {
                            // 用户取消
                            context.main_loading = false
                            return
                        }
                    }
                } catch (e) {
                    // 检测失败不阻塞下载，但记录更详细的日志
                    logDetailedError('目录冲突检测失败', e)
                }
            }
            console.log('111', downloadParams)
            // 使用await获取返回值
            return window.electronAPI.downloadFile(downloadParams)
                .then(result => {
                    console.log('下载结果:', result);
                    
                    if (result.code === 200) {
                        // 下载成功
                        context.main_loading = false;
                        context.download_progress = 100;
                        ElMessageBox.alert(
                            result.message || '插件下载成功',
                            '成功',
                            {
                                confirmButtonText: 'OK',
                                type: 'success',
                                center: true,
                                customClass: 'custom-message-box'
                            }
                        );
                    } else {
                        // 下载失败
                        context.main_loading = false;
                        ElMessageBox.alert(
                            result.message || '插件下载失败',
                            '错误',
                            {
                                confirmButtonText: 'OK',
                                type: 'error',
                                center: true,
                                customClass: 'custom-message-box',
                                lockScroll: false
                            }
                        );
                    }
                })
                .catch(error => {
                    // 处理错误
                    context.main_loading = false;
                    console.error('下载出错:', error);
                    ElMessageBox.alert(
                        error.message || '插件下载过程中出现错误',
                        '错误',
                        {
                            confirmButtonText: 'OK',
                            type: 'error',
                            center: true,
                            customClass: 'custom-message-box',
                            lockScroll: false
                        }
                    );
                });
        })
    }
}