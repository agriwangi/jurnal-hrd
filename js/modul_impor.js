/* Jurnal HRD v2.6.0-t1 — modul layar IMPOR (W-10 Pratinjau & Hasil Impor, Riwayat Impor + Batalkan).
   Aturan anti-hilang: dibaca = disimpan + diperbarui + ditolak + dilewati, selalu ditampilkan. Modul malas. */
V26.modul.impor = (function () {
  'use strict';
  var h = V26.h, api = V26.api, ikon = V26.ikon;
  var JENIS = [['jabatan', 'Master Jabatan'], ['golongan', 'Master Golongan Gaji'], ['tingkat', 'Skala Masa Kerja Golongan'], ['divisi', 'Master Divisi'], ['status', 'Master Status Karyawan'], ['kodeabsen', 'Master Kode Absensi'], ['padanan', 'Kamus Padanan Kode'], ['libur', 'Libur Perusahaan']];
  var st = { el: null, selesai: null };
  var STATUS = { simpan: ['Disimpan', 'ok'], perbarui: ['Diperbarui', 'pr'], tolak: ['Ditolak', 'salah'], lewati: ['Dilewati', ''] };

  function buka(el) { st.el = el; st.selesai = null; halamanAwal(); }
  /** Dipanggil dari layar lain (mis. tombol "Impor Excel" di Master Jabatan). */
  function mulai(jenis, selesai) {
    st.selesai = selesai || null;
    if (!st.el || !document.body.contains(st.el)) { st.tunda = jenis; location.hash = '#/impor'; return; }
    halamanUnggah(jenis);
  }
  function kepala(judul, sub, aksi) { return h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, judul), h('p.v26-redup', { gaya: 'margin-top:2px' }, sub)), h('div.v26-baris.bungkus', null, aksi)); }
  function labelJenis(j) { var x = JENIS.filter(function (a) { return a[0] === j; })[0]; return x ? x[1] : j; }

  /* ---------- Halaman awal: pilih jenis + riwayat ---------- */
  function halamanAwal() {
    if (st.tunda) { var j = st.tunda; st.tunda = null; halamanUnggah(j); return; }
    var tbl = V26.tabel({ cari: false, ukuran: 10, kosong: 'Belum ada impor. Riwayat setiap impor akan tercatat di sini.', muat: function (q) { return api('valRiwayat', q); },
      kolom: [{ j: 'Waktu', isi: function (b) { return h('span.v26-mono', null, b.Waktu); } }, { j: 'Berkas', judul: true, isi: function (b) { return h('div', null, h('b', null, b.Berkas || '(tanpa nama)'), h('div.v26-kecil.v26-redup', { gaya: 'font-weight:400' }, b.Label + ' · ' + b.ID)); } },
        { j: 'Oleh', isi: function (b) { return b.Oleh; } }, { j: 'Dibaca', rata: 'kanan', isi: function (b) { return h('b.v26-angka', null, b.Dibaca); } },
        { j: 'Disimpan', rata: 'kanan', isi: function (b) { return h('span.v26-angka', null, b.Disimpan); } }, { j: 'Diperbarui', rata: 'kanan', isi: function (b) { return h('span.v26-angka', null, b.Diperbarui); } },
        { j: 'Ditolak', rata: 'kanan', isi: function (b) { return h('span.v26-angka', { gaya: +b.Ditolak ? 'color:var(--er);font-weight:600' : '' }, b.Ditolak); } }, { j: 'Dilewati', rata: 'kanan', isi: function (b) { return h('span.v26-angka', null, b.Dilewati); } },
        { j: 'Status', rata: 'tengah', isi: function (b) { return h('span.v26-lencana', { kelas: b.Status === 'Selesai' ? 'ok' : b.Status === 'Dibatalkan' ? '' : 'awas', title: b.Catatan || '' }, b.Status); } },
        { j: 'Aksi', rata: 'tengah', isi: function (b) {
          return b.Status === 'Selesai' && (+b.Disimpan || +b.Diperbarui) ? h('button.v26-btn.kecil.hantu.bahaya', { type: 'button', onclick: function (e) {
            var t = e.currentTarget;
            V26.konfirmasi('Batalkan impor ' + b.ID + '?', 'Baris yang ditambahkan impor ini dihapus dan baris yang diperbarui dikembalikan ke isi sebelumnya. Baris yang sudah diubah lagi sesudah impor atau sudah dipakai karyawan TIDAK disentuh dan akan dilaporkan.', 'Batalkan Impor', true).then(function (ya) {
              if (!ya) return;
              V26.jalankan(t, function () { return api('valBatalkan', b.ID, V26.reqId()); }).then(function (r) {
                V26.laci({ judul: 'Impor ' + b.ID + ' dibatalkan', tengah: true, isi: [h('div.v26-persamaan', null, pil('Dihapus', r.dihapus, ''), pil('Dikembalikan', r.dipulihkan, 'pr'), pil('Tidak disentuh', (r.dilewati || []).length, (r.dilewati || []).length ? 'salah' : '')),
                  (r.dilewati || []).length ? h('div.v26-pita.awas', null, h('div', null, h('b', null, 'Tidak disentuh karena sudah berubah atau sudah dipakai:'), h('ul', { gaya: 'margin:6px 0 0;padding-left:18px' }, r.dilewati.map(function (x) { return h('li', null, x); })))) : null] });
                tbl.muat();
              });
            });
          } }, 'Batalkan') : h('span.v26-redup', null, '—');
        } }] });
    V26.isi(st.el, kepala('Impor Data', 'Setiap impor diperiksa dulu. Tidak ada baris yang hilang diam-diam: baris yang tidak masuk selalu disebut beserta alasannya.', null),
      h('div.v26-kartu', null, h('div.kepala', null, h('h2', null, 'Mulai impor baru'), h('span.v26-kecil.v26-redup', null, 'Pilih data yang ingin diisi dari Excel atau CSV')),
        h('div.v26-kisi.k4', { gaya: 'padding:16px' }, JENIS.map(function (j) { return h('button.v26-btn', { type: 'button', gaya: 'height:auto;min-height:52px;justify-content:flex-start;white-space:normal;text-align:left;padding:10px 12px', onclick: function () { halamanUnggah(j[0]); } }, ikon('berkas'), j[1]); })),
        h('p.v26-kecil.v26-redup', { gaya: 'padding:0 16px 14px' }, 'Impor absensi bulanan, karyawan, dan lembur menyusul di tahap berikutnya dan memakai mesin pemeriksa yang sama.')),
      h('div.v26-kartu', null, h('div.kepala', null, h('div.v26-baris', null, ikon('riwayat'), h('h2', null, 'Riwayat Impor'))), tbl.el));
  }
  function pil(label, n, kelas) { return h('div.v26-pil', { kelas: kelas || '' }, h('span.v26-kecil', null, label), h('b', null, V26.angka(n))); }

  /* ---------- Langkah 1: unggah + pilih lembar + baris judul ---------- */
  function halamanUnggah(jenis) {
    var info = h('div'), masuk = h('input', { type: 'file', accept: '.xlsx,.xls,.csv,.txt', gaya: 'display:none', 'aria-label': 'Pilih berkas' });
    var jatuh = h('div.v26-jatuh', { role: 'button', tabindex: 0, 'aria-label': 'Pilih atau seret berkas Excel/CSV' }, ikon('impor'), h('b', null, 'Seret berkas ke sini atau klik untuk memilih'), h('span.v26-kecil.v26-redup', null, 'Excel (.xlsx, .xls) atau CSV · paling besar 8 MB · paling banyak 5.000 baris'));
    function terima(f) {
      if (!f) return;
      V26.isi(info, h('div.v26-kartu.isi', null, h('div.v26-rangka', { gaya: 'width:50%' })));
      V26.bacaBerkas(f).then(function (b) { pilihLembar(jenis, b, info); }, function (e) { V26.isi(info, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), e.message)); });
    }
    jatuh.addEventListener('click', function () { masuk.click(); });
    jatuh.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); masuk.click(); } });
    masuk.addEventListener('change', function () { terima(masuk.files[0]); masuk.value = ''; });
    ['dragenter', 'dragover'].forEach(function (n) { jatuh.addEventListener(n, function (e) { e.preventDefault(); jatuh.classList.add('di-atas'); }); });
    ['dragleave', 'drop'].forEach(function (n) { jatuh.addEventListener(n, function (e) { e.preventDefault(); jatuh.classList.remove('di-atas'); }); });
    jatuh.addEventListener('drop', function (e) { terima(e.dataTransfer.files[0]); });
    var contoh = h('button.v26-btn', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, function () { return api('valKolom', jenis).then(function (k) { return V26.unduhTabel('Templat_' + k.label.replace(/\s/g, '_'), k.kol.map(function (x) { return x.replace(/_/g, ' '); }), k.contoh); }); }); } }, ikon('unduh'), 'Unduh Templat');
    V26.isi(st.el, kepala('Impor ' + labelJenis(jenis), 'Langkah 1 dari 3 — pilih berkas. Belum ada yang disimpan sampai Anda menekan Proses Impor.', [h('button.v26-btn.hantu', { type: 'button', onclick: batal }, ikon('kiri'), 'Kembali'), contoh]),
      h('div.v26-kartu.isi.v26-kolom', null, jatuh, masuk, h('div.v26-baris.v26-kecil.v26-redup', { gaya: 'align-items:flex-start' }, ikon('info'), 'Judul kolom tidak harus sama persis dengan templat. Di langkah berikutnya Anda bisa memetakan kolom berkas ke kolom tujuan. Templat berisi data yang ada sekarang, jadi bisa dipakai untuk mengubah banyak data sekaligus.')), info);
  }
  function batal() { if (st.selesai) { var f = st.selesai; st.selesai = null; history.back(); setTimeout(f, 0); } else halamanAwal(); }
  function pilihLembar(jenis, berkas, info) {
    var lembar = berkas.lembar.filter(function (l) { return l.baris.some(function (r) { return r.some(function (v) { return String(v).trim() !== ''; }); }); });
    if (!lembar.length) { V26.isi(info, h('div.v26-pita.salah', { role: 'alert' }, ikon('awas'), 'Berkas kosong: tidak ada lembar yang berisi data.')); return; }
    var pilihL = h('select.v26-in', { 'aria-label': 'Lembar' }, lembar.map(function (l, i) { return h('option', { value: i }, l.nama + ' (' + l.baris.length + ' baris)'); }));
    var barisJudul = h('input.v26-in.v26-angka', { type: 'number', min: 1, max: 50, value: 1, 'aria-label': 'Nomor baris judul kolom' }), cuplik = h('div.v26-gulung');
    function tebakJudul(b) { for (var i = 0; i < Math.min(b.length, 15); i++) if (b[i].filter(function (v) { return String(v).trim() !== ''; }).length >= 2) return i + 1; return 1; }
    function gambar() {
      var b = lembar[+pilihL.value].baris, j = Math.max(1, Math.min(+barisJudul.value || 1, b.length)), lebar = Math.min(12, Math.max.apply(null, b.slice(0, j + 5).map(function (r) { return r.length; }).concat([1])));
      V26.isi(cuplik, h('table.v26-tabel', null, h('tbody', null, b.slice(0, j + 5).map(function (r, i) {
        return h('tr', { gaya: i + 1 === j ? 'background:var(--pr-t);font-weight:600' : i + 1 < j ? 'opacity:.5' : '' }, h('td.v26-mono.v26-redup', null, i + 1), Array.apply(null, Array(lebar)).map(function (_, c) { return h('td', { gaya: 'white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis' }, r[c] == null ? '' : String(r[c])); }));
      }))));
    }
    pilihL.addEventListener('change', function () { barisJudul.value = tebakJudul(lembar[+pilihL.value].baris); gambar(); });
    barisJudul.addEventListener('input', gambar);
    barisJudul.value = tebakJudul(lembar[0].baris); gambar();
    var lanjut = h('button.v26-btn.utama', { type: 'button' }, 'Periksa Berkas', ikon('kanan'));
    lanjut.addEventListener('click', function () {
      var b = lembar[+pilihL.value].baris, j = Math.max(1, Math.min(+barisJudul.value || 1, b.length)), kepalaB = b[j - 1].map(function (v) { return String(v == null ? '' : v).trim(); }), isi = b.slice(j);
      while (isi.length && !isi[isi.length - 1].some(function (v) { return String(v).trim() !== ''; })) isi.pop();   // buang baris kosong di ekor saja; baris kosong di tengah tetap dihitung
      while (kepalaB.length && kepalaB[kepalaB.length - 1] === '' && !isi.some(function (r) { return String(r[kepalaB.length - 1] == null ? '' : r[kepalaB.length - 1]).trim() !== ''; })) kepalaB.pop();   // buang kolom kosong di ujung kanan
      if (!isi.length) { V26.toast('Tidak ada baris data di bawah baris judul.', 'awas'); return; }
      var paket = { nama: berkas.nama + (lembar.length > 1 ? ' › ' + lembar[+pilihL.value].nama : ''), kepala: kepalaB, baris: isi.map(function (r) { return kepalaB.map(function (_, c) { return r[c] == null ? '' : String(r[c]); }); }), barisAwal: j + 1 };
      V26.jalankan(lanjut, function () { return api('valPratinjau', jenis, paket, {}); }).then(function (p) { halamanPratinjau(jenis, paket, p); });
    });
    V26.isi(info, h('div.v26-kartu', null, h('div.kepala', null, h('div.v26-baris', null, ikon('berkas'), h('b', null, berkas.nama)), h('span.v26-lencana.ok', null, 'Terbaca')),
      h('div.v26-kisi.k2', { gaya: 'padding:16px' }, h('div.v26-medan', null, h('label', null, 'Lembar'), pilihL), h('div.v26-medan', null, h('label', null, 'Baris judul kolom'), barisJudul, h('small', null, 'Baris di atasnya diabaikan. Baris judul ditandai warna.'))),
      cuplik, h('div.v26-kaki', null, h('span', null, 'Cuplikan baris pertama'), lanjut)));
  }

  /* ---------- Langkah 2: W-10 pratinjau ---------- */
  function halamanPratinjau(jenis, paket, p) {
    var tabAktif = 'semua', hal = 1, UKURAN = 50, wadahTabel = h('div'), ulang = h('input', { type: 'checkbox' }), cadangan = h('input', { type: 'checkbox', checked: true });
    var hit = p.hit, adaKerja = hit.disimpan + hit.diperbarui > 0;
    function hitungUlang(opsi) { return V26.jalankan(null, function () { return api('valPratinjau', jenis, paket, opsi); }).then(function (x) { halamanPratinjau(jenis, paket, x); }); }
    function unduhDitolak() {
      return V26.unduhTabel('Ditolak_' + labelJenis(jenis).replace(/\s/g, '_'), ['Baris di berkas', 'Alasan ditolak'].concat(p.kepala), p.ditolakMentah.map(function (d) { return [d.no, d.alasan].concat(d.mentah); }));
    }
    function gambarTabel() {
      var semua = p.baris.filter(function (b) { return tabAktif === 'semua' || b.status === tabAktif; }), jml = Math.max(1, Math.ceil(semua.length / UKURAN)); hal = Math.min(hal, jml);
      var iris = semua.slice((hal - 1) * UKURAN, hal * UKURAN);
      V26.isi(wadahTabel, h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Baris'), h('th', null, 'Kode'), h('th', null, 'Nama'), h('th', null, 'Status'), h('th', null, 'Alasan / perubahan'))),
        h('tbody', null, iris.length ? iris.map(function (b) {
          var s = STATUS[b.status];
          return h('tr', null, h('td', { 'data-l': 'Baris' }, h('span.v26-mono.v26-redup', null, b.no)), h('td', { 'data-l': 'Kode' }, b.kunci ? h('span.v26-chip.kode', null, b.kunci) : h('span.v26-redup', null, b.status === 'simpan' ? 'otomatis' : '—')),
            h('td.judul', { 'data-l': '' }, b.nama || h('span.v26-redup', null, '(kosong)')), h('td', { 'data-l': 'Status' }, h('span.v26-lencana', { kelas: s[1] }, s[0])),
            h('td', { 'data-l': 'Alasan' }, b.jenisSalah ? h('b.v26-kecil', { gaya: b.status === 'tolak' ? 'color:var(--er)' : '' }, b.jenisSalah + (b.alasan ? ': ' : '')) : null, h('span.v26-kecil', null, b.alasan || (b.status === 'simpan' ? 'Data baru' : ''))));
        }) : h('tr', null, h('td', { colspan: 5, 'data-l': '', kelas: 'penuh' }, h('div.v26-kosong', { gaya: 'padding:24px' }, h('p', null, 'Tidak ada baris dengan status ini.'))))))),
        h('div.v26-kaki', null, h('span', null, semua.length ? 'Menampilkan ' + ((hal - 1) * UKURAN + 1) + '–' + ((hal - 1) * UKURAN + iris.length) + ' dari ' + semua.length + (p.terpotong ? ' (pratinjau dibatasi 1.000 baris pertama; semua baris tetap diproses)' : '') : '0 baris'),
          jml > 1 ? h('div.v26-baris', null, h('button.v26-btn.kecil', { type: 'button', disabled: hal <= 1, onclick: function () { hal--; gambarTabel(); } }, 'Sebelumnya'), h('span', null, 'Halaman ' + hal + ' dari ' + jml), h('button.v26-btn.kecil', { type: 'button', disabled: hal >= jml, onclick: function () { hal++; gambarTabel(); } }, 'Berikutnya')) : null));
    }
    var tabEl = h('div.v26-tab', { role: 'tablist', gaya: 'padding:0 12px' });
    function gambarTab() {
      V26.isi(tabEl, [['semua', 'Semua', hit.dibaca], ['simpan', 'Disimpan', hit.disimpan], ['perbarui', 'Diperbarui', hit.diperbarui], ['tolak', 'Ditolak', hit.ditolak], ['lewati', 'Dilewati', hit.dilewati]].map(function (t) {
        return h('button', { type: 'button', role: 'tab', 'aria-selected': tabAktif === t[0], kelas: tabAktif === t[0] ? 'aktif' : '', onclick: function () { tabAktif = t[0]; hal = 1; gambarTab(); gambarTabel(); } }, t[1], h('span.jml', null, V26.angka(t[2])));
      }));
    }
    gambarTab(); gambarTabel();
    // Pemetaan kolom
    var petaBaru = {}, kotakPeta = h('div.v26-kisi.k4', { gaya: 'padding:16px' }, p.kol.map(function (k) {
      var wajib = p.wajib.indexOf(k) >= 0, s = h('select.v26-in.padat', { 'aria-label': 'Kolom berkas untuk ' + k, kelas: wajib && p.peta[k] < 0 ? 'salah' : '' }, h('option', { value: -1 }, '— tidak diisi —'), p.kepala.map(function (kp, i) { return h('option', { value: i, selected: p.peta[k] === i }, (kp || '(kolom ' + (i + 1) + ')')); }));
      s.addEventListener('change', function () { petaBaru[k] = +s.value; tombolPeta.disabled = false; });
      return h('div.v26-medan', null, h('label', null, k.replace(/_/g, ' '), wajib ? h('i', null, ' *') : null), s);
    }));
    var tombolPeta = h('button.v26-btn.kecil', { type: 'button', disabled: true, onclick: function () { var peta = {}; for (var k in p.peta) peta[k] = p.peta[k]; for (var k2 in petaBaru) peta[k2] = petaBaru[k2]; hitungUlang({ peta: peta, timpa: p.timpa }); } }, ikon('segar'), 'Periksa Ulang');
    var belumPeta = p.wajib.filter(function (k) { return p.peta[k] < 0; }), tidakTerpakai = p.kepala.filter(function (kp, i) { return kp && !p.kol.some(function (k) { return p.peta[k] === i; }); });
    var rincian = h('details', { open: belumPeta.length > 0 }, h('summary', { gaya: 'padding:12px 16px;cursor:pointer;font-weight:600;display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap' }, h('span', null, 'Pemetaan kolom',
      h('span.v26-kecil.v26-redup', { gaya: 'font-weight:400;margin-left:8px' }, p.kol.filter(function (k) { return p.peta[k] >= 0; }).length + ' dari ' + p.kol.length + ' kolom tujuan terisi')), belumPeta.length ? h('span.v26-lencana.salah', null, 'Kolom wajib belum dipetakan') : h('span.v26-lencana.ok', null, 'Kolom wajib lengkap')),
      kotakPeta, h('div.v26-baris.antara.bungkus', { gaya: 'padding:0 16px 14px' }, h('span.v26-kecil.v26-redup', null, tidakTerpakai.length ? 'Kolom berkas yang tidak dipakai: ' + tidakTerpakai.slice(0, 8).join(', ') + (tidakTerpakai.length > 8 ? ', …' : '') : 'Semua kolom berkas terpakai.'), tombolPeta));
    // Pilihan timpa
    function opsiTimpa(nilai, judul, ket) {
      return h('label.v26-pilihan', { kelas: p.timpa === nilai ? 'aktif' : '' }, h('input', { type: 'radio', name: 'v26-timpa', checked: p.timpa === nilai, onchange: function () { hitungUlang({ peta: p.peta, timpa: nilai }); } }), h('div', null, h('b', null, judul), h('div.v26-kecil.v26-redup', null, ket)));
    }
    var proses = h('button.v26-btn.utama', { type: 'button', disabled: !adaKerja || (p.pernah && !ulang.checked) }, ikon('cek'), 'Proses Impor (' + V26.angka(hit.disimpan + hit.diperbarui) + ' baris)');
    ulang.addEventListener('change', function () { proses.disabled = !adaKerja || (p.pernah && !ulang.checked); });
    proses.addEventListener('click', function () {
      V26.konfirmasi('Proses impor sekarang?', V26.angka(hit.disimpan) + ' baris baru disimpan dan ' + V26.angka(hit.diperbarui) + ' baris diperbarui. ' + V26.angka(hit.ditolak) + ' ditolak dan ' + V26.angka(hit.dilewati) + ' dilewati tidak mengubah apa pun.' + (cadangan.checked ? ' Salinan cadangan dibuat lebih dulu.' : ''), 'Proses Impor').then(function (ya) {
        if (!ya) return;
        var id = V26.reqId();
        V26.jalankan(proses, function () { return api('valProses', p.token, { cadangan: cadangan.checked, ulang: ulang.checked }, id); }).then(function (r) { halamanHasil(jenis, p, r, unduhDitolak); });
      });
    });
    V26.isi(st.el, kepala('Pratinjau Impor', 'Langkah 2 dari 3 — periksa hasil pemeriksaan. Belum ada yang disimpan.', [h('button.v26-btn.hantu', { type: 'button', onclick: function () { halamanUnggah(jenis); } }, ikon('kiri'), 'Ganti Berkas')]),
      h('div.v26-baris.bungkus.v26-kecil.v26-redup', null, ikon('berkas'), h('b', { gaya: 'color:var(--tx)' }, p.berkas), h('span', null, '→ ' + p.label)),
      p.pernah ? h('div.v26-pita.awas', { role: 'alert' }, ikon('awas'), h('div.v26-tumbuh', { gaya: 'min-width:200px' }, h('b', null, 'Berkas yang sama sudah pernah diproses'), h('div.v26-kecil', null, 'Pada ' + p.pernah.waktu + ' oleh ' + p.pernah.oleh + ' (' + p.pernah.id + '). Memproses lagi biasanya tidak perlu.')), h('label.v26-baris.v26-kecil', { gaya: 'min-height:36px' }, ulang, 'Proses ulang berkas yang sama')) : null,
      h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:12px' }, h('div.v26-baris.antara.bungkus', null, h('h2', null, 'Hitungan baris'), h('span.v26-lencana.ok', null, ikon('cek'), 'Hitungan cocok')),
        h('div.v26-persamaan', { role: 'group', 'aria-label': 'Dibaca sama dengan disimpan tambah diperbarui tambah ditolak tambah dilewati' }, pil('Dibaca', hit.dibaca, ''), h('b', null, '='), pil('Disimpan', hit.disimpan, 'ok'), h('b', null, '+'), pil('Diperbarui', hit.diperbarui, 'pr'), h('b', null, '+'), pil('Ditolak', hit.ditolak, hit.ditolak ? 'salah' : ''), h('b', null, '+'), pil('Dilewati', hit.dilewati, '')),
        h('p.v26-kecil.v26-redup', null, 'Setiap baris di berkas masuk tepat satu kelompok. Jika hitungan tidak cocok, impor dibatalkan seluruhnya.')),
      hit.ditolak ? h('div.v26-pita.salah', null, ikon('awas'), h('div.v26-tumbuh', { gaya: 'min-width:200px' }, h('b', null, V26.angka(hit.ditolak) + ' baris ditolak dan tidak akan disimpan'), h('div.v26-kecil', null, 'Unduh daftarnya, perbaiki di Excel, lalu impor lagi berkas perbaikannya saja.')),
        h('button.v26-btn.kecil', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, unduhDitolak); } }, ikon('unduh'), 'Unduh Baris Ditolak')) : null,
      h('div.v26-kartu', null, rincian),
      h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:10px' }, h('h3', null, 'Bila data sudah ada'), h('div.v26-kisi.k2', null, opsiTimpa('kosong', 'Isi yang kosong saja (aman)', 'Isi yang sudah ada tidak diubah. Hanya kolom kosong yang dilengkapi.'), opsiTimpa('semua', 'Timpa dengan isi berkas', 'Kolom yang dipetakan diganti isi berkas. Perubahannya terlihat di tab Diperbarui.'))),
      h('div.v26-kartu', null, tabEl, wadahTabel),
      h('div.v26-tempel', null, h('label.v26-baris.v26-kecil', { gaya: 'min-height:36px' }, cadangan, 'Buat salinan cadangan sebelum menulis'), h('div.v26-baris', null, h('button.v26-btn', { type: 'button', onclick: batal }, 'Batal'), proses)));
    if (!adaKerja) V26.toast('Tidak ada baris yang bisa disimpan dari berkas ini.', 'awas');
  }

  /* ---------- Langkah 3: hasil ---------- */
  function halamanHasil(jenis, p, r, unduhDitolak) {
    var hit = r.hit;
    V26.isi(st.el, kepala('Hasil Impor', 'Langkah 3 dari 3 — selesai. Nomor impor ' + r.id + '.', null),
      h('div.v26-pita.ok', { role: 'status' }, ikon('cek'), h('div.v26-tumbuh', null, h('b', null, 'Impor selesai dan sudah diperiksa ulang sesudah ditulis'), h('div.v26-kecil', null, p.berkas + ' → ' + p.label + (r.cadangan ? ' · cadangan: ' + r.cadangan : '')))),
      r.berubahDariPratinjau ? h('div.v26-pita.awas', null, ikon('awas'), 'Data berubah di antara pratinjau dan proses, sehingga hitungan akhir berbeda dari pratinjau. Angka di bawah adalah yang benar-benar terjadi.') : null,
      h('div.v26-kisi.k5', null, [['Dibaca', hit.dibaca, ''], ['Disimpan', hit.disimpan, 'ok'], ['Diperbarui', hit.diperbarui, 'pr'], ['Ditolak', hit.ditolak, hit.ditolak ? 'salah' : ''], ['Dilewati', hit.dilewati, '']].map(function (x) {
        return h('div.v26-kartu.v26-ubin', null, h('span.v26-kecil.v26-redup', null, x[0]), h('span.nilai', { gaya: x[2] === 'ok' ? 'color:var(--ok)' : x[2] === 'pr' ? 'color:var(--pr)' : x[2] === 'salah' ? 'color:var(--er)' : '' }, V26.angka(x[1])));
      })),
      h('div.v26-kartu.isi', null, h('div.v26-persamaan', null, pil('Dibaca', hit.dibaca, ''), h('b', null, '='), pil('Disimpan', hit.disimpan, 'ok'), h('b', null, '+'), pil('Diperbarui', hit.diperbarui, 'pr'), h('b', null, '+'), pil('Ditolak', hit.ditolak, hit.ditolak ? 'salah' : ''), h('b', null, '+'), pil('Dilewati', hit.dilewati, ''))),
      h('div.v26-baris.bungkus', null, hit.ditolak ? h('button.v26-btn', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, unduhDitolak); } }, ikon('unduh'), 'Unduh Baris Ditolak (' + hit.ditolak + ')') : null,
        h('button.v26-btn', { type: 'button', onclick: function () { st.selesai = null; halamanAwal(); } }, ikon('riwayat'), 'Lihat Riwayat Impor'), h('button.v26-btn', { type: 'button', onclick: function () { halamanUnggah(jenis); } }, ikon('impor'), 'Impor Berkas Lain'),
        h('a.v26-btn.utama', { href: '#/master/' + ({ tingkat: 'golongan', padanan: 'kodeabsen', libur: 'kalender' }[jenis] || jenis) }, 'Buka ' + p.label.replace(/^Master /, ''), ikon('kanan'))),
      h('p.v26-kecil.v26-redup', null, 'Impor ini bisa dibatalkan dari Riwayat Impor selama barisnya belum diubah lagi dan belum dipakai karyawan.'));
    st.selesai = null;
  }
  return { buka: buka, mulai: mulai };
})();
