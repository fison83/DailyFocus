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
  setupMobileBottomNav();
}

// 设置移动端底部导航
function setupMobileBottomNav() {
  // 底部导航点击事件
  document.querySelectorAll('.mobile-bottom-nav .nav-btn[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.switchView(btn.dataset.view);
    });
  });

  // 保存原始 switchView 方法
  const originalSwitchView = ui.switchView;

  // 重写 switchView 方法以同步底部导航状态
  ui.switchView = function(view) {
    // 调用原始方法
    originalSwitchView.call(this, view);

    // 更新底部导航激活状态
    document.querySelectorAll('.mobile-bottom-nav .nav-btn').forEach(btn => {
      if (btn.dataset.view) {
        btn.classList.toggle('active', btn.dataset.view === view);
      }
    });
  };
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
document.addEventListener('DOMContentLoaded', init);
