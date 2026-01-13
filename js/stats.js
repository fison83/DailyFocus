// 统计模块 - 增强版: 支持时间范围选择
class StatsManager {
  constructor(storage) {
    this.storage = storage;
    this.timeRange = 'all'; // all, today, week, month, year, custom
    this.customStartDate = null;
    this.customEndDate = null;

    // 弹窗状态
    this.modalCurrentPage = 1;
    this.modalItemsPerPage = 20;
    this.modalSearchQuery = '';
    this.modalFilter = 'all'; // all, pending, completed, overdue
    this.modalSort = 'date-desc'; // date-desc, date-asc, title
    this.modalCurrentTasks = []; // 当前弹窗显示的任务列表
    this.modalCurrentTitle = ''; // 当前弹窗标题
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

  // 显示任务详情弹窗（增强版）
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

    // 重置弹窗状态
    this.modalCurrentPage = 1;
    this.modalSearchQuery = '';
    this.modalFilter = 'all';
    this.modalSort = 'date-desc';
    this.modalCurrentTasks = filteredTasks; // 保存当前任务列表
    this.modalCurrentTitle = title; // 保存当前标题

    // 创建增强弹窗
    const modal = document.createElement('div');
    modal.className = 'task-list-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="statsManager.closeModal()"></div>
      <div class="modal-content large">
        <div class="modal-header">
          <h3>${title} (${filteredTasks.length})</h3>
          <button class="btn-close-modal" onclick="statsManager.closeModal()">×</button>
        </div>

        <!-- 工具栏 -->
        <div class="modal-toolbar">
          <input type="text" class="modal-search" placeholder="🔍 搜索任务..." id="modalSearch" value="${this.modalSearchQuery}">
          <select class="modal-filter" id="modalFilter">
            <option value="all" ${this.modalFilter === 'all' ? 'selected' : ''}>全部</option>
            <option value="pending" ${this.modalFilter === 'pending' ? 'selected' : ''}>未完成</option>
            <option value="completed" ${this.modalFilter === 'completed' ? 'selected' : ''}>已完成</option>
            <option value="overdue" ${this.modalFilter === 'overdue' ? 'selected' : ''}>已过期</option>
          </select>
          <select class="modal-sort" id="modalSort">
            <option value="date-desc" ${this.modalSort === 'date-desc' ? 'selected' : ''}>日期 (新→旧)</option>
            <option value="date-asc" ${this.modalSort === 'date-asc' ? 'selected' : ''}>日期 (旧→新)</option>
            <option value="title" ${this.modalSort === 'title' ? 'selected' : ''}>标题</option>
          </select>
        </div>

        <!-- 任务列表 -->
        <div class="modal-body" id="modalBody">
          ${this.renderModalTasks(filteredTasks)}
        </div>

        <!-- 分页 -->
        <div class="modal-footer">
          <span class="modal-pagination-info" id="modalPaginationInfo">显示 1-20 / 共 ${filteredTasks.length} 条</span>
          <div class="modal-pagination">
            <button class="btn-page" id="btnPrevPage" onclick="statsManager.modalPrevPage()">← 上一页</button>
            <span class="page-numbers" id="pageNumbers"></span>
            <button class="btn-page" id="btnNextPage" onclick="statsManager.modalNextPage()">下一页 →</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 绑定事件
    document.getElementById('modalSearch').addEventListener('input', (e) => {
      this.modalSearchQuery = e.target.value;
      this.modalCurrentPage = 1;
      this.updateModalTasks(filteredTasks);
    });

    document.getElementById('modalFilter').addEventListener('change', (e) => {
      this.modalFilter = e.target.value;
      this.modalCurrentPage = 1;
      this.updateModalTasks(filteredTasks);
    });

    document.getElementById('modalSort').addEventListener('change', (e) => {
      this.modalSort = e.target.value;
      this.modalCurrentPage = 1;
      this.updateModalTasks(filteredTasks);
    });
  }

  // 渲染弹窗任务列表
  renderModalTasks(tasks) {
    let filteredTasks = this.applyModalFilters(tasks);
    filteredTasks = this.applyModalSort(filteredTasks);

    // 分页
    const startIndex = (this.modalCurrentPage - 1) * this.modalItemsPerPage;
    const endIndex = startIndex + this.modalItemsPerPage;
    const pageTasks = filteredTasks.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredTasks.length / this.modalItemsPerPage);

    // 按周分组
    const groupedTasks = this.groupTasksByWeek(pageTasks);

    if (pageTasks.length === 0) {
      return '<p class="empty-state">暂无任务</p>';
    }

    let html = '';
    for (const [week, weekTasks] of Object.entries(groupedTasks)) {
      html += `
        <div class="task-group">
          <div class="task-group-header" onclick="statsManager.toggleTaskGroup(this.parentElement)">
            <span class="task-group-icon">▼</span>
            <span class="task-group-title">${week}</span>
            <span class="task-group-count">(${weekTasks.length})</span>
          </div>
          <div class="task-group-body">
            ${weekTasks.map(task => this.renderModalTaskItem(task)).join('')}
          </div>
        </div>
      `;
    }

