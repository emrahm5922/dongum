window.App = window.App || {};

window.App.Data = {
  STORAGE_KEY: 'dongum_app_data',
  
  defaultData: {
    settings: {
      avgCycleLength: 28,
      avgPeriodLength: 5,
      lastPeriodStart: null,
      pinHash: null,
      pinEnabled: false,
      darkMode: false,
      language: 'tr',
      onboardingComplete: false,
      notifications: {
        periodReminder: true,
        ovulationReminder: true,
        dailySymptom: true,
        medicationReminder: true,
        reminderTime: '20:00'
      }
    },
    periods: [],
    symptoms: {},
    temperatures: {},
    medications: []
  },
  
  _data: null,

  // --- Methods ---
  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this._data = this._mergeDeep({}, this.defaultData, parsed);
      } else {
        this._data = this._mergeDeep({}, this.defaultData);
      }
    } catch (e) {
      console.error('Data load error', e);
      this._data = this._mergeDeep({}, this.defaultData);
    }
    return this._data;
  },

  save(data = null) {
    if (data) {
      this._data = data;
    }
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._data));
      return true;
    } catch (e) {
      console.error('Data save error', e);
      return false;
    }
  },

  get(path) {
    if (!this._data) this.load();
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : undefined), this._data);
  },

  set(path, value) {
    if (!this._data) this.load();
    const parts = path.split('.');
    const last = parts.pop();
    const target = parts.reduce((obj, key) => {
      if (obj[key] === undefined) obj[key] = {};
      return obj[key];
    }, this._data);
    target[last] = value;
    this.save();
  },

  _mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this._isObject(target) && this._isObject(source)) {
      for (const key in source) {
        if (this._isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this._mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    return this._mergeDeep(target, ...sources);
  },

  _isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  },
  
  // --- Period methods ---
  addPeriod(startDate) {
    if (!this._data) this.load();
    const period = {
      id: window.App.Utils.generateId(),
      startDate: startDate,
      endDate: null,
      days: [startDate]
    };
    this._data.periods.push(period);
    
    // Sort periods by start date
    this._data.periods.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    this.set('settings.lastPeriodStart', this._data.periods[0].startDate);
    
    this.save();
    return period;
  },

  endPeriod(periodId, endDate) {
    if (!this._data) this.load();
    const period = this._data.periods.find(p => p.id === periodId);
    if (period) {
      period.endDate = endDate;
      
      // Update days array
      let current = window.App.Utils.parseDate(period.startDate);
      const end = window.App.Utils.parseDate(endDate);
      period.days = [];
      
      while (current <= end) {
        period.days.push(window.App.Utils.toISODateString(current));
        current = window.App.Utils.addDays(current, 1);
      }
      
      this.save();
      return true;
    }
    return false;
  },

  togglePeriodDay(dateStr) {
    if (!this._data) this.load();
    
    // Find if it belongs to an existing period
    const existingPeriod = this.getPeriodForDate(dateStr);
    
    if (existingPeriod) {
      // Remove day
      existingPeriod.days = existingPeriod.days.filter(d => d !== dateStr);
      if (existingPeriod.days.length === 0) {
        this.deletePeriod(existingPeriod.id);
      } else {
        // Recalculate start and end
        existingPeriod.days.sort();
        existingPeriod.startDate = existingPeriod.days[0];
        existingPeriod.endDate = existingPeriod.days[existingPeriod.days.length - 1];
        this.save();
      }
    } else {
      // Find adjacent periods to merge, or create new
      const d = window.App.Utils.parseDate(dateStr);
      const prevDay = window.App.Utils.toISODateString(window.App.Utils.addDays(d, -1));
      const nextDay = window.App.Utils.toISODateString(window.App.Utils.addDays(d, 1));
      
      const prevPeriod = this.getPeriodForDate(prevDay);
      const nextPeriod = this.getPeriodForDate(nextDay);
      
      if (prevPeriod && nextPeriod && prevPeriod.id !== nextPeriod.id) {
        // Merge them
        prevPeriod.days = [...new Set([...prevPeriod.days, dateStr, ...nextPeriod.days])].sort();
        prevPeriod.endDate = nextPeriod.endDate;
        this.deletePeriod(nextPeriod.id); // delete next, save happens inside
        this.save();
      } else if (prevPeriod) {
        prevPeriod.days.push(dateStr);
        prevPeriod.days.sort();
        prevPeriod.endDate = prevPeriod.days[prevPeriod.days.length - 1];
        this.save();
      } else if (nextPeriod) {
        nextPeriod.days.push(dateStr);
        nextPeriod.days.sort();
        nextPeriod.startDate = nextPeriod.days[0];
        this.save();
      } else {
        // Create new
        this.addPeriod(dateStr);
      }
    }
  },

  togglePeriod(dateStr) {
    return this.togglePeriodDay(dateStr);
  },

  getPeriodForDate(dateStr) {
    if (!this._data) this.load();
    return this._data.periods.find(p => p.days.includes(dateStr)) || null;
  },

  getAllPeriods() {
    if (!this._data) this.load();
    return this._data.periods;
  },

  getLastPeriod() {
    if (!this._data) this.load();
    if (this._data.periods.length === 0) return null;
    return this._data.periods[0]; // Assuming sorted desc
  },

  deletePeriod(periodId) {
    if (!this._data) this.load();
    this._data.periods = this._data.periods.filter(p => p.id !== periodId);
    if (this._data.periods.length > 0) {
      this.set('settings.lastPeriodStart', this._data.periods[0].startDate);
    } else {
      this.set('settings.lastPeriodStart', null);
    }
    this.save();
  },
  
  // --- Symptom methods ---
  saveSymptoms(dateStr, symptoms) {
    if (!this._data) this.load();
    this._data.symptoms[dateStr] = { ...symptoms };
    this.save();

    // Reaktif güncelleme bildirimi tetikle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:symptoms-updated', { detail: { date: dateStr, symptoms } }));
    }
  },

  getSymptoms(dateStr) {
    if (!this._data) this.load();
    return this._data.symptoms[dateStr] || null;
  },

  getSymptomsRange(startDate, endDate) {
    if (!this._data) this.load();
    const result = {};
    let current = window.App.Utils.parseDate(startDate);
    const end = window.App.Utils.parseDate(endDate);
    
    while (current <= end) {
      const dateStr = window.App.Utils.toISODateString(current);
      if (this._data.symptoms[dateStr]) {
        result[dateStr] = this._data.symptoms[dateStr];
      }
      current = window.App.Utils.addDays(current, 1);
    }
    return result;
  },
  
  // --- Temperature methods ---
  saveTemperature(dateStr, temp) {
    if (!this._data) this.load();
    this._data.temperatures[dateStr] = temp;
    this.save();
  },

  getTemperature(dateStr) {
    if (!this._data) this.load();
    return this._data.temperatures[dateStr] || null;
  },

  getTemperaturesRange(startDate, endDate) {
    if (!this._data) this.load();
    const result = {};
    let current = window.App.Utils.parseDate(startDate);
    const end = window.App.Utils.parseDate(endDate);
    
    while (current <= end) {
      const dateStr = window.App.Utils.toISODateString(current);
      if (this._data.temperatures[dateStr]) {
        result[dateStr] = this._data.temperatures[dateStr];
      }
      current = window.App.Utils.addDays(current, 1);
    }
    return result;
  },
  
  // --- Medication methods ---
  addMedication(med) {
    if (!this._data) this.load();
    med.id = window.App.Utils.generateId();
    this._data.medications.push(med);
    this.save();
    return med;
  },

  updateMedication(id, med) {
    if (!this._data) this.load();
    const index = this._data.medications.findIndex(m => m.id === id);
    if (index !== -1) {
      this._data.medications[index] = { ...this._data.medications[index], ...med };
      this.save();
      return true;
    }
    return false;
  },

  deleteMedication(id) {
    if (!this._data) this.load();
    this._data.medications = this._data.medications.filter(m => m.id !== id);
    this.save();
  },

  getMedications() {
    if (!this._data) this.load();
    return this._data.medications;
  },
  
  // --- Export ---
  exportAll() {
    if (!this._data) this.load();
    return JSON.stringify(this._data, null, 2);
  },

  importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data && data.settings) {
        this._data = data;
        this.save();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  },

  deleteAll() {
    if (confirm(window.App.I18n.t('settings.deleteConfirmation'))) {
      localStorage.removeItem(this.STORAGE_KEY);
      this._data = null;
      this.load();
      return true;
    }
    return false;
  },
  
  // --- Computed helpers ---
  isOnboardingComplete() {
    return this.get('settings.onboardingComplete') === true;
  },

  getRecordedCycleCount() {
    if (!this._data) this.load();
    return this._data.periods.length;
  },

  isFirstUse() {
    return !localStorage.getItem(this.STORAGE_KEY);
  }
};
