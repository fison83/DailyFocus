// 目标管理模块
class GoalManager {
  constructor(storage) {
    this.storage = storage;
    this.currentGoalId = null;
  }

  // 计算剩余天数
  calculateDaysLeft(dueDate) {
    if (!dueDate) return '--';

    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

    if (diff < 0) return '已过期';
    return diff;
  }

  // 更新目标横幅
  updateBanner() {
    const activeGoal = this.storage.goals.find(g => !g.completed) || this.storage.goals[0];

    const titleEl = document.getElementById('bannerGoalTitle');
    const daysEl = document.getElementById('bannerDaysLeft');
    const progressEl = document.getElementById('bannerProgress');
    const progressTextEl = document.getElementById('bannerProgressText');

    // 检查元素是否存在
    if (!titleEl || !daysEl || !progressEl || !progressTextEl) {
      console.warn('[目标横幅] DOM 元素未找到，跳过更新');
      return;
    }

    if (activeGoal) {
      const daysLeft = this.calculateDaysLeft(activeGoal.dueDate);

      titleEl.textContent = activeGoal.title;
      daysEl.textContent = daysLeft;
      progressEl.style.width = activeGoal.progress + '%';
      progressTextEl.textContent = activeGoal.progress + '%';
    } else {
      titleEl.textContent = '暂无目标，点击创建一个吧！';
      daysEl.textContent = '--';
      progressEl.style.width = '0%';
      progressTextEl.textContent = '0%';
    }
  }

  // 渲染目标列表
  render() {
    const activeGoals = this.storage.goals.filter(g => !g.completed);
    const completedGoals = this.storage.goals.filter(g => g.completed);

    this.updateStats();
    this.renderGoalsGrid('activeGoalsGrid', activeGoals);
    this.renderGoalsGrid('completedGoalsGrid', completedGoals);
  }

  // 更新统计卡片
  updateStats() {
    const activeCount = this.storage.goals.filter(g => !g.completed).length;
    const completedCount = this.storage.goals.filter(g => g.completed).length;
    const allCount = this.storage.goals.length;

    document.getElementById('goalStatActive').textContent = activeCount;
    document.getElementById('goalStatCompleted').textContent = completedCount;
    document.getElementById('goalStatAll').textContent = allCount;
  }

