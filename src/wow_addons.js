import { ElMessageBox } from 'element-plus'

export default {
    // 下载插件
    down_addons(data, context) {
        // 检查是否已经选择wow.exe路径
        return window.electronAPI.getSettings().then(settings => {
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
                url: row.down_link
            } 
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