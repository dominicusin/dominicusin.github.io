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

  // Search open -> go to /search/ (data-href, if present, must be a
  // same-origin path or http(s) URL; reject javascript:/data: schemes).
  var so = document.getElementById('neo-search-open');
  if (so){
    so.addEventListener('click', function(){
      var dest = so.getAttribute('data-href') || '/search/';
      try {
        var u = new URL(dest, window.location.href);
        var ok = u.origin === window.location.origin && /^https?:$/.test(u.protocol);
        window.location.href = ok ? u.pathname + u.search + u.hash : '/search/';
      } catch (e) {
        window.location.href = '/search/';
      }
    });
  }

  // Back to top
  var b = document.getElementById('neo-backtotop');
  if (b){
    window.addEventListener('scroll', function(){ b.classList.toggle('show', window.scrollY > 600); }, {passive:true});
    b.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
  }
})();