  // 显示所有目标弹窗
  showAllGoals(filter) {
    let goals = [];
    let title = '';

    switch (filter) {
      case 'active':
        goals = this.storage.goals.filter(g => !g.completed);
        title = `进行中的目标 (${goals.length})`;
        break;
      case 'completed':
        goals = this.storage.goals.filter(g => g.completed);
        title = `已完成的目标 (${goals.length})`;
        break;
      case 'all':
        goals = this.storage.goals;
        title = `所有目标 (${goals.length})`;
        break;
    }

    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'task-list-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="goalManager.closeGoalsModal()"></div>
      <div class="modal-content large">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="btn-close-modal" onclick="goalManager.closeGoalsModal()">×</button>
        </div>
        <div class="modal-body" style="max-height: 60vh; overflow-y: auto; padding: 16px;">
          ${goals.length === 0 ? '<p style="text-align: center; color: var(--text-light);">暂无目标</p>' : ''}
          ${goals.map(goal => {
            const daysLeft = this.calculateDaysLeft(goal.dueDate);
            return `
              <div class="goal-card" style="margin-bottom: 12px;" onclick="goalManager.closeGoalsModal(); goalManager.openGoalPanel('${goal.id}'); ui.openGoalPanel();">
                <div class="goal-card-header">
                  <div>
                    <div class="goal-card-title">${this.escapeHtml(goal.title)}</div>
                    ${goal.description ? `<div class="goal-card-desc">${this.escapeHtml(goal.description)}</div>` : ''}
                  </div>
                  <span class="goal-card-status ${goal.completed ? 'completed' : 'active'}">
                    ${goal.completed ? '已完成' : '进行中'}
                  </span>
                </div>
                <div class="goal-card-meta">
                  <div class="goal-card-countdown">
                    <span>⏱️ 剩余 ${daysLeft} 天</span>
                    <span>${goal.progress}%</span>
                  </div>
                  <div class="goal-card-progress">
                    <div class="progress-bar-card">
                      <div class="progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // 关闭目标弹窗
  closeGoalsModal() {
    const modal = document.querySelector('.task-list-modal');
    if (modal) {
      modal.remove();
    }
  }

  renderGoalsGrid(containerId, goalsList) {
    const container = document.getElementById(containerId);

    if (goalsList.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><p style="font-size: 13px;">暂无目标</p></div>';
      return;
    }

    container.innerHTML = goalsList.map(goal => {
      const daysLeft = this.calculateDaysLeft(goal.dueDate);

      return `
        <div class="goal-card" onclick="goalManager.openGoalPanel('${goal.id}')">
          <div class="goal-card-header">
            <div>
              <div class="goal-card-title">${this.escapeHtml(goal.title)}</div>
              ${goal.description ? `<div class="goal-card-desc">${this.escapeHtml(goal.description)}</div>` : ''}
            </div>
            <span class="goal-card-status ${goal.completed ? 'completed' : 'active'}">
              ${goal.completed ? '已完成' : '进行中'}
            </span>
          </div>
          <div class="goal-card-meta">
            <div class="goal-card-countdown">
              <span>⏱️ 剩余 ${daysLeft} 天</span>
              <span>${goal.completed ? '✓' : '进行中'}</span>
            </div>
            <div class="goal-card-progress">
              <div class="progress-label">
                <span>进度</span>
                <span>${goal.progress}%</span>
              </div>
              <div class="progress-bar-card">
                <div class="progress-fill" style="width: ${goal.progress}%"></div>
              </div>
            </div>
            <div class="goal-card-actions">
              <button class="btn-goal-action" onclick="event.stopPropagation(); goalManager.updateProgress('${goal.id}', -10); goalManager.render(); goalManager.updateBanner();">-10%</button>
              <button class="btn-goal-action" onclick="event.stopPropagation(); goalManager.updateProgress('${goal.id}', 10); goalManager.render(); goalManager.updateBanner();">+10%</button>
              <button class="btn-goal-action primary" onclick="event.stopPropagation(); goalManager.completeGoal('${goal.id}'); goalManager.render(); goalManager.updateBanner();">
                ${goal.completed ? '重新开始' : '完成'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 创建目标
  createGoal() {
    this.currentGoalId = null;
    document.getElementById('goalPanelTitle').textContent = '新建目标';
    document.getElementById('goalTitle').value = '';
    document.getElementById('goalDesc').value = '';
    document.getElementById('goalDueDate').value = '';
    document.getElementById('goalProgress').value = 0;
    document.getElementById('btnDeleteGoal').style.display = 'none';
  }

  // 打开目标编辑面板
  openGoalPanel(goalId) {
    this.currentGoalId = goalId;
    const goal = this.storage.goals.find(g => g.id === goalId);

    if (goal) {
      document.getElementById('goalPanelTitle').textContent = '编辑目标';
      document.getElementById('goalTitle').value = goal.title;
      document.getElementById('goalDesc').value = goal.description || '';
      document.getElementById('goalDueDate').value = goal.dueDate || '';
      document.getElementById('goalProgress').value = goal.progress;
      document.getElementById('btnDeleteGoal').style.display = 'block';
    }
  }

  // 保存目标
  saveGoal() {
    const title = document.getElementById('goalTitle').value.trim();
    if (!title) {
      alert('请输入目标标题');
      return false;
    }

    const goalData = {
      id: this.currentGoalId || Date.now().toString(),
      title,
      description: document.getElementById('goalDesc').value.trim(),
      dueDate: document.getElementById('goalDueDate').value,
      progress: parseInt(document.getElementById('goalProgress').value) || 0,
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (this.currentGoalId) {
      const index = this.storage.goals.findIndex(g => g.id === this.currentGoalId);
      if (index !== -1) {
        this.storage.goals[index] = { ...this.storage.goals[index], ...goalData };
      }
    } else {
      this.storage.goals.push(goalData);
    }

    this.storage.saveGoals();
    return true;
  }

  // 删除目标
  deleteGoal() {
    if (this.currentGoalId) {
      this.storage.goals = this.storage.goals.filter(g => g.id !== this.currentGoalId);
      this.storage.saveGoals();
      this.currentGoalId = null;
      return true;
    }
    return false;
  }

  // 更新目标进度
  updateProgress(goalId, delta) {
    const goal = this.storage.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.max(0, Math.min(100, goal.progress + delta));
      if (goal.progress >= 100) {
        goal.completed = true;
      }
      this.storage.saveGoals();
    }
  }

  // 完成目标
  completeGoal(goalId) {
    const goal = this.storage.goals.find(g => g.id === goalId);
    if (goal) {
      goal.completed = !goal.completed;
      goal.progress = goal.completed ? 100 : 0;
      this.storage.saveGoals();
    }
  }

  // 设置目标日期
  setGoalDate(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    document.getElementById('goalDueDate').value = date.toISOString().split('T')[0];
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
