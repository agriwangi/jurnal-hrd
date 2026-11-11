/* Jurnal HRD v2.6.0-t1 — modul layar GRAFIK: Dashboard, W-16 Pengaturan Grafik, W-17 Galeri 42 Model & Penata Dashboard. Modul malas. */
V26.modul.grafik = (function () {
  'use strict';
  var h = V26.h, api = V26.api, ikon = V26.ikon, G = V26.grafik;
  var st = { awal: null, el: null };
  var KELOMPOK = ['Perbandingan', 'Tren waktu', 'Komposisi', 'Pencapaian', 'Sebaran', 'Hubungan & alur', 'Tabel visual'];
  var NAMA_BENTUK = { perbandingan: 'Perbandingan', tren: 'Tren waktu', komposisi: 'Komposisi', pencapaian: 'Pencapaian' };
  var ASAL = { bawaan: ['Bawaan aplikasi', ''], jenis: ['Bawaan per jenis data', 'info'], perusahaan: ['Bawaan perusahaan', 'pr'], pribadi: ['Pilihan saya', 'ok'] };
  function hp() { return window.matchMedia && window.matchMedia('(max-width:820px)').matches; }
  function muat(paksa) { return st.awal && !paksa ? Promise.resolve(st.awal) : api('grAwal').then(function (a) { st.awal = a; return a; }); }
  function model(id) { return st.awal.model.filter(function (m) { return m.id === id; })[0]; }
  function grafikById(id) { return st.awal.grafik.filter(function (g) { return g.id === id; })[0]; }
  function kepala(judul, sub, aksi) { return h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, judul), h('p.v26-redup', { gaya: 'margin-top:2px' }, sub)), h('div.v26-baris.bungkus', null, aksi)); }
  /** Menggambar ulang saat lebar wadah berubah (grafik selalu pas, di HP maupun desktop). */
  function pasangGambar(el, buat) {
    var lebar = 0, hasil = { v: null };
    function gbr() { var w = Math.floor(el.clientWidth); if (!w || w === lebar) return; lebar = w; hasil.v = buat(el); }
    if (window.ResizeObserver) new ResizeObserver(V26.tunda(gbr, 60)).observe(el);
    requestAnimationFrame(gbr); setTimeout(gbr, 120);
    return { hasil: hasil, ulang: function () { lebar = 0; gbr(); } };
  }

  /* ---------- Kartu grafik bersama ---------- */
  function kartuGrafik(g, o) {
    o = o || {}; var set = o.setelan || g.setelan, opsi = set.opsi || {}, judul = opsi.judul || g.judul, tampil = 'grafik', badan = h('div', { gaya: 'padding:14px 16px;min-height:120px' }), gbr = null;
    function parameter(tinggi) { return { model: set.model, data: g.data, bentuk: g.bentuk, satuan: g.satuan, opsi: opsi, judul: judul, tinggi: tinggi }; }
    function isiBadan() {
      V26.kosongkan(badan);
      if (tampil === 'tabel') { badan.appendChild(G.tabelData(g.data, g.satuan)); gbr = null; return; }
      var wadah = h('div'); badan.appendChild(wadah); gbr = pasangGambar(wadah, function (el) { return G.gambar(el, parameter(o.tinggi)); });
    }
    var seg = h('div.v26-segmen', { role: 'group', 'aria-label': 'Tampilan' });
    function gambarSeg() { V26.isi(seg, [['grafik', 'Grafik', 'grafik'], ['tabel', 'Tabel', 'tabel']].map(function (x) { return h('button', { type: 'button', kelas: tampil === x[0] ? 'aktif' : '', 'aria-pressed': tampil === x[0], title: x[1], 'aria-label': 'Tampilkan sebagai ' + x[1], gaya: 'padding:4px 8px;min-height:28px', onclick: function () { tampil = x[0]; gambarSeg(); isiBadan(); } }, ikon(x[2])); })); }
    function layarPenuh() {
      var w = h('div'), L = V26.laci({ judul: judul, sub: model(set.model).nama + ' · ' + g.lokasi, tengah: true, lebar: true, isi: [w, h('h3', null, 'Data di balik grafik'), G.tabelData(g.data, g.satuan)] });
      pasangGambar(w, function (el) { return G.gambar(el, parameter(Math.min(420, Math.round(window.innerHeight * .5)))); }); return L;
    }
    var m = model(set.model), alat = h('div.v26-baris', { gaya: 'gap:2px' }, seg,
      h('button.v26-btn.ikon', { type: 'button', title: 'Unduh gambar PNG', 'aria-label': 'Unduh gambar ' + judul, onclick: function (e) { if (tampil !== 'grafik') { tampil = 'grafik'; gambarSeg(); isiBadan(); } var t = e.currentTarget; setTimeout(function () { V26.jalankan(t, function () { return G.unduhPng(gbr && gbr.hasil.v, judul, judul.replace(/[^\w]+/g, '_')); }, 'Gambar diunduh'); }, 200); } }, ikon('gambar')),
      h('button.v26-btn.ikon', { type: 'button', title: 'Unduh data', 'aria-label': 'Unduh data ' + judul, onclick: function (e) { var d = G.dataKeBaris(g.data); V26.jalankan(e.currentTarget, function () { return V26.unduhTabel(judul.replace(/[^\w]+/g, '_'), d.kepala, d.baris); }); } }, ikon('unduh')),
      h('button.v26-btn.ikon', { type: 'button', title: 'Layar penuh', 'aria-label': 'Layar penuh ' + judul, onclick: layarPenuh }, ikon('penuh')),
      o.tanpaAtur ? null : h('a.v26-btn.ikon', { href: '#/grafik/' + g.id, title: set.dikunci ? 'Dikunci Admin' : 'Ganti model grafik', 'aria-label': 'Atur grafik ' + judul }, ikon(set.dikunci ? 'kunci' : 'ubah')));
    gambarSeg(); isiBadan();
    return h('div.v26-kartu', { gaya: o.gaya || '' }, h('div.kepala', null, h('div.v26-tumbuh', { gaya: 'min-width:170px' }, h('h3', null, judul), h('div.v26-kecil.v26-redup', null, m ? m.nama : set.model, g.satuan ? ' · ' + (g.satuan === 'rupiah' ? 'Rupiah' : g.satuan) : '')), alat), badan);
  }

  /* ---------- Dashboard ---------- */
  function susunan(a) {
    var s = (a.dashboard || []).filter(function (w) { return grafikById(w.id); }), ada = {}, punya = s.length > 0; s.forEach(function (w) { ada[w.id] = 1; });
    a.grafik.forEach(function (g) { if (!ada[g.id] && g.menu === 'Dashboard') s.push({ id: g.id, ukuran: g.id === 'kar_masuk' ? 12 : 6, tampil: !punya }); });
    return s;
  }
  function bukaDasbor(el) {
    st.el = el; V26.rangkaBlok(el, 5);
    Promise.all([muat(true), api('mdRingkas')]).then(function (r) {
      var a = r[0], rk = r[1], s = susunan(a).filter(function (w) { return w.tampil !== false; });
      function ubin(label, nilai, ket, href) { return h('a.v26-kartu.v26-ubin', { href: href, gaya: 'text-decoration:none;color:inherit' }, h('span.v26-kecil.v26-redup', null, label), h('span.nilai', null, nilai), h('span.v26-kecil.v26-redup', null, ket)); }
      var perlu = rk.perlu.jabatan + rk.perlu.golongan + rk.perlu.divisi + rk.perlu.status;
      V26.isi(el, kepala('Dashboard', 'Ringkasan data master dan karyawan. Setiap grafik bisa diganti modelnya tanpa mengubah angka.', [h('a.v26-btn', { href: '#/galeri' }, ikon('galeri'), 'Galeri Model'), h('a.v26-btn.utama', { href: '#/penata' }, ikon('dasbor'), 'Atur Dashboard')]),
        !rk.adaKaryawan ? h('div.v26-pita.info', null, ikon('info'), h('div.v26-tumbuh', { gaya: 'min-width:200px' }, h('b', null, 'Belum ada Data Karyawan'), h('div.v26-kecil', null, 'Grafik akan terisi begitu sheet Karyawan tersedia. Di proyek uji, Anda bisa mengisi data contoh dari menu atas.'))) : null,
        h('div.v26-kisi.k4', null, ubin('Karyawan', V26.angka(rk.karyawan), 'terbaca dari Data Karyawan', '#/master/jabatan'), ubin('Jabatan', V26.angka(rk.tab.jabatan), rk.tab.divisi + ' divisi · ' + rk.tab.golongan + ' golongan', '#/master/jabatan'),
          ubin('Di bawah UMK', rk.umk ? V26.angka(rk.bawahUmk) : '—', rk.umk ? 'UMK acuan ' + V26.rp(rk.umk) : 'UMK belum diisi', '#/master/golongan'), ubin('Perlu dipetakan', V26.angka(perlu), perlu ? 'isian karyawan belum cocok dengan master' : 'semua isian sudah cocok', '#/master/jabatan')),
        s.length ? h('div.v26-kanvas', null, s.map(function (w) { return kartuGrafik(grafikById(w.id), { gaya: 'grid-column:span ' + w.ukuran }); })) : h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('dasbor'), h('p', null, 'Semua grafik disembunyikan dari Dashboard.'), h('a.v26-btn.utama', { href: '#/penata' }, 'Atur Dashboard'))));
    }, function (e) { V26.galatMuat(el, e, function () { bukaDasbor(el); }); });
  }

  /* ---------- W-16 Pengaturan Grafik ---------- */
  function bukaAtur(el, id, modelAwal) {
    st.el = el; V26.rangkaBlok(el, 6);
    muat(!id).then(function (a) {
      var mobile = hp(), g = id ? grafikById(id) : (mobile ? null : a.grafik[0]);
      if (id && !g) { location.hash = '#/grafik'; return; }
      var daftar = panelDaftar(a, g), rinci = g ? panelRinci(a, g, modelAwal) : null;
      V26.isi(el, kepala('Pengaturan Grafik', 'Pilih model untuk tiap grafik. Angka tetap sama; hanya cara menampilkannya yang berubah.', [a.bolehPerusahaan ? h('button.v26-btn', { type: 'button', onclick: function () { laciJenis(a); } }, ikon('grafik'), 'Model Bawaan per Jenis Data') : null, h('a.v26-btn', { href: '#/galeri' }, ikon('galeri'), 'Galeri 42 Model')]),
        mobile ? (g ? [h('a.v26-btn.hantu', { href: '#/grafik', gaya: 'align-self:flex-start' }, ikon('kiri'), 'Semua grafik'), rinci] : daftar)
          : h('div.v26-dua', { gaya: 'display:grid;grid-template-columns:300px minmax(0,1fr);gap:16px;align-items:start' }, h('div', { gaya: 'position:sticky;top:72px' }, daftar), rinci));
    }, function (e) { V26.galatMuat(el, e, function () { bukaAtur(el, id, modelAwal); }); });
  }
  function panelDaftar(a, aktif) {
    var kotak = h('div.v26-daftar-grafik', { gaya: 'max-height:calc(100vh - 220px);overflow:auto' }), q = '';
    function gambar() {
      var cocok = a.grafik.filter(function (g) { return !q || (g.judul + ' ' + g.menu).toLowerCase().indexOf(q) >= 0; }), menu = [];
      cocok.forEach(function (g) { if (menu.indexOf(g.menu) < 0) menu.push(g.menu); });
      V26.isi(kotak, cocok.length ? menu.map(function (mn) {
        return [h('div.v26-kecil.v26-tebal.v26-redup', { gaya: 'padding:10px 14px 4px;text-transform:uppercase;letter-spacing:.04em;font-size:11px;background:var(--sf2)' }, mn), cocok.filter(function (g) { return g.menu === mn; }).map(function (g) {
          var m = model(g.setelan.model), as = ASAL[g.setelan.asal];
          return h('button', { type: 'button', kelas: aktif && aktif.id === g.id ? 'aktif' : '', 'aria-current': aktif && aktif.id === g.id ? 'true' : null, onclick: function () { location.hash = '#/grafik/' + g.id; } }, h('b', null, g.setelan.opsi.judul || g.judul),
            h('span.v26-baris.bungkus', { gaya: 'gap:6px' }, h('span.v26-kecil.v26-redup', null, m ? m.nama : ''), g.setelan.dikunci ? h('span.v26-lencana.kunci', null, ikon('kunci'), 'Dikunci') : (g.setelan.asal !== 'bawaan' ? h('span.v26-lencana', { kelas: as[1] }, as[0]) : null)));
        })];
      }) : h('div.v26-kosong', { gaya: 'padding:24px' }, h('p', null, 'Tidak ada grafik yang cocok.')));
    }
    gambar();
    return h('div.v26-kartu', null, h('div', { gaya: 'padding:12px;border-bottom:1px solid var(--bd)' }, h('label.v26-cari', null, ikon('cari'), h('input.v26-in.padat', { type: 'search', placeholder: 'Cari grafik…', 'aria-label': 'Cari grafik', oninput: V26.tunda(function (e) { q = e.target.value.toLowerCase().trim(); gambar(); }, 200) }))), kotak,
      h('div.v26-kaki', null, h('span', null, a.grafik.length + ' grafik'), h('span', null, 'Bertambah di tiap tahap')));
  }
  function panelRinci(a, g, modelAwal) {
    var set = g.setelan, draf = { model: modelAwal && g.cocok[modelAwal] && g.cocok[modelAwal].c !== 'tidak' ? modelAwal : set.model, opsi: JSON.parse(JSON.stringify(set.opsi || {})) }, kunciPribadi = set.dikunci && !a.bolehPerusahaan;
    var lingkup = a.bolehPerusahaan && set.asal === 'perusahaan' ? 'perusahaan' : 'pribadi', dikunci = !!set.dikunci, kelompokAktif = (model(draf.model) || {}).kelompok || 'Perbandingan';
    var pratinjau = h('div'), gbr = pasangGambar(pratinjau, function (el) { return G.gambar(el, { model: draf.model, data: g.data, bentuk: g.bentuk, satuan: g.satuan, opsi: draf.opsi, judul: draf.opsi.judul || g.judul }); });
    var judulPratinjau = h('h3'), subPratinjau = h('div.v26-kecil.v26-redup'), catatan = h('div'), ubinEl = h('div'), tabKel = h('div.v26-segmen', { role: 'tablist', 'aria-label': 'Kelompok model' }), berubah = !!(modelAwal && draf.model !== set.model);
    var simpan = h('button.v26-btn.utama', { type: 'button', disabled: kunciPribadi }, ikon('simpan'), 'Simpan'), status = h('span.v26-kecil.v26-redup');
    function segar() {
      var m = model(draf.model), c = g.cocok[draf.model];
      judulPratinjau.textContent = draf.opsi.judul || g.judul; subPratinjau.textContent = m.nama + ' · ' + NAMA_BENTUK[g.bentuk] + ' · ' + g.data.kategori.length + ' kategori, ' + g.data.seri.length + ' seri';
      V26.isi(catatan, c.c === 'kurang' ? h('div.v26-pita.awas', { gaya: 'padding:8px 12px;border-radius:8px' }, ikon('awas'), h('span.v26-kecil', null, 'Bisa dipakai, tetapi kurang cocok: ' + c.a + '.')) : null);
      status.textContent = berubah ? 'Ada perubahan yang belum disimpan' : 'Sesuai yang tersimpan'; gbr.ulang(); gambarUbin();
    }
    function ubah() { berubah = true; segar(); }
    function gambarUbin() {
      var ada = KELOMPOK.filter(function (k) { return a.model.some(function (m) { return m.kelompok === k && m.tahap === 1; }); });
      V26.isi(tabKel, ada.map(function (k) { return h('button', { type: 'button', role: 'tab', 'aria-selected': kelompokAktif === k, kelas: kelompokAktif === k ? 'aktif' : '', onclick: function () { kelompokAktif = k; gambarUbin(); } }, k, h('span.v26-kecil', { gaya: 'margin-left:6px;opacity:.7' }, a.model.filter(function (m) { return m.kelompok === k && m.tahap === 1 && g.cocok[m.id].c !== 'tidak'; }).length)); }));
      V26.isi(ubinEl, h('div', { gaya: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px' }, a.model.filter(function (m) { return m.kelompok === kelompokAktif && m.tahap === 1; }).map(function (m) {
        var c = g.cocok[m.id], mati = c.c === 'tidak' || kunciPribadi, mini = h('div.mini');
        if (c.c !== 'tidak') G.gambar(mini, { model: m.id, data: g.data, bentuk: g.bentuk, satuan: g.satuan, opsi: { palet: draf.opsi.palet }, mini: true, lebar: 112, tinggi: 62 }); else mini.appendChild(ikon('tutup'));
        return h('button.v26-ubin-model', { type: 'button', kelas: (draf.model === m.id ? 'aktif ' : '') + (mati ? 'mati' : ''), disabled: mati, 'aria-pressed': draf.model === m.id, title: c.a || m.untuk, onclick: function () { draf.model = m.id; ubah(); } }, mini, h('b.v26-kecil', null, m.nama),
          h('span.v26-lencana', { kelas: c.c === 'cocok' ? 'ok' : c.c === 'kurang' ? 'awas' : '', gaya: 'align-self:flex-start;height:auto;min-height:20px;white-space:normal;text-align:left;padding:2px 8px' }, c.c === 'cocok' ? 'Cocok' : c.c === 'kurang' ? 'Kurang cocok' : c.a));
      })));
    }
    // Opsi tampilan
    function medan(label, isi, bantu) { return h('div.v26-medan', null, h('label', null, label), isi, bantu ? h('small', null, bantu) : null); }
    function pilih(k, daftar, bawaan) { var s = h('select.v26-in.padat', { disabled: kunciPribadi, 'aria-label': k }, daftar.map(function (x) { return h('option', { value: x[0], selected: String(draf.opsi[k] == null ? bawaan : draf.opsi[k]) === String(x[0]) }, x[1]); })); s.addEventListener('change', function () { if (s.value === String(bawaan)) delete draf.opsi[k]; else draf.opsi[k] = /^\d+$/.test(s.value) ? +s.value : s.value; ubah(); }); return s; }
    function saklar(k, label, bawaan) { var c = h('input', { type: 'checkbox', checked: draf.opsi[k] == null ? bawaan : draf.opsi[k], disabled: kunciPribadi, 'aria-label': label }); c.addEventListener('change', function () { draf.opsi[k] = c.checked; ubah(); }); return h('label.v26-baris.antara', { gaya: 'min-height:36px;gap:12px' }, h('span', null, label), h('span.v26-saklar', null, c, h('span'))); }
    var inJudul = h('input.v26-in.padat', { type: 'text', maxlength: 80, value: draf.opsi.judul || '', placeholder: g.judul, disabled: kunciPribadi, 'aria-label': 'Judul grafik' });
    inJudul.addEventListener('input', V26.tunda(function () { if (inJudul.value.trim()) draf.opsi.judul = inJudul.value.trim(); else delete draf.opsi.judul; ubah(); }, 250));
    var segPalet = h('div.v26-baris.bungkus');
    function gambarPalet() { V26.isi(segPalet, Object.keys(G.PALET).map(function (p) { var aktif = (draf.opsi.palet || 'teal') === p; return h('button.v26-btn.kecil', { type: 'button', disabled: kunciPribadi, 'aria-pressed': aktif, gaya: aktif ? 'border:2px solid var(--pr)' : '', onclick: function () { if (p === 'teal') delete draf.opsi.palet; else draf.opsi.palet = p; gambarPalet(); ubah(); } }, G.PALET[p].slice(0, 4).map(function (w) { return h('i', { gaya: 'display:inline-block;width:10px;height:10px;border-radius:3px;background:' + w }); }), G.NAMA_PALET[p]); })); }
    gambarPalet();
    var inTarget = h('input.v26-in.padat.v26-angka', { type: 'text', inputmode: 'decimal', value: draf.opsi.nilaiTarget == null ? '' : String(draf.opsi.nilaiTarget).replace('.', ','), placeholder: g.data.target ? 'dari data' : 'tanpa target', disabled: kunciPribadi, 'aria-label': 'Nilai target' });
    inTarget.addEventListener('input', V26.tunda(function () { var v = inTarget.value.replace(/\./g, '').replace(',', '.'); if (v !== '' && !isNaN(+v)) draf.opsi.nilaiTarget = +v; else delete draf.opsi.nilaiTarget; ubah(); }, 300));
    var opsiKartu = h('div.v26-kartu', null, h('div.kepala', null, h('h3', null, 'Tampilan')), h('div.v26-kisi.k3', { gaya: 'padding:16px' },
      medan('Judul grafik', inJudul), medan('Warna', segPalet), medan('Letak legenda', pilih('legenda', [['bawah', 'Di bawah'], ['atas', 'Di atas'], ['kanan', 'Di kanan'], ['sembunyi', 'Sembunyikan']], 'bawah')),
      medan('Urutan', pilih('urut', [['asli', 'Sesuai data'], ['besar', 'Terbesar dulu'], ['kecil', 'Terkecil dulu'], ['abjad', 'Abjad']], 'asli'), g.bentuk === 'tren' ? 'Data tren selalu mengikuti urutan waktu.' : ''),
      medan('Tampilkan', pilih('atas', [[0, 'Semua kategori'], [3, '3 terbesar + Lainnya'], [5, '5 terbesar + Lainnya'], [8, '8 terbesar + Lainnya'], [10, '10 terbesar + Lainnya']], 0)),
      medan('Format angka', h('div.v26-baris', null, pilih('format', [['', 'Otomatis'], ['penuh', 'Angka penuh'], ['ribu', 'Ribuan (rb)'], ['juta', 'Jutaan (jt)'], ['persen', 'Persen dari total']], ''), pilih('desimal', [[0, '0 desimal'], [1, '1 desimal'], [2, '2 desimal']], 0))),
      h('div', null, saklar('label', 'Angka pada grafik', true), saklar('rata', 'Garis rata-rata', false)), h('div', null, saklar('target', 'Garis target', true), medan('Nilai target', inTarget))));
    // Lingkup
    var segL = h('div.v26-segmen', { role: 'group', 'aria-label': 'Berlaku untuk' }), kotakKunci = h('div');
    function gambarLingkup() {
      V26.isi(segL, [['pribadi', 'Untuk saya saja'], ['perusahaan', 'Bawaan perusahaan']].map(function (x) { return h('button', { type: 'button', kelas: lingkup === x[0] ? 'aktif' : '', 'aria-pressed': lingkup === x[0], onclick: function () { lingkup = x[0]; gambarLingkup(); } }, x[1]); }));
      var c = h('input', { type: 'checkbox', checked: dikunci, 'aria-label': 'Kunci agar seragam' }); c.addEventListener('change', function () { dikunci = c.checked; berubah = true; segar(); });
      V26.isi(kotakKunci, lingkup === 'perusahaan' ? h('label.v26-baris.antara', { gaya: 'min-height:40px;gap:12px' }, h('span', null, h('b', null, 'Kunci agar seragam'), h('div.v26-kecil.v26-redup', null, 'Semua pengguna melihat model ini dan tidak bisa menggantinya.')), h('span.v26-saklar', null, c, h('span'))) : h('p.v26-kecil.v26-redup', null, set.dikunci ? 'Grafik ini sedang dikunci. Pilihan pribadi baru berlaku setelah kunci dibuka dari Bawaan perusahaan.' : 'Hanya tampilan Anda yang berubah. Pengguna lain tetap melihat bawaan perusahaan.'));
    }
    if (a.bolehPerusahaan) gambarLingkup();
    simpan.addEventListener('click', function () {
      V26.jalankan(simpan, function () { return api('grSimpan', g.id, { model: draf.model, opsi: draf.opsi, dikunci: dikunci }, lingkup, V26.reqId()); }, lingkup === 'perusahaan' ? 'Tersimpan sebagai bawaan perusahaan' : 'Tersimpan untuk Anda')
        .then(function () { st.awal = null; bukaAtur(st.el, g.id); });
    });
    function reset(e) {
      var t = e.currentTarget;
      V26.konfirmasi('Kembalikan ke bawaan?', lingkup === 'perusahaan' ? 'Pengaturan bawaan perusahaan untuk grafik ini dihapus. Pilihan pribadi pengguna tidak ikut terhapus.' : 'Pilihan pribadi Anda untuk grafik ini dihapus dan grafik kembali mengikuti bawaan perusahaan.', 'Kembalikan').then(function (ya) {
        if (ya) V26.jalankan(t, function () { return api('grReset', g.id, lingkup, V26.reqId()); }, 'Dikembalikan ke bawaan').then(function () { st.awal = null; bukaAtur(st.el, g.id); });
      });
    }
    segar();
    var as = ASAL[set.asal];
    return h('div.v26-kolom', null,
      h('div.v26-kartu', null, h('div.kepala', null, h('div.v26-tumbuh', { gaya: 'min-width:200px' }, judulPratinjau, subPratinjau), h('div.v26-baris.bungkus', null, h('span.v26-lencana', null, g.lokasi), set.dikunci ? h('span.v26-lencana.kunci', null, ikon('kunci'), 'Dikunci Admin') : h('span.v26-lencana', { kelas: as[1] }, as[0]))),
        h('div', { gaya: 'padding:16px' }, pratinjau), h('div', { gaya: 'padding:0 16px 14px' }, catatan)),
      kunciPribadi ? h('div.v26-pita.info', null, ikon('kunci'), 'Grafik ini dikunci Admin agar seragam untuk semua pengguna. Anda tetap bisa melihat tabel dan mengunduh datanya.') : null,
      h('div.v26-kartu', null, h('div.kepala', null, h('div', null, h('h3', null, 'Model grafik'), h('div.v26-kecil.v26-redup', null, 'Model yang tidak sesuai bentuk data dinonaktifkan, sehingga pilihan apa pun selalu menghasilkan grafik yang benar.')), tabKel), h('div', { gaya: 'padding:16px' }, ubinEl)),
      opsiKartu,
      a.bolehPerusahaan ? h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:10px' }, h('h3', null, 'Berlaku untuk'), h('div', null, segL), kotakKunci) : null,
      h('div.v26-tempel', null, status, h('div.v26-baris', null, h('button.v26-btn', { type: 'button', disabled: kunciPribadi || set.asal === 'bawaan' || set.asal === 'jenis', onclick: reset }, ikon('segar'), 'Kembalikan ke Bawaan'), simpan)));
  }
  function laciJenis(a) {
    var pilih = {}, isi = Object.keys(NAMA_BENTUK).map(function (b) {
      var s = h('select.v26-in', { 'aria-label': 'Model bawaan ' + NAMA_BENTUK[b] }, h('option', { value: '' }, '— ikuti bawaan tiap grafik —'), a.model.filter(function (m) { return m.tahap === 1; }).map(function (m) { return h('option', { value: m.id, selected: a.jenis[b] === m.id }, m.kelompok + ' › ' + m.nama); })); pilih[b] = s;
      return h('div.v26-medan', null, h('label', null, 'Data ' + NAMA_BENTUK[b].toLowerCase()), s);
    }), simpan = h('button.v26-btn.utama', { type: 'button' }, 'Simpan');
    var L = V26.laci({ judul: 'Model Bawaan per Jenis Data', sub: 'Dipakai grafik yang belum punya pilihan sendiri. Bila modelnya tidak sesuai dengan data sebuah grafik, grafik itu tetap memakai model bawaannya.', isi: isi, kaki: [h('button.v26-btn.hantu', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'), simpan] });
    simpan.addEventListener('click', function () { var p = {}; for (var b in pilih) if (pilih[b].value) p[b] = pilih[b].value; V26.jalankan(simpan, function () { return api('grJenis', p, V26.reqId()); }, 'Model bawaan tersimpan').then(function () { L.tutup(); st.awal = null; bukaAtur(st.el, null); }); });
  }

  /* ---------- W-17 Galeri 42 Model ---------- */
  var CONTOH = {
    satu: { kategori: ['Afdeling I', 'Afdeling II', 'Pabrik', 'Kantor', 'Logistik', 'Keamanan'], seri: [{ nama: 'Karyawan', nilai: [42, 36, 28, 17, 12, 8] }] },
    multi: { kategori: ['Afdeling I', 'Afdeling II', 'Pabrik', 'Kantor'], seri: [{ nama: 'Tetap', nilai: [18, 15, 16, 12] }, { nama: 'Kontrak', nilai: [9, 8, 9, 4] }, { nama: 'Harian', nilai: [15, 13, 3, 1] }] },
    dua: { kategori: ['< 25', '25–34', '35–44', '45–54', '55+'], seri: [{ nama: 'Laki-laki', nilai: [14, 31, 26, 15, 6] }, { nama: 'Perempuan', nilai: [9, 18, 14, 7, 2] }] },
    tren: { kategori: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu'], seri: [{ nama: 'Karyawan masuk', nilai: [12, 18, 15, 22, 19, 27, 24, 31] }] },
    trenMulti: { kategori: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'], seri: [{ nama: 'Hadir', nilai: [120, 124, 122, 130, 133, 136] }, { nama: 'Cuti', nilai: [8, 6, 9, 7, 6, 8] }, { nama: 'Sakit', nilai: [5, 7, 6, 4, 5, 3] }] },
    alir: { kategori: ['Gaji pokok', 'Tunjangan', 'Lembur', 'BPJS', 'PPh 21', 'Potongan'], seri: [{ nama: 'Rupiah', nilai: [4200000, 650000, 380000, -168000, -95000, -120000] }] },
    corong: { kategori: ['Melamar', 'Lolos berkas', 'Psikotes', 'Wawancara', 'Diterima'], seri: [{ nama: 'Pelamar', nilai: [240, 132, 74, 31, 12] }] },
    capai: { kategori: ['Afdeling I', 'Afdeling II', 'Pabrik', 'Kantor'], seri: [{ nama: 'Realisasi', nilai: [92, 78, 104, 66] }], target: [100, 100, 100, 100] }
  };
  function contohUntuk(id) {
    var peta = { batang_kelompok: 'multi', batang_tumpuk: 'multi', batang_tumpuk100: 'multi', batang_garis: 'multi', piramida: 'dua', sunburst: 'multi', garis: 'tren', garis_halus: 'tren', garis_tingkat: 'tren', area: 'tren', area_tumpuk: 'trenMulti', area_tumpuk100: 'trenMulti', sparkline: 'tren', slope: 'trenMulti', air_terjun: 'alir', corong: 'corong', kpi: 'tren', speedometer: 'capai', cincin: 'capai', batang_kemajuan: 'capai', bullet: 'capai' };
    var k = peta[id] || 'satu', d = CONTOH[k];
    return { data: d, bentuk: /^tren/.test(k) ? 'tren' : k === 'capai' ? 'pencapaian' : (['pai', 'donat', 'setengah_donat', 'treemap', 'waffle', 'air_terjun', 'corong', 'sunburst'].indexOf(id) >= 0 ? 'komposisi' : 'perbandingan'), satuan: k === 'alir' ? 'rupiah' : k === 'capai' ? 'persen' : 'orang' };
  }
  function bukaGaleri(el) {
    st.el = el; V26.rangkaBlok(el, 6);
    muat().then(function (a) {
      var aktif = 'Semua', seg = h('div.v26-segmen', { role: 'tablist', 'aria-label': 'Kelompok' }), kisi = h('div');
      function gambar() {
        V26.isi(seg, ['Semua'].concat(KELOMPOK).map(function (k) { return h('button', { type: 'button', role: 'tab', 'aria-selected': aktif === k, kelas: aktif === k ? 'aktif' : '', onclick: function () { aktif = k; gambar(); } }, k, h('span.v26-kecil', { gaya: 'margin-left:6px;opacity:.7' }, k === 'Semua' ? a.model.length : a.model.filter(function (m) { return m.kelompok === k; }).length)); }));
        V26.isi(kisi, KELOMPOK.filter(function (k) { return aktif === 'Semua' || aktif === k; }).map(function (k) {
          return h('section.v26-kolom', { gaya: 'gap:10px;margin-bottom:20px' }, h('div.v26-baris', null, h('h2', null, k), h('span.v26-lencana', null, a.model.filter(function (m) { return m.kelompok === k; }).length + ' model')),
            h('div', { gaya: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px' }, a.model.filter(function (m) { return m.kelompok === k; }).map(function (m) {
              var mini = h('div.mini'), siap = m.tahap === 1, ct = contohUntuk(m.id);
              if (siap) G.gambar(mini, { model: m.id, data: ct.data, bentuk: ct.bentuk, satuan: ct.satuan, mini: true, lebar: 128, tinggi: 62 }); else G.glif(mini, m.id, 110, 62);
              return h('button.v26-ubin-model', { type: 'button', 'aria-label': m.nama + (siap ? '' : ', menyusul di v2.6.3'), onclick: function () { rincianModel(a, m); } }, mini, h('div.v26-baris', { gaya: 'gap:6px;align-items:flex-start' }, h('span.v26-mono.v26-redup', null, (m.no < 10 ? '0' : '') + m.no), h('b.v26-kecil', null, m.nama)),
                h('span.v26-kecil.v26-redup', { gaya: 'flex:1' }, m.untuk), h('span.v26-lencana', { kelas: siap ? 'ok' : '', gaya: 'align-self:flex-start' }, siap ? 'Tersedia' : 'Menyusul v2.6.3'));
            })));
        }));
      }
      gambar();
      V26.isi(el, kepala('Galeri Model Grafik', '42 model dalam 7 kelompok. 30 model sudah bisa dipakai; 12 sisanya menyusul di v2.6.3.', [h('a.v26-btn', { href: '#/grafik' }, ikon('grafik'), 'Pengaturan Grafik'), h('a.v26-btn.utama', { href: '#/penata' }, ikon('dasbor'), 'Penata Dashboard')]), h('div', null, seg), kisi);
    }, function (e) { V26.galatMuat(el, e, function () { bukaGaleri(el); }); });
  }
  function rincianModel(a, m) {
    var siap = m.tahap === 1, ct = contohUntuk(m.id), w = h('div'), bisa = siap ? a.grafik.filter(function (g) { return g.cocok[m.id].c !== 'tidak'; }) : [];
    var L = V26.laci({ judul: m.nama, sub: m.kelompok + ' · model nomor ' + m.no, tengah: true, lebar: true, isi: [
      siap ? h('div.v26-kartu.isi', null, h('div.v26-kecil.v26-redup', { gaya: 'margin-bottom:8px' }, 'Contoh dengan data peraga (bukan data perusahaan Anda)'), w) : h('div.v26-pita.info', null, ikon('info'), 'Model ini menyusul di v2.6.3 bersama kelompok Sebaran, Hubungan & alur, dan Tabel visual.'),
      h('div', null, h('h3', null, 'Cocok untuk'), h('p.v26-redup', null, m.untuk)),
      siap ? h('div', null, h('h3', { gaya: 'margin-bottom:8px' }, 'Bisa dipakai pada grafik Anda'), bisa.length ? h('div.v26-kolom', { gaya: 'gap:8px' }, bisa.map(function (g) {
        var c = g.cocok[m.id], dipakai = g.setelan.model === m.id;
        return h('div.v26-baris.antara.bungkus', { gaya: 'padding:8px 12px;border:1px solid var(--bd);border-radius:10px' }, h('div', null, h('b', null, g.setelan.opsi.judul || g.judul), h('div.v26-kecil.v26-redup', null, g.lokasi + (c.c === 'kurang' ? ' · kurang cocok: ' + c.a : ''))),
          dipakai ? h('span.v26-lencana.ok', null, ikon('cek'), 'Sedang dipakai') : h('button.v26-btn.kecil', { type: 'button', disabled: g.setelan.dikunci && !a.bolehPerusahaan, onclick: function () { L.tutup(); location.hash = '#/grafik/' + g.id + '/' + m.id; } }, 'Pakai untuk grafik ini'));
      })) : h('p.v26-redup', null, 'Belum ada grafik dengan bentuk data yang sesuai untuk model ini.')) : null] });
    if (siap) pasangGambar(w, function (el) { return G.gambar(el, { model: m.id, data: ct.data, bentuk: ct.bentuk, satuan: ct.satuan, opsi: {}, judul: m.nama }); });
  }

  /* ---------- W-17 Penata Dashboard ---------- */
  function bukaPenata(el) {
    st.el = el; V26.rangkaBlok(el, 6);
    muat(true).then(function (a) {
      var s = susunan(a).map(function (w) { return { id: w.id, ukuran: w.ukuran, tampil: w.tampil !== false }; }), lingkup = 'pribadi', daftar = h('div'), kanvas = h('div.v26-kanvas'), berubah = false, status = h('span.v26-kecil.v26-redup', null, 'Sesuai yang tersimpan');
      var UKURAN = [[4, 'Kecil (⅓)'], [6, 'Sedang (½)'], [8, 'Lebar (⅔)'], [12, 'Penuh']];
      function tandai() { berubah = true; status.textContent = 'Ada perubahan yang belum disimpan'; gambar(); }
      function pindah(i, ke) { if (ke < 0 || ke >= s.length) return; var x = s.splice(i, 1)[0]; s.splice(ke, 0, x); tandai(); }
      function gambar() {
        V26.isi(daftar, s.map(function (w, i) {
          var g = grafikById(w.id), c = h('input', { type: 'checkbox', checked: w.tampil, 'aria-label': 'Tampilkan ' + g.judul }), sel = h('select.v26-in.padat', { gaya: 'width:auto', 'aria-label': 'Ukuran ' + g.judul }, UKURAN.map(function (u) { return h('option', { value: u[0], selected: w.ukuran === u[0] }, u[1]); }));
          c.addEventListener('change', function () { w.tampil = c.checked; tandai(); }); sel.addEventListener('change', function () { w.ukuran = +sel.value; tandai(); });
          var baris = h('div.v26-baris.bungkus', { draggable: 'true', gaya: 'padding:10px 14px;border-bottom:1px solid var(--bd);gap:10px' + (w.tampil ? '' : ';opacity:.6') },
            h('span.v26-desktop', { gaya: 'cursor:grab;color:var(--rd)', title: 'Seret untuk memindahkan' }, ikon('geser')), h('span.v26-mono.v26-redup', null, i + 1),
            h('div.v26-tumbuh', { gaya: 'min-width:140px' }, h('b', null, g.setelan.opsi.judul || g.judul), h('div.v26-kecil.v26-redup', null, (model(g.setelan.model) || {}).nama)), sel,
            h('div.v26-baris', { gaya: 'gap:2px' }, h('button.v26-btn.ikon', { type: 'button', disabled: i === 0, 'aria-label': 'Naikkan ' + g.judul, title: 'Naikkan', onclick: function () { pindah(i, i - 1); } }, ikon('atas')), h('button.v26-btn.ikon', { type: 'button', disabled: i === s.length - 1, 'aria-label': 'Turunkan ' + g.judul, title: 'Turunkan', onclick: function () { pindah(i, i + 1); } }, ikon('bawah'))),
            h('span.v26-saklar', { title: 'Tampilkan di Dashboard' }, c, h('span')));
          baris.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; });
          baris.addEventListener('dragover', function (e) { e.preventDefault(); baris.style.background = 'var(--pr-t)'; }); baris.addEventListener('dragleave', function () { baris.style.background = ''; });
          baris.addEventListener('drop', function (e) { e.preventDefault(); baris.style.background = ''; var dari = parseInt(e.dataTransfer.getData('text/plain'), 10); if (!isNaN(dari) && dari !== i) pindah(dari, i); });
          return baris;
        }));
        var tampil = s.filter(function (w) { return w.tampil; });
        V26.isi(kanvas, tampil.length ? tampil.map(function (w) { return kartuGrafik(grafikById(w.id), { gaya: 'grid-column:span ' + w.ukuran, tinggi: 200, tanpaAtur: true }); }) : h('div.v26-kartu', { gaya: 'grid-column:1/-1' }, h('div.v26-kosong', null, h('p', null, 'Tidak ada grafik yang ditampilkan.'))));
      }
      gambar();
      var segL = h('div.v26-segmen', { role: 'group', 'aria-label': 'Berlaku untuk' });
      function gambarL() { V26.isi(segL, [['pribadi', 'Untuk saya saja'], ['perusahaan', 'Bawaan perusahaan']].map(function (x) { return h('button', { type: 'button', kelas: lingkup === x[0] ? 'aktif' : '', 'aria-pressed': lingkup === x[0], onclick: function () { lingkup = x[0]; gambarL(); } }, x[1]); })); }
      gambarL();
      var simpan = h('button.v26-btn.utama', { type: 'button' }, ikon('simpan'), 'Simpan Susunan');
      simpan.addEventListener('click', function () { V26.jalankan(simpan, function () { return api('grDashboard', s, lingkup, V26.reqId()); }, lingkup === 'perusahaan' ? 'Susunan tersimpan sebagai bawaan perusahaan' : 'Susunan tersimpan untuk Anda').then(function () { st.awal = null; berubah = false; status.textContent = 'Sesuai yang tersimpan'; }); });
      V26.isi(el, kepala('Penata Dashboard', 'Atur grafik mana yang tampil, urutannya, dan lebarnya. Di HP semua grafik otomatis selebar layar.', [h('a.v26-btn', { href: '#/galeri' }, ikon('galeri'), 'Galeri Model'), h('a.v26-btn', { href: '#/dasbor' }, ikon('mata'), 'Lihat Dashboard')]),
        h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, 'Susunan'), a.bolehPerusahaan ? segL : null), daftar),
        h('div.v26-baris', null, ikon('mata'), h('h2', null, 'Pratinjau')), kanvas,
        h('div.v26-tempel', null, status, h('div.v26-baris', null, h('button.v26-btn', { type: 'button', onclick: function (e) { var t = e.currentTarget; V26.konfirmasi('Kembalikan susunan bawaan?', 'Susunan ' + (lingkup === 'perusahaan' ? 'bawaan perusahaan' : 'pribadi Anda') + ' dihapus.', 'Kembalikan').then(function (ya) { if (ya) V26.jalankan(t, function () { return api('grDashboard', [], lingkup, V26.reqId()); }, 'Susunan dikembalikan').then(function () { bukaPenata(el); }); }); } }, ikon('segar'), 'Kembalikan'), simpan)));
    }, function (e) { V26.galatMuat(el, e, function () { bukaPenata(el); }); });
  }
  return { bukaDasbor: bukaDasbor, bukaAtur: bukaAtur, bukaGaleri: bukaGaleri, bukaPenata: bukaPenata, lupa: function () { st.awal = null; } };
})();
