// 数据存储模块
class Storage {
  constructor() {
    try {
      this.tasks = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TASKS) || '[]');
      this.goals = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.GOALS) || '[]');
      this.customTags = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.TAGS) || JSON.stringify(CONFIG.DEFAULT_TAGS));
      this.readingRecords = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.READING) || '[]');
    } catch (error) {
      console.error('localStorage 数据损坏，重置为默认值:', error);
      this.tasks = [];
      this.goals = [];
      this.customTags = [...CONFIG.DEFAULT_TAGS];
      this.readingRecords = [];
      // 清除损坏的数据
      this.clearAll();
    }
  }

  // 清除所有数据
  clearAll() {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TASKS, '[]');
      localStorage.setItem(CONFIG.STORAGE_KEYS.GOALS, '[]');
      localStorage.setItem(CONFIG.STORAGE_KEYS.TAGS, JSON.stringify(CONFIG.DEFAULT_TAGS));
      localStorage.setItem(CONFIG.STORAGE_KEYS.READING, '[]');
    } catch (error) {
      console.error('清除数据失败:', error);
    }
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

  // ========== 云同步功能 ==========

  // 获取云同步密钥
  getApiKey() {
    return localStorage.getItem('dailyfocus-api-key') || CONFIG.CLOUD_SYNC.DEFAULT_KEY;
  }

  // 设置云同步密钥
  setApiKey(key) {
    localStorage.setItem('dailyfocus-api-key', key);
  }

  // 获取当前 bin ID
  getBinId() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.CLOUD_BIN_ID);
  }

  // 保存 bin ID
  saveBinId(binId) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CLOUD_BIN_ID, binId);
  }

  // 上传数据到云端
  async uploadToCloud() {
    const apiKey = this.getApiKey();
    const binId = this.getBinId();

    const data = {
      version: CONFIG.VERSION,
      updatedAt: new Date().toISOString(),
      tasks: this.tasks,
      goals: this.goals,
      customTags: this.customTags,
      readingRecords: this.readingRecords
    };

    try {
      let response;
      if (binId) {
        // 更新已有的 bin
        response = await fetch(`${CONFIG.CLOUD_SYNC.API_URL}/b/${binId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey
          },
          body: JSON.stringify(data)
        });
      } else {
        // 创建新 bin
        response = await fetch(`${CONFIG.CLOUD_SYNC.API_URL}/b`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Master-Key': apiKey,
            'X-Bin-Name': `dailyfocus-backup-${Date.now()}`
          },
          body: JSON.stringify(data)
        });
      }

      if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
      }

      const result = await response.json();

      // 保存 bin ID
      if (result.metadata.id) {
        this.saveBinId(result.metadata.id);
      }

      // 更新同步时间
      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());

      return {
        success: true,
        binId: result.metadata.id,
        message: binId ? '更新成功' : '上传成功'
      };
    } catch (error) {
      console.error('云同步上传失败:', error);
      return {
        success: false,
        message: `上传失败: ${error.message}`
      };
    }
  }

  // 从云端下载数据
  async downloadFromCloud(binId) {
    const apiKey = this.getApiKey();

    if (!binId) {
      return {
        success: false,
        message: '请先上传数据或输入 bin ID'
      };
    }

    try {
      const response = await fetch(`${CONFIG.CLOUD_SYNC.API_URL}/b/${binId}/latest`, {
        method: 'GET',
        headers: {
          'X-Master-Key': apiKey
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('数据不存在或 bin ID 错误');
        } else if (response.status === 401) {
          throw new Error('API 密钥无效，请检查设置');
        } else {
          throw new Error(`下载失败: ${response.status}`);
        }
      }

      const result = await response.json();
      const data = result.record;

      // 验证数据格式
      if (!data.version || !data.tasks) {
        throw new Error('云端数据格式无效');
      }

      // 合并数据（保留本地的 createdAt）
      this.tasks = data.tasks || [];
      this.goals = data.goals || [];
      this.customTags = data.customTags || CONFIG.DEFAULT_TAGS;
      this.readingRecords = data.readingRecords || [];

      this.saveTasks();
      this.saveGoals();
      this.saveTags();
      this.saveReading();

      // 保存 bin ID
      this.saveBinId(binId);

      // 更新同步时间
      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());

      return {
        success: true,
        data: data,
        message: '下载成功',
        taskCount: this.tasks.length,
        goalCount: this.goals.length,
        readingCount: this.readingRecords.length
      };
    } catch (error) {
      console.error('云同步下载失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 获取最后同步时间
  getLastSyncTime() {
    const time = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC_TIME);
    return time ? new Date(time) : null;
  }
}

// 创建全局存储实例
const storage = new Storage();
