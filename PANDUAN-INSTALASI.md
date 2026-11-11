# Panduan Instalasi — Jurnal HRD v2.6.0-t1r (Backend GAS + Frontend GitHub Pages)

Versi ini memisahkan aplikasi menjadi dua bagian. Aplikasi produksi v2.5.1 tetap tidak disentuh.

| Bagian | Tempat | Berkas |
| --- | --- | --- |
| Backend | Google Apps Script (hanya mengembalikan JSON) | `Kode.gs`, `appsscript.json` — **UNTUK APPS SCRIPT** |
| Frontend | GitHub Pages | `jurnal-hrd_v2.6.0-t1r.zip` — **UNTUK GITHUB** |

Karena aplikasinya berisi data karyawan dan gaji, versi ini **wajib masuk dengan nama pengguna dan kata sandi**. Halaman depan terbuka untuk umum; isinya hanya bisa dilihat setelah masuk.

---

## Bagian A — Backend (Google Apps Script)

### A1. Buat proyek
1. Buka https://script.google.com → **New project** → beri nama `Jurnal HRD v2.6.0 - REST`.
2. **Project Settings** (roda gigi) → centang **Show "appsscript.json" manifest file in editor**.
3. Kembali ke **Editor**. Hapus isi `Code.gs`, tempel seluruh isi `Kode.gs`. Buka `appsscript.json`, ganti seluruh isinya dengan berkas `appsscript.json`. Simpan.

Bila berkasnya ada di folder Downloads, salin lewat PowerShell lalu tempel dengan Ctrl+V:

```powershell
cd $HOME\Downloads
Get-Content .\Kode.gs -Raw -Encoding UTF8 | Set-Clipboard
```
```powershell
Get-Content .\appsscript.json -Raw -Encoding UTF8 | Set-Clipboard
```

### A2. Jalankan setup (SEKALI)
1. Di daftar fungsi (atas editor) pilih **`setupAppEnvironment`** → **Run** → setujui izin (hanya Google Sheets).
2. Buka **Execution log**: harus ada "Setup selesai" dan alamat spreadsheet "Database — Jurnal HRD v2.6.0".

Setup membuat spreadsheet data serta mengisi Script Properties `SPREADSHEET_ID`, `TOKEN_SECRET`, dan `V26_PEPPER` secara otomatis. Bila tak sengaja dijalankan lagi, ia menolak dan tidak membuat duplikat.

### A3. Buat Admin pertama
1. **Project Settings → Script Properties → Add script property**, tambahkan dua baris:
   - `ADMIN_USERNAME` = nama pengguna Anda (huruf kecil, angka, titik, strip; 3 sampai 30 karakter)
   - `ADMIN_PASSWORD` = kata sandi Anda (minimal 8 karakter, ada huruf dan angka)
2. Kembali ke Editor, pilih fungsi **`buatAdminPertama`** → **Run**.
3. Log menampilkan "Admin pertama ... dibuat". `ADMIN_PASSWORD` **dihapus otomatis** dari Script Properties.

Kata sandi hanya diketik di Script Properties. Jangan menuliskannya di kode, di sheet, di GitHub, atau di chat ini.

### A4. Deploy
1. **Deploy → New deployment → Web app**.
2. Execute as: **Me**. Who has access: **Anyone**. (Siapa pun bisa menjangkau alamatnya, tetapi tanpa token masuk yang sah server menolak semua permintaan data.)
3. **Deploy** → salin URL yang berakhiran `/exec`.
4. Uji cepat: tempel URL itu di peramban. Harus muncul `{"success":true,"data":{"ok":true,...,"siap":true}}`.

Pembaruan berikutnya: **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. URL tidak berubah.

---

## Bagian B — Frontend (GitHub Pages)

### B1. Ekstrak dan isi alamat backend

```powershell
cd $HOME\Downloads
Expand-Archive .\jurnal-hrd_v2.6.0-t1r.zip -DestinationPath $HOME\Documents -Force
cd $HOME\Documents\jurnal-hrd
dir
```

`dir` **harus** menampilkan `index.html`, folder `css`, dan folder `js`. Folder `jurnal-hrd` inilah tempat `git init` dijalankan. Jangan naik satu tingkat dan jangan masuk lebih dalam.

Buka `js\config.js` dan ganti `TEMPEL_URL_EXEC_DI_SINI` dengan URL `/exec` dari langkah A4:

```powershell
notepad .\js\config.js
```

### B2. Buat repository di GitHub
github.com → **+** → **New repository** → nama `jurnal-hrd` → **Public** → jangan centang README/.gitignore/license → **Create repository**.

