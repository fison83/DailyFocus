// 日历视图模块
class CalendarManager {
  constructor(storage) {
    this.storage = storage;
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
    this.viewMode = 'due'; // 'due' 或 'created'
    this.currentModal = null; // 当前弹窗引用
  }

  // 设置视图模式
  setViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  // 切换视图模式
  toggleViewMode() {
    this.viewMode = this.viewMode === 'due' ? 'created' : 'due';
    this.updateToggleButton();
    this.render();
  }

  // 更新切换按钮文本
  updateToggleButton() {
    const btn = document.getElementById('calendarViewToggle');
    if (btn) {
      // 显示当前模式，让用户知道可以切换到另一种模式
      const currentModeText = this.viewMode === 'due' ? '当前：按截止日期' : '当前：按创建日期';
      const switchModeText = this.viewMode === 'due' ? '切换：按创建日期' : '切换：按截止日期';
      btn.textContent = currentModeText + ' | ' + switchModeText;
      btn.title = switchModeText;
    }
  }

  // 渲染日历
  render() {
    this.updateTitle();
    this.updateToggleButton();
    this.renderDays();
  }

  // 更新标题
  updateTitle() {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月',
                    '7月', '8月', '9月', '10月', '11月', '12月'];
    document.getElementById('calendarTitle').textContent =
      `${this.currentYear}年${months[this.currentMonth]}`;
  }

  // 上一个月
  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.render();
  }

  // 下一个月
  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.render();
  }

  // 渲染日期
  renderDays() {
    const container = document.getElementById('calendarDays');
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === this.currentMonth &&
                          today.getFullYear() === this.currentYear;

    let html = '';

    // 填充空白天数
    for (let i = 0; i < startingDay; i++) {
      html += '<div class="calendar-day empty"><span class="calendar-day-number"></span></div>';
    }

    // 填充实际天数
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const tasks = this.getTasksForDate(dateStr);
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      const overdueTasks = tasks.filter(t => !t.completed && this.isOverdue(t));

      const hasTasks = totalTasks > 0;
      const isToday = isCurrentMonth && day === today.getDate();

      // 任务状态点（最多显示5个）
      let dotsHtml = '';
      if (totalTasks > 0) {
        const maxDots = 5;
        const showTasks = tasks.slice(0, maxDots);

        dotsHtml = '<div class="calendar-dots">';
        dotsHtml += showTasks.map(task => {
          // 根据四象限确定圆点颜色
          const quadrant = taskManager.getQuadrant(task);
          let dotClass = 'task-dot';

          if (quadrant === 'urgent-important') dotClass += ' urgent-important';
          else if (quadrant === 'urgent') dotClass += ' urgent';
          else if (quadrant === 'important') dotClass += ' important';
          else dotClass += ' normal';

          // 已完成任务添加 completed 类
          if (task.completed) dotClass += ' completed';

          return `<span class="${dotClass}"></span>`;
        }).join('');

        if (totalTasks > maxDots) {
          dotsHtml += `<span class="task-dot more">+${totalTasks - maxDots}</span>`;
        }

        dotsHtml += '</div>';
      }

      // 过期标记和完成率
      let metaHtml = '';
      if (overdueTasks.length > 0) {
        metaHtml += `<span class="calendar-overdue-badge">⚠️ ${overdueTasks.length}</span>`;
      }
      if (totalTasks > 0) {
        metaHtml += `<span class="calendar-completion">${completedTasks}/${totalTasks}</span>`;
      }

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''}"
             onclick="calendarManager.showDayTasks('${dateStr}')">
          <span class="calendar-day-number">${day}</span>
          ${dotsHtml}
          ${metaHtml}
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // 获取指定日期的任务
  getTasksForDate(dateStr) {
    return this.storage.tasks.filter(t => {
      // 根据视图模式选择日期字段
      if (this.viewMode === 'due') {
        // 截止日期模式：只显示有截止日期的任务
        if (!t.dueDate) return false;
        return t.dueDate === dateStr;
      } else {
        // 创建日期模式：显示所有任务
        if (!t.createdAt) return false;
        return t.createdAt.split('T')[0] === dateStr;
      }
    });
  }

  // 检测任务是否过期
  isOverdue(task) {
    if (!task.dueDate || task.completed) return false;

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const due = new Date(task.dueDate + 'T23:59:59');

    return due < today;
  }

  // 显示某天的任务
  showDayTasks(dateStr) {
    // 关闭已存在的弹窗
    this.closeModal();

    const tasks = this.getTasksForDate(dateStr);
    const date = new Date(dateStr);
    const dateDisplay = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

    const modal = document.createElement('div');
    modal.className = 'calendar-task-modal';
    modal.innerHTML = `
      <div class="calendar-modal-header">
        <h3>${dateDisplay} 的任务 (${tasks.length})</h3>
        <button class="btn-close-modal" onclick="calendarManager.closeModal()">×</button>
      </div>
      <div class="calendar-modal-body">
        ${tasks.length === 0 ? '<p style="text-align: center; color: var(--text-light);">当天没有任务</p>' : ''}
        ${tasks.map(task => {
          const isOverdue = this.isOverdue(task);
          const overdueDays = isOverdue ? taskManager.getOverdueDays(task) : 0;

          return `
            <div class="calendar-task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
              <div class="calendar-task-title">
                ${this.escapeHtml(task.title)}
                ${isOverdue ? `<span class="overdue-badge">⚠️ 过期${overdueDays}天</span>` : ''}
              </div>
              <div class="calendar-task-meta">
                ${task.tag ? `<span class="task-tag">${this.escapeHtml(task.tag)}</span>` : ''}
                ${task.dueDate ? `<span class="task-due-date">📅 ${task.dueDate}</span>` : ''}
                ${task.postponedCount ? `<span class="postponed-badge">已延期${task.postponedCount}次</span>` : ''}
              </div>
              ${!task.completed && task.dueDate && isOverdue ? `
                <div class="calendar-task-actions">
                  <button class="btn-extend" onclick="event.stopPropagation(); calendarManager.handleTaskAction('${task.id}', 'extend', 0)">顺延到今天</button>
                  <button class="btn-extend" onclick="event.stopPropagation(); calendarManager.handleTaskAction('${task.id}', 'extend', 7)">顺延+7天</button>
                  <button class="btn-complete" onclick="event.stopPropagation(); calendarManager.handleTaskAction('${task.id}', 'complete')">完成</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.currentModal = modal;
    document.body.appendChild(modal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  // 关闭弹窗
  closeModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  // 处理任务操作
  handleTaskAction(taskId, action, param = null) {
    if (action === 'extend') {
      taskManager.extendDueDate(taskId, param);
    } else if (action === 'complete') {
      taskManager.toggleComplete(taskId);
    }
    this.render();
    this.closeModal();
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
