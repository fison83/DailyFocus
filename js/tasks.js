// 任务管理模块
class TaskManager {
  constructor(storage) {
    this.storage = storage;
    this.currentTaskId = null;
    this.selectedTags = [];
    this.lockedPriority = false;
    this.lockedUrgency = false;
  }

  // 快速添加任务
  quickAdd(title) {
    if (!title.trim()) return false;

    // 读取日期选择器
    const dueDateSelect = document.getElementById('quickDueDate');
    let dueDate = '';
    if (dueDateSelect && dueDateSelect.value !== 'none') {
      dueDate = this.calculateDueDate(dueDateSelect.value);
    }

    const task = {
      id: Date.now().toString(),
      title: title.trim(),
      description: '',
      priority: this.lockedPriority,
      urgency: this.lockedUrgency,
      dueDate: dueDate,
      tag: this.selectedTags[0] || '',
      completed: false,
      createdAt: new Date().toISOString(),
      organized: false,
      deleted: false,
      deletedAt: null
    };

    this.storage.tasks.unshift(task);
    this.storage.saveTasks();

    // 不重置日期选择器，保持用户选择方便连续输入

    return true;
  }

  // 计算截止日期
  calculateDueDate(value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch(value) {
      case 'today':
        return today.toISOString().split('T')[0];
      case 'tomorrow':
        today.setDate(today.getDate() + 1);
        return today.toISOString().split('T')[0];
      case 'thisSunday':
        return this.getNextWeekday(today, 0);
      case 'nextMonday':
        return this.getNextWeekday(today, 1);
      case 'nextWeek':
        today.setDate(today.getDate() + 7);
        return today.toISOString().split('T')[0];
      case 'nextMonth':
        today.setMonth(today.getMonth() + 1);
        return today.toISOString().split('T')[0];
      case 'custom':
        const datePicker = document.getElementById('quickDueDatePicker');
        return datePicker ? datePicker.value : '';
      default:
        return '';
    }
  }

  // 获取下一个星期几
  getNextWeekday(date, day) {
    const currentDay = date.getDay();
    let distance = day - currentDay;
    if (distance <= 0) {
      distance += 7;
    }
    date.setDate(date.getDate() + distance);
    return date.toISOString().split('T')[0];
  }

  // 获取象限
  getQuadrant(task) {
    if (task.priority && task.urgency) return 'urgent-important';
    if (task.priority && !task.urgency) return 'important';
    if (!task.priority && task.urgency) return 'urgent';
    return 'normal';
  }

  // 整理收集箱 - V5: 移除弹窗提示
  organizeInbox() {
    const unorganized = this.storage.tasks.filter(t => !t.organized && !t.completed);
    if (unorganized.length === 0) return 0;

    unorganized.forEach(task => {
      task.organized = true;
    });

    this.storage.saveTasks();
    return unorganized.length;
  }

