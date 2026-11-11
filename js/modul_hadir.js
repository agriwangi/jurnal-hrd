/* Jurnal HRD v2.6.2-a — modul KEHADIRAN: (1) Absen Selfie dengan peta lokasi, (2) Log Kehadiran + unggah berkas mesin fingerprint,
   (3) Titik Lokasi Absen (hanya Admin). Semua pemeriksaan (radius, akurasi, izin) diulang di server; layar hanya membantu pengguna.
   Peta memakai Leaflet yang disimpan bersama aplikasi (js/vendor/leaflet.js); gambar petanya dari OpenStreetMap. Tanpa internet peta
   tidak tampil, tetapi jarak dan absen tetap berjalan. */
V26.modul.hadir = (function () {
  'use strict';
  var h = V26.h, api = V26.api, ikon = V26.ikon;
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  var VER = '2.6.2-a', bersihkan = [];
  function pp(n) { return (n < 10 ? '0' : '') + n; }
  function tglIndo(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? +m[3] + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] : iso; }
  function pita(jenis, isi) { return h('div.v26-pita', { kelas: jenis, role: jenis === 'salah' ? 'alert' : null, gaya: 'border-radius:8px;padding:8px 12px' }, ikon(jenis === 'ok' ? 'cek' : jenis === 'info' ? 'info' : 'awas'), h('span.v26-tumbuh', null, isi)); }
  function jarak(a, b, c, d) { var R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, s = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2); return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)); }
  /** Setiap layar mendaftarkan pembersihnya (kamera, GPS, pewaktu); dijalankan saat pindah layar. */
  function rapikan() { bersihkan.splice(0).forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('hashchange', rapikan);

  /* ---------- Peta ---------- */
  var janjiPeta = null;
  function muatPeta() {
    if (window.L && window.L.map) return Promise.resolve(window.L);
    if (!janjiPeta) janjiPeta = new Promise(function (ok, gagal) {
      var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'css/leaflet.css?v=' + VER; document.head.appendChild(c);
      var s = document.createElement('script'); s.src = 'js/vendor/leaflet.js?v=' + VER; s.onload = function () { ok(window.L); }; s.onerror = function () { janjiPeta = null; gagal(new Error('Peta tidak bisa dimuat.')); }; document.head.appendChild(s);
    });
    return janjiPeta;
  }
  /** Membuat peta di dalam el. Mengembalikan janji {L, peta} atau null bila peta tidak bisa dimuat. */
  function buatPeta(el, lat, lng, zum) {
    return muatPeta().then(function (L) {
      var peta = L.map(el, { zoomControl: true, attributionControl: true }).setView([lat, lng], zum || 16);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(peta);
      setTimeout(function () { peta.invalidateSize(); }, 150);
      bersihkan.push(function () { peta.remove(); });
      return { L: L, peta: peta };
    }, function () { V26.isi(el, h('div.v26-kosong', { gaya: 'padding:24px' }, ikon('lokasi'), h('p.v26-kecil', null, 'Peta tidak bisa dimuat (butuh internet). Jarak tetap dihitung dari koordinat.'))); return null; });
  }
  function gambarArea(P, area, warna) {
    return area.filter(function (a) { return isFinite(a.lat) && isFinite(a.lng); }).map(function (a) {
      var w = a.aktif === false ? '#94A3B8' : (warna || '#0F5F5C');
      P.L.circle([a.lat, a.lng], { radius: a.radius, color: w, weight: 2, fillColor: w, fillOpacity: 0.12 }).addTo(P.peta);
      return P.L.circleMarker([a.lat, a.lng], { radius: 5, color: w, fillColor: w, fillOpacity: 1 }).addTo(P.peta).bindTooltip(a.nama + ' · radius ' + a.radius + ' m');
    });
  }

  /* =================== 1) ABSEN SELFIE =================== */
  function bukaSelfie(el) {
    rapikan(); V26.rangkaBlok(el, 4);
    api('hadirAwal').then(function (d) { selfie(el, d); }, function (e) { V26.galatMuat(el, e, function () { bukaSelfie(el); }); });
  }
  function selfie(el, d) {
    var kepala = h('div', null, h('h1', null, 'Absen Selfie'), h('p.v26-redup', { gaya: 'margin-top:2px' }, d.nama + (d.reg ? ' · No.REG ' + d.reg : '')));
    if (!d.reg) return V26.isi(el, kepala, h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('orang'), h('p', null, 'Akun Anda belum ditautkan ke No.REG karyawan.'), h('p.v26-kecil.v26-redup', null, 'Minta Admin mengisi No.REG Anda di menu Pengguna, lalu keluar dan masuk lagi.'))));
    if (!d.aktif) return V26.isi(el, kepala, h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('kamera'), h('p', null, 'Absen selfie sedang dimatikan oleh Admin.'))));
    if (!d.area.length) return V26.isi(el, kepala, h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('lokasi'), h('p', null, 'Titik lokasi absen belum diatur.'), h('p.v26-kecil.v26-redup', null, JH.boleh('absensi.atur') ? 'Buka menu Titik Lokasi Absen untuk menambahkannya.' : 'Hubungi Admin perusahaan Anda.'), JH.boleh('absensi.atur') ? h('a.v26-btn.utama', { href: '#/lokasi' }, ikon('lokasi'), 'Atur Titik Lokasi') : null)));

    var pos = null, aliran = null, fotoBerkas = '', P = null, titikSaya = null, lingkarSaya = null, pernahPas = false;
    var video = h('video.v26-hadir-video', { autoplay: true, playsinline: true, muted: true, 'aria-label': 'Pratinjau kamera depan' });
    var kotakKamera = h('div.v26-hadir-kamera', null, video), pesanKamera = h('div'), pesanLokasi = h('div', { 'aria-live': 'polite' }), galat = h('div');
    var elPeta = h('div.v26-peta', { 'aria-label': 'Peta titik lokasi absen dan posisi Anda' });
    var jamEl = h('b.v26-angka', { gaya: 'font-size:22px' }, d.jam.slice(0, 5)), selisih = Date.now(), dasar = d.jam.split(':');
    var tombol = h('button.v26-btn.utama', { type: 'button', disabled: true, gaya: 'width:100%;height:52px;font-size:16px' }, ikon('kamera'), 'Menunggu lokasi…');
    var daftar = h('div.v26-kolom', { gaya: 'gap:8px' });
    var pilihFoto = h('input', { type: 'file', accept: 'image/*', capture: 'user', gaya: 'display:none', 'aria-label': 'Ambil foto selfie' });

    function gambarHari() {
      V26.isi(daftar, d.hariIni.length ? d.hariIni.map(function (x) { return h('div.v26-baris.antara', { gaya: 'padding:8px 12px;border:1px solid var(--bd);border-radius:10px' }, h('div.v26-baris', null, h('span.v26-lencana', { kelas: x.jenis === 'Masuk' ? 'ok' : 'pr' }, x.jenis), h('b.v26-angka', null, x.jam.slice(0, 5)), h('span.v26-kecil.v26-redup', null, x.sumber === 'Selfie' ? (x.area || '') + (x.jarak != null ? ' · ' + x.jarak + ' m' : '') : 'Mesin ' + (x.mesin || ''))), ikon('cek')); })
        : h('p.v26-kecil.v26-redup', null, 'Belum ada catatan hari ini.'));
    }
    function sudahSelfie() { return d.hariIni.filter(function (x) { return x.sumber === 'Selfie'; }).length; }
    function kameraSiap() { return !!(aliran && video.videoWidth) || !!fotoBerkas; }
    function nilai() {
      var label = sudahSelfie() ? 'Absen Pulang' : 'Absen Masuk', t = null;
      if (pos) d.area.forEach(function (a) { var j = jarak(pos.lat, pos.lng, a.lat, a.lng); if (!t || j - a.radius < t.j - t.a.radius) t = { a: a, j: j }; });
      var dalam = t && t.j <= t.a.radius, akurat = pos && pos.akurasi <= d.akurasiMaks, foto = !d.wajibFoto || kameraSiap();
      if (!pos) V26.isi(pesanLokasi, pita('info', 'Mencari lokasi Anda… Pastikan GPS menyala dan izin lokasi diberikan.'));
      else if (!akurat) V26.isi(pesanLokasi, pita('awas', 'Akurasi GPS ±' + Math.round(pos.akurasi) + ' m (batas ' + d.akurasiMaks + ' m). Pindah ke tempat terbuka dan tunggu sebentar.'));
      else if (!dalam) V26.isi(pesanLokasi, pita('salah', 'Anda ±' + Math.round(t.j) + ' m dari ' + t.a.nama + ' (batas ' + t.a.radius + ' m). Mendekatlah ke titik lokasi.'));
      else V26.isi(pesanLokasi, pita('ok', 'Di dalam area ' + t.a.nama + ' · ±' + Math.round(t.j) + ' m dari titik · akurasi ±' + Math.round(pos.akurasi) + ' m'));
      var siap = dalam && akurat && foto && !tombol.dataset.sibuk;
      tombol.disabled = !siap; V26.isi(tombol, ikon('kamera'), !pos ? 'Menunggu lokasi…' : !foto ? 'Menunggu kamera…' : label);
      if (P && pos) {
        if (!titikSaya) { lingkarSaya = P.L.circle([pos.lat, pos.lng], { radius: pos.akurasi, color: '#2563EB', weight: 1, fillColor: '#2563EB', fillOpacity: 0.12 }).addTo(P.peta); titikSaya = P.L.circleMarker([pos.lat, pos.lng], { radius: 7, color: '#fff', weight: 2, fillColor: '#2563EB', fillOpacity: 1 }).addTo(P.peta).bindTooltip('Posisi Anda'); }
        else { titikSaya.setLatLng([pos.lat, pos.lng]); lingkarSaya.setLatLng([pos.lat, pos.lng]); lingkarSaya.setRadius(pos.akurasi); }
        if (!pernahPas && t) { pernahPas = true; P.peta.fitBounds(P.L.latLngBounds([[pos.lat, pos.lng], [t.a.lat, t.a.lng]]).pad(0.5), { maxZoom: 18 }); }
      }
    }
    function ambilFoto() {
      if (fotoBerkas) return fotoBerkas;
      if (!aliran || !video.videoWidth) return '';
      var lebar = Math.min(480, video.videoWidth), tinggi = Math.round(video.videoHeight * lebar / video.videoWidth), kv = document.createElement('canvas'); kv.width = lebar; kv.height = tinggi;
      kv.getContext('2d').drawImage(video, 0, 0, lebar, tinggi); return kv.toDataURL('image/jpeg', 0.6);
    }
    function mulaiKamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { kameraGagal('Peramban ini tidak mendukung kamera langsung.'); return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }).then(function (s) {
        aliran = s; video.srcObject = s; video.addEventListener('loadedmetadata', nilai); V26.kosongkan(pesanKamera);
      }, function (e) { kameraGagal(e && e.name === 'NotAllowedError' ? 'Izin kamera ditolak. Izinkan kamera di pengaturan peramban, lalu muat ulang halaman.' : 'Kamera tidak bisa dibuka.'); });
    }
    function kameraGagal(pesan) {
      V26.isi(pesanKamera, pita('awas', pesan + (d.wajibFoto ? ' Anda tetap bisa memotret lewat tombol di bawah.' : '')), h('button.v26-btn', { type: 'button', gaya: 'margin-top:8px', onclick: function () { pilihFoto.click(); } }, ikon('kamera'), 'Ambil Foto')); nilai();
    }
    pilihFoto.addEventListener('change', function () {
      var f = pilihFoto.files[0]; pilihFoto.value = ''; if (!f) return;
      var url = URL.createObjectURL(f), g = new Image();
      g.onload = function () { var lebar = Math.min(480, g.width), kv = document.createElement('canvas'); kv.width = lebar; kv.height = Math.round(g.height * lebar / g.width); kv.getContext('2d').drawImage(g, 0, 0, kv.width, kv.height); fotoBerkas = kv.toDataURL('image/jpeg', 0.6); URL.revokeObjectURL(url); V26.isi(kotakKamera, h('img', { src: fotoBerkas, alt: 'Foto selfie yang akan dikirim', gaya: 'width:100%;display:block' })); nilai(); };
      g.onerror = function () { URL.revokeObjectURL(url); V26.toast('Foto tidak bisa dibaca.', 'salah'); }; g.src = url;
    });
    tombol.addEventListener('click', function () {
      V26.kosongkan(galat); var foto = ambilFoto();
      if (d.wajibFoto && !foto) { V26.isi(galat, pita('salah', 'Foto belum terambil. Tunggu kamera siap atau pakai tombol Ambil Foto.')); return; }
      V26.jalankan(tombol, function () { return api('hadirSelfie', { lat: pos.lat, lng: pos.lng, akurasi: pos.akurasi, foto: foto }, V26.reqId()); }, function (r) { return 'Absen ' + r.jenis + ' tercatat pukul ' + r.jam.slice(0, 5); }).then(function (r) {
        d.hariIni.push({ jenis: r.jenis, jam: r.jam, sumber: 'Selfie', area: r.area, jarak: r.jarak }); gambarHari();
        V26.isi(galat, pita('ok', 'Absen ' + r.jenis + ' tercatat pukul ' + r.jam.slice(0, 5) + ' di ' + r.area + '.' + (r.fotoTersimpan ? '' : ' Catatan tersimpan, tetapi foto belum bisa disimpan; beri tahu Admin.')));
        fotoBerkas = ''; nilai();
      }, function (e) { V26.isi(galat, pita('salah', e.message)); nilai(); });
    });

    V26.isi(el, h('div.v26-baris.antara.bungkus.lega', null, kepala, h('div', { gaya: 'text-align:right' }, jamEl, h('div.v26-kecil.v26-redup', null, tglIndo(d.tgl) + ' · jam server'))),
      h('div.v26-kisi.k2', null,
        h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:10px' }, h('h3', null, 'Kamera'), kotakKamera, pesanKamera, pilihFoto),
        h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:10px' }, h('h3', null, 'Lokasi'), elPeta, pesanLokasi)),
      h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:10px' }, galat, tombol, h('p.v26-kecil.v26-redup', null, 'Absen pertama hari ini dicatat sebagai Masuk, berikutnya sebagai Pulang. Jam diambil dari server, bukan dari HP.')),
      h('div.v26-kartu.isi', null, h('h3', { gaya: 'margin-bottom:8px' }, 'Catatan hari ini'), daftar));
    gambarHari(); nilai(); mulaiKamera();
    var a0 = d.area[0]; buatPeta(elPeta, a0.lat, a0.lng, 16).then(function (x) { if (!x) return; P = x; gambarArea(P, d.area); nilai(); });
    var pantau = null;
    if (navigator.geolocation) pantau = navigator.geolocation.watchPosition(function (g) { pos = { lat: g.coords.latitude, lng: g.coords.longitude, akurasi: g.coords.accuracy }; nilai(); },
      function (e) { pos = null; nilai(); V26.isi(pesanLokasi, pita('salah', e.code === 1 ? 'Izin lokasi ditolak. Izinkan lokasi di pengaturan peramban, lalu muat ulang halaman.' : 'Lokasi belum terbaca. Nyalakan GPS, pindah ke tempat terbuka, lalu tunggu sebentar.')); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
    else V26.isi(pesanLokasi, pita('salah', 'Peramban ini tidak mendukung pembacaan lokasi.'));
    var detak = setInterval(function () { var s = (+dasar[0] * 3600 + +dasar[1] * 60 + +dasar[2] + Math.floor((Date.now() - selisih) / 1000)) % 86400; jamEl.textContent = pp(Math.floor(s / 3600)) + ':' + pp(Math.floor(s / 60) % 60); }, 5000);
    bersihkan.push(function () { clearInterval(detak); if (pantau != null) navigator.geolocation.clearWatch(pantau); if (aliran) aliran.getTracks().forEach(function (t) { t.stop(); }); });
  }

  /* =================== 2) LOG KEHADIRAN + BERKAS MESIN =================== */
  var st = { el: null, th: 0, bl: 0, hal: 1, q: '', d: '', sumber: '' };
  function bukaLog(el) { rapikan(); st.el = el; if (!st.th) { var n = new Date(); st.th = n.getFullYear(); st.bl = n.getMonth() + 1; } muatLog(); }
  function muatLog(diam) {
    if (!diam) V26.rangkaBlok(st.el, 5);
    return api('hadirLog', st.th, st.bl, { hal: st.hal, ukuran: 50, q: st.q, d: st.d, sumber: st.sumber }).then(gambarLog, function (e) { V26.galatMuat(st.el, e, function () { muatLog(); }); });
  }
  function gambarLog(d) {
    var pilihBl = h('select.v26-in', { 'aria-label': 'Bulan', gaya: 'width:auto' }, BULAN.map(function (b, i) { return h('option', { value: i + 1, selected: i + 1 === d.bl }, b); })), thn = [];
    for (var y = d.th - 3; y <= d.th + 1; y++) thn.push(y);
    var pilihTh = h('select.v26-in', { 'aria-label': 'Tahun', gaya: 'width:auto' }, thn.map(function (y) { return h('option', { value: y, selected: y === d.th }, y); }));
    function ganti() { st.bl = +pilihBl.value; st.th = +pilihTh.value; st.hal = 1; st.d = ''; muatLog(); }
    pilihBl.addEventListener('change', ganti); pilihTh.addEventListener('change', ganti);
    function ubin(l, v, k) { return h('div.v26-kartu.v26-ubin', null, h('span.v26-kecil.v26-redup', null, l), h('span.nilai', null, V26.angka(v)), h('span.v26-kecil.v26-redup', null, k)); }
    var hariPil = [h('option', { value: '' }, 'Semua tanggal')]; for (var i = 1; i <= d.hari; i++) hariPil.push(h('option', { value: i, selected: String(i) === String(st.d) }, 'Tanggal ' + i));
    var cari = h('input.v26-in.padat', { type: 'search', placeholder: 'Cari No.REG atau nama…', value: st.q, 'aria-label': 'Cari karyawan', oninput: V26.tunda(function (e) { st.q = e.target.value.trim(); st.hal = 1; muatLog(true); }, 350) });
    var badan = d.baris.length ? d.baris.map(function (x) {
      return h('tr', null, h('td.judul', { 'data-l': '' }, h('b.v26-angka', null, x.jam.slice(0, 5)), h('div.v26-kecil.v26-redup', null, tglIndo(x.tgl))),
        h('td', { 'data-l': 'Karyawan' }, h('b', null, x.nama || '(tanpa nama)'), h('div.v26-kecil.v26-redup.v26-mono', null, x.reg)),
        h('td', { 'data-l': 'Sumber' }, h('span.v26-lencana', { kelas: x.sumber === 'Selfie' ? 'pr' : 'info' }, x.sumber === 'Selfie' ? 'Selfie' : 'Mesin'), ' ', h('span.v26-kecil', null, x.jenis)),
        h('td', { 'data-l': 'Lokasi / mesin' }, x.sumber === 'Selfie' ? (x.area || '—') + (x.jarak != null ? ' · ' + x.jarak + ' m' : '') : (x.mesin || '—')),
        h('td.tengah', { 'data-l': 'Foto' }, x.foto && d.bolehUbah ? h('button.v26-btn.ikon', { type: 'button', title: 'Lihat foto', 'aria-label': 'Lihat foto ' + (x.nama || x.reg), onclick: function () { lihatFoto(d, x); } }, ikon('gambar')) : (x.foto ? h('span.v26-kecil.v26-redup', null, 'ada') : '—')));
    }) : h('tr', null, h('td', { colspan: 5 }, h('div.v26-kosong', { gaya: 'padding:28px' }, ikon('riwayat'), h('p', null, d.ringkas.scan ? 'Tidak ada catatan yang cocok dengan saringan.' : 'Belum ada catatan kehadiran untuk ' + BULAN[d.bl - 1] + ' ' + d.th + '.'))));
    V26.isi(st.el, h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, 'Log Kehadiran'), h('p.v26-redup', { gaya: 'margin-top:2px' }, 'Semua absen selfie dan scan mesin. Setiap catatan baru otomatis mengisi matriks Absensi (K pada hari kerja, KL pada hari libur).')),
        h('div.v26-baris.bungkus', null, pilihBl, pilihTh, d.bolehAtur ? h('a.v26-btn', { href: '#/lokasi' }, ikon('lokasi'), 'Titik Lokasi') : null, d.bolehUbah ? h('button.v26-btn.utama', { type: 'button', onclick: laciMesin }, ikon('impor'), 'Unggah Berkas Mesin') : null)),
      h('div.v26-kisi.k4', null, ubin('Catatan bulan ini', d.ringkas.scan, 'selfie + mesin'), ubin('Absen selfie', d.ringkas.selfie, 'dari HP karyawan'), ubin('Scan mesin', d.ringkas.mesin, 'dari berkas mesin'), ubin('Orang-hari hadir', d.ringkas.orangHari, d.ringkas.orang + ' karyawan')),
      h('div.v26-kartu', null, h('div.kepala', null, h('div.v26-baris.bungkus.v26-tumbuh', null, h('label.v26-cari', { gaya: 'flex:1;min-width:180px;max-width:320px' }, ikon('cari'), cari),
          h('select.v26-in.padat', { gaya: 'width:auto', 'aria-label': 'Tanggal', onchange: function (e) { st.d = e.target.value; st.hal = 1; muatLog(true); } }, hariPil),
          h('select.v26-in.padat', { gaya: 'width:auto', 'aria-label': 'Sumber', onchange: function (e) { st.sumber = e.target.value; st.hal = 1; muatLog(true); } }, [['', 'Semua sumber'], ['Selfie', 'Selfie'], ['Mesin', 'Mesin']].map(function (o) { return h('option', { value: o[0], selected: st.sumber === o[0] }, o[1]); })))),
        h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Waktu'), h('th', null, 'Karyawan'), h('th', null, 'Sumber'), h('th', null, 'Lokasi / mesin'), h('th.tengah', null, 'Foto'))), h('tbody', null, badan))),
        h('div.v26-kaki', null, h('span', null, d.total ? 'Menampilkan ' + ((d.hal - 1) * 50 + 1) + '–' + ((d.hal - 1) * 50 + d.baris.length) + ' dari ' + V26.angka(d.total) + ' catatan' : '0 catatan'),
          d.jmlHal > 1 ? h('div.v26-baris', null, h('button.v26-btn.kecil', { type: 'button', disabled: d.hal <= 1, onclick: function () { st.hal--; muatLog(true); } }, 'Sebelumnya'), h('span', null, 'Halaman ' + d.hal + ' dari ' + d.jmlHal), h('button.v26-btn.kecil', { type: 'button', disabled: d.hal >= d.jmlHal, onclick: function () { st.hal++; muatLog(true); } }, 'Berikutnya')) : null)));
  }
  function lihatFoto(d, x) {
    var badan = h('div', null, h('div.v26-rangka', { gaya: 'width:100%;height:240px' }));
    V26.laci({ judul: x.nama || x.reg, sub: 'Selfie ' + x.jenis + ' · ' + tglIndo(x.tgl) + ' pukul ' + x.jam.slice(0, 5) + (x.area ? ' · ' + x.area : ''), tengah: true, isi: [badan] });
    api('hadirFoto', d.th, d.bl, x.id).then(function (r) { V26.isi(badan, h('img', { src: r.data, alt: 'Foto selfie ' + (x.nama || x.reg), gaya: 'width:100%;border-radius:10px;display:block' }), x.lat != null ? h('p.v26-kecil.v26-redup', { gaya: 'margin-top:8px' }, 'Koordinat ' + x.lat.toFixed(6) + ', ' + x.lng.toFixed(6) + ' · jarak ' + x.jarak + ' m · akurasi ±' + x.akurasi + ' m') : null); }, function (e) { V26.isi(badan, pita('salah', e.message)); });
  }
  /** Membaca berkas mesin apa adanya: teks (.dat/.txt/.log/.csv) atau Excel. Angka dan tanggal Excel dikirim mentah supaya tidak salah tafsir hari/bulan. */
  function bacaMesin(file) {
    var nm = file.name.toLowerCase();
    if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error('Berkas lebih dari 8 MB. Ekspor per bulan dari mesin lalu unggah satu per satu.'));
    if (/\.(xlsx|xls)$/.test(nm)) return V26.butuhXlsx().then(function () { return new Promise(function (ok, gagal) {
      var r = new FileReader();
      r.onload = function () { try { var wb = XLSX.read(r.result, { type: 'array', cellDates: false }); ok(wb.SheetNames.map(function (n) { return { nama: n, baris: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '', blankrows: false }) }; })); } catch (e) { gagal(new Error('Berkas Excel tidak bisa dibaca. Pastikan berkas tidak rusak atau terkunci sandi.')); } };
      r.onerror = function () { gagal(new Error('Berkas tidak bisa dibaca.')); }; r.readAsArrayBuffer(file);
    }); });
    if (!/\.(dat|txt|log|csv|tsv)$/.test(nm)) return Promise.reject(new Error('Jenis berkas tidak didukung. Pakai berkas ekspor mesin: .dat, .txt, .csv, .xls, atau .xlsx.'));
    return new Promise(function (ok, gagal) {
      var r = new FileReader();
      r.onload = function () { var t = String(r.result).replace(/^﻿/, ''), baris = t.indexOf('\t') >= 0 ? t.split(/\r?\n/).filter(function (b) { return b.trim() !== ''; }).map(function (b) { return b.split('\t').map(function (s) { return s.trim(); }); }) : V26.uraiCsv(t); ok([{ nama: 'Lembar 1', baris: baris }]); };
      r.onerror = function () { gagal(new Error('Berkas tidak bisa dibaca.')); }; r.readAsText(file);
    });
  }
  function laciMesin() {
    var badan = h('div.v26-kolom'), paket = null, masuk = h('input', { type: 'file', accept: '.dat,.txt,.log,.csv,.tsv,.xls,.xlsx', gaya: 'display:none', 'aria-label': 'Pilih berkas mesin absensi' });
    var mesin = h('input.v26-in', { type: 'text', maxlength: 40, placeholder: 'mis. Pos Satpam, Pabrik', id: 'v26-fp-mesin' }), proses = h('button.v26-btn.utama', { type: 'button', disabled: true }, ikon('cek'), 'Proses');
    var jatuh = h('div.v26-jatuh', { role: 'button', tabindex: 0 }, ikon('impor'), h('b', null, 'Pilih berkas ekspor mesin absensi'), h('span.v26-kecil.v26-redup', null, 'Merek apa pun: attlog.dat, .txt, .csv, .xls, .xlsx. Yang dibutuhkan hanya ID/PIN karyawan dan waktu scan.'));
    var L = V26.laci({ judul: 'Unggah Berkas Mesin Absensi', sub: 'Belum ada yang disimpan sampai Anda menekan Proses', tengah: true, lebar: true, isi: [jatuh, masuk, h('div.v26-medan', null, h('label', { for: 'v26-fp-mesin' }, 'Nama mesin (opsional)'), mesin), badan], kaki: [h('button.v26-btn.hantu', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'), proses] });
    jatuh.addEventListener('click', function () { masuk.click(); }); jatuh.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); masuk.click(); } });
    function pil(l, n, k) { return h('div.v26-pil', { kelas: k || '' }, h('span.v26-kecil', null, l), h('b', null, V26.angka(n))); }
    function periksa() {
      proses.disabled = true; V26.isi(badan, h('div.v26-rangka', { gaya: 'width:60%' }));
      api('fpImpor', paket, {}).then(function (p) {
        var t = p.hit; proses.disabled = !t.baru; V26.isi(proses, ikon('cek'), 'Proses (' + V26.angka(t.baru) + ' scan baru)');
        var isian = p.asing.map(function (a) { return { a: a, inp: h('input.v26-in.padat.v26-mono', { type: 'text', maxlength: 30, placeholder: 'No.REG', 'aria-label': 'No.REG untuk ID mesin ' + a.id, gaya: 'max-width:140px' }) }; });
        var simpanPeta = h('button.v26-btn', { type: 'button' }, ikon('simpan'), 'Simpan Padanan');
        simpanPeta.addEventListener('click', function () {
          var d = isian.filter(function (x) { return x.inp.value.trim() !== ''; }).map(function (x) { return { id: x.a.id, reg: x.inp.value.trim(), nama: x.a.nama }; });
          if (!d.length) { V26.toast('Isi No.REG untuk minimal satu ID mesin.', 'salah'); return; }
          V26.jalankan(simpanPeta, function () { return api('fpPetaSimpan', d, V26.reqId()); }, function (r) { return r.disimpan + ' padanan disimpan'; }).then(periksa, function () {});
        });
        V26.isi(badan, h('div.v26-baris.bungkus.v26-kecil.v26-redup', null, ikon('berkas'), h('b', { gaya: 'color:var(--tx)' }, paket.nama), h('span', null, '· ' + p.tebak.bentuk + ' · ID dari ' + p.tebak.id + ' · waktu dari ' + p.tebak.waktu + ' · urutan ' + p.tebak.urut)),
          h('div.v26-persamaan', null, pil('Scan dibaca', t.dibaca), h('b', null, '='), pil('Baru', t.baru, 'ok'), h('b', null, '+'), pil('Sudah ada', t.sudahAda), h('b', null, '+'), pil('Dobel', t.dobel), h('b', null, '+'), pil('Belum dipadankan', t.belumPeta, t.belumPeta ? 'salah' : ''), h('b', null, '+'), pil('Ditolak', t.ditolak, t.ditolak ? 'salah' : '')),
          h('p.v26-kecil', null, p.rentang ? 'Rentang ' + tglIndo(p.rentang[0]) + ' sampai ' + tglIndo(p.rentang[1]) + ' · ' : '', V26.angka(t.karyawan) + ' karyawan · ' + V26.angka(t.orangHari) + ' orang-hari · ' + V26.angka(t.tidakLengkap) + ' hari hanya satu scan'),
          p.asing.length ? h('div.v26-kartu.isi', { gaya: 'border-color:var(--er)' }, h('div.v26-baris.antara.bungkus', { gaya: 'margin-bottom:8px' }, h('div', null, h('b', null, p.asing.length + ' ID mesin belum dikenal'), h('div.v26-kecil.v26-redup', null, 'ID yang sama dengan No.REG dikenali otomatis. Sisanya isi No.REG-nya di sini, cukup sekali; scan-nya tidak disimpan sebelum dipadankan.')), simpanPeta),
            h('div.v26-gulung', { gaya: 'max-height:220px' }, h('table.v26-tabel', null, h('thead', null, h('tr', null, h('th', null, 'ID mesin'), h('th', null, 'Nama di mesin'), h('th.kanan', null, 'Scan'), h('th', null, 'No.REG'))), h('tbody', null, isian.map(function (x) { return h('tr', null, h('td.v26-mono', null, x.a.id), h('td', null, x.a.nama || '—'), h('td.kanan.v26-angka', null, x.a.scan), h('td', null, x.inp)); }))))) : null,
          t.ditolak ? h('div.v26-baris.antara.bungkus', null, h('span.v26-kecil', { gaya: 'color:var(--er)' }, t.ditolak + ' baris ditolak dan tidak disimpan.'), h('button.v26-btn.kecil', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, function () { return V26.unduhTabel('Scan_ditolak', ['Baris di berkas', 'ID mesin', 'Nama', 'Alasan'], p.ditolak); }); } }, ikon('unduh'), 'Unduh Baris Ditolak')) : null,
          p.baris.length ? h('div.v26-gulung', { gaya: 'max-height:240px;border:1px solid var(--bd);border-radius:10px' }, h('table.v26-tabel', null, h('thead', null, h('tr', null, h('th', null, 'Tanggal'), h('th', null, 'No.REG'), h('th', null, 'Nama'), h('th', null, 'Masuk'), h('th', null, 'Pulang'), h('th.kanan', null, 'Scan'), h('th.kanan', null, 'Baru'))),
            h('tbody', null, p.baris.slice(0, 150).map(function (b) { return h('tr', null, h('td', null, tglIndo(b.tgl)), h('td.v26-mono', null, b.reg), h('td', null, b.nama || '—'), h('td.v26-angka', null, b.masuk), h('td.v26-angka', null, b.pulang || h('span.v26-lencana.awas', { gaya: 'height:18px' }, 'satu scan')), h('td.kanan.v26-angka', null, b.scan), h('td.kanan.v26-angka', null, b.baru)); })))) : null,
          p.baris.length > 150 || p.terpotong ? h('p.v26-kecil.v26-redup', null, 'Menampilkan 150 orang-hari pertama dari ' + V26.angka(t.orangHari) + '; semuanya tetap diproses.') : null);
      }, function (g) { V26.isi(badan, pita('salah', g.message)); });
    }
    function pakaiLembar(lembar) {
      var isi = lembar.filter(function (l) { return l.baris.length > 0; }); if (!isi.length) { V26.isi(badan, pita('salah', 'Berkas kosong.')); return; }
      var pilih = 0; isi.forEach(function (l, i) { if (l.baris.length > isi[pilih].baris.length) pilih = i; });
      function pakai(i) { paket = { nama: paket.namaBerkas + (isi.length > 1 ? ' › ' + isi[i].nama : ''), namaBerkas: paket.namaBerkas, baris: isi[i].baris.slice(0, 20001).map(function (r) { return r.slice(0, 40); }) }; periksa(); }
      if (isi.length > 1) { var s = h('select.v26-in', { 'aria-label': 'Lembar', onchange: function () { pakai(+s.value); } }, isi.map(function (l, i) { return h('option', { value: i, selected: i === pilih }, 'Lembar "' + l.nama + '" (' + l.baris.length + ' baris)'); })); badan.parentNode.insertBefore(h('div.v26-medan', { id: 'v26-fp-lembar' }, h('label', null, 'Lembar yang dibaca'), s), badan); }
      pakai(pilih);
    }
    masuk.addEventListener('change', function () {
      var f = masuk.files[0]; masuk.value = ''; if (!f) return; var lama = document.getElementById('v26-fp-lembar'); if (lama) lama.remove();
      paket = { namaBerkas: f.name }; V26.isi(badan, h('div.v26-rangka', { gaya: 'width:50%' })); bacaMesin(f).then(pakaiLembar, function (g) { V26.isi(badan, pita('salah', g.message)); });
    });
    proses.addEventListener('click', function () {
      V26.jalankan(proses, function () { return api('fpImpor', { nama: paket.nama, baris: paket.baris }, { proses: true, mesin: mesin.value.trim() }, V26.reqId()); }, function (r) { return V26.angka(r.hit.baru) + ' scan disimpan, ' + V26.angka(r.selHadir) + ' hari ditandai hadir di Absensi'; }).then(function () { L.tutup(); st.hal = 1; muatLog(); }, function () {});
    });
  }

  /* =================== 3) TITIK LOKASI ABSEN (hanya Admin) =================== */
  function bukaAtur(el) {
    rapikan(); V26.rangkaBlok(el, 5);
    api('hadirAturAwal').then(function (d) { atur(el, d); }, function (e) { V26.galatMuat(el, e, function () { bukaAtur(el); }); });
  }
  function atur(el, d) {
    var elPeta = h('div.v26-peta', { gaya: 'height:320px', 'aria-label': 'Peta semua titik lokasi absen' }), S = d.setelan;
    function saklar(k, l, ket) { var c = h('input', { type: 'checkbox', checked: S[k] !== 'Tidak', id: 'v26-st-' + k }); return { k: k, ambil: function () { return c.checked ? 'Ya' : 'Tidak'; }, el: h('div.v26-medan', null, h('label', { for: 'v26-st-' + k }, l), h('div.v26-baris.antara', null, h('span.v26-redup.v26-kecil', null, ket), h('span.v26-saklar', null, c, h('span')))) }; }
    function angka(k, l, ket) { var i = h('input.v26-in.v26-angka', { type: 'text', inputmode: 'numeric', maxlength: 5, value: S[k], id: 'v26-st-' + k }); return { k: k, ambil: function () { return i.value.trim(); }, el: h('div.v26-medan', null, h('label', { for: 'v26-st-' + k }, l), i, h('small', null, ket)) }; }
    var medan = [saklar('Selfie_Aktif', 'Absen selfie aktif', 'Bila dimatikan, tidak ada yang bisa absen selfie.'), saklar('Wajib_Foto', 'Foto wajib', 'Absen ditolak bila foto tidak diambil.'),
      angka('Akurasi_Maks_m', 'Batas akurasi GPS (meter)', 'Absen ditolak bila akurasi HP lebih buruk dari angka ini. Bawaan 150.'), angka('Jeda_Menit', 'Jeda antar absen (menit)', 'Mencegah absen dobel karena tombol tertekan dua kali. 0 = tanpa jeda.'), angka('Simpan_Foto_Bulan', 'Masa simpan foto (bulan)', 'Foto yang lebih tua dihapus saat Anda menekan Bersihkan Foto Lama.')];
    var simpan = h('button.v26-btn.utama', { type: 'button' }, ikon('simpan'), 'Simpan Setelan'), bersih = h('button.v26-btn', { type: 'button' }, ikon('hapus'), 'Bersihkan Foto Lama');
    simpan.addEventListener('click', function () { var o = {}; medan.forEach(function (m) { o[m.k] = m.ambil(); }); V26.jalankan(simpan, function () { return api('hadirSetelanSimpan', o, V26.reqId()); }, 'Setelan disimpan').then(function () { bukaAtur(el); }, function () {}); });
    bersih.addEventListener('click', function () { V26.konfirmasi('Bersihkan foto lama?', 'Foto selfie yang lebih tua dari ' + S.Simpan_Foto_Bulan + ' bulan dipindahkan ke tempat sampah Google Drive. Catatan jam dan lokasinya tetap ada.', 'Bersihkan', true).then(function (ya) { if (ya) V26.jalankan(bersih, function () { return api('hadirBersihFoto', V26.reqId()); }, function (r) { return r.dihapus + ' foto dihapus' + (r.sisa ? '; masih ada sisa, tekan lagi' : ''); }).catch(function () {}); }); });
    V26.isi(el, h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, 'Titik Lokasi Absen'), h('p.v26-redup', { gaya: 'margin-top:2px' }, 'Karyawan hanya bisa absen selfie di dalam radius salah satu titik aktif. Halaman ini hanya bisa dibuka Admin.')),
        h('div.v26-baris.bungkus', null, h('a.v26-btn', { href: '#/kehadiran' }, ikon('riwayat'), 'Log Kehadiran'), h('button.v26-btn.utama', { type: 'button', onclick: function () { formArea(el, d, null); } }, ikon('tambah'), 'Tambah Titik'))),
      d.driveSiap ? null : h('div.v26-pita.awas', null, ikon('awas'), h('div.v26-tumbuh', null, h('b', null, 'Penyimpanan foto belum diizinkan.'), h('div.v26-kecil', null, 'Absen tetap tercatat (jam dan lokasi), tetapi fotonya tidak tersimpan. Ikuti bagian "Izin foto" di panduan pembaruan: tambah cakupan Drive di appsscript.json lalu jalankan izinkanFotoAbsen sekali.'))),
      h('div.v26-kartu', null, h('div.kepala', null, h('h3', null, 'Peta titik lokasi'), h('span.v26-kecil.v26-redup', null, d.area.length + ' titik')), d.area.length ? elPeta : h('div.v26-kosong', null, ikon('lokasi'), h('p', null, 'Belum ada titik lokasi.'), h('button.v26-btn.utama', { type: 'button', onclick: function () { formArea(el, d, null); } }, ikon('tambah'), 'Tambah Titik Pertama'))),
      d.area.length ? h('div.v26-kartu', null, h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Nama'), h('th', null, 'Kode'), h('th', null, 'Koordinat'), h('th.kanan', null, 'Radius'), h('th.tengah', null, 'Status'), h('th.tengah', null, 'Aksi'))),
        h('tbody', null, d.area.map(function (a) { return h('tr', { kelas: a.aktif ? '' : 'redup' }, h('td.judul', { 'data-l': '' }, h('b', null, a.nama)), h('td', { 'data-l': 'Kode' }, h('span.v26-mono', null, a.kode)), h('td', { 'data-l': 'Koordinat' }, h('span.v26-mono.v26-kecil', null, a.lat + ', ' + a.lng)), h('td.kanan.v26-angka', { 'data-l': 'Radius' }, a.radius + ' m'), h('td.tengah', { 'data-l': 'Status' }, V26.lencanaAktif(a.aktif ? 'Ya' : 'Tidak')),
          h('td.tengah', { 'data-l': 'Aksi' }, h('button.v26-btn.ikon', { type: 'button', title: 'Ubah', 'aria-label': 'Ubah titik ' + a.nama, onclick: function () { formArea(el, d, a); } }, ikon('ubah')))); }))))) : null,
      h('div.v26-kartu.isi.v26-kolom', null, h('h3', null, 'Setelan absen selfie'), h('div.v26-kisi.k2', null, medan.map(function (m) { return m.el; })), h('div.v26-baris.bungkus', null, simpan, bersih)));
    if (d.area.length) buatPeta(elPeta, d.area[0].lat, d.area[0].lng, 15).then(function (P) { if (!P) return; gambarArea(P, d.area); if (d.area.length > 1) P.peta.fitBounds(P.L.latLngBounds(d.area.map(function (a) { return [a.lat, a.lng]; })).pad(0.3), { maxZoom: 17 }); });
  }
  function formArea(el, d, lama) {
    var f = { kode: h('input.v26-in.v26-mono', { type: 'text', maxlength: 20, value: lama ? lama.kode : '', disabled: !!lama, id: 'v26-ar-kode' }), nama: h('input.v26-in', { type: 'text', maxlength: 80, value: lama ? lama.nama : '', id: 'v26-ar-nama' }),
      lat: h('input.v26-in.v26-mono', { type: 'text', inputmode: 'decimal', maxlength: 14, value: lama ? lama.lat : '', id: 'v26-ar-lat', placeholder: '-6.900000' }), lng: h('input.v26-in.v26-mono', { type: 'text', inputmode: 'decimal', maxlength: 14, value: lama ? lama.lng : '', id: 'v26-ar-lng', placeholder: '107.600000' }),
      radius: h('input.v26-in.v26-angka', { type: 'text', inputmode: 'numeric', maxlength: 4, value: lama ? lama.radius : '100', id: 'v26-ar-radius' }), aktif: h('input', { type: 'checkbox', checked: !lama || lama.aktif, id: 'v26-ar-aktif' }) };
    f.kode.addEventListener('input', function () { f.kode.value = f.kode.value.toUpperCase(); });
    var elPeta = h('div.v26-peta', { gaya: 'height:260px', 'aria-label': 'Klik peta untuk menaruh titik' }), galat = h('div'), P = null, titik = null, lingkar = null;
    function bil(v) { var n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : NaN; }
    function tandai(pusatkan) {
      var a = bil(f.lat.value), b = bil(f.lng.value), r = bil(f.radius.value); if (!P || !isFinite(a) || !isFinite(b)) return;
      if (!titik) { lingkar = P.L.circle([a, b], { radius: r > 0 ? r : 100, color: '#0F5F5C', weight: 2, fillColor: '#0F5F5C', fillOpacity: 0.15 }).addTo(P.peta); titik = P.L.circleMarker([a, b], { radius: 6, color: '#0F5F5C', fillColor: '#0F5F5C', fillOpacity: 1 }).addTo(P.peta); }
      else { titik.setLatLng([a, b]); lingkar.setLatLng([a, b]); if (r > 0) lingkar.setRadius(r); }
      if (pusatkan) P.peta.setView([a, b], Math.max(P.peta.getZoom(), 16));
    }
    [f.lat, f.lng].forEach(function (i) { i.addEventListener('change', function () { tandai(true); }); }); f.radius.addEventListener('input', function () { tandai(false); });
    var disini = h('button.v26-btn', { type: 'button' }, ikon('lokasi'), 'Pakai Lokasi Saya Sekarang');
    disini.addEventListener('click', function () {
      if (!navigator.geolocation) { V26.toast('Peramban ini tidak mendukung pembacaan lokasi.', 'salah'); return; }
      disini.disabled = true;
      navigator.geolocation.getCurrentPosition(function (g) { disini.disabled = false; f.lat.value = g.coords.latitude.toFixed(6); f.lng.value = g.coords.longitude.toFixed(6); tandai(true); V26.toast('Lokasi terbaca, akurasi ±' + Math.round(g.coords.accuracy) + ' m'); }, function () { disini.disabled = false; V26.toast('Lokasi tidak terbaca. Izinkan akses lokasi lalu coba lagi.', 'salah'); }, { enableHighAccuracy: true, timeout: 20000 });
    });
    var simpan = h('button.v26-btn.utama', { type: 'button' }, ikon('simpan'), 'Simpan');
    var L = V26.laci({ judul: lama ? 'Ubah Titik Lokasi' : 'Tambah Titik Lokasi', sub: 'Klik peta, isi koordinat, atau pakai lokasi Anda saat ini.', tengah: true, lebar: true, saatTutup: function () { if (P) { try { P.peta.remove(); } catch (e) {} } },
      isi: [h('div.v26-kisi.k2', null, h('div.v26-medan', null, h('label', { for: 'v26-ar-kode' }, 'Kode', h('i', null, ' *')), f.kode, h('small', null, lama ? 'Kode tidak bisa diubah.' : 'Singkat, mis. KTR atau BLOK-A.')), h('div.v26-medan', null, h('label', { for: 'v26-ar-nama' }, 'Nama lokasi', h('i', null, ' *')), f.nama)),
        elPeta, h('div', null, disini),
        h('div.v26-kisi.k3', null, h('div.v26-medan', null, h('label', { for: 'v26-ar-lat' }, 'Lintang (latitude)', h('i', null, ' *')), f.lat), h('div.v26-medan', null, h('label', { for: 'v26-ar-lng' }, 'Bujur (longitude)', h('i', null, ' *')), f.lng), h('div.v26-medan', null, h('label', { for: 'v26-ar-radius' }, 'Radius (meter)', h('i', null, ' *')), f.radius, h('small', null, '10 sampai 5.000 m.'))),
        h('div.v26-medan', null, h('label', { for: 'v26-ar-aktif' }, 'Titik aktif'), h('div.v26-baris.antara', null, h('span.v26-redup.v26-kecil', null, 'Titik yang dimatikan tidak bisa dipakai absen, tetapi riwayatnya tetap ada.'), h('span.v26-saklar', null, f.aktif, h('span')))), galat],
      kaki: [h('button.v26-btn.hantu', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'), simpan] });
    simpan.addEventListener('click', function () {
      V26.kosongkan(galat);
      V26.jalankan(simpan, function () { return api('hadirAreaSimpan', { kode: f.kode.value.trim(), nama: f.nama.value.trim(), lat: bil(f.lat.value), lng: bil(f.lng.value), radius: bil(f.radius.value), aktif: f.aktif.checked ? 'Ya' : 'Tidak', baru: !lama }, V26.reqId()); }, 'Titik lokasi disimpan').then(function () { L.tutup(); bukaAtur(el); }, function (e) { V26.isi(galat, pita('salah', e.message)); });
    });
    var pusat = lama ? [lama.lat, lama.lng] : (d.area[0] ? [d.area[0].lat, d.area[0].lng] : [-6.9, 107.6]);
    muatPeta().then(function (Lf) {
      var peta = Lf.map(elPeta).setView(pusat, lama || d.area[0] ? 16 : 11); Lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(peta);
      P = { L: Lf, peta: peta }; setTimeout(function () { peta.invalidateSize(); }, 200);
      gambarArea(P, d.area.filter(function (a) { return !lama || a.kode !== lama.kode; }), '#64748B');
      peta.on('click', function (e) { f.lat.value = e.latlng.lat.toFixed(6); f.lng.value = e.latlng.lng.toFixed(6); tandai(false); });
      tandai(false);
    }, function () { V26.isi(elPeta, h('div.v26-kosong', { gaya: 'padding:24px' }, ikon('lokasi'), h('p.v26-kecil', null, 'Peta tidak bisa dimuat. Isi koordinat dengan tangan atau pakai tombol lokasi di bawah.'))); });
  }
  return { bukaSelfie: bukaSelfie, bukaLog: bukaLog, bukaAtur: bukaAtur };
})();
