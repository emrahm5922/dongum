window.App = window.App || {};

window.App.Utils = {
  // --- Date helpers ---
  formatDate(date, format) {
    if (!date) return '';
    const d = typeof date === 'string' ? this.parseDate(date) : date;
    const day = d.getDate();
    const month = d.getMonth();
    const year = d.getFullYear();

    const shortMonthsTr = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
    const longMonthsTr = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    
    const shortMonthsEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const longMonthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const isTr = (window.App.I18n && window.App.I18n.getLang() === 'tr');
    
    if (format === 'short') {
      const monthStr = isTr ? shortMonthsTr[month] : shortMonthsEn[month];
      return `${day} ${monthStr}`;
    } else if (format === 'long') {
      const monthStr = isTr ? longMonthsTr[month] : longMonthsEn[month];
      return `${day} ${monthStr} ${year}`;
    } else if (format === 'monthYear') {
      const monthStr = isTr ? longMonthsTr[month] : longMonthsEn[month];
      return `${monthStr} ${year}`;
    } else if (format === 'iso') {
      return this.toISODateString(d);
    }
    return this.toISODateString(d);
  },

  formatMonthYear(date) {
    return this.formatDate(date, 'monthYear');
  },

  formatDateLong(date) {
    return this.formatDate(date, 'long');
  },

  parseDate(str) {
    if (!str) return new Date();
    // Assuming YYYY-MM-DD
    const parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    }
    return new Date(str);
  },

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  diffDays(date1, date2) {
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return (d2 >= d1) ? diffDays : -diffDays;
  },

  isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  },

  isToday(date) {
    return this.isSameDay(date, new Date());
  },

  startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  endOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  },

  getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  getWeekday(date) {
    // 0 = Monday, 6 = Sunday
    let day = date.getDay();
    return day === 0 ? 6 : day - 1;
  },

  toISODateString(date) {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  },
  
  // --- DOM helpers ---
  $(selector) {
    return document.querySelector(selector);
  },

  $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  },

  createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        for (const [dKey, dValue] of Object.entries(value)) {
          el.dataset[dKey] = dValue;
        }
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }
    
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        el.appendChild(child);
      }
    });
    
    return el;
  },

  showToast(message, type = 'info', duration = 3000) {
    const toast = this.createElement('div', { className: `toast toast-${type}` }, [message]);
    document.body.appendChild(toast);
    
    // Trigger reflow
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  showModal(content, options = {}) {
    return new Promise((resolve, reject) => {
      // Basic modal implementation
      const overlay = this.createElement('div', { className: 'modal-overlay' });
      const modal = this.createElement('div', { className: 'modal' }, [content]);
      
      const closeBtn = this.createElement('button', { className: 'modal-close', onclick: () => {
        this.hideModal(overlay);
        resolve(null);
      } }, ['×']);
      
      modal.appendChild(closeBtn);
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Animation
      overlay.offsetHeight;
      overlay.classList.add('show');
    });
  },

  hideModal(overlay = null) {
    const el = overlay || document.querySelector('.modal-overlay');
    if (el) {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 300);
    }
  },
  
  // --- Animation helpers ---
  animate(element, animation, duration = 300) {
    if (!element) return;
    element.classList.add('animated', animation);
    setTimeout(() => {
      element.classList.remove('animated', animation);
    }, duration);
  },

  fadeIn(element, duration = 300) {
    if (!element) return;
    element.style.opacity = 0;
    element.style.display = 'block';
    element.style.transition = `opacity ${duration}ms`;
    
    element.offsetHeight; // trigger reflow
    element.style.opacity = 1;
  },

  fadeOut(element, duration = 300) {
    if (!element) return;
    element.style.opacity = 1;
    element.style.transition = `opacity ${duration}ms`;
    
    element.offsetHeight; // trigger reflow
    element.style.opacity = 0;
    
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  },
  
  // --- Validation ---
  isValidDate(str) {
    if (!str || !str.match(/^\d{4}-\d{2}-\d{2}$/)) return false;
    const d = new Date(str);
    const dNum = d.getTime();
    if(!dNum && dNum !== 0) return false;
    return d.toISOString().slice(0,10) === str;
  },

  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  
  // --- Misc ---
  debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },

  vibrate(pattern = 50) {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.warn('Vibration failed', e);
      }
    }
  }
};
