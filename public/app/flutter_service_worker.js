'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "9d13178d9ea39233f98aac46fad8e5be",
"version.json": "c5e15cfe313b58d1cf7454e6aecfa0d3",
"index.html": "a2e42d329de467cd32b766a21e02603d",
"/": "a2e42d329de467cd32b766a21e02603d",
"main.dart.js": "105d9ab3932e0f91305d68b1e27afde0",
"flutter.js": "24bc71911b75b5f8135c949e27a2984e",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "a824a72b891722ff4e9bb694cad72781",
"assets/NOTICES": "09e4c7f24d5eb8c1d8f84a7adf9fe333",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/AssetManifest.bin.json": "33304de68d2c49e9b3cb7c53b69f08bf",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "33b7d9392238c04c131b6ce224e13711",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/shaders/stretch_effect.frag": "40d68efbbf360632f614c731219e95f0",
"assets/AssetManifest.bin": "bd6312619369f08ffbfa1e5ed6156063",
"assets/fonts/MaterialIcons-Regular.otf": "9794f4a66865fb118205117648f4fde3",
"assets/assets/images/student_avatar.png": "26e0a65d584d784fb61470bd95d38008",
"assets/assets/images/performer_c1.png": "a28521d165a755f852b939e1ff48eae7",
"assets/assets/images/quote_mountain.png": "3f3c3333606cd56984def854f33b7266",
"assets/assets/images/card_topic.png": "5966a282dd409fa20f08cc1effbe47be",
"assets/assets/images/trophy.png": "a305f613dd0670515e0b26bcc1b32f98",
"assets/assets/images/info_book_icon.png": "85ce7b7c3959de139757f272a9811f7c",
"assets/assets/images/today_info_sunrise.png": "05450784af9f08a0c5ca4490137fefa2",
"assets/assets/images/performer_badge_4.png": "eb0a27f0c5f0611731af82fae07c5f7c",
"assets/assets/images/card_live_tests.png": "1d6d906588cfde710e8a1eefe42683d9",
"assets/assets/images/hero_wbtet_banner.png": "074ac799cc1d5d833c9d752f6218d676",
"assets/assets/images/performer_badge_1.png": "a72eaa1296775740efbfc7b1a90698d6",
"assets/assets/images/today_info_book.png": "35c1db8ec0b52e602db920df5773b31d",
"assets/assets/images/home_hero_banner.png": "7519efa461dc5a1fa277917414fccd28",
"assets/assets/images/continue_clipboard.png": "3dd765033789d34e2400eb7332f277ea",
"assets/assets/images/performer_badge_3.png": "9c7fe51b107cf647bb81a62ae7fb78ea",
"assets/assets/images/performer_badge_2.png": "b7f1a9c4fc21c0d5514591c673ed5c6f",
"assets/assets/images/book_icon_3d.png": "e169c73358f607884ac59ff9e45121b5",
"assets/assets/images/splash_subtitle.png": "2c6df2ff982cd57f585c9621618c0029",
"assets/assets/images/books_stack_3d.png": "83424050e306cda65dd2a0152589de9c",
"assets/assets/images/exam_ssc_bg.png": "a133e6b2a413d3eb4d37e90af5df8ed3",
"assets/assets/images/quote_target_3d.png": "886490eaa2234316c30abefb31e5745c",
"assets/assets/images/quote_mountain_summit.png": "366e744bde315aa1d1e80ebc560b11b6",
"assets/assets/images/performer_2_wreath.png": "03a0cf18d1bf5cd7036be34fc84d4272",
"assets/assets/images/performer_trophy.png": "0f86a59892d6a7575ca2440b0110b5d9",
"assets/assets/images/card_previous_year.png": "5687dffa6b9f4210c344afe2751f0346",
"assets/assets/images/series_wbp_bg.png": "a7af97d8162743a1b59c240c341e372d",
"assets/assets/images/student_avatar_hd.png": "9ce4525f1f1c9137584f96be48e30811",
"assets/assets/images/today_info_lightbulb.png": "d0d308625694e72ecd28d8a1d1e6573c",
"assets/assets/images/performer_2_avatar.png": "b692e831ef25fc806f6404f3d4765c7d",
"assets/assets/images/performer_rahul.png": "8103f08856e3f20220dadab47e6f437e",
"assets/assets/images/exam_wbp_bg.png": "e09ab6f96e13000388fbf0869bc9d1a4",
"assets/assets/images/continue_play_icon.png": "6ee8858b13b9695f392bad180e4792c4",
"assets/assets/images/motivation_bg.png": "eef3cd7a64d7c4e3ba9aff40bccaaf2b",
"assets/assets/images/student.png": "a1a5fdc419dc0aef24891ae4af77a07e",
"assets/assets/images/logo-circle.png": "b0c9dc1928418956a1cced715553401a",
"assets/assets/images/performer_4_wreath.png": "23ae883fd4000cbb43ebaced02fba287",
"assets/assets/images/performer_1_avatar.png": "f620bdc0d667983a27c5cf5ae55d1ed0",
"assets/assets/images/performer_priya.png": "06996f5f84f3f973ac43580dc178f9ba",
"assets/assets/images/results_growth_chart.png": "f9074c452b076a4889aa3bec10ab6afb",
"assets/assets/images/streak_mountain_summit.jpg": "054ef9570f1c87e21221cba286c0e7f6",
"assets/assets/images/popular_exams/bg_railway.png": "9bc9a9bb87cb7c6ed3847f9a44df2160",
"assets/assets/images/popular_exams/bg_railway@2x.png": "25a838b7a8dedca9b278bf27e3cb2711",
"assets/assets/images/popular_exams/logo_ssc.png": "e91d4bbaf196b9064d6f0e37159e1cf7",
"assets/assets/images/popular_exams/bg_wbpsc.png": "38ef8e52c56a653b661155adf979e2e0",
"assets/assets/images/popular_exams/logo_railway.png": "5804602b2fccbc00987096e91dedbb20",
"assets/assets/images/popular_exams/bg_ssc@2x.png": "143503724f2edbb811c8d154d8f29729",
"assets/assets/images/popular_exams/logo_wbtet.png": "c7f81983c72568a0ede35538cf3f30f0",
"assets/assets/images/popular_exams/bg_wbp.png": "52e47944b818e5c875a8f39542694648",
"assets/assets/images/popular_exams/bg_wbtet.png": "75a2dd1441efc3032c6f6e25e6b25b0a",
"assets/assets/images/popular_exams/logo_wbpsc.png": "5514c70c0fc15d3f5002e57c19d0f90b",
"assets/assets/images/popular_exams/bg_wbp@2x.png": "0a3bc1b9d3f3e7f369eab1220ab45539",
"assets/assets/images/popular_exams/bg_wbtet@2x.png": "614fd369d38bf38560d9b03be631238f",
"assets/assets/images/popular_exams/logo_wbp.png": "81b177bf273c05163964d4fbef42fce6",
"assets/assets/images/popular_exams/bg_ssc.png": "0c322d33c69461e00d51af11e7d37ab4",
"assets/assets/images/popular_exams/bg_wbpsc@2x.png": "ad57e463f06240227e2eda06b572c350",
"assets/assets/images/exam_wbp_card.png": "44cadea027f568e38f85ed38f264e2f7",
"assets/assets/images/splash_brand.png": "63f201275b9bbc310e2d96bc8992a8ce",
"assets/assets/images/logo.png": "a388e5e5266066e574e193b06e1d74ac",
"assets/assets/images/card_mock.png": "46996566ff728c384081669560d60253",
"assets/assets/images/card_mock_test.png": "a5b52b7b27c0e3800b6695ff3052c7f0",
"assets/assets/images/card_pyq.png": "61de18f2946f72cf9e89f3486c56382a",
"assets/assets/images/performer_4_avatar.png": "132d9f9c5977fd23cbc469b656c511fe",
"assets/assets/images/performer_amit.png": "a37d3b7a60f9a1c5fb96fc954988ff41",
"assets/assets/images/google_logo.png": "be8258e74ebfadc3559e564c0560c676",
"assets/assets/images/grad_cap_logo.png": "c264ee7ca1d39695c312a2768212ea64",
"assets/assets/images/today_info_book_circle.png": "a78612b440ab75cb0ba9b0955ccef2be",
"assets/assets/images/exam_kp_bg.png": "0b3a242ac16846cf9c77a71786c1bda4",
"assets/assets/images/hero_banner_ref.png": "4e58ea2d6d1f00f760b56e85c1149129",
"assets/assets/images/series_kp_bg.png": "94bbfb9b68587328a175acdce0bba49f",
"assets/assets/images/performer_1_wreath.png": "6258e9949c4270fea949b856785a7943",
"assets/assets/images/series_ssc_bg.png": "d87c01dd92e5abf492f3cc3ceecdd836",
"assets/assets/images/promo_student.png": "5a05c49b121374058c2b82c203925375",
"assets/assets/images/exams/emblem_wbpsc_coin.png": "dd1f06cea423f8364783663d0cb0c64c",
"assets/assets/images/exams/emblem_wbssc.png": "d4bb778f3985a467fda55514b1e139f7",
"assets/assets/images/exams/emblem_series_kp.png": "1817ad840d50278cd34de72ddbfb48e0",
"assets/assets/images/exams/bg_railway.png": "9bc9a9bb87cb7c6ed3847f9a44df2160",
"assets/assets/images/exams/emblem_wbp_shield.png": "50008b30ad83bcf7be1db619fc3a6f72",
"assets/assets/images/exams/bg_railway@2x.png": "25a838b7a8dedca9b278bf27e3cb2711",
"assets/assets/images/exams/emblem_ssc_crest.png": "4a9519cddc7b6803090875224807ac97",
"assets/assets/images/exams/logo_ssc.png": "e91d4bbaf196b9064d6f0e37159e1cf7",
"assets/assets/images/exams/bg_wbpsc.png": "38ef8e52c56a653b661155adf979e2e0",
"assets/assets/images/exams/logo_railway.png": "5804602b2fccbc00987096e91dedbb20",
"assets/assets/images/exams/emblem_railway.png": "964299c3011f2c5dd8581eb1976579b7",
"assets/assets/images/exams/emblem_wbpsc.png": "10e8ee0666c76ff39f74990fc0c5cd50",
"assets/assets/images/exams/bg_ssc@2x.png": "143503724f2edbb811c8d154d8f29729",
"assets/assets/images/exams/emblem_wbp.png": "479868687c13bba8565f18d154a78440",
"assets/assets/images/exams/logo_wbtet.png": "c7f81983c72568a0ede35538cf3f30f0",
"assets/assets/images/exams/emblem_series_wbp.png": "a1e48acddf084da469c298ac110b0d9c",
"assets/assets/images/exams/emblem_tet.png": "382ca94d50cf8ccdaa4e9836e5168004",
"assets/assets/images/exams/bg_wbp.png": "52e47944b818e5c875a8f39542694648",
"assets/assets/images/exams/bg_wbtet.png": "75a2dd1441efc3032c6f6e25e6b25b0a",
"assets/assets/images/exams/logo_wbpsc.png": "5514c70c0fc15d3f5002e57c19d0f90b",
"assets/assets/images/exams/bg_wbp@2x.png": "0a3bc1b9d3f3e7f369eab1220ab45539",
"assets/assets/images/exams/bg_wbtet@2x.png": "614fd369d38bf38560d9b03be631238f",
"assets/assets/images/exams/logo_wbp.png": "81b177bf273c05163964d4fbef42fce6",
"assets/assets/images/exams/emblem_wbtet_seal.png": "8aa11c3330984bbb66dc69057381530f",
"assets/assets/images/exams/bg_ssc.png": "0c322d33c69461e00d51af11e7d37ab4",
"assets/assets/images/exams/bg_wbpsc@2x.png": "ad57e463f06240227e2eda06b572c350",
"assets/assets/images/exams/emblem_series_ssc.png": "07833bd2bedf9d11f52c24dcb7563c4a",
"assets/assets/images/exams/emblem_ssc.png": "befdde7e6d7d7ce4d41003b22bd41c22",
"assets/assets/images/splash_headline.png": "2b43c468997de3fa0fde507000177b57",
"assets/assets/images/performer_sneha.png": "7c36fa19bc9d61ec78e067b24b6aae70",
"assets/assets/images/hero_wbtet_right.png": "b9f9d8846041d15366cb01078409a3ff",
"assets/assets/images/exam_kp_card.png": "3e1c0cfe7090ff2adf68cc7e7e4e7124",
"assets/assets/images/performer_3_avatar.png": "f17b52feb8170588223eb85976b9c3a1",
"assets/assets/images/card_topic_practice.png": "ba4f9db817648fa366e3040a75abf0e6",
"assets/assets/images/quote_mountain_bg.png": "e699ce55c232113a2a5b1a19a4094da9",
"assets/assets/images/exam_ssc_card.png": "c2fff0012ce6b96ba709eadc58bc8c00",
"assets/assets/images/performer_3_wreath.png": "fbfbddae3c8482c829680ab66fd04ec1",
"assets/assets/images/quote_target_icon.png": "fb15859f3268c7b75d1910a31b5c5e17",
"assets/assets/images/card_live.png": "7f98c36e41eab420ee12a1f6b1bd02c9",
"assets/assets/images/performer_suman.png": "b9689b66a93da6a3ec77de25263c785b",
"assets/assets/images/results_hero_illustration.png": "654c9e13388207c0f3f89e45664983da",
"canvaskit/skwasm.js": "8060d46e9a4901ca9991edd3a26be4f0",
"canvaskit/skwasm_heavy.js": "740d43a6b8240ef9e23eed8c48840da4",
"canvaskit/skwasm.js.symbols": "3a4aadf4e8141f284bd524976b1d6bdc",
"canvaskit/canvaskit.js.symbols": "a3c9f77715b642d0437d9c275caba91e",
"canvaskit/skwasm_heavy.js.symbols": "0755b4fb399918388d71b59ad390b055",
"canvaskit/skwasm.wasm": "7e5f3afdd3b0747a1fd4517cea239898",
"canvaskit/chromium/canvaskit.js.symbols": "e2d09f0e434bc118bf67dae526737d07",
"canvaskit/chromium/canvaskit.js": "a80c765aaa8af8645c9fb1aae53f9abf",
"canvaskit/chromium/canvaskit.wasm": "a726e3f75a84fcdf495a15817c63a35d",
"canvaskit/canvaskit.js": "8331fe38e66b3a898c4f37648aaf7ee2",
"canvaskit/canvaskit.wasm": "9b6a7830bf26959b200594729d73538e",
"canvaskit/skwasm_heavy.wasm": "b0be7910760d205ea4e011458df6ee01"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
