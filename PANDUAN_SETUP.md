# 📋 PANDUAN SETUP — QR Rundown Biro Protokol

---

## GAMBARAN SISTEM

```
Admin (HP/Laptop)
     ↓
  index.html          ← di-host di Netlify (gratis)
     ↓  fetch()
  Apps Script         ← backend logic di Google
     ↓  baca/tulis
  Google Sheet        ← database (Staf, Acara, Log)
```

---

## LANGKAH 1 — Buat Google Spreadsheet

1. Buka **https://sheets.google.com**
2. Klik **+ Spreadsheet kosong**
3. Beri nama: `QR Rundown Biro Protokol`
4. Salin **ID Spreadsheet** dari URL:
   ```
   https://docs.google.com/spreadsheets/d/[INI_ID_NYA]/edit
   ```
   Contoh ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`

---

## LANGKAH 2 — Buat Google Apps Script

1. Buka **https://script.google.com**
2. Klik **+ Proyek baru**
3. Hapus semua isi kode yang ada
4. Copy-paste seluruh isi file **`Code.gs`** ke sana
5. Di baris pertama, ganti:
   ```javascript
   const SHEET_ID = 'GANTI_DENGAN_ID_SPREADSHEET_KAMU';
   ```
   Menjadi ID spreadsheet dari Langkah 1, contoh:
   ```javascript
   const SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';
   ```
6. Klik **Simpan** (ikon disket atau Ctrl+S)
7. Beri nama proyek: `QR Rundown`

---

## LANGKAH 3 — Setup Sheet (jalankan sekali)

1. Di Apps Script, klik dropdown fungsi di toolbar atas
2. Pilih fungsi **`setupSheet`**
3. Klik tombol **▶ Jalankan**
4. Akan muncul popup izin — klik **Tinjau izin**
5. Pilih akun Google kamu
6. Klik **Lanjutkan** (abaikan peringatan "tidak diverifikasi")
7. Klik **Izinkan**
8. Tunggu sampai muncul log: `Sheet berhasil dibuat!`
9. Buka Spreadsheet — sekarang ada 3 tab: **Staf**, **Acara**, **Log**
   Dan 5 staf sudah otomatis terisi di tab Staf ✓

---

## LANGKAH 4 — Deploy sebagai Web App

1. Di Apps Script, klik **Deploy → Deployment baru**
2. Klik ikon ⚙ di "Jenis deployment" → pilih **Aplikasi web**
3. Isi pengaturan:
   - **Deskripsi**: `QR Rundown v1`
   - **Jalankan sebagai**: `Saya (nama akun kamu)`
   - **Siapa yang punya akses**: **Semua orang** ← PENTING
4. Klik **Deploy**
5. Copy **URL Aplikasi Web** yang muncul — bentuknya:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   **Simpan URL ini, akan dipakai di Langkah 6**

---

## LANGKAH 5 — Deploy Frontend ke Netlify

1. Buka **https://app.netlify.com/drop**
2. Drag & drop file **`index.html`** ke area yang bertuliskan *"Drag and drop your site folder here"*
3. Tunggu proses upload (beberapa detik)
4. Netlify otomatis memberi URL seperti:
   ```
   https://nama-acak-12345.netlify.app
   ```
5. ✅ Web app sudah online dan bisa diakses dari HP manapun

---

## LANGKAH 6 — Hubungkan Frontend ke Apps Script

1. Buka URL Netlify dari HP atau laptop
2. Klik tombol **⚙ Config** di pojok kanan atas
3. Paste URL Apps Script dari Langkah 4
4. Klik **Simpan & Test**
5. Akan muncul notifikasi **"Koneksi berhasil ✓"**

> **Catatan**: URL ini tersimpan di browser. Setiap admin yang baru buka
> web app perlu memasukkan URL ini sekali. Atau kamu bisa hardcode URL-nya
> langsung di file index.html di baris:
> ```javascript
> let API_URL = localStorage.getItem('qr_api_url') || 'PASTE_URL_DISINI';
> ```

---

## CARA PAKAI SEHARI-HARI

### Admin menambah acara:
1. Tab **Acara** → isi nama, tanggal, link Google Drive rundown, pilih durasi QR
2. Klik **+ Tambah Acara**
3. Klik tombol **QR** pada acara → unduh QR sebagai PNG
4. Kirim QR ke grup WA atau print

### Staf mengakses rundown:
1. Scan QR atau buka URL Netlify
2. Tab **Verifikasi** → pilih acara → masukkan email
3. Jika lolos → langsung dapat tombol **Buka Google Drive**

### Admin memantau:
- Tab **Log** → lihat siapa saja yang sudah akses dan yang ditolak

---

## TROUBLESHOOTING

| Masalah | Solusi |
|---|---|
| "Gagal terhubung" | Pastikan deployment Apps Script diset ke "Semua orang" |
| "Action tidak dikenal" | Pastikan kamu copy-paste Code.gs lengkap |
| Tab Staf/Acara tidak ada di Sheet | Jalankan ulang fungsi `setupSheet()` |
| QR tidak bisa di-generate | Coba refresh halaman, atau pakai browser Chrome |
| Data tidak update | Klik tombol ↺ Refresh |

---

## UPDATE DEPLOYMENT

Jika kamu mengubah kode Apps Script, perlu deploy ulang:
1. Apps Script → **Deploy → Kelola deployment**
2. Klik ikon ✏ pada deployment yang ada
3. Ubah **Versi** ke **"Versi baru"**
4. Klik **Deploy**
5. URL tidak berubah ✓

---

*Dibuat untuk Biro Protokol — sistem QR distribusi rundown acara*
