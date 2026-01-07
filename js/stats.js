// 统计模块 - 增强版: 支持时间范围选择
class StatsManager {
  constructor(storage) {
    this.storage = storage;
    this.timeRange = 'all'; // all, today, week, month, year, custom
    this.customStartDate = null;
    this.customEndDate = null;
  }

  // 设置时间范围
  setTimeRange(range) {
    this.timeRange = range;
    this.update();

    // 更新按钮状态
    document.querySelectorAll('.time-range-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.range === range);
    });

    // 显示/隐藏自定义日期选择器
    const customPicker = document.getElementById('customDateRange');
    if (customPicker) {
      customPicker.style.display = range === 'custom' ? 'flex' : 'none';
    }
  }

  // 设置自定义日期范围
  setCustomRange(start, end) {
    this.customStartDate = start;
    this.customEndDate = end;
    this.update();
  }

  // 获取过滤后的任务
  getFilteredTasks() {
    let tasks = [...this.storage.tasks];
    const now = new Date();

    switch (this.timeRange) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        tasks = tasks.filter(t => t.createdAt && t.createdAt.startsWith(today));
        break;

      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        tasks = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= weekAgo);
        break;

      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        tasks = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= monthStart);
        break;

      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        tasks = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= yearStart);
        break;

      case 'custom':
        if (this.customStartDate && this.customEndDate) {
          tasks = tasks.filter(t => {
            if (!t.createdAt) return false;
            const date = t.createdAt.split('T')[0];
            return date >= this.customStartDate && date <= this.customEndDate;
          });
        }
        break;
    }

    return tasks;
  }

  // 更新统计数据
  update() {
    const tasks = this.getFilteredTasks();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const inbox = tasks.filter(t => !t.organized && !t.completed).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-inbox').textContent = inbox;

    // 更新完成率进度条
    const rateBar = document.getElementById('stat-rate-bar');
    const rateText = document.getElementById('stat-rate-text');
    if (rateBar) {
      rateBar.style.width = rate + '%';
    }
    if (rateText) {
      rateText.textContent = rate + '%';
    }
  }

  // 显示任务详情弹窗
  showTaskList(type) {
    const tasks = this.getFilteredTasks();
    let filteredTasks = [];
    let title = '';

    const rangeLabels = {
      'all': '全部',
      'today': '今天',
      'week': '本周',
      'month': '本月',
      'year': '今年',
      'custom': '自定义'
    };

    const rangeLabel = rangeLabels[this.timeRange] || '';

    switch(type) {
      case 'total':
        filteredTasks = tasks;
        title = `${rangeLabel}所有任务`;
        break;
      case 'completed':
        filteredTasks = tasks.filter(t => t.completed);
        title = `${rangeLabel}已完成任务`;
        break;
      case 'inbox':
        filteredTasks = tasks.filter(t => !t.organized && !t.completed);
        title = `${rangeLabel}待整理任务`;
        break;
    }

    // 按日期排序
    filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'task-list-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title} (${filteredTasks.length})</h3>
          <button class="btn-close-modal" onclick="this.closest('.task-list-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          ${filteredTasks.length === 0 ? '<p class="empty-state">暂无任务</p>' : ''}
          ${filteredTasks.map(task => `
            <div class="task-list-item ${task.completed ? 'completed' : ''}">
              <div class="task-list-item-title">${this.escapeHtml(task.title)}</div>
              <div class="task-list-item-meta">
                <span class="task-date">${new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
                ${task.completed ? '<span class="task-status completed">✓ 已完成</span>' : '<span class="task-status">进行中</span>'}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
