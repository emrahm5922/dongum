# 📱 Döngüm - Mobil Uygulama & Mağaza Yükleme Rehberi (Play Store & App Store)

Bu proje **Google Play Store (Android)** ve **Apple App Store (iOS)** mağazalarında yayınlanmaya ve doğrudan telefona yüklenmeye hazır tam teşekküllü yerel (native) bir mobil uygulamadır.

Projenizin içinde yerel **`android/`** kaynak kodları ve tüm yapılandırmalar başarıyla oluşturulmuştur.

---

## 🟢 1. YÖNTEM: Android (Google Play Store & Doğrudan APK Çıkarma)

Projenizin içinde hazır bir Android Studio projesi (`android/` klasörü) bulunmaktadır.

### A) Telefona Yüklemek İçin Doğrudan APK Çıkarma (5 Dakika):
1. Bilgisayarınızda **Android Studio** programını açın.
2. **"Open" (Aç)** seçeneğine tıklayıp bu projenin içindeki **`android`** klasörünü seçin.
   *(İsterseniz terminalden `npm run cap:open:android` komutunu yazarak da Android Studio'yu otomatik açabilirsiniz).*
3. Üst menüden **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** seçeneğine tıklayın.
4. 1-2 dakika içinde sağ altta *"APK(s) generated successfully"* bildirimi çıkar. **"locate"** butonuna basarak oluşan `.apk` dosyasını alın.
5. Bu `.apk` dosyasını WhatsApp, Telegram veya kablo ile telefonunuza gönderip üzerine dokunarak anında yükleyin!

### B) Google Play Store'a Yükleme (.AAB Paketi Çıkarma):
1. Android Studio'da üst menüden **Build** > **Generate Signed Bundle / APK...** seçin.
2. **Android App Bundle (.aab)** seçeneğini işaretleyip **Next** deyin.
3. Bir anahtar (Keystore) oluşturup şifrenizi belirleyin ve **Release** modunu seçerek **Finish**'e basın.
4. Oluşan `.aab` dosyasını [Google Play Console](https://play.google.com/console) hesabınıza girerek **"Yeni Sürüm Oluştur"** kısmından yükleyin.

---

## 🍎 2. YÖNTEM: iOS (Apple App Store / iPhone)

iOS uygulamaları Apple politikaları gereği macOS işletim sistemi ve Xcode gerektirir.

### Adımlar:
1. Mac bilgisayarınızda bu proje klasörünü açın.
2. Terminalde şu komutu çalıştırın:
   ```bash
   npm run cap:ios
   ```
3. Xcode otomatik açılacaktır. Üstten bağlı iPhone cihazınızı veya Simülatörü seçip **▶ (Çalıştır)** butonuna basarak test edin.
4. App Store'a yüklemek için: **Product** > **Archive** > **Distribute App** > **App Store Connect** adımlarını izleyin.

---

## ⚡ 3. YÖNTEM: Hiç Program Kurmadan Tüm Telefonlarda Yayınlama (PWA - 1 Dakika)

Projeyi internette yayınlayıp kullanıcıların linke girerek tek tıkla uygulamayı telefonuna yüklemesini sağlayabilirsiniz:

### 1 Dakikada Yayına Alma:
1. [Vercel](https://vercel.com) veya [Netlify](https://www.netlify.com) sitesine ücretsiz üye olun.
2. Proje klasörünü sürükleyip bırakın (Drag & Drop) veya GitHub ile bağlayın.
3. Size özel verilen site linkine telefonunuzdan girin:
   * **Android (Chrome):** Sağ üstteki 3 noktaya basıp **"Uygulamayı Yükle"** deyin.
   * **iPhone (Safari):** Alttaki Paylaş butonuna basıp **"Ana Ekrana Ekle"** deyin.
4. Uygulama telefonun ana ekranına kendi logosuyla, tam ekran ve internetsiz de çalışacak şekilde yüklenir!

---

## 🛠️ Yararlı Komutlar Özeti

| Komut | Açıklama |
|---|---|
| `npm run build` | Web dosyalarını `www/` klasörüne derler |
| `npm run cap:sync` | Yapılan değişiklikleri Android ve iOS'a aktarır |
| `npm run cap:open:android` | Projeyi Android Studio'da açar |
| `npm run cap:open:ios` | Projeyi Xcode'da açar |
| `npm start` | Bilgisayarda canlı önizleme sunucusunu başlatır |
