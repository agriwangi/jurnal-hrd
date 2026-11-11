/* Jurnal HRD v2.6.1-a — modul layar ABSENSI BULANAN: matriks karyawan × tanggal, rekap per karyawan, per hari, per divisi, dan unggah Excel.
   Semua angka dihitung server dengan satu definisi % absensi dan pembagi hari kerja yang dijalani. Modul malas. */
V26.modul.absensi = (function () {
  'use strict';
  var h = V26.h, api = V26.api, ikon = V26.ikon;
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'], HARI = ['', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  var st = { el: null, th: 0, bl: 0, hal: 1, q: '', divisi: '', belum: false, data: null };
  function pct(x) { return V26.angka(x * 100, 2) + '%'; }
  function buka(el) { st.el = el; if (!st.th) { var n = new Date(); st.th = n.getFullYear(); st.bl = n.getMonth() + 1; } muat(); }
  function muat(diam) {
    if (!diam) V26.rangkaBlok(st.el, 6);
    return api('absBulan', st.th, st.bl, { hal: st.hal, ukuran: 50, q: st.q, divisi: st.divisi, hanyaBelum: st.belum }).then(function (d) { st.data = d; gambar(); }, function (e) { V26.galatMuat(st.el, e, function () { muat(); }); });
  }
  function warna(d, k) { for (var i = 0; i < d.kode.length; i++) if (d.kode[i].k === k) return d.kode[i]; return null; }
  function chip(d, k) { if (!k) return h('span.v26-abs-kosong', null, '·'); var x = warna(d, k); return V26.chipKode(k, x ? x.w : '', x ? x.sistem : false); }
  function gambar() {
    var d = st.data, el = st.el;
    var pilihBl = h('select.v26-in', { 'aria-label': 'Bulan', gaya: 'width:auto' }, BULAN.map(function (b, i) { return h('option', { value: i + 1, selected: i + 1 === d.bl }, b); }));
    var thn = []; for (var y = d.th - 3; y <= d.th + 1; y++) thn.push(y);
    var pilihTh = h('select.v26-in', { 'aria-label': 'Tahun', gaya: 'width:auto' }, thn.map(function (y) { return h('option', { value: y, selected: y === d.th }, y); }));
    function ganti() { st.bl = +pilihBl.value; st.th = +pilihTh.value; st.hal = 1; st.divisi = ''; muat(); }
    pilihBl.addEventListener('change', ganti); pilihTh.addEventListener('change', ganti);
    var aksi = [pilihBl, pilihTh, h('button.v26-btn', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, unduh); } }, ikon('unduh'), 'Unduh'),
      d.bolehUbah ? h('button.v26-btn.utama', { type: 'button', onclick: laciUnggah }, ikon('impor'), 'Unggah Excel') : null];
    var sp = d.kode.filter(function (k) { return k.sp; }).map(function (k) { return k.k; }).join(' + ') || '(belum ada kode yang dihitung)';
    function ubin(l, v, k, gaya) { return h('div.v26-kartu.v26-ubin', { gaya: gaya || '' }, h('span.v26-kecil.v26-redup', null, l), h('span.nilai', null, v), h('span.v26-kecil.v26-redup', null, k)); }
    var atas = h('div.v26-kisi.k4', null, ubin('Hari kerja ' + BULAN[d.bl - 1], d.hk + ' hari', 'dari Kalender Kerja: ' + d.hari.length + ' hari − libur'), ubin('Karyawan', V26.angka(d.tot.tk), d.tot.belumLengkap ? d.tot.belumLengkap + ' belum terisi penuh' : 'semua terisi penuh'),
      ubin('% Absensi', d.tot.hk ? pct(d.tot.pct) : '—', V26.angka(d.tot.absen) + ' hari (' + sp + ') dari ' + V26.angka(d.tot.hk) + ' hari kerja'), ubin('Hari kerja dibayar', V26.angka(d.tot.dibayar, d.tot.dibayar % 1 ? 1 : 0), 'K + KL = ' + V26.angka(d.tot.kerja) + ' hari'));
    var isi;
    if (!d.tot.tk) isi = h('div.v26-kartu', null, h('div.v26-kosong', null, ikon('kalender'), h('p', null, 'Belum ada absensi untuk ' + BULAN[d.bl - 1] + ' ' + d.th + '.'), d.bolehUbah ? h('button.v26-btn.utama', { type: 'button', onclick: laciUnggah }, ikon('impor'), 'Unggah Excel Absensi') : h('p.v26-kecil.v26-redup', null, 'Minta Admin atau Staf HR mengunggahnya.')));
    else isi = [kartuMatriks(d), kartuDivisi(d), h('div.v26-kartu.isi', null, h('h3', { gaya: 'margin-bottom:8px' }, 'Arti kode'), h('div.v26-baris.bungkus', { gaya: 'gap:6px 14px' }, d.kode.map(function (k) { return h('span.v26-baris.v26-kecil', { gaya: 'gap:6px' }, V26.chipKode(k.k, k.w, k.sistem), k.n, k.sp ? h('span.v26-lencana.awas', { gaya: 'height:18px' }, 'dihitung') : null); })),
      h('p.v26-kecil.v26-redup', { gaya: 'margin-top:10px' }, '% absensi = jumlah hari berkode "dihitung" ÷ hari kerja yang dijalani. Hari berkode OUT atau NEW tidak masuk pembagi. Kode yang dihitung diatur di Master Data → Kode Absensi (saklar Dihitung SP).'))];
    V26.isi(el, h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, 'Absensi Bulanan'), h('p.v26-redup', { gaya: 'margin-top:2px' }, 'Satu baris per karyawan, satu kolom per tanggal. Data terbaru menimpa data lama pada tanggal yang sama.')), h('div.v26-baris.bungkus', null, aksi)), atas, isi);
  }
  function kartuMatriks(d) {
    var cari = h('input.v26-in.padat', { type: 'search', placeholder: 'Cari No.REG atau nama…', value: st.q, 'aria-label': 'Cari karyawan', oninput: V26.tunda(function (e) { st.q = e.target.value.trim(); st.hal = 1; muat(true); }, 350) });
    var fDiv = h('select.v26-in.padat', { gaya: 'width:auto;max-width:100%', 'aria-label': 'Divisi', onchange: function (e) { st.divisi = e.target.value; st.hal = 1; muat(true); } }, h('option', { value: '' }, 'Semua divisi'), d.divisi.map(function (g) { return h('option', { value: g.divisi === '(tanpa divisi)' ? '' : g.divisi, selected: st.divisi === g.divisi }, g.divisi + ' (' + g.tk + ')'); }));
    var cb = h('input', { type: 'checkbox', checked: st.belum, onchange: function (e) { st.belum = e.target.checked; st.hal = 1; muat(true); } });
    var kepala = h('tr', null, h('th.v26-abs-nama', null, 'Karyawan'), d.hari.map(function (x) { return h('th.v26-abs-hari', { kelas: x.kerja ? '' : 'libur', title: x.libur || (x.mingguan ? 'Libur mingguan' : 'Hari kerja') }, h('div', null, x.d), h('small', null, HARI[x.w])); }),
      ['Kerja', 'Dibayar', 'Absen', 'HK', '%'].map(function (j, i) { return h('th.kanan', { title: ['K + KL', 'Hari kerja dibayar', 'Hari yang dihitung % absensi', 'Hari kerja yang dijalani', '% absensi'][i] }, j); }));
    var badan = d.baris.length ? d.baris.map(function (e) {
      return h('tr', null, h('td.v26-abs-nama', null, h('b', null, e.nama || '(tanpa nama)'), h('div.v26-kecil.v26-redup', null, h('span.v26-mono', null, e.reg), e.divisi ? ' · ' + e.divisi : '', e.rekap.lengkap ? null : h('span.v26-lencana.awas', { gaya: 'height:16px;margin-left:6px', title: 'Baru ' + e.rekap.terisi + ' dari ' + d.hari.length + ' hari terisi' }, e.rekap.terisi + '/' + d.hari.length))),
        e.kode.map(function (k, i) {
          var td = h('td.v26-abs-sel', { kelas: d.hari[i].kerja ? '' : 'libur' }, chip(d, k));
          if (d.bolehUbah) { td.tabIndex = 0; td.setAttribute('role', 'button'); td.setAttribute('aria-label', (e.nama || e.reg) + ' tanggal ' + (i + 1) + ': ' + (k || 'kosong')); td.addEventListener('click', function () { pilihKode(d, e, i + 1, k); }); td.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pilihKode(d, e, i + 1, k); } }); }
          return td;
        }), h('td.kanan.v26-angka', null, e.rekap.kerja), h('td.kanan.v26-angka', null, V26.angka(e.rekap.dibayar, e.rekap.dibayar % 1 ? 1 : 0)), h('td.kanan.v26-angka.v26-tebal', { gaya: e.rekap.absen ? 'color:var(--er)' : '' }, e.rekap.absen), h('td.kanan.v26-angka', null, e.rekap.hk), h('td.kanan.v26-angka.v26-tebal', null, e.rekap.hk ? pct(e.rekap.pct) : '—'));
    }) : h('tr', null, h('td', { colspan: d.hari.length + 6 }, h('div.v26-kosong', { gaya: 'padding:24px' }, h('p', null, 'Tidak ada karyawan yang cocok dengan pencarian.'))));
    var kaki = [h('tr.v26-abs-kaki', null, h('td.v26-abs-nama', null, h('b', null, 'Terisi per hari'), h('div.v26-kecil.v26-redup', null, 'semua karyawan')), d.harian.map(function (x) { return h('td.v26-abs-sel.v26-angka', { title: Object.keys(x.n).map(function (k) { return k + ' ' + x.n[k]; }).join(', ') }, x.terisi || ''); }), h('td', { colspan: 5 })),
      h('tr.v26-abs-kaki', null, h('td.v26-abs-nama', null, h('b', null, 'Absen per hari')), d.harian.map(function (x) { return h('td.v26-abs-sel.v26-angka', { gaya: x.absen ? 'color:var(--er);font-weight:600' : '' }, x.absen || ''); }), h('td', { colspan: 5 }))];
    return h('div.v26-kartu', null, h('div.kepala', null, h('div.v26-baris.bungkus.v26-tumbuh', null, h('label.v26-cari', { gaya: 'flex:1;min-width:180px;max-width:320px' }, ikon('cari'), cari), fDiv, h('label.v26-baris.v26-kecil', { gaya: 'min-height:36px' }, cb, 'Hanya yang belum terisi penuh')), d.bolehUbah ? h('span.v26-kecil.v26-redup', null, 'Klik sel untuk mengubah') : null),
      h('div.v26-gulung.v26-abs', null, h('table', null, h('thead', null, kepala), h('tbody', null, badan), h('tfoot', null, kaki))),
      h('div.v26-kaki', null, h('span', null, d.total ? 'Menampilkan ' + ((d.hal - 1) * 50 + 1) + '–' + ((d.hal - 1) * 50 + d.baris.length) + ' dari ' + d.total + ' karyawan' : '0 karyawan'),
        d.jmlHal > 1 ? h('div.v26-baris', null, h('button.v26-btn.kecil', { type: 'button', disabled: d.hal <= 1, onclick: function () { st.hal--; muat(true); } }, 'Sebelumnya'), h('span', null, 'Halaman ' + d.hal + ' dari ' + d.jmlHal), h('button.v26-btn.kecil', { type: 'button', disabled: d.hal >= d.jmlHal, onclick: function () { st.hal++; muat(true); } }, 'Berikutnya')) : null));
  }
  function kartuDivisi(d) {
    return h('div.v26-kartu', null, h('div.kepala', null, h('h3', null, 'Rekap per Divisi'), h('span.v26-kecil.v26-redup', null, 'definisi dan pembagi sama dengan rekap per karyawan')),
      h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Divisi'), h('th.kanan', null, 'Karyawan'), h('th.kanan', null, 'K + KL'), h('th.kanan', null, 'HK dibayar'), h('th.kanan', null, 'Absen'), h('th.kanan', null, 'Hari kerja dijalani'), h('th.kanan', null, '% Absensi'))),
        h('tbody', null, d.divisi.map(function (g) { return h('tr', null, h('td.judul', { 'data-l': '' }, h('b', null, g.divisi)), h('td.kanan.v26-angka', { 'data-l': 'Karyawan' }, g.tk), h('td.kanan.v26-angka', { 'data-l': 'K + KL' }, V26.angka(g.kerja)), h('td.kanan.v26-angka', { 'data-l': 'HK dibayar' }, V26.angka(g.dibayar, g.dibayar % 1 ? 1 : 0)), h('td.kanan.v26-angka', { 'data-l': 'Absen' }, g.absen), h('td.kanan.v26-angka', { 'data-l': 'Hari kerja dijalani' }, V26.angka(g.hk)), h('td.kanan.v26-angka.v26-tebal', { 'data-l': '% Absensi' }, g.hk ? pct(g.pct) : '—')); }),
          h('tr', null, h('td.judul', { 'data-l': '' }, h('b', null, 'Semua')), h('td.kanan.v26-angka.v26-tebal', { 'data-l': 'Karyawan' }, d.tot.tk), h('td.kanan.v26-angka.v26-tebal', { 'data-l': 'K + KL' }, V26.angka(d.tot.kerja)), h('td.kanan.v26-angka.v26-tebal', { 'data-l': 'HK dibayar' }, V26.angka(d.tot.dibayar, d.tot.dibayar % 1 ? 1 : 0)), h('td.kanan.v26-angka.v26-tebal', { 'data-l': 'Absen' }, d.tot.absen), h('td.kanan.v26-angka.v26-tebal', { 'data-l': 'Hari kerja dijalani' }, V26.angka(d.tot.hk)), h('td.kanan.v26-angka.v26-tebal', { 'data-l': '% Absensi' }, d.tot.hk ? pct(d.tot.pct) : '—'))))));
  }
  function pilihKode(d, e, tgl, kini) {
    var L, galat = h('div', { role: 'alert' });
    function simpan(k) {
      if (k === (kini || '')) { L.tutup(); return; }
      V26.kosongkan(galat);
      api('absSimpan', d.th, d.bl, [{ reg: e.reg, d: tgl, kode: k }], V26.reqId()).then(function () { L.tutup(); V26.toast((e.nama || e.reg) + ' tgl ' + tgl + ': ' + (k || 'dikosongkan')); muat(true); }, function (g) { V26.isi(galat, h('div.v26-pita.salah', { gaya: 'border-radius:8px;padding:8px 12px' }, g.message)); });
    }
    L = V26.laci({ judul: (e.nama || e.reg) + ' — ' + tgl + ' ' + BULAN[d.bl - 1] + ' ' + d.th, sub: 'Sekarang: ' + (kini || 'kosong') + '. Pilih kode baru.', tengah: true,
      isi: [h('div', { gaya: 'display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px' }, d.kode.map(function (k) { return h('button.v26-btn', { type: 'button', gaya: 'justify-content:flex-start;height:auto;min-height:44px;white-space:normal;text-align:left' + (k.k === kini ? ';border:2px solid var(--pr)' : ''), onclick: function () { simpan(k.k); } }, V26.chipKode(k.k, k.w, k.sistem), h('span.v26-kecil', null, k.n)); })), galat],
      kaki: [h('button.v26-btn.hantu.bahaya', { type: 'button', disabled: !kini, onclick: function () { simpan(''); } }, 'Kosongkan'), h('span.v26-tumbuh'), h('button.v26-btn', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal')] });
  }
  function unduh() {
    return api('absBulan', st.th, st.bl, { hal: 1, ukuran: 200, q: st.q, divisi: st.divisi }).then(function (d) {
      var kepala = ['No.REG', 'Nama', 'Divisi'].concat(d.hari.map(function (x) { return String(x.d); }), ['K+KL', 'HK dibayar', 'Absen', 'HK dijalani', '% Absensi']);
      function semua(hal, kumpul) { return api('absBulan', st.th, st.bl, { hal: hal, ukuran: 200, q: st.q, divisi: st.divisi }).then(function (x) { kumpul = kumpul.concat(x.baris); return hal < x.jmlHal ? semua(hal + 1, kumpul) : kumpul; }); }
      return semua(1, []).then(function (b) { return V26.unduhTabel('Absensi_' + d.th + '_' + (d.bl < 10 ? '0' : '') + d.bl, kepala, b.map(function (e) { return [e.reg, e.nama, e.divisi].concat(e.kode, [e.rekap.kerja, e.rekap.dibayar, e.rekap.absen, e.rekap.hk, Math.round(e.rekap.pct * 10000) / 100]); })); });
    });
  }
  /* ---------- Unggah Excel ---------- */
  function laciUnggah() {
    var badan = h('div.v26-kolom'), masuk = h('input', { type: 'file', accept: '.xlsx,.xls,.csv', gaya: 'display:none', 'aria-label': 'Pilih berkas absensi' }), proses = h('button.v26-btn.utama', { type: 'button', disabled: true }, ikon('cek'), 'Proses'), paket = null, timpa = 'baru';
    var jatuh = h('div.v26-jatuh', { role: 'button', tabindex: 0 }, ikon('impor'), h('b', null, 'Pilih berkas absensi ' + BULAN[st.bl - 1] + ' ' + st.th), h('span.v26-kecil.v26-redup', null, 'Bentuk matriks: satu baris per karyawan, kolom tanggal 1–31, isi sel = kode. Judul kolom "REG" wajib ada.'));
    var L = V26.laci({ judul: 'Unggah Excel Absensi', sub: BULAN[st.bl - 1] + ' ' + st.th + ' · belum ada yang disimpan sampai Anda menekan Proses', tengah: true, lebar: true, isi: [jatuh, masuk, badan], kaki: [h('button.v26-btn.hantu', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'), proses] });
    jatuh.addEventListener('click', function () { masuk.click(); }); jatuh.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); masuk.click(); } });
    function pil(l, n, k) { return h('div.v26-pil', { kelas: k || '' }, h('span.v26-kecil', null, l), h('b', null, V26.angka(n))); }
    function periksa() {
      proses.disabled = true; V26.isi(badan, h('div.v26-rangka', { gaya: 'width:60%' }));
      api('absImpor', st.th, st.bl, paket, { timpa: timpa }).then(function (p) {
        var hit = p.hit, ada = hit.disimpan + hit.diperbarui > 0; proses.disabled = !ada; V26.isi(proses, ikon('cek'), 'Proses (' + V26.angka(hit.disimpan + hit.diperbarui) + ' karyawan)');
        function opsi(v, j, k) { return h('label.v26-pilihan', { kelas: timpa === v ? 'aktif' : '' }, h('input', { type: 'radio', name: 'v26-abs-timpa', checked: timpa === v, onchange: function () { timpa = v; periksa(); } }), h('div', null, h('b', null, j), h('div.v26-kecil.v26-redup', null, k))); }
        V26.isi(badan, h('div.v26-baris.bungkus.v26-kecil.v26-redup', null, ikon('berkas'), h('b', { gaya: 'color:var(--tx)' }, paket.nama), h('span', null, '· tanggal di baris ' + p.tebak.barisTanggal + ', ' + p.tebak.jumlahHari + ' hari, REG di kolom ' + p.tebak.kolomReg)),
          h('div.v26-persamaan', null, pil('Dibaca', hit.dibaca), h('b', null, '='), pil('Baru', hit.disimpan, 'ok'), h('b', null, '+'), pil('Diperbarui', hit.diperbarui, 'pr'), h('b', null, '+'), pil('Ditolak', hit.ditolak, hit.ditolak ? 'salah' : ''), h('b', null, '+'), pil('Dilewati', hit.dilewati)),
          p.asing.length ? h('div.v26-pita.awas', null, ikon('awas'), h('div.v26-tumbuh', null, h('b', null, 'Kode yang belum dikenal: ' + p.asing.map(function (a) { return a.simbol + ' (' + a.jumlah + ')'; }).join(', ')), h('div.v26-kecil', null, 'Padankan di Master Data → Kode Absensi → Kamus Padanan, lalu unggah lagi. Baris yang memuatnya ditolak, tidak ditebak.'))) : null,
          hit.ditolak ? h('div.v26-baris.antara.bungkus', null, h('span.v26-kecil', { gaya: 'color:var(--er)' }, hit.ditolak + ' baris ditolak dan tidak disimpan.'), h('button.v26-btn.kecil', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, function () { return V26.unduhTabel('Absensi_ditolak', ['Baris di berkas', 'No.REG', 'Nama', 'Alasan'], p.ditolak); }); } }, ikon('unduh'), 'Unduh Baris Ditolak')) : null,
          h('div.v26-kisi.k2', null, opsi('baru', 'Data terbaru menimpa', 'Isi berkas menggantikan isi lama pada tanggal yang sama. Sel kosong di berkas tidak menghapus.'), opsi('kosong', 'Isi yang kosong saja', 'Isi yang sudah ada tidak diubah.')),
          h('div.v26-gulung', { gaya: 'max-height:260px;border:1px solid var(--bd);border-radius:10px' }, h('table.v26-tabel', null, h('thead', null, h('tr', null, h('th', null, 'Baris'), h('th', null, 'No.REG'), h('th', null, 'Nama'), h('th', null, 'Status'), h('th', null, 'Keterangan'))),
            h('tbody', null, p.baris.slice(0, 200).map(function (b) { var s = { simpan: ['Baru', 'ok'], perbarui: ['Diperbarui', 'pr'], tolak: ['Ditolak', 'salah'], lewati: ['Dilewati', ''] }[b.status]; return h('tr', null, h('td.v26-mono', null, b.no), h('td.v26-mono', null, b.reg || '—'), h('td', null, b.nama || '—'), h('td', null, h('span.v26-lencana', { kelas: s[1] }, s[0])), h('td.v26-kecil', null, b.alasan)); })))),
          p.baris.length > 200 ? h('p.v26-kecil.v26-redup', null, 'Menampilkan 200 baris pertama dari ' + hit.dibaca + '; semua baris tetap diproses.') : null);
      }, function (g) { V26.isi(badan, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), g.message)); });
    }
    function pilihLembar(berkas) {
      var isi = berkas.lembar.filter(function (l) { return l.baris.length > 2; }); if (!isi.length) { V26.isi(badan, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), 'Berkas kosong.')); return; }
      var tebak = 0; isi.forEach(function (l, i) { var n = l.nama.trim().toLowerCase(); if (n === String(st.bl) || n === (st.bl < 10 ? '0' : '') + st.bl || n.indexOf(BULAN[st.bl - 1].toLowerCase().slice(0, 3)) === 0) tebak = i; });
      function pakai(i) { var b = isi[i].baris.slice(0, 3000); paket = { nama: berkas.nama + (isi.length > 1 ? ' › ' + isi[i].nama : ''), baris: b.map(function (r) { return r.slice(0, 90); }) }; periksa(); }
      if (isi.length > 1) { var s = h('select.v26-in', { 'aria-label': 'Lembar', onchange: function () { pakai(+s.value); } }, isi.map(function (l, i) { return h('option', { value: i, selected: i === tebak }, 'Lembar "' + l.nama + '" (' + l.baris.length + ' baris)'); })); jatuh.parentNode.insertBefore(h('div.v26-medan', { id: 'v26-abs-lembar' }, h('label', null, 'Lembar yang dibaca'), s), badan); }
      pakai(tebak);
    }
    masuk.addEventListener('change', function () {
      var f = masuk.files[0]; masuk.value = ''; if (!f) return; var lama = document.getElementById('v26-abs-lembar'); if (lama) lama.remove();
      V26.isi(badan, h('div.v26-rangka', { gaya: 'width:50%' })); V26.bacaBerkas(f).then(pilihLembar, function (g) { V26.isi(badan, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), g.message)); });
    });
    proses.addEventListener('click', function () {
      V26.jalankan(proses, function () { return api('absImpor', st.th, st.bl, paket, { timpa: timpa, proses: true }, V26.reqId()); }, function (r) { return r.hit.disimpan + ' baru, ' + r.hit.diperbarui + ' diperbarui, ' + r.hit.ditolak + ' ditolak'; }).then(function () { L.tutup(); st.hal = 1; muat(); });
    });
  }
  return { buka: buka };
})();
