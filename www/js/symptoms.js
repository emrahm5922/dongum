window.App = window.App || {};

/**
 * Günlük & Semptom Kayıt Modülü (Symptoms & Daily Log Module)
 * Günlük ruh hali, kanama, ağrı, akıntı, su tüketimi, uyku ve notları kaydeder.
 */
window.App.Symptoms = {
  currentDate: null,
  currentData: {},
  hasChanges: false,
  container: null,

  render(container, dateStr) {
    this.container = container;
    if (!dateStr) {
      const d = new Date();
      dateStr = window.App.Utils ? window.App.Utils.toISODateString(d) : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    this.currentDate = dateStr;
    this.loadData(this.currentDate);
    this.refresh();
  },

  loadData(dateStr) {
    if (window.App.Data && typeof window.App.Data.getSymptoms === 'function') {
      this.currentData = window.App.Data.getSymptoms(dateStr) || {};
    } else {
      this.currentData = {};
    }
    this.hasChanges = false;
  },

  saveDataQuietly() {
    if (window.App.Data && typeof window.App.Data.saveSymptoms === 'function') {
      window.App.Data.saveSymptoms(this.currentDate, this.currentData);
      this.hasChanges = false;
    }
  },

  saveData() {
    if (window.App.Data && typeof window.App.Data.saveSymptoms === 'function') {
      window.App.Data.saveSymptoms(this.currentDate, this.currentData);
      this.hasChanges = false;

      if (window.App.Utils && window.App.Utils.vibrate) {
        window.App.Utils.vibrate(40);
      }

      if (window.App.Utils && window.App.Utils.showToast) {
        window.App.Utils.showToast(window.App.I18n.t('symptoms.symptomsSaved', 'Belirtileriniz başarıyla kaydedildi 🌸'), 'success');
      }
    }
  },

  navigateDay(delta) {
    const d = window.App.Utils ? window.App.Utils.parseDate(this.currentDate) : new Date(this.currentDate);
    d.setDate(d.getDate() + delta);
    this.currentDate = window.App.Utils ? window.App.Utils.toISODateString(d) : d.toISOString().split('T')[0];
    this.loadData(this.currentDate);
    this.refresh();
  },

  goToToday() {
    const d = new Date();
    this.currentDate = window.App.Utils ? window.App.Utils.toISODateString(d) : d.toISOString().split('T')[0];
    this.loadData(this.currentDate);
    this.refresh();
  },

  refresh() {
    if (!this.container) return;

    const dateObj = window.App.Utils ? window.App.Utils.parseDate(this.currentDate) : new Date(this.currentDate);
    const formattedDate = window.App.Utils ? window.App.Utils.formatDateLong(dateObj) : this.currentDate;
    const isToday = window.App.Utils ? window.App.Utils.isToday(dateObj) : false;

    let html = `
      <div class="symptoms-screen fade-in">
        <!-- Tarih Başlığı & Gezinme -->
        <div class="symptom-date-bar">
          <button type="button" class="btn-cal-nav prev-day" aria-label="Önceki Gün">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="symptom-date-center">
            <h2 class="symptom-date-title">${formattedDate}</h2>
            ${isToday ? '<span class="symptom-today-badge">Bugün</span>' : '<button type="button" class="btn-link go-today-btn">Bugüne Dön</button>'}
          </div>
          <button type="button" class="btn-cal-nav next-day" aria-label="Sonraki Gün">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="symptoms-list">
          <!-- 1. RUH HALİ -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">😊 Ruh Hali</h3>
            <div class="symptom-btn-row">
              ${this._renderOptionBtn('mood', 'great', '😊', 'Harika')}
              ${this._renderOptionBtn('mood', 'good', '😌', 'İyi')}
              ${this._renderOptionBtn('mood', 'okay', '😐', 'Normal')}
              ${this._renderOptionBtn('mood', 'bad', '😔', 'Mutsuz')}
              ${this._renderOptionBtn('mood', 'terrible', '😢', 'Hassas')}
            </div>

            <!-- Dinamik Ruh Hali Değerlendirme & Moral Rehberi -->
            ${this._renderMoodAdvice(this.currentData.mood)}
          </div>

          <!-- 2. KANAMA / AKINTI -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">🩸 Kanama Yoğunluğu</h3>
            <div class="symptom-btn-row">
              ${this._renderOptionBtn('flow', 'none', '○', 'Yok')}
              ${this._renderOptionBtn('flow', 'spotting', '◐', 'Leke')}
              ${this._renderOptionBtn('flow', 'light', '●', 'Hafif')}
              ${this._renderOptionBtn('flow', 'medium', '●●', 'Orta')}
              ${this._renderOptionBtn('flow', 'heavy', '●●●', 'Yoğun')}
            </div>

            <!-- Dinamik Medikal Kanama Rehberi & Tavsiye Kartı -->
            ${this._renderFlowAdvice(this.currentData.flow)}
          </div>

          <!-- 3. AĞRI & RAHATSIZLIK -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">⚡ Ağrı Seviyesi</h3>
            <div class="symptom-btn-row">
              ${this._renderOptionBtn('painLevel', 'none', '0', 'Yok')}
              ${this._renderOptionBtn('painLevel', 'mild', '1', 'Hafif')}
              ${this._renderOptionBtn('painLevel', 'moderate', '2', 'Orta')}
              ${this._renderOptionBtn('painLevel', 'severe', '3', 'Şiddetli')}
            </div>

            <!-- Dinamik Medikal Tavsiye & Egzersiz Kartı -->
            ${this._renderPainAdvice(this.currentData.painLevel)}

            <h4 class="symptom-sub-title">Ağrı Hissedilen Bölgeler</h4>
            <div class="symptom-chip-grid">
              ${this._renderMultiChip('painAreas', 'abdomen', 'Kramplar / Karın')}
              ${this._renderMultiChip('painAreas', 'lowerBack', 'Bel Ağrısı')}
              ${this._renderMultiChip('painAreas', 'head', 'Baş Ağrısı')}
              ${this._renderMultiChip('painAreas', 'breast', 'Göğüs Hassasiyeti')}
              ${this._renderMultiChip('painAreas', 'legs', 'Bacak / Eklem')}
              ${this._renderMultiChip('painAreas', 'upperBack', 'Sırt')}
            </div>

            <!-- Dinamik Bölge Bazlı Ağrı & Rahatlama Rehberi -->
            ${this._renderPainAreasAdvice(this.currentData.painAreas)}
          </div>

          <!-- 4. SERVİKAL AKINTI -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">💧 Vajinal Akıntı Türü</h3>
            <div class="symptom-chip-grid">
              ${this._renderOptionChip('discharge', 'none', 'Yok / Kuru')}
              ${this._renderOptionChip('discharge', 'sticky', 'Yapışkan')}
              ${this._renderOptionChip('discharge', 'creamy', 'Kremsi / Beyaz')}
              ${this._renderOptionChip('discharge', 'eggWhite', 'Yumurta Akı (Doğurgan)')}
              ${this._renderOptionChip('discharge', 'watery', 'Sulu')}
            </div>

            <!-- Dinamik Vajinal Akıntı & Doğurganlık Rehberi -->
            ${this._renderDischargeAdvice(this.currentData.discharge)}
          </div>

          <!-- 5. YAŞAM TARZI -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">🏃 Yaşam Tarzı & Aktivite</h3>
            <div class="symptom-toggle-list">
              <label class="symptom-toggle-row">
                <div class="toggle-row-left">
                  <span class="toggle-icon">🏃‍♀️</span>
                  <span class="toggle-label">Egzersiz / Spor Yaptım</span>
                </div>
                <input type="checkbox" class="lifestyle-toggle" data-key="exercise" ${this.currentData.exercise ? 'checked' : ''}>
              </label>
              <label class="symptom-toggle-row">
                <div class="toggle-row-left">
                  <span class="toggle-icon">❤️</span>
                  <span class="toggle-label">Cinsel Birliktelik</span>
                </div>
                <input type="checkbox" class="lifestyle-toggle" data-key="intimacy" ${this.currentData.intimacy ? 'checked' : ''}>
              </label>
            </div>
          </div>

          <!-- 6. SU TÜKETİMİ -->
          <div class="symptom-card">
            <div class="symptom-card-header-flex">
              <h3 class="symptom-card-title" style="margin-bottom:0;">🥛 Su Tüketimi</h3>
              <span class="water-liters-badge mono">~${(((this.currentData.water !== undefined ? this.currentData.water : 0)) * 0.25).toFixed(1)} Litre</span>
            </div>

            <!-- Elle Yazma & Artırma/Azaltma Kontrolleri -->
            <div class="water-input-stepper-row">
              <button type="button" class="btn-water-step btn-water-minus" aria-label="1 Bardak Azalt">−</button>
              <div class="water-input-wrap">
                <input type="number" min="0" max="30" class="form-input water-num-input mono" value="${this.currentData.water !== undefined ? this.currentData.water : 0}" aria-label="Bardak Sayısı">
                <span class="water-unit-label">Bardak</span>
              </div>
              <button type="button" class="btn-water-step btn-water-plus" aria-label="1 Bardak Ekle">+</button>
            </div>

            <!-- Dokunmatik Su Bardakları -->
            <div class="water-glasses-row">
              ${this._renderWaterGlasses()}
            </div>

            <!-- Dinamik Hidrasyon Değerlendirme & Tavsiye Kartı -->
            ${this._renderWaterAdvice(this.currentData.water !== undefined ? this.currentData.water : 0)}
          </div>

          <!-- 7. UYKU KALİTESİ -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">🌙 Uyku Kalitesi</h3>
            <div class="symptom-btn-row">
              ${this._renderOptionBtn('sleep', 'terrible', '🌑', 'Çok Kötü')}
              ${this._renderOptionBtn('sleep', 'bad', '🌘', 'Kötü')}
              ${this._renderOptionBtn('sleep', 'okay', '🌗', 'Normal')}
              ${this._renderOptionBtn('sleep', 'good', '🌖', 'İyi')}
              ${this._renderOptionBtn('sleep', 'great', '🌕', 'Harika')}
            </div>
          </div>

          <!-- 8. EKSTRA & ÖZEL BELİRTİLER (Kullanıcının Kendisinin Ekleyebileceği Bölüm) -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">➕ Özel Belirti / Ekstra Semptom Ekle</h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 10px;">Hızlıca seçin veya kendi özel belirtinizi yazarak listeye ekleyin:</p>
            
            <!-- Hazır Popüler Belirti Çipleri -->
            <div class="symptom-chip-grid mb-2">
              ${this._renderCustomPresetChip('Mide Bulantısı 🤢')}
              ${this._renderCustomPresetChip('Şişkinlik / Ödem 🎈')}
              ${this._renderCustomPresetChip('Tatlı / Şeker Krizi 🍫')}
              ${this._renderCustomPresetChip('Cilt Sivilcelenmesi ✨')}
              ${this._renderCustomPresetChip('Sıcak Basması 🔥')}
              ${this._renderCustomPresetChip('Yorgunluk / Halsizlik 🥱')}
              ${this._renderCustomPresetChip('Baş Dönmesi 💫')}
              ${this._renderCustomPresetChip('İştah Artışı 🍕')}
            </div>

            <!-- Elle Özel Belirti Yazıp Ekleme Kutusu -->
            <div class="custom-symptom-input-row" style="display: flex; gap: 8px; margin: 12px 0 8px;">
              <input type="text" class="form-input custom-symptom-input" placeholder="Örn: Bacak krampı, Huzursuzluk..." style="flex: 1;">
              <button type="button" class="btn btn-secondary btn-add-custom-symptom">+ Ekle</button>
            </div>

            <!-- Eklenen Özel Belirtiler Listesi -->
            ${this._renderCustomUserSymptomsList()}
          </div>

          <!-- 9. GÜNLÜK NOTLAR -->
          <div class="symptom-card">
            <h3 class="symptom-card-title">📝 Günlük Notlar</h3>
            <textarea class="form-input symptom-notes-area" rows="3" placeholder="Bugün nasıl hissediyorsunuz? Not ekleyin...">${this.currentData.notes || ''}</textarea>
          </div>
        </div>

        <!-- KAYDET BUTONU -->
        <div class="symptom-save-bar">
          <button type="button" class="btn btn-primary btn-block btn-lg save-symptoms-btn">
            💾 Belirtileri Kaydet
          </button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.attachEventListeners();
  },

  _renderMoodAdvice(mood) {
    if (!mood) return '';

    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const data = {
      great: {
        title: isTr ? '😊 Harika & Zinde Enerji' : 'Great & High Energy',
        status: isTr ? 'Östrojen & Endorfin Zirvesi' : 'Peak Endorphins',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Mükemmel bir ruh halindesin! Bedenin sana bolca güç ve berraklık sunuyor. Ancak bu enerjiyi hemen başkalarının işlerine harcamadan önce, birazını da sadece kendini mutlu eden şeylere ayır.' 
          : 'High energy and mental clarity! Channel some of this vitality into things that purely nourish you.',
        tips: isTr ? [
          '🌟 Bu pozitif gücü seni gerçekten heyecanlandıran kişisel hedeflerine yönlendir',
          '🌿 Kendine sınır koymayı unutma; her şeye "evet" demek zorunda değilsin',
          '🏃‍♀️ Hafif bir spor veya açık hava yürüyüşü bu canlılığı pekiştirir'
        ] : [
          'Direct this vitality toward personal passions',
          'Maintain healthy boundaries',
          'Enjoy outdoor activity'
        ]
      },
      good: {
        title: isTr ? '😌 Sakin & Dengeli Ruh Hali' : 'Calm & Peaceful',
        status: isTr ? 'İçsel Uyum Evresi' : 'Balanced Harmony',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Bedenin ve zihnin uyum içinde. Hayatın koşturmacasını biraz yavaşlatıp kendi içine dönmek ve anın tadını çıkarmak için çok güzel bir gün.' 
          : 'Your body and mind are in grounded harmony. Perfect day to slow down and enjoy the moment.',
        tips: isTr ? [
          '☕ Sıcak bir içecek eşliğinde sadece kendinle baş başa 15 dakika geçir',
          '📖 Sevdiğin bir kitap, müzik veya sessizlikle ruhunu besle',
          '💧 Vücudunun nem dengesi için suyunu yudumlamayı unutma'
        ] : [
          'Spend 15 mindful minutes with yourself',
          'Nourish your mind with relaxing activities',
          'Stay well hydrated'
        ]
      },
      okay: {
        title: isTr ? '😐 Normal / Nötr Durum' : 'Neutral & Steady',
        status: isTr ? 'Doğal Dinlenme & Şarj Modu' : 'Rest Mode',
        statusClass: 'status-mild',
        desc: isTr 
          ? 'Her gün üretken, neşeli ya da enerjik olmak zorunda değilsin. Nötr hissetmek de zihnin ve bedenin en doğal dinlenme ve kendini koruma biçimidir.' 
          : 'You do not have to be high-energy every day. Feeling neutral is a healthy resting state.',
        tips: isTr ? [
          '🛋️ Kendini hiçbir şeyi "halletmek" zorunda hissetme; akışta kal',
          '🚶‍♀️ Pencere önünde 5 dakika derin nefes alarak zihnini havalandır',
          '✨ Kendine karşı sabırlı ve nazik ol'
        ] : [
          'Do not pressure yourself to be productive',
          'Take gentle deep breaths',
          'Practice patience with yourself'
        ]
      },
      bad: {
        title: isTr ? '😔 Mutsuzluk & Tükenmişlik Hissi' : 'Low Mood / Unhappy',
        status: isTr ? 'Önce Kendi Sağlığını & Ruhunu Düşün' : 'Put Yourself First',
        statusClass: 'status-mod',
        desc: isTr 
          ? '<strong>Şu an hissettiğin mutsuzluk veya ağırlık senin suçun değil.</strong> Döngünün bu evresinde hormonların (östrojen ve progesteron) ani çekilmesi, beyindeki serotonin ve dopamin salgısını doğrudan etkiler. Dünya bir günlüğüne bekleyebilir; bugün başkalarını memnun etmeye çalışmak yerine sadece kendini koruma ve sarıp sarmalama günün.' 
          : 'Feeling unhappy or exhausted is not your fault; it is directly tied to hormonal shifts impacting neurotransmitters. Today, put yourself first and let the world wait.',
        tips: isTr ? [
          '🛑 <strong>Sınır Koy & "Hayır" De:</strong> Bugün seni yoran, zorlayan insanlardan ve işlerden geri çekilme hakkını kullan.',
          '🛏️ <strong>Suçluluk Duymadan Dinlen:</strong> Yatakta uzanmak, hiçbir şey yapmamak tembellik değil; hormonlarının ihtiyaç duyduğu hayati bir onarım sürecidir.',
          '☕ <strong>Sıcak ve Yatıştırıcı Bir Mola:</strong> Sıcak kakao, melisa veya papatya çayı sinir sistemine "güvendesin" mesajı verir.',
          '🫂 <strong>Kendini Yargılama:</strong> Bu his kalıcı değil; 24-48 saat içinde hormonların yeniden dengelenecektir.'
        ] : [
          'Set boundaries and say no to draining demands',
          'Rest without guilt; resting is restorative repair',
          'Drink warm chamomile or cocoa to soothe nerves',
          'Do not judge yourself; this temporary wave will pass'
        ]
      },
      terrible: {
        title: isTr ? '😢 Yoğun Duygusallık & Kırılganlık' : 'Intense Sensitivity',
        status: isTr ? 'Şefkat & Güvenli Alan Zamanı' : 'Self-Compassion Time',
        statusClass: 'status-severe',
        desc: isTr 
          ? '<strong>Gözlerinin dolması, alıngan hissetmen veya ağlama isteğin bir zayıflık değildir.</strong> Vücudun yoğun bir hormonal fırtınadan geçiyor. "Güçlü görünmek" zorunda değilsin; bugün sadece kendine şefkat gösterme, yavaşlama ve kendi yaralarını sarma vaktidir.' 
          : 'Tears or emotional vulnerability are not weaknesses; they are natural emotional releases during hormonal shifts. Be deeply compassionate with yourself.',
        tips: isTr ? [
          '💧 <strong>Ağlamaktan Korkma:</strong> Ağlamak, vücutta biriken stres hormonlarını (kortizol) dışarı atmanın en sağlıklı biyolojik yoludur.',
          '🚫 <strong>Bugün Önemli Kararlar Alma:</strong> Zihninin yorgun olduğu bu günlerde büyük kararları birkaç gün sonrasına ertele.',
          '🍫 <strong>Ruhuna Küçük Hediyeler Ver:</strong> Ilık bir duş, yumuşak bir battaniye, biraz bitter çikolata ve sessizlik sana ilaç gibi gelecektir.',
          '💖 <strong>Unutma:</strong> Sen çok değerlisin, bedeninin bu sesini dinle ve sadece kendine sarıl.'
        ] : [
          'Allow yourself to cry; it releases cortisol',
          'Postpone big decisions for a couple of days',
          'Comfort yourself with warmth, rest and quiet',
          'Remember: You are precious, treat yourself with kindness'
        ]
      }
    };

    const item = data[mood];
    if (!item) return '';

    return `
      <div class="pain-advice-card ${item.statusClass}" style="margin-top: 12px;">
        <div class="advice-header">
          <span class="advice-title">${item.title}</span>
          <span class="advice-status-badge">${item.status}</span>
        </div>
        <p class="advice-desc" style="margin-bottom: 10px; line-height: 1.5;">${item.desc}</p>
        <div class="advice-tips-list">
          ${item.tips.map(t => `<div class="advice-tip-item"><span class="tip-bullet">•</span><span>${t}</span></div>`).join('')}
        </div>
      </div>
    `;
  },

  _renderFlowAdvice(flow) {
    if (!flow) return '';

    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const flowData = {
      none: {
        title: isTr ? '○ Kanama Yok' : 'No Bleeding',
        duration: isTr ? 'Döngünün Kanamasız Dönemi (~21-30 Gün)' : 'Non-bleeding cycle phase',
        status: isTr ? 'Normal Durum' : 'Normal',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Herhangi bir kanama veya lekelenme bulunmuyor. Foliküler faz, yumurtlama veya luteal fazda beklenen doğal durumdur.'
          : 'No bleeding or spotting recorded. Expected during follicular, ovulation, or luteal phases.',
        tips: isTr ? [
          '💧 Günlük su ve sağlıklı beslenme düzeninizi koruyun',
          '📊 Döngü takviminizi takip etmeye devam edin'
        ] : [
          'Maintain regular hydration and nutrition',
          'Keep tracking your cycle'
        ]
      },
      spotting: {
        title: isTr ? '◐ Lekelenme (Spotting)' : 'Spotting',
        duration: isTr ? 'Tipik Olarak 1 - 2 Gün' : 'Typically 1 - 2 Days',
        status: isTr ? 'Regl Öncesi/Sonrası veya Ovulasyonda Normal' : 'Common Before/After Period',
        statusClass: 'status-mild',
        desc: isTr 
          ? 'İç çamaşırında veya peçetede birkaç damla pembe ya da kahverengi akıntıdır. Ped doldurmaz.'
          : 'A few drops of pink or brownish discharge that does not fill a pad.',
        tips: isTr ? [
          '🌸 Reglin 1 gün öncesinde veya bitişindeki son 1-2 günde (eski kanın temizlenmesi) çok yaygındır',
          '✨ Yumurtlama (ovulasyon) anında östrojen dalgalanmasına bağlı 1 gün lekelenme görülebilir',
          '🩲 Günlük ped (pantyliner) kullanmak yeterli hijyeni sağlar',
          '⚠️ Döngü ortasında sürekli tekrarlayan lekelenmelerde jinekoloğa danışılmalıdır'
        ] : [
          'Common 1-2 days before period start or as old blood clears at the end',
          'Can occur during ovulation due to estrogen dip',
          'Pantyliners provide sufficient protection',
          'Consult a doctor if unexplained spotting persists'
        ]
      },
      light: {
        title: isTr ? '● Hafif Kanama' : 'Light Flow',
        duration: isTr ? 'Genellikle 1 - 2 Gün (Regl Başı veya Sonu)' : 'Typically 1 - 2 Days',
        status: isTr ? 'Normal Döngü Süreci' : 'Normal Flow',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Günde ortalama 1-2 ped/tampon dolumu kadar hafif kanamadır. Genellikle reglin 1. gününde veya 4-5. günlerinde görülür.'
          : 'Light flow filling 1-2 pads/tampons per day. Common on day 1 or days 4-5.',
        tips: isTr ? [
          '🧴 Normal emicilikte ped veya menstrüel kap kullanabilirsiniz',
          '🥗 C vitamini ve demir dengenizi destekleyin',
          '💧 Günde en az 2 litre ılık su tüketin'
        ] : [
          'Use regular absorbency pads or menstrual cup',
          'Support iron and Vitamin C intake',
          'Drink at least 2L of water'
        ]
      },
      medium: {
        title: isTr ? '●● Orta / Standart Kanama' : 'Medium / Standard Flow',
        duration: isTr ? 'Genellikle 2 - 3 Gün (Reglin 2. ve 3. Günleri)' : 'Typically 2 - 3 Days',
        status: isTr ? 'Sağlıklı Tipik Regl Kanaması' : 'Healthy Standard Flow',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Ped veya tamponun 3-4 saatte bir normal şekilde dolduğu, sağlıklı regl akışının en tipik halidir.'
          : 'Typical healthy menstrual flow filling a pad every 3-4 hours.',
        tips: isTr ? [
          '🧼 Hijyen için ped/tamponunuzu 3-4 saatte bir düzenli değiştirin (enfeksiyon riskini önler)',
          '🥩 Demir açısından zengin gıdalar (kırmızı et, ıspanak, mercimek) tüketin',
          '🚿 Ilık bir duş pelvik kasları ve rahim kasılmalarını rahatlatır'
        ] : [
          'Change pads/tampons every 3-4 hours for optimal hygiene',
          'Consume iron-rich foods (spinach, lentils, lean meat)',
          'A warm shower helps ease pelvic cramps'
        ]
      },
      heavy: {
        title: isTr ? '●●● Yoğun Kanama' : 'Heavy Flow',
        duration: isTr ? 'En Fazla 1 - 2 Gün Normaldir' : 'Normal for 1 - 2 Days Max',
        status: isTr ? 'Reglin Zirve Günü / Aşırı Kanama Takibi' : 'Peak Flow / Monitor Closely',
        statusClass: 'status-mod',
        desc: isTr 
          ? 'Kanamanın en yüksek seviyeye ulaştığı gündür. Genellikle reglin 1. veya 2. gününde 24-48 saat kadar sürmesi doğaldır.'
          : 'Peak flow day. Common for 24-48 hours during days 1 or 2.',
        tips: isTr ? [
          '🛡️ Gece boyu veya yüksek emici ped / menstrüel kap tercih edin',
          '🛌 Yorucu egzersizlerden kaçının, vücudunuza dinlenme zamanı tanıyın',
          '⚠️ KRİTİK SINIR (Menoraji Şüphesi): Eğer pediniz 1-2 saatte bir tamamen dolup taşıyorsa, madeni paradan büyük pıhtılar geliyorsa, baş dönmesi eşlik ediyorsa veya yoğun kanama 7 günden uzun sürüyorsa mutlaka bir Kadın Hastalıkları ve Doğum Uzmanına danışılmalıdır.'
        ] : [
          'Use overnight/high absorbency pads or menstrual cup',
          'Avoid strenuous workouts and rest',
          'WARNING: If soaking through a pad every 1-2 hours, passing large clots, or bleeding >7 days, seek medical evaluation.'
        ]
      }
    };

    const item = flowData[flow];
    if (!item) return '';

    return `
      <div class="pain-advice-card ${item.statusClass}">
        <div class="advice-header">
          <span class="advice-title">${item.title}</span>
          <span class="advice-status-badge">${item.status}</span>
        </div>
        <div class="advice-duration-tag">⏱️ Beklenen Süre: <strong>${item.duration}</strong></div>
        <p class="advice-desc">${item.desc}</p>
        <div class="advice-tips-list">
          ${item.tips.map(t => `<div class="advice-tip-item"><span class="tip-bullet">•</span><span>${t}</span></div>`).join('')}
        </div>
        <div class="advice-disclaimer-note">
          <small>⚠️ <strong>Yasal Bilgilendirme:</strong> Bu veriler klinik jinekoloji rehberleri (ACOG/WHO) baz alınarak genel bilgilendirme amacıyla hazırlanmıştır. Kesinlikle tıbbi teşhis veya doktor tavsiyesi yerine geçmez.</small>
        </div>
      </div>
    `;
  },

  _renderPainAdvice(level) {
    if (!level) return '';

    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const adviceData = {
      none: {
        title: isTr ? '🌿 Ağrısız & Konforlu Gün' : 'Comfortable Day',
        status: isTr ? 'Normal Durum' : 'Normal',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Harika! Hormonal dengeniz stabil seyrediyor. Vücudunuzun bu rahat halini korumak için hafif tempolu yürüyüşler ve bol su tüketimi yapabilirsiniz.'
          : 'Great! Your hormonal balance is stable. Stay hydrated and maintain light activity.',
        tips: isTr ? [
          '💧 Günde en az 2 litre su tüketerek hidrasyonu koruyun',
          '🚶‍♀️ Hafif yürüyüş veya yoga ile enerjinizi destekleyin'
        ] : [
          'Stay well hydrated with at least 2L of water',
          'Maintain energy with light walks or yoga'
        ]
      },
      mild: {
        title: isTr ? '🌸 Hafif Kramplar & Hassasiyet' : 'Mild Cramps & Tenderness',
        status: isTr ? 'Normal (Primer Dismenore)' : 'Normal',
        statusClass: 'status-mild',
        desc: isTr 
          ? 'Döngü başlangıcında veya yumurtlama döneminde hafif rahim kasılmaları ve bel hassasiyeti son derece doğaldır.'
          : 'Mild uterine contractions and lower back sensitivity are natural around menstruation or ovulation.',
        tips: isTr ? [
          '☕ Ilık papatya, zencefil veya melisa çayı için (kas spazmlarını çözer)',
          '🧘‍♀️ Çocuk Pozu (Balasana) ve Kedi-İnek esnemesi uygulayın',
          '🚶‍♀️ 15 dakikalık hafif yürüyüş kan dolaşımını rahatlatır'
        ] : [
          'Drink warm chamomile or ginger tea to relax muscles',
          'Practice Child\'s Pose and Cat-Cow stretches',
          'A 15-minute gentle walk eases pelvic blood flow'
        ]
      },
      moderate: {
        title: isTr ? '⚡ Belirgin Kramplar & Ağrı' : 'Moderate Cramps & Pain',
        status: isTr ? 'Hafifletici Önlem Önerilir' : 'Relief Recommended',
        statusClass: 'status-mod',
        desc: isTr 
          ? 'Prostaglandin hormonunun yükselmesiyle oluşan belirgin kramplardır. Sıcak uygulama ve dinlenme ile hızla hafifletilebilir.'
          : 'Elevated prostaglandins cause noticeable cramps. Heat therapy and targeted rest bring quick relief.',
        tips: isTr ? [
          '♨️ Karın veya bel bölgesine 15-20 dk sıcak su torbası uygulayın',
          '🧘 Dizleri göğse çekme pozu (Apanasana) pelvik baskıyı azaltır',
          '🚫 Kafein, aşırı tuz ve şekerden kaçının (kas gerginliğini artırabilir)',
          '💊 Gerekirse doktorunuzun daha önce önerdiği ağrı kesiciyi yemek sonrası alın'
        ] : [
          'Apply a heating pad to lower abdomen/back for 15-20 minutes',
          'Knees-to-chest pose (Apanasana) relieves pelvic pressure',
          'Avoid caffeine, excess sodium and sugar',
          'Take physician-approved pain relief if needed'
        ]
      },
      severe: {
        title: isTr ? '🚨 Şiddetli / Zorlayıcı Ağrı' : 'Severe Cramping / Discomfort',
        status: isTr ? 'Dinlenme & Dikkat' : 'Attention & Rest',
        statusClass: 'status-severe',
        desc: isTr 
          ? 'Günlük yaşamı zorlaştıran yoğun ağrılardır. Öncelikle vücudunuzu dinlendirin ve sıcak kompres uygulayın.'
          : 'Intense cramps affecting your day. Prioritize rest and heat therapy.',
        tips: isTr ? [
          '🛏️ Bacaklarınızın arasına yastık alarak cenin pozisyonunda dinlenin',
          '♨️ Sıcak su torbası veya ılık bir duş ile kas spazmlarını gevşetin',
          '⚠️ İlaçlara rağmen dinmeyen, bayılma hissi, kusma veya anormal yoğun kanamayla seyreden ağrılarda mutlaka bir Kadın Hastalıkları ve Doğum Uzmanına danışılmalıdır.'
        ] : [
          'Rest in fetal position with a pillow between your knees',
          'Use heat therapy or take a warm shower to ease spasms',
          'Consult a gynecologist if pain is unbearable, unmanaged by meds, or accompanied by nausea.'
        ]
      }
    };

    const item = adviceData[level];
    if (!item) return '';

    return `
      <div class="pain-advice-card ${item.statusClass}">
        <div class="advice-header">
          <span class="advice-title">${item.title}</span>
          <span class="advice-status-badge">${item.status}</span>
        </div>
        <p class="advice-desc">${item.desc}</p>
        <div class="advice-tips-list">
          ${item.tips.map(t => `<div class="advice-tip-item"><span class="tip-bullet">•</span><span>${t}</span></div>`).join('')}
        </div>
      </div>
    `;
  },

  _renderPainAreasAdvice(selectedAreas) {
    if (!selectedAreas || !Array.isArray(selectedAreas) || selectedAreas.length === 0) return '';

    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const areaDetails = {
      abdomen: {
        title: isTr ? '🩺 Kramplar / Alt Karın' : 'Abdominal Cramps',
        normalText: isTr ? 'Tamamen Normal (Primer Dismenore)' : 'Common & Normal',
        duration: isTr ? 'Reglin 1 - 3. günleri' : 'Days 1-3 of period',
        why: isTr 
          ? 'Rahmin iç tabakasını dökmek için salgılanan prostaglandin hormonunun kasları kasmasından kaynaklanır.' 
          : 'Caused by uterine muscle contractions driven by prostaglandins.',
        tips: isTr ? [
          '♨️ Alt karına 15-20 dk sıcak su torbası uygulayın (kas gevşemesini hızlandırır)',
          '🧘‍♀️ Çocuk Pozu (Balasana) ve Kedi-İnek esnemesi karın basıncını azaltır',
          '☕ Sıcak zencefil veya papatya çayı için'
        ] : [
          'Apply heat pad to lower abdomen for 15-20 mins',
          'Practice Child\'s Pose and Cat-Cow stretches',
          'Drink warm chamomile or ginger tea'
        ]
      },
      lowerBack: {
        title: isTr ? '🩺 Bel Ağrısı' : 'Lower Back Pain',
        normalText: isTr ? 'Tamamen Normal (Yansıyan Ağrı)' : 'Normal Referred Pain',
        duration: isTr ? 'Genellikle ilk 1 - 2 gün' : 'Usually first 1-2 days',
        why: isTr 
          ? 'Rahim kasılmaları pelvik sinir ağı üzerinden bel ve omurganın alt kısmına yansır.' 
          : 'Pelvic nerve pathways transmit uterine contractions to the lower back.',
        tips: isTr ? [
          '🛏️ Bacaklarınızın arasına yastık koyarak cenin pozisyonunda yan yatın (bel baskısını sıfırlar)',
          '♨️ Bele sıcak havlu/torba uygulamak kas spazmını çözer',
          '🧘 Dizleri göğse çekme pozu (Apanasana) omurgayı rahatlatır'
        ] : [
          'Sleep on your side with a pillow between knees',
          'Apply gentle heat to lower back',
          'Knees-to-chest pose releases spinal tension'
        ]
      },
      head: {
        title: isTr ? '🩺 Baş Ağrısı / Menstrüel Migren' : 'Hormonal Headache',
        normalText: isTr ? 'Hormon Düşüşüne Bağlı Normal' : 'Hormone Drop Related',
        duration: isTr ? 'Reglden 1-2 gün önce veya ilk 1-2 gün' : '1-2 days before or during period start',
        why: isTr 
          ? 'Regl öncesinde östrojen ve progesteron hormonlarının aniden düşmesiyle beyin kan damarlarının genişlemesinden kaynaklanır.' 
          : 'Triggered by the sharp drop in estrogen and progesterone prior to menstruation.',
        tips: isTr ? [
          '💧 Bol su tüketin (dehidrasyon baş ağrısını 2 katına çıkarır)',
          '💆‍♀️ Şakaklara hafif nane yağı ile dairesel masaj yapın',
          '🌑 Loş ve sessiz bir odada 20-30 dakika dinlenin'
        ] : [
          'Stay well hydrated (dehydration amplifies headache)',
          'Gentle peppermint oil temple massage',
          'Rest in a dim, quiet room for 20-30 minutes'
        ]
      },
      breast: {
        title: isTr ? '🩺 Göğüs Hassasiyeti & Şişkinlik' : 'Breast Tenderness (Mastalgia)',
        normalText: isTr ? 'PMS Döneminde Çok Yaygın ve Doğal' : 'Normal PMS Symptom',
        duration: isTr ? 'Reglden 3 - 7 gün önce başlar, kanamayla biter' : '3-7 days before period, subsides with flow',
        why: isTr 
          ? 'Yumurtlama sonrası yükselen progesteron ve prolaktin hormonlarının meme dokusunda sıvı (ödem) tutmasından oluşur.' 
          : 'Elevated post-ovulation progesterone causes fluid retention in breast tissue.',
        tips: isTr ? [
          '🩱 Telsiz, yumuşak pamuklu veya sporcu sütyeni tercih edin',
          '🚫 Kafein ve tuz tüketimini azaltın (göğüsteki gerginliği ve ödemi artırır)',
          '🚿 Ilık duş ve hafif göğüs masajı gerginliği azaltır'
        ] : [
          'Wear supportive, non-wired cotton or sports bras',
          'Reduce caffeine and sodium to reduce swelling',
          'Warm showers soothe breast tissue'
        ]
      },
      legs: {
        title: isTr ? '🩺 Bacak / Eklem / Uyluk Ağrısı' : 'Leg & Joint Aches',
        normalText: isTr ? 'Pelvik Kasılmalara Bağlı Normal' : 'Normal Pelvic Radiating Ache',
        duration: isTr ? 'Kanamanın ilk 1 - 2 günü' : 'First 1-2 days of bleeding',
        why: isTr 
          ? 'Pelvik bölgedeki prostaglandin kasılmalarının siyatik ve femoral sinirler üzerinden uyluklara ve bacaklara yayılmasıdır.' 
          : 'Uterine contractions radiate along sciatic and femoral nerve pathways.',
        tips: isTr ? [
          '🧘‍♀️ Bacakları duvara yaslayarak yukarı kaldırma pozu (10 dk bacak kan akışını rahatlatır)',
          '🦵 Bacak kaslarına hafif magnezyum yağı veya ılık su ile masaj',
          '🚶‍♀️ 10-15 dakikalık hafif tempolu yürüyüş bacak kaslarını gevşetir'
        ] : [
          'Legs-up-the-wall pose for 10 minutes restores circulation',
          'Gentle leg massage with warm oils',
          'Short, light walks release leg tension'
        ]
      },
      upperBack: {
        title: isTr ? '🩺 Sırt & Omuz Gerginliği' : 'Upper Back Tension',
        normalText: isTr ? 'Duruş / Postür Gerginliğine Bağlı Normal' : 'Posture & Tension Related',
        duration: isTr ? 'Genellikle 1 - 2 gün' : 'Usually 1-2 days',
        why: isTr 
          ? 'Karın krampları sebebiyle vücudun öne doğru bükülmesi ve postür değişikliği sırt kaslarında gerilmeye yol açar.' 
          : 'Curling forward due to cramps strains upper back and shoulder muscles.',
        tips: isTr ? [
          '🔄 Omuzları ve kürek kemiklerini geriye doğru dairesel esnetin',
          '🧘‍♀️ Kedi-inek esnemesi ve derin diyafram nefesi uygulayın',
          '🪑 Sırtınızı destekleyen dik bir pozisyonda oturun'
        ] : [
          'Shoulder blade rolls and upper back stretches',
          'Cat-Cow stretches and deep breathing',
          'Maintain ergonomic seated posture'
        ]
      }
    };

    return `
      <div class="pain-areas-advice-container" style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
        ${selectedAreas.map(areaKey => {
          const item = areaDetails[areaKey];
          if (!item) return '';
          return `
            <div class="pain-advice-card status-mild" style="margin-top: 0;">
              <div class="advice-header">
                <span class="advice-title">${item.title}</span>
                <span class="advice-status-badge">${item.normalText}</span>
              </div>
              <div class="advice-duration-tag">⏱️ Beklenen Süre: <strong>${item.duration}</strong></div>
              <p class="advice-desc" style="margin-bottom: 6px;"><strong>Neden Olur?</strong> ${item.why}</p>
              <div class="advice-tips-list">
                ${item.tips.map(t => `<div class="advice-tip-item"><span class="tip-bullet">•</span><span>${t}</span></div>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  _renderDischargeAdvice(discharge) {
    if (!discharge) return '';

    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const data = {
      none: {
        title: isTr ? '💧 Yok / Kuru' : 'Dry / None',
        status: isTr ? 'Tamamen Normal' : 'Completely Normal',
        fertility: isTr ? 'Düşük Doğurganlık' : 'Low Fertility',
        statusClass: 'status-good',
        when: isTr ? 'Genellikle reglden hemen sonraki ilk günlerde veya döngünün son evresinde görülür.' : 'Common right after menstruation or late luteal phase.',
        desc: isTr 
          ? 'Östrojen hormonunun en düşük olduğu günlerde vajinal salgılar minimumdur. Herhangi bir ıslaklık hissi olmaz.'
          : 'Low estrogen levels result in minimal cervical fluid.',
        tips: isTr ? [
          '🌿 Vücudun doğal döngüsünün bir parçasıdır, herhangi bir müdahaleye gerek yoktur',
          '🩲 Tahrişi önlemek için %100 pamuklu iç çamaşırı giyin',
          '💧 Vücut nem dengesi için günlük su tüketiminizi aksatmayın'
        ] : [
          'Completely natural, no intervention needed',
          'Wear 100% breathable cotton underwear',
          'Maintain regular hydration'
        ]
      },
      sticky: {
        title: isTr ? '💧 Yapışkan / Kıvamlı Akıntı' : 'Sticky Cervical Fluid',
        status: isTr ? 'Doğal Hormon Artışı (Normal)' : 'Normal Rising Estrogen',
        fertility: isTr ? 'Düşük - Orta Doğurganlık' : 'Low-Medium Fertility',
        statusClass: 'status-mild',
        when: isTr ? 'Regl bitiminden 2-4 gün sonra, yumurtlama hazırlığında görülür.' : 'Seen 2-4 days post-period as body preps for ovulation.',
        desc: isTr 
          ? 'Östrojenin yavaş yavaş yükselmesiyle oluşur. Parmaklar arasında çekildiğinde uzamaz, hafif yapışkan veya topaklıdır.'
          : 'Thick and tacky fluid as estrogen begins to rise. Does not stretch between fingers.',
        tips: isTr ? [
          '🌱 Vücudunuz yumurtlama penceresine doğru ilerliyor demektir',
          '🚿 Hijyen için sadece ılık suyla dış temizlik yeterlidir (vajinal duş yapmayın)',
          '✨ Günlük ped kullanarak konfor sağlayabilirsiniz'
        ] : [
          'Sign that your body is moving toward fertile window',
          'Clean externally with warm water only',
          'Use pantyliners for daily comfort'
        ]
      },
      creamy: {
        title: isTr ? '💧 Kremsi / Beyaz Akıntı' : 'Creamy White Fluid',
        status: isTr ? 'Kokusuz & Kaşıntısızsa Tamamen Normal' : 'Normal (if odorless/itch-free)',
        fertility: isTr ? 'Orta Doğurganlık' : 'Medium Fertility',
        statusClass: 'status-good',
        desc: isTr 
          ? 'Vücut losyonu veya krem kıvamında, beyazımsı veya açık sarı doğal akıntıdır. Vajinayı nemlendirir ve enfeksiyonlara karşı korur.'
          : 'Lotion-like consistency. Natural mechanism to moisturize and protect vaginal flora.',
        tips: isTr ? [
          '🌸 Vücudun doğal nemlendirme ve temizleme kalkanıdır',
          '🩲 Pamuklu iç çamaşırı tercih edin ve gerekirse günlük ped kullanın',
          '⚠️ UYARI: Eğer peynir kesiği gibi parçalı, yoğun kaşıntı, yanma ve kızarıklıkla seyrediyorsa bu normal akıntı değil, Mantar (Kandida) enfeksiyonu olabilir; hekime danışınız.'
        ] : [
          'Natural protective barrier for vaginal health',
          'Opt for breathable cotton underwear',
          'WARNING: If accompanied by itching, redness, or cottage-cheese texture, consult a doctor for possible yeast infection.'
        ]
      },
      eggWhite: {
        title: isTr ? '🌟 Yumurta Akı (Şeffaf & Esnek)' : 'Egg-White Fluid (Spinnbarkeit)',
        status: isTr ? 'Zirve Doğurganlık (En Sağlıklı Durum)' : 'Peak Fertility (Optimal Health)',
        fertility: isTr ? 'En Yüksek Doğurganlık (%90-95)' : 'Peak Fertility',
        statusClass: 'status-good',
        when: isTr ? 'Yumurtlama (Ovulasyon) gününde veya 1-2 gün öncesinde görülür.' : 'Occurs during or 1-2 days before ovulation.',
        desc: isTr 
          ? 'Östrojenin zirve yapmasıyla oluşan, çiğ yumurta akı gibi şeffaf, kaygan ve iki parmak arasında 5-10 cm kopmadan uzayan en doğurgan akıntıdır.'
          : 'Clear, slippery, and stretchy (up to 5-10cm). Optimal environment for sperm survival and fertilization.',
        tips: isTr ? [
          '👶 Gebe kalmak istiyorsanız: Bu gün ve sonraki 24 saat en yüksek başarı şansına sahipsiniz!',
          '🛡️ Korunmak istiyorsanız: Bu günlerde korunmasız birliktelikten mutlaka kaçınınız.',
          '✨ Hormonal sağlığınızın mükemmel çalıştığının en belirgin göstergesidir'
        ] : [
          'If trying to conceive: Optimal 24-48h window for pregnancy',
          'If avoiding pregnancy: Use strict barrier protection or abstain',
          'Sign of excellent hormonal and ovulatory function'
        ]
      },
      watery: {
        title: isTr ? '💧 Sulu / Şeffaf Akıntı' : 'Watery Fluid',
        status: isTr ? 'Yüksek Doğurganlık Dönemi (Normal)' : 'High Fertility (Normal)',
        fertility: isTr ? 'Yüksek Doğurganlık' : 'High Fertility',
        statusClass: 'status-good',
        when: isTr ? 'Yumurtlama öncesinde veya yumurta akı evresine geçerken görülür.' : 'Precedes or follows peak egg-white phase.',
        desc: isTr 
          ? 'Çamaşırda belirgin ıslaklık hissi bırakan, şeffaf, su gibi berrak ve kokusuz doğal salgıdır.'
          : 'Thin, clear, and water-like fluid leaving an obvious wet sensation.',
        tips: isTr ? [
          '🌱 Yumurtlamanın çok yakın olduğunu veya gerçekleştiğini gösterir',
          '🩲 Günlük pamuklu ped ile kuru ve rahat kalabilirsiniz',
          '💧 Sıvı dengenizi bol su içerek koruyun'
        ] : [
          'Indicates ovulation is imminent or occurring',
          'Use breathable pantyliners for dryness',
          'Maintain regular hydration'
        ]
      }
    };

    const item = data[discharge];
    if (!item) return '';

    return `
      <div class="pain-advice-card ${item.statusClass}" style="margin-top: 12px;">
        <div class="advice-header">
          <span class="advice-title">${item.title}</span>
          <span class="advice-status-badge">${item.status}</span>
        </div>
        <div class="advice-duration-tag">🎯 Doğurganlık Seviyesi: <strong>${item.fertility}</strong></div>
        ${item.when ? `<div style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 4px;">📅 <em>${item.when}</em></div>` : ''}
        <p class="advice-desc">${item.desc}</p>
        <div class="advice-tips-list">
          ${item.tips.map(t => `<div class="advice-tip-item"><span class="tip-bullet">•</span><span>${t}</span></div>`).join('')}
        </div>
      </div>
    `;
  },

  _renderWaterAdvice(count) {
    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    if (count <= 0) {
      return `
        <div class="pain-advice-card status-severe" style="margin-top: 12px;">
          <div class="advice-header">
            <span class="advice-title">${isTr ? '💧 Henüz Su Kaydı Yok' : '💧 No Water Logged'}</span>
            <span class="advice-status-badge">${isTr ? '0 Litre' : '0L'}</span>
          </div>
          <p class="advice-desc" style="margin-bottom: 0;">
            ${isTr 
              ? 'Günlük ortalama 8 bardak (yaklaşık 2 Litre) su içmek hormon dengesini korur ve regl kramplarını belirgin derecede hafifletir.' 
              : 'Drinking ~8 glasses (2L) of water daily supports hormone balance and eases menstrual cramps.'}
          </p>
        </div>
      `;
    }

    if (count <= 3) {
      return `
        <div class="pain-advice-card status-severe" style="margin-top: 12px;">
          <div class="advice-header">
            <span class="advice-title">${isTr ? '🔴 Yetersiz / Az Su Tüketimi' : '🔴 Low Hydration'}</span>
            <span class="advice-status-badge">${isTr ? 'Susuzluk Riski' : 'Low'}</span>
          </div>
          <p class="advice-desc" style="margin-bottom: 0;">
            ${isTr 
              ? `Vücudunuz susuz kalmış olabilir (${(count * 0.25).toFixed(1)}L). Yetersiz su tüketimi regl kramplarını, baş ağrısını, şişkinliği ve halsizliği tetikler. Lütfen birkaç bardak daha ılık su için.` 
              : `You might be dehydrated (${(count * 0.25).toFixed(1)}L). Low water intake can worsen menstrual cramps and fatigue. Try drinking 1-2 more glasses.`}
          </p>
        </div>
      `;
    }

    if (count <= 6) {
      return `
        <div class="pain-advice-card status-mod" style="margin-top: 12px;">
          <div class="advice-header">
            <span class="advice-title">${isTr ? '🟡 Orta Seviye Su Tüketimi' : '🟡 Moderate Hydration'}</span>
            <span class="advice-status-badge">${isTr ? 'Geliştirilebilir' : 'Good Progress'}</span>
          </div>
          <p class="advice-desc" style="margin-bottom: 0;">
            ${isTr 
              ? `İyi bir ilerleme (${(count * 0.25).toFixed(1)}L)! İdeal günlük hedef olan 8 bardağa (2 Litre) ulaşmak için günün geri kalanında 2-3 bardak daha su eklemeniz önerilir.` 
              : `Good progress (${(count * 0.25).toFixed(1)}L)! Try adding 2-3 more glasses to reach the optimal 8-glass (2L) target.`}
          </p>
        </div>
      `;
    }

    if (count <= 10) {
      return `
        <div class="pain-advice-card status-good" style="margin-top: 12px;">
          <div class="advice-header">
            <span class="advice-title">${isTr ? '🟢 Mükemmel / İdeal Su Seviyesi' : '🟢 Optimal Hydration'}</span>
            <span class="advice-status-badge">${isTr ? 'Hedefe Ulaşıldı' : 'Optimal'}</span>
          </div>
          <p class="advice-desc" style="margin-bottom: 0;">
            ${isTr 
              ? `Harika (${(count * 0.25).toFixed(1)}L)! Vücudunuzun günlük sıvı ihtiyacı tam karşılandı. Bu seviye ödemin atılmasına, cildin canlanmasına ve krampların hafiflemesine mükemmel destek sağlar.` 
              : `Excellent (${(count * 0.25).toFixed(1)}L)! Optimal hydration achieved, supporting pelvic comfort, digestion, and toxin flush.`}
          </p>
        </div>
      `;
    }

    // 11+ Bardak
    return `
      <div class="pain-advice-card status-good" style="margin-top: 12px;">
        <div class="advice-header">
          <span class="advice-title">${isTr ? '💧 Bol / Yüksek Su Tüketimi' : '💧 High Water Intake'}</span>
          <span class="advice-status-badge">${isTr ? 'Yüksek Hidrasyon' : 'High'}</span>
        </div>
        <p class="advice-desc" style="margin-bottom: 0;">
          ${isTr 
            ? `Çok bol su tükettiniz (${(count * 0.25).toFixed(1)}L)! Özellikle yoğun spor yapılan veya sıcak günlerde harika bir destektir. Minerallerinizi korumayı unutmayın.` 
            : `High intake (${(count * 0.25).toFixed(1)}L)! Great especially on active or hot days.`}
        </p>
      </div>
    `;
  },

  _renderOptionBtn(category, val, icon, label) {
    const isSelected = this.currentData[category] === val;
    return `
      <button type="button" class="symptom-option-btn ${isSelected ? 'active' : ''}" data-category="${category}" data-val="${val}">
        <span class="option-icon">${icon}</span>
        <span class="option-label">${label}</span>
      </button>
    `;
  },

  _renderOptionChip(category, val, label) {
    const isSelected = this.currentData[category] === val;
    return `
      <button type="button" class="symptom-chip-btn ${isSelected ? 'active' : ''}" data-category="${category}" data-val="${val}">
        ${label}
      </button>
    `;
  },

  _renderMultiChip(category, val, label) {
    const arr = this.currentData[category] || [];
    const isSelected = arr.includes(val);
    return `
      <button type="button" class="symptom-chip-btn multi ${isSelected ? 'active' : ''}" data-category="${category}" data-val="${val}">
        ${label}
      </button>
    `;
  },

  _renderCustomPresetChip(label) {
    const list = this.currentData.customSymptoms || [];
    const isSelected = list.includes(label);
    return `
      <button type="button" class="symptom-chip-btn custom-preset-chip ${isSelected ? 'active' : ''}" data-label="${label}">
        ${label}
      </button>
    `;
  },

  _renderCustomUserSymptomsList() {
    const list = this.currentData.customSymptoms || [];
    if (list.length === 0) return '';

    return `
      <div class="user-custom-chips-box" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">
        ${list.map(sym => `
          <span class="user-custom-tag" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(123, 143, 178, 0.15); border: 1px solid var(--accent-phase); border-radius: var(--radius-full); font-size: 0.8rem; font-weight: 600; color: var(--text-primary);">
            <span>${sym}</span>
            <button type="button" class="btn-remove-custom-sym" data-sym="${sym}" style="background: none; border: none; font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; padding: 0 2px;" aria-label="Kaldır">×</button>
          </span>
        `).join('')}
      </div>
    `;
  },

  _renderWaterGlasses() {
    let html = '';
    const current = this.currentData.water || 0;
    for (let i = 1; i <= 8; i++) {
      html += `
        <button type="button" class="water-glass-btn ${i <= current ? 'filled' : ''}" data-index="${i}" aria-label="${i}. bardak">
          💧
        </button>
      `;
    }
    return html;
  },

  attachEventListeners() {
    if (!this.container) return;

    this.container.querySelector('.prev-day')?.addEventListener('click', () => this.navigateDay(-1));
    this.container.querySelector('.next-day')?.addEventListener('click', () => this.navigateDay(1));
    this.container.querySelector('.go-today-btn')?.addEventListener('click', () => this.goToToday());
    this.container.querySelector('.save-symptoms-btn')?.addEventListener('click', () => this.saveData());

    // Tekli seçim butonları (Ruh Hali, Kanama, Ağrı Seviyesi, Akıntı, Uyku)
    this.container.querySelectorAll('.symptom-option-btn, .symptom-chip-btn:not(.multi):not(.custom-preset-chip)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.symptom-option-btn, .symptom-chip-btn');
        if (!targetBtn) return;
        const cat = targetBtn.getAttribute('data-category');
        const val = targetBtn.getAttribute('data-val');
        if (!cat || !val) return;

        if (this.currentData[cat] === val) {
          delete this.currentData[cat]; // Tekrar basarsa kaldır
        } else {
          this.currentData[cat] = val;
        }
        this.saveDataQuietly();
        this.refresh();
      });
    });

    // Çoklu seçim (Ağrı bölgeleri vb.)
    this.container.querySelectorAll('.symptom-chip-btn.multi').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.symptom-chip-btn.multi');
        if (!targetBtn) return;
        const cat = targetBtn.getAttribute('data-category');
        const val = targetBtn.getAttribute('data-val');
        if (!cat || !val) return;

        if (!Array.isArray(this.currentData[cat])) {
          this.currentData[cat] = [];
        }
        const idx = this.currentData[cat].indexOf(val);
        if (idx > -1) {
          this.currentData[cat].splice(idx, 1);
        } else {
          this.currentData[cat].push(val);
        }
        this.saveDataQuietly();
        this.refresh();
      });
    });

    // Hazır Özel Belirti Çipleri Tıklama
    this.container.querySelectorAll('.custom-preset-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.custom-preset-chip');
        if (!targetBtn) return;
        const label = targetBtn.getAttribute('data-label');
        if (!label) return;

        if (!Array.isArray(this.currentData.customSymptoms)) {
          this.currentData.customSymptoms = [];
        }
        const idx = this.currentData.customSymptoms.indexOf(label);
        if (idx > -1) {
          this.currentData.customSymptoms.splice(idx, 1);
        } else {
          this.currentData.customSymptoms.push(label);
        }
        this.saveDataQuietly();
        this.refresh();
      });
    });

    // Elle Yazılan Özel Belirti Ekleme
    const customInput = this.container.querySelector('.custom-symptom-input');
    const addCustomBtn = this.container.querySelector('.btn-add-custom-symptom');
    const handleAddCustom = () => {
      if (!customInput) return;
      const text = customInput.value.trim();
      if (!text) return;
      if (!Array.isArray(this.currentData.customSymptoms)) {
        this.currentData.customSymptoms = [];
      }
      if (!this.currentData.customSymptoms.includes(text)) {
        this.currentData.customSymptoms.push(text);
        this.saveDataQuietly();
      }
      this.refresh();
    };

    if (addCustomBtn) addCustomBtn.addEventListener('click', handleAddCustom);
    if (customInput) {
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleAddCustom();
        }
      });
    }

    // Özel Belirti Kaldırma
    this.container.querySelectorAll('.btn-remove-custom-sym').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.btn-remove-custom-sym');
        if (!targetBtn) return;
        const sym = targetBtn.getAttribute('data-sym');
        if (Array.isArray(this.currentData.customSymptoms)) {
          this.currentData.customSymptoms = this.currentData.customSymptoms.filter(s => s !== sym);
          this.saveDataQuietly();
          this.refresh();
        }
      });
    });

    // Su Ekleme / Çıkarma Butonları (Stepper)
    this.container.querySelector('.btn-water-minus')?.addEventListener('click', (e) => {
      const cur = parseInt(this.currentData.water || 0, 10);
      this.currentData.water = Math.max(0, cur - 1);
      this.saveDataQuietly();
      this.refresh();
    });

    this.container.querySelector('.btn-water-plus')?.addEventListener('click', (e) => {
      const cur = parseInt(this.currentData.water || 0, 10);
      this.currentData.water = Math.min(30, cur + 1);
      this.saveDataQuietly();
      this.refresh();
    });

    // Elle Su Bardak Sayısı Yazma Inputu
    const waterInput = this.container.querySelector('.water-num-input');
    if (waterInput) {
      waterInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 30) val = 30;
        this.currentData.water = val;
        this.saveDataQuietly();
        this.refresh();
      });
    }

    // Su bardakları (Dokunarak 1-8 seçme)
    this.container.querySelectorAll('.water-glass-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetBtn = e.target.closest('.water-glass-btn');
        if (!targetBtn) return;
        const idx = parseInt(targetBtn.getAttribute('data-index'), 10);
        if (this.currentData.water === idx) {
          this.currentData.water = idx - 1;
        } else {
          this.currentData.water = idx;
        }
        this.saveDataQuietly();
        this.refresh();
      });
    });

    // Lifestyle toggle'lar
    this.container.querySelectorAll('.lifestyle-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const key = e.target.getAttribute('data-key');
        this.currentData[key] = e.target.checked;
        this.saveDataQuietly();
      });
    });

    // Notlar
    const notesArea = this.container.querySelector('.symptom-notes-area');
    if (notesArea) {
      notesArea.addEventListener('input', (e) => {
        this.currentData.notes = e.target.value;
        this.saveDataQuietly();
      });
    }
  },

  destroy() {
    if (this.container) this.container.innerHTML = '';
    this.container = null;
  }
};
