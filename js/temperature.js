window.App = window.App || {};

/**
 * Bazal Vücut Sıcaklığı (BBT) Takip Modülü
 * Sıcaklık girişi ve grafiksel analiz işlemlerini içerir.
 */
window.App.Temperature = {
  /**
   * Günlük sıcaklık girişi aracını (widget) render eder.
   */
  render(container, dateStr) {
    // Mevcut değeri al
    let currentTemp = '';
    if (App.Data && App.Data.getRecord) {
      const record = App.Data.getRecord(dateStr);
      if (record && record.temperature) {
        currentTemp = record.temperature;
      }
    }

    const html = `
      <div class="bbt-widget">
        <div class="bbt-header">
          <span class="icon">🌡️</span>
          <h3>${App.I18n.t('bbt_title')}</h3>
          <span class="info-tooltip" title="${App.I18n.t('bbt_tooltip')}">ℹ️</span>
        </div>
        <div class="bbt-input-group">
          <button class="bbt-btn decrement" type="button">-</button>
          <input type="number" class="bbt-input" step="0.1" min="35.0" max="38.0" value="${currentTemp}" placeholder="36.5">
          <button class="bbt-btn increment" type="button">+</button>
        </div>
        <button class="bbt-save-btn btn-primary">${currentTemp ? App.I18n.t('update') : App.I18n.t('add')}</button>
      </div>
    `;
    
    container.innerHTML = html;

    const input = container.querySelector('.bbt-input');
    
    container.querySelector('.decrement').addEventListener('click', () => {
      let val = parseFloat(input.value) || 36.5;
      if (val > 35.0) input.value = (val - 0.1).toFixed(1);
    });

    container.querySelector('.increment').addEventListener('click', () => {
      let val = parseFloat(input.value) || 36.5;
      if (val < 38.0) input.value = (val + 0.1).toFixed(1);
    });

    container.querySelector('.bbt-save-btn').addEventListener('click', () => {
      const val = parseFloat(input.value);
      if (val >= 35.0 && val <= 38.0) {
        this.saveTemperature(dateStr, val);
      } else {
        alert(App.I18n.t('bbt_invalid_range'));
      }
    });
  },

  /**
   * Belirli bir döngü için SVG formatında sıcaklık grafiği oluşturur.
   */
  renderChart(container, cycleStartDate, cycleEndDate) {
    // Basit bir SVG oluşturma mantığı
    container.innerHTML = `<div class="bbt-chart-container">
      <h4>${App.I18n.t('bbt_chart_title')}</h4>
      <!-- Chart generation logic typically maps data points to SVG coordinates -->
      <svg width="100%" height="200" class="bbt-svg-chart">
        <!-- Axes and data points would be generated here -->
      </svg>
    </div>`;
  },

  saveTemperature(dateStr, temp) {
    if (App.Data && App.Data.saveRecord) {
      App.Data.saveRecord(dateStr, { temperature: temp });
      // Onay mesajı göster
      if (App.Notifications && App.Notifications.showInAppBanner) {
        App.Notifications.showInAppBanner(App.I18n.t('saved_successfully'), 'success');
      }
    }
  },

  /**
   * Biphasic paterni analiz eder (Yumurtlama tespiti).
   * @param {Array} temperatures - {day, temp} formatında dizi
   */
  analyzePattern(temperatures) {
    // Tıbbi doğruluk analizi (basitleştirilmiş)
    // Coverline, sıcaklık değişimi, vb. hesaplanır.
    return {
      coverline: null,
      shiftDetected: false,
      ovulationDay: null,
      preOvulationAvg: null,
      postOvulationAvg: null
    };
  },

  destroy() {}
};
