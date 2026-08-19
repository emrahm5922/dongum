// js/app.js — Ana Uygulama Kontrolcüsü
// Tüm modülleri koordine eder: router, state yönetimi, ekran geçişleri

window.App = window.App || {};

window.App.Main = (() => {
  'use strict';

  // ================================
  // STATE
  // ================================
  let currentScreen = 'dashboard';
  let previousScreen = null;
  let isInitialized = false;

  // ================================
  // INITIALIZATION
  // ================================
  function init() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('[Döngüm] Uygulama başlatılıyor...');

    // Veri katmanını yükle
    App.Data.load();

    // Dil ayarını uygula
    const lang = App.Data.get('settings.language') || 'tr';
    App.I18n.setLang(lang);
    document.documentElement.lang = lang;

    // Tema ayarını uygula
    const savedTheme = App.Data.get('settings.theme') || (App.Data.get('settings.darkMode') ? 'dark' : 'rose');
    applyTheme(savedTheme);

    // Service Worker kayıt
    registerServiceWorker();

    // Onboarding kontrolü
    if (!App.Data.isOnboardingComplete()) {
      showOnboarding();
    } else if (App.Data.get('settings.pinEnabled') && App.Data.get('settings.pinHash')) {
      showPinLock();
    } else {
      showApp();
    }

    // Bildirim kontrolü (uygulama açıldığında)
    if (App.Data.isOnboardingComplete()) {
      setTimeout(() => {
        if (App.Notifications && App.Notifications.checkAndNotify) {
          App.Notifications.checkAndNotify();
        }
      }, 2000);
    }

    // Service Worker mesajlarını dinle
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'NAVIGATE') {
          navigateTo(event.data.action || 'dashboard');
        }
        if (event.data.type === 'CHECK_NOTIFICATIONS') {
          if (App.Notifications && App.Notifications.checkAndNotify) {
            App.Notifications.checkAndNotify();
          }
        }
      });
    }

    // Belirti / Günlük güncellendiğinde Ana Sayfayı anında otomatik yenile
    window.addEventListener('app:symptoms-updated', () => {
      renderDashboard();
    });
  }

  // ================================
  // SERVICE WORKER
  // ================================
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker kayıtlı:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] Service Worker kaydı başarısız:', err);
        });
    }
  }

  // ================================
  // THEME (6 Farklı Canlı Tema Paleti)
  // ================================
  function applyTheme(themeNameOrIsDark) {
    let theme = 'rose';
    if (typeof themeNameOrIsDark === 'boolean') {
      theme = themeNameOrIsDark ? 'dark' : (App.Data.get('settings.theme') || 'rose');
    } else if (typeof themeNameOrIsDark === 'string' && themeNameOrIsDark) {
      theme = themeNameOrIsDark;
    } else {
      theme = App.Data.get('settings.theme') || (App.Data.get('settings.darkMode') ? 'dark' : 'rose');
    }

    document.documentElement.setAttribute('data-theme', theme);
    App.Data.set('settings.theme', theme);
    App.Data.set('settings.darkMode', theme === 'dark');

    const themeColors = {
      rose: '#E84D72',
      lavender: '#9A62C6',
      peach: '#EA6036',
      sage: '#448A5E',
      classic: '#D4556B',
      dark: '#141424'
    };
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = themeColors[theme] || '#E84D72';
    }

    // Swatch butonlarını aktif hale getir
    document.querySelectorAll('.theme-swatch-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
  }

  // ================================
  // ONBOARDING
  // ================================
  function showOnboarding() {
    const screen = document.getElementById('onboarding-screen');
    const app = document.getElementById('app');
    const pin = document.getElementById('pin-screen');
    
    if (pin) pin.style.display = 'none';
    if (app) app.style.display = 'none';
    if (screen) screen.style.display = 'flex';

    populateOnboardingTexts();
    initOnboardingEvents();
  }

  function populateOnboardingTexts() {
    const t = App.I18n.t.bind(App.I18n);

    setText('onboard-welcome-title', t('onboarding.welcomeTitle'));
    setText('onboard-welcome-subtitle', t('onboarding.welcomeSubtitle'));
    setText('onboard-start-btn', t('onboarding.getStarted'));
    
    setText('onboard-period-title', t('onboarding.lastPeriodTitle'));
    setText('onboard-period-desc', t('onboarding.lastPeriodDesc'));
    setText('onboard-back-1', t('general.back'));
    setText('onboard-next-1', t('general.next'));
    
    setText('onboard-cycle-title', t('onboarding.cycleLengthTitle'));
    setText('onboard-cycle-label', t('settings.avgCycleLength'));
    setText('onboard-cycle-unit', t('general.days'));
    setText('onboard-cycle-avg', t('onboarding.average'));
    setText('onboard-period-label', t('settings.avgPeriodLength'));
    setText('onboard-period-unit', t('general.days'));
    setText('onboard-period-avg', t('onboarding.average'));
    setText('onboard-back-2', t('general.back'));
    setText('onboard-next-2', t('general.next'));
    
    setText('onboard-pin-title', t('onboarding.pinTitle'));
    setText('onboard-pin-desc', t('onboarding.pinDesc'));
    setText('onboard-set-pin', t('onboarding.setPin'));
    setText('onboard-skip-pin', t('onboarding.skipPin'));

    // Tarih inputu için bugünü maks olarak ayarla
    const dateInput = document.getElementById('onboard-last-period');
    if (dateInput) {
      const today = App.Utils.toISODateString(new Date());
      dateInput.max = today;
      dateInput.value = ''; // Kullanıcının kendi gerçek tarihini seçmesini zorunlu kıl
    }
  }

  let onboardStep = 0;

  function initOnboardingEvents() {
    // Adım 0: Başla -> Adım 1 (Profil & Kişiselleştirme)
    addClick('onboard-start-btn', () => goToOnboardStep(1));

    // Adım 1: Profil & Kişiselleştirme -> Adım 2 (Son Adet Tarihi)
    addClick('onboard-back-profile', () => goToOnboardStep(0));
    addClick('onboard-next-profile', () => goToOnboardStep(2));

    // Adım 1: Profil (Doğum Yapıldıysa Doğum Yılı Açılır)
    const onboardBirth = document.getElementById('onboard-user-birth');
    const onboardBirthGroup = document.getElementById('onboard-birth-year-group');
    if (onboardBirth && onboardBirthGroup) {
      onboardBirth.addEventListener('change', (e) => {
        onboardBirthGroup.style.display = (e.target.value === 'yes') ? 'block' : 'none';
      });
    }

    // Adım 2: Son adet tarihi -> Adım 3 (Döngü süreleri)
    addClick('onboard-back-period', () => goToOnboardStep(1));
    addClick('onboard-next-period', () => {
      const dateInput = document.getElementById('onboard-last-period');
      if (!dateInput || !dateInput.value) {
        App.Utils.showToast(App.I18n.t('onboarding.selectDate'), 'warning');
        return;
      }
      goToOnboardStep(3);
    });

    // Adım 3: Döngü süreleri -> Adım 4 (PIN)
    addClick('onboard-back-cycle', () => goToOnboardStep(2));
    addClick('onboard-next-cycle', () => goToOnboardStep(4));

    // Döngü range sliderları
    const cycleRange = document.getElementById('onboard-cycle-length');
    const periodRange = document.getElementById('onboard-period-length');
    
    if (cycleRange) {
      cycleRange.addEventListener('input', (e) => {
        setText('onboard-cycle-value', e.target.value);
      });
    }
    if (periodRange) {
      periodRange.addEventListener('input', (e) => {
        setText('onboard-period-value', e.target.value);
      });
    }

    // Adım 4: PIN
    addClick('onboard-set-pin', () => {
      showPinSetup(() => {
        completeOnboarding();
      });
    });
    addClick('onboard-skip-pin', () => {
      completeOnboarding();
    });
  }

  function goToOnboardStep(step) {
    // Önceki adımı gizle
    const prevStep = document.querySelector(`.onboarding-step.active`);
    if (prevStep) {
      prevStep.classList.remove('active');
      prevStep.style.display = 'none';
    }

    // Yeni adımı göster
    const nextStep = document.getElementById(`onboard-step-${step}`);
    if (nextStep) {
      nextStep.style.display = 'flex';
      requestAnimationFrame(() => {
        nextStep.classList.add('active');
      });
    }

    // Step dotları güncelle
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i <= step);
      dot.classList.toggle('current', i === step);
    });

    onboardStep = step;
  }

  function completeOnboarding() {
    const nameInput = document.getElementById('onboard-user-name');
    const ageInput = document.getElementById('onboard-user-age');
    const goalInput = document.getElementById('onboard-user-goal');
    const maritalInput = document.getElementById('onboard-user-marital');
    const birthInput = document.getElementById('onboard-user-birth');
    const birthYearsInput = document.getElementById('onboard-user-birth-years');

    const dateInput = document.getElementById('onboard-last-period');
    const cycleRange = document.getElementById('onboard-cycle-length');
    const periodRange = document.getElementById('onboard-period-length');

    // Profil bilgilerini kaydet
    if (nameInput && nameInput.value.trim()) App.Data.set('settings.userName', nameInput.value.trim());
    if (ageInput) App.Data.set('settings.userAge', parseInt(ageInput.value, 10) || 25);
    if (goalInput) App.Data.set('settings.userGoal', goalInput.value || 'track');
    if (maritalInput) App.Data.set('settings.userMarital', maritalInput.value || 'single');
    if (birthInput) App.Data.set('settings.userBirth', birthInput.value || 'no');
    if (birthYearsInput) App.Data.set('settings.lastBirthYears', birthYearsInput.value || '1_2_years');

    // Döngü verilerini kaydet
    if (dateInput && dateInput.value) {
      App.Data.set('settings.lastPeriodStart', dateInput.value);
      
      // İlk adet kaydını oluştur
      const periodLength = periodRange ? parseInt(periodRange.value) : 5;
      const startDate = dateInput.value;
      const days = [];
      for (let i = 0; i < periodLength; i++) {
        days.push(App.Utils.toISODateString(App.Utils.addDays(App.Utils.parseDate(startDate), i)));
      }
      const endDate = days[days.length - 1];
      
      App.Data.addPeriod(startDate);
      const lastPeriod = App.Data.getLastPeriod();
      if (lastPeriod) {
        days.forEach(day => {
          if (!lastPeriod.days.includes(day)) {
            App.Data.togglePeriodDay(day);
          }
        });
        App.Data.endPeriod(lastPeriod.id, endDate);
      }
    }

    if (cycleRange) {
      App.Data.set('settings.avgCycleLength', parseInt(cycleRange.value));
    }
    if (periodRange) {
      App.Data.set('settings.avgPeriodLength', parseInt(periodRange.value));
    }

    App.Data.set('settings.onboardingComplete', true);

    // Bildirim izni iste
    if (App.Notifications && App.Notifications.requestPermission) {
      App.Notifications.requestPermission();
    }

    showApp();
  }

  // ================================
  // PIN LOCK
  // ================================
  function showPinLock() {
    const screen = document.getElementById('pin-screen');
    const app = document.getElementById('app');
    const onboarding = document.getElementById('onboarding-screen');
    
    if (onboarding) onboarding.style.display = 'none';
    if (app) app.style.display = 'none';
    if (screen) screen.style.display = 'flex';

    if (App.Pin && App.Pin.render) {
      App.Pin.render(document.getElementById('pin-screen'), 'unlock', (success) => {
        if (success) {
          showApp();
        }
      });
    }
  }

  function showPinSetup(callback, onCancel) {
    const screen = document.getElementById('pin-screen');
    if (screen) screen.style.display = 'flex';

    if (App.Pin && App.Pin.render) {
      App.Pin.render(screen, 'set', (pin) => {
        if (pin) {
          screen.style.display = 'none';
          if (callback) callback(pin);
        }
      }, () => {
        if (onCancel) onCancel();
      });
    }
  }

  // ================================
  // MAIN APP
  // ================================
  function showApp() {
    const screen = document.getElementById('pin-screen');
    const onboarding = document.getElementById('onboarding-screen');
    const app = document.getElementById('app');

    if (screen) screen.style.display = 'none';
    if (onboarding) onboarding.style.display = 'none';
    if (app) {
      app.style.display = 'flex';
      app.classList.add('fade-in');
    }

    populateAppTexts();
    initNavigation();
    initSettingsEvents();
    navigateTo('dashboard');
  }

  // ================================
  // NAVIGATION
  // ================================
  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const screen = item.dataset.screen;
        if (screen) navigateTo(screen);
      });
    });

    // Geri butonu
    addClick('header-back', () => {
      if (previousScreen) {
        navigateTo(previousScreen);
      }
    });

    // Sağ üst zil / çan (Bildirim Merkezi) butonu
    addClick('header-notification', () => {
      if (App.Notifications && App.Notifications.openNotificationCenterModal) {
        App.Notifications.openNotificationCenterModal();
      }
    });
  }

  function navigateTo(screenName) {
    if (screenName === currentScreen && screenName !== 'dashboard') return;

    previousScreen = currentScreen;
    currentScreen = screenName;

    // Tüm ekranları gizle
    document.querySelectorAll('.screen').forEach(s => {
      s.style.display = 'none';
    });

    // Hedef ekranı göster
    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
      target.style.display = 'block';
      target.classList.add('fade-in');
      // Animasyon bitince sınıfı kaldır
      setTimeout(() => target.classList.remove('fade-in'), 300);
    }

    // Nav durumunu güncelle
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.screen === screenName);
    });

    // Başlığı güncelle
    updateHeader(screenName);

    // Ekrana özel render
    renderScreen(screenName);

    // Ekran analitik takibi
    if (window.App.Analytics && window.App.Analytics.trackScreen) {
      window.App.Analytics.trackScreen(screenName);
    }
  }

  function updateHeader(screenName) {
    const t = App.I18n.t.bind(App.I18n);
    const backBtn = document.getElementById('header-back');
    const headerUserName = document.getElementById('header-user-name');
    
    const titles = {
      dashboard: 'Döngüm',
      calendar: t('nav.calendar'),
      symptoms: t('nav.symptoms'),
      stats: t('nav.stats'),
      settings: t('nav.settings')
    };

    updateProfileHeaderAndHero();

    if (screenName === 'dashboard') {
      const profile = (App.Data && App.Data.getUserProfile) ? App.Data.getUserProfile() : {};
      if (headerUserName) {
        headerUserName.textContent = profile.name ? `${profile.name} 🌸` : 'Döngüm';
      }
    } else {
      if (headerUserName) {
        headerUserName.textContent = titles[screenName] || 'Döngüm';
      }
    }
    
    // Geri butonunu göster/gizle (dashboard hariç)
    if (backBtn) {
      backBtn.style.display = (screenName !== 'dashboard') ? 'flex' : 'none';
    }
  }

  function renderScreen(screenName) {
    switch (screenName) {
      case 'dashboard':
        renderDashboard();
        break;
      case 'calendar':
        if (App.Calendar && App.Calendar.render) {
          App.Calendar.render(document.getElementById('calendar-container'));
        }
        break;
      case 'symptoms':
        if (App.Symptoms && App.Symptoms.render) {
          App.Symptoms.render(document.getElementById('symptoms-container'));
        }
        break;
      case 'stats':
        if (App.Stats && App.Stats.render) {
          App.Stats.render(document.getElementById('stats-container'));
        }
        break;
      case 'settings':
        renderSettings();
        break;
    }
  }

  // ================================
  // DASHBOARD (3-MODLU DİNAMİK SAĞLIK MERKEZİ)
  // ================================
  function renderDashboard() {
    const t = App.I18n.t.bind(App.I18n);
    const cycleInfo = App.Cycle.getCycleInfo();
    const settings = App.Data.get('settings') || {};
    const userGoal = settings.userGoal || 'track';

    // 1. Aktif Mod Başlık Bandı (Mode Banner)
    const modeBanner = document.getElementById('dashboard-mode-banner');
    if (modeBanner) {
      modeBanner.className = `dashboard-mode-banner mode-${userGoal}`;
      const modeConfigs = {
        track: { icon: '🌸', text: 'Sancı & Genel Sağlık Modu', desc: 'Döngü ve Ağrı Yönetimi' },
        ttc: { icon: '👶', text: 'Bebek Planlama Modu', desc: 'Doğurganlık & Yumurtlama' },
        prevent: { icon: '🛡️', text: 'Doğurganlık & Korunma Modu', desc: 'Risk & Korunma Takibi' }
      };
      const cfg = modeConfigs[userGoal] || modeConfigs.track;
      modeBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">${cfg.icon}</span>
          <div>
            <div style="font-weight: 700;">${cfg.text}</div>
            <div style="font-size: 0.72rem; color: var(--text-secondary);">${cfg.desc}</div>
          </div>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" id="btn-switch-goal" style="font-size: 0.75rem; padding: 4px 8px;">
          Değiştir ⚙️
        </button>
      `;

      modeBanner.querySelector('#btn-switch-goal')?.addEventListener('click', () => {
        navigateTo('settings');
      });
    }

    // 0. Tarih Bandı (Date Ribbon matching Image 1)
    const dateRibbon = document.getElementById('dashboard-date-ribbon');
    if (dateRibbon) {
      const now = new Date();
      const trDays = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      const trMonths = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
      dateRibbon.textContent = `${trDays[now.getDay()]} ${now.getDate()} ${trMonths[now.getMonth()]} ${now.getFullYear()}`;
    }

    // 0.05 Döngü Kıyaslama ve Kalan Gün Şeridi
    const compRibbon = document.getElementById('dashboard-comparison-ribbon');
    if (compRibbon && cycleInfo) {
      let periods = App.Data.getPeriods ? App.Data.getPeriods() : [];
      periods = periods.slice().sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

      let diffBadge = '';
      let diffText = '';

      if (periods.length >= 2) {
        const curDur = periods[0].days ? periods[0].days.length : 5;
        const prevDur = periods[1].days ? periods[1].days.length : 5;
        const diff = curDur - prevDur;

        if (diff === 0) {
          diffBadge = `<span style="background: rgba(91, 154, 111, 0.15); color: var(--accent-fertile); padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700;">🟢 Eşit Süre</span>`;
          diffText = `Son adetiniz geçen ayla aynı sürede (${curDur} gün) tamamlandı.`;
        } else if (diff > 0) {
          diffBadge = `<span style="background: rgba(230, 160, 60, 0.15); color: #b87314; padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700;">📈 +${diff} Gün Daha Uzun</span>`;
          diffText = `Son adetiniz önceki aya göre <strong>${diff} gün daha uzun</strong> sürdü (${curDur} gün vs ${prevDur} gün).`;
        } else {
          diffBadge = `<span style="background: rgba(91, 154, 111, 0.15); color: var(--accent-fertile); padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 700;">📉 ${Math.abs(diff)} Gün Daha Kısa</span>`;
          diffText = `Son adetiniz önceki aya göre <strong>${Math.abs(diff)} gün daha kısa</strong> tamamlandı (${curDur} gün vs ${prevDur} gün).`;
        }
      }

      const todayStr = App.Utils ? App.Utils.toISODateString(new Date()) : '';
      const isPeriodToday = App.Cycle.classifyDate(todayStr).isPeriod;

      let countdownTitle = '';
      if (userGoal === 'ttc') {
        // 👶 BEBEK PLANLAMA MODU: Yumurtlama & Doğurganlık Odaklı Sayaç
        let daysToOv = null;
        if (cycleInfo.ovulationDay) {
          const ovDate = App.Utils.parseDate(cycleInfo.ovulationDay);
          daysToOv = App.Utils.diffDays(ovDate, new Date());
        }

        if (daysToOv === 0) {
          countdownTitle = `🌟 <strong>Bugün Zirve Yumurtlama Günü</strong> (%95 En Yüksek Şans)`;
        } else if (cycleInfo.isFertileWindow) {
          countdownTitle = `🌸 <strong>Doğurganlık Penceresindesiniz</strong> (%70-85 Yüksek İhtimal)`;
        } else if (daysToOv != null && daysToOv > 0) {
          countdownTitle = `🌟 Zirve Yumurtlamaya <strong>${daysToOv} Gün Kaldı</strong>`;
        } else {
          countdownTitle = `🌱 <strong>Yumurtlama Tamamlandı</strong> (Yerleşme & Döllenme Evresi)`;
        }
      } else if (userGoal === 'prevent') {
        // 🛡️ KORUNMA MODU: Risk & Koruma Odaklı Sayaç
        if (cycleInfo.isFertileWindow) {
          countdownTitle = `⚠️ <strong>Yüksek Hamilelik Riski</strong> (Korunmasız İlişkiden Kaçının)`;
        } else {
          countdownTitle = `🛡️ <strong>Güvenli Dönemdesiniz</strong> (Düşük Hamilelik Riski)`;
        }
      } else {
        // 🌸 SANCI & GENEL SAĞLIK MODU: Regl Geri Sayımı
        if (cycleInfo.isLate) {
          countdownTitle = `⚠️ Adetiniz <strong>${cycleInfo.daysLate} Gün Gecikti</strong>`;
        } else if (isPeriodToday) {
          countdownTitle = `🩸 <strong>Regl Dönemindesiniz</strong> (Bugün Kanama Günü)`;
        } else if (cycleInfo.daysUntilPeriod != null) {
          countdownTitle = `⏳ Sonraki Regle <strong>${cycleInfo.daysUntilPeriod} Gün Kaldı</strong>`;
        }
      }

      if (countdownTitle || diffText) {
        compRibbon.style.display = 'flex';
        compRibbon.innerHTML = `
          <div class="dashboard-comparison-header">
            <span>${countdownTitle || '🌸 Döngü Durumu'}</span>
            ${diffBadge}
          </div>
          ${diffText ? `<div class="dashboard-comparison-desc">💡 ${diffText}</div>` : ''}
        `;
      } else {
        compRibbon.style.display = 'none';
      }
    }

    // 0.1 Merkezdeki Periyot Başlat/Bitir Butonu
    const centerBtn = document.getElementById('btn-center-period-toggle');
    const todayStr = App.Utils.toISODateString(new Date());
    const isTodayPeriod = App.Cycle.classifyDate(todayStr).isPeriod;

    if (centerBtn) {
      centerBtn.innerHTML = isTodayPeriod ? '✓ Periyot Bitti' : '🩸 Periyot Başlangıcı';
      centerBtn.classList.toggle('active', isTodayPeriod);
      centerBtn.onclick = () => {
        if (App.Calendar && App.Calendar.togglePeriodDay) {
          App.Calendar.togglePeriodDay(todayStr);
        } else {
          App.Data.togglePeriodDay(todayStr);
          renderDashboard();
        }
      };
    }

    if (!cycleInfo || !cycleInfo.cycleDay) {
      setText('cycle-day-number', '--');
      setText('cycle-day-label', t('dashboard.noCycleData'));
      setText('cycle-phase-name', '');
      return;
    }

    // 2. Döngü Çemberi Metinleri (Moda Göre Özelleştirilmiş)
    const dayNumber = cycleInfo.cycleDay;
    const totalDays = cycleInfo.totalDays || 28;
    const progress = Math.min(dayNumber / totalDays, 1);

    // 0.2 Boncuklu Halka / Pearl Beads (Matching Image 1)
    const phasesGroup = document.getElementById('cycle-ring-phases');
    if (phasesGroup && cycleInfo) {
      let beadsHtml = '';
      const totalBeads = totalDays || 28;
      const radius = 100;
      const center = 120;

      for (let b = 1; b <= totalBeads; b++) {
        const beadAngle = ((b - 1) / totalBeads) * 360 - 90;
        const beadRad = (beadAngle * Math.PI) / 180;
        const bx = center + radius * Math.cos(beadRad);
        const by = center + radius * Math.sin(beadRad);

        const isPeriodBead = b <= (cycleInfo.periodLength || 5);
        const isOvulationBead = b === (cycleInfo.ovulationDay || 14);
        const isFertileBead = (b >= (cycleInfo.ovulationDay - 4) && b <= (cycleInfo.ovulationDay + 1));
        const isCurrentDayBead = b === dayNumber;

        if (isPeriodBead) {
          // Coral solid pearl
          beadsHtml += `<circle cx="${bx}" cy="${by}" r="${isCurrentDayBead ? 9 : 7}" fill="#E57373" stroke="#ffffff" stroke-width="1.5" />`;
        } else if (isOvulationBead || isFertileBead) {
          // Purple petal/flower symbol
          beadsHtml += `<text x="${bx}" y="${by + 4}" font-size="${isCurrentDayBead ? 14 : 11}" text-anchor="middle" fill="#8E44AD">🌸</text>`;
        } else {
          // Soft grey pearl
          beadsHtml += `<circle cx="${bx}" cy="${by}" r="${isCurrentDayBead ? 8 : 6}" fill="#D5D8DC" stroke="#ffffff" stroke-width="1.2" />`;
        }
      }
      phasesGroup.innerHTML = beadsHtml;
    }

    // 2. Döngü Çemberi Metinleri (Geri Sayım vs Döngü Günü Geçişi)
    const centerMode = localStorage.getItem('dongum_center_mode') || 'countdown';

    if (userGoal === 'ttc') {
      let daysToOv = null;
      if (cycleInfo.ovulationDay) {
        const ovDate = App.Utils.parseDate(cycleInfo.ovulationDay);
        daysToOv = App.Utils.diffDays(ovDate, new Date());
      }

      if (daysToOv === 0) {
        setText('cycle-day-number', 'ZİRVE 🌟');
        setText('cycle-day-label', 'Yumurtlama Günü');
        setText('cycle-day-toggle-hint', `(En Yüksek Doğurganlık %95)`);
      } else if (cycleInfo.isFertileWindow) {
        setText('cycle-day-number', 'YÜKSEK 🌸');
        setText('cycle-day-label', 'Doğurganlık Penceresi');
        setText('cycle-day-toggle-hint', `(Gebe Kalma Şansı %70-85)`);
      } else if (centerMode === 'countdown') {
        if (daysToOv != null && daysToOv > 0) {
          setText('cycle-day-number', `${daysToOv} Gün 🌟`);
          setText('cycle-day-label', 'Yumurtlamaya Kalan');
          setText('cycle-day-toggle-hint', `(Döngü gününe geçmek için dokun 🌸)`);
        } else {
          setText('cycle-day-number', `${cycleInfo.daysUntilPeriod || dayNumber} Gün ⏳`);
          setText('cycle-day-label', 'Sonraki Döngüye');
          setText('cycle-day-toggle-hint', `(Döngü gününe geçmek için dokun 🌸)`);
        }
      } else {
        setText('cycle-day-number', `${dayNumber}. Gün 🌸`);
        setText('cycle-day-label', 'Döngü Aşaması');
        setText('cycle-day-toggle-hint', `(Yumurtlama sayacına geçmek için dokun 🌟)`);
      }
    } else if (userGoal === 'prevent') {
      if (cycleInfo.isFertileWindow) {
        setText('cycle-day-number', 'RİSK ⚠️');
        setText('cycle-day-label', 'Yüksek Hamilelik Riski');
        setText('cycle-day-toggle-hint', `(Korunmasız birliktelikten kaçının)`);
      } else if (centerMode === 'countdown') {
        setText('cycle-day-number', 'GÜVENLİ 🛡️');
        setText('cycle-day-label', 'Düşük Hamilelik Riski');
        setText('cycle-day-toggle-hint', `(Döngü gününe geçmek için dokun 🌸)`);
      } else {
        setText('cycle-day-number', `${dayNumber}. Gün 🌸`);
        setText('cycle-day-label', 'Döngü Aşaması');
        setText('cycle-day-toggle-hint', `(Korunma durumuna geçmek için dokun 🛡️)`);
      }
    } else {
      // Standart Sancı & Sağlık Modu: Geri Sayım (Adete Kalan Gün) vs Döngü Günü
      if (centerMode === 'countdown') {
        const daysLeft = cycleInfo.daysUntilPeriod != null ? cycleInfo.daysUntilPeriod : cycleInfo.daysUntilOvulation;
        setText('cycle-day-number', daysLeft != null ? `${daysLeft} Gün ⏳` : `${dayNumber}`);
        setText('cycle-day-label', 'Adete Kalan');
        setText('cycle-day-toggle-hint', `(Döngü gününe geçmek için dokun 🌸)`);
      } else {
        setText('cycle-day-number', `${dayNumber}. Gün 🌸`);
        setText('cycle-day-label', 'Döngü Aşaması');
        setText('cycle-day-toggle-hint', `(Kalan güne geçmek için dokun ⏳)`);
      }
    }

    // Çember Ortasına Tıklandığında İkisi Arasında Geçiş Yapma (Toggle Click Handler)
    const handleRingToggle = (e) => {
      if (e) {
        if (e.target && e.target.closest('#btn-center-period-toggle')) return;
        e.stopPropagation();
      }

      const currentMode = localStorage.getItem('dongum_center_mode') || 'countdown';
      const newMode = (currentMode === 'countdown') ? 'cycle_day' : 'countdown';
      localStorage.setItem('dongum_center_mode', newMode);

      if (App.Utils && App.Utils.vibrate) {
        App.Utils.vibrate([40]);
      }

      renderDashboard();
    };

    const ringCenter = document.getElementById('cycle-ring-center');
    if (ringCenter) {
      ringCenter.onclick = handleRingToggle;
    }
    
    // Faz adı
    if (cycleInfo.phase) {
      const phaseNames = {
        menstrual: t('phases.menstrual'),
        follicular: t('phases.follicular'),
        ovulation: t('phases.ovulation'),
        luteal: t('phases.luteal')
      };
      setText('cycle-phase-name', phaseNames[cycleInfo.phase.phase] || '');
    }

    // SVG ilerleme çemberi
    const progressCircle = document.getElementById('cycle-ring-progress');
    if (progressCircle) {
      const circumference = 2 * Math.PI * 100; // r=100
      const offset = circumference - (progress * circumference);
      progressCircle.style.strokeDasharray = circumference;
      progressCircle.style.strokeDashoffset = offset;

      const phaseColors = {
        menstrual: '#E57373',
        follicular: 'var(--accent-phase)',
        ovulation: 'var(--accent-ovulation)',
        luteal: 'var(--accent-phase)'
      };
      const phaseColor = cycleInfo.phase ? (phaseColors[cycleInfo.phase.phase] || '#E57373') : '#E57373';
      progressCircle.setAttribute('stroke', phaseColor);
    }

    // İlerleme noktası konumu
    const dot = document.getElementById('cycle-ring-dot');
    if (dot) {
      const angle = (progress * 360) - 90;
      const radians = (angle * Math.PI) / 180;
      const cx = 120 + 100 * Math.cos(radians);
      const cy = 120 + 100 * Math.sin(radians);
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
    }

    // 3. Moda Özel Hızlı Aksiyon Kartı (Mode Specific Action Card)
    const modeCard = document.getElementById('mode-specific-card');
    if (modeCard) {
      const todayStr = App.Utils.toISODateString(new Date());
      const todaySymptoms = App.Data.getSymptoms(todayStr) || {};

      if (userGoal === 'track') {
        // SANCI MODU: 1 Dokunuşla Hızlı Sancı Puanı
        const currentPain = todaySymptoms.painLevel || 'none';
        modeCard.innerHTML = `
          <div class="mode-card-title">
            <span>⚡ Bugün Sancı / Ağrı Durumun</span>
            <span style="font-size: 0.75rem; color: var(--accent-period);">${currentPain !== 'none' ? 'Kaydedildi ✓' : 'Seçiniz'}</span>
          </div>
          <div class="pain-rating-btn-row">
            <button type="button" class="pain-quick-btn ${currentPain === 'none' ? 'active' : ''}" data-pain="none">
              <span>😊</span>
              <span>Ağrı Yok</span>
            </button>
            <button type="button" class="pain-quick-btn ${currentPain === 'mild' ? 'active' : ''}" data-pain="mild">
              <span>🌱</span>
              <span>Hafif</span>
            </button>
            <button type="button" class="pain-quick-btn ${currentPain === 'moderate' ? 'active' : ''}" data-pain="moderate">
              <span>⚡</span>
              <span>Orta</span>
            </button>
            <button type="button" class="pain-quick-btn ${currentPain === 'severe' ? 'active' : ''}" data-pain="severe">
              <span>🔥</span>
              <span>Şiddetli</span>
            </button>
          </div>
          <button type="button" class="btn btn-sm btn-secondary" id="btn-quick-herbal-guide" style="width: 100%; min-height: 36px; margin-top: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; background: rgba(91, 154, 111, 0.1); color: var(--accent-fertile); border-color: rgba(91, 154, 111, 0.3);">
            <span>🌿</span>
            <span>Şifalı Bitkiler, Çaylar & Beslenme Rehberi 🍵✨</span>
          </button>
        `;

        modeCard.querySelector('#btn-quick-herbal-guide')?.addEventListener('click', () => {
          if (App.Herbal && App.Herbal.showHerbalModal) {
            App.Herbal.showHerbalModal();
          }
        });

        modeCard.querySelectorAll('.pain-quick-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const painLevel = btn.getAttribute('data-pain');
            const sym = App.Data.getSymptoms(todayStr) || {};
            sym.painLevel = painLevel;
            App.Data.saveSymptoms(todayStr, sym);
            App.Utils.vibrate([40]);
            renderDashboard();
            App.Utils.showToast('Ağrı seviyeniz kaydedildi 🌿', 'success');
          });
        });
      } else if (userGoal === 'ttc') {
        // BEBEK PLANLAMA MODU: 5 Ana Sütun (Isı Haritası, Mukus, BBT Grafiği, LH Tarayıcı, 2WW, Hamileyim!)
        const prob = cycleInfo.pregnancyProbability || 5;
        const hasIntimacy = !!todaySymptoms.intimacy;
        const tempVal = todaySymptoms.temperature;
        const dischargeVal = todaySymptoms.discharge;
        const lhVal = todaySymptoms.lhTest;
        const folicTaken = !!todaySymptoms.folicAcid;

        const heatmapHtml = App.Pregnancy ? App.Pregnancy.getFertilityHeatmapHtml(cycleInfo) : '';

        const dischargeLabels = {
          egg_white: 'Yumurta Akı 🍳',
          watery: 'Sulu 💧',
          creamy: 'Kremsi 🥛',
          sticky: 'Kuru 🏜️'
        };

        const pregSummary = (App.Pregnancy && App.Pregnancy.getDashboardSummaryData) 
          ? App.Pregnancy.getDashboardSummaryData() 
          : { week: 12, weekInfo: { fruit: 'Misket Limonu', emoji: '🍋', size: '5.4 cm', weight: '14 gr' }, curSize: '5.4 cm', curWeight: '14 gr', kicks: 0, lastContraction: null, totalContractions: 0 };

        modeCard.innerHTML = `
          <!-- 1. Dinamik Doğurganlık Isı Haritası -->
          ${heatmapHtml}

          <!-- Ana Durum Açıklaması -->
          <div style="font-size: 0.84rem; line-height: 1.45; color: var(--text-primary); margin-bottom: 10px; background: rgba(230, 160, 60, 0.08); padding: 8px 12px; border-radius: var(--radius-md); border-left: 3px solid #e6a03c;">
            ${cycleInfo.isFertileWindow 
              ? '<strong>🌟 ZİRVE DOĞURGANLIK PENCERESİNDESİNİZ!</strong> Yumurta hücresi 24 saat canlı kalır. En yüksek gebe kalma şansı için bugünleri değerlendirebilirsiniz.' 
              : 'Yumurtlama gününüze yaklaştıkça doğurganlık ihtimaliniz kademeli olarak yükselecektir. Folik asit ve dengeli beslenmeye devam edin.'}
          </div>
          
          <!-- Hızlı Bebek Odaklı Araçlar Izgarası -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
            <button type="button" class="btn btn-sm ${hasIntimacy ? 'btn-primary' : 'btn-secondary'}" id="btn-quick-log-intimacy" style="min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; ${hasIntimacy ? 'background: linear-gradient(135deg, #e6a03c, #c27d14); color: #fff;' : ''}">
              <span>❤️</span>
              <span>${hasIntimacy ? 'Birliktelik ✓' : 'Birliktelik Ekle'}</span>
            </button>

            <button type="button" class="btn btn-sm ${dischargeVal ? 'btn-primary' : 'btn-secondary'}" id="btn-quick-mucus-log" style="min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600;">
              <span>🥚</span>
              <span>${dischargeVal ? dischargeLabels[dischargeVal] || 'Akıntı ✓' : 'Servikal Akıntı'}</span>
            </button>

            <button type="button" class="btn btn-sm ${tempVal ? 'btn-primary' : 'btn-secondary'}" id="btn-quick-bbt-chart" style="min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600;">
              <span>📈</span>
              <span>${tempVal ? tempVal + '°C Grafik' : 'BBT Isı Grafiği'}</span>
            </button>

            <button type="button" class="btn btn-sm ${lhVal === 'positive' ? 'btn-primary' : 'btn-secondary'}" id="btn-quick-lh-scanner" style="min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; ${lhVal === 'positive' ? 'background: linear-gradient(135deg, #8E44AD, #6C3483); color: #fff;' : ''}">
              <span>🟣</span>
              <span>${lhVal === 'positive' ? 'LH Zirve ⭐' : 'LH Test Tara'}</span>
            </button>

            <button type="button" class="btn btn-sm ${folicTaken ? 'btn-primary' : 'btn-secondary'}" id="btn-quick-folic-acid" style="min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; ${folicTaken ? 'background: rgba(91, 154, 111, 0.2); color: var(--accent-fertile); border-color: rgba(91, 154, 111, 0.4);' : ''}">
              <span>💊</span>
              <span>${folicTaken ? 'Folik Asit Alındı ✓' : 'Folik Asit Al'}</span>
            </button>

            <button type="button" class="btn btn-sm btn-secondary" id="btn-quick-2ww-hub" style="min-height: 38px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; background: rgba(212, 85, 107, 0.1); color: var(--accent-period); border-color: rgba(212, 85, 107, 0.3);">
              <span>⏳</span>
              <span>"Hamile Miyim?" (2WW)</span>
            </button>
          </div>

          <!-- Doğurganlık Beslenmesi Rehberi -->
          <button type="button" class="btn btn-sm btn-secondary" id="btn-quick-fertility-nutrition" style="width: 100%; min-height: 36px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; background: rgba(230, 160, 60, 0.12); color: #b87314; border-color: rgba(230, 160, 60, 0.3);">
            <span>🥑</span>
            <span>Şans Artırıcı Besinler & Yaşam Tarzı Rehberi 🥗✨</span>
          </button>

          <!-- 👶 GÜNLÜK BEBEK & HAMİLELİK TAKİP ÖZETİ KARTI -->
          <div style="background: var(--surface); border: 1.5px solid #e6a03c; border-radius: var(--radius-xl); padding: 12px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 0.85rem; font-weight: 800; color: #b87314; display: flex; align-items: center; gap: 6px;">
                <span>👶</span> <span>Bebek & Hamilelik Günlük Özeti</span>
              </span>
              <button type="button" class="btn btn-ghost btn-sm" id="btn-open-full-baby-hub" style="font-size: 0.72rem; color: #b87314; font-weight: 700; padding: 2px 6px;">
                Tümünü Aç ↗
              </button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
              <!-- Hafta & Boy/Kilo -->
              <div id="btn-dash-goto-growth" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); cursor: pointer;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>${pregSummary.weekInfo.emoji || '🌱'}</span>
                  <strong>${pregSummary.week}. Hafta (${pregSummary.weekInfo.fruit})</strong>
                </span>
                <span style="font-size: 0.76rem; color: var(--text-secondary);">📏 ${pregSummary.curSize} | ⚖️ ${pregSummary.curWeight}</span>
              </div>

              <!-- Tekme Sayısı -->
              <div id="btn-dash-goto-kicks" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); cursor: pointer;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>👣</span>
                  <span>Bugünkü Tekme:</span>
                </span>
                <strong style="color: #b87314;">${pregSummary.kicks} / 10 Tekme ${pregSummary.kicks >= 10 ? '✓' : ''}</strong>
              </div>

              <!-- Son Sancı -->
              <div id="btn-dash-goto-contractions" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); cursor: pointer;">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span>⏱️</span>
                  <span>Son Kasılma/Sancı:</span>
                </span>
                <strong style="color: ${pregSummary.lastContraction ? 'var(--accent-period)' : 'var(--text-secondary)'};">
                  ${pregSummary.lastContraction ? `${pregSummary.lastContraction.duration} sn (${pregSummary.lastContraction.time})` : 'Kayıt yok'}
                </strong>
              </div>
            </div>
          </div>

          <!-- 🎉 "HAMİLEYİM!" KUTLAMA VE MOD GEÇİŞ BUTONU -->
          <div style="background: linear-gradient(135deg, rgba(230, 160, 60, 0.2), rgba(212, 85, 107, 0.15)); border: 2px dashed #e6a03c; border-radius: var(--radius-xl); padding: 10px; margin-top: 6px; text-align: center;">
            <div style="font-size: 0.76rem; font-weight: 700; color: #b87314; margin-bottom: 4px;">🎉 TESTİNİZ POZİTİF Mİ ÇIKTI?</div>
            <button type="button" class="btn btn-primary btn-block" id="btn-im-pregnant-milestone" style="padding: 10px; font-size: 0.95rem; font-weight: 800; background: linear-gradient(135deg, #e6a03c, #D4556B); border: none; box-shadow: 0 4px 15px rgba(230, 160, 60, 0.4); cursor: pointer;">
              💖 Hamileyim! (Kutlamayı Başlat 🎉)
            </button>
          </div>
        `;

        // Dashboard Bebek Özeti Tıklama Olayları
        modeCard.querySelector('#btn-open-full-baby-hub')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showPregnancyHubModal) {
            App.Pregnancy.showPregnancyHubModal('growth');
          }
        });

        modeCard.querySelector('#btn-dash-goto-growth')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showPregnancyHubModal) {
            App.Pregnancy.showPregnancyHubModal('growth');
          }
        });

        modeCard.querySelector('#btn-dash-goto-kicks')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showPregnancyHubModal) {
            App.Pregnancy.showPregnancyHubModal('kick');
          }
        });

        modeCard.querySelector('#btn-dash-goto-contractions')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showPregnancyHubModal) {
            App.Pregnancy.showPregnancyHubModal('contraction');
          }
        });

        // 1. Servikal Akıntı Modalı
        modeCard.querySelector('#btn-quick-mucus-log')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showCervicalMucusModal) {
            App.Pregnancy.showCervicalMucusModal();
          }
        });

        // 2. BBT Grafiği Modalı
        modeCard.querySelector('#btn-quick-bbt-chart')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showBBTChartModal) {
            App.Pregnancy.showBBTChartModal();
          }
        });

        // 3. LH Test Tarayıcı Modalı
        modeCard.querySelector('#btn-quick-lh-scanner')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showLHOvulationScannerModal) {
            App.Pregnancy.showLHOvulationScannerModal();
          }
        });

        // 4. Folik Asit / Vitamin Hızlı Toggle
        modeCard.querySelector('#btn-quick-folic-acid')?.addEventListener('click', () => {
          const sym = App.Data.getSymptoms(todayStr) || {};
          sym.folicAcid = !sym.folicAcid;
          App.Data.saveSymptoms(todayStr, sym);
          App.Utils.vibrate([40]);
          renderDashboard();
          App.Utils.showToast(sym.folicAcid ? 'Folik asit / vitamin alındı olarak kaydedildi 💊' : 'Takviye kaydı güncellendi', 'success');
        });

        // 5. "Hamile Miyim?" (2WW) Modalı
        modeCard.querySelector('#btn-quick-2ww-hub')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showTwoWeekWaitModal) {
            App.Pregnancy.showTwoWeekWaitModal(cycleInfo);
          }
        });

        // 6. Beslenme Rehberi Modalı
        modeCard.querySelector('#btn-quick-fertility-nutrition')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.showNutritionGuideModal) {
            App.Pregnancy.showNutritionGuideModal();
          }
        });

        // 7. 🎉 "HAMİLEYİM!" KUTLAMA BUTONU
        modeCard.querySelector('#btn-im-pregnant-milestone')?.addEventListener('click', () => {
          if (App.Pregnancy && App.Pregnancy.triggerImPregnantCelebration) {
            App.Pregnancy.triggerImPregnantCelebration();
          }
        });

        // Birliktelik Toggle (Aç/Kapat)
        modeCard.querySelector('#btn-quick-log-intimacy')?.addEventListener('click', () => {
          const sym = App.Data.getSymptoms(todayStr) || {};
          sym.intimacy = !sym.intimacy;
          App.Data.saveSymptoms(todayStr, sym);
          App.Utils.vibrate([40]);
          renderDashboard();
          App.Utils.showToast(sym.intimacy ? '❤️ Birliktelik kaydı eklendi (Takvim ve Günlük güncellendi)' : 'Birliktelik kaydı kaldırıldı', 'success');
        });

        // Hızlı Ateş Girişi Modalı
        modeCard.querySelector('#btn-quick-temp-log')?.addEventListener('click', () => {
          const currentTemp = todaySymptoms.temperature || '36.5';
          const modalBody = document.getElementById('modal-body');
          if (modalBody) {
            modalBody.innerHTML = `
              <div style="display: flex; flex-direction: column; gap: 14px; text-align: center;">
                <p style="font-size: 0.85rem; color: var(--text-secondary);">
                  Yumurtlama gününden hemen sonra vücut ısısı 0.3°C - 0.5°C yükselir. Sabah yataktan kalkmadan önce ölçülen ateş en doğrudur.
                </p>
                <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                  <button type="button" class="btn btn-ghost btn-sm" id="btn-modal-temp-minus" style="font-size: 1.2rem; width: 40px; height: 40px;">−</button>
                  <input type="number" step="0.1" min="35.0" max="40.0" id="input-modal-temp" value="${currentTemp}" style="font-size: 1.4rem; font-weight: 700; width: 100px; text-align: center; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text-primary);">
                  <button type="button" class="btn btn-ghost btn-sm" id="btn-modal-temp-plus" style="font-size: 1.2rem; width: 40px; height: 40px;">+</button>
                  <span style="font-size: 1.1rem; font-weight: 700;">°C</span>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
                  <button type="button" class="btn btn-primary" id="btn-save-modal-temp" style="width: 100%;">
                    💾 Ateşi Kaydet
                  </button>
                </div>
              </div>
            `;

            const inputEl = modalBody.querySelector('#input-modal-temp');
            modalBody.querySelector('#btn-modal-temp-minus')?.addEventListener('click', () => {
              inputEl.value = (parseFloat(inputEl.value) - 0.1).toFixed(1);
            });
            modalBody.querySelector('#btn-modal-temp-plus')?.addEventListener('click', () => {
              inputEl.value = (parseFloat(inputEl.value) + 0.1).toFixed(1);
            });

            modalBody.querySelector('#btn-save-modal-temp')?.addEventListener('click', () => {
              const val = parseFloat(inputEl.value);
              if (!isNaN(val)) {
                const sym = App.Data.getSymptoms(todayStr) || {};
                sym.temperature = val;
                App.Data.saveSymptoms(todayStr, sym);
                hideModal();
                renderDashboard();
                App.Utils.showToast(`Ateş ${val}°C olarak kaydedildi 🌡️`, 'success');
              }
            });

            showModal('🌡️ Bazal Vücut Isısı (Ateş) Gir');
          }
        });

        // Günlük Sekmesine Git
        modeCard.querySelector('#btn-quick-symptoms-link')?.addEventListener('click', () => {
          navigateTo('symptoms');
        });
      } else if (userGoal === 'prevent') {
        // KORUNMA MODU: Risk Seviyesi & Günlük Hap
        const isHighRisk = cycleInfo.isFertileWindow;
        const meds = App.Data.getMedications ? App.Data.getMedications() : [];
        const birthPillMed = meds.find(m => m.name.toLowerCase().includes('doğum') || m.name.toLowerCase().includes('hap') || m.name.toLowerCase().includes('pill'));

        modeCard.innerHTML = `
          <div class="mode-card-title">
            <span>🛡️ Doğurganlık & Korunma Durumu</span>
            <span style="font-size: 0.75rem; font-weight: 700; color: ${isHighRisk ? '#e65c00' : 'var(--accent-fertile)'};">
              ${isHighRisk ? '⚠️ YÜKSEK RİSK' : '🛡️ DÜŞÜK RİSK'}
            </span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-primary); line-height: 1.4; margin-bottom: 8px;">
            ${isHighRisk 
              ? 'Yumurtlama penceresindesiniz. Hamilelik olasılığı yüksektir, lütfen korunmasız birliktelikten kaçının.' 
              : 'Düşük doğurganlık günündesiniz; ancak %100 koruma için her zaman güvenli yöntemler tercih edilmelidir.'}
          </div>
          <div class="mode-pill-toggle" style="background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-lg);">
            <span style="font-size: 0.85rem; font-weight: 600;">💊 Günlük Doğum Kontrol Hapı</span>
            <button type="button" class="btn btn-sm ${todaySymptoms.birthControlTaken ? 'btn-primary' : 'btn-secondary'}" id="btn-quick-pill-toggle">
              ${todaySymptoms.birthControlTaken ? 'Alındı ✓' : 'Hapı Al 💊'}
            </button>
          </div>
        `;

        modeCard.querySelector('#btn-quick-pill-toggle')?.addEventListener('click', () => {
          const sym = App.Data.getSymptoms(todayStr) || {};
          sym.birthControlTaken = !sym.birthControlTaken;
          App.Data.saveSymptoms(todayStr, sym);
          App.Utils.vibrate([40]);
          renderDashboard();
          App.Utils.showToast(sym.birthControlTaken ? 'Doğum kontrol hapı alındı olarak işaretlendi 💊' : 'Hap kaydı güncellendi', 'success');
        });
      }
    }

    // 4. Moda Özel 4'lü Hızlı Bilgi Kartları (Mode-Specific Quick Info Cards)
    renderQuickInfoCards(cycleInfo, userGoal);

    // Faz açıklama kartı
    renderPhaseCard(cycleInfo);

    // Günlük Sağlık & Belirti Durumu Özeti Widget'ı
    renderDailyInsightWidget(cycleInfo);

    // FAB butonu (Hero Button)
    renderPeriodFAB(cycleInfo);

    // İlaç widget'ı
    renderMedicationWidget();
  }

  function renderQuickInfoCards(cycleInfo, userGoal) {
    const grid = document.getElementById('quick-info-grid');
    if (!grid) return;

    const todayStr = App.Utils ? App.Utils.toISODateString(new Date()) : '';
    const todaySymptoms = (App.Data && App.Data.getSymptoms) ? (App.Data.getSymptoms(todayStr) || {}) : {};

    // Gün farkları
    let daysToOv = null;
    if (cycleInfo.ovulationDay) {
      const ovDate = App.Utils.parseDate(cycleInfo.ovulationDay);
      daysToOv = App.Utils.diffDays(ovDate, new Date());
    }

    const phaseNames = {
      menstrual: 'Regl',
      follicular: 'Foliküler',
      ovulation: 'Yumurtlama',
      luteal: 'Luteal (PMS)'
    };
    const currentPhaseName = cycleInfo.phase ? (phaseNames[cycleInfo.phase.phase] || 'Döngü') : 'Döngü';

    let cardsHtml = '';

    if (userGoal === 'ttc') {
      // 👶 MOD 2: GEBE KALMA & BEBEK PLANLAMA MODU KARTLARI
      const ovText = (daysToOv === 0) ? 'Bugün' : (daysToOv > 0) ? `${daysToOv} Gün` : 'Geçti';
      const prob = cycleInfo.pregnancyProbability || 5;
      const tempText = todaySymptoms.temperature ? `${todaySymptoms.temperature}°C` : '--';
      const intimacyText = todaySymptoms.intimacy ? 'Yapıldı ✓' : 'Yok';

      cardsHtml = `
        <div class="info-card" id="info-card-ovulation">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-ovulation)" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="var(--accent-ovulation)" opacity="0.3"/></svg>
          </div>
          <span class="info-card-value mono">${ovText}</span>
          <span class="info-card-label">Yumurtlama</span>
        </div>
        <div class="info-card" id="info-card-pregnancy">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-period)" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
          </div>
          <span class="info-card-value mono">%${prob}</span>
          <span class="info-card-label">Gebe Kalma Şansı</span>
        </div>
        <div class="info-card" id="info-card-temp">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">🌡️</span>
          </div>
          <span class="info-card-value mono">${tempText}</span>
          <span class="info-card-label">Bazal Isı (BBT)</span>
        </div>
        <div class="info-card" id="info-card-intimacy">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">❤️</span>
          </div>
          <span class="info-card-value" style="font-size: 0.95rem; font-weight: 700; color: ${todaySymptoms.intimacy ? 'var(--accent-period)' : 'var(--text-secondary)'};">${intimacyText}</span>
          <span class="info-card-label">Birliktelik</span>
        </div>
      `;
    } else if (userGoal === 'prevent') {
      // 🛡️ MOD 3: DOĞURGANLIK & KORUNMA MODU KARTLARI
      const isHighRisk = cycleInfo.isFertileWindow;
      const pillText = todaySymptoms.birthControlTaken ? 'Alındı ✓' : 'Alınmadı';
      const periodLeft = cycleInfo.daysUntilPeriod != null ? `${cycleInfo.daysUntilPeriod} Gün` : '--';
      const riskDaysText = isHighRisk ? 'YÜKSEK' : 'Düşük Risk';

      cardsHtml = `
        <div class="info-card" id="info-card-protection" style="${isHighRisk ? 'background: rgba(230, 92, 0, 0.08); border-color: rgba(230, 92, 0, 0.3);' : ''}">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">${isHighRisk ? '⚠️' : '🛡️'}</span>
          </div>
          <span class="info-card-value" style="font-size: 0.95rem; font-weight: 800; color: ${isHighRisk ? '#e65c00' : 'var(--accent-fertile)'};">${riskDaysText}</span>
          <span class="info-card-label">Hamilelik Riski</span>
        </div>
        <div class="info-card" id="info-card-pill">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">💊</span>
          </div>
          <span class="info-card-value" style="font-size: 0.95rem; font-weight: 700; color: ${todaySymptoms.birthControlTaken ? 'var(--accent-fertile)' : '#e6a03c'};">${pillText}</span>
          <span class="info-card-label">Doğum Kontrolü</span>
        </div>
        <div class="info-card" id="info-card-next-period">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-period)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span class="info-card-value mono">${periodLeft}</span>
          <span class="info-card-label">Sonraki Regl</span>
        </div>
        <div class="info-card" id="info-card-safe-window">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">🗓️</span>
          </div>
          <span class="info-card-value" style="font-size: 0.95rem; font-weight: 700; color: var(--accent-phase);">${currentPhaseName}</span>
          <span class="info-card-label">Döngü Dönemi</span>
        </div>
      `;
    } else {
      // 🌸 MOD 1: SANCI & GENEL SAĞLIK MODU KARTLARI
      const periodVal = cycleInfo.isLate ? `+${cycleInfo.daysLate} Gün` : (cycleInfo.daysUntilPeriod != null ? `${cycleInfo.daysUntilPeriod} Gün` : '--');
      const painLevels = { none: 'Ağrı Yok 😊', mild: 'Hafif 🌱', moderate: 'Orta ⚡', severe: 'Şiddetli 🔥' };
      const painText = painLevels[todaySymptoms.painLevel] || 'Ağrı Yok 😊';
      const waterMl = todaySymptoms.water ? `${todaySymptoms.water * 250} ml` : '0 ml';

      cardsHtml = `
        <div class="info-card" id="info-card-next-period">
          <div class="info-card-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-period)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <span class="info-card-value mono">${periodVal}</span>
          <span class="info-card-label">${cycleInfo.isLate ? 'Gecikti' : 'Sonraki Regl'}</span>
        </div>
        <div class="info-card" id="info-card-pain">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">⚡</span>
          </div>
          <span class="info-card-value" style="font-size: 0.88rem; font-weight: 700; color: var(--accent-period);">${painText}</span>
          <span class="info-card-label">Bugünkü Sancı</span>
        </div>
        <div class="info-card" id="info-card-water">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">💧</span>
          </div>
          <span class="info-card-value mono">${waterMl}</span>
          <span class="info-card-label">Su Tüketimi</span>
        </div>
        <div class="info-card" id="info-card-phase">
          <div class="info-card-icon">
            <span style="font-size: 1.1rem;">🌿</span>
          </div>
          <span class="info-card-value" style="font-size: 0.88rem; font-weight: 700; color: var(--accent-phase);">${currentPhaseName}</span>
          <span class="info-card-label">Döngü Fazı</span>
        </div>
      `;
    }

    grid.innerHTML = cardsHtml;
  }

  function renderPhaseCard(cycleInfo) {
    const t = App.I18n.t.bind(App.I18n);
    
    if (!cycleInfo.phase) return;

    const phase = cycleInfo.phase.phase;
    const phaseColors = {
      menstrual: 'var(--accent-period)',
      follicular: 'var(--accent-phase)',
      ovulation: 'var(--accent-ovulation)',
      luteal: 'var(--accent-phase)'
    };

    const dot = document.getElementById('phase-card-dot');
    if (dot) dot.style.backgroundColor = phaseColors[phase] || 'var(--accent-period)';

    const phaseNames = {
      menstrual: t('phases.menstrual'),
      follicular: t('phases.follicular'),
      ovulation: t('phases.ovulation'),
      luteal: t('phases.luteal')
    };
    setText('phase-card-title', phaseNames[phase] || '');

    // Faz açıklaması
    const descKey = `phases.${phase}Desc`;
    setText('phase-card-description', t(descKey));

    // Günlük ipucu
    const tipKey = `tips.${phase}`;
    const tips = t(tipKey);
    if (Array.isArray(tips) && tips.length > 0) {
      const todayIndex = new Date().getDate() % tips.length;
      setText('phase-tip-text', tips[todayIndex]);
    } else if (typeof tips === 'string') {
      setText('phase-tip-text', tips);
    }
  }

  function renderDailyInsightWidget(cycleInfo) {
    const container = document.getElementById('dashboard-daily-insight');
    if (!container) return;

    const isTr = (App.I18n && App.I18n.getLang() === 'tr');
    const todayStr = App.Utils ? App.Utils.toISODateString(new Date()) : new Date().toISOString().split('T')[0];
    const symptoms = (App.Data && App.Data.getSymptoms) ? (App.Data.getSymptoms(todayStr) || {}) : {};

    const hasData = Object.keys(symptoms).some(k => {
      if (k === 'water' && symptoms[k] > 0) return true;
      if (k === 'painAreas' && Array.isArray(symptoms[k]) && symptoms[k].length > 0) return true;
      if (symptoms[k] && typeof symptoms[k] === 'string' && symptoms[k] !== 'none') return true;
      if (typeof symptoms[k] === 'boolean' && symptoms[k]) return true;
      return false;
    });

    if (!hasData) {
      container.innerHTML = `
        <div class="insight-box empty">
          <div class="insight-header">
            <div class="insight-title-group">
              <span class="insight-icon">📝</span>
              <h4 class="insight-title">${isTr ? 'Bugün Nasıl Hissediyorsun?' : 'How are you feeling today?'}</h4>
            </div>
            <button type="button" class="btn btn-sm btn-primary btn-goto-symptoms">
              ${isTr ? '+ Günlük Ekle' : '+ Log Today'}
            </button>
          </div>
          <p class="insight-prompt">
            ${isTr 
              ? 'Ruh halini, ağrılarını ve su tüketimini kaydederek sana özel günlük sağlık değerlendirmesi ve rahatlatıcı tavsiyeler alabilirsin.' 
              : 'Log your symptoms, mood, and water intake to receive personalized daily health insights and relief tips.'}
          </p>
        </div>
      `;
      container.querySelector('.btn-goto-symptoms')?.addEventListener('click', () => {
        navigateTo('symptoms');
      });
      return;
    }

    // GİRİLEN DEĞERLERİN ANALİZİ VE AKILLI SAĞLIK TAVSİYELERİ
    const chips = [];
    const observations = [];
    const recommendations = [];

    // 1. Ruh Hali
    const moodMap = {
      great: { emoji: '😊', label: 'Harika', desc: 'Ruh halin bugün harika ve enerjin yüksek.' },
      good: { emoji: '😌', label: 'İyi', desc: 'Sakin ve dengeli bir gün geçiriyorsun.' },
      okay: { emoji: '😐', label: 'Normal', desc: 'Standart ve stabil bir ruh halindesin.' },
      bad: { emoji: '😔', label: 'Mutsuz / Düşük', desc: 'Enerjin biraz düşük veya mutsuz hissediyorsun.' },
      terrible: { emoji: '😢', label: 'Hassas / Duygusal', desc: 'Hormonal dalgalanmaya bağlı duygusal ve hassas bir günündesin.' }
    };
    if (symptoms.mood && moodMap[symptoms.mood]) {
      const m = moodMap[symptoms.mood];
      chips.push(`<button type="button" class="insight-chip mood interactive-chip" data-type="mood" data-key="${symptoms.mood}"><span>${m.emoji} ${m.label}</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      observations.push(m.desc);
      if (symptoms.mood === 'terrible' || symptoms.mood === 'bad') {
        recommendations.push('Sevdiğin bir müzik dinlemek, ılık bir bitki çayı içmek ve kendine dinlenme zamanı ayırmak sana çok iyi gelecektir.');
      }
    }

    // 2. Ağrı Seviyesi ve Bölgeleri
    const painLevels = {
      none: 'Ağrısız',
      mild: 'Hafif Ağrı',
      moderate: 'Belirgin Kramplar',
      severe: 'Şiddetli Ağrı'
    };
    const areaLabels = {
      abdomen: 'Karın/Kramp',
      lowerBack: 'Bel',
      head: 'Baş Ağrısı',
      breast: 'Göğüs Hassasiyeti',
      legs: 'Bacak/Eklem',
      upperBack: 'Sırt'
    };

    if (symptoms.painLevel && symptoms.painLevel !== 'none') {
      const pLabel = painLevels[symptoms.painLevel] || symptoms.painLevel;
      chips.push(`<button type="button" class="insight-chip pain interactive-chip" data-type="pain" data-key="${symptoms.painLevel}"><span>⚡ ${pLabel}</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      
      let areasStr = '';
      if (Array.isArray(symptoms.painAreas) && symptoms.painAreas.length > 0) {
        areasStr = symptoms.painAreas.map(a => areaLabels[a] || a).join(', ');
        observations.push(`Vücudunda <strong>${areasStr}</strong> bölgesinde ${pLabel.toLowerCase()} hissediyorsun. Bu durum döngünün bu evresinde rahmin doğal kasılmalarının sinirlere yansımasıdır ve <strong>tamamen normal, beklenen bir biyolojik süreçtir</strong>.`);
      } else {
        observations.push(`Bugün ${pLabel.toLowerCase()} hissediyorsun. Döngüsel hormon değişimlerinde bu tip hafif/orta hassasiyetler <strong>tamamen normaldir</strong>.`);
      }

      if (symptoms.painLevel === 'mild' || symptoms.painLevel === 'moderate') {
        recommendations.push('Karın veya beline 15 dk sıcak su torbası uygulamak ve Çocuk Pozu (Balasana) esnemesi yapmak kaslarını belirgin şekilde rahatlatır.');
      } else if (symptoms.painLevel === 'severe') {
        recommendations.push('Bacaklarının arasına yastık alarak cenin pozisyonunda dinlen. Şiddetli ağrın dinmezse mutlaka doktoruna danış.');
      }
    } else if (symptoms.painLevel === 'none') {
      chips.push(`<button type="button" class="insight-chip success interactive-chip" data-type="pain" data-key="none"><span>🌿 Ağrı Yok</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      observations.push('Vücudunda kramp veya ağrı yok, son derece rahat ve dengeli bir gündesin.');
    }

    // 3. Kanama
    const flowMap = {
      none: 'Kanama Yok',
      spotting: 'Lekelenme',
      light: 'Hafif Kanama',
      medium: 'Orta Kanama',
      heavy: 'Yoğun Kanama'
    };
    if (symptoms.flow && symptoms.flow !== 'none') {
      const fLabel = flowMap[symptoms.flow] || symptoms.flow;
      chips.push(`<button type="button" class="insight-chip flow interactive-chip" data-type="flow" data-key="${symptoms.flow}"><span>🩸 ${fLabel}</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      if (symptoms.flow === 'heavy') {
        recommendations.push('Yoğun kanama gününde ağır egzersizlerden kaçın, pedini 3-4 saatte bir yenile ve demir/C vitamini yönünden zengin beslen.');
      } else if (symptoms.flow === 'medium') {
        recommendations.push('Hijyenin için pedini düzenli değiştirmeyi ve ılık duşla rahatlamayı unutma.');
      }
    }

    // 4. Su Tüketimi
    if (symptoms.water !== undefined && symptoms.water !== null && symptoms.water > 0) {
      const wCount = parseInt(symptoms.water, 10);
      const wLiters = (wCount * 0.25).toFixed(1);
      chips.push(`<button type="button" class="insight-chip water interactive-chip" data-type="water" data-key="${wCount}"><span>💧 ${wCount} Bardak (${wLiters}L)</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      if (wCount >= 7) {
        observations.push(`Harika bir su tüketimin var (${wLiters}L); vücudun hidrate ve toksinlerden arınıyor.`);
      } else if (wCount >= 4) {
        recommendations.push(`Bugün ${wCount} bardak su içtin (${wLiters}L). İdeal 8 bardak hedefine ulaşmak için 2-3 bardak daha ekleyebilirsin.`);
      } else if (wCount > 0) {
        recommendations.push(`Su tüketimin biraz az kalmış (${wLiters}L). Krampları ve baş ağrısını önlemek için lütfen hemen 1-2 bardak su iç.`);
      }
    }

    // 5. Akıntı & Doğurganlık
    const dischargeMap = {
      eggWhite: { label: '🌟 Yumurta Akı', desc: 'Yumurta akı kıvamında akıntın var; döngünün en yüksek doğurganlık (ovulasyon) anındasın!' },
      watery: { label: '💧 Sulu Akıntı', desc: 'Sulu akıntı yumurtlama penceresinde olduğunu gösterir.' },
      creamy: { label: '💧 Kremsi Akıntı', desc: 'Kremsi akıntı vajinal floranın kendini nemlendirdiğini gösterir.' },
      sticky: { label: '💧 Yapışkan Akıntı', desc: 'Yapışkan akıntı hormonların yükseldiğini gösterir.' }
    };
    if (symptoms.discharge && dischargeMap[symptoms.discharge]) {
      const d = dischargeMap[symptoms.discharge];
      chips.push(`<button type="button" class="insight-chip discharge interactive-chip" data-type="discharge" data-key="${symptoms.discharge}"><span>${d.label}</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      observations.push(d.desc);
    }

    // 6. Yaşam Tarzı (Spor / Birliktelik)
    if (symptoms.exercise) {
      chips.push(`<span class="insight-chip life">🏃‍♀️ Spor Yapıldı</span>`);
    }
    if (symptoms.intimacy) {
      chips.push(`<span class="insight-chip life">❤️ Birliktelik</span>`);
    }

    // 7. Özel / Ekstra Belirtiler
    if (Array.isArray(symptoms.customSymptoms) && symptoms.customSymptoms.length > 0) {
      symptoms.customSymptoms.forEach(sym => {
        chips.push(`<button type="button" class="insight-chip custom interactive-chip" data-type="custom" data-key="${sym}"><span>✨ ${sym}</span> <span class="chip-tap-hint">ℹ️</span></button>`);
      });
      observations.push(`Bugün ayrıca (${symptoms.customSymptoms.join(', ')}) hissettiğini belirttin.`);
    }

    // 8. KİŞİSELLEŞTİRİLMİŞ YAŞ, HEDEF & DOĞUM ÖZEL REHBERLİĞİ (Tıbbi Algoritma)
    const userAge = settings.userAge || 25;
    const userGoal = settings.userGoal || 'track';
    const userBirth = settings.userBirth || 'no';

    if (userGoal === 'ttc') {
      if (cycleInfo.isFertileWindow || cycleInfo.daysUntilOvulation === 0) {
        recommendations.unshift('👶 <strong>Bebek Planlama Modu:</strong> Şu an en verimli doğurganlık penceresindesin! Yumurtlama gününde LH hormonu zirve yapar; gebelik şansını artırmak için bugünleri değerlendirebilirsin.');
      } else {
        recommendations.push('👶 <strong>Bebek Planlama:</strong> Folik asit takviyeni almayı, bazal vücut ısısı ve akıntı değişimlerini kaydetmeyi unutma.');
      }
    }

    if (userAge <= 21 && (symptoms.painLevel === 'moderate' || symptoms.painLevel === 'severe')) {
      observations.push(`🩺 <strong>${userAge} Yaş Dönemi Bilgisi:</strong> Genç yaş grubunda prostaglandin hormonu yoğun salgılandığı için kasık krampları (primer dismenore) daha sert hissedilebilir. Bu durum tamamen biyolojiktir; sıcak su torbası ve magnezyum kasları hızla gevşetir.`);
    } else if (userAge >= 38) {
      recommendations.push('🌿 <strong>Hormonal Denge:</strong> 35+ yaş grubunda ödem ve göğüs hassasiyeti belirginleşebilir; tuz tüketimini azaltıp papatya veya adaçayı ile vücudunu rahatlatabilirsin.');
    }

    if (userBirth === 'yes') {
      observations.push('🧘‍♀️ <strong>Doğum Geçmişi:</strong> Doğum yapmış kadınlarda rahim ağzı esnediği için sancı sıklığı azalır; pelvik tabanını korumak için hafif yürüyüşler ve derin nefes egzersizleri idealdir.');
    }

    // GÜNÜN MOTİVASYON MESAJI (Şefkatli & Gerçekçi Öz-Bakım)
    let motivationMsg = 'Önce kendi sağlığın ve ruhun: Bedenin şu an sessizce muazzam bir onarım yapıyor. Kendine nazik davran, dinlenmek senin en doğal ve en hayati hakkın. 🌸✨';
    if (symptoms.mood === 'bad') {
      motivationMsg = 'Dünya bir günlüğüne bekleyebilir: Bugün başkalarını mutlu etmeye çalışmak yerine sadece kendini koruma ve şarj olma günün. "Hayır" deme hakkını kullan ve suçluluk duymadan dinlen. 🛋️💖';
    } else if (symptoms.mood === 'terrible') {
      motivationMsg = 'Güçlü durmak zorunda değilsin. Ağlamak da, kırılgan hissetmek de insan olmanın en doğal parçasıdır. Kendini yargılama, bugün kendine şefkatle sarıl; bu hormonal fırtına çok yakında dinecek. 🫂🌸';
    } else if (symptoms.painLevel === 'moderate' || symptoms.painLevel === 'severe') {
      motivationMsg = 'Ağrı sana bedeninin "lütfen yavaşla" deme şeklidir. Kendini zorlamak yerine sıcak su torbanı al, uzan ve bedenine eşlik et. Senin sağlığın her şeyden daha önemli. 🌿🧘‍♀️';
    } else if (symptoms.mood === 'great' || symptoms.mood === 'good') {
      motivationMsg = 'Harika bir enerjin var! Bu güzel canlılığın birazını da sadece kendini besleyen, sana gerçekten iyi gelen şeylere sakla. Işığını kutla! 💖🌟';
    }

    // Render HTML
    container.innerHTML = `
      <div class="insight-box filled animate-up">
        <div class="insight-header">
          <div class="insight-title-group">
            <span class="insight-icon">🌸</span>
            <h4 class="insight-title">${isTr ? 'Günün Sağlık & Durum Özeti' : "Today's Health & Cycle Summary"}</h4>
          </div>
          <button type="button" class="btn btn-sm btn-ghost btn-goto-symptoms">
            ✏️ ${isTr ? 'Tümünü Düzenle' : 'Edit All'}
          </button>
        </div>

        <!-- Kayıt Çipleri (Tıklanabilir) -->
        <div class="insight-chips-row">
          ${chips.join('')}
        </div>

        <!-- Ne Oluyor / Durum Açıklaması & Normal mi? -->
        ${observations.length > 0 ? `
          <div class="insight-section-box">
            <div class="insight-section-title">🔍 <strong>${isTr ? 'Vücudunda Neler Oluyor? (Normal mi?)' : 'What is happening?'}</strong></div>
            <p class="insight-text">${observations.join(' ')}</p>
          </div>
        ` : ''}

        <!-- Ne Yapmalı / Günlük Tavsiyeler -->
        ${recommendations.length > 0 ? `
          <div class="insight-section-box tips">
            <div class="insight-section-title">💡 <strong>${isTr ? 'Bugün Kendine Nasıl İyi Bakabilirsin?' : 'Personalized Recommendations'}</strong></div>
            <ul class="insight-tips-list">
              ${recommendations.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Günün Motivasyon & Güç Notu -->
        <div class="insight-section-box motivation" style="background: rgba(212, 85, 107, 0.06); border-color: rgba(212, 85, 107, 0.25);">
          <div class="insight-section-title" style="color: var(--accent-period);">💖 <strong>${isTr ? 'Önce Sen: Günün Öz-Şefkat & Hatırlatması' : 'Self-Care Affirmation'}</strong></div>
          <p class="insight-text" style="font-style: italic; color: var(--text-primary); font-weight: 500; line-height: 1.5;">"${motivationMsg}"</p>
        </div>

        <!-- Hızlı Ekleme Çubuğu -->
        <div class="insight-quick-add-row" style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); align-items: center;">
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); width: 100%;">⚡ Ana Sayfadan Hızlı İşlemler:</span>
          <button type="button" class="btn btn-sm btn-primary btn-evening-checkin" style="background: linear-gradient(135deg, #7b52ab, #4d2b79); color: #fff; font-weight: 600;">
            🌙 Günün Nasıl Geçti?
          </button>
          <button type="button" class="btn btn-sm btn-secondary btn-quick-water">+1 Su 💧</button>
          <button type="button" class="btn btn-sm btn-secondary btn-quick-custom">+ Özel Belirti ✨</button>
          <button type="button" class="btn btn-sm btn-secondary btn-quick-note">+ Not 📝</button>
        </div>
      </div>
    `;

    // Gün Sonu Değerlendirmesi Modalı
    container.querySelector('.btn-evening-checkin')?.addEventListener('click', () => {
      showEveningCheckInModal(todayStr, symptoms);
    });

    container.querySelector('.btn-goto-symptoms')?.addEventListener('click', () => {
      navigateTo('symptoms');
    });

    // Çiplere Tıklandığında Detay Modalını Aç
    container.querySelectorAll('.interactive-chip').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = btn.getAttribute('data-type');
        const key = btn.getAttribute('data-key');
        showSymptomDetailModal(type, key, todayStr, symptoms, cycleInfo);
      });
    });

    // Hızlı 1 Bardak Su Ekle
    container.querySelector('.btn-quick-water')?.addEventListener('click', () => {
      const cur = parseInt(symptoms.water || 0, 10);
      symptoms.water = Math.min(30, cur + 1);
      App.Data.saveSymptoms(todayStr, symptoms);
      App.Utils.showToast(isTr ? `+1 Bardak su eklendi (Toplam ${symptoms.water} bardak 💧)` : `+1 Glass of water added (${symptoms.water} glasses 💧)`, 'success');
      renderDailyInsightWidget(cycleInfo);
    });

    // Hızlı Özel Belirti Ekle
    container.querySelector('.btn-quick-custom')?.addEventListener('click', () => {
      const val = prompt(isTr ? 'Bugün için eklemek istediğiniz belirtiyi yazın:' : 'Enter custom symptom:');
      if (val && val.trim()) {
        if (!Array.isArray(symptoms.customSymptoms)) symptoms.customSymptoms = [];
        if (!symptoms.customSymptoms.includes(val.trim())) {
          symptoms.customSymptoms.push(val.trim());
          App.Data.saveSymptoms(todayStr, symptoms);
          App.Utils.showToast(isTr ? `"${val.trim()}" eklendi ✨` : `"${val.trim()}" added ✨`, 'success');
          renderDailyInsightWidget(cycleInfo);
        }
      }
    });

    // Hızlı Not Ekle
    container.querySelector('.btn-quick-note')?.addEventListener('click', () => {
      const val = prompt(isTr ? 'Bugün için günlüğünüze bir not yazın:' : 'Enter a daily note:', symptoms.notes || '');
      if (val !== null) {
        symptoms.notes = val.trim();
        App.Data.saveSymptoms(todayStr, symptoms);
        App.Utils.showToast(isTr ? 'Günlük notunuz kaydedildi 📝' : 'Daily note saved 📝', 'success');
        renderDailyInsightWidget(cycleInfo);
      }
    });
  }

  function showSymptomDetailModal(type, key, todayStr, symptoms, cycleInfo) {
    const isTr = (App.I18n && App.I18n.getLang() === 'tr');
    let title = '';
    let body = '';

    if (type === 'mood') {
      const moodDetails = {
        great: {
          title: '😊 Harika & Zinde Ruh Hali',
          desc: 'Östrojen ve endorfin seviyeleriniz zirvede! Kendinize güveniniz tam ve pozitif enerjiniz yüksek. Bu enerjiyi başkalarına dağıtmadan önce birazını da sadece kendiniz için ayırın.',
          tips: ['🌟 Bu gücü seni gerçekten heyecanlandıran kişisel tutkularına yönlendir', '🌿 Sağlıklı sınırlar koymayı unutma, her şeye "evet" demek zorunda değilsin', '🏃‍♀️ Hafif bir spor veya yürüyüş bu canlılığı pekiştirir']
        },
        good: {
          title: '😌 İyi & Huzurlu Ruh Hali',
          desc: 'Bedeniniz ve zihniniz tam bir denge içinde. Sakin ve keyifli bir ritimdesiniz.',
          tips: ['☕ Kendinize sevdiğiniz bir kitap veya müzikle vakit ayırın', '💧 Düzenli su içmeyi ihmal etmeyin']
        },
        okay: {
          title: '😐 Normal / Nötr Durum',
          desc: 'Her gün zirvede veya üretken olmak zorunda değilsiniz. Nötr hissetmek de zihnin ve bedenin en doğal dinlenme ve kendini koruma biçimidir.',
          tips: ['🛋️ Kendinizi hiçbir şeyi "halletmek" zorunda hissetmeyin', '🚶‍♀️ 5 dakika derin nefes alarak zihninizi havalandırın']
        },
        bad: {
          title: '😔 Mutsuzluk & Tükenmişlik Hissi',
          desc: '<strong>Şu an hissettiğiniz mutsuzluk veya ağırlık sizin suçunuz değil.</strong> Döngünün bu evresinde progesteron ve östrojenin düşüşü, beyindeki serotonin (mutluluk hormonu) salgısını doğrudan etkiler. Dünya bir günlüğüne bekleyebilir; bugün başkalarını memnun etmek yerine sadece kendinizi dinleme ve koruma gününüzdür.',
          tips: [
            '🛑 <strong>Sınır Koy & "Hayır" De:</strong> Bugün seni yoran işlerden ve insanlardan geri çekilme hakkını kullan.',
            '🛏️ <strong>Suçluluk Duymadan Dinlen:</strong> Dinlenmek tembellik değil, hormonlarının ihtiyaç duyduğu hayati bir onarımdır.',
            '☕ <strong>Sıcak Bir Mola:</strong> Sıcak kakao, melisa veya papatya çayı sinir sistemine "güvendesin" mesajı verir.',
            '🫂 <strong>Kendini Yargılama:</strong> Bu his kalıcı değil; 24-48 saat içinde hormonların yeniden dengelenecektir.'
          ]
        },
        terrible: {
          title: '😢 Yoğun Duygusallık & Kırılganlık',
          desc: '<strong>Gözlerinizin dolması veya ağlama isteğiniz bir zayıflık değildir.</strong> Vücudunuz yoğun bir hormonal fırtınadan geçiyor. "Güçlü durmak" zorunda değilsiniz; bugün sadece kendinize şefkat gösterme vaktidir.',
          tips: [
            '💧 <strong>Ağlamaktan Korkma:</strong> Ağlamak, biriken stres hormonlarını (kortizol) dışarı atmanın en sağlıklı biyolojik yoludur.',
            '🚫 <strong>Büyük Kararları Ertele:</strong> Zihninin yorgun olduğu bu günlerde önemli kararları birkaç gün sonrasına bırak.',
            '🍫 <strong>Kendini Sarıp Sarmala:</strong> Ilık bir duş, yumuşak bir battaniye, biraz bitter çikolata ve sessizlik sana iyi gelecektir.',
            '💖 <strong>Unutma:</strong> Sen çok değerlisin; bedeninin bu sesini dinle ve sadece kendine sarıl.'
          ]
        }
      };

      const m = moodDetails[key] || moodDetails.bad;
      title = m.title;
      body = `
        <div class="symptom-modal-detail">
          <p class="modal-detail-desc" style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 12px;">${m.desc}</p>
          <div class="advice-tips-list">
            ${m.tips.map(t => `<div class="advice-tip-item"><span class="tip-bullet">•</span><span>${t}</span></div>`).join('')}
          </div>
        </div>
      `;
    } else if (type === 'pain') {
      title = '⚡ Ağrı & Kramp Durumu';
      body = `
        <div class="symptom-modal-detail">
          <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 12px;">
            Döngü esnasında rahmin kasılması veya hormonların etkisiyle bel, karın, baş veya eklem hassasiyetleri yaşanması <strong>tamamen beklenen ve normal bir süreçtir</strong>.
          </p>
          <div class="advice-tips-list">
            <div class="advice-tip-item"><span class="tip-bullet">•</span><span>Karın veya beline 15 dk sıcak su torbası uygulayın</span></div>
            <div class="advice-tip-item"><span class="tip-bullet">•</span><span>Çocuk Pozu (Balasana) esnemesi bel ve kalça kaslarını rahatlatır</span></div>
            <div class="advice-tip-item"><span class="tip-bullet">•</span><span>Ilık bir duş ve papatya çayı kas spazmlarını gevşetir</span></div>
          </div>
        </div>
      `;
    } else if (type === 'water') {
      const wCount = parseInt(symptoms.water || 0, 10);
      const wL = (wCount * 0.25).toFixed(1);
      title = `💧 Su Tüketimi: ${wCount} Bardak (~${wL}L)`;
      body = `
        <div class="symptom-modal-detail">
          <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 12px;">
            Günlük ortalama 8 bardak (yaklaşık 2 Litre) su içmek krampları önler, ödemi azaltır ve baş ağrılarını dindirir.
          </p>
          <div style="display: flex; justify-content: center; align-items: center; gap: 16px; margin: 16px 0;">
            <button type="button" class="btn btn-secondary btn-modal-water-minus" style="font-size: 1.2rem; width: 44px; height: 44px; padding: 0;">−</button>
            <span style="font-size: 1.4rem; font-weight: 700;" class="mono">${wCount} Bardak</span>
            <button type="button" class="btn btn-primary btn-modal-water-plus" style="font-size: 1.2rem; width: 44px; height: 44px; padding: 0;">+</button>
          </div>
        </div>
      `;
    } else if (type === 'custom') {
      title = `✨ Özel Belirti: ${key}`;
      body = `
        <div class="symptom-modal-detail">
          <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 12px;">
            Bugün için özel olarak <strong>"${key}"</strong> belirtisini kaydettiniz. Bedeninize iyi bakmayı ve dinlenmeyi ihmal etmeyin.
          </p>
        </div>
      `;
    } else if (type === 'flow') {
      title = '🩸 Kanama Durumu';
      body = `
        <div class="symptom-modal-detail">
          <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 12px;">
            Döngüsel kanama esnasında hijyeni korumak için pedinizi her 3-4 saatte bir yenileyin ve bol sıvı tüketin.
          </p>
        </div>
      `;
    } else if (type === 'discharge') {
      title = '🌟 Akıntı & Doğurganlık Durumu';
      body = `
        <div class="symptom-modal-detail">
          <p style="font-size: 0.9rem; line-height: 1.5; color: var(--text-primary); margin-bottom: 12px;">
            Vajinal salgılar rahim ağzının kendini temizleme ve doğurganlığı düzenleme mekanizmasıdır.
          </p>
        </div>
      `;
    }

    const footer = `
      <div style="display: flex; gap: 8px; width: 100%; justify-content: space-between; align-items: center;">
        <button type="button" class="btn btn-ghost btn-modal-delete" style="color: var(--accent-period);">🗑️ Kaldır</button>
        <div style="display: flex; gap: 8px;">
          <button type="button" class="btn btn-secondary btn-modal-edit">✏️ Günlükte Aç</button>
          <button type="button" class="btn btn-primary btn-modal-close-action">Kapat</button>
        </div>
      </div>
    `;

    showModal(title, body, footer);

    // Modal Buton Olayları
    document.querySelector('.btn-modal-close-action')?.addEventListener('click', hideModal);
    document.querySelector('.btn-modal-edit')?.addEventListener('click', () => {
      hideModal();
      navigateTo('symptoms');
    });

    document.querySelector('.btn-modal-delete')?.addEventListener('click', () => {
      if (type === 'mood') delete symptoms.mood;
      else if (type === 'pain') { delete symptoms.painLevel; delete symptoms.painAreas; }
      else if (type === 'flow') delete symptoms.flow;
      else if (type === 'discharge') delete symptoms.discharge;
      else if (type === 'water') delete symptoms.water;
      else if (type === 'custom') {
        if (Array.isArray(symptoms.customSymptoms)) {
          symptoms.customSymptoms = symptoms.customSymptoms.filter(s => s !== key);
        }
      }
      App.Data.saveSymptoms(todayStr, symptoms);
      App.Utils.showToast(isTr ? 'Belirti kaldırıldı' : 'Symptom removed', 'info');
      hideModal();
      renderDailyInsightWidget(cycleInfo);
    });

    document.querySelector('.btn-modal-water-plus')?.addEventListener('click', () => {
      symptoms.water = Math.min(30, (parseInt(symptoms.water || 0, 10) + 1));
      App.Data.saveSymptoms(todayStr, symptoms);
      hideModal();
      showSymptomDetailModal('water', null, todayStr, symptoms, cycleInfo);
      renderDailyInsightWidget(cycleInfo);
    });

    document.querySelector('.btn-modal-water-minus')?.addEventListener('click', () => {
      symptoms.water = Math.max(0, (parseInt(symptoms.water || 0, 10) - 1));
      App.Data.saveSymptoms(todayStr, symptoms);
      hideModal();
      showSymptomDetailModal('water', null, todayStr, symptoms, cycleInfo);
      renderDailyInsightWidget(cycleInfo);
    });
  }

  /**
   * Gün Sonu Değerlendirmesi: "Günün Nasıl Geçti? 🌙" İnteraktif Kayıt Modalı
   */
  function showEveningCheckInModal(dateStr, initialSymptoms) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const sym = { ...(initialSymptoms || {}) };
    let tempMood = sym.mood || 'good';
    let tempPain = sym.painLevel || 'none';
    let tempFlow = sym.flow || 'none';
    let tempWater = parseInt(sym.water || 4, 10);
    let tempIntimacy = !!sym.intimacy;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
          Bugün bedeninde ve ruhunda hissettiklerini birkaç saniyede işaretle; geçmişe dönüp baktığında döngünü kolayca hatırla 🌸
        </p>

        <!-- 1. Ruh Hali -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">1. Ruh Halin Nasıldı?</label>
          <div class="pain-rating-btn-row" id="checkin-mood-row" style="margin-top: 6px;">
            <button type="button" class="pain-quick-btn ${tempMood === 'great' ? 'active' : ''}" data-val="great"><span>😄</span><span>Harika</span></button>
            <button type="button" class="pain-quick-btn ${tempMood === 'good' ? 'active' : ''}" data-val="good"><span>😊</span><span>İyi</span></button>
            <button type="button" class="pain-quick-btn ${tempMood === 'okay' ? 'active' : ''}" data-val="okay"><span>😐</span><span>Normal</span></button>
            <button type="button" class="pain-quick-btn ${tempMood === 'bad' ? 'active' : ''}" data-val="bad"><span>😔</span><span>Yorgun</span></button>
            <button type="button" class="pain-quick-btn ${tempMood === 'terrible' ? 'active' : ''}" data-val="terrible"><span>😢</span><span>Duygusal</span></button>
          </div>
        </div>

        <!-- 2. Ağrı / Sancı -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">2. Sancı / Ağrı Oldu mu?</label>
          <div class="pain-rating-btn-row" id="checkin-pain-row" style="margin-top: 6px;">
            <button type="button" class="pain-quick-btn ${tempPain === 'none' ? 'active' : ''}" data-val="none"><span>😊</span><span>Yok</span></button>
            <button type="button" class="pain-quick-btn ${tempPain === 'mild' ? 'active' : ''}" data-val="mild"><span>🌱</span><span>Hafif</span></button>
            <button type="button" class="pain-quick-btn ${tempPain === 'moderate' ? 'active' : ''}" data-val="moderate"><span>⚡</span><span>Orta</span></button>
            <button type="button" class="pain-quick-btn ${tempPain === 'severe' ? 'active' : ''}" data-val="severe"><span>🔥</span><span>Şiddetli</span></button>
          </div>
        </div>

        <!-- 3. Kanama / Akıntı -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">3. Kanama / Lekelenme</label>
          <div class="pain-rating-btn-row" id="checkin-flow-row" style="margin-top: 6px;">
            <button type="button" class="pain-quick-btn ${tempFlow === 'none' ? 'active' : ''}" data-val="none"><span>Yok</span></button>
            <button type="button" class="pain-quick-btn ${tempFlow === 'spotting' ? 'active' : ''}" data-val="spotting"><span>Leke</span></button>
            <button type="button" class="pain-quick-btn ${tempFlow === 'light' ? 'active' : ''}" data-val="light"><span>Hafif</span></button>
            <button type="button" class="pain-quick-btn ${tempFlow === 'medium' ? 'active' : ''}" data-val="medium"><span>Orta</span></button>
            <button type="button" class="pain-quick-btn ${tempFlow === 'heavy' ? 'active' : ''}" data-val="heavy"><span>Yoğun</span></button>
          </div>
        </div>

        <!-- 4. Su & Birliktelik -->
        <div style="display: flex; gap: 10px; align-items: center;">
          <div style="flex: 1; background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">💧 Su Tüketimi</div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 4px;">
              <button type="button" class="btn btn-ghost btn-sm" id="btn-water-minus" style="font-size: 1.1rem; width: 30px; height: 30px;">−</button>
              <span id="water-display" style="font-weight: 700;">${tempWater} Bardak</span>
              <button type="button" class="btn btn-ghost btn-sm" id="btn-water-plus" style="font-size: 1.1rem; width: 30px; height: 30px;">+</button>
            </div>
          </div>

          <div style="flex: 1; background: var(--bg-secondary); padding: 8px 12px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary);">❤️ Birliktelik</div>
            <button type="button" class="btn btn-sm btn-block ${tempIntimacy ? 'btn-primary' : 'btn-secondary'}" id="btn-intimacy-toggle" style="margin-top: 4px;">
              ${tempIntimacy ? 'Oldu ❤️' : 'Olmadı'}
            </button>
          </div>
        </div>

        <!-- 5. Not -->
        <div>
          <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">📝 Günün Kısa Notu</label>
          <input type="text" id="checkin-notes" value="${sym.notes || ''}" placeholder="Bugün aklında kalan bir detay..." style="width: 100%; padding: 10px; margin-top: 4px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); font-size: 0.85rem;">
        </div>

        <!-- Kaydet Butonu -->
        <button type="button" class="btn btn-primary btn-block" id="btn-submit-evening-checkin" style="padding: 12px; font-size: 0.95rem; font-weight: 700; background: linear-gradient(135deg, #7b52ab, var(--accent-period)); border: none; margin-top: 4px;">
          ✨ Günü Tamamla & Takvime Kaydet
        </button>
      </div>
    `;

    // Etkileşimler
    modalBody.querySelectorAll('#checkin-mood-row .pain-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalBody.querySelectorAll('#checkin-mood-row .pain-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tempMood = btn.getAttribute('data-val');
      });
    });

    modalBody.querySelectorAll('#checkin-pain-row .pain-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalBody.querySelectorAll('#checkin-pain-row .pain-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tempPain = btn.getAttribute('data-val');
      });
    });

    modalBody.querySelectorAll('#checkin-flow-row .pain-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalBody.querySelectorAll('#checkin-flow-row .pain-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        tempFlow = btn.getAttribute('data-val');
      });
    });

    const waterDisplay = modalBody.querySelector('#water-display');
    modalBody.querySelector('#btn-water-minus')?.addEventListener('click', () => {
      tempWater = Math.max(0, tempWater - 1);
      waterDisplay.textContent = `${tempWater} Bardak`;
    });
    modalBody.querySelector('#btn-water-plus')?.addEventListener('click', () => {
      tempWater = Math.min(30, tempWater + 1);
      waterDisplay.textContent = `${tempWater} Bardak`;
    });

    const intimacyBtn = modalBody.querySelector('#btn-intimacy-toggle');
    intimacyBtn?.addEventListener('click', () => {
      tempIntimacy = !tempIntimacy;
      intimacyBtn.className = `btn btn-sm btn-block ${tempIntimacy ? 'btn-primary' : 'btn-secondary'}`;
      intimacyBtn.textContent = tempIntimacy ? 'Oldu ❤️' : 'Olmadı';
    });

    // Kaydet ve Takvime İşle
    modalBody.querySelector('#btn-submit-evening-checkin')?.addEventListener('click', () => {
      const notesVal = modalBody.querySelector('#checkin-notes')?.value || '';
      
      const newSym = App.Data.getSymptoms(dateStr) || {};
      newSym.mood = tempMood;
      newSym.painLevel = tempPain;
      newSym.flow = tempFlow;
      newSym.water = tempWater;
      newSym.intimacy = tempIntimacy;
      if (notesVal.trim()) newSym.notes = notesVal.trim();

      App.Data.saveSymptoms(dateStr, newSym);
      App.Utils.vibrate([60]);
      hideModal();

      renderDashboard();
      if (App.Calendar && App.Calendar.refresh) {
        App.Calendar.refresh();
      }

      App.Utils.showToast('Gününüz başarıyla kaydedildi ve takvime işlendi 🌙✨', 'success', 3500);
    });

    showModal('🌙 Günün Nasıl Geçti? (Akşam Değerlendirmesi)');
  }

  /**
   * Bilimsel Doğum Aralığı ve Gebelik Şansını Artırma Rehberi Modalı
   */
  function showScientificFertilityModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const settings = App.Data.get('settings') || {};
    const userBirth = settings.userBirth || 'no';
    const lastBirthYears = settings.lastBirthYears || '1_2_years';
    const userAge = settings.userAge || 25;

    let birthAnalysisHtml = '';
    if (userBirth === 'yes') {
      if (lastBirthYears === 'under_1') {
        birthAnalysisHtml = `
          <div style="background: rgba(230, 160, 60, 0.08); border-left: 4px solid #e6a03c; padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom: 12px;">
            <div style="font-weight: 700; color: #b87314; font-size: 0.9rem; margin-bottom: 4px;">🍼 Son Doğum: 1 Yıldan Az (0-12 Ay Önce)</div>
            <p style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.45; margin: 0;">
              • <strong>Biyolojik Durum:</strong> Eğer emziriyorsanız prolaktin hormonu yumurtlamayı geciktirebilir veya luteal fazı kısaltabilir. Rahim içi dokusu (endometrium) ve demir depoları toparlanma sürecindedir.<br>
              • <strong>Kanıtlanmış İpucu:</strong> Ferritin (demir) ve D vitamini seviyenizi ölçtürün. Emzirme aralıkları uzadıkça veya gece emzirmesi azaldıkça doğal ovülasyon hızla geri döner.
            </p>
          </div>
        `;
      } else if (lastBirthYears === '1_2_years') {
        birthAnalysisHtml = `
          <div style="background: rgba(91, 154, 111, 0.08); border-left: 4px solid var(--accent-fertile); padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom: 12px;">
            <div style="font-weight: 700; color: var(--accent-fertile); font-size: 0.9rem; margin-bottom: 4px;">🌿 Son Doğum: 1 - 2 Yıl Önce (Altın Doğurganlık Aralığı)</div>
            <p style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.45; margin: 0;">
              • <strong>Biyolojik Durum:</strong> Dünya Sağlık Örgütü (DSÖ) ve ACOG verilerine göre doğumlar arası 18-24 ay, vücudun tüm mineral depolarını yenilediği en ideal biyolojik aralıktır. Daha önce doğum yapmış kadınlarda rahim ağzı esnekliği ve rahim damarlanması oturmuştur.<br>
              • <strong>Kanıtlanmış İpucu:</strong> İkinci gebelik tutma olasılığı biyolojik olarak çok yüksektir; LH zirvesinden önceki 48 saatte birliktelik en yüksek başarıyı getirir.
            </p>
          </div>
        `;
      } else if (lastBirthYears === '3_5_years') {
        birthAnalysisHtml = `
          <div style="background: rgba(154, 98, 198, 0.08); border-left: 4px solid var(--accent-phase); padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom: 12px;">
            <div style="font-weight: 700; color: var(--accent-phase); font-size: 0.9rem; margin-bottom: 4px;">🌸 Son Doğum: 3 - 5 Yıl Önce</div>
            <p style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.45; margin: 0;">
              • <strong>Biyolojik Durum:</strong> Vücut depoları ve rahim kas dokusu tamamen dinlenmiş ve yenilenmiştir.<br>
              • <strong>Kanıtlanmış İpucu:</strong> Günlük 400 mcg folik asit ve antioksidan (Koenzim Q10) zengini beslenme yumurta hücresi mitokondri sağlığını en üst düzeye çıkarır.
            </p>
          </div>
        `;
      } else {
        birthAnalysisHtml = `
          <div style="background: rgba(212, 85, 107, 0.08); border-left: 4px solid var(--accent-period); padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom: 12px;">
            <div style="font-weight: 700; color: var(--accent-period); font-size: 0.9rem; margin-bottom: 4px;">✨ Son Doğum: 5+ Yıl Önce</div>
            <p style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.45; margin: 0;">
              • <strong>Biyolojik Durum:</strong> Uzun süre sonra beden taze bir gebelik sürecine hazırlanır.<br>
              • <strong>Kanıtlanmış İpucu:</strong> Bazal vücut ısısı ve ovülasyon kiti (LH) kullanarak yumurtlama gününüzü teyit edin.
            </p>
          </div>
        `;
      }
    } else {
      birthAnalysisHtml = `
        <div style="background: rgba(212, 85, 107, 0.08); border-left: 4px solid var(--accent-period); padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom: 12px;">
          <div style="font-weight: 700; color: var(--accent-period); font-size: 0.9rem; margin-bottom: 4px;">🌸 İlk Kez Bebek Düşünenler İçin İstatistikler</div>
          <p style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.45; margin: 0;">
            Sağlıklı bir kadında her ay doğal gebe kalma şansı <strong>%20 - %25</strong> civarındadır. Çiftlerin %85'i 1 yıl içerisinde doğal yolla gebe kalır. Sabırlı ve düzenli takip en güçlü anahtardır.
          </p>
        </div>
      `;
    }

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto; padding-right: 4px;">
        <!-- Tıbbi Feragat Notu -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
          ℹ️ <em><strong>Yasal Bilgilendirme:</strong> Bu içerik Dünya Sağlık Örgütü (DSÖ) ve ACOG kılavuzlarındaki genel bilimsel verilere dayanır. Tıbbi teşhis/tedavi yerine geçmez, kişisel durumunuz için doktorunuza danışınız.</em>
        </div>

        <!-- Kişisel Durum Analizi -->
        ${birthAnalysisHtml}

        <!-- Bilimsel Olarak Kanıtlanmış 5 Gebe Kalma İpucu -->
        <div>
          <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
            🔬 Kanıtlanmış Gebelik Şansını Artırma Yöntemleri
          </h4>

          <div style="display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem; line-height: 1.45; color: var(--text-primary);">
            <div style="background: var(--surface); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-lg);">
              <strong>1. 🌟 Altın Zamanlama (LH Zirvesi):</strong><br>
              Sperm hücresi kadın üreme yollarında <strong>3 ila 5 gün</strong> canlı kalabilir; yumurta ise çatladıktan sonra yalnızca <strong>12-24 saat</strong> yaşar. Bu yüzden en yüksek gebe kalma şansı, ovülasyondan 1-2 gün önceki günlerde girilen birlikteliktir.
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-lg);">
              <strong>2. 💧 Servikal Sıvı (Yumurta Akı Akıntısı):</strong><br>
              Yumurtlama günlerinde vajinal akıntı şeffaf, kaygan ve uzayan çiğ yumurta akı kıvamına gelir. Bu sıvı spermleri asidik ortamdan koruyup rahme taşıyan doğal biyolojik köprüdür.
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-lg);">
              <strong>3. 💊 Folik Asit & D Vitamini:</strong><br>
              Gebe kalmadan en az 2-3 ay önce başlanan günlük 400 mcg folik asit, embriyonun sağlıklı tutunmasını ve nöral tüp gelişimini bilimsel olarak kanıtlanmış şekilde destekler.
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-lg);">
              <strong>4. 🌡️ Bazal Vücut Isısı Artışı:</strong><br>
              Yumurtlama gerçekleştikten sonra progesteron hormonu vücut sıcaklığını 0.3°C - 0.5°C yükseltir. Her sabah yataktan kalkmadan aynı saatte ölçülen ateş ovülasyonu teyit eder.
            </div>

            <div style="background: var(--surface); border: 1px solid var(--border); padding: 10px; border-radius: var(--radius-lg);">
              <strong>5. 🧘‍♀️ Uyku ve Melatonin:</strong><br>
              Günde 7-8 saat karanlıkta kaliteli uyku, over foliküllerini oksidatif stresten koruyan melatonin salgısını maksimize eder.
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block" id="btn-fertility-guide-understand" style="margin-top: 6px; padding: 12px; font-weight: 700; font-size: 0.95rem;">
          Anladım ✨
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-fertility-guide-understand')?.addEventListener('click', () => {
      hideModal();
    });

    showModal('📚 Bilimsel Doğum & Gebe Kalma Rehberi');
  }

  function renderPeriodFAB(cycleInfo) {
    const t = App.I18n.t.bind(App.I18n);
    const fab = document.getElementById('fab-period');
    const label = document.getElementById('fab-period-label');

    if (!fab) return;

    // Bugün adet günü mü kontrol et
    const today = App.Utils.toISODateString(new Date());
    const periodForToday = App.Data.getPeriodForDate(today);
    const isOnPeriod = !!periodForToday;

    if (isOnPeriod) {
      setText('fab-period-label', t('dashboard.periodEnd'));
      fab.classList.add('active');
    } else {
      setText('fab-period-label', t('dashboard.periodStart'));
      fab.classList.remove('active');
    }

    // FAB tıklama olayını temizle ve yeniden ekle
    fab.onclick = () => {
      if (isOnPeriod) {
        // Adeti bitir
        if (periodForToday) {
          App.Data.endPeriod(periodForToday.id, today);
          App.Utils.showToast(t('dashboard.periodEndedMsg'), 'success');
        }
      } else {
        // Yeni adet başlat
        App.Data.addPeriod(today);
        App.Data.set('settings.lastPeriodStart', today);
        App.Utils.showToast(t('dashboard.periodStartedMsg'), 'success');

        // Bildirimleri yeniden planla
        if (App.Notifications && App.Notifications.scheduleAll) {
          App.Notifications.scheduleAll();
        }
      }
      
      // Haptic feedback
      App.Utils.vibrate([50]);
      
      // Dashboard'u yenile
      setTimeout(() => renderDashboard(), 300);
    };
  }

  function renderMedicationWidget() {
    const card = document.getElementById('today-meds-card');
    const list = document.getElementById('today-meds-list');
    if (!card || !list) return;

    const meds = App.Data.getMedications ? App.Data.getMedications() : [];
    const activeMeds = meds.filter(m => m.active);

    if (activeMeds.length === 0) {
      card.style.display = 'none';
      return;
    }

    card.style.display = 'block';
    setText('today-meds-title', App.I18n.t('medication.todayMeds'));

    const today = App.Utils.toISODateString(new Date());
    const todaySymptoms = App.Data.getSymptoms(today) || {};
    const takenMeds = todaySymptoms.medications || [];

    list.innerHTML = '';
    activeMeds.forEach(med => {
      const isTaken = takenMeds.includes(med.id);
      const item = document.createElement('div');
      item.className = `med-widget-item ${isTaken ? 'taken' : ''}`;
      item.innerHTML = `
        <label class="med-widget-check">
          <input type="checkbox" ${isTaken ? 'checked' : ''} data-med-id="${med.id}">
          <span class="med-widget-checkmark"></span>
        </label>
        <span class="med-widget-name">${med.name}</span>
        <span class="med-widget-time mono">${med.time || ''}</span>
      `;
      
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.addEventListener('change', (e) => {
          const medId = e.target.dataset.medId;
          let currentMeds = [...(todaySymptoms.medications || [])];
          if (e.target.checked) {
            if (!currentMeds.includes(medId)) currentMeds.push(medId);
          } else {
            currentMeds = currentMeds.filter(id => id !== medId);
          }
          App.Data.saveSymptoms(today, { ...todaySymptoms, medications: currentMeds });
          item.classList.toggle('taken', e.target.checked);
          App.Utils.vibrate([30]);
        });
      }

      list.appendChild(item);
    });
  }

  // ================================
  // USER PROFILE & AVATAR MANAGER
  // ================================
  function updateProfileHeaderAndHero() {
    const profile = (App.Data && App.Data.getUserProfile) ? App.Data.getUserProfile() : { name: '', avatar: '🌸', avatarType: 'emoji' };
    const userGoal = (App.Data && App.Data.get) ? (App.Data.get('settings.userGoal') || 'track') : 'track';

    const goalNames = {
      track: '🌸 Sancı & Genel Sağlık Modu',
      ttc: '👶 Hamilelik & Bebek Planlama',
      prevent: '🛡️ Doğurganlık & Korunma Modu'
    };

    // Header Avatar & Name
    const headerAvatarEl = document.getElementById('header-user-avatar');
    if (headerAvatarEl) {
      if (profile.avatarType === 'image' && profile.avatar) {
        headerAvatarEl.innerHTML = `<img src="${profile.avatar}" alt="Profil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        headerAvatarEl.innerHTML = profile.avatar || '🌸';
      }
    }

    // Settings Hero Avatar
    const settingsAvatarEl = document.getElementById('settings-avatar-preview');
    if (settingsAvatarEl) {
      if (profile.avatarType === 'image' && profile.avatar) {
        settingsAvatarEl.innerHTML = `<img src="${profile.avatar}" alt="Profil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      } else {
        settingsAvatarEl.innerHTML = profile.avatar || '🌸';
      }
    }

    // Settings Display Name & Goal
    const settingsNameEl = document.getElementById('settings-profile-display-name');
    if (settingsNameEl) {
      settingsNameEl.textContent = profile.name ? `${profile.name} 🌸` : 'Güzel İnsan 🌸';
    }
    const settingsGoalEl = document.getElementById('settings-profile-display-goal');
    if (settingsGoalEl) {
      settingsGoalEl.textContent = goalNames[userGoal] || goalNames.track;
    }
  }

  function showProfileModal() {
    const profile = (App.Data && App.Data.getUserProfile) ? App.Data.getUserProfile() : { name: '', avatar: '🌸', avatarType: 'emoji' };
    const cuteAvatars = ['🌸', '🦋', '👑', '🐱', '🧘‍♀️', '🌿', '🌙', '🤰', '🌺', '🦄', '🍓', '✨', '🦩', '🎀', '🐣', '🌻', '🥑', '🍵'];

    let tempAvatar = profile.avatar || '🌸';
    let tempAvatarType = profile.avatarType || 'emoji';

    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
        <!-- Profil Önizleme -->
        <div id="modal-avatar-preview-box" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid var(--accent-period); box-shadow: 0 4px 14px rgba(212, 85, 107, 0.35); display: flex; align-items: center; justify-content: center; font-size: 2.8rem; overflow: hidden; background: var(--surface); margin-bottom: 14px;">
          ${tempAvatarType === 'image' ? `<img src="${tempAvatar}" style="width: 100%; height: 100%; object-fit: cover;">` : tempAvatar}
        </div>

        <!-- Galeriden Fotoğraf Yükle Butonu -->
        <input type="file" id="modal-avatar-file-input" accept="image/*" style="display: none;">
        <button type="button" class="btn btn-primary btn-sm" id="btn-upload-photo" style="border-radius: var(--radius-full); padding: 8px 18px; font-weight: 700; font-size: 0.84rem; display: flex; align-items: center; gap: 6px; margin-bottom: 16px;">
          <span>📷</span>
          <span>Galeriden / Kameradan Fotoğraf Seç</span>
        </button>

        <!-- İsim / Hitap Alanı -->
        <div style="width: 100%; text-align: left; margin-bottom: 16px;">
          <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: block;">
            İsminiz / Size Nasıl Hitap Edelim?
          </label>
          <input type="text" id="modal-profile-name-input" class="form-input" placeholder="Örn: Ayşe, Merve, Prenses..." value="${profile.name || ''}" style="width: 100%; padding: 10px 14px; border-radius: var(--radius-lg); border: 1.5px solid var(--border); font-size: 0.95rem; font-weight: 600; background: var(--surface); color: var(--text-primary);">
        </div>

        <!-- Veya Sevimli Avatarlardan Seç -->
        <div style="width: 100%; text-align: left;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">
            Veya Hazır Sevimli Bir Avatar Seçin:
          </div>
          <div class="avatar-grid-picker" id="modal-avatar-grid">
            ${cuteAvatars.map(av => `
              <div class="avatar-grid-item ${(tempAvatarType === 'emoji' && tempAvatar === av) ? 'active' : ''}" data-avatar="${av}">
                ${av}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    if (modalFooter) {
      modalFooter.innerHTML = `
        <button type="button" class="btn btn-ghost" id="btn-remove-avatar" style="color: var(--text-secondary); font-size: 0.8rem;">
          Varsayılana Sıfırla
        </button>
        <button type="button" class="btn btn-primary" id="btn-save-profile" style="padding: 8px 22px; font-weight: 700;">
          Kaydet ✓
        </button>
      `;
    }

    const previewBox = modalBody.querySelector('#modal-avatar-preview-box');
    const fileInput = modalBody.querySelector('#modal-avatar-file-input');
    const uploadBtn = modalBody.querySelector('#btn-upload-photo');
    const nameInput = modalBody.querySelector('#modal-profile-name-input');
    const gridItems = modalBody.querySelectorAll('.avatar-grid-item');

    // Galeri / Kamera Yükleme Tetikleyici
    uploadBtn?.addEventListener('click', () => fileInput?.click());

    // Fotoğraf Seçildiğinde (Sıkıştırarak Base64 Yap)
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Offscreen Canvas ile 256x256 kare sıkıştırma
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          canvas.width = maxDim;
          canvas.height = maxDim;
          const ctx = canvas.getContext('2d');

          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          tempAvatar = compressedDataUrl;
          tempAvatarType = 'image';

          if (previewBox) {
            previewBox.innerHTML = `<img src="${tempAvatar}" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
          gridItems.forEach(item => item.classList.remove('active'));
          App.Utils.showToast('Fotoğraf seçildi 📷', 'success');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Hazır Avatar Seçimi
    gridItems.forEach(item => {
      item.addEventListener('click', () => {
        gridItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        const selected = item.getAttribute('data-avatar');
        tempAvatar = selected;
        tempAvatarType = 'emoji';
        if (previewBox) {
          previewBox.innerHTML = selected;
        }
      });
    });

    // Varsayılana Sıfırla
    modalFooter?.querySelector('#btn-remove-avatar')?.addEventListener('click', () => {
      tempAvatar = '🌸';
      tempAvatarType = 'emoji';
      if (nameInput) nameInput.value = '';
      if (previewBox) previewBox.innerHTML = '🌸';
      gridItems.forEach(i => i.classList.toggle('active', i.getAttribute('data-avatar') === '🌸'));
      App.Utils.showToast('Profil sıfırlandı ✨', 'info');
    });

    // Kaydet Butonu
    modalFooter?.querySelector('#btn-save-profile')?.addEventListener('click', () => {
      const newName = nameInput ? nameInput.value.trim() : '';
      if (App.Data && App.Data.setUserProfile) {
        App.Data.setUserProfile(newName, tempAvatar, tempAvatarType);
      }
      updateProfileHeaderAndHero();
      hideModal();
      App.Utils.showToast('Profiliniz kaydedildi 🌸', 'success');
    });

    showModal('🌸 Profil Resmi & İsmi');
  }

  // ================================
  // SETTINGS
  // ================================
  function renderSettings() {
    const t = App.I18n.t.bind(App.I18n);
    const data = App.Data.load();
    const settings = data.settings;

    updateProfileHeaderAndHero();

    // Değerleri doldur
    setText('settings-age-value', settings.userAge || 25);
    setText('settings-cycle-length-value', settings.avgCycleLength || 28);
    setText('settings-period-length-value', settings.avgPeriodLength || 5);

    // Profil seçim kutularını doldur
    const goalSelect = document.getElementById('settings-profile-goal');
    if (goalSelect) goalSelect.value = settings.userGoal || 'track';

    const maritalSelect = document.getElementById('settings-profile-marital');
    if (maritalSelect) maritalSelect.value = settings.userMarital || 'single';

    const birthSelect = document.getElementById('settings-profile-birth');
    const birthYearsRow = document.getElementById('settings-birth-years-row');
    const birthYearsSelect = document.getElementById('settings-profile-birth-years');

    if (birthSelect) {
      birthSelect.value = settings.userBirth || 'no';
      if (birthYearsRow) {
        birthYearsRow.style.display = (settings.userBirth === 'yes') ? 'flex' : 'none';
      }
    }
    if (birthYearsSelect) {
      birthYearsSelect.value = settings.lastBirthYears || '1_2_years';
    }

    // Toggleları ayarla
    setChecked('settings-period-reminder', settings.notifications?.periodReminder ?? true);
    setChecked('settings-ovulation-reminder', settings.notifications?.ovulationReminder ?? true);
    setChecked('settings-daily-reminder', settings.notifications?.dailySymptom ?? true);
    setChecked('settings-med-reminder', settings.notifications?.medicationReminder ?? true);
    setChecked('settings-tips-reminder', settings.notifications?.healthTips ?? true);
    setChecked('settings-irregular-toggle', settings.isIrregularCycle ?? false);
    setChecked('settings-dark-mode', settings.darkMode ?? false);
    setChecked('settings-pin-toggle', settings.pinEnabled ?? false);

    // PIN değiştir butonu
    const changePinBtn = document.getElementById('settings-change-pin');
    if (changePinBtn) {
      changePinBtn.style.display = settings.pinEnabled ? 'block' : 'none';
      changePinBtn.textContent = t('settings.changePin');
    }

    // Dil seçimi aktif durumu
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === App.I18n.getLang());
    });

    // Aktif tema butonunu vurgula
    const currentTheme = App.Data.get('settings.theme') || (App.Data.get('settings.darkMode') ? 'dark' : 'rose');
    document.querySelectorAll('.theme-swatch-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === currentTheme);
    });

    // İlaç listesini render et
    if (App.Medication && App.Medication.render) {
      const medList = document.getElementById('settings-medications-list');
      if (medList) App.Medication.render(medList);
    }
  }

  function initSettingsEvents() {
    const t = App.I18n.t.bind(App.I18n);

    // Yaş +/-
    addClick('settings-age-plus', () => {
      let val = App.Data.get('settings.userAge') || 25;
      val = Math.min(val + 1, 65);
      App.Data.set('settings.userAge', val);
      setText('settings-age-value', val);
    });
    addClick('settings-age-minus', () => {
      let val = App.Data.get('settings.userAge') || 25;
      val = Math.max(val - 1, 12);
      App.Data.set('settings.userAge', val);
      setText('settings-age-value', val);
    });

    // Profil Seçimleri (Hedef, Medeni Durum, Doğum)
    document.getElementById('settings-profile-goal')?.addEventListener('change', (e) => {
      App.Data.set('settings.userGoal', e.target.value);
      App.Utils.showToast('Kullanım amacı güncellendi 🌸', 'success');
      renderDashboard();
    });

    document.getElementById('settings-profile-marital')?.addEventListener('change', (e) => {
      App.Data.set('settings.userMarital', e.target.value);
      App.Utils.showToast('Profil bilgisi güncellendi ✨', 'success');
      renderDashboard();
    });

    document.getElementById('settings-profile-birth')?.addEventListener('change', (e) => {
      App.Data.set('settings.userBirth', e.target.value);
      const birthYearsRow = document.getElementById('settings-birth-years-row');
      if (birthYearsRow) {
        birthYearsRow.style.display = (e.target.value === 'yes') ? 'flex' : 'none';
      }
      App.Utils.showToast('Doğum geçmişi güncellendi 🌿', 'success');
      renderDashboard();
    });

    document.getElementById('settings-profile-birth-years')?.addEventListener('change', (e) => {
      App.Data.set('settings.lastBirthYears', e.target.value);
      App.Utils.showToast('Doğum aralığı kaydedildi ✨', 'success');
      renderDashboard();
    });

    // Döngü süresi +/-
    addClick('settings-cycle-plus', () => {
      let val = App.Data.get('settings.avgCycleLength') || 28;
      val = Math.min(val + 1, 45);
      App.Data.set('settings.avgCycleLength', val);
      setText('settings-cycle-length-value', val);
    });
    addClick('settings-cycle-minus', () => {
      let val = App.Data.get('settings.avgCycleLength') || 28;
      val = Math.max(val - 1, 18);
      App.Data.set('settings.avgCycleLength', val);
      setText('settings-cycle-length-value', val);
    });

    // Adet süresi +/-
    addClick('settings-period-plus', () => {
      let val = App.Data.get('settings.avgPeriodLength') || 5;
      val = Math.min(val + 1, 10);
      App.Data.set('settings.avgPeriodLength', val);
      setText('settings-period-length-value', val);
    });
    addClick('settings-period-minus', () => {
      let val = App.Data.get('settings.avgPeriodLength') || 5;
      val = Math.max(val - 1, 2);
      App.Data.set('settings.avgPeriodLength', val);
      setText('settings-period-length-value', val);
    });

    // Bildirim ve Döngü toggleları
    initToggle('settings-period-reminder', 'settings.notifications.periodReminder');
    initToggle('settings-ovulation-reminder', 'settings.notifications.ovulationReminder');
    initToggle('settings-daily-reminder', 'settings.notifications.dailySymptom');
    initToggle('settings-med-reminder', 'settings.notifications.medicationReminder');
    initToggle('settings-tips-reminder', 'settings.notifications.healthTips');
    initToggle('settings-irregular-toggle', 'settings.isIrregularCycle');

    // Test Bildirimi Gönder Butonu
    addClick('settings-test-notification', () => {
      if (App.Notifications && App.Notifications.sendTestNotification) {
        App.Notifications.sendTestNotification();
      }
    });

    // Renk Teması Seçimi (Canlı Palet)
    document.querySelectorAll('.theme-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        applyTheme(theme);
        const themeNames = {
          rose: 'Gül Kurusu 🌸',
          lavender: 'Lavanta 💜',
          peach: 'Şeftali 🍑',
          sage: 'Adaçayı 🌿',
          classic: 'Klasik Bej 🕊️',
          dark: 'Gece Modu 🌙'
        };
        App.Utils.showToast(`${themeNames[theme] || theme} teması uygulandı ✨`, 'success');
      });
    });

    // Karanlık mod toggle (isteğe bağlı)
    const darkToggle = document.getElementById('settings-dark-mode');
    if (darkToggle) {
      darkToggle.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        applyTheme(isDark ? 'dark' : 'rose');
      });
    }

    // Dil değiştirme
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        App.I18n.setLang(lang);
        App.Data.set('settings.language', lang);
        document.documentElement.lang = lang;
        
        // Tüm metinleri güncelle
        populateAppTexts();
        renderSettings();
        updateHeader(currentScreen);
        
        // Aktif dil butonunu güncelle
        document.querySelectorAll('.lang-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.lang === lang);
        });

        App.Utils.showToast(lang === 'tr' ? 'Dil Türkçe olarak ayarlandı' : 'Language set to English', 'success');
      });
    });

    // PIN toggle
    const pinToggle = document.getElementById('settings-pin-toggle');
    if (pinToggle) {
      pinToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          // PIN ayarla
          showPinSetup(() => {
            App.Data.set('settings.pinEnabled', true);
            const changePinBtn = document.getElementById('settings-change-pin');
            if (changePinBtn) changePinBtn.style.display = 'block';
            App.Utils.showToast(t('pin.pinSetSuccess'), 'success');
          }, () => {
            // İptal edilirse toggle'ı eski haline döndür
            pinToggle.checked = App.Pin.isEnabled();
          });
        } else {
          // PIN kaldır
          if (App.Pin && App.Pin.removePin) {
            App.Pin.removePin();
          }
          App.Data.set('settings.pinEnabled', false);
          App.Data.set('settings.pinHash', null);
          const changePinBtn = document.getElementById('settings-change-pin');
          if (changePinBtn) changePinBtn.style.display = 'none';
          App.Utils.showToast(t('pin.pinRemoved'), 'success');
        }
      });
    }

    // PIN değiştir
    addClick('settings-change-pin', () => {
      showPinSetup(() => {
        App.Utils.showToast(t('pin.pinSetSuccess'), 'success');
      });
    });

    // İlaç ekle
    addClick('settings-add-medication', () => {
      if (App.Medication && App.Medication.renderAddForm) {
        App.Medication.renderAddForm(document.getElementById('modal-body'));
        showModal(t('medication.addMedication'));
      }
    });

    // Veri dışa aktarma
    addClick('settings-export-json', () => {
      if (App.Export && App.Export.exportJSON) {
        App.Export.exportJSON();
      }
    });

    addClick('settings-export-pdf', () => {
      if (App.Export && App.Export.generatePDFReport) {
        App.Export.generatePDFReport();
      }
    });

    // Veri içe aktarma
    addClick('settings-import-json', () => {
      document.getElementById('settings-import-file')?.click();
    });

    const importFile = document.getElementById('settings-import-file');
    if (importFile) {
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && App.Export && App.Export.importJSON) {
          App.Export.importJSON(file);
        }
      });
    }

    addClick('settings-recovery-key-btn', () => {
      if (App.Export && App.Export.showRecoveryKeyModal) {
        App.Export.showRecoveryKeyModal();
      }
    });

    // Profil / Avatar Düzenleme Dinleyicileri
    addClick('header-profile-badge', () => showProfileModal());
    addClick('btn-edit-avatar', () => showProfileModal());
    addClick('btn-open-profile-dialog', () => showProfileModal());

    // Uygulamayı Paylaş (Web Share API)
    addClick('settings-share-app-btn', async () => {
      const shareData = {
        title: 'Döngüm - Regl ve Bebek Takip Uygulaması',
        text: 'Regl döngünü takip et, hamilelik planla ve sağlığını kolayca izle. Ücretsiz ve reklamsız kullan!',
        url: 'https://emrahm5922.github.io/dongum/'
      };
      
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          App.Utils.showToast('Uygulama paylaşıldı! 💖', 'success');
        } else {
          // Fallback if Web Share API is not supported (copy to clipboard)
          await navigator.clipboard.writeText(shareData.url);
          App.Utils.showToast('Uygulama linki kopyalandı! 📋💖', 'success');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Paylaşım hatası:', err);
          App.Utils.showToast('Paylaşım yapılamadı.', 'error');
        }
      }
    });

    // Destek & Geri Bildirim
    addClick('settings-feedback-btn', () => {
      if (App.Support && App.Support.openFeedbackModal) {
        App.Support.openFeedbackModal();
      }
    });

    addClick('settings-faq-btn', () => {
      if (App.Support && App.Support.openFAQModal) {
        App.Support.openFAQModal();
      }
    });

    addClick('settings-kvkk-btn', () => {
      if (App.Support && App.Support.showKVKKModal) {
        App.Support.showKVKKModal();
      }
    });

    addClick('settings-analytics-btn', () => {
      if (App.Analytics && App.Analytics.showAnalyticsModal) {
        App.Analytics.showAnalyticsModal();
      }
    });

    // Tüm verileri sil
    addClick('settings-delete-all', () => {
      const confirmed = confirm(t('settings.deleteConfirmation'));
      if (confirmed) {
        if (App.Data.deleteAll) {
          App.Data.deleteAll();
        }
        App.Utils.showToast(t('settings.dataDeleted'), 'success');
        // Onboarding'e geri dön
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });

    // Modal kapatma
    addClick('modal-close', hideModal);
    addClick('modal-backdrop', (e) => {
      if (e.target.id === 'modal-backdrop') hideModal();
    });
  }

  // ================================
  // UI TEXT POPULATION
  // ================================
  function populateAppTexts() {
    const t = App.I18n.t.bind(App.I18n);

    // Navigation
    setText('nav-label-dashboard', t('nav.dashboard'));
    setText('nav-label-calendar', t('nav.calendar'));
    setText('nav-label-symptoms', t('nav.symptoms'));
    setText('nav-label-stats', t('nav.stats'));
    setText('nav-label-settings', t('nav.settings'));

    // Dashboard
    setText('info-next-period-label', t('dashboard.nextPeriod'));
    setText('info-fertility-label', t('dashboard.fertility'));
    setText('info-ovulation-label', t('dashboard.ovulation'));
    setText('info-pregnancy-label', t('dashboard.pregnancyProb'));
    setText('fab-period-label', t('dashboard.periodStart'));

    // Settings labels
    setText('settings-profile-title', t('settings.profile'));
    setText('settings-cycle-length-label', t('settings.avgCycleLength'));
    setText('settings-period-length-label', t('settings.avgPeriodLength'));
    setText('settings-cycle-unit', t('general.days'));
    setText('settings-period-unit', t('general.days'));
    setText('settings-notifications-title', t('settings.notifications'));
    setText('settings-period-reminder-label', t('settings.periodReminder'));
    setText('settings-ovulation-reminder-label', t('settings.ovulationReminder'));
    setText('settings-daily-reminder-label', t('settings.dailyLogReminder'));
    setText('settings-med-reminder-label', t('settings.medicationReminder'));
    setText('settings-appearance-title', t('settings.appearance'));
    setText('settings-dark-mode-label', t('settings.darkMode'));
    setText('settings-language-label', t('settings.language'));
    setText('settings-security-title', t('settings.security'));
    setText('settings-pin-label', t('settings.pinLock'));
    setText('settings-medications-title', t('medication.medications'));
    setText('settings-add-med-label', t('medication.addMedication'));
    setText('settings-data-title', t('settings.data'));
    setText('settings-export-json-label', t('settings.exportData'));
    setText('settings-export-pdf-label', t('settings.exportPdf'));
    setText('settings-import-label', t('settings.importData'));
    setText('settings-support-title', '💬 ' + (App.I18n.getLang() === 'tr' ? 'Destek & Geri Bildirim' : 'Support & Feedback'));
    setText('settings-feedback-label', App.I18n.getLang() === 'tr' ? 'Hata Bildir / Öneri Gönder' : 'Report Issue / Feedback');
    setText('settings-faq-label', App.I18n.getLang() === 'tr' ? 'Sıkça Sorulan Sorular (SSS)' : 'Frequently Asked Questions (FAQ)');
    setText('settings-danger-title', t('settings.dangerZone'));
    setText('settings-delete-label', t('settings.deleteAllData'));
    setText('settings-privacy-text', t('settings.privacyText'));
    setText('settings-disclaimer-text', t('settings.medicalDisclaimer'));
  }

  // ================================
  // MODAL
  // ================================
  function showModal(title, bodyHTML) {
    const backdrop = document.getElementById('modal-backdrop');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');

    if (titleEl) titleEl.textContent = title || '';
    if (bodyHTML && bodyEl) bodyEl.innerHTML = bodyHTML;
    if (backdrop) {
      backdrop.style.display = 'flex';
      requestAnimationFrame(() => backdrop.classList.add('active'));
    }
  }

  function hideModal() {
    const backdrop = document.getElementById('modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      setTimeout(() => {
        backdrop.style.display = 'none';
      }, 300);
    }
  }

  // Global erişim için window üzerine bağla
  window.showModal = showModal;
  window.hideModal = hideModal;
  window.App.showModal = showModal;
  window.App.hideModal = hideModal;

  // ================================
  // HELPER FUNCTIONS
  // ================================
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text ?? '';
  }

  function setChecked(id, value) {
    const el = document.getElementById(id);
    if (el) el.checked = !!value;
  }

  function addClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  function initToggle(id, dataPath) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        App.Data.set(dataPath, e.target.checked);
      });
    }
  }

  // ================================
  // PUBLIC API
  // ================================
  return {
    init,
    navigateTo,
    showModal,
    hideModal,
    showApp,
    applyTheme,
    renderDashboard,
    renderSettings
  };

})();

// ================================
// UYGULAMA BAŞLATMA & PWA YÜKLEME
// ================================
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const installBtn = document.getElementById('btn-quick-install-header');
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
    installBtn.onclick = async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choiceResult = await deferredInstallPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          installBtn.style.display = 'none';
        }
        deferredInstallPrompt = null;
      }
    };
  }
});

// iOS PWA Install Banner
window.addEventListener('DOMContentLoaded', () => {
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };
  const isStandalone = () => {
    return ('standalone' in window.navigator) && (window.navigator.standalone);
  };
  
  if (isIos() && !isStandalone()) {
    // Show iOS install banner
    const iosBanner = document.createElement('div');
    iosBanner.innerHTML = `
      <div style="position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; background: var(--surface); border: 2px solid var(--accent-period); border-radius: var(--radius-xl); padding: 14px; box-shadow: 0 8px 25px rgba(0,0,0,0.2); z-index: 9999; text-align: center; display: flex; flex-direction: column; gap: 8px;">
        <button id="close-ios-banner" style="position: absolute; top: 4px; right: 8px; background: none; border: none; font-size: 1.2rem; color: var(--text-secondary); cursor: pointer;">✕</button>
        <div style="font-size: 1.5rem; margin-bottom: -4px;">📱</div>
        <h3 style="margin: 0; font-size: 1rem; color: var(--text-primary); font-weight: 800;">Mobil Uygulama Gibi Kullanın!</h3>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
          Tam ekran ve reklamsız kullanım için alttaki <strong>Paylaş</strong> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block; vertical-align:middle; margin-bottom:2px;"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> butonuna basıp<br><strong>"Ana Ekrana Ekle"</strong>yi seçin.
        </p>
        <div style="font-size: 1.5rem; margin-top: 4px; animation: bounce 1.5s infinite;">⬇️</div>
      </div>
      <style>
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
          40% {transform: translateY(-8px);}
          60% {transform: translateY(-4px);}
        }
      </style>
    `;
    document.body.appendChild(iosBanner);
    
    document.getElementById('close-ios-banner').addEventListener('click', () => {
      iosBanner.style.display = 'none';
      localStorage.setItem('ios_install_banner_dismissed', 'true');
    });
    
    if (localStorage.getItem('ios_install_banner_dismissed') === 'true') {
      iosBanner.style.display = 'none';
    }
  }
});


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    App.Main.init();
  });
} else {
  App.Main.init();
}
