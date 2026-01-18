// 数据存储模块
class Storage {
  constructor() {
    // 防止自动上传在下载过程中被触发
    this.isDownloading = false;

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
    // 触发自动上传
    this.autoUpload();
  }

  // 保存目标
  saveGoals() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.GOALS, JSON.stringify(this.goals));
    // 触发自动上传
    this.autoUpload();
  }

  // 保存标签
  saveTags() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.TAGS, JSON.stringify(this.customTags));
    // 触发自动上传
    this.autoUpload();
  }

  // 保存阅读记录
  saveReading() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.READING, JSON.stringify(this.readingRecords));
    // 触发自动上传
    this.autoUpload();
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

  // 获取当前 Gist ID
  getBinId() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.CLOUD_BIN_ID);
  }

  // 保存 Gist ID
  saveBinId(gistId) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CLOUD_BIN_ID, gistId);
  }

  // 上传数据到 GitHub Gist
  async uploadToCloud() {
    const token = this.getApiKey();
    const gistId = this.getBinId();

    console.log('[云同步] 开始上传');
    console.log('[云同步] Token 长度:', token ? token.length : 0);
    console.log('[云同步] Token 前缀:', token ? token.substring(0, 7) + '...' : '无');
    console.log('[云同步] Gist ID:', gistId || '无（首次上传）');

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
      const filename = CONFIG.CLOUD_SYNC.GIST_FILENAME;
      const gistData = {
        description: `DailyFocus 数据备份 - ${new Date().toLocaleString('zh-CN')}`,
        public: false,
        files: {
          [filename]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      };

      const url = gistId
        ? `${CONFIG.CLOUD_SYNC.GITHUB_API}/gists/${gistId}`
        : `${CONFIG.CLOUD_SYNC.GITHUB_API}/gists`;

      console.log('[云同步] 请求 URL:', url);
      console.log('[云同步] 请求方法:', gistId ? 'PATCH' : 'POST');

      response = await fetch(url, {
        method: gistId ? 'PATCH' : 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(gistData)
      });

      console.log('[云同步] 响应状态:', response.status);

      if (!response.ok) {
        let errorMsg = `上传失败 (${response.status})`;
        try {
          const errorData = await response.json();
          console.error('[云同步] API 错误详情:', errorData);
          if (errorData.message) {
            errorMsg = errorData.message;
          }
        } catch (e) {
          console.error('[云同步] 无法解析错误响应');
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      console.log('[云同步] 上传成功, Gist ID:', result.id);

      // 保存 Gist ID
      if (result.id) {
        this.saveBinId(result.id);
      }

      // 更新同步时间
      localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());

      return {
        success: true,
        binId: result.id,
        message: gistId ? '更新成功' : '上传成功'
      };
    } catch (error) {
      console.error('[云同步] 上传失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // 从 GitHub Gist 下载数据
  async downloadFromCloud(gistId) {
    // 设置下载标志，防止自动上传被触发
    this.isDownloading = true;

    const token = this.getApiKey();

    console.log('[云同步下载] Token 长度:', token ? token.length : 0);
    console.log('[云同步下载] Token 前缀:', token ? token.substring(0, 7) + '...' : '无');
    console.log('[云同步下载] Gist ID:', gistId);

    try {
      if (!gistId) {
        return {
          success: false,
        message: '请先上传数据或输入 Gist ID'
      };
    }

    try {
      const headers = {
        'Accept': 'application/vnd.github.v3+json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log('[云同步下载] 发送请求到:', `${CONFIG.CLOUD_SYNC.GITHUB_API}/gists/${gistId}`);

      const response = await fetch(`${CONFIG.CLOUD_SYNC.GITHUB_API}/gists/${gistId}`, {
        method: 'GET',
        headers: headers
      });

      console.log('[云同步下载] 响应状态:', response.status);

      if (!response.ok) {
        let errorMsg = `下载失败: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMsg = errorData.message;
          }
          console.error('GitHub API 错误:', errorData);
        } catch (e) {
          if (response.status === 404) {
            errorMsg = 'Gist 不存在或 ID 错误';
          } else if (response.status === 401) {
            errorMsg = 'Token 无效，请检查设置';
          }
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      const filename = CONFIG.CLOUD_SYNC.GIST_FILENAME;

      // 获取文件内容
      if (!result.files || !result.files[filename]) {
        throw new Error('Gist 中找不到数据文件');
      }

      const fileContent = result.files[filename].content;
      const data = JSON.parse(fileContent);

      // 验证数据格式
      if (!data.version || !data.tasks) {
        throw new Error('云端数据格式无效');
      }

      // 合并数据
      this.tasks = data.tasks || [];
      this.goals = data.goals || [];
      this.customTags = data.customTags || CONFIG.DEFAULT_TAGS;
      this.readingRecords = data.readingRecords || [];

      this.saveTasks();
      this.saveGoals();
      this.saveTags();
      this.saveReading();

      // 保存 Gist ID
      this.saveBinId(gistId);

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
    } finally {
      // 重置下载标志，允许自动上传
      this.isDownloading = false;
    }
  }

  // 获取最后同步时间
  getLastSyncTime() {
    const time = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC_TIME);
    return time ? new Date(time) : null;
  }

  // ========== 自动同步功能 ==========

  // 获取自动同步开关状态
  getAutoSyncEnabled() {
    const enabled = localStorage.getItem('dailyfocus-auto-sync');
    return enabled === 'true';
  }

  // 设置自动同步开关
  setAutoSyncEnabled(enabled) {
    localStorage.setItem('dailyfocus-auto-sync', enabled ? 'true' : 'false');
  }

  // 自动上传（带防抖）
  autoSyncTimer = null;
  autoUpload() {
    // 如果正在下载，不触发自动上传（避免循环）
    if (this.isDownloading) {
      return;
    }

    // 如果自动同步未开启，直接返回
    if (!this.getAutoSyncEnabled()) {
      return;
    }

    // 如果没有配置 Token 或 Gist ID，不自动上传
    if (!this.getApiKey() || !this.getBinId()) {
      return;
    }

    // 清除之前的定时器
    if (this.autoSyncTimer) {
      clearTimeout(this.autoSyncTimer);
    }

    // 设置新的定时器（防抖）
    this.autoSyncTimer = setTimeout(async () => {
      const result = await this.uploadToCloud();
      if (result.success) {
        console.log('[自动同步] 上传成功');
        // 触发自定义事件，通知 UI 更新
        window.dispatchEvent(new CustomEvent('autoSyncComplete', {
          detail: { type: 'upload', success: true }
        }));
      } else {
        console.error('[自动同步] 上传失败:', result.message);
        window.dispatchEvent(new CustomEvent('autoSyncComplete', {
          detail: { type: 'upload', success: false, message: result.message }
        }));
      }
    }, CONFIG.CLOUD_SYNC.AUTO_SYNC_INTERVAL);
  }

  // 自动下载（页面打开时调用）
  async autoDownload() {
    // 如果自动同步未开启，直接返回
    if (!this.getAutoSyncEnabled()) {
      return { success: false, message: '自动同步未开启' };
    }

    // 如果没有配置 Token 或 Gist ID，不自动下载
    const token = this.getApiKey();
    const gistId = this.getBinId();

    if (!token || !gistId) {
      return { success: false, message: '未配置 Token 或 Gist ID' };
    }

    console.log('[自动同步] 开始下载');
    const result = await this.downloadFromCloud(gistId);

    if (result.success) {
      console.log('[自动同步] 下载成功');
      // 触发自定义事件，通知 UI 更新
      window.dispatchEvent(new CustomEvent('autoSyncComplete', {
        detail: { type: 'download', success: true, data: result }
      }));
    } else {
      console.error('[自动同步] 下载失败:', result.message);
      window.dispatchEvent(new CustomEvent('autoSyncComplete', {
        detail: { type: 'download', success: false, message: result.message }
      }));
    }

    return result;
  }
}

// 创建全局存储实例
const storage = new Storage();
