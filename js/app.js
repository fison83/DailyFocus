// DailyFocus V5 - 主入口文件

// 全局变量
let taskManager, goalManager, readingManager, statsManager, allTasksManager, calendarManager, ui;

// 初始化应用
function init() {
  // 创建管理器实例
  taskManager = new TaskManager(storage);
  goalManager = new GoalManager(storage);
  readingManager = new ReadingManager(storage);
  statsManager = new StatsManager(storage);
  allTasksManager = new AllTasksManager(storage);
  calendarManager = new CalendarManager(storage);
  ui = new UIManager(taskManager, goalManager, readingManager, statsManager);

  // 设置事件监听
  ui.setupEventListeners();

  // 设置自动同步监听器
  ui.setupAutoSyncListener();

  // 初始化UI
  ui.updateDate();
  ui.renderQuickTags();
  ui.renderTagsList();
  ui.renderTagSelect();
  taskManager.render();
  statsManager.update();
  goalManager.updateBanner();

  // 自动下载云端数据（如果开启了自动同步）
  storage.autoDownload();

  // 设置移动端底部导航事件
  // setupMobileBottomNav(); // 已移到 DOMContentLoaded 中调用
}

// 绑定移动端导航事件
function bindMobileNavEvents() {
  // 只在移动端（屏幕宽度 ≤ 1024px）才执行
  if (window.innerWidth > 1024) {
    return; // 电脑端不执行，不影响原有导航
  }

  // 底部导航点击事件
  const navBtns = document.querySelectorAll('.mobile-bottom-nav .nav-btn[data-view]');

  if (navBtns.length === 0) {
    return; // 没有找到移动端导航按钮，直接返回
  }

  navBtns.forEach((btn) => {
    const view = btn.getAttribute('data-view');

    // 使用 onclick 方式绑定事件
    btn.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();

      // 调用视图切换
      if (ui && ui.switchView) {
        ui.switchView(view);
      }
    };
  });

  // 保存原始 switchView 方法
  const originalSwitchView = ui.switchView;

  // 重写 switchView 方法以同步底部导航状态
  if (originalSwitchView) {
    ui.switchView = function(view) {
      // 调用原始方法
      originalSwitchView.call(this, view);

      // 更新底部导航激活状态
      document.querySelectorAll('.mobile-bottom-nav .nav-btn').forEach(btn => {
        const btnView = btn.getAttribute('data-view');
        if (btnView) {
          btn.classList.toggle('active', btnView === view);
        }
      });
    };
  }
}

// 全局函数（供HTML调用）
function quickAdd() {
  ui.handleQuickAdd();
}

function togglePriority() {
  taskManager.togglePriority();
}

function toggleUrgency() {
  taskManager.toggleUrgency();
}

function toggleQuickDatePicker() {
  const select = document.getElementById('quickDueDate');
  const picker = document.getElementById('quickDueDatePicker');

  if (select.value === 'custom') {
    picker.style.display = 'block';
    picker.focus();
  } else {
    picker.style.display = 'none';
    picker.value = '';
  }
}

function organizeInbox() {
  const count = taskManager.organizeInbox();
  taskManager.render();
}

function openEditPanel(taskId) {
  taskManager.openEditPanel(taskId);
  ui.openEditPanel();
}

function closeEditPanel() {
  ui.closeEditPanel();
}

function saveTask() {
  ui.saveTask();
}

function deleteTask() {
  if (confirm('确定要删除这个任务吗？')) {
    ui.deleteTask();
  }
}

function setDate(days) {
  ui.setDate(days);
}

function createGoal() {
  goalManager.createGoal();
  ui.openGoalPanel();
}

function openGoalPanel(goalId) {
  goalManager.openGoalPanel(goalId);
  ui.openGoalPanel();
}

function closeGoalPanel() {
  ui.closeGoalPanel();
}

function saveGoal() {
  ui.saveGoal();
}

function deleteGoal() {
  if (confirm('确定要删除这个目标吗？')) {
    ui.deleteGoal();
  }
}

function updateGoalProgress(goalId, delta) {
  goalManager.updateProgress(goalId, delta);
}

function completeGoal(goalId) {
  goalManager.completeGoal(goalId);
}

function setGoalDate(days) {
  goalManager.setGoalDate(days);
}

function showAddTagInput() {
  ui.showAddTagInput();
}

function hideAddTagInput() {
  ui.hideAddTagInput();
}

function addNewTag() {
  ui.addNewTag();
}

function removeTag(tagName) {
  ui.removeTag(tagName);
}

function createReadingRecord() {
  readingManager.createReadingRecord();
  ui.openReadingPanel();
}

function openReadingPanel(recordId) {
  readingManager.openReadingPanel(recordId);
  ui.openReadingPanel();
}

function closeReadingPanel() {
  ui.closeReadingPanel();
}

function saveReadingRecord() {
  ui.saveReadingRecord();
}

function deleteReading() {
  if (confirm('确定要删除这条阅读记录吗？')) {
    ui.deleteReading();
  }
}

function deleteReadingDirect(recordId) {
  readingManager.deleteDirect(recordId);
}

function toggleDeepDive() {
  readingManager.toggleSection('deepDiveContent');
}

function exportData() {
  ui.exportData();
}

function importData() {
  ui.importData();
}

function handleImportFile(event) {
  ui.handleImportFile(event);
}

function showCloudSyncPanel() {
  ui.openCloudSyncPanel();
}

function closeCloudSyncPanel() {
  ui.closeCloudSyncPanel();
}

async function uploadToCloud() {
  await ui.uploadToCloud();
}

async function downloadFromCloud() {
  await ui.downloadFromCloud();
}

function toggleAutoSync() {
  ui.toggleAutoSync();
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  init();
  // 延迟绑定移动端导航事件，确保 DOM 完全加载
  setTimeout(() => {
    bindMobileNavEvents();
  }, 100);
});
