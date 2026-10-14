# AuraAudio - Modern Desktop Music Player 🎵

Aplikasi desktop pemutar musik modern dan elegan yang dibangun menggunakan **Electron**, **React**, **Vite**, **TypeScript**, **Tailwind CSS**, dan **Web Audio API**.

---

## ✨ Fitur Utama

1. **8-Band Equalizer & 60 FPS Visualizer**:
   - Filter presisi Web Audio API pada frekuensi: **60Hz, 170Hz, 310Hz, 600Hz, 1kHz, 3kHz, 6kHz, 14kHz**.
   - Rentang gain `-12 dB` hingga `+12 dB`.
   - Preset bawaan: *Flat, Bass Boost, Rock, Pop, Vocal Clarity, Jazz, Electronic / EDM, Classical*.
   - Spectrum visualizer responsif real-time dengan gradien warna dinamis.
2. **Dukungan Import Playlist M3U / M3U8**:
   - Mendukung format standar dan extended `#EXTINF`.
   - Mendukung file lokal maupun link web stream radio (HTTP/HTTPS).
3. **Dukungan Import Spreadsheet CSV**:
   - Deteksi kolom otomatis untuk judul (`title`, `judul`, `name`), artis (`artist`, `penyanyi`), url/path, dan durasi.
   - Mendukung pemisah koma (`,`) maupun titik koma (`;`).
4. **Streaming & Download Offline dari Link YouTube**:
   - Masukkan link video/lagu YouTube untuk streaming langsung.
   - **Tombol Unduh Offline**: Mengunduh audio beresolusi tinggi langsung ke disk lokal komputer.
   - **Offline Playback**: Lagu yang telah diunduh dapat diputar kapan saja tanpa koneksi internet.
   - Audio YouTube mengalir melalui audio pipeline lokal sehingga **8-Band Equalizer dan visualizer tetap bekerja penuh**.
5. **Kontrol Pemutar Musik Lengkap**:
   - Play, Pause, Next, Prev, Seekbar dengan waktu aktual.
   - Mode Shuffle & Repeat (Ulangi Semua, Ulangi Satu Lagu, Nonaktif).
   - Pengatur Volume presisi & Tombol Mute.
   - Filter antrian: *Semua Lagu, Offline Ready, File Lokal, YouTube, Radio Stream*.

---

## 🚀 Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)
```bash
npm run dev
```

### Build Aplikasi
```bash
npm run build
```

### Jalankan Hasil Build
```bash
npm start
```

---

## ⌨️ Pintasan Keyboard (Shortcuts)

| Tombol | Aksi |
| :--- | :--- |
| **Spasi (Space)** | Putar / Jeda (Play/Pause) |
| **Panah Kanan (→)** | Maju 5 detik |
| **Panah Kiri (←)** | Mundur 5 detik |
| **Panah Atas (↑)** | Tambah Volume (+5%) |
| **Panah Bawah (↓)** | Kurangi Volume (-5%) |
| **M** | Bisukan / Bunyikan Suara (Mute/Unmute) |
| **E** | Buka / Tutup Panel 8-Band Equalizer |

---

## 🧪 Pengujian & Sampel Playlist

Tersedia file sampel untuk mencoba fitur import:
- `test/sample.m3u` (Contoh playlist M3U dengan kombinasi file lokal dan streaming web)
- `test/sample.csv` (Contoh spreadsheet CSV dengan link YouTube, web stream, dan file lokal)

Jalankan pengujian parser:
```bash
node test/verify.js
```
