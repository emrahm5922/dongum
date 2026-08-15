window.App = window.App || {};

window.App.Cycle = {
  // Phase constants
  PHASES: { MENSTRUAL: 'menstrual', FOLLICULAR: 'follicular', OVULATION: 'ovulation', LUTEAL: 'luteal' },
  
  // Luteal phase is medically considered to be a constant 14 days (±1-2 days) in most healthy adults.
  LUTEAL_PHASE_LENGTH: 14,
  
  // Core calculations
  predictNextPeriod(lastPeriodStart, avgCycleLength) {
    if (!lastPeriodStart || !avgCycleLength) return null;
    const start = window.App.Utils.parseDate(lastPeriodStart);
    return window.App.Utils.toISODateString(window.App.Utils.addDays(start, avgCycleLength));
  },
  
  calculateOvulationDay(nextPeriodStart) {
    if (!nextPeriodStart) return null;
    const nextPeriod = window.App.Utils.parseDate(nextPeriodStart);
    // Ovulation is roughly 14 days BEFORE the next period starts
    return window.App.Utils.toISODateString(window.App.Utils.addDays(nextPeriod, -this.LUTEAL_PHASE_LENGTH));
  },
  
  calculateFertileWindow(ovulationDay) {
    if (!ovulationDay) return null;
    const ovDate = window.App.Utils.parseDate(ovulationDay);
    
    // Doğurganlık Penceresi: Yumurtlamanın 3 gün öncesi ve 1 gün sonrası (5 günlük pencere)
    const start = window.App.Utils.toISODateString(window.App.Utils.addDays(ovDate, -3));
    const end = window.App.Utils.toISODateString(window.App.Utils.addDays(ovDate, 1));
    
    // Zirve doğurganlık: Yumurtlama günü ve 1-2 gün öncesi
    const peakStart = window.App.Utils.toISODateString(window.App.Utils.addDays(ovDate, -2));
    const peakEnd = ovulationDay;
    
    return { start, end, peakStart, peakEnd };
  },

  /**
   * Düzensiz Döngü (PCOS / Esnek Aralık) Analiz Motoru
   * Son döngülerdeki sapmayı hesaplar ve sabit bir gün yerine esnek tahmin penceresi sunar.
   */
  getIrregularCycleAnalysis(periods, defaultLength = 28) {
    if (!periods || periods.length < 3) {
      return { isIrregular: false, minDays: defaultLength, maxDays: defaultLength, avgDays: defaultLength, variance: 0 };
    }

    const recentPeriods = periods.slice(0, 8);
    let lengths = [];
    for (let i = 0; i < recentPeriods.length - 1; i++) {
      const currentStart = window.App.Utils.parseDate(recentPeriods[i].startDate);
      const prevStart = window.App.Utils.parseDate(recentPeriods[i + 1].startDate);
      const diff = window.App.Utils.diffDays(prevStart, currentStart);
      if (diff >= 15 && diff <= 55) {
        lengths.push(diff);
      }
    }

    if (lengths.length < 2) {
      return { isIrregular: false, minDays: defaultLength, maxDays: defaultLength, avgDays: defaultLength, variance: 0 };
    }

    const minDays = Math.min(...lengths);
    const maxDays = Math.max(...lengths);
    const avgDays = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
    const variance = maxDays - minDays;
    const isIrregular = variance >= 5;

    return { isIrregular, minDays, maxDays, avgDays, variance };
  },

  /**
   * Son 3 ila 6 döngünün hareketli ortalamasını hesaplar.
   * Yeterli geçmiş yoksa kullanıcının belirlediği veya varsayılan süreyi (28 gün) döner.
   */
  getEffectiveCycleLength(periods, defaultLength = 28) {
    if (!periods || periods.length < 2) return defaultLength || 28;

    const recentPeriods = periods.slice(0, 7);
    let lengths = [];

    for (let i = 0; i < recentPeriods.length - 1; i++) {
      const currentStart = window.App.Utils.parseDate(recentPeriods[i].startDate);
      const prevStart = window.App.Utils.parseDate(recentPeriods[i + 1].startDate);
      const diff = window.App.Utils.diffDays(prevStart, currentStart);
      if (diff >= 18 && diff <= 45) {
        lengths.push(diff);
      }
    }

    if (lengths.length === 0) return defaultLength || 28;

    const sum = lengths.reduce((a, b) => a + b, 0);
    return Math.round(sum / lengths.length);
  },
  
  getCurrentCycleDay(lastPeriodStart) {
    if (!lastPeriodStart) return 0;
    const start = window.App.Utils.parseDate(lastPeriodStart);
    const today = new Date();
    const diff = window.App.Utils.diffDays(start, today);
    return diff >= 0 ? diff + 1 : 0;
  },
  
  getCurrentPhase(cycleDay, avgPeriodLength, avgCycleLength) {
    if (cycleDay <= 0) return null;
    
    // Calculate ovulation day as cycle day number
    const ovulationCycleDay = avgCycleLength - this.LUTEAL_PHASE_LENGTH;
    
    let phase = '';
    let description = '';
    
    if (cycleDay <= avgPeriodLength) {
      phase = this.PHASES.MENSTRUAL;
      description = window.App.I18n.t('phase.menstrual.desc');
    } else if (cycleDay < ovulationCycleDay - 1) {
      phase = this.PHASES.FOLLICULAR;
      description = window.App.I18n.t('phase.follicular.desc');
    } else if (cycleDay >= ovulationCycleDay - 1 && cycleDay <= ovulationCycleDay + 1) {
      phase = this.PHASES.OVULATION;
      description = window.App.I18n.t('phase.ovulation.desc');
    } else {
      phase = this.PHASES.LUTEAL;
      description = window.App.I18n.t('phase.luteal.desc');
    }
    
    return { phase, description };
  },
  
  getFertilityStatus(cycleDay, avgCycleLength) {
    const ovulationCycleDay = avgCycleLength - this.LUTEAL_PHASE_LENGTH;
    
    if (cycleDay >= ovulationCycleDay - 2 && cycleDay <= ovulationCycleDay) {
      return { level: 'peak', percentage: 95, description: window.App.I18n.t('dashboard.fertility.peak') };
    } else if (cycleDay >= ovulationCycleDay - 5 && cycleDay <= ovulationCycleDay + 1) {
      return { level: 'high', percentage: 70, description: window.App.I18n.t('dashboard.fertility.high') };
    } else if (cycleDay >= ovulationCycleDay - 7 && cycleDay <= ovulationCycleDay - 6) {
      return { level: 'medium', percentage: 30, description: window.App.I18n.t('dashboard.fertility.medium') };
    }
    return { level: 'low', percentage: 5, description: window.App.I18n.t('dashboard.fertility.low') };
  },
  
  getPregnancyProbability(cycleDay, avgCycleLength) {
    const status = this.getFertilityStatus(cycleDay, avgCycleLength);
    return status.percentage;
  },
  
  // Prediction accuracy improvement
  calculateAverageCycleLength(periods) {
    if (!periods || periods.length < 2) {
      return { average: 28, shortest: 28, longest: 28, stdDeviation: 0, count: periods ? periods.length : 0 };
    }
    
    // Sort periods descending by startDate
    const sorted = [...periods].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    let lengths = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentStart = window.App.Utils.parseDate(sorted[i].startDate);
      const prevStart = window.App.Utils.parseDate(sorted[i + 1].startDate);
      const diff = window.App.Utils.diffDays(prevStart, currentStart);
      // Sadece tıbbi olarak mantıklı aralıktaki (18 - 45 gün) döngü farklarını al
      if (diff >= 18 && diff <= 55) {
        lengths.push(diff);
      }
    }

    if (lengths.length === 0) {
      return { average: 28, shortest: 28, longest: 28, stdDeviation: 0, count: periods.length };
    }
    
    const sum = lengths.reduce((a, b) => a + b, 0);
    const average = Math.round(sum / lengths.length);
    const shortest = Math.min(...lengths);
    const longest = Math.max(...lengths);
    
    // Standart sapma
    const squareDiffs = lengths.map(val => Math.pow(val - average, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / lengths.length;
    const stdDeviation = Math.sqrt(avgSquareDiff);
    
    return { average, shortest, longest, stdDeviation, count: lengths.length };
  },
  
  calculateAveragePeriodLength(periods) {
    if (!periods || periods.length === 0) return 5;
    
    let validLengths = periods.filter(p => p.days && p.days.length > 0).map(p => p.days.length);
    if (validLengths.length === 0) return 5;
    
    const sum = validLengths.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / validLengths.length);
    return Math.max(2, Math.min(10, avg));
  },
  
  getCycleRegularity(periods) {
    const stats = this.calculateAverageCycleLength(periods);
    
    // Yeterli geçmiş yoksa varsayılan yüksek düzenlilik
    if (!periods || periods.length < 2 || stats.count === 0) {
      return { score: 95, label: window.App.I18n ? window.App.I18n.t('stats.regular') : 'Düzenli' };
    }

    // Standart sapmaya göre dinamik 0-100 puanı
    // stdDeviation 0 ise 100%, 2 ise ~88%, 4 ise ~76%, 8 ise ~52%
    let score = Math.round(100 - (stats.stdDeviation * 6));
    score = Math.max(30, Math.min(100, score));

    let label = 'Düzenli';
    if (score >= 80) {
      label = window.App.I18n ? window.App.I18n.t('stats.regular') : 'Düzenli';
    } else if (score >= 55) {
      label = window.App.I18n ? (window.App.I18n.t('stats.somewhatIrregular') || 'Hafif Değişken') : 'Hafif Değişken';
    } else {
      label = window.App.I18n ? window.App.I18n.t('stats.irregular') : 'Düzensiz';
    }

    return { score, label };
  },
  
  // Period status
  isPeriodLate(lastPeriodStart, avgCycleLength) {
    if (!lastPeriodStart) return { isLate: false, daysLate: 0 };
    
    const nextPredicted = window.App.Utils.parseDate(this.predictNextPeriod(lastPeriodStart, avgCycleLength));
    const today = new Date();
    
    const diff = window.App.Utils.diffDays(nextPredicted, today);
    
    if (diff > 0) {
      return { isLate: true, daysLate: diff };
    }
    return { isLate: false, daysLate: 0 };
  },
  
  getDaysUntilNextPeriod(lastPeriodStart, avgCycleLength) {
    if (!lastPeriodStart) return 0;
    
    const nextPredicted = window.App.Utils.parseDate(this.predictNextPeriod(lastPeriodStart, avgCycleLength));
    const today = new Date();
    
    return window.App.Utils.diffDays(today, nextPredicted);
  },
  
  // Date classification for calendar
  classifyDate(dateStr, periods, avgCycleLength, avgPeriodLength) {
    let result = {
      isPeriod: false, isPredictedPeriod: false, isOvulation: false,
      isFertile: false, isPeakFertile: false, phase: '', isToday: window.App.Utils ? window.App.Utils.isToday(window.App.Utils.parseDate(dateStr)) : false
    };

    if (!periods) {
      periods = (window.App.Data && typeof window.App.Data.getAllPeriods === 'function') 
        ? window.App.Data.getAllPeriods() 
        : [];
    }
    if (!avgCycleLength) {
      avgCycleLength = (window.App.Data && typeof window.App.Data.get === 'function')
        ? (window.App.Data.get('settings.avgCycleLength') || 28)
        : 28;
    }
    if (!avgPeriodLength) {
      avgPeriodLength = (window.App.Data && typeof window.App.Data.get === 'function')
        ? (window.App.Data.get('settings.avgPeriodLength') || 5)
        : 5;
    }
    
    // Check if recorded period
    if (Array.isArray(periods)) {
      const recordedPeriod = periods.find(p => p.days && p.days.includes(dateStr));
      if (recordedPeriod) {
        result.isPeriod = true;
        result.phase = this.PHASES.MENSTRUAL;
        return result; // Don't override with predictions if recorded
      }
    }
    
    if (!periods || periods.length === 0) return result;
    
    // Predictions based on last period
    const lastPeriod = periods[0].startDate;
    const effectiveCycle = this.getEffectiveCycleLength ? this.getEffectiveCycleLength(periods, avgCycleLength) : avgCycleLength;
    const nextPeriodStart = this.predictNextPeriod(lastPeriod, effectiveCycle);
    const ovulationDay = this.calculateOvulationDay(nextPeriodStart);
    const fertileWin = this.calculateFertileWindow(ovulationDay);
    
    const dateObj = window.App.Utils.parseDate(dateStr);
    const nextPeriodDate = window.App.Utils.parseDate(nextPeriodStart);
    
    // Is predicted period?
    const diffToNext = window.App.Utils.diffDays(nextPeriodDate, dateObj);
    if (diffToNext >= 0 && diffToNext < avgPeriodLength) {
      result.isPredictedPeriod = true;
      result.phase = this.PHASES.MENSTRUAL;
    }
    
    if (dateStr === ovulationDay) result.isOvulation = true;
    
    if (fertileWin && dateStr >= fertileWin.start && dateStr <= fertileWin.end) {
      result.isFertile = true;
    }
    if (fertileWin && dateStr >= fertileWin.peakStart && dateStr <= fertileWin.peakEnd) {
      result.isPeakFertile = true;
    }
    
    return result;
  },
  
  getMonthPredictions(year, month, lastPeriodStart, avgCycleLength, avgPeriodLength) {
    const daysInMonth = window.App.Utils.getDaysInMonth(year, month);
    let predictions = [];
    
    // Mock periods array for classifyDate
    const periods = lastPeriodStart ? [{ startDate: lastPeriodStart, days: [lastPeriodStart] }] : [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = window.App.Utils.toISODateString(new Date(year, month, day));
      predictions.push({
        date: dateStr,
        classification: this.classifyDate(dateStr, periods, avgCycleLength, avgPeriodLength)
      });
    }
    return predictions;
  },
  
  getCycleInfo() {
    if (!window.App.Data) return null;
    const settings = window.App.Data.get('settings') || {};
    const periods = window.App.Data.getAllPeriods ? window.App.Data.getAllPeriods() : [];
    
    if (!settings.lastPeriodStart && periods.length === 0) return null;
    
    const lastPeriodStart = settings.lastPeriodStart || (periods[0] ? periods[0].startDate : null);
    if (!lastPeriodStart) return null;

    // Son 3-6 döngünün hareketli ortalamasını ve düzensizlik analizini hesapla
    const effectiveCycleLength = this.getEffectiveCycleLength(periods, settings.avgCycleLength || 28);
    const irregularAnalysis = this.getIrregularCycleAnalysis(periods, settings.avgCycleLength || 28);
    const isIrregular = settings.isIrregularCycle || irregularAnalysis.isIrregular;
    const avgPeriodLength = settings.avgPeriodLength || 5;

    const cycleDay = this.getCurrentCycleDay(lastPeriodStart);
    const nextPeriod = this.predictNextPeriod(lastPeriodStart, effectiveCycleLength);
    const daysUntilPeriod = this.getDaysUntilNextPeriod(lastPeriodStart, effectiveCycleLength);
    const lateStatus = this.isPeriodLate(lastPeriodStart, effectiveCycleLength);
    
    const ovulationDay = this.calculateOvulationDay(nextPeriod);
    const fertileWindow = this.calculateFertileWindow(ovulationDay);
    
    const phaseInfo = this.getCurrentPhase(cycleDay, avgPeriodLength, effectiveCycleLength);
    const fertility = this.getFertilityStatus(cycleDay, effectiveCycleLength);
    const pregnancyProb = this.getPregnancyProbability(cycleDay, effectiveCycleLength);
    
    let progress = (cycleDay / effectiveCycleLength) * 100;
    progress = window.App.Utils.clamp(progress, 0, 100);
    
    return {
      cycleDay,
      totalDays: effectiveCycleLength,
      phase: phaseInfo || { phase: '', description: '' },
      fertility,
      nextPeriod,
      daysUntilPeriod,
      isLate: lateStatus.isLate,
      daysLate: lateStatus.daysLate,
      ovulationDay,
      fertileWindow,
      pregnancyProbability: pregnancyProb,
      progressPercentage: progress,
      isIrregular,
      irregularAnalysis
    };
  },
  
  detectOvulationFromTemp(temperatures) {
    // Basic thermal shift detection. Needs at least 6 low temps followed by 3 high temps.
    // Shift is typically 0.2 - 0.5 °C.
    const dates = Object.keys(temperatures).sort();
    if (dates.length < 9) return null;
    
    for (let i = 6; i < dates.length - 2; i++) {
      const lows = dates.slice(i-6, i).map(d => temperatures[d]);
      const highs = dates.slice(i, i+3).map(d => temperatures[d]);
      
      const maxLow = Math.max(...lows);
      const minHigh = Math.min(...highs);
      
      if (minHigh >= maxLow + 0.2) {
        return dates[i-1]; // Day before the shift is ovulation day
      }
    }
    return null;
  }
};
