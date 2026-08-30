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
      { ico: '🗓', label: 'Архив', href: '/archives/' }
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
    function pRender(q) {
      q = (q || '').toLowerCase();
      var vis = 0, first = -1;
      ul.querySelectorAll('li').forEach(function (li, idx) {
        var ok = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
        li.style.display = ok ? '' : 'none';
        if (ok) { vis++; if (first === -1) first = idx; }
      });
      pActive = first;
      ul.querySelectorAll('li').forEach(function (li) { li.classList.remove('active'); });
      if (pActive > -1) ul.querySelector('li[data-i="' + pActive + '"]').classList.add('active');
    }
    function pOpen() { palette.classList.add('open'); pInput.value = ''; pRender(''); pInput.focus(); }
    function pClose() { palette.classList.remove('open'); }
    pInput.addEventListener('input', function () { pRender(pInput.value); });
    pInput.addEventListener('keydown', function (e) {
      var vis = Array.prototype.filter.call(ul.children, function (li) { return li.style.display !== 'none'; });
      if (e.key === 'ArrowDown') { e.preventDefault(); pActive = (pActive + 1) % items.length; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); pActive = (pActive - 1 + items.length) % items.length; }
      else if (e.key === 'Enter') { e.preventDefault(); var li = ul.querySelector('li[data-i="' + pActive + '"]'); if (li) location.href = li.dataset.href; }
      else if (e.key === 'Escape') { e.preventDefault(); pClose(); }
      ul.querySelectorAll('li').forEach(function (li) { li.classList.remove('active'); });
      if (pActive > -1) { var a = ul.querySelector('li[data-i="' + pActive + '"]'); if (a) a.classList.add('active'); }
    });
    ul.addEventListener('click', function (e) {
      var li = e.target.closest('li'); if (li) { location.href = li.dataset.href; }
    });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); pOpen(); }
      else if (e.key === 'Escape' && palette.classList.contains('open')) { pClose(); }
    });
  } catch (e) {}
})();

