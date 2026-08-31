/**
 * @fileoverview Neo Store — pure functions for unit testing.
 * Extracted from neo-store.html for testability.
 */

// Schema defaults
export const SCHEMA_VERSION = 1;

export const SCHEMA = {
  version: SCHEMA_VERSION,
  theme: "dark",
  motion: "on",
  fontScale: "normal",
  favorites: {},
  favMeta: {},
  analytics: {},
  searchHistory: [],
  randomPool: [],
  recentlyViewed: []
};

// Pure functions (no localStorage)

export function createStore(overrides = {}) {
  return { ...SCHEMA, ...overrides };
}

export function toggleFav(store, key, meta = {}) {
  const next = { ...store };
  if (store.favorites[key]) {
    next.favorites = { ...store.favorites };
    delete next.favorites[key];
    next.favMeta = { ...store.favMeta };
    delete next.favMeta[key];
  } else {
    next.favorites = { ...store.favorites, [key]: true };
    next.favMeta = { ...store.favMeta, [key]: meta };
  }
  return next;
}

export function isFav(store, key) {
  return !!store.favorites[key];
}

export function trackView(store, path, title) {
  const next = { ...store };
  const prev = store.analytics[path] || { views: 0, title: title, lastViewed: 0, daily: {} };
  const today = new Date().toISOString().slice(0, 10);
  const daily = { ...(prev.daily || {}) };
  daily[today] = (daily[today] || 0) + 1;

  next.analytics = {
    ...store.analytics,
    [path]: {
      views: prev.views + 1,
      title: title || prev.title,
      lastViewed: Date.now(),
      daily
    }
  };

  // Keep only top 50 by views
  const paths = Object.keys(next.analytics)
    .sort((a, b) => next.analytics[b].views - next.analytics[a].views)
    .slice(0, 50);
  const trimmed = {};
  paths.forEach(p => { trimmed[p] = next.analytics[p]; });
  next.analytics = trimmed;

  return next;
}

export function addSearch(store, query) {
  if (!query || query.length < 2) return store;
  const next = { ...store };
  next.searchHistory = [...store.searchHistory, query].slice(-20);
  return next;
}

export function addRecent(store, item) {
  const next = { ...store };
  const filtered = store.recentlyViewed.filter(r => r.href !== item.href);
  next.recentlyViewed = [item, ...filtered].slice(0, 8);
  return next;
}

export function setRandomPool(store, pool) {
  return { ...store, randomPool: pool.slice(0, 50) };
}

export function getFavs(store) {
  return Object.keys(store.favorites).map(k => ({ key: k, ...(store.favMeta[k] || {}) }));
}

// Pure: get retention data
export function getRetention(store, days = 14) {
  const dayMap = {};
  Object.values(store.analytics).forEach(a => {
    if (a.daily) {
      Object.entries(a.daily).forEach(([day, count]) => {
        dayMap[day] = (dayMap[day] || 0) + count;
      });
    }
  });
  const sorted = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days);
  return sorted.map(([day, count]) => ({ day, count }));
}

// Pure: get top pages
export function getTopPages(store, limit = 10) {
  return Object.entries(store.analytics)
    .map(([path, data]) => ({ path, ...data }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// Pure: fuzzy match (subsequence)
export function fuzzyMatch(str, pattern) {
  const s = str.toLowerCase();
  const p = pattern.toLowerCase();
  let si = 0, pi = 0;
  while (si < s.length && pi < p.length) {
    if (s[si] === p[pi]) pi++;
    si++;
  }
  return pi === p.length;
}

// Pure: escape regex
export function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Pure: highlight matches
export function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(re, '<mark class="search-highlight">$1</mark>');
}

// Pure: search index scoring
export function searchScore(item, query) {
  const q = query.toLowerCase();
  let score = 0;
  if (item.t?.toLowerCase().includes(q)) score += 10;
  if (item.g?.toLowerCase().includes(q)) score += 5;
  if (item.s?.toLowerCase().includes(q)) score += 3;
  if (fuzzyMatch(item.t || '', q)) score += 2;
  return score;
}

export function searchItems(index, query, kind = 'all') {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return index
    .filter(i => kind === 'all' || i.k === kind)
    .map(i => ({ ...i, score: searchScore(i, q) }))
    .filter(i => i.score > 0)
    .sort((a, b) => b.score - a.score);
}
