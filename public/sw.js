/* Service worker for Web Push notifications (iOS PWA compatible).
 * Scope: '/' (served from site root). Handles push + notification clicks +
 * the app-icon unread badge (Web Badging API).
 * Intentionally NO fetch/caching handler so it never interferes with the
 * existing app loading or Supabase realtime. */

/* sw-v4 — every message alerts, unless the chat is actually on screen. */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/* ─────────────────────────────────────────────────────────────────────────
 * Foreground-suppression decision.
 *
 * Show a banner UNLESS the page has told us, in the last few seconds, that
 * the user is actively looking at the chat (visible AND focused).
 *
 * Do NOT trust WindowClient.visibilityState. On iPhone, a home-screen app
 * that is backgrounded — including while music keeps playing — is often still
 * reported as "visible", which used to swallow every notification.
 * Default is SHOW.
 * ───────────────────────────────────────────────────────────────────────── */
var focusedUntil = 0;
var FOCUS_TTL_MS = 4500;

function decideShowNotification(_clientsList) {
  return Date.now() > focusedUntil;
}
self.decideShowNotification = decideShowNotification;

/* ─────────────────────────────────────────────────────────────────────────
 * Unread-count persistence (IndexedDB) for the app-icon badge.
 * The service worker can be killed between pushes, so the running total must
 * live in IndexedDB rather than a module variable.
 * ───────────────────────────────────────────────────────────────────────── */
var BADGE_DB = 'ourchat-badge';
var BADGE_STORE = 'kv';
var BADGE_KEY = 'unread';

function openBadgeDb() {
  return new Promise(function (resolve, reject) {
    try {
      var req = indexedDB.open(BADGE_DB, 1);
      req.onupgradeneeded = function () {
        req.result.createObjectStore(BADGE_STORE);
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    } catch (e) {
      reject(e);
    }
  });
}

function badgeGet() {
  return openBadgeDb().then(function (db) {
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(BADGE_STORE, 'readonly');
        var r = tx.objectStore(BADGE_STORE).get(BADGE_KEY);
        r.onsuccess = function () { resolve(Number(r.result) || 0); };
        r.onerror = function () { resolve(0); };
      } catch (e) { resolve(0); }
    });
  }).catch(function () { return 0; });
}

function badgeSet(value) {
  return openBadgeDb().then(function (db) {
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction(BADGE_STORE, 'readwrite');
        tx.objectStore(BADGE_STORE).put(value, BADGE_KEY);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  }).catch(function () {});
}

function setOsBadge(count) {
  try {
    if (self.navigator && typeof self.navigator.setAppBadge === 'function') {
      return self.navigator.setAppBadge(count);
    }
  } catch (e) { /* ignore */ }
  return Promise.resolve();
}

function clearOsBadge() {
  try {
    if (self.navigator && typeof self.navigator.clearAppBadge === 'function') {
      return self.navigator.clearAppBadge();
    }
  } catch (e) { /* ignore */ }
  return Promise.resolve();
}

async function incrementBadge() {
  var next = (await badgeGet()) + 1;
  await badgeSet(next);
  await setOsBadge(next);
  return next;
}

async function resetBadge() {
  await badgeSet(0);
  await clearOsBadge();
}

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'New message 💗';
  // Unique tag per message so iOS/Android alert EVERY time instead of silently
  // replacing the previous banner (renotify:false + a shared tag did that).
  const tag = data.tag || ('chat-' + Date.now());
  const options = {
    body: data.body || 'You have a new message',
    icon: data.icon || '/icons/icon-192.png',
    badge: data.badge || '/icons/badge-72.png',
    tag: tag,
    renotify: true,
    data: { url: data.url || '/', messageId: data.messageId || tag },
  };

  event.waitUntil(
    (async () => {
      if (!decideShowNotification()) {
        return;
      }

      let count = 0;
      try { count = await incrementBadge(); } catch (e) { /* ignore */ }
      if (count > 0) {
        options.data = Object.assign({}, options.data, { unread: count });
      }
      return self.registration.showNotification(title, options);
    })(),
  );
});

// The app tells us to clear the badge when the user is looking at it again.
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'app-focus') {
    focusedUntil = data.focused ? Date.now() + FOCUS_TTL_MS : 0;
    if (data.focused) event.waitUntil(resetBadge());
    return;
  }
  if (data.type === 'reset-badge') {
    event.waitUntil(resetBadge());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || '/',
    self.location.origin,
  ).href;

  event.waitUntil(
    (async () => {
      // Opening a notification means the user is coming back — clear the badge.
      await resetBadge();
      const list = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of list) {
        // If a window for this app is already open, focus it.
        if ('focus' in client) {
          try {
            if ('navigate' in client) client.navigate(target);
          } catch (e) { /* cross-origin / not allowed — ignore */ }
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })(),
  );
});
