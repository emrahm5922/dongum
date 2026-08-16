window.App = window.App || {};

/**
 * Akıllı Bildirim Sistemi (Native Android Notification Manager & Web Support)
 */
window.App.Notifications = {
  permissionState: 'default',
  HISTORY_KEY: 'dongum_notif_sent_history',

  _getPlugin() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        return window.Capacitor.Plugins.LocalNotifications;
      }
      if (window.Capacitor && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable('LocalNotifications')) {
        return window.Capacitor.Plugins.LocalNotifications;
      }
    } catch (e) {
      console.warn('[Notifications] Plugin lookup error:', e);
    }
    return null;
  },

  async init() {
    const plugin = this._getPlugin();
    if (plugin) {
      try {
        await plugin.createChannel({
          id: 'dongum_channel',
          name: 'Döngüm Bildirimleri',
          description: 'Regl ve sağlık döngüsü hatırlatıcıları',
          importance: 5,
          visibility: 1,
          vibration: true,
          sound: 'default'
        });
      } catch (e) {
        console.warn('[Notifications] Channel init error:', e);
      }
    } else if ('Notification' in window) {
      this.permissionState = Notification.permission;
    }
    this.checkAndNotify();
  },

  async requestPermission() {
    const plugin = this._getPlugin();
    if (plugin) {
      try {
        const res = await plugin.requestPermissions();
        this.permissionState = res.display;
        return res.display;
      } catch (err) {
        console.warn('[Notifications] Native permission error:', err);
      }
    }

    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permissionState = permission;
      return permission;
    } catch (error) {
      console.error('[Notifications] Web permission error:', error);
      return 'default';
    }
  },

  checkAndNotify() {
    if (!App.Cycle || !App.Data) return;
    const settings = App.Data.get('settings') || {};
    const notifSettings = settings.notifications || {};
    
    if (notifSettings.periodReminder === false && notifSettings.ovulationReminder === false) {
      return;
    }

    const cycleInfo = App.Cycle.getCycleInfo();
    if (!cycleInfo) return;

    const todayStr = App.Utils.toISODateString(new Date());
    const sentHistory = this._getHistory();

    // Önceki Ay Kıyaslama Bilgisi (Geçen ay erken/geç başlama veya uzama durumu)
    let prevMonthInsight = '';
    if (App.Data && App.Data.getPeriods) {
      let periods = App.Data.getPeriods() || [];
      periods = periods.slice().sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      if (periods.length >= 2) {
        const curDur = periods[0].days ? periods[0].days.length : 5;
        const prevDur = periods[1].days ? periods[1].days.length : 5;
        const diff = curDur - prevDur;
        
        if (diff > 0) {
          prevMonthInsight = ` (Geçen ay adetiniz ${diff} gün daha uzun sürmüştü).`;
        } else if (diff < 0) {
          prevMonthInsight = ` (Geçen ay adetiniz ${Math.abs(diff)} gün daha kısa sürmüştü).`;
        }
      }
    }

    // 1. İki Gün Kala Uyarısı (Akıllı Kıyaslamalı)
    if (notifSettings.periodReminder !== false && cycleInfo.daysUntilPeriod === 2) {
      const tag = `period_2_days_${todayStr}`;
      if (!sentHistory[tag]) {
        const bodyText = `2 gün sonra adet olmanız bekleniyor.${prevMonthInsight} Ped veya rahat kıyafetlerinizi hazırlamayı unutmayın 🩸🌸`;
        this.sendNotification(
          '🌸 Döngüm - Adet Yaklaşıyor',
          bodyText,
          tag,
          { action: 'dashboard' }
        );
        this._recordHistory(tag, todayStr);
      }
    }

    // 2. Bir Gün Kala Uyarısı
    if (notifSettings.periodReminder !== false && cycleInfo.daysUntilPeriod === 1) {
      const tag = `period_1_day_${todayStr}`;
      if (!sentHistory[tag]) {
        const bodyText = `Yarın adetinizin başlaması bekleniyor.${prevMonthInsight} Başladığında takvimden işaretleyebilirsiniz 🩸`;
        this.sendNotification(
          '🩸 Döngüm - Yarın Adet Günü',
          bodyText,
          tag,
          { action: 'dashboard' }
        );
        this._recordHistory(tag, todayStr);
      }
    }

    // 3. Regl Günü Uyarısı
    if (notifSettings.periodReminder !== false && cycleInfo.daysUntilPeriod === 0 && !cycleInfo.isLate) {
      const tag = `period_today_${todayStr}`;
      if (!sentHistory[tag]) {
        this.sendNotification(
          App.I18n.t('app.name') || 'Döngüm',
          App.I18n.t('notify.periodToday'),
          tag,
          { action: 'dashboard' }
        );
        this._recordHistory(tag, todayStr);
      }
    }

    // 4. Gecikme Uyarısı
    if (notifSettings.periodReminder !== false && cycleInfo.isLate) {
      const tag = `period_late_${cycleInfo.daysLate}_${todayStr}`;
      if (!sentHistory[tag]) {
        const bodyText = cycleInfo.daysLate === 1 
          ? App.I18n.t('notify.periodLate1') 
          : App.I18n.t('notify.periodLate', { days: cycleInfo.daysLate });
          
        this.sendNotification(
          App.I18n.t('app.name') || 'Döngüm',
          bodyText,
          tag,
          { action: 'dashboard' }
        );
        this._recordHistory(tag, todayStr);
      }
    }

    // 5. Yumurtlama Günü
    if (notifSettings.ovulationReminder !== false && cycleInfo.ovulationDay === todayStr) {
      const tag = `ovulation_today_${todayStr}`;
      if (!sentHistory[tag]) {
        this.sendNotification(
          App.I18n.t('app.name') || 'Döngüm',
          App.I18n.t('notify.ovulationDay') || 'Bugün en yüksek doğurganlık gününüz 🌸',
          tag,
          { action: 'calendar' }
        );
        this._recordHistory(tag, todayStr);
      }
    }

    // 6. Adet Uzaması / Bitmesi Gerekirken Bitmeme Uyarısı (Prolonged Period Alert)
    this.checkAndSendProlongedPeriodNotification();

    // 7. Moda ve Doğum Geçmişine Özel Bilimsel İpucu Bildirimi
    this.checkAndSendEducationalTip();

    // 8. Hamilelik & Haftalık Bebek Gelişimi Bildirimi
    if (userGoal === 'ttc') {
      this.checkAndSendWeeklyPregnancyNotification();
    }
  },

  /**
   * Adet Süresi Normalden Uzun Sürdüğünde veya Bitmesi Gerekirken Bitmediğinde Gönderilen Akıllı Uyarı
   */
  checkAndSendProlongedPeriodNotification() {
    if (!App.Data || !App.Cycle) return;
    const todayStr = App.Utils.toISODateString(new Date());
    const sentHistory = this._getHistory();

    const activePeriod = App.Data.getCurrentPeriod ? App.Data.getCurrentPeriod() : null;
    const settings = App.Data.get('settings') || {};
    const expectedPeriodLength = settings.periodLength || 5;

    if (activePeriod && activePeriod.days && activePeriod.days.length > expectedPeriodLength) {
      const currentDaysCount = activePeriod.days.length;
      const tag = `prolonged_period_${currentDaysCount}_${todayStr}`;

      if (!sentHistory[tag]) {
        const title = '🩸 Adet Süresi Hatırlatması';
        const body = `Adetiniz ${currentDaysCount}. gününde devam ediyor görünüyor. Bittiğinde takvimden işaretlemeyi veya kanama devam ediyorsa sağlığınız için doktorunuza danışmayı unutmayın 🩺🌸`;

        this.sendNotification(title, body, tag, { action: 'calendar' });
        this._recordHistory(tag, todayStr);
      }
    }
  },

  /**
   * Haftalık Bebek Gelişimi ve Meyve Karşılaştırmalı Özel Bildirim
   */
  checkAndSendWeeklyPregnancyNotification() {
    if (!App.Data) return;
    const settings = App.Data.get('settings') || {};
    const notifSettings = settings.notifications || {};
    if (notifSettings.healthTips === false) return;

    const currentWeek = parseInt(localStorage.getItem('pregnancy_current_week') || '12', 10);
    const todayStr = App.Utils.toISODateString(new Date());
    const sentHistory = this._getHistory();
    const tag = `preg_week_${currentWeek}_${todayStr}`;

    if (sentHistory[tag]) return;

    let weekData = { fruit: 'Misket Limonu 🍋', size: '5.4 cm', weight: '14 gr', desc: 'Refleksler gelişti, 1. Trimester tamamlanıyor!' };
    if (App.Pregnancy && App.Pregnancy.getWeekData) {
      weekData = App.Pregnancy.getWeekData(currentWeek);
    }

    const title = `🌱 Bebeğin Bu Hafta Bir ${weekData.fruit} Boyutunda!`;
    const body = `${currentWeek}. Hafta: ${weekData.desc} (Boy: ${weekData.size}, Kilo: ${weekData.weight}) ✨`;

    this.sendNotification(title, body, tag, { action: 'dashboard' });
    this._recordHistory(tag, todayStr);
  },

  /**
   * Kullanıcının Seçtiği Mod ve Doğum Geçmişine Göre Bilimsel İpuçlarını Bildirim Olarak Gönderir
   */
  checkAndSendEducationalTip() {
    if (!App.Data) return;
    const settings = App.Data.get('settings') || {};
    const notifSettings = settings.notifications || {};
    if (notifSettings.healthTips === false) return;

    const userGoal = settings.userGoal || 'track';
    const userBirth = settings.userBirth || 'no';
    const lastBirthYears = settings.lastBirthYears || '1_2_years';
    const userAge = settings.userAge || 25;
    const todayStr = App.Utils.toISODateString(new Date());
    const sentHistory = this._getHistory();
    const tag = `edu_tip_${todayStr}`;

    if (sentHistory[tag]) return;

    let tipTitle = '💡 Günün Bilimsel İpucu';
    let tipBody = '';

    if (userGoal === 'ttc') {
      tipTitle = '👶 Bebek Planlama - Bilimsel İpucu';
      if (userBirth === 'yes') {
        if (lastBirthYears === 'under_1') {
          tipBody = '🍼 Emzirme sıklığı azaldıkça prolaktin düşer ve yumurtlama döngüsü hızla geri döner. Demir ve D vitamini değerlerinizi kontrol ettirmeyi unutmayın ✨';
        } else if (lastBirthYears === '1_2_years') {
          tipBody = '🌿 Altın Doğurganlık Dönemi: Doğumdan 1-2 yıl sonrası vücudun en verimli zamanıdır. LH zirvesinden önceki 48 saat en yüksek gebelik şansını sunar ✨';
        } else {
          tipBody = '🌸 Günlük 400 mcg folik asit ve Koenzim Q10 antioksidan desteği yumurta kalitesini korur. Bazal vücut ısınızı kaydetmeyi unutmayın 🌡️';
        }
      } else {
        tipBody = '🌟 Sperm rahimde 3-5 gün yaşarken yumurta 24 saat yaşar. Yumurta akı kıvamındaki akıntı günlerinde birliktelik şansı 3 kat artırır ❤️';
      }
    } else if (userGoal === 'prevent') {
      tipTitle = '🛡️ Doğurganlık & Korunma Hatırlatması';
      tipBody = 'Yumurtlama penceresinde doğurganlık ihtimali zirvededir. Güvenliğiniz için korunma yöntemlerinizi ve günlük hapınızı aksatmayın 💊';
    } else {
      tipTitle = '🌸 Sağlık & Sancı Yönetimi';
      if (userAge <= 21) {
        tipBody = '🩺 Genç yaş grubunda prostaglandin krampları artırabilir; sıcak su torbası ve magnezyum zengini besinler rahmi çok hızlı rahatlatır ☕';
      } else {
        tipBody = '🌸 Adet öncesi ödem ve tatlı krizlerine karşı papatya çayı ve bol su içmek hormon dengenizi korur 💧';
      }
    }

    this.sendNotification(tipTitle, tipBody, tag, { action: 'dashboard' });
    this._recordHistory(tag, todayStr);
  },

  async sendNotification(title, body, tag, data = {}) {
    const plugin = this._getPlugin();

    // 1. Android Yerel Bildirim (Telefonda üst bildirim çubuğunda anında açılır)
    if (plugin) {
      try {
        const permStatus = await plugin.checkPermissions();
        if (permStatus.display !== 'granted') {
          const req = await plugin.requestPermissions();
          if (req.display !== 'granted') {
            if (App.Utils && App.Utils.showToast) {
              App.Utils.showToast('Lütfen telefon ayarlarından bildirimlere izin verin ⚠️', 'warning');
            }
            return;
          }
        }

        const notifId = Math.floor(Math.random() * 900000) + 100000;
        await plugin.schedule({
          notifications: [{
            id: notifId,
            title: title,
            body: body,
            channelId: 'dongum_channel',
            smallIcon: 'ic_stat_icon',
            iconColor: '#D4556B',
            extra: data
          }]
        });
        console.log('[Notifications] Native notification scheduled successfully:', notifId);
        return;
      } catch (err) {
        console.warn('[Notifications] Native schedule error:', err);
      }
    }

    // 2. Web Notification API (Tarayıcı ortamı için)
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker && navigator.serviceWorker.controller) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body: body,
            icon: './icon.jpg',
            badge: './icon.jpg',
            tag: tag,
            vibrate: [200, 100, 200],
            data: data
          });
        } else {
          new Notification(title, {
            body: body,
            icon: './icon.jpg',
            tag: tag
          });
        }
      } catch (err) {
        console.warn('[Notifications] Web notification error:', err);
      }
    }
  },

  _getHistory() {
    try {
      return JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '{}');
    } catch {
      return {};
    }
  },

  _recordHistory(tag, dateStr) {
    try {
      const history = this._getHistory();
      history[tag] = dateStr;
      localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save notification history:', e);
    }
  },

  /**
   * Test Butonuna Basıldığında Telefonun Üst Çubuğuna Moda Özel Bildirim Fırlatır
   */
  async sendTestNotification() {
    const isTr = (App.I18n && App.I18n.getLang() === 'tr');
    const settings = (App.Data && App.Data.get('settings')) || {};
    const userGoal = settings.userGoal || 'track';

    let title = '🌸 Döngüm - Sağlık & Sancı';
    let body = 'Regl ve sancı yönetimi hatırlatıcıları aktif! PMS ve adet günlerinde sana destek olacağız ☕✨';

    if (userGoal === 'ttc') {
      const currentWeek = parseInt(localStorage.getItem('pregnancy_current_week') || '12', 10);
      let weekData = { fruit: 'Misket Limonu 🍋', size: '5.4 cm', weight: '14 gr', desc: 'Refleksler gelişti, 1. Trimester tamamlanıyor!' };
      if (App.Pregnancy && App.Pregnancy.getWeekData) {
        weekData = App.Pregnancy.getWeekData(currentWeek);
      }
      title = `🌱 Bebeğin Bu Hafta Bir ${weekData.fruit} Boyutunda!`;
      body = `${currentWeek}. Hafta: ${weekData.desc} (Boy: ${weekData.size}, Kilo: ${weekData.weight}) ✨`;
    } else if (userGoal === 'prevent') {
      title = '🛡️ Döngüm - Doğurganlık & Korunma';
      body = 'Korunma takibi aktif! Yüksek riskli günlerde ve doğum kontrol saatinde bildirim alacaksın 💊🛡️';
    }

    if (!isTr) {
      title = '🌸 Döngüm Cycle Tracker';
      body = 'Notifications are working properly. We will keep you updated according to your personal health goal ✨';
    }

    await this.sendNotification(title, body, `test_notif_${Date.now()}`, { action: 'dashboard' });

    if (App.Utils && App.Utils.showToast) {
      App.Utils.showToast(isTr ? 'Bildirim telefonunuzun üst çubuğuna gönderildi! 🔔' : 'Notification sent to your phone! 🔔', 'success', 3000);
    }
  },

  scheduleAll() {
    this.checkAndNotify();
  },

  destroy() {}
};
