/* Jurnal HRD v2.7.0-b — modul layar DATA KARYAWAN: daftar + status akun absen selfie + unggah Database Karyawan (Excel/CSV) yang menyesuaikan diri.
   Judul kolom tidak harus sama: baris judul dicari sendiri, kolom dikenali lewat kamus, kolom baru ditambahkan otomatis, dan pemetaan bisa diubah sebelum disimpan. */
V26.modul.karyawan = (function () {
  'use strict';
  var h = V26.h, api = V26.api, ikon = V26.ikon, st = { el: null };
  var BAKU = ['No.REG', 'Nama', 'Status', 'Departemen', 'Dept Baru (Gaji)', 'Kepangkatan', 'Jabatan', 'Kemandoran', 'Sub Wilayah', 'Divisi', 'Golongan', 'Tanggal Masuk', 'Tempat Lahir', 'Tanggal Lahir', 'Gender', 'Status Pernikahan', 'No Telepon', 'NIK', 'No KPJ', 'No BPJS KS', 'Domisili / Penempatan', 'Pendidikan Terakhir', 'NPWP', 'Nama Bank', 'No Rekening', 'Nama Pemilik Rekening', 'Gaji Pokok'];
  var KABEL = { 'Aktif': 'ok', 'Menunggu aktivasi': 'awas', 'Belum ada': '' };

  function kepala(judul, sub, aksi) { return h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, judul), h('p.v26-redup', { gaya: 'margin-top:2px' }, sub)), h('div.v26-baris.bungkus', null, aksi)); }
  function pil(label, n, kelas) { return h('div.v26-pil', { kelas: kelas || '' }, h('span.v26-kecil', null, label), h('b', null, V26.angka(n))); }

  /* ---------- Daftar ---------- */
  function buka(el) { st.el = el; V26.rangkaBlok(el, 4); api('karDaftar', { hal: 1, ukuran: 1 }).then(function (d) { daftar(el, d); }, function (e) { V26.galatMuat(el, e, function () { buka(el); }); }); }
  function daftar(el, d) {
    var aksi = [];
    if (d.bolehAkun && d.ada) aksi.push(h('button.v26-btn', { type: 'button', onclick: function (e) {
      V26.konfirmasi('Sinkronkan akun absen selfie?', 'Karyawan yang punya No.REG dan tanggal lahir tetapi belum punya akun akan dibuatkan akun peran Karyawan. Akun yang sudah ada tidak diubah.', 'Sinkronkan').then(function (ya) {
        if (ya) V26.jalankan(e.currentTarget, function () { return api('karAkunSinkron', V26.reqId()); }, function (r) { return r.dibuat + ' akun baru dibuat'; }).then(function (r) { hasilAkun(r); buka(el); });
      });
    } }, ikon('orang'), 'Sinkron Akun Selfie'));
    if (d.bolehImpor) aksi.push(h('button.v26-btn.utama', { type: 'button', onclick: function () { unggah(el); } }, ikon('impor'), d.ada ? 'Unggah Database Excel' : 'Unggah Database Karyawan'));
    if (!d.ada || !d.ringkas.total) {
      return V26.isi(el, kepala('Data Karyawan', 'Database karyawan perusahaan. Dari sini akun absen selfie dibuat otomatis.', aksi),
        h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('orang'), h('p', null, 'Database karyawan belum diisi.'),
          h('p.v26-kecil.v26-redup', null, d.bolehImpor ? 'Unggah berkas Excel atau CSV database karyawan Anda. Nama kolom tidak harus sama persis; aplikasi menyesuaikan sendiri.' : 'Minta Admin mengunggah database karyawan.'),
          d.bolehImpor ? h('button.v26-btn.utama', { type: 'button', onclick: function () { unggah(el); } }, ikon('impor'), 'Unggah Database Karyawan') : null)));
    }
    var tbl = V26.tabel({ cari: 'Cari No.REG, nama, atau jabatan…', ukuran: 25, kosong: 'Belum ada karyawan.',
      filter: d.divisi.length ? [{ k: 'divisi', l: 'Semua divisi', pilihan: d.divisi.map(function (x) { return { k: x, n: x }; }) }] : [],
      muat: function (q) { return api('karDaftar', { hal: q.hal, ukuran: q.ukuran, q: q.q, divisi: q.filter.divisi || '' }); },
      kolom: [{ j: 'No.REG', isi: function (b) { return h('span.v26-mono', null, b.reg); } }, { j: 'Nama', judul: true, isi: function (b) { return h('b', null, b.nama); } },
        { j: 'Jabatan', isi: function (b) { return b.jabatan || '—'; } }, { j: 'Divisi', isi: function (b) { return b.divisi || '—'; } }, { j: 'Status', isi: function (b) { return b.status || '—'; } },
        { j: 'Akun', rata: 'tengah', isi: function (b) { return h('span.v26-lencana', { kelas: KABEL[b.akun] || '' }, b.akun); } },
        { j: 'Selfie', rata: 'tengah', isi: function (b) { return b.akun === 'Belum ada' ? h('span.v26-redup', null, '—') : h('span.v26-lencana', { kelas: b.selfie ? 'ok' : '' }, b.selfie ? 'Boleh' : 'Mati'); } },
        { j: 'Aksi', rata: 'tengah', isi: function (b) { return h('button.v26-btn.ikon', { type: 'button', title: 'Lihat detail', 'aria-label': 'Lihat detail ' + b.nama, onclick: function () { detail(b); } }, ikon('mata')); } }] });
    var r = d.ringkas;
    V26.isi(el, kepala('Data Karyawan', 'Setiap karyawan di sini otomatis punya akun absen selfie: nama pengguna = No.REG, kata sandi awal = tanggal lahir (DDMMYYYY), lalu wajib diganti saat masuk pertama.', aksi),
      h('div.v26-persamaan', null, pil('Karyawan', r.total, 'pr'), pil('Akun aktif', r.aktif, 'ok'), pil('Menunggu aktivasi', r.menunggu, r.menunggu ? 'awas' : ''), pil('Belum punya akun', r.total - r.adaAkun, r.total - r.adaAkun ? 'salah' : '')),
      r.total - r.adaAkun ? h('div.v26-pita.awas', null, ikon('awas'), h('span', null, (r.total - r.adaAkun) + ' karyawan belum punya akun, biasanya karena tanggal lahir atau No.REG belum terisi. Lengkapi di database lalu unggah ulang, atau tekan Sinkron Akun Selfie.')) : null,
      h('div.v26-kartu', null, tbl.el));
  }
  function detail(b) {
    var isi = h('div.v26-kolom', null, h('div.v26-rangka', { gaya: 'width:70%' }), h('div.v26-rangka', { gaya: 'width:50%' }));
    var L = V26.laci({ judul: b.nama, sub: 'No.REG ' + b.reg + ' · akun: ' + b.akun, isi: isi });
    api('karDetail', b.reg).then(function (r) {
      V26.isi(isi, h('dl.v26-dl', { gaya: 'margin:0;display:grid;grid-template-columns:minmax(120px,40%) 1fr;gap:8px 12px' }, r.isi.map(function (x) { return [h('dt.v26-kecil.v26-redup', null, x.k), h('dd', { gaya: 'margin:0;word-break:break-word' }, h('span.v26-mono', null, x.v))]; })),
        h('p.v26-kecil.v26-redup', { gaya: 'margin-top:12px' }, 'Data pribadi. Jangan dibagikan di luar yang berhak.'));
    }, function (e) { V26.isi(isi, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), e.message)); });
    return L;
  }
  function hasilAkun(a) {
    if (!a) return;
    V26.laci({ judul: 'Akun absen selfie', tengah: true, isi: [h('div.v26-persamaan', null, pil('Akun baru dibuat', a.dibuat, 'ok'), pil('Nama disamakan', a.diperbarui, ''), pil('Sudah ada', a.sudah, '')),
      a.tanpaTglLahir && a.tanpaTglLahir.length ? h('div.v26-pita.awas', null, ikon('awas'), h('div', null, h('b', null, a.tanpaTglLahir.length + ' karyawan belum bisa dibuatkan akun karena tanggal lahir kosong:'), h('ul', { gaya: 'margin:6px 0 0;padding-left:18px' }, a.tanpaTglLahir.slice(0, 15).map(function (x) { return h('li', null, x); })))) : null,
      h('p.v26-kecil.v26-redup', null, 'Karyawan masuk dengan nama pengguna = No.REG (huruf kecil) dan kata sandi sementara = tanggal lahir DDMMYYYY, lalu membuat kata sandi baru. Kata sandi sementara tidak disimpan.')] });
  }

  /* ---------- Unggah database ---------- */
  function unggah(el) {
    var info = h('div'), masuk = h('input', { type: 'file', accept: '.xlsx,.xls,.csv,.txt', gaya: 'display:none', 'aria-label': 'Pilih berkas database karyawan' });
    var jatuh = h('div.v26-jatuh', { role: 'button', tabindex: 0, 'aria-label': 'Pilih atau seret berkas Excel/CSV' }, ikon('impor'), h('b', null, 'Seret berkas ke sini atau klik untuk memilih'), h('span.v26-kecil.v26-redup', null, 'Excel (.xlsx, .xls) atau CSV · paling besar 8 MB · paling banyak 3.000 karyawan'));
    function terima(f) {
      if (!f) return; V26.isi(info, h('div.v26-kartu.isi', null, h('div.v26-rangka', { gaya: 'width:50%' })));
      V26.bacaBerkas(f, true).then(function (b) { pilihLembar(el, b, info); }, function (e) { V26.isi(info, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), e.message)); });
    }
    jatuh.addEventListener('click', function () { masuk.click(); });
    jatuh.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); masuk.click(); } });
    masuk.addEventListener('change', function () { terima(masuk.files[0]); masuk.value = ''; });
    ['dragenter', 'dragover'].forEach(function (n) { jatuh.addEventListener(n, function (e) { e.preventDefault(); jatuh.classList.add('di-atas'); }); });
    ['dragleave', 'drop'].forEach(function (n) { jatuh.addEventListener(n, function (e) { e.preventDefault(); jatuh.classList.remove('di-atas'); }); });
    jatuh.addEventListener('drop', function (e) { terima(e.dataTransfer.files[0]); });
    V26.isi(el, kepala('Unggah Database Karyawan', 'Langkah 1 dari 2 — pilih berkas. Belum ada yang disimpan sampai Anda menekan Simpan.', [h('button.v26-btn.hantu', { type: 'button', onclick: function () { buka(el); } }, ikon('kiri'), 'Kembali')]),
      h('div.v26-kartu.isi.v26-kolom', null, jatuh, masuk, h('div.v26-baris.v26-kecil.v26-redup', { gaya: 'align-items:flex-start' }, ikon('info'), 'Bentuk berkas bebas: baris judul dicari sendiri (judul dua baris juga bisa), kolom Usia dan Masa Kerja dihitung otomatis sehingga diabaikan, dan kolom yang belum dikenal ditambahkan sebagai kolom baru. Karyawan dicocokkan lewat No.REG. Isi sel kosong tidak menghapus data lama dan tidak ada karyawan yang dihapus.')), info);
  }
  function pilihLembar(el, berkas, info) {
    var lembar = berkas.lembar.filter(function (l) { return l.baris.length > 1; });
    if (!lembar.length) { V26.isi(info, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), 'Berkas kosong: tidak ada lembar yang berisi data.')); return; }
    var terbesar = 0; lembar.forEach(function (l, i) { if (l.baris.length > lembar[terbesar].baris.length) terbesar = i; });
    if (lembar.length === 1) return periksa(el, berkas.nama, lembar[0].baris, info);
    var pilih = h('select.v26-in', { 'aria-label': 'Lembar' }, lembar.map(function (l, i) { return h('option', { value: i, selected: i === terbesar }, l.nama + ' (' + l.baris.length + ' baris)'); }));
    V26.isi(info, h('div.v26-kartu.isi.v26-kolom', null, h('div.v26-medan', null, h('label', null, 'Lembar yang berisi database karyawan'), pilih), h('div', null, h('button.v26-btn.utama', { type: 'button', onclick: function () { periksa(el, berkas.nama, lembar[+pilih.value].baris, info); } }, 'Lanjut', ikon('kanan')))));
  }
  function periksa(el, nama, baris, info) {
    // buang kolom kosong di kanan agar kiriman ringan
    var lebar = 0; baris.forEach(function (b) { for (var i = b.length - 1; i >= 0; i--) if (b[i] !== '') { if (i + 1 > lebar) lebar = i + 1; break; } });
    var paket = { nama: nama, baris: baris.map(function (b) { return b.slice(0, lebar); }) };
    if (paket.baris.length > 3060) { V26.isi(info, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), 'Berkas lebih dari 3.000 baris. Pecah menjadi beberapa berkas.')); return; }
    var pilihan = {}, ulang = 0;
    V26.isi(info, h('div.v26-kartu.isi', null, h('div.v26-rangka', { gaya: 'width:60%' }), h('div.v26-rangka', { gaya: 'width:40%', }) ));
    function minta() {
      var nomor = ++ulang;
      return api('karImpor', paket, { peta: pilihan }).then(function (r) { if (nomor === ulang) tampil(r); }, function (e) { if (nomor === ulang) V26.isi(info, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), e.message)); });
    }
    function tampil(r) {
      var a = r.ringkas, bolehAkun = JH.boleh('pengguna.kelola'), akunPilih = h('input', { type: 'checkbox', id: 'kar-akun', checked: bolehAkun, disabled: !bolehAkun });
      var opsi = {}; r.kolomSheet.concat(BAKU).forEach(function (k) { opsi[k] = 1; });
      var petaTbl = h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Judul di berkas'), h('th', null, 'Disimpan ke kolom'), h('th.tengah', null, 'Keterangan'))),
        h('tbody', null, r.peta.map(function (p) {
          var sel = h('select.v26-in.padat', { 'aria-label': 'Kolom tujuan untuk ' + p.asal, gaya: 'min-width:180px' }, h('option', { value: '(abaikan)', selected: p.abai }, '(abaikan kolom ini)'),
            (!p.abai && !opsi[p.ke]) ? h('option', { value: p.ke, selected: true }, p.ke + ' (kolom baru)') : null,
            Object.keys(opsi).map(function (k) { return h('option', { value: k, selected: !p.abai && k === p.ke }, k); }));
          sel.addEventListener('change', function () { pilihan[p.norm] = sel.value; V26.isi(info, h('div.v26-kartu.isi', null, h('div.v26-rangka', { gaya: 'width:60%' }))); minta(); });
          var ket = p.abai ? (p.sumber === 'turunan' ? 'Dihitung otomatis' : 'Diabaikan') : p.baru ? 'Kolom baru' : p.sumber === 'ingatan' ? 'Diingat' : 'Dikenali';
          return h('tr', null, h('td.judul', { 'data-l': '' }, h('b', null, p.asal)), h('td', { 'data-l': 'Disimpan ke' }, sel), h('td.tengah', { 'data-l': 'Keterangan' }, h('span.v26-lencana', { kelas: p.abai ? '' : p.baru ? 'awas' : 'ok' }, ket)));
        })));
      var simpan = h('button.v26-btn.utama', { type: 'button', disabled: !(a.baru || a.diubah) }, ikon('simpan'), a.baru || a.diubah ? 'Simpan ke Database (' + (a.baru + a.diubah) + ' karyawan)' : 'Tidak ada perubahan');
      var reqId = V26.reqId();
      simpan.addEventListener('click', function () {
        V26.jalankan(simpan, function () { return api('karImpor', paket, { proses: true, peta: pilihan, akun: !!akunPilih.checked }, reqId); }).then(function (x) {
          V26.toast(x.tersimpan ? 'Database karyawan disimpan' : 'Tidak ada perubahan');
          V26.laci({ judul: 'Database karyawan disimpan', tengah: true, isi: [h('div.v26-persamaan', null, pil('Karyawan baru', x.ringkas.baru, 'ok'), pil('Diperbarui', x.ringkas.diubah, 'pr'), pil('Tidak berubah', x.ringkas.sama, ''), pil('Dilewati', x.ringkas.dilewati, x.ringkas.dilewati ? 'awas' : '')),
            h('p.v26-kecil.v26-redup', null, 'Setiap baris yang dibaca masuk salah satu hitungan di atas. Isi sel kosong tidak menghapus data lama.')], saatTutup: function () { hasilAkun(x.akun); } });
          V26.modul.karyawan.buka(el);
        }, function () { reqId = V26.reqId(); });
      });
      V26.isi(info,
        h('div.v26-kartu.isi.v26-kolom', null, h('div.v26-baris.bungkus', { gaya: 'gap:8px' }, h('b', null, 'Hasil pemeriksaan'), h('span.v26-kecil.v26-redup', null, 'Judul kolom di baris ' + (r.judulBaris[0] === r.judulBaris[1] ? r.judulBaris[0] : r.judulBaris[0] + '–' + r.judulBaris[1]) + ' · karyawan dicocokkan lewat ' + r.kunci)),
          h('div.v26-persamaan', null, pil('Baris dibaca', a.baris, 'pr'), pil('Karyawan baru', a.baru, 'ok'), pil('Akan diperbarui', a.diubah, a.diubah ? 'pr' : ''), pil('Tidak berubah', a.sama, ''), pil('Dilewati', a.dilewati, a.dilewati ? 'awas' : ''), pil('Kolom baru', a.kolomBaru, a.kolomBaru ? 'awas' : ''))),
        (r.peringatan || []).length ? h('div.v26-pita.awas', null, ikon('awas'), h('div', null, r.peringatan.map(function (w) { return h('p', { gaya: 'margin:0 0 4px' }, w); }))) : null,
        h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, 'Pemetaan kolom'), h('span.v26-kecil.v26-redup', null, 'Ubah bila ada kolom yang salah tempat. Pilihan Anda diingat untuk unggahan berikutnya.')), h('div.v26-gulung', null, petaTbl)),
        r.contoh.length ? h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, 'Contoh perubahan')), h('div.v26-gulung', null, h('table.v26-tabel', null, h('thead', null, h('tr', null, h('th', null, 'Baris'), h('th', null, 'No.REG'), h('th', null, 'Nama'), h('th', null, 'Tindakan'))),
          h('tbody', null, r.contoh.map(function (c) { return h('tr', null, h('td.v26-mono', null, c.baris), h('td.v26-mono', null, c.reg || '—'), h('td', null, c.nama), h('td', null, c.aksi === 'baru' ? h('span.v26-lencana.ok', null, 'Karyawan baru') : h('div', null, h('span.v26-lencana.pr', null, 'Diperbarui'), h('div.v26-kecil.v26-redup', null, (c.ubah || []).map(function (u) { return u.k + ': ' + (u.lama || '(kosong)') + ' → ' + u.baru; }).join(' · '))))); }))))) : null,
        r.dilewati.length ? h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, 'Baris yang dilewati'), h('span.v26-kecil.v26-redup', null, 'Tidak hilang diam-diam: ini alasannya.')), h('div.v26-gulung', null, h('table.v26-tabel', null, h('thead', null, h('tr', null, h('th', null, 'Baris'), h('th', null, 'Alasan'))), h('tbody', null, r.dilewati.map(function (d) { return h('tr', null, h('td.v26-mono', null, d.baris), h('td', null, d.alasan)); }))))) : null,
        h('div.v26-kartu.isi.v26-kolom', null, h('label.v26-baris', { gaya: 'gap:8px;align-items:flex-start' }, akunPilih, h('span', null, h('b', null, 'Buat akun absen selfie otomatis'), h('div.v26-kecil.v26-redup', null, bolehAkun ? 'Untuk setiap karyawan yang punya No.REG dan tanggal lahir. Nama pengguna = No.REG, kata sandi awal = tanggal lahir DDMMYYYY (tidak disimpan), wajib diganti saat masuk pertama.' : 'Hanya yang berhak mengelola pengguna yang bisa membuat akun. Data karyawan tetap disimpan.'))),
          h('div.v26-baris.bungkus', null, h('button.v26-btn.hantu', { type: 'button', onclick: function () { buka(el); } }, 'Batal'), simpan)));
    }
    minta();
  }
  return { buka: buka };
})();
