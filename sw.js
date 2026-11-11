/* Jurnal HRD v2.7.0-b — sw.js: service worker. Menyimpan "kerangka" aplikasi agar terbuka cepat dan tetap tampil saat sinyal lemah.
   TIDAK PERNAH menyimpan data dari server (Apps Script), foto, atau token: hanya berkas aplikasi di alamat yang sama. */
var VERSI = 'v2.7.0-b', CACHE = 'jurnalhrd-' + VERSI, ASET = ["./","index.html","manifest.webmanifest","css/style.css","css/leaflet.css","img/logo-awb.png","img/ikon-awb.png","img/pwa-192.png","img/pwa-512.png","img/apple-touch-icon.png","js/vendor/leaflet.js","js/config.js","js/inti.js","js/api.js","js/mesin_grafik.js","js/modul_master.js","js/modul_impor.js","js/modul_absensi.js","js/modul_hadir.js","js/modul_karyawan.js","js/modul_pengaturan.js","js/modul_grafik.js","js/app.js"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return Promise.all(ASET.map(function (u) { return c.add(new Request(u, { cache: 'reload' })).catch(function () {}); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('jurnalhrd-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('message', function (e) { if (e.data === 'lewati') self.skipWaiting(); });

function jaringanDulu(req, cadangan) {
  return fetch(req).then(function (r) { if (r && r.ok) { var salin = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, salin); }); } return r; })
    .catch(function () { return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || (cadangan ? caches.match(cadangan) : Response.error()); }); });
}
function cacheDulu(req) {   // alamat berversi (?v=...) tidak berubah isinya: cache dulu; jika belum ada ambil dari jaringan; jika offline pakai salinan terdekat
  return caches.match(req).then(function (m) {
    if (m) return m;
    return fetch(req).then(function (r) { if (r && r.ok) { var salin = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, salin); }); } return r; })
      .catch(function () { return caches.match(req, { ignoreSearch: true }).then(function (x) { return x || Response.error(); }); });
  });
}
self.addEventListener('fetch', function (e) {
  var req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || u.origin !== self.location.origin) return;            // data Apps Script, peta OSM, dsb. tidak disentuh
  if (req.mode === 'navigate') return e.respondWith(jaringanDulu(req, 'index.html'));  // halaman: selalu coba yang terbaru
  if (/\/js\/config\.js$/.test(u.pathname) || /sw\.js$/.test(u.pathname) || /manifest\.webmanifest$/.test(u.pathname)) return e.respondWith(jaringanDulu(req));  // alamat server harus selalu segar
  e.respondWith(cacheDulu(req));
});
