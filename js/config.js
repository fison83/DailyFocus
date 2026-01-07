// DailyFocus 配置文件
const CONFIG = {
  VERSION: '5.0',
  APP_NAME: 'DailyFocus',

  // localStorage 键名
  STORAGE_KEYS: {
    TASKS: 'dailyfocus-tasks',
    GOALS: 'dailyfocus-goals',
    TAGS: 'dailyfocus-tags',
    READING: 'dailyfocus-reading'
  },

  // 默认标签
  DEFAULT_TAGS: ['工作', '生活', '学习'],

  // 更新日志
  CHANGELOG: [
    {
      version: '5.0',
      date: '2025-01-07',
      changes: [
        '整理按钮简化为"整理"，移除弹窗提示',
        '导出文件名添加时间戳，避免同一天冲突',
        '统计页面重新设计：完成率改为角标，其他统计可点击查看详情',
        '阅读记录表单改为可折叠卡片设计'
      ]
    },
    {
      version: '4.0',
      date: '2025-01-06',
      changes: [
        '侧边栏布局优化',
        '目标分进行中/已完成显示',
        '自定义标签管理',
        '导入导出功能'
      ]
    }
  ]
};
