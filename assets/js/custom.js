/* Neo presentation-layer JS — theme/appearance, settings drawer, a11y.
   Pure presentation control: reads/writes data-theme / data-accent /
   data-fscale / data-reduce-motion on <html>. Content is untouched.
   No external dependencies. */
(function(){
  "use strict";
  var root = document.documentElement;
  function ls(k){ try { return localStorage.getItem(k); } catch(e){ return null; } }
  function ss(k,v){ try { localStorage.setItem(k,v); } catch(e){} }

  // Apply persisted appearance
  var theme = ls('neo-theme') || 'dark';
  var accent = ls('neo-accent') || 'teal';
  var fscale = ls('neo-fscale') || 'normal';
  var motion = ls('neo-motion') || 'on';
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', accent);
  if (fscale !== 'normal') root.setAttribute('data-fscale', fscale);
  if (motion === 'off') root.setAttribute('data-reduce-motion', 'true');

  function markActive(){
    document.querySelectorAll('#neo-theme-grid .neo-theme-opt').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-theme') === root.getAttribute('data-theme'));
    });
    document.querySelectorAll('#neo-accent-grid .neo-accent-opt').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-accent') === root.getAttribute('data-accent'));
    });
    document.querySelectorAll('#neo-fscale button').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-fs') === (root.getAttribute('data-fscale')||'normal'));
    });
    document.querySelectorAll('#neo-motion button').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-motion') === (root.getAttribute('data-reduce-motion')==='true'?'off':'on'));
    });
  }
  markActive();

  // Theme picker
  document.querySelectorAll('#neo-theme-grid .neo-theme-opt').forEach(function(el){
    el.addEventListener('click', function(){
      var t = el.getAttribute('data-theme');
      root.setAttribute('data-theme', t); ss('neo-theme', t); markActive();
    });
  });
  // Accent picker
  document.querySelectorAll('#neo-accent-grid .neo-accent-opt').forEach(function(el){
    el.addEventListener('click', function(){
      var a = el.getAttribute('data-accent');
      root.setAttribute('data-accent', a); ss('neo-accent', a); markActive();
    });
  });
  // Font scale
  document.querySelectorAll('#neo-fscale button').forEach(function(el){
    el.addEventListener('click', function(){
      var f = el.getAttribute('data-fs');
      if (f === 'normal') root.removeAttribute('data-fscale'); else root.setAttribute('data-fscale', f);
      ss('neo-fscale', f); markActive();
    });
  });
  // Motion
  document.querySelectorAll('#neo-motion button').forEach(function(el){
    el.addEventListener('click', function(){
      var m = el.getAttribute('data-motion');
      if (m === 'off') root.setAttribute('data-reduce-motion','true'); else root.removeAttribute('data-reduce-motion');
      ss('neo-motion', m); markActive();
    });
  });

  // Settings drawer toggle
  var btn = document.getElementById('neo-settings-btn');
  var drawer = document.getElementById('neo-drawer');
  if (btn && drawer){
    btn.addEventListener('click', function(e){ e.stopPropagation(); drawer.classList.toggle('open'); });
    document.addEventListener('click', function(e){
      if (!drawer.contains(e.target) && e.target !== btn) drawer.classList.remove('open');
    });
  }

  // Mobile nav toggle
  var burger = document.getElementById('neo-burger');
  var mnav = document.getElementById('neo-mobile-nav');
  if (burger && mnav) {
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = mnav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { mnav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('click', function (e) {
      if (!mnav.contains(e.target) && e.target !== burger) { mnav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Reduced-motion quick toggle (header ✦ button)
  var mqBtn = document.getElementById('neo-motion-quick');
  var mqState = localStorage.getItem('neo-motion-state');
  function mqApply(on) {
    document.documentElement.setAttribute('data-reduce-motion', on ? 'false' : 'true');
    if (mqBtn) mqBtn.style.opacity = on ? '' : '.5';
    localStorage.setItem('neo-motion-state', on ? 'on' : 'off');
  }
  if (mqBtn) {
    if (mqState === 'off') mqApply(false);
    mqBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-reduce-motion') === 'true';
      mqApply(!cur);
    });
  }

  // Quick light/dark toggle
  var tog = document.getElementById('neo-theme-toggle');
  if (tog){
    tog.addEventListener('click', function(){
      var cur = root.getAttribute('data-theme');
      var next = (cur === 'light') ? 'dark' : 'light';
      root.setAttribute('data-theme', next); ss('neo-theme', next); markActive();
    });
  }

  // Search open -> go to /search/ (data-href, if present, must be a safe
  // local path: starts with "/" and contains no scheme/colon — so it can
  // never be a javascript:/data: URL. Validated by regex (CodeQL sanitizer).
  var so = document.getElementById('neo-search-open');
  if (so){
    so.addEventListener('click', function(){
      var dest = so.getAttribute('data-href');
      // Allow only relative local paths like "/search/" or "/x?q=1#h".
      var safe = /^\/(?!\/)[a-zA-Z0-9/._\-]*(\?[a-zA-Z0-9=._\-&%]*)?(#[a-zA-Z0-9=._\-&%]*)?$/.test(dest);
      window.location.href = safe ? dest : '/search/';
    });
  }

  // Back to top
  var b = document.getElementById('neo-backtotop');
  if (b){
    window.addEventListener('scroll', function(){ b.classList.toggle('show', window.scrollY > 600); }, {passive:true});
    b.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  }
})();

/* Global site flourishes: aurora bg, scroll progress, click sparkle.
   Presentation-only. Disabled when reduced-motion is on. */
(function(){
  "use strict";
  try {
    var reduce = document.documentElement.getAttribute('data-reduce-motion') === 'true';
    if (reduce) return;

    // aurora layer
    var aur = document.createElement('div');
    aur.className = 'neo-aurora';
    document.body.appendChild(aur);
    // cute floating sparkle
    var sp = document.createElement('span');
    sp.className = 'neo-spark';
    sp.textContent = '✨';
    document.body.appendChild(sp);

    // floating decorative corner orbs (cute)
    ['a','b','c'].forEach(function(c){
      var o = document.createElement('span');
      o.className = 'neo-orb ' + c;
      document.body.appendChild(o);
    });

    // cursor-follow soft glow
    var cur = document.createElement('span');
    cur.className = 'neo-cursor';
    document.body.appendChild(cur);
    var cx = 0, cy = 0, cfx = 0, cfy = 0, cranim = false;
    window.addEventListener('mousemove', function(e){
      cx = e.clientX; cy = e.clientY;
      if (!cranim){ cranim = true; requestAnimationFrame(cursorLoop); }
    }, {passive:true});
    function cursorLoop(){
      cfx += (cx - cfx) * 0.18; cfy += (cy - cfy) * 0.18;
      cur.style.transform = 'translate(' + cfx + 'px,' + cfy + 'px)';
      if (Math.abs(cx - cfx) > 0.5 || Math.abs(cy - cfy) > 0.5) requestAnimationFrame(cursorLoop);
      else cranim = false;
    }

    // scroll progress bar
    var bar = document.createElement('div');
    bar.className = 'neo-progress';
    document.body.appendChild(bar);
    var ticking = false;
    window.addEventListener('scroll', function(){
      if (ticking) return; ticking = true;
      requestAnimationFrame(function(){
        var h = document.documentElement.scrollHeight - window.innerHeight;
        var p = h > 0 ? (window.scrollY / h) * 100 : 0;
        bar.style.width = p + '%';
        ticking = false;
      });
    }, {passive:true});

    // click sparkle burst (cute)
    var glyphs = ['✦','✧','✨','★','♥'];
    document.addEventListener('click', function(e){
      var n = 5;
      for (var i = 0; i < n; i++){
        var s = document.createElement('span');
        s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
        s.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;z-index:90;pointer-events:none;' +
          'font-size:' + (10 + Math.random() * 10).toFixed(0) + 'px;color:var(--accent);' +
          'text-shadow:0 0 8px color-mix(in srgb,var(--accent) 70%,transparent);' +
          'transition:transform .7s ease-out,opacity .7s ease-out;opacity:1';
        document.body.appendChild(s);
        (function(el){
          requestAnimationFrame(function(){
            var dx = (Math.random() - 0.5) * 80, dy = (Math.random() - 0.5) * 80 - 30;
            el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.4) rotate(' + (Math.random() * 360 | 0) + 'deg)';
            el.style.opacity = '0';
          });
          setTimeout(function(){ el.remove(); }, 750);
        })(s);
      }
    });
  } catch (e) {}

  // ---- Ergonomics 2: relative time, lightbox, command palette, sticky filter, skip-link ----
  try {
    // relative time for [data-time] elements
    document.querySelectorAll('[data-time]').forEach(function (el) {
      var t = new Date(el.getAttribute('data-time')).getTime();
      if (isNaN(t)) return;
      var diff = (Date.now() - t) / 1000, label;
      if (diff < 60) label = 'только что';
      else if (diff < 3600) label = Math.floor(diff / 60) + ' мин назад';
      else if (diff < 86400) label = Math.floor(diff / 3600) + ' ч назад';
      else if (diff < 2592000) label = Math.floor(diff / 86400) + ' дн назад';
      else if (diff < 31536000) label = Math.floor(diff / 2592000) + ' мес назад';
      else label = Math.floor(diff / 31536000) + ' г назад';
      var s = document.createElement('span'); s.className = 'rel-time'; s.textContent = ' · ' + label;
      el.appendChild(s);
    });

    // image lightbox (click any content image to zoom)
    var lb = document.createElement('div');
    lb.className = 'neo-lightbox'; lb.innerHTML = '<img alt=""><div class="lb-cap"></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('.lb-cap');
    document.addEventListener('click', function (e) {
      var img = e.target;
      if (img && img.tagName === 'IMG' && img.closest('.neo-post-body, .neo-prose, .gist-body, .repo-body, .awesome-preview')) {
        lbImg.src = img.currentSrc || img.src;
        lbCap.textContent = img.alt || '';
        lb.classList.add('open');
      }
    });
    lb.addEventListener('click', function () { lb.classList.remove('open'); });

    // sticky filter bar (wrap existing .neo-filter if present)
    document.querySelectorAll('.neo-filter').forEach(function (inp) {
      var bar = document.createElement('div');
      bar.className = 'neo-filter-bar';
      inp.parentNode.insertBefore(bar, inp);
      bar.appendChild(inp);
      var cnt = inp.nextElementSibling;
      if (cnt && cnt.classList.contains('neo-filter-count')) bar.appendChild(cnt);
    });

    // command palette (Ctrl/Cmd+K)
    var palette = document.createElement('div');
    palette.className = 'neo-palette';
    var items = [
      { ico: '⌂', label: 'Главная', href: '/' },
      { ico: '📝', label: 'Блог', href: '/blog/' },
      { ico: '📦', label: 'Репозитории', href: '/repositories/' },
      { ico: '📄', label: 'Гисты', href: '/gists/' },
      { ico: '🕸', label: 'Онтология', href: '/ontology/' },
      { ico: '🔗', label: 'Knowledge Graph', href: '/knowledge-graph/' },
      { ico: '⭐', label: 'Awesome', href: '/awesome/' },
      { ico: '📖', label: 'Wiki', href: '/wiki-build/' },
      { ico: '🗂', label: 'Категории', href: '/categories/' },
      { ico: '🏷', label: 'Теги', href: '/tags/' },
      { ico: '🗺', label: 'Sitemap', href: '/sitemap.xml' },
      { ico: '⌕', label: 'Поиск', href: '/search/' },
      { ico: '🗓', label: 'Архив', href: '/archives/' },
      { ico: '📋', label: 'Копировать ссылку страницы', action: 'copy' },
      { ico: '🎨', label: 'Сменить тему', action: 'theme' },
      { ico: '🎲', label: 'Случайная запись', action: 'random' },
      { ico: '📤', label: 'Поделиться текущей страницей', action: 'share' }
    ];
    var ul = document.createElement('ul');
    items.forEach(function (it, i) {
      var li = document.createElement('li');
      li.dataset.href = it.href; li.dataset.i = i;
      li.innerHTML = '<span class="ico">' + it.ico + '</span><span>' + it.label + '</span><span class="kbd">↵</span>';
      ul.appendChild(li);
    });
    var pInput = document.createElement('input');
    pInput.type = 'text'; pInput.placeholder = 'Перейти к разделу…';
    var box = document.createElement('div');
    box.className = 'neo-palette-box';
    box.appendChild(pInput); box.appendChild(ul);
    var hint = document.createElement('div');
    hint.className = 'hint';
    hint.innerHTML = '<span class="neo-kbd">↑</span> <span class="neo-kbd">↓</span> навигация · <span class="neo-kbd">↵</span> открыть · <span class="neo-kbd">Esc</span> закрыть';
    box.appendChild(hint);
    palette.appendChild(box);
    document.body.appendChild(palette);
    var pActive = 0;
    var visibleIdx = [];
    function filteredItems() {
      var q = (pInput.value || '').toLowerCase();
      visibleIdx = [];
      items.forEach(function (it, i) {
        var ok = !q || it.label.toLowerCase().indexOf(q) !== -1;
        var li = ul.querySelector('li[data-i="' + i + '"]');
        if (li) li.style.display = ok ? '' : 'none';
        if (ok) visibleIdx.push(i);
      });
      return visibleIdx.map(function (i) { return items[i]; });
    }
    function pRender() {
      filteredItems();
      pActive = visibleIdx.length ? visibleIdx[0] : -1;
      ul.querySelectorAll('li').forEach(function (li) { li.classList.remove('active'); });
      if (pActive > -1) { var a = ul.querySelector('li[data-i="' + pActive + '"]'); if (a) a.classList.add('active'); }
    }
    function pOpen() { palette.classList.add('open'); pInput.value = ''; pRender(''); pInput.focus(); }
    function pClose() { palette.classList.remove('open'); }
    pInput.addEventListener('input', function () { pRender(pInput.value); });
    pInput.addEventListener('keydown', function (e) {
      var vis = Array.prototype.filter.call(ul.children, function (li) { return li.style.display !== 'none'; });
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var idx = visibleIdx.indexOf(pActive);
        pActive = visibleIdx[(idx + 1) % visibleIdx.length];
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var idx = visibleIdx.indexOf(pActive);
        pActive = visibleIdx[(idx - 1 + visibleIdx.length) % visibleIdx.length];
      }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var fi = filteredItems();
        var it = fi[pActive];
        if (it && it.action === 'copy') { pClose(); navigator.clipboard && navigator.clipboard.writeText(location.href); announce('Ссылка скопирована в буфер обмена'); }
        else if (it && it.action === 'theme') { pClose(); var root = document.documentElement; var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'; root.setAttribute('data-theme', next); try { localStorage.setItem('neo-theme', next); } catch (err) {} announce('Тема изменена на ' + (next === 'dark' ? 'тёмную' : 'светлую')); }
        else if (it.action === 'random') { pClose(); if (RANDOM_POOL.length) { var pick = RANDOM_POOL[Math.floor(Math.random() * RANDOM_POOL.length)]; location.href = pick.href; } else { announce('Нет записей для случайного выбора'); } }
        else if (it.action === 'share') { pClose(); if (navigator.share) { navigator.share({ title: document.title, url: location.href }).catch(function () {}); } else if (navigator.clipboard) { navigator.clipboard.writeText(location.href); announce('Ссылка скопирована для отправки'); } }
        else if (it) { location.href = it.href; }
      }
      else if (e.key === 'Escape') { e.preventDefault(); pClose(); }
      ul.querySelectorAll('li').forEach(function (li) { li.classList.remove('active'); });
      if (pActive > -1) { var a = ul.querySelector('li[data-i="' + pActive + '"]'); if (a) a.classList.add('active'); }
    });
    ul.addEventListener('click', function (e) {
      var li = e.target.closest('li'); if (!li) return;
      var idx = parseInt(li.dataset.i, 10);
      var it = items[idx];
      if (it && it.action === 'copy') { pClose(); navigator.clipboard && navigator.clipboard.writeText(location.href); announce('Ссылка скопирована'); }
      else if (it && it.action === 'theme') { pClose(); var root = document.documentElement; root.setAttribute('data-theme', root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); announce('Тема изменена'); }
      else if (it) { location.href = it.href; }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pOpen(); }
      else if (e.key === 'Escape' && palette.classList.contains('open')) { pClose(); }
    });
  } catch (e) {}

  // ---- Ergonomics 5: ARIA live region announcements ----
  try {
    var liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)';
    liveRegion.id = 'neo-live';
    document.body.appendChild(liveRegion);
    // random posts pool (blog posts with dates, for random navigation)
    var RANDOM_POOL = [];
    try { RANDOM_POOL = JSON.parse(localStorage.getItem('neo-random-pool') || '[]'); } catch (e) { RANDOM_POOL = []; }
    if (!RANDOM_POOL.length) {
      var links = document.querySelectorAll('a[href*="/20"]');
      links.forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (/\/20\d{2}\//.test(href) && /\/20\d{2}\/\d{2}\/\d{2}\//.test(href)) {
          RANDOM_POOL.push({ href: href, title: a.textContent.trim().slice(0, 60) });
        }
      });
      try { localStorage.setItem('neo-random-pool', JSON.stringify(RANDOM_POOL.slice(0, 50))); } catch (e) {}
    }

    function announce(msg) {
      var r = document.getElementById('neo-live');
      if (r) { r.textContent = ''; setTimeout(function () { r.textContent = msg; }, 50); }
    }
  } catch (e) {}

  // ---- Ergonomics 3: sort controls, keyboard help, auto-theme, recently viewed ----
  try {
    var ls = function (k, v) { try { return v === undefined ? localStorage.getItem(k) : (localStorage.setItem(k, v), v); } catch (e) { return v; } };

    // auto/system theme on first visit
    if (!ls('neo-theme')) {
      var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)');
      if (mq && mq.matches) document.documentElement.setAttribute('data-theme', 'light');
    }

    // sort controls on list grids
    ['repo-grid', 'neo-awesome-grid'].forEach(function (sel) {
      var grid = document.querySelector('.' + sel);
      if (!grid) return;
      var cards = Array.prototype.slice.call(grid.children);
      if (!cards.length) return;
      var bar = document.createElement('div');
      bar.className = 'neo-sort';
      var lbl = document.createElement('span'); lbl.className = 'lbl'; lbl.textContent = 'Сортировка:';
      bar.appendChild(lbl);
      var opts = [
        { k: 'name', t: 'Имя' },
        { k: 'stars', t: '★' },
        { k: 'forks', t: '⑂' }
      ];
      if (cards[0].getAttribute('data-updated') !== null) opts = [{ k: 'name', t: 'Имя' }, { k: 'updated', t: 'Обновл.' }];
      function val(c, k) {
        if (k === 'name') return (c.getAttribute('data-name') || '').toLowerCase();
        if (k === 'updated') return c.getAttribute('data-updated') || '';
        return parseInt(c.getAttribute('data-' + k) || '0', 10);
      }
      function apply(k) {
        var sorted = cards.slice().sort(function (a, b) {
          var va = val(a, k), vb = val(b, k);
          if (k === 'name' || k === 'updated') return va < vb ? -1 : va > vb ? 1 : 0;
          return vb - va;
        });
        sorted.forEach(function (c) { grid.appendChild(c); });
        bar.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k ? 'true' : 'false'); });
        ls('neo-sort-' + sel, k);
      }
      opts.forEach(function (o) {
        var b = document.createElement('button');
        b.dataset.k = o.k; b.type = 'button'; b.innerHTML = o.t;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () { apply(o.k); });
        bar.appendChild(b);
      });
      grid.parentNode.insertBefore(bar, grid);
      var saved = ls('neo-sort-' + sel);
      if (saved) apply(saved); else { bar.querySelector('button[data-k="name"]').setAttribute('aria-pressed', 'true'); }
    });

    // keyboard help overlay (press ?)
    var help = document.createElement('div');
    help.className = 'neo-help';
    help.innerHTML = '<div class="neo-help-box"><h3>⌨ Горячие клавиши</h3>' +
      '<div class="neo-help-grid">' +
      '<span class="k"><span class="neo-kbd">/</span></span><span>Открыть поиск</span>' +
      '<span class="k"><span class="neo-kbd">?</span></span><span>Эта справка</span>' +
      '<span class="k"><span class="neo-kbd">Ctrl</span>+<span class="neo-kbd">K</span></span><span>Палитра разделов</span>' +
      '<span class="k"><span class="neo-kbd">t</span></span><span>Сменить тему</span>' +
      '<span class="k"><span class="neo-kbd">b</span></span><span>Наверх</span>' +
      '<span class="k"><span class="neo-kbd">Esc</span></span><span>Закрыть оверлеи</span>' +
      '</div><div class="hint">Нажмите <span class="neo-kbd">Esc</span> или кликните вне окна, чтобы закрыть.</div></div>';
    document.body.appendChild(help);
    function helpOpen() { help.classList.add('open'); }
    function helpClose() { help.classList.remove('open'); }
    help.addEventListener('click', function (e) { if (e.target === help) helpClose(); });
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
      if (e.key === '?') { e.preventDefault(); helpOpen(); }
      else if (e.key === 'Escape' && help.classList.contains('open')) helpClose();
    });

    // recently viewed — track detail pages, render a strip on the homepage
    var path = location.pathname.replace(/\/+$/, '') || '/';
    var isDetail = /\/(repositories|gists|awesome)\//.test(path);
    if (isDetail) {
      var title = (document.querySelector('h1') || {}).textContent || document.title;
      var rec = JSON.parse(ls('neo-recent') || '[]');
      rec = rec.filter(function (r) { return r.href !== path; });
      rec.unshift({ href: path, title: title.slice(0, 48) });
      ls('neo-recent', JSON.stringify(rec.slice(0, 8)));
    }
    if (path === '/' || path === '') {
      var recent = JSON.parse(ls('neo-recent') || '[]');
      if (recent.length) {
        var wrap = document.querySelector('.neo-wrap') || document.querySelector('main');
        if (wrap) {
          var strip = document.createElement('div');
          strip.className = 'neo-recent';
          var head = document.createElement('div');
          head.className = 'neo-sec-head'; head.style.marginTop = '8px';
          head.innerHTML = '<h2>Недавно открытое</h2>';
          strip.appendChild(head);
          recent.forEach(function (r) {
            var a = document.createElement('a'); a.href = r.href; a.textContent = r.title || r.href;
            strip.appendChild(a);
          });
          wrap.insertBefore(strip, wrap.firstChild.nextSibling || wrap.firstChild);
        }
      }
    }
  } catch (e) {}

  // ---- Ergonomics 4: reading progress + vim-style navigation ----
  try {
    var reduce = document.documentElement.getAttribute('data-reduce-motion') === 'true';

    // per-article reading progress
    var article = document.querySelector('.neo-post-body, .gist-body, .repo-body, .awesome-preview');
    if (article) {
      var rbar = document.createElement('div');
      rbar.className = 'neo-readbar';
      document.body.appendChild(rbar);
      var ticking = false;
      function updRead() {
        var rect = article.getBoundingClientRect();
        var total = rect.height - window.innerHeight;
        var passed = -rect.top;
        var p = total > 0 ? Math.min(100, Math.max(0, (passed / total) * 100)) : 0;
        rbar.style.width = p + '%';
        ticking = false;
      }
      window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(updRead); } }, { passive: true });
      window.addEventListener('resize', updRead);
      updRead();
    }

    // vim-style navigation: g h (home), g b (blog), n / p (prev/next post)
    var gPending = false, gTimer = null;
    var navPrev = document.body.getAttribute('data-prev');
    var navNext = document.body.getAttribute('data-next');
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
      if (gPending) {
        gPending = false; clearTimeout(gTimer);
        if (e.key === 'h') location.href = '/';
        else if (e.key === 'b') location.href = '/blog/';
        return;
      }
      if (e.key === 'g') { gPending = true; gTimer = setTimeout(function () { gPending = false; }, 800); return; }
      if ((e.key === 'n' || e.key === 'N') && navNext) { e.preventDefault(); location.href = navNext; }
      else if ((e.key === 'p' || e.key === 'P') && navPrev) { e.preventDefault(); location.href = navPrev; }
    });
  } catch (e) {}

  // ---- Wave 8: local analytics (page views) + most-visited strip ----
  try {
    var ANALYTICS_STORE = "neo-analytics";
    try { var analytics = JSON.parse(localStorage.getItem(ANALYTICS_STORE) || "{}"); } catch (e) { var analytics = {}; }

    // Track current page view
    var path = location.pathname.replace(/\/+$/, '/') || '/';
    var today = new Date().toISOString().slice(0, 10);
    if (!analytics[path]) analytics[path] = { views: 0, title: document.title, lastViewed: 0, daily: {} };
    analytics[path].views++;
    analytics[path].title = document.title;
    analytics[path].lastViewed = Date.now();
    analytics[path].daily[today] = (analytics[path].daily[today] || 0) + 1;
    // Keep only last 50 paths
    var paths = Object.keys(analytics).sort(function (a, b) { return analytics[b].views - analytics[a].views; });
    if (paths.length > 50) {
      paths.slice(50).forEach(function (k) { delete analytics[k]; });
    }
    try { localStorage.setItem(ANALYTICS_STORE, JSON.stringify(analytics)); } catch (e) {}

    // Render most-visited strip on homepage
    if (path === '/' || path === '') {
      var sorted = Object.keys(analytics).sort(function (a, b) { return analytics[b].views - analytics[a].views; }).slice(0, 8);
      if (sorted.length) {
        var wrap = document.querySelector('.neo-wrap') || document.querySelector('main');
        if (wrap) {
          var strip = document.createElement('div');
          strip.className = 'neo-recent';
          var head = document.createElement('div');
          head.className = 'neo-sec-head'; head.style.marginTop = '8px';
          head.innerHTML = '<h2>Часто посещаемое</h2>';
          strip.appendChild(head);
          sorted.forEach(function (p) {
            var a = document.createElement('a');
            a.href = p;
            a.textContent = analytics[p].title || p;
            strip.appendChild(a);
          });
          wrap.insertBefore(strip, wrap.firstChild.nextSibling || wrap.firstChild);
        }
      }
    }
  } catch (e) {}

  // ---- A11y: focus management for modals ----
  try {
    function trapFocus(modal) {
      var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
        else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
      });
    }
    ['neo-palette', 'neo-help', 'neo-lightbox'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) trapFocus(el);
    });
  } catch (e) {}

  // ---- Wave 9: Analytics Dashboard + Service Worker ----
  try {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/sw.js').catch(function () {});
      });
    }

    // PWA install button
    var pwaBtn = null;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      pwaBtn = document.getElementById('neo-pwa-install');
      if (pwaBtn) pwaBtn.classList.add('show');
      pwaBtn.addEventListener('click', function () { e.prompt(); });
    });

    // Analytics dashboard page
    var dashEl = document.getElementById('neo-analytics-dashboard');

    // Favorites summary on analytics page
    var favSumEl = document.getElementById('neo-fav-summary');
    if (dashEl) {
      try {
        var data = JSON.parse(localStorage.getItem('neo-analytics') || '{}');
        var entries = Object.keys(data).map(function (k) { return Object.assign({ path: k }, data[k]); })
          .sort(function (a, b) { return b.views - a.views; }).slice(0, 20);
        var totalViews = entries.reduce(function (s, e) { return s + (e.views || 0); }, 0);
        var maxViews = entries.length ? entries[0].views : 1;

        var html = '<div class="neo-sec-head"><h2>Аналитика просмотров</h2>';
        html += '<span class="more">' + totalViews + ' просмотров · ' + entries.length + ' страниц</span></div>';
        html += '<div class="neo-analytics">';
        entries.forEach(function (e) {
          var pct = Math.round((e.views / maxViews) * 100);
          html += '<div class="neo-analytic-row">';
          html += '<span class="neo-analytic-path" title="' + e.path + '">' + (e.title || e.path) + '</span>';
          html += '<div class="neo-analytic-bar"><div style="width:' + pct + '%"></div></div>';
          html += '<span class="neo-analytic-count">' + e.views + '</span>';
          html += '</div>';
        });
        html += '</div>';
        dashEl.innerHTML = html;
      } catch (e) {}
    }
  } catch (e) {}

  // ---- Palette: add favorites shortcut ----
  try {
    var favBtn = document.querySelector('#neo-fav-toggle');
    if (favBtn) {
      favBtn.addEventListener('click', function () {
        var mnav = document.getElementById('neo-mobile-nav');
        if (mnav) { mnav.classList.remove('open'); }
        location.href = '/favorites/';
      });
    }
  } catch (e) {}

  // ---- Wave 12: Search history + fuzzy match + analytics time chart + daily tracking ----
  try {
    // Daily tracking for analytics
    var ANALYTICS_STORE = "neo-analytics";
    try { var analytics = JSON.parse(localStorage.getItem(ANALYTICS_STORE) || "{}"); } catch (e) { var analytics = {}; }
    var path = location.pathname.replace(/\/+$/, '/') || '/';
    var today = new Date().toISOString().slice(0, 10);
    if (!analytics[path]) analytics[path] = { views: 0, title: document.title, lastViewed: 0, daily: {} };
    analytics[path].views++;
    analytics[path].title = document.title;
    analytics[path].lastViewed = Date.now();
    analytics[path].daily[today] = (analytics[path].daily[today] || 0) + 1;
    var paths = Object.keys(analytics).sort(function (a, b) { return analytics[b].views - analytics[a].views; });
    if (paths.length > 50) paths.slice(50).forEach(function (k) { delete analytics[k]; });
    try { localStorage.setItem(ANALYTICS_STORE, JSON.stringify(analytics)); } catch (e) {}

    // Search history + fuzzy match
    var searchHistory = JSON.parse(localStorage.getItem('neo-search-history') || '[]');
    var searchInput = document.getElementById('neo-search-input');
    if (searchInput) {
      var historyBar = document.createElement('div');
      historyBar.className = 'neo-search-history';
      searchInput.parentNode.insertBefore(historyBar, searchInput.nextSibling);

      function renderHistory() {
        historyBar.innerHTML = '';
        searchHistory.slice(-6).reverse().forEach(function (term) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = term;
          btn.addEventListener('click', function () {
            searchInput.value = term;
            searchInput.dispatchEvent(new Event('input'));
          });
          historyBar.appendChild(btn);
        });
      }

      function saveHistory(q) {
        if (!q || q.length < 2) return;
        searchHistory.push(q);
        if (searchHistory.length > 20) searchHistory.shift();
        localStorage.setItem('neo-search-history', JSON.stringify(searchHistory));
        renderHistory();
      }

      function fuzzyMatch(str, pattern) {
        str = str.toLowerCase();
        pattern = pattern.toLowerCase();
        var si = 0, pi = 0;
        while (si < str.length && pi < pattern.length) {
          if (str[si] === pattern[pi]) pi++;
          si++;
        }
        return pi === pattern.length;
      }

      renderHistory();
      var debounceTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () { saveHistory(searchInput.value.trim()); }, 1500);
      });

      // Render search stats
      var statsSection = document.getElementById('neo-search-stats');
      var popularEl = document.getElementById('neo-search-popular');
      if (statsSection && popularEl) {
        var stats = JSON.parse(localStorage.getItem('neo-search-history') || '[]');
        if (stats.length) {
          statsSection.style.display = 'block';
          var counts = {};
          stats.forEach(function (q) { counts[q] = (counts[q] || 0) + 1; });
          var sorted = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 8);
          popularEl.className = 'neo-search-stats-grid';
          sorted.forEach(function (q) {
            var span = document.createElement('span');
            span.className = 'neo-search-stat';
            span.textContent = q + ' (' + counts[q] + ')';
            popularEl.appendChild(span);
          });
        }
      }

      // Enhance search render with fuzzy match + highlight
      var originalRender = window.renderSearch;
      window.renderSearch = function (q) {
        if (!q) return;
        q = q.toLowerCase().trim();
        var kindbar = document.getElementById('neo-kind-filter');
        var curKind = kindbar ? (kindbar.querySelector('[aria-pressed="true"]') || {}).dataset || 'all' : 'all';
        var hits = INDEX.filter(function (i) {
          if (curKind !== 'all' && i.k !== curKind) return false;
          return i.t.toLowerCase().indexOf(q) > -1 || (i.g || '').toLowerCase().indexOf(q) > -1 || (i.s || '').toLowerCase().indexOf(q) > -1 || fuzzyMatch(i.t, q);
        }).slice(0, 40);
        var res = document.getElementById('neo-search-results');
        var empty = document.getElementById('neo-search-empty');
        if (!hits.length) {
          empty.style.display = 'block';
          empty.textContent = 'Ничего не найдено по запросу «' + q + '».';
          return;
        }
        empty.style.display = 'none';
        res.innerHTML = '';
        hits.forEach(function (h) {
          var a = document.createElement('a');
          a.className = 'neo-row';
          a.href = h.u;
          var date = document.createElement('span');
          date.className = 'date';
          date.textContent = KIND[h.k] || '•';
          var title = document.createElement('span');
          title.className = 'title';
          title.textContent = h.t;
          a.appendChild(date);
          a.appendChild(title);
          if (h.g) {
            var tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = (h.g || '').split(' ')[0];
            a.appendChild(tag);
          }
          res.appendChild(a);
        });
      };
    }

    // Time chart
    var timeSection = document.getElementById('neo-time-chart-section');
    if (timeSection) {
      var days = [];
      for (var i = 6; i >= 0; i--) {
        var d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }
      var dailyTotals = days.map(function (day) {
        var total = 0;
        Object.keys(analytics).forEach(function (p) {
          if (analytics[p].day) total += analytics[p].daily[day] || 0;
        });
        return { day: day.slice(5), views: total };
      });
      var maxDaily = Math.max.apply(null, dailyTotals.map(function (d) { return d.views; })) || 1;
      var html = '<div class="neo-sec-head"><h2>Просмотры за неделю</h2></div>';
      html += '<div class="neo-time-chart">';
      dailyTotals.forEach(function (d) {
        var h = Math.max(4, Math.round((d.views / maxDaily) * 100));
        html += '<div class="neo-time-bar" style="height:' + h + 'px" title="' + d.day + ': ' + d.views + ' просмотров"></div>';
      });
      html += '</div><div class="neo-time-labels">';
      dailyTotals.forEach(function (d) { html += '<span>' + d.day + '</span>'; });
      html += '</div>';
      timeSection.innerHTML = html;
    }
  } catch (e) {}

  // ---- Wave 18: Reading experience — font scale + print ----
  try {
    var fontScale = localStorage.getItem('neo-font-scale') || 'normal';
    function applyFontScale(scale) {
      var sizes = { small: '14px', normal: '16px', large: '18px', xlarge: '20px' };
      document.documentElement.style.fontSize = sizes[scale] || sizes.normal;
      localStorage.setItem('neo-font-scale', scale);
    }
    applyFontScale(fontScale);

    var fontBtn = document.getElementById('neo-font-toggle');
    if (fontBtn) {
      fontBtn.addEventListener('click', function () {
        var scales = ['small', 'normal', 'large', 'xlarge'];
        var idx = scales.indexOf(fontScale);
        fontScale = scales[(idx + 1) % scales.length];
        applyFontScale(fontScale);
        announce('Размер шрифта: ' + fontScale);
      });
    }

    var printBtn = document.getElementById('neo-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', function () { window.print(); });
    }
  } catch (e) {}

})();



