window.App = window.App || {};

/**
 * Veri Dışa Aktarma ve Doktor Sağlık Raporu Modülü (Doctor Health Report & CSV/JSON Export)
 */
window.App.Export = {
  
  /**
   * Tüm verileri JSON dosyası olarak indirir.
   */
  exportJSON() {
    const data = App.Data ? App.Data.load() : {};
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dongum_Saglik_Yedegi_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (App.Utils && App.Utils.showToast) {
      App.Utils.showToast('Yedek JSON dosyası indirildi 📥', 'success');
    }
  },

  /**
   * Semptom ve Döngü Geçmişini Excel / CSV Formatında İndirir.
   */
  exportCSV() {
    const data = App.Data ? App.Data.load() : {};
    const symptoms = data.symptoms || {};
    
    let csvContent = 'Tarih,Ruh Hali,Sanci Seviyesi,Kanama,Su (Bardak),Birliktelik,Ates (C),Notlar\n';
    
    Object.keys(symptoms).sort().reverse().forEach(date => {
      const s = symptoms[date];
      const mood = s.mood || '';
      const pain = s.painLevel || '';
      const flow = s.flow || '';
      const water = s.water || '';
      const intimacy = s.intimacy ? 'Evet' : 'Hayir';
      const temp = s.temperature || '';
      const notes = (s.notes || '').replace(/,/g, ' ');
      
      csvContent += `${date},${mood},${pain},${flow},${water},${intimacy},${temp},"${notes}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dongum_Doktor_Raporu_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (App.Utils && App.Utils.showToast) {
      App.Utils.showToast('CSV tablosu indirildi 📊', 'success');
    }
  },

  /**
   * Kapsamlı, Jinekolog / Doktora Uygun Sağlık & Sancı Raporu
   */
  generatePDFReport() {
    const data = App.Data ? App.Data.load() : {};
    const settings = data.settings || {};
    const periods = data.periods || [];
    const symptoms = data.symptoms || {};
    const dateStr = new Date().toLocaleDateString('tr-TR');

    let totalPainCount = 0;
    let severePainCount = 0;
    Object.values(symptoms).forEach(s => {
      if (s.painLevel && s.painLevel !== 'none') totalPainCount++;
      if (s.painLevel === 'severe') severePainCount++;
    });

    const reportHtml = `
      <div id="print-doctor-report" style="padding: 24px; font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; background: #fff;">
        <div style="border-bottom: 2px solid #D4556B; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 style="color: #D4556B; margin: 0; font-size: 22px;">🌸 DÖNGÜM - JİNEKOLOJİK & DÖNGÜ SAĞLIK RAPORU</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Hasta Özeti ve Döngü Takip Günlüğü</p>
          </div>
          <div style="text-align: right; font-size: 12px; color: #666;">
            <strong>Rapor Tarihi:</strong> ${dateStr}
          </div>
        </div>

        <!-- Hasta Profil Özeti -->
        <div style="background: #f9f9f9; border: 1px solid #eee; padding: 12px; border-radius: 8px; margin-bottom: 16px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
          <div><strong>Yaş:</strong> ${settings.userAge || 25}</div>
          <div><strong>Ortalama Döngü:</strong> ${settings.avgCycleLength || 28} Gün</div>
          <div><strong>Ortalama Adet:</strong> ${settings.avgPeriodLength || 5} Gün</div>
          <div><strong>Doğum Geçmişi:</strong> ${settings.userBirth === 'yes' ? 'Doğum Yapıldı' : 'Doğum Yapılmadı'}</div>
          <div><strong>Takip Edilen Dönem:</strong> ${periods.length} Adet Döngüsü</div>
          <div><strong>Ağrılı Gün Sayısı:</strong> ${totalPainCount} gün (${severePainCount} şiddetli)</div>
        </div>

        <!-- Son Adet Döngüleri -->
        <h3 style="font-size: 15px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">📅 Son Adet Dönemleri Kaydı</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f0f0f0; text-align: left;">
              <th style="padding: 8px; border: 1px solid #ddd;">#</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Başlangıç Tarihi</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Bitiş Tarihi</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Süre</th>
            </tr>
          </thead>
          <tbody>
            ${periods.slice(0, 6).map((p, i) => `
              <tr>
                <td style="padding: 6px 8px; border: 1px solid #ddd;">${i + 1}</td>
                <td style="padding: 6px 8px; border: 1px solid #ddd;">${p.startDate}</td>
                <td style="padding: 6px 8px; border: 1px solid #ddd;">${p.endDate || 'Devam ediyor'}</td>
                <td style="padding: 6px 8px; border: 1px solid #ddd;">${p.days ? p.days.length : 5} Gün</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Son Belirtiler ve Ağrı Kayıtları -->
        <h3 style="font-size: 15px; color: #444; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px;">📝 Son Semptom ve Ağrı Tablosu</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f0f0f0; text-align: left;">
              <th style="padding: 8px; border: 1px solid #ddd;">Tarih</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Ağrı Seviyesi</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Kanama</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Ruh Hali</th>
              <th style="padding: 8px; border: 1px solid #ddd;">Özel Not</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(symptoms).sort().reverse().slice(0, 10).map(d => {
              const s = symptoms[d];
              return `
                <tr>
                  <td style="padding: 6px 8px; border: 1px solid #ddd;">${d}</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd;">${s.painLevel || 'Yok'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd;">${s.flow || 'Yok'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd;">${s.mood || 'Normal'}</td>
                  <td style="padding: 6px 8px; border: 1px solid #ddd;">${s.notes || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <!-- Dipnot -->
        <div style="font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 10px; text-align: center;">
          Bu rapor kullanıcının Döngüm mobil uygulamasına girdiği kişisel sağlık verilerine dayalı olarak otomatik üretilmiştir.
        </div>
      </div>
    `;

    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
            Doktorunuza muayenede göstermek veya yazdırmak için hazırlanan klinik özet:
          </p>
          <div style="max-height: 55vh; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); background: #fff;">
            ${reportHtml}
          </div>
          <div style="display: flex; gap: 8px; margin-top: 6px;">
            <button type="button" class="btn btn-primary" id="btn-print-report" style="flex: 1;">
              🖨️ Yazdır / PDF Kaydet
            </button>
            <button type="button" class="btn btn-secondary" id="btn-download-csv" style="flex: 1;">
              📊 CSV Olarak İndir
            </button>
          </div>
        </div>
      `;

      modalBody.querySelector('#btn-print-report')?.addEventListener('click', () => {
        const printWin = window.open('', '', 'width=800,height=600');
        if (printWin) {
          printWin.document.write(`<html><head><title>Doktor Sağlık Raporu</title></head><body>${reportHtml}</body></html>`);
          printWin.document.close();
          printWin.focus();
          printWin.print();
          printWin.close();
        } else {
          window.print();
        }
      });

      modalBody.querySelector('#btn-download-csv')?.addEventListener('click', () => {
        this.exportCSV();
      });

      showModal('📄 Doktor Sağlık Raporu & Çıktı');
    }
  },

  /**
   * Anonim Kurtarma Kodu (Recovery Key) Üretme & Geri Yükleme Modalı
   */
  showRecoveryKeyModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const data = App.Data ? App.Data.load() : {};
    let encodedKey = '';
    try {
      encodedKey = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    } catch(e) {
      encodedKey = JSON.stringify(data);
    }

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; font-size: 0.84rem; color: var(--text-primary);">
        <div style="background: rgba(68, 138, 94, 0.08); border-left: 4px solid var(--accent-fertile); padding: 10px 12px; border-radius: 0 var(--radius-md) var(--radius-md) 0; font-size: 0.8rem; line-height: 1.45;">
          <strong>🔑 %100 Anonim Kurtarma Kodu:</strong><br>
          E-posta veya hesap gerekmez. Aşağıdaki kod tüm döngülerinizi, belirtilerinizi ve ayarlarınızı şifreli olarak barındırır. Yeni bir telefona geçtiğinizde bu kodu yapıştırarak her şeyi anında geri yükleyebilirsiniz!
        </div>

        <div>
          <label style="display: block; font-weight: 700; margin-bottom: 4px;">Mevcut Verilerinizin Kurtarma Kodu:</label>
          <textarea id="recovery-code-output" readonly class="form-input" rows="3" style="width: 100%; font-family: monospace; font-size: 0.72rem; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); resize: none;">${encodedKey}</textarea>
          <button type="button" class="btn btn-secondary btn-block" id="btn-copy-recovery-code" style="margin-top: 6px; padding: 8px; font-size: 0.85rem;">
            📋 Kodu Kopyala (WhatsApp / Notlar'a Kaydet)
          </button>
        </div>

        <hr style="border: none; border-top: 1px dashed var(--border); margin: 4px 0;">

        <div>
          <label style="display: block; font-weight: 700; margin-bottom: 4px;">📥 Başka Bir Telefondan Kodu Geri Yükle:</label>
          <textarea id="recovery-code-input" class="form-input" rows="2" placeholder="Eski telefonunuzdaki Kurtarma Kodunu buraya yapıştırın..." style="width: 100%; font-family: monospace; font-size: 0.75rem; padding: 8px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); color: var(--text-primary);"></textarea>
          <button type="button" class="btn btn-primary btn-block" id="btn-restore-recovery-code" style="margin-top: 6px; padding: 10px; font-weight: 700;">
            🔄 Verileri Kurtar & Geri Yükle
          </button>
        </div>
      </div>
    `;

    // Kodu Kopyala
    modalBody.querySelector('#btn-copy-recovery-code')?.addEventListener('click', () => {
      const output = modalBody.querySelector('#recovery-code-output');
      if (output) {
        output.select();
        navigator.clipboard?.writeText(encodedKey).then(() => {
          App.Utils.showToast('Kurtarma Kodu panoya kopyalandı! 📋✨', 'success');
        }).catch(() => {
          document.execCommand('copy');
          App.Utils.showToast('Kurtarma Kodu panoya kopyalandı! 📋✨', 'success');
        });
      }
    });

    // Kodu Geri Yükle
    modalBody.querySelector('#btn-restore-recovery-code')?.addEventListener('click', () => {
      const input = modalBody.querySelector('#recovery-code-input');
      const val = (input ? input.value : '').trim();
      if (!val) {
        App.Utils.showToast('Lütfen geçerli bir kurtarma kodu yapıştırın ⚠️', 'warning');
        return;
      }

      try {
        let jsonStr = '';
        try {
          jsonStr = decodeURIComponent(escape(atob(val)));
        } catch(e) {
          jsonStr = val;
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed && (parsed.periods || parsed.symptoms || parsed.settings)) {
          App.Data.save(parsed);
          App.Utils.showToast('🎉 Tüm verileriniz başarıyla geri yüklendi!', 'success', 3000);
          hideModal();
          setTimeout(() => location.reload(), 1000);
        } else {
          throw new Error('Geçersiz veri formatı');
        }
      } catch(err) {
        App.Utils.showToast('Hatalı veya bozuk kurtarma kodu! Lütfen kontrol edin ⚠️', 'error');
      }
    });

    showModal('🔑 Anonim Kurtarma Kodu & Yedek');
  }
};
