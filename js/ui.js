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

    container.innerHTML = storage.customTags.map(tag => `
      <span class="tag-filter ${allTasksManager.currentTag === tag ? 'active' : ''}"
            onclick="allTasksManager.setTagFilter('${this.escapeHtml(tag)}')">
        ${this.escapeHtml(tag)}
      </span>
    `).join('');

    // 添加"清除标签"按钮
    if (allTasksManager.currentTag) {
      container.innerHTML += `
        <span class="tag-filter" onclick="allTasksManager.setTagFilter('')" style="color: #EF5350;">
          ✕ 清除
        </span>
      `;
    }
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

  // 导入数据
  importData() {
    document.getElementById('importFileInput').click();
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
}
