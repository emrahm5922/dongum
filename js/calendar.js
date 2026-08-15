window.App = window.App || {};

/**
 * Takvim Modülü (Advanced Interactive Calendar & Period Checkmark Tracker)
 * 1. Tek Dokunuşla Hızlı Tikleme Modu (Quick Tap Mode: Güne basınca anında Regl ✓ koyar)
 * 2. Hızlı "Bugün Adetim Başladı / Bitti" Eylem Çubuğu
 * 3. Aylar Arası Adet Süresi Kıyaslama Motoru (Örn: Bu Ay 7 Gün vs Geçen Ay 9 Gün)
 * 4. Detaylı Semptom, Ağrı, Ateş ve Birliktelik Geçmişi
 */
window.App.Calendar = {
  currentMonth: new Date(),
  selectedDate: null,
  container: null,
  quickMode: true, // Varsayılan olarak doğrudan tikleme modu açık

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

    // Bugünün regl durumu
    const todayClassification = window.App.Cycle ? window.App.Cycle.classifyDate(todayStr) : {};
    const isTodayPeriod = todayClassification.isPeriod;

    let html = `
      <div class="calendar-card">

        <!-- 1. HIZLI ADET BAŞLAT / BİTİR EYLEM ÇUBUĞU -->
        <div style="background: linear-gradient(135deg, rgba(212, 85, 107, 0.12), rgba(232, 114, 133, 0.05)); border: 1.5px solid var(--accent-period); border-radius: var(--radius-lg); padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm);">
          <div>
            <div style="font-weight: 700; font-size: 0.88rem; color: var(--accent-period); display: flex; align-items: center; gap: 6px;">
              <span>🩸</span>
              <span>${isTodayPeriod ? 'Adet Dönemindesiniz ✓' : 'Bugün Adetiniz Başladı mı?'}</span>
            </div>
            <div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;">
              ${isTodayPeriod ? 'Kanama devam ettikçe günleri tikleyin veya bittiyse kapatın.' : 'Başladıysa butona basarak bugünü hemen işaretleyin.'}
            </div>
          </div>
          <button type="button" class="btn btn-sm ${isTodayPeriod ? 'btn-secondary' : 'btn-primary'}" id="btn-quick-today-toggle" style="padding: 8px 14px; font-weight: 700; font-size: 0.82rem; border-radius: var(--radius-full); white-space: nowrap; ${isTodayPeriod ? 'border-color: var(--accent-period); color: var(--accent-period);' : ''}">
            ${isTodayPeriod ? '✓ Adetim Bitti' : '🩸 Adetim Başladı'}
          </button>
        </div>

        <!-- 2. TEK DOKUNUŞLA TİKLEME MODU AÇ/KAPA DÜĞMESİ -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: 0.78rem;">
          <span style="font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
            👆 <strong>Tek Dokunuşla Tikleme:</strong>
            <span style="color: var(--text-secondary); font-weight: normal;">(Güne dokununca anında Regl ✓ koyar)</span>
          </span>
          <button type="button" class="btn btn-sm ${this.quickMode ? 'btn-primary' : 'btn-secondary'}" id="btn-toggle-quick-mode" style="padding: 4px 10px; font-size: 0.75rem; font-weight: 700; border-radius: var(--radius-full);">
            ${this.quickMode ? 'AÇIK (Tik Modu) ✓' : 'KAPALI'}
          </button>
        </div>

        <!-- Takvim Üst Başlığı & Ay Değişimi -->
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

        <!-- Haftanın Günleri -->
        <div class="calendar-weekdays">
          <div class="weekday">${t('calendar.weekday.short.mon', 'Pzt')}</div>
          <div class="weekday">${t('calendar.weekday.short.tue', 'Sal')}</div>
          <div class="weekday">${t('calendar.weekday.short.wed', 'Çar')}</div>
          <div class="weekday">${t('calendar.weekday.short.thu', 'Per')}</div>
          <div class="weekday">${t('calendar.weekday.short.fri', 'Cum')}</div>
          <div class="weekday">${t('calendar.weekday.short.sat', 'Cmt')}</div>
          <div class="weekday">${t('calendar.weekday.short.sun', 'Paz')}</div>
        </div>

        <!-- Takvim Gün Izgarası -->
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
          dotHtml += `<span class="cal-dot dot-period" title="Regl ✓"></span>`;
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
          if (sym.temperature) {
            dotHtml += `<span class="cal-mini-icon" title="Ateş">🌡️</span>`;
          }
        }
      }

      html += `
        <div class="${classes.join(' ')}" data-date="${dateStr}" title="Regl İşaretlemek İçin Dokunun">
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
          <div class="legend-item"><span class="legend-dot dot-period"></span><span>${t('calendar.periodDays', 'Adet Oldum (✓)')}</span></div>
          <div class="legend-item"><span class="legend-dot dot-predicted"></span><span>${t('calendar.predictedPeriod', 'Tahmini')}</span></div>
          <div class="legend-item"><span class="legend-dot dot-ovulation"></span><span>${t('calendar.ovulation', 'Yumurtlama')}</span></div>
          <div class="legend-item"><span class="legend-dot dot-fertile"></span><span>${t('calendar.fertileWindow', 'Doğurgan')}</span></div>
        </div>

        <!-- 3. AYLAR ARASI ADET SÜRESİ KIYASLAMA KARTI -->
        <div id="cal-period-comparison-card" style="margin-top: 14px;"></div>

        <!-- 4. SEÇİLEN GÜNÜN TİKLİ İŞARETLEME VE DETAY KARTI -->
        <div id="day-detail-panel" class="cal-detail-card" style="display: block; margin-top: 14px;"></div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();

    this.renderComparisonCard();

    const targetDate = this.selectedDate || todayStr;
    this.renderDayDetail(targetDate);
  },

  /**
   * Aylar Arası Adet Süresi Kıyaslama Kartı (Örn: Bu Ay 7 Gün vs Geçen Ay 9 Gün)
   */
  renderComparisonCard() {
    const compContainer = this.container ? this.container.querySelector('#cal-period-comparison-card') : null;
    if (!compContainer) return;

    let periods = [];
    if (window.App.Data && typeof window.App.Data.getPeriods === 'function') {
      periods = window.App.Data.getPeriods() || [];
    }

    // Tarihe göre sırala (En yeniden en eskiye)
    periods = periods.slice().sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    if (periods.length === 0) {
      compContainer.innerHTML = '';
      return;
    }

    const currentPeriod = periods[0];
    const prevPeriod = periods.length > 1 ? periods[1] : null;

    const currentDuration = currentPeriod.days ? currentPeriod.days.length : 5;
    const prevDuration = prevPeriod && prevPeriod.days ? prevPeriod.days.length : null;

    const currentMonthLabel = window.App.Utils ? window.App.Utils.formatMonthYear(new Date(currentPeriod.startDate)) : 'Son Ay';
    const prevMonthLabel = prevPeriod && window.App.Utils ? window.App.Utils.formatMonthYear(new Date(prevPeriod.startDate)) : 'Önceki Ay';

    let diffHtml = '';
    let diffBadge = '';

    if (prevDuration !== null) {
      const diff = currentDuration - prevDuration;
      if (diff === 0) {
        diffBadge = `<span style="background: rgba(91, 154, 111, 0.15); color: var(--accent-fertile); padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">🟢 Eşit Süre (Dengeli)</span>`;
        diffHtml = `Bu ayki kanamanız geçen ayla <strong>aynı sürede (${currentDuration} gün)</strong> tamamlandı.`;
      } else if (diff < 0) {
        diffBadge = `<span style="background: rgba(91, 154, 111, 0.15); color: var(--accent-fertile); padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">📉 ${Math.abs(diff)} Gün Daha Kısa</span>`;
        diffHtml = `Bu ayki adetiniz geçen aya göre <strong>${Math.abs(diff)} gün daha kısa</strong> sürdü (${prevDuration} günden ${currentDuration} güne düştü).`;
      } else {
        diffBadge = `<span style="background: rgba(230, 160, 60, 0.15); color: #b87314; padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">📈 ${diff} Gün Daha Uzun</span>`;
        diffHtml = `Bu ayki adetiniz geçen aya göre <strong>${diff} gün daha uzun</strong> sürdü (${prevDuration} günden ${currentDuration} güne çıktı).`;
      }
    } else {
      diffBadge = `<span style="background: var(--bg-secondary); color: var(--text-secondary); padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">İlk Kayıt</span>`;
      diffHtml = `Son adet süreniz: <strong>${currentDuration} gün</strong>. Gelecek aylarda kıyaslama otomatik olarak hesaplanacaktır.`;
    }

    compContainer.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 12px 14px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.84rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
            📊 Aylar Arası Adet Süresi Kıyaslaması
          </span>
          ${diffBadge}
        </div>

        <!-- Karşılaştırma Çubukları -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin: 10px 0;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 3px;">
              <span>${currentMonthLabel} (Son Dönem)</span>
              <strong>${currentDuration} Gün</strong>
            </div>
            <div style="width: 100%; background: var(--bg-secondary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${Math.min(100, (currentDuration / 10) * 100)}%; background: linear-gradient(90deg, #D4556B, #E87285); height: 100%; border-radius: var(--radius-full);"></div>
            </div>
          </div>

          ${prevPeriod ? `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 3px;">
                <span>${prevMonthLabel} (Önceki Dönem)</span>
                <strong>${prevDuration} Gün</strong>
              </div>
              <div style="width: 100%; background: var(--bg-secondary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
                <div style="width: ${Math.min(100, (prevDuration / 10) * 100)}%; background: #999; height: 100%; border-radius: var(--radius-full);"></div>
              </div>
            </div>
          ` : ''}
        </div>

        <div style="font-size: 0.78rem; color: var(--text-primary); line-height: 1.4; background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); border-left: 3px solid var(--accent-period);">
          💡 ${diffHtml} <span style="color: var(--text-secondary);">(Tıbbi olarak 3-7 gün normal kabul edilir).</span>
        </div>
      </div>
    `;
  },

  /**
   * Seçilen Günün Tikli Adet Girişi & Sağlık Özeti
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
      phaseName = '🩸 Regl Dönemi (İşaretli ✓)';
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

        <!-- TİKLİ / SEÇMELİ ADET İŞARETLEME KUTUSU (TEK DOKUNUŞLA AÇ/KAPA) -->
        <div id="btn-period-toggle-card" style="background: ${isPeriod ? 'rgba(212, 85, 107, 0.12)' : 'var(--bg-secondary)'}; border: 1.5px solid ${isPeriod ? 'var(--accent-period)' : 'var(--border)'}; border-radius: var(--radius-lg); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">🩸</span>
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary); display: block;">
                ${isPeriod ? 'Bu Gün Adet Oldum ✓' : 'Bugün Adet Oldum (İşaretle)'}
              </strong>
              <span style="font-size: 0.75rem; color: var(--text-secondary);">
                ${isPeriod ? 'Regl takviminizde işaretlendi. Kaldırmak için dokunun.' : 'Bu günü kanama günü olarak kaydetmek için dokunun.'}
              </span>
            </div>
          </div>
          
          <!-- İnteraktif Tik Kutusu -->
          <div style="width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: ${isPeriod ? 'var(--accent-period)' : 'var(--surface)'}; border: 2px solid ${isPeriod ? 'var(--accent-period)' : 'var(--border)'}; color: #fff; font-size: 1.1rem; font-weight: 800; transition: all 0.2s ease;">
            ${isPeriod ? '✓' : ''}
          </div>
        </div>

        <!-- O Günün Sağlık & Semptom Özeti -->
        <div style="padding-top: 8px; border-top: 1px dashed var(--border);">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
            📝 Bu Günün Sağlık Notları:
          </div>
          
          ${logChips.length > 0 ? `
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
              ${logChips.join('')}
            </div>
          ` : `
            <p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; margin: 4px 0 8px;">
              Bu gün için semptom veya ağrı kaydı girilmemiş.
            </p>
          `}

          ${symptoms && symptoms.notes ? `
            <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); font-size: 0.82rem; color: var(--text-primary); margin-top: 6px;">
              <strong>Not:</strong> "${symptoms.notes}"
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Tikli Kutucuk Dinleyicisi
    panel.querySelector('#btn-period-toggle-card')?.addEventListener('click', () => {
      this.togglePeriodDay(dateStr);
    });

    // Günlük Düzenle Butonu
    panel.querySelector('.btn-goto-day-log')?.addEventListener('click', () => {
      if (window.App.Main && window.App.Main.navigateTo) {
        window.App.Main.navigateTo('symptoms');
        if (window.App.Symptoms && window.App.Symptoms.selectDate) {
          window.App.Symptoms.selectDate(dateStr);
        }
      }
    });
  },

  navigateMonth(delta) {
    this.currentMonth.setMonth(this.currentMonth.getMonth() + delta);
    this.refresh();
  },

  goToToday() {
    this.currentMonth = new Date();
    const todayStr = window.App.Utils ? window.App.Utils.toISODateString(this.currentMonth) : '';
    this.selectedDate = todayStr;
    this.refresh();
    this.renderDayDetail(todayStr);
  },

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.container?.querySelectorAll('.cal-day').forEach(day => {
      day.classList.toggle('selected', day.getAttribute('data-date') === dateStr);
    });
    this.renderDayDetail(dateStr);
  },

  togglePeriodDay(dateStr) {
    if (window.App.Data && typeof window.App.Data.togglePeriodDay === 'function') {
      window.App.Data.togglePeriodDay(dateStr);
      
      if (window.App.Analytics && window.App.Analytics.logEvent) {
        window.App.Analytics.logEvent('period_day_toggled', { date: dateStr });
      }

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

    // Hızlı Bugün Regl Başlat/Bitir Butonu
    this.container.querySelector('#btn-quick-today-toggle')?.addEventListener('click', () => {
      const todayStr = window.App.Utils ? window.App.Utils.toISODateString(new Date()) : '';
      this.togglePeriodDay(todayStr);
    });

    // Tek Dokunuşla Tikleme Modu Butonu
    this.container.querySelector('#btn-toggle-quick-mode')?.addEventListener('click', () => {
      this.quickMode = !this.quickMode;
      this.refresh();
    });

    // Takvim Hücrelerine Tıklama
    this.container.querySelectorAll('.cal-day[data-date]').forEach(day => {
      day.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.getAttribute('data-date');
        if (!dateStr) return;

        if (this.quickMode) {
          // Tik Modu Açık: Güne dokunur dokunmaz anında Regl ✓ işaretini koyar/kaldırır!
          this.togglePeriodDay(dateStr);
        } else {
          // Seçim Modu: Güne tıklar ve detayını açar
          this.selectDate(dateStr);
        }
      });
    });
  },

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
  }
};
