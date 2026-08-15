window.App = window.App || {};

/**
 * Gelişmiş WomanLog Pro Takvim Modülü (WomanLog Pro Cloned Edition)
 * - 30 WomanLog Pro Temaları & 3D Arka Fon Seçici (Floral, Sakura 3D, Lavanta, Nane, Şeftali, Gece Modu)
 * - Kesintisiz Akıcı Ay Akışı (Nisan, Mayıs, Haziran...)
 * - Kiremit dolgulu regl kartları, çizgili tahmin kartları, mor 3 yapraklı doğurganlık tomurcukları
 * - Zengin İkon Sistemi: Kalp (❤️), İlaç (💊), Yüz İfadeleri (😊), Akıntı (💧), Aşerme/Meyve (🍓, 🍰), Ateş (🔥), Bakım (💄), Egzersiz (🧘)
 * - Uzun basıldığında (Long-Press) gün detayları ufak penceresi
 * - Tek dokunuşla regl açma/kapama
 */
window.App.Calendar = {
  currentMonth: new Date(),
  selectedDate: null,
  container: null,
  viewMode: 'month', // 'month' | 'year'
  currentSkin: localStorage.getItem('womanlog_skin') || 'skin-floral',

  render(container) {
    this.container = container;
    this.refresh();
  },

  setSkin(skinClass) {
    this.currentSkin = skinClass;
    localStorage.setItem('womanlog_skin', skinClass);
    this.refresh();
    if (window.App.Utils && window.App.Utils.showToast) {
      window.App.Utils.showToast('WomanLog Pro Teması Uygulandı 🎨🌸', 'success');
    }
  },

  showSkinPickerModal() {
    const skins = [
      { id: 'skin-floral', name: '🌸 Klasik Çiçekli (WomanLog)', color: '#F6D8DE' },
      { id: 'skin-sakura', name: '🌺 Sakura & Kiraz Çiçeği 3D', color: '#FCE4EC' },
      { id: 'skin-lavender', name: '💜 Lavanta Rüyası', color: '#EDE7F6' },
      { id: 'skin-mint', name: '🌿 Taze Nane & Bahar', color: '#C8E6C9' },
      { id: 'skin-peach', name: '🍑 Şeftali Günbatımı', color: '#FFE0B2' },
      { id: 'skin-dark', name: '🌙 Gece Modu & Yıldızlar', color: '#1E1B2E' }
    ];

    const modal = document.createElement('div');
    modal.className = 'day-preview-modal-overlay';
    modal.innerHTML = `
      <div class="day-preview-modal-card" style="max-width: 320px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
          <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0;">🎨 WomanLog Pro Temaları</h3>
          <button type="button" class="btn btn-sm btn-ghost btn-close-modal" style="font-size: 1.2rem;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${skins.map(s => `
            <button type="button" class="btn btn-secondary btn-select-skin" data-skin="${s.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: var(--radius-lg); ${this.currentSkin === s.id ? 'border: 2px solid var(--accent-period); background: rgba(212,85,107,0.1);' : ''}">
              <span style="font-weight: 700; font-size: 0.86rem;">${s.name}</span>
              <span style="width: 22px; height: 22px; border-radius: 50%; background: ${s.color}; border: 1px solid rgba(0,0,0,0.15);"></span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('.btn-close-modal')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    modal.querySelectorAll('.btn-select-skin').forEach(btn => {
      btn.addEventListener('click', () => {
        const skin = btn.getAttribute('data-skin');
        this.setSkin(skin);
        close();
      });
    });
  },

  refresh() {
    if (!this.container) return;

    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const today = new Date();
    const todayStr = window.App.Utils ? window.App.Utils.toISODateString(today) : '';

    const trMonths = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    const monthTitle = `${trMonths[month]} ${year}`;

    // Döngü ve tahmin bilgisi
    const cycleInfo = window.App.Cycle ? window.App.Cycle.getCycleInfo() : null;
    const daysUntilPeriod = (cycleInfo && cycleInfo.daysUntilNextPeriod != null) ? cycleInfo.daysUntilNextPeriod : 1;
    
    // Doğurganlık durumu
    const isFertileNow = cycleInfo ? cycleInfo.isFertileWindow : false;
    const fertilityText = isFertileNow ? 'yüksek 🌸' : 'düşük.';

    let html = `
      <div class="calendar-card ${this.currentSkin}">

        <!-- 1. ÜST PEMBE BAR (WomanLog Pro Yıl | Ay ve Tema Butonu) -->
        <div class="cal-top-segmented-bar">
          <div class="cal-segmented-pill-box">
            <button type="button" class="cal-segmented-pill ${this.viewMode === 'year' ? 'active' : ''}" id="btn-view-year">Yıl</button>
            <button type="button" class="cal-segmented-pill ${this.viewMode === 'month' ? 'active' : ''}" id="btn-view-month">Ay</button>
          </div>
          <button type="button" id="btn-open-skins" class="btn btn-sm btn-ghost" style="color: #FFFFFF; font-size: 0.8rem; font-weight: 700; margin-left: 10px; background: rgba(0,0,0,0.12); border-radius: var(--radius-full); padding: 4px 10px;">
            🎨 Temalar
          </button>
        </div>

        <!-- 2. AY BAŞLIĞI VE GEÇİŞ OKLARI (Sağa Yaslı Ay Başlığı) -->
        <div class="cal-month-header-row">
          <div style="display: flex; gap: 4px; align-items: center;">
            <button type="button" class="btn-cal-nav prev-month" aria-label="Önceki Ay" style="background: rgba(255,255,255,0.7); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button type="button" class="btn-cal-nav next-month" aria-label="Sonraki Ay" style="background: rgba(255,255,255,0.7); border: none; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="cal-month-title-right">${monthTitle}</div>
        </div>

        <!-- 3. HAFTANIN GÜNLERİ (WomanLog Pro Formatı) -->
        <div class="calendar-weekdays">
          <div>Pzt</div>
          <div>Sa</div>
          <div>Çar</div>
          <div>Per</div>
          <div>Cm</div>
          <div>Cmt</div>
          <div>Pz</div>
        </div>

        <!-- 4. GÜN IZGARASI -->
        <div class="calendar-grid">
    `;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startOffset = firstDay === 0 ? 6 : firstDay - 1;

    // Önceki ayın günleri
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      html += `
        <div class="cal-day other-month" style="opacity: 0.35; background: rgba(255,255,255,0.4);">
          <div class="cal-day-header">
            <span class="cal-day-main">${prevMonthDays - i}</span>
          </div>
        </div>
      `;
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
      // WOMANLOG PRO İKONLARI (Kalp, İlaç, Semptomlar)
      // ==========================================================
      if (window.App.Data && typeof window.App.Data.getSymptoms === 'function') {
        const sym = window.App.Data.getSymptoms(dateStr);
        if (sym) {
          // 1. Ruh Hali Emojileri
          const moodEmojis = {
            great: '😄',
            good: '🥰',
            okay: '😎',
            bad: '😔',
            terrible: '😷'
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

          // 6. Yaşam Tarzı (Birliktelik & Spor - WomanLog İkonları)
          if (sym.intimacy) emojis.push('❤️');
          if (sym.exercise) emojis.push('🧘');

          // 7. Su Tüketimi
          if (sym.water !== undefined && Number(sym.water) >= 6) {
            emojis.push('🥛');
          }

          // 8. Uyku Kalitesi
          if (sym.sleep) {
            if (sym.sleep === 'terrible' || sym.sleep === 'bad') emojis.push('🥱');
            else if (sym.sleep === 'great' || sym.sleep === 'good') emojis.push('🌙');
          }

          // 9. İlaç / Doğum Kontrol (WomanLog Pill İkonu)
          if (sym.birthControlTaken || (sym.medications && sym.medications.length > 0)) {
            emojis.push('💊');
          }

          // 10. Özel Belirtiler & Aşerme
          if (sym.customSymptoms && Array.isArray(sym.customSymptoms)) {
            sym.customSymptoms.forEach(cs => {
              const text = String(cs);
              if (text.includes('🤢') || text.toLowerCase().includes('bulanti')) emojis.push('🤢');
              else if (text.includes('🎈') || text.toLowerCase().includes('siskinlik')) emojis.push('🎈');
              else if (text.includes('🍫') || text.toLowerCase().includes('cikolata')) emojis.push('🍫');
              else if (text.includes('🍓') || text.toLowerCase().includes('tatli')) emojis.push('🍓');
              else if (text.includes('🍰') || text.toLowerCase().includes('pasta')) emojis.push('🍰');
              else if (text.includes('🍐') || text.toLowerCase().includes('meyve')) emojis.push('🍐');
              else if (text.includes('💄') || text.toLowerCase().includes('bakim')) emojis.push('💄');
              else if (text.includes('✨') || text.toLowerCase().includes('sivilce')) emojis.push('✨');
              else if (text.includes('🔥') || text.toLowerCase().includes('sicak')) emojis.push('🔥');
              else if (text.includes('🥱') || text.toLowerCase().includes('yorgunluk')) emojis.push('🥱');
              else if (text.includes('💫') || text.toLowerCase().includes('donme')) emojis.push('💫');
              else if (text.includes('🍕') || text.toLowerCase().includes('istah')) emojis.push('🍕');
              else {
                const match = text.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u);
                if (match) emojis.push(match[0]);
              }
            });
          }
        }
      }

      // Emojileri tekilleştir (Maksimum 3 emoji yan yana)
      const uniqueEmojis = Array.from(new Set(emojis)).slice(0, 3);

      html += `
        <div class="${classes.join(' ')}" data-date="${dateStr}" title="${dateStr}">
          <div class="cal-day-header">
            <span class="cal-day-main">${i}</span>
            ${cycleDayNum ? `<span class="cal-day-sup">(${cycleDayNum})</span>` : ''}
          </div>
          
          <!-- Ruh Hali & Sağlık Emojileri -->
          <div class="cal-emoji-stack">
            ${uniqueEmojis.map(e => `<span>${e}</span>`).join('')}
          </div>

          <!-- Doğurganlık Çiçeği (WomanLog Mor Küçük Tomurcuk) -->
          ${isFertile && !isPeriod ? `<div class="cal-fertile-flower">🌸</div>` : ''}
        </div>
      `;
    }

    // Sonraki ayın günleri (42 hücreye tamamla)
    const totalCells = startOffset + daysInMonth;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      html += `
        <div class="cal-day other-month" style="opacity: 0.35; background: rgba(255,255,255,0.4);">
          <div class="cal-day-header">
            <span class="cal-day-main">${i}</span>
          </div>
        </div>
      `;
    }

    html += `
        </div>

        <!-- 5. ALT DURUM BİLGİ ŞERİDİ (WomanLog Pro Formatı) -->
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
   * BASILI TUTULDUĞUNDA AÇILAN GÜN DETAYI UFAK PENCERESİ (Quick Preview Popup)
   */
  showDayPreviewPopup(dateStr) {
    const dateObj = window.App.Utils ? window.App.Utils.parseDate(dateStr) : new Date(dateStr);
    const formattedDate = window.App.Utils ? window.App.Utils.formatDateLong(dateObj) : dateStr;

    const classification = window.App.Cycle ? window.App.Cycle.classifyDate(dateStr) : {};
    const isPeriod = classification.isPeriod;

    let phaseName = '🌿 Foliküler Faz';
    let phaseBadgeColor = 'var(--accent-phase)';
    if (classification.isPeriod) {
      phaseName = '🩸 Regl Kanaması (İşaretli ✓)';
      phaseBadgeColor = '#D96B58';
    } else if (classification.isOvulation) {
      phaseName = '🌟 Yumurtlama Günü';
      phaseBadgeColor = 'var(--accent-ovulation)';
    } else if (classification.isFertile) {
      phaseName = '✨ Doğurganlık Penceresi';
      phaseBadgeColor = 'var(--accent-fertile)';
    } else if (classification.isPredictedPeriod) {
      phaseName = '📅 Tahmini Regl';
      phaseBadgeColor = '#D96B58';
    }

    const sym = (window.App.Data && typeof window.App.Data.getSymptoms === 'function')
      ? window.App.Data.getSymptoms(dateStr)
      : null;

    const moodNames = {
      great: '😄 Harika & Enerjik',
      good: '🥰 Mutlu & Romantik',
      okay: '😎 Normal / Zinde',
      bad: '😔 Yorgun & Hassas',
      terrible: '😷 Hasta / Kötü'
    };

    const painNames = {
      none: 'Ağrı Yok 😊',
      mild: 'Hafif Ağrı 🌱',
      moderate: 'Orta Şiddetli Sancı ⚡',
      severe: 'Şiddetli Sancı 🔥'
    };

    let itemsHtml = '';

    if (sym) {
      if (sym.mood && moodNames[sym.mood]) {
        itemsHtml += `
          <div class="day-preview-item">
            <div class="day-preview-icon">😊</div>
            <div class="day-preview-content">
              <strong>Ruh Hali:</strong>
              <span>${moodNames[sym.mood]}</span>
            </div>
          </div>
        `;
      }

      if (sym.painLevel && sym.painLevel !== 'none') {
        itemsHtml += `
          <div class="day-preview-item">
            <div class="day-preview-icon">⚡</div>
            <div class="day-preview-content">
              <strong>Ağrı & Sancı:</strong>
              <span>${painNames[sym.painLevel] || sym.painLevel}</span>
            </div>
          </div>
        `;
      }

      if (sym.flow && sym.flow !== 'none') {
        itemsHtml += `
          <div class="day-preview-item">
            <div class="day-preview-icon">🩸</div>
            <div class="day-preview-content">
              <strong>Kanama / Akıntı:</strong>
              <span>${sym.flow === 'spotting' ? '💧 Lekelenme' : '● Kanama Var'}</span>
            </div>
          </div>
        `;
      }

      if (sym.birthControlTaken || (sym.medications && sym.medications.length > 0)) {
        itemsHtml += `
          <div class="day-preview-item">
            <div class="day-preview-icon">💊</div>
            <div class="day-preview-content">
              <strong>İlaç / Doğum Kontrol:</strong>
              <span>İlaç alındı ✓</span>
            </div>
          </div>
        `;
      }

      if (sym.intimacy || sym.exercise) {
        itemsHtml += `
          <div class="day-preview-item">
            <div class="day-preview-icon">❤️</div>
            <div class="day-preview-content">
              <strong>Aktivite & Yaşam:</strong>
              <span>${[sym.intimacy ? 'Birliktelik' : '', sym.exercise ? 'Egzersiz' : ''].filter(Boolean).join(' • ')}</span>
            </div>
          </div>
        `;
      }

      if (sym.customSymptoms && sym.customSymptoms.length > 0) {
        itemsHtml += `
          <div class="day-preview-item">
            <div class="day-preview-icon">✨</div>
            <div class="day-preview-content">
              <strong>Özel Belirtiler:</strong>
              <span>${sym.customSymptoms.join(', ')}</span>
            </div>
          </div>
        `;
      }

      if (sym.notes) {
        itemsHtml += `
          <div class="day-preview-item" style="border-left: 3px solid #D4556B;">
            <div class="day-preview-icon">📝</div>
            <div class="day-preview-content">
              <strong>Günlük Notu:</strong>
              <span style="font-style: italic;">"${sym.notes}"</span>
            </div>
          </div>
        `;
      }
    }

    if (!itemsHtml) {
      itemsHtml = `
        <div style="text-align: center; padding: 20px 10px; color: var(--text-secondary); font-size: 0.85rem;">
          <div style="font-size: 2rem; margin-bottom: 6px;">📝</div>
          Bu gün için henüz ruh hali veya belirti kaydı girilmemiş.<br>
          Aşağıdaki butona basarak kolayca ekleyebilirsiniz.
        </div>
      `;
    }

    // Modal Pencereyi Oluştur
    const modal = document.createElement('div');
    modal.className = 'day-preview-modal-overlay';
    modal.innerHTML = `
      <div class="day-preview-modal-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--border);">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px 0;">${formattedDate}</h3>
            <span style="display: inline-block; font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: var(--radius-full); background: rgba(212, 85, 107, 0.12); color: ${phaseBadgeColor};">
              ${phaseName}
            </span>
          </div>
          <button type="button" class="btn btn-sm btn-ghost btn-close-preview" style="font-size: 1.2rem; line-height: 1; padding: 4px 8px; border-radius: 50%;">✕</button>
        </div>

        <div style="margin-bottom: 14px;">
          ${itemsHtml}
        </div>

        <div style="display: flex; gap: 8px; flex-direction: column;">
          <button type="button" class="btn btn-primary btn-sm btn-edit-this-day" style="width: 100%; padding: 9px; font-weight: 700;">
            ✏️ Ruh Hali & Belirti Düzenle
          </button>
          <button type="button" class="btn btn-secondary btn-sm btn-toggle-period-quick" style="width: 100%; padding: 9px; font-weight: 700;">
            ${isPeriod ? '✓ Regl İşaretini Kaldır' : '🩸 Bu Günü Regl Olarak İşaretle'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.btn-close-preview')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('.btn-edit-this-day')?.addEventListener('click', () => {
      closeModal();
      if (window.App.Main && window.App.Main.navigateTo) {
        window.App.Main.navigateTo('symptoms');
        if (window.App.Symptoms && window.App.Symptoms.selectDate) {
          window.App.Symptoms.selectDate(dateStr);
        }
      }
    });

    modal.querySelector('.btn-toggle-period-quick')?.addEventListener('click', () => {
      closeModal();
      this.togglePeriodDay(dateStr);
    });
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
      <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-xl); padding: 12px 14px; box-shadow: var(--shadow-sm);">
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
              <div style="width: ${Math.min(100, (currentDuration / 10) * 100)}%; background: linear-gradient(90deg, #D96B58, #E87A8D); height: 100%; border-radius: var(--radius-full);"></div>
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

        <div style="font-size: 0.78rem; color: var(--text-primary); line-height: 1.4; background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); border-left: 3px solid #D96B58;">
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
      phaseBadgeColor = '#D96B58';
    } else if (classification.isOvulation) {
      phaseName = '🌟 Yumurtlama Günü (Ovulasyon)';
      phaseBadgeColor = 'var(--accent-ovulation)';
    } else if (classification.isFertile) {
      phaseName = '✨ Yüksek Doğurganlık Penceresi';
      phaseBadgeColor = 'var(--accent-fertile)';
    } else if (classification.isPredictedPeriod) {
      phaseName = '📅 Tahmini Regl';
      phaseBadgeColor = '#D96B58';
    }

    const symptoms = (window.App.Data && typeof window.App.Data.getSymptoms === 'function')
      ? window.App.Data.getSymptoms(dateStr)
      : null;

    let logChips = [];
    if (symptoms) {
      if (symptoms.mood) logChips.push(`<span class="cal-log-chip mood">${symptoms.mood}</span>`);
      if (symptoms.painLevel && symptoms.painLevel !== 'none') logChips.push(`<span class="cal-log-chip pain">⚡ Ağrı</span>`);
      if (symptoms.flow && symptoms.flow !== 'none') logChips.push(`<span class="cal-log-chip flow">💧 Akıntı</span>`);
      if (symptoms.intimacy) logChips.push(`<span class="cal-log-chip intimacy">❤️ Birliktelik</span>`);
      if (symptoms.exercise) logChips.push(`<span class="cal-log-chip intimacy">🏃‍♀️ Egzersiz</span>`);
      if (symptoms.water) logChips.push(`<span class="cal-log-chip flow">🥛 Su</span>`);
      if (symptoms.birthControlTaken) logChips.push(`<span class="cal-log-chip meds">💊 İlaç</span>`);
      if (symptoms.customSymptoms && Array.isArray(symptoms.customSymptoms)) {
        symptoms.customSymptoms.forEach(cs => {
          logChips.push(`<span class="cal-log-chip meds">✨ ${cs}</span>`);
        });
      }
    }

    panel.style.display = 'block';
    panel.innerHTML = `
      <div style="background: #FFFFFF; border: 1px solid rgba(0,0,0,0.06); border-radius: var(--radius-xl); padding: 14px; box-shadow: var(--shadow-sm);">
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

        <!-- TİKLİ ADET İŞARETLEME KUTUSU -->
        <div id="btn-period-toggle-card" style="background: ${isPeriod ? '#D96B58' : 'var(--bg-secondary)'}; border: 1.5px solid ${isPeriod ? '#D96B58' : 'var(--border)'}; border-radius: var(--radius-lg); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s ease; margin-bottom: 12px; color: ${isPeriod ? '#ffffff' : 'var(--text-primary)'};">
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
          
          <div style="width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: ${isPeriod ? '#ffffff' : 'var(--surface)'}; border: 2px solid ${isPeriod ? '#ffffff' : 'var(--border)'}; color: ${isPeriod ? '#D96B58' : '#fff'}; font-size: 1.1rem; font-weight: 800;">
            ${isPeriod ? '✓' : ''}
          </div>
        </div>

        <!-- O Günün Sağlık & Ruh Hali Emojileri -->
        <div style="padding-top: 8px; border-top: 1px dashed var(--border);">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px;">
            📝 Bu Günün Kayıtları:
          </div>
          
          ${logChips.length > 0 ? `
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${logChips.join('')}
            </div>
          ` : `
            <p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic; margin: 4px 0;">
              Bu gün için henüz ruh hali veya belirti girilmemiş.
            </p>
          `}
        </div>
      </div>
    `;

    panel.querySelector('#btn-period-toggle-card')?.addEventListener('click', () => {
      this.togglePeriodDay(dateStr);
    });

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

    // Yıl / Ay Düğmeleri
    this.container.querySelector('#btn-view-year')?.addEventListener('click', () => {
      this.viewMode = 'year';
      this.refresh();
    });
    this.container.querySelector('#btn-view-month')?.addEventListener('click', () => {
      this.viewMode = 'month';
      this.refresh();
    });

    // WomanLog Pro Tema Seçici Butonu
    this.container.querySelector('#btn-open-skins')?.addEventListener('click', () => {
      this.showSkinPickerModal();
    });

    // Takvim Hücrelerine Tıklama & BASILI TUTMA (Long-Press)
    this.container.querySelectorAll('.cal-day[data-date]').forEach(day => {
      const dateStr = day.getAttribute('data-date');
      if (!dateStr) return;

      let pressTimer = null;
      let isLongPress = false;

      const startPress = () => {
        isLongPress = false;
        pressTimer = setTimeout(() => {
          isLongPress = true;
          if (window.App.Utils && window.App.Utils.vibrate) {
            window.App.Utils.vibrate(45);
          }
          this.showDayPreviewPopup(dateStr);
        }, 450);
      };

      const cancelPress = () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      };

      // Dokunmatik Ekran (Mobil)
      day.addEventListener('touchstart', startPress, { passive: true });
      day.addEventListener('touchend', cancelPress);
      day.addEventListener('touchmove', cancelPress);
      day.addEventListener('touchcancel', cancelPress);

      // Fare Dinleyicileri (Masaüstü & Web)
      day.addEventListener('mousedown', startPress);
      day.addEventListener('mouseup', cancelPress);
      day.addEventListener('mouseleave', cancelPress);

      // Sağ Tıklama ile de Popup Açma
      day.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showDayPreviewPopup(dateStr);
      });

      // Normal Tıklama (Basılı tutulmadıysa çalışır)
      day.addEventListener('click', () => {
        if (isLongPress) {
          isLongPress = false;
          return;
        }
        this.selectedDate = dateStr;
        this.togglePeriodDay(dateStr);
      });
    });
  },

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
  }
};
