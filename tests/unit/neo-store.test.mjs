/**
 * @fileoverview Unit tests for neo-store pure functions.
 */

import { describe, it, expect } from 'vitest';
import {
  SCHEMA,
  createStore,
  toggleFav,
  isFav,
  trackView,
  addSearch,
  addRecent,
  setRandomPool,
  getFavs,
  getRetention,
  getTopPages,
  fuzzyMatch,
  escapeRegex,
  highlight,
  searchScore,
  searchItems
} from '../../assets/js/neo-store.mjs';

describe('createStore', () => {
  it('returns default schema', () => {
    const store = createStore();
    expect(store.theme).toBe('dark');
    expect(store.favorites).toEqual({});
    expect(store.analytics).toEqual({});
  });

  it('merges overrides', () => {
    const store = createStore({ theme: 'light' });
    expect(store.theme).toBe('light');
  });
});

describe('toggleFav', () => {
  it('adds favorite', () => {
    const store = toggleFav(createStore(), '/post/1', { title: 'Post 1', type: 'post' });
    expect(store.favorites['/post/1']).toBe(true);
    expect(store.favMeta['/post/1']).toEqual({ title: 'Post 1', type: 'post' });
  });

  it('removes favorite', () => {
    let store = toggleFav(createStore(), '/post/1', { title: 'Post 1' });
    store = toggleFav(store, '/post/1');
    expect(store.favorites['/post/1']).toBeUndefined();
  });

  it('does not mutate original', () => {
    const original = createStore();
    toggleFav(original, '/post/1');
    expect(original.favorites).toEqual({});
  });
});

describe('isFav', () => {
  it('returns false for unfavorited', () => {
    expect(isFav(createStore(), '/post/1')).toBe(false);
  });

  it('returns true for favorited', () => {
    const store = toggleFav(createStore(), '/post/1');
    expect(isFav(store, '/post/1')).toBe(true);
  });
});

describe('trackView', () => {
  it('tracks first view', () => {
    const store = trackView(createStore(), '/post/1', 'Post 1');
    expect(store.analytics['/post/1'].views).toBe(1);
    expect(store.analytics['/post/1'].title).toBe('Post 1');
  });

  it('increments views', () => {
    let store = trackView(createStore(), '/post/1', 'Post 1');
    store = trackView(store, '/post/1', 'Post 1');
    expect(store.analytics['/post/1'].views).toBe(2);
  });

  it('tracks daily views', () => {
    const store = trackView(createStore(), '/post/1', 'Post 1');
    const today = new Date().toISOString().slice(0, 10);
    expect(store.analytics['/post/1'].daily[today]).toBe(1);
  });

  it('keeps top 50 pages', () => {
    let store = createStore();
    for (let i = 0; i < 60; i++) {
      store = trackView(store, `/post/${i}`, `Post ${i}`);
    }
    expect(Object.keys(store.analytics).length).toBe(50);
  });
});

describe('addSearch', () => {
  it('adds search query', () => {
    const store = addSearch(createStore(), 'test query');
    expect(store.searchHistory).toContain('test query');
  });

  it('ignores short queries', () => {
    const store = addSearch(createStore(), 'a');
    expect(store.searchHistory).toEqual([]);
  });

  it('keeps last 20', () => {
    let store = createStore();
    for (let i = 0; i < 25; i++) {
      store = addSearch(store, `query ${i}`);
    }
    expect(store.searchHistory.length).toBe(20);
    expect(store.searchHistory[0]).toBe('query 5');
  });
});

describe('addRecent', () => {
  it('adds to front', () => {
    let store = addRecent(createStore(), { href: '/post/1', title: 'Post 1' });
    expect(store.recentlyViewed[0].href).toBe('/post/1');
  });

  it('removes duplicates', () => {
    let store = addRecent(createStore(), { href: '/post/1', title: 'Post 1' });
    store = addRecent(store, { href: '/post/1', title: 'Updated' });
    expect(store.recentlyViewed.length).toBe(1);
  });

  it('keeps max 8', () => {
    let store = createStore();
    for (let i = 0; i < 10; i++) {
      store = addRecent(store, { href: `/post/${i}`, title: `Post ${i}` });
    }
    expect(store.recentlyViewed.length).toBe(8);
  });
});

