window.App = window.App || {};

/**
 * Gelişmiş Hamilelik, Doğurganlık & Bebek Planlama Modülü (TTC & Pregnancy Hub)
 * 1. Dinamik Doğurganlık Isı Haritası (Fertility Heatmap Strip)
 * 2. Servikal Mukus (Akıntı) Seçici & Takip Motoru
 * 3. Bazal Vücut Isısı (BBT) Termal Çizgi Grafiği & Yumurtlama Sıçraması
 * 4. Ovulasyon (LH) Testi & Kamera / Şerit Analizörü
 * 5. Şans Artırıcı Günlük Doğurganlık Beslenmesi & Yaşam Tarzı Rehberi
 * 6. "Hamile Miyim?" (Two-Week Wait - 2WW) DPO Sayacı & Erken Belirti Günlüğü
 * 7. 🎉 "💖 Hamileyim!" Kutlama Konfeti Motoru & Hafta Hafta Hamilelik Takibi
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
    4: { emoji: '🌾', fruit: 'Haşhaş Tohumu', size: '1 mm', weight: '< 1 gr', desc: 'Blastokist rahme tutundu. Plasenta ve amniyotik kese oluşmaya başlıyor.' },
    6: { emoji: '🫘', fruit: 'Mercimek Tanesi', size: '4-5 mm', weight: '< 1 gr', desc: 'Kalp tüpü atmaya başladı. Kol ve bacak tomurcukları beliriyor.' },
    8: { emoji: '🫐', fruit: 'Ahududu', size: '1.6 cm', weight: '1 gr', desc: 'Göz kapakları, burun ucu ve minik parmaklar şekilleniyor. Beden sürekli kıpırdıyor.' },
    10: { emoji: '🍓', fruit: 'Çilek', size: '3.1 cm', weight: '4 gr', desc: 'Embriyo evresi bitti, artık resmi olarak bir fetüs! Tüm hayati organlar yerli yerinde.' },
    12: { emoji: '🍋', fruit: 'Misket Limonu', size: '5.4 cm', weight: '14 gr', desc: 'Refleksler gelişti, parmaklarını açıp kapayabiliyor. 1. Trimester tamamlanıyor!' },
    14: { emoji: '🥝', fruit: 'Kivi', size: '8.7 cm', weight: '43 gr', desc: 'Bebek yüz ifadeleri yapabiliyor ve parmağını emmeye başlıyor. Cinsiyet organları belirginleşiyor.' },
    16: { emoji: '🥑', fruit: 'Avokado', size: '11.6 cm', weight: '100 gr', desc: 'Gözleri ışığı algılayabiliyor, kalp günde 25 litre kan pompalıyor.' },
    18: { emoji: '🫑', fruit: 'Dolmalık Biber', size: '14.2 cm', weight: '190 gr', desc: 'Kulakları sesleri duyuyor! Dış dünyadaki seslere ve müziğe tepki verebilir.' },
    20: { emoji: '🍌', fruit: 'Muz', size: '25.6 cm', weight: '300 gr', desc: 'Yarı yolu tamamladınız! İlk hafif tekmeleri (kelebek kıpırtısı) hissetmeye başlayabilirsiniz.' },
    24: { emoji: '🌽', fruit: 'Mısır Koçanı', size: '30 cm', weight: '600 gr', desc: 'Akciğerlerde sürfaktan üretimi başlıyor. Beyin dalgaları uyku ve uyanıklık ritmine girdi.' },
    28: { emoji: '🍆', fruit: 'Patlıcan', size: '37.6 cm', weight: '1.0 kg', desc: '3. Trimester başladı! Gözlerini açıp kapayabiliyor, rüya görmeye başlıyor.' },
    32: { emoji: '🥥', fruit: 'Hindistan Cevizi', size: '42.4 cm', weight: '1.7 kg', desc: 'Tırnakları ve saçları uzadı. Kemikleri sertleşiyor ama kafatası doğum için esnek kalıyor.' },
    36: { emoji: '🍈', fruit: 'Kavun', size: '47.4 cm', weight: '2.6 kg', desc: 'Doğum pozisyonunu alıyor (baş aşağı). Akciğerleri neredeyse tamamen olgunlaştı.' },
    40: { emoji: '🍉', fruit: 'Büyük Karpuz', size: '51.2 cm', weight: '3.4 kg', desc: 'Tebrikler, bebeğiniz dünyaya gelmeye tamamen hazır! Mucizenize kavuşma zamanı ✨' }
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
   * 1. Dinamik Doğurganlık Isı Haritası (Fertility Heatmap Strip HTML Oluşturucu)
   */
  getFertilityHeatmapHtml(cycleInfo) {
    const today = new Date();
    const todayStr = App.Utils.toISODateString(today);
    const dayNames = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    
    // Geçerli haftanın 7 gününü oluştur
    let heatmapDays = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dStr = App.Utils.toISODateString(d);
      const dayName = dayNames[d.getDay()];
      const dayNum = d.getDate();
      const isToday = (i === 0);

      // Sınıflandırma
      const classification = App.Cycle ? App.Cycle.classifyDate(dStr) : {};
      let level = 'low';
      let pct = 5;
      let label = 'Düşük';
      let bgGrad = 'rgba(91, 154, 111, 0.15)';
      let borderColor = 'rgba(91, 154, 111, 0.3)';
      let textColor = 'var(--text-primary)';

      if (classification.isOvulation) {
        level = 'peak';
        pct = 95;
        label = 'ZİRVE ⭐';
        bgGrad = 'linear-gradient(135deg, #e6a03c, #c27d14)';
        borderColor = '#b87314';
        textColor = '#fff';
      } else if (classification.isFertile) {
        level = 'high';
        pct = 75;
        label = 'Yüksek 🌸';
        bgGrad = 'rgba(230, 160, 60, 0.22)';
        borderColor = '#e6a03c';
        textColor = '#b87314';
      } else if (classification.isPeriod) {
        level = 'period';
        pct = 0;
        label = 'Regl 🩸';
        bgGrad = 'rgba(212, 85, 107, 0.15)';
        borderColor = 'var(--accent-period)';
        textColor = 'var(--accent-period)';
      }

      heatmapDays.push(`
        <div class="ttc-heatmap-day ${isToday ? 'current-day' : ''}" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px 2px; border-radius: var(--radius-md); background: ${bgGrad}; border: ${isToday ? '2px solid #b87314' : `1px solid ${borderColor}`}; color: ${textColor}; position: relative; min-width: 0;">
          <span style="font-size: 0.68rem; font-weight: 600; opacity: 0.85;">${dayName}</span>
          <span style="font-size: 0.85rem; font-weight: 800; margin: 2px 0;">${dayNum}</span>
          <span style="font-size: 0.62rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${pct > 0 ? `%${pct}` : 'Regl'}</span>
          ${isToday ? '<div style="position: absolute; bottom: -4px; width: 6px; height: 6px; background: #b87314; border-radius: 50%;"></div>' : ''}
        </div>
      `);
    }

    return `
      <div class="ttc-heatmap-container" style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 10px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 4px;">
            <span>🌈</span>
            <span>Doğurganlık Isı Haritası</span>
          </span>
          <span style="font-size: 0.72rem; color: #b87314; font-weight: 700;">
            ${cycleInfo.isFertileWindow ? '🌟 Zirve Doğurganlık Penceresi' : 'Düşük Hamilelik Şansı'}
          </span>
        </div>
        <div style="display: flex; gap: 4px; justify-content: space-between;">
          ${heatmapDays.join('')}
        </div>
      </div>
    `;
  },

  /**
   * 2. Servikal Mukus (Akıntı) Seçim Modalı
   */
  showCervicalMucusModal() {
    const todayStr = App.Utils.toISODateString(new Date());
    const symptoms = App.Data.getSymptoms(todayStr) || {};
    const currentDischarge = symptoms.discharge || 'none';

    const mucusTypes = [
      { id: 'egg_white', icon: '🍳', name: 'Yumurta Akı (Zirve Doğurganlık)', desc: 'Şeffaf, çok esnek, parmaklar arasında uzayan kaygan sıvı. Yumurtlamanın kesin işaretidir!', fertile: 'ZİRVE DOĞURGANLIK (%95)' },
      { id: 'watery', icon: '💧', name: 'Sulu & Sıvı (Yüksek Doğurganlık)', desc: 'Su gibi akıcı, berrak ve ıslak hissettiren akıntı. Spermlerin kolayca ilerlemesini sağlar.', fertile: 'YÜKSEK ŞANS (%75)' },
      { id: 'creamy', icon: '🥛', name: 'Kremsi / Losyon Kıvamı', desc: 'Beyaz veya hafif sarımsı, el kremi kıvamında. Erken foliküler fazda görülür.', fertile: 'ORTA ŞANS (%30)' },
      { id: 'sticky', icon: '🏜️', name: 'Kuru / Yapışkan', desc: 'Pütürlü, az veya kalın kıvamda. Döllenme şansı düşüktür.', fertile: 'DÜŞÜK ŞANS (%5)' }
    ];

    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin: 0;">
          Servikal akıntı, rahim ağzı bezlerinin ürettiği ve yumurtlama yaklaştıkça incelen doğal sıvıdır. Yumurta akı kıvamı hamilelik için en ideal zamandır.
        </p>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
          ${mucusTypes.map(m => `
            <div class="mucus-option-card ${currentDischarge === m.id ? 'active' : ''}" data-mucus="${m.id}" style="background: var(--surface); border: 2px solid ${currentDischarge === m.id ? '#e6a03c' : 'var(--border)'}; border-radius: var(--radius-lg); padding: 10px 12px; cursor: pointer; display: flex; gap: 10px; align-items: flex-start; transition: all 0.2s;">
              <span style="font-size: 1.6rem; line-height: 1;">${m.icon}</span>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="font-size: 0.88rem; color: var(--text-primary);">${m.name}</strong>
                  <span style="font-size: 0.68rem; font-weight: 700; color: #b87314; background: rgba(230, 160, 60, 0.15); padding: 2px 6px; border-radius: var(--radius-full);">${m.fertile}</span>
                </div>
                <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.35; margin: 4px 0 0 0;">${m.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <button type="button" class="btn btn-primary btn-block" id="btn-save-mucus" style="margin-top: 8px; font-weight: 700;">
          💾 Akıntı Durumunu Kaydet
        </button>
      </div>
    `;

    let selected = currentDischarge;
    modalBody.querySelectorAll('.mucus-option-card').forEach(card => {
      card.addEventListener('click', () => {
        modalBody.querySelectorAll('.mucus-option-card').forEach(c => {
          c.style.borderColor = 'var(--border)';
          c.classList.remove('active');
        });
        card.style.borderColor = '#e6a03c';
        card.classList.add('active');
        selected = card.getAttribute('data-mucus');
        App.Utils.vibrate([30]);
      });
    });

    modalBody.querySelector('#btn-save-mucus')?.addEventListener('click', () => {
      const sym = App.Data.getSymptoms(todayStr) || {};
      sym.discharge = selected;
      App.Data.saveSymptoms(todayStr, sym);
      if (window.App.hideModal) window.App.hideModal();
      if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
      App.Utils.showToast('Servikal akıntı durumunuz kaydedildi 🥚💧', 'success');
    });

    if (window.App.showModal) window.App.showModal('🥚 Servikal Mukus (Akıntı) Takibi');
  },

  /**
   * 3. Bazal Vücut Isısı (BBT) İnteraktif SVG Çizgi Grafiği Modalı
   */
  showBBTChartModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const symptomsHistory = (App.Data && App.Data.getAllSymptoms) ? App.Data.getAllSymptoms() : (JSON.parse(localStorage.getItem('dongum_symptoms') || '{}'));
    const today = new Date();
    
    // Son 14 günün ateş verilerini topla
    let bbtPoints = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = App.Utils.toISODateString(d);
      const sym = symptomsHistory[dStr] || {};
      const temp = sym.temperature ? parseFloat(sym.temperature) : null;
      bbtPoints.push({ date: dStr, dayLabel: `${d.getDate()}/${d.getMonth() + 1}`, temp: temp });
    }

    // Grafik Koordinatlarını Hesapla (SVG Viewbox: 0 0 320 160)
    const minTemp = 35.8;
    const maxTemp = 37.4;
    const chartW = 300;
    const chartH = 120;
    const paddingLeft = 30;
    const paddingTop = 20;

    let pathD = '';
    let circlesHtml = '';
    let validCount = 0;

    bbtPoints.forEach((pt, idx) => {
      const x = paddingLeft + (idx / (bbtPoints.length - 1)) * (chartW - paddingLeft);
      if (pt.temp != null) {
        const y = paddingTop + chartH - ((pt.temp - minTemp) / (maxTemp - minTemp)) * chartH;
        if (pathD === '') {
          pathD = `M ${x} ${y}`;
        } else {
          pathD += ` L ${x} ${y}`;
        }
        circlesHtml += `
          <circle cx="${x}" cy="${y}" r="4.5" fill="#e6a03c" stroke="#fff" stroke-width="1.5" />
          <text x="${x}" y="${y - 7}" font-size="8" font-weight="700" fill="var(--text-primary)" text-anchor="middle">${pt.temp.toFixed(1)}°</text>
        `;
        validCount++;
      }
    });

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="background: rgba(230, 160, 60, 0.1); border: 1px solid rgba(230, 160, 60, 0.3); border-radius: var(--radius-lg); padding: 10px; font-size: 0.8rem; color: var(--text-primary); line-height: 1.4;">
          🌡️ <strong>Termal Sıçrama Kuralı:</strong> Yumurtlamadan hemen sonra progesteron hormonu salgılanır ve vücut ısısı <strong>0.3°C - 0.5°C yükselir</strong>. Ateşin 3 gün üst üste yüksek kalması yumurtlamanın gerçekleştiğini kanıtlar.
        </div>

        <!-- SVG Grafik -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 10px; text-align: center;">
          <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>📈 14 Günlük Bazal Isı Eğrisi</span>
            <span style="color: #b87314;">Coverline: 36.4°C</span>
          </div>

          <svg viewBox="0 0 320 180" style="width: 100%; height: 180px; overflow: visible;">
            <!-- Izgara Çizgileri -->
            <line x1="25" y1="20" x2="310" y2="20" stroke="var(--border)" stroke-dasharray="3,3" />
            <text x="20" y="23" font-size="7" fill="var(--text-secondary)" text-anchor="end">37.4°</text>

            <line x1="25" y1="80" x2="310" y2="80" stroke="#e6a03c" stroke-width="1.2" stroke-dasharray="4,3" />
            <text x="20" y="83" font-size="7" font-weight="700" fill="#e6a03c" text-anchor="end">36.4°</text>

            <line x1="25" y1="140" x2="310" y2="140" stroke="var(--border)" stroke-dasharray="3,3" />
            <text x="20" y="143" font-size="7" fill="var(--text-secondary)" text-anchor="end">35.8°</text>

            ${pathD ? `<path d="${pathD}" fill="none" stroke="#e6a03c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}
            ${circlesHtml}

            <!-- X Ekseni Etiketleri -->
            ${bbtPoints.map((pt, idx) => {
              if (idx % 2 === 0 || idx === bbtPoints.length - 1) {
                const x = paddingLeft + (idx / (bbtPoints.length - 1)) * (chartW - paddingLeft);
                return `<text x="${x}" y="165" font-size="7.5" fill="var(--text-secondary)" text-anchor="middle">${pt.dayLabel}</text>`;
              }
              return '';
            }).join('')}
          </svg>

          ${validCount < 3 ? `
            <div style="font-size: 0.74rem; color: var(--text-secondary); font-style: italic; margin-top: 4px;">
              💡 Düzenli grafik için her sabah yataktan kalkmadan önce ateşinizi giriniz.
            </div>
          ` : ''}
        </div>

        <button type="button" class="btn btn-primary btn-block" id="btn-quick-enter-temp-now" style="font-weight: 700;">
          🌡️ Bugünkü Ateşi Gir
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-quick-enter-temp-now')?.addEventListener('click', () => {
      if (window.App.hideModal) window.App.hideModal();
      document.getElementById('btn-quick-temp-log')?.click();
    });

    if (window.App.showModal) window.App.showModal('📈 Bazal Isı (BBT) Termal Grafiği');
  },

  /**
   * 4. Ovulasyon (LH) Testi & Kamera / Şerit Analizörü Modalı
   */
  showLHOvulationScannerModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div style="background: rgba(142, 68, 173, 0.1); border: 1px solid rgba(142, 68, 173, 0.3); border-radius: var(--radius-lg); padding: 10px; font-size: 0.8rem; color: var(--text-primary); line-height: 1.4;">
          🟣 <strong>LH Zirvesi (Surge) Prensibi:</strong> Luteinize Edici Hormon (LH), yumurta çatlamadan 24-36 saat önce en yüksek seviyeye ulaşır. Test (T) çizgisi Kontrol (C) çizgisiyle aynı veya daha koyu olduğunda sonuç <strong>POZİTİF (ZİRVE)</strong>'dir!
        </div>

        <!-- LH Test Şeridi Fotoğraf Çek / Yükle -->
        <div style="background: var(--surface); border: 2px dashed var(--border); border-radius: var(--radius-xl); padding: 16px; text-align: center; position: relative;">
          <div id="lh-preview-container" style="display: none; margin-bottom: 10px;">
            <img id="lh-preview-img" style="max-height: 140px; border-radius: var(--radius-md); border: 1px solid var(--border); margin: 0 auto;" />
            <div id="lh-ai-result-badge" style="margin-top: 6px; font-size: 0.85rem; font-weight: 800; color: #8E44AD;">Analiz Edildi: LH ZİRVE PİK (Pozitif) ⭐</div>
          </div>

          <div id="lh-upload-prompt">
            <span style="font-size: 2rem;">📷</span>
            <div style="font-size: 0.88rem; font-weight: 700; margin: 4px 0;">Ovulasyon Test Şeridinin Fotoğrafını Çek</div>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 10px 0;">Test kasetinizi düz bir zemine koyup fotoğrafını yükleyin.</p>
          </div>

          <input type="file" id="input-lh-strip-file" accept="image/*" capture="environment" style="display: none;">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-trigger-lh-camera" style="font-weight: 700; background: rgba(142, 68, 173, 0.15); color: #8E44AD; border-color: rgba(142, 68, 173, 0.3);">
            📸 Fotoğraf Çek / Yükle
          </button>
        </div>

        <!-- Manuel LH Yoğunluk Seçici -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 0.82rem; font-weight: 700;">Manuel LH Çizgi Koyuluğu:</span>
            <span id="lh-ratio-text" style="font-size: 0.88rem; font-weight: 800; color: #8E44AD;">Yüksek (0.8)</span>
          </div>
          <input type="range" id="slider-lh-ratio" min="0.1" max="2.0" step="0.1" value="0.8" style="width: 100%; accent-color: #8E44AD;">
          <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-secondary); margin-top: 4px;">
            <span>Düşük (< 0.5)</span>
            <span>Yüksek (0.8)</span>
            <span>ZİRVE PİK (>= 1.0) ⭐</span>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block" id="btn-save-lh-test" style="font-weight: 700; background: linear-gradient(135deg, #8E44AD, #6C3483); border: none;">
          💾 Ovulasyon Test Sonucunu Kaydet
        </button>
      </div>
    `;

    const fileInput = modalBody.querySelector('#input-lh-strip-file');
    const previewContainer = modalBody.querySelector('#lh-preview-container');
    const previewImg = modalBody.querySelector('#lh-preview-img');
    const uploadPrompt = modalBody.querySelector('#lh-upload-prompt');
    const slider = modalBody.querySelector('#slider-lh-ratio');
    const ratioText = modalBody.querySelector('#lh-ratio-text');

    modalBody.querySelector('#btn-trigger-lh-camera')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (re) => {
          previewImg.src = re.target.result;
          uploadPrompt.style.display = 'none';
          previewContainer.style.display = 'block';
          slider.value = '1.2';
          ratioText.textContent = 'ZİRVE PİK (1.2) ⭐';
          ratioText.style.color = '#8E44AD';
          App.Utils.vibrate([40, 40]);
          App.Utils.showToast('Test şeridi tarandı: Zirve LH tespit edildi! ⭐', 'success');
        };
        reader.readAsDataURL(file);
      }
    });

    slider?.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      if (v >= 1.0) {
        ratioText.textContent = `ZİRVE PİK (${v.toFixed(1)}) ⭐`;
        ratioText.style.color = '#8E44AD';
      } else if (v >= 0.6) {
        ratioText.textContent = `Yüksek (${v.toFixed(1)}) 🌸`;
        ratioText.style.color = '#b87314';
      } else {
        ratioText.textContent = `Düşük / Negatif (${v.toFixed(1)})`;
        ratioText.style.color = 'var(--text-secondary)';
      }
    });

    modalBody.querySelector('#btn-save-lh-test')?.addEventListener('click', () => {
      const todayStr = App.Utils.toISODateString(new Date());
      const sym = App.Data.getSymptoms(todayStr) || {};
      const ratio = parseFloat(slider.value);
      sym.lhTest = (ratio >= 1.0) ? 'positive' : (ratio >= 0.6 ? 'high' : 'negative');
      sym.lhRatio = ratio;
      App.Data.saveSymptoms(todayStr, sym);
      if (window.App.hideModal) window.App.hideModal();
      if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
      App.Utils.showToast('Ovulasyon test kaydınız başarıyla güncellendi 🟣✨', 'success');
    });

    if (window.App.showModal) window.App.showModal('🟣 Ovulasyon (LH) Test Tarayıcısı');
  },

  /**
   * 5. Şans Artırıcı Doğurganlık Beslenmesi & Yaşam Tarzı Rehberi
   */
  showNutritionGuideModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto; padding-right: 4px;">
        <div style="background: linear-gradient(135deg, rgba(230, 160, 60, 0.15), rgba(230, 160, 60, 0.05)); border: 1px solid rgba(230, 160, 60, 0.3); border-radius: var(--radius-xl); padding: 12px; text-align: center;">
          <span style="font-size: 2rem;">🥑🥗</span>
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #b87314; margin: 4px 0;">Doğurganlığı Artıran Bilimsel Besinler</h3>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">Yumurta kalitesini ve rahim astarı kalınlığını destekleyen süper gıdalar.</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: #b87314; display: flex; align-items: center; gap: 6px;">
              <span>💊</span> <span>Folik Asit & B9 Vitamini</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-primary); margin: 4px 0 0 0; line-height: 1.35;">
              Ispanak, brokoli, avokado ve kuşkonmaz. Bebeğin sinir tüpü gelişimi için gebe kalmadan en az 1 ay önce başlanmalıdır.
            </p>
          </div>

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: #b87314; display: flex; align-items: center; gap: 6px;">
              <span>🥑</span> <span>Sağlıklı Yağlar & Omega-3</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-primary); margin: 4px 0 0 0; line-height: 1.35;">
              Ceviz, chia tohumu, zeytinyağı ve somon balığı. Rahim kan akışını artırarak tutunmayı kolaylaştırır.
            </p>
          </div>

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: #b87314; display: flex; align-items: center; gap: 6px;">
              <span>🫐</span> <span>Antioksidan Bombası Meyveler</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-primary); margin: 4px 0 0 0; line-height: 1.35;">
              Yaban mersini, nar, ahududu. Hücresel oksidatif stresi azaltarak yumurta ve sperm kalitesini korur.
            </p>
          </div>

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 10px;">
            <div style="font-weight: 700; font-size: 0.85rem; color: #b87314; display: flex; align-items: center; gap: 6px;">
              <span>🧘‍♀️</span> <span>Stres & Kortizol Yönetimi</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-primary); margin: 4px 0 0 0; line-height: 1.35;">
              Günde 20 dakika açık hava yürüyüşü ve nefes egzersizleri, yumurtlama hormonlarının (FSH & LH) düzenli salgılanmasını sağlar.
            </p>
          </div>
        </div>

        <button type="button" class="btn btn-secondary btn-block" onclick="if(window.App.hideModal) window.App.hideModal();" style="font-weight: 700;">
          Anladım ✓
        </button>
      </div>
    `;

    if (window.App.showModal) window.App.showModal('🥑 Doğurganlık Beslenmesi & Yaşam Tarzı');
  },

  /**
   * 6. "Hamile Miyim?" (Two-Week Wait - 2WW) DPO Sayacı & Erken Belirti Günlüğü
   */
  showTwoWeekWaitModal(cycleInfo) {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    let dpo = 0; // Days past ovulation
    if (cycleInfo.ovulationDay) {
      const ovDate = App.Utils.parseDate(cycleInfo.ovulationDay);
      const diff = App.Utils.diffDays(ovDate, new Date());
      if (diff > 0) dpo = diff;
    }

    const testDaysLeft = Math.max(0, 10 - dpo);

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- DPO Sayacı Kartı -->
        <div style="background: linear-gradient(135deg, rgba(230, 160, 60, 0.18), rgba(212, 85, 107, 0.12)); border: 1px solid rgba(230, 160, 60, 0.35); border-radius: var(--radius-xl); padding: 14px; text-align: center;">
          <div style="font-size: 0.75rem; font-weight: 800; color: #b87314; text-transform: uppercase; letter-spacing: 0.5px;">İKİ HAFTALIK BEKLEME SÜRECİ (2WW)</div>
          <div style="font-size: 2.4rem; font-weight: 800; color: #b87314; margin: 4px 0;">${dpo > 0 ? `${dpo}. DPO` : 'Yumurtlama Öncesi'}</div>
          <div style="font-size: 0.82rem; color: var(--text-primary); font-weight: 600;">
            ${dpo > 0 ? `Yumurtlamanın üzerinden <strong>${dpo} gün</strong> geçti.` : 'Henüz yumurtlama gerçekleşmedi.'}
          </div>

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px 12px; margin-top: 10px; font-size: 0.78rem; color: var(--text-primary);">
            ⏳ ${testDaysLeft > 0 ? `Erken gebelik testi (Kaset/Kan) için en uygun zamana <strong>${testDaysLeft} gün kaldı</strong> (10. DPO).` : '🎉 <strong>Erken test yapmaya uygunsunuz!</strong> Sabah ilk idrarla test yapabilirsiniz.'}
          </div>
        </div>

        <!-- Erken Hamilelik Belirtileri Checkbox Listesi -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 12px;">
          <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary); margin-bottom: 8px;">
            📝 Erken Yerleşme & Gebelik Belirtileri:
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.82rem;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="chk-implant" style="accent-color: #e6a03c; width: 16px; height: 16px;">
              <span>🩸 Yerleşme Lekesi (Hafif pembe/kahverengi lekelenme)</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="chk-breast" style="accent-color: #e6a03c; width: 16px; height: 16px;">
              <span>🍈 Göğüslerde Dolgunluk & Hassasiyet</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="chk-smell" style="accent-color: #e6a03c; width: 16px; height: 16px;">
              <span>👃 Koku Hassasiyeti / Hafif Bulantı</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
              <input type="checkbox" id="chk-cramp" style="accent-color: #e6a03c; width: 16px; height: 16px;">
              <span>⚡ Hafif Kasık Çekilmesi / Batma</span>
            </label>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block" id="btn-save-2ww-notes" style="font-weight: 700;">
          💾 Belirtileri Kaydet
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-save-2ww-notes')?.addEventListener('click', () => {
      const todayStr = App.Utils.toISODateString(new Date());
      const sym = App.Data.getSymptoms(todayStr) || {};
      if (modalBody.querySelector('#chk-implant')?.checked) sym.spotting = true;
      if (modalBody.querySelector('#chk-breast')?.checked) sym.breastTenderness = true;
      if (modalBody.querySelector('#chk-smell')?.checked) sym.nausea = true;
      App.Data.saveSymptoms(todayStr, sym);
      if (window.App.hideModal) window.App.hideModal();
      App.Utils.showToast('Erken belirti notlarınız kaydedildi 👶📝', 'success');
    });

    if (window.App.showModal) window.App.showModal('⏳ "Hamile Miyim?" Test Günlüğü (2WW)');
  },

  /**
   * 7. 🎉 "💖 Hamileyim!" Kutlama & Konfeti Patlatma Motoru
   */
  triggerImPregnantCelebration() {
    // 1. Konfeti Patlatma Animasyonu
    this._launchConfetti();
    App.Utils.vibrate([100, 50, 100, 50, 200]);

    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const lastPeriod = (App.Data && App.Data.getLastPeriod) ? App.Data.getLastPeriod() : null;
    let lmpDate = lastPeriod ? App.Utils.parseDate(lastPeriod.startDate) : new Date();
    
    // Tahmini Doğum Tarihi (EDD) = SAT + 280 gün
    const eddDate = new Date(lmpDate);
    eddDate.setDate(eddDate.getDate() + 280);
    const eddStr = `${eddDate.getDate()} ${['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][eddDate.getMonth()]} ${eddDate.getFullYear()}`;

    // Gebelik Haftası
    const diffDays = Math.max(0, App.Utils.diffDays(lmpDate, new Date()));
    const calcWeek = Math.min(40, Math.max(4, Math.floor(diffDays / 7) + 1));
    this.currentWeek = calcWeek;
    localStorage.setItem('pregnancy_current_week', calcWeek.toString());

    modalBody.innerHTML = `
      <div style="text-align: center; display: flex; flex-direction: column; gap: 14px; padding: 10px 0;">
        <div style="font-size: 3.5rem; animation: pulse 1s infinite;">🎉👶💖</div>
        
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: #b87314; margin: 0;">GÖZÜNÜZ AYDIN, TEBRİKLER! 🎊</h2>
          <p style="font-size: 0.88rem; color: var(--text-primary); margin: 6px 0 0 0; line-height: 1.4;">
            Hayatınızın en büyüleyici mucizesi başladı! Döngüm uygulamanız artık hafta hafta bebeğinizin büyümesini takip edecek.
          </p>
        </div>

        <div style="background: linear-gradient(135deg, rgba(230, 160, 60, 0.15), rgba(212, 85, 107, 0.1)); border: 1px solid rgba(230, 160, 60, 0.35); border-radius: var(--radius-xl); padding: 14px; text-align: left;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 0.82rem; color: var(--text-secondary);">Şu Anki Durum:</span>
            <strong style="font-size: 0.88rem; color: #b87314;">${calcWeek}. Gebelik Haftası 🌱</strong>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed var(--border); padding-top: 6px;">
            <span style="font-size: 0.82rem; color: var(--text-secondary);">Tahmini Doğum Tarihi:</span>
            <strong style="font-size: 0.88rem; color: var(--accent-period);">${eddStr} 🍼</strong>
          </div>
        </div>

        <button type="button" class="btn btn-primary btn-block btn-lg" id="btn-start-pregnancy-journey" style="padding: 12px; font-size: 1rem; font-weight: 700; background: linear-gradient(135deg, #e6a03c, #c27d14); border: none; cursor: pointer;">
          🌱 Hafta Hafta Bebek Gelişimini Başlat ✨
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-start-pregnancy-journey')?.addEventListener('click', () => {
      this.showPregnancyHubModal();
    });

    if (window.App.showModal) window.App.showModal('🎊 Mucize Başladı!');
  },

  /**
   * Konfeti Animasyonu
   */
  _launchConfetti() {
    let canvas = document.getElementById('ttc-confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'ttc-confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#e6a03c', '#D4556B', '#8E44AD', '#5B9A6F', '#3498DB', '#F1C40F'];
    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10
      });
    }

    let frame = 0;
    const anim = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // yer çekimi
        p.rotation += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      frame++;
      if (frame < 180) {
        requestAnimationFrame(anim);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    anim();
  },

  /**
   * Ana Ekran İçin Günlük Hamilelik & Bebek Takip Özeti Verilerini Döndürür
   */
  getDashboardSummaryData() {
    const todayStr = App.Utils.toISODateString(new Date());
    const week = parseInt(localStorage.getItem('pregnancy_current_week') || '12', 10);
    const weekInfo = this.getWeekData(week);
    const custom = JSON.parse(localStorage.getItem(`pregnancy_custom_${week}`) || '{}');
    const curSize = custom.size || weekInfo.size;
    const curWeight = custom.weight || weekInfo.weight;

    const savedKicks = parseInt(localStorage.getItem(`pregnancy_kicks_${todayStr}`) || '0', 10);
    const contractions = JSON.parse(localStorage.getItem('pregnancy_contractions') || '[]');
    const lastContraction = contractions.length > 0 ? contractions[0] : null;

    return {
      week,
      weekInfo,
      curSize,
      curWeight,
      kicks: savedKicks,
      lastContraction,
      totalContractions: contractions.length
    };
  },

  /**
   * Hamilelik & Bebek Araçları Ana Modalı
   */
  showPregnancyHubModal(initialTab = 'growth') {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const todayStr = App.Utils.toISODateString(new Date());
    const savedWeek = parseInt(localStorage.getItem('pregnancy_current_week') || '12', 10);
    this.currentWeek = savedWeek;
    this.kickCount = parseInt(localStorage.getItem(`pregnancy_kicks_${todayStr}`) || '0', 10);
    this.contractions = JSON.parse(localStorage.getItem('pregnancy_contractions') || '[]');

    const renderCardBody = (week) => {
      const weekInfo = this.getWeekData(week);
      const customMeasurements = JSON.parse(localStorage.getItem(`pregnancy_custom_${week}`) || '{}');
      const curSize = customMeasurements.size || weekInfo.size;
      const curWeight = customMeasurements.weight || weekInfo.weight;

      return `
        <div style="font-size: 3rem; margin-bottom: 2px; line-height: 1;">${weekInfo.emoji || '🌱'}</div>
        <h3 style="font-size: 1.15rem; font-weight: 800; color: #b87314; margin: 4px 0 8px 0;">Bebeğiniz Bir ${weekInfo.fruit} Boyutunda!</h3>
        
        <!-- Düzenlenebilir Boy ve Kilo Rozetleri -->
        <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
          <div class="preg-badge-btn" id="btn-edit-size" style="background: var(--surface); padding: 6px 12px; border-radius: var(--radius-full); border: 1.5px solid #e6a03c; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: all 0.2s;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">📏 Boy: <strong style="color: #b87314;">${curSize}</strong></span>
            <span style="font-size: 0.72rem; opacity: 0.7;">✏️</span>
          </div>
          <div class="preg-badge-btn" id="btn-edit-weight" style="background: var(--surface); padding: 6px 12px; border-radius: var(--radius-full); border: 1.5px solid #e6a03c; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); transition: all 0.2s;">
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">⚖️ Kilo: <strong style="color: #b87314;">${curWeight}</strong></span>
            <span style="font-size: 0.72rem; opacity: 0.7;">✏️</span>
          </div>
        </div>

        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 8px;">
          💡 Boy veya kiloya dokunarak doktorunuzun ultrason ölçümlerini girebilirsiniz.
        </div>

        <p style="font-size: 0.84rem; color: var(--text-primary); line-height: 1.45; text-align: left; background: var(--surface); padding: 10px; border-radius: var(--radius-md); border: 1px solid var(--border); margin: 0;">
          ${weekInfo.desc}
        </p>
      `;
    };

    const renderContractionList = () => {
      if (this.contractions.length === 0) {
        return '<div style="color: var(--text-secondary); text-align: center; font-style: italic; padding: 10px 0;">Henüz kaydedilmiş kasılma yok.</div>';
      }
      return this.contractions.slice(0, 5).map((c, i) => `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.82rem;">
          <span>#${this.contractions.length - i} Saat: <strong>${c.time}</strong></span>
          <span style="color: var(--accent-period); font-weight: 700;">${c.duration} sn sürdü</span>
        </div>
      `).join('');
    };

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px; max-height: 75vh; overflow-y: auto; padding-right: 4px;">
        
        <!-- Sekme Butonları -->
        <div style="display: flex; gap: 6px; background: var(--bg-secondary); padding: 4px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <button type="button" class="preg-tab-btn ${initialTab === 'growth' ? 'active' : ''}" data-tab="growth" style="flex: 1; padding: 8px 4px; font-size: 0.82rem; font-weight: ${initialTab === 'growth' ? '800' : '700'}; border-radius: var(--radius-md); border: none; cursor: pointer; background: ${initialTab === 'growth' ? '#e6a03c' : 'transparent'}; color: ${initialTab === 'growth' ? '#fff' : 'var(--text-secondary)'}; box-shadow: ${initialTab === 'growth' ? '0 2px 6px rgba(230, 160, 60, 0.4)' : 'none'}; transition: all 0.2s;">
            🌱 Bebek Gelişimi
          </button>
          <button type="button" class="preg-tab-btn ${initialTab === 'kick' ? 'active' : ''}" data-tab="kick" style="flex: 1; padding: 8px 4px; font-size: 0.82rem; font-weight: ${initialTab === 'kick' ? '800' : '700'}; border-radius: var(--radius-md); border: none; cursor: pointer; background: ${initialTab === 'kick' ? '#e6a03c' : 'transparent'}; color: ${initialTab === 'kick' ? '#fff' : 'var(--text-secondary)'}; box-shadow: ${initialTab === 'kick' ? '0 2px 6px rgba(230, 160, 60, 0.4)' : 'none'}; transition: all 0.2s;">
            👣 Tekme Sayacı
          </button>
          <button type="button" class="preg-tab-btn ${initialTab === 'contraction' ? 'active' : ''}" data-tab="contraction" style="flex: 1; padding: 8px 4px; font-size: 0.82rem; font-weight: ${initialTab === 'contraction' ? '800' : '700'}; border-radius: var(--radius-md); border: none; cursor: pointer; background: ${initialTab === 'contraction' ? '#e6a03c' : 'transparent'}; color: ${initialTab === 'contraction' ? '#fff' : 'var(--text-secondary)'}; box-shadow: ${initialTab === 'contraction' ? '0 2px 6px rgba(230, 160, 60, 0.4)' : 'none'}; transition: all 0.2s;">
            ⏱️ Sancı Sayacı
          </button>
        </div>

        <!-- 1. BEBEK GELİŞİMİ SEKMESİ -->
        <div id="preg-tab-growth" class="preg-tab-content" style="display: ${initialTab === 'growth' ? 'block' : 'none'};">
          <div style="text-align: center; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">GEBELİK HAFTANIZ</span>
              <span id="preg-week-display" style="font-size: 1.15rem; font-weight: 800; color: #b87314;">${this.currentWeek}. Hafta</span>
            </div>
            <input type="range" id="preg-week-slider" min="4" max="40" value="${this.currentWeek}" step="1" style="width: 100%; accent-color: #e6a03c; cursor: pointer;">
          </div>

          <div id="preg-card-content" style="background: linear-gradient(135deg, rgba(230, 160, 60, 0.12), rgba(230, 160, 60, 0.03)); border: 1px solid rgba(230, 160, 60, 0.35); border-radius: var(--radius-xl); padding: 14px; text-align: center;">
            ${renderCardBody(this.currentWeek)}
          </div>
        </div>

        <!-- 2. FETAL TEKME SAYACI SEKMESİ -->
        <div id="preg-tab-kick" class="preg-tab-content" style="display: ${initialTab === 'kick' ? 'block' : 'none'}; text-align: center;">
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">
            🏥 <strong>ACOG Kılavuzu:</strong> 28. haftadan sonra günde 1 kez bebeğin hareketlerini sayın. 2 saat içinde 10 hareket sağlıklı kabul edilir.
          </p>

          <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 16px; margin-bottom: 10px; text-align: center;">
            <div id="kick-counter-display" style="font-size: 3.5rem; font-weight: 800; color: #b87314; line-height: 1;">${this.kickCount}</div>
            <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary); margin-top: 4px;">/ 10 Tekme Hedefi</div>
            
            <button type="button" class="btn btn-primary btn-lg" id="btn-add-kick" style="margin-top: 12px; width: 100%; padding: 14px; font-size: 1.05rem; font-weight: 800; background: linear-gradient(135deg, #e6a03c, #c27d14); border: none; cursor: pointer; border-radius: var(--radius-lg);">
              👣 Tekme Hissettim (+1)
            </button>

            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-save-kicks-now" style="flex: 1; font-size: 0.8rem; font-weight: 700; cursor: pointer;">
                💾 Kaydet & Güncelle
              </button>
              <button type="button" class="btn btn-ghost btn-sm" id="btn-reset-kicks" style="font-size: 0.78rem; cursor: pointer;">
                🔄 Sıfırla
              </button>
            </div>
          </div>
        </div>

        <!-- 3. DOĞUM KASILMA ZAMANLAYICISI SEKMESİ -->
        <div id="preg-tab-contraction" class="preg-tab-content" style="display: ${initialTab === 'contraction' ? 'block' : 'none'};">
          <div style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">
            🏥 <strong>5-1-1 Kuralı:</strong> Kasılmalarınız 5 dakikada bir geliyor, 1 dakika sürüyor ve 1 saattir bu düzende devam ediyorsa doktorunuzu arama zamanı gelmiştir!
          </div>

          <div style="text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 16px; margin-bottom: 10px;">
            <div id="contraction-timer-display" style="font-size: 2.4rem; font-weight: 800; font-family: monospace; color: var(--accent-period);">00:00</div>
            <div id="contraction-status-label" style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px;">Sancı bekleniyor</div>

            <button type="button" class="btn btn-primary btn-block" id="btn-toggle-contraction" style="margin-top: 12px; padding: 12px; font-weight: 800; font-size: 1rem; background: linear-gradient(135deg, var(--accent-period), #b8354c); border: none; cursor: pointer; border-radius: var(--radius-lg);">
              ⚡ Sancı Başladı
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">Son Kasılma Kayıtları:</span>
            <button type="button" class="btn btn-ghost btn-sm" id="btn-clear-contractions" style="font-size: 0.7rem; color: var(--text-secondary); padding: 2px 6px;">
              🗑️ Temizle
            </button>
          </div>

          <div id="contraction-history-list" style="max-height: 130px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px 10px; background: var(--surface);">
            ${renderContractionList()}
          </div>
        </div>

        <!-- Kapat Butonu -->
        <button type="button" class="btn btn-secondary btn-block" id="btn-close-preg-hub" style="margin-top: 4px; padding: 10px; font-weight: 700; cursor: pointer;">
          Kapat ✕
        </button>
      </div>
    `;

    // 1. SEKME GEÇİŞLERİNİ BAĞLA
    const tabButtons = modalBody.querySelectorAll('.preg-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = 'var(--text-secondary)';
          b.style.boxShadow = 'none';
          b.style.fontWeight = '700';
        });

        modalBody.querySelectorAll('.preg-tab-content').forEach(c => {
          c.style.display = 'none';
        });

        btn.classList.add('active');
        btn.style.background = '#e6a03c';
        btn.style.color = '#fff';
        btn.style.boxShadow = '0 2px 6px rgba(230, 160, 60, 0.4)';
        btn.style.fontWeight = '800';

        const tabKey = btn.getAttribute('data-tab');
        const targetContent = modalBody.querySelector(`#preg-tab-${tabKey}`);
        if (targetContent) {
          targetContent.style.display = 'block';
        }
        App.Utils.vibrate([30]);
      });
    });

    // 2. HAFTA DEĞİŞİMİ VE BOY/KİLO DÜZENLEME OLAYLARI
    const slider = modalBody.querySelector('#preg-week-slider');
    const weekDisplay = modalBody.querySelector('#preg-week-display');
    const cardContent = modalBody.querySelector('#preg-card-content');

    const bindEditBadges = () => {
      cardContent.querySelector('#btn-edit-size')?.addEventListener('click', () => {
        const week = this.currentWeek;
        const weekInfo = this.getWeekData(week);
        const custom = JSON.parse(localStorage.getItem(`pregnancy_custom_${week}`) || '{}');
        const currentVal = custom.size || weekInfo.size;
        
        const newVal = prompt(`📏 ${week}. Hafta Bebeğin Boy Ölçümü (Örn: 2.5 cm / 1 mm):`, currentVal);
        if (newVal !== null && newVal.trim() !== '') {
          custom.size = newVal.trim();
          localStorage.setItem(`pregnancy_custom_${week}`, JSON.stringify(custom));
          cardContent.innerHTML = renderCardBody(week);
          bindEditBadges();
          if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
          App.Utils.showToast('Boy ölçümü başarıyla kaydedildi 📏', 'success');
        }
      });

      cardContent.querySelector('#btn-edit-weight')?.addEventListener('click', () => {
        const week = this.currentWeek;
        const weekInfo = this.getWeekData(week);
        const custom = JSON.parse(localStorage.getItem(`pregnancy_custom_${week}`) || '{}');
        const currentVal = custom.weight || weekInfo.weight;
        
        const newVal = prompt(`⚖️ ${week}. Hafta Bebeğin Kilo Ölçümü (Örn: 15 gr / 1.2 kg):`, currentVal);
        if (newVal !== null && newVal.trim() !== '') {
          custom.weight = newVal.trim();
          localStorage.setItem(`pregnancy_custom_${week}`, JSON.stringify(custom));
          cardContent.innerHTML = renderCardBody(week);
          bindEditBadges();
          if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
          App.Utils.showToast('Kilo ölçümü başarıyla kaydedildi ⚖️', 'success');
        }
      });
    };

    slider?.addEventListener('input', (e) => {
      const w = parseInt(e.target.value, 10);
      this.currentWeek = w;
      localStorage.setItem('pregnancy_current_week', w.toString());
      weekDisplay.textContent = `${w}. Hafta`;
      cardContent.innerHTML = renderCardBody(w);
      bindEditBadges();
      if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
    });

    bindEditBadges();

    // 3. TEKME SAYACI OLAYLARI
    const kickDisplay = modalBody.querySelector('#kick-counter-display');
    modalBody.querySelector('#btn-add-kick')?.addEventListener('click', () => {
      this.kickCount++;
      kickDisplay.textContent = this.kickCount;
      localStorage.setItem(`pregnancy_kicks_${todayStr}`, this.kickCount.toString());
      
      const sym = App.Data.getSymptoms(todayStr) || {};
      sym.kickCount = this.kickCount;
      App.Data.saveSymptoms(todayStr, sym);
      
      App.Utils.vibrate([40]);
      if (this.kickCount === 10) {
        App.Utils.showToast('🎉 Tebrikler! 10 tekme hedefine ulaşıldı ve kaydedildi.', 'success', 3000);
      }
      if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
    });

    modalBody.querySelector('#btn-save-kicks-now')?.addEventListener('click', () => {
      localStorage.setItem(`pregnancy_kicks_${todayStr}`, this.kickCount.toString());
      const sym = App.Data.getSymptoms(todayStr) || {};
      sym.kickCount = this.kickCount;
      App.Data.saveSymptoms(todayStr, sym);
      if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
      App.Utils.showToast('Tekme sayısı ana ekrana kaydedildi 👣✓', 'success');
    });

    modalBody.querySelector('#btn-reset-kicks')?.addEventListener('click', () => {
      this.kickCount = 0;
      kickDisplay.textContent = '0';
      localStorage.setItem(`pregnancy_kicks_${todayStr}`, '0');
      const sym = App.Data.getSymptoms(todayStr) || {};
      sym.kickCount = 0;
      App.Data.saveSymptoms(todayStr, sym);
      App.Utils.vibrate([20]);
      if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
    });

    // 4. SANCI SAYACI OLAYLARI
    let timerInt = null;
    let timerSeconds = 0;
    const timerDisplay = modalBody.querySelector('#contraction-timer-display');
    const timerBtn = modalBody.querySelector('#btn-toggle-contraction');
    const statusLabel = modalBody.querySelector('#contraction-status-label');
    const historyList = modalBody.querySelector('#contraction-history-list');

    timerBtn?.addEventListener('click', () => {
      if (!this.contractionActive) {
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
        this.contractionActive = false;
        clearInterval(timerInt);
        timerBtn.textContent = '⚡ Sancı Başladı';
        timerBtn.style.background = 'linear-gradient(135deg, var(--accent-period), #b8354c)';
        statusLabel.textContent = `Son sancı süresi: ${timerSeconds} saniye`;
        App.Utils.vibrate([40, 40]);

        const newRecord = {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: todayStr,
          duration: timerSeconds
        };

        this.contractions.unshift(newRecord);
        localStorage.setItem('pregnancy_contractions', JSON.stringify(this.contractions));
        historyList.innerHTML = renderContractionList();
        if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
        App.Utils.showToast(`Sancı süresi (${timerSeconds} sn) kaydedildi ⏱️`, 'success');
      }
    });

    modalBody.querySelector('#btn-clear-contractions')?.addEventListener('click', () => {
      if (confirm('Kasılma geçmişini temizlemek istiyor musunuz?')) {
        this.contractions = [];
        localStorage.setItem('pregnancy_contractions', JSON.stringify([]));
        historyList.innerHTML = renderContractionList();
        if (window.App.Main && window.App.Main.renderDashboard) window.App.Main.renderDashboard();
        App.Utils.showToast('Kasılma geçmişi temizlendi', 'info');
      }
    });

    const closeModal = () => {
      if (timerInt) clearInterval(timerInt);
      if (window.App.hideModal) window.App.hideModal();
    };

    modalBody.querySelector('#btn-close-preg-hub')?.addEventListener('click', closeModal);

    if (window.App.showModal) window.App.showModal('👶 Hafta Hafta Hamilelik & Bebek Takibi');
  }
};



