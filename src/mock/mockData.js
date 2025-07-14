// Mock数据定义
export const mockCategories = {
  code: 200,
  message: "成功",
  data: [
    { id: '0', name: '全部插件', icon: 'Collection' },
    { id: '1', name: '整合包', icon: 'Monitor' },
    { id: '2', name: '界面美化', icon: 'Monitor' },
    { id: '3', name: '战斗辅助', icon: 'Warning' },
    { id: '4', name: '任务助手', icon: 'Document' },
    { id: '5', name: '背包整理', icon: 'Files' },
    { id: '6', name: '团队工具', icon: 'User' },
    { id: '7', name: '地图增强', icon: 'Location' },
    { id: '8', name: '拍卖行', icon: 'Search' },
    { id: '9', name: '职业专用', icon: 'Star' }
  ]
}

export const mockAddons = {
  code: 200,
  message: "成功",
  data: [
    {
      id: 1,
      title: "ElvUI",
      description: "最受欢迎的界面整合插件，提供完整的UI替换方案",
      text: "ElvUI是一个完整的用户界面替换插件，为World of Warcraft提供现代化、简洁的界面设计。它包含了单位框架、动作条、小地图、聊天框等所有界面元素的重新设计。\n\n主要特性：\n• 现代化的界面设计\n• 高度可定制化\n• 内置配置导入/导出\n• 支持多分辨率\n• 定期更新维护",
      version: "13.53",
      author: "ElvUI团队",
      category_id: [1, 2],
      download_url: "https://www.tukui.org/download.php?ui=elvui",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["界面", "UI", "整合"],
      rating: 4.8,
      last_update: "2024-01-15",
      file_size: "8.5MB",
      downloads: 156732,
      compatibility: ["10.2.5", "10.2.0"],
      installation_guide: "1. 下载插件包\n2. 解压到Interface/AddOns目录\n3. 重启游戏\n4. 按照设置向导配置",
      screenshots: ["http://wow.60wow.cc:88/static/picture/pic-02.png", "http://wow.60wow.cc:88/static/picture/pic-02.png"]
    },
    {
      id: 2,
      title: "WeakAuras",
      description: "强大的战斗辅助插件，可以创建自定义的视觉和音频提醒",
      text: "WeakAuras是魔兽世界最强大的自定义界面元素创建工具。它允许玩家创建自定义的视觉提醒、进度条、图标和文字显示，帮助监控技能冷却、buff/debuff状态、战斗事件等。\n\n主要功能：\n• 自定义视觉提醒\n• 技能监控\n• 战斗分析\n• 触发器系统\n• 分享配置",
      version: "5.12.2",
      author: "WeakAuras团队",
      category_id: [2, 3, 6],
      download_url: "https://www.curseforge.com/wow/addons/weakauras-2",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["战斗", "提醒", "监控"],
      rating: 4.9,
      last_update: "2024-01-20",
      file_size: "12.3MB",
      downloads: 203847,
      compatibility: ["10.2.5", "10.2.0"],
      installation_guide: "1. 下载插件\n2. 安装到AddOns文件夹\n3. 游戏内配置触发器",
      screenshots: ["/images/wa_1.jpg", "/images/wa_2.jpg"]
    },
    {
      id: 3,
      title: "DBM (Deadly Boss Mods)",
      description: "经典的首领战辅助插件，提供战术提醒和倒计时",
      text: "Deadly Boss Mods (DBM) 是魔兽世界历史最悠久、使用最广泛的首领战辅助插件之一。它为玩家提供首领技能的倒计时、警告和战术建议。\n\n核心功能：\n• 首领技能倒计时\n• 危险技能警告\n• 战术建议\n• 团队分配工具\n• 语音包支持",
      version: "10.2.12",
      author: "MysticalOS",
      category_id: [3, 6],
      download_url: "https://www.curseforge.com/wow/addons/deadly-boss-mods",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["首领", "团队", "PVE"],
      rating: 4.7,
      last_update: "2024-01-18",
      file_size: "15.7MB",
      downloads: 189234,
      compatibility: ["10.2.5", "10.2.0", "10.1.7"],
      installation_guide: "1. 下载DBM核心包\n2. 根据需要下载对应副本模块\n3. 解压到AddOns目录",
      screenshots: ["/images/dbm_1.jpg", "/images/dbm_2.jpg"]
    },
    {
      id: 4,
      title: "Questie",
      description: "经典魔兽必备任务助手，在地图上显示任务位置",
      text: "Questie是经典魔兽世界服务器的必备插件，它在地图和小地图上显示任务给予者、目标位置和交付点，让任务流程更加清晰明了。\n\n主要特性：\n• 任务位置标记\n• 路径指引\n• 任务链显示\n• 等级建议\n• 数据库搜索",
      version: "8.3.1",
      author: "Questie团队",
      category_id: [4, 7],
      download_url: "https://www.curseforge.com/wow/addons/questie",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["任务", "地图", "导航"],
      rating: 4.6,
      last_update: "2024-01-10",
      file_size: "4.2MB",
      downloads: 98567,
      compatibility: ["Classic", "TBC", "WotLK"],
      installation_guide: "1. 下载适合服务器版本的Questie\n2. 解压到AddOns文件夹\n3. 游戏内启用插件",
      screenshots: ["/images/questie_1.jpg", "/images/questie_2.jpg"]
    },
    {
      id: 5,
      title: "Bagnon",
      description: "背包整合插件，将所有背包合并为一个窗口",
      text: "Bagnon是一个背包管理插件，它将角色的所有背包合并显示在一个窗口中，并提供搜索、分类和自动整理功能。\n\n功能特色：\n• 背包合并显示\n• 物品搜索过滤\n• 自动分类整理\n• 银行集成\n• 多角色背包查看",
      version: "10.2.4",
      author: "Tuller",
      category_id: [5],
      download_url: "https://www.curseforge.com/wow/addons/bagnon",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["背包", "整理", "管理"],
      rating: 4.5,
      last_update: "2024-01-12",
      file_size: "2.8MB",
      downloads: 145789,
      compatibility: ["10.2.5", "10.2.0"],
      installation_guide: "1. 下载Bagnon插件\n2. 安装到AddOns目录\n3. 重启游戏生效",
      screenshots: ["/images/bagnon_1.jpg", "/images/bagnon_2.jpg"]
    },
    {
      id: 6,
      title: "Details!",
      description: "专业的伤害统计插件，提供详细的战斗数据分析",
      text: "Details! 是魔兽世界最专业的伤害统计和战斗分析插件。它提供实时的DPS、治疗、承伤统计，以及详细的战斗日志分析。\n\n核心功能：\n• 实时伤害统计\n• 治疗量分析\n• 承伤统计\n• 技能分解\n• 战斗回放\n• 数据导出",
      version: "10.2.5.12092",
      author: "Terciob",
      category_id: [3, 6],
      download_url: "https://www.curseforge.com/wow/addons/details",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["统计", "DPS", "分析"],
      rating: 4.8,
      last_update: "2024-01-22",
      file_size: "6.9MB",
      downloads: 234156,
      compatibility: ["10.2.5", "10.2.0"],
      installation_guide: "1. 下载Details!插件\n2. 解压安装\n3. 游戏内配置窗口显示",
      screenshots: ["/images/details_1.jpg", "/images/details_2.jpg"]
    },
    {
      id: 7,
      title: "TSM (TradeSkillMaster)",
      description: "拍卖行交易大师，专业的经济管理工具",
      text: "TradeSkillMaster (TSM) 是魔兽世界最强大的拍卖行和经济管理插件。它提供价格扫描、自动竞拍、利润分析等专业交易功能。\n\n专业功能：\n• 服务器价格数据\n• 自动竞拍系统\n• 利润计算器\n• 库存管理\n• 交易记录\n• 宏命令支持",
      version: "4.12.3",
      author: "TSM团队",
      category_id: [8],
      download_url: "https://www.tradeskillmaster.com/",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["拍卖行", "交易", "金币"],
      rating: 4.4,
      last_update: "2024-01-16",
      file_size: "18.5MB",
      downloads: 167834,
      compatibility: ["10.2.5", "10.2.0"],
      installation_guide: "1. 注册TSM账户\n2. 下载客户端和插件\n3. 配置价格源",
      screenshots: ["/images/tsm_1.jpg", "/images/tsm_2.jpg"]
    },
    {
      id: 8,
      title: "BigWigs",
      description: "轻量级首领战插件，DBM的替代选择",
      text: "BigWigs是另一个优秀的首领战辅助插件，相比DBM更加轻量化和模块化。它提供清晰的首领技能提醒和倒计时。\n\n特色功能：\n• 模块化设计\n• 自定义警告\n• 语音提醒\n• 团队工具\n• 低资源占用",
      version: "106.69",
      author: "BigWigs团队",
      category_id: [3, 6, 9],
      download_url: "https://www.curseforge.com/wow/addons/big-wigs",
      image_url: "http://wow.60wow.cc:88/static/picture/pic-02.png",
      tags: ["首领", "提醒", "轻量"],
      rating: 4.6,
      last_update: "2024-01-19",
      file_size: "8.3MB",
      downloads: 124567,
      compatibility: ["10.2.5", "10.2.0"],
      installation_guide: "1. 下载BigWigs核心\n2. 安装对应副本模块\n3. 游戏内配置",
      screenshots: ["/images/bigwigs_1.jpg", "/images/bigwigs_2.jpg"]
    }
  ]
}

