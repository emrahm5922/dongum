window.App = window.App || {};

/**
 * İlaç Hatırlatma Modülü (Medication Module)
 * Doğum kontrol hapı, vitamin, ağrı kesici ve takviyelerin takibi ve hatırlatılmasını sağlar.
 */
window.App.Medication = {
  getMedications() {
    if (window.App.Data && typeof window.App.Data.getMedications === 'function') {
      return window.App.Data.getMedications();
    }
    try {
      return JSON.parse(localStorage.getItem('dongum_user_meds') || '[]');
    } catch {
      return [];
    }
  },

  render(container) {
    if (!container) return;
    const meds = this.getMedications();
    const t = (key, fallback) => (window.App.I18n ? window.App.I18n.t(key) : fallback);

    let html = `
      <div class="medications-wrapper">
    `;

    if (meds.length === 0) {
      html += `
        <div class="med-empty-state">
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px;">
            ${App.I18n.getLang() === 'tr' ? 'Henüz kayıtlı bir ilaç veya takviye yok.' : 'No medications or supplements registered yet.'}
          </p>
        </div>
      `;
    } else {
      html += `<div class="meds-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">`;
      meds.forEach(med => {
        html += `
          <div class="med-item-card" data-id="${med.id}" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-secondary); padding: 10px 14px; border-radius: var(--radius-lg); border: 1px solid var(--border);">
            <div class="med-item-info">
              <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${med.name}</span>
              <span style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">⏰ ${med.time || '09:00'}</span>
            </div>
            <div class="med-item-actions" style="display: flex; align-items: center; gap: 10px;">
              <button type="button" class="btn-icon med-delete-btn" style="color: var(--danger); font-size: 0.9rem;" title="Sil">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Silme butonlarını bağla
    container.querySelectorAll('.med-item-card').forEach(card => {
      const id = card.getAttribute('data-id');
      card.querySelector('.med-delete-btn')?.addEventListener('click', () => {
        this.deleteMedication(id);
        this.render(container);
        if (window.App.Utils && window.App.Utils.showToast) {
          window.App.Utils.showToast(t('general.success', 'İlaç silindi'), 'info');
        }
      });
    });
  },

  renderAddForm(modalBody) {
    if (!modalBody) return;
    const isTr = window.App.I18n ? (window.App.I18n.getLang() === 'tr') : true;

    const suggestions = isTr ? [
      'Doğum Kontrol Hapı',
      'Ağrı Kesici',
      'Folik Asit',
      'Demir Takviyesi',
      'B12 Vitamini',
      'D Vitamini',
      'Magnezyum'
    ] : [
      'Birth Control Pill',
      'Pain Reliever',
      'Folic Acid',
      'Iron Supplement',
      'Vitamin B12',
      'Vitamin D',
      'Magnesium'
    ];

    modalBody.innerHTML = `
      <div class="med-modal-form" style="display: flex; flex-direction: column; gap: 14px;">
        <div class="form-group">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
            ${isTr ? 'İlaç / Takviye Adı' : 'Medication Name'}
          </label>
          <input type="text" id="modal-med-name" class="form-input" list="med-suggestions-list" placeholder="${isTr ? 'Örn: Doğum Kontrol Hapı' : 'e.g. Birth Control'}" required>
          <datalist id="med-suggestions-list">
            ${suggestions.map(s => `<option value="${s}">`).join('')}
          </datalist>
        </div>

        <div class="form-group">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">
            ${isTr ? 'Hatırlatma Saati' : 'Reminder Time'}
          </label>
          <input type="time" id="modal-med-time" class="form-input" value="09:00" required>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
          <button type="button" class="btn btn-secondary" id="modal-med-cancel">${isTr ? 'İptal' : 'Cancel'}</button>
          <button type="button" class="btn btn-primary" id="modal-med-save">${isTr ? 'Kaydet' : 'Save'}</button>
        </div>
      </div>
    `;

    modalBody.querySelector('#modal-med-cancel')?.addEventListener('click', () => {
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop) backdrop.style.display = 'none';
    });

    modalBody.querySelector('#modal-med-save')?.addEventListener('click', () => {
      const nameInput = modalBody.querySelector('#modal-med-name');
      const timeInput = modalBody.querySelector('#modal-med-time');

      const name = nameInput ? nameInput.value.trim() : '';
      const time = timeInput ? timeInput.value : '09:00';

      if (!name) {
        if (window.App.Utils && window.App.Utils.showToast) {
          window.App.Utils.showToast(isTr ? 'Lütfen ilaç adını girin' : 'Please enter medication name', 'warning');
        }
        return;
      }

      this.addMedication(name, time);

      // Modalı kapat
      const backdrop = document.getElementById('modal-backdrop');
      if (backdrop) backdrop.style.display = 'none';

      // Ayarlar sayfasındaki listeyi güncelle
      const listEl = document.getElementById('settings-medications-list');
      if (listEl) this.render(listEl);

      if (window.App.Utils && window.App.Utils.showToast) {
        window.App.Utils.showToast(isTr ? 'İlaç eklendi 💊' : 'Medication added 💊', 'success');
      }
    });
  },

  addMedication(name, time) {
    const newMed = {
      id: Date.now().toString(),
      name,
      time: time || '09:00',
      active: true
    };

    if (window.App.Data && typeof window.App.Data.addMedication === 'function') {
      window.App.Data.addMedication(newMed);
    } else {
      const meds = this.getMedications();
      meds.push(newMed);
      localStorage.setItem('dongum_user_meds', JSON.stringify(meds));
    }

    if (window.App.Notifications && typeof window.App.Notifications.scheduleAll === 'function') {
      window.App.Notifications.scheduleAll();
    }
  },

  deleteMedication(id) {
    if (window.App.Data && typeof window.App.Data.deleteMedication === 'function') {
      window.App.Data.deleteMedication(id);
    } else {
      let meds = this.getMedications();
      meds = meds.filter(m => m.id !== id);
      localStorage.setItem('dongum_user_meds', JSON.stringify(meds));
    }
  },

  destroy() {}
};