Repository publik aman di sini: isinya hanya tampilan dan alamat backend. Tidak ada kata sandi, token, atau data karyawan di dalamnya.

### B3. Kirim ke GitHub (dari folder `jurnal-hrd`)

```powershell
git init
git add .
git commit -m "Jurnal HRD v2.6.0-t1r"
git branch -M main
git remote add origin https://github.com/USERNAME/jurnal-hrd.git
git push -u origin main
```

Ganti `USERNAME`. Saat diminta Password, tempel **Personal Access Token** (bukan kata sandi akun); layar memang tidak menampilkan apa pun saat ditempel. Token dibuat di https://github.com/settings/tokens → Generate new token (classic) → centang **repo**. Jangan unggah lewat tombol "Upload files" di web GitHub karena struktur folder bisa rusak.

### B4. Aktifkan Pages
Repository → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/ (root)** → **Save** → centang **Enforce HTTPS**. Tunggu 1 sampai 2 menit, lalu buka `https://USERNAME.github.io/jurnal-hrd/`.

### B5. Memperbarui frontend nanti

```powershell
cd $HOME\Documents\jurnal-hrd
git add .
git commit -m "Pembaruan"
git push
```

---

## Bagian C — Satu putaran uji (sekitar 15 menit)

Tolong jalankan sekali jalan, lalu kabari nomor yang gagal beserta tangkapan layar (termasuk F12 → Console bila ada tulisan merah).

1. Buka alamat GitHub Pages: halaman depan tampil. Klik **Masuk**.
2. Masuk dengan sandi yang salah: muncul "Nama pengguna atau kata sandi salah".
3. Masuk dengan akun Admin: Dashboard terbuka. **Catat berapa detik** dari klik Masuk sampai Dashboard muncul.
4. Klik **Isi Data Contoh** (kanan atas): Dashboard menampilkan 5 grafik dan 56 karyawan.
5. **Pengguna → Tambah Pengguna**: buat satu akun berperan SPV.
6. **Master Data → Jabatan → Tambah Jabatan**: tersimpan.
7. **Divisi → Impor Excel**: unduh templat, tambah 2 baris, unggah, Proses Impor. Catat berapa detik.
8. **Pengaturan Grafik**: ganti satu grafik ke model lain, Simpan.
9. Klik lingkaran inisial (kanan atas) → **Keluar**.
10. Masuk sebagai SPV: menu Impor dan Pengguna tidak ada; Tambah Jabatan ditolak dengan pesan tidak punya izin.
11. Buka dari HP dengan alamat yang sama: menu pindah ke bawah, tabel menjadi kartu.
12. F12 → Console: tidak ada tulisan merah tentang CORS.

## Hak tiap peran

| Peran | Lihat data & grafik | Ubah Master Data | Impor | Grafik bawaan perusahaan | Kelola pengguna |
| --- | --- | --- | --- | --- | --- |
| Admin | Ya | Ya | Ya | Ya | Ya |
| Staf HR | Ya | Ya | Ya | — | — |
| SPV | Ya | — | — | — | — |
| Manager | Ya | — | — | — | — |
| Direktur | Ya | — | — | — | — |

Semua peran bisa mengatur grafik untuk dirinya sendiri. Susunan ini asumsi saya dari PRD bagian 2; ubah di `ROLE_PERMS` pada `Kode.gs` bila perlu.

## Bila ada masalah

| Gejala | Penyebab paling mungkin | Tindakan |
| --- | --- | --- |
| "Alamat backend belum diisi" | `js/config.js` belum diubah atau URL bukan `/exec` | Isi URL, lalu `git add .`, `git commit`, `git push` |
| "Backend belum disiapkan" | `setupAppEnvironment` belum dijalankan | Jalankan dari editor (A2) |
| "Koneksi ke server gagal" + tulisan CORS di Console | Akses deploy bukan **Anyone**, atau deployment belum versi baru | Manage deployments → pensil → Anyone → New version |
| Halaman 404 di GitHub Pages | `git init` dijalankan di folder yang salah | Buka repository di peramban: `index.html` harus terlihat di akar. Bila tidak, kabari saya |
| Halaman tanpa warna/tata letak | Folder `css` dan `js` tidak ikut terunggah | Kirim ulang lewat terminal, jangan lewat Upload files |
| Lupa sandi Admin satu-satunya | — | Kosongkan baris di sheet `APP_Pengguna`, isi lagi `ADMIN_USERNAME` dan `ADMIN_PASSWORD`, jalankan `buatAdminPertama` |
| Masuk terasa lama (lebih dari 3 detik) | Putaran hash terlalu tinggi untuk Apps Script | Kabari angkanya; `SEC_PUTARAN_` di `Kode.gs` bisa diturunkan |
