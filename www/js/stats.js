window.App = window.App || {};

/**
 * İstatistik Modülü (Stats Module)
 * Döngü uzunlukları, düzenlilik skoru, semptom ve sıcaklık eğrilerini görselleştirir.
 */
window.App.Stats = {
  container: null,
  currentTab: 'overview', // 'overview', 'temperature', 'symptoms'

  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    if (!this.container) return;

    const t = (key, fallback) => (window.App.I18n ? window.App.I18n.t(key) : fallback);

    let html = `
      <div class="stats-screen fade-in">
        <div class="stats-tabs">
          <button type="button" class="tab-btn ${this.currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
            ${t('stats.overview', 'Döngü Özeti')}
          </button>
          <button type="button" class="tab-btn ${this.currentTab === 'temperature' ? 'active' : ''}" data-tab="temperature">
            ${t('temp.basalBodyTemperature', 'Bazal Sıcaklık')}
          </button>
          <button type="button" class="tab-btn ${this.currentTab === 'symptoms' ? 'active' : ''}" data-tab="symptoms">
            ${t('stats.symptomTrends', 'Belirtiler')}
          </button>
        </div>

        <div class="stats-tab-content">
          ${this.renderCurrentTab()}
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
    this.renderCharts();
  },

  renderCurrentTab() {
    const t = (key, fallback) => (window.App.I18n ? window.App.I18n.t(key) : fallback);

    if (this.currentTab === 'overview') {
      const stats = this.compileCycleStats();
      return `
        <div class="stats-grid-cards">
          <div class="stat-box">
            <span class="stat-box-label">${t('stats.averageCycle', 'Ort. Döngü')}</span>
            <span class="stat-box-num mono">${stats.avgCycle} <small>${t('general.days', 'gün')}</small></span>
          </div>
          <div class="stat-box">
            <span class="stat-box-label">${t('stats.averagePeriodLength', 'Ort. Regl')}</span>
            <span class="stat-box-num mono">${stats.avgPeriod} <small>${t('general.days', 'gün')}</small></span>
          </div>
          <div class="stat-box">
            <span class="stat-box-label">${t('stats.totalCyclesTracked', 'Toplam Döngü')}</span>
            <span class="stat-box-num mono">${stats.totalCycles}</span>
          </div>
          <div class="stat-box">
            <span class="stat-box-label">${t('stats.cycleRegularity', 'Düzenlilik')}</span>
            <span class="stat-box-num mono">${stats.regularity}%</span>
          </div>
        </div>

        <div class="stat-card-section">
          <h3 class="stat-section-title">${t('stats.last6Cycles', 'Döngü Uzunluğu Geçmişi')}</h3>
          <div id="cycle-length-chart" class="chart-box"></div>
        </div>

        <div class="stat-card-section">
          <h3 class="stat-section-title">${t('stats.predictedNextPeriod', 'Gelecek Döngü Tahminleri')}</h3>
          <div class="prediction-list-box">
            ${this.renderPredictions()}
          </div>
        </div>
      `;
    } else if (this.currentTab === 'temperature') {
      return `
        <div class="stat-card-section">
          <h3 class="stat-section-title">${t('temp.chart', 'Bazal Vücut Sıcaklığı (BBT)')}</h3>
          <p class="stat-subtitle">${t('temp.trackingInfo', 'Yumurtlama sonrasında vücut sıcaklığında 0.2-0.5°C yükselme beklenir.')}</p>
          <div id="temp-line-chart" class="chart-box" style="height: 220px;"></div>
        </div>
      `;
    } else if (this.currentTab === 'symptoms') {
      return `
        <div class="stat-card-section">
          <h3 class="stat-section-title">${t('stats.symptomTrends', 'Ruh Hali ve Belirti Dağılımı')}</h3>
          <div id="mood-donut-chart" class="chart-box"></div>
        </div>
      `;
    }
    return '';
  },

  renderPredictions() {
    const t = (key, fallback) => (window.App.I18n ? window.App.I18n.t(key) : fallback);
    const cycleInfo = window.App.Cycle ? window.App.Cycle.getCycleInfo() : null;

    if (!cycleInfo || !cycleInfo.nextPeriod) {
      return `<p class="empty-state-text">${t('stats.noDataYet', 'Henüz yeterli döngü verisi girilmedi.')}</p>`;
    }

    const next1 = window.App.Utils ? window.App.Utils.parseDate(cycleInfo.nextPeriod) : new Date();
    const cycleLen = cycleInfo.totalDays || 28;
    const next2 = window.App.Utils ? window.App.Utils.addDays(next1, cycleLen) : new Date();
    const next3 = window.App.Utils ? window.App.Utils.addDays(next2, cycleLen) : new Date();

    const fmt = (d) => (window.App.Utils ? window.App.Utils.formatDateLong(d) : d.toDateString());

    return `
      <div class="prediction-item">
        <span class="pred-dot"></span>
        <span class="pred-date">${fmt(next1)}</span>
        <span class="pred-badge high">Yüksek Güvenilirlik</span>
      </div>
      <div class="prediction-item">
        <span class="pred-dot"></span>
        <span class="pred-date">${fmt(next2)}</span>
        <span class="pred-badge medium">Orta Güvenilirlik</span>
      </div>
      <div class="prediction-item">
        <span class="pred-dot"></span>
        <span class="pred-date">${fmt(next3)}</span>
        <span class="pred-badge medium">Orta Güvenilirlik</span>
      </div>
    `;
  },

  compileCycleStats() {
    const periods = window.App.Data && typeof window.App.Data.getAllPeriods === 'function'
      ? window.App.Data.getAllPeriods()
      : [];

    const settings = (window.App.Data && typeof window.App.Data.get === 'function')
      ? (window.App.Data.get('settings') || {})
      : {};

    const avgCycle = window.App.Cycle && typeof window.App.Cycle.getEffectiveCycleLength === 'function'
      ? window.App.Cycle.getEffectiveCycleLength(periods, settings.avgCycleLength || 28)
      : (settings.avgCycleLength || 28);

    const avgPeriod = window.App.Cycle && typeof window.App.Cycle.calculateAveragePeriodLength === 'function'
      ? window.App.Cycle.calculateAveragePeriodLength(periods)
      : (settings.avgPeriodLength || 5);

    const regularityInfo = window.App.Cycle && typeof window.App.Cycle.getCycleRegularity === 'function'
      ? window.App.Cycle.getCycleRegularity(periods)
      : { score: 95 };

    return {
      avgCycle: avgCycle,
      avgPeriod: avgPeriod,
      totalCycles: Math.max(periods.length, 1),
      regularity: regularityInfo.score || 95
    };
  },

  renderCharts() {
    if (!this.container) return;

    if (this.currentTab === 'overview') {
      const chartEl = this.container.querySelector('#cycle-length-chart');
      if (chartEl) {
        const periods = window.App.Data ? window.App.Data.getAllPeriods() : [];
        let data = [];

        if (periods.length >= 2) {
          for (let i = 0; i < Math.min(periods.length - 1, 6); i++) {
            const cur = window.App.Utils.parseDate(periods[i].startDate);
            const prev = window.App.Utils.parseDate(periods[i + 1].startDate);
            const days = window.App.Utils.diffDays(prev, cur);
            const label = window.App.Utils.formatDate(cur, 'short');
            data.unshift({ label, value: days, color: 'var(--accent-period)' });
          }
        }

        if (data.length === 0) {
          data = [
            { label: 'Döngü 1', value: 28, color: 'var(--accent-period)' },
            { label: 'Döngü 2', value: 29, color: 'var(--accent-period)' },
            { label: 'Döngü 3', value: 28, color: 'var(--accent-period)' }
          ];
        }

        this.renderBarChart(chartEl, data, { maxValue: 35, height: 140 });
      }
    } else if (this.currentTab === 'temperature') {
      const chartEl = this.container.querySelector('#temp-line-chart');
      if (chartEl) {
        const data = [
          { day: 1, temp: 36.2 }, { day: 4, temp: 36.1 }, { day: 8, temp: 36.3 },
          { day: 12, temp: 36.2 }, { day: 14, temp: 36.6 }, { day: 18, temp: 36.7 },
          { day: 22, temp: 36.8 }, { day: 26, temp: 36.5 }
        ];
        this.renderLineChart(chartEl, data);
      }
    } else if (this.currentTab === 'symptoms') {
      const chartEl = this.container.querySelector('#mood-donut-chart');
      if (chartEl) {
        const data = [
          { label: 'Harika / İyi', value: 50, color: 'var(--accent-fertile)' },
          { label: 'Normal', value: 30, color: 'var(--accent-ovulation)' },
          { label: 'Hassas / Ağrılı', value: 20, color: 'var(--accent-period)' }
        ];
        this.renderDonutChart(chartEl, data);
      }
    }
  },

  renderBarChart(container, data, options) {
    let html = `<div class="chart-bars-wrap" style="height:${options.height}px;">`;
    data.forEach(item => {
      const pct = Math.min((item.value / options.maxValue) * 100, 100);
      html += `
        <div class="chart-bar-col">
          <span class="bar-num mono">${item.value}</span>
          <div class="bar-track">
            <div class="bar-fill" style="height: ${pct}%; background-color: ${item.color};"></div>
          </div>
          <span class="bar-tag">${item.label}</span>
        </div>
      `;
    });
    html += `</div>`;
    container.innerHTML = html;
  },

  renderLineChart(container, data) {
    const w = container.clientWidth || 320;
    const h = 200;
    const padX = 25;
    const padY = 20;

    const minT = 35.8;
    const maxT = 37.2;

    const getX = (d) => padX + ((d - 1) / 27) * (w - padX * 2);
    const getY = (t) => h - padY - ((t - minT) / (maxT - minT)) * (h - padY * 2);

    let pathD = '';
    data.forEach((pt, i) => {
      pathD += (i === 0 ? 'M ' : 'L ') + `${getX(pt.day).toFixed(1)} ${getY(pt.temp).toFixed(1)} `;
    });

    const coverY = getY(36.4);

    let svg = `
      <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" class="chart-svg">
        <line x1="${padX}" y1="${coverY}" x2="${w - padX}" y2="${coverY}" stroke="var(--accent-ovulation)" stroke-width="1.5" stroke-dasharray="4,4" opacity="0.6"/>
        <path d="${pathD}" fill="none" stroke="var(--accent-period)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ${data.map(pt => `
          <circle cx="${getX(pt.day)}" cy="${getY(pt.temp)}" r="4" fill="var(--surface)" stroke="var(--accent-period)" stroke-width="2"/>
        `).join('')}
      </svg>
    `;
    container.innerHTML = svg;
  },

  renderDonutChart(container, data) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = 0;
    let gradientParts = [];

    data.forEach(item => {
      const pct = (item.value / total) * 100;
      const nextAngle = currentAngle + pct;
      gradientParts.push(`${item.color} ${currentAngle.toFixed(1)}% ${nextAngle.toFixed(1)}%`);
      currentAngle = nextAngle;
    });

    let html = `
      <div class="donut-box">
        <div class="donut-circle" style="background: conic-gradient(${gradientParts.join(', ')});">
          <div class="donut-inner">
            <span class="donut-total mono">${total}%</span>
          </div>
        </div>
        <div class="donut-legend">
          ${data.map(item => `
            <div class="donut-legend-row">
              <span class="legend-color-box" style="background:${item.color};"></span>
              <span class="legend-text">${item.label}</span>
              <span class="legend-val mono">${item.value}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    container.innerHTML = html;
  },

  attachEventListeners() {
    if (!this.container) return;

    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab && tab !== this.currentTab) {
          this.currentTab = tab;
          this.refresh();
        }
      });
    });
  },

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
  }
};
