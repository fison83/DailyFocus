// DailyFocus 配置文件
const CONFIG = {
  VERSION: '5.3.0',
  APP_NAME: 'DailyFocus',

  // localStorage 键名
  STORAGE_KEYS: {
    TASKS: 'dailyfocus-tasks',
    GOALS: 'dailyfocus-goals',
    TAGS: 'dailyfocus-tags',
    READING: 'dailyfocus-reading',
    CLOUD_BIN_ID: 'dailyfocus-cloud-bin-id', // 存储 JSONbin 的 bin ID
    LAST_SYNC_TIME: 'dailyfocus-last-sync-time' // 最后同步时间
  },

  // 云同步配置
  CLOUD_SYNC: {
    PROVIDER: 'github', // 'github' 或 'jsonbin'
    GITHUB_API: 'https://api.github.com',
    GIST_FILENAME: 'dailyfocus-data.json',
    DEFAULT_KEY: '', // GitHub Token 或 JSONbin Key
    RATE_LIMIT: 1000, // 请求间隔限制（毫秒）
    AUTO_SYNC: false, // 自动同步开关（默认关闭）
    AUTO_SYNC_INTERVAL: 5000 // 自动同步防抖间隔（毫秒）
  },

  // 默认标签
  DEFAULT_TAGS: ['工作', '生活', '学习'],

  // 更新日志
  CHANGELOG: [
    {
      version: '5.3.0',
      date: '2025-01-31',
      changes: [
        '新增版本管理规则（语义化版本）',
        '新增新手入门指南文档',
        '新增 CLAUDE.md 项目架构文档',
        '清理所有调试代码'
      ]
    },
    {
      version: '5.2.0',
      date: '2025-01-31',
      changes: [
        '修复批量删除在回收站中执行永久删除而非软删除',
        '修复 storage.js 语法错误导致的初始化失败问题',
        '修复电脑端导航点击被影响的问题',
        '修复目标横幅显示"加载中..."问题'
      ]
    },
    {
      version: '5.1.0',
      date: '2025-01-31',
      changes: [
        '新增移动端响应式优化（1024px/768px/480px 断点）',
        '新增移动端顶部导航栏',
        '优化手机端按钮和输入框尺寸（最小 44px）'
      ]
    },
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
