/* Jurnal HRD v2.6.0-t1 — MESIN GRAFIK (SVG murni, tanpa pustaka luar). 30 model tahap 1:
   Perbandingan (9), Tren waktu (8), Komposisi (8), Pencapaian (5). Aturan: satu sumbu, legenda untuk >= 2 seri,
   teks memakai warna tinta, celah 2px antar isian, ujung data membulat 4px, tooltip saat disorot, tampilan tabel selalu ada.
   Mengganti model tidak pernah mengubah angka: semua model membaca data {kategori, seri, target} yang sama. */
V26.grafik = (function () {
  'use strict';
  var h = V26.h, NS = V26.NS;
  var PALET = { teal: ['#00A396', '#D97706', '#2563EB', '#DB2777', '#7C3AED', '#65A30D', '#B45309', '#0891B2'], amber: ['#D97706', '#2563EB', '#00A396', '#7C3AED', '#65A30D', '#DB2777'], samudra: ['#2563EB', '#00A396', '#7C3AED', '#D97706', '#DB2777', '#65A30D'] };
  var NAMA_PALET = { teal: 'Teal', amber: 'Amber', samudra: 'Samudra' };
  function S(tag, a, anak) { var e = document.createElementNS(NS, tag); for (var k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (anak != null) (Array.isArray(anak) ? anak : [anak]).forEach(function (x) { if (x != null) e.appendChild(x.nodeType ? x : document.createTextNode(String(x))); }); return e; }
  function jml(a) { return a.reduce(function (x, y) { return x + (Number(y) || 0); }, 0); }
  function token() { var cs = getComputedStyle(V26.akar()), o = {}; ['tx', 'mt', 'rd', 'bd', 'bd2', 'sf', 'sf2', 'pr', 'ok', 'er'].forEach(function (k) { o[k] = cs.getPropertyValue('--' + k).trim() || '#888'; }); return o; }
  function potong(s, n) { s = String(s); return n < 2 ? '' : s.length > n ? s.slice(0, Math.max(1, n - 1)) + '…' : s; }
  function skala(lo, hi) {
    if (hi <= lo) hi = lo + 1;
    var raw = (hi - lo) / 4, pow = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = [1, 2, 2.5, 5, 10].filter(function (x) { return x * pow >= raw; })[0] * pow;
    var a = Math.floor(lo / m) * m, b = Math.ceil(hi / m) * m, t = []; for (var v = a; v <= b + m / 2; v += m) t.push(Math.round(v * 1e6) / 1e6);
    return { lo: a, hi: b, tik: t };
  }
  /** Batang dengan ujung data membulat: ujung = 'atas' | 'bawah' | 'kanan' | 'kiri' | '' */
  function batang(x, y, w, t, ujung, r) {
    if (w <= 0 || t <= 0) return ''; r = Math.min(r == null ? 4 : r, w / 2, t / 2);
    if (ujung === 'atas') return 'M' + x + ',' + (y + t) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + t) + 'Z';
    if (ujung === 'bawah') return 'M' + x + ',' + y + 'V' + (y + t - r) + 'Q' + x + ',' + (y + t) + ' ' + (x + r) + ',' + (y + t) + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + (y + t) + ' ' + (x + w) + ',' + (y + t - r) + 'V' + y + 'Z';
    if (ujung === 'kanan') return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + t - r) + 'Q' + (x + w) + ',' + (y + t) + ' ' + (x + w - r) + ',' + (y + t) + 'H' + x + 'Z';
    if (ujung === 'kiri') return 'M' + (x + w) + ',' + y + 'H' + (x + r) + 'Q' + x + ',' + y + ' ' + x + ',' + (y + r) + 'V' + (y + t - r) + 'Q' + x + ',' + (y + t) + ' ' + (x + r) + ',' + (y + t) + 'H' + (x + w) + 'Z';
    return 'M' + x + ',' + y + 'h' + w + 'v' + t + 'h' + (-w) + 'Z';
  }
  function busur(cx, cy, r1, r0, a0, a1) {
    if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4;
    var b = a1 - a0 > Math.PI ? 1 : 0, p = function (r, a) { return (cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2); };
    return 'M' + p(r1, a0) + 'A' + r1 + ',' + r1 + ' 0 ' + b + ' 1 ' + p(r1, a1) + (r0 > 0 ? 'L' + p(r0, a1) + 'A' + r0 + ',' + r0 + ' 0 ' + b + ' 0 ' + p(r0, a0) : 'L' + cx + ',' + cy) + 'Z';
  }

  /* ---------- Menyiapkan data: urut, N teratas, lipat seri berlebih ke "Lainnya" ---------- */
  var WARNA_KATEGORI = ['pai', 'donat', 'setengah_donat', 'waffle', 'corong'];
  function siapkan(data, o, model, bentuk, maks) {
    var kat = (data.kategori || []).map(String), seri = (data.seri || []).map(function (s) { return { nama: String(s.nama), nilai: kat.map(function (_, i) { return Number(s.nilai[i]) || 0; }) }; });
    var target = data.target ? kat.map(function (_, i) { return data.target[i] == null ? null : Number(data.target[i]); }) : null;
    if (!seri.length) seri = [{ nama: '', nilai: kat.map(function () { return 0; }) }];
    if (seri.length > maks) { var sisa = seri.slice(maks - 1); seri = seri.slice(0, maks - 1); seri.push({ nama: 'Lainnya', nilai: kat.map(function (_, i) { return jml(sisa.map(function (s) { return s.nilai[i]; })); }) }); }
    var idx = kat.map(function (_, i) { return i; }), tot = function (i) { return jml(seri.map(function (s) { return s.nilai[i]; })); }, lain = null;
    if (bentuk !== 'tren') {
      var urut = model === 'pareto' ? 'besar' : (o.urut || 'asli'), batas = +o.atas || 0;
      if (WARNA_KATEGORI.indexOf(model) >= 0 || (model === 'treemap' && seri.length === 1)) batas = batas ? Math.min(batas, maks - 1) : (kat.length > maks ? maks - 1 : 0);
      if (batas && idx.length > batas + 1) {
        var perBesar = idx.slice().sort(function (a, b) { return tot(b) - tot(a); }), simpan = {}; perBesar.slice(0, batas).forEach(function (i) { simpan[i] = 1; });
        var buang = idx.filter(function (i) { return !simpan[i]; }); idx = idx.filter(function (i) { return simpan[i]; });
        lain = { nama: 'Lainnya (' + buang.length + ')', nilai: seri.map(function (s) { return jml(buang.map(function (i) { return s.nilai[i]; })); }) };
      }
      if (urut === 'besar') idx.sort(function (a, b) { return tot(b) - tot(a); }); else if (urut === 'kecil') idx.sort(function (a, b) { return tot(a) - tot(b); }); else if (urut === 'abjad') idx.sort(function (a, b) { return kat[a].localeCompare(kat[b], 'id'); });
    }
    var d = { kat: idx.map(function (i) { return kat[i]; }), seri: seri.map(function (s) { return { nama: s.nama, nilai: idx.map(function (i) { return s.nilai[i]; }) }; }), target: target ? idx.map(function (i) { return target[i]; }) : null };
    if (lain) { d.kat.push(lain.nama); d.seri.forEach(function (s, k) { s.nilai.push(lain.nilai[k]); }); if (d.target) d.target.push(null); }
    d.tot = d.kat.map(function (_, i) { return jml(d.seri.map(function (s) { return s.nilai[i]; })); }); d.total = jml(d.tot);
    return d;
  }
  function pemformat(o, satuan, maks, total) {
    var f = o.format || (satuan === 'persen' ? 'persen' : satuan === 'rupiah' ? (maks >= 1e6 ? 'juta' : maks >= 1e4 ? 'ribu' : 'penuh') : 'penuh'), des = +o.desimal || 0, bagi = f === 'persen' && satuan !== 'persen';
    function ringkas(n) {
      if (f === 'persen') return V26.angka(bagi ? (total ? n / total * 100 : 0) : n, bagi ? Math.max(des, 1) : (des || (n % 1 ? 1 : 0))) + '%';
      if (f === 'juta') return V26.angka(n / 1e6, Math.max(des, Math.abs(n) % 1e6 ? 1 : 0)) + ' jt';
      if (f === 'ribu') return V26.angka(n / 1e3, des) + ' rb';
      return V26.angka(n, des || (n % 1 ? 1 : 0));
    }
    function penuh(n) { return satuan === 'rupiah' ? V26.rp(n) : satuan === 'persen' ? V26.angka(n, n % 1 ? 1 : 0) + '%' : V26.angka(n, n % 1 ? 1 : 0) + (satuan ? ' ' + satuan : ''); }
    return { ringkas: ringkas, penuh: penuh, sumbu: function (n) { return bagi ? V26.angka(n, n % 1 ? 1 : 0) : ringkas(n); } };
  }

  /* ---------- Konteks gambar ---------- */
  function Konteks(el, p) {
    var c = this; c.el = el; c.p = p; c.o = p.opsi || {}; c.mini = !!p.mini; c.t = token();
    c.pal = PALET[c.o.palet] || PALET.teal; c.W = p.lebar || Math.max(240, Math.floor(el.clientWidth || 640));
    c.d = siapkan(p.data, c.o, p.model, p.bentuk, c.pal.length);
    c.maks = Math.max.apply(null, [0].concat(c.d.seri.map(function (s) { return Math.max.apply(null, s.nilai.concat([0])); })));
    c.f = pemformat(c.o, p.satuan, c.maks, c.d.total);
    c.svg = S('svg', { role: 'img', 'aria-label': (p.judul || 'Grafik') + ': ' + c.d.kat.length + ' kategori, ' + c.d.seri.length + ' seri. Tersedia juga sebagai tabel.' });
    c.tipEl = h('div.v26-tip'); c.leg = null;
  }
  Konteks.prototype.atur = function (H) { this.H = this.mini ? (this.p.tinggi || 62) : H; this.svg.setAttribute('viewBox', '0 0 ' + this.W + ' ' + this.H); this.svg.setAttribute('width', this.W); this.svg.setAttribute('height', this.H); return this.H; };
  Konteks.prototype.tinggiBaku = function () { return this.p.tinggi || Math.max(220, Math.min(340, Math.round(this.W * 0.52))); };
  Konteks.prototype.tx = function (x, y, s, a) {
    if (this.mini || s === '' || s == null) return null; a = a || {};
    var e = S('text', { x: x, y: y, 'text-anchor': a.jangkar || 'start', 'font-size': a.ukuran || 11, 'font-weight': a.tebal ? 600 : null, fill: a.warna || this.t.mt, 'dominant-baseline': a.dasar || null }, s);
    (a.di || this.svg).appendChild(e); return e;
  };
  Konteks.prototype.add = function (tag, a, di) { var e = S(tag, a); (di || this.svg).appendChild(e); return e; };
  Konteks.prototype.warna = function (i) { return this.pal[i % this.pal.length]; };
  Konteks.prototype.tip = function (ev, judul, baris) {
    if (this.mini) return; var t = this.tipEl, c = this;
    V26.isi(t, judul ? h('b', { gaya: 'display:block;margin-bottom:2px' }, judul) : null, (baris || []).map(function (b) { return h('div', { gaya: 'display:flex;gap:8px;justify-content:space-between;align-items:center' }, h('span', null, b[2] ? h('i', { gaya: 'display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;background:' + b[2] }) : null, b[0]), h('b', null, b[1])); }));
    t.style.display = 'block';
    var k = c.el.getBoundingClientRect(), px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - k.left, py = (ev.touches ? ev.touches[0].clientY : ev.clientY) - k.top, lebar = t.offsetWidth / 2 + 4;
    t.style.left = Math.max(lebar, Math.min(k.width - lebar, px)) + 'px'; t.style.top = Math.max(t.offsetHeight + 12, py) + 'px';
  };
  Konteks.prototype.lepas = function () { this.tipEl.style.display = 'none'; };
  /** Memasang tooltip pada satu tanda (bidang sentuh boleh lebih besar dari tandanya). */
  Konteks.prototype.sorot = function (e, judul, baris, saatMasuk, saatLepas) {
    if (this.mini) return e; var c = this;
    function masuk(ev) { c.tip(ev, judul, typeof baris === 'function' ? baris() : baris); if (saatMasuk) saatMasuk(); }
    function keluar() { c.lepas(); if (saatLepas) saatLepas(); }
    e.addEventListener('mousemove', masuk); e.addEventListener('mouseleave', keluar);
    e.addEventListener('touchstart', function (ev) { masuk(ev); setTimeout(keluar, 2500); }, { passive: true });
    return e;
  };
  Konteks.prototype.legenda = function (item) { if (!this.mini) this.leg = item; };
  Konteks.prototype.barisSeri = function (i) { var c = this; return c.d.seri.map(function (s, k) { return [s.nama || 'Nilai', c.f.penuh(s.nilai[i]), c.warna(k)]; }); };

  /* ---------- Bingkai kartesius tegak ---------- */
  function bingkai(c, lo, hi, fmt, opsi) {
    opsi = opsi || {}; var sk = skala(lo, hi), n = c.d.kat.length, mini = c.mini;
    var mL = mini ? 2 : Math.min(84, Math.max.apply(null, sk.tik.map(function (v) { return fmt(v).length; })) * 6.4 + 12), mR = mini ? 2 : (opsi.kanan || 10), mT = mini ? 3 : 16, mB = mini ? 3 : 26;
    var x0 = mL, y0 = mT, w = c.W - mL - mR, t = c.H - mT - mB, y = function (v) { return y0 + t - (v - sk.lo) / (sk.hi - sk.lo) * t; }, pita = w / Math.max(1, n);
    if (!mini) {
      sk.tik.forEach(function (v) { c.add('line', { x1: x0, x2: x0 + w, y1: y(v), y2: y(v), stroke: v === 0 ? c.t.bd2 : c.t.bd, 'stroke-width': 1 }); c.tx(x0 - 6, y(v) + 4, fmt(v), { jangkar: 'end' }); });
      var maksHuruf = Math.floor(pita / 6.2), langkah = maksHuruf >= 4 ? 1 : Math.ceil(30 / pita);
      c.d.kat.forEach(function (k, i) { if (i % langkah === 0) c.tx(x0 + pita * (i + .5), y0 + t + 16, potong(k, langkah === 1 ? maksHuruf : Math.floor(langkah * pita / 6.2) - 1), { jangkar: 'middle' }); });
    } else c.add('line', { x1: x0, x2: x0 + w, y1: y(Math.max(0, sk.lo)), y2: y(Math.max(0, sk.lo)), stroke: c.t.bd2, 'stroke-width': 1 });
    return { x0: x0, y0: y0, w: w, t: t, y: y, pita: pita, cx: function (i) { return x0 + pita * (i + .5); }, lo: sk.lo, hi: sk.hi };
  }
  function pitaHover(c, B, garisPandu) {
    if (c.mini) return;
    var pandu = c.add('line', { y1: B.y0, y2: B.y0 + B.t, stroke: c.t.rd, 'stroke-width': 1, 'stroke-dasharray': '3 3', visibility: 'hidden', 'pointer-events': 'none' });
    c.d.kat.forEach(function (k, i) {
      var r = c.add('rect', { x: B.x0 + B.pita * i, y: B.y0, width: B.pita, height: B.t, fill: c.t.tx, 'fill-opacity': 0, tabindex: -1 });
      c.sorot(r, k, function () { return c.barisSeri(i).concat(c.d.seri.length > 1 ? [['Total', c.f.penuh(c.d.tot[i])]] : []); },
        function () { if (garisPandu) { pandu.setAttribute('x1', B.cx(i)); pandu.setAttribute('x2', B.cx(i)); pandu.setAttribute('visibility', 'visible'); } else r.setAttribute('fill-opacity', .06); },
        function () { pandu.setAttribute('visibility', 'hidden'); r.setAttribute('fill-opacity', 0); });
    });
  }
  function garisAcuan(c, B) {
    if (c.mini) return; var o = c.o, d = c.d;
    if (o.rata && d.kat.length > 1) { var r = d.total / d.kat.length; c.add('line', { x1: B.x0, x2: B.x0 + B.w, y1: B.y(r), y2: B.y(r), stroke: c.t.mt, 'stroke-width': 1.5, 'stroke-dasharray': '6 4' }); c.tx(B.x0 + B.w - 2, B.y(r) - 5, 'Rata-rata ' + c.f.ringkas(r), { jangkar: 'end', warna: c.t.tx, tebal: 1 }); }
    if (o.target === false) return;
    var tg = o.nilaiTarget != null ? d.kat.map(function () { return +o.nilaiTarget; }) : d.target; if (!tg) return;
    var isi = tg.filter(function (v) { return v != null; }), rata = isi.length && isi.every(function (v) { return v === isi[0]; });
    if (rata) { c.add('line', { x1: B.x0, x2: B.x0 + B.w, y1: B.y(isi[0]), y2: B.y(isi[0]), stroke: c.t.tx, 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }); c.tx(B.x0 + 4, B.y(isi[0]) - 5, 'Target ' + c.f.ringkas(isi[0]), { warna: c.t.tx, tebal: 1 }); }
    else tg.forEach(function (v, i) { if (v != null) c.add('line', { x1: B.cx(i) - B.pita * .3, x2: B.cx(i) + B.pita * .3, y1: B.y(v), y2: B.y(v), stroke: c.t.tx, 'stroke-width': 2 }); });
  }
  function batasAtas(c, dasar) { var o = c.o, tg = o.target === false ? [] : (o.nilaiTarget != null ? [+o.nilaiTarget] : (c.d.target || []).filter(function (v) { return v != null; })); return Math.max.apply(null, [dasar].concat(tg)); }
  function jalurGaris(pt, gaya) {
    return pt.map(function (p, i) {
      if (!i) return 'M' + p[0] + ',' + p[1];
      var q = pt[i - 1];
      if (gaya === 'halus') { var m = (q[0] + p[0]) / 2; return 'C' + m + ',' + q[1] + ' ' + m + ',' + p[1] + ' ' + p[0] + ',' + p[1]; }
      if (gaya === 'tingkat') return 'H' + p[0] + 'V' + p[1];
      return 'L' + p[0] + ',' + p[1];
    }).join('');
  }

  /* ---------- Model tegak: batang, garis, area ---------- */
  function tegak(c, m) {
    c.atur(c.tinggiBaku());
    var d = c.d, n = d.kat.length, SR = d.seri, ns = SR.length, garisM = /^(garis|area)/.test(m), tumpuk = m === 'batang_tumpuk' || m === 'area_tumpuk', t100 = /100$/.test(m);
    var V = SR.map(function (s) { return s.nilai.slice(); });
    if (t100) V = V.map(function (v) { return v.map(function (x, i) { return d.tot[i] ? x / d.tot[i] * 100 : 0; }); });
    var kum = null; if (m === 'pareto') { var a = 0; kum = d.tot.map(function (v) { a += v; return a; }); }
    var semua = [].concat.apply([], V), hi = t100 ? 100 : m === 'pareto' ? d.total : (tumpuk ? Math.max.apply(null, d.tot.concat([0])) : Math.max.apply(null, semua.concat([0]))), lo = Math.min.apply(null, semua.concat([0]));
    if (!t100) hi = batasAtas(c, hi);
    var fmt = t100 ? function (v) { return v + '%'; } : c.f.sumbu, ujungLabel = garisM && ns >= 2 && ns <= 4 && c.W >= 480 && !tumpuk && !t100;
    var B = bingkai(c, lo, hi || 1, fmt, { kanan: ujungLabel ? Math.min(110, Math.max.apply(null, SR.map(function (s) { return s.nama.length; })) * 6.2 + 14) : 10 });
    var dasar = B.y(Math.max(0, B.lo)), jarak = Math.max(c.mini ? 1 : 2, B.pita * .18), lb = B.pita - jarak * 2;
    function titik(k) { return V[k].map(function (v, i) { return [B.cx(i), B.y(v)]; }); }
    if (garisM) {
      var gaya = m === 'garis_halus' ? 'halus' : m === 'garis_tingkat' ? 'tingkat' : '';
      if (tumpuk || t100) {
        var bawah = d.kat.map(function () { return 0; });
        V.forEach(function (v, k) {
          var atas = v.map(function (x, i) { return bawah[i] + x; }), pa = atas.map(function (x, i) { return [B.cx(i), B.y(x)]; }), pb = bawah.map(function (x, i) { return [B.cx(i), B.y(x)]; }).reverse();
          c.add('path', { d: jalurGaris(pa, '') + 'L' + pb.map(function (p) { return p[0] + ',' + p[1]; }).join('L') + 'Z', fill: c.warna(k), 'fill-opacity': .82, stroke: c.t.sf, 'stroke-width': c.mini ? .8 : 1.5, 'stroke-linejoin': 'round' });
          bawah = atas;
        });
      } else V.forEach(function (v, k) {
        var pt = titik(k), w = c.warna(k);
        if (m === 'area') c.add('path', { d: jalurGaris(pt, '') + 'L' + pt[pt.length - 1][0] + ',' + dasar + 'L' + pt[0][0] + ',' + dasar + 'Z', fill: w, 'fill-opacity': .16 });
        c.add('path', { d: jalurGaris(pt, gaya), fill: 'none', stroke: w, 'stroke-width': c.mini ? 1.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
        if (!c.mini && n <= 24) pt.forEach(function (p) { c.add('circle', { cx: p[0], cy: p[1], r: 4, fill: w, stroke: c.t.sf, 'stroke-width': 2 }); });
        if (ujungLabel) c.tx(pt[pt.length - 1][0] + 9, pt[pt.length - 1][1] + 4, potong(SR[k].nama, 15), { warna: c.t.tx });
        else if (c.o.label !== false && ns === 1) c.tx(pt[pt.length - 1][0], pt[pt.length - 1][1] - 9, c.f.ringkas(v[v.length - 1]), { jangkar: 'end', warna: c.t.tx, tebal: 1 });
      });
    } else if (tumpuk || t100) {
      d.kat.forEach(function (_, i) {
        var dari = 0, puncak = -1; V.forEach(function (v, k) { if (v[i] > 0) puncak = k; });
        V.forEach(function (v, k) {
          var y1 = B.y(dari + v[i]), y2 = B.y(dari), tg = y2 - y1 - (dari > 0 && y2 - y1 > 3 ? 2 : 0); dari += v[i];
          if (tg > 0) c.add('path', { d: batang(B.x0 + B.pita * i + jarak, y1, lb, tg, k === puncak ? 'atas' : ''), fill: c.warna(k) });
        });
      });
    } else {
      var nb = (m === 'batang_garis' || m === 'pareto') ? 1 : ns, celah = c.mini ? 1 : 2, lw = Math.max(1, (lb - celah * (nb - 1)) / nb);
      for (var k = 0; k < nb; k++) (m === 'pareto' ? d.tot : V[k]).forEach(function (v, i) {
        var y1 = B.y(Math.max(v, 0)), tg = Math.abs(B.y(v) - dasar);
        c.add('path', { d: batang(B.x0 + B.pita * i + jarak + k * (lw + celah), v >= 0 ? y1 : dasar, lw, tg, v >= 0 ? 'atas' : 'bawah'), fill: c.warna(k) });
        if (!c.mini && c.o.label !== false && nb === 1 && n <= 14 && m !== 'pareto') c.tx(B.cx(i), y1 - 5, c.f.ringkas(v), { jangkar: 'middle', warna: c.t.tx });
      });
      var lin = m === 'pareto' ? [kum] : m === 'batang_garis' ? V.slice(1) : [];
      lin.forEach(function (v, q) {
        var pt = v.map(function (x, i) { return [B.cx(i), B.y(x)]; }), w = c.warna(q + 1);
        c.add('path', { d: jalurGaris(pt, ''), fill: 'none', stroke: w, 'stroke-width': c.mini ? 1.5 : 2, 'stroke-linejoin': 'round' });
        if (!c.mini && n <= 24) pt.forEach(function (p) { c.add('circle', { cx: p[0], cy: p[1], r: 4, fill: w, stroke: c.t.sf, 'stroke-width': 2 }); });
      });
    }
    garisAcuan(c, B);
    if (m === 'pareto') { c.legenda([{ nama: ns > 1 ? 'Total' : (SR[0].nama || 'Nilai'), warna: c.warna(0) }, { nama: 'Kumulatif', warna: c.warna(1) }]); if (!c.mini) pitaHoverKhusus(c, B, function (i) { return [[ns > 1 ? 'Total' : (SR[0].nama || 'Nilai'), c.f.penuh(d.tot[i]), c.warna(0)], ['Kumulatif', c.f.penuh(kum[i]) + ' (' + V26.angka(d.total ? kum[i] / d.total * 100 : 0, 1) + '%)', c.warna(1)]]; }); }
    else { if (ns > 1) c.legenda(SR.map(function (s, k) { return { nama: s.nama, warna: c.warna(k) }; })); pitaHover(c, B, garisM); }
  }
  function pitaHoverKhusus(c, B, isi) {
    c.d.kat.forEach(function (k, i) { var r = c.add('rect', { x: B.x0 + B.pita * i, y: B.y0, width: B.pita, height: B.t, fill: c.t.tx, 'fill-opacity': 0 }); c.sorot(r, k, function () { return isi(i); }, function () { r.setAttribute('fill-opacity', .06); }, function () { r.setAttribute('fill-opacity', 0); }); });
  }
  function airTerjun(c) {
    c.atur(c.tinggiBaku());
    var d = c.d, nilai = d.tot.slice(), awal = [], akhir = [], a = 0; nilai.forEach(function (v) { awal.push(a); a += v; akhir.push(a); });
    d.kat.push('Total'); nilai.push(a); awal.push(0); akhir.push(a); d.seri.forEach(function (s) { s.nilai.push(jml(s.nilai)); }); d.tot.push(a);
    var B = bingkai(c, Math.min.apply(null, awal.concat(akhir, [0])), Math.max.apply(null, awal.concat(akhir, [0])) || 1, c.f.sumbu), jarak = Math.max(2, B.pita * .18), lb = B.pita - jarak * 2, wn = c.warna(0), wt = c.t.rd, wT = c.warna(1);
    nilai.forEach(function (v, i) {
      var total = i === nilai.length - 1, ya = B.y(Math.max(awal[i], akhir[i])), yb = B.y(Math.min(awal[i], akhir[i]));
      c.add('path', { d: batang(B.x0 + B.pita * i + jarak, ya, lb, Math.max(1, yb - ya), v >= 0 ? 'atas' : 'bawah'), fill: total ? wT : v >= 0 ? wn : wt });
      if (i < nilai.length - 2) c.add('line', { x1: B.x0 + B.pita * i + jarak + lb, x2: B.x0 + B.pita * (i + 1) + jarak, y1: B.y(akhir[i]), y2: B.y(akhir[i]), stroke: c.t.bd2, 'stroke-width': 1 });
      if (c.o.label !== false && nilai.length <= 14) c.tx(B.cx(i), ya - 5, (v > 0 && !total ? '+' : '') + c.f.ringkas(v), { jangkar: 'middle', warna: c.t.tx });
    });
    c.legenda([{ nama: 'Penambah', warna: wn }, { nama: 'Pengurang', warna: wt }, { nama: 'Total', warna: wT }]);
    if (!c.mini) pitaHoverKhusus(c, B, function (i) { return i === nilai.length - 1 ? [['Total', c.f.penuh(nilai[i]), wT]] : [[nilai[i] >= 0 ? 'Penambah' : 'Pengurang', c.f.penuh(nilai[i]), nilai[i] >= 0 ? wn : wt], ['Berjalan', c.f.penuh(akhir[i])]]; });
  }

  /* ---------- Model mendatar ---------- */
  function ukurDatar(c, n, tinggiBaris, kanan) {
    var mini = c.mini, tb = mini ? Math.max(4, (c.p.tinggi || 62) / Math.max(n, 1)) : tinggiBaris, mT = mini ? 2 : 8, mB = mini ? 2 : 8;
    c.atur(mT + mB + n * tb);
    var mL = mini ? 2 : Math.min(c.W * .38, Math.max.apply(null, c.d.kat.map(function (k) { return k.length; }).concat([3])) * 6.4 + 12), mR = mini ? 2 : (kanan == null ? 56 : kanan);
    if (mini) tb = (c.H - 4) / Math.max(n, 1);
    return { x0: mL, y0: mT, w: Math.max(20, c.W - mL - mR), tb: tb, labelMaks: Math.floor((mL - 10) / 6.2), cy: function (i) { return mT + tb * (i + .5); } };
  }
  function labelKiri(c, G) { c.d.kat.forEach(function (k, i) { c.tx(G.x0 - 8, G.cy(i) + 4, potong(k, G.labelMaks), { jangkar: 'end', warna: c.t.tx }); }); }
  function datar(c, m) {
    var d = c.d, n = d.kat.length, ns = d.seri.length, G = ukurDatar(c, n, n > 12 ? 24 : 30), hi = batasAtas(c, Math.max.apply(null, d.tot.concat([0]))) || 1, x = function (v) { return G.x0 + v / hi * G.w; }, tebal = Math.max(c.mini ? 3 : 8, G.tb * .62);
    labelKiri(c, G);
    if (!c.mini) c.add('line', { x1: G.x0, x2: G.x0, y1: G.y0, y2: c.H - 8, stroke: c.t.bd2, 'stroke-width': 1 });
    d.kat.forEach(function (k, i) {
      var y = G.cy(i) - tebal / 2;
      if (m === 'lollipop') { c.add('line', { x1: G.x0, x2: x(d.tot[i]), y1: G.cy(i), y2: G.cy(i), stroke: c.warna(0), 'stroke-width': c.mini ? 1.5 : 2 }); c.add('circle', { cx: x(d.tot[i]), cy: G.cy(i), r: c.mini ? 2.5 : 5, fill: c.warna(0), stroke: c.t.sf, 'stroke-width': c.mini ? 0 : 2 }); }
      else {
        var dari = 0, puncak = -1; d.seri.forEach(function (s, q) { if (s.nilai[i] > 0) puncak = q; });
        d.seri.forEach(function (s, q) { var x1 = x(dari), lw = x(dari + s.nilai[i]) - x1 - (dari > 0 && s.nilai[i] > 0 ? 2 : 0); if (lw > 0) c.add('path', { d: batang(dari > 0 ? x1 + 2 : x1, y, lw, tebal, q === puncak ? 'kanan' : ''), fill: c.warna(q) }); dari += s.nilai[i]; });
      }
      if (c.o.label !== false) c.tx(x(d.tot[i]) + (m === 'lollipop' ? 10 : 6), G.cy(i) + 4, c.f.ringkas(d.tot[i]), { warna: c.t.tx });
      var r = c.add('rect', { x: 0, y: G.y0 + G.tb * i, width: c.W, height: G.tb, fill: c.t.tx, 'fill-opacity': 0 });
      c.sorot(r, k, function () { return c.barisSeri(i).concat(ns > 1 ? [['Total', c.f.penuh(d.tot[i])]] : []); }, function () { r.setAttribute('fill-opacity', .05); }, function () { r.setAttribute('fill-opacity', 0); });
    });
    if (ns > 1 && m !== 'lollipop') c.legenda(d.seri.map(function (s, k) { return { nama: s.nama, warna: c.warna(k) }; }));
  }
  function piramida(c) {
    var d = c.d, n = d.kat.length, A = d.seri[0], Bz = d.seri[1] || { nama: '', nilai: d.kat.map(function () { return 0; }) }, tb = c.mini ? (c.p.tinggi || 62) / n : (n > 12 ? 24 : 30);
    c.atur(n * tb + (c.mini ? 0 : 16));
    var tengah = c.mini ? 4 : Math.min(c.W * .3, Math.max.apply(null, d.kat.map(function (k) { return k.length; })) * 6.4 + 16), sisi = (c.W - tengah) / 2 - (c.mini ? 2 : 44), hi = Math.max.apply(null, A.nilai.concat(Bz.nilai, [1])), tebal = Math.max(3, tb * .62);
    d.kat.forEach(function (k, i) {
      var cy = (c.mini ? 0 : 8) + tb * (i + .5), la = A.nilai[i] / hi * sisi, lb2 = Bz.nilai[i] / hi * sisi, xa = c.W / 2 - tengah / 2, xb = c.W / 2 + tengah / 2;
      c.add('path', { d: batang(xa - la, cy - tebal / 2, la, tebal, 'kiri'), fill: c.warna(0) }); c.add('path', { d: batang(xb, cy - tebal / 2, lb2, tebal, 'kanan'), fill: c.warna(1) });
      c.tx(c.W / 2, cy + 4, potong(k, Math.floor(tengah / 6.2) - 1), { jangkar: 'middle', warna: c.t.tx });
      if (c.o.label !== false) { c.tx(xa - la - 5, cy + 4, c.f.ringkas(A.nilai[i]), { jangkar: 'end' }); c.tx(xb + lb2 + 5, cy + 4, c.f.ringkas(Bz.nilai[i])); }
      var r = c.add('rect', { x: 0, y: cy - tb / 2, width: c.W, height: tb, fill: c.t.tx, 'fill-opacity': 0 }); c.sorot(r, k, function () { return c.barisSeri(i); }, function () { r.setAttribute('fill-opacity', .05); }, function () { r.setAttribute('fill-opacity', 0); });
    });
    c.legenda([{ nama: A.nama, warna: c.warna(0) }, { nama: Bz.nama, warna: c.warna(1) }]);
  }
  function corong(c) {
    var d = c.d, n = d.kat.length, tb = c.mini ? (c.p.tinggi || 62) / n : 34; c.atur(n * tb + (c.mini ? 0 : 8));
    var hi = Math.max.apply(null, d.tot.concat([1])), lebarMaks = c.mini ? c.W - 4 : Math.min(c.W * .5, c.W - 220), awal = d.tot[0] || 1;
    if (lebarMaks < 80) lebarMaks = c.W * .45;
    d.kat.forEach(function (k, i) {
      var cy = (c.mini ? 0 : 4) + tb * (i + .5), lw = Math.max(4, d.tot[i] / hi * lebarMaks), tebal = tb - (c.mini ? 1 : 4), x1 = c.W / 2 - lw / 2;
      c.add('rect', { x: x1, y: cy - tebal / 2, width: lw, height: tebal, rx: c.mini ? 1 : 4, fill: c.warna(i) });
      c.tx(c.W / 2 - lebarMaks / 2 - 10, cy + 4, potong(k, Math.floor((c.W / 2 - lebarMaks / 2 - 14) / 6.2)), { jangkar: 'end', warna: c.t.tx });
      c.tx(c.W / 2 + lebarMaks / 2 + 10, cy + 4, c.f.ringkas(d.tot[i]) + (i ? ' · ' + V26.angka(d.tot[i] / awal * 100, 0) + '%' : ''), { warna: c.t.tx });
      var r = c.add('rect', { x: 0, y: cy - tb / 2, width: c.W, height: tb, fill: c.t.tx, 'fill-opacity': 0 }); c.sorot(r, k, [[d.seri.length > 1 ? 'Total' : (d.seri[0].nama || 'Nilai'), c.f.penuh(d.tot[i]), c.warna(i)], ['Dari tahap pertama', V26.angka(d.tot[i] / awal * 100, 1) + '%']], function () { r.setAttribute('fill-opacity', .05); }, function () { r.setAttribute('fill-opacity', 0); });
    });
  }

  /* ---------- Tren khusus ---------- */
  function sparkline(c) {
    c.atur(c.p.tinggi || 120);
    var v = c.d.seri[0].nilai, n = v.length, hi = Math.max.apply(null, v), lo = Math.min.apply(null, v), mX = c.mini ? 4 : 44, mY = c.mini ? 6 : 22, w = c.W - mX * 2, t = c.H - mY * 2;
    var pt = v.map(function (x, i) { return [mX + (n > 1 ? i / (n - 1) : .5) * w, mY + t - (hi > lo ? (x - lo) / (hi - lo) : .5) * t]; }), wn = c.warna(0);
    c.add('path', { d: jalurGaris(pt, '') + 'L' + pt[n - 1][0] + ',' + (mY + t) + 'L' + pt[0][0] + ',' + (mY + t) + 'Z', fill: wn, 'fill-opacity': .12 });
    c.add('path', { d: jalurGaris(pt, ''), fill: 'none', stroke: wn, 'stroke-width': c.mini ? 1.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    c.add('circle', { cx: pt[n - 1][0], cy: pt[n - 1][1], r: c.mini ? 2.5 : 4, fill: wn, stroke: c.t.sf, 'stroke-width': c.mini ? 0 : 2 });
    c.tx(pt[0][0] - 8, pt[0][1] + 4, c.f.ringkas(v[0]), { jangkar: 'end' }); c.tx(pt[n - 1][0] + 8, pt[n - 1][1] + 4, c.f.ringkas(v[n - 1]), { warna: c.t.tx, tebal: 1 });
    c.tx(mX, c.H - 5, c.d.kat[0]); c.tx(c.W - mX, c.H - 5, c.d.kat[n - 1], { jangkar: 'end' });
    if (!c.mini) pt.forEach(function (p, i) { var r = c.add('rect', { x: p[0] - w / n / 2, y: 0, width: w / n, height: c.H, fill: c.t.tx, 'fill-opacity': 0 }); c.sorot(r, c.d.kat[i], function () { return c.barisSeri(i); }); });
  }
  function slope(c) {
    c.atur(c.p.tinggi || Math.max(220, Math.min(320, c.d.seri.length * 34 + 90)));
    var d = c.d, a = 0, b = d.kat.length - 1, nilai = [].concat.apply([], d.seri.map(function (s) { return [s.nilai[a], s.nilai[b]]; })), hi = Math.max.apply(null, nilai), lo = Math.min.apply(null, nilai);
    var mX = c.mini ? 8 : Math.min(c.W * .34, 150), mT = c.mini ? 6 : 30, mB = c.mini ? 6 : 14, t = c.H - mT - mB, y = function (v) { return mT + t - (hi > lo ? (v - lo) / (hi - lo) : .5) * t; }, x1 = mX, x2 = c.W - mX;
    [x1, x2].forEach(function (x) { c.add('line', { x1: x, x2: x, y1: mT - 6, y2: mT + t + 6, stroke: c.t.bd2, 'stroke-width': 1 }); });
    c.tx(x1, 14, d.kat[a], { jangkar: 'middle', warna: c.t.tx, tebal: 1 }); c.tx(x2, 14, d.kat[b], { jangkar: 'middle', warna: c.t.tx, tebal: 1 });
    d.seri.forEach(function (s, k) {
      var w = c.warna(k), g = c.add('g', {});
      c.add('line', { x1: x1, x2: x2, y1: y(s.nilai[a]), y2: y(s.nilai[b]), stroke: w, 'stroke-width': c.mini ? 1.5 : 2, 'stroke-linecap': 'round' }, g);
      [[x1, s.nilai[a]], [x2, s.nilai[b]]].forEach(function (p) { c.add('circle', { cx: p[0], cy: y(p[1]), r: c.mini ? 2.5 : 4.5, fill: w, stroke: c.t.sf, 'stroke-width': c.mini ? 0 : 2 }, g); });
      c.tx(x1 - 10, y(s.nilai[a]) + 4, (d.seri.length > 1 ? potong(s.nama, 12) + ' ' : '') + c.f.ringkas(s.nilai[a]), { jangkar: 'end', warna: c.t.tx });
      c.tx(x2 + 10, y(s.nilai[b]) + 4, c.f.ringkas(s.nilai[b]) + (d.seri.length > 1 ? ' ' + potong(s.nama, 12) : ''), { warna: c.t.tx });
      var garisSentuh = c.add('line', { x1: x1, x2: x2, y1: y(s.nilai[a]), y2: y(s.nilai[b]), stroke: c.t.tx, 'stroke-opacity': 0, 'stroke-width': 16 });
      c.sorot(garisSentuh, s.nama || 'Nilai', [[d.kat[a], c.f.penuh(s.nilai[a])], [d.kat[b], c.f.penuh(s.nilai[b])], ['Selisih', (s.nilai[b] >= s.nilai[a] ? '+' : '') + c.f.penuh(s.nilai[b] - s.nilai[a])]]);
    });
    if (d.seri.length > 1) c.legenda(d.seri.map(function (s, k) { return { nama: s.nama, warna: c.warna(k) }; }));
  }

  /* ---------- Komposisi ---------- */
  function legendaKategori(c) { var d = c.d; c.legenda(d.kat.map(function (k, i) { return { nama: k, warna: c.warna(i), nilai: c.f.ringkas(d.tot[i]) + ' · ' + V26.angka(d.total ? d.tot[i] / d.total * 100 : 0, 1) + '%' }; })); }
  function bundar(c, m) {
    var d = c.d, setengah = m === 'setengah_donat', H = c.atur(c.p.tinggi || (setengah ? Math.min(200, c.W * .5) : Math.min(260, Math.max(180, c.W * .6))));
    var R = setengah ? Math.min(c.W / 2 - 6, H - (c.mini ? 4 : 14)) : Math.min(c.W, H) / 2 - (c.mini ? 2 : 6), cx = c.W / 2, cy = setengah ? H - (c.mini ? 2 : 8) : H / 2, r0 = m === 'pai' ? 0 : R * (setengah ? .58 : .62);
    var a = setengah ? Math.PI : -Math.PI / 2, rentang = setengah ? Math.PI : Math.PI * 2, tot = d.total || 1;
    d.kat.forEach(function (k, i) {
      if (d.tot[i] <= 0) return; var b = a + d.tot[i] / tot * rentang;
      var e = c.add('path', { d: busur(cx, cy, R, r0, a, b), fill: c.warna(i), stroke: c.t.sf, 'stroke-width': c.mini ? 1 : 2, 'stroke-linejoin': 'round' });
      c.sorot(e, k, [[d.seri.length > 1 ? 'Total' : (d.seri[0].nama || 'Nilai'), c.f.penuh(d.tot[i]), c.warna(i)], ['Porsi', V26.angka(d.tot[i] / tot * 100, 1) + '%']], function () { e.setAttribute('fill-opacity', .82); }, function () { e.setAttribute('fill-opacity', 1); });
      a = b;
    });
    if (r0 > 0 && !c.mini) { c.tx(cx, cy - (setengah ? 16 : 0), c.f.ringkas(d.total), { jangkar: 'middle', warna: c.t.tx, ukuran: Math.max(16, Math.min(26, r0 * .42)), tebal: 1 }); c.tx(cx, cy + (setengah ? 0 : 18), 'Total' + (c.p.satuan && c.p.satuan !== 'rupiah' && c.p.satuan !== 'persen' ? ' ' + c.p.satuan : ''), { jangkar: 'middle' }); }
    legendaKategori(c);
  }
  function waffle(c) {
    var d = c.d, sisi = c.mini ? 5 : Math.max(10, Math.min(22, Math.floor((Math.min(c.W, 300) - 20) / 10))), celah = c.mini ? 1 : 2, ukuran = sisi * 10 + celah * 9; c.atur(ukuran + (c.mini ? 4 : 12));
    var tot = d.total || 1, pas = d.tot.map(function (v) { return v / tot * 100; }), kotak = pas.map(Math.floor), sisa = 100 - jml(kotak);
    pas.map(function (v, i) { return [v - kotak[i], i]; }).sort(function (a, b) { return b[0] - a[0]; }).slice(0, sisa).forEach(function (x) { kotak[x[1]]++; });
    var x0 = (c.W - ukuran) / 2, y0 = c.mini ? 2 : 6, n = 0;
    kotak.forEach(function (jm, i) { for (var q = 0; q < jm; q++, n++) { var e = c.add('rect', { x: x0 + (n % 10) * (sisi + celah), y: y0 + Math.floor(n / 10) * (sisi + celah), width: sisi, height: sisi, rx: c.mini ? 1 : 3, fill: c.warna(i) }); c.sorot(e, d.kat[i], [['Nilai', c.f.penuh(d.tot[i]), c.warna(i)], ['Porsi', V26.angka(pas[i], 1) + '%']]); } });
    legendaKategori(c);
  }
  /** Tata letak treemap "squarify": persegi sedekat mungkin dengan bujur sangkar. */
  function petak(item, x, y, w, t) {
    var hasil = [], sisa = item.filter(function (i) { return i.v > 0; }).sort(function (a, b) { return b.v - a.v; }), total = jml(sisa.map(function (i) { return i.v; }));
    function buruk(baris, sisi, luas) { var s = jml(baris.map(function (i) { return i.v; })) * luas, mx = Math.max.apply(null, baris.map(function (i) { return i.v * luas; })), mn = Math.min.apply(null, baris.map(function (i) { return i.v * luas; })); return Math.max(sisi * sisi * mx / (s * s), s * s / (sisi * sisi * mn)); }
    while (sisa.length) {
      var luas = w * t / total, sisi = Math.min(w, t), baris = [sisa[0]], i = 1;
      while (i < sisa.length && buruk(baris.concat([sisa[i]]), sisi, luas) <= buruk(baris, sisi, luas)) baris.push(sisa[i++]);
      var jb = jml(baris.map(function (b) { return b.v; })), tebal = jb * luas / sisi, pos = 0;
      baris.forEach(function (b) { var pj = b.v * luas / tebal; hasil.push(w >= t ? { it: b, x: x, y: y + pos, w: tebal, t: pj } : { it: b, x: x + pos, y: y, w: pj, t: tebal }); pos += pj; });
      if (w >= t) { x += tebal; w -= tebal; } else { y += tebal; t -= tebal; }
      total -= jb; sisa = sisa.slice(baris.length);
    }
    return hasil;
  }
  function treemap(c) {
    var d = c.d, H = c.atur(c.p.tinggi || Math.max(220, Math.min(320, c.W * .5))), multi = d.seri.length > 1, tot = d.total || 1;
    petak(d.kat.map(function (k, i) { return { k: k, i: i, v: d.tot[i] }; }), 0, 0, c.W, H).forEach(function (p) {
      var i = p.it.i, g = c.mini ? .5 : 1, x = p.x + g, y = p.y + g, w = Math.max(0, p.w - g * 2), t = Math.max(0, p.t - g * 2);
      if (multi) {
        var pos = 0, mendatar = w >= t, pj = mendatar ? w : t;
        d.seri.forEach(function (s, q) { var bag = d.tot[i] ? s.nilai[i] / d.tot[i] * pj : 0; if (bag > .5) { var e = c.add('rect', mendatar ? { x: x + pos, y: y, width: Math.max(0, bag - 1), height: t } : { x: x, y: y + pos, width: w, height: Math.max(0, bag - 1) }); e.setAttribute('fill', c.warna(q)); e.setAttribute('fill-opacity', .3); e.setAttribute('stroke', c.warna(q)); e.setAttribute('stroke-width', c.mini ? .8 : 1.5); } pos += bag; });
      } else c.add('rect', { x: x, y: y, width: w, height: t, rx: c.mini ? 1 : 4, fill: c.warna(i), 'fill-opacity': .28, stroke: c.warna(i), 'stroke-width': c.mini ? .8 : 1.5 });
      if (w > 46 && t > 30) { c.tx(x + 7, y + 16, potong(p.it.k, Math.floor((w - 12) / 6.4)), { warna: c.t.tx, tebal: 1, ukuran: 12 }); c.tx(x + 7, y + 31, c.f.ringkas(d.tot[i]) + ' · ' + V26.angka(d.tot[i] / tot * 100, 0) + '%', { warna: c.t.tx }); }
      var r = c.add('rect', { x: p.x, y: p.y, width: p.w, height: p.t, fill: c.t.tx, 'fill-opacity': 0 });
      c.sorot(r, p.it.k, function () { return (multi ? c.barisSeri(i) : []).concat([[multi ? 'Total' : (d.seri[0].nama || 'Nilai'), c.f.penuh(d.tot[i]), multi ? null : c.warna(i)], ['Porsi', V26.angka(d.tot[i] / tot * 100, 1) + '%']]); }, function () { r.setAttribute('fill-opacity', .06); }, function () { r.setAttribute('fill-opacity', 0); });
    });
    if (multi) c.legenda(d.seri.map(function (s, k) { return { nama: s.nama, warna: c.warna(k) }; }));
  }
  function sunburst(c) {
    var d = c.d, H = c.atur(c.p.tinggi || Math.min(280, Math.max(200, c.W * .6))), R = Math.min(c.W, H) / 2 - (c.mini ? 2 : 6), cx = c.W / 2, cy = H / 2, a = -Math.PI / 2, tot = d.total || 1;
    d.kat.forEach(function (k, i) {
      if (d.tot[i] <= 0) return; var b = a + d.tot[i] / tot * Math.PI * 2, e = c.add('path', { d: busur(cx, cy, R * .62, R * .32, a, b), fill: i % 2 ? c.t.bd2 : c.t.rd, 'fill-opacity': i % 2 ? 1 : .55, stroke: c.t.sf, 'stroke-width': c.mini ? 1 : 2 });
      c.sorot(e, k, function () { return c.barisSeri(i).concat([['Total', c.f.penuh(d.tot[i])], ['Porsi', V26.angka(d.tot[i] / tot * 100, 1) + '%']]); });
      var a2 = a; d.seri.forEach(function (s, q) { if (s.nilai[i] <= 0) return; var b2 = a2 + s.nilai[i] / tot * Math.PI * 2, e2 = c.add('path', { d: busur(cx, cy, R, R * .64, a2, b2), fill: c.warna(q), stroke: c.t.sf, 'stroke-width': c.mini ? 1 : 2 }); c.sorot(e2, k + ' › ' + s.nama, [['Nilai', c.f.penuh(s.nilai[i]), c.warna(q)], ['Porsi dari total', V26.angka(s.nilai[i] / tot * 100, 1) + '%']]); a2 = b2; });
      var tengahSudut = (a + b) / 2; if (b - a > .45 && !c.mini && R > 80) c.tx(cx + R * .47 * Math.cos(tengahSudut), cy + R * .47 * Math.sin(tengahSudut) + 4, potong(k, 8), { jangkar: 'middle', warna: c.t.tx, ukuran: 10 });
      a = b;
    });
    c.tx(cx, cy + 5, c.f.ringkas(d.total), { jangkar: 'middle', warna: c.t.tx, tebal: 1, ukuran: 14 });
    c.legenda(d.seri.map(function (s, k) { return { nama: s.nama, warna: c.warna(k) }; }));
  }

  /* ---------- Pencapaian ---------- */
  function capaian(c) {
    var d = c.d, v = d.seri[0].nilai, tg = c.o.nilaiTarget != null ? v.map(function () { return +c.o.nilaiTarget; }) : (d.target || v.map(function () { return null; })), ada = tg.filter(function (x) { return x != null; });
    var persen = c.p.satuan === 'persen', nilai = persen ? (v.length ? jml(v) / v.length : 0) : jml(v), target = ada.length ? (persen ? jml(ada) / ada.length : jml(ada)) : (persen ? 100 : null);
    return { v: v, tg: tg, nilai: nilai, target: target, pct: target ? nilai / target * 100 : null, banyak: v.length > 1 };
  }
  function kpi(c) {
    c.atur(c.p.tinggi || 150);
    var d = c.d, tren = c.p.bentuk === 'tren', v = d.seri[0].nilai, K = capaian(c), utama = tren ? v[v.length - 1] : (c.p.bentuk === 'pencapaian' ? K.nilai : d.total);
    if (c.mini) { c.add('rect', { x: 8, y: 14, width: c.W * .5, height: 14, rx: 3, fill: c.t.tx, 'fill-opacity': .75 }); c.add('rect', { x: 8, y: 36, width: c.W * .3, height: 7, rx: 3, fill: c.warna(0) }); return; }
    c.tx(16, 30, tren ? d.kat[d.kat.length - 1] : (c.p.bentuk === 'pencapaian' && K.banyak ? 'Rata-rata ' + d.kat.length + ' baris' : 'Total ' + d.kat.length + ' kategori'), { ukuran: 12 });
    c.tx(16, 78, c.f.penuh(utama), { warna: c.t.tx, ukuran: Math.min(40, Math.max(24, c.W / 12)), tebal: 1 });
    if (tren && v.length > 1) {
      var lalu = v[v.length - 2], sel = utama - lalu, naik = sel >= 0;
      c.tx(16, 108, (naik ? '▲ naik ' : '▼ turun ') + c.f.penuh(Math.abs(sel)) + (lalu ? ' (' + V26.angka(Math.abs(sel) / Math.abs(lalu) * 100, 1) + '%)' : '') + ' dari ' + d.kat[d.kat.length - 2], { warna: c.t.tx, ukuran: 12, tebal: 1 });
      var hi = Math.max.apply(null, v), lo = Math.min.apply(null, v), x0 = Math.max(16, c.W * .55), w = c.W - x0 - 16, pt = v.map(function (x, i) { return [x0 + i / (v.length - 1) * w, 40 + 70 - (hi > lo ? (x - lo) / (hi - lo) : .5) * 70]; });
      if (w > 60) { c.add('path', { d: jalurGaris(pt, ''), fill: 'none', stroke: c.warna(0), 'stroke-width': 2, 'stroke-linejoin': 'round' }); c.add('circle', { cx: pt[pt.length - 1][0], cy: pt[pt.length - 1][1], r: 4, fill: c.warna(0), stroke: c.t.sf, 'stroke-width': 2 }); }
    } else if (c.p.bentuk === 'pencapaian' && K.target != null) c.tx(16, 108, 'Target ' + c.f.penuh(K.target) + ' · tercapai ' + V26.angka(K.pct, 1) + '%', { warna: c.t.tx, ukuran: 12 });
    else c.tx(16, 108, 'Terbesar: ' + d.kat[d.tot.indexOf(Math.max.apply(null, d.tot))] + ' (' + c.f.penuh(Math.max.apply(null, d.tot)) + ')', { ukuran: 12 });
  }
  function cincinGauge(c, m) {
    var K = capaian(c), gauge = m === 'speedometer', H = c.atur(c.p.tinggi || (gauge ? Math.min(190, c.W * .5) : 200)), R = gauge ? Math.min(c.W / 2 - 10, H - (c.mini ? 6 : 26)) : Math.min(c.W, H) / 2 - (c.mini ? 3 : 10), cx = c.W / 2, cy = gauge ? H - (c.mini ? 4 : 22) : H / 2;
    var tebal = Math.max(c.mini ? 5 : 12, R * .2), a0 = gauge ? Math.PI : -Math.PI / 2, rentang = gauge ? Math.PI : Math.PI * 2, pct = Math.max(0, Math.min(100, K.pct == null ? 0 : K.pct));
    c.add('path', { d: busur(cx, cy, R, R - tebal, a0, a0 + rentang), fill: c.t.bd });
    if (pct > 0) { var e = c.add('path', { d: busur(cx, cy, R, R - tebal, a0, a0 + rentang * pct / 100), fill: c.warna(0) }); c.sorot(e, c.d.seri[0].nama || 'Capaian', [['Nilai', c.f.penuh(K.nilai), c.warna(0)], ['Target', K.target == null ? '—' : c.f.penuh(K.target)], ['Tercapai', K.pct == null ? '—' : V26.angka(K.pct, 1) + '%']]); }
    c.tx(cx, cy - (gauge ? 8 : -4), K.pct == null ? c.f.ringkas(K.nilai) : V26.angka(K.pct, K.pct % 1 ? 1 : 0) + '%', { jangkar: 'middle', warna: c.t.tx, tebal: 1, ukuran: Math.max(18, R * .34) });
    c.tx(cx, cy + (gauge ? 14 : 22), (K.banyak ? 'Rata-rata ' + c.d.kat.length + ' baris' : c.d.kat[0] || '') + (K.target != null ? ' · target ' + c.f.ringkas(K.target) : ''), { jangkar: 'middle' });
    if (gauge && !c.mini) { c.tx(cx - R + tebal / 2, cy + 14, '0', { jangkar: 'middle' }); c.tx(cx + R - tebal / 2, cy + 14, '100%', { jangkar: 'middle' }); }
  }
  function kemajuan(c, m) {
    var d = c.d, K = capaian(c), n = d.kat.length, G = ukurDatar(c, n, 34, 64), bullet = m === 'bullet', hi = bullet ? Math.max.apply(null, K.v.concat(K.tg.filter(function (x) { return x != null; }), [1])) * 1.08 : null;
    labelKiri(c, G);
    d.kat.forEach(function (k, i) {
      var tg = K.tg[i] == null ? (c.p.satuan === 'persen' ? 100 : null) : K.tg[i], cy = G.cy(i), tebal = Math.max(c.mini ? 3 : 10, G.tb * (bullet ? .5 : .36)), penuh = bullet ? hi : (tg || Math.max.apply(null, K.v.concat([1]))), lw = Math.max(0, Math.min(1, K.v[i] / penuh)) * G.w;
      c.add('rect', { x: G.x0, y: cy - tebal / 2, width: G.w, height: tebal, rx: c.mini ? 1 : (bullet ? 3 : tebal / 2), fill: c.t.bd });
      if (lw > 0) c.add(bullet ? 'path' : 'rect', bullet ? { d: batang(G.x0, cy - tebal * .28, lw, tebal * .56, 'kanan', 3), fill: c.warna(0) } : { x: G.x0, y: cy - tebal / 2, width: Math.max(lw, c.mini ? 2 : tebal), height: tebal, rx: c.mini ? 1 : tebal / 2, fill: c.warna(0) });
      if (bullet && tg != null) c.add('rect', { x: G.x0 + tg / hi * G.w - 1.5, y: cy - tebal * .75, width: 3, height: tebal * 1.5, fill: c.t.tx });
      c.tx(G.x0 + G.w + 8, cy + 4, bullet ? c.f.ringkas(K.v[i]) : (tg ? V26.angka(K.v[i] / tg * 100, 0) + '%' : c.f.ringkas(K.v[i])), { warna: c.t.tx, tebal: 1 });
      var r = c.add('rect', { x: 0, y: G.y0 + G.tb * i, width: c.W, height: G.tb, fill: c.t.tx, 'fill-opacity': 0 });
      c.sorot(r, k, [[d.seri[0].nama || 'Nilai', c.f.penuh(K.v[i]), c.warna(0)], ['Target', tg == null ? '—' : c.f.penuh(tg)], ['Tercapai', tg ? V26.angka(K.v[i] / tg * 100, 1) + '%' : '—']], function () { r.setAttribute('fill-opacity', .05); }, function () { r.setAttribute('fill-opacity', 0); });
    });
    if (bullet) c.legenda([{ nama: d.seri[0].nama || 'Realisasi', warna: c.warna(0) }, { nama: 'Target', warna: c.t.tx }]);
  }

  var PELUKIS = { batang_tegak: tegak, batang_kelompok: tegak, batang_tumpuk: tegak, batang_tumpuk100: tegak, batang_garis: tegak, pareto: tegak, garis: tegak, garis_halus: tegak, garis_tingkat: tegak, area: tegak, area_tumpuk: tegak, area_tumpuk100: tegak,
    batang_datar: datar, lollipop: datar, piramida: piramida, sparkline: sparkline, slope: slope, pai: bundar, donat: bundar, setengah_donat: bundar, treemap: treemap, sunburst: sunburst, waffle: waffle, air_terjun: airTerjun, corong: corong,
    kpi: kpi, speedometer: cincinGauge, cincin: cincinGauge, batang_kemajuan: kemajuan, bullet: kemajuan };

  /** Gambar mungil untuk 12 model yang menyusul di v2.6.3 (hanya ilustrasi di galeri, bukan grafik data). */
  function glif(el, id, W, H) {
    var t = token(), s = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, 'aria-hidden': 'true' }), a = function (tag, o) { s.appendChild(S(tag, o)); }, w = t.rd, i, j;
    if (id === 'histogram') [14, 26, 40, 46, 34, 22, 10].forEach(function (v, q) { a('rect', { x: 10 + q * 14, y: H - 6 - v, width: 13, height: v, fill: w }); });
    else if (id === 'box_plot') [[20, 12, 40], [50, 20, 30], [80, 8, 44]].forEach(function (b) { a('line', { x1: b[0] + 8, x2: b[0] + 8, y1: b[1] - 6, y2: b[1] + b[2] + 4, stroke: w, 'stroke-width': 1.5 }); a('rect', { x: b[0], y: b[1], width: 16, height: b[2] * .6, fill: t.sf, stroke: w, 'stroke-width': 1.5 }); a('line', { x1: b[0], x2: b[0] + 16, y1: b[1] + b[2] * .3, y2: b[1] + b[2] * .3, stroke: w, 'stroke-width': 1.5 }); });
    else if (id === 'scatter' || id === 'bubble') [[14, 44, 3], [28, 36, 5], [40, 40, 4], [52, 26, 7], [66, 30, 4], [78, 18, 6], [92, 14, 9], [60, 46, 3]].forEach(function (p) { a('circle', { cx: p[0], cy: p[1], r: id === 'bubble' ? p[2] : 3, fill: w, 'fill-opacity': id === 'bubble' ? .5 : 1 }); });
    else if (id === 'heatmap' || id === 'kalender_panas') for (i = 0; i < (id === 'heatmap' ? 7 : 13); i++) for (j = 0; j < (id === 'heatmap' ? 4 : 5); j++) a('rect', { x: 8 + i * (id === 'heatmap' ? 14 : 7.6), y: 6 + j * (id === 'heatmap' ? 12 : 10), width: id === 'heatmap' ? 12 : 6, height: id === 'heatmap' ? 10 : 8, rx: 1.5, fill: w, 'fill-opacity': .15 + ((i * 7 + j * 13) % 9) / 10 });
    else if (id === 'radar' || id === 'polar') { var cx = W / 2, cy = H / 2, R = H / 2 - 4, pt = [.9, .6, .8, .5, .7, .75].map(function (v, q) { var ang = -Math.PI / 2 + q * Math.PI / 3; return [cx + R * v * Math.cos(ang), cy + R * v * Math.sin(ang)]; }); a('circle', { cx: cx, cy: cy, r: R, fill: 'none', stroke: t.bd2 }); a('circle', { cx: cx, cy: cy, r: R / 2, fill: 'none', stroke: t.bd2 }); if (id === 'radar') a('polygon', { points: pt.map(function (p) { return p.join(','); }).join(' '), fill: w, 'fill-opacity': .3, stroke: w, 'stroke-width': 1.5 }); else [.9, .6, .8, .5, .7, .75].forEach(function (v, q) { s.appendChild(S('path', { d: busur(cx, cy, R * v, 0, -Math.PI / 2 + q * Math.PI / 3, -Math.PI / 2 + (q + 1) * Math.PI / 3), fill: w, 'fill-opacity': .3 + q * .1, stroke: t.sf })); }); }
    else if (id === 'sankey') { [[6, 6, 20], [6, 30, 14], [6, 48, 8]].forEach(function (b) { a('rect', { x: b[0], y: b[1], width: 6, height: b[2], fill: w }); }); [[W - 12, 6, 12], [W - 12, 22, 24], [W - 12, 50, 6]].forEach(function (b) { a('rect', { x: b[0], y: b[1], width: 6, height: b[2], fill: w }); }); [[16, 34, 8], [37, 30, 10], [52, 53, 5]].forEach(function (f) { s.appendChild(S('path', { d: 'M12,' + f[0] + 'C' + W / 2 + ',' + f[0] + ' ' + W / 2 + ',' + f[1] + ' ' + (W - 12) + ',' + f[1], fill: 'none', stroke: w, 'stroke-opacity': .35, 'stroke-width': f[2] })); }); }
    else if (id === 'gantt') [[10, 30], [26, 44], [40, 26], [58, 40], [20, 60]].forEach(function (b, q) { a('rect', { x: b[0], y: 6 + q * 11, width: b[1], height: 7, rx: 3, fill: w, 'fill-opacity': .4 + q * .12 }); });
    else if (id === 'peta_titik') { s.appendChild(S('path', { d: 'M10,40Q20,10 50,14T100,24Q108,44 80,52T30,54Z', fill: t.sf2, stroke: t.bd2 })); [[30, 30, 5], [56, 24, 8], [78, 36, 4], [48, 44, 3]].forEach(function (p) { a('circle', { cx: p[0], cy: p[1], r: p[2], fill: w, 'fill-opacity': .7 }); }); }
    else for (i = 0; i < 4; i++) { a('rect', { x: 8, y: 8 + i * 13, width: 30, height: 6, rx: 2, fill: t.bd2 }); a('rect', { x: 46, y: 8 + i * 13, width: [58, 40, 30, 16][i], height: 6, rx: 3, fill: w }); }
    el.appendChild(s);
  }

  /** Menggambar grafik. p = {model, data:{kategori,seri,target}, bentuk, satuan, opsi, judul, tinggi, lebar, mini} */
  function gambar(el, p) {
    V26.kosongkan(el); el.classList.add('v26-grafik');
    if (!p.data || !(p.data.kategori || []).length) { if (!p.mini) el.appendChild(h('div.v26-kosong', { gaya: 'padding:28px 12px' }, V26.ikon('grafik'), h('p', null, 'Belum ada data untuk grafik ini.'))); return null; }
    var c;
    try { c = new Konteks(el, p); (PELUKIS[p.model] || tegak)(c, PELUKIS[p.model] ? p.model : 'batang_tegak'); }
    catch (e) { V26.isi(el, h('div.v26-kosong', { gaya: 'padding:24px 12px' }, V26.ikon('awas'), h('p', null, 'Grafik tidak bisa digambar dengan model ini. Buka tampilan tabel atau pilih model lain.'))); return null; }
    var pos = c.o.legenda || 'bawah', leg = c.leg && pos !== 'sembunyi' ? h('div.v26-legenda', { gaya: pos === 'kanan' ? 'flex-direction:column;min-width:130px;max-width:42%' : 'margin:' + (pos === 'atas' ? '0 0 8px' : '8px 0 0') }, c.leg.map(function (it) { return h('span', null, h('i', { gaya: 'background:' + it.warna + ';border-color:transparent' }), h('span', { gaya: 'color:var(--tx)' }, it.nama), it.nilai ? h('span', null, ' · ' + it.nilai) : null); })) : null;
    var badan = h('div', { gaya: 'position:relative;flex:1;min-width:0' }, c.svg);
    if (p.mini) el.appendChild(c.svg);
    else if (leg && pos === 'kanan' && c.W >= 420) { el.appendChild(h('div', { gaya: 'display:flex;gap:16px;align-items:center' }, badan, leg)); }
    else { if (leg && pos === 'atas') el.appendChild(leg); el.appendChild(c.svg); if (leg && pos !== 'atas') el.appendChild(leg); }
    if (!p.mini) el.appendChild(c.tipEl);
    return { svg: c.svg, legenda: c.leg || [], d: c.d, f: c.f, t: c.t };
  }
  /** Tabel data di balik grafik (angka yang sama, tanpa pembulatan grafik). */
  function tabelData(data, satuan) {
    var kat = data.kategori || [], seri = data.seri || [], adaT = !!data.target, f = pemformat({}, satuan, 0, 0), multi = seri.length > 1;
    return h('div.v26-gulung', null, h('table.v26-tabel', null, h('thead', null, h('tr', null, h('th', null, 'Kategori'), seri.map(function (s) { return h('th.kanan', null, s.nama || 'Nilai'); }), multi ? h('th.kanan', null, 'Total') : null, adaT ? h('th.kanan', null, 'Target') : null)),
      h('tbody', null, kat.map(function (k, i) { return h('tr', null, h('td', null, k), seri.map(function (s) { return h('td.kanan.v26-angka', null, f.penuh(Number(s.nilai[i]) || 0)); }), multi ? h('td.kanan.v26-angka.v26-tebal', null, f.penuh(jml(seri.map(function (s) { return s.nilai[i]; })))) : null, adaT ? h('td.kanan.v26-angka', null, data.target[i] == null ? '—' : f.penuh(data.target[i])) : null); }),
        kat.length > 1 && satuan !== 'persen' ? h('tr', null, h('td.v26-tebal', null, 'Jumlah'), seri.map(function (s) { return h('td.kanan.v26-angka.v26-tebal', null, f.penuh(jml(s.nilai))); }), multi ? h('td.kanan.v26-angka.v26-tebal', null, f.penuh(jml(seri.map(function (s) { return jml(s.nilai); })))) : null, adaT ? h('td') : null) : null)));
  }
  function dataKeBaris(data) { var seri = data.seri || []; return { kepala: ['Kategori'].concat(seri.map(function (s) { return s.nama || 'Nilai'; }), data.target ? ['Target'] : []), baris: (data.kategori || []).map(function (k, i) { return [k].concat(seri.map(function (s) { return s.nilai[i]; }), data.target ? [data.target[i] == null ? '' : data.target[i]] : []); }) }; }
  /** Unduh PNG: judul + grafik + legenda di atas latar permukaan tema yang sedang dipakai. */
  function unduhPng(hasil, judul, nama) {
    if (!hasil) return Promise.reject(new Error('Grafik belum tergambar.'));
    return new Promise(function (ok, gagal) {
      var svg = hasil.svg, W = +svg.getAttribute('width'), H = +svg.getAttribute('height'), sk = 2, atas = 40, leg = hasil.legenda, bawah = leg.length ? 16 + Math.ceil(leg.length / 3) * 20 : 12;
      var salin = svg.cloneNode(true); salin.setAttribute('xmlns', NS); salin.setAttribute('font-family', 'Inter, Arial, sans-serif');
      var img = new Image(), url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(salin)], { type: 'image/svg+xml;charset=utf-8' }));
      img.onload = function () {
        var cv = document.createElement('canvas'); cv.width = (W + 32) * sk; cv.height = (H + atas + bawah) * sk; var g = cv.getContext('2d'); g.scale(sk, sk);
        g.fillStyle = hasil.t.sf; g.fillRect(0, 0, W + 32, H + atas + bawah); g.fillStyle = hasil.t.tx; g.font = '600 15px Inter, Arial, sans-serif'; g.fillText(judul || 'Grafik', 16, 26);
        g.drawImage(img, 16, atas, W, H); g.font = '12px Inter, Arial, sans-serif';
        leg.forEach(function (it, i) { var x = 16 + (i % 3) * ((W) / 3), y = atas + H + 18 + Math.floor(i / 3) * 20; g.fillStyle = it.warna; g.fillRect(x, y - 9, 10, 10); g.fillStyle = hasil.t.tx; g.fillText(potong(it.nama + (it.nilai ? ' · ' + it.nilai : ''), Math.floor(W / 3 / 6.6)), x + 16, y); });
        URL.revokeObjectURL(url); cv.toBlob(function (b) { if (!b) return gagal(new Error('Gambar tidak bisa dibuat.')); V26.unduhBlob(b, (nama || 'grafik') + '.png'); ok(); }, 'image/png');
      };
      img.onerror = function () { URL.revokeObjectURL(url); gagal(new Error('Gambar tidak bisa dibuat di peramban ini.')); };
      img.src = url;
    });
  }
  return { gambar: gambar, glif: glif, tabelData: tabelData, dataKeBaris: dataKeBaris, unduhPng: unduhPng, PALET: PALET, NAMA_PALET: NAMA_PALET, punya: function (id) { return !!PELUKIS[id]; } };
})();
