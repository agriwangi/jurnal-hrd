/* Jurnal HRD v2.6.1-a — js/api.js: sesi dan pemanggil backend (fetch ke Apps Script /exec).
   Lapisan kecepatan: (1) permintaan baca yang berbarengan digabung jadi SATU perjalanan ke server,
   (2) hasil baca disimpan 60 detik sehingga pindah menu terasa seketika, (3) simpanan dibuang begitu ada perubahan data,
   (4) baca diulang otomatis bila jaringan putus, (5) server dibangunkan saat halaman dibuka, (6) waktu tiap panggilan dicatat (JH.perf()). */
var JH = (function () {
  'use strict';
  var KUNCI = 'jurnalhrd-sesi', SEGAR_MS = 60000, JENDELA_MS = 12;
  var BACA = { mdRingkas: 1, mdDaftar: 1, mdPilihan: 1, mdPerluDipetakan: 1, mdKalender: 1, mdEkspor: 1, mdKenaikanSimulasi: 1, valKolom: 1, valRiwayat: 1, grAwal: 1, ujiInfo: 1, absBulan: 1, hadirLog: 1 };
  var SESI = {
    baca: function () { try { return JSON.parse(localStorage.getItem(KUNCI) || 'null'); } catch (e) { return null; } },
    simpan: function (s) { try { localStorage.setItem(KUNCI, JSON.stringify(s)); } catch (e) {} },
    hapus: function () { try { localStorage.removeItem(KUNCI); } catch (e) {} }
  };
  var catatan = [], simpanan = {}, antre = [], jam = null;
  function catat(aksi, total, server, ket) { catatan.push({ aksi: aksi, total_ms: total, server_ms: server == null ? null : server, jaringan_ms: server == null ? null : total - server, ket: ket || '' }); if (catatan.length > 200) catatan.shift(); }
  function siap() { return typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(GAS_URL) || /^http:\/\/(localhost|127\.0\.0\.1)[:\/]/.test(String(GAS_URL)); }
  function galatJaringan(pesan) { var g = new Error(pesan); g.jaringan = true; return g; }
  /** Satu perjalanan ke server. Semua aksi lewat POST text/plain (tanpa preflight CORS); token di badan, bukan di URL. */
  function kirim(aksi, data, batasMs) {
    var sesi = SESI.baca(), ctl = new AbortController(), t0 = Date.now(), pewaktu = setTimeout(function () { ctl.abort(); }, batasMs || 60000);
    return fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: aksi, data: data || {}, token: sesi ? sesi.token : '' }), redirect: 'follow', cache: 'no-store', signal: ctl.signal })
      .then(function (r) { return r.text(); }, function (e) { throw galatJaringan(e && e.name === 'AbortError' ? 'Server terlalu lama menjawab. Coba lagi.' : 'Koneksi ke server gagal. Periksa internet lalu coba lagi.'); })
      .then(function (teks) {
        clearTimeout(pewaktu); var j;
        try { j = JSON.parse(teks); } catch (e) { throw galatJaringan('Server sedang sibuk. Coba lagi sebentar lagi.'); }
        catat(aksi + (data && data.fn ? ':' + data.fn : data && data.calls ? ':' + data.calls.map(function (c) { return c.fn; }).join('+') : ''), Date.now() - t0, j.ms);
        if (j.success) return j.data;
        var g = new Error(j.message || 'Server tidak menjawab dengan benar. Coba lagi.'); g.kode = j.code;
        if (g.kode === 'AUTH_REQUIRED' || g.kode === 'TOKEN_EXPIRED') { var tadi = !!SESI.baca(); SESI.hapus(); lupa(); if (tadi && aksi !== 'login') { JH.pesanMasuk = g.message; location.hash = '#/masuk'; } }
        throw g;
      }, function (e) { clearTimeout(pewaktu); throw e; });
  }
  /** Baca aman diulang; tulis tidak diulang otomatis kecuali oleh modul yang membawa nomor permintaan (reqId). */
  function panggil(aksi, data, batasMs, ulang) {
    if (!siap()) return Promise.reject(new Error('Alamat backend belum diisi. Buka js/config.js dan tempel URL /exec.'));
    var sisa = ulang || 0;
    function coba(ke) { return kirim(aksi, data, ke ? 45000 : batasMs).then(null, function (g) { if (!g.jaringan || ke >= sisa) throw g; return new Promise(function (r) { setTimeout(r, 900 * (ke + 1)); }).then(function () { return coba(ke + 1); }); }); }
    return coba(0);
  }
  function lupa() { simpanan = {}; }
  function salin(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); }
  function kuras() {
    var paket = antre; antre = []; jam = null;
    panggil('v26batch', { calls: paket.map(function (p) { return { fn: p.fn, args: p.args }; }) }, 30000, 2).then(function (hasil) {
      paket.forEach(function (p, i) { var h = hasil[i]; if (h && h.ok) p.ok(h.data); else { var g = new Error(h && h.pesan ? h.pesan : 'Server tidak menjawab dengan benar. Coba lagi.'); g.kode = h && h.kode; p.gagal(g); } });
    }, function (g) { paket.forEach(function (p) { p.gagal(g); }); });
  }
  // Pintu modul v2.6.0 (Master Data, Impor, Grafik).
  window.__v26Jauh = function (fn, args) {
    if (!BACA[fn]) { lupa(); return panggil('v26', { fn: fn, args: args }, 90000).then(function (d) { lupa(); return d; }, function (g) { lupa(); throw g; }); }
    var k = fn + '|' + JSON.stringify(args), s = simpanan[k];
    if (s && Date.now() - s.t < SEGAR_MS) { if (s.d !== undefined) catat('v26:' + fn, 0, null, 'dari simpanan'); return s.janji.then(salin); }
    var janji = new Promise(function (ok, gagal) { antre.push({ fn: fn, args: args, ok: ok, gagal: gagal }); if (!jam) jam = setTimeout(kuras, JENDELA_MS); });
    var e = simpanan[k] = { t: Date.now(), janji: janji };
    janji.then(function (d) { e.d = d; }, function () { if (simpanan[k] === e) delete simpanan[k]; });
    return janji.then(salin);
  };
  function masuk(username, password) { lupa(); return panggil('login', { username: username, password: password }).then(function (d) { SESI.simpan({ token: d.token, user: d.user }); return d.user; }); }
  function keluar() { return panggil('logout').then(null, function () {}).then(function () { SESI.hapus(); lupa(); }); }
  function boleh(izin) { var s = SESI.baca(), d = s && s.user ? s.user.izin || [] : []; return d.indexOf('*') >= 0 || d.indexOf(izin) >= 0; }
  /** Membangunkan server lebih awal supaya klik pertama tidak menanggung waktu "bangun" Apps Script. */
  function bangunkan() { if (siap()) { try { fetch(GAS_URL + '?action=ping&t=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(function () {}); } catch (e) {} } }
  bangunkan();
  var sembunyiSejak = 0;
  document.addEventListener('visibilitychange', function () { if (document.hidden) sembunyiSejak = Date.now(); else if (sembunyiSejak && Date.now() - sembunyiSejak > 120000) bangunkan(); });
  return { SESI: SESI, panggil: panggil, masuk: masuk, keluar: keluar, boleh: boleh, siap: siap, lupa: lupa, pesanMasuk: '',
    perf: function () { if (console.table) console.table(catatan.slice(-40)); return catatan.slice(); } };
})();
