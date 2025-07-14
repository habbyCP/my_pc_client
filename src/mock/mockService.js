import { mockCategories, getAddonsByCategory, searchAddons } from './mockData.js'
import { mockClients, searchClients } from './clientMockData.js'

// 模拟API延迟
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API服务
export const mockApiService = {
  // 获取分类列表
  async getCategories() {
    await delay(300)
    return Promise.resolve(mockCategories)
  },

  // 获取插件列表
  async getAddonsList(params = {}) {
    await delay(400)
    
    const { title, category_id, page = 0, page_size = 100 } = params
    
    // 根据搜索条件过滤数据
    let result = searchAddons(title, category_id)
    
    // 模拟分页（虽然当前mock数据量不大，但保持接口一致性）
    const startIndex = page * page_size
    const endIndex = startIndex + page_size
    const paginatedData = result.data.slice(startIndex, endIndex)
    
    // 添加一些动态生成的数据（与原代码保持一致）
    paginatedData.forEach((item, index) => {
      // 随机生成下载量
      item.download_count = ((90 - index * 5) / 10).toFixed(1) + '万'
      // 随机生成体积
      item.size = index === 2 ? '35.64MB' : (index % 3 === 0 ? (3 - index * 0.2).toFixed(2) + 'MB' : (400 + index * 20) + 'KB')
      // 随机生成是否已安装
      item.installed = index % 2 === 1
      item.modified = new Date().toLocaleString()
    })
    
    return Promise.resolve({
      ...result,
      data: paginatedData,
      pagination: {
        page,
        page_size,
        total: result.data.length,
        total_pages: Math.ceil(result.data.length / page_size)
      }
    })
  },

  // 获取客户端列表
  async getClientsList(params = {}) {
    await delay(300)
    
    const { title } = params
    
    // 根据搜索条件过滤数据
    let result = searchClients(title)
    
    return Promise.resolve(result)
  }
}

// 检查是否使用Mock模式
export async function shouldUseMock() {
  if (window.electronAPI) {
    try {
      const settings = await window.electronAPI.getSettings()
      console.log('当前设置:', settings)
      console.log('useMockData值:', settings.useMockData)
      const result = settings.useMockData === true
      console.log('是否使用Mock模式:', result)
      return result
    } catch (error) {
      console.error('获取设置失败:', error)
      return false
    }
  }
  console.log('window.electronAPI不存在，默认不使用Mock')
  return false
}