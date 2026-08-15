window.App = window.App || {};

/**
 * Kadın Sağlığı, Şifalı Bitkiler ve Beslenme Rehberi Modülü (Herbal & Nutrition Guide)
 * Bilimsel araştırmalara dayalı adet sancısı, PMS, doğurganlık ve şişkinlik bitkisel destek rehberi.
 */
window.App.Herbal = {
  remedies: [
    {
      id: 'chamomile_ginger',
      name: '🍵 Papatya & Zencefil Çayı',
      tag: 'Kramp & Ağrı Kesici',
      color: '#D4556B',
      benefits: 'Zencefil, ibuprofen kadar etkili bir doğal prostaglandin (ağrı hormonu) inhibitörüdür. Papatyadaki glisin maddesi rahim kasılmalarını ve spazmları gevşetir.',
      prep: '1 tatlı kaşığı kurutulmuş papatya ve 2-3 ince dilim taze zencefili 1 bardak kaynar suda 8-10 dakika demleyin. Günde 2 fincan tüketebilirsiniz.',
      timing: 'Regl başlamadan 2 gün önce ve ilk 2 gününde etkilidir.'
    },
    {
      id: 'chasteberry',
      name: '🌸 Hayıt Tohumu (Vitex Agnus-Castus)',
      tag: 'Hormon Dengeleyici & PCOS',
      color: '#9A62C6',
      benefits: 'Hipofiz bezini uyararak progesteron üretimini artırır. Düzensiz adet döngülerini, göğüs hassasiyetini ve PMS sinirliliğini hafifletir.',
      prep: 'Yarım tatlı kaşığı hafif ezilmiş hayıt tohumunu 1 bardak kaynar suda 10 dakika demleyin. (Düzenli kullanım gerektirir).',
      timing: 'Sabahları aç karnına, döngünün 2. yarısında veya sürekli.'
    },
    {
      id: 'yarrow_sage',
      name: '🌿 Civanperçemi & Adaçayı',
      tag: 'Rahim Rahatlatıcı & Ödem',
      color: '#448A5E',
      benefits: 'Pelvik bölgedeki kan dolaşımını düzenler, aşırı sancılı kasılmaları yatıştırır ve vücuttaki ödemi atar.',
      prep: '1 tatlı kaşığı civanperçemi çiçeğini kaynar suda 5-7 dakika demleyin. Acılaşmaması için süzüp ılık için.',
      timing: 'Adet döneminin ilk 3 gününde günde 1 fincan.'
    },
    {
      id: 'magnesium_foods',
      name: '🥑 Magnezyum & B6 Vitamini Besinleri',
      tag: 'Tatlı Krizi & Şişkinlik',
      color: '#EA6036',
      benefits: 'Magnezyum rahim kaslarını gevşetir ve serotonin seviyesini koruyarak tatlı krizlerini engeller.',
      prep: 'Bitter çikolata (%70+), kabak çekirdeği, avokado, muz ve çiğ badem tüketimi.',
      timing: 'Luteal fazda (adete 7 gün kala).'
    },
    {
      id: 'iron_vitamin_c',
      name: '🥩 Demir & C Vitamini Kombinasyonu',
      tag: 'Halsizlik & Kan Yapıcı',
      color: '#c23820',
      benefits: 'Kanama günlerinde azalan hemoglobin seviyesini hızla toparlar, adet yorgunluğunu ve baş dönmesini önler.',
      prep: 'Ispanak veya mercimek üzerine limon sıkılarak tüketilmeli; demir emilimi 3 katına çıkar.',
      timing: 'Yoğun kanama günlerinde.'
    }
  ],

  /**
   * Şifalı Bitkiler ve Beslenme Rehberi Modalı
   */
  showHerbalModal() {
    const modalBody = document.getElementById('modal-body');
    if (!modalBody) return;

    const cardsHtml = this.remedies.map(r => `
      <div style="background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 14px; margin-bottom: 10px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin: 0;">${r.name}</h4>
          <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); background: rgba(212, 85, 107, 0.1); color: ${r.color};">
            ${r.tag}
          </span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-primary); line-height: 1.45; margin: 0 0 6px 0;">
          ${r.benefits}
        </p>
        <div style="background: var(--bg-secondary); padding: 8px 10px; border-radius: var(--radius-md); font-size: 0.78rem; color: var(--text-secondary); line-height: 1.4;">
          <strong>☕ Nasıl Hazırlanır:</strong> ${r.prep}<br>
          <strong>⏰ İdeal Zamanlama:</strong> ${r.timing}
        </div>
      </div>
    `).join('');

    modalBody.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px; max-height: 72vh; overflow-y: auto; padding-right: 4px;">
        <div style="background: var(--bg-secondary); border: 1px solid var(--border); padding: 8px 12px; border-radius: var(--radius-md); font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">
          🌿 <em>Fitoterapi & Doğal Beslenme: Bu bilgiler bilimsel literatürdeki klinik çalışmalara dayanır. Kronik rahatsızlığınız veya ilaç kullanımınız varsa doktorunuza danışınız.</em>
        </div>

        ${cardsHtml}

        <button type="button" class="btn btn-primary btn-block" id="btn-close-herbal-modal" style="margin-top: 4px; padding: 12px; font-weight: 700;">
          Kapat ✨
        </button>
      </div>
    `;

    modalBody.querySelector('#btn-close-herbal-modal')?.addEventListener('click', () => {
      if (typeof window.hideModal === 'function') window.hideModal();
      else if (window.App && typeof window.App.hideModal === 'function') window.App.hideModal();
      else if (window.App && window.App.Main && typeof window.App.Main.hideModal === 'function') window.App.Main.hideModal();
    });

    if (typeof window.showModal === 'function') {
      window.showModal('🌿 Şifalı Bitkiler & Öz-Bakım Kütüphanesi');
    } else if (window.App && typeof window.App.showModal === 'function') {
      window.App.showModal('🌿 Şifalı Bitkiler & Öz-Bakım Kütüphanesi');
    } else if (window.App && window.App.Main && typeof window.App.Main.showModal === 'function') {
      window.App.Main.showModal('🌿 Şifalı Bitkiler & Öz-Bakım Kütüphanesi');
    }
  }
};