    return html;
  }

  // 应用弹窗过滤
  applyModalFilters(tasks) {
    let filtered = [...tasks];

    // 搜索过滤
    if (this.modalSearchQuery) {
      const query = this.modalSearchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query))
      );
    }

    // 状态过滤
    switch (this.modalFilter) {
      case 'pending':
        filtered = filtered.filter(t => !t.completed);
        break;
      case 'completed':
        filtered = filtered.filter(t => t.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date());
        break;
    }

    return filtered;
  }

  // 应用弹窗排序
  applyModalSort(tasks) {
    const sorted = [...tasks];

    switch (this.modalSort) {
      case 'date-desc':
        sorted.sort((a, b) => new Date(b.createdAt || b.dueDate) - new Date(a.createdAt || a.dueDate));
        break;
      case 'date-asc':
        sorted.sort((a, b) => new Date(a.createdAt || a.dueDate) - new Date(b.createdAt || b.dueDate));
        break;
      case 'title':
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
        break;
    }

    return sorted;
  }

  // 按周分组任务
  groupTasksByWeek(tasks) {
    const grouped = {};
    const now = new Date();

    tasks.forEach(task => {
      const date = new Date(task.createdAt || task.dueDate);
      const weekStart = this.getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekKey = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日-${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;

      if (!grouped[weekKey]) {
        grouped[weekKey] = [];
      }
      grouped[weekKey].push(task);
    });

    return grouped;
  }

  // 获取一周的开始（周一）
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // 渲染弹窗任务项
  renderModalTaskItem(task) {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

    return `
      <div class="task-list-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}">
        <div class="task-list-item-title">${this.escapeHtml(task.title)}</div>
        <div class="task-list-item-meta">
          <span class="task-date">${new Date(task.createdAt).toLocaleDateString('zh-CN')}</span>
          ${task.dueDate ? `<span class="task-due-date">📅 ${task.dueDate}</span>` : ''}
          ${task.tag ? `<span class="task-tag">${this.escapeHtml(task.tag)}</span>` : ''}
          ${task.postponedCount ? `<span class="postponed-badge">已延期${task.postponedCount}次</span>` : ''}
          ${isOverdue ? `<span class="overdue-badge">⚠️ 过期</span>` : ''}
          ${task.completed ? '<span class="task-status completed">✓ 已完成</span>' : '<span class="task-status">进行中</span>'}
        </div>
      </div>
    `;
  }

  // 更新弹窗任务列表
  updateModalTasks(originalTasks) {
    const modalBody = document.getElementById('modalBody');
    if (modalBody) {
      modalBody.innerHTML = this.renderModalTasks(originalTasks);
      this.updateModalPagination(originalTasks);
    }
  }

  // 更新分页信息
  updateModalPagination(tasks) {
    let filteredTasks = this.applyModalFilters(tasks);
    const totalPages = Math.ceil(filteredTasks.length / this.modalItemsPerPage);

    const paginationInfo = document.getElementById('modalPaginationInfo');
    const btnPrevPage = document.getElementById('btnPrevPage');
    const btnNextPage = document.getElementById('btnNextPage');
    const pageNumbers = document.getElementById('pageNumbers');

    if (paginationInfo) {
      const startIndex = (this.modalCurrentPage - 1) * this.modalItemsPerPage + 1;
      const endIndex = Math.min(startIndex + this.modalItemsPerPage - 1, filteredTasks.length);
      paginationInfo.textContent = filteredTasks.length > 0 ?
        `显示 ${startIndex}-${endIndex} / 共 ${filteredTasks.length} 条` :
        '暂无数据';
    }

    if (btnPrevPage) {
      btnPrevPage.disabled = this.modalCurrentPage === 1;
    }

    if (btnNextPage) {
      btnNextPage.disabled = this.modalCurrentPage >= totalPages;
    }

    if (pageNumbers) {
      let pageHtml = '';
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.modalCurrentPage - 2 && i <= this.modalCurrentPage + 2)) {
          pageHtml += `<button class="btn-page-number ${i === this.modalCurrentPage ? 'active' : ''}" onclick="statsManager.modalGoToPage(${i})">${i}</button>`;
        } else if (pageNumbers.lastChild && pageNumbers.lastChild.textContent === '...') {
          continue;
        } else {
          pageHtml += '<span>...</span>';
        }
      }
      pageNumbers.innerHTML = pageHtml;
    }
  }

  // 分页方法
  modalPrevPage() {
    if (this.modalCurrentPage > 1) {
      this.modalCurrentPage--;
      this.refreshModal();
    }
  }

  modalNextPage() {
    let filteredTasks = this.applyModalFilters(this.getFilteredTasks());
    const totalPages = Math.ceil(filteredTasks.length / this.modalItemsPerPage);
    if (this.modalCurrentPage < totalPages) {
      this.modalCurrentPage++;
      this.refreshModal();
    }
  }

  modalGoToPage(page) {
    this.modalCurrentPage = page;
    this.refreshModal();
  }

  // 刷新弹窗
  refreshModal() {
    // 使用保存的任务列表，而不是重新计算
    this.updateModalTasks(this.modalCurrentTasks);
  }

  // 关闭弹窗
  closeModal() {
    const modal = document.querySelector('.task-list-modal');
    if (modal) {
      modal.remove();
    }
    // 重置状态
    this.modalCurrentTasks = [];
    this.modalCurrentTitle = '';
  }

  // 切换任务组折叠状态
  toggleTaskGroup(groupElement) {
    groupElement.classList.toggle('collapsed');
    const icon = groupElement.querySelector('.task-group-icon');
    if (icon) {
      icon.textContent = groupElement.classList.contains('collapsed') ? '▶' : '▼';
    }
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
