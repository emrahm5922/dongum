window.App = window.App || {};

/**
 * Destek & Geri Bildirim Modülü (Support & Feedback Module)
 * Kullanıcıların hata bildirmesi, öneri göndermesi ve SSS rehberine ulaşmasını sağlar.
 * Hem doğrudan API ile arka planda e-posta iletir, hem de e-posta istemcisi/pano yedeklerini sunar.
 */
window.App.Support = {
  // Geri bildirimlerin gideceği hedef iletişim adresi
  SUPPORT_EMAIL: 'emrahm4@gmail.com',

  /**
   * Geri Bildirim Formunu Modal İçinde Açar
   */
  openFeedbackModal() {
    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const backdrop = document.getElementById('modal-backdrop');

    if (!modalBody || !backdrop) return;

    if (modalTitle) {
      modalTitle.textContent = isTr ? '💬 Geri Bildirim & Hata Bildir' : '💬 Send Feedback & Report Issue';
    }

    // Otomatik cihaz & teşhis bilgisi
    const deviceInfo = this._getDeviceInfo();

    modalBody.innerHTML = `
      <div class="feedback-form" style="display: flex; flex-direction: column; gap: 12px;">
        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
          ${isTr 
            ? 'Uygulamada çalışmayan bir özellik mi fark ettiniz veya yeni bir öneriniz mi var? Yazıp doğrudan gönderin, hızla ilgilenelim.' 
            : 'Noticed a broken feature or have a suggestion? Send it directly so we can resolve it quickly.'}
        </p>

        <div class="form-group">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
            ${isTr ? 'Geri Bildirim Türü' : 'Feedback Type'}
          </label>
          <select id="feedback-type" class="form-input" style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text-primary);">
            <option value="Hata">${isTr ? '🐛 Hata / Çalışmayan Özellik' : '🐛 Bug / Broken Feature'}</option>
            <option value="Öneri">${isTr ? '💡 Yeni Özellik / Tasarım Önerisi' : '💡 Feature / Design Suggestion'}</option>
            <option value="Çeviri">${isTr ? '🌐 Çeviri / Yazım Hatası' : '🌐 Translation / Typo'}</option>
            <option value="Genel">${isTr ? '💬 Genel Görüş / Diğer' : '💬 General Feedback / Other'}</option>
          </select>
        </div>

        <div class="form-group">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
            ${isTr ? 'Konu' : 'Subject'}
          </label>
          <input type="text" id="feedback-subject" class="form-input" style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text-primary);" placeholder="${isTr ? 'Örn: Bildirim gelmedi / Tema önerisi' : 'e.g. Notification issue'}" required>
        </div>

        <div class="form-group">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
            ${isTr ? 'Açıklama & Detaylar' : 'Description & Details'}
          </label>
          <textarea id="feedback-message" class="form-input" rows="4" style="width: 100%; padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text-primary); resize: vertical;" placeholder="${isTr ? 'Lütfen karşılaştığınız durumu veya fikrinizi kısaca açıklayın...' : 'Please describe the issue or suggestion...'}" required></textarea>
        </div>

        <div class="form-group" style="display: flex; align-items: flex-start; gap: 8px; font-size: 0.8rem; color: var(--text-secondary);">
          <input type="checkbox" id="feedback-include-device" checked style="margin-top: 3px;">
          <label for="feedback-include-device">
            ${isTr ? 'Sorunun hızlı çözülmesi için cihaz ve sistem bilgilerini ekle' : 'Include device and browser diagnostics'}
          </label>
        </div>

        <div id="feedback-status-msg" style="display: none; font-size: 0.85rem; padding: 8px 12px; border-radius: var(--radius-md); text-align: center;"></div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; flex-wrap: wrap;">
          <button type="button" class="btn btn-secondary" id="btn-copy-diagnostics" title="${isTr ? 'Hata raporunu panoya kopyala' : 'Copy diagnostic report'}">
            📋 ${isTr ? 'Raporu Kopyala' : 'Copy'}
          </button>
          <button type="button" class="btn btn-primary" id="btn-send-feedback" style="min-width: 130px;">
            🚀 <span id="btn-send-text">${isTr ? 'Hemen Gönder' : 'Send Directly'}</span>
          </button>
        </div>
      </div>
    `;

    backdrop.style.display = 'flex';

    // Raporu Kopyala Butonu
    modalBody.querySelector('#btn-copy-diagnostics')?.addEventListener('click', () => {
      const type = modalBody.querySelector('#feedback-type').value;
      const subject = modalBody.querySelector('#feedback-subject').value || (isTr ? 'Geri Bildirim' : 'Feedback');
      const message = modalBody.querySelector('#feedback-message').value || '';
      
      const fullReport = `=== DÖNGÜM GERİ BİLDİRİM RAPORU ===\nTür: ${type}\nKonu: ${subject}\nMesaj: ${message}\n\n=== CİHAZ TEŞHİS BİLGİSİ ===\n${deviceInfo}\n===============================`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullReport).then(() => {
          if (window.App.Utils && window.App.Utils.showToast) {
            window.App.Utils.showToast(isTr ? 'Rapor panoya kopyalandı 📋' : 'Report copied to clipboard 📋', 'success');
          }
        });
      } else {
        alert(fullReport);
      }
    });

    // Doğrudan API ile E-posta Gönder Butonu (Arka Planda Gönderim)
    modalBody.querySelector('#btn-send-feedback')?.addEventListener('click', async () => {
      const typeEl = modalBody.querySelector('#feedback-type');
      const subjectEl = modalBody.querySelector('#feedback-subject');
      const messageEl = modalBody.querySelector('#feedback-message');
      const includeDevice = modalBody.querySelector('#feedback-include-device').checked;
      const sendBtn = modalBody.querySelector('#btn-send-feedback');
      const sendText = modalBody.querySelector('#btn-send-text');
      const statusMsg = modalBody.querySelector('#feedback-status-msg');

      const subjectText = subjectEl.value.trim();
      const messageText = messageEl.value.trim();

      if (!subjectText || !messageText) {
        if (window.App.Utils && window.App.Utils.showToast) {
          window.App.Utils.showToast(isTr ? 'Lütfen konu ve açıklama alanlarını doldurun' : 'Please fill in subject and description', 'warning');
        }
        return;
      }

      // Butonu yükleniyor durumuna getir
      sendBtn.disabled = true;
      sendText.textContent = isTr ? 'Gönderiliyor...' : 'Sending...';

      let fullMessage = `Kategori: ${typeEl.value}\nKonu: ${subjectText}\n\nMesaj:\n${messageText}\n\n`;
      if (includeDevice) {
        fullMessage += `--- Teşhis Bilgileri ---\n${deviceInfo}\n`;
      }

      try {
        // FormSubmit AJAX HTTPS Endpoint
        const response = await fetch(`https://formsubmit.co/ajax/${this.SUPPORT_EMAIL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: 'Döngüm Kullanıcısı',
            _subject: `[Döngüm ${typeEl.value.toUpperCase()}] ${subjectText}`,
            email: 'noreply-dongum@app.local',
            message: fullMessage,
            _captcha: 'false'
          })
        });

        if (response.ok) {
          // Başarılı
          if (window.App.Utils && window.App.Utils.showToast) {
            window.App.Utils.showToast(isTr ? 'Geri bildiriminiz başarıyla iletildi! Teşekkürler 🌸' : 'Feedback sent successfully! Thank you 🌸', 'success', 5000);
          }
          backdrop.style.display = 'none';
        } else {
          throw new Error('API response not ok');
        }
      } catch (err) {
        console.warn('Direct submit failed, using mailto fallback:', err);
        // Fallback: Mailto linki ile e-posta uygulamasını aç
        const emailSubject = encodeURIComponent(`[Döngüm ${typeEl.value.toUpperCase()}] ${subjectText}`);
        const mailtoLink = `mailto:${this.SUPPORT_EMAIL}?subject=${emailSubject}&body=${encodeURIComponent(fullMessage)}`;
        
        try {
          window.open(mailtoLink, '_system');
        } catch {
          window.location.href = mailtoLink;
        }

        if (window.App.Utils && window.App.Utils.showToast) {
          window.App.Utils.showToast(isTr ? 'E-posta uygulamanız açıldı, gönderebilirsiniz ✉️' : 'Email client opened, please send ✉️', 'info');
        }
        backdrop.style.display = 'none';
      } finally {
        sendBtn.disabled = false;
        sendText.textContent = isTr ? 'Hemen Gönder' : 'Send Directly';
      }
    });
  },

  /**
   * Sıkça Sorulan Sorular (SSS) Modalını Açar
   */
  openFAQModal() {
    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    const backdrop = document.getElementById('modal-backdrop');

    if (!modalBody || !backdrop) return;

    if (modalTitle) {
      modalTitle.textContent = isTr ? '❓ Sıkça Sorulan Sorular' : '❓ Frequently Asked Questions';
    }

    const faqItems = isTr ? [
      {
        q: 'Döngüm ve yumurtlama günüm nasıl hesaplanıyor?',
        a: 'Uygulama son 3 ila 6 döngünüzün hareketli ortalamasını alır. Tıbbi klinik standartlara göre yumurtlama (ovulasyon) her zaman sonraki tahmini reglden 14 gün öncedir. Doğurganlık penceresi ise yumurtlamanın 3 gün öncesi ile 1 gün sonrasını kapsar.'
      },
      {
        q: 'Bildirimler gelmiyor, ne yapmalıyım?',
        a: '1) Ayarlar > Bildirimler bölümünde hatırlatıcıların açık olduğundan emin olun. 2) Telefonunuzun tarayıcı ayarlarından Döngüm uygulaması için "Bildirimlere İzin Ver" seçeneğini aktif hale getirin. 3) Telefonunuzun pil tasarrufu modunda bildirimleri kısıtlamadığını kontrol edin.'
      },
      {
        q: 'Verilerim güvende mi, sunucuya yükleniyor mu?',
        a: 'Tüm regl, sağlık, semptom ve şifre (PIN) verileriniz YALNIZCA sizin telefonunuzda (cihaz içi hafızada) saklanır. Hiçbir veriniz üçüncü şahıslara veya harici sunuculara gönderilmez.'
      },
      {
        q: 'Ağrı ve kanama tavsiyeleri neye göre veriliyor?',
        a: 'Günlük ekranındaki tüm tavsiyeler Dünya Sağlık Örgütü (WHO) ve Amerikan Kadın Doğum Uzmanları Koleji (ACOG) halka açık jinekoloji rehberleri baz alınarak derlenmiştir. Bu bilgiler genel tavsiye niteliğindedir ve tıbbi teşhis yerine geçmez.'
      },
      {
        q: 'Telefonumu değiştirirsem verilerimi nasıl aktarırım?',
        a: 'Ayarlar > Veri bölümünden "Verileri Dışa Aktar (JSON)" butonuna basarak yedek dosyanızı indirin. Yeni telefonunuzda Döngüm\'ü açıp "Verileri İçe Aktar" diyerek bu dosyayı yüklediğinizde tüm geçmişiniz geri yüklenir.'
      }
    ] : [
      {
        q: 'How is my cycle and ovulation calculated?',
        a: 'The app calculates the moving average of your last 3-6 cycles. Following gynecological standards, ovulation occurs ~14 days prior to your next predicted period, with a 5-day fertile window.'
      },
      {
        q: 'Notifications are not appearing, what should I do?',
        a: 'Ensure notification reminders are turned ON in Settings, and check that your browser/device settings grant notification permissions to MyCycle.'
      },
      {
        q: 'Is my personal health data safe?',
        a: 'Yes, 100%. All your menstrual, symptom, and PIN data is stored strictly locally on your device. Nothing is uploaded to external servers.'
      },
      {
        q: 'How can I transfer data to a new phone?',
        a: 'Go to Settings > Data and click "Export Data (JSON)" to save a backup file. On your new phone, click "Import Data" to restore all your history.'
      }
    ];

    modalBody.innerHTML = `
      <div class="faq-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 60vh; overflow-y: auto; padding-right: 4px;">
        ${faqItems.map((item, idx) => `
          <div class="faq-item" style="background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden;">
            <button type="button" class="faq-question-btn" data-faq-idx="${idx}" style="width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: transparent; border: none; font-size: 0.9rem; font-weight: 600; color: var(--text-primary); text-align: left; cursor: pointer;">
              <span>${item.q}</span>
              <span class="faq-arrow" style="transition: transform 0.2s ease;">▼</span>
            </button>
            <div class="faq-answer-content" id="faq-ans-${idx}" style="display: none; padding: 0 14px 12px; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; border-top: 1px dashed var(--border); padding-top: 10px;">
              ${item.a}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    backdrop.style.display = 'flex';

    // Accordion açma/kapama
    modalBody.querySelectorAll('.faq-question-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = e.currentTarget.getAttribute('data-faq-idx');
        const ans = modalBody.querySelector(`#faq-ans-${idx}`);
        const arrow = e.currentTarget.querySelector('.faq-arrow');

        if (ans) {
          const isOpen = ans.style.display === 'block';
          ans.style.display = isOpen ? 'none' : 'block';
          if (arrow) arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });
    });
  },

  /**
   * 6698 Sayılı KVKK ve Gizlilik Aydınlatma Metni Modalı
   */
  showKVKKModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto; padding-right: 4px; font-size: 0.82rem; line-height: 1.5; color: var(--text-primary);">
        <div style="background: rgba(68, 138, 94, 0.08); border-left: 4px solid var(--accent-fertile); padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0;">
          <strong>🔒 Sıfır Bilgi & Çevrimdışı Güvencesi:</strong><br>
          Döngüm uygulaması kullanıcıdan ad, soyad, e-posta, telefon veya T.C. kimlik numarası gibi hiçbir kimlik verisi <u>toplamaz ve talep etmez</u>.
        </div>

        <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 6px 0 0 0;">
          1. Veri Sorumlusu ve Yerel Saklama
        </h4>
        <p style="margin: 0;">
          6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, girdiğiniz adet günleri, belirtiler ve notlar <strong>yalnızca kendi cihazınızın yerel hafızasında (localStorage/SQLite)</strong> şifreli olarak tutulur. Harici bir bulut sunucusuna aktarılmaz.
        </p>

        <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 6px 0 0 0;">
          2. Verilerin İşlenme Amacı
        </h4>
        <p style="margin: 0;">
          Girdiğiniz veriler yalnızca cihazınızda çalışan algoritmalar tarafından sonraki adet ve doğurganlık günlerinizi tahmin etmek, ağrı durumunuzu grafiklendirmek amacıyla kullanılır.
        </p>

        <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 6px 0 0 0;">
          3. Kullanıcı Hakları (KVKK Madde 11)
        </h4>
        <p style="margin: 0;">
          Kullanıcı dilediği zaman <strong>Ayarlar > Veri Yönetimi</strong> bölümünden verilerini JSON veya CSV olarak dışa aktarabilir, cihazını sıfırlayarak tüm kayıtları tek tuşla kalıcı olarak silebilir.
        </p>

        <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 6px 0 0 0;">
          4. Üçüncü Kişilerle Paylaşım
        </h4>
        <p style="margin: 0;">
          Sağlık verileriniz ticari veya reklam amaçlı hiçbir 3. taraf kişi, kurum veya reklam ağıyla asla paylaşılmaz.
        </p>

        <button type="button" class="btn btn-primary btn-block" id="btn-close-kvkk" style="margin-top: 8px; padding: 10px; font-weight: 700;">
          Okudum & Anladım ✨
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-close-kvkk')?.addEventListener('click', () => {
      hideModal();
    });

    showModal('📜 KVKK & Gizlilik Aydınlatma Metni');
  },

  /**
   * Cihaz, sistem ve son hata teşhis kayıtlarını derler
   */
  _getDeviceInfo() {
    let recentErrors = [];
    try {
      recentErrors = JSON.parse(localStorage.getItem('app_recent_errors') || '[]');
    } catch(e) {}

    return [
      `Uygulama: Döngüm v1.0.0 (Android/Web Native)`,
      `Tarih: ${new Date().toISOString()}`,
      `Platform / OS: ${navigator.userAgent}`,
      `Ekran Çözünürlüğü: ${window.innerWidth}x${window.innerHeight}`,
      `Aktif Dil: ${window.App.I18n ? window.App.I18n.getLang() : 'tr'}`,
      `Son Hata Logları (${recentErrors.length}): ${recentErrors.length > 0 ? JSON.stringify(recentErrors.slice(-3)) : 'Temiz (Hata Yok)'}`
    ].join('\n');
  }
};

// Global Otomatik Hata Yakalayıcı (Crash & Error Logger)
window.addEventListener('error', (event) => {
  try {
    const errLog = {
      message: event.message,
      file: event.filename,
      line: event.lineno,
      col: event.colno,
      time: new Date().toISOString()
    };
    let list = JSON.parse(localStorage.getItem('app_recent_errors') || '[]');
    list.push(errLog);
    if (list.length > 10) list = list.slice(-10);
    localStorage.setItem('app_recent_errors', JSON.stringify(list));
    console.warn('[CrashLogger] Yakalanan Hata:', errLog);
  } catch(e) {}
});
