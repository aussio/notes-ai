if (!self.define) {
  let e,
    s = {};
  const t = (t, c) => (
    (t = new URL(t + '.js', c).href),
    s[t] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          (e.src = t), (e.onload = s), document.head.appendChild(e);
        } else (e = t), importScripts(t), s();
      }).then(() => {
        let e = s[t];
        if (!e) throw new Error(`Module ${t} didn’t register its module`);
        return e;
      })
  );
  self.define = (c, a) => {
    const n =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[n]) return;
    let i = {};
    const f = (e) => t(e, n),
      o = { module: { uri: n }, exports: i, require: f };
    s[n] = Promise.all(c.map((e) => o[e] || f(e))).then((e) => (a(...e), i));
  };
}
define(['./workbox-5e5d3432'], function (e) {
  'use strict';
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '9df3f7883e0eb195c87826b97f7955f9',
        },
        {
          url: '/_next/static/AFMcJfbslL5hofeePhGtf/_buildManifest.js',
          revision: 'ea321af9066c48a5bb6f3fa918694f71',
        },
        {
          url: '/_next/static/AFMcJfbslL5hofeePhGtf/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/165-3a7bb538442db43c.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/217.01f4c8c41281e587.js',
          revision: '01f4c8c41281e587',
        },
        {
          url: '/_next/static/chunks/43-2697358f578ad96c.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/433-263b208cd09c1a5b.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/448-4fb08a82dc7a51c6.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/4bd1b696-4ccfd697856185b3.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/595-1bb8bacb10185707.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/684-eef905652271ffc5.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/766-c4381c356a25995e.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/819-6036bab6cd6bdce1.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/951-ee3eff93ec176fd7.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-080474fc2822d1e1.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/auth/callback/page-c0ab072c3c22aae3.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/auth/page-88cca8d71a103edf.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/layout-9a6a64471fecc05d.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/notecards/page-9705112830174b03.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/page-3fc505218f0755e5.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/app/profile/page-034d6986943a9854.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/ccd63cfe-c6f6d8356d6a27ad.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/framework-f593a28cde54158e.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/main-app-a9f896e950a647c8.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/main-e6a36aec5b6f487c.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/pages/_app-b3eb694be5fbf7e0.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/pages/_error-bd129d02791125e2.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-40e601806c3a6ffe.js',
          revision: 'AFMcJfbslL5hofeePhGtf',
        },
        {
          url: '/_next/static/css/59b85480b2bf8867.css',
          revision: '59b85480b2bf8867',
        },
        {
          url: '/_next/static/media/569ce4b8f30dc480-s.p.woff2',
          revision: 'ef6cefb32024deac234e82f932a95cbd',
        },
        {
          url: '/_next/static/media/747892c23ea88013-s.woff2',
          revision: 'a0761690ccf4441ace5cec893b82d4ab',
        },
        {
          url: '/_next/static/media/8d697b304b401681-s.woff2',
          revision: 'cc728f6c0adb04da0dfcb0fc436a8ae5',
        },
        {
          url: '/_next/static/media/93f479601ee12b01-s.p.woff2',
          revision: 'da83d5f06d825c5ae65b7cca706cb312',
        },
        {
          url: '/_next/static/media/9610d9e46709d722-s.woff2',
          revision: '7b7c0ef93df188a852344fc272fc096b',
        },
        {
          url: '/_next/static/media/ba015fad6dcf6784-s.woff2',
          revision: '8ea4f719af3312a055caf09f34c89a77',
        },
        { url: '/favicon.ico', revision: '7a2b20df029f1a0a2baf6e157d500ea9' },
        { url: '/file.svg', revision: 'd09f95206c3fa0bb9bd9fefabfd0ea71' },
        { url: '/globe.svg', revision: '2aaafa6a49b6563925fe440891e32717' },
        { url: '/manifest.json', revision: 'a5552cbf4b890eb80900360871832f81' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/teal-duck.ico', revision: '7a2b20df029f1a0a2baf6e157d500ea9' },
        {
          url: '/teal_duck_logo.png',
          revision: 'ed14f8e6f9f55fecc19e5ff6bc8d9da4',
        },
        { url: '/vercel.svg', revision: 'c0af2f507b369b085b35ef4bbe3bcf1e' },
        { url: '/window.svg', revision: 'a2760511c65806022ad20adf74370ff3' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: t,
              state: c,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.googleapis\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.gstatic\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'gstatic-fonts-cache',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 31536e3 }),
          new e.CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 2592e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      function (e) {
        var s = e.url;
        return self.origin === s.origin && !s.pathname.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'others',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    );
});
