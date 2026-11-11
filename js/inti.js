/* Jurnal HRD v2.6.0-t1 — inti klien: pemanggil server, pembuat elemen (aman dari sisipan skrip),
   komponen bersama (toast, laci, formulir, tabel berhalaman), baca/unduh berkas. */
var V26 = (function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', modul = {}, akar = null;
  var IKON = {
    master: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    lokasi: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', kamera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    impor: 'M12 15V4M8 8l4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4', unduh: 'M12 4v11M8 11l4 4 4-4M4 19h16',
    grafik: 'M4 20V10M10 20V4M16 20v-7M22 20H2', galeri: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', dasbor: 'M3 3h8v10H3zM13 3h8v6h-8zM13 11h8v10h-8zM3 15h8v6H3z',
    tambah: 'M12 5v14M5 12h14', ubah: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4', tutup: 'M6 6l12 12M18 6L6 18', cari: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
    awas: 'M12 3l10 18H2zM12 10v5M12 18v.5', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7v.5', cek: 'M5 12l5 5 9-10', kunci: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3',
    kiri: 'M15 5l-7 7 7 7', kanan: 'M9 5l7 7-7 7', bawah: 'M5 9l7 7 7-7', atas: 'M5 15l7-7 7 7', segar: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
    matahari: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19', bulan: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z',
    kalender: 'M4 6h16v15H4zM4 10h16M8 3v5M16 3v5', riwayat: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5M12 8v5l3 2', hapus: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13', tukar: 'M4 8h14l-3-3M20 16H6l3 3',
    berkas: 'M7 3h7l5 5v13H7zM14 3v5h5', tabel: 'M4 5h16v14H4zM4 10h16M4 15h16M10 5v14', gambar: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9v.5', penuh: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
    mata: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', geser: 'M9 6v.5M15 6v.5M9 12v.5M15 12v.5M9 18v.5M15 18v.5', panah: 'M5 12h14M13 6l6 6-6 6',
    kotak: 'M4 7l8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v10', simpan: 'M5 4h11l3 3v13H5zM8 4v5h7M8 20v-6h8v6', orang: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0', jam: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2'
  };
  function ikon(n, kelas) {
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'v26-ikon' + (kelas ? ' ' + kelas : '')); s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', IKON[n] || IKON.info); s.appendChild(p); return s;
  }
  /** h('div.kelas', {atribut}, anak...) — teks selalu masuk sebagai simpul teks (tidak pernah innerHTML). */
  function h(tag, atr) {
    var bag = tag.split('.'), el = document.createElement(bag[0] || 'div'), i;
    if (bag.length > 1) el.className = bag.slice(1).join(' ');
    var mulai = 1;
    if (atr && typeof atr === 'object' && !atr.nodeType && !Array.isArray(atr)) {
      mulai = 2;
      for (var k in atr) {
        var v = atr[k]; if (v == null || v === false) continue;
        if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'kelas') el.className += ' ' + v;
        else if (k === 'gaya') el.style.cssText = v;
        else if (k === 'value') el.value = v;
        else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'readOnly') el[k] = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    for (i = mulai; i < arguments.length; i++) tambah(el, arguments[i]);
    return el;
  }
  function tambah(el, a) {
    if (a == null || a === false) return;
    if (Array.isArray(a)) a.forEach(function (x) { tambah(el, x); });
    else el.appendChild(a.nodeType ? a : document.createTextNode(String(a)));
  }
  function kosongkan(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function isi(el) { kosongkan(el); for (var i = 1; i < arguments.length; i++) tambah(el, arguments[i]); return el; }

  function api(fn) {
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (ok, gagal) {
      if (window.__v26Jauh) { window.__v26Jauh(fn, args).then(ok, gagal); return; }   // versi REST: fetch() ke /exec
      if (window.__v26Lokal) {
        setTimeout(function () { try { var r = window.__v26Lokal(fn, JSON.parse(JSON.stringify(args))); r.ok ? ok(JSON.parse(JSON.stringify(r.data))) : gagal(new Error(r.pesan)); } catch (e) { gagal(new Error('Terjadi kesalahan: ' + e.message)); } }, 80);
        return;
      }
      google.script.run.withSuccessHandler(function (r) { r && r.ok ? ok(r.data) : gagal(new Error(r && r.pesan ? r.pesan : 'Server tidak menjawab. Coba lagi.')); })
        .withFailureHandler(function () { gagal(new Error('Koneksi ke server gagal. Periksa internet lalu coba lagi.')); }).v26Call(fn, args, V26.tiket || '');
    });
  }
  function reqId() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function rp(n) { n = Number(n) || 0; return (n < 0 ? '-' : '') + 'Rp ' + Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function angka(n, des) { n = Number(n) || 0; var s = n.toFixed(des || 0).split('.'); return s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (s[1] ? ',' + s[1] : ''); }
  function tunda(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 300); }; }

  /* ---------- Toast, laci, konfirmasi ---------- */
  function toast(pesan, jenis) {
    var w = akar.querySelector('.v26-toast') || akar.appendChild(h('div.v26-toast', { role: 'status', 'aria-live': 'polite' }));
    var d = h('div', { kelas: jenis || '' }, pesan); w.appendChild(d);
    setTimeout(function () { d.remove(); }, jenis === 'salah' ? 6000 : 3500);
  }
  function laci(o) {
    var kaki = h('footer'), badan = h('div.badan', null, o.isi), sebelum = document.activeElement;
    function tutup() { tabir.remove(); document.removeEventListener('keydown', esc); if (o.saatTutup) o.saatTutup(); if (sebelum && sebelum.focus) sebelum.focus(); }
    function esc(e) { if (e.key === 'Escape') tutup(); }
    var kotak = h('div.v26-laci', { role: 'dialog', 'aria-modal': 'true', 'aria-label': o.judul },
      h('header', null, h('div', null, h('h2', null, o.judul), o.sub ? h('p.v26-redup.v26-kecil', { gaya: 'margin-top:2px' }, o.sub) : null),
        h('button.v26-btn.ikon', { type: 'button', 'aria-label': 'Tutup', onclick: tutup }, ikon('tutup'))), badan, o.kaki ? kaki : null);
    var tabir = h('div.v26-tabir', { kelas: (o.tengah ? 'tengah ' : '') + (o.lebar ? 'lebar' : ''), onmousedown: function (e) { if (e.target === tabir) tutup(); } }, kotak);
    (o.kaki || []).forEach(function (b) { kaki.appendChild(b); });
    akar.appendChild(tabir); document.addEventListener('keydown', esc);
    var f = kotak.querySelector('input:not([disabled]),select,textarea'); if (f) setTimeout(function () { f.focus(); }, 50);
    return { tutup: tutup, badan: badan, kaki: kaki };
  }
  function konfirmasi(judul, pesan, labelYa, bahaya) {
    return new Promise(function (ok) {
      var jawab = false, L = laci({ judul: judul, tengah: true, isi: h('p', null, pesan), saatTutup: function () { ok(jawab); },
        kaki: [h('button.v26-btn', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'),
          h('button.v26-btn.utama', { type: 'button', gaya: bahaya ? 'background:#DC2626;border-color:#DC2626;color:#fff' : '', onclick: function () { jawab = true; L.tutup(); } }, labelYa || 'Ya')] });
    });
  }
  /** Menjalankan aksi tulis dengan tombol terkunci + pesan galat yang jelas. */
  function jalankan(tombol, janji, pesanSukses) {
    var teks = tombol ? tombol.textContent : ''; if (tombol) { tombol.disabled = true; tombol.dataset.sibuk = '1'; }
    return janji().then(function (r) { if (pesanSukses) toast(typeof pesanSukses === 'function' ? pesanSukses(r) : pesanSukses); return r; },
      function (e) { toast(e.message, 'salah'); throw e; }).finally(function () { if (tombol) { tombol.disabled = false; delete tombol.dataset.sibuk; if (!tombol.firstElementChild) tombol.textContent = teks; } });
  }

  /* ---------- Formulir dari definisi medan ---------- */
  function tglKeIso(s) { var x = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ''); return x ? x[3] + '-' + x[2] + '-' + x[1] : ''; }
  function isoKeTgl(s) { var x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return x ? x[3] + '/' + x[2] + '/' + x[1] : ''; }
  var HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  function formulir(medan, nilai) {
    nilai = nilai || {}; var ambilan = {}, kotakGalat = h('div.v26-pita.salah.v26-sembunyi', { role: 'alert' });
    var el = h('form.v26-kolom', { novalidate: true, onsubmit: function (e) { e.preventDefault(); } }, kotakGalat);
    var baris = null;
    medan.forEach(function (m) {
      var v = nilai[m.k] == null ? (m.bawaan == null ? '' : m.bawaan) : nilai[m.k], inp, id = 'v26f-' + m.k + '-' + Math.random().toString(36).slice(2, 7);
      if (m.t === 'pilih') {
        inp = h('select.v26-in', { id: id, disabled: m.mati }, m.kosong === false ? null : h('option', { value: '' }, m.kosong || '— pilih —'));
        (m.pilihan || []).forEach(function (p) { var kd = typeof p === 'string' ? p : p.k, nm = typeof p === 'string' ? p : (p.n === p.k ? p.k : p.k + ' — ' + p.n); inp.appendChild(h('option', { value: kd, selected: String(kd) === String(v) }, m.polos && typeof p !== 'string' ? p.n : nm)); });
        ambilan[m.k] = function () { return inp.value; };
      } else if (m.t === 'saklar') {
        var c = h('input', { type: 'checkbox', id: id, checked: v === 'Ya' || v === true, disabled: m.mati });
        inp = h('div.v26-baris.antara', null, h('span.v26-redup.v26-kecil', null, m.ket || ''), h('span.v26-saklar', null, c, h('span')));
        ambilan[m.k] = function () { return c.checked ? 'Ya' : 'Tidak'; };
      } else if (m.t === 'tanggal') {
        inp = h('input.v26-in', { type: 'date', id: id, value: tglKeIso(v), disabled: m.mati });
        ambilan[m.k] = function () { return isoKeTgl(inp.value); };
      } else if (m.t === 'hari') {
        var pilih = String(v || '').split(','), kotak = HARI.map(function (nm, i) { return h('label.v26-baris', { gaya: 'gap:4px;min-height:36px' }, h('input', { type: 'checkbox', value: i + 1, checked: pilih.indexOf(String(i + 1)) >= 0 }), nm); });
        inp = h('div.v26-baris.bungkus.lega', { id: id }, kotak);
        ambilan[m.k] = function () { return kotak.map(function (l) { return l.firstChild; }).filter(function (c) { return c.checked; }).map(function (c) { return c.value; }).join(','); };
      } else if (m.t === 'area') {
        inp = h('textarea.v26-in', { id: id, rows: 3, maxlength: m.maks || 300 }); inp.value = v; ambilan[m.k] = function () { return inp.value.trim(); };
      } else {
        inp = h('input.v26-in', { type: 'text', id: id, value: m.t === 'rupiah' && v !== '' ? angka(v) : v, disabled: m.mati, maxlength: m.maks || 120, placeholder: m.contoh || '',
          inputmode: m.t === 'angka' || m.t === 'rupiah' ? 'numeric' : null, kelas: m.t === 'kode' ? 'v26-mono' : (m.t === 'rupiah' || m.t === 'angka' ? 'v26-angka' : ''), autocomplete: 'off' });
        if (m.t === 'rupiah') inp.addEventListener('input', function () { var d = inp.value.replace(/\D/g, ''); inp.value = d ? angka(d) : ''; });
        if (m.t === 'kode') inp.addEventListener('input', function () { inp.value = inp.value.toUpperCase(); });
        ambilan[m.k] = function () { return m.t === 'rupiah' ? inp.value.replace(/\D/g, '') : inp.value.trim(); };
      }
      var kotakMedan = h('div.v26-medan', null, m.t === 'saklar' ? h('label', { for: id }, m.l) : h('label', { for: id }, m.l, m.wajib ? h('i', null, ' *') : null), inp, m.bantu ? h('small', null, m.bantu) : null);
      if (m.setengah) { if (!baris) { baris = h('div.v26-kisi.k2'); el.appendChild(baris); } baris.appendChild(kotakMedan); if (baris.children.length === 2) baris = null; }
      else { baris = null; el.appendChild(kotakMedan); }
    });
    return { el: el, ambil: function () { var o = {}; for (var k in ambilan) o[k] = ambilan[k](); return o; },
      galat: function (pesan) { kotakGalat.textContent = pesan || ''; kotakGalat.classList.toggle('v26-sembunyi', !pesan); if (pesan) kotakGalat.scrollIntoView({ block: 'nearest' }); } };
  }
  /** Laci formulir baku: Batal + Simpan, galat tampil di dalam laci, tombol terkunci saat menyimpan. */
  function laciFormulir(o) {
    var f = formulir(o.medan, o.nilai), simpan = h('button.v26-btn.utama', { type: 'button' }, o.labelSimpan || 'Simpan');
    var L = laci({ judul: o.judul, sub: o.sub, isi: [f.el, o.catatan ? h('div.v26-baris.v26-kecil.v26-redup', null, ikon('info'), o.catatan) : null], kaki: [h('button.v26-btn.hantu', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'), simpan] });
    var id = reqId();
    simpan.addEventListener('click', function () {
      f.galat(''); simpan.disabled = true;
      o.simpan(f.ambil(), id).then(function (r) { L.tutup(); toast(o.sukses || 'Tersimpan'); if (o.selesai) o.selesai(r); }, function (e) { f.galat(e.message); id = reqId(); }).finally(function () { simpan.disabled = false; });
    });
    f.el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.tagName === 'INPUT') simpan.click(); });
    return L;
  }

  /* ---------- Tabel berhalaman dari server (cari tertunda, nomor urut permintaan, galat + Coba Lagi) ---------- */
  function tabel(o) {
    var st = { hal: 1, q: '', filter: {}, urut: 0 }, badan = h('tbody'), kaki = h('div.v26-kaki'), bungkus = h('div.v26-gulung'), alat = h('div.v26-baris.bungkus', { gaya: 'padding:12px 16px;border-bottom:1px solid var(--bd)' });
    var tb = h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, o.kolom.map(function (k) { return h('th', { kelas: k.rata || '' }, k.j); }))), badan);
    bungkus.appendChild(tb);
    if (o.cari !== false) alat.appendChild(h('label.v26-cari', null, ikon('cari'), h('input.v26-in.padat', { type: 'search', placeholder: o.cari || 'Cari…', 'aria-label': 'Cari', oninput: tunda(function (e) { st.q = e.target.value; st.hal = 1; muat(); }) })));
    (o.filter || []).forEach(function (f) {
      var s = h('select.v26-in.padat', { gaya: 'width:auto;max-width:100%', 'aria-label': f.l, onchange: function () { if (f.k === '_aktif') st.aktif = s.value; else st.filter[f.k] = s.value; st.hal = 1; muat(); } }, h('option', { value: '' }, f.l));
      f.pilihan.forEach(function (p) { s.appendChild(h('option', { value: p.k }, p.n)); }); alat.appendChild(s);
    });
    var el = h('div', null, (o.cari !== false || (o.filter || []).length) ? alat : null, bungkus, kaki);
    function rangka() { isi(badan, [1, 2, 3, 4].map(function () { return h('tr', null, h('td', { colspan: o.kolom.length, 'data-l': '' }, h('div.v26-rangka', { gaya: 'width:' + (50 + Math.random() * 40) + '%' }))); })); }
    function muat() {
      var urut = ++st.urut; rangka();
      o.muat({ hal: st.hal, ukuran: o.ukuran || 25, q: st.q, filter: st.filter, aktif: st.aktif || '' }).then(function (r) {
        if (urut !== st.urut) return;
        if (!r.baris.length) {
          isi(badan, h('tr', null, h('td', { colspan: o.kolom.length, 'data-l': '', kelas: 'penuh' }, h('div.v26-kosong', null, ikon('kotak'), h('p', null, st.q || Object.keys(st.filter).some(function (k) { return st.filter[k]; }) ? 'Tidak ada data yang cocok dengan pencarian.' : (o.kosong || 'Belum ada data.')), !st.q && o.aksiKosong ? o.aksiKosong() : null))));
        } else {
          isi(badan, r.baris.map(function (b, i) {
            var tr = h('tr', { kelas: o.kelasBaris ? o.kelasBaris(b) : '' }, o.kolom.map(function (k) { return h('td', { 'data-l': k.judul ? '' : k.j, kelas: (k.rata || '') + (k.judul ? ' judul' : '') }, k.isi(b, i)); }));
            return o.anak ? [tr, o.anak(b)] : tr;
          }));
        }
        isi(kaki, h('span', null, r.total ? 'Menampilkan ' + ((r.hal - 1) * r.ukuran + 1) + '–' + ((r.hal - 1) * r.ukuran + r.baris.length) + ' dari ' + r.total : '0 data'),
          r.jmlHal > 1 ? h('div.v26-baris', null, h('button.v26-btn.kecil', { type: 'button', disabled: r.hal <= 1, onclick: function () { st.hal--; muat(); } }, 'Sebelumnya'), h('span', null, 'Halaman ' + r.hal + ' dari ' + r.jmlHal),
            h('button.v26-btn.kecil', { type: 'button', disabled: r.hal >= r.jmlHal, onclick: function () { st.hal++; muat(); } }, 'Berikutnya')) : null);
        if (o.sesudah) o.sesudah(r);
      }, function (e) {
        if (urut !== st.urut) return;
        isi(badan, h('tr', null, h('td', { colspan: o.kolom.length, 'data-l': '', kelas: 'penuh' }, h('div.v26-kosong', null, ikon('awas'), h('p', null, e.message), h('button.v26-btn', { type: 'button', onclick: muat }, ikon('segar'), 'Coba Lagi')))));
        kosongkan(kaki);
      });
    }
    muat();
    return { el: el, muat: muat };
  }
  function galatMuat(el, e, ulang) { isi(el, h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('awas'), h('p', null, e.message), h('button.v26-btn', { type: 'button', onclick: ulang }, ikon('segar'), 'Coba Lagi')))); }
  function rangkaBlok(el, n) { isi(el, h('div.v26-kartu.isi.v26-kolom', null, Array.apply(null, Array(n || 4)).map(function (_, i) { return h('div.v26-rangka', { gaya: 'width:' + (90 - i * 12) + '%' }); }))); }

  /* ---------- Berkas: baca CSV/XLSX, unduh CSV/XLSX ---------- */
  var URL_XLSX = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
  function muatSkrip(url) { return new Promise(function (ok, gagal) { var s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = function () { gagal(new Error('gagal memuat')); }; document.head.appendChild(s); }); }
  function butuhXlsx() { return window.XLSX ? Promise.resolve() : muatSkrip(URL_XLSX).catch(function () { throw new Error('Pembaca Excel tidak bisa dimuat (butuh internet). Simpan berkas sebagai .csv lalu unggah lagi.'); }); }
  function uraiCsv(t) {
    t = t.replace(/^﻿/, '');
    var awal = t.split(/\r?\n/, 15).join('\n'), hit = function (c) { return awal.split(c).length; }, pemisah = (hit(';') > hit(',') && hit(';') >= hit('\t')) ? ';' : (hit('\t') > hit(',') ? '\t' : ',');   // dihitung dari 15 baris pertama, karena baris 1 sering berisi judul laporan
    var baris = [], sel = '', row = [], kutip = false, i, c;
    for (i = 0; i < t.length; i++) {
      c = t[i];
      if (kutip) { if (c === '"') { if (t[i + 1] === '"') { sel += '"'; i++; } else kutip = false; } else sel += c; }
      else if (c === '"') kutip = true;
      else if (c === pemisah) { row.push(sel); sel = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(sel); baris.push(row); row = []; sel = ''; }
      else sel += c;
    }
    if (sel !== '' || row.length) { row.push(sel); baris.push(row); }
    return baris;
  }
  /** @return Promise<{nama, lembar:[{nama, baris:[[teks]]}]}> — semua sel dibaca sebagai teks apa adanya. */
  function bacaBerkas(file) {
    var nm = file.name.toLowerCase();
    if (file.size > 8 * 1024 * 1024) return Promise.reject(new Error('Berkas lebih dari 8 MB. Pecah menjadi beberapa berkas.'));
    if (/\.(csv|txt)$/.test(nm)) return new Promise(function (ok, gagal) { var r = new FileReader(); r.onload = function () { ok({ nama: file.name, lembar: [{ nama: 'Lembar 1', baris: uraiCsv(String(r.result)) }] }); }; r.onerror = function () { gagal(new Error('Berkas tidak bisa dibaca.')); }; r.readAsText(file); });
    if (!/\.(xlsx|xls)$/.test(nm)) return Promise.reject(new Error('Jenis berkas tidak didukung. Pakai .xlsx, .xls, atau .csv.'));
    return butuhXlsx().then(function () {
      return new Promise(function (ok, gagal) {
        var r = new FileReader();
        r.onload = function () {
          try {
            var wb = XLSX.read(r.result, { type: 'array', cellDates: false, raw: false });
            ok({ nama: file.name, lembar: wb.SheetNames.map(function (n) { return { nama: n, baris: XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '', blankrows: true }).map(function (b) { return b.map(function (v) { return v == null ? '' : String(v); }); }) }; }) });
          } catch (e) { gagal(new Error('Berkas Excel tidak bisa dibaca. Pastikan berkas tidak rusak atau terkunci sandi.')); }
        };
        r.onerror = function () { gagal(new Error('Berkas tidak bisa dibaca.')); }; r.readAsArrayBuffer(file);
      });
    });
  }
  function unduhBlob(blob, nama) { var a = h('a', { href: URL.createObjectURL(blob), download: nama }); document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  /** Unduh tabel: .xlsx bila pembaca Excel tersedia, kalau tidak .csv (titik koma, bisa dibuka Excel). Semua sel teks agar nol depan tetap. */
  function unduhTabel(nama, kepala, baris) {
    function csv() { var s = [kepala].concat(baris).map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[";\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\r\n'); unduhBlob(new Blob(['﻿' + s], { type: 'text/csv;charset=utf-8' }), nama + '.csv'); }
    return butuhXlsx().then(function () {
      var ws = XLSX.utils.aoa_to_sheet([kepala].concat(baris.map(function (r) { return r.map(function (v) { return v == null ? '' : String(v); }); })));
      Object.keys(ws).forEach(function (k) { if (k[0] !== '!' && ws[k]) { ws[k].t = 's'; ws[k].z = '@'; } });
      var wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Data'); XLSX.writeFile(wb, nama + '.xlsx');
    }, csv);
  }
  function tema(t) { if (t) { akar.setAttribute('data-tema', t); try { localStorage.setItem('v26-tema', t); } catch (e) {} } return akar.getAttribute('data-tema') || 'terang'; }
  function pasang(el) { akar = el; var t = null; try { t = localStorage.getItem('v26-tema'); } catch (e) {} el.setAttribute('data-tema', t || 'terang'); }
  function lencanaAktif(v) { return h('span.v26-lencana', { kelas: v === 'Tidak' ? '' : 'ok' }, v === 'Tidak' ? 'Nonaktif' : 'Aktif'); }
  function chipKode(kode, warna, sistem) {
    var w = String(warna || '').split('|'), c = h('span.v26-chip', { kelas: sistem ? 'garis' : '' }, kode);
    if (w.length === 2 && !sistem) { c.style.color = w[0]; c.style.background = w[1]; } else if (sistem) c.style.color = '#475569';
    return c;
  }
  return { modul: modul, h: h, isi: isi, kosongkan: kosongkan, ikon: ikon, api: api, reqId: reqId, rp: rp, angka: angka, tunda: tunda, toast: toast, laci: laci, konfirmasi: konfirmasi, jalankan: jalankan,
    formulir: formulir, laciFormulir: laciFormulir, tabel: tabel, galatMuat: galatMuat, rangkaBlok: rangkaBlok, bacaBerkas: bacaBerkas, butuhXlsx: butuhXlsx, unduhTabel: unduhTabel, unduhBlob: unduhBlob, uraiCsv: uraiCsv,
    tema: tema, pasang: pasang, lencanaAktif: lencanaAktif, chipKode: chipKode, NS: NS, tglKeIso: tglKeIso, isoKeTgl: isoKeTgl, akar: function () { return akar; } };
})();
