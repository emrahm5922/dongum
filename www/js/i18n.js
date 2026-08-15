window.App = window.App || {};

window.App.I18n = {
  currentLang: localStorage.getItem('dongum_lang') || 'tr',
  translations: {
    tr: {
      // General
      'app.name': 'Döngüm',
      'general.save': 'Kaydet', 'general.cancel': 'İptal', 'general.delete': 'Sil', 'general.edit': 'Düzenle',
      'general.back': 'Geri', 'general.next': 'İleri', 'general.done': 'Bitti', 'general.close': 'Kapat',
      'general.settings': 'Ayarlar', 'general.loading': 'Yükleniyor...', 'general.error': 'Hata',
      'general.success': 'Başarılı', 'general.confirm': 'Onayla', 'general.yes': 'Evet',
      'general.no': 'Hayır', 'general.ok': 'Tamam',

      // Onboarding & Profile
      'onboarding.welcome.title': 'Döngüm\'e Hoş Geldiniz',
      'onboarding.welcome.subtitle': 'Sağlığınızı ve döngünüzü size özel takip edin',
      'onboarding.step.profile': 'Sana Özel Döngü Deneyimi',
      'onboarding.step.lastPeriod': 'Son adet tarihiniz ne zamandı?',
      'onboarding.step.cycleLength': 'Ortalama döngü uzunluğunuz nedir?',
      'onboarding.step.periodLength': 'Adetiniz ortalama kaç gün sürüyor?',
      'onboarding.step.pinSetup': 'PIN Kodu (İsteğe Bağlı)',
      'onboarding.defaultsInfo': 'Emin değilseniz varsayılan değerleri bırakabilirsiniz.',
      'onboarding.skip': 'Atla', 'onboarding.getStarted': 'Başla', 'onboarding.setUpLater': 'Daha Sonra Ayarla',

      // Profile & Personalization
      'profile.title': 'Profil & Kişiselleştirme',
      'profile.age': 'Yaşınız',
      'profile.goal': 'Uygulama Amacı',
      'profile.goal.track': '🌸 Regl & Sağlık Takibi',
      'profile.goal.ttc': '👶 Hamilelik / Bebek Planlama',
      'profile.goal.prevent': '🛡️ Doğurganlık & Korunma Takibi',
      'profile.marital': 'Medeni Durum / İlişki',
      'profile.marital.single': 'Bekar',
      'profile.marital.married': 'Evli / Birlikte',
      'profile.marital.unspecified': 'Belirtmek İstemiyorum',
      'profile.birthHistory': 'Doğum Geçmişi',
      'profile.birthHistory.yes': 'Daha Önce Doğum Yaptım',
      'profile.birthHistory.no': 'Doğum Yapmadım',


      // Dashboard
      'dashboard.cycleDay': 'Döngü Günü {{day}}',
      'dashboard.dayXofY': 'Gün {{day}} / {{total}}',
      'dashboard.nextPeriodIn': 'Sonraki adete {{days}} gün',
      'dashboard.periodToday': 'Adet bugün bekleniyor',
      'dashboard.periodLate': 'Adet {{days}} gün gecikti',
      'dashboard.phase.menstrual': 'Adet (Menstrüasyon)',
      'dashboard.phase.follicular': 'Foliküler',
      'dashboard.phase.ovulation': 'Yumurtlama (Ovulasyon)',
      'dashboard.phase.luteal': 'Luteal',
      'dashboard.fertility.low': 'Düşük Doğurganlık',
      'dashboard.fertility.medium': 'Orta Doğurganlık',
      'dashboard.fertility.high': 'Yüksek Doğurganlık',
      'dashboard.fertility.peak': 'Zirve Doğurganlık',
      'dashboard.btn.periodStarted': 'Adetim Başladı',
      'dashboard.btn.periodEnded': 'Adetim Bitti',
      'dashboard.fertileWindow': 'Doğurgan Pencere',
      'dashboard.ovulationDay': 'Yumurtlama Günü',

      // Calendar
      'calendar.month.jan': 'Ocak', 'calendar.month.feb': 'Şubat', 'calendar.month.mar': 'Mart',
      'calendar.month.apr': 'Nisan', 'calendar.month.may': 'Mayıs', 'calendar.month.jun': 'Haziran',
      'calendar.month.jul': 'Temmuz', 'calendar.month.aug': 'Ağustos', 'calendar.month.sep': 'Eylül',
      'calendar.month.oct': 'Ekim', 'calendar.month.nov': 'Kasım', 'calendar.month.dec': 'Aralık',
      'calendar.weekday.short.mon': 'Pzt', 'calendar.weekday.short.tue': 'Sal', 'calendar.weekday.short.wed': 'Çar',
      'calendar.weekday.short.thu': 'Per', 'calendar.weekday.short.fri': 'Cum', 'calendar.weekday.short.sat': 'Cmt',
      'calendar.weekday.short.sun': 'Paz',
      'calendar.weekday.full.mon': 'Pazartesi', 'calendar.weekday.full.tue': 'Salı', 'calendar.weekday.full.wed': 'Çarşamba',
      'calendar.weekday.full.thu': 'Perşembe', 'calendar.weekday.full.fri': 'Cuma', 'calendar.weekday.full.sat': 'Cumartesi',
      'calendar.weekday.full.sun': 'Pazar',
      'calendar.today': 'Bugün', 'calendar.periodDays': 'Adet Günleri',
      'calendar.predictedPeriod': 'Tahmini Adet', 'calendar.ovulation': 'Yumurtlama',
      'calendar.fertileWindow': 'Doğurganlık Penceresi', 'calendar.legend': 'Açıklamalar',
      'calendar.tapToLog': 'Belirti girmek için dokunun', 'calendar.noData': 'Veri Yok',

      // Symptoms
      'symptoms.mood': 'Ruh Hali', 'symptoms.mood.great': 'Harika', 'symptoms.mood.good': 'İyi',
      'symptoms.mood.okay': 'İdare Eder', 'symptoms.mood.bad': 'Kötü', 'symptoms.mood.terrible': 'Berbat',
      'symptoms.flow': 'Kanama', 'symptoms.flow.none': 'Yok', 'symptoms.flow.spotting': 'Lekelenme',
      'symptoms.flow.light': 'Hafif', 'symptoms.flow.medium': 'Orta', 'symptoms.flow.heavy': 'Yoğun',
      'symptoms.painLevel': 'Ağrı Seviyesi', 'symptoms.painLevel.none': 'Yok', 'symptoms.painLevel.mild': 'Hafif',
      'symptoms.painLevel.moderate': 'Orta', 'symptoms.painLevel.severe': 'Şiddetli', 'symptoms.painLevel.verySevere': 'Çok Şiddetli',
      'symptoms.painAreas': 'Ağrı Bölgeleri', 'symptoms.painAreas.abdomen': 'Karın', 'symptoms.painAreas.lowerBack': 'Bel',
      'symptoms.painAreas.head': 'Baş', 'symptoms.painAreas.breast': 'Göğüs', 'symptoms.painAreas.legs': 'Bacaklar',
      'symptoms.discharge': 'Akıntı', 'symptoms.discharge.none': 'Yok', 'symptoms.discharge.sticky': 'Yapışkan',
      'symptoms.discharge.creamy': 'Kremsi', 'symptoms.discharge.eggWhite': 'Yumurta Akı', 'symptoms.discharge.watery': 'Sulu',
      'symptoms.sleepQuality': 'Uyku Kalitesi', 'symptoms.waterIntake': 'Su Tüketimi',
      'symptoms.exercise': 'Egzersiz', 'symptoms.intimacy': 'Yakınlık', 'symptoms.medication': 'İlaçlar',
      'symptoms.notes': 'Notlar', 'symptoms.saveSymptoms': 'Belirtileri Kaydet', 'symptoms.symptomsSaved': 'Belirtiler Kaydedildi',

      // Statistics
      'stats.overview': 'Döngü Özeti',
      'stats.averageCycle': 'Ortalama Döngü', 'stats.shortestCycle': 'En Kısa Döngü', 'stats.longestCycle': 'En Uzun Döngü',
      'stats.averagePeriodLength': 'Ortalama Adet Süresi', 'stats.totalCyclesTracked': 'Kayıtlı Döngü',
      'stats.cycleRegularity': 'Döngü Düzeni', 'stats.regular': 'Düzenli', 'stats.irregular': 'Düzensiz',
      'stats.cycleHistory': 'Döngü Geçmişi', 'stats.temperatureChart': 'Ateş Tablosu', 'stats.symptomTrends': 'Belirti Dağılımı',
      'stats.last6Cycles': 'Son 6 Döngü', 'stats.predictedNextPeriod': 'Gelecek Döngü Tahminleri', 'stats.noDataYet': 'Henüz Yeterli Veri Yok',

      // Notifications
      'notify.periodApproaching2': 'Regl döneminize 2 gün kaldı. Hazırlıklı olmak isteyebilirsin! 🌸',
      'notify.periodApproaching1': 'Yarın yeni döngün başlayabilir. Şişkinlik veya hafif ağrı hissediyorsan normal, semptomlarını kaydetmek ister misin? 📝',
      'notify.periodToday': 'Bugün regl dönemin başlamalı. Kendine iyi bak! 🌸',
      'notify.periodLate1': 'Regl dönemin 1 gün gecikti görünüyor. Başladıysa buraya tıklayarak güncelleyebilirsin. 🔔',
      'notify.periodLate': 'Regl dönemin {{days}} gün gecikti görünüyor. Başladıysa kaydetmek için dokunun.',
      'notify.ovulationDay': 'Bugün yüksek doğurganlık günündesin. Bilgilendirmek istedik! ✨',
      'notify.fertileWindowOpen': 'Doğurganlık pencereniz başladı. 🟢',
      'notify.dailySymptomReminder': 'Bugün nasıl hissediyorsunuz? Günlük belirtilerinizi kaydedin. 📝',
      'notify.medicationReminder': 'İlaç hatırlatıcısı: {{medication}} 💊',
      'notify.permission': 'Bildirim İzni Alınamadı',

      // Settings
      'settings.profile': 'Profil', 'settings.cycleSettings': 'Döngü Ayarları', 'settings.averageCycleLength': 'Ortalama Döngü Uzunluğu',
      'settings.averagePeriodLength': 'Ortalama Adet Uzunluğu', 'settings.notifications': 'Bildirimler',
      'settings.periodReminder': 'Adet Hatırlatıcısı', 'settings.ovulationReminder': 'Yumurtlama Hatırlatıcısı',
      'settings.dailyLogReminder': 'Günlük Kayıt Hatırlatıcısı', 'settings.medicationReminder': 'İlaç Hatırlatıcıları',
      'settings.appearance': 'Görünüm', 'settings.darkMode': 'Karanlık Mod', 'settings.language': 'Dil',
      'settings.security': 'Güvenlik', 'settings.pinLock': 'PIN Kilidi', 'settings.changePin': 'PIN Değiştir',
      'settings.setPin': 'PIN Belirle', 'settings.removePin': 'PIN Kaldır', 'settings.enterPin': 'PIN Girin',
      'settings.wrongPin': 'Hatalı PIN', 'settings.data': 'Veri', 'settings.exportData': 'Verileri Dışa Aktar (JSON)',
      'settings.exportPdf': 'PDF Raporu Al', 'settings.deleteAllData': 'Tüm Verileri Sil',
      'settings.deleteConfirmation': 'Tüm verileriniz kalıcı olarak silinecek. Emin misiniz?',
      'settings.about': 'Hakkında', 'settings.version': 'Sürüm', 'settings.privacy': 'Gizlilik Politikası',
      'settings.medicalDisclaimer': 'Bu uygulama tıbbi bir teşhis veya tedavi tavsiyesi sunmaz. Sağlık sorunlarınız için lütfen bir hekime danışın.',

      // PIN
      'pin.enterYourPin': 'PIN kodunuzu girin', 'pin.setNewPin': 'Yeni PIN belirleyin', 'pin.confirmPin': 'PIN kodunuzu onaylayın',
      'pin.pinsDontMatch': 'PIN kodları eşleşmiyor', 'pin.pinSetSuccessfully': 'PIN başarıyla ayarlandı', 'pin.pinRemoved': 'PIN kaldırıldı',

      // Temperature
      'temp.basalBodyTemperature': 'Bazal Vücut Isısı (BVI)', 'temp.addTemperature': 'Ateş Ekle',
      'temp.temperatureCelsius': 'Ateş (°C)', 'temp.chart': 'Ateş Tablosu', 'temp.trackingInfo': 'BVI ölçümü her sabah yataktan kalkmadan aynı saatte yapılmalıdır.',

      // Medication
      'med.medications': 'İlaçlar', 'med.addMedication': 'İlaç Ekle', 'med.name': 'İlaç Adı',
      'med.reminderTime': 'Hatırlatma Saati', 'med.active': 'Aktif', 'med.editMedication': 'İlacı Düzenle',
      'med.deleteMedication': 'İlacı Sil', 'med.reminder': 'İlaç Hatırlatıcısı',

      // Export
      'export.report': 'Raporu Dışa Aktar', 'export.generatingPdf': 'PDF Oluşturuluyor...', 'export.reportGenerated': 'Rapor Oluşturuldu',
      'export.doctorReportTitle': 'Doktor Raporu', 'export.patientCycleReport': 'Hasta Döngü Raporu',
      'export.cycleSummary': 'Döngü Özeti', 'export.symptomSummary': 'Belirti Özeti',

      // Phases
      'phase.menstrual.name': 'Adet Fazı (Menstrüel)',
      'phase.menstrual.desc': 'Döngünün 1. gününden başlar. Östrojen ve progesteron seviyeleri düşüktür, bu durum rahim iç tabakasının dökülmesine (adet kanaması) neden olur. Sık görülen belirtiler arasında kramplar, yorgunluk ve ruh hali değişimleri yer alır.',
      'phase.follicular.name': 'Foliküler Faz',
      'phase.follicular.desc': 'Adetin ilk günü ile yumurtlama arasında gerçekleşir. Hipofiz bezi FSH (Folikül Uyarıcı Hormon) salgılar. Östrojen seviyeleri yükselir, rahim iç zarı kalınlaşmaya başlar. Genellikle enerji seviyesi yüksektir.',
      'phase.ovulation.name': 'Yumurtlama Fazı (Ovulasyon)',
      'phase.ovulation.desc': 'Yükselen östrojen LH (Lüteinleştirici Hormon) artışını tetikler ve olgunlaşmış bir yumurtanın salınmasına yol açar. Doğurganlığın en yüksek olduğu zamandır. Vücut ısısında hafif bir artış ve yumurta akı kıvamında servikal mukus görülebilir.',
      'phase.luteal.name': 'Luteal Faz',
      'phase.luteal.desc': 'Yumurtlamadan sonra başlar ve yaklaşık 14 gün sürer. Progesteron seviyesi artarak rahmi olası bir hamileliğe hazırlar. Döllenme olmazsa hormonlar düşer ve PMS (adet öncesi sendrom) belirtileri ortaya çıkabilir.',

      // Tips
      'tips.menstrual.1': 'Demir açısından zengin besinler tüketin (ıspanak, mercimek, kırmızı et).',
      'tips.menstrual.2': 'Karın bölgesine uygulanan sıcak kompresler krampları hafifletebilir.',
      'tips.menstrual.3': 'Hafif esneme hareketleri veya yürüyüş kan dolaşımını rahatlatır.',
      'tips.follicular.1': 'Yüksek enerji seviyenizi değerlendirin; zorlu antrenmanlar için harika bir zaman.',
      'tips.follicular.2': 'Taze meyve ve sebze ağırlıklı beslenerek yükselen östrojeninize destek olun.',
      'tips.follicular.3': 'Yaratıcılığınızın yüksek olabileceği günlerdir, yeni projelere başlamayı deneyin.',
      'tips.ovulation.1': 'Doğurganlık belirtilerini (servikal akıntı, bazal vücut ısısı) takip edin.',
      'tips.ovulation.2': 'Bedeniniz enfeksiyonlara karşı daha hassas olabilir, hijyene ekstra dikkat edin.',
      'tips.ovulation.3': 'Artan libidoyu ve sosyalleşme isteğinizi değerlendirin.',
      'tips.luteal.1': 'Tatlı krizlerini dengelemek için kompleks karbonhidratları (tam tahıllar) tercih edin.',
      'tips.luteal.2': 'Tuz ve kafein tüketimini azaltarak şişkinliği ve göğüs hassasiyetini hafifletebilirsiniz.',
      'tips.luteal.3': 'PMS belirtileri yaşıyorsanız yoga, meditasyon veya ılık bir duş ile rahatlamaya çalışın.',

      // Navigation
      'nav.dashboard': 'Ana Sayfa', 'nav.calendar': 'Takvim', 'nav.symptoms': 'Günlük', 'nav.stats': 'İstatistik', 'nav.settings': 'Ayarlar',

      // General extras
      'general.days': 'gün',

      // Onboarding extras (aliases for app.js)
      'onboarding.welcomeTitle': 'Döngüm\'e Hoş Geldiniz',
      'onboarding.welcomeSubtitle': 'Sağlığınızı takip etmenin en kolay yolu',
      'onboarding.getStarted': 'Başlayalım',
      'onboarding.lastPeriodTitle': 'Son adet tarihiniz ne zamandı?',
      'onboarding.lastPeriodDesc': 'Tahminlerimizi oluşturmak için son adetinizin başlangıç tarihini girin.',
      'onboarding.cycleLengthTitle': 'Döngü ve Adet Süreniz',
      'onboarding.average': 'Ortalama',
      'onboarding.pinTitle': 'PIN Koruması (İsteğe Bağlı)',
      'onboarding.pinDesc': 'Uygulamanızı 4 haneli PIN ile koruyabilirsiniz.',
      'onboarding.setPin': 'PIN Belirle',
      'onboarding.skipPin': 'Atla, Daha Sonra Ayarlarım',
      'onboarding.selectDate': 'Lütfen bir tarih seçin',

      // Dashboard extras
      'dashboard.nextPeriod': 'Sonraki Adet',
      'dashboard.fertility': 'Doğurganlık',
      'dashboard.ovulation': 'Yumurtlama',
      'dashboard.pregnancyProb': 'Gebelik Olasılığı',
      'dashboard.periodStart': 'Adetim Başladı',
      'dashboard.periodEnd': 'Adetim Bitti',
      'dashboard.periodStartedMsg': 'Adet başlangıcı kaydedildi 🌸',
      'dashboard.periodEndedMsg': 'Adet bitişi kaydedildi ✓',
      'dashboard.noCycleData': 'Döngü verisi yok',
      'dashboard.dayOfCycle': '{{total}} günün {{day}}. günü',
      'dashboard.today': 'Bugün',
      'dashboard.passed': 'Geçti',
      'dashboard.periodLate': '{{days}} gün gecikti',
      'dashboard.fertilityLow': 'Düşük',
      'dashboard.fertilityMedium': 'Orta',
      'dashboard.fertilityHigh': 'Yüksek',
      'dashboard.fertilityPeak': 'Zirve',

      // Phases (short names for dashboard)
      'phases.menstrual': 'Adet Fazı',
      'phases.follicular': 'Foliküler Faz',
      'phases.ovulation': 'Yumurtlama',
      'phases.luteal': 'Luteal Faz',
      'phases.menstrualDesc': 'Döngünün 1. gününden başlar. Östrojen ve progesteron seviyeleri düşüktür, rahim iç tabakası dökülür.',
      'phases.follicularDesc': 'FSH hormonu yükselir, yumurtalıklarda folikül gelişir. Enerji seviyesi artmaya başlar.',
      'phases.ovulationDesc': 'LH artışı ile olgun yumurta salınır. Doğurganlığın en yüksek olduğu dönemdir.',
      'phases.lutealDesc': 'Progesteron yükselir, rahim hamileliğe hazırlanır. PMS belirtileri görülebilir.',

      // Tips (array-like)
      'tips.menstrual': ['Demir açısından zengin besinler tüketin.', 'Sıcak kompresler krampları hafifletir.', 'Hafif yürüyüş kan dolaşımını rahatlatır.'],
      'tips.follicular': ['Zorlu antrenmanlar için harika bir dönem.', 'Taze meyve-sebze ağırlıklı beslenin.', 'Yaratıcılığınız yüksek, yeni projelere başlayın.'],
      'tips.ovulation': ['Servikal akıntı ve bazal ısıyı takip edin.', 'Hijyene ekstra dikkat edin.', 'Sosyalleşme isteğinizi değerlendirin.'],
      'tips.luteal': ['Tam tahılları tercih edin.', 'Tuz ve kafein tüketimini azaltın.', 'Yoga veya meditasyon ile rahatlayın.'],

      // Settings extras
      'settings.avgCycleLength': 'Ortalama Döngü Süresi',
      'settings.avgPeriodLength': 'Ortalama Adet Süresi',
      'settings.importData': 'Veri İçe Aktar',
      'settings.dangerZone': 'Tehlikeli Bölge',
      'settings.dataDeleted': 'Tüm veriler silindi',
      'settings.privacyText': 'Tüm verileriniz yalnızca bu cihazda saklanır.',

      // PIN extras
      'pin.pinSetSuccess': 'PIN başarıyla ayarlandı',
      'pin.pinRemoved': 'PIN kaldırıldı',

      // Medication extras
      'medication.medications': 'İlaçlar',
      'medication.addMedication': 'İlaç Ekle',
      'medication.todayMeds': 'Bugünkü İlaçlar',

      // Errors
      'error.dataLoad': 'Veri yüklenirken hata oluştu.', 'error.save': 'Kaydedilirken hata oluştu.', 'error.notifyPermission': 'Bildirim izni reddedildi.'
    },
    en: {
      // General
      'app.name': 'MyCycle',
      'general.save': 'Save', 'general.cancel': 'Cancel', 'general.delete': 'Delete', 'general.edit': 'Edit',
      'general.back': 'Back', 'general.next': 'Next', 'general.done': 'Done', 'general.close': 'Close',
      'general.settings': 'Settings', 'general.loading': 'Loading...', 'general.error': 'Error',
      'general.success': 'Success', 'general.confirm': 'Confirm', 'general.yes': 'Yes',
      'general.no': 'No', 'general.ok': 'OK',

      // Onboarding
      'onboarding.welcome.title': 'Welcome to MyCycle',
      'onboarding.welcome.subtitle': 'The easiest way to track your health',
      'onboarding.step.lastPeriod': 'When was your last period date?',
      'onboarding.step.cycleLength': 'What is your average cycle length?',
      'onboarding.step.periodLength': 'How long does your period usually last?',
      'onboarding.step.pinSetup': 'Setup PIN (Optional)',
      'onboarding.defaultsInfo': 'If you are unsure, you can leave the defaults.',
      'onboarding.skip': 'Skip', 'onboarding.getStarted': 'Get Started', 'onboarding.setUpLater': 'Set Up Later',

      // Dashboard
      'dashboard.cycleDay': 'Cycle Day {{day}}',
      'dashboard.dayXofY': 'Day {{day}} of {{total}}',
      'dashboard.nextPeriodIn': 'Next period in {{days}} days',
      'dashboard.periodToday': 'Period expected today',
      'dashboard.periodLate': 'Period late by {{days}} days',
      'dashboard.phase.menstrual': 'Menstruation',
      'dashboard.phase.follicular': 'Follicular',
      'dashboard.phase.ovulation': 'Ovulation',
      'dashboard.phase.luteal': 'Luteal',
      'dashboard.fertility.low': 'Low Fertility',
      'dashboard.fertility.medium': 'Medium Fertility',
      'dashboard.fertility.high': 'High Fertility',
      'dashboard.fertility.peak': 'Peak Fertility',
      'dashboard.btn.periodStarted': 'Period Started',
      'dashboard.btn.periodEnded': 'Period Ended',
      'dashboard.fertileWindow': 'Fertile Window',
      'dashboard.ovulationDay': 'Ovulation Day',

      // Calendar
      'calendar.month.jan': 'January', 'calendar.month.feb': 'February', 'calendar.month.mar': 'March',
      'calendar.month.apr': 'April', 'calendar.month.may': 'May', 'calendar.month.jun': 'June',
      'calendar.month.jul': 'July', 'calendar.month.aug': 'August', 'calendar.month.sep': 'September',
      'calendar.month.oct': 'October', 'calendar.month.nov': 'November', 'calendar.month.dec': 'December',
      'calendar.weekday.short.mon': 'Mon', 'calendar.weekday.short.tue': 'Tue', 'calendar.weekday.short.wed': 'Wed',
      'calendar.weekday.short.thu': 'Thu', 'calendar.weekday.short.fri': 'Fri', 'calendar.weekday.short.sat': 'Sat',
      'calendar.weekday.short.sun': 'Sun',
      'calendar.weekday.full.mon': 'Monday', 'calendar.weekday.full.tue': 'Tuesday', 'calendar.weekday.full.wed': 'Wednesday',
      'calendar.weekday.full.thu': 'Thursday', 'calendar.weekday.full.fri': 'Friday', 'calendar.weekday.full.sat': 'Saturday',
      'calendar.weekday.full.sun': 'Sunday',
      'calendar.today': 'Today', 'calendar.periodDays': 'Period Days',
      'calendar.predictedPeriod': 'Predicted Period', 'calendar.ovulation': 'Ovulation',
      'calendar.fertileWindow': 'Fertile Window', 'calendar.legend': 'Legend',
      'calendar.tapToLog': 'Tap to log', 'calendar.noData': 'No Data',

      // Symptoms
      'symptoms.mood': 'Mood', 'symptoms.mood.great': 'Great', 'symptoms.mood.good': 'Good',
      'symptoms.mood.okay': 'Okay', 'symptoms.mood.bad': 'Bad', 'symptoms.mood.terrible': 'Terrible',
      'symptoms.flow': 'Flow', 'symptoms.flow.none': 'None', 'symptoms.flow.spotting': 'Spotting',
      'symptoms.flow.light': 'Light', 'symptoms.flow.medium': 'Medium', 'symptoms.flow.heavy': 'Heavy',
      'symptoms.painLevel': 'Pain Level', 'symptoms.painLevel.none': 'None', 'symptoms.painLevel.mild': 'Mild',
      'symptoms.painLevel.moderate': 'Moderate', 'symptoms.painLevel.severe': 'Severe', 'symptoms.painLevel.verySevere': 'Very Severe',
      'symptoms.painAreas': 'Pain Areas', 'symptoms.painAreas.abdomen': 'Abdomen', 'symptoms.painAreas.lowerBack': 'Lower Back',
      'symptoms.painAreas.head': 'Head', 'symptoms.painAreas.breast': 'Breast', 'symptoms.painAreas.legs': 'Legs',
      'symptoms.discharge': 'Discharge', 'symptoms.discharge.none': 'None', 'symptoms.discharge.sticky': 'Sticky',
      'symptoms.discharge.creamy': 'Creamy', 'symptoms.discharge.eggWhite': 'Egg White', 'symptoms.discharge.watery': 'Watery',
      'symptoms.sleepQuality': 'Sleep Quality', 'symptoms.waterIntake': 'Water Intake',
      'symptoms.exercise': 'Exercise', 'symptoms.intimacy': 'Intimacy', 'symptoms.medication': 'Medication',
      'symptoms.notes': 'Notes', 'symptoms.saveSymptoms': 'Save Symptoms', 'symptoms.symptomsSaved': 'Symptoms Saved',

      // Statistics
      'stats.overview': 'Cycle Overview',
      'stats.averageCycle': 'Average Cycle', 'stats.shortestCycle': 'Shortest Cycle', 'stats.longestCycle': 'Longest Cycle',
      'stats.averagePeriodLength': 'Average Period Length', 'stats.totalCyclesTracked': 'Total Cycles Tracked',
      'stats.cycleRegularity': 'Cycle Regularity', 'stats.regular': 'Regular', 'stats.irregular': 'Irregular',
      'stats.cycleHistory': 'Cycle History', 'stats.temperatureChart': 'Temperature Chart', 'stats.symptomTrends': 'Symptom Trends',
      'stats.last6Cycles': 'Last 6 Cycles', 'stats.predictedNextPeriod': 'Predicted Next Period', 'stats.noDataYet': 'No data yet',

      // Notifications
      'notify.periodApproaching2': 'Your period is expected in 2 days. You might want to be prepared! 🌸',
      'notify.periodApproaching1': 'Your next cycle may begin tomorrow. Bloating or mild discomfort is normal; would you like to log symptoms? 📝',
      'notify.periodToday': 'Your period is expected today. Take good care of yourself! 🌸',
      'notify.periodLate1': 'Your period is 1 day late. Tap here if it has started to update your tracker. 🔔',
      'notify.periodLate': 'Your period seems to be {{days}} days late. Tap here to record if started.',
      'notify.ovulationDay': 'You are on your peak fertility day today. Just wanted to let you know! ✨',
      'notify.fertileWindowOpen': 'Your fertile window has started. 🟢',
      'notify.dailySymptomReminder': 'How are you feeling today? Take a moment to log your symptoms. 📝',
      'notify.medicationReminder': 'Medication reminder: {{medication}} 💊',
      'notify.permission': 'Notification permission denied',

      // Settings
      'settings.profile': 'Profile', 'settings.cycleSettings': 'Cycle Settings', 'settings.averageCycleLength': 'Average Cycle Length',
      'settings.averagePeriodLength': 'Average Period Length', 'settings.notifications': 'Notifications',
      'settings.periodReminder': 'Period Reminder', 'settings.ovulationReminder': 'Ovulation Reminder',
      'settings.dailyLogReminder': 'Daily Log Reminder', 'settings.medicationReminder': 'Medication Reminder',
      'settings.appearance': 'Appearance', 'settings.darkMode': 'Dark Mode', 'settings.language': 'Language',
      'settings.security': 'Security', 'settings.pinLock': 'PIN Lock', 'settings.changePin': 'Change PIN',
      'settings.setPin': 'Set PIN', 'settings.removePin': 'Remove PIN', 'settings.enterPin': 'Enter PIN',
      'settings.wrongPin': 'Wrong PIN', 'settings.data': 'Data', 'settings.exportData': 'Export Data (JSON)',
      'settings.exportPdf': 'Export PDF', 'settings.deleteAllData': 'Delete All Data',
      'settings.deleteConfirmation': 'All your data will be permanently deleted. Are you sure?',
      'settings.about': 'About', 'settings.version': 'Version', 'settings.privacy': 'Privacy Policy',
      'settings.medicalDisclaimer': 'This app does not provide medical diagnosis or treatment advice. Please consult a physician for health concerns.',

      // PIN
      'pin.enterYourPin': 'Enter your PIN', 'pin.setNewPin': 'Set new PIN', 'pin.confirmPin': 'Confirm PIN',
      'pin.pinsDontMatch': 'PINs don\'t match', 'pin.pinSetSuccessfully': 'PIN set successfully', 'pin.pinRemoved': 'PIN removed',

      // Temperature
      'temp.basalBodyTemperature': 'Basal Body Temperature', 'temp.addTemperature': 'Add Temperature',
      'temp.temperatureCelsius': 'Temperature °C', 'temp.chart': 'Temperature Chart', 'temp.trackingInfo': 'BBT tracking info.',

      // Medication
      'med.medications': 'Medications', 'med.addMedication': 'Add Medication', 'med.name': 'Medication Name',
      'med.reminderTime': 'Reminder Time', 'med.active': 'Active', 'med.editMedication': 'Edit Medication',
      'med.deleteMedication': 'Delete Medication', 'med.reminder': 'Medication Reminder',

      // Export
      'export.report': 'Export Report', 'export.generatingPdf': 'Generating PDF...', 'export.reportGenerated': 'Report Generated',
      'export.doctorReportTitle': 'Doctor Report', 'export.patientCycleReport': 'Patient Cycle Report',
      'export.cycleSummary': 'Cycle Summary', 'export.symptomSummary': 'Symptom Summary',

      // Phases
      'phase.menstrual.name': 'Menstrual Phase',
      'phase.menstrual.desc': 'Menstrual phase description...',
      'phase.follicular.name': 'Follicular Phase',
      'phase.follicular.desc': 'Follicular phase description...',
      'phase.ovulation.name': 'Ovulation Phase',
      'phase.ovulation.desc': 'Ovulation phase description...',
      'phase.luteal.name': 'Luteal Phase',
      'phase.luteal.desc': 'Luteal phase description...',

      // Tips
      'tips.menstrual.1': 'Menstrual tip 1', 'tips.menstrual.2': 'Menstrual tip 2', 'tips.menstrual.3': 'Menstrual tip 3',
      'tips.follicular.1': 'Follicular tip 1', 'tips.follicular.2': 'Follicular tip 2', 'tips.follicular.3': 'Follicular tip 3',
      'tips.ovulation.1': 'Ovulation tip 1', 'tips.ovulation.2': 'Ovulation tip 2', 'tips.ovulation.3': 'Ovulation tip 3',
      'tips.luteal.1': 'Luteal tip 1', 'tips.luteal.2': 'Luteal tip 2', 'tips.luteal.3': 'Luteal tip 3',

      // Navigation
      'nav.dashboard': 'Home', 'nav.calendar': 'Calendar', 'nav.symptoms': 'Log', 'nav.stats': 'Stats', 'nav.settings': 'Settings',

      // General extras
      'general.days': 'days',

      // Onboarding extras
      'onboarding.welcomeTitle': 'Welcome to MyCycle',
      'onboarding.welcomeSubtitle': 'The easiest way to track your health',
      'onboarding.getStarted': 'Get Started',
      'onboarding.lastPeriodTitle': 'When was your last period?',
      'onboarding.lastPeriodDesc': 'Enter the start date of your last period to create predictions.',
      'onboarding.cycleLengthTitle': 'Cycle & Period Length',
      'onboarding.average': 'Average',
      'onboarding.pinTitle': 'PIN Protection (Optional)',
      'onboarding.pinDesc': 'Protect your app with a 4-digit PIN.',
      'onboarding.setPin': 'Set PIN',
      'onboarding.skipPin': 'Skip, I\'ll set it up later',
      'onboarding.selectDate': 'Please select a date',

      // Dashboard extras
      'dashboard.nextPeriod': 'Next Period',
      'dashboard.fertility': 'Fertility',
      'dashboard.ovulation': 'Ovulation',
      'dashboard.pregnancyProb': 'Pregnancy Chance',
      'dashboard.periodStart': 'Period Started',
      'dashboard.periodEnd': 'Period Ended',
      'dashboard.periodStartedMsg': 'Period start recorded 🌸',
      'dashboard.periodEndedMsg': 'Period end recorded ✓',
      'dashboard.noCycleData': 'No cycle data',
      'dashboard.dayOfCycle': 'Day {{day}} of {{total}}',
      'dashboard.today': 'Today',
      'dashboard.passed': 'Passed',
      'dashboard.periodLate': '{{days}} days late',
      'dashboard.fertilityLow': 'Low',
      'dashboard.fertilityMedium': 'Medium',
      'dashboard.fertilityHigh': 'High',
      'dashboard.fertilityPeak': 'Peak',

      // Phases (short names)
      'phases.menstrual': 'Menstrual',
      'phases.follicular': 'Follicular',
      'phases.ovulation': 'Ovulation',
      'phases.luteal': 'Luteal',
      'phases.menstrualDesc': 'Estrogen and progesterone levels are low, causing the uterine lining to shed.',
      'phases.follicularDesc': 'FSH rises, a follicle develops in the ovaries. Energy levels begin to increase.',
      'phases.ovulationDesc': 'LH surge causes the release of a mature egg. Most fertile period.',
      'phases.lutealDesc': 'Progesterone rises, preparing the uterus. PMS symptoms may occur.',

      // Tips
      'tips.menstrual': ['Eat iron-rich foods.', 'Warm compresses help with cramps.', 'Light walking improves circulation.'],
      'tips.follicular': ['Great time for intense workouts.', 'Eat fresh fruits and vegetables.', 'Creativity is high, start new projects.'],
      'tips.ovulation': ['Track cervical mucus and BBT.', 'Pay extra attention to hygiene.', 'Enjoy increased social energy.'],
      'tips.luteal': ['Choose whole grains.', 'Reduce salt and caffeine.', 'Try yoga or meditation to relax.'],

      // Settings extras
      'settings.avgCycleLength': 'Average Cycle Length',
      'settings.avgPeriodLength': 'Average Period Length',
      'settings.importData': 'Import Data',
      'settings.dangerZone': 'Danger Zone',
      'settings.dataDeleted': 'All data deleted',
      'settings.privacyText': 'All your data is stored only on this device.',

      // PIN extras
      'pin.pinSetSuccess': 'PIN set successfully',
      'pin.pinRemoved': 'PIN removed',

      // Medication extras
      'medication.medications': 'Medications',
      'medication.addMedication': 'Add Medication',
      'medication.todayMeds': 'Today\'s Medications',

      // Errors
      'error.dataLoad': 'Data load error', 'error.save': 'Save error', 'error.notifyPermission': 'Notification permission denied'
    }
  },

  t(key, params = {}) {
    const lang = this.currentLang;
    const translationSet = this.translations[lang] || this.translations['tr'];
    let text = translationSet[key] || this.translations['en'][key] || key;

    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue);
    }
    return text;
  },

  setLang(lang) {
    if (this.translations[lang]) {
      this.currentLang = lang;
      localStorage.setItem('dongum_lang', lang);
      document.documentElement.setAttribute('lang', lang);
    }
  },

  getLang() {
    return this.currentLang;
  }
};

// Initialize lang attribute
document.documentElement.setAttribute('lang', window.App.I18n.currentLang);