describe('getFavs', () => {
  it('returns favorites list', () => {
    let store = toggleFav(createStore(), '/post/1', { title: 'Post 1', type: 'post' });
    store = toggleFav(store, '/post/2', { title: 'Post 2', type: 'post' });
    const favs = getFavs(store);
    expect(favs.length).toBe(2);
    expect(favs[0].key).toBe('/post/1');
  });
});

describe('getRetention', () => {
  it('aggregates daily views', () => {
    let store = trackView(createStore(), '/post/1', 'Post 1');
    const retention = getRetention(store, 14);
    expect(retention.length).toBe(1);
    expect(retention[0].count).toBe(1);
  });

  it('limits to days', () => {
    let store = createStore();
    store = trackView(store, '/post/1', 'Post 1');
    const retention = getRetention(store, 7);
    expect(retention.length).toBeLessThanOrEqual(7);
  });
});

describe('getTopPages', () => {
  it('returns pages sorted by views', () => {
    let store = createStore();
    store = trackView(store, '/post/1', 'Post 1');
    store = trackView(store, '/post/2', 'Post 2');
    store = trackView(store, '/post/2', 'Post 2');
    const top = getTopPages(store, 10);
    expect(top[0].path).toBe('/post/2');
    expect(top[0].views).toBe(2);
  });
});

describe('fuzzyMatch', () => {
  it('matches subsequence', () => {
    expect(fuzzyMatch('Hello World', 'hw')).toBe(true);
    expect(fuzzyMatch('Hello World', 'hlo')).toBe(true);
  });

  it('rejects non-matching', () => {
    expect(fuzzyMatch('Hello World', 'xyz')).toBe(false);
  });

  it('handles empty pattern', () => {
    expect(fuzzyMatch('Hello', '')).toBe(true);
  });
});

describe('escapeRegex', () => {
  it('escapes special chars', () => {
    expect(escapeRegex('.*+?^${}()|[]\\')).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });
});

describe('highlight', () => {
  it('wraps matches in mark', () => {
    expect(highlight('Hello World', 'World')).toBe('Hello <mark class="search-highlight">World</mark>');
  });

  it('returns original if no query', () => {
    expect(highlight('Hello', '')).toBe('Hello');
  });

  it('case insensitive', () => {
    expect(highlight('Hello World', 'hello')).toBe('<mark class="search-highlight">Hello</mark> World');
  });
});

describe('searchScore', () => {
  it('scores title match highest', () => {
    const item = { t: 'Hello World', g: '', s: '' };
    expect(searchScore(item, 'hello')).toBe(12); // 10 (title) + 2 (fuzzy)
  });

  it('scores tag match', () => {
    const item = { t: 'Post', g: 'hello tag', s: '' };
    expect(searchScore(item, 'hello')).toBe(5);
  });

  it('scores fuzzy match', () => {
    const item = { t: 'Hello World', g: '', s: '' };
    expect(searchScore(item, 'hw')).toBe(2);
  });
});

describe('searchItems', () => {
  const index = [
    { t: 'Hello World', k: 'post', g: 'greeting', s: 'A greeting' },
    { t: 'Goodbye World', k: 'post', g: 'farewell', s: 'A farewell' },
    { t: 'Code Example', k: 'repo', g: 'code', s: 'Example code' }
  ];

  it('returns matching items', () => {
    const results = searchItems(index, 'hello');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].t).toBe('Hello World');
  });

  it('filters by kind', () => {
    const results = searchItems(index, 'world', 'repo');
    expect(results.length).toBe(0);
  });

  it('returns empty for empty query', () => {
    expect(searchItems(index, '')).toEqual([]);
  });

  it('sorts by score', () => {
    const results = searchItems(index, 'world');
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
  });
});
