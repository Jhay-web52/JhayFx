"use strict";

// OneSignal push support
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// ── Offline cache ──────────────────────────────────────────
const CACHE_NAME = "jhayfx-v2";
const PRECACHE = [
  "./",
  "./index.html",
  "./signals.html",
  "./submit.html",
  "./styles.css",
  "./script.js",
  "./signals.js",
  "./theme.js",
  "./config.js",
  "./logo.JPG",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  // Skip API/CDN calls — always network for those
  if (
    url.includes("supabase.co") ||
    url.includes("cdn.jsdelivr") ||
    url.includes("api.") ||
    url.includes("onesignal.com") ||
    url.includes("telegram.org") ||
    e.request.method !== "GET"
  ) return;

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
