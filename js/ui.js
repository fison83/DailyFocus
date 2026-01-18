// UI交互模块
class UIManager {
  constructor(taskManager, goalManager, readingManager, statsManager) {
    this.taskManager = taskManager;
    this.goalManager = goalManager;
    this.readingManager = readingManager;
    this.statsManager = statsManager;
  }

  // 初始化事件监听
  setupEventListeners() {
    // 导航切换
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', () => this.switchView(item.dataset.view));
    });

    // 快速输入
    document.getElementById('quickInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleQuickAdd();
      }
    });

    // 新标签输入回车
    const newTagInput = document.getElementById('newTagInput');
    if (newTagInput) {
      newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addNewTag();
        }
      });
    }

    // ESC 关闭面板
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeEditPanel();
        this.closeGoalPanel();
        this.closeReadingPanel();
      }
    });
  }

  // 视图切换
  switchView(view) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === view);
    });

    document.querySelectorAll('.view-container').forEach(container => {
      container.classList.remove('active');
    });

    const viewMap = {
      'inbox': 'inboxView',
      'quadrant': 'quadrantView',
      'all-tasks': 'all-tasksView',
      'calendar': 'calendarView',
      'stats': 'statsView',
      'goals': 'goalsView',
      'tags': 'tagsView',
      'reading': 'readingView'
    };

    document.getElementById(viewMap[view]).classList.add('active');

    // 快速添加栏只在收集箱显示
    const quickAddBar = document.getElementById('quickAddBar');
    if (quickAddBar) {
      quickAddBar.style.display = view === 'inbox' ? 'block' : 'none';
    }

    if (view === 'stats') {
      this.statsManager.update();
    } else if (view === 'goals') {
      this.goalManager.render();
    } else if (view === 'reading') {
      this.readingManager.render();
    } else if (view === 'all-tasks') {
      allTasksManager.render();
      this.renderTagFilters();
    } else if (view === 'calendar') {
      calendarManager.render();
    }
  }

  // 快速添加
  handleQuickAdd() {
    const input = document.getElementById('quickInput');
    const title = input.value.trim();

    if (!title) {
      input.focus();
      return;
    }

    if (this.taskManager.quickAdd(title)) {
      this.taskManager.render();

      // 重置输入，但不重置优先级锁定
      input.value = '';
      this.taskManager.selectedTags = [];
      document.querySelectorAll('.quick-tag').forEach(tag => {
        tag.classList.remove('active');
      });
      input.focus();
    }
  }

  // 渲染快速标签
  renderQuickTags() {
    const container = document.getElementById('quickTags');
    container.innerHTML = storage.customTags.map(tag => `
      <span class="quick-tag" data-tag="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</span>
    `).join('');

    // 重新绑定事件
    container.querySelectorAll('.quick-tag').forEach(tagEl => {
      tagEl.addEventListener('click', () => {
        tagEl.classList.toggle('active');
        const tagName = tagEl.dataset.tag;
        if (this.taskManager.selectedTags.includes(tagName)) {
          this.taskManager.selectedTags = this.taskManager.selectedTags.filter(t => t !== tagName);
        } else {
          this.taskManager.selectedTags.push(tagName);
        }
      });
    });
  }

  // 渲染标签列表
  renderTagsList() {
    const container = document.getElementById('tagsList');
    if (storage.customTags.length === 0) {
      container.innerHTML = '<p style="color: var(--text-light); font-size: 13px;">暂无标签</p>';
    } else {
      container.innerHTML = storage.customTags.map(tag => `
        <div class="tag-item">
          <span>${this.escapeHtml(tag)}</span>
          <button class="tag-item-remove" onclick="ui.removeTag('${this.escapeHtml(tag)}')">×</button>
        </div>
      `).join('');
    }
  }

  // 渲染标签下拉选择
  renderTagSelect() {
    const select = document.getElementById('editTag');
    select.innerHTML = '<option value="">无标签</option>' +
      storage.customTags.map(tag => `<option value="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</option>`).join('');
  }

  // 渲染标签过滤器(全部任务视图)
  renderTagFilters() {
    const container = document.getElementById('tagFilters');
    if (!container) return;

    if (storage.customTags.length === 0) {
      container.innerHTML = '';
      return;
    }

    // "全部"选项
    let html = `
      <span class="tag-filter ${!allTasksManager.currentTag ? 'active' : ''}"
            onclick="allTasksManager.setTagFilter('')">
        全部
      </span>
    `;

    // 各个标签选项
    html += storage.customTags.map(tag => `
      <span class="tag-filter ${allTasksManager.currentTag === tag ? 'active' : ''}"
            onclick="allTasksManager.setTagFilter('${this.escapeHtml(tag)}')">
        ${this.escapeHtml(tag)}
      </span>
    `).join('');

    container.innerHTML = html;
  }

  // 显示添加标签输入
  showAddTagInput() {
    document.getElementById('addTagInputWrapper').style.display = 'block';
    document.getElementById('newTagInput').focus();
  }

  // 隐藏添加标签输入
  hideAddTagInput() {
    document.getElementById('addTagInputWrapper').style.display = 'none';
    document.getElementById('newTagInput').value = '';
  }

  // 添加新标签
  addNewTag() {
    const input = document.getElementById('newTagInput');
    const tagName = input.value.trim();

    if (!tagName) {
      alert('请输入标签名称');
      return;
    }

    if (storage.customTags.includes(tagName)) {
      alert('标签已存在');
      return;
    }

    storage.customTags.push(tagName);
    storage.saveTags();

    this.renderQuickTags();
    this.renderTagsList();
    this.renderTagSelect();
    this.hideAddTagInput();
  }

  // 删除标签
  removeTag(tagName) {
    if (confirm(`确定删除标签"${tagName}"吗？`)) {
      storage.customTags = storage.customTags.filter(t => t !== tagName);
      storage.saveTags();

      this.renderQuickTags();
      this.renderTagsList();
      this.renderTagSelect();
    }
  }

  // 打开任务编辑面板
  openEditPanel() {
    document.getElementById('editOverlay').classList.add('active');
    document.getElementById('editPanel').classList.add('active');
  }

  // 关闭任务编辑面板
  closeEditPanel() {
    document.getElementById('editOverlay').classList.remove('active');
    document.getElementById('editPanel').classList.remove('active');
    this.taskManager.currentTaskId = null;
  }

  // 保存任务
  saveTask() {
    if (this.taskManager.saveTask()) {
      this.taskManager.render();
      this.closeEditPanel();
    }
  }

  // 删除任务
  deleteTask() {
    if (this.taskManager.deleteTask()) {
      this.taskManager.render();
      this.closeEditPanel();
    }
  }

  // 打开目标面板
  openGoalPanel() {
    document.getElementById('goalOverlay').classList.add('active');
    document.getElementById('goalPanel').classList.add('active');
  }

  // 关闭目标面板
  closeGoalPanel() {
    document.getElementById('goalOverlay').classList.remove('active');
    document.getElementById('goalPanel').classList.remove('active');
    this.goalManager.currentGoalId = null;
  }

  // 保存目标
  saveGoal() {
    if (this.goalManager.saveGoal()) {
      this.goalManager.render();
      this.goalManager.updateBanner();
      this.closeGoalPanel();
    }
  }

  // 删除目标
  deleteGoal() {
    if (this.goalManager.deleteGoal()) {
      this.goalManager.render();
      this.goalManager.updateBanner();
      this.closeGoalPanel();
    }
  }

  // 打开阅读面板
  openReadingPanel() {
    document.getElementById('readingOverlay').classList.add('active');
    document.getElementById('readingPanel').classList.add('active');
  }

  // 关闭阅读面板
  closeReadingPanel() {
    document.getElementById('readingOverlay').classList.remove('active');
    document.getElementById('readingPanel').classList.remove('active');
    this.readingManager.currentReadingId = null;
  }

  // 保存阅读记录
  saveReadingRecord() {
    if (this.readingManager.saveReadingRecord()) {
      this.readingManager.render();
      this.closeReadingPanel();
    }
  }

  // 删除阅读记录
  deleteReading() {
    if (this.readingManager.deleteReading()) {
      this.readingManager.render();
      this.closeReadingPanel();
    }
  }

  // 更新日期显示
  updateDate() {
    const now = new Date();
    const options = { month: 'long', day: 'numeric', weekday: 'long' };
    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('zh-CN', options);
    }
  }

  // 设置日期
  setDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    document.getElementById('editDueDate').value = date.toISOString().split('T')[0];
  }

  // 导出数据
  exportData() {
    storage.exportData();
  }

  // 导入数据（已废弃 - 现在使用 label 直接绑定 input）
  importData() {
    // 不再需要，文件选择器已经通过 label 绑定
  }

  // 处理导入文件
  handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    storage.importData(file)
      .then((data) => {
        if (confirm(`导入备份将覆盖现有数据！\n\n备份日期: ${data.exportDate ? data.exportDate.split('T')[0] : '未知'}\n任务数: ${data.tasks.length}\n目标数: ${data.goals ? data.goals.length : 0}\n阅读记录: ${data.readingRecords ? data.readingRecords.length : 0}\n\n确定要导入吗？`)) {
          this.renderQuickTags();
          this.renderTagsList();
          this.renderTagSelect();
          this.taskManager.render();
          this.statsManager.update();
          this.goalManager.updateBanner();
          this.readingManager.render();

          alert('✅ 数据导入成功！');
        }
      })
      .catch((error) => {
        alert(error);
        console.error(error);
      });

    // 重置 input 以便可以重复选择同一文件
    event.target.value = '';
  }

  // 切换可折叠区域
  toggleSection(element) {
    element.classList.toggle('collapsed');
    const icon = element.querySelector('.collapsible-icon');
    if (icon) {
      icon.textContent = element.classList.contains('collapsed') ? '▶' : '▼';
    }
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ========== 云同步 UI 方法 ==========

  // 打开云同步面板
  openCloudSyncPanel() {
    const panel = document.getElementById('cloudSyncPanel');
    panel.classList.add('active');

    // 加载当前设置
    document.getElementById('cloudApiKey').value = storage.getApiKey();
    document.getElementById('cloudBinId').value = storage.getBinId() || '';

    // 初始化自动同步开关
    this.initAutoSyncToggle();

    // 更新最后同步时间
    this.updateLastSyncTime();
  }

  // 关闭云同步面板
  closeCloudSyncPanel() {
    const panel = document.getElementById('cloudSyncPanel');
    panel.classList.remove('active');

    // 保存 API 密钥
    const apiKey = document.getElementById('cloudApiKey').value.trim();
    if (apiKey) {
      storage.setApiKey(apiKey);
    }
  }

  // 显示同步消息
  showSyncMessage(message, isSuccess = true) {
    const msgEl = document.getElementById('syncMessage');
    msgEl.textContent = message;
    msgEl.className = 'sync-message ' + (isSuccess ? 'success' : 'error');
    msgEl.style.display = 'block';

    // 3秒后自动隐藏
    setTimeout(() => {
      msgEl.style.display = 'none';
    }, 3000);
  }

  // 设置按钮加载状态
  setSyncButtonLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.querySelector('.sync-text').textContent;
      btn.querySelector('.sync-text').textContent = '处理中...';
    } else {
      btn.disabled = false;
      btn.querySelector('.sync-text').textContent = btn.dataset.originalText || '同步';
    }
  }

  // 上传到云端
  async uploadToCloud() {
    const apiKey = document.getElementById('cloudApiKey').value.trim();

    if (!apiKey) {
      this.showSyncMessage('请先输入有效的 GitHub Token', false);
      return;
    }

    // 保存 Token 到 localStorage
    storage.setApiKey(apiKey);

    this.setSyncButtonLoading('btnUpload', true);

    const result = await storage.uploadToCloud();

    this.setSyncButtonLoading('btnUpload', false);

    if (result.success) {
      // 更新 Gist ID 显示
      document.getElementById('cloudBinId').value = result.binId || storage.getBinId();
      this.updateLastSyncTime();
      this.showSyncMessage(result.message + ' (Gist ID: ' + result.binId + ')', true);
    } else {
      this.showSyncMessage(result.message, false);
    }
  }

  // 从云端下载
  async downloadFromCloud() {
    const apiKey = document.getElementById('cloudApiKey').value.trim();
    const binId = document.getElementById('cloudBinId').value.trim();

    if (!apiKey) {
      this.showSyncMessage('请先输入有效的 GitHub Token', false);
      return;
    }

    if (!binId) {
      this.showSyncMessage('请输入要下载的 Gist ID', false);
      return;
    }

    // 保存 Token 到 localStorage
    storage.setApiKey(apiKey);

    // 确认下载
    if (!confirm('下载云端数据将覆盖本地数据，确定继续吗？')) {
      return;
    }

    this.setSyncButtonLoading('btnDownload', true);

    const result = await storage.downloadFromCloud(binId);

    this.setSyncButtonLoading('btnDownload', false);

    if (result.success) {
      this.updateLastSyncTime();
      this.showSyncMessage(
        `${result.message} (任务: ${result.taskCount}, 目标: ${result.goalCount}, 阅读: ${result.readingCount})`,
        true
      );

      // 刷新所有视图
      this.taskManager.render();
      this.goalManager.render();
      this.readingManager.render();
      this.statsManager.render();
    } else {
      this.showSyncMessage(result.message, false);
    }
  }

  // ========== 自动同步功能 ==========

  // 切换自动同步开关
  toggleAutoSync() {
    const toggle = document.getElementById('autoSyncToggle');
    const enabled = toggle.checked;

    storage.setAutoSyncEnabled(enabled);

    if (enabled) {
      // 开启自动同步
      this.showSyncMessage('自动同步已开启', true);

      // 如果已配置 Token 和 Gist ID，立即执行一次上传
      if (storage.getApiKey() && storage.getBinId()) {
        storage.autoUpload();
      }
    } else {
      // 关闭自动同步
      this.showSyncMessage('自动同步已关闭', true);
    }
  }

  // 初始化自动同步开关状态
  initAutoSyncToggle() {
    const toggle = document.getElementById('autoSyncToggle');
    if (toggle) {
      toggle.checked = storage.getAutoSyncEnabled();
    }
  }

  // 监听自动同步完成事件
  setupAutoSyncListener() {
    window.addEventListener('autoSyncComplete', (e) => {
      const { type, success, message, data } = e.detail;

      if (success) {
        if (type === 'upload') {
          console.log('[自动同步] 自动上传成功');
          // 更新最后同步时间
          this.updateLastSyncTime();
        } else if (type === 'download') {
          console.log('[自动同步] 自动下载成功');
          // 刷新所有视图
          this.taskManager.render();
          this.goalManager.render();
          this.readingManager.render();
          this.statsManager.render();
          // 更新最后同步时间
          this.updateLastSyncTime();
        }
      } else {
        console.error('[自动同步]', type === 'upload' ? '上传' : '下载', '失败:', message);
      }
    });
  }

  // 更新最后同步时间显示
  updateLastSyncTime() {
    const lastTime = storage.getLastSyncTime();
    const timeEl = document.getElementById('lastSyncTime');

    if (!lastTime) {
      timeEl.textContent = '未同步';
      return;
    }

    const now = new Date();
    const diff = Math.floor((now - lastTime) / 1000);

    if (diff < 60) {
      timeEl.textContent = '刚刚';
    } else if (diff < 3600) {
      timeEl.textContent = Math.floor(diff / 60) + ' 分钟前';
    } else if (diff < 86400) {
      timeEl.textContent = Math.floor(diff / 3600) + ' 小时前';
    } else {
      timeEl.textContent = lastTime.toLocaleDateString('zh-CN');
    }
  }
}
