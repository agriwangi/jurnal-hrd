/* Jurnal HRD v2.7.0-a — modul layar PENGATURAN (khusus Super Admin): pusat pengaturan, Hak Akses per peran, Akun & Absen Selfie.
   Server menolak semua aksi pengaturan untuk selain Super Admin; menu yang disembunyikan hanyalah kenyamanan. */
V26.modul.pengaturan = (function () {
  'use strict';
  var h = V26.h, ikon = V26.ikon, st = { el: null, tab: 'umum', awal: null };
  var TAB = [['umum', 'Ringkasan'], ['hak', 'Hak Akses'], ['akun', 'Akun & Selfie']];
  function pil(label, n, kelas) { return h('div.v26-pil', { kelas: kelas || '' }, h('span.v26-kecil', null, label), h('b', null, V26.angka(n))); }
  function kepala(judul, sub) { return h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, judul), h('p.v26-redup', { gaya: 'margin-top:2px' }, sub))); }

  function buka(el, tab) {
    st.el = el; st.tab = TAB.some(function (t) { return t[0] === tab; }) ? tab : 'umum'; V26.rangkaBlok(el, 4);
    JH.panggil('pgAwal').then(function (d) { st.awal = d; gambar(); }, function (e) { V26.galatMuat(el, e, function () { buka(el, tab); }); });
  }
  function gambar() {
    var el = st.el, d = st.awal, isiTab = h('div.v26-kolom', { gaya: 'gap:16px' });
    var tabs = h('div.v26-segmen', { role: 'tablist', 'aria-label': 'Bagian pengaturan' }, TAB.map(function (t) {
      return h('button', { type: 'button', role: 'tab', 'aria-selected': t[0] === st.tab ? 'true' : 'false', kelas: t[0] === st.tab ? 'aktif' : '', onclick: function () { st.tab = t[0]; history.replaceState(null, '', '#/pengaturan/' + t[0]); gambar(); } }, t[1]);
    }));
    V26.isi(el, kepala('Pengaturan', 'Pusat pengaturan aplikasi. Hanya Super Admin yang bisa membuka halaman ini.'), tabs, isiTab);
    if (st.tab === 'hak') hakAkses(isiTab, d); else if (st.tab === 'akun') akunSelfie(isiTab, d); else umum(isiTab, d);
  }

  /* ---------- Ringkasan ---------- */
  function umum(el, d) {
    var r = d.ringkas;
    function kartu(ik, judul, teks, href, tombol) { return h('a.v26-kartu.isi', { href: href, gaya: 'text-decoration:none;color:inherit;display:block' }, h('div.lp-ikon', null, ikon(ik)), h('h3', { gaya: 'margin:10px 0 4px' }, judul), h('p.v26-redup', null, teks), h('span.v26-kecil', { gaya: 'color:var(--pr);font-weight:600' }, tombol + ' ›')); }
    V26.isi(el,
      h('div.v26-persamaan', null, pil('Karyawan di database', d.karyawan, 'pr'), pil('Akun', r.akun, ''), pil('Akun aktif', r.aktif, 'ok'), pil('Menunggu aktivasi', r.menunggu, r.menunggu ? 'awas' : ''), pil('Selfie dimatikan', r.selfieMati, r.selfieMati ? 'awas' : '')),
      d.driveSiap === false ? h('div.v26-pita.awas', null, ikon('awas'), h('span', null, 'Penyimpanan foto absen belum diizinkan. Absen tetap tercatat (jam dan lokasi), tetapi fotonya tidak tersimpan. Ikuti bagian "Izin foto" di panduan pembaruan.')) : null,
      h('div.v26-kisi.k3', null,
        kartu('orang', 'Data Karyawan', 'Unggah database Excel. Format kolom boleh berubah: aplikasi menyesuaikan sendiri.', '#/karyawan', 'Buka Data Karyawan'),
        kartu('kunci', 'Hak Akses', 'Atur apa saja yang boleh dilakukan tiap peran. Berlaku seketika.', '#/pengaturan/hak', 'Atur Hak Akses'),
        kartu('kamera', 'Akun & Absen Selfie', 'Nyalakan atau matikan absen selfie per akun atau untuk semua sekaligus. Tautkan akun Anda sendiri sebagai karyawan.', '#/pengaturan/akun', 'Atur Akun'),
        kartu('lokasi', 'Titik Lokasi Absen', 'Titik, radius, akurasi GPS, dan jeda antar absen.', '#/lokasi', 'Atur Titik Lokasi'),
        kartu('master', 'Master Data', 'Jabatan, golongan gaji, divisi, status, kode absensi, kalender kerja.', '#/master', 'Buka Master Data'),
        kartu('kunci', 'Pengguna', 'Tambah, ubah, atau atur ulang akun. Super Admin satu-satunya yang boleh memberi peran Super Admin.', '#/pengguna', 'Kelola Pengguna')),
      h('div.v26-kecil.v26-redup', null, 'Versi aplikasi ' + d.versi));
  }

  /* ---------- Hak akses ---------- */
  function hakAkses(el, d) {
    var peranIni = null; try { peranIni = sessionStorage.getItem('jh-peran-atur'); } catch (e) {}
    var terpilih = d.peran.filter(function (p) { return p.nama === peranIni; })[0] || d.peran.filter(function (p) { return !p.tetap; })[0] || d.peran[0];
    function tampil() {
      var p = terpilih, pilih = {}; p.izin.forEach(function (k) { pilih[k] = 1; });
      var semuaIzin = p.izin.indexOf('*') >= 0, grup = {}; d.katalog.forEach(function (k) { (grup[k.grup] = grup[k.grup] || []).push(k); });
      var kotakIzin = {};
      var daftarIzin = Object.keys(grup).map(function (g) {
        return h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, g)), h('div', { gaya: 'padding:4px 16px 12px' }, grup[g].map(function (k) {
          var dibatasi = p.nama === 'Karyawan' && k.k !== 'selfie';
          var c = h('input', { type: 'checkbox', checked: semuaIzin || !!pilih[k.k], disabled: p.tetap || dibatasi, id: 'iz-' + k.k });
          kotakIzin[k.k] = c;
          return h('label.v26-baris', { gaya: 'gap:10px;min-height:40px;align-items:center;opacity:' + (dibatasi ? '.45' : '1'), for: 'iz-' + k.k }, c, h('span', null, k.label, h('span.v26-kecil.v26-redup', { gaya: 'margin-left:6px' }, k.k)));
        })));
      });
      var simpan = h('button.v26-btn.utama', { type: 'button', disabled: p.tetap }, ikon('simpan'), 'Simpan Hak Akses ' + p.nama);
      var bawaan = h('button.v26-btn', { type: 'button', disabled: p.tetap || !p.diubah }, ikon('segar'), 'Kembalikan ke Bawaan');
      simpan.addEventListener('click', function () {
        var izin = d.katalog.filter(function (k) { return kotakIzin[k.k] && kotakIzin[k.k].checked; }).map(function (k) { return k.k; });
        V26.jalankan(simpan, function () { return JH.panggil('pgSimpanPeran', { peran: p.nama, izin: izin }); }, 'Hak akses ' + p.nama + ' disimpan. Berlaku seketika.').then(function () { JH.lupa(); muatUlang(p.nama); });
      });
      bawaan.addEventListener('click', function () {
        V26.konfirmasi('Kembalikan ke bawaan?', 'Hak akses peran ' + p.nama + ' kembali ke pengaturan bawaan aplikasi.', 'Kembalikan').then(function (ya) {
          if (ya) V26.jalankan(bawaan, function () { return JH.panggil('pgSimpanPeran', { peran: p.nama, reset: true }); }, 'Dikembalikan ke bawaan').then(function () { JH.lupa(); muatUlang(p.nama); });
        });
      });
      var pilihPeran = h('div.v26-segmen', { role: 'tablist', 'aria-label': 'Pilih peran' }, d.peran.map(function (x) {
        return h('button', { type: 'button', role: 'tab', 'aria-selected': x.nama === p.nama ? 'true' : 'false', kelas: x.nama === p.nama ? 'aktif' : '', onclick: function () { try { sessionStorage.setItem('jh-peran-atur', x.nama); } catch (e) {} terpilih = x; tampil(); } }, x.nama, x.diubah ? ' •' : '');
      }));
      V26.isi(el, h('div.v26-kartu.isi.v26-kolom', null, h('b', null, 'Pilih peran yang diatur'), pilihPeran,
        p.tetap ? h('div.v26-pita.info', null, ikon('info'), h('span', null, p.nama + ' selalu berhak penuh dan tidak bisa dibatasi. Hanya Super Admin yang bisa membuka Pengaturan.')) :
          p.nama === 'Karyawan' ? h('div.v26-pita.info', null, ikon('info'), h('span', null, 'Peran Karyawan hanya bisa diberi izin absen selfie. Mematikan izin ini menghentikan absen selfie untuk semua karyawan.')) :
          h('div.v26-pita.info', null, ikon('info'), h('span', null, 'Centang yang boleh dilakukan peran ' + p.nama + '. Perubahan berlaku seketika; pengguna yang sedang masuk tidak perlu keluar. Menu Pengaturan hanya milik Super Admin dan tidak bisa diberikan.'))),
        daftarIzin, p.tetap ? null : h('div.v26-baris.bungkus', null, simpan, bawaan));
    }
    tampil();
  }
  function muatUlang(peran) { try { sessionStorage.setItem('jh-peran-atur', peran); } catch (e) {} JH.panggil('pgAwal').then(function (d) { st.awal = d; gambar(); }, function (e) { V26.toast(e.message, 'salah'); }); }

  /* ---------- Akun & selfie ---------- */
  function akunSelfie(el, d) {
    V26.rangkaBlok(el, 4);
    JH.panggil('listUsers').then(function (u) { gambarAkun(el, d, u); }, function (e) { V26.galatMuat(el, e, function () { akunSelfie(el, d); }); });
  }
  function gambarAkun(el, d, u) {
    var saya = JH.SESI.baca().user, q = '', badan = h('tbody'), hitung = h('span.v26-kecil.v26-redup');
    function aksiSemua(ya) {
      V26.konfirmasi(ya ? 'Nyalakan selfie untuk semua akun?' : 'Matikan selfie untuk semua akun?', ya ? 'Semua akun boleh absen selfie. Aturan titik lokasi tetap berlaku.' : 'Tidak ada akun yang bisa absen selfie sampai dinyalakan lagi. Pengaturan per akun ikut diganti.', ya ? 'Nyalakan Semua' : 'Matikan Semua', !ya).then(function (jawab) {
        if (jawab) V26.jalankan(null, function () { return JH.panggil('pgSelfieAkun', { semua: true, ya: ya }); }, function (r) { return r.diubah + ' akun diubah'; }).then(function () { JH.lupa(); buka(st.el, 'akun'); });
      });
    }
    function status(x) { return !x.aktif ? h('span.v26-lencana', null, 'Nonaktif') : x.menunggu ? h('span.v26-lencana.awas', null, 'Menunggu aktivasi') : h('span.v26-lencana.ok', null, 'Aktif'); }
    function gambarBaris() {
      var n = 0, kata = q.toLowerCase();
      V26.isi(badan, u.baris.filter(function (x) { return !kata || (x.nama + ' ' + x.username + ' ' + x.reg + ' ' + x.peran).toLowerCase().indexOf(kata) >= 0; }).map(function (x) {
        n++;
        var c = h('input', { type: 'checkbox', checked: x.selfie, 'aria-label': 'Selfie untuk ' + x.nama });
        c.addEventListener('change', function () {
          c.disabled = true;
          JH.panggil('pgSelfieAkun', { id: x.id, ya: c.checked }).then(function () { x.selfie = c.checked; JH.lupa(); V26.toast('Selfie ' + x.nama + (c.checked ? ' dinyalakan' : ' dimatikan')); }, function (e) { c.checked = !c.checked; V26.toast(e.message, 'salah'); }).finally(function () { c.disabled = false; });
        });
        return h('tr', { kelas: x.aktif ? '' : 'redup' }, h('td.judul', { 'data-l': '' }, h('b', null, x.nama)), h('td', { 'data-l': 'Pengguna' }, h('span.v26-mono', null, x.username), x.reg ? h('div.v26-kecil.v26-redup', null, 'No.REG ' + x.reg) : null),
          h('td', { 'data-l': 'Peran' }, h('span.v26-lencana', { kelas: x.peran === 'Super Admin' ? 'pr' : '' }, x.peran)), h('td.tengah', { 'data-l': 'Status' }, status(x)), h('td.tengah', { 'data-l': 'Selfie' }, h('span.v26-saklar', null, c, h('span'))));
      }));
      V26.isi(hitung, n + ' dari ' + u.baris.length + ' akun');
    }
    var cari = h('input.v26-in.padat', { type: 'search', placeholder: 'Cari nama, pengguna, No.REG…', 'aria-label': 'Cari akun', oninput: V26.tunda(function (e) { q = e.target.value; gambarBaris(); }) });
    gambarBaris();
    // tautkan akun saya
    var reg = h('input.v26-in', { type: 'text', value: saya.reg || '', maxlength: 30, placeholder: 'Contoh: AWB006', 'aria-label': 'No.REG saya', autocomplete: 'off' }), tautkan = h('button.v26-btn.utama', { type: 'button' }, 'Tautkan'), lepas = h('button.v26-btn.hantu', { type: 'button' }, 'Lepas Tautan');
    function kirimTautan(nilai, tombol) {
      V26.jalankan(tombol, function () { return JH.panggil('pgTautkanSaya', { reg: nilai }); }, nilai ? 'Akun Anda tertaut ke No.REG ' + nilai : 'Tautan dilepas').then(function (user) {
        var s = JH.SESI.baca(); s.user = user; JH.SESI.simpan(s); JH.lupa(); buka(st.el, 'akun');
      });
    }
    tautkan.addEventListener('click', function () { if (!reg.value.trim()) { V26.toast('Isi No.REG Anda dulu.', 'salah'); reg.focus(); return; } kirimTautan(reg.value.trim(), tautkan); });
    lepas.addEventListener('click', function () { kirimTautan('', lepas); });
    V26.isi(el,
      h('div.v26-persamaan', null, pil('Akun', d.ringkas.akun, ''), pil('Aktif', d.ringkas.aktif, 'ok'), pil('Menunggu aktivasi', d.ringkas.menunggu, d.ringkas.menunggu ? 'awas' : ''), pil('Selfie dimatikan', d.ringkas.selfieMati, d.ringkas.selfieMati ? 'awas' : '')),
      h('div.v26-kartu.isi.v26-kolom', null, h('h3', null, 'Saya juga karyawan'),
        h('p.v26-redup', null, saya.reg ? 'Akun Anda tertaut ke No.REG ' + saya.reg + '. Anda bisa absen selfie lewat menu Absen Selfie.' : 'Tautkan akun Super Admin Anda ke No.REG Anda di Database Karyawan supaya Anda bisa absen selfie seperti karyawan lain. Peran dan hak Anda sebagai Super Admin tidak berubah.'),
        h('div.v26-baris.bungkus', null, h('div.v26-medan', { gaya: 'flex:1;min-width:200px;margin:0' }, reg), tautkan, saya.reg ? lepas : null),
        h('p.v26-kecil.v26-redup', null, 'Jika akun karyawan otomatis untuk No.REG itu belum pernah dipakai, akun tersebut diambil alih dan digabung ke akun Anda.')),
      h('div.v26-kartu.isi.v26-kolom', null, h('h3', null, 'Absen selfie semua akun'),
        h('p.v26-redup', null, 'Karyawan di database otomatis punya akun dengan absen selfie menyala. Anda bisa menyalakan atau mematikannya per akun di tabel bawah, atau sekaligus untuk semua akun.'),
        h('div.v26-baris.bungkus', null, h('button.v26-btn.utama', { type: 'button', onclick: function () { aksiSemua(true); } }, ikon('kamera'), 'Nyalakan untuk Semua'), h('button.v26-btn.bahaya', { type: 'button', onclick: function () { aksiSemua(false); } }, 'Matikan untuk Semua'),
          h('button.v26-btn', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, function () { return V26.api('karAkunSinkron', V26.reqId()); }, function (r) { return r.dibuat + ' akun baru dibuat'; }).then(function () { JH.lupa(); buka(st.el, 'akun'); }); } }, ikon('orang'), 'Sinkron dari Database Karyawan'), h('a.v26-btn', { href: '#/pengguna' }, ikon('kunci'), 'Kelola Pengguna'))),
      h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, 'Akun'), cari), h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Nama'), h('th', null, 'Pengguna'), h('th', null, 'Peran'), h('th.tengah', null, 'Status'), h('th.tengah', null, 'Selfie'))), badan)), h('div.v26-kaki', null, hitung)));
  }
  return { buka: buka };
})();
