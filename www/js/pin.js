window.App = window.App || {};

/**
 * PIN Kilidi Güvenliği Modülü (Maksimum Kararlılık Versiyonu)
 * - Dokunma / Tıklama ve Fiziksel Klavye (0-9, Backspace, Escape) desteği
 * - Eski hash formatları için geriye dönük tam uyumluluk
 * - "PIN'imi Unuttum" acil durum sıfırlama seçeneği
 */
window.App.Pin = {
  isLocked: false,
  attempts: 0,
  maxAttempts: 5,
  lockoutDuration: 30, // saniye
  _currentPin: '',
  _mode: 'unlock', // 'unlock' | 'set' | 'confirm' | 'change'
  _callback: null,
  _onCancel: null,
  _firstPin: null,
  _lockoutTimer: null,
  _bound: false,

  /**
   * PIN ekranını gösterir ve hazırlar
   */
  render(container, mode, callback, onCancel) {
    this._mode = mode;
    this._callback = callback;
    this._onCancel = onCancel || null;
    this._currentPin = '';
    this._firstPin = null;
    this.attempts = 0;

    const screen = document.getElementById('pin-screen');
    if (!screen) return;

    screen.style.display = 'flex';

    // Tuşların tıklanabilir olduğundan emin ol
    const keys = document.querySelectorAll('#pin-pad .pin-key');
    keys.forEach(k => {
      k.disabled = false;
      k.style.pointerEvents = 'auto';
    });

    // Başlık ve alt başlık ayarla
    this._updateTitle();
    this._updateDots();
    this._hideError();

    // İptal butonu (unlock modunda gösterme)
    const cancelBtn = document.getElementById('pin-cancel');
    if (cancelBtn) {
      cancelBtn.style.display = (mode === 'unlock') ? 'none' : 'block';
      cancelBtn.textContent = App.I18n ? App.I18n.t('general.cancel') : 'İptal';
    }

    // "PIN'imi Unuttum" butonu (sadece unlock modunda göster)
    const forgotBtn = document.getElementById('pin-forgot');
    if (forgotBtn) {
      forgotBtn.style.display = (mode === 'unlock') ? 'block' : 'none';
      forgotBtn.textContent = (App.I18n && App.I18n.getLang() === 'en') ? 'Forgot PIN / Reset' : "PIN'imi Unuttum / Sıfırla";
    }

    // Event listener'ları bağla (bir defa)
    if (!this._bound) {
      this._bindEvents();
      this._bound = true;
    }
  },

  /**
   * Event listener'ları tanımlar (Tıklama + Klavye + Acil Sıfırlama)
   */
  _bindEvents() {
    // 1. Ekrandaki Numpad Tuşları
    const pad = document.getElementById('pin-pad');
    if (pad) {
      pad.addEventListener('click', (e) => {
        const btn = e.target.closest('.pin-key');
        if (!btn || btn.disabled) return;

        const key = btn.getAttribute('data-key');
        if (!key) return;

        this._inputKey(key);
      });
    }

    // 2. Fiziksel Klavye Desteği
    window.addEventListener('keydown', (e) => {
      const screen = document.getElementById('pin-screen');
      if (!screen || screen.style.display === 'none') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this._inputKey(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        this._inputKey('backspace');
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        this._inputKey('clear');
      }
    });

    // 3. İptal Butonu
    const cancelBtn = document.getElementById('pin-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        const onCancel = this._onCancel;
        this._close();
        if (onCancel) onCancel();
      });
    }

    // 4. PIN'imi Unuttum Butonu (Güvenli sıfırlama)
    const forgotBtn = document.getElementById('pin-forgot');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', () => {
        const isTr = App.I18n ? (App.I18n.getLang() === 'tr') : true;
        const msg = isTr 
          ? "PIN kilidini kaldırıp uygulamaya girmek istiyor musunuz?" 
          : "Do you want to reset PIN lock and enter the app?";
        
        if (confirm(msg)) {
          this.removePin();
          this.isLocked = false;
          this._close();
          if (window.App.Utils && window.App.Utils.showToast) {
            window.App.Utils.showToast(isTr ? 'PIN kilidi kaldırıldı' : 'PIN lock removed', 'info');
          }
          if (this._callback) this._callback(true);
        }
      });
    }
  },

  /**
   * Bir tuş girişini işler
   */
  _inputKey(key) {
    if (this._lockoutTimer) return; // Kilit süresindeyse giriş yapma

    // Haptic feedback
    if (App.Utils && App.Utils.vibrate) {
      App.Utils.vibrate(25);
    }

    if (key === 'clear') {
      this._currentPin = '';
    } else if (key === 'backspace') {
      this._currentPin = this._currentPin.slice(0, -1);
    } else if (this._currentPin.length < 4 && /^[0-9]$/.test(key)) {
      this._currentPin += key;
    }

    this._updateDots();

    // 4 hane dolduğunda doğrula
    if (this._currentPin.length === 4) {
      setTimeout(() => this._handlePinComplete(), 150);
    }
  },

  /**
   * 4 haneli PIN tamamlandığında moda göre işlem yapar
   */
  _handlePinComplete() {
    const pin = this._currentPin;

    switch (this._mode) {
      case 'unlock':
        if (this.verifyPin(pin)) {
          this.isLocked = false;
          this.attempts = 0;
          this._animateSuccess();
          setTimeout(() => {
            this._close();
            if (this._callback) this._callback(true);
          }, 250);
        } else {
          this.attempts++;
          this._shakeAndReset();

          if (this.attempts >= this.maxAttempts) {
            this._handleLockout();
          } else {
            this._showError(
              (App.I18n ? App.I18n.t('settings.wrongPin') : 'Hatalı PIN') + 
              ` (${this.maxAttempts - this.attempts} ${App.I18n && App.I18n.getLang() === 'tr' ? 'deneme kaldı' : 'attempts left'})`
            );
          }
        }
        break;

      case 'set':
        // İlk PIN girildi -> Onay adımına geç
        this._firstPin = pin;
        this._mode = 'confirm';
        this._currentPin = '';
        this._updateTitle();
        this._updateDots();
        this._hideError();
        break;

      case 'confirm':
        if (pin === this._firstPin) {
          // PIN'ler eşleşti -> Kaydet
          this.setPin(pin);
          this._animateSuccess();
          setTimeout(() => {
            this._close();
            if (this._callback) this._callback(pin);
          }, 250);
        } else {
          // Eşleşmedi -> Başa dön
          this._showError(App.I18n ? App.I18n.t('pin.pinsDontMatch') : 'PIN kodları eşleşmiyor');
          this._shakeAndReset();
          this._mode = 'set';
          this._firstPin = null;
          setTimeout(() => {
            this._updateTitle();
            this._hideError();
          }, 1200);
        }
        break;

      case 'change':
        if (this.verifyPin(pin)) {
          this._mode = 'set';
          this._currentPin = '';
          this._updateTitle();
          this._updateDots();
          this._hideError();
        } else {
          this._showError(App.I18n ? App.I18n.t('settings.wrongPin') : 'Hatalı PIN');
          this._shakeAndReset();
        }
        break;
    }
  },

  /**
   * Başlık ve alt başlığı günceller
   */
  _updateTitle() {
    const titleEl = document.getElementById('pin-title');
    const subtitleEl = document.getElementById('pin-subtitle');

    const titles = {
      unlock: App.I18n ? App.I18n.t('pin.enterYourPin') : "PIN'inizi girin",
      set: App.I18n ? App.I18n.t('pin.setNewPin') : 'Yeni PIN belirleyin',
      confirm: App.I18n ? App.I18n.t('pin.confirmPin') : "PIN'i tekrar girin",
      change: App.I18n ? App.I18n.t('settings.enterPin') : "Mevcut PIN'inizi girin"
    };

    const subtitles = {
      unlock: '',
      set: App.I18n ? App.I18n.t('onboarding.pinDesc') : '4 haneli bir PIN girin',
      confirm: '',
      change: ''
    };

    if (titleEl) titleEl.textContent = titles[this._mode] || '';
    if (subtitleEl) subtitleEl.textContent = subtitles[this._mode] || '';
  },

  /**
   * Noktaları (dots) doldurur / boşaltır
   */
  _updateDots() {
    const dots = document.querySelectorAll('#pin-dots .pin-dot');
    dots.forEach((dot, i) => {
      if (i < this._currentPin.length) {
        dot.classList.add('filled');
        dot.style.backgroundColor = 'var(--accent-phase)';
        dot.style.borderColor = 'var(--accent-phase)';
        dot.style.transform = 'scale(1.15)';
      } else {
        dot.classList.remove('filled');
        dot.style.backgroundColor = 'transparent';
        dot.style.borderColor = 'var(--border)';
        dot.style.transform = 'scale(1)';
      }
    });
  },

  _showError(message) {
    const errorEl = document.getElementById('pin-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  },

  _hideError() {
    const errorEl = document.getElementById('pin-error');
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
  },

  _shakeAndReset() {
    const dotsContainer = document.getElementById('pin-dots');
    if (dotsContainer) {
      dotsContainer.style.animation = 'shake 0.4s ease';
      setTimeout(() => {
        dotsContainer.style.animation = '';
      }, 400);
    }

    if (App.Utils && App.Utils.vibrate) {
      App.Utils.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
      this._currentPin = '';
      this._updateDots();
    }, 250);
  },

  _animateSuccess() {
    const dots = document.querySelectorAll('#pin-dots .pin-dot');
    dots.forEach(dot => {
      dot.style.backgroundColor = 'var(--success)';
      dot.style.borderColor = 'var(--success)';
    });
  },

  _close() {
    const screen = document.getElementById('pin-screen');
    if (screen) {
      screen.style.display = 'none';
    }
    this._currentPin = '';
    this._firstPin = null;
    this._updateDots();
    this._hideError();
  },

  _handleLockout() {
    let remaining = this.lockoutDuration;
    const keys = document.querySelectorAll('#pin-pad .pin-key');
    keys.forEach(k => k.disabled = true);

    this._showError(
      (App.I18n && App.I18n.getLang() === 'tr' 
        ? `Çok fazla deneme. ${remaining} saniye bekleyin.` 
        : `Too many attempts. Wait ${remaining} seconds.`)
    );

    this._lockoutTimer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(this._lockoutTimer);
        this._lockoutTimer = null;
        this.attempts = 0;
        keys.forEach(k => k.disabled = false);
        this._hideError();
      } else {
        this._showError(
          (App.I18n && App.I18n.getLang() === 'tr' 
            ? `Çok fazla deneme. ${remaining} saniye bekleyin.` 
            : `Too many attempts. Wait ${remaining} seconds.`)
        );
      }
    }, 1000);
  },

  // ================================
  // Gelişmiş & Uyumlu Veri İşlemleri
  // ================================
  verifyPin(enteredPin) {
    let storedHash = (App.Data && App.Data.get) ? App.Data.get('settings.pinHash') : null;
    if (!storedHash) {
      storedHash = localStorage.getItem('app_pin');
    }
    if (!storedHash) return true; // Ayarlanmış PIN yoksa izin ver

    // 1. Yeni hash formatı
    if (storedHash === this.hashPin(enteredPin)) return true;

    // 2. Eski format geriye dönük uyumluluk
    if (storedHash === btoa('pin_' + enteredPin + '_salt')) {
      this.setPin(enteredPin); // Yeni formata geçir
      return true;
    }

    // 3. Düz metin PIN uyumluluğu
    if (storedHash === enteredPin) {
      this.setPin(enteredPin);
      return true;
    }

    return false;
  },

  setPin(pin) {
    const hashed = this.hashPin(pin);
    if (App.Data && App.Data.set) {
      App.Data.set('settings.pinHash', hashed);
      App.Data.set('settings.pinEnabled', true);
    }
    localStorage.setItem('app_pin', hashed);
  },

  removePin() {
    if (App.Data && App.Data.set) {
      App.Data.set('settings.pinHash', null);
      App.Data.set('settings.pinEnabled', false);
    }
    localStorage.removeItem('app_pin');
  },

  hashPin(pin) {
    return btoa('dongum_pin_' + pin + '_secure');
  },

  isEnabled() {
    const enabled = (App.Data && App.Data.get) ? App.Data.get('settings.pinEnabled') : false;
    const hasHash = (App.Data && App.Data.get) ? !!App.Data.get('settings.pinHash') : !!localStorage.getItem('app_pin');
    return enabled && hasHash;
  },

  destroy() {
    if (this._lockoutTimer) {
      clearInterval(this._lockoutTimer);
    }
  }
};
