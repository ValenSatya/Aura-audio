# AuraAudio Mobile (Android APK & iOS)

AuraAudio Mobile adalah versi native mobile dari aplikasi pemutar musik AuraAudio, dirancang khusus untuk layar sentuh ponsel (Android/iOS) menggunakan **Capacitor 7**, **React 19**, **Tailwind CSS v4**, dan **Web Audio API**.

---

## 📱 Fitur Mobile

- **Pemisahan Total dari Desktop:**
  - Kode mobile berada di sub-direktori `/mobile` terpisah dengan package name `auraaudio-mobile` (`com.auraaudio.mobile`).
  - Desktop package (`apkmusik`) di root tetap utuh dan independen tanpa konflik dependensi.
- **Client-Side YouTube Resolver:**
  - Tidak memerlukan binary `yt-dlp.exe` atau Node.js child processes di perangkat mobile.
  - Menggunakan query YouTube InnerTube & client-side stream resolving dengan fallback Piped API.
- **Mobile Touch UI:**
  - **Bottom Navigation Bar:** Beranda, Pencarian, Library (Playlist & Riwayat), Pengaturan.
  - **Sticky Mini Player:** Floating bar di atas bottom nav dengan micro-progress line, kontrol play/pause, next track, dan swipe gesture.
  - **Fullscreen Now Playing Modal:** Artwork responsif, seekbar sentuh halus, kontrol repeat/shuffle, dan tombol akses cepat Equalizer.
  - **8-Band Hardware-Accelerated Equalizer:** 60Hz, 150Hz, 400Hz, 1kHz, 2.4kHz, 6kHz, 12kHz, 16kHz + Bass Boost & Preset Chips (Pop, Rock, Jazz, Bass, Classical, dsb).
- **Android Background & Lock Screen Integration:**
  - Integrasi `navigator.mediaSession` untuk metadata judul lagu, nama artis, artwork, serta tombol play/pause, next, previous, dan seek langsung dari Android Notification bar dan Lock Screen.
  - Safe-area insets (`env(safe-area-inset-top)` & `env(safe-area-inset-bottom)`) untuk notch, dynamic island, dan navigation gestures.

---

## 🚀 Perintah Cepat

### Dari Direktori Root (`apkmusik/`):
```bash
# Menjalankan Mobile Dev Server di browser:
npm run mobile:dev

# Build web assets dan sinkronisasi ke proyek native Android:
npm run mobile:build

# Sinkronisasi native Android saja:
npm run mobile:sync

# Membuka proyek Android di Android Studio:
npm run mobile:open
```

### Dari Direktori Mobile (`mobile/`):
```bash
cd mobile

# Install dependencies (jika baru di-clone)
npm install

# Jalankan dev server lokal
npm run dev

# Compile TypeScript & bundle Vite
npm run build

# Sinkronisasi asset ke Android
npx cap sync android

# Buka di Android Studio
npx cap open android
```

---

## 🛠️ Build APK Android

Proyek native Android berada di:
`mobile/android/`

### 1. Menggunakan Android Studio (Direkomendasikan):
1. Buka **Android Studio**.
2. Pilih **Open** dan arahkan ke folder `c:\Users\valen\OneDrive\Documents\apkmusik\mobile\android`.
3. Tunggu Gradle sync selesai.
4. Klik **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. APK Debug akan tersedia di:
   `mobile/android/app/build/outputs/apk/debug/app-debug.apk`.

### 2. Menggunakan Command Line (Gradle CLI):
Jika Android SDK sudah terpasang:
```bash
cd mobile/android
.\gradlew.bat assembleDebug
```
Output APK: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
