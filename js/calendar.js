// 日历视图模块 - 列表视图
class CalendarManager {
  constructor(storage) {
    this.storage = storage;
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.viewMode = 'due'; // 'due' 或 'created'
    this.collapsedDays = new Set(); // 折叠的日期
  }

  // 设置视图模式
  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  // 切换视图模式
  toggleViewMode() {
    this.viewMode = this.viewMode === 'due' ? 'created' : 'due';
    this.render();
  }

  // 渲染日历
  render() {
    const container = document.getElementById('calendarView');
    if (!container) return;

    const year = this.currentYear;
    const month = this.currentMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 按日期分组任务
    const tasksByDate = this.groupTasksByDate();

    let html = `
      <div class="calendar-list-container">
        ${this.renderHeader()}
        <div class="calendar-list-body">
    `;

    // 渲染每一天
    let hasTasks = false;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = tasksByDate[dateStr] || [];

      // 只显示有任务的日期
      if (dayTasks.length > 0) {
        hasTasks = true;
        const isToday = this.isToday(dateStr);
        const hasOverdue = dayTasks.some(t => !t.completed && this.isOverdue(t));
        const isCollapsed = this.collapsedDays.has(dateStr);

        html += this.renderDayBlock(dateStr, dayTasks, isToday, hasOverdue, isCollapsed);
      }
    }

    if (!hasTasks) {
      html += `
        <div class="calendar-empty">
          <div class="calendar-empty-icon">📅</div>
          <p>本月没有任务</p>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // 渲染头部
  renderHeader() {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月',
                    '7月', '8月', '9月', '10月', '11月', '12月'];

    return `
      <div class="calendar-header">
        <button class="calendar-nav-btn" onclick="calendarManager.changeMonth(-1)">◀</button>
        <span class="calendar-title">${this.currentYear}年 ${months[this.currentMonth]}</span>
        <button class="calendar-nav-btn" onclick="calendarManager.changeMonth(1)">▶</button>
        <button class="calendar-view-toggle" onclick="calendarManager.toggleViewMode()">
          ${this.viewMode === 'due' ? '📅 截止日期' : '📝 创建日期'}
        </button>
      </div>
    `;
  }

  // 切换月份
  changeMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.collapsedDays.clear(); // 清除折叠状态
    this.render();
  }

  // 按日期分组任务
  groupTasksByDate() {
    const grouped = {};

    this.storage.tasks.forEach(task => {
      if (task.deleted) return;

      let dateStr;
      if (this.viewMode === 'due') {
        if (!task.dueDate) return;
        dateStr = task.dueDate;
      } else {
        if (!task.createdAt) return;
        dateStr = task.createdAt.split('T')[0];
      }

      // 只显示当前月的任务
      const [year, month] = dateStr.split('-').map(Number);
      if (year !== this.currentYear || month - 1 !== this.currentMonth) return;

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(task);
    });

    // 按完成状态排序：未完成在前
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => a.completed - b.completed);
    });

    return grouped;
  }

  // 渲染日期块
  renderDayBlock(dateStr, tasks, isToday, hasOverdue, isCollapsed) {
    const date = new Date(dateStr);
    const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];

    const completedCount = tasks.filter(t => t.completed).length;

    let classes = ['day-list-item'];
    if (isToday) classes.push('today');
    if (hasOverdue) classes.push('overdue');
    if (isCollapsed) classes.push('collapsed');

    return `
      <div class="${classes.join(' ')}" data-date="${dateStr}">
        <div class="day-header" onclick="calendarManager.toggleDay('${dateStr}')">
          <div class="day-header-left">
            <span class="day-date">📅 ${dateDisplay}</span>
            <span class="day-weekday">${weekday}</span>
          </div>
          <div class="day-header-right">
            <span class="day-task-count">${completedCount}/${tasks.length}</span>
            <span class="day-collapse-icon">▼</span>
          </div>
        </div>
        <div class="day-task-list">
          ${tasks.map(task => this.renderTaskRow(task)).join('')}
        </div>
      </div>
    `;
  }

  // 渲染任务行
  renderTaskRow(task) {
    const isOverdue = this.isOverdue(task);

    let dueDateText = '';
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      if (isOverdue) {
        const overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        dueDateText = `<span class="task-due-date overdue">⚠️ 过期${overdueDays}天</span>`;
      } else if (task.dueDate === todayStr) {
        dueDateText = `<span class="task-due-date today">📅 今天</span>`;
      } else if (task.dueDate === tomorrowStr) {
        dueDateText = `<span class="task-due-date">📅 明天</span>`;
      } else {
        dueDateText = `<span class="task-due-date">📅 ${task.dueDate}</span>`;
      }
    }

    return `
      <div class="task-row ${task.completed ? 'completed' : ''}" onclick="event.stopPropagation(); calendarManager.openTaskDetail('${task.id}')">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}"
             onclick="event.stopPropagation(); calendarManager.toggleTaskComplete('${task.id}')">
        </div>
        <div class="task-content">
          <div class="task-title">${this.escapeHtml(task.title)}</div>
          <div class="task-meta">
            ${task.tag ? `<span class="task-tag">📌 ${this.escapeHtml(task.tag)}</span>` : ''}
            ${dueDateText}
            ${task.postponedCount ? `<span class="task-status">已延期${task.postponedCount}次</span>` : ''}
            ${task.completed ? `<span class="task-status">✅ 已完成</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 切换日期折叠状态
  toggleDay(dateStr) {
    if (this.collapsedDays.has(dateStr)) {
      this.collapsedDays.delete(dateStr);
    } else {
      this.collapsedDays.add(dateStr);
    }
    this.render();
  }

  // 切换任务完成状态
  toggleTaskComplete(taskId) {
    taskManager.toggleComplete(taskId);
    this.render();
  }

  // 打开任务详情
  openTaskDetail(taskId) {
    taskManager.openEditPanel(taskId);
    ui.openEditPanel();
  }

  // 判断是否是今天
  isToday(dateStr) {
    const today = new Date();
    return dateStr === today.toISOString().split('T')[0];
  }

  // 检测任务是否过期
  isOverdue(task) {
    if (!task.dueDate || task.completed) return false;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const due = new Date(task.dueDate + 'T23:59:59');

    return due < today;
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
