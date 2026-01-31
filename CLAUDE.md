# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DailyFocus V5 is a task management application based on the Eisenhower Matrix. Pure client-side web application with vanilla JavaScript, CSS, HTML. No build system, no dependencies.

## Module Structure

- **config.js** - Configuration, storage keys, version info
- **storage.js** - localStorage persistence, GitHub Gist cloud sync
- **tasks.js** - TaskManager: task CRUD, inbox/quadrant rendering
- **goals.js** - GoalManager: goal CRUD, progress tracking
- **reading.js** - ReadingManager: reading records CRUD
- **stats.js** - StatsManager: statistics, task detail modals
- **calendar.js** - CalendarManager: calendar view, date filtering
- **all-tasks.js** - AllTasksManager: unified task list with filters, batch operations
- **ui.js** - UIManager: view switching, panel management, event handling
- **app.js** - Entry point: initializes all managers

## Key Patterns

1. **Global Instances**: All managers are global variables in app.js (for inline onclick handlers)
2. **Soft Delete**: Tasks use `deleted` flag instead of actual deletion
3. **Auto-Sync**: Storage save methods trigger auto-upload with debounce

## Data Models

**Task**:
```javascript
{
  id: Date.now().toString(),
  title: string,
  priority: boolean,    // 重要
  urgency: boolean,     // 紧急
  tag: string,
  completed: boolean,
  deleted: boolean,
  // ...
}
```

## Version Management

**Format**: `主版本.次版本.修订号` (e.g., 5.3.0)

| Type | When to Update | Example |
|-----|---------------|---------|
| 主版本 | Major features, architecture changes | 5.0 → 6.0 |
| 次版本 | New features, important bug fixes | 5.0 → 5.1 |
| 修订号 | Small fixes, documentation, tweaks | 5.1.0 → 5.1.1 |

**Update Process**:
1. Update `js/config.js` VERSION
2. Update `index.html` cache busting (?v=5.3.0)
3. Add entry to CHANGELOG in config.js

## Development Workflow

```
需求确认 → 代码修改 → 测试验证 → 收尾提交
```

### 阶段 1：需求确认

**用户描述要具体**：
- ✅ "点击删除按钮后，任务没有从列表中消失"
- ❌ "有bug" / "不好看" / "优化一下"

**AI 应该**：
1. 复述需求确认理解
2. 说明计划怎么修改
3. 判断是否需要更新版本号
4. 不确定时用 AskUserQuestion 询问

### 阶段 2：代码修改

**原则**：
- 遵循现有代码风格
- 最小化修改，不顺便"优化"其他代码
- 不添加用户没要的功能

### 阶段 3：测试验证

**用户测试**：
1. 功能是否正常
2. 是否有新 bug
3. 是否影响其他功能

**反馈**：
- ✅ "好了，现在可以删除了"
- ❌ "还是不行"

### 阶段 4：收尾

**检查清单**：
```
□ 清理 console.log 调试代码
□ 更新版本号
□ 更新 CHANGELOG
□ Git 提交
```

## Important Notes

### Inline onclick Handlers
Many event handlers use inline HTML onclick. When adding new methods, ensure they're accessible as global variables.

### CSS Cache Busting
When deploying CSS/JS changes, update version parameter: `?v=5.3.0`

### Batch Delete Logic
In `all-tasks.js`:
- **Recycle bin view**: Performs permanent delete
- **Other views**: Performs soft delete (move to recycle bin)

### Mobile Navigation
Mobile top navigation is bound in `bindMobileNavEvents()` with screen width check to prevent affecting desktop.

## Common Operations

### Adding a Feature
1. Create/update manager class in appropriate js/ file
2. Declare global variable in app.js
3. Initialize in init()
4. Add UI to index.html
5. Add CSS to css/style.css
6. Update version in config.js

### Testing
Simply open `index.html` in a browser. No build step.

### Debugging
Open DevTools (F12). All managers are accessible globally for debugging.

## Quick Reference

| 文件 | 用途 |
|-----|------|
| `index.html` | 主页面，所有 UI |
| `js/tasks.js` | 任务核心逻辑 |
| `js/ui.js` | 视图切换，事件处理 |
| `js/storage.js` | 数据存储，云同步 |
| `css/style.css` | 所有样式（2878 行，考虑拆分） |

## Known Issues

See GitHub Issues for tracked bugs and feature requests.
