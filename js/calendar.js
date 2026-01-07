// 日历视图模块
class CalendarManager {
  constructor(storage) {
    this.storage = storage;
    this.currentDate = new Date();
    this.currentMonth = this.currentDate.getMonth();
    this.currentYear = this.currentDate.getFullYear();
  }

  // 渲染日历
  render() {
    this.updateTitle();
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
      const hasTasks = tasks.length > 0;
      const hasCompleted = tasks.filter(t => t.completed).length > 0;
      const isToday = isCurrentMonth && day === today.getDate();

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${hasTasks ? 'has-tasks' : ''} ${hasCompleted ? 'has-completed' : ''}"
             onclick="calendarManager.showDayTasks('${dateStr}')">
          <span class="calendar-day-number">${day}</span>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // 获取指定日期的任务
  getTasksForDate(dateStr) {
    return this.storage.tasks.filter(t => {
      if (!t.createdAt) return false;
      const taskDate = t.createdAt.split('T')[0];
      return taskDate === dateStr;
    });
  }

  // 显示某天的任务
  showDayTasks(dateStr) {
    const tasks = this.getTasksForDate(dateStr);
    const date = new Date(dateStr);
    const dateDisplay = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

    const modal = document.createElement('div');
    modal.className = 'calendar-task-modal';
    modal.innerHTML = `
      <div class="calendar-modal-header">
        <h3>${dateDisplay} 的任务 (${tasks.length})</h3>
        <button class="btn-close-modal" onclick="this.closest('.calendar-task-modal').remove()">×</button>
      </div>
      <div class="calendar-modal-body">
        ${tasks.length === 0 ? '<p style="text-align: center; color: var(--text-light);">当天没有任务</p>' : ''}
        ${tasks.map(task => `
          <div class="calendar-task-item ${task.completed ? 'completed' : ''}">
            <div class="calendar-task-title">${this.escapeHtml(task.title)}</div>
            ${task.tag ? `<span class="task-tag" style="font-size: 10px;">${this.escapeHtml(task.tag)}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    document.body.appendChild(modal);

    // 点击背景关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
