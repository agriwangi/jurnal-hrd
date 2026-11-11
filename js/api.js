/* Jurnal HRD v2.6.0-t1r — js/api.js: sesi dan pemanggil backend (fetch ke Apps Script /exec). */
var JH = (function () {
  'use strict';
  var KUNCI = 'jurnalhrd-sesi';
  var SESI = {
    baca: function () { try { return JSON.parse(localStorage.getItem(KUNCI) || 'null'); } catch (e) { return null; } },
    simpan: function (s) { try { localStorage.setItem(KUNCI, JSON.stringify(s)); } catch (e) {} },
    hapus: function () { try { localStorage.removeItem(KUNCI); } catch (e) {} }
  };
  function siap() { return typeof GAS_URL === 'string' && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(GAS_URL) || /^http:\/\/(localhost|127\.0\.0\.1)[:\/]/.test(String(GAS_URL)); }
  /** Semua aksi lewat POST. Content-Type text/plain agar peramban tidak mengirim preflight CORS yang ditolak Apps Script. Token ada di badan, bukan di URL. */
  function panggil(aksi, data, batasMs) {
    if (!siap()) return Promise.reject(new Error('Alamat backend belum diisi. Buka js/config.js dan tempel URL /exec.'));
    var sesi = SESI.baca(), ctl = new AbortController(), jam = setTimeout(function () { ctl.abort(); }, batasMs || 60000);
    return fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: aksi, data: data || {}, token: sesi ? sesi.token : '' }), redirect: 'follow', signal: ctl.signal })
      .then(function (r) { return r.json(); }, function (e) { throw new Error(e && e.name === 'AbortError' ? 'Server terlalu lama menjawab. Coba lagi.' : 'Koneksi ke server gagal. Periksa internet lalu coba lagi.'); })
      .then(function (j) {
        clearTimeout(jam);
        if (j && j.success) return j.data;
        var g = new Error(j && j.message ? j.message : 'Server tidak menjawab dengan benar. Coba lagi.'); g.kode = j && j.code;
        if (g.kode === 'AUTH_REQUIRED' || g.kode === 'TOKEN_EXPIRED') { var tadi = !!SESI.baca(); SESI.hapus(); if (tadi && aksi !== 'login') { JH.pesanMasuk = g.message; location.hash = '#/masuk'; } }
        throw g;
      }, function (e) { clearTimeout(jam); throw e; });
  }
  function masuk(username, password) { return panggil('login', { username: username, password: password }).then(function (d) { SESI.simpan({ token: d.token, user: d.user }); return d.user; }); }
  function keluar() { return panggil('logout').then(null, function () {}).then(function () { SESI.hapus(); }); }
  function boleh(izin) { var s = SESI.baca(), d = s && s.user ? s.user.izin || [] : []; return d.indexOf('*') >= 0 || d.indexOf(izin) >= 0; }
  // Modul v2.6.0 (Master Data, Impor, Grafik) memanggil backend lewat pintu ini.
  window.__v26Jauh = function (fn, args) { return panggil('v26', { fn: fn, args: args }); };
  return { SESI: SESI, panggil: panggil, masuk: masuk, keluar: keluar, boleh: boleh, siap: siap, pesanMasuk: '' };
})();
