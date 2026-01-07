// 数据存储模块
class Storage {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TASKS) || '[]');
    this.goals = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.GOALS) || '[]');
    this.customTags = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TAGS) || JSON.stringify(CONFIG.DEFAULT_TAGS));
    this.readingRecords = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.READING) || '[]');
  }

  // 保存任务
  saveTasks() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
  }

  // 保存目标
  saveGoals() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
  }

  // 保存标签
  saveTags() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TAGS, JSON.stringify(this.customTags));
  }

  // 保存阅读记录
  saveReading() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.READING, JSON.stringify(this.readingRecords));
  }

  // 导出数据 - V5: 文件名添加时间戳
  exportData() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const timestamp = `${dateStr}-${timeStr}`;

    const data = {
      version: CONFIG.VERSION,
      exportDate: now.toISOString(),
      tasks: this.tasks,
      goals: this.goals,
      customTags: this.customTags,
      readingRecords: this.readingRecords
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyfocus-backup-${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 导入数据
  importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          // 验证数据格式
          if (!data.version || !data.tasks) {
            reject('无效的备份文件格式');
            return;
          }

          this.tasks = data.tasks || [];
          this.goals = data.goals || [];
          this.customTags = data.customTags || CONFIG.DEFAULT_TAGS;
          this.readingRecords = data.readingRecords || [];

          this.saveTasks();
          this.saveGoals();
          this.saveTags();
          this.saveReading();

          resolve(data);
        } catch (error) {
          reject('导入失败：文件格式错误');
        }
      };
      reader.readAsText(file);
    });
  }
}

// 创建全局存储实例
const storage = new Storage();