  // 切换完成状态
  toggleComplete(taskId) {
    const task = this.storage.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      this.storage.saveTasks();
    }
  }

  // 打开编辑面板
  openEditPanel(taskId) {
    this.currentTaskId = taskId;
    const task = this.storage.tasks.find(t => t.id === taskId);

    if (task) {
      document.getElementById('editTitle').value = task.title;
      document.getElementById('editDesc').value = task.description || '';
      document.getElementById('editPriority').value = task.priority.toString();
      document.getElementById('editUrgency').value = task.urgency.toString();
      document.getElementById('editDueDate').value = task.dueDate || '';
      document.getElementById('editTag').value = task.tag || '';
    }
  }

  // 保存任务
  saveTask() {
    if (!this.currentTaskId) return false;

    const task = this.storage.tasks.find(t => t.id === this.currentTaskId);
    if (task) {
      task.title = document.getElementById('editTitle').value.trim();
      task.description = document.getElementById('editDesc').value.trim();
      task.priority = document.getElementById('editPriority').value === 'true';
      task.urgency = document.getElementById('editUrgency').value === 'true';
      task.dueDate = document.getElementById('editDueDate').value;
      task.tag = document.getElementById('editTag').value.trim();

      this.storage.saveTasks();
      return true;
    }
    return false;
  }

  // 删除任务
  deleteTask() {
    if (this.currentTaskId) {
      this.storage.tasks = this.storage.tasks.filter(t => t.id !== this.currentTaskId);
      this.storage.saveTasks();
      this.currentTaskId = null;
      return true;
    }
    return false;
  }

  // 获取收集箱任务
  getInboxTasks() {
    return this.storage.tasks.filter(t => !t.deleted && !t.organized && !t.completed);
  }

  // 获取四象限任务
  getQuadrantTasks() {
    const quadrantTasks = {
      'urgent-important': [],
      'important': [],
      'urgent': [],
      'normal': []
    };

    this.storage.tasks
      .filter(t => !t.deleted && t.organized && !t.completed)
      .forEach(task => {
        const quadrant = this.getQuadrant(task);
        quadrantTasks[quadrant].push(task);
      });

    return quadrantTasks;
  }

  // 软删除任务(移到回收站)
  softDeleteTask(taskId) {
    const task = this.storage.tasks.find(t => t.id === taskId);
    if (task) {
      task.deleted = true;
      task.deletedAt = new Date().toISOString();
      this.storage.saveTasks();
      return true;
    }
    return false;
  }

  // 恢复任务
  restoreTask(taskId) {
    const task = this.storage.tasks.find(t => t.id === taskId);
    if (task) {
      task.deleted = false;
      task.deletedAt = null;
      this.storage.saveTasks();
      return true;
    }
    return false;
  }

  // 永久删除任务
  permanentDeleteTask(taskId) {
    const index = this.storage.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.storage.tasks.splice(index, 1);
      this.storage.saveTasks();
      return true;
    }
    return false;
  }

  // 顺延任务截止日期
  extendDueDate(taskId, days) {
    const task = this.storage.tasks.find(t => t.id === taskId);
    if (!task || !task.dueDate) return false;

    // 1. 记录旧日期
    const oldDate = task.dueDate;

    // 2. 计算新日期
    let newDate;
    if (days === 0) {
      // 顺延到今天
      newDate = new Date();
      const hour = newDate.getHours();

      // 18点后顺延到明天
      if (hour >= 18) {
        newDate.setDate(newDate.getDate() + 1);
      }
    } else {
      // 顺延N天
      newDate = new Date(oldDate);
      newDate.setDate(newDate.getDate() + days);
    }

    const newDateStr = newDate.toISOString().split('T')[0];

    // 3. 检查是否已经顺延过到目标日期
    if (task.dueDate === newDateStr) {
      return false;  // 已经是目标日期，不重复顺延
    }

    // 4. 更新截止日期
    task.dueDate = newDateStr;

    // 5. 记录延期信息
    if (!task.originalDueDate) {
      task.originalDueDate = oldDate;
    }
    task.postponedCount = (task.postponedCount || 0) + 1;

    // 6. 记录延期历史（最多5条）
    if (!task.postponedHistory) {
      task.postponedHistory = [];
    }
    task.postponedHistory.push({
      from: oldDate,
      to: newDateStr,
      at: new Date().toISOString()
    });

    // 限制历史记录数量
    if (task.postponedHistory.length > 5) {
      task.postponedHistory.shift();
    }

    // 7. 保存
    this.storage.saveTasks();

    return true;
  }

  // 检测任务是否过期
  isOverdue(task) {
    if (!task.dueDate || task.completed) return false;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const due = new Date(task.dueDate + 'T23:59:59');

    return due < today;
  }

  // 获取过期天数
  getOverdueDays(task) {
    if (!this.isOverdue(task)) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);

    const diffDays = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // 渲染收集箱
  renderInbox() {
    const inboxTasks = this.getInboxTasks();
    document.getElementById('inboxCount').textContent = inboxTasks.length;

    const list = document.getElementById('inboxList');
    if (inboxTasks.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><p>收集箱空了，去添加一些任务吧！</p></div>';
    } else {
      list.innerHTML = inboxTasks.map(task => `
        <div class="task-item" onclick="taskManager.openEditPanel('${task.id}'); ui.openEditPanel();">
          <div class="task-checkbox" onclick="event.stopPropagation(); taskManager.toggleComplete('${task.id}'); taskManager.render();"></div>
          <div class="task-content">
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            <div class="task-meta">
              ${task.tag ? `<span class="task-tag">${this.escapeHtml(task.tag)}</span>` : ''}
              ${task.dueDate ? `<span>📅 ${task.dueDate}</span>` : ''}
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // 渲染四象限
  renderQuadrants() {
    const quadrantTasks = this.getQuadrantTasks();

    Object.entries(quadrantTasks).forEach(([key, qTasks]) => {
      const container = document.getElementById(`q-${key}`);
      const countEl = document.getElementById(`count-${key}`);

      countEl.textContent = qTasks.length;

      if (qTasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>暂无任务</p></div>';
      } else {
        container.innerHTML = qTasks.map(task => `
          <div class="task-card" onclick="taskManager.openEditPanel('${task.id}'); ui.openEditPanel();">
            <div class="task-card-header">
              <div class="task-checkbox" onclick="event.stopPropagation(); taskManager.toggleComplete('${task.id}'); taskManager.render();"></div>
              <div class="task-card-content">
                <div class="task-card-title">${this.escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-card-desc">${this.escapeHtml(task.description)}</div>` : ''}
              </div>
            </div>
            <div class="task-card-meta">
              ${task.tag ? `<span class="task-card-tag">${this.escapeHtml(task.tag)}</span>` : ''}
              ${task.dueDate ? `<span class="task-card-tag">📅 ${task.dueDate}</span>` : ''}
            </div>
          </div>
        `).join('');
      }
    });
  }

  // 渲染所有
  render() {
    this.renderInbox();
    this.renderQuadrants();
  }

  // 切换优先级锁定
  togglePriority() {
    this.lockedPriority = !this.lockedPriority;
    document.getElementById('priorityBtn').classList.toggle('active', this.lockedPriority);
  }

  // 切换紧急性锁定
  toggleUrgency() {
    this.lockedUrgency = !this.lockedUrgency;
    document.getElementById('urgencyBtn').classList.toggle('active', this.lockedUrgency);
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
