/* Jurnal HRD v2.6.0-t1r — js/app.js: halaman depan (landing), layar Masuk, kerangka aplikasi, penjaga rute, Pengguna, Akun. */
(function () {
  'use strict';
  var h = V26.h, ikon = V26.ikon, api = V26.api;
  var MENU = [['', 'Ringkasan'], ['dasbor', 'Dashboard', 'dasbor'], ['', 'Kehadiran'], ['absensi', 'Absensi', 'kalender'], ['', 'Pengaturan'], ['master', 'Master Data', 'master'], ['impor', 'Impor Data', 'impor', 'impor'], ['pengguna', 'Pengguna', 'kunci', 'pengguna.kelola'], ['', 'Grafik'], ['grafik', 'Pengaturan Grafik', 'grafik'], ['galeri', 'Galeri 42 Model', 'galeri'], ['penata', 'Penata Dashboard', 'geser']];
  var BAWAH = [['dasbor', 'Dashboard', 'dasbor'], ['absensi', 'Absensi', 'kalender'], ['master', 'Master', 'master'], ['impor', 'Impor', 'impor', 'impor'], ['grafik', 'Grafik', 'grafik'], ['galeri', 'Galeri', 'galeri']];
  var JUDUL = { dasbor: 'Dashboard', absensi: 'Absensi Bulanan', master: 'Master Data', impor: 'Impor Data', grafik: 'Pengaturan Grafik', galeri: 'Galeri Model Grafik', penata: 'Penata Dashboard', pengguna: 'Pengguna' };
  var IZIN_RUTE = { impor: 'impor', pengguna: 'pengguna.kelola' };
  var akar, halaman, remah, menuEl, bawahEl, kerangkaAda = false;

  function rute() { return location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent); }
  function arahkan() {
    var p = rute(), sesi = JH.SESI.baca();
    if (p[0] === '' || p[0] === 'beranda') { if (sesi) { location.hash = '#/dasbor'; return; } return depan(); }
    if (p[0] === 'masuk') { if (sesi) { location.hash = '#/dasbor'; return; } return layarMasuk(); }
    if (!sesi) { location.hash = '#/masuk'; return; }
    if (!JUDUL[p[0]] || (IZIN_RUTE[p[0]] && !JH.boleh(IZIN_RUTE[p[0]]))) { location.hash = '#/dasbor'; return; }   // menyembunyikan menu hanya kenyamanan; server tetap memeriksa izin
    if (!kerangkaAda) kerangka(sesi.user);
    var aktif = p[0];
    [menuEl, bawahEl].forEach(function (n) { Array.prototype.forEach.call(n.querySelectorAll('a'), function (a) { var ya = a.getAttribute('data-r') === aktif; a.classList.toggle('aktif', ya); if (ya) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); }); });
    V26.isi(remah, h('span.v26-redup.v26-desktop', null, 'Jurnal HRD  ›  '), h('b', null, JUDUL[aktif]));
    document.title = JUDUL[aktif] + ' — Jurnal HRD'; V26.kosongkan(halaman); window.scrollTo(0, 0);
    var M = V26.modul;
    if (aktif === 'master') M.master.buka(halaman, p[1]);
    else if (aktif === 'absensi') M.absensi.buka(halaman);
    else if (aktif === 'impor') M.impor.buka(halaman);
    else if (aktif === 'grafik') M.grafik.bukaAtur(halaman, p[1] || null, p[2] || null);
    else if (aktif === 'galeri') M.grafik.bukaGaleri(halaman);
    else if (aktif === 'penata') M.grafik.bukaPenata(halaman);
    else if (aktif === 'pengguna') halamanPengguna(halaman);
    else M.grafik.bukaDasbor(halaman);
  }
  function tombolTema() {
    var t = h('button.v26-btn.ikon', { type: 'button', title: 'Ganti tema', 'aria-label': 'Ganti tema terang atau gelap' }, ikon(V26.tema() === 'gelap' ? 'matahari' : 'bulan'));
    t.addEventListener('click', function () { var baru = V26.tema() === 'gelap' ? 'terang' : 'gelap'; V26.tema(baru); V26.isi(t, ikon(baru === 'gelap' ? 'matahari' : 'bulan')); if (kerangkaAda) arahkan(); });
    return t;
  }
  function bersih() { kerangkaAda = false; V26.kosongkan(akar); window.scrollTo(0, 0); }

  /* ---------- Halaman depan (landing) ---------- */
  function depan() {
    bersih(); document.title = 'Jurnal HRD — Absensi, payroll, dan data karyawan dalam satu tempat';
    var FITUR = [['master', 'Master Data rapi', 'Jabatan, golongan gaji, divisi, status, kode absensi, dan kalender kerja diatur sekali lalu dipakai semua menu.'],
      ['impor', 'Impor tanpa data hilang', 'Setiap berkas Excel diperiksa dulu. Baris yang tidak masuk selalu disebut beserta alasannya, dan impor bisa dibatalkan.'],
      ['grafik', '30 model grafik', 'Ganti model grafik kapan saja tanpa mengubah angka. Susun Dashboard sesuai kebutuhan tiap pengguna.'],
      ['kunci', 'Akses per peran', 'Admin, Staf HR, SPV, Manager, dan Direktur melihat dan mengubah hanya yang menjadi haknya. Semua perubahan tercatat.'],
      ['kalender', 'Sesuai cara kerja Anda', 'Zona waktu, pola 5 atau 6 hari, cut-off, tanggal gajian, dan hari libur perusahaan bisa diatur sendiri.'],
      ['dasbor', 'Nyaman di HP', 'Tampilan menyesuaikan layar: menu pindah ke bawah, tabel menjadi kartu, dengan pilihan tema terang dan gelap.']];
    V26.isi(akar, h('div.lp', null,
      h('header.lp-atas', null, h('div.v26-baris', null, h('div.v26-logo', null, 'JH'), h('b', { gaya: 'font-size:16px' }, 'Jurnal HRD')), h('div.v26-baris', null, tombolTema(), h('a.v26-btn.utama', { href: '#/masuk' }, 'Masuk'))),
      h('section.lp-hero', null, h('span.v26-lencana.pr', null, 'Versi 2.6.1 · Absensi'), h('h1', null, 'Data karyawan, absensi, dan payroll yang rapi dan bisa dipercaya'),
        h('p', null, 'Jurnal HRD membantu tim HR mengelola data dari satu tempat: cepat diisi, mudah diperiksa, dan setiap angka bisa ditelusuri asalnya.'),
        h('div.v26-baris.bungkus', { gaya: 'justify-content:center' }, h('a.v26-btn.utama', { href: '#/masuk', gaya: 'height:48px;padding:0 24px;font-size:15px' }, 'Masuk ke Aplikasi', ikon('kanan')), h('a.v26-btn', { href: '#fitur', gaya: 'height:48px;padding:0 20px', onclick: function (e) { e.preventDefault(); document.getElementById('fitur').scrollIntoView({ behavior: 'smooth' }); } }, 'Lihat Fitur'))),
      h('section.lp-fitur', { id: 'fitur' }, h('h2', null, 'Yang bisa dikerjakan sekarang'), h('div.v26-kisi.k3', null, FITUR.map(function (f) { return h('div.v26-kartu.isi', null, h('div.lp-ikon', null, ikon(f[0])), h('h3', { gaya: 'margin:10px 0 4px' }, f[1]), h('p.v26-redup', null, f[2])); }))),
      h('section.lp-fitur', null, h('h2', null, 'Mulai dalam tiga langkah'), h('div.v26-kisi.k3', null, [['1', 'Masuk', 'Pakai nama pengguna dan kata sandi dari Admin perusahaan Anda.'], ['2', 'Lengkapi Master Data', 'Isi langsung atau impor dari Excel yang sudah Anda punya.'], ['3', 'Pantau lewat Dashboard', 'Lihat ringkasan dan pilih model grafik yang paling mudah dibaca.']].map(function (l) {
        return h('div.v26-kartu.isi', null, h('div.lp-nomor', null, l[0]), h('h3', { gaya: 'margin:10px 0 4px' }, l[1]), h('p.v26-redup', null, l[2])); }))),
      h('footer.lp-kaki', null, h('span', null, 'Jurnal HRD v2.6.1'), h('span', null, 'Dibuat oleh A Mustopa F · Tlp. 085956686001'))));
  }

  /* ---------- Layar Masuk ---------- */
  function layarMasuk() {
    bersih(); document.title = 'Masuk — Jurnal HRD'; if (V26.modul.grafik) V26.modul.grafik.lupa();
    var un = h('input.v26-in', { type: 'text', id: 'jh-un', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false', maxlength: 60, required: true });
    var pw = h('input.v26-in', { type: 'password', id: 'jh-pw', autocomplete: 'current-password', maxlength: 100, required: true });
    var lihat = h('button.v26-btn.ikon', { type: 'button', 'aria-label': 'Tampilkan kata sandi', title: 'Tampilkan kata sandi', gaya: 'position:absolute;right:2px;top:2px' }, ikon('mata'));
    lihat.addEventListener('click', function () { pw.type = pw.type === 'password' ? 'text' : 'password'; lihat.setAttribute('aria-label', pw.type === 'password' ? 'Tampilkan kata sandi' : 'Sembunyikan kata sandi'); });
    var galat = h('div', { role: 'alert', 'aria-live': 'assertive' }), tombol = h('button.v26-btn.utama', { type: 'submit', gaya: 'width:100%;height:44px' }, 'Masuk');
    if (JH.pesanMasuk) { V26.isi(galat, h('div.v26-pita.info', { gaya: 'border-radius:8px;padding:8px 12px' }, ikon('info'), JH.pesanMasuk)); JH.pesanMasuk = ''; }
    if (!JH.siap()) V26.isi(galat, h('div.v26-pita.awas', { gaya: 'border-radius:8px;padding:8px 12px' }, ikon('awas'), h('span', null, 'Alamat backend belum diisi. Buka ', h('b', null, 'js/config.js'), ' lalu tempel URL /exec dari Apps Script.')));
    var form = h('form.v26-kolom', { novalidate: true, gaya: 'gap:14px' }, h('div.v26-medan', null, h('label', { for: 'jh-un' }, 'Nama pengguna'), un), h('div.v26-medan', null, h('label', { for: 'jh-pw' }, 'Kata sandi'), h('div', { gaya: 'position:relative' }, pw, lihat)), galat, tombol);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!un.value.trim() || !pw.value) { V26.isi(galat, h('div.v26-pita.salah', { gaya: 'border-radius:8px;padding:8px 12px' }, ikon('awas'), 'Isi nama pengguna dan kata sandi.')); (un.value.trim() ? pw : un).focus(); return; }
      tombol.disabled = true; tombol.textContent = 'Memeriksa…';
      JH.masuk(un.value, pw.value).then(function () { location.hash = '#/dasbor'; }, function (g) {
        tombol.disabled = false; tombol.textContent = 'Masuk'; pw.value = '';
        V26.isi(galat, h('div.v26-pita.salah', { gaya: 'border-radius:8px;padding:8px 12px' }, ikon('awas'), h('span.v26-tumbuh', null, g.message))); pw.focus();
      });
    });
    V26.isi(akar, h('div.lp-masuk', null, h('div.v26-kartu.isi', { gaya: 'width:100%;max-width:400px;padding:28px' }, h('div.v26-baris', { gaya: 'margin-bottom:18px' }, h('div.v26-logo', null, 'JH'), h('div', null, h('h1', { gaya: 'font-size:20px;line-height:26px' }, 'Masuk ke Jurnal HRD'), h('p.v26-kecil.v26-redup', null, 'Sesi berlaku 12 jam di perangkat ini.'))), form,
      h('p.v26-kecil.v26-redup', { gaya: 'margin-top:14px' }, 'Lupa kata sandi? Minta Admin perusahaan mengatur ulang dari menu Pengguna.'), h('a.v26-kecil', { href: '#/', gaya: 'color:var(--pr);display:inline-block;margin-top:8px' }, '‹ Kembali ke halaman depan'))));
    setTimeout(function () { un.focus(); }, 50);
  }

  /* ---------- Kerangka aplikasi ---------- */
  function tautan(m) { return h('a', { href: '#/' + m[0], 'data-r': m[0] }, ikon(m[2]), h('span', null, m[1])); }
  function kerangka(user) {
    kerangkaAda = true;
    var saring = function (d) { return d.filter(function (m, i) { return (!m[3] || JH.boleh(m[3])) && !(m[0] === '' && (!d[i + 1] || d[i + 1][0] === '')); }); };
    menuEl = h('nav.v26-menu', { 'aria-label': 'Menu utama' }, saring(MENU.filter(function (m) { return !m[3] || JH.boleh(m[3]); })).map(function (m) { return m[0] ? tautan(m) : h('small', null, m[1]); }));
    bawahEl = h('nav.v26-bawah', { 'aria-label': 'Menu utama' }, BAWAH.filter(function (m) { return !m[3] || JH.boleh(m[3]); }).map(tautan));
    remah = h('div.v26-baris.v26-tumbuh', { gaya: 'min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis' });
    halaman = h('main.v26-isi.v26-kolom', { id: 'v26-halaman' });
    var contoh = h('button.v26-btn.kecil.v26-sembunyi', { type: 'button' }, ikon('kotak'), h('span.v26-desktop', null, 'Isi Data Contoh'));
    contoh.addEventListener('click', function () {
      V26.konfirmasi('Isi data contoh?', 'Sheet Karyawan berisi 56 karyawan CONTOH akan dibuat supaya semua layar bisa dicoba. Hanya dijalankan bila sheet Karyawan belum ada. Jangan dipakai bila Anda akan langsung mengisi data sungguhan.', 'Isi Data Contoh').then(function (ya) {
        if (ya) V26.jalankan(contoh, function () { return api('ujiIsiContoh'); }, function (r) { return r.karyawan + ' karyawan contoh dibuat'; }).then(function () { contoh.classList.add('v26-sembunyi'); V26.modul.grafik.lupa(); arahkan(); });
      });
    });
    var akun = h('button.v26-avatar', { type: 'button', title: 'Akun: ' + user.nama, 'aria-label': 'Buka akun ' + user.nama, gaya: 'border:0;cursor:pointer' }, String(user.nama || '?').slice(0, 2).toUpperCase());
    akun.addEventListener('click', function () { laciAkun(user); });
    V26.isi(akar, h('div.v26-app', null,
      h('aside.v26-sisi', null, h('div.v26-merek', null, h('div.v26-logo', null, 'JH'), h('div', null, h('b', null, 'Jurnal HRD'), h('div.v26-kecil.v26-redup', null, 'v2.6.1-a'))), menuEl, h('div.v26-kecil.v26-redup', { gaya: 'padding:12px 16px;border-top:1px solid var(--bd)' }, 'A Mustopa F · 085956686001')),
      h('div.v26-utama', null, h('header.v26-atas', null, remah, h('div.v26-baris', null, contoh, h('div.v26-desktop', { gaya: 'text-align:right;line-height:15px' }, h('b.v26-kecil', null, user.nama), h('div.v26-kecil.v26-redup', null, user.peran)), akun, tombolTema())), halaman)), bawahEl);
    if (JH.boleh('admin')) api('ujiInfo').then(function (i) { if (!i.adaKaryawan) contoh.classList.remove('v26-sembunyi'); }, function () {});
  }
  function laciAkun(user) {
    var lama = h('input.v26-in', { type: 'password', autocomplete: 'current-password', maxlength: 100, 'aria-label': 'Kata sandi lama' }), baru = h('input.v26-in', { type: 'password', autocomplete: 'new-password', maxlength: 100, 'aria-label': 'Kata sandi baru' }), galat = h('div', { role: 'alert' });
    var simpan = h('button.v26-btn', { type: 'button' }, 'Ganti Kata Sandi'), keluar = h('button.v26-btn.bahaya', { type: 'button' }, ikon('tutup'), 'Keluar');
    var L = V26.laci({ judul: user.nama, sub: user.peran + ' · ' + user.username, isi: [h('h3', null, 'Ganti kata sandi'), h('div.v26-medan', null, h('label', null, 'Kata sandi lama'), lama), h('div.v26-medan', null, h('label', null, 'Kata sandi baru'), baru, h('small', null, 'Minimal 8 karakter, memuat huruf dan angka. Perangkat lain akan diminta masuk lagi.')), galat, h('div', null, simpan)], kaki: [h('span.v26-tumbuh'), keluar] });
    simpan.addEventListener('click', function () {
      V26.kosongkan(galat);
      V26.jalankan(simpan, function () { return JH.panggil('gantiSandi', { lama: lama.value, baru: baru.value }); }, 'Kata sandi diganti').then(function (d) { var s = JH.SESI.baca(); s.token = d.token; JH.SESI.simpan(s); L.tutup(); }, function (g) { V26.isi(galat, h('div.v26-pita.salah', { gaya: 'border-radius:8px;padding:8px 12px' }, g.message)); });
    });
    keluar.addEventListener('click', function () { keluar.disabled = true; JH.keluar().then(function () { L.tutup(); V26.modul.grafik.lupa(); location.hash = '#/masuk'; }); });
  }

  /* ---------- Pengguna (Admin) ---------- */
  function halamanPengguna(el) {
    V26.rangkaBlok(el, 4);
    JH.panggil('listUsers').then(function (d) {
      function form(lama) {
        var medan = [{ k: 'username', l: 'Nama pengguna', wajib: true, mati: !!lama, maks: 30, bantu: lama ? 'Nama pengguna tidak bisa diubah.' : '3 sampai 30 karakter: huruf kecil, angka, titik, atau strip.' }, { k: 'nama', l: 'Nama lengkap', wajib: true, maks: 80 },
          { k: 'peran', l: 'Peran', t: 'pilih', wajib: true, kosong: false, pilihan: d.peran }, { k: 'password', l: lama ? 'Atur ulang kata sandi (opsional)' : 'Kata sandi awal', wajib: !lama, maks: 100, bantu: 'Minimal 8 karakter, memuat huruf dan angka. Sampaikan langsung ke orangnya, jangan lewat grup.' }];
        if (lama) medan.push({ k: 'aktif', l: 'Akun aktif', t: 'saklar', ket: 'Bila dimatikan, pengguna langsung keluar dan tidak bisa masuk.' });
        V26.laciFormulir({ judul: lama ? 'Ubah Pengguna' : 'Tambah Pengguna', sub: lama ? lama.username : 'Pengguna baru langsung bisa masuk.', medan: medan, nilai: lama ? { username: lama.username, nama: lama.nama, peran: lama.peran, aktif: lama.aktif ? 'Ya' : 'Tidak' } : { peran: 'Staf HR' }, catatan: 'Mengganti peran, mematikan akun, atau mengatur ulang sandi mencabut sesi pengguna itu.',
          simpan: function (x) { var k = { nama: x.nama, peran: x.peran }; if (x.password) k.password = x.password; if (lama) { k.id = lama.id; k.aktif = x.aktif !== 'Tidak'; } else k.username = x.username; return JH.panggil('saveUser', k); }, selesai: function () { halamanPengguna(el); } });
      }
      V26.isi(el, h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, 'Pengguna'), h('p.v26-redup', { gaya: 'margin-top:2px' }, 'Siapa saja yang bisa masuk dan apa perannya. Kata sandi tidak pernah ditampilkan.')), h('button.v26-btn.utama', { type: 'button', onclick: function () { form(null); } }, ikon('tambah'), 'Tambah Pengguna')),
        h('div.v26-kartu', null, h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Nama'), h('th', null, 'Nama pengguna'), h('th', null, 'Peran'), h('th.tengah', null, 'Status'), h('th.tengah', null, 'Aksi'))),
          h('tbody', null, d.baris.map(function (u) { return h('tr', { kelas: u.aktif ? '' : 'redup' }, h('td.judul', { 'data-l': '' }, h('b', null, u.nama)), h('td', { 'data-l': 'Nama pengguna' }, h('span.v26-mono', null, u.username)), h('td', { 'data-l': 'Peran' }, h('span.v26-lencana', { kelas: u.peran === 'Admin' ? 'pr' : 'info' }, u.peran)), h('td.tengah', { 'data-l': 'Status' }, V26.lencanaAktif(u.aktif ? 'Ya' : 'Tidak')),
            h('td.tengah', { 'data-l': 'Aksi' }, h('button.v26-btn.ikon', { type: 'button', title: 'Ubah', 'aria-label': 'Ubah ' + u.username, onclick: function () { form(u); } }, ikon('ubah')))); })))), h('div.v26-kaki', null, h('span', null, d.baris.length + ' pengguna'))),
        h('div.v26-kartu.isi', null, h('h3', { gaya: 'margin-bottom:8px' }, 'Hak tiap peran'), h('div.v26-gulung', null, h('table.v26-tabel', null, h('thead', null, h('tr', null, ['Peran', 'Lihat data & grafik', 'Ubah Master Data', 'Impor', 'Grafik bawaan perusahaan', 'Kelola pengguna'].map(function (j) { return h('th', null, j); }))),
          h('tbody', null, [['Admin', 1, 1, 1, 1, 1], ['Staf HR', 1, 1, 1, 0, 0], ['SPV', 1, 0, 0, 0, 0], ['Manager', 1, 0, 0, 0, 0], ['Direktur', 1, 0, 0, 0, 0]].map(function (r) { return h('tr', null, r.map(function (v, i) { return h('td', null, i ? (v ? 'Ya' : '—') : h('b', null, v)); })); }))))));
    }, function (g) { V26.galatMuat(el, g, function () { halamanPengguna(el); }); });
  }

  function mulai() { akar = document.getElementById('v26'); V26.pasang(akar); window.addEventListener('hashchange', arahkan); arahkan(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mulai); else mulai();
})();
