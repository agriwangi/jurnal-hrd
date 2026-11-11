/* Jurnal HRD v2.6.0-t1 — modul layar MASTER DATA (W-05 Jabatan, W-06 Golongan Gaji & Kenaikan Massal,
   W-07 Kode Absensi & Kamus Padanan, W-08 Kalender Kerja, + Divisi dan Status Karyawan). Modul malas. */
V26.modul.master = (function () {
  'use strict';
  var h = V26.h, api = V26.api, ikon = V26.ikon, rp = V26.rp;
  var TAB = [['jabatan', 'Jabatan'], ['golongan', 'Golongan Gaji'], ['divisi', 'Divisi'], ['status', 'Status Karyawan'], ['kodeabsen', 'Kode Absensi'], ['kalender', 'Kalender Kerja']];
  var st = { ringkas: null, pil: {}, wadah: null, sub: 'jabatan', tabEl: null };
  var NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function buka(el, sub) {
    st.sub = TAB.some(function (t) { return t[0] === sub; }) ? sub : 'jabatan';
    st.tabEl = h('div.v26-tab', { role: 'tablist' }); st.wadah = h('div.v26-kolom', { gaya: 'margin-top:16px' });
    V26.isi(el, st.tabEl, st.wadah);
    gambarTab(); V26.rangkaBlok(st.wadah, 5);
    muatRingkas().then(function () { halaman(); }, function (e) { V26.galatMuat(st.wadah, e, function () { buka(el, sub); }); });
  }
  function muatRingkas() { return api('mdRingkas').then(function (r) { st.ringkas = r; gambarTab(); return r; }); }
  function gambarTab() {
    V26.isi(st.tabEl, TAB.map(function (t) {
      var n = st.ringkas && st.ringkas.tab[t[0]];
      return h('button', { type: 'button', role: 'tab', 'aria-selected': t[0] === st.sub ? 'true' : 'false', kelas: t[0] === st.sub ? 'aktif' : '', onclick: function () { location.hash = '#/master/' + t[0]; } },
        t[0] === 'kalender' ? ikon('kalender') : null, t[1], n != null ? h('span.jml', null, n) : null);
    }));
    var a = st.tabEl.querySelector('.aktif'); if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function halaman() { ({ jabatan: hJabatan, golongan: hGolongan, divisi: hDivisi, status: hStatus, kodeabsen: hKodeAbsen, kalender: hKalender })[st.sub](); }
  function pilihan(daftar) { return api('mdPilihan', daftar).then(function (p) { for (var k in p) st.pil[k] = p[k]; return st.pil; }); }
  function kepala(judul, sub, aksi) {
    return h('div.v26-baris.antara.bungkus.lega', null, h('div.v26-tumbuh', { gaya: 'min-width:220px' }, h('h1', null, judul), h('p.v26-redup', { gaya: 'margin-top:2px' }, sub)), h('div.v26-baris.bungkus', null, aksi));
  }
  function tombolImporEkspor(nama) {
    return [h('button.v26-btn', { type: 'button', onclick: function () { V26.modul.impor.mulai(nama, function () { muatRingkas().then(halaman); }); } }, ikon('impor'), 'Impor Excel'),
      h('button.v26-btn', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, function () { return api('mdEkspor', nama).then(function (d) { return V26.unduhTabel('Master_' + d.label.replace(/\s/g, '_'), d.kol, d.baris); }); }); } }, ikon('unduh'), 'Ekspor')];
  }
  function ubahAktif(nama, b, tbl) {
    var mati = b.Aktif !== 'Tidak';
    V26.konfirmasi(mati ? 'Nonaktifkan data ini?' : 'Aktifkan kembali?', mati ? '"' + (b.Nama || b.Simbol || b.Kode) + '" tidak bisa dipilih lagi untuk data baru. Data lama yang memakainya tetap terbaca. Tidak ada yang dihapus.' : '"' + (b.Nama || b.Kode) + '" bisa dipilih lagi.', mati ? 'Nonaktifkan' : 'Aktifkan', mati)
      .then(function (ya) { if (ya) V26.jalankan(null, function () { return api('mdAktif', nama, b.Kode, !mati, V26.reqId()); }, mati ? 'Dinonaktifkan' : 'Diaktifkan').then(function () { tbl.muat(); muatRingkas(); }); });
  }
  function kolomAksi(nama, buka, getTbl) {
    return { j: 'Aksi', rata: 'tengah', isi: function (b) {
      return h('div.v26-baris', { gaya: 'justify-content:flex-end;gap:2px' }, h('button.v26-btn.ikon', { type: 'button', title: 'Ubah', 'aria-label': 'Ubah ' + b.Kode, onclick: function () { buka(b); } }, ikon('ubah')),
        h('button.v26-btn.ikon', { type: 'button', title: b.Aktif === 'Tidak' ? 'Aktifkan' : 'Nonaktifkan', 'aria-label': (b.Aktif === 'Tidak' ? 'Aktifkan ' : 'Nonaktifkan ') + b.Kode, onclick: function () { ubahAktif(nama, b, getTbl()); } }, ikon(b.Aktif === 'Tidak' ? 'cek' : 'tutup')));
    } };
  }
  var FILTER_AKTIF = { k: '_aktif', l: 'Status: Aktif', pilihan: [{ k: 'semua', n: 'Tampilkan juga nonaktif' }] };
  function medanUmum(lama) { return [{ k: 'Urutan', l: 'Urutan tampil', t: 'angka', setengah: true }, { k: 'Tgl_Berlaku', l: 'Tanggal berlaku', t: 'tanggal', setengah: true }, { k: 'Aktif', l: 'Status aktif', t: 'saklar', bawaan: 'Ya', ket: 'Bisa dipilih pada data karyawan' }]; }
  function medanKode(lama, contoh) { return { k: 'Kode', l: 'Kode', t: 'kode', mati: !!lama, maks: 20, contoh: contoh, bantu: lama ? 'Kode tidak bisa diubah setelah dibuat.' : 'Kosongkan agar dibuat otomatis.' }; }
  function bukaFormulir(nama, judul, medan, lama, selesai) {
    V26.laciFormulir({ judul: (lama ? 'Ubah ' : 'Tambah ') + judul, sub: lama ? 'Kode ' + lama.Kode : 'Data baru langsung bisa dipakai setelah disimpan.', medan: medan, nilai: lama || {},
      catatan: 'Setiap perubahan tercatat di Audit Trail.', simpan: function (d, id) { if (lama) d._kode = lama.Kode; return api('mdSimpan', nama, d, id); }, selesai: function () { selesai(); muatRingkas(); } });
  }

  /* ---------- Banner + jendela "Perlu Dipetakan" ---------- */
  function pitaPeta(nama, label, ulang) {
    var n = st.ringkas.perlu[nama]; if (!n) return null;
    return h('div.v26-pita.awas', null, ikon('awas'), h('div.v26-tumbuh', { gaya: 'min-width:200px' }, h('b', null, n + ' karyawan memakai ' + label + ' yang belum terdaftar'), h('div.v26-kecil', null, 'Petakan sekali, dan semua karyawan dengan tulisan yang sama ikut terpetakan.')),
      h('button.v26-btn.kecil', { type: 'button', onclick: function () { bukaPeta(nama, label, ulang); } }, ikon('tukar'), 'Petakan Sekarang'));
  }
  function bukaPeta(nama, label, ulang) {
    var badan = h('div.v26-kolom'), simpan = h('button.v26-btn.utama', { type: 'button', disabled: true }, 'Simpan Pemetaan'), pilih = [];
    var L = V26.laci({ judul: 'Petakan ' + label + ' karyawan', sub: 'Tulisan di Data Karyawan dicocokkan ke master. Kolom teks lama tidak diubah.', tengah: true, lebar: true, isi: badan, kaki: [h('button.v26-btn.hantu', { type: 'button', onclick: function () { L.tutup(); } }, 'Batal'), simpan] });
    V26.rangkaBlok(badan, 3);
    Promise.all([api('mdPerluDipetakan', nama), pilihan([nama])]).then(function (r) {
      var d = r[0], opsi = st.pil[nama];
      if (!d.daftar.length) { V26.isi(badan, h('div.v26-kosong', null, ikon('cek'), h('p', null, 'Semua sudah terpetakan.'))); return; }
      simpan.disabled = false;
      V26.isi(badan, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Tulisan di Data Karyawan'), h('th.kanan', null, 'Karyawan'), h('th', null, 'Petakan ke'))),
        h('tbody', null, d.daftar.map(function (it) {
          var s = h('select.v26-in.padat', { 'aria-label': 'Petakan ' + it.nilai }, h('option', { value: '' }, '— lewati dulu —'), h('option', { value: '+' }, '+ Buat baru: "' + it.nilai + '"'),
            opsi.map(function (o) { return h('option', { value: o.k, selected: it.saran && it.saran.kode === o.k }, o.k + ' — ' + o.n); }));
          pilih.push({ nilai: it.nilai, s: s });
          return h('tr', null, h('td.judul', { 'data-l': '' }, it.nilai), h('td.kanan', { 'data-l': 'Karyawan' }, it.jumlah), h('td', { 'data-l': 'Petakan ke' }, h('div', { gaya: 'min-width:180px' }, s, it.saran ? h('div.v26-kecil.v26-redup', { gaya: 'margin-top:2px' }, 'Saran: mirip ' + it.saran.skor + '%') : null)));
        }))), d.kosong ? h('p.v26-kecil.v26-redup', null, d.kosong + ' karyawan lain belum mengisi ' + label + ' sama sekali.') : null);
    }, function (e) { V26.galatMuat(badan, e, function () { L.tutup(); bukaPeta(nama, label, ulang); }); });
    simpan.addEventListener('click', function () {
      var dipilih = pilih.filter(function (p) { return p.s.value; }); if (!dipilih.length) { V26.toast('Pilih minimal satu pemetaan.', 'awas'); return; }
      V26.jalankan(simpan, function () {
        var urut = Promise.resolve(), pasangan = [];
        dipilih.forEach(function (p) {
          urut = urut.then(function () {
            if (p.s.value !== '+') { pasangan.push({ nilai: p.nilai, kode: p.s.value }); return; }
            return api('mdSimpan', nama, { Nama: p.nilai }, V26.reqId()).then(function (r) { pasangan.push({ nilai: p.nilai, kode: r.kode }); });
          });
        });
        return urut.then(function () { return api('mdPetakan', nama, pasangan, V26.reqId()); });
      }, function (r) { return r.diperbarui + ' karyawan terpetakan'; }).then(function () { L.tutup(); muatRingkas().then(ulang); });
    });
  }

  /* ---------- Halaman master umum (Jabatan, Divisi, Status) ---------- */
  function halamanUmum(o) {
    var tbl, wadah = st.wadah;
    function ulang() { tbl.muat(); }
    function form(lama) { bukaFormulir(o.nama, o.label, o.medan(lama), lama, ulang); }
    V26.rangkaBlok(wadah, 5);
    pilihan(o.butuh || []).then(function () {
      tbl = V26.tabel({ kolom: o.kolom().concat([kolomAksi(o.nama, form, function () { return tbl; })]), cari: 'Cari nama atau kode…', filter: (o.filter ? o.filter() : []).concat([FILTER_AKTIF]),
        kelasBaris: function (b) { return b.Aktif === 'Tidak' ? 'redup' : ''; }, kosong: 'Belum ada ' + o.label.toLowerCase() + '. Tambahkan yang pertama.',
        aksiKosong: function () { return h('button.v26-btn.utama', { type: 'button', onclick: function () { form(null); } }, ikon('tambah'), 'Tambah ' + o.label); },
        muat: function (q) { return api('mdDaftar', o.nama, q); } });
      V26.isi(wadah, kepala(o.judul, o.sub, tombolImporEkspor(o.nama).concat([h('button.v26-btn.utama', { type: 'button', onclick: function () { form(null); } }, ikon('tambah'), 'Tambah ' + o.label)])),
        pitaPeta(o.nama, o.label.toLowerCase(), halaman), o.atas ? o.atas() : null, h('div.v26-kartu', null, tbl.el), o.bawah ? o.bawah(ulang) : null);
    }, function (e) { V26.galatMuat(wadah, e, halaman); });
  }
  var kKode = { j: 'Kode', isi: function (b) { return h('span.v26-chip.kode', null, b.Kode); } };
  var kNama = { j: 'Nama', judul: true, isi: function (b) { return h('b', null, b.Nama); } };
  var kPakai = { j: 'Karyawan', rata: 'kanan', isi: function (b) { return h('span.v26-angka.v26-tebal', null, b._pakai || 0); } };
  var kStatus = { j: 'Status', rata: 'tengah', isi: function (b) { return V26.lencanaAktif(b.Aktif); } };

  function hJabatan() {
    halamanUmum({ nama: 'jabatan', label: 'Jabatan', judul: 'Master Jabatan', sub: 'Tingkat jabatan, atasan langsung, dan golongan bawaan. Struktur organisasi digambar dari sini.', butuh: ['divisi', 'golongan', 'jabatan'],
      kolom: function () { return [kKode, kNama, { j: 'Level', isi: function (b) { return b.Level !== '' ? h('span.v26-lencana.pr', null, 'Level ' + b.Level) : h('span.v26-redup', null, '—'); } },
        { j: 'Divisi', isi: function (b) { return b._Kode_Divisi || '—'; } }, { j: 'Atasan Langsung', isi: function (b) { return b.Atasan ? h('span', null, h('span.v26-chip', null, b.Atasan), ' ', h('span.v26-kecil.v26-redup', null, b._Atasan)) : '—'; } },
        { j: 'Golongan', isi: function (b) { return b.Kode_Golongan ? h('span.v26-chip', null, b.Kode_Golongan) : '—'; } }, kPakai, kStatus]; },
      filter: function () { return [{ k: 'Kode_Divisi', l: 'Semua divisi', pilihan: st.pil.divisi }, { k: 'Level', l: 'Semua level', pilihan: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return { k: n, n: 'Level ' + n }; }) }]; },
      medan: function (lama) { return [medanKode(lama, 'mis. JBT-AST'), { k: 'Nama', l: 'Nama jabatan', wajib: true, maks: 80 },
        { k: 'Level', l: 'Level (1 = tertinggi)', t: 'pilih', polos: true, pilihan: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (n) { return { k: n, n: 'Level ' + n }; }), setengah: true },
        { k: 'Kode_Divisi', l: 'Divisi', t: 'pilih', pilihan: st.pil.divisi, setengah: true },
        { k: 'Atasan', l: 'Atasan langsung', t: 'pilih', kosong: 'Tidak ada (pucuk pimpinan)', pilihan: st.pil.jabatan.filter(function (j) { return !lama || j.k !== lama.Kode; }) },
        { k: 'Kode_Golongan', l: 'Golongan bawaan', t: 'pilih', pilihan: st.pil.golongan, setengah: true }, { k: 'Tunjangan', l: 'Tunjangan jabatan (Rp)', t: 'rupiah', setengah: true },
        { k: 'Kuota', l: 'Kuota orang (opsional)', t: 'angka', setengah: true }].concat(medanUmum(lama)); } });
  }
  function hDivisi() {
    halamanUmum({ nama: 'divisi', label: 'Divisi', judul: 'Master Divisi', sub: 'Divisi, departemen, atau bagian. Boleh bertingkat (mis. Afdeling → Blok) dengan nama tingkat bebas.', butuh: ['divisi'],
      kolom: function () { return [kKode, kNama, { j: 'Induk', isi: function (b) { return b.Induk ? h('span', null, h('span.v26-chip', null, b.Induk), ' ', h('span.v26-kecil.v26-redup', null, b._Induk)) : '—'; } }, { j: 'Nama Tingkat', isi: function (b) { return b.Nama_Tingkat || '—'; } }, kPakai, kStatus]; },
      medan: function (lama) { return [medanKode(lama, 'mis. AFD-1'), { k: 'Nama', l: 'Nama divisi', wajib: true, maks: 80 }, { k: 'Induk', l: 'Induk (bila bertingkat)', t: 'pilih', kosong: 'Tidak ada (tingkat teratas)', pilihan: st.pil.divisi.filter(function (j) { return !lama || j.k !== lama.Kode; }) },
        { k: 'Nama_Tingkat', l: 'Nama tingkat', contoh: 'mis. Departemen, Afdeling, Blok, Seksi' }].concat(medanUmum(lama)); } });
  }
  function hStatus() {
    halamanUmum({ nama: 'status', label: 'Status Karyawan', judul: 'Master Status Karyawan', sub: 'Jenis hubungan kerja beserta haknya: BPJS, cara PPh 21, cuti, dan THR.',
      kolom: function () { return [kKode, kNama, { j: 'Hubungan Kerja', isi: function (b) { return b.Jenis_Hubungan ? h('span.v26-lencana.info', null, b.Jenis_Hubungan) : '—'; } }, { j: 'BPJS', isi: function (b) { return b.BPJS ? h('span.v26-mono', null, b.BPJS) : '—'; } }, { j: 'BPJS TK', isi: function (b) { return b.BPJS_TK ? h('span.v26-lencana', { kelas: b.BPJS_TK === 'Peserta' ? 'ok' : '' }, b.BPJS_TK) : '—'; } }, { j: 'BPJS KS', isi: function (b) { return b.BPJS_KS ? h('span.v26-lencana', { kelas: b.BPJS_KS === 'Peserta' ? 'ok' : '' }, b.BPJS_KS) : '—'; } },
        { j: 'PPh 21', isi: function (b) { return b.PPh21 || '—'; } }, { j: 'Cuti', rata: 'tengah', isi: function (b) { return b.Hak_Cuti === 'Ya' ? 'Ya' : 'Tidak'; } }, { j: 'THR', rata: 'tengah', isi: function (b) { return b.Hak_THR === 'Ya' ? 'Ya' : 'Tidak'; } }, kPakai, kStatus]; },
      medan: function (lama) { return [medanKode(lama, 'mis. PKWT'), { k: 'Nama', l: 'Nama status', wajib: true, maks: 80 },
        { k: 'Jenis_Hubungan', l: 'Jenis hubungan kerja', t: 'pilih', pilihan: ['PKWTT', 'PKWT', 'Harian Lepas', 'Borongan', 'Magang', 'Outsourcing'] },
        { k: 'BPJS_TK', l: 'BPJS Ketenagakerjaan (TK)', t: 'pilih', pilihan: ['Peserta', 'Non Peserta'], setengah: true }, { k: 'BPJS_KS', l: 'BPJS Kesehatan (KS)', t: 'pilih', pilihan: ['Peserta', 'Non Peserta'], setengah: true },
        { k: 'BPJS', l: 'Program BPJS yang diikuti', contoh: 'KES,JHT,JP,JKK,JKM', bantu: 'Pisahkan dengan koma. Kosongkan bila tidak ikut.' },
        { k: 'PPh21', l: 'Cara PPh 21', t: 'pilih', pilihan: ['Pegawai Tetap', 'Tidak Tetap/Harian', 'Bukan Pegawai', 'Tidak Dipotong'] },
        { k: 'Hak_Cuti', l: 'Berhak cuti tahunan', t: 'saklar', setengah: true }, { k: 'Hak_THR', l: 'Berhak THR', t: 'saklar', setengah: true }].concat(medanUmum(lama)); } });
  }

  /* ---------- W-06 Golongan Gaji + skala masa kerja + kenaikan massal ---------- */
  function hGolongan() {
    var r = st.ringkas;
    halamanUmum({ nama: 'golongan', label: 'Golongan', judul: 'Master Golongan Gaji', sub: 'Rentang gaji per golongan, skala menurut masa kerja, dan kenaikan massal dengan simulasi.',
      atas: function () {
        return h('div.v26-kisi.k4', null,
          h('div.v26-kartu.v26-ubin', { gaya: r.bawahUmk ? 'background:var(--ak-t);border-color:transparent;color:var(--ak-tx)' : '' }, h('span.v26-kecil.v26-tebal', null, 'Di bawah UMK'), h('span.nilai', null, r.umk ? r.bawahUmk + ' karyawan' : '—'), h('span.v26-kecil', null, r.umk ? 'UMK acuan ' + rp(r.umk) : 'UMK belum diisi di Kalender Kerja')),
          h('div.v26-kartu.v26-ubin', null, h('span.v26-kecil.v26-redup', null, 'Jumlah golongan'), h('span.nilai', null, r.tab.golongan), h('span.v26-kecil.v26-redup', null, 'aktif')),
          h('div.v26-kartu.v26-ubin', null, h('span.v26-kecil.v26-redup', null, 'Rata-rata gaji pokok'), h('span.nilai', null, r.rataGaji ? rp(r.rataGaji) : '—'), h('span.v26-kecil.v26-redup', null, r.karyawan + ' karyawan')),
          h('div.v26-kartu.v26-ubin', null, h('span.v26-kecil.v26-redup', null, 'UMK lokasi (acuan)'), h('span.nilai', null, r.umk ? rp(r.umk) : '—'), h('a.v26-kecil', { href: '#/master/kalender', gaya: 'color:var(--pr)' }, 'Ubah di Kalender Kerja')));
      },
      kolom: function () { return [{ j: '', isi: function (b) { return h('button.v26-btn.ikon', { type: 'button', title: 'Skala masa kerja', 'aria-label': 'Skala masa kerja ' + b.Kode, 'aria-expanded': 'false', onclick: function (e) { bukaTingkat(e.currentTarget, b); } }, ikon('bawah')); } },
        kKode, { j: 'Nama Golongan', judul: true, isi: function (b) { return h('div', null, h('b', null, b.Nama), b.Keterangan ? h('div.v26-kecil.v26-redup', null, b.Keterangan) : null); } },
        { j: 'Gaji Minimum', rata: 'kanan', isi: function (b) { return h('span.v26-angka.v26-tebal', null, b.Gaji_Min ? rp(b.Gaji_Min) : '—'); } }, { j: 'Tengah', rata: 'kanan', isi: function (b) { return h('span.v26-angka.v26-redup', null, b.Gaji_Tengah ? rp(b.Gaji_Tengah) : '—'); } },
        { j: 'Maksimum', rata: 'kanan', isi: function (b) { return h('span.v26-angka.v26-tebal', null, b.Gaji_Maks ? rp(b.Gaji_Maks) : '—'); } }, kPakai, { j: 'Berlaku', isi: function (b) { return h('span.v26-mono.v26-redup', null, b.Tgl_Berlaku || '—'); } }]; },
      medan: function (lama) { return [medanKode(lama, 'mis. G-I'), { k: 'Nama', l: 'Nama golongan', wajib: true, maks: 80 }, { k: 'Keterangan', l: 'Keterangan', maks: 120 },
        { k: 'Gaji_Min', l: 'Gaji minimum (Rp)', t: 'rupiah', setengah: true }, { k: 'Gaji_Tengah', l: 'Gaji tengah (Rp)', t: 'rupiah', setengah: true }, { k: 'Gaji_Maks', l: 'Gaji maksimum (Rp)', t: 'rupiah', setengah: true }].concat(medanUmum(lama)); },
      bawah: function () { return panelKenaikan(); } });
  }
  function bukaTingkat(tombol, g) {
    var tr = tombol.closest('tr'), ada = tr.nextElementSibling && tr.nextElementSibling.classList.contains('anak') ? tr.nextElementSibling : null;
    if (ada) { ada.remove(); tombol.setAttribute('aria-expanded', 'false'); V26.isi(tombol, ikon('bawah')); return; }
    var kotak = h('div.v26-kolom', { gaya: 'gap:10px' }), baris = h('tr.anak', null, h('td', { colspan: 10, 'data-l': '', kelas: 'penuh' }, kotak));
    tr.parentNode.insertBefore(baris, tr.nextSibling); tombol.setAttribute('aria-expanded', 'true'); V26.isi(tombol, ikon('atas'));
    function muat() {
      V26.isi(kotak, h('div.v26-rangka', { gaya: 'width:60%' }));
      api('mdDaftar', 'tingkat', { ukuran: 100, filter: { Kode_Golongan: g.Kode } }).then(function (r) {
        function form(lama) {
          bukaFormulir('tingkat', 'Tingkat ' + g.Kode, [{ k: 'Nama', l: 'Nama tingkat', wajib: true, contoh: 'mis. Tingkat A', maks: 40 }, { k: 'MK_Dari', l: 'Masa kerja dari (tahun)', t: 'angka', setengah: true }, { k: 'MK_Sampai', l: 'Sampai (tahun)', t: 'angka', setengah: true, bantu: 'Kosongkan bila tanpa batas atas.' },
            { k: 'Gaji_Pokok', l: 'Gaji pokok (Rp)', t: 'rupiah', wajib: true }, { k: 'Tgl_Berlaku', l: 'Tanggal berlaku', t: 'tanggal' }], lama ? lama : { Kode_Golongan: g.Kode }, muat);
        }
        V26.isi(kotak, h('div.v26-baris.antara.bungkus', null, h('b.v26-kecil', { gaya: 'color:var(--pr)' }, 'Skala masa kerja: ' + g.Kode + ' — ' + g.Nama), h('button.v26-btn.kecil', { type: 'button', onclick: function () { apiTingkatBaru(form, g); } }, ikon('tambah'), 'Tambah tingkat')),
          r.baris.length ? h('div.v26-kisi.k4', null, r.baris.map(function (t) {
            return h('div.v26-kartu.isi', { gaya: 'padding:12px' }, h('div.v26-baris.antara', null, h('span.v26-kecil.v26-redup', null, t.MK_Dari + (t.MK_Sampai !== '' ? '–' + t.MK_Sampai : '+') + ' tahun'), h('span.v26-lencana', null, t.Nama)),
              h('div.v26-tebal.v26-angka', { gaya: 'font-size:16px;text-align:left;margin-top:4px' }, rp(t.Gaji_Pokok)), h('div.v26-baris', { gaya: 'margin-top:4px;gap:2px' }, h('button.v26-btn.kecil.hantu', { type: 'button', onclick: function () { form(t); } }, 'Ubah'),
                h('button.v26-btn.kecil.hantu.bahaya', { type: 'button', onclick: function () { V26.konfirmasi('Nonaktifkan tingkat ini?', t.Nama + ' tidak dipakai lagi untuk data baru.', 'Nonaktifkan', true).then(function (ya) { if (ya) api('mdAktif', 'tingkat', t.Kode, false, V26.reqId()).then(muat, function (e) { V26.toast(e.message, 'salah'); }); }); } }, 'Nonaktifkan')));
          })) : h('p.v26-kecil.v26-redup', null, 'Belum ada tingkat. Golongan ini memakai rentang minimum–maksimum saja. Perusahaan yang tidak memakai tingkat boleh membiarkannya kosong.'));
      }, function (e) { V26.isi(kotak, h('span.v26-kecil', { gaya: 'color:var(--er)' }, e.message + ' '), h('button.v26-btn.kecil', { type: 'button', onclick: muat }, 'Coba Lagi')); });
    }
    function apiTingkatBaru(form) { form(null); }
    muat();
  }
  function panelKenaikan() {
    var hasil = h('div'), jenis = h('select.v26-in', { 'aria-label': 'Kelompok sasaran' }, [['semua', 'Semua karyawan'], ['golongan', 'Per golongan'], ['jabatan', 'Per jabatan'], ['divisi', 'Per divisi'], ['status', 'Per status']].map(function (o) { return h('option', { value: o[0] }, o[1]); }));
    var kode = h('select.v26-in', { 'aria-label': 'Pilih kelompok', disabled: true }, h('option', { value: '' }, '—')), cara = 'persen', nilai = h('input.v26-in.v26-angka', { type: 'text', inputmode: 'decimal', 'aria-label': 'Nilai', placeholder: 'mis. 5,2' });
    var tgl = h('input.v26-in', { type: 'date', 'aria-label': 'Tanggal berlaku' }), seg = h('div.v26-segmen', { role: 'group', 'aria-label': 'Cara kenaikan' });
    var CARA = [['persen', 'Persen (%)', 'mis. 5,2'], ['nominal', 'Nominal (Rp)', 'mis. 150.000'], ['umk', 'Sesuaikan ke UMK', 'UMK baru, mis. 3.525.000']];
    function gambarSeg() { V26.isi(seg, CARA.map(function (c) { return h('button', { type: 'button', kelas: cara === c[0] ? 'aktif' : '', 'aria-pressed': cara === c[0], onclick: function () { cara = c[0]; nilai.placeholder = c[2]; nilai.value = ''; gambarSeg(); V26.kosongkan(hasil); } }, c[1]); })); }
    gambarSeg();
    nilai.addEventListener('input', function () { if (cara !== 'persen') { var d = nilai.value.replace(/\D/g, ''); nilai.value = d ? V26.angka(d) : ''; } });
    jenis.addEventListener('change', function () {
      V26.kosongkan(hasil); V26.isi(kode, h('option', { value: '' }, '—')); kode.disabled = jenis.value === 'semua';
      if (jenis.value !== 'semua') pilihan([jenis.value]).then(function () { V26.isi(kode, h('option', { value: '' }, '— pilih —'), st.pil[jenis.value].map(function (o) { return h('option', { value: o.k }, o.k + ' — ' + o.n); })); });
    });
    function param() { return { target: { jenis: jenis.value, kode: kode.value }, cara: cara, nilai: cara === 'persen' ? nilai.value : nilai.value.replace(/\D/g, ''), tglBerlaku: V26.isoKeTgl(tgl.value) }; }
    function simulasi(e) {
      var p = param();
      V26.jalankan(e.currentTarget, function () { return api('mdKenaikanSimulasi', p); }).then(function (r) {
        if (!r.terdampak) { V26.isi(hasil, h('div.v26-kosong', null, ikon('info'), h('p', null, 'Tidak ada karyawan yang terdampak.' + (r.tanpaGaji ? ' ' + r.tanpaGaji + ' karyawan belum punya gaji pokok.' : '')))); return; }
        var simpan = h('button.v26-btn.utama', { type: 'button' }, ikon('cek'), 'Simpan Kenaikan');
        simpan.addEventListener('click', function () {
          V26.konfirmasi('Simpan kenaikan untuk ' + r.terdampak + ' karyawan?', 'Berlaku mulai ' + r.tgl + ', tambahan beban ' + rp(r.tambahan) + ' per bulan. Periode payroll lama tidak berubah.', 'Simpan Kenaikan').then(function (ya) {
            if (ya) V26.jalankan(simpan, function () { return api('mdKenaikanSimpan', p, V26.reqId()); }, function (x) { return 'Kenaikan ' + x.id + ' tersimpan untuk ' + x.terdampak + ' karyawan'; }).then(function () { V26.kosongkan(hasil); });
          });
        });
        V26.isi(hasil, h('div.v26-gulung', { gaya: 'border-top:1px solid var(--bd)' }, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, h('th', null, 'Nama'), h('th', null, 'No.REG'), h('th', null, 'Jabatan'), h('th.kanan', null, 'Gaji Lama'), h('th.kanan', null, 'Gaji Baru'), h('th.kanan', null, 'Selisih'))),
          h('tbody', null, r.contoh.map(function (b) { return h('tr', null, h('td.judul', { 'data-l': '' }, b.nama), h('td', { 'data-l': 'No.REG' }, h('span.v26-mono.v26-redup', null, b.reg)), h('td', { 'data-l': 'Jabatan' }, b.jabatan || '—'),
            h('td.kanan', { 'data-l': 'Gaji lama' }, h('s.v26-angka.v26-redup', null, rp(b.lama))), h('td.kanan', { 'data-l': 'Gaji baru' }, h('b.v26-angka', null, rp(b.baru))), h('td.kanan', { 'data-l': 'Selisih' }, h('span.v26-angka.v26-tebal', { gaya: 'color:var(--ok)' }, '+' + rp(b.selisih)))); })))),
          h('div.v26-kaki', null, h('div.v26-baris.bungkus.lega', null, h('span', null, 'Karyawan terdampak: ', h('b', { gaya: 'color:var(--tx)' }, r.terdampak)), h('span', null, 'Tambahan beban per bulan: ', h('b', { gaya: 'color:var(--ok)' }, '+' + rp(r.tambahan))),
            r.terdampak > r.contoh.length ? h('span', null, 'Menampilkan ' + r.contoh.length + ' pertama') : null, r.tanpaGaji ? h('span', null, r.tanpaGaji + ' karyawan tanpa gaji pokok dilewati') : null),
            h('div.v26-baris', null, h('button.v26-btn', { type: 'button', onclick: function () { V26.kosongkan(hasil); } }, 'Batal'), simpan)));
      });
    }
    return h('div.v26-kartu', { gaya: 'border-top:3px solid var(--pr)' }, h('div.kepala', null, h('div', null, h('div.v26-baris', null, h('h2', { gaya: 'color:var(--pr)' }, 'Kenaikan Massal'), h('span.v26-lencana.pr', null, 'Simulasi dulu')), h('p.v26-redup.v26-kecil', null, 'Hitung dulu dampaknya; tidak ada yang berubah sampai Anda menekan Simpan Kenaikan.'))),
      h('div.v26-kisi.k4', { gaya: 'padding:16px;align-items:end' }, h('div.v26-medan', null, h('label', null, 'Kelompok sasaran'), jenis, kode), h('div.v26-medan', null, h('label', null, 'Cara'), seg),
        h('div.v26-medan', null, h('label', null, 'Nilai'), nilai), h('div.v26-medan', null, h('label', null, 'Tanggal berlaku'), tgl, h('button.v26-btn.utama', { type: 'button', onclick: simulasi }, 'Hitung Simulasi'))), hasil,
      h('p.v26-kecil.v26-redup', { gaya: 'padding:0 16px 14px' }, 'Kenaikan disimpan sebagai Riwayat Karier bertanggal berlaku. Payroll mulai membacanya pada tahap Payroll Presisi (v2.6.2); sampai saat itu gaji di Hitung Payroll tidak berubah.'));
  }

  /* ---------- W-07 Kode Absensi & Kamus Padanan ---------- */
  var sekKode = 'kode';
  function hKodeAbsen() {
    var wadah = st.wadah, isiEl = h('div.v26-kolom');
    var seg = h('div.v26-segmen', { role: 'tablist' }, [['kode', 'Daftar Kode'], ['padanan', 'Kamus Padanan' + (st.ringkas.tab.padanan ? ' (' + st.ringkas.tab.padanan + ')' : '')]].map(function (s) {
      return h('button', { type: 'button', role: 'tab', kelas: sekKode === s[0] ? 'aktif' : '', onclick: function () { sekKode = s[0]; hKodeAbsen(); } }, s[1]); }));
    V26.isi(wadah, kepala('Kode Absensi & Kamus Padanan', 'Kode absensi milik perusahaan dan padanan kode dari berkas luar. Kode yang dibayar dibaca Skema Upah dari sini.',
      sekKode === 'kode' ? tombolImporEkspor('kodeabsen').concat([h('button.v26-btn.utama', { type: 'button', onclick: function () { formKode(null); } }, ikon('tambah'), 'Tambah Kode')])
        : tombolImporEkspor('padanan').concat([h('button.v26-btn.utama', { type: 'button', onclick: function () { formPadanan(); } }, ikon('tambah'), 'Tambah Padanan')])), h('div', null, seg), isiEl);
    V26.rangkaBlok(isiEl, 6);
    var KEL = ['Hadir', 'Hadir Libur', 'Cuti', 'Sakit', 'Izin', 'Mangkir', 'Libur', 'Dinas', 'Lainnya'];
    var WARNA = [['#166534|#DCFCE7', 'Hijau'], ['#1E40AF|#DBEAFE', 'Biru'], ['#5B21B6|#EDE9FE', 'Ungu'], ['#115E59|#CCFBF1', 'Toska'], ['#3730A3|#E0E7FF', 'Nila'], ['#14532D|#BBF7D0', 'Hijau tua'], ['#9A3412|#FFEDD5', 'Jingga'], ['#991B1B|#FEE2E2', 'Merah'], ['#475569|#F1F5F9', 'Abu']];
    function formKode(lama) {
      var sistem = lama && lama.Sistem === 'Ya';
      bukaFormulir('kodeabsen', 'Kode Absensi', [{ k: 'Kode', l: 'Kode', t: 'kode', wajib: true, mati: !!lama, maks: 6, contoh: 'mis. DL', bantu: lama ? 'Kode tidak bisa diubah setelah dibuat.' : 'Huruf/angka singkat, paling banyak 6 karakter.' },
        { k: 'Nama', l: 'Arti', wajib: true, maks: 80 }, { k: 'Keterangan', l: 'Keterangan', maks: 120 }, { k: 'Kelompok', l: 'Kelompok', t: 'pilih', pilihan: KEL, mati: sistem, setengah: true },
        { k: 'Dibayar', l: 'Dibayar', t: 'pilih', kosong: false, pilihan: ['Ya', 'Tidak', '50%'], mati: sistem, setengah: true }, { k: 'Nilai_Hari', l: 'Nilai hari', t: 'pilih', kosong: false, polos: true, pilihan: [{ k: '1', n: '1 hari' }, { k: '0.5', n: '0,5 hari' }, { k: '0', n: '0' }], mati: sistem, setengah: true },
        { k: 'Batas', l: 'Batas', contoh: 'mis. 2 hari', maks: 40, setengah: true, bantu: 'Melewati batas memunculkan peringatan, tidak menolak.' }, { k: 'Potong_Cuti', l: 'Memotong saldo cuti', t: 'saklar', mati: sistem, setengah: true }, { k: 'Hitung_SP', l: 'Dihitung % absensi / SP', t: 'saklar', mati: sistem, setengah: true },
        { k: 'Boleh_Lembur', l: 'Boleh lembur', t: 'saklar', mati: sistem, setengah: true }, { k: 'Warna', l: 'Warna', t: 'pilih', polos: true, pilihan: WARNA.map(function (w) { return { k: w[0], n: w[1] }; }), setengah: true }], lama, function () { muatRingkas(); hKodeAbsen(); });
    }
    function formPadanan() {
      pilihan(['kodeabsen']).then(function () {
        bukaFormulir('padanan', 'Padanan Kode', [{ k: 'Simbol', l: 'Kode di berkas luar', wajib: true, maks: 20, contoh: 'mis. H, √, 1, Alpa, SKT', bantu: 'Huruf besar/kecil dianggap sama.' },
          { k: 'Kode_Baku', l: 'Dipadankan ke kode baku', t: 'pilih', wajib: true, pilihan: st.pil.kodeabsen.filter(function (k) { return !k.s; }) }, { k: 'Catatan', l: 'Catatan', maks: 120 }], null, function () { muatRingkas().then(hKodeAbsen); });
      });
    }
    if (sekKode === 'padanan') {
      var tbl = V26.tabel({ ukuran: 50, cari: 'Cari simbol…', kosong: 'Kamus masih kosong. Padanan juga terisi sendiri saat Anda memadankan kode di layar Unggah Excel Absensi.',
        aksiKosong: function () { return h('button.v26-btn.utama', { type: 'button', onclick: formPadanan }, ikon('tambah'), 'Tambah Padanan'); }, muat: function (q) { return api('mdDaftar', 'padanan', q); },
        kolom: [{ j: 'Kode di Berkas', judul: true, isi: function (b) { return h('span.v26-chip', { gaya: 'border:1px solid var(--bd2)' }, b.Simbol); } }, { j: '', isi: function () { return ikon('panah'); } },
          { j: 'Kode Baku', isi: function (b) { return h('span', null, h('span.v26-chip.kode', null, b.Kode_Baku), ' ', b._Kode_Baku); } }, { j: 'Catatan', isi: function (b) { return b.Catatan || '—'; } },
          { j: 'Terakhir Dipakai', isi: function (b) { return b.Terakhir_Dipakai ? b.Terakhir_Dipakai + ' (' + b.Dipakai_Kali + ' kali)' : 'Belum pernah'; } },
          { j: 'Aksi', rata: 'tengah', isi: function (b) { return h('button.v26-btn.ikon', { type: 'button', title: 'Hapus dari kamus', 'aria-label': 'Hapus padanan ' + b.Simbol, onclick: function () { V26.konfirmasi('Hapus padanan "' + b.Simbol + '"?', 'Impor berikutnya akan menanyakan lagi kode ini.', 'Hapus', true).then(function (ya) { if (ya) api('mdAktif', 'padanan', b.Kode, false, V26.reqId()).then(function () { tbl.muat(); muatRingkas(); }, function (e) { V26.toast(e.message, 'salah'); }); }); } }, ikon('hapus')); } }] });
      V26.isi(isiEl, h('div.v26-kartu', null, tbl.el)); return;
    }
    api('mdDaftar', 'kodeabsen', { ukuran: 200, aktif: 'semua' }).then(function (r) {
      function saklar(b, k, label) {
        var c = h('input', { type: 'checkbox', checked: b[k] === 'Ya', disabled: b.Sistem === 'Ya' || b.Aktif === 'Tidak', 'aria-label': label + ' ' + b.Kode });
        c.addEventListener('change', function () { var d = { _kode: b.Kode }; d[k] = c.checked ? 'Ya' : 'Tidak'; c.disabled = true; api('mdSimpan', 'kodeabsen', d, V26.reqId()).then(function () { b[k] = d[k]; V26.toast(b.Kode + ': ' + label + ' → ' + d[k]); }, function (e) { c.checked = !c.checked; V26.toast(e.message, 'salah'); }).finally(function () { c.disabled = false; }); });
        return h('span.v26-saklar', null, c, h('span'));
      }
      function kartu(gol, judul, ket, kelasIkon) {
        var baris = r.baris.filter(function (b) { return b.Golongan_HK === gol; });
        return h('div.v26-kartu', null, h('div.kepala.abu', null, h('div.v26-baris', null, ikon(kelasIkon), h('h3', { gaya: 'text-transform:uppercase;letter-spacing:.04em;font-size:12px' }, judul)), h('span.v26-kecil.v26-redup', null, baris.filter(function (b) { return b.Aktif !== 'Tidak'; }).length + ' kode aktif · ' + ket)),
          h('div.v26-gulung', null, h('table.v26-tabel.kartu', null, h('thead', null, h('tr', null, ['Kode', 'Arti', 'Kelompok', 'Dibayar', 'Potong Cuti', 'Dihitung SP', 'Nilai Hari', 'Batas', 'Aksi'].map(function (j, i) { return h('th', { kelas: i >= 3 && i <= 6 || i === 8 ? 'tengah' : '' }, j); }))),
            h('tbody', null, baris.map(function (b) {
              var sistem = b.Sistem === 'Ya';
              return h('tr', { kelas: b.Aktif === 'Tidak' ? 'redup' : '' }, h('td', { 'data-l': 'Kode' }, V26.chipKode(b.Kode, b.Warna, sistem)),
                h('td.judul', { 'data-l': '' }, h('b', null, b.Nama), b.Keterangan ? h('div.v26-kecil.v26-redup', { gaya: 'font-weight:400' }, b.Keterangan) : null), h('td', { 'data-l': 'Kelompok' }, b.Kelompok),
                h('td.tengah', { 'data-l': 'Dibayar' }, h('span.v26-lencana', { kelas: b.Dibayar === 'Tidak' ? '' : 'ok' }, b.Dibayar)), h('td.tengah', { 'data-l': 'Potong cuti' }, saklar(b, 'Potong_Cuti', 'Potong cuti')), h('td.tengah', { 'data-l': 'Dihitung SP' }, saklar(b, 'Hitung_SP', 'Dihitung SP')),
                h('td.tengah', { 'data-l': 'Nilai hari' }, h('span.v26-mono.v26-tebal', null, String(b.Nilai_Hari).replace('.', ','))), h('td', { 'data-l': 'Batas' }, sistem ? h('span.v26-baris.v26-kecil.v26-redup', { gaya: 'gap:4px' }, ikon('kunci'), 'Otomatis') : (b.Batas || '—')),
                h('td.tengah', { 'data-l': 'Aksi' }, h('div.v26-baris', { gaya: 'justify-content:flex-end;gap:2px' }, h('button.v26-btn.ikon', { type: 'button', title: 'Ubah', 'aria-label': 'Ubah ' + b.Kode, onclick: function () { formKode(b); } }, ikon('ubah')),
                  sistem ? h('span.v26-btn.ikon', { title: 'Diisi otomatis oleh sistem', gaya: 'cursor:default' }, ikon('kunci')) : h('button.v26-btn.ikon', { type: 'button', title: b.Aktif === 'Tidak' ? 'Aktifkan' : 'Nonaktifkan', 'aria-label': (b.Aktif === 'Tidak' ? 'Aktifkan ' : 'Nonaktifkan ') + b.Kode, onclick: function () { ubahAktif('kodeabsen', b, { muat: hKodeAbsen }); } }, ikon(b.Aktif === 'Tidak' ? 'cek' : 'tutup')))));
            })))));
      }
      V26.isi(isiEl, kartu('I', 'I. HK Dibayar', 'masuk hitungan hari dibayar', 'cek'), kartu('II', 'II. HK Tidak Dibayar', 'tidak masuk hitungan hari dibayar', 'awas'),
        h('p.v26-kecil.v26-redup', null, 'OUT dan NEW diisi otomatis dari tanggal keluar dan tanggal masuk karyawan. KL dipertahankan dari v2.5.1.'));
    }, function (e) { V26.galatMuat(isiEl, e, hKodeAbsen); });
  }

  /* ---------- W-08 Kalender Kerja ---------- */
  var kalBulan = null;
  function hKalender() {
    var wadah = st.wadah; V26.rangkaBlok(wadah, 6);
    if (!kalBulan) { var n = new Date(); kalBulan = { y: n.getFullYear(), m: n.getMonth() }; }
    Promise.all([api('mdKalender', kalBulan.y), pilihan(['divisi'])]).then(function (rr) {
      var d = rr[0], s = d.setelan, hk = String(s.Hari_Kerja).split(',').map(Number), libur = {};
      d.libur.forEach(function (l) { (libur[l.Tanggal] || (libur[l.Tanggal] = [])).push(l); });
      function ubah(judul, medan) { V26.laciFormulir({ judul: judul, medan: medan, nilai: s, catatan: 'Perubahan tercatat di Audit Trail dan berlaku untuk hitungan berikutnya.', simpan: function (x, id) { x._kode = 'PERUSAHAAN'; return api('mdSimpan', 'kalender', x, id); }, selesai: function () { muatRingkas(); hKalender(); } }); }
      var ZONA = [{ k: 'WIB', n: 'WIB (UTC+7)' }, { k: 'WITA', n: 'WITA (UTC+8)' }, { k: 'WIT', n: 'WIT (UTC+9)' }];
      function ubin(label, nilai, ket, aksi) { return h('div.v26-kartu.v26-ubin', null, h('span.v26-kecil.v26-redup.v26-tebal', { gaya: 'text-transform:uppercase;letter-spacing:.04em;font-size:11px' }, label), h('span', { gaya: 'font-size:18px;line-height:26px;font-weight:700' }, nilai), h('span.v26-kecil.v26-redup', { gaya: 'flex:1' }, ket), h('div', { gaya: 'text-align:right;border-top:1px solid var(--bd);padding-top:8px;margin-top:6px' }, h('button.v26-btn.kecil.hantu', { type: 'button', onclick: aksi, gaya: 'color:var(--pr)' }, 'Ubah'))); }
      var kartuAtas = h('div.v26-kisi.k4', null,
        ubin('Zona waktu', (ZONA.filter(function (z) { return z.k === s.Zona; })[0] || ZONA[0]).n, 'Semua jam absen, terlambat, cut-off, dan timer memakai zona ini.', function () { ubah('Zona Waktu', [{ k: 'Zona', l: 'Zona waktu perusahaan', t: 'pilih', kosong: false, polos: true, pilihan: ZONA }]); }),
        ubin('Pola hari kerja', s.Pola + ' kerja', s.Jam_Per_Hari.replace('.', ',') + ' jam per hari · ' + hk.length + ' hari per pekan', function () { ubah('Pola Hari Kerja', [{ k: 'Pola', l: 'Pola', t: 'pilih', kosong: false, pilihan: ['5 Hari', '6 Hari', 'Roster', 'Kustom'] }, { k: 'Hari_Kerja', l: 'Hari kerja', t: 'hari' }, { k: 'Jam_Per_Hari', l: 'Jam kerja per hari', t: 'angka' }]); }),
        ubin('Cut-off payroll', 'Tanggal ' + s.Cutoff_Mulai + ' s/d ' + s.Cutoff_Akhir, 'Periode absensi dan lembur yang masuk satu slip.', function () { ubah('Cut-off Payroll', [{ k: 'Cutoff_Mulai', l: 'Tanggal mulai (1–31)', t: 'angka', setengah: true }, { k: 'Cutoff_Akhir', l: 'Tanggal akhir (1–31)', t: 'angka', setengah: true }]); }),
        ubin('Tanggal gajian', 'Tanggal ' + s.Tgl_Gajian + ' tiap bulan', s.Geser_Gajian === 'Ya' ? 'Maju ke hari kerja sebelumnya bila jatuh di hari libur.' : 'Tetap di tanggal itu walau hari libur.', function () { ubah('Tanggal Gajian & UMK', [{ k: 'Tgl_Gajian', l: 'Tanggal gajian (1–31)', t: 'angka' }, { k: 'Geser_Gajian', l: 'Geser bila hari libur', t: 'saklar', ket: 'Maju ke hari kerja sebelumnya' }, { k: 'UMK', l: 'UMK lokasi (Rp)', t: 'rupiah', bantu: 'Dipakai untuk peringatan gaji di bawah UMK. Isi dari keputusan resmi yang berlaku.' }]); }));
      // Kisi bulan
      function tglTeks(dt) { return (dt.getDate() < 10 ? '0' : '') + dt.getDate() + '/' + (dt.getMonth() + 1 < 10 ? '0' : '') + (dt.getMonth() + 1) + '/' + dt.getFullYear(); }
      function hariKerja(dt) { return hk.indexOf(dt.getDay() === 0 ? 7 : dt.getDay()) >= 0 && !libur[tglTeks(dt)]; }
      var hariTerakhir = new Date(kalBulan.y, kalBulan.m + 1, 0).getDate(), gaji = new Date(kalBulan.y, kalBulan.m, Math.min(+s.Tgl_Gajian, hariTerakhir));
      if (s.Geser_Gajian === 'Ya') { var jaga = 0; while (!hariKerja(gaji) && jaga++ < 10) gaji.setDate(gaji.getDate() - 1); }
      var awal = new Date(kalBulan.y, kalBulan.m, 1), geser = (awal.getDay() + 6) % 7, sel = [];
      ['SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB', 'MIN'].forEach(function (n) { sel.push(h('div.hr', n === 'MIN' ? { gaya: 'color:#DC2626' } : null, n)); });
      for (var i = 0; i < 42; i++) {
        var dt = new Date(kalBulan.y, kalBulan.m, 1 - geser + i), luar = dt.getMonth() !== kalBulan.m, t = tglTeks(dt), L = libur[t] || [], kls = luar ? 'luar' : '', tanda = [];
        if (i >= 35 && luar && new Date(kalBulan.y, kalBulan.m, 1 - geser + 35).getMonth() !== kalBulan.m) break;
        if (!luar) {
          var nomorHari = dt.getDay() === 0 ? 7 : dt.getDay();
          if (L.length) { kls = (L[0].kunci || L[0].Jenis === 'Nasional') ? 'nas' : L[0].Jenis === 'Cuti Bersama' ? 'cb' : 'prs'; L.forEach(function (l) { tanda.push(h('span.tanda', { title: l.Nama }, l.Nama)); }); }
          else if (hk.indexOf(nomorHari) < 0) { kls = 'minggu'; tanda.push(h('span.tanda.v26-redup', null, nomorHari === 7 ? 'MG' : 'Libur')); }
          if (dt.getDate() === Math.min(+s.Cutoff_Akhir, hariTerakhir)) tanda.push(h('span.tanda.cut', { title: 'Batas akhir cut-off' }, 'Cut-off'));
          if (dt.getTime() === gaji.getTime()) tanda.push(h('span.tanda.gaji', { title: 'Hari gajian' }, 'Gajian'));
          if (t === d.hariIni) kls += ' kini';
        }
        sel.push(h('div.sel', { kelas: kls }, h('b', null, dt.getDate()), tanda));
      }
      function pindah(n) { kalBulan.m += n; if (kalBulan.m < 0) { kalBulan.m = 11; kalBulan.y--; } if (kalBulan.m > 11) { kalBulan.m = 0; kalBulan.y++; } hKalender(); }
      var kisi = h('div.v26-kartu.isi.v26-kolom', null, h('div.v26-baris.antara', null, h('button.v26-btn.ikon', { type: 'button', 'aria-label': 'Bulan sebelumnya', onclick: function () { pindah(-1); } }, ikon('kiri')), h('h2', null, NAMA_BULAN[kalBulan.m] + ' ' + kalBulan.y), h('button.v26-btn.ikon', { type: 'button', 'aria-label': 'Bulan berikutnya', onclick: function () { pindah(1); } }, ikon('kanan'))),
        h('div.v26-kal', null, sel), h('div.v26-legenda', null, [['var(--sf)', 'Hari kerja'], ['var(--nt-t)', 'Libur mingguan'], ['var(--kc-t)', 'Libur nasional'], ['var(--pr-t)', 'Libur perusahaan'], ['var(--in-t)', 'Cuti bersama'], ['#16A34A', 'Hari gajian'], ['var(--ak-t)', 'Batas cut-off']].map(function (x) { return h('span', null, h('i', { gaya: 'background:' + x[0] }), x[1]); })));
      function formLibur() { bukaFormulir('libur', 'Libur Perusahaan', [{ k: 'Tanggal', l: 'Tanggal', t: 'tanggal', wajib: true }, { k: 'Nama', l: 'Nama hari libur', wajib: true, maks: 80 }, { k: 'Jenis', l: 'Jenis', t: 'pilih', kosong: false, pilihan: ['Perusahaan', 'Cuti Bersama', 'Nasional'] }, { k: 'Dibayar', l: 'Dibayar (HK penuh)', t: 'saklar', bawaan: 'Ya' }], null, hKalender); }
      var daftarLibur = h('div.v26-kartu.isi.v26-kolom', { gaya: 'gap:10px' }, h('div.v26-baris.antara', null, h('h2', null, 'Hari Libur ' + d.tahun), h('span.v26-lencana', null, d.libur.length + ' terdaftar')),
        d.libur.length ? d.libur.map(function (l) {
          return h('div.v26-baris.lega', { gaya: 'padding:8px 10px;border:1px solid var(--bd);border-radius:10px;align-items:flex-start' }, h('div', { gaya: 'text-align:center;min-width:44px' }, h('b', { gaya: 'font-size:16px;display:block' }, l.Tanggal.slice(0, 2)), h('span.v26-kecil.v26-redup', null, NAMA_BULAN[+l.Tanggal.slice(3, 5) - 1].slice(0, 3))),
            h('div.v26-tumbuh', null, h('b', null, l.Nama), h('div.v26-baris', { gaya: 'margin-top:2px' }, h('span.v26-lencana', { kelas: (l.kunci || l.Jenis === 'Nasional') ? 'kunci' : l.Jenis === 'Cuti Bersama' ? 'info' : 'pr' }, l.kunci ? 'Nasional' : l.Jenis), h('span.v26-kecil.v26-redup', null, l.Dibayar === 'Tidak' ? 'Tidak dibayar' : 'Dibayar'))),
            l.kunci ? h('span.v26-btn.ikon', { title: 'Diatur pemilik aplikasi', gaya: 'cursor:default' }, ikon('kunci')) : h('button.v26-btn.ikon', { type: 'button', 'aria-label': 'Hapus libur ' + l.Nama, title: 'Hapus', onclick: function () { V26.konfirmasi('Hapus libur "' + l.Nama + '"?', 'Tanggal ' + l.Tanggal + ' kembali menjadi hari biasa.', 'Hapus', true).then(function (ya) { if (ya) api('mdAktif', 'libur', l.Kode, false, V26.reqId()).then(hKalender, function (e) { V26.toast(e.message, 'salah'); }); }); } }, ikon('hapus')));
        }) : h('p.v26-kecil.v26-redup', null, 'Belum ada hari libur untuk tahun ini.'),
        h('button.v26-btn', { type: 'button', gaya: 'border-style:dashed', onclick: formLibur }, ikon('tambah'), 'Tambah Libur Perusahaan'),
        h('div.v26-baris.v26-kecil.v26-redup', { gaya: 'align-items:flex-start' }, ikon('info'), 'Hari Minggu dan libur mingguan otomatis mengikuti Pola hari kerja, berlaku terus dari tahun ke tahun. Libur nasional dan cuti bersama berganti tiap tahun: impor daftarnya setelah SKB 3 Menteri terbit.'));
      // Pola per divisi
      function formPola(lama) {
        V26.laciFormulir({ judul: lama ? 'Ubah Pola ' + lama.Nama : 'Tambah Pola per Divisi', sub: 'Menimpa pola bawaan perusahaan hanya untuk divisi ini.', nilai: lama || { Zona: s.Zona, Pola: s.Pola, Hari_Kerja: s.Hari_Kerja, Jam_Per_Hari: s.Jam_Per_Hari, Cutoff_Mulai: s.Cutoff_Mulai, Cutoff_Akhir: s.Cutoff_Akhir, Tgl_Gajian: s.Tgl_Gajian, Geser_Gajian: s.Geser_Gajian },
          medan: [{ k: 'Kode', l: 'Divisi', t: 'pilih', wajib: true, mati: !!lama, pilihan: lama ? [{ k: lama.Kode, n: lama.Nama }] : st.pil.divisi.map(function (x) { return { k: 'DIV:' + x.k, n: x.n }; }), polos: true },
            { k: 'Zona', l: 'Zona waktu', t: 'pilih', kosong: false, polos: true, pilihan: ZONA, setengah: true }, { k: 'Pola', l: 'Pola', t: 'pilih', kosong: false, pilihan: ['5 Hari', '6 Hari', 'Roster', 'Kustom'], setengah: true }, { k: 'Hari_Kerja', l: 'Hari kerja', t: 'hari' },
            { k: 'Jam_Per_Hari', l: 'Jam kerja per hari', t: 'angka' }, { k: 'Keterangan', l: 'Keterangan', maks: 120 }],
          simpan: function (x, id) { if (lama) x._kode = lama.Kode; else { var p = st.pil.divisi.filter(function (v) { return 'DIV:' + v.k === x.Kode; })[0]; x.Nama = p ? p.n : x.Kode; } ['Cutoff_Mulai', 'Cutoff_Akhir', 'Tgl_Gajian', 'Geser_Gajian'].forEach(function (k) { if (x[k] == null) x[k] = (lama || s)[k]; }); return api('mdSimpan', 'kalender', x, id); }, selesai: hKalender });
      }
      var pola = h('div.v26-kolom', { gaya: 'gap:10px' }, h('div.v26-baris.antara.bungkus', null, h('div', null, h('h2', null, 'Pola Kerja per Divisi'), h('p.v26-kecil.v26-redup', null, 'Untuk divisi yang jadwalnya berbeda dari bawaan perusahaan.')), h('button.v26-btn.kecil', { type: 'button', onclick: function () { formPola(null); } }, ikon('tambah'), 'Tambah Pola')),
        d.pola.length ? h('div.v26-kisi.k3', null, d.pola.map(function (p) {
          return h('div.v26-kartu.isi', null, h('div.v26-baris.antara', null, h('b', null, p.Nama), h('span.v26-lencana', null, p.Zona)), h('div', { gaya: 'margin-top:6px;font-weight:600' }, p.Pola + ' kerja · ' + String(p.Jam_Per_Hari).replace('.', ',') + ' jam/hari'), h('p.v26-kecil.v26-redup', null, p.Keterangan || 'Hari kerja: ' + String(p.Hari_Kerja).split(',').map(function (x) { return ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'][x - 1]; }).join(', ')),
            h('div.v26-baris', { gaya: 'margin-top:8px;justify-content:flex-end' }, h('button.v26-btn.kecil.hantu', { type: 'button', onclick: function () { formPola(p); } }, 'Ubah'), h('button.v26-btn.kecil.hantu.bahaya', { type: 'button', onclick: function () { V26.konfirmasi('Hapus pola ' + p.Nama + '?', 'Divisi ini kembali memakai pola bawaan perusahaan.', 'Hapus', true).then(function (ya) { if (ya) api('mdAktif', 'kalender', p.Kode, false, V26.reqId()).then(hKalender, function (e) { V26.toast(e.message, 'salah'); }); }); } }, 'Hapus')));
        })) : h('div.v26-kartu', null, h('div.v26-kosong', { gaya: 'padding:24px' }, h('p', null, 'Semua divisi memakai pola bawaan perusahaan.'))));
      V26.isi(wadah, kepala('Kalender Kerja', 'Zona waktu, pola hari kerja, cut-off, tanggal gajian, dan hari libur perusahaan.', [h('button.v26-btn', { type: 'button', onclick: function (e) { V26.jalankan(e.currentTarget, function () { return V26.unduhTabel('Hari_Libur_' + d.tahun, ['Tanggal', 'Nama', 'Jenis', 'Dibayar'], d.libur.map(function (l) { return [l.Tanggal, l.Nama, l.kunci ? 'Nasional' : l.Jenis, l.Dibayar]; })); }); } }, ikon('unduh'), 'Unduh Daftar Libur')]),
        kartuAtas, h('div.v26-kisi.v26-dua', { gaya: 'grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:start' }, kisi, daftarLibur), pola,
        h('p.v26-kecil.v26-redup', null, s.Diubah_Pada ? 'Terakhir diubah oleh ' + s.Diubah_Oleh + ' pada ' + s.Diubah_Pada + ' ' + s.Zona + '. Riwayat tersimpan di Audit Trail.' : ''));
    }, function (e) { V26.galatMuat(wadah, e, hKalender); });
  }
  return { buka: buka };
})();
