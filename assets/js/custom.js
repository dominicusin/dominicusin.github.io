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
})();
