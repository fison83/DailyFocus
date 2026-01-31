# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DailyFocus V5 is a task management application based on the Eisenhower Matrix (四象限). It's a pure client-side web application using vanilla JavaScript, CSS, and HTML with no build system or dependencies.

## Architecture

### Module Structure

The application follows a modular architecture with each JavaScript file handling a specific domain:

- **config.js** - Configuration constants, storage keys, cloud sync settings, version info
- **storage.js** - Data persistence (localStorage), cloud sync (GitHub Gist), auto-sync logic
- **tasks.js** - TaskManager class: task CRUD, inbox/quadrant rendering, priority/urgency management
- **goals.js** - GoalManager class: goal CRUD, progress tracking, banner display
- **reading.js** - ReadingManager class: reading records CRUD, collapsible form sections
- **stats.js** - StatsManager class: statistics calculation, task detail modals
- **calendar.js** - CalendarManager class: calendar view and date-based task filtering
- **all-tasks.js** - AllTasksManager class: unified task list with filters, batch operations, recycle bin
- **ui.js** - UIManager class: view switching, panel management, event handling
- **app.js** - Entry point: initializes all managers, binds mobile nav events

### Key Design Patterns

1. **Manager Pattern**: Each domain (tasks, goals, reading, etc.) has its own Manager class that handles business logic and rendering

2. **Global Instances**: All managers are declared as global variables in app.js:
   ```javascript
   let taskManager, goalManager, readingManager, statsManager, allTasksManager, calendarManager, ui;
   ```
   This allows inline HTML onclick handlers to access them directly (e.g., `onclick="taskManager.render()"`)

3. **Storage Abstraction**: All data operations go through the Storage instance, which handles both localStorage persistence and automatic cloud sync

4. **Soft Delete Pattern**: Tasks use `deleted` flag instead of actual deletion (recycle bin functionality):
   - `softDeleteTask()` - marks task as deleted
   - `restoreTask()` - restores deleted task
   - `permanentDeleteTask()` - actually removes from array

5. **Auto-Sync with Debounce**: Storage save methods trigger auto-upload after a configurable delay (default 5000ms), with `isDownloading` flag to prevent circular sync

## Data Models

### Task
```javascript
{
  id: string,           // Date.now().toString()
  title: string,
  description: string,
  priority: boolean,    // 重要
  urgency: boolean,     // 紧急
  dueDate: string,      // ISO date format
  tag: string,
  completed: boolean,
  completedAt: string | null,
  createdAt: string,    // ISO timestamp
  organized: boolean,   // false = inbox, true = organized to quadrant
  deleted: boolean,
  deletedAt: string | null
}
```

### Goal
```javascript
{
  id: string,
  title: string,
  targetCount: number,
  currentCount: number,
  progress: number,     // 0-100
  dueDate: string,
  completed: boolean,
  createdAt: string
}
```

## Cloud Sync (GitHub Gist)

- Uses GitHub Gist API for cloud storage
- Token stored in localStorage as `dailyfocus-api-key`
- Gist ID stored in localStorage as `dailyfocus-cloud-bin-id`
- Auto-sync can be enabled/disabled via settings
- First upload creates a new Gist, subsequent uploads update it

## Responsive Design

Mobile optimization uses three breakpoints:
- **≤1024px**: Hide sidebar, show mobile top navigation bar
- **≤768px**: Single column layout for quadrants, grids, forms
- **≤480px**: Larger touch targets (44px min height), adjusted spacing, stacked layouts

## Important Development Notes

### Inline onclick Handlers
Many event handlers use inline HTML onclick attributes. When adding new managers or methods, ensure they're accessible as global variables for these handlers to work.

### CSS Cache Busting
When deploying CSS/JS changes, update the version parameter:
```html
<link rel="stylesheet" href="css/style.css?v=5.1">
<script src="js/app.js?v=5.1"></script>
```

### Storage Auto-Sync
The `autoUpload()` method in storage.js is automatically called after data changes. Be aware that:
1. It only runs if auto-sync is enabled
2. It's debounced (configurable delay)
3. It won't run during download operations (`isDownloading` flag)

### Mobile Navigation
Mobile top navigation is bound in `bindMobileNavEvents()` with a screen width check to prevent affecting desktop navigation. The `switchView` method is wrapped to sync nav button active states.

### Batch Delete Logic
In `all-tasks.js`, the `batchDelete()` method behaves differently based on current view:
- **Recycle bin view** (`currentFilter === 'deleted'`): Performs permanent delete
- **Other views**: Performs soft delete (move to recycle bin)

## Common Operations

### Adding a New Feature
1. Create/update manager class in appropriate js/ file
2. Declare global variable in app.js
3. Initialize in init() function
4. Add UI elements to index.html
5. Add CSS styles to css/style.css
6. Update version in config.js

### Testing Changes
Simply open `index.html` in a browser. No build step required.

### Debugging
Open browser DevTools (F12) and use the console. All managers are accessible globally for debugging.