// 根据分类ID过滤插件
export function getAddonsByCategory(categoryId) {
  if (!categoryId || categoryId === '0' || categoryId === 0) {
    return mockAddons
  }
  
  // 将categoryId转换为数字以便比较
  const targetCategoryId = parseInt(categoryId)
  
  const filteredAddons = mockAddons.data.filter(addon => {
    // 支持数组形式的category_id
    if (Array.isArray(addon.category_id)) {
      return addon.category_id.includes(targetCategoryId)
    }
    // 兼容旧的字符串/数字形式
    return parseInt(addon.category_id) === targetCategoryId
  })
  
  return {
    ...mockAddons,
    data: filteredAddons
  }
}

// 根据标题搜索插件
export function searchAddons(title, categoryId) {
  let addons = categoryId && categoryId !== '0' && categoryId !== 0
    ? getAddonsByCategory(categoryId).data 
    : mockAddons.data
    
  if (title && title.trim()) {
    addons = addons.filter(addon => 
      addon.title.toLowerCase().includes(title.toLowerCase()) ||
      addon.description.toLowerCase().includes(title.toLowerCase()) ||
      addon.tags.some(tag => tag.toLowerCase().includes(title.toLowerCase()))
    )
  }
  
  return {
    ...mockAddons,
    data: addons
  }
}