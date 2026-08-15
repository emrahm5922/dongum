window.App = window.App || {};

/**
 * Hamilelik & Bebek Gelişimi Modülü (Pregnancy & Baby Development Tools)
 * 1. 1-40 Hafta Meyve/Sebze Boyut Karşılaştırmalı Bebek Gelişim Takvimi
 * 2. Fetal Tekme Sayacı (Kick Counter)
 * 3. Doğum Sancısı / Kasılma Zamanlayıcısı (Contraction Timer - 5-1-1 Kuralı)
 */
window.App.Pregnancy = {
  currentWeek: 12,
  kickCount: 0,
  kickStartTime: null,
  kickTimerInterval: null,
  contractionActive: false,
  contractionStartTime: null,
  contractions: [],

  // 1 - 40 Hafta Detaylı Gelişim Veritabanı
  weeksData: {
    4: { fruit: 'Haşhaş Tohumu 🌾', size: '1 mm', weight: '< 1 gr', desc: 'Blastokist rahme tutundu. Plasenta ve amniyotik kese oluşmaya başlıyor.' },
    6: { fruit: 'Mercimek Tanesi 🫘', size: '4-5 mm', weight: '< 1 gr', desc: 'Kalp tüpü atmaya başladı. Kol ve bacak tomurcukları beliriyor.' },
    8: { fruit: 'Ahududu 🫐', size: '1.6 cm', weight: '1 gr', desc: 'Göz kapakları, burun ucu ve minik parmaklar şekilleniyor. Beden sürekli kıpırdıyor.' },
    10: { fruit: 'Çilek 🍓', size: '3.1 cm', weight: '4 gr', desc: 'Embriyo evresi bitti, artık resmi olarak bir fetüs! Tüm hayati organlar yerli yerinde.' },
    12: { fruit: 'Misket Limonu 🍋', size: '5.4 cm', weight: '14 gr', desc: 'Refleksler gelişti, parmaklarını açıp kapayabiliyor. 1. Trimester tamamlanıyor!' },
    14: { fruit: 'Kivi 🥝', size: '8.7 cm', weight: '43 gr', desc: 'Bebek yüz ifadeleri yapabiliyor ve parmağını emmeye başlıyor. Cinsiyet organları belirginleşiyor.' },
    16: { fruit: 'Avokado 🥑', size: '11.6 cm', weight: '100 gr', desc: 'Gözleri ışığı algılayabiliyor, kalp günde 25 litre kan pompalıyor.' },
    18: { fruit: 'Dolmalık Biber 🫑', size: '14.2 cm', weight: '190 gr', desc: 'Kulakları sesleri duyuyor! Dış dünyadaki seslere ve müziğe tepki verebilir.' },
    20: { fruit: 'Muz 🍌', size: '25.6 cm', weight: '300 gr', desc: 'Yarı yolu tamamladınız! İlk hafif tekmeleri (kelebek kıpırtısı) hissetmeye başlayabilirsiniz.' },
    24: { fruit: 'Mısır Koçanı 🌽', size: '30 cm', weight: '600 gr', desc: 'Akciğerlerde sürfaktan üretimi başlıyor. Beyin dalgaları uyku ve uyanıklık ritmine girdi.' },
    28: { fruit: 'Patlıcan 🍆', size: '37.6 cm', weight: '1.0 kg', desc: '3. Trimester başladı! Gözlerini açıp kapayabiliyor, rüya görmeye başlıyor.' },
    32: { fruit: 'Hindistan Cevizi 🥥', size: '42.4 cm', weight: '1.7 kg', desc: 'Tırnakları ve saçları uzadı. Kemikleri sertleşiyor ama kafatası doğum için esnek kalıyor.' },
    36: { fruit: 'Kavun 🍈', size: '47.4 cm', weight: '2.6 kg', desc: 'Doğum pozisyonunu alıyor (baş aşağı). Akciğerleri neredeyse tamamen olgunlaştı.' },
    40: { fruit: 'Büyük Karpuz 🍉', size: '51.2 cm', weight: '3.4 kg', desc: 'Tebrikler, bebeğiniz dünyaya gelmeye tamamen hazır! Mucizenize kavuşma zamanı ✨' }
  },

  getWeekData(week) {
    if (this.weeksData[week]) return this.weeksData[week];
    const availableWeeks = Object.keys(this.weeksData).map(Number).sort((a, b) => a - b);
    let closest = availableWeeks[0];
    for (let w of availableWeeks) {
      if (week >= w) closest = w;
    }
    return this.weeksData[closest];
  },

  /**
   * Hamilelik & Bebek Araçları Ana Modalı
   */
  showPregnancyHubModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const savedWeek = parseInt(localStorage.getItem('pregnancy_current_week') || '12', 10);
    this.currentWeek = savedWeek;
    const weekInfo = this.getWeekData(this.currentWeek);

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px; max-height: 75vh; overflow-y: auto; padding-right: 4px;">
        
        <!-- Sekme Başlıkları -->
        <div style="display: flex; gap: 6px; background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-lg);">
          <button type="button" class="btn btn-sm preg-tab-btn active" data-tab="growth" style="flex: 1; font-size: 0.8rem; font-weight: 700;">
            🌱 Bebek Gelişimi
          </button>
          <button type="button" class="btn btn-sm preg-tab-btn" data-tab="kick" style="flex: 1; font-size: 0.8rem; font-weight: 700;">
            👣 Tekme Sayacı
          </button>
          <button type="button" class="btn btn-sm preg-tab-btn" data-tab="contraction" style="flex: 1; font-size: 0.8rem; font-weight: 700;">
            ⏱️ Sancı Sayacı
          </button>
        </div>

        <!-- 1. BEBEK GELİŞİMİ SEKMESİ -->
        <div id="preg-tab-growth" class="preg-tab-content">
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">GEBELİK HAFTANIZ</span>
              <span id="preg-week-display" style="font-size: 1.1rem; font-weight: 700; color: #b87314;">${this.currentWeek}. Hafta</span>
            </div>
            <input type="range" id="preg-week-slider" min="4" max="40" value="${this.currentWeek}" step="1" style="width: 100%; accent-color: #e6a03c; cursor: pointer;">
          </div>

          <div id="preg-card-content" style="background: linear-gradient(135deg, rgba(230, 160, 60, 0.1), rgba(230, 160, 60, 0.02)); border: 1px solid rgba(230, 160, 60, 0.3); border-radius: var(--radius-xl); padding: 14px; text-align: center;">
            <div style="font-size: 2.2rem; margin-bottom: 4px;">${weekInfo.fruit.split(' ')[1] || '🍋'}</div>
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #b87314; margin: 0 0 6px 0;">Bebeğiniz Bir ${weekInfo.fruit} Boyutunda!</h3>
            
            <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 10px; font-size: 0.85rem; font-weight: 600;">
              <span style="background: var(--surface); padding: 4px 10px; border-radius: var(--radius-full); border: 1px solid var(--border);">📏 Boy: ${weekInfo.size}</span>
              <span style="background: var(--surface); padding: 4px 10px; border-radius: var(--radius-full); border: 1px solid var(--border);">⚖️ Kilo: ${weekInfo.weight}</span>
            </div>

            <p style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.45; text-align: left; background: var(--surface); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border); margin: 0;">
              ${weekInfo.desc}
            </p>
          </div>
        </div>

        <!-- 2. FETAL TEKME SAYACI SEKMESİ -->
        <div id="preg-tab-kick" class="preg-tab-content" style="display: none; text-align: center;">
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">
            ACOG Kılavuzu: 28. haftadan sonra günde 1 kez, bebeğin 10 hareketini sayın. 2 saat içinde 10 hareket sağlıklı kabul edilir.
          </p>

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 16px; margin-bottom: 10px;">
            <div id="kick-counter-display" style="font-size: 3rem; font-weight: 700; color: #b87314; line-height: 1;">0</div>
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-top: 4px;">/ 10 Tekme Hedefi</div>
            
            <button type="button" class="btn btn-primary btn-lg" id="btn-add-kick" style="margin-top: 12px; width: 100%; padding: 14px; font-size: 1.05rem; font-weight: 700; background: linear-gradient(135deg, #e6a03c, #c27d14); border: none;">
              👣 Tekme Hissettim (+1)
            </button>

            <button type="button" class="btn btn-ghost btn-sm" id="btn-reset-kicks" style="margin-top: 8px; font-size: 0.75rem;">
              🔄 Sıfırla
            </button>
          </div>
        </div>

        <!-- 3. DOĞUM KASILMA ZAMANLAYICISI SEKMESİ -->
        <div id="preg-tab-contraction" class="preg-tab-content" style="display: none;">
          <div style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">
            🏥 <strong>5-1-1 Kuralı:</strong> Kasılmalarınız 5 dakikada bir geliyor, 1 dakika sürüyor ve 1 saattir bu düzende devam ediyorsa doktorunuzu arama zamanı gelmiştir!
          </div>

          <div style="text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 16px; margin-bottom: 10px;">
            <div id="contraction-timer-display" style="font-size: 2.2rem; font-weight: 700; font-family: monospace; color: var(--accent-period);">00:00</div>
            <div id="contraction-status-label" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">Sancı bekleniyor</div>

            <button type="button" class="btn btn-primary btn-block" id="btn-toggle-contraction" style="margin-top: 12px; padding: 12px; font-weight: 700; font-size: 1rem; background: linear-gradient(135deg, var(--accent-period), #b8354c); border: none;">
              ⚡ Sancı Başladı
            </button>
          </div>

          <div id="contraction-history-list" style="max-height: 120px; overflow-y: auto; font-size: 0.8rem; border-top: 1px dashed var(--border); padding-top: 8px;">
            <div style="color: var(--text-secondary); text-align: center; font-style: italic;">Henüz kaydedilmiş kasılma yok.</div>
          </div>
        </div>

        <!-- Kapat Butonu -->
        <button type="button" class="btn btn-secondary btn-block" id="btn-close-preg-hub" style="margin-top: 4px; padding: 10px; font-weight: 700;">
          Kapat ✕
        </button>
      </div>
    `;

    // Sekme Geçişleri
    modalBody.querySelectorAll('.preg-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modalBody.querySelectorAll('.preg-tab-btn').forEach(b => b.classList.remove('active'));
        modalBody.querySelectorAll('.preg-tab-content').forEach(c => c.style.display = 'none');
        btn.classList.add('active');
        const tab = btn.getAttribute('data-tab');
        const content = modalBody.querySelector(`#preg-tab-${tab}`);
        if (content) content.style.display = 'block';
      });
    });

    // Hafta Değişimi Slider
    const slider = modalBody.querySelector('#preg-week-slider');
    const weekDisplay = modalBody.querySelector('#preg-week-display');
    const cardContent = modalBody.querySelector('#preg-card-content');

    slider?.addEventListener('input', (e) => {
      const w = parseInt(e.target.value, 10);
      this.currentWeek = w;
      localStorage.setItem('pregnancy_current_week', w.toString());
      weekDisplay.textContent = `${w}. Hafta`;
      const data = this.getWeekData(w);
      cardContent.innerHTML = `
        <div style="font-size: 2.2rem; margin-bottom: 4px;">${data.fruit.split(' ')[1] || '🍋'}</div>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #b87314; margin: 0 0 6px 0;">Bebeğiniz Bir ${data.fruit} Boyutunda!</h3>
        
        <div style="display: flex; justify-content: center; gap: 14px; margin-bottom: 10px; font-size: 0.85rem; font-weight: 600;">
          <span style="background: var(--surface); padding: 4px 10px; border-radius: var(--radius-full); border: 1px solid var(--border);">📏 Boy: ${data.size}</span>
          <span style="background: var(--surface); padding: 4px 10px; border-radius: var(--radius-full); border: 1px solid var(--border);">⚖️ Kilo: ${data.weight}</span>
        </div>

        <p style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.45; text-align: left; background: var(--surface); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border); margin: 0;">
          ${data.desc}
        </p>
      `;
    });

    // Tekme Sayacı Olayları
    const kickDisplay = modalBody.querySelector('#kick-counter-display');
    modalBody.querySelector('#btn-add-kick')?.addEventListener('click', () => {
      this.kickCount++;
      kickDisplay.textContent = this.kickCount;
      App.Utils.vibrate([40]);
      if (this.kickCount === 10) {
        App.Utils.showToast('🎉 Tebrikler! 10 tekme hedefine ulaşıldı.', 'success', 3000);
      }
    });

    modalBody.querySelector('#btn-reset-kicks')?.addEventListener('click', () => {
      this.kickCount = 0;
      kickDisplay.textContent = '0';
    });

    // Sancı Zamanlayıcı Olayları
    let timerInt = null;
    let timerSeconds = 0;
    const timerDisplay = modalBody.querySelector('#contraction-timer-display');
    const timerBtn = modalBody.querySelector('#btn-toggle-contraction');
    const statusLabel = modalBody.querySelector('#contraction-status-label');
    const historyList = modalBody.querySelector('#contraction-history-list');

    timerBtn?.addEventListener('click', () => {
      if (!this.contractionActive) {
        // Başlat
        this.contractionActive = true;
        this.contractionStartTime = Date.now();
        timerSeconds = 0;
        timerBtn.textContent = '🛑 Sancı Bitti';
        timerBtn.style.background = 'linear-gradient(135deg, #448A5E, #2d6342)';
        statusLabel.textContent = 'Kasılma devam ediyor... Derin nefes alın 🧘‍♀️';
        App.Utils.vibrate([60]);

        timerInt = setInterval(() => {
          timerSeconds++;
          const mins = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
          const secs = String(timerSeconds % 60).padStart(2, '0');
          timerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
      } else {
        // Durdur ve Kaydet
        this.contractionActive = false;
        clearInterval(timerInt);
        timerBtn.textContent = '⚡ Sancı Başladı';
        timerBtn.style.background = 'linear-gradient(135deg, var(--accent-period), #b8354c)';
        statusLabel.textContent = `Son sancı süresi: ${timerSeconds} saniye`;
        App.Utils.vibrate([40, 40]);

        this.contractions.unshift({ time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), duration: timerSeconds });
        historyList.innerHTML = this.contractions.slice(0, 5).map((c, i) => `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--border);">
            <span>#${this.contractions.length - i} Saat: ${c.time}</span>
            <strong>${c.duration} sn sürdü</strong>
          </div>
        `).join('');
      }
    });

    const closeModal = () => {
      if (timerInt) clearInterval(timerInt);
      if (typeof window.hideModal === 'function') window.hideModal();
      else if (window.App && typeof window.App.hideModal === 'function') window.App.hideModal();
      else if (window.App && window.App.Main && typeof window.App.Main.hideModal === 'function') window.App.Main.hideModal();
    };

    modalBody.querySelector('#btn-close-preg-hub')?.addEventListener('click', closeModal);

    if (typeof window.showModal === 'function') {
      window.showModal('👶 Hamilelik & Bebek Gelişim Merkezi');
    } else if (window.App && typeof window.App.showModal === 'function') {
      window.App.showModal('👶 Hamilelik & Bebek Gelişim Merkezi');
    } else if (window.App && window.App.Main && typeof window.App.Main.showModal === 'function') {
      window.App.Main.showModal('👶 Hamilelik & Bebek Gelişim Merkezi');
    }
  }
};
