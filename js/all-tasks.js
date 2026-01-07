// 全部任务视图模块
class AllTasksManager {
  constructor(storage) {
    this.storage = storage;
    this.currentFilter = 'all'; // all, active, completed, inbox, organized
    this.currentTag = '';
    this.searchQuery = '';
    this.selectedTasks = new Set();
  }

  // 渲染全部任务视图
  render() {
    const container = document.getElementById('allTasksList');
    let tasks = this.getFilteredTasks();

    if (tasks.length === 0) {
      const emptyMessages = {
        'deleted': '<div class="empty-state"><div class="empty-icon">♻️</div><p>回收站空了</p></div>',
        'default': '<div class="empty-state"><div class="empty-icon">📋</div><p>暂无任务</p></div>'
      };
      container.innerHTML = emptyMessages[this.currentFilter === 'deleted' ? 'deleted' : 'default'];
      return;
    }

    const isDeletedView = this.currentFilter === 'deleted';

    container.innerHTML = tasks.map(task => `
      <div class="all-task-item ${task.completed ? 'completed' : ''} ${task.deleted ? 'deleted' : ''}" data-id="${task.id}">
        <div class="task-checkbox-wrapper">
          <input type="checkbox" class="task-select-checkbox" data-id="${task.id}"
            ${this.selectedTasks.has(task.id) ? 'checked' : ''}
            onchange="allTasksManager.toggleTaskSelection('${task.id}')">
        </div>
        <div class="task-content-wrapper" ${!task.deleted ? `onclick="allTasksManager.openTaskDetail('${task.id}')"` : ''}>
          <div class="task-checkbox-display ${task.completed ? 'checked' : ''}"
            onclick="event.stopPropagation(); allTasksManager.toggleComplete('${task.id}')">
            ${task.completed ? '✓' : ''}
          </div>
          <div class="task-info">
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-meta">
              ${task.tag ? `<span class="task-tag">${this.escapeHtml(task.tag)}</span>` : ''}
              ${task.dueDate ? `<span class="task-date-tag">📅 ${task.dueDate}</span>` : ''}
              ${task.deleted ? '<span class="task-status-badge deleted">已删除</span>' : ''}
              ${task.organized ? '<span class="task-status-badge organized">已整理</span>' : '<span class="task-status-badge inbox">待整理</span>'}
              ${task.completed ? '<span class="task-status-badge completed">已完成</span>' : ''}
              <span class="task-creation-date">${new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
        <div class="task-actions-wrapper">
          ${task.deleted ?
            `<button class="btn-task-action restore-btn" onclick="event.stopPropagation(); allTasksManager.restoreTask('${task.id}')" title="恢复">♻️</button>
             <button class="btn-task-action permanent-delete-btn" onclick="event.stopPropagation(); allTasksManager.permanentDeleteTask('${task.id}')" title="永久删除">❌</button>` :
            `<button class="btn-task-action" onclick="event.stopPropagation(); allTasksManager.deleteTask('${task.id}')" title="删除">🗑️</button>`
          }
        </div>
      </div>
    `).join('');

    this.updateSelectionUI();
  }

  // 获取过滤后的任务
  getFilteredTasks() {
    let tasks = [...this.storage.tasks];

    // 状态过滤
    switch (this.currentFilter) {
      case 'active':
        tasks = tasks.filter(t => !t.deleted && !t.completed);
        break;
      case 'completed':
        tasks = tasks.filter(t => !t.deleted && t.completed);
        break;
      case 'inbox':
        tasks = tasks.filter(t => !t.deleted && !t.organized && !t.completed);
        break;
      case 'organized':
        tasks = tasks.filter(t => !t.deleted && t.organized && !t.completed);
        break;
      case 'deleted':
        tasks = tasks.filter(t => t.deleted);
        break;
    }

    // 标签过滤
    if (this.currentTag) {
      tasks = tasks.filter(t => t.tag === this.currentTag);
    }

    // 搜索过滤
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      tasks = tasks.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // 按创建时间排序(最新的在前)
    tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return tasks;
  }

  // 切换任务选择状态
  toggleTaskSelection(taskId) {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
    this.updateSelectionUI();
  }

  // 全选/取消全选
  toggleSelectAll() {
    const tasks = this.getFilteredTasks();
    if (this.selectedTasks.size === tasks.length) {
      this.selectedTasks.clear();
    } else {
      tasks.forEach(t => this.selectedTasks.add(t.id));
    }
    this.render();
  }

  // 更新选择UI
  updateSelectionUI() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const selectedCount = document.getElementById('selectedCount');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');

    if (selectAllCheckbox) {
      const tasks = this.getFilteredTasks();
      selectAllCheckbox.checked = tasks.length > 0 && this.selectedTasks.size === tasks.length;
      selectAllCheckbox.indeterminate = this.selectedTasks.size > 0 && this.selectedTasks.size < tasks.length;
    }

    if (selectedCount) {
      selectedCount.textContent = `已选择 ${this.selectedTasks.size} 项`;
    }

    if (batchDeleteBtn) {
      batchDeleteBtn.disabled = this.selectedTasks.size === 0;
      batchDeleteBtn.style.opacity = this.selectedTasks.size > 0 ? '1' : '0.5';
    }
  }

  // 切换完成状态
  toggleComplete(taskId) {
    const task = this.storage.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      this.storage.saveTasks();
      this.render();
    }
  }

  // 删除单个任务(软删除)
  deleteTask(taskId) {
    taskManager.softDeleteTask(taskId);
    this.selectedTasks.delete(taskId);
    this.render();
  }

  // 批量删除
  batchDelete() {
    if (this.selectedTasks.size === 0) return;

    this.selectedTasks.forEach(taskId => {
      taskManager.softDeleteTask(taskId);
    });
    this.selectedTasks.clear();
    this.render();
  }

  // 恢复任务
  restoreTask(taskId) {
    taskManager.restoreTask(taskId);
    this.render();
  }

  // 永久删除任务
  permanentDeleteTask(taskId) {
    taskManager.permanentDeleteTask(taskId);
    this.selectedTasks.delete(taskId);
    this.render();
  }

  // 打开任务详情
  openTaskDetail(taskId) {
    // 使用现有的任务编辑面板
    if (typeof taskManager !== 'undefined') {
      taskManager.openEditPanel(taskId);
      ui.openEditPanel();
    }
  }

  // 设置过滤器
  setFilter(filter) {
    this.currentFilter = filter;
    this.selectedTasks.clear();
    this.render();
  }

  // 设置标签过滤
  setTagFilter(tag) {
    this.currentTag = tag;
    this.selectedTasks.clear();
    this.render();
  }

  // 设置搜索
  setSearch(query) {
    this.searchQuery = query;
    this.selectedTasks.clear();
    this.render();
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
