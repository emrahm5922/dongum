window.App = window.App || {};

/**
 * Akıllı Analitik, Ekran Süresi ve Olay (Event) Takip Motoru (Analytics & Event Tracker)
 * 1. Özel Olaylar (Custom Events): mod_secildi, buton_tiklandi, adet_kaydedildi
 * 2. Ekran Süresi & Etkileşim Takibi (Screen Engagement Timer)
 * 3. Yerel Beta Analitik Paneli + Firebase / Google Analytics Entegrasyon Köprüsü
 */
window.App.Analytics = {
  currentScreen: 'dashboard',
  screenStartTime: Date.now(),
  eventsKey: 'dongum_analytics_events',
  engagementKey: 'dongum_analytics_engagement',

  init() {
    this.screenStartTime = Date.now();
    this.logEvent('app_opened', { time: new Date().toISOString() });
    
    // Uygulama arka plana geçtiğinde veya kapandığında ekran süresini kaydet
    window.addEventListener('beforeunload', () => {
      this._recordScreenTime(this.currentScreen);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this._recordScreenTime(this.currentScreen);
      } else {
        this.screenStartTime = Date.now();
      }
    });
  },

  /**
   * Ekran Değişimini ve Geçirilen Süreyi Kaydeder
   */
  trackScreen(screenName) {
    if (this.currentScreen && this.currentScreen !== screenName) {
      this._recordScreenTime(this.currentScreen);
    }
    this.currentScreen = screenName;
    this.screenStartTime = Date.now();

    this.logEvent('screen_view', { screen_name: screenName });
  },

  _recordScreenTime(screenName) {
    const durationSec = Math.round((Date.now() - this.screenStartTime) / 1000);
    if (durationSec <= 0) return;

    let stats = {};
    try {
      stats = JSON.parse(localStorage.getItem(this.engagementKey) || '{}');
    } catch(e) {}

    stats[screenName] = (stats[screenName] || 0) + durationSec;
    localStorage.setItem(this.engagementKey, JSON.stringify(stats));
  },

  /**
   * Özel Olay (Custom Event) Kaydeder
   * Firebase veya GA bağlandığında doğrudan oraya da iletir.
   */
  logEvent(eventName, params = {}) {
    const eventObj = {
      event: eventName,
      params: params,
      timestamp: new Date().toISOString()
    };

    // 1. Yerel Depolama (Beta & Geliştirici İncelemesi İçin)
    try {
      let events = JSON.parse(localStorage.getItem(this.eventsKey) || '[]');
      events.push(eventObj);
      if (events.length > 200) events = events.slice(-200); // Son 200 olayı sakla
      localStorage.setItem(this.eventsKey, JSON.stringify(events));
    } catch(e) {}

    // 2. Firebase Analytics Köprüsü (Eğer Firebase SDK yüklüyse otomatik tetikler)
    if (window.firebase && window.firebase.analytics) {
      try {
        window.firebase.analytics().logEvent(eventName, params);
      } catch(err) {
        console.warn('[Firebase] Event error:', err);
      }
    }

    // 3. Google Analytics (gtag) Köprüsü
    if (typeof window.gtag === 'function') {
      try {
        window.gtag('event', eventName, params);
      } catch(e) {}
    }

    console.log(`📊 [Analytics Event]: ${eventName}`, params);
  },

  /**
   * Beta Süreci Analitik & Kullanıcı Etkileşim Raporu Modalı
   */
  showAnalyticsModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    let events = [];
    let engagement = {};
    try {
      events = JSON.parse(localStorage.getItem(this.eventsKey) || '[]');
      engagement = JSON.parse(localStorage.getItem(this.engagementKey) || '{}');
    } catch(e) {}

    // Olay frekanslarını hesapla
    const eventCounts = {};
    events.forEach(e => {
      const key = e.event + (e.params?.mode_name ? ` (${e.params.mode_name})` : '');
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    });

    const screenLabels = {
      dashboard: 'Ana Ekran (Sayaç & Kartlar)',
      calendar: 'Takvim & Geçmiş',
      symptoms: 'Günlük & Semptom Ekleme',
      stats: 'Grafikler & İstatistikler',
      settings: 'Ayarlar & Profil'
    };

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto; padding-right: 4px; font-size: 0.84rem;">
        
        <div style="background: rgba(230, 160, 60, 0.08); border-left: 4px solid #e6a03c; padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; font-size: 0.78rem; line-height: 1.45;">
          📊 <strong>Firebase & Beta Kullanım Metrikleri:</strong><br>
          Kullanıcıların hangi modlara girdiği, hangi butonlara bastığı ve hangi ekranda kaç dakika vakit geçirdiği burada anlık olarak analiz edilir.
        </div>

        <!-- 1. Ekran Etkileşim Süreleri -->
        <div>
          <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
            ⏱️ Ekranlarda Geçirilen Toplam Süre
          </h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${Object.keys(engagement).length === 0 ? '<div style="color: var(--text-secondary); font-style: italic;">Henüz süre kaydı yok.</div>' : ''}
            ${Object.keys(engagement).map(scr => `
              <div style="display: flex; justify-content: space-between; background: var(--surface); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border);">
                <span>${screenLabels[scr] || scr}</span>
                <strong>${Math.floor(engagement[scr] / 60)} dk ${engagement[scr] % 60} sn</strong>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Tetiklenen Özel Olaylar (Custom Events) -->
        <div>
          <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">
            🎯 Tıklanan Butonlar & Tercih Edilen Modlar
          </h4>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${Object.keys(eventCounts).length === 0 ? '<div style="color: var(--text-secondary); font-style: italic;">Henüz tetiklenen olay yok.</div>' : ''}
            ${Object.keys(eventCounts).map(ev => `
              <div style="display: flex; justify-content: space-between; background: var(--surface); padding: 8px 12px; border-radius: var(--radius-md); border: 1px solid var(--border);">
                <span style="font-family: monospace; font-size: 0.8rem; color: #b87314;">${ev}</span>
                <span style="background: var(--bg-secondary); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 700;">${eventCounts[ev]} kez</span>
              </div>
            `).join('')}
          </div>
        </div>

        <button type="button" class="btn btn-secondary btn-block" id="btn-reset-analytics" style="margin-top: 4px; font-size: 0.78rem;">
          🔄 Metrikleri Sıfırla
        </button>

        <button type="button" class="btn btn-primary btn-block" onclick="hideModal()" style="padding: 10px; font-weight: 700;">
          Kapat ✨
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-reset-analytics')?.addEventListener('click', () => {
      localStorage.removeItem(this.eventsKey);
      localStorage.removeItem(this.engagementKey);
      App.Utils.showToast('Analitik metrikleri sıfırlandı 🔄', 'success');
      this.showAnalyticsModal();
    });

    showModal('📊 Beta Kullanım & Olay Analitiği');
  }
};

// Sayfa yüklendiğinde analitiği başlat
document.addEventListener('DOMContentLoaded', () => {
  if (window.App.Analytics) window.App.Analytics.init();
});
