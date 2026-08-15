window.App = window.App || {};

/**
 * Gelişmiş Takvim Modülü (Advanced Interactive Calendar with Direct-Tap Checkmark System)
 * - İstenen günlere doğrudan dokunarak veya tik kutucuğuna basarak TEK DOKUNUŞLA TİK (✓) koyma / kaldırma,
 * - Günlük bölümünden girilen TÜM kategorilerin (Ruh hali, Ağrı, Kanama, Akıntı, İlaç, Birliktelik, Spor, Su, Uyku, Aşerme/Özel belirtiler) emojilerini takvim kutucuğuna işler,
 * - Alt durum bilgi bandı ve aylar arası kıyaslama kartı.
 */
window.App.Calendar = {
  currentMonth: new Date(),
  selectedDate: null,
  container: null,
  viewMode: 'month', // 'month' | 'year'
  directCheckMode: true, // Dokunarak doğrudan regl işaretleme modu

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

    // Döngü ve tahmin bilgisi
    const cycleInfo = window.App.Cycle ? window.App.Cycle.getCycleInfo() : null;
    const daysUntilPeriod = (cycleInfo && cycleInfo.daysUntilNextPeriod != null) ? cycleInfo.daysUntilNextPeriod : 0;
    
    // Doğurganlık durumu
    const isFertileNow = cycleInfo ? cycleInfo.isFertileWindow : false;
    const fertilityText = isFertileNow ? 'Yüksek 🌸' : 'Düşük 🛡️';

    let html = `
      <div class="calendar-card" style="padding: 12px; background: var(--surface); border-radius: var(--radius-2xl);">

        <!-- 1. ÜST KONTROL ÇUBUĞU (Yıl | Ay ve Hızlı Tik Modu) -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="display: inline-flex; background: var(--bg-secondary); padding: 3px; border-radius: var(--radius-full); border: 1px solid var(--border);">
            <button type="button" class="btn btn-sm ${this.viewMode === 'year' ? 'btn-primary' : 'btn-ghost'}" id="btn-view-year" style="padding: 4px 14px; font-size: 0.76rem; font-weight: 700; border-radius: var(--radius-full);">Yıl</button>
            <button type="button" class="btn btn-sm ${this.viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}" id="btn-view-month" style="padding: 4px 14px; font-size: 0.76rem; font-weight: 700; border-radius: var(--radius-full);">Ay</button>
          </div>

          <!-- Doğrudan Dokunarak Tik İşaretleme Modu Butonu -->
          <button type="button" id="btn-toggle-quick-check" class="btn btn-sm ${this.directCheckMode ? 'btn-primary' : 'btn-secondary'}" style="font-size: 0.76rem; padding: 5px 12px; border-radius: var(--radius-full); font-weight: 700; display: flex; align-items: center; gap: 5px;">
            <span>🩸</span>
            <span>${this.directCheckMode ? 'Dokun ve Tik Koy (Açık ✓)' : 'Dokun ve Tik Koy (Kapalı)'}</span>
          </button>
        </div>

        <!-- 2. AY BAŞLIĞI & GEÇİŞLER -->
        <div class="calendar-header" style="margin-bottom: 12px;">
          <button type="button" class="btn-cal-nav prev-month" aria-label="Önceki Ay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 class="month-title" style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">${monthName}</h2>
          <button type="button" class="btn-cal-nav next-month" aria-label="Sonraki Ay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button type="button" class="btn-cal-today today-btn" style="padding: 4px 10px; font-size: 0.75rem; border-radius: var(--radius-full);">${t('calendar.today', 'Bugün')}</button>
        </div>

        <!-- 3. HAFTANIN GÜNLERİ -->
        <div class="calendar-weekdays" style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px;">
          <div class="weekday">Pzt</div>
          <div class="weekday">Sal</div>
          <div class="weekday">Çar</div>
          <div class="weekday">Per</div>
          <div class="weekday">Cum</div>
          <div class="weekday">Cmt</div>
          <div class="weekday">Paz</div>
        </div>

        <!-- 4. GÜN IZGARASI (GENİŞ KUTUCUKLAR, TİK İŞARETİ & TÜM EMOJİLER) -->
        <div class="calendar-grid" style="gap: 4px;">
    `;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Önceki ayın günleri
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      html += `<div class="cal-day other-month" style="opacity: 0.35;"><div class="cal-day-header"><span class="cal-day-main">${prevMonthDays - i}</span></div></div>`;
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

      // Döngü Günü Sayısı (Superscript)
      let cycleDayNum = '';
      if (classification && classification.cycleDay) {
        cycleDayNum = classification.cycleDay;
      }

      let emojis = [];
      let isPeriod = false;
      let isPredicted = false;
      let isFertile = false;

      if (classification) {
        if (classification.isPeriod) {
          classes.push('period');
          isPeriod = true;
        } else if (classification.isPredictedPeriod) {
          classes.push('predicted-period');
          isPredicted = true;
        } else if (classification.isOvulation) {
          classes.push('ovulation');
          isFertile = true;
        } else if (classification.isFertile) {
          classes.push('fertile');
          isFertile = true;
        }
      }

      // ==========================================================
      // O GÜNE AİT TÜM GÜNLÜK KATEGORİLERİNİN EMOJİLERİNİ TOPLA
      // ==========================================================
      if (window.App.Data && typeof window.App.Data.getSymptoms === 'function') {
        const sym = window.App.Data.getSymptoms(dateStr);
        if (sym) {
          // 1. Ruh Hali Emojileri
          const moodEmojis = {
            great: '😄',
            good: '🥰',
            okay: '😐',
            bad: '😔',
            terrible: '😢'
          };
          if (sym.mood && moodEmojis[sym.mood]) emojis.push(moodEmojis[sym.mood]);

          // 2. Ağrı / Sancı Seviyesi
          const painEmojis = {
            mild: '🌱',
            moderate: '⚡',
            severe: '🔥'
          };
          if (sym.painLevel && painEmojis[sym.painLevel]) {
            emojis.push(painEmojis[sym.painLevel]);
          }

          // 3. Ağrı Hissedilen Bölgeler
          if (sym.painAreas && Array.isArray(sym.painAreas)) {
            if (sym.painAreas.includes('head')) emojis.push('🤕');
            if (sym.painAreas.includes('lowerBack') || sym.painAreas.includes('upperBack')) emojis.push('🩹');
            if (sym.painAreas.includes('breast')) emojis.push('💆‍♀️');
            if (sym.painAreas.includes('legs')) emojis.push('🦵');
            if (sym.painAreas.includes('abdomen') && !emojis.includes('⚡')) emojis.push('⚡');
          }

          // 4. Kanama / Akıntı / Leke
          if (sym.flow && sym.flow !== 'none') {
            emojis.push(sym.flow === 'spotting' ? '💧' : '🩸');
          }

          // 5. Servikal Akıntı Türü
          if (sym.discharge && sym.discharge !== 'none') {
            if (sym.discharge === 'eggWhite') emojis.push('🥚');
            else if (!emojis.includes('💧')) emojis.push('💧');
          }

          // 6. Yaşam Tarzı (Birliktelik & Spor)
          if (sym.intimacy) emojis.push('❤️');
          if (sym.exercise) emojis.push('🏃‍♀️');

          // 7. Su Tüketimi (Yeterli / Bol Su)
          if (sym.water !== undefined && Number(sym.water) >= 6) {
            emojis.push('🥛');
          }

          // 8. Uyku Kalitesi
          if (sym.sleep) {
            if (sym.sleep === 'terrible' || sym.sleep === 'bad') emojis.push('🥱');
            else if (sym.sleep === 'great' || sym.sleep === 'good') emojis.push('🌙');
          }

          // 9. İlaç / Doğum Kontrol
          if (sym.birthControlTaken || (sym.medications && sym.medications.length > 0)) {
            emojis.push('💊');
          }

          // 10. Özel Belirtiler & Aşerme
          if (sym.customSymptoms && Array.isArray(sym.customSymptoms)) {
            sym.customSymptoms.forEach(cs => {
              const text = String(cs);
              if (text.includes('🤢') || text.toLowerCase().includes('bulanti')) emojis.push('🤢');
              else if (text.includes('🎈') || text.toLowerCase().includes('siskinlik')) emojis.push('🎈');
              else if (text.includes('🍫') || text.includes('🍓') || text.toLowerCase().includes('tatli') || text.toLowerCase().includes('seker')) emojis.push('🍫');
              else if (text.includes('✨') || text.toLowerCase().includes('sivilce')) emojis.push('✨');
              else if (text.includes('🔥') || text.toLowerCase().includes('sicak')) emojis.push('🔥');
              else if (text.includes('🥱') || text.toLowerCase().includes('yorgunluk')) emojis.push('🥱');
              else if (text.includes('💫') || text.toLowerCase().includes('donme')) emojis.push('💫');
              else if (text.includes('🍕') || text.toLowerCase().includes('istah')) emojis.push('🍕');
              else {
                // Emojiyi regex ile ayıkla
                const match = text.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
                if (match) emojis.push(match[0]);
              }
            });
          }
        }
      }

      // Emojileri tekilleştir (Maksimum 4 emoji)
      const uniqueEmojis = Array.from(new Set(emojis)).slice(0, 4);

      html += `
        <div class="${classes.join(' ')}" data-date="${dateStr}" title="${dateStr}">
          <div class="cal-day-header">
            <span class="cal-day-main">${i}</span>
            ${cycleDayNum ? `<span class="cal-day-sup">(${cycleDayNum})</span>` : ''}
            
            <!-- Her Hücrede Doğrudan Tıklanabilir Tik Kutucuğu -->
            <div class="cal-day-check-badge" data-check-date="${dateStr}" title="Regl İşaretle / Kaldır">✓</div>
          </div>
          
          <!-- Ruh Hali & Sağlık Emojileri Izgarası -->
          <div class="cal-emoji-stack ${uniqueEmojis.length === 1 ? 'single-emoji' : ''}">
            ${uniqueEmojis.map(e => `<span>${e}</span>`).join('')}
          </div>

          <!-- Doğurganlık Çiçeği -->
          ${isFertile && !isPeriod ? `<div class="cal-fertile-flower">🌸</div>` : ''}
        </div>
      `;
    }

    // Sonraki ayın günleri (42 hücreye tamamla)
    const totalCells = startOffset + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      html += `<div class="cal-day other-month" style="opacity: 0.35;"><div class="cal-day-header"><span class="cal-day-main">${i}</span></div></div>`;
    }

    html += `
        </div>

        <!-- 5. ALT DURUM BİLGİ ŞERİDİ (Görsel 2 ile Birebir) -->
        <div class="cal-bottom-status-ribbon">
          <span>Kalan günler: <strong>${daysUntilPeriod}</strong>. Hamile kalma şansı: <strong>${fertilityText}</strong></span>
          <span style="font-size: 1.1rem; cursor: pointer;">⋮</span>
        </div>

        <!-- 6. AYLAR ARASI ADET SÜRESİ KIYASLAMA KARTI -->
        <div id="cal-period-comparison-card" style="margin-top: 14px;"></div>

        <!-- 7. SEÇİLEN GÜNÜN TİKLİ İŞARETLEME VE DETAY KARTI -->
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
   * Aylar Arası Adet Süresi Kıyaslama Kartı
   */
  renderComparisonCard() {
    const compContainer = this.container ? this.container.querySelector('#cal-period-comparison-card') : null;
    if (!compContainer) return;

    let periods = [];
    if (window.App.Data && typeof window.App.Data.getPeriods === 'function') {
      periods = window.App.Data.getPeriods() || [];
    }

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
        diffBadge = `<span style="background: rgba(91, 154, 111, 0.15); color: var(--accent-fertile); padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">🟢 Eşit Süre</span>`;
        diffHtml = `Bu ayki kanamanız geçen ayla <strong>aynı sürede (${currentDuration} gün)</strong> tamamlandı.`;
      } else if (diff < 0) {
        diffBadge = `<span style="background: rgba(91, 154, 111, 0.15); color: var(--accent-fertile); padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">📉 ${Math.abs(diff)} Gün Daha Kısa</span>`;
        diffHtml = `Bu ayki adetiniz geçen aya göre <strong>${Math.abs(diff)} gün daha kısa</strong> sürdü.`;
      } else {
        diffBadge = `<span style="background: rgba(230, 160, 60, 0.15); color: #b87314; padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">📈 ${diff} Gün Daha Uzun</span>`;
        diffHtml = `Bu ayki adetiniz geçen aya göre <strong>${diff} gün daha uzun</strong> sürdü.`;
      }
    } else {
      diffBadge = `<span style="background: var(--bg-secondary); color: var(--text-secondary); padding: 3px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">İlk Kayıt</span>`;
      diffHtml = `Son adet süreniz: <strong>${currentDuration} gün</strong>.`;
    }

    compContainer.innerHTML = `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 12px 14px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.84rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
            📊 Aylar Arası Adet Süresi Kıyaslaması
          </span>
          ${diffBadge}
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin: 10px 0;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 3px;">
              <span>${currentMonthLabel} (Son Dönem)</span>
              <strong>${currentDuration} Gün</strong>
            </div>
            <div style="width: 100%; background: var(--bg-secondary); height: 8px; border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${Math.min(100, (currentDuration / 10) * 100)}%; background: linear-gradient(90deg, #E57373, #D4556B); height: 100%; border-radius: var(--radius-full);"></div>
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

        <div style="font-size: 0.78rem; color: var(--text-primary); line-height: 1.4; background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); border-left: 3px solid #E57373;">
          💡 ${diffHtml}
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
      great: '😄 Harika & Enerjik',
      good: '🥰 Mutlu & Romantik',
      okay: '😐 Normal / Dengeli',
      bad: '😔 Yorgun / Hassas',
      terrible: '😢 Çok Duygusal'
    };

    const painNames = {
      none: 'Ağrı Yok 😊',
      mild: 'Hafif Ağrı 🌱',
      moderate: 'Orta Şiddetli Sancı ⚡',
      severe: 'Şiddetli Sancı 🔥'
    };

    let logChips = [];
    if (symptoms) {
      if (symptoms.mood && moodNames[symptoms.mood]) {
        logChips.push(`<span class="cal-log-chip mood">${moodNames[symptoms.mood]}</span>`);
      }
      if (symptoms.painLevel && symptoms.painLevel !== 'none') {
        logChips.push(`<span class="cal-log-chip pain">⚡ ${painNames[symptoms.painLevel] || symptoms.painLevel}</span>`);
      }
      if (symptoms.flow && symptoms.flow !== 'none') {
        logChips.push(`<span class="cal-log-chip flow">💧 Akıntı / Kanama</span>`);
      }
      if (symptoms.intimacy) {
        logChips.push(`<span class="cal-log-chip intimacy">❤️ Birliktelik</span>`);
      }
      if (symptoms.exercise) {
        logChips.push(`<span class="cal-log-chip intimacy">🏃‍♀️ Egzersiz</span>`);
      }
      if (symptoms.water !== undefined && Number(symptoms.water) > 0) {
        logChips.push(`<span class="cal-log-chip flow">🥛 ${symptoms.water} Bardak Su</span>`);
      }
      if (symptoms.temperature) {
        logChips.push(`<span class="cal-log-chip temp">🌡️ Ateş: ${symptoms.temperature}°C</span>`);
      }
      if (symptoms.birthControlTaken) {
        logChips.push(`<span class="cal-log-chip meds">💊 İlaç Alındı</span>`);
      }
      if (symptoms.customSymptoms && Array.isArray(symptoms.customSymptoms)) {
        symptoms.customSymptoms.forEach(cs => {
          logChips.push(`<span class="cal-log-chip meds">✨ ${cs}</span>`);
        });
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
            ✏️ Ruh Hali & Belirti Ekle
          </button>
        </div>

        <!-- TİKLİ / SEÇMELİ ADET İŞARETLEME KUTUSU (TEK DOKUNUŞLA AÇ/KAPA) -->
        <div id="btn-period-toggle-card" style="background: ${isPeriod ? '#E57373' : 'var(--bg-secondary)'}; border: 1.5px solid ${isPeriod ? '#E57373' : 'var(--border)'}; border-radius: var(--radius-lg); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 12px; color: ${isPeriod ? '#ffffff' : 'var(--text-primary)'};">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.5rem;">🩸</span>
            <div>
              <strong style="font-size: 0.92rem; display: block;">
                ${isPeriod ? 'Bu Gün Adet Oldum (İşaretli ✓)' : 'Bugün Adet Oldum (İşaretle)'}
              </strong>
              <span style="font-size: 0.75rem; color: ${isPeriod ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)'};">
                ${isPeriod ? 'Regl takviminizde işaretlendi. Kaldırmak için dokunun.' : 'Bu günü kanama günü olarak kaydetmek için dokunun.'}
              </span>
            </div>
          </div>
          
          <!-- İnteraktif Tik Kutusu -->
          <div style="width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: ${isPeriod ? '#ffffff' : 'var(--surface)'}; border: 2px solid ${isPeriod ? '#ffffff' : 'var(--border)'}; color: ${isPeriod ? '#E57373' : '#fff'}; font-size: 1.1rem; font-weight: 800; transition: all 0.2s ease;">
            ${isPeriod ? '✓' : ''}
          </div>
        </div>

        <!-- O Günün Sağlık & Ruh Hali Emojileri -->
        <div style="padding-top: 8px; border-top: 1px dashed var(--border);">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
            📝 Bu Günün Ruh Hali & Sağlık Kayıtları:
          </div>
          
          ${logChips.length > 0 ? `
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px;">
              ${logChips.join('')}
            </div>
          ` : `
            <p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; margin: 4px 0 8px;">
              Bu gün için henüz ruh hali veya belirti girilmemiş. "Ruh Hali & Belirti Ekle" butonuyla takvime emoji ekleyebilirsiniz!
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

      const isNowPeriod = window.App.Data.getPeriodForDate(dateStr) !== null;
      if (window.App.Utils && window.App.Utils.showToast) {
        window.App.Utils.showToast(isNowPeriod ? `${dateStr} Regl Olarak İşaretlendi ✓` : `${dateStr} Regl İşareti Kaldırıldı`, 'success');
      }

      if (window.App.Utils && window.App.Utils.vibrate) {
        window.App.Utils.vibrate(35);
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

    // Yıl / Ay Düğmeleri
    this.container.querySelector('#btn-view-year')?.addEventListener('click', () => {
      this.viewMode = 'year';
      if (window.App.Utils && window.App.Utils.showToast) {
        window.App.Utils.showToast('Yıllık takvim görünümü', 'info');
      }
      this.refresh();
    });
    this.container.querySelector('#btn-view-month')?.addEventListener('click', () => {
      this.viewMode = 'month';
      this.refresh();
    });

    // Dokun ve Tik Koy Modunu Aç / Kapat
    this.container.querySelector('#btn-toggle-quick-check')?.addEventListener('click', () => {
      this.directCheckMode = !this.directCheckMode;
      if (window.App.Utils && window.App.Utils.showToast) {
        window.App.Utils.showToast(
          this.directCheckMode ? 'Dokunarak Regl İşaretleme Açıldı (✓)' : 'Sadece Seçim Modu Açıldı',
          'info'
        );
      }
      this.refresh();
    });

    // Takvim Hücrelerine ve Tik Kutucuklarına Tıklama
    this.container.querySelectorAll('.cal-day[data-date]').forEach(day => {
      day.addEventListener('click', (e) => {
        const dateStr = day.getAttribute('data-date');
        if (!dateStr) return;

        const clickedCheckBadge = e.target.closest('.cal-day-check-badge');

        if (clickedCheckBadge || this.directCheckMode) {
          // Doğrudan Tik (✓) İşaretini Aç veya Kapat
          this.selectedDate = dateStr;
          this.togglePeriodDay(dateStr);
        } else {
          // Normal Seçim
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
