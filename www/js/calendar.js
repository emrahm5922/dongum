window.App = window.App || {};

/**
 * Takvim Modülü (Advanced Interactive Calendar & Daily Health History Inspector)
 * İnteraktif regl, yumurtlama, doğurganlık ve geçmiş günlerin tüm sağlık kayıtlarını gösterir.
 */
window.App.Calendar = {
  currentMonth: new Date(),
  selectedDate: null,
  container: null,

  render(container) {
    this.container = container;
    this.refresh();
  },

  refresh() {
    if (!this.container) return;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const today = new Date();
    const todayStr = window.App.Utils ? window.App.Utils.toISODateString(today) : '';

    const monthName = window.App.Utils && typeof window.App.Utils.formatMonthYear === 'function'
      ? window.App.Utils.formatMonthYear(this.currentMonth)
      : `${year}-${String(month + 1).padStart(2, '0')}`;

    const t = (key, fallback) => (window.App.I18n ? window.App.I18n.t(key) : fallback);

    let html = `
      <div class="calendar-card">
        <div class="calendar-header">
          <button type="button" class="btn-cal-nav prev-month" aria-label="Önceki Ay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="month-title">${monthName}</h2>
          <button type="button" class="btn-cal-nav next-month" aria-label="Sonraki Ay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button type="button" class="btn-cal-today today-btn">${t('calendar.today', 'Bugün')}</button>
        </div>

        <div class="calendar-weekdays">
          <div class="weekday">${t('calendar.weekday.short.mon', 'Pzt')}</div>
          <div class="weekday">${t('calendar.weekday.short.tue', 'Sal')}</div>
          <div class="weekday">${t('calendar.weekday.short.wed', 'Çar')}</div>
          <div class="weekday">${t('calendar.weekday.short.thu', 'Per')}</div>
          <div class="weekday">${t('calendar.weekday.short.fri', 'Cum')}</div>
          <div class="weekday">${t('calendar.weekday.short.sat', 'Cmt')}</div>
          <div class="weekday">${t('calendar.weekday.short.sun', 'Paz')}</div>
        </div>

        <div class="calendar-grid">
    `;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Önceki ayın günleri
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      html += `<div class="cal-day other-month"><span>${prevMonthDays - i}</span></div>`;
    }

    // Bu ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = dateStr === todayStr;
      const isSelected = (this.selectedDate === dateStr) || (!this.selectedDate && isToday);

      let classes = ['cal-day'];
      if (isToday) classes.push('today');
      if (isSelected) classes.push('selected');

      // Döngü sınıflandırması
      let classification = null;
      if (window.App.Cycle && typeof window.App.Cycle.classifyDate === 'function') {
        classification = window.App.Cycle.classifyDate(dateStr);
      }

      let dotHtml = '';
      if (classification) {
        if (classification.isPeriod) {
          classes.push('period');
          dotHtml += `<span class="cal-dot dot-period" title="Regl"></span>`;
        } else if (classification.isPredictedPeriod) {
          classes.push('predicted-period');
          dotHtml += `<span class="cal-dot dot-predicted" title="Tahmini"></span>`;
        } else if (classification.isOvulation) {
          classes.push('ovulation');
          dotHtml += `<span class="cal-dot dot-ovulation" title="Yumurtlama"></span>`;
        } else if (classification.isFertile) {
          classes.push('fertile');
          dotHtml += `<span class="cal-dot dot-fertile" title="Doğurgan"></span>`;
        }
      }

      // Semptom & Sağlık rozetleri
      if (window.App.Data && typeof window.App.Data.getSymptoms === 'function') {
        const sym = window.App.Data.getSymptoms(dateStr);
        if (sym) {
          if (sym.painLevel && sym.painLevel !== 'none') {
            dotHtml += `<span class="cal-mini-icon" title="Ağrı">⚡</span>`;
          }
          if (sym.intimacy) {
            dotHtml += `<span class="cal-mini-icon" title="Birliktelik">❤️</span>`;
          }
          if (sym.mood) {
            dotHtml += `<span class="cal-dot dot-symptom" title="Kayıt Var"></span>`;
          }
        }
      }

      html += `
        <div class="${classes.join(' ')}" data-date="${dateStr}">
          <span class="day-num">${i}</span>
          <div class="day-dots">${dotHtml}</div>
        </div>
      `;
    }

    // Sonraki ayın günleri (42 hücreye tamamla)
    const totalCells = startOffset + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      html += `<div class="cal-day other-month"><span>${i}</span></div>`;
    }

    html += `
        </div>

        <div class="calendar-legend">
          <div class="legend-item"><span class="legend-dot dot-period"></span><span>${t('calendar.periodDays', 'Regl')}</span></div>
          <div class="legend-item"><span class="legend-dot dot-predicted"></span><span>${t('calendar.predictedPeriod', 'Tahmini')}</span></div>
          <div class="legend-item"><span class="legend-dot dot-ovulation"></span><span>${t('calendar.ovulation', 'Yumurtlama')}</span></div>
          <div class="legend-item"><span class="legend-dot dot-fertile"></span><span>${t('calendar.fertileWindow', 'Doğurgan')}</span></div>
        </div>

        <!-- Seçilen Günün Detaylı Sağlık & Geçmiş Özeti -->
        <div id="day-detail-panel" class="cal-detail-card" style="display: block; margin-top: 14px;"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();

    const targetDate = this.selectedDate || todayStr;
    this.renderDayDetail(targetDate);
  },

  /**
   * Seçilen Günün Tüm Sağlık, Sancı, İlaç ve Ruh Hali Geçmişini Gösterir
   */
  renderDayDetail(dateStr) {
    const panel = this.container ? this.container.querySelector('#day-detail-panel') : null;
    if (!panel) return;

    const t = (key, fallback) => (window.App.I18n ? window.App.I18n.t(key) : fallback);
    const dateObj = window.App.Utils ? window.App.Utils.parseDate(dateStr) : new Date(dateStr);
    const formattedDate = window.App.Utils ? window.App.Utils.formatDateLong(dateObj) : dateStr;

    const classification = window.App.Cycle ? window.App.Cycle.classifyDate(dateStr) : {};
    const isPeriod = classification.isPeriod;

    let phaseName = t('phases.follicular', 'Foliküler Faz');
    let phaseBadgeColor = 'var(--accent-phase)';
    if (classification.isPeriod) {
      phaseName = '🩸 Regl Dönemi';
      phaseBadgeColor = 'var(--accent-period)';
    } else if (classification.isOvulation) {
      phaseName = '🌟 Yumurtlama Günü (Ovulasyon)';
      phaseBadgeColor = 'var(--accent-ovulation)';
    } else if (classification.isFertile) {
      phaseName = '✨ Yüksek Doğurganlık Penceresi';
      phaseBadgeColor = 'var(--accent-fertile)';
    } else if (classification.isPredictedPeriod) {
      phaseName = '📅 Tahmini Regl';
      phaseBadgeColor = 'var(--accent-period)';
    }

    // O güne ait semptom & sağlık kayıtları
    const symptoms = (window.App.Data && typeof window.App.Data.getSymptoms === 'function')
      ? window.App.Data.getSymptoms(dateStr)
      : null;

    const moodNames = {
      great: '😄 Harika',
      good: '😊 İyi',
      okay: '😐 İdare Eder',
      bad: '😔 Mutsuz / Yorgun',
      terrible: '😢 Aşırı Duygusal'
    };

    const painNames = {
      none: 'Ağrı Yok 😊',
      mild: 'Hafif Ağrı 🌱',
      moderate: 'Orta Şiddetli Sancı ⚡',
      severe: 'Şiddetli Sancı 🔥'
    };

    const flowNames = {
      none: 'Yok',
      spotting: 'Lekelenme 💧',
      light: 'Hafif Kanama 🩸',
      medium: 'Orta Kanama 🩸🩸',
      heavy: 'Yoğun Kanama 🩸🩸🩸'
    };

    let logChips = [];
    if (symptoms) {
      if (symptoms.mood && moodNames[symptoms.mood]) {
        logChips.push(`<span class="cal-log-chip mood">🌸 ${moodNames[symptoms.mood]}</span>`);
      }
      if (symptoms.painLevel && symptoms.painLevel !== 'none') {
        logChips.push(`<span class="cal-log-chip pain">⚡ ${painNames[symptoms.painLevel] || symptoms.painLevel}</span>`);
      }
      if (symptoms.flow && symptoms.flow !== 'none') {
        logChips.push(`<span class="cal-log-chip flow">${flowNames[symptoms.flow] || symptoms.flow}</span>`);
      }
      if (symptoms.water) {
        logChips.push(`<span class="cal-log-chip water">💧 ${symptoms.water} Bardak (${(symptoms.water * 0.25).toFixed(1)}L)</span>`);
      }
      if (symptoms.intimacy) {
        logChips.push(`<span class="cal-log-chip intimacy">❤️ Birliktelik / Deneme</span>`);
      }
      if (symptoms.temperature) {
        logChips.push(`<span class="cal-log-chip temp">🌡️ Ateş: ${symptoms.temperature}°C</span>`);
      }
      if (symptoms.birthControlTaken) {
        logChips.push(`<span class="cal-log-chip meds">💊 Doğum Kontrol Hapı Alındı</span>`);
      }
    }

    panel.style.display = 'block';
    panel.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 14px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;">${formattedDate}</h3>
            <span style="display: inline-block; font-size: 0.78rem; font-weight: 600; padding: 2px 10px; border-radius: var(--radius-full); background: rgba(212, 85, 107, 0.1); color: ${phaseBadgeColor};">
              ${phaseName}
            </span>
          </div>
          <button type="button" class="btn btn-sm btn-secondary btn-goto-day-log" data-date="${dateStr}" style="font-size: 0.8rem; padding: 6px 12px;">
            ✏️ Günlüğü Düzenle
          </button>
        </div>

        <!-- O Günün Sağlık & Semptom Özeti -->
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border);">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
            📝 Bu Günün Kayıtları & Durumu:
          </div>
          
          ${logChips.length > 0 ? `
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
              ${logChips.join('')}
            </div>
          ` : `
            <p style="font-size: 0.82rem; color: var(--text-secondary); font-style: italic; margin: 4px 0 8px;">
              Bu gün için henüz semptom, ağrı veya su kaydı girilmemiş.
            </p>
          `}

          ${symptoms && symptoms.notes ? `
            <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); font-size: 0.82rem; color: var(--text-primary); margin-top: 6px;">
              <strong>Not:</strong> "${symptoms.notes}"
            </div>
          ` : ''}
        </div>

        <!-- Hızlı Regl Başlat / Bitir Eylemi -->
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          <button type="button" class="btn ${isPeriod ? 'btn-danger' : 'btn-primary'} btn-block toggle-period-action" style="flex: 1; padding: 10px; font-size: 0.88rem; font-weight: 600;">
            ${isPeriod ? '🩸 Bu Günü Regl Dışı Yap' : '🩸 Bu Günü Regl Olarak İşaretle'}
          </button>
        </div>
      </div>
    `;

    // Buton Dinleyicileri
    panel.querySelector('.btn-goto-day-log')?.addEventListener('click', () => {
      if (window.App.Main && window.App.Main.navigateTo) {
        window.App.Main.navigateTo('symptoms');
        if (window.App.Symptoms && window.App.Symptoms.selectDate) {
          window.App.Symptoms.selectDate(dateStr);
        }
      }
    });

    panel.querySelector('.toggle-period-action')?.addEventListener('click', () => {
      this.togglePeriodDay(dateStr);
    });
  },

  navigateMonth(delta) {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
    this.refresh();
  },

  goToToday() {
    this.currentMonth = new Date();
    const todayStr = window.App.Utils.toISODateString(this.currentMonth);
    this.selectedDate = todayStr;
    this.refresh();
    this.renderDayDetail(todayStr);
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.container?.querySelectorAll('.cal-day').forEach(el => {
      el.classList.toggle('selected', el.getAttribute('data-date') === dateStr);
    });
    this.renderDayDetail(dateStr);
  },

  togglePeriodDay(dateStr) {
    if (window.App.Data && typeof window.App.Data.togglePeriodDay === 'function') {
      window.App.Data.togglePeriodDay(dateStr);
      if (window.App.Utils && window.App.Utils.showToast) {
        window.App.Utils.showToast('Regl takvimi güncellendi 🌸', 'success');
      }
      this.refresh();
      this.renderDayDetail(dateStr);
      if (window.App.Main && window.App.Main.renderDashboard) {
        window.App.Main.renderDashboard();
      }
    }
  },

  attachEventListeners() {
    if (!this.container) return;

    this.container.querySelector('.prev-month')?.addEventListener('click', () => this.navigateMonth(-1));
    this.container.querySelector('.next-month')?.addEventListener('click', () => this.navigateMonth(1));
    this.container.querySelector('.today-btn')?.addEventListener('click', () => this.goToToday());

    this.container.querySelectorAll('.cal-day[data-date]').forEach(day => {
      day.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.getAttribute('data-date');
        if (dateStr) this.selectDate(dateStr);
      });
    });
  },

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
  }
};
