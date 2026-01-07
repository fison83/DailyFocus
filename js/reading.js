// 阅读记录模块 - V5: 可折叠卡片设计
class ReadingManager {
  constructor(storage) {
    this.storage = storage;
    this.currentReadingId = null;
    this.currentRating = 0;
  }

  // 渲染阅读记录列表
  render() {
    const container = document.getElementById('readingList');

    if (this.storage.readingRecords.length === 0) {
      container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;"><div class="empty-icon">📚</div><p>还没有阅读记录，开始记录你的阅读之旅吧！</p></div>';
      return;
    }

    container.innerHTML = this.storage.readingRecords.map(record => {
      const stars = '★'.repeat(record.rating) + '☆'.repeat(5 - record.rating);
      const meta = [];
      if (record.daysSpent) meta.push(`${record.daysSpent}天`);
      if (record.hoursSpent) meta.push(`${record.hoursSpent}小时`);

      return `
        <div class="reading-card" onclick="readingManager.openReadingPanel('${record.id}')">
          <div class="reading-card-header">
            <div>
              <div class="reading-card-title">${this.escapeHtml(record.title)}</div>
              <div class="reading-card-author">${this.escapeHtml(record.author)}</div>
            </div>
            <div class="reading-card-rating">${stars}</div>
          </div>
          <div class="reading-card-summary">${this.escapeHtml(record.summary)}</div>
          <div class="reading-card-meta">
            ${meta.join(' | ')}
            ${record.finishedDate ? `• ${record.finishedDate}` : ''}
          </div>
          <div class="reading-card-actions">
            <button class="btn-reading-action" onclick="event.stopPropagation(); readingManager.openReadingPanel('${record.id}')">编辑</button>
            <button class="btn-reading-action delete" onclick="event.stopPropagation(); readingManager.deleteDirect('${record.id}')">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 创建阅读记录
  createReadingRecord() {
    this.currentReadingId = null;
    document.getElementById('readingPanelTitle').textContent = '新建阅读记录';
    this.clearForm();
    document.getElementById('btnDeleteReading').style.display = 'none';
    this.setupRatingStars();
  }

  // 清空表单
  clearForm() {
    document.getElementById('readingTitle').value = '';
    document.getElementById('readingAuthor').value = '';
    document.getElementById('readingDays').value = '';
    document.getElementById('readingHours').value = '';
    document.getElementById('readingRating').value = '0';
    document.getElementById('readingSummary').value = '';
    document.getElementById('keyPoint1').value = '';
    document.getElementById('keyPoint2').value = '';
    document.getElementById('keyPoint3').value = '';
    document.getElementById('readingThoughts').value = '';
    document.getElementById('readingAction').value = '';
    document.getElementById('readingTopic').value = '';
    document.getElementById('readingComparison').value = '';
    document.getElementById('readingNewIdea').value = '';
    document.getElementById('readingQuote').value = '';
    document.getElementById('readingProsCons').value = '';
    document.getElementById('readingQuestions').value = '';
    document.getElementById('readingNextBooks').value = '';
    document.getElementById('readingRecommend').value = '';
    this.updateRatingStars(0);
  }

  // 设置评分星星
  setupRatingStars() {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
      star.onclick = () => {
        const rating = parseInt(star.dataset.rating);
        document.getElementById('readingRating').value = rating;
        this.currentRating = rating;
        this.updateRatingStars(rating);
      };
    });
  }

  // 更新星星显示
  updateRatingStars(rating) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach(star => {
      const starRating = parseInt(star.dataset.rating);
      star.classList.toggle('active', starRating <= rating);
    });
  }

  // V5: 切换可折叠区域
  toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const icon = document.getElementById(sectionId + '-icon');
    section.classList.toggle('collapsed');
    icon.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
  }

  // 打开阅读记录编辑面板
  openReadingPanel(recordId) {
    this.currentReadingId = recordId;
    const record = this.storage.readingRecords.find(r => r.id === recordId);

    if (record) {
      document.getElementById('readingPanelTitle').textContent = '编辑阅读记录';
      document.getElementById('readingTitle').value = record.title || '';
      document.getElementById('readingAuthor').value = record.author || '';
      document.getElementById('readingDays').value = record.daysSpent || '';
      document.getElementById('readingHours').value = record.hoursSpent || '';
      document.getElementById('readingRating').value = record.rating || 0;
      this.currentRating = record.rating || 0;
      document.getElementById('readingSummary').value = record.summary || '';
      document.getElementById('keyPoint1').value = (record.keyPoints && record.keyPoints[0]) || '';
      document.getElementById('keyPoint2').value = (record.keyPoints && record.keyPoints[1]) || '';
      document.getElementById('keyPoint3').value = (record.keyPoints && record.keyPoints[2]) || '';
      document.getElementById('readingThoughts').value = record.thoughts || '';
      document.getElementById('readingAction').value = record.actionItem || '';

      // 深度扩展
      if (record.deepDive) {
        document.getElementById('readingTopic').value = record.deepDive.topic || '';
        document.getElementById('readingComparison').value = record.deepDive.comparison || '';
        document.getElementById('readingNewIdea').value = record.deepDive.newIdea || '';
        document.getElementById('readingQuote').value = record.deepDive.quote || '';
        document.getElementById('readingProsCons').value = record.deepDive.prosCons || '';
        document.getElementById('readingQuestions').value = record.deepDive.questions || '';
        document.getElementById('readingNextBooks').value = record.deepDive.nextBooks || '';
        document.getElementById('readingRecommend').value = record.deepDive.recommendTo || '';
      }

      this.updateRatingStars(record.rating || 0);
      document.getElementById('btnDeleteReading').style.display = 'block';
    }

    this.setupRatingStars();
  }

  // 保存阅读记录
  saveReadingRecord() {
    const title = document.getElementById('readingTitle').value.trim();
    if (!title) {
      alert('请输入书名');
      return false;
    }

    const summary = document.getElementById('readingSummary').value.trim();
    if (!summary) {
      alert('请用一句话唠明白这本书在说啥');
      return false;
    }

    const keyPoints = [
      document.getElementById('keyPoint1').value.trim(),
      document.getElementById('keyPoint2').value.trim(),
      document.getElementById('keyPoint3').value.trim()
    ].filter(p => p);

    if (keyPoints.length === 0) {
      alert('请至少填写一个最戳我的点');
      return false;
    }

    const recordData = {
      id: this.currentReadingId || Date.now().toString(),
      title,
      author: document.getElementById('readingAuthor').value.trim(),
      daysSpent: parseInt(document.getElementById('readingDays').value) || 0,
      hoursSpent: parseFloat(document.getElementById('readingHours').value) || 0,
      rating: parseInt(document.getElementById('readingRating').value) || 0,
      summary,
      keyPoints,
      thoughts: document.getElementById('readingThoughts').value.trim(),
      actionItem: document.getElementById('readingAction').value.trim(),
      finishedDate: new Date().toISOString().split('T')[0],
      deepDive: {
        topic: document.getElementById('readingTopic').value.trim(),
        comparison: document.getElementById('readingComparison').value.trim(),
        newIdea: document.getElementById('readingNewIdea').value.trim(),
        quote: document.getElementById('readingQuote').value.trim(),
        prosCons: document.getElementById('readingProsCons').value.trim(),
        questions: document.getElementById('readingQuestions').value.trim(),
        nextBooks: document.getElementById('readingNextBooks').value.trim(),
        recommendTo: document.getElementById('readingRecommend').value.trim()
      },
      createdAt: new Date().toISOString()
    };

    if (this.currentReadingId) {
      const index = this.storage.readingRecords.findIndex(r => r.id === this.currentReadingId);
      if (index !== -1) {
        this.storage.readingRecords[index] = { ...this.storage.readingRecords[index], ...recordData };
      }
    } else {
      this.storage.readingRecords.unshift(recordData);
    }

    this.storage.saveReading();
    return true;
  }

  // 删除阅读记录
  deleteReading() {
    if (this.currentReadingId) {
      this.storage.readingRecords = this.storage.readingRecords.filter(r => r.id !== this.currentReadingId);
      this.storage.saveReading();
      this.currentReadingId = null;
      return true;
    }
    return false;
  }

  // 直接删除阅读记录
  deleteDirect(recordId) {
    if (confirm('确定要删除这条阅读记录吗？')) {
      this.storage.readingRecords = this.storage.readingRecords.filter(r => r.id !== recordId);
      this.storage.saveReading();
      this.render();
    }
  }

  // 转义HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
